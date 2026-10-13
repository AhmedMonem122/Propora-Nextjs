'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Download, ExternalLink, Eye, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { downloadBlob } from '@/lib/csv';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useDeleteEntity, useUpdateEntity } from '@/hooks/useEntityMutations';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import { formatDateOnly, formatMoney } from '@/lib/format';
import type { Payment } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';

const editPaymentSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'FAILED', 'REFUNDED']).optional(),
  notes: z.string().max(1000, 'Notes are too long.').optional(),
});

export default function PaymentsPage(): React.JSX.Element {
  const { can } = useAuth();
  const canUpdate = can('payment:update');
  const canDelete = can('payment:delete');
  const [editError, setEditError] = useState<string | null>(null);

  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [overdue, setOverdue] = useState('');
  const extra = useMemo(
    () => ({ ...(status ? { status } : {}), ...(type ? { type } : {}), ...(overdue ? { overdue: overdue === 'yes' } : {}) }),
    [status, type, overdue],
  );
  const list = usePaginatedList<Payment>('payments', '/payments', extra);

  const [editing, setEditing] = useState<Payment | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [viewing, setViewing] = useState<Payment | null>(null);

  const update = useUpdateEntity<Record<string, unknown>>((id) => `/payments/${id}`, [['payments']]);
  const remove = useDeleteEntity((id) => `/payments/${id}`, [['payments']]);

  const checkout = useMutation({
    mutationFn: async (id: string) => (await apiClient.post(`/payments/${id}/checkout`, {})).data as { checkoutUrl?: string },
    onSuccess: (d) => {
      if (d?.checkoutUrl) window.location.href = d.checkoutUrl;
      else toast.error('No checkout URL returned.');
    },
    onError: (e) => toast.error(getApiMessage(e, 'Checkout failed.')),
  });

  const invoice = useMutation({
    mutationFn: async (p: Payment) => {
      const res = await apiClient.get(`/payments/${p.id}/invoice`, { responseType: 'blob' });
      downloadBlob(`invoice-${p.invoiceNo ?? p.id.slice(0, 8)}.pdf`, res.data as Blob);
    },
    onSuccess: () => toast.success('Invoice downloaded.'),
    onError: (e) => toast.error(getApiMessage(e, 'Invoice download failed.')),
  });

  const columns = useMemo<ColumnDef<Payment>[]>(() => [
    { header: 'Invoice', accessorKey: 'invoiceNo', cell: ({ row }) => <span className="font-mono text-xs">{row.original.invoiceNo ?? row.original.id.slice(0, 8)}</span> },
    { header: 'Amount', accessorKey: 'amount', cell: ({ row }) => <span className="font-semibold">{formatMoney(row.original.amount, row.original.currency ?? 'EGP')}</span> },
    { header: 'Type', accessorKey: 'type', cell: ({ row }) => row.original.type ?? '—' },
    { header: 'Due', accessorKey: 'dueDate', cell: ({ row }) => formatDateOnly(row.original.dueDate) },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" aria-label="View payment" onClick={() => setViewing(p)}>
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Download invoice" pending={invoice.isPending} onClick={() => invoice.mutate(p)}>
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
            {canUpdate ? (
              <Button variant="ghost" size="icon" aria-label="Edit payment" onClick={() => { setEditing(p); setEditStatus(p.status ?? ''); }}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="ghost" size="icon" aria-label="Delete payment" onClick={() => setDeleting(p)}>
                <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ], [canUpdate, canDelete, invoice]);

  return (
    <>
      <PageHeader
        title="Payments"
        description="Billing, checkout and invoices."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Payment filters">
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40" aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {['PENDING', 'PAID', 'OVERDUE', 'FAILED', 'REFUNDED'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36" aria-label="Filter by type"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {['RENT', 'DEPOSIT', 'FEE', 'OTHER'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={overdue || 'all'} onValueChange={(v) => setOverdue(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36" aria-label="Filter overdue"><SelectValue placeholder="Overdue?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Overdue</SelectItem>
            <SelectItem value="no">Not overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns} data={list.rows} meta={list.meta} page={list.page} onPageChange={list.setPage}
        isLoading={list.isLoading} isFetching={list.isFetching} error={list.error} onRetry={list.refetch}
        getRowId={(r) => r.id}
      />
      <Dialog open={Boolean(viewing)} onOpenChange={(v) => { if (!v) setViewing(null); }}>
        <DialogContent aria-label="Payment details">
          <DialogHeader><DialogTitle>Payment details</DialogTitle></DialogHeader>
          {viewing ? (
            <div className="space-y-3 text-sm">
              <dl className="grid grid-cols-2 gap-3">
                <div><dt className="text-muted-foreground">Amount</dt><dd className="font-semibold">{formatMoney(viewing.amount, viewing.currency ?? 'EGP')}</dd></div>
                <div><dt className="text-muted-foreground">Status</dt><dd><StatusBadge value={viewing.status} /></dd></div>
                <div><dt className="text-muted-foreground">Due</dt><dd>{formatDateOnly(viewing.dueDate)}</dd></div>
                <div><dt className="text-muted-foreground">Paid at</dt><dd>{formatDateOnly(viewing.paidAt)}</dd></div>
                <div className="col-span-2"><dt className="text-muted-foreground">Notes</dt><dd>{viewing.notes ?? '—'}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                {can('payment:create') ? (
                  <Button size="sm" variant="accent" pending={checkout.isPending} onClick={() => checkout.mutate(viewing.id)}>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> Pay online
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" pending={invoice.isPending} onClick={() => invoice.mutate(viewing)}>
                  <Download className="h-4 w-4" aria-hidden="true" /> Invoice PDF
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editing)} onOpenChange={(v) => { if (!v) setEditing(null); }}>
        <DialogContent aria-label="Edit payment">
          <DialogHeader><DialogTitle>Edit payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <FormField label="Status" htmlFor="pe-status">
              <FormSelect id="pe-status" value={editStatus} onChange={(e) => { setEditStatus(e.target.value); setEditError(null); }}>
                <option value="">—</option>
                {['PENDING', 'PAID', 'OVERDUE', 'FAILED', 'REFUNDED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
            </FormField>
            <FormField label="Notes" htmlFor="pe-notes" error={editError ?? undefined}>
              <Input id="pe-notes" defaultValue={editing?.notes ?? ''} onChange={(e) => editing && setEditing({ ...editing, notes: e.target.value })} />
            </FormField>
            <DialogFooter>
              <Button
                pending={update.isPending}
                onClick={() => {
                  if (!editing) return;
                  const parsed = editPaymentSchema.safeParse({
                    status: editStatus === '' ? undefined : editStatus,
                    notes: editing.notes ?? undefined,
                  });
                  if (!parsed.success) {
                    setEditError(parsed.error.issues[0]?.message ?? 'Invalid values.');
                    return;
                  }
                  setEditError(null);
                  update.mutate(
                    { id: editing.id, body: { status: parsed.data.status, notes: parsed.data.notes } },
                    { onSuccess: () => setEditing(null) },
                  );
                }}
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
