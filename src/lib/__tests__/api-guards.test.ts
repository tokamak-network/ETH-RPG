import { describe, it, expect } from 'vitest';
import { isApiErrorResponse } from '@/lib/api-guards';

describe('isApiErrorResponse', () => {
  it('returns true for a valid error response shape', () => {
    const body = { error: { code: 'RATE_LIMITED', message: 'Too many requests.' } };
    expect(isApiErrorResponse(body)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isApiErrorResponse(null)).toBe(false);
  });

  it('returns false for a non-object', () => {
    expect(isApiErrorResponse('string')).toBe(false);
    expect(isApiErrorResponse(42)).toBe(false);
  });

  it('returns false when error field is missing', () => {
    expect(isApiErrorResponse({ data: 'ok' })).toBe(false);
  });

  it('returns false when error is not an object', () => {
    expect(isApiErrorResponse({ error: 'string' })).toBe(false);
  });

  it('returns false when error.code is missing', () => {
    expect(isApiErrorResponse({ error: { message: 'oops' } })).toBe(false);
  });

  it('returns false when error.message is missing', () => {
    expect(isApiErrorResponse({ error: { code: 'ERR' } })).toBe(false);
  });
});
