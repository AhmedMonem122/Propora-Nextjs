'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Plus, RotateCcw, Trash2, Truck, Zap } from 'lucide-react';
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField } from '@/components/common/FormField/FormField';
import { formatDateTime } from '@/lib/format';
import type { Webhook, WebhookDelivery } from '@/types/api';

const schema = z.object({
  url: z.string().url('Enter a valid URL (https recommended).'),
  events: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});
type Values = z.infer<typeof schema>;

const EVENT_CHOICES = ['payment.paid', 'maintenance.assigned', 'user.invited', 'ping'];

function isWebhookActive(w: Webhook): boolean {
  return w.isActive ?? w.active ?? true;
}

export default function WebhooksPage(): React.JSX.Element {
  const { can } = useAuth();
  const queryClient = useQueryClient();

  const listQ = useQuery({
    queryKey: qk.webhooks,
    queryFn: async () => normalizeList<Webhook>((await apiClient.get('/webhooks')).data),
  });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useUrlState('search');
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<Webhook | null>(null);
  const [deliveriesFor, setDeliveriesFor] = useState<Webhook | null>(null);

  const form = useForm<Values>({ resolver: zodResolver(schema) });

  const deliveriesQ = useQuery({
    queryKey: deliveriesFor ? qk.webhookDeliveries(deliveriesFor.id) : ['webhooks', 'none'],
    queryFn: async () => normalizeList<WebhookDelivery>((await apiClient.get(`/webhooks/${deliveriesFor?.id}/deliveries`)).data),
    enabled: Boolean(deliveriesFor),
  });

  const openFor = (w: Webhook | null): void => {
    setEditing(w);
    form.reset({ url: w?.url ?? '', events: '', isActive: isWebhookActive(w ?? ({} as Webhook)) });
    setEvents(w?.events ?? []);
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async (v: Values): Promise<unknown> => {
      // Create accepts {url, events} only; update additionally takes isActive.
      if (editing) return (await apiClient.patch(`/webhooks/${editing.id}`, { url: v.url, events, isActive: v.isActive ?? true })).data;
      return (await apiClient.post('/webhooks', { url: v.url, events })).data;
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated successfully.' : 'Created successfully.');
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: qk.webhooks });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/webhooks/${id}`),
    onSuccess: () => {
      toast.success('Deleted successfully.');
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: qk.webhooks });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const testPing = useMutation({
    mutationFn: (id: string) => apiClient.post(`/webhooks/${id}/test`, {}),
    onSuccess: () => toast.success('Test ping sent — check deliveries.'),
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const rotate = useMutation({
    mutationFn: (id: string) => apiClient.post(`/webhooks/${id}/rotate-secret`, {}),
    onSuccess: () => {
      toast.success('Secret rotated.');
      void queryClient.invalidateQueries({ queryKey: qk.webhooks });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const toggleEvent = (e: string): void => {
    setEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  };

  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Event integrations with test-ping and delivery history."
        searchValue={search}
        onSearchChange={setSearch}
        onReload={() => void listQ.refetch()}
        reloading={listQ.isFetching}
        actions={
          can('webhook:create') ? (
            <Button size="sm" variant="accent" onClick={() => openFor(null)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New webhook
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={[
          { header: 'URL', accessorKey: 'url', cell: ({ row }) => <span className="max-w-xs truncate font-mono text-xs">{(row.original as Webhook).url}</span> },
          {
            header: 'Events', accessorKey: 'events',
            cell: ({ row }) => (
              <span className="flex max-w-xs flex-wrap gap-1">
                {((row.original as Webhook).events ?? []).map((e) => <Badge key={e} variant="info">{e}</Badge>)}
              </span>
            ),
          },
          { header: 'Active', accessorKey: 'active', cell: ({ row }) => (isWebhookActive(row.original as Webhook) ? <Badge variant="success">on</Badge> : <Badge variant="secondary">off</Badge>) },
          {
            header: 'Actions', id: 'actions',
            cell: ({ row }) => {
              const w = row.original as Webhook;
              return (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Deliveries for ${w.url}`} onClick={() => setDeliveriesFor(w)}>
                    <Truck className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  {can('webhook:update') ? (
                    <>
                      <Button variant="ghost" size="icon" aria-label="Test ping" pending={testPing.isPending} onClick={() => testPing.mutate(w.id)}>
                        <Zap className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Edit ${w.url}`} onClick={() => openFor(w)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Rotate secret" pending={rotate.isPending} onClick={() => rotate.mutate(w.id)}>
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </>
                  ) : null}
                  {can('webhook:delete') ? (
                    <Button variant="ghost" size="icon" aria-label={`Delete ${w.url}`} onClick={() => setDeleting(w)}>
                      <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              );
            },
          },
        ]}
        data={(listQ.data?.rows ?? []).filter((w) => {
          const term = search.trim().toLowerCase();
          if (!term) return true;
          const hook = w as Webhook;
          return (
            hook.url.toLowerCase().includes(term) ||
            (hook.events ?? []).some((e) => e.toLowerCase().includes(term))
          );
        })}
        meta={listQ.data?.meta}
        page={1}
        onPageChange={() => undefined}
        isLoading={listQ.isLoading}
        isFetching={listQ.isFetching}
        error={listQ.error}
        onRetry={() => void listQ.refetch()}
        getRowId={(r) => (r as Webhook).id}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-label={editing ? 'Edit webhook' : 'Create webhook'}>
          <DialogHeader><DialogTitle>{editing ? 'Edit webhook' : 'New webhook'}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
            <FormField label="Target URL" htmlFor="w-url" error={form.formState.errors.url?.message}>
              <Input id="w-url" type="url" inputMode="url" placeholder="https://…" {...form.register('url')} />
            </FormField>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Events</legend>
              <div className="space-y-1.5">
                {EVENT_CHOICES.map((e) => (
                  <label key={e} className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm hover:bg-muted">
                    <input type="checkbox" checked={events.includes(e)} onChange={() => toggleEvent(e)} className="h-4 w-4 accent-emerald-600" />
                    <span className="font-mono text-xs">{e}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {editing ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" {...form.register('isActive')} className="h-4 w-4 accent-emerald-600" />
                Active
              </label>
            ) : null}
            <DialogFooter>
              <Button type="submit" pending={save.isPending}>{editing ? 'Save changes' : 'Create webhook'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deliveriesFor)} onOpenChange={(v) => { if (!v) setDeliveriesFor(null); }}>
        <DialogContent className="sm:max-w-xl" aria-label="Webhook deliveries">
          <DialogHeader><DialogTitle>Deliveries</DialogTitle></DialogHeader>
          {deliveriesQ.isLoading ? (
            <p className="text-sm text-muted-foreground" role="status">Loading…</p>
          ) : (deliveriesQ.data?.rows.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No deliveries yet — send a test ping first.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {(deliveriesQ.data?.rows ?? []).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-sm">
                  <span className="font-mono text-xs">{d.event}</span>
                  {d.success ? <Badge variant="success">{d.statusCode ?? 'ok'}</Badge> : <Badge variant="danger">{d.statusCode ?? 'failed'}</Badge>}
                  <span className="text-xs text-muted-foreground">{formatDateTime(d.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(v) => { if (!v) setDeleting(null); }} pending={remove.isPending}
        onConfirm={() => { if (deleting) remove.mutate(deleting.id); }} />
    </>
  );
}
