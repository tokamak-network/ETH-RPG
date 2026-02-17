// POST /api/generate — Main character generation endpoint
// Input: { address: string } (0x... or ENS)
// Output: GenerateResponse | ApiErrorResponse

import { NextRequest, NextResponse } from 'next/server';
import { fetchWalletData } from '@/lib/alchemy';
import { classifyTransactions } from '@/lib/classifier';
import { calculateStats } from '@/lib/stats';
import { determineClass } from '@/lib/class';
import { generateLore } from '@/lib/lore';
import { getCached, setCache } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  getRelevantEvents,
  describeActivityPattern,
  formatWalletAge,
} from '@/lib/crypto-events';
import type { GenerateResponse, LoreInputData } from '@/lib/types';
import { ErrorCode } from '@/lib/types';

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ENS_REGEX = /^[a-zA-Z0-9-]+\.eth$/;
const MAX_INPUT_LENGTH = 256;

function isValidInput(input: string): boolean {
  if (input.length > MAX_INPUT_LENGTH) {
    return false;
  }
  return ETH_ADDRESS_REGEX.test(input) || ENS_REGEX.test(input);
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}

function formatTimestamp(ts: number | null): string {
  if (ts === null) {
    return '기록 없음';
  }
  return new Date(ts).toISOString().split('T')[0];
}

function errorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit check
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp);

  if (!rateLimitResult.allowed) {
    return errorResponse(
      ErrorCode.RATE_LIMITED,
      '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
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
        '올바른 이더리움 주소를 입력해주세요.',
        400,
      );
    }
    address = body.address.trim().toLowerCase();
  } catch {
    return errorResponse(
      ErrorCode.INVALID_ADDRESS,
      '올바른 요청 형식이 아닙니다.',
      400,
    );
  }

  if (!isValidInput(address)) {
    return errorResponse(
      ErrorCode.INVALID_ADDRESS,
      '올바른 이더리움 주소를 입력해주세요.',
      400,
    );
  }

  // Cache check
  const cached = getCached(address);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    // 1. Fetch on-chain data
    const rawData = await fetchWalletData(address);

    // 2. Validate wallet has transactions
    if (rawData.txCount === 0 && rawData.transfers.length === 0) {
      return errorResponse(
        ErrorCode.NO_TRANSACTIONS,
        '이 지갑에는 트랜잭션이 없습니다. 활동 이력이 있는 주소를 입력해주세요.',
        400,
      );
    }

    // 3. Classify transactions
    const classification = classifyTransactions(rawData.transfers);

    // 4. Calculate stats
    const stats = calculateStats(rawData, classification);

    // 5. Determine class
    const characterClass = determineClass(rawData, classification);

    // 6. Prepare lore input data
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const loreInput: LoreInputData = {
      className: characterClass.name,
      classNameEn: characterClass.nameEn,
      level: stats.level,
      power: stats.power,
      txCount: rawData.txCount,
      walletAgeDescription: formatWalletAge(rawData.firstTxTimestamp),
      firstTxDate: formatTimestamp(rawData.firstTxTimestamp),
      lastTxDate: formatTimestamp(rawData.lastTxTimestamp),
      relevantEvents: getRelevantEvents(
        rawData.firstTxTimestamp,
        rawData.lastTxTimestamp,
      ),
      activityPattern: describeActivityPattern(classification),
    };

    // 7. Generate lore
    const lore = await generateLore(loreInput);

    // 8. Build response
    const resolvedAddress = rawData.address;
    const response: GenerateResponse = {
      address: resolvedAddress,
      ...(rawData.ensName ? { ensName: rawData.ensName } : {}),
      stats,
      class: characterClass,
      lore,
      cardImageUrl: `${siteUrl}/api/card/${resolvedAddress}`,
      ogImageUrl: `${siteUrl}/api/og/${resolvedAddress}`,
      cached: false,
    };

    // 9. Cache the result
    setCache(resolvedAddress, response);

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Differentiate between known error types
    if (message.includes('ENS name') || message.includes('Invalid Ethereum')) {
      return errorResponse(ErrorCode.INVALID_ADDRESS, message, 400);
    }

    return errorResponse(
      ErrorCode.API_ERROR,
      '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      500,
    );
  }
}
