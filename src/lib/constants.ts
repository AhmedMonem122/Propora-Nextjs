/** Shared constants: pagination, uploads, debounce. */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const SEARCH_DEBOUNCE_MS = 350;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB — mirrors API pre-check
export const ALLOWED_UPLOAD_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;

export const ALLOWED_UPLOAD_EXTS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
  '.csv',
] as const;

export const REFRESH_COOKIE_NAME = 'propora_refresh_token';

/** Non-secret route params only — never put tokens in URLs. */
export function billingResultUrl(kind: 'success' | 'cancel', paymentId: string): string {
  return `/dashboard/billing/${kind}?paymentId=${encodeURIComponent(paymentId)}`;
}
