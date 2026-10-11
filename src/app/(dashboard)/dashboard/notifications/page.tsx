'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, CheckCheck } from 'lucide-react';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatDateTime } from '@/lib/format';
import type { Notification } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';

export default function NotificationsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const extra = useMemo(() => (unreadOnly ? { unreadOnly: true } : {}), [unreadOnly]);
  const list = usePaginatedList<Notification>('notifications', '/notifications', extra);

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      toast.success('Updated successfully.');
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const readAll = useMutation({
    mutationFn: () => apiClient.post('/notifications/read-all', {}),
    onSuccess: () => {
      toast.success('Updated successfully.');
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const columns = useMemo<ColumnDef<Notification>[]>(() => [
    {
      header: 'Notification', accessorKey: 'title',
      cell: ({ row }) => {
        const n = row.original;
        return (
          <div>
            <p className="font-medium">{n.title} {!n.read ? <Badge variant="success" className="ml-1">new</Badge> : null}</p>
            {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
          </div>
        );
      },
    },
    { header: 'Received', accessorKey: 'createdAt', cell: ({ row }) => formatDateTime(row.original.createdAt) },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => {
        const n = row.original;
        return n.read ? null : (
          <Button variant="ghost" size="sm" pending={markRead.isPending} onClick={() => markRead.mutate(n.id)}>
            <Check className="h-4 w-4" aria-hidden="true" /> Mark read
          </Button>
        );
      },
    },
  ], [markRead]);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Realtime inbox — updates without refresh."
        onReload={list.refetch}
        reloading={list.isFetching}
        actions={
          <Button size="sm" variant="outline" pending={readAll.isPending} onClick={() => readAll.mutate()}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" /> Mark all read
          </Button>
        }
      />
      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Unread only
        </label>
      </div>
      <DataTable
        columns={columns} data={list.rows} meta={list.meta} page={list.page} onPageChange={list.setPage}
        isLoading={list.isLoading} isFetching={list.isFetching} error={list.error} onRetry={list.refetch}
        getRowId={(r) => r.id}
      />
    </>
  );
}
