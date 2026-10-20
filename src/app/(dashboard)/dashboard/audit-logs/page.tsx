'use client';

import { useMemo } from 'react';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useUrlState } from '@/hooks/useUrlState';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { Input } from '@/components/ui/Input/Input';
import { formatDateTime } from '@/lib/format';
import type { AuditLog } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';

export default function AuditLogsPage(): React.JSX.Element {
  const [action, setAction] = useUrlState('action');
  const [entityType, setEntityType] = useUrlState('entityType');
  const [from, setFrom] = useUrlState('from');
  const [to, setTo] = useUrlState('to');
  const extra = useMemo(
    () => ({
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }),
    [action, entityType, from, to],
  );
  const list = usePaginatedList<AuditLog>('audit-logs', '/audit-logs', extra);

  const columns = useMemo<ColumnDef<AuditLog>[]>(() => [
    { header: 'Action', accessorKey: 'action', cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.action}</span> },
    { header: 'Entity', accessorKey: 'entityType', cell: ({ row }) => <span className="font-mono text-xs">{row.original.entityType ?? '—'} · {(row.original.entityId ?? '').slice(0, 8)}</span> },
    { header: 'User', accessorKey: 'userId', cell: ({ row }) => <span className="font-mono text-xs">{(row.original.userId ?? '').slice(0, 8) || '—'}</span> },
    { header: 'When', accessorKey: 'createdAt', cell: ({ row }) => formatDateTime(row.original.createdAt) },
  ], []);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Read-only trail of every change."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
      />
      <div className="flex flex-wrap items-end gap-2" role="group" aria-label="Audit filters">
        <label className="text-xs">
          <span className="mb-1 block font-medium">Action</span>
          <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. lease.create" className="w-44" />
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-medium">Entity type</span>
          <Input value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="e.g. lease" className="w-40" />
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-medium">From</span>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-medium">To</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
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
