// POST /api/generate — Main character generation endpoint
// Input: { address: string } (0x... or ENS)
// Output: GenerateResponse | ApiErrorResponse

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { generateCharacterData, EmptyWalletError } from '@/lib/pipeline';
import { checkRateLimit } from '@/lib/rate-limit';
import { ErrorCode } from '@/lib/types';

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ENS_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.eth$/;
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

  try {
    const response = await generateCharacterData(address);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof EmptyWalletError) {
      return errorResponse(
        ErrorCode.NO_TRANSACTIONS,
        '이 지갑에는 트랜잭션이 없습니다. 활동 이력이 있는 주소를 입력해주세요.',
        400,
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';

    Sentry.captureException(error);

    // Differentiate between known error types
    if (message.includes('ENS name') || message.includes('Invalid Ethereum')) {
      return errorResponse(ErrorCode.INVALID_ADDRESS, message, 400);
    }

    return errorResponse(
      ErrorCode.API_ERROR,
      process.env.NODE_ENV === 'development'
        ? `서버 오류: ${message}`
        : '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      500,
    );
  }
}
