'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { normalizeList } from '@/lib/list';
import { useAuth } from '@/lib/auth-context';
import { useCreateEntity, useDeleteEntity, useUpdateEntity } from '@/hooks/useEntityMutations';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { Button } from '@/components/ui/Button/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/Select';
import { UnitForm } from '@/components/domain/units/UnitForm/UnitForm';
import type { Building, Property, Unit } from '@/types/api';

export default function UnitsPage(): React.JSX.Element {
  const { can } = useAuth();
  const [propertyId, setPropertyId] = useState('');
  const [buildingId, setBuildingId] = useState('');

  const propsQ = useQuery({
    queryKey: qk.properties({ limit: 100 }),
    queryFn: async () => normalizeList<Property>((await apiClient.get('/properties', { params: { limit: 100 } })).data),
    staleTime: 60_000,
  });
  const buildingsQ = useQuery({
    queryKey: qk.buildings({ propertyId }),
    queryFn: async () => normalizeList<Building>((await apiClient.get(`/properties/${propertyId}/buildings`)).data),
    enabled: Boolean(propertyId),
  });
  const unitsQ = useQuery({
    queryKey: qk.units({ buildingId }),
    queryFn: async () => normalizeList<Unit>((await apiClient.get(`/buildings/${buildingId}/units`)).data),
    enabled: Boolean(buildingId),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState<Unit | null>(null);

  const create = useCreateEntity<Record<string, unknown>>(
    buildingId ? `/buildings/${buildingId}/units` : '/buildings/__/units',
    [qk.units({ buildingId })],
  );
  const update = useUpdateEntity<Record<string, unknown>>((id) => `/units/${id}`, [qk.units({ buildingId })]);
  const remove = useDeleteEntity((id) => `/units/${id}`, [qk.units({ buildingId })]);

  return (
    <>
      <PageHeader
        title="Units"
        description="Pick a property, then a building."
        onReload={() => void unitsQ.refetch()}
        reloading={unitsQ.isFetching}
        actions={
          can('unit:create') && buildingId ? (
            <Button size="sm" variant="accent" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New unit
            </Button>
          ) : undefined
        }
      />
      <div className="flex max-w-xl flex-wrap gap-2">
        <Select value={propertyId || 'none'} onValueChange={(v) => { setPropertyId(v === 'none' ? '' : v); setBuildingId(''); }}>
          <SelectTrigger className="w-52" aria-label="Choose property">
            <SelectValue placeholder="Choose a property…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Choose a property…</SelectItem>
            {(propsQ.data?.rows ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={buildingId || 'none'} onValueChange={(v) => setBuildingId(v === 'none' ? '' : v)} disabled={!propertyId}>
          <SelectTrigger className="w-52" aria-label="Choose building">
            <SelectValue placeholder="Choose a building…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Choose a building…</SelectItem>
            {(buildingsQ.data?.rows ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!buildingId ? (
        <EmptyState title="Select a building" body="Units live under a building — choose a property and building above." />
      ) : (
        <DataTable
          columns={[
            { header: 'Name', accessorKey: 'name', cell: ({ row }) => <span className="font-medium">{(row.original as Unit).name}</span> },
            { header: 'Number', accessorKey: 'unitNumber', cell: ({ row }) => (row.original as Unit).unitNumber ?? '—' },
            { header: 'Bedrooms', accessorKey: 'bedrooms', cell: ({ row }) => (row.original as Unit).bedrooms ?? '—' },
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
      )}
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
