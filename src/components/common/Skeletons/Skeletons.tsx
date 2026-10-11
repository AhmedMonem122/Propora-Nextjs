import { Skeleton } from '@/components/ui/Skeleton/Skeleton';

export function CardSkeleton(): React.JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-5" aria-hidden="true">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-8 w-1/2" />
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
