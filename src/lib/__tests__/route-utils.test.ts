import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { isValidInput, isValidAddress, isValidNonce, getClientIp, errorResponse } from '@/lib/route-utils';

describe('isValidInput', () => {
  it('accepts a valid Ethereum address', () => {
    expect(isValidInput('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(true);
  });

  it('accepts a valid ENS name', () => {
    expect(isValidInput('vitalik.eth')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidInput('')).toBe(false);
  });

  it('rejects input exceeding 256 characters', () => {
    const longInput = '0x' + 'a'.repeat(255);
    expect(isValidInput(longInput)).toBe(false);
  });

  it('rejects an invalid address', () => {
    expect(isValidInput('not-an-address')).toBe(false);
  });

  it('rejects address with wrong length', () => {
    expect(isValidInput('0x123')).toBe(false);
  });
});

describe('isValidAddress', () => {
  it('accepts a valid Ethereum address without length limit', () => {
    expect(isValidAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(true);
  });

  it('accepts ENS names', () => {
    expect(isValidAddress('vitalik.eth')).toBe(true);
  });

  it('rejects invalid input', () => {
    expect(isValidAddress('not-valid')).toBe(false);
  });
});

describe('isValidNonce', () => {
  it('accepts a valid UUID v4', () => {
    expect(isValidNonce('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
  });

  it('accepts uppercase UUID', () => {
    expect(isValidNonce('A1B2C3D4-E5F6-7890-ABCD-EF1234567890')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidNonce('')).toBe(false);
  });

  it('rejects a non-UUID string', () => {
    expect(isValidNonce('not-a-uuid')).toBe(false);
  });

  it('rejects a UUID without dashes', () => {
    expect(isValidNonce('a1b2c3d4e5f67890abcdef1234567890')).toBe(false);
  });

  it('rejects an excessively long string', () => {
    expect(isValidNonce('a'.repeat(1000))).toBe(false);
  });
});

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });

    expect(getClientIp(request)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip header', () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-real-ip': '10.0.0.1' },
    });

    expect(getClientIp(request)).toBe('10.0.0.1');
  });

  it('returns 127.0.0.1 when no IP headers are present', () => {
    const request = new NextRequest('http://localhost:3000/api/test');

    expect(getClientIp(request)).toBe('127.0.0.1');
  });
});

describe('errorResponse', () => {
  it('returns a JSON response with error structure', async () => {
    const response = errorResponse('INVALID_ADDRESS', 'Bad address', 400);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: { code: 'INVALID_ADDRESS', message: 'Bad address' },
    });
  });

  it('returns correct status code', async () => {
    const response = errorResponse('RATE_LIMITED', 'Too many requests', 429);

    expect(response.status).toBe(429);
  });

  it('includes Cache-Control: private, no-store header', () => {
    const response = errorResponse('API_ERROR', 'Server error', 500);

    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
