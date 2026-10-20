'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LayoutDashboard, Pencil, Trash2 } from 'lucide-react';
import { apiClient, getApiMessage } from '@/lib/api-client';
import { usePlatform } from '@/lib/platform-context';
import { ORGANIZATION_PLANS } from '@/lib/plans';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useUrlState } from '@/hooks/useUrlState';
import { useDeleteEntity } from '@/hooks/useEntityMutations';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { DataTable } from '@/components/common/DataTable/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { StatusBadge } from '@/components/common/StatusBadge/StatusBadge';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog/Dialog';
import { FormField, FormSelect } from '@/components/common/FormField/FormField';
import type { ColumnDef } from '@tanstack/react-table';

interface PlatformOrg {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
  plan?: string | null;
  subscriptionStatus?: string | null;
  createdAt?: string;
}

export default function PlatformOrganizationsPage(): React.JSX.Element {
  const router = useRouter();
  const { setScope } = usePlatform();
  const queryClient = useQueryClient();
  const [status, setStatus] = useUrlState('status');
  const extra = useMemo(() => ({ ...(status ? { status } : {}) }), [status]);
  const list = usePaginatedList<PlatformOrg>('platform-orgs', '/platform/organizations', extra);

  const [editing, setEditing] = useState<PlatformOrg | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [wiping, setWiping] = useState<PlatformOrg | null>(null);
  const [confirmSlug, setConfirmSlug] = useState('');
  const [wipingNow, setWipingNow] = useState(false);

  const save = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiClient.patch(`/platform/organizations/${id}`, body),
    onSuccess: () => {
      toast.success('Updated successfully.');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
    },
    onError: (e) => toast.error(getApiMessage(e, 'Operation failed.')),
  });

  const wipe = async () => {
    if (!wiping) return;
    setWipingNow(true);
    try {
      const res = await apiClient.delete(`/platform/organizations/${wiping.id}`, {
        data: { confirm: confirmSlug.trim() },
      });
      const removed = (res.data as { removed?: Record<string, number> })?.removed;
      toast.success(
        `Deleted ${wiping.slug}${removed ? ` (${Object.entries(removed).map(([k, v]) => `${v} ${k}`).join(', ')})` : ''}.`,
      );
      setWiping(null);
      setConfirmSlug('');
      void queryClient.invalidateQueries({ queryKey: ['platform-orgs'] });
    } catch (e) {
      toast.error(getApiMessage(e, 'Deletion failed.'));
    } finally {
      setWipingNow(false);
    }
  };

  const columns = useMemo<ColumnDef<PlatformOrg>[]>(
    () => [      {
        header: 'Organization',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        ),
      },
      { header: 'Plan', accessorKey: 'plan', cell: ({ row }) => row.original.plan ?? '—' },
      { header: 'Subscription', accessorKey: 'subscriptionStatus', cell: ({ row }) => row.original.subscriptionStatus ?? '—' },
      { header: 'Status', accessorKey: 'status', cell: ({ row }) => <StatusBadge value={row.original.status} /> },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Open ${o.name} dashboard (act as this organization)`}
                title="Open dashboard as this organization"
                onClick={() => {
                  setScope(o.id, o.name);
                  router.push('/dashboard');
                }}
              >
                <LayoutDashboard className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Manage ${o.name}`}
                onClick={() => {
                  setEditing(o);
                  setEditStatus(o.status ?? '');
                  setEditPlan(o.plan ?? '');
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Delete ${o.name}`} onClick={() => setWiping(o)}>
                <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, setScope],
  );

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Every tenant. Suspend, change plan, or wipe (danger zone)."
        searchValue={list.search}
        onSearchChange={list.setSearch}
        onReload={list.refetch}
        reloading={list.isFetching}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Organization filters">
        <select
          value={status || 'all'}
          onChange={(e) => setStatus(e.target.value === 'all' ? '' : e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
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
      <Dialog open={Boolean(editing)} onOpenChange={(v) => { if (!v) setEditing(null); }}>
        <DialogContent aria-label="Manage organization">
          <DialogHeader><DialogTitle>Manage {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <FormField label="Status" htmlFor="po-status">
              <FormSelect id="po-status" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="">— (unchanged)</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </FormSelect>
            </FormField>
            <FormField label="Plan" htmlFor="po-plan">
              <FormSelect id="po-plan" value={editPlan} onChange={(e) => setEditPlan(e.target.value)}>
                <option value="">— (unchanged)</option>
                {ORGANIZATION_PLANS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </FormSelect>
            </FormField>
            <DialogFooter>
              <Button
                pending={save.isPending}
                onClick={() => {
                  if (!editing) return;
                  const body: Record<string, unknown> = {};
                  if (editStatus) body.status = editStatus;
                  if (editPlan) body.plan = editPlan;
                  save.mutate({ id: editing.id, body });
                }}
              >
                Save changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(wiping)} onOpenChange={(v) => { if (!v) { setWiping(null); setConfirmSlug(''); } }}>
        <DialogContent aria-label="Delete organization permanently">
          <DialogHeader><DialogTitle className="text-red-600">Delete {wiping?.name} forever?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes the organization with <strong>everything in it</strong> (users, properties, leases,
            payments, documents). This cannot be undone. Type the slug <code className="font-mono">{wiping?.slug}</code> to confirm.
          </p>
          <Input
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
            placeholder="organization slug"
            aria-label="Confirm slug"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setWiping(null); setConfirmSlug(''); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              pending={wipingNow}
              disabled={!wiping || confirmSlug.trim() !== wiping.slug}
              onClick={() => void wipe()}
            >
              Delete forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
