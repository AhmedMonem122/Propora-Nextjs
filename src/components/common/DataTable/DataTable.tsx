'use client';

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table/Table';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import type { PaginatedMeta } from '@/types/api';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  meta?: PaginatedMeta | null;
  page: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyBody?: string;
  getRowId?: (row: TData) => string;
}

/** Generic server-paginated table. Never animates rows; skeletons match layout. */
export function DataTable<TData>({
  columns,
  data,
  meta,
  page,
  onPageChange,
  isLoading,
  isFetching,
  error,
  onRetry,
  emptyTitle,
  emptyBody,
  getRowId,
}: DataTableProps<TData>): React.JSX.Element {
  const t = useTranslations('common');
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId as ((originalRow: TData, index: number) => string) | undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label={t('loading')}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) return <ErrorState onRetry={onRetry} />;

  if (data.length === 0) return <EmptyState title={emptyTitle} body={emptyBody} />;

  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? data.length;

  return (
    <div className="space-y-3">
      {isFetching ? (
        <div className="h-1 overflow-hidden rounded-full bg-muted" role="status" aria-label={t('loading')}>
          <div className="h-full w-1/3 animate-pulse rounded-full bg-emerald-500" />
        </div>
      ) : (
        <div className="h-1" aria-hidden="true" />
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id} scope="col">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p role="status">
          {t('showing')} {data.length} {t('of')} {total}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label={t('previous')}>
            <ChevronLeft className="h-4 w-4" />
            {t('previous')}
          </Button>
          <span aria-live="polite" className="min-w-20 text-center">
            {t('page')} {page} / {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={meta ? !meta.hasNext : page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={t('next')}
          >
            {t('next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
