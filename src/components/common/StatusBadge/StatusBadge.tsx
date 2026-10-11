import { Badge } from '@/components/ui/Badge/Badge';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'outline';

const MAP: Record<string, Variant> = {
  ACTIVE: 'success',
  OCCUPIED: 'success',
  PAID: 'success',
  RESOLVED: 'success',
  CLOSED: 'secondary',
  VACANT: 'info',
  PENDING: 'warning',
  OVERDUE: 'danger',
  FAILED: 'danger',
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  UPCOMING: 'info',
  ENDED: 'secondary',
  TERMINATED: 'danger',
  REFUNDED: 'secondary',
  INACTIVE: 'secondary',
  SUSPENDED: 'danger',
  URGENT: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'secondary',
};

/** Colored badge for any status/priority enum. */
export function StatusBadge({ value }: { value: string | null | undefined }): React.JSX.Element {
  const v = value ?? '—';
  return <Badge variant={MAP[v] ?? 'outline'}>{v.replace(/_/g, ' ')}</Badge>;
}
