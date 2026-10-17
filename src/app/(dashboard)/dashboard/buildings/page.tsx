'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { BuildingForm } from '@/components/domain/buildings/BuildingForm/BuildingForm';
import type { Building, Property } from '@/types/api';

export default function BuildingsPage(): React.JSX.Element {
  const { can } = useAuth();
  const [propertyId, setPropertyId] = useState('');
  const [search, setSearch] = useState('');

  const propsQ = useQuery({
    queryKey: qk.properties({ limit: 100 }),
    queryFn: async () => normalizeList<Property>((await apiClient.get('/properties', { params: { limit: 100 } })).data),
    staleTime: 60_000,
  });

  const listQ = useQuery({
    queryKey: qk.buildings({ propertyId }),
    queryFn: async () => normalizeList<Building>((await apiClient.get(`/properties/${propertyId}/buildings`)).data),
    enabled: Boolean(propertyId),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [deleting, setDeleting] = useState<Building | null>(null);

  const create = useCreateEntity<Record<string, unknown>>(
    propertyId ? `/properties/${propertyId}/buildings` : '/properties/__/buildings',
    [qk.buildings({ propertyId })],
  );
  const update = useUpdateEntity<Record<string, unknown>>((id) => `/buildings/${id}`, [qk.buildings({ propertyId })]);
  const remove = useDeleteEntity((id) => `/buildings/${id}`, [qk.buildings({ propertyId })]);

  return (
    <>
      <PageHeader
        title="Buildings"
        description="Pick a property to manage its buildings."
        searchValue={search}
        onSearchChange={setSearch}
        onReload={() => void listQ.refetch()}
        reloading={listQ.isFetching}
        actions={
          can('building:create') && propertyId ? (
            <Button size="sm" variant="accent" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New building
            </Button>
          ) : undefined
        }
      />
      <div className="max-w-sm">
        <Select value={propertyId || 'none'} onValueChange={(v) => setPropertyId(v === 'none' ? '' : v)}>
          <SelectTrigger aria-label="Choose property">
            <SelectValue placeholder="Choose a property…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Choose a property…</SelectItem>
            {(propsQ.data?.rows ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!propertyId ? (
        <EmptyState title="Select a property" body="Buildings live under a property — choose one above to continue." />
      ) : (
        <DataTable
          columns={[
            {
              header: 'Name', accessorKey: 'name',
              cell: ({ row }) => (
                <Link href={`/dashboard/buildings/${row.original.id}`} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                  {row.original.name}
                </Link>
              ),
            },
            { header: 'Code', accessorKey: 'code', cell: ({ row }) => (row.original as Building).code ?? '—' },
            { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={(row.original as Building).status} /> },
            {
              header: 'Actions', id: 'actions',
              cell: ({ row }) => {
                const b = row.original as Building;
                return (
                  <div className="flex gap-1">
                    {can('building:update') ? (
                      <Button variant="ghost" size="icon" aria-label={`Edit ${b.name}`} onClick={() => { setEditing(b); setOpen(true); }}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    ) : null}
                    {can('building:delete') ? (
                      <Button variant="ghost" size="icon" aria-label={`Delete ${b.name}`} onClick={() => setDeleting(b)}>
                        <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                );
              },
            },
          ]}
          data={
            (listQ.data?.rows ?? []).filter((b) => {
              const term = search.toLowerCase();
              const bb = b as Building;
              return bb.name?.toLowerCase().includes(term) || bb.code?.toLowerCase().includes(term);
            })
          }
          meta={listQ.data?.meta}
          page={1}
          onPageChange={() => undefined}
          isLoading={listQ.isLoading}
          isFetching={listQ.isFetching}
          error={listQ.error}
          onRetry={() => void listQ.refetch()}
          getRowId={(r) => (r as Building).id}
        />
      )}
      <BuildingForm
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
