'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { ALLOWED_UPLOAD_EXTS, ALLOWED_UPLOAD_MIMES, MAX_UPLOAD_BYTES } from '@/lib/constants';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useUrlState } from '@/hooks/useUrlState';
import { useDeleteEntity } from '@/hooks/useEntityMutations';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import {
  BuildingPicker,
  LeasePicker,
  MaintenancePicker,
  PaymentPicker,
  PropertyPicker,
  ResidentPicker,
  UnitPicker,
} from '@/components/common/EntityPicker/pickers';
import { formatBytes, formatDateOnly } from '@/lib/format';
import type { Document } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';

const CATEGORIES = ['LEASE', 'IDENTITY', 'UTILITY', 'INSPECTION', 'FINANCIAL', 'OTHER'];

function precheck(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return 'File exceeds 5MB.';
  const okMime = (ALLOWED_UPLOAD_MIMES as readonly string[]).includes(file.type);
  const okExt = ALLOWED_UPLOAD_EXTS.some((e) => file.name.toLowerCase().endsWith(e));
  if (!okMime && !okExt) return 'File type not allowed (pdf/jpg/png/webp/doc/xls/txt/csv).';
  return null;
}

export default function DocumentsPage(): React.JSX.Element {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = can('document:create');
  const canUpdate = can('document:update');
  const canDelete = can('document:delete');

  const [category, setCategory] = useUrlState('category');
  const extra = useMemo(() => ({ ...(category ? { category } : {}) }), [category]);
  const list = usePaginatedList<Document>('documents', '/documents', extra);

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState('lease');
  const [entityId, setEntityId] = useState('');
  const [linkPropertyId, setLinkPropertyId] = useState<string | null>(null);
  const setTypeAndReset = (t: string) => {
    setEntityType(t);
    setEntityId('');
    setLinkPropertyId(null);
  };
  const [docCategory, setDocCategory] = useState('OTHER');
  const [name, setName] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Document | null>(null);

  const remove = useDeleteEntity((id) => `/documents/${id}`, [['documents']]);

  const [editing, setEditing] = useState<Document | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('OTHER');
  const [replacement, setReplacement] = useState<File | null>(null);

  const saveDoc = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error('No document selected.');
      if (replacement) {
        const err = precheck(replacement);
        if (err) throw new Error(err);
        const fd = new FormData();
        fd.append('file', replacement);
        await apiClient.post(`/documents/${editing.id}/file`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return (
        await apiClient.patch(`/documents/${editing.id}`, {
          name: editName.trim(),
          category: editCategory,
        })
      ).data;
    },
    onSuccess: () => {
      toast.success('Updated successfully.');
      setEditing(null);
      setReplacement(null);
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (e) => toast.error(getApiMessage(e, e instanceof Error ? e.message : 'Update failed.')),
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose a file first.');
      const err = precheck(file);
      if (err) throw new Error(err);
      if (!entityId) throw new Error('Choose the linked record first.');
      const fd = new FormData();
      fd.append('file', file);
      // Backend entity vocabulary uses maintenance_request (underscore).
      fd.append('entityType', entityType === 'maintenance' ? 'maintenance_request' : entityType);
      fd.append('entityId', entityId);
      if (name) fd.append('name', name);
      if (docCategory) fd.append('category', docCategory);
      const res = await apiClient.post('/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Created successfully.');
      setOpen(false);
      setFile(null);
      setEntityId('');
      setName('');
      setProgress(null);
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (e) => {
      setProgress(null);
      toast.error(getApiMessage(e, e instanceof Error ? e.message : 'Upload failed.'));
    },
  });

  const columns = useMemo<ColumnDef<Document>[]>(() => [
    { header: 'Name', accessorKey: 'name', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { header: 'Entity', accessorKey: 'entityType', cell: ({ row }) => <span className="font-mono text-xs">{row.original.entityType ?? '—'} · {(row.original.entityId ?? '').slice(0, 8)}</span> },
    { header: 'Category', accessorKey: 'category', cell: ({ row }) => row.original.category ?? '—' },
    { header: 'Size', accessorKey: 'size', cell: ({ row }) => formatBytes(row.original.size) },
    { header: 'Uploaded', accessorKey: 'createdAt', cell: ({ row }) => formatDateOnly(row.original.createdAt) },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div className="flex gap-1">
            {d.url ? (
              <Button variant="ghost" size="icon" aria-label={`Download ${d.name}`} asChild>
                <a href={d.url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            ) : null}
            {canUpdate ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${d.name}`}
                onClick={() => {
                  setEditing(d);
                  setEditName(d.name);
                  setEditCategory(d.category ?? 'OTHER');
                  setReplacement(null);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="ghost" size="icon" aria-label={`Delete ${d.name}`} onClick={() => setDeleting(d)}>
                <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ], [canUpdate, canDelete]);

  return (
    <>
      <PageHeader
        title="Documents"
        description="Typed vault attached to your entities."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
        actions={
          canCreate ? (
            <Button size="sm" variant="accent" onClick={() => setOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" /> Upload
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Document filters">
        <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44" aria-label="Filter by category"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns} data={list.rows} meta={list.meta} page={list.page} onPageChange={list.setPage}
        isLoading={list.isLoading} isFetching={list.isFetching} error={list.error} onRetry={list.refetch}
        getRowId={(r) => r.id}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-label="Upload document">
          <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <FormField label="File (max 5MB)" htmlFor="doc-file">
              <Input
                id="doc-file" type="file"
                accept={ALLOWED_UPLOAD_EXTS.join(',')}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Entity type" htmlFor="doc-et">
                <FormSelect id="doc-et" value={entityType} onChange={(e) => setTypeAndReset(e.target.value)}>
                  <option value="lease">lease</option>
                  <option value="unit">unit</option>
                  <option value="resident">resident</option>
                  <option value="property">property</option>
                  <option value="payment">payment</option>
                  <option value="maintenance">maintenance</option>
                  <option value="building">building</option>
                </FormSelect>
              </FormField>
              <FormField label="Category" htmlFor="doc-cat">
                <FormSelect id="doc-cat" value={docCategory} onChange={(e) => setDocCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </FormSelect>
              </FormField>
            </div>
            <FormField label="Linked record" htmlFor="doc-entity">
              {entityType === 'lease' ? (
                <LeasePicker id="doc-entity" value={entityId || null} onChange={(id) => setEntityId(id ?? '')} />
              ) : entityType === 'unit' ? (
                <UnitPicker id="doc-entity" value={entityId || null} onChange={(id) => setEntityId(id ?? '')} />
              ) : entityType === 'resident' ? (
                <ResidentPicker id="doc-entity" value={entityId || null} onChange={(id) => setEntityId(id ?? '')} />
              ) : entityType === 'property' ? (
                <PropertyPicker id="doc-entity" value={entityId || null} onChange={(id) => setEntityId(id ?? '')} />
              ) : entityType === 'payment' ? (
                <PaymentPicker id="doc-entity" value={entityId || null} onChange={(id) => setEntityId(id ?? '')} />
              ) : entityType === 'maintenance' ? (
                <MaintenancePicker id="doc-entity" value={entityId || null} onChange={(id) => setEntityId(id ?? '')} />
              ) : (
                <div className="space-y-2">
                  <PropertyPicker
                    id="doc-entity-prop"
                    value={linkPropertyId}
                    onChange={(id) => {
                      setLinkPropertyId(id);
                      setEntityId('');
                    }}
                  />
                  {linkPropertyId ? (
                    <BuildingPicker
                      id="doc-entity"
                      propertyId={linkPropertyId}
                      value={entityId || null}
                      onChange={(id) => setEntityId(id ?? '')}
                    />
                  ) : null}
                </div>
              )}
            </FormField>
            <FormField label="Display name (optional)" htmlFor="doc-name">
              <Input id="doc-name" value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            {progress !== null ? (
              <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            ) : null}
            <DialogFooter>
              <Button pending={upload.isPending} disabled={!file || !entityId} onClick={() => upload.mutate()}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Upload
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editing)} onOpenChange={(v) => { if (!v) { setEditing(null); setReplacement(null); } }}>
        <DialogContent aria-label="Edit document">
          <DialogHeader><DialogTitle>Edit {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <FormField label="Display name" htmlFor="doc-edit-name">
              <Input id="doc-edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </FormField>
            <FormField label="Category" htmlFor="doc-edit-cat">
              <FormSelect id="doc-edit-cat" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </FormSelect>
            </FormField>
            <FormField label="Replace file (optional, max 5MB)" htmlFor="doc-edit-file">
              <Input
                id="doc-edit-file"
                type="file"
                accept={ALLOWED_UPLOAD_EXTS.join(',')}
                onChange={(e) => setReplacement(e.target.files?.[0] ?? null)}
              />
            </FormField>
            {replacement ? (
              <p className="text-xs text-muted-foreground">
                The current file will be overwritten by {replacement.name}.
              </p>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditing(null); setReplacement(null); }}>
                Cancel
              </Button>
              <Button
                pending={saveDoc.isPending}
                disabled={!editName.trim()}
                onClick={() => saveDoc.mutate()}
              >
                Save changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(v) => { if (!v) setDeleting(null); }} pending={remove.isPending}
        onConfirm={() => { if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }} />
    </>
  );
}
