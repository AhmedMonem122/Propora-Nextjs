'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useCreateEntity, useDeleteEntity, useUpdateEntity } from '@/hooks/useEntityMutations';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { Button } from '@/components/ui/Button/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/Select';
import { PropertyForm } from '@/components/domain/properties/PropertyForm/PropertyForm';
import { propertyColumns } from './columns';
import type { Property } from '@/types/api';

export default function PropertiesPage(): React.JSX.Element {
  const { can } = useAuth();
  const canCreate = can('property:create');
  const canUpdate = can('property:update');
  const canDelete = can('property:delete');

  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const extra = useMemo(
    () => ({ ...(type ? { type } : {}), ...(status ? { status } : {}) }),
    [type, status],
  );
  const list = usePaginatedList<Property>('properties', '/properties', extra);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<Property | null>(null);

  const create = useCreateEntity<Record<string, unknown>>('/properties', [['properties']]);
  const update = useUpdateEntity<Record<string, unknown>>((id) => `/properties/${id}`, [['properties']]);
  const remove = useDeleteEntity((id) => `/properties/${id}`, [['properties']]);

  const columns = useMemo(
    () =>
      propertyColumns({
        canUpdate,
        canDelete,
        onEdit: (p) => {
          setEditing(p);
          setFormOpen(true);
        },
        onDelete: setDeleting,
      }),
    [canUpdate, canDelete],
  );

  return (
    <>
      <PageHeader
        title="Properties"
        description="Your portfolio at a glance."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
        actions={
          canCreate ? (
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> New property
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Property filters">
        <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44" aria-label="Filter by type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="RESIDENTIAL">Residential</SelectItem>
            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
            <SelectItem value="MIXED_USE">Mixed use</SelectItem>
            <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
            <SelectItem value="LAND">Land</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={list.rows}
        meta={list.meta}
        page={list.page}
        onPageChange={list.setPage}
        isLoading={list.isLoading}
        isFetching={list.isFetching}
        error={list.error}
        onRetry={list.refetch}
        getRowId={(r) => r.id}
      />
      <PropertyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        pending={create.isPending || update.isPending}
        onSubmit={(body) => {
          if (editing) {
            update.mutate(
              { id: editing.id, body },
              { onSuccess: () => setFormOpen(false) },
            );
          } else {
            create.mutate(body, { onSuccess: () => setFormOpen(false) });
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => {
          if (!v) setDeleting(null);
        }}
        pending={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
        }}
      />
    </>
  );
}
