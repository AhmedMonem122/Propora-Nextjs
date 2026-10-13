// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EntityPicker } from './EntityPicker';

const ROWS = [
  { id: 'u-1', name: 'Sunrise Tower A' },
  { id: 'u-2', name: 'Sunrise Tower B' },
  { id: 'u-3', name: 'Nile View' },
];

function setup(onChange = vi.fn()) {
  if (typeof window !== 'undefined') {
    const w = window as unknown as Record<string, unknown>;
    if (!w.IntersectionObserver) {
      w.IntersectionObserver = class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      };
    }
    if (!w.ResizeObserver) {
      w.ResizeObserver = class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      };
    }
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function scrollIntoView(): void {};
  }
  const fetcher = vi.fn(
    async ({ search, page: _page }: { search: string; page: number }) => ({
      data: ROWS.filter((r) =>
        search.trim() === '' ? true : r.name.toLowerCase().includes(search.toLowerCase()),
      ),
      meta: { hasNext: false },
    }),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <EntityPicker
        value={null}
        onChange={onChange}
        fetchPage={fetcher}
        cacheKey="test-picker"
        dialogTitle="Select tower"
        getLabel={(r) => String(r.name)}
      />
    </QueryClientProvider>,
  );
  return { fetcher, onChange };
}

describe('EntityPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('opens, searches on the server and selects by name', async () => {
    const { fetcher, onChange } = setup();

    fireEvent.click(screen.getByRole('button', { name: /select/i }));
    const input = await screen.findByRole('combobox');
    fireEvent.change(input, { target: { value: 'nile' } });

    // Debounced server search must fire before asserting (300ms).
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'nile' }),
      );
    });

    const item = await screen.findByText('Nile View');
    fireEvent.click(item);

    expect(onChange).toHaveBeenCalledWith('u-3');
  });

  it('shows skeleton rows while loading', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /select/i }));
    expect(await screen.findByLabelText('Loading more')).toBeDefined();
  });
});
