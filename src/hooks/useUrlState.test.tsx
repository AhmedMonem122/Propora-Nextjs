// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const state = vi.hoisted(() => ({
  pathname: '/dashboard/payments',
  search: '',
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: state.replace }),
  usePathname: () => state.pathname,
  useSearchParams: () => new URLSearchParams(state.search),
}));

import { useUrlState, writeQueryParams } from './useUrlState';

describe('useUrlState', () => {
  beforeEach(() => {
    state.pathname = '/dashboard/payments';
    state.search = '';
    state.replace.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('initializes from a deep-linked URL param', () => {
    state.search = 'status=PAID&page=2';
    const { result } = renderHook(() => useUrlState('status'));
    expect(result.current[0]).toBe('PAID');
  });

  it('writes the param and preserves unrelated params', () => {
    state.search = 'page=2';
    const { result } = renderHook(() => useUrlState('status'));

    act(() => {
      result.current[1]('OVERDUE');
    });

    expect(state.replace).toHaveBeenCalledWith('/dashboard/payments?page=2&status=OVERDUE', {
      scroll: false,
    });
  });

  it('removes the param when reset to the fallback', () => {
    state.search = 'status=PAID&page=2';
    const { result } = renderHook(() => useUrlState('status'));

    act(() => {
      result.current[1]('');
    });

    expect(state.replace).toHaveBeenCalledWith('/dashboard/payments?page=2', { scroll: false });
  });

  it('adopts external URL changes (browser back/forward)', () => {
    state.search = 'status=PAID';
    const { result, rerender } = renderHook(() => useUrlState('status'));
    expect(result.current[0]).toBe('PAID');

    state.search = 'status=OVERDUE';
    rerender();
    expect(result.current[0]).toBe('OVERDUE');
  });

  it('writeQueryParams skips navigation when the URL already matches', () => {
    state.search = 'status=PAID';
    const navigated = writeQueryParams(
      state.pathname,
      { replace: state.replace },
      new URLSearchParams(state.search),
      (p) => p.set('status', 'PAID'),
    );
    expect(navigated).toBe(false);
    expect(state.replace).not.toHaveBeenCalled();
  });
});
