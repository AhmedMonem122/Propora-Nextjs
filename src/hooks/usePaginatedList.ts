'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
 */
export function usePaginatedList<T>(
  keyPrefix: string,
  path: string,
  extra?: Record<string, unknown>,
  opts?: { refetchInterval?: number },
): PaginatedList<T> {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search);

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

  return {
    rows: query.data?.data ?? [],
    meta: query.data?.meta ?? null,
    page,
    setPage,
    search,
    setSearch: (s: string) => {
      setPage(1);
      setSearch(s);
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching && !query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
