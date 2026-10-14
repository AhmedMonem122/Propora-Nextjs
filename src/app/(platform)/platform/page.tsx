'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, CreditCard, Users, Wrench } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PageHeader } from '@/components/common/PageHeader/PageHeader';
import { Card, CardContent, CardTitle } from '@/components/ui/Card/Card';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';

interface PlatformStats {
  organizations?: number;
  users?: number;
  properties?: number;
  units?: number;
  activeLeases?: number;
  pendingPayments?: number;
  openMaintenance?: number;
  [key: string]: unknown;
}

const CARDS: Array<{ key: keyof PlatformStats; label: string; icon: React.ElementType }> = [
  { key: 'organizations', label: 'Organizations', icon: Building2 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'pendingPayments', label: 'Pending payments', icon: CreditCard },
  { key: 'openMaintenance', label: 'Open maintenance', icon: Wrench },
];

export default function PlatformOverviewPage(): React.JSX.Element {
  const statsQ = useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: async () => (await apiClient.get('/platform/stats')).data as PlatformStats,
    staleTime: 60_000,
  });

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Cross-tenant totals. Pick an organization above to act within it."
        onReload={() => void statsQ.refetch()}
        reloading={statsQ.isFetching}
      />
      {statsQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map(({ key, label, icon: Icon }) => (
            <Card key={key}>
              <CardContent className="flex items-center gap-3 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <CardTitle className="text-2xl font-bold">
                    {typeof statsQ.data?.[key] === 'number' ? (statsQ.data?.[key] as number).toLocaleString() : '—'}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">{label}</span>
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
