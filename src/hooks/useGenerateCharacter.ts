'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { GenerateResponse, ApiErrorResponse } from '@/lib/types';
import { ERROR_MESSAGES, ErrorCode } from '@/lib/types';

type GenerateStatus = 'idle' | 'loading' | 'success' | 'error';

interface GenerateState {
  readonly status: GenerateStatus;
  readonly data: GenerateResponse | null;
  readonly error: string | null;
  readonly step: string;
}

const LOADING_STEPS: readonly string[] = [
  '\uD2B8\uB79C\uC7AD\uC158 \uBD84\uC11D \uC911...',
  '\uC2A4\uD0EF \uACC4\uC0B0 \uC911...',
  '\uC9C1\uC5C5 \uD310\uC815 \uC911...',
  '\uC601\uC6C5 \uC11C\uC0AC \uC791\uC131 \uC911...',
] as const;

const STEP_INTERVAL_MS = 1500;

const INITIAL_STATE: GenerateState = {
  status: 'idle',
  data: null,
  error: null,
  step: '',
};

function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
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

export function useGenerateCharacter() {
  const [state, setState] = useState<GenerateState>(INITIAL_STATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearStepInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearStepInterval();
      if (abortControllerRef.current !== null) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearStepInterval]);

  const startStepRotation = useCallback(() => {
    let stepIndex = 0;
    setState((prev) => ({ ...prev, step: LOADING_STEPS[0] }));

    intervalRef.current = setInterval(() => {
      stepIndex = (stepIndex + 1) % LOADING_STEPS.length;
      setState((prev) => ({ ...prev, step: LOADING_STEPS[stepIndex] }));
    }, STEP_INTERVAL_MS);
  }, []);

  const generate = useCallback(
    async (address: string): Promise<void> => {
      // Cancel any in-flight request
      if (abortControllerRef.current !== null) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      clearStepInterval();

      setState({
        status: 'loading',
        data: null,
        error: null,
        step: LOADING_STEPS[0],
      });

      startStepRotation();

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
          signal: controller.signal,
        });

        const body: unknown = await response.json();

        if (!response.ok) {
          const errorMessage = isApiErrorResponse(body)
            ? body.error.message
            : ERROR_MESSAGES[ErrorCode.API_ERROR];

          clearStepInterval();
          setState({
            status: 'error',
            data: null,
            error: errorMessage,
            step: '',
          });
          return;
        }

        clearStepInterval();
        setState({
          status: 'success',
          data: body as GenerateResponse,
          error: null,
          step: '',
        });
      } catch (err: unknown) {
        // Ignore abort errors
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        clearStepInterval();
        setState({
          status: 'error',
          data: null,
          error: ERROR_MESSAGES[ErrorCode.API_ERROR],
          step: '',
        });
      }
    },
    [clearStepInterval, startStepRotation],
  );

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    step: state.step,
    generate,
  } as const;
}
