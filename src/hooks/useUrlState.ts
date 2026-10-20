'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Replace the current URL's query string, preserving unrelated params.
 * Reads the live `window.location.search` when available so several filters
 * changing in quick succession never clobber each other with a stale snapshot.
 * Returns true when a navigation was actually issued.
 */
export function writeQueryParams(
  pathname: string,
  router: { replace: (url: string, opts?: { scroll?: boolean }) => void },
  searchParams: { toString: () => string },
  mutate: (params: URLSearchParams) => void,
): boolean {
  const fallback = searchParams.toString();
  const live = typeof window !== 'undefined' ? window.location.search : '';
  const params = new URLSearchParams(live || (fallback ? `?${fallback}` : ''));
  mutate(params);
  const qs = params.toString();
  const currentQs = live || (fallback ? `?${fallback}` : '');
  if (qs === currentQs.replace(/^\?/, '')) return false;
  const target = `${pathname}${qs ? `?${qs}` : ''}`;
  router.replace(target, { scroll: false });
  return true;
}

/**
 * A single filter value stored in the URL (`?status=ACTIVE`).
 *
 * URL is the durable store: deep links apply on the first render, reload keeps
 * the filter, and browser back/forward restores it. Writes use `replace` so
 * typing a search doesn't flood the history stack.
 */
export function useUrlState(key: string, fallback = ''): [string, (next: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(key) ?? fallback;
  const [value, setValue] = useState(urlValue);
  const lastWritten = useRef(urlValue);
  const pending = useRef(false);

  // Adopt external URL changes (back/forward, shared links) without fighting
  // our own writes: while a write is in flight, intermediate commits are
  // ignored until the URL catches up to the value we last wrote.
  useEffect(() => {
    const next = searchParams.get(key) ?? fallback;
    if (next === lastWritten.current) {
      pending.current = false;
      return;
    }
    if (pending.current) return;
    lastWritten.current = next;
    setValue(next);
  }, [searchParams, key, fallback]);

  const set = useCallback(
    (next: string) => {
      if (next === lastWritten.current) return;
      lastWritten.current = next;
      setValue(next);
      const navigated = writeQueryParams(pathname, router, searchParams, (params) => {
        if (!next || next === fallback) params.delete(key);
        else params.set(key, next);
      });
      pending.current = navigated;
    },
    [key, fallback, pathname, router, searchParams],
  );

  return [value, set];
}
