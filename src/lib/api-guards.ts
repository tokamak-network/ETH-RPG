// Shared runtime type guards for API response shapes

import type { ApiErrorResponse } from '@/lib/types';

/** Narrow unknown response body to ApiErrorResponse. */
export function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as ApiErrorResponse).error === 'object' &&
    (body as ApiErrorResponse).error !== null &&
    'code' in (body as ApiErrorResponse).error &&
    'message' in (body as ApiErrorResponse).error
  );
}
