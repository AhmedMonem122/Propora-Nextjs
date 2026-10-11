'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { normalizeList } from '@/lib/list';
import { useAuth } from '@/lib/auth-context';
import { useCreateEntity, useDeleteEntity, useUpdateEntity } from '@/hooks/useEntityMutations';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { UnitForm } from '@/components/domain/units/UnitForm/UnitForm';
import type { Building, Unit } from '@/types/api';

export default function BuildingDetailPage({ params }: { params: Promise<{ id: string }> }): React.JSX.Element {
  const { id } = use(params);
  const { can } = useAuth();

  const bQ = useQuery({
    queryKey: qk.building(id),
    queryFn: async () => (await apiClient.get(`/buildings/${id}`)).data as Building,
  });
  const unitsQ = useQuery({
    queryKey: qk.units({ buildingId: id }),
    queryFn: async () => normalizeList<Unit>((await apiClient.get(`/buildings/${id}/units`)).data),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState<Unit | null>(null);

  const create = useCreateEntity<Record<string, unknown>>(`/buildings/${id}/units`, [qk.units({ buildingId: id })]);
  const update = useUpdateEntity<Record<string, unknown>>((uid) => `/units/${uid}`, [qk.units({ buildingId: id })]);
  const remove = useDeleteEntity((uid) => `/units/${uid}`, [qk.units({ buildingId: id })]);

  if (bQ.isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (bQ.error || !bQ.data) return <ErrorState onRetry={() => void bQ.refetch()} />;

  const b = bQ.data;

  return (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/buildings">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Buildings
        </Link>
      </Button>
      <PageHeader
        title={b.name}
        description={[b.code ? `Code ${b.code}` : null, b.address].filter(Boolean).join(' · ')}
        onReload={() => {
          void bQ.refetch();
          void unitsQ.refetch();
        }}
        reloading={bQ.isFetching}
        actions={
          can('unit:create') ? (
            <Button size="sm" variant="accent" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New unit
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardContent className="grid gap-2 p-5 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Floors: </span>{b.totalFloors ?? '—'}</p>
          <p><span className="text-muted-foreground">Status: </span><StatusBadge value={b.status} /></p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">Description: </span>{b.description ?? '—'}</p>
        </CardContent>
      </Card>
      <DataTable
        columns={[
          { header: 'Name', accessorKey: 'name', cell: ({ row }) => <span className="font-medium">{(row.original as Unit).name}</span> },
          { header: 'Number', accessorKey: 'unitNumber', cell: ({ row }) => (row.original as Unit).unitNumber ?? '—' },
          { header: 'Rent', accessorKey: 'rentAmount', cell: ({ row }) => (row.original as Unit).rentAmount?.toLocaleString('en-EG') ?? '—' },
          { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={(row.original as Unit).status} /> },
          {
            header: 'Actions', id: 'actions',
            cell: ({ row }) => {
              const u = row.original as Unit;
              return (
                <div className="flex gap-1">
                  {can('unit:update') ? (
                    <Button variant="ghost" size="icon" aria-label={`Edit ${u.name}`} onClick={() => { setEditing(u); setOpen(true); }}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                  {can('unit:delete') ? (
                    <Button variant="ghost" size="icon" aria-label={`Delete ${u.name}`} onClick={() => setDeleting(u)}>
                      <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              );
            },
          },
        ]}
        data={unitsQ.data?.rows ?? []}
        meta={unitsQ.data?.meta}
        page={1}
        onPageChange={() => undefined}
        isLoading={unitsQ.isLoading}
        isFetching={unitsQ.isFetching}
        error={unitsQ.error}
        onRetry={() => void unitsQ.refetch()}
        getRowId={(r) => (r as Unit).id}
      />
      <UnitForm
        open={open} onOpenChange={setOpen} initial={editing} pending={create.isPending || update.isPending}
        onSubmit={(body) => {
          if (editing) update.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) });
          else create.mutate(body, { onSuccess: () => setOpen(false) });
        }}
      />
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(v) => { if (!v) setDeleting(null); }} pending={remove.isPending}
        onConfirm={() => { if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }} />
    </>
  );
}
