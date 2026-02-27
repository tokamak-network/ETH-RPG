import { describe, it, expect } from 'vitest';
import { isApiErrorResponse, extractErrorInfo } from '@/lib/api-guards';
import { ErrorCode } from '@/lib/types';

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

describe('extractErrorInfo', () => {
  it('extracts code and message from a valid API error response', () => {
    const body = { error: { code: 'NO_TRANSACTIONS', message: 'No tx.' } };
    const result = extractErrorInfo(body);
    expect(result).toEqual({ code: 'NO_TRANSACTIONS', message: 'No tx.' });
  });

  it('returns API_ERROR code for non-API error shapes', () => {
    const result = extractErrorInfo('not an object');
    expect(result.code).toBe(ErrorCode.API_ERROR);
    expect(result.message).toBeTruthy();
  });

  it('returns API_ERROR code for null body', () => {
    const result = extractErrorInfo(null);
    expect(result.code).toBe(ErrorCode.API_ERROR);
  });

  it('preserves all known error codes', () => {
    const body = { error: { code: 'RATE_LIMITED', message: 'Slow down.' } };
    const result = extractErrorInfo(body);
    expect(result.code).toBe('RATE_LIMITED');
    expect(result.message).toBe('Slow down.');
  });
});
