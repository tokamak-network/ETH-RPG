// Shared utilities for API route handlers.

import { NextRequest, NextResponse } from 'next/server';

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ENS_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.eth$/;
const MAX_INPUT_LENGTH = 256;

/** Validate that input is a valid Ethereum address or ENS name. */
export function isValidInput(input: string): boolean {
  if (input.length > MAX_INPUT_LENGTH) {
    return false;
  }
  return ETH_ADDRESS_REGEX.test(input) || ENS_REGEX.test(input);
}

/** Validate that input is a valid Ethereum address or ENS name (no length limit, for OG routes). */
export function isValidAddress(input: string): boolean {
  return ETH_ADDRESS_REGEX.test(input) || ENS_REGEX.test(input);
}

/** Extract client IP from request headers (respects x-forwarded-for from reverse proxy). */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}

/** Build a standardized JSON error response. */
export function errorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status },
  );
}
