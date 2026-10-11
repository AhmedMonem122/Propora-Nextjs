import { describe, expect, it } from 'vitest';
import { rowsToCsv } from './csv';

describe('rowsToCsv', () => {
  it('returns empty string for no rows', () => {
    expect(rowsToCsv([])).toBe('');
  });

  it('serializes headers and rows', () => {
    expect(rowsToCsv([{ a: 1, b: 'x' }])).toBe('a,b\n1,x');
  });

  it('escapes commas, quotes and newlines', () => {
    const csv = rowsToCsv([{ note: 'say "hi", ok\nbye' }]);
    expect(csv).toBe('note\n"say ""hi"", ok\nbye"');
  });
});
