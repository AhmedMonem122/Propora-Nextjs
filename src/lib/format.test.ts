import { describe, expect, it } from 'vitest';
import { formatBytes, formatDateOnly, formatDateTime, formatMoney, formatNumber, toDateInput } from './format';

describe('formatMoney', () => {
  it('formats EGP amounts', () => {
    expect(formatMoney(4500, 'EGP')).toContain('4,500');
  });

  it('falls back for unknown currency', () => {
    expect(formatMoney(10, 'XX')).toBe('10 XX');
  });

  it('renders a dash for missing values', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
    expect(formatMoney(Number.NaN)).toBe('—');
  });
});

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1200)).toBe('1,200');
  });
});

describe('dates', () => {
  it('formats ISO date strings', () => {
    expect(formatDateOnly('2026-11-01T00:00:00.000Z')).toContain('2026');
  });

  it('returns dash for invalid input', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateOnly('not-a-date')).toBe('—');
  });

  it('serializes to YYYY-MM-DD', () => {
    expect(toDateInput(new Date(2026, 10, 1))).toBe('2026-11-01');
    expect(toDateInput(null)).toBe('');
  });
});

describe('formatBytes', () => {
  it('scales units', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
