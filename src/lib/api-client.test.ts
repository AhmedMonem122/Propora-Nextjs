import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { extractFieldErrors, getApiMessage, getApiMessages, getApiStatus } from './api-client';

function apiError(status: number, message: string | string[], headers?: Record<string, string>): AxiosError {
  return new AxiosError(
    'Request failed',
    String(status),
    { headers: new AxiosHeaders() },
    {},
    {
      status,
      statusText: '',
      headers: new AxiosHeaders(headers ?? {}),
      config: { headers: new AxiosHeaders() },
      data: { statusCode: status, message },
    },
  );
}

describe('getApiMessage', () => {
  it('joins array messages (400 field errors)', () => {
    expect(getApiMessage(apiError(400, ['a is required', 'b bad']), 'fallback')).toBe('a is required, b bad');
  });

  it('returns string messages (409 overlaps)', () => {
    expect(getApiMessage(apiError(409, 'Lease overlaps'), 'fallback')).toBe('Lease overlaps');
  });

  it('respects Retry-After on 429', () => {
    expect(getApiMessage(apiError(429, 'Too many', { 'retry-after': '30' }), 'fallback')).toContain('30');
  });

  it('falls back for unknown errors', () => {
    expect(getApiMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });
});

describe('getApiStatus', () => {
  it('extracts HTTP status', () => {
    expect(getApiStatus(apiError(404, 'nope'))).toBe(404);
    expect(getApiStatus(new Error('x'))).toBeUndefined();
  });
});

describe('getApiMessages', () => {
  it('handles nested object messages', () => {
    const err = apiError(400, { email: 'must be an email' } as unknown as string);
    expect(getApiMessages(err)).toEqual(['must be an email']);
  });

  it('returns [] with no backend message', () => {
    expect(getApiMessages(new Error('x'))).toEqual([]);
  });
});

describe('extractFieldErrors', () => {
  it('maps backend messages to matching fields', () => {
    const err = apiError(400, ['email must be an email', 'password must be longer than 8 chars', 'unrelated boom']);
    expect(extractFieldErrors(err, ['email', 'password'])).toEqual({
      email: 'email must be an email',
      password: 'password must be longer than 8 chars',
    });
  });

  it('matches camelCase fields in spaced messages', () => {
    const err = apiError(400, ['first name should not be empty']);
    expect(extractFieldErrors(err, ['firstName', 'lastName'])).toEqual({ firstName: 'first name should not be empty' });
  });
});
