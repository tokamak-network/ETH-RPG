// POST /api/battle — PvP Battle endpoint
// Input: { address1: string, address2: string, nonce?: string }
// Output: BattleResponse | ApiErrorResponse

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { generateCharacterData, EmptyWalletError } from '@/lib/pipeline';
import { simulateBattle } from '@/lib/battle';
import { checkRateLimit } from '@/lib/rate-limit';
import { getCachedBattle, setCachedBattle } from '@/lib/battle-cache';
import { isValidInput, isValidNonce, getClientIp, errorResponse } from '@/lib/route-utils';
import { ErrorCode } from '@/lib/types';
import type { BattleFighter, BattleResponse } from '@/lib/types';
import { trackBattle, trackError } from '@/lib/metrics';
import { recordBattleForRanking } from '@/lib/ranking-recorder';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp);
  if (!rateLimitResult.allowed) {
    return errorResponse(ErrorCode.RATE_LIMITED, 'Too many requests. Please try again later.', 429);
  }

  // Parse body
  let address1: string;
  let address2: string;
  let nonce: string | undefined;

  try {
    const body = await request.json() as {
      address1?: unknown;
      address2?: unknown;
      nonce?: unknown;
    };

    if (typeof body.address1 !== 'string' || body.address1.trim().length === 0) {
      return errorResponse(ErrorCode.INVALID_ADDRESS, 'Please enter a valid first address.', 400);
    }
    if (typeof body.address2 !== 'string' || body.address2.trim().length === 0) {
      return errorResponse(ErrorCode.INVALID_ADDRESS, 'Please enter a valid second address.', 400);
    }

    address1 = body.address1.trim().toLowerCase();
    address2 = body.address2.trim().toLowerCase();

    if (typeof body.nonce === 'string' && body.nonce.trim().length > 0) {
      const trimmedNonce = body.nonce.trim();
      if (!isValidNonce(trimmedNonce)) {
        return errorResponse(ErrorCode.INVALID_ADDRESS, 'Invalid battle nonce format.', 400);
      }
      nonce = trimmedNonce;
    }
  } catch {
    return errorResponse(ErrorCode.INVALID_ADDRESS, 'Invalid request format.', 400);
  }

  // Validate addresses
  if (!isValidInput(address1)) {
    return errorResponse(ErrorCode.INVALID_ADDRESS, 'Please enter a valid first Ethereum address.', 400);
  }
  if (!isValidInput(address2)) {
    return errorResponse(ErrorCode.INVALID_ADDRESS, 'Please enter a valid second Ethereum address.', 400);
  }

  // Same address check
  if (address1 === address2) {
    return errorResponse(ErrorCode.SAME_ADDRESS, 'Cannot battle yourself. Please enter two different addresses.', 400);
  }

  // Check battle cache (only if nonce provided — replaying a battle)
  if (nonce) {
    const cached = getCachedBattle(address1, address2, nonce);
    if (cached) {
      trackBattle(true).catch(() => {});
      return NextResponse.json({ ...cached, cached: true }, {
        headers: { 'Cache-Control': 'public, max-age=86400, immutable' },
      });
    }
  }

  try {
    // Generate both characters in parallel (skip AI lore for speed)
    const [char1, char2] = await Promise.all([
      generateCharacterData(address1, { skipAiLore: true }),
      generateCharacterData(address2, { skipAiLore: true }),
    ]);

    // Build fighters
    const fighter0: BattleFighter = {
      address: char1.address,
      ...(char1.ensName ? { ensName: char1.ensName } : {}),
      class: char1.class,
      stats: char1.stats,
      achievements: char1.achievements,
    };
    const fighter1: BattleFighter = {
      address: char2.address,
      ...(char2.ensName ? { ensName: char2.ensName } : {}),
      class: char2.class,
      stats: char2.stats,
      achievements: char2.achievements,
    };

    // Generate nonce if not provided
    const battleNonce = nonce ?? crypto.randomUUID();

    // Simulate
    const result = simulateBattle(fighter0, fighter1, battleNonce);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const response: BattleResponse = {
      result,
      battleImageUrl: `${siteUrl}/api/og/battle/${char1.address}/${char2.address}?n=${battleNonce}`,
      ogImageUrl: `${siteUrl}/api/og/battle/${char1.address}/${char2.address}?n=${battleNonce}`,
      cached: false,
    };

    // Cache the result
    setCachedBattle(address1, address2, battleNonce, response);

    // Fire-and-forget: server-side metrics + ranking
    trackBattle(false).catch(() => {});
    recordBattleForRanking(fighter0, fighter1, result).catch(() => {});

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, no-cache' },
    });
  } catch (error) {
    if (error instanceof EmptyWalletError) {
      trackError('empty_wallet').catch(() => {});
      return errorResponse(
        ErrorCode.NO_TRANSACTIONS,
        'One of the wallets has no transactions.',
        400,
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    Sentry.captureException(error);
    trackError('api').catch(() => {});

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
