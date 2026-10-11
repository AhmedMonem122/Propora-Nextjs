import { describe, expect, it } from 'vitest';
import { hasPermission, normalizePermissions, roleNames } from './permissions';

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
