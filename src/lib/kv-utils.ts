// Shared Vercel KV utilities — DRY helpers used across ranking-store, metrics, and API routes

import { timingSafeEqual } from 'crypto';

export function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
