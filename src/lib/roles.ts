/**
 * Public role keys shared by the unified login/register forms. Mirrors the
 * backend allowlists (REGISTER_ROLES / LOGIN_ROLES) — ADMIN is login-only by
 * construction: it simply isn't in REGISTER_ROLE_OPTIONS, and the API 400s
 * it on register even if forged.
 */
export interface RoleOption {
  value: string;
  label: string;
  hint: string;
}

export const REGISTER_ROLE_OPTIONS: RoleOption[] = [
  { value: 'OWNER', label: 'Owner', hint: 'Create a new organization' },
  { value: 'PROPERTY_MANAGER', label: 'Property manager', hint: 'Join with an invite code' },
  { value: 'MAINTENANCE_MANAGER', label: 'Maintenance manager', hint: 'Join with an invite code' },
  { value: 'ACCOUNTANT', label: 'Accountant', hint: 'Join with an invite code' },
  { value: 'STAFF', label: 'Staff', hint: 'Join with an invite code' },
];

export const LOGIN_ROLE_OPTIONS: RoleOption[] = [
  ...REGISTER_ROLE_OPTIONS,
  { value: 'ADMIN', label: 'Platform admin', hint: 'System level (opens the admin area)' },
];

/** Non-owner roles can only register through an invite code. */
export function roleNeedsInviteCode(role: string): boolean {
  return role !== 'OWNER';
}
