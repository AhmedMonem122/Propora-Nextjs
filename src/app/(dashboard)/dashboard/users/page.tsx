'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { normalizeList } from '@/lib/list';
import { roleNames } from '@/lib/permissions';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useDeleteEntity } from '@/hooks/useEntityMutations';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { PasswordInput } from '@/components/ui/PasswordInput/PasswordInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField } from '@/components/common/FormField/FormField';
import type { OrgUser, Role } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  password: z.string().min(8, 'Temporary password must be at least 8 characters.'),
});
type InviteValues = z.infer<typeof inviteSchema>;

export default function UsersPage(): React.JSX.Element {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = can('user:create');
  const canUpdate = can('user:update');
  const canDelete = can('user:delete');

  const [status, setStatus] = useState('');
  const extra = useMemo(() => ({ ...(status ? { status } : {}) }), [status]);
  const list = usePaginatedList<OrgUser>('users', '/users', extra);

  const rolesQ = useQuery({
    queryKey: qk.roles,
    queryFn: async () => normalizeList<Role>((await apiClient.get('/roles')).data),
    staleTime: 60_000,
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleting, setDeleting] = useState<OrgUser | null>(null);
  const [rolesFor, setRolesFor] = useState<OrgUser | null>(null);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [inviteRoleIds, setInviteRoleIds] = useState<string[]>([]);

  const invite = useForm<InviteValues>({ resolver: zodResolver(inviteSchema) });
  const remove = useDeleteEntity((id) => `/users/${id}`, [['users']]);

  const sendInvite = useMutation({
    mutationFn: (v: InviteValues) => apiClient.post('/users', { ...v, roleIds: inviteRoleIds }),
    onSuccess: () => {
      toast.success('Created successfully.');
      setInviteOpen(false);
      invite.reset();
      setInviteRoleIds([]);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const saveRoles = useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) => apiClient.patch(`/users/${id}/roles`, { roleIds }),
    onSuccess: () => {
      toast.success('Updated successfully.');
      setRolesFor(null);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const columns = useMemo<ColumnDef<OrgUser>[]>(() => [
    {
      header: 'User', accessorKey: 'email',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.firstName ?? ''} {row.original.lastName ?? ''}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    { header: 'Roles', accessorKey: 'roles', cell: ({ row }) => roleNames(row.original.roles).join(', ') || '—' },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex gap-1">
            {canUpdate ? (
              <Button
                variant="ghost" size="icon" aria-label={`Edit roles for ${u.email}`}
                onClick={() => {
                  setRolesFor(u);
                  setRoleIds((rolesQ.data?.rows ?? []).filter((r) => roleNames(u.roles).includes(r.name)).map((r) => r.id));
                }}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="ghost" size="icon" aria-label={`Delete ${u.email}`} onClick={() => setDeleting(u)}>
                <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ], [canUpdate, canDelete, rolesQ.data]);

  const toggleRole = (id: string): void => {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="Invite teammates and assign roles."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
        actions={
          canCreate ? (
            <Button size="sm" variant="accent" onClick={() => { invite.reset(); setInviteRoleIds([]); setInviteOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Invite user
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="User filters">
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44" aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns} data={list.rows} meta={list.meta} page={list.page} onPageChange={list.setPage}
        isLoading={list.isLoading} isFetching={list.isFetching} error={list.error} onRetry={list.refetch}
        getRowId={(r) => r.id}
      />
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent aria-label="Invite user">
          <DialogHeader><DialogTitle>Invite user</DialogTitle></DialogHeader>
          <form onSubmit={invite.handleSubmit((v) => sendInvite.mutate(v))} className="space-y-4" noValidate>
            <FormField label="Email" htmlFor="u-email" error={invite.formState.errors.email?.message}>
              <Input id="u-email" type="email" autoComplete="email" {...invite.register('email')} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First name" htmlFor="u-first" error={invite.formState.errors.firstName?.message}>
                <Input id="u-first" {...invite.register('firstName')} />
              </FormField>
              <FormField label="Last name" htmlFor="u-last" error={invite.formState.errors.lastName?.message}>
                <Input id="u-last" {...invite.register('lastName')} />
              </FormField>
            </div>
            <FormField label="Temporary password" htmlFor="u-pass" error={invite.formState.errors.password?.message}>
              <PasswordInput id="u-pass" autoComplete="new-password" {...invite.register('password')} />
            </FormField>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Initial roles (optional)</legend>
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border p-2">
                {(rolesQ.data?.rows ?? []).map((r) => (
                  <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={inviteRoleIds.includes(r.id)}
                      onChange={() =>
                        setInviteRoleIds((prev) => (prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id]))
                      }
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span className="font-medium">{r.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <DialogFooter>
              <Button type="submit" pending={sendInvite.isPending}>Send invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(rolesFor)} onOpenChange={(v) => { if (!v) setRolesFor(null); }}>
        <DialogContent aria-label="Assign roles">
          <DialogHeader><DialogTitle>Roles for {rolesFor?.email}</DialogTitle></DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {(rolesQ.data?.rows ?? []).map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={roleIds.includes(r.id)}
                  onChange={() => toggleRole(r.id)}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="font-medium">{r.name}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              pending={saveRoles.isPending}
              onClick={() => {
                if (rolesFor) saveRoles.mutate({ id: rolesFor.id, roleIds });
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" /> Save roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(v) => { if (!v) setDeleting(null); }} pending={remove.isPending}
        onConfirm={() => { if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }} />
    </>
  );
}
