/**
 * Canonical billing plans (mirrors the backend ORGANIZATION_PLANS
 * allowlist — the API rejects anything outside this list).
 */
export const ORGANIZATION_PLANS = [
  { value: 'FREE', label: 'Free' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'GROWTH', label: 'Growth' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
] as const;
