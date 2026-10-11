import { Skeleton } from '@/components/ui/Skeleton/Skeleton';

export default function Loading(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
