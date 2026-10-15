'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, FormProvider, useFormContext } from 'react-hook-form';
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
import { EntityPicker } from '@/components/common/EntityPicker/EntityPicker';
import { PhoneInput } from '@/components/common/PhoneInput/PhoneInput';
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
  roleIds: z.array(z.string()).optional(),
});
type CreateValues = z.infer<typeof createSchema>;

function CreateRolePicker({ orgId }: { orgId: string }): React.JSX.Element | null {
  const { control } = useFormContext<CreateValues>();
  const rolesQ = useQuery({
    queryKey: ['platform', 'create-roles', orgId],
    queryFn: async () => {
      const res = await apiClient.get('/platform/roles', { params: { organizationId: orgId } });
      return (res.data ?? []) as OrgRole[];
    },
    enabled: Boolean(orgId),
    staleTime: 60_000,
  });

  const roles: OrgRole[] = Array.isArray(rolesQ.data) ? rolesQ.data : [];

  if (!orgId) {
    return <p className="text-sm text-muted-foreground sm:col-span-2">Select an organization first to choose roles.</p>;
  }
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm font-medium">Roles (optional)</legend>
      {rolesQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading roles…</p>
      ) : (
        <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border p-2">
          {roles.map((r) => (
            <Controller
              key={r.id}
              control={control}
              name="roleIds"
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={(field.value ?? []).includes(r.id)}
                    onChange={(e) => {
                      const prev = field.value ?? [];
                      field.onChange(e.target.checked ? [...prev, r.id] : prev.filter((x) => x !== r.id));
                    }}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span className="font-medium">{r.name}</span>
                </label>
              )}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}

export default function PlatformManagedUsersPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const list = usePaginatedList<ManagedUser>('platform-members', '/platform/managed-users', {});
  const [createOpen, setCreateOpen] = useState(false);
  const [rolesFor, setRolesFor] = useState<ManagedUser | null>(null);
  const [statusFor, setStatusFor] = useState<ManagedUser | null>(null);
  const [wiping, setWiping] = useState<ManagedUser | null>(null);

  // CreateRolePicker reads the form via context, so the dialog form must be
  // wrapped in FormProvider — without it, opening "New member" crashes.
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { organizationId: '', roleIds: [] },
  });

  const create = useMutation({
    mutationFn: (v: CreateValues) =>
      apiClient.post('/platform/managed-users', {
        organizationId: v.organizationId,
        email: v.email,
        password: v.password,
        firstName: v.firstName,
        lastName: v.lastName,
        ...(v.phone ? { phone: v.phone } : {}),
        ...(v.roleIds?.length ? { roleIds: v.roleIds } : {}),
      }),
    onSuccess: () => {
      toast.success('Created successfully.');
      setCreateOpen(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ['platform-members'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/platform/managed-users/${id}`, { status }),
    onSuccess: () => {
      toast.success('Updated successfully.');
      setStatusFor(null);
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
              <Button variant="ghost" size="icon" aria-label={`Change status of ${u.email}`} onClick={() => setStatusFor(u)}>
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
        description="Every account on the platform. Manage roles and status, or delete forever."
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
          <FormProvider {...form}>
          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={form.handleSubmit((v) => create.mutate(v))}
          >
            <FormField label="Organization" htmlFor="pm-org" error={form.formState.errors.organizationId?.message} className="sm:col-span-2">
              <Controller
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <EntityPicker
                    id="pm-org"
                    value={field.value || null}
                    onChange={(id) => {
                      field.onChange(id ?? '');
                      form.setValue('roleIds', []);
                    }}
                    cacheKey="picker-platform-orgs-create"
                    dialogTitle="Select organization"
                    fetchPage={async ({ search, page }) => {
                      const res = await apiClient.get('/platform/organizations', {
                        params: { search: search || undefined, page, limit: 20 },
                      });
                      const body = res.data as {
                        data?: Array<Record<string, unknown>>;
                        meta?: { hasNext?: boolean };
                      };
                      return { data: body.data ?? [], meta: body.meta ?? null };
                    }}
                    getLabel={(r) => String(r.name ?? String(r.id).slice(0, 8))}
                    getSub={(r) => (typeof r.slug === 'string' ? r.slug : undefined)}
                    error={form.formState.errors.organizationId?.message}
                  />
                )}
              />
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
              <Controller
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <PhoneInput
                    id="pm-phone"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={form.formState.errors.phone?.message}
                  />
                )}
              />
            </FormField>
            <CreateRolePicker orgId={form.watch('organizationId') ?? ''} />
            <DialogFooter className="sm:col-span-2">
              <Button type="submit" pending={create.isPending}>Create member</Button>
            </DialogFooter>
          </form>
          </FormProvider>
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
      <StatusDialog
        key={statusFor?.id ?? 'none'}
        member={statusFor}
        onClose={() => setStatusFor(null)}
        onSave={(status) => {
          if (statusFor) setStatus.mutate({ id: statusFor.id, status });
        }}
        pending={setStatus.isPending}
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

const STATUSES = [
  { value: 'ACTIVE', label: 'Active', hint: 'Full access. Clears any self-deletion flag.' },
  { value: 'INACTIVE', label: 'Deactivated', hint: 'Blocked by admin. History preserved, no auto-reactivation.' },
  { value: 'SUSPENDED', label: 'Suspended', hint: 'Serious block (abuse). Same effect, stronger signal.' },
] as const;

function StatusDialog({
  member,
  onClose,
  onSave,
  pending,
}: {
  member: ManagedUser | null;
  onClose: () => void;
  onSave: (status: string) => void;
  pending: boolean;
}): React.JSX.Element {
  // Remounted per member via key: initializer state is always fresh.
  const [status, setStatus] = useState(member?.status ?? 'ACTIVE');
  if (!member) return <></>;
  return (
    <Dialog open={Boolean(member)} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent aria-label={`Status of ${member.email}`}>
        <DialogHeader><DialogTitle>Status of {member.email}</DialogTitle></DialogHeader>
        <div className="space-y-2" role="radiogroup" aria-label="Account status">
          {STATUSES.map((s) => (
            <label
              key={s.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm hover:bg-muted"
            >
              <input
                type="radio"
                name="member-status"
                value={s.value}
                checked={status === s.value}
                onChange={() => setStatus(s.value)}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span>
                <span className="block font-medium">{s.label}</span>
                <span className="block text-xs text-muted-foreground">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button pending={pending} onClick={() => onSave(status)}>
            Save status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
                  className="h-4 w-4 accent-emerald-600"
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
