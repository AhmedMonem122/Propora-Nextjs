'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { normalizeList } from '@/lib/list';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField } from '@/components/common/FormField/FormField';
import type { UnitType } from '@/types/api';

const schema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

export default function UnitTypesPage(): React.JSX.Element {
  const { can } = useAuth();
  // Catalog shape is {rows,meta} on the shared key — pickers use
  // `unitTypeOptions` instead, so this data can never be shape-poisoned.
  // The rows guard below degrades a poisoned cache to an empty table that a
  // Reload heals, instead of a stuck blank page.
  const listQ = useQuery({
    queryKey: qk.unitTypes,
    queryFn: async () => normalizeList<UnitType>((await apiClient.get('/unit-types')).data),
  });
  const rows: UnitType[] = Array.isArray(listQ.data)
    ? (listQ.data as unknown as UnitType[])
    : (listQ.data?.rows ?? []);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UnitType | null>(null);
  const [deleting, setDeleting] = useState<UnitType | null>(null);
  const [pending, setPending] = useState(false);

  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const openFor = (t: UnitType | null): void => {
    setEditing(t);
    reset({ name: t?.name ?? '', description: t?.description ?? '' });
    setOpen(true);
  };

  const onSubmit = async (v: Values): Promise<void> => {
    setPending(true);
    try {
      if (editing) await apiClient.patch(`/unit-types/${editing.id}`, v);
      else await apiClient.post('/unit-types', v);
      toast.success(editing ? 'Updated successfully.' : 'Created successfully.');
      setOpen(false);
      void listQ.refetch();
    } catch (e) {
      toast.error(getApiMessage(e, 'Operation failed.'));
    } finally {
      setPending(false);
    }
  };

  const onDelete = async (): Promise<void> => {
    if (!deleting) return;
    setPending(true);
    try {
      await apiClient.delete(`/unit-types/${deleting.id}`);
      toast.success('Deleted successfully.');
      setDeleting(null);
      void listQ.refetch();
    } catch (e) {
      toast.error(getApiMessage(e, 'Operation failed.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Unit types"
        description="Catalog used by the unit form picker."
        onReload={() => void listQ.refetch()}
        reloading={listQ.isFetching}
        actions={
          can('unit:create') ? (
            <Button size="sm" variant="accent" onClick={() => openFor(null)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New type
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={[
          { header: 'Name', accessorKey: 'name', cell: ({ row }) => <span className="font-medium">{(row.original as UnitType).name}</span> },
          { header: 'Description', accessorKey: 'description', cell: ({ row }) => (row.original as UnitType).description ?? '—' },
          {
            header: 'Actions', id: 'actions',
            cell: ({ row }) => {
              const t = row.original as UnitType;
              return (
                <div className="flex gap-1">
                  {can('unit:update') ? (
                    <Button variant="ghost" size="icon" aria-label={`Edit ${t.name}`} onClick={() => openFor(t)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                  {can('unit:delete') ? (
                    <Button variant="ghost" size="icon" aria-label={`Delete ${t.name}`} onClick={() => setDeleting(t)}>
                      <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              );
            },
          },
        ]}
        data={rows}
        meta={listQ.data?.meta}
        page={1}
        onPageChange={() => undefined}
        isLoading={listQ.isLoading}
        isFetching={listQ.isFetching}
        error={listQ.error}
        onRetry={() => void listQ.refetch()}
        getRowId={(r) => (r as UnitType).id}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-label={editing ? 'Edit unit type' : 'Create unit type'}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit unit type' : 'New unit type'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="Name" htmlFor="ut-name" error={formState.errors.name?.message}>
              <Input id="ut-name" {...register('name')} />
            </FormField>
            <FormField label="Description" htmlFor="ut-desc">
              <Input id="ut-desc" {...register('description')} />
            </FormField>
            <DialogFooter>
              <Button type="submit" pending={pending}>{editing ? 'Save changes' : 'Create type'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(v) => { if (!v) setDeleting(null); }} pending={pending} onConfirm={() => void onDelete()} />
    </>
  );
}
