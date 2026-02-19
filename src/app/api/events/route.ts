// POST /api/events — Receive client-side analytics events.
// Logs events in structured format for Vercel logs / Sentry.
// Can be extended to forward to an external analytics service.

import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

interface AnalyticsEvent {
  readonly event: string;
  readonly properties?: Record<string, unknown>;
  readonly url?: string;
  readonly referrer?: string;
  readonly timestamp?: number;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as AnalyticsEvent;

    if (!body.event || typeof body.event !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Structured log — visible in Vercel function logs
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: body.event,
      data: {
        ...body.properties,
        url: body.url,
        referrer: body.referrer,
      },
      level: 'info',
    });

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
