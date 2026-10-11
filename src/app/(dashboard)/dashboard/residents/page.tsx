'use client';

import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useCreateEntity, useDeleteEntity, useUpdateEntity } from '@/hooks/useEntityMutations';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import { Button } from '@/components/ui/Button/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { ResidentForm } from '@/components/domain/residents/ResidentForm/ResidentForm';
import { formatDateOnly } from '@/lib/format';
import type { Resident } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';

export default function ResidentsPage(): React.JSX.Element {
  const { can } = useAuth();
  const canCreate = can('resident:create');
  const canUpdate = can('resident:update');
  const canDelete = can('resident:delete');

  const [status, setStatus] = useState('');
  const extra = useMemo(() => ({ ...(status ? { status } : {}) }), [status]);
  const list = usePaginatedList<Resident>('residents', '/residents', extra);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [deleting, setDeleting] = useState<Resident | null>(null);
  const [viewing, setViewing] = useState<Resident | null>(null);

  const create = useCreateEntity<Record<string, unknown>>('/residents', [['residents']]);
  const update = useUpdateEntity<Record<string, unknown>>((id) => `/residents/${id}`, [['residents']]);
  const remove = useDeleteEntity((id) => `/residents/${id}`, [['residents']]);

  const columns = useMemo<ColumnDef<Resident>[]>(() => [
    {
      header: 'Name', accessorKey: 'firstName',
      cell: ({ row }) => <span className="font-medium">{row.original.firstName} {row.original.lastName}</span>,
    },
    { header: 'Email', accessorKey: 'email', cell: ({ row }) => row.original.email ?? '—' },
    { header: 'Phone', accessorKey: 'phone', cell: ({ row }) => row.original.phone ?? '—' },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label={`View ${row.original.firstName}`} onClick={() => setViewing(row.original)}>
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
          {canUpdate ? (
            <Button variant="ghost" size="icon" aria-label={`Edit ${row.original.firstName}`} onClick={() => { setEditing(row.original); setFormOpen(true); }}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          {canDelete ? (
            <Button variant="ghost" size="icon" aria-label={`Delete ${row.original.firstName}`} onClick={() => setDeleting(row.original)}>
              <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ], [canUpdate, canDelete]);

  return (
    <>
      <PageHeader
        title="Residents"
        description="People living in your units."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
        actions={
          canCreate ? (
            <Button size="sm" variant="accent" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New resident
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Resident filters">
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns} data={list.rows} meta={list.meta} page={list.page} onPageChange={list.setPage}
        isLoading={list.isLoading} isFetching={list.isFetching} error={list.error} onRetry={list.refetch}
        getRowId={(r) => r.id}
      />
      <ResidentForm
        open={formOpen} onOpenChange={setFormOpen} initial={editing} pending={create.isPending || update.isPending}
        onSubmit={(body) => {
          if (editing) update.mutate({ id: editing.id, body }, { onSuccess: () => setFormOpen(false) });
          else create.mutate(body, { onSuccess: () => setFormOpen(false) });
        }}
      />
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(v) => { if (!v) setDeleting(null); }} pending={remove.isPending}
        onConfirm={() => { if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }} />
      <Dialog open={Boolean(viewing)} onOpenChange={(v) => { if (!v) setViewing(null); }}>
        <DialogContent aria-label="Resident details">
          <DialogHeader>
            <DialogTitle>{viewing?.firstName} {viewing?.lastName}</DialogTitle>
          </DialogHeader>
          {viewing ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Email</dt><dd>{viewing.email ?? '—'}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd>{viewing.phone ?? '—'}</dd></div>
              <div><dt className="text-muted-foreground">ID number</dt><dd>{viewing.idNumber ?? '—'}</dd></div>
              <div><dt className="text-muted-foreground">Status</dt><dd><StatusBadge value={viewing.status} /></dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Emergency</dt><dd>{viewing.emergencyContact ?? '—'}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Notes</dt><dd>{viewing.notes ?? '—'}</dd></div>
              <div><dt className="text-muted-foreground">Since</dt><dd>{formatDateOnly(viewing.createdAt)}</dd></div>
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
