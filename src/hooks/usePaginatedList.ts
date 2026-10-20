'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { DEFAULT_LIMIT } from '@/lib/constants';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { Paginated } from '@/types/api';

function cleanParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v;
  }
  return out;
}

export interface PaginatedList<T> {
  rows: T[];
  meta: Paginated<T>['meta'] | null;
  page: number;
  setPage: (p: number) => void;
  search: string;
  setSearch: (s: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Standard server-search + server-pagination state for every table.
 * `extra` filters must be memoized by the caller.
 *
 * Search, page, and extra filter keys are synced to URL search params so
 * state survives reload and can be bookmarked/shared.
 */
export function usePaginatedList<T>(
  keyPrefix: string,
  path: string,
  extra?: Record<string, unknown>,
  opts?: { refetchInterval?: number },
): PaginatedList<T> {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial state from URL search params (only on first render).
  const urlPage = Number(searchParams.get('page') ?? '1');
  const urlSearch = searchParams.get('search') ?? '';
  const [page, setPage] = useState(Number.isFinite(urlPage) && urlPage > 0 ? urlPage : 1);
  const [search, setSearchState] = useState(urlSearch);
  const debounced = useDebouncedValue(search);

  // Sync search/page to URL when they change (no scroll, no push — replace).
  const syncToUrl = useCallback(
    (nextPage: number, nextSearch: string, nextExtra: Record<string, unknown> | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPage === 1) params.delete('page');
      else params.set('page', String(nextPage));

      if (nextSearch) params.set('search', nextSearch);
      else params.delete('search');

      // Sync known extra filter keys that are scalar values.
      if (nextExtra) {
        for (const [k, v] of Object.entries(nextExtra)) {
          if (v === undefined || v === null || v === '') {
            params.delete(k);
          } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            params.set(k, String(v));
          }
        }
      }

      const qs = params.toString();
      const url = `${window.location.pathname}${qs ? '?' + qs : ''}`;
      void router.replace(url, { scroll: false });
    },
    [router, searchParams],
  );

  const params = useMemo(
    () => cleanParams({ page, limit: DEFAULT_LIMIT, search: debounced || undefined, ...(extra ?? {}) }),
    [page, debounced, extra],
  );

  const query = useQuery({
    queryKey: [keyPrefix, params],
    queryFn: async (): Promise<Paginated<T>> => {
      const res = await apiClient.get<Paginated<T>>(path, { params });
      return res.data;
    },
    placeholderData: (prev) => prev,
    // Polling fallback for when Realtime is unavailable (no Supabase env):
    // realtime invalidation already makes updates instant otherwise.
    refetchInterval: opts?.refetchInterval,
  });

  // Whenever page/search/extra changes, push to URL.
  useMemo(() => {
    void syncToUrl(page, search, extra);
  }, [page, search, extra, syncToUrl]);

  return {
    rows: query.data?.data ?? [],
    meta: query.data?.meta ?? null,
    page,
    setPage,
    search,
    setSearch: (s: string) => {
      setPage(1);
      setSearchState(s);
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching && !query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
