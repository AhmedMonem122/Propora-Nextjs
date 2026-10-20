'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodSchemaResolver } from '@/lib/rhf';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, Pencil, Plus, ReceiptText, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useUrlState } from '@/hooks/useUrlState';
import { useCreateEntity, useDeleteEntity, useUpdateEntity } from '@/hooks/useEntityMutations';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import { CurrencyInput } from '@/components/common/CurrencyInput/CurrencyInput';
import { LeaseForm } from '@/components/domain/leases/LeaseForm/LeaseForm';
import { formatDateOnly, formatMoney } from '@/lib/format';
import type { Lease } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be positive.'),
  dueDate: z.string().min(1, 'Due date is required.'),
  type: z.enum(['RENT', 'DEPOSIT', 'FEE', 'OTHER']).optional().or(z.literal('')),
  method: z.enum(['BANK_TRANSFER', 'CASH', 'CARD', 'CHECK', 'ONLINE']).optional().or(z.literal('')),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'FAILED', 'REFUNDED']).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});
type PaymentValues = z.infer<typeof paymentSchema>;

export default function LeasesPage(): React.JSX.Element {
  const { can } = useAuth();
  const queryClient = useQueryClient();

  const [status, setStatus] = useUrlState('status');
  const extra = useMemo(() => ({ ...(status ? { status } : {}) }), [status]);
  const list = usePaginatedList<Lease>('leases', '/leases', extra);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lease | null>(null);
  const [deleting, setDeleting] = useState<Lease | null>(null);
  const [viewing, setViewing] = useState<Lease | null>(null);
  const [paying, setPaying] = useState<Lease | null>(null);

  const payForm = useForm<PaymentValues>({ resolver: zodSchemaResolver(paymentSchema) });

  const recordPayment = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiClient.post(`/leases/${id}/payments`, body),
    onSuccess: () => {
      toast.success('Created successfully.');
      setPaying(null);
      payForm.reset();
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const create = useCreateEntity<Record<string, unknown>>('/leases', [['leases']]);
  const update = useUpdateEntity<Record<string, unknown>>((id) => `/leases/${id}`, [['leases']]);
  const remove = useDeleteEntity((id) => `/leases/${id}`, [['leases']]);

  const setStatusM = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) => apiClient.patch(`/leases/${id}/status`, { status: next }),
    onSuccess: () => {
      toast.success('Updated successfully.');
      void queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const columns = useMemo<ColumnDef<Lease>[]>(() => [
    {
      header: 'Unit', accessorKey: 'unitId',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.unit?.name ?? row.original.unitId.slice(0, 8)}</span>,
    },
    {
      header: 'Resident', accessorKey: 'residentId',
      cell: ({ row }) => <span>{row.original.resident ? `${row.original.resident.firstName} ${row.original.resident.lastName}` : row.original.residentId.slice(0, 8)}</span>,
    },
    { header: 'Rent', accessorKey: 'rentAmount', cell: ({ row }) => formatMoney(row.original.rentAmount) },
    { header: 'Start', accessorKey: 'startDate', cell: ({ row }) => formatDateOnly(row.original.startDate) },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label="View lease" onClick={() => setViewing(row.original)}>
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
          {can('lease:update') ? (
            <Button variant="ghost" size="icon" aria-label="Edit lease" onClick={() => { setEditing(row.original); setFormOpen(true); }}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          {can('payment:create') ? (
            <Button variant="ghost" size="icon" aria-label="Record payment" onClick={() => { setPaying(row.original); payForm.reset(); }}>
              <ReceiptText className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          {can('lease:delete') ? (
            <Button variant="ghost" size="icon" aria-label="Delete lease" onClick={() => setDeleting(row.original)}>
              <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ], [can, payForm]);

  return (
    <>
      <PageHeader
        title="Leases"
        description="Your rental contracts — tenants, units, and payment status."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
        actions={
          can('lease:create') ? (
            <Button size="sm" variant="accent" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New lease
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Lease filters">
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ENDED">Ended</SelectItem>
            <SelectItem value="TERMINATED">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns} data={list.rows} meta={list.meta} page={list.page} onPageChange={list.setPage}
        isLoading={list.isLoading} isFetching={list.isFetching} error={list.error} onRetry={list.refetch}
        getRowId={(r) => r.id}
      />
      <LeaseForm
        open={formOpen} onOpenChange={setFormOpen} initial={editing} pending={create.isPending || update.isPending}
        onSubmit={(body) => {
          if (editing) update.mutate({ id: editing.id, body }, { onSuccess: () => setFormOpen(false) });
          else create.mutate(body, { onSuccess: () => setFormOpen(false) });
        }}
      />
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(v) => { if (!v) setDeleting(null); }} pending={remove.isPending}
        onConfirm={() => { if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }} />
      <Dialog open={Boolean(paying)} onOpenChange={(v) => { if (!v) setPaying(null); }}>
        <DialogContent aria-label="Record payment">
          <DialogHeader><DialogTitle>Record payment for lease</DialogTitle></DialogHeader>
          <form
            onSubmit={payForm.handleSubmit((v) => {
              if (!paying) return;
              const body: Record<string, unknown> = {};
              for (const [k, val] of Object.entries(v)) {
                if (val === '' || val === undefined || (typeof val === 'number' && Number.isNaN(val))) continue;
                body[k] = val;
              }
              recordPayment.mutate({ id: paying.id, body });
            })}
            className="grid grid-cols-2 gap-4"
            noValidate
          >
            <FormField label="Amount" htmlFor="lp-amount" error={payForm.formState.errors.amount?.message}>
              <Controller
                control={payForm.control}
                name="amount"
                render={({ field }) => (
                  <CurrencyInput id="lp-amount" value={field.value ?? ''} onValueChange={(x) => field.onChange(x.floatValue)} />
                )}
              />
            </FormField>
            <FormField label="Due date" htmlFor="lp-due" error={payForm.formState.errors.dueDate?.message}>
              <Input id="lp-due" type="date" {...payForm.register('dueDate')} />
            </FormField>
            <FormField label="Type" htmlFor="lp-type">
              <FormSelect id="lp-type" {...payForm.register('type')}>
                <option value="">—</option>
                <option value="RENT">Rent</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="FEE">Fee</option>
                <option value="OTHER">Other</option>
              </FormSelect>
            </FormField>
            <FormField label="Method" htmlFor="lp-method">
              <FormSelect id="lp-method" {...payForm.register('method')}>
                <option value="">—</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="CHECK">Check</option>
                <option value="ONLINE">Online</option>
              </FormSelect>
            </FormField>
            <FormField label="Status" htmlFor="lp-status" className="col-span-2">
              <FormSelect id="lp-status" {...payForm.register('status')}>
                <option value="">—</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </FormSelect>
            </FormField>
            <DialogFooter className="col-span-2">
              <Button type="submit" pending={recordPayment.isPending}>Record payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(viewing)} onOpenChange={(v) => { if (!v) setViewing(null); }}>
        <DialogContent aria-label="Lease details">
          <DialogHeader>
            <DialogTitle>Lease details</DialogTitle>
          </DialogHeader>
          {viewing ? (
            <div className="space-y-3 text-sm">
              <dl className="grid grid-cols-2 gap-3">
                <div><dt className="text-muted-foreground">Rent</dt><dd className="font-semibold">{formatMoney(viewing.rentAmount)}</dd></div>
                <div><dt className="text-muted-foreground">Status</dt><dd><StatusBadge value={viewing.status} /></dd></div>
                <div><dt className="text-muted-foreground">Start</dt><dd>{formatDateOnly(viewing.startDate)}</dd></div>
                <div><dt className="text-muted-foreground">End</dt><dd>{formatDateOnly(viewing.endDate)}</dd></div>
                <div className="col-span-2"><dt className="text-muted-foreground">Notes</dt><dd>{viewing.notes ?? '—'}</dd></div>
              </dl>
              {can('lease:update') ? (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Change lease status">
                  {(['UPCOMING', 'ACTIVE', 'ENDED', 'TERMINATED'] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={viewing.status === s ? 'default' : 'outline'}
                      pending={setStatusM.isPending}
                      onClick={() => setStatusM.mutate({ id: viewing.id, next: s }, { onSuccess: () => setViewing(null) })}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
