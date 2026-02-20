// POST /api/generate — Main character generation endpoint
// Input: { address: string } (0x... or ENS)
// Output: GenerateResponse | ApiErrorResponse

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { generateCharacterData, EmptyWalletError } from '@/lib/pipeline';
import { checkRateLimit } from '@/lib/rate-limit';
import { isValidInput, getClientIp, errorResponse } from '@/lib/route-utils';
import { ErrorCode } from '@/lib/types';
import { trackGenerate, trackError } from '@/lib/metrics';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit check
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp);

  if (!rateLimitResult.allowed) {
    return errorResponse(
      ErrorCode.RATE_LIMITED,
      'Too many requests. Please try again later.',
      429,
    );
  }

  // Parse and validate input
  let address: string;
  try {
    const body = await request.json() as { address?: unknown };
    if (typeof body.address !== 'string' || body.address.trim().length === 0) {
      return errorResponse(
        ErrorCode.INVALID_ADDRESS,
        'Please enter a valid Ethereum address.',
        400,
      );
    }
    address = body.address.trim().toLowerCase();
  } catch {
    return errorResponse(
      ErrorCode.INVALID_ADDRESS,
      'Invalid request format.',
      400,
    );
  }

  if (!isValidInput(address)) {
    return errorResponse(
      ErrorCode.INVALID_ADDRESS,
      'Please enter a valid Ethereum address.',
      400,
    );
  }

  try {
    const response = await generateCharacterData(address);

    // Fire-and-forget: server-side metrics
    trackGenerate(response.class.id, response.cached).catch(() => {});

    const cacheControl = response.cached
      ? 'public, max-age=300, s-maxage=3600'
      : 'private, no-cache';
    return NextResponse.json(response, {
      headers: { 'Cache-Control': cacheControl },
    });
  } catch (error) {
    if (error instanceof EmptyWalletError) {
      trackError('empty_wallet').catch(() => {});
      return errorResponse(
        ErrorCode.NO_TRANSACTIONS,
        'This wallet has no transactions. Please enter an address with activity history.',
        400,
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    Sentry.captureException(error);
    trackError('api').catch(() => {});

    // Differentiate between known error types
    if (message.includes('ENS name') || message.includes('Invalid Ethereum')) {
      return errorResponse(ErrorCode.INVALID_ADDRESS, message, 400);
    }

    return errorResponse(
      ErrorCode.API_ERROR,
      process.env.NODE_ENV === 'development'
        ? `Server error: ${message}`
        : 'A temporary server error occurred. Please try again later.',
      500,
    );
  }
}
