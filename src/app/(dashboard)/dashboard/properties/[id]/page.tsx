'use client';

import { use, useMemo, useState } from 'react';
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
import { BuildingPicker } from '@/components/common/EntityPicker/pickers';
import { formatMoney } from '@/lib/format';
import { FormField } from '@/components/common/FormField/FormField';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { BuildingForm } from '@/components/domain/buildings/BuildingForm/BuildingForm';
import { UnitForm } from '@/components/domain/units/UnitForm/UnitForm';
import type { Building, Property, Unit } from '@/types/api';
import type { ColumnDef } from '@tanstack/react-table';

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }): React.JSX.Element {
  const { id } = use(params);
  const { can } = useAuth();

  const prop = useQuery({
    queryKey: qk.property(id),
    queryFn: async () => (await apiClient.get(`/properties/${id}`)).data as Property,
  });
  const buildingsQ = useQuery({
    queryKey: qk.buildings({ propertyId: id }),
    queryFn: async () => normalizeList<Building>((await apiClient.get(`/properties/${id}/buildings`)).data),
  });
  const unitsQ = useQuery({
    queryKey: qk.units({ propertyId: id }),
    queryFn: async () => normalizeList<Unit>((await apiClient.get(`/properties/${id}/units`)).data),
  });

  const [bOpen, setBOpen] = useState(false);
  const [bEdit, setBEdit] = useState<Building | null>(null);
  const [bDel, setBDel] = useState<Building | null>(null);
  const [uOpen, setUOpen] = useState(false);
  const [uEdit, setUEdit] = useState<Unit | null>(null);
  const [uBuildingId, setUBuildingId] = useState<string>('');
  const [uDel, setUDel] = useState<Unit | null>(null);

  const createB = useCreateEntity<Record<string, unknown>>(`/properties/${id}/buildings`, [qk.buildings({ propertyId: id })]);
  const updateB = useUpdateEntity<Record<string, unknown>>((bid) => `/buildings/${bid}`, [qk.buildings({ propertyId: id })]);
  const deleteB = useDeleteEntity((bid) => `/buildings/${bid}`, [qk.buildings({ propertyId: id })]);
  const createU = useCreateEntity<Record<string, unknown>>(
    uEdit && uEdit.buildingId ? `/buildings/${uEdit.buildingId}/units` : `/buildings/${uBuildingId}/units`,
    [qk.units({ propertyId: id })],
  );
  const updateU = useUpdateEntity<Record<string, unknown>>((uid) => `/units/${uid}`, [qk.units({ propertyId: id })]);
  const deleteU = useDeleteEntity((uid) => `/units/${uid}`, [qk.units({ propertyId: id })]);

  const bCols = useMemo<ColumnDef<Building>[]>(() => [
    {
      header: 'Name', accessorKey: 'name',
      cell: ({ row }) => (
        <Link href={`/dashboard/buildings/${row.original.id}`} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
          {row.original.name}
        </Link>
      ),
    },
    { header: 'Code', accessorKey: 'code', cell: ({ row }) => row.original.code ?? '—' },
    { header: 'Floors', accessorKey: 'totalFloors', cell: ({ row }) => row.original.totalFloors ?? '—' },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {can('building:update') ? (
            <Button variant="ghost" size="icon" aria-label={`Edit ${row.original.name}`} onClick={() => { setBEdit(row.original); setBOpen(true); }}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          {can('building:delete') ? (
            <Button variant="ghost" size="icon" aria-label={`Delete ${row.original.name}`} onClick={() => setBDel(row.original)}>
              <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ], [can]);

  const uCols = useMemo<ColumnDef<Unit>[]>(() => [
    { header: 'Name', accessorKey: 'name', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { header: 'Number', accessorKey: 'unitNumber', cell: ({ row }) => row.original.unitNumber ?? '—' },
    { header: 'Rent', accessorKey: 'rentAmount', cell: ({ row }) => formatMoney(row.original.rentAmount) },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {can('unit:update') ? (
            <Button variant="ghost" size="icon" aria-label={`Edit ${row.original.name}`} onClick={() => { setUEdit(row.original); setUBuildingId(row.original.buildingId ?? ''); setUOpen(true); }}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          {can('unit:delete') ? (
            <Button variant="ghost" size="icon" aria-label={`Delete ${row.original.name}`} onClick={() => setUDel(row.original)}>
              <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ], [can]);

  if (prop.isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (prop.error || !prop.data) return <ErrorState onRetry={() => void prop.refetch()} />;

  const p = prop.data;

  return (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/properties">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Properties
        </Link>
      </Button>
      <PageHeader
        title={p.name}
        description={[p.type?.replace(/_/g, ' '), p.city, p.country].filter(Boolean).join(' · ')}
        onReload={() => {
          void prop.refetch();
          void buildingsQ.refetch();
          void unitsQ.refetch();
        }}
        reloading={prop.isFetching}
      />
      <Card>
        <CardContent className="grid gap-2 p-5 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Address: </span>{[p.addressLine1, p.addressLine2].filter(Boolean).join(', ') || '—'}</p>
          <p><span className="text-muted-foreground">City: </span>{p.city ?? '—'}</p>
          <p><span className="text-muted-foreground">Status: </span><StatusBadge value={p.status} /></p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">Description: </span>{p.description ?? '—'}</p>
        </CardContent>
      </Card>

      <section className="space-y-3" aria-label="Buildings">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Buildings</h2>
          {can('building:create') ? (
            <Button size="sm" variant="accent" onClick={() => { setBEdit(null); setBOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New building
            </Button>
          ) : null}
        </div>
        <DataTable columns={bCols} data={buildingsQ.data?.rows ?? []} meta={buildingsQ.data?.meta} page={1} onPageChange={() => undefined}
          isLoading={buildingsQ.isLoading} isFetching={buildingsQ.isFetching} error={buildingsQ.error} onRetry={() => void buildingsQ.refetch()} getRowId={(r) => r.id} />
      </section>

      <section className="space-y-3" aria-label="Units">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Units in this property</h2>
          {can('unit:create') ? (
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                setUEdit(null);
                setUBuildingId('');
                setUOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> New unit
            </Button>
          ) : null}
        </div>
        <DataTable columns={uCols} data={unitsQ.data?.rows ?? []} meta={unitsQ.data?.meta} page={1} onPageChange={() => undefined}
          isLoading={unitsQ.isLoading} isFetching={unitsQ.isFetching} error={unitsQ.error} onRetry={() => void unitsQ.refetch()} getRowId={(r) => r.id} />
      </section>

      <BuildingForm
        open={bOpen} onOpenChange={setBOpen} initial={bEdit} pending={createB.isPending || updateB.isPending}
        onSubmit={(body) => {
          if (bEdit) updateB.mutate({ id: bEdit.id, body }, { onSuccess: () => setBOpen(false) });
          else createB.mutate(body, { onSuccess: () => setBOpen(false) });
        }}
      />
      <UnitForm
        open={uOpen} onOpenChange={setUOpen} initial={uEdit} pending={createU.isPending || updateU.isPending}
        buildingSlot={
          !uEdit ? (
            <FormField label="Building" htmlFor="pu-building">
              <BuildingPicker
                id="pu-building"
                propertyId={id}
                value={uBuildingId || null}
                onChange={(bid) => setUBuildingId(bid ?? '')}
              />
            </FormField>
          ) : undefined
        }
        onSubmit={(body) => {
          if (uEdit) {
            updateU.mutate({ id: uEdit.id, body }, { onSuccess: () => setUOpen(false) });
          } else {
            if (!uBuildingId) return;
            createU.mutate(body, { onSuccess: () => setUOpen(false) });
          }
        }}
      />
      <ConfirmDialog open={Boolean(bDel)} onOpenChange={(v) => { if (!v) setBDel(null); }} pending={deleteB.isPending}
        onConfirm={() => { if (bDel) deleteB.mutate(bDel.id, { onSuccess: () => setBDel(null) }); }} />
      <ConfirmDialog open={Boolean(uDel)} onOpenChange={(v) => { if (!v) setUDel(null); }} pending={deleteU.isPending}
        onConfirm={() => { if (uDel) deleteU.mutate(uDel.id, { onSuccess: () => setUDel(null) }); }} />
    </>
  );
}
