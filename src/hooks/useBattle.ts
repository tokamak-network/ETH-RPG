'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { BattleResponse } from '@/lib/types';
import { ERROR_MESSAGES, ErrorCode } from '@/lib/types';
import { isApiErrorResponse } from '@/lib/api-guards';

type BattleStatus = 'idle' | 'loading' | 'success' | 'error';

interface BattleState {
  readonly status: BattleStatus;
  readonly data: BattleResponse | null;
  readonly error: string | null;
  readonly step: string;
}

const LOADING_STEPS: readonly string[] = [
  'Summoning challengers...',
  'Analyzing matchup...',
  'Calculating battle odds...',
  'Simulating combat...',
  'Recording the legend...',
] as const;

const STEP_INTERVAL_MS = 1200;

const INITIAL_STATE: BattleState = {
  status: 'idle',
  data: null,
  error: null,
  step: '',
};

export function useBattle() {
  const [state, setState] = useState<BattleState>(INITIAL_STATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearStepInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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

  const startBattle = useCallback(
    async (addr1: string, addr2: string, nonce?: string): Promise<void> => {
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
        const body: Record<string, string> = { address1: addr1, address2: addr2 };
        if (nonce) {
          body.nonce = nonce;
        }

        const response = await fetch('/api/battle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]),
        });

        const responseBody: unknown = await response.json();

        if (!response.ok) {
          const errorMessage = isApiErrorResponse(responseBody)
            ? responseBody.error.message
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
          data: responseBody as BattleResponse,
          error: null,
          step: '',
        });
      } catch (err: unknown) {
        // Ignore user-initiated abort errors
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        const isTimeout = err instanceof DOMException && err.name === 'TimeoutError';

        clearStepInterval();
        setState({
          status: 'error',
          data: null,
          error: isTimeout
            ? 'The request timed out. Please try again.'
            : ERROR_MESSAGES[ErrorCode.API_ERROR],
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
    startBattle,
  } as const;
}
