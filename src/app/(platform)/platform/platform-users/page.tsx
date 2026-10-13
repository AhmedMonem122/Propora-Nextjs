'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import { phoneField } from '@/schemas/phone';
import type { ColumnDef } from '@tanstack/react-table';

interface PlatformUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status?: string | null;
}

const schema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  phone: phoneField(),
});
type Values = z.infer<typeof schema>;

export default function PlatformUsersPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const list = usePaginatedList<PlatformUser>('platform-users', '/platform/users', {});
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformUser | null>(null);
  const [deleting, setDeleting] = useState<PlatformUser | null>(null);

  const form = useForm<Values>({ resolver: zodResolver(schema) });

  const create = useMutation({
    mutationFn: (v: Values) => apiClient.post('/platform/users', v),
    onSuccess: () => {
      toast.success('Created successfully.');
      setCreateOpen(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const save = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiClient.patch(`/platform/users/${id}`, body),
    onSuccess: () => {
      toast.success('Updated successfully.');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/platform/users/${id}`),
    onSuccess: () => {
      toast.success('Deleted.');
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const columns = useMemo<ColumnDef<PlatformUser>[]>(
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
      { header: 'Phone', accessorKey: 'phone', cell: ({ row }) => row.original.phone ?? '—' },
      { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" aria-label={`Edit ${u.email}`} onClick={() => setEditing(u)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Delete ${u.email}`} onClick={() => setDeleting(u)}>
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
        title="Platform users"
        description="Organization managers assigned to tenants."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
        actions={
          <Button size="sm" variant="accent" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New platform user
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
        <DialogContent aria-label="Create platform user">
          <DialogHeader><DialogTitle>New platform user</DialogTitle></DialogHeader>
          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={form.handleSubmit((v) => create.mutate(v))}
          >
            <FormField label="Email" htmlFor="pu-email" error={form.formState.errors.email?.message}>
              <Input id="pu-email" type="email" {...form.register('email')} />
            </FormField>
            <FormField label="Password" htmlFor="pu-pass" error={form.formState.errors.password?.message}>
              <PasswordInput id="pu-pass" {...form.register('password')} />
            </FormField>
            <FormField label="First name" htmlFor="pu-first" error={form.formState.errors.firstName?.message}>
              <Input id="pu-first" {...form.register('firstName')} />
            </FormField>
            <FormField label="Last name" htmlFor="pu-last" error={form.formState.errors.lastName?.message}>
              <Input id="pu-last" {...form.register('lastName')} />
            </FormField>
            <FormField label="Phone (optional)" htmlFor="pu-phone" error={form.formState.errors.phone?.message} className="sm:col-span-2">
              <Input id="pu-phone" type="tel" autoComplete="tel" {...form.register('phone')} />
            </FormField>
            <DialogFooter className="sm:col-span-2">
              <Button type="submit" pending={create.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <EditDialog
        key={editing?.id ?? 'none'}
        member={editing}
        onClose={() => setEditing(null)}
        onSave={(id, body) => save.mutate({ id, body })}
        pending={save.isPending}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => { if (!v) setDeleting(null); }}
        pending={remove.isPending}
        title={deleting ? `Delete ${deleting.email}?` : undefined}
        body="Managed organizations are detached, never deleted."
        onConfirm={() => { if (deleting) remove.mutate(deleting.id); }}
      />
    </>
  );
}

function EditDialog({
  member,
  onClose,
  onSave,
  pending,
}: {
  member: PlatformUser | null;
  onClose: () => void;
  onSave: (id: string, body: Record<string, unknown>) => void;
  pending: boolean;
}): React.JSX.Element {
  // Remounted per member via key: initializer state is always fresh.
  const [firstName, setFirstName] = useState(member?.firstName ?? '');
  const [lastName, setLastName] = useState(member?.lastName ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [status, setStatus] = useState(member?.status ?? '');

  if (!member) return <></>;
  return (
    <Dialog open={Boolean(member)} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent aria-label={`Edit ${member.email}`}>
        <DialogHeader><DialogTitle>Edit {member.email}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="First name" htmlFor="pe-first">
            <Input id="pe-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </FormField>
          <FormField label="Last name" htmlFor="pe-last">
            <Input id="pe-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </FormField>
          <FormField label="Phone" htmlFor="pe-phone">
            <Input id="pe-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label="Status" htmlFor="pe-status">
            <FormSelect id="pe-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">— (unchanged)</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </FormSelect>
          </FormField>
          <DialogFooter className="sm:col-span-2">
            <Button
              pending={pending}
              onClick={() =>
                onSave(member.id, {
                  ...(firstName ? { firstName } : {}),
                  ...(lastName ? { lastName } : {}),
                  ...(phone ? { phone } : {}),
                  ...(status ? { status } : {}),
                })
              }
            >
              Save changes
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
