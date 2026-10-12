import { describe, expect, it } from 'vitest';
import { hasPermission, isOwnerRole, normalizePermissions, roleNames } from './permissions';

describe('normalizePermissions', () => {
  it('keeps plain strings and dedupes', () => {
    expect(normalizePermissions(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('extracts {name} objects', () => {
    expect(normalizePermissions([{ name: 'property:read' }, 'x'])).toEqual(['property:read', 'x']);
  });

  it('returns [] for non-arrays', () => {
    expect(normalizePermissions(undefined)).toEqual([]);
    expect(normalizePermissions('property:read')).toEqual([]);
  });

  it('accepts permission maps ({perm: true})', () => {
    expect(normalizePermissions({ 'property:read': true, 'x:no': false, nested: { a: 1 } })).toEqual([
      'property:read',
    ]);
  });

  it('accepts empty objects (owner shape)', () => {
    expect(normalizePermissions({})).toEqual([]);
  });
});

describe('roleNames', () => {
  it('handles string and object roles', () => {
    expect(roleNames(['owner', { name: 'Manager' }])).toEqual(['owner', 'Manager']);
  });
});

describe('hasPermission', () => {
  it('checks arrays and sets', () => {
    expect(hasPermission(['a'], 'a')).toBe(true);
    expect(hasPermission(['a'], 'b')).toBe(false);
    expect(hasPermission(new Set(['a']), 'a')).toBe(true);
  });
});

describe('isOwnerRole', () => {
  it('detects owner-like roles', () => {
    expect(isOwnerRole(['ORGANIZATION_OWNER'])).toBe(true);
    expect(isOwnerRole(['member'])).toBe(false);
    expect(isOwnerRole([])).toBe(false);
  });
});
