'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { StatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import type { Property } from '@/types/api';

export function propertyColumns(opts: {
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (p: Property) => void;
  onDelete: (p: Property) => void;
}): ColumnDef<Property>[] {
  return [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <Link href={`/dashboard/properties/${row.original.id}`} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
          {row.original.name}
        </Link>
      ),
    },
    { header: 'Type', accessorKey: 'type', cell: ({ row }) => row.original.type?.replace(/_/g, ' ') ?? '—' },
    { header: 'City', accessorKey: 'city', cell: ({ row }) => row.original.city ?? '—' },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {opts.canUpdate ? (
            <Button variant="ghost" size="icon" onClick={() => opts.onEdit(row.original)} aria-label={`Edit ${row.original.name}`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          {opts.canDelete ? (
            <Button variant="ghost" size="icon" onClick={() => opts.onDelete(row.original)} aria-label={`Delete ${row.original.name}`}>
              <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];
}
