'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, CheckCheck } from 'lucide-react';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { usePaginatedList } from '@/hooks/usePaginatedList';import { PageHeader } from '@/components/common/PageHeader/PageHeader';
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
  const list = usePaginatedList<Notification>('notifications', '/notifications', extra, {
    refetchInterval: 60_000,
  });

  const allRead = list.rows.length > 0 && list.rows.every((n) => Boolean(n.readAt));

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`, {}),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueriesData({ queryKey: ['notifications'] });
      queryClient.setQueriesData<{ data: Notification[]; meta: unknown }>(
        { queryKey: ['notifications'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
          };
        },
      );
      return { previous };
    },
    onError: (e, _id, context) => {
      for (const [key, data] of (context?.previous ?? []) as Array<[never, never]>) {
        queryClient.setQueryData(key, data);
      }
      toast.error(getApiMessage(e, 'Operation failed.'));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onSuccess: () => {
      toast.success('Marked as read.');
    },
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
            <p className="font-medium">{n.title} {!n.readAt ? <Badge variant="success" className="ml-1">new</Badge> : null}</p>
            {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
          </div>
        );
      },
    },
    { header: 'Received', accessorKey: 'createdAt', cell: ({ row }) => formatDateTime(row.original.createdAt) },
    {
      header: 'Status', id: 'status',
      cell: ({ row }) => {
        const n = row.original;
        return n.readAt ? (
          <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium" aria-label="Read">
            <CheckCheck className="h-4 w-4" aria-hidden="true" /> Read
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">Unread</span>
        );
      },
    },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => {
        const n = row.original;
        if (n.readAt) return null;
        return (
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
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
        actions={
          <Button
            size="sm"
            variant="outline"
            pending={readAll.isPending}
            onClick={() => readAll.mutate()}
            disabled={allRead || readAll.isPending}
          >
            {allRead ? (
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            {' '}
            {allRead ? 'All read' : 'Mark all read'}
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
