// POST /api/events — Receive client-side analytics events.
// Logs events in structured format for Vercel logs / Sentry.
// Can be extended to forward to an external analytics service.

import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

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
): Record<string, unknown> | undefined {
  if (!properties || typeof properties !== 'object') {
    return undefined;
  }

  const keys = Object.keys(properties).slice(0, MAX_PROPERTIES_KEYS);
  const sanitized: Record<string, unknown> = {};
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as AnalyticsEvent;

    if (!body.event || typeof body.event !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (body.event.length > MAX_EVENT_NAME_LENGTH) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const safeUrl = typeof body.url === 'string' ? body.url.slice(0, MAX_URL_LENGTH) : undefined;
    const safeReferrer = typeof body.referrer === 'string' ? body.referrer.slice(0, MAX_URL_LENGTH) : undefined;
    const safeProperties = sanitizeProperties(body.properties);

    // Structured log — visible in Vercel function logs
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: body.event,
      data: {
        ...safeProperties,
        url: safeUrl,
        referrer: safeReferrer,
      },
      level: 'info',
    });

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
