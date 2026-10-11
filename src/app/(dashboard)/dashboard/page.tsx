'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Clock, TriangleAlert, PieChart } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
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

export default function DashboardOverviewPage(): React.JSX.Element {
  const fin = useQuery({
    queryKey: qk.reportsFinancial,
    queryFn: async () => (await apiClient.get('/reports/financial')).data as FinancialReport,
  });
  const occ = useQuery({
    queryKey: qk.reportsOccupancy,
    queryFn: async () => (await apiClient.get('/reports/occupancy')).data as OccupancyReport,
  });

  const loading = fin.isLoading || occ.isLoading;
  const error = fin.error ?? occ.error;
  const currency = (fin.data?.currency as string | undefined) ?? 'EGP';
  const collected = Number(fin.data?.totalCollected ?? 0);
  const pending = Number(fin.data?.totalPending ?? 0);
  const overdue = Number(fin.data?.totalOverdue ?? 0);
  const rate = Number(occ.data?.occupancyRate ?? 0);

  const stats = [
    { icon: Banknote, label: 'Rent collected', value: formatMoney(collected, currency), tone: 'text-emerald-600' },
    { icon: Clock, label: 'Pending', value: formatMoney(pending, currency), tone: 'text-amber-600' },
    { icon: TriangleAlert, label: 'Overdue', value: formatMoney(overdue, currency), tone: 'text-red-600' },
    { icon: PieChart, label: 'Occupancy rate', value: `${formatNumber(Math.round(rate * 100) / 100)}%`, tone: 'text-sky-600' },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="Financial and occupancy pulse of your portfolio."
        onReload={() => {
          void fin.refetch();
          void occ.refetch();
        }}
        reloading={fin.isFetching || occ.isFetching}
      />
      {loading ? (
        <StatGridSkeleton />
      ) : error ? (
        <ErrorState
          onRetry={() => {
            void fin.refetch();
            void occ.refetch();
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-3 p-5 pt-5">
                  <span className="rounded-lg bg-muted p-2.5">
                    <s.icon className={`h-5 w-5 ${s.tone}`} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-black">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                  {formatNumber(occ.data?.occupiedUnits)} of {formatNumber(occ.data?.totalUnits)} units occupied
                </CardDescription>
                <div className="mt-4 h-64">
                  <OccupancyChart
                    occupied={Number(occ.data?.occupiedUnits ?? 0)}
                    vacant={Number(occ.data?.vacantUnits ?? (Number(occ.data?.totalUnits ?? 0) - Number(occ.data?.occupiedUnits ?? 0)))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
