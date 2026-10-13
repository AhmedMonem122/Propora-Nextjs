'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { PasswordInput } from '@/components/ui/PasswordInput/PasswordInput';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField } from '@/components/common/FormField/FormField';
import { phoneField } from '@/schemas/phone';
import type { ColumnDef } from '@tanstack/react-table';

interface ManagedUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  status?: string | null;
  organization?: { id: string; name: string; slug: string } | null;
  userRoles?: Array<{ role?: { id: string; name: string } | null }>;
}

interface OrgRole {
  id: string;
  name: string;
}

const createSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required.'),
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(8, 'Temporary password must be at least 8 characters.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  phone: phoneField(),
  roleId: z.string().optional().or(z.literal('')),
});
type CreateValues = z.infer<typeof createSchema>;

export default function PlatformManagedUsersPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const list = usePaginatedList<ManagedUser>('platform-members', '/platform/managed-users', {});
  const [createOpen, setCreateOpen] = useState(false);
  const [rolesFor, setRolesFor] = useState<ManagedUser | null>(null);
  const [blocking, setBlocking] = useState<ManagedUser | null>(null);
  const [wiping, setWiping] = useState<ManagedUser | null>(null);

  const form = useForm<CreateValues>({ resolver: zodResolver(createSchema) });

  const create = useMutation({
    mutationFn: (v: CreateValues) =>
      apiClient.post('/platform/managed-users', {
        organizationId: v.organizationId,
        email: v.email,
        password: v.password,
        firstName: v.firstName,
        lastName: v.lastName,
        ...(v.phone ? { phone: v.phone } : {}),
        ...(v.roleId ? { roleIds: [v.roleId] } : {}),
      }),
    onSuccess: () => {
      toast.success('Created successfully.');
      setCreateOpen(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ['platform-members'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const block = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/platform/managed-users/${id}`),
    onSuccess: () => {
      toast.success('Blocked.');
      setBlocking(null);
      void queryClient.invalidateQueries({ queryKey: ['platform-members'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const wipe = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/platform/managed-users/${id}/permanent`),
    onSuccess: () => {
      toast.success('Permanently deleted.');
      setWiping(null);
      void queryClient.invalidateQueries({ queryKey: ['platform-members'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const saveRoles = useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      apiClient.patch(`/platform/managed-users/${id}`, { roleIds }),
    onSuccess: () => {
      toast.success('Updated successfully.');
      setRolesFor(null);
      void queryClient.invalidateQueries({ queryKey: ['platform-members'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const columns = useMemo<ColumnDef<ManagedUser>[]>(
    () => [
      {
        header: 'User',
        accessorKey: 'email',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {row.original.firstName ?? ''} {row.original.lastName ?? ''}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        header: 'Organization',
        accessorKey: 'organization',
        cell: ({ row }) => row.original.organization?.name ?? '—',
      },
      {
        header: 'Roles',
        accessorKey: 'roles',
        cell: ({ row }) =>
          (row.original.userRoles ?? [])
            .map((ur) => ur.role?.name)
            .filter(Boolean)
            .join(', ') || '—',
      },
      { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" aria-label={`Edit roles for ${u.email}`} onClick={() => setRolesFor(u)}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Block ${u.email}`} onClick={() => setBlocking(u)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Delete ${u.email} permanently`} onClick={() => setWiping(u)}>
                <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Members"
        description="Every account on the platform. Block, or delete forever."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
        actions={
          <Button size="sm" variant="accent" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New member
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={list.rows}
        meta={list.meta}
        page={list.page}
        onPageChange={list.setPage}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        getRowId={(r) => r.id}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent aria-label="Create member">
          <DialogHeader><DialogTitle>New member (any organization)</DialogTitle></DialogHeader>
          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={form.handleSubmit((v) => create.mutate(v))}
          >
            <FormField label="Organization ID" htmlFor="pm-org" error={form.formState.errors.organizationId?.message} className="sm:col-span-2">
              <Input id="pm-org" placeholder="Paste the organization id (see Organizations)" {...form.register('organizationId')} />
            </FormField>
            <FormField label="Email" htmlFor="pm-email" error={form.formState.errors.email?.message}>
              <Input id="pm-email" type="email" {...form.register('email')} />
            </FormField>
            <FormField label="Temporary password" htmlFor="pm-pass" error={form.formState.errors.password?.message}>
              <PasswordInput id="pm-pass" {...form.register('password')} />
            </FormField>
            <FormField label="First name" htmlFor="pm-first" error={form.formState.errors.firstName?.message}>
              <Input id="pm-first" {...form.register('firstName')} />
            </FormField>
            <FormField label="Last name" htmlFor="pm-last" error={form.formState.errors.lastName?.message}>
              <Input id="pm-last" {...form.register('lastName')} />
            </FormField>
            <FormField label="Phone (optional)" htmlFor="pm-phone" error={form.formState.errors.phone?.message}>
              <Input id="pm-phone" type="tel" autoComplete="tel" {...form.register('phone')} />
            </FormField>
            <FormField label="Owner role ID (optional)" htmlFor="pm-role" className="sm:col-span-2">
              <Input
                id="pm-role"
                placeholder="Paste ORGANIZATION_OWNER role id to make them owner (see Roles)"
                {...form.register('roleId')}
              />
            </FormField>
            <DialogFooter className="sm:col-span-2">
              <Button type="submit" pending={create.isPending}>Create member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <RolesDialog
        key={rolesFor?.id ?? 'none'}
        member={rolesFor}
        onClose={() => setRolesFor(null)}
        onSave={(roleIds) => {
          if (rolesFor) saveRoles.mutate({ id: rolesFor.id, roleIds });
        }}
        pending={saveRoles.isPending}
      />
      <ConfirmDialog
        open={Boolean(blocking)}
        onOpenChange={(v) => { if (!v) setBlocking(null); }}
        pending={block.isPending}
        title={blocking ? `Block ${blocking.email}?` : undefined}
        body="Hard block: history preserved, the account stays out (no auto-reactivation)."
        onConfirm={() => { if (blocking) block.mutate(blocking.id); }}
      />
      <ConfirmDialog
        open={Boolean(wiping)}
        onOpenChange={(v) => { if (!v) setWiping(null); }}
        pending={wipe.isPending}
        title={wiping ? `Delete ${wiping.email} forever?` : undefined}
        body="Permanent row delete. Refused for the last owner of an organization."
        onConfirm={() => { if (wiping) wipe.mutate(wiping.id); }}
      />
    </>
  );
}

function RolesDialog({
  member,
  onClose,
  onSave,
  pending,
}: {
  member: ManagedUser | null;
  onClose: () => void;
  onSave: (roleIds: string[]) => void;
  pending: boolean;
}): React.JSX.Element {
  // Remounted per member via key: initializer state is always fresh.
  const [roleIds, setRoleIds] = useState<string[]>(() =>
    (member?.userRoles ?? []).map((ur) => ur.role?.id).filter((x): x is string => Boolean(x)),
  );
  const rolesQ = useQuery({
    queryKey: ['platform', 'member-roles', member?.organization?.id],
    queryFn: async () => {
      if (!member?.organization?.id) return [] as OrgRole[];
      const res = await apiClient.get('/platform/roles', {
        params: { organizationId: member.organization.id },
      });
      return (res.data ?? []) as OrgRole[];
    },
    enabled: Boolean(member),
  });

  if (!member) return <></>;
  return (
    <Dialog open={Boolean(member)} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent aria-label={`Roles for ${member.email}`}>
        <DialogHeader><DialogTitle>Roles for {member.email}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {rolesQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading roles…</p>
          ) : (
            (rolesQ.data ?? []).map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={roleIds.includes(r.id)}
                  onChange={(e) =>
                    setRoleIds((prev) =>
                      e.target.checked ? [...prev, r.id] : prev.filter((x) => x !== r.id),
                    )
                  }
                  className="h-4 w-4 accent-violet-600"
                />
                {r.name}
              </label>
            ))
          )}
          <DialogFooter>
            <Button pending={pending} onClick={() => onSave(roleIds)}>
              Save roles
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
