'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Building2, Clock, DoorOpen, TriangleAlert, PieChart, Users, Wrench } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { useAuth } from '@/lib/auth-context';
import { formatMoney, formatNumber } from '@/lib/format';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { StatGridSkeleton } from '@/components/common/Skeletons/Skeletons';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card/Card';
import type { FinancialReport, OccupancyReport } from '@/types/api';

const RentChart = dynamic(() => import('./RentChart').then((m) => m.RentChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" />,
});
const OccupancyChart = dynamic(() => import('./OccupancyChart').then((m) => m.OccupancyChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" />,
});

async function countOf(path: string, params: Record<string, unknown> = {}): Promise<number> {
  const res = await apiClient.get(path, { params: { limit: 1, ...params } });
  const meta = (res.data as { meta?: { total?: number } })?.meta;
  return typeof meta?.total === 'number' ? meta.total : 0;
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }): React.JSX.Element {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5 pt-5">
        <span className="rounded-lg bg-muted p-2.5">
          <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-black">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardOverviewPage(): React.JSX.Element {
  const { can, user } = useAuth();
  const showFinancial = can('report:financial');
  const showOps = can('maintenance:read');
  const canProps = can('property:read');
  const canUnits = can('unit:read');
  const canResidents = can('resident:read');
  const canLeases = can('lease:read');

  const fin = useQuery({
    queryKey: qk.reportsFinancial,
    queryFn: async () => (await apiClient.get('/reports/financial')).data as FinancialReport,
    enabled: showFinancial,
  });
  const occ = useQuery({
    queryKey: qk.reportsOccupancy,
    queryFn: async () => (await apiClient.get('/reports/occupancy')).data as OccupancyReport,
    enabled: showFinancial,
  });

  const openMaint = useQuery({
    queryKey: ['overview', 'open-maintenance'],
    queryFn: () => countOf('/maintenance/requests', { status: 'OPEN' }),
    enabled: showOps,
    staleTime: 60_000,
  });
  const myMaint = useQuery({
    queryKey: ['overview', 'my-maintenance', user?.id],
    queryFn: () => countOf('/maintenance/requests', { assignedToId: user?.id ?? '', status: 'IN_PROGRESS' }),
    enabled: showOps && Boolean(user?.id),
    staleTime: 60_000,
  });
  const maintUnits = useQuery({
    queryKey: ['overview', 'maint-units'],
    queryFn: () => countOf('/units', { status: 'UNDER_MAINTENANCE' }),
    enabled: showOps && canUnits,
    staleTime: 60_000,
  });

  const propCount = useQuery({
    queryKey: ['overview', 'props'],
    queryFn: () => countOf('/properties'),
    enabled: canProps,
    staleTime: 60_000,
  });
  const unitCount = useQuery({
    queryKey: ['overview', 'units'],
    queryFn: () => countOf('/units'),
    enabled: canUnits,
    staleTime: 60_000,
  });
  const residentCount = useQuery({
    queryKey: ['overview', 'residents'],
    queryFn: () => countOf('/residents'),
    enabled: canResidents,
    staleTime: 60_000,
  });
  const leaseCount = useQuery({
    queryKey: ['overview', 'leases'],
    queryFn: () => countOf('/leases', { status: 'ACTIVE' }),
    enabled: canLeases,
    staleTime: 60_000,
  });

  const reloadAll = () => {
    for (const q of [fin, occ, openMaint, myMaint, maintUnits, propCount, unitCount, residentCount, leaseCount]) {
      void q.refetch();
    }
  };
  const anyFetching = [fin, occ, openMaint, myMaint, maintUnits, propCount, unitCount, residentCount, leaseCount].some(
    (q) => q.isFetching,
  );

  const currency = (fin.data?.period?.currency as string | undefined) ?? 'EGP';
  const collected = Number(fin.data?.collectedThisMonth ?? 0);
  const pending = Number(fin.data?.outstanding?.amount ?? 0);
  const pendingCount = Number(fin.data?.outstanding?.count ?? 0);
  const overdue = Number(fin.data?.overdue?.amount ?? 0);
  const overdueCount = Number(fin.data?.overdue?.count ?? 0);
  const rate = Number(fin.data?.occupancyRate ?? 0);
  const totals = occ.data?.totals;

  const finLoading = showFinancial && (fin.isLoading || occ.isLoading);
  const finError = showFinancial ? (fin.error ?? occ.error) : null;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Your workspace at a glance — tailored to your role."
        onReload={reloadAll}
        reloading={anyFetching}
      />

      {showFinancial ? (
        finLoading ? (
          <StatGridSkeleton />
        ) : finError ? (
          <ErrorState onRetry={reloadAll} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Banknote} label="Rent collected" value={formatMoney(collected, currency)} tone="text-emerald-600" />
              <StatCard icon={Clock} label={`Pending (${formatNumber(pendingCount)})`} value={formatMoney(pending, currency)} tone="text-amber-600" />
              <StatCard icon={TriangleAlert} label={`Overdue (${formatNumber(overdueCount)})`} value={formatMoney(overdue, currency)} tone="text-red-600" />
              <StatCard icon={PieChart} label="Occupancy rate" value={`${formatNumber(Math.round(rate * 100) / 100)}%`} tone="text-emerald-600" />
            </div>
            <div className="grid gap-4 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                <CardContent className="p-5 pt-5">
                  <CardTitle>Rent collected</CardTitle>
                  <CardDescription>Monthly collection trend</CardDescription>
                  <div className="mt-4 h-64">
                    <RentChart data={Array.isArray(fin.data?.byMonth) ? (fin.data?.byMonth as Array<{ month: string; collected: number }>) : []} currency={currency} />
                  </div>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardContent className="p-5 pt-5">
                  <CardTitle>Occupancy</CardTitle>
                  <CardDescription>
                    {formatNumber(totals?.occupied)} of {formatNumber(totals?.totalUnits)} units occupied
                  </CardDescription>
                  <div className="mt-4 h-64">
                    <OccupancyChart
                      occupied={Number(totals?.occupied ?? 0)}
                      vacant={Number(totals?.vacant ?? 0)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )
      ) : null}

      {showOps ? (
        <section aria-label="Operations">
          <h2 className="mb-3 text-lg font-bold">Operations</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Wrench} label="Open requests" value={formatNumber(openMaint.data ?? 0)} tone="text-amber-600" />
            <StatCard icon={Clock} label="Assigned to me" value={formatNumber(myMaint.data ?? 0)} tone="text-emerald-600" />
            {canUnits ? (
              <StatCard icon={DoorOpen} label="Units under maintenance" value={formatNumber(maintUnits.data ?? 0)} tone="text-emerald-600" />
            ) : null}
          </div>
        </section>
      ) : null}

      <section aria-label="Portfolio">
        <h2 className="mb-3 text-lg font-bold">Portfolio</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {canProps ? (
            <StatCard icon={Building2} label="Properties" value={formatNumber(propCount.data ?? 0)} tone="text-emerald-600" />
          ) : null}
          {canUnits ? (
              <StatCard icon={DoorOpen} label="Units" value={formatNumber(unitCount.data ?? 0)} tone="text-emerald-600" />
          ) : null}
          {canResidents ? (
              <StatCard icon={Users} label="Residents" value={formatNumber(residentCount.data ?? 0)} tone="text-emerald-600" />
          ) : null}
          {canLeases ? (
            <StatCard icon={Banknote} label="Active leases" value={formatNumber(leaseCount.data ?? 0)} tone="text-amber-600" />
          ) : null}
        </div>
      </section>
    </>
  );
}
