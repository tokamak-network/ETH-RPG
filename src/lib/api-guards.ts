// Shared runtime type guards for API response shapes

import type { ApiErrorResponse, ErrorCodeType } from '@/lib/types';
import { ErrorCode, ERROR_MESSAGES } from '@/lib/types';

export interface ErrorInfo {
  readonly code: ErrorCodeType;
  readonly message: string;
}

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

/** Extract error code + message from an API response body. Falls back to API_ERROR. */
export function extractErrorInfo(body: unknown): ErrorInfo {
  if (isApiErrorResponse(body)) {
    return { code: body.error.code, message: body.error.message };
  }
  return { code: ErrorCode.API_ERROR, message: ERROR_MESSAGES[ErrorCode.API_ERROR] };
}
