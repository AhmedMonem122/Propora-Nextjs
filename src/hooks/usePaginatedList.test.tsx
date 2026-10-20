// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const state = vi.hoisted(() => ({
  pathname: '/dashboard/properties',
  search: '',
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: state.replace }),
  usePathname: () => state.pathname,
  useSearchParams: () => new URLSearchParams(state.search),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(async () => ({
      data: { data: [], meta: { total: 0, page: 1, limit: 20 } },
    })),
  },
}));

import { usePaginatedList } from './usePaginatedList';

// One shared client: creating a new QueryClient inside the wrapper would
// remount the provider on every hook render and loop forever.
const client = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } },
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('usePaginatedList navigation safety', () => {
  beforeEach(() => {
    state.pathname = '/dashboard/properties';
    state.search = '';
    state.replace.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('mounting on a sub-page never navigates back to the previous page', () => {
    renderHook(() => usePaginatedList('properties', '/properties', {}), { wrapper });

    // Regression: a render-phase router.replace with a stale
    // window.location.pathname bounced every dashboard sub-page back
    // to /dashboard (Overview) within a second of mounting.
    for (const call of state.replace.mock.calls) {
      const url = call[0] as string;
      expect(url).not.toMatch(/^\/dashboard(\?|$)/);
    }
  });

  it('syncs search to the URL using the live pathname', () => {
    const { result } = renderHook(() => usePaginatedList('properties', '/properties', {}), {
      wrapper,
    });

    act(() => {
      result.current.setSearch('villa');
    });

    expect(state.replace).toHaveBeenCalledWith('/dashboard/properties?search=villa', {
      scroll: false,
    });
  });

  it('keeps the new pathname (not the previous one) after client navigation', () => {
    const { rerender } = renderHook(() => usePaginatedList('leases', '/leases', {}), {
      wrapper,
    });
    state.replace.mockClear();

    // Simulate clicking "Leases" in the sidebar: Next.js swaps the route,
    // then the hook re-renders under the new pathname.
    state.pathname = '/dashboard/leases';
    rerender();

    act(() => {
      // Any state change (e.g. page click) must target the live route.
      rerender();
    });

    for (const call of state.replace.mock.calls) {
      const url = call[0] as string;
      expect(url.startsWith('/dashboard/leases')).toBe(true);
    }
  });
});
