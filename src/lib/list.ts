import type { PaginatedMeta } from '@/types/api';

/** Nested endpoints may return a bare array or a paginated envelope — accept both. */
export function normalizeList<T>(payload: unknown): { rows: T[]; meta: PaginatedMeta | null } {
  if (Array.isArray(payload)) return { rows: payload as T[], meta: null };
  if (payload && typeof payload === 'object') {
    const p = payload as { data?: unknown; meta?: PaginatedMeta | null };
    if (Array.isArray(p.data)) return { rows: p.data as T[], meta: p.meta ?? null };
  }
  return { rows: [], meta: null };
}
