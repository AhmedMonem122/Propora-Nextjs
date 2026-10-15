import { describe, expect, it } from 'vitest';
import { LOGIN_ROLE_OPTIONS, REGISTER_ROLE_OPTIONS, roleNeedsInviteCode } from '@/lib/roles';
import { ORGANIZATION_PLANS } from '@/lib/plans';

describe('auth role options', () => {
  it('never offers ADMIN on public registration', () => {
    expect(REGISTER_ROLE_OPTIONS.some((r) => r.value === 'ADMIN')).toBe(false);
    expect(REGISTER_ROLE_OPTIONS.map((r) => r.value)).toContain('OWNER');
  });

  it('offers ADMIN on login (platform session)', () => {
    expect(LOGIN_ROLE_OPTIONS.map((r) => r.value)).toContain('ADMIN');
  });

  it('requires an invite code for every non-owner role', () => {
    expect(roleNeedsInviteCode('OWNER')).toBe(false);
    for (const r of REGISTER_ROLE_OPTIONS) {
      if (r.value !== 'OWNER') expect(roleNeedsInviteCode(r.value)).toBe(true);
    }
  });
});

describe('organization plans', () => {
  it('is a closed allowlist matching the backend', () => {
    expect(ORGANIZATION_PLANS.map((p) => p.value)).toEqual([
      'FREE',
      'STARTER',
      'GROWTH',
      'ENTERPRISE',
    ]);
  });
});
