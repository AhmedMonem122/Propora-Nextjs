'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useUrlState } from '@/hooks/useUrlState';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { EntityPicker } from '@/components/common/EntityPicker/EntityPicker';
import type { ColumnDef } from '@tanstack/react-table';

interface OrgRole {
  id: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  members?: number;
  permissions?: string[];
}

export default function PlatformRolesPage(): React.JSX.Element {
  const [orgId, setOrgId] = useUrlState('organizationId');
  const [search, setSearch] = useUrlState('search');

  const rolesQ = useQuery({
    queryKey: ['platform', 'roles', orgId],
    queryFn: async () => {
      const res = await apiClient.get('/platform/roles', { params: { organizationId: orgId } });
      return (res.data ?? []) as OrgRole[];
    },
    enabled: Boolean(orgId),
  });

  const columns: Array<ColumnDef<OrgRole>> = [
    {
      header: 'Role',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.description ? (
            <p className="text-xs text-muted-foreground">{row.original.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      header: 'Members',
      accessorKey: 'members',
      cell: ({ row }) => row.original.members ?? '—',
    },
    {
      header: 'Permissions',
      accessorKey: 'permissions',
      cell: ({ row }) => (
        <div className="flex max-w-md flex-wrap gap-1">
          {(row.original.permissions ?? []).slice(0, 8).map((p) => (
            <Badge key={p} variant="outline">
              {p}
            </Badge>
          ))}
          {(row.original.permissions?.length ?? 0) > 8 ? (
            <Badge variant="secondary">+{(row.original.permissions?.length ?? 0) - 8} more</Badge>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Roles"
        description="Pick an organization to inspect its roles (ids for assignment)."
        searchValue={search}
        onSearchChange={setSearch}
        onReload={() => void rolesQ.refetch()}
        reloading={rolesQ.isFetching}
      />
      <Card>
        <CardContent className="space-y-2 p-5">
          <p className="text-sm font-medium">Organization</p>
          <EntityPicker
            value={orgId || null}
            onChange={(v) => setOrgId(v ?? '')}
            cacheKey="picker-platform-orgs-roles"
            dialogTitle="Select organization"
            fetchPage={async ({ search, page }) => {
              const res = await apiClient.get('/platform/organizations', {
                params: { search: search || undefined, page, limit: 20 },
              });
              const body = res.data as {
                data?: Array<Record<string, unknown>>;
                meta?: { hasNext?: boolean };
              };
              return { data: body.data ?? [], meta: body.meta ?? null };
            }}
            getLabel={(r) => String(r.name ?? String(r.id).slice(0, 8))}
            getSub={(r) => (typeof r.slug === 'string' ? r.slug : undefined)}
          />
        </CardContent>
      </Card>
      {!orgId ? (
        <p className="text-sm text-muted-foreground">Choose an organization above to list its roles.</p>
      ) : rolesQ.isLoading ? (
        <div className="space-y-2" role="status" aria-label="Loading">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : rolesQ.error ? (
        <ErrorState onRetry={() => void rolesQ.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={(rolesQ.data ?? []).filter((r) => {
            const term = search.trim().toLowerCase();
            if (!term) return true;
            return (
              r.name.toLowerCase().includes(term) ||
              (r.description ?? '').toLowerCase().includes(term)
            );
          })}
          meta={null}
          page={1}
          onPageChange={() => undefined}
          isLoading={false}
          isFetching={rolesQ.isFetching}
          error={null}
          onRetry={() => void rolesQ.refetch()}
          getRowId={(r) => r.id}
        />
      )}
    </>
  );
}
