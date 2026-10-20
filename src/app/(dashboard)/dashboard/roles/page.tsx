'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { normalizeList } from '@/lib/list';
import { useUrlState } from '@/hooks/useUrlState';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField } from '@/components/common/FormField/FormField';
import type { Role } from '@/types/api';

const schema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

export default function RolesPage(): React.JSX.Element {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useUrlState('search');

  const listQ = useQuery({
    queryKey: qk.roles,
    queryFn: async () => normalizeList<Role>((await apiClient.get('/roles')).data),
  });
  const permsQ = useQuery({
    queryKey: qk.permissions,
    queryFn: async () => {
      const d = (await apiClient.get('/roles/permissions')).data as unknown;
      const arr = Array.isArray(d)
        ? d
        : Array.isArray((d as { data?: unknown })?.data)
          ? ((d as { data: unknown[] }).data)
          : Array.isArray((d as { permissions?: unknown })?.permissions)
            ? ((d as { permissions: unknown[] }).permissions)
            : [];
      // Catalog entries are objects ({name, resource, action, ...}) — use names.
      return arr
        .map((p: unknown) => (typeof p === 'string' ? p : (p as { name?: unknown })?.name))
        .filter((n): n is string => typeof n === 'string' && n.length > 0);
    },
    staleTime: 5 * 60_000,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [perms, setPerms] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const form = useForm<Values>({ resolver: zodResolver(schema) });

  const openFor = (r: Role | null): void => {
    setEditing(r);
    form.reset({ name: r?.name ?? '', description: r?.description ?? '' });
    setPerms(r?.permissions ?? []);
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async (v: Values) => {
      const body = { ...v, permissions: perms };
      if (editing) return apiClient.patch(`/roles/${editing.id}`, body);
      return apiClient.post('/roles', body);
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated successfully.' : 'Created successfully.');
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: qk.roles });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/roles/${id}`),
    onSuccess: () => {
      toast.success('Deleted successfully.');
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: qk.roles });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const toggle = (p: string): void => {
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <>
      <PageHeader
        title="Roles"
        description="Permission checklists per role."
        searchValue={search}
        onSearchChange={setSearch}
        onReload={() => void listQ.refetch()}
        reloading={listQ.isFetching}
        actions={
          can('role:create') ? (
            <Button size="sm" variant="accent" onClick={() => openFor(null)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New role
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={[
          { header: 'Name', accessorKey: 'name', cell: ({ row }) => <span className="font-medium">{(row.original as Role).name}</span> },
          {
            header: 'Permissions', accessorKey: 'permissions',
            cell: ({ row }) => {
              const ps = (row.original as Role).permissions ?? [];
              return (
                <span className="flex max-w-md flex-wrap gap-1">
                  {ps.slice(0, 5).map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}
                  {ps.length > 5 ? <Badge variant="outline">+{ps.length - 5}</Badge> : null}
                  {ps.length === 0 ? '—' : null}
                </span>
              );
            },
          },
          {
            header: 'Actions', id: 'actions',
            cell: ({ row }) => {
              const r = row.original as Role;
              return (
                <div className="flex gap-1">
                  {can('role:update') ? (
                    <Button variant="ghost" size="icon" aria-label={`Edit ${r.name}`} onClick={() => openFor(r)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                  {can('role:delete') ? (
                    <Button variant="ghost" size="icon" aria-label={`Delete ${r.name}`} onClick={() => setDeleting(r)}>
                      <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              );
            },
          },
        ]}
        data={
          (listQ.data?.rows ?? []).filter((r) => {
            const term = search.toLowerCase();
            const rr = r as Role;
            return rr.name?.toLowerCase().includes(term);
          })
        }
        meta={listQ.data?.meta}
        page={1}
        onPageChange={() => undefined}
        isLoading={listQ.isLoading}
        isFetching={listQ.isFetching}
        error={listQ.error}
        onRetry={() => void listQ.refetch()}
        getRowId={(r) => (r as Role).id}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl" aria-label={editing ? 'Edit role' : 'Create role'}>
          <DialogHeader><DialogTitle>{editing ? 'Edit role' : 'New role'}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
            <FormField label="Name" htmlFor="r-name" error={form.formState.errors.name?.message}>
              <Input id="r-name" {...form.register('name')} />
            </FormField>
            <FormField label="Description" htmlFor="r-desc">
              <Textarea id="r-desc" rows={2} {...form.register('description')} />
            </FormField>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Permissions ({perms.length} selected)</legend>
              <div className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">
                {(permsQ.data ?? []).map((p) => (
                  <label key={p} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted">
                    <input type="checkbox" checked={perms.includes(p)} onChange={() => toggle(p)} className="h-4 w-4 accent-emerald-600" />
                    <span className="font-mono">{p}</span>
                  </label>
                ))}
                {(permsQ.data ?? []).length === 0 ? <p className="p-2 text-xs text-muted-foreground">No permission catalog returned.</p> : null}
              </div>
            </fieldset>
            <DialogFooter>
              <Button type="submit" pending={save.isPending}>{editing ? 'Save changes' : 'Create role'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(v) => { if (!v) setDeleting(null); }} pending={remove.isPending}
        onConfirm={() => { if (deleting) remove.mutate(deleting.id); }} />
    </>
  );
}
