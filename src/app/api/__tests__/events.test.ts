import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock metrics module
vi.mock('@/lib/metrics', () => ({
  trackShare: vi.fn().mockResolvedValue(undefined),
  trackFunnel: vi.fn().mockResolvedValue(undefined),
  recordEvent: vi.fn().mockResolvedValue(undefined),
  incrementCounter: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

// Let route-utils and types run real (same as generate.test.ts)

import { trackShare, trackFunnel, recordEvent } from '@/lib/metrics';
import { checkRateLimit } from '@/lib/rate-limit';

const mockTrackShare = vi.mocked(trackShare);
const mockTrackFunnel = vi.mocked(trackFunnel);
const mockRecordEvent = vi.mocked(recordEvent);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

function createRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
    },
    body: JSON.stringify(body),
  });
}

function createRawRequest(rawBody: string): Request {
  return new Request('http://localhost:3000/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
    },
    body: rawBody,
  });
}

describe('POST /api/events', () => {
  let POST: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60000 });
    const mod = await import('@/app/api/events/route');
    POST = mod.POST as unknown as (request: Request) => Promise<Response>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 202 with { ok: true } for a valid event', async () => {
    const response = await POST(createRequest({ event: 'page_view', url: '/' }));
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data).toEqual({ ok: true });
    expect(mockRecordEvent).toHaveBeenCalledWith('page_view', expect.objectContaining({ url: '/' }));
  });

  it('returns 400 INVALID_EVENT when event field is missing', async () => {
    const response = await POST(createRequest({ url: '/' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_EVENT');
  });

  it('returns 400 INVALID_EVENT when event name exceeds 100 chars', async () => {
    const longName = 'x'.repeat(101);
    const response = await POST(createRequest({ event: longName }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_EVENT');
  });

  it('returns 400 INVALID_REQUEST for invalid JSON body', async () => {
    const response = await POST(createRawRequest('not valid json{{{'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 INVALID_EVENT for array body (body.event is undefined)', async () => {
    const response = await POST(createRequest([1, 2, 3]));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_EVENT');
  });

  it('returns 429 RATE_LIMITED when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const response = await POST(createRequest({ event: 'page_view' }));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error.code).toBe('RATE_LIMITED');
  });

  it('routes share_click events to trackShare', async () => {
    const response = await POST(createRequest({
      event: 'share_click',
      properties: { platform: 'twitter' },
    }));

    expect(response.status).toBe(202);
    expect(mockTrackShare).toHaveBeenCalledWith('twitter');
  });

  it('routes address_input_start to trackFunnel("input_focus")', async () => {
    const response = await POST(createRequest({ event: 'address_input_start' }));

    expect(response.status).toBe(202);
    expect(mockTrackFunnel).toHaveBeenCalledWith('input_focus');
  });

  it('routes funnel_* prefixed events to trackFunnel with stripped prefix', async () => {
    const response = await POST(createRequest({ event: 'funnel_landing' }));

    expect(response.status).toBe(202);
    expect(mockTrackFunnel).toHaveBeenCalledWith('landing');
  });

  it('sanitizes properties — drops nested objects, keeps primitives', async () => {
    const response = await POST(createRequest({
      event: 'custom_event',
      properties: {
        name: 'alice',
        count: 42,
        active: true,
        nested: { deep: 'value' },
        list: [1, 2, 3],
      },
    }));

    expect(response.status).toBe(202);
    expect(mockRecordEvent).toHaveBeenCalledWith(
      'custom_event',
      expect.objectContaining({ name: 'alice', count: 42, active: true }),
    );
    // Verify nested/array values were dropped
    const recordedProps = mockRecordEvent.mock.calls[0][1] as Record<string, unknown>;
    expect(recordedProps).not.toHaveProperty('nested');
    expect(recordedProps).not.toHaveProperty('list');
  });
});
