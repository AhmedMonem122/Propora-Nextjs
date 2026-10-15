import { describe, expect, it } from 'vitest';
import { releaseRefreshLock, tryTakeRefreshLock, type RefreshLockStorage } from './api-client';

function memoryStorage(): RefreshLockStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

describe('refresh lock', () => {
  it('is taken once, then refused until released or stale', () => {
    const storage = memoryStorage();
    expect(tryTakeRefreshLock('org', storage, 1000)).toBe(true);
    expect(tryTakeRefreshLock('org', storage, 1001)).toBe(false);
    releaseRefreshLock('org', storage);
    expect(tryTakeRefreshLock('org', storage, 1002)).toBe(true);
  });

  it('is taken over after the TTL (dead leader cannot deadlock followers)', () => {
    const storage = memoryStorage();
    expect(tryTakeRefreshLock('org', storage, 1000)).toBe(true);
    expect(tryTakeRefreshLock('org', storage, 1000 + 10_000 + 1)).toBe(true);
  });

  it('is namespaced per session kind', () => {
    const storage = memoryStorage();
    expect(tryTakeRefreshLock('org', storage, 1000)).toBe(true);
    expect(tryTakeRefreshLock('platform', storage, 1001)).toBe(true);
  });

  it('proceeds alone when storage is unavailable', () => {
    expect(tryTakeRefreshLock('org', null, 1000)).toBe(true);
  });
});
