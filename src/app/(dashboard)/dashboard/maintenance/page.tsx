'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useCreateEntity, useDeleteEntity, useUpdateEntity } from '@/hooks/useEntityMutations';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/Select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField } from '@/components/common/FormField/FormField';
import { MaintenanceForm } from '@/components/domain/maintenance/MaintenanceForm/MaintenanceForm';
import { formatDateOnly } from '@/lib/format';
import type { MaintenanceRequest } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';

export default function MaintenancePage(): React.JSX.Element {
  const { can } = useAuth();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const extra = useMemo(
    () => ({ ...(status ? { status } : {}), ...(priority ? { priority } : {}) }),
    [status, priority],
  );
  const list = usePaginatedList<MaintenanceRequest>('maintenance', '/maintenance/requests', extra);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRequest | null>(null);
  const [deleting, setDeleting] = useState<MaintenanceRequest | null>(null);
  const [viewing, setViewing] = useState<MaintenanceRequest | null>(null);
  const [assigning, setAssigning] = useState<MaintenanceRequest | null>(null);
  const [assigneeId, setAssigneeId] = useState('');

  const create = useCreateEntity<Record<string, unknown>>('/maintenance/requests', [['maintenance']]);
  const update = useUpdateEntity<Record<string, unknown>>((id) => `/maintenance/requests/${id}`, [['maintenance']]);
  const remove = useDeleteEntity((id) => `/maintenance/requests/${id}`, [['maintenance']]);

  const act = useMutation({
    mutationFn: ({ id, kind, body }: { id: string; kind: 'assign' | 'resolve' | 'status'; body?: Record<string, unknown> }) => {
      if (kind === 'assign') return apiClient.post(`/maintenance/requests/${id}/assign`, body);
      if (kind === 'resolve') return apiClient.post(`/maintenance/requests/${id}/resolve`, body);
      return apiClient.patch(`/maintenance/requests/${id}/status`, body);
    },
    onSuccess: () => {
      toast.success('Updated successfully.');
      void queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const columns = useMemo<ColumnDef<MaintenanceRequest>[]>(() => [
    { header: 'Title', accessorKey: 'title', cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
    { header: 'Priority', accessorKey: 'priority', cell: ({ row }) => <StatusBadge value={row.original.priority} /> },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    { header: 'Opened', accessorKey: 'createdAt', cell: ({ row }) => formatDateOnly(row.original.createdAt) },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" aria-label={`View ${m.title}`} onClick={() => setViewing(m)}>
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
            {can('maintenance:update') ? (
              <>
                <Button variant="ghost" size="icon" aria-label={`Edit ${m.title}`} onClick={() => { setEditing(m); setFormOpen(true); }}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Assign ${m.title}`} onClick={() => { setAssigning(m); setAssigneeId(m.assignedToId ?? ''); }}>
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                </Button>
              </>
            ) : null}
            {can('maintenance:delete') ? (
              <Button variant="ghost" size="icon" aria-label={`Delete ${m.title}`} onClick={() => setDeleting(m)}>
                <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ], [can]);

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Requests, priorities and resolution flow."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
        actions={
          can('maintenance:create') ? (
            <Button size="sm" variant="accent" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New request
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Maintenance filters">
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44" aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priority || 'all'} onValueChange={(v) => setPriority(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40" aria-label="Filter by priority"><SelectValue placeholder="All priorities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns} data={list.rows} meta={list.meta} page={list.page} onPageChange={list.setPage}
        isLoading={list.isLoading} isFetching={list.isFetching} error={list.error} onRetry={list.refetch}
        getRowId={(r) => r.id}
      />
      <MaintenanceForm
        open={formOpen} onOpenChange={setFormOpen} initial={editing} pending={create.isPending || update.isPending}
        onSubmit={(body) => {
          if (editing) update.mutate({ id: editing.id, body }, { onSuccess: () => setFormOpen(false) });
          else create.mutate(body, { onSuccess: () => setFormOpen(false) });
        }}
      />
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(v) => { if (!v) setDeleting(null); }} pending={remove.isPending}
        onConfirm={() => { if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }} />
      <Dialog open={Boolean(viewing)} onOpenChange={(v) => { if (!v) setViewing(null); }}>
        <DialogContent aria-label="Request details">
          <DialogHeader><DialogTitle>{viewing?.title}</DialogTitle></DialogHeader>
          {viewing ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{viewing.description ?? 'No description.'}</p>
              <div className="flex gap-2">
                <StatusBadge value={viewing.priority} />
                <StatusBadge value={viewing.status} />
              </div>
              {can('maintenance:update') ? (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Change request status">
                  {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((s) => (
                    <Button
                      key={s} size="sm" variant={viewing.status === s ? 'default' : 'outline'} pending={act.isPending}
                      onClick={() => act.mutate({ id: viewing.id, kind: 'status', body: { status: s } }, { onSuccess: () => setViewing(null) })}
                    >
                      {s.replace('_', ' ')}
                    </Button>
                  ))}
                  <Button
                    size="sm" variant="accent" pending={act.isPending}
                    onClick={() => act.mutate({ id: viewing.id, kind: 'resolve' }, { onSuccess: () => setViewing(null) })}
                  >
                    Resolve
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(assigning)} onOpenChange={(v) => { if (!v) setAssigning(null); }}>
        <DialogContent aria-label="Assign request">
          <DialogHeader><DialogTitle>Assign technician</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <FormField label="Assignee user ID" htmlFor="m-assign">
              <Input id="m-assign" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} placeholder="User id from the Users page" />
            </FormField>
            <DialogFooter>
              <Button
                pending={act.isPending}
                disabled={!assigneeId}
                onClick={() => {
                  if (assigning) act.mutate({ id: assigning.id, kind: 'assign', body: { assignedToId: assigneeId } }, { onSuccess: () => setAssigning(null) });
                }}
              >
                Assign
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
