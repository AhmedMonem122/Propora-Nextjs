import { describe, expect, it } from 'vitest';
import { normalizeList } from './list';

describe('normalizeList', () => {
  it('accepts bare arrays (nested endpoints)', () => {
    expect(normalizeList([{ id: 1 }])).toEqual({ rows: [{ id: 1 }], meta: null });
  });

  it('accepts paginated envelopes', () => {
    const meta = { total: 1, page: 1, limit: 20, totalPages: 1, hasNext: false, hasPrev: false };
    expect(normalizeList({ data: [{ id: 1 }], meta })).toEqual({ rows: [{ id: 1 }], meta });
  });

  it('returns empty rows for garbage', () => {
    expect(normalizeList(null)).toEqual({ rows: [], meta: null });
    expect(normalizeList({})).toEqual({ rows: [], meta: null });
  });
});
