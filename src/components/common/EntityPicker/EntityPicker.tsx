'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Command } from 'cmdk';
import { Button } from '@/components/ui/Button/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog/Dialog';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';

export interface EntityPage {
  data: Array<Record<string, unknown>>;
  meta?: { hasNext?: boolean; total?: number } | null;
}

interface EntityPickerProps {
  /** Currently selected entity id (null = nothing selected). */
  value: string | null;
  onChange: (id: string | null) => void;
  /** Server page fetch. Receives debounced search + 1-based page. */
  fetchPage: (params: { search: string; page: number }) => Promise<EntityPage>;
  /** React-Query cache segment, e.g. 'units-picker'. */
  cacheKey: string;
  getLabel: (item: Record<string, unknown>) => string;
  getSub?: (item: Record<string, unknown>) => string | undefined;
  /** Label shown when a value is set but not (yet) in the loaded pages. */
  selectedLabel?: string;
  placeholder?: string;
  dialogTitle: string;
  disabled?: boolean;
  error?: string;
  id?: string;
}

const PAGE_SIZE = 20;

/**
 * Generic searchable entity dropdown: debounced server search, infinite
 * scroll, skeleton rows, clear button. Replaces every "paste the id"
 * input — users pick by NAME, the form keeps the ID.
 */
export function EntityPicker({
  value,
  onChange,
  fetchPage,
  cacheKey,
  getLabel,
  getSub,
  selectedLabel,
  placeholder = 'Select…',
  dialogTitle,
  disabled,
  error,
  id,
}: EntityPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: [cacheKey, debounced],
    queryFn: ({ pageParam }) => fetchPage({ search: debounced, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last, _all, lastParam) =>
      last.meta?.hasNext ? lastParam + 1 : undefined,
    enabled: open,
    staleTime: 30_000,
  });

  const items = (query.data?.pages ?? []).flatMap((p) => p.data);
  const selected = items.find((i) => String(i.id) === value);
  const display = selected ? getLabel(selected) : (selectedLabel ?? (value ? `Selected · ${value.slice(0, 8)}` : null));

  useEffect(() => {
    if (!open) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      },
      { rootMargin: '120px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, query]);

  return (
    <>
      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => {
            setSearch('');
            setOpen(true);
          }}
          aria-label={display ? `Selected: ${display}. Change selection` : placeholder}
          className={cn('h-9 flex-1 justify-between font-normal', !display && 'text-muted-foreground', error && 'border-red-500')}
        >
          <span className="truncate">{display ?? placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
        {value && !disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear selection"
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" aria-label={dialogTitle}>
          <DialogHeader className="sr-only">
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <Command
            label={dialogTitle}
            // Server-driven search: cmdk's built-in client filter would hide
            // rows the server hasn't returned yet (and mask search bugs).
            shouldFilter={false}
          >
            <div className="border-b px-4">
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Type at least 2 characters to search…"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
                {query.isLoading ? 'Searching…' : 'No results.'}
              </Command.Empty>
              <Command.Group>
                {items.map((item) => {
                  const itemId = String(item.id);
                  const label = getLabel(item);
                  const sub = getSub?.(item);
                  return (
                    <Command.Item
                      key={itemId}
                      value={`${label} ${itemId}`}
                      onSelect={() => {
                        onChange(itemId);
                        setOpen(false);
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm aria-selected:bg-muted"
                    >
                      <Check
                        className={cn('h-4 w-4 shrink-0', itemId === value ? 'opacity-100' : 'opacity-0')}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{label}</span>
                        {sub ? <span className="block truncate text-xs text-muted-foreground">{sub}</span> : null}
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
              <div ref={sentinelRef} aria-hidden="true" className="px-2 py-1">
                {query.isFetchingNextPage || query.isLoading ? (
                  <div className="space-y-2" role="status" aria-label="Loading more">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : null}
              </div>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
