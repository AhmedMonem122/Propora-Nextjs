'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { DEFAULT_LIMIT } from '@/lib/constants';
import { writeQueryParams } from '@/hooks/useUrlState';
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

function parsePage(raw: string | null): number {
  const n = Number(raw ?? '1');
  return Number.isFinite(n) && n > 0 ? n : 1;
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
 * `extra` filters must be memoized by the caller; keep those in the URL with
 * `useUrlState` so every filter is deep-linkable.
 *
 * `page` and `search` are synced to URL search params: reloading, sharing a
 * link, and browser back/forward all restore the exact table view.
 */
export function usePaginatedList<T>(
  keyPrefix: string,
  path: string,
  extra?: Record<string, unknown>,
  opts?: { refetchInterval?: number },
): PaginatedList<T> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initial state comes from the URL (deep link / reload).
  const [page, setPageState] = useState(() => parsePage(searchParams.get('page')));
  const [search, setSearchState] = useState(() => searchParams.get('search') ?? '');
  const debounced = useDebouncedValue(search);

  const lastWritten = useRef(`${parsePage(searchParams.get('page'))}|${searchParams.get('search') ?? ''}`);
  const pending = useRef(false);

  // Write page/search to the URL after render (never during render: a
  // render-phase router.replace with a stale pathname bounced every
  // dashboard sub-page back to Overview).
  useEffect(() => {
    const serialized = `${page}|${search}`;
    if (serialized === lastWritten.current) {
      pending.current = false;
      return;
    }
    lastWritten.current = serialized;
    const navigated = writeQueryParams(pathname, router, searchParams, (params) => {
      if (page === 1) params.delete('page');
      else params.set('page', String(page));
      if (search) params.set('search', search);
      else params.delete('search');
    });
    pending.current = navigated;
  }, [page, search, pathname, router, searchParams]);

  // Adopt external URL changes (back/forward or a shared link) into state.
  useEffect(() => {
    const urlPage = parsePage(searchParams.get('page'));
    const urlSearch = searchParams.get('search') ?? '';
    const serialized = `${urlPage}|${urlSearch}`;
    if (serialized === lastWritten.current) {
      pending.current = false;
      return;
    }
    if (pending.current) return;
    lastWritten.current = serialized;
    setPageState(urlPage);
    setSearchState(urlSearch);
  }, [searchParams]);

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

  const setPage = (p: number): void => {
    setPageState(p);
  };

  return {
    rows: query.data?.data ?? [],
    meta: query.data?.meta ?? null,
    page,
    setPage,
    search,
    setSearch: (s: string) => {
      setPageState(1);
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
