'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { qk } from '@/lib/query-client';
import { downloadCsv } from '@/lib/csv';
import { formatMoney, formatNumber } from '@/lib/format';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { StatGridSkeleton } from '@/components/common/Skeletons/Skeletons';
import { ErrorState } from '@/components/common/ErrorState/ErrorState';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card/Card';
import type { FinancialReport, OccupancyReport, OrgSettings } from '@/types/api';

const RentChart = dynamic(() => import('../RentChart').then((m) => m.RentChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" />,
});
const OccupancyChart = dynamic(() => import('../OccupancyChart').then((m) => m.OccupancyChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" />,
});

export default function ReportsPage(): React.JSX.Element {
  const fin = useQuery({
    queryKey: qk.reportsFinancial,
    queryFn: async () => (await apiClient.get('/reports/financial')).data as FinancialReport,
  });
  const occ = useQuery({
    queryKey: qk.reportsOccupancy,
    queryFn: async () => (await apiClient.get('/reports/occupancy')).data as OccupancyReport,
  });
  const settings = useQuery({
    queryKey: qk.orgSettings,
    queryFn: async () => (await apiClient.get('/organizations/me/settings')).data as OrgSettings,
  });

  const currency = (settings.data?.currency as string | undefined) ?? (fin.data?.currency as string | undefined) ?? 'EGP';
  const loading = fin.isLoading || occ.isLoading;
  const error = fin.error ?? occ.error;

  const exportFinancial = (): void => {
    const rows = Array.isArray(fin.data?.byMonth) ? (fin.data?.byMonth as Array<Record<string, unknown>>) : [];
    downloadCsv('financial-report', rows.length > 0 ? rows : [{ collected: fin.data?.totalCollected ?? 0, pending: fin.data?.totalPending ?? 0, overdue: fin.data?.totalOverdue ?? 0, currency }]);
  };

  const exportOccupancy = (): void => {
    const rows = Array.isArray(occ.data?.byProperty) ? (occ.data?.byProperty as Array<Record<string, unknown>>) : [];
    downloadCsv('occupancy-report', rows.length > 0 ? rows : [{ total: occ.data?.totalUnits ?? 0, occupied: occ.data?.occupiedUnits ?? 0, rate: occ.data?.occupancyRate ?? 0 }]);
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description={`Currency: ${currency} (from organization settings).`}
        onReload={() => {
          void fin.refetch();
          void occ.refetch();
        }}
        reloading={fin.isFetching || occ.isFetching}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={exportFinancial}>
              <Download className="h-4 w-4" aria-hidden="true" /> Financial CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportOccupancy}>
              <Download className="h-4 w-4" aria-hidden="true" /> Occupancy CSV
            </Button>
          </>
        }
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
            {[
              { label: 'Collected', value: formatMoney(Number(fin.data?.totalCollected ?? 0), currency) },
              { label: 'Pending', value: formatMoney(Number(fin.data?.totalPending ?? 0), currency) },
              { label: 'Overdue', value: formatMoney(Number(fin.data?.totalOverdue ?? 0), currency) },
              { label: 'Occupancy', value: `${formatNumber(Number(occ.data?.occupancyRate ?? 0))}%` },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5 pt-5">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-black">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardContent className="p-5 pt-5">
                <CardTitle>Financial trend</CardTitle>
                <CardDescription>Monthly collection</CardDescription>
                <div className="mt-4 h-64">
                  <RentChart data={Array.isArray(fin.data?.byMonth) ? (fin.data?.byMonth as Array<{ month: string; collected: number }>) : []} currency={currency} />
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardContent className="p-5 pt-5">
                <CardTitle>Occupancy mix</CardTitle>
                <CardDescription>Occupied vs vacant units</CardDescription>
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
