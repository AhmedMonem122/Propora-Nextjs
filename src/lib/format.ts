import { format as formatDate, parseISO, isValid } from 'date-fns';

export function formatMoney(amount: number | null | undefined, currency = 'EGP'): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-EG').format(n);
}

export function formatDateTime(iso: string | null | undefined, pattern = 'PPp'): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  if (!isValid(d)) return '—';
  return formatDate(d, pattern);
}

export function formatDateOnly(iso: string | null | undefined): string {
  return formatDateTime(iso, 'PP');
}

/** Serialize a Date/string to YYYY-MM-DD for API date fields. */
export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(d)) return '';
  return formatDate(d, 'yyyy-MM-dd');
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}
