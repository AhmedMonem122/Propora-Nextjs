'use client';

import { useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

/** Debounce server-search inputs (350ms) so every keystroke is not a request. */
export function useDebouncedValue<T>(value: T, delayMs = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
