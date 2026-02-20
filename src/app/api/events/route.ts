// POST /api/events — Receive client-side analytics events.
// Records events in Vercel KV via metrics module.

import { NextRequest, NextResponse } from 'next/server';
import { trackShare, trackFunnel, recordEvent, incrementCounter } from '@/lib/metrics';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp, errorResponse } from '@/lib/route-utils';
import { ErrorCode } from '@/lib/types';

const MAX_EVENT_NAME_LENGTH = 100;
const MAX_URL_LENGTH = 2048;
const MAX_PROPERTIES_KEYS = 20;
const MAX_PROPERTY_VALUE_LENGTH = 500;

interface AnalyticsEvent {
  readonly event: string;
  readonly properties?: Record<string, unknown>;
  readonly url?: string;
  readonly referrer?: string;
  readonly timestamp?: number;
}

function sanitizeProperties(
  properties: Record<string, unknown> | undefined,
): Record<string, string | number | boolean> | undefined {
  if (!properties || typeof properties !== 'object') {
    return undefined;
  }

  const keys = Object.keys(properties).slice(0, MAX_PROPERTIES_KEYS);
  const sanitized: Record<string, string | number | boolean> = {};
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === 'string') {
      sanitized[key] = value.slice(0, MAX_PROPERTY_VALUE_LENGTH);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    }
    // Drop nested objects, arrays, and other complex types
  }
  return sanitized;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateResult = await checkRateLimit(clientIp);
  if (!rateResult.allowed) {
    return errorResponse(ErrorCode.RATE_LIMITED, 'Too many requests. Please try again later.', 429);
  }

  try {
    const body = await request.json() as AnalyticsEvent;

    if (!body.event || typeof body.event !== 'string') {
      return errorResponse(ErrorCode.INVALID_EVENT, 'Event name is required.', 400);
    }

    if (body.event.length > MAX_EVENT_NAME_LENGTH) {
      return errorResponse(ErrorCode.INVALID_EVENT, 'Event name exceeds maximum length.', 400);
    }

    const safeUrl = typeof body.url === 'string' ? body.url.slice(0, MAX_URL_LENGTH) : undefined;
    const safeProperties = sanitizeProperties(body.properties);

    // Route to appropriate metric tracking
    if (body.event === 'share_click' && safeProperties?.platform) {
      trackShare(String(safeProperties.platform)).catch(() => {});
    } else if (body.event === 'address_input_start') {
      trackFunnel('input_focus').catch(() => {});
    } else if (body.event === 'generate_start') {
      trackFunnel('generate_start').catch(() => {});
    } else if (body.event === 'card_generated') {
      trackFunnel('generate_success').catch(() => {});
    } else if (body.event.startsWith('funnel_')) {
      const step = body.event.replace('funnel_', '');
      trackFunnel(step).catch(() => {});
    } else if (body.event === 'page_view') {
      const page = safeProperties?.page ?? safeUrl ?? 'unknown';
      incrementCounter(`funnel_${String(page)}`).catch(() => {});
    }

    // Always record the raw event
    recordEvent(body.event, {
      ...safeProperties,
      ...(safeUrl ? { url: safeUrl } : {}),
    }).catch(() => {});

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return errorResponse(ErrorCode.INVALID_REQUEST, 'Invalid request format.', 400);
  }
}
