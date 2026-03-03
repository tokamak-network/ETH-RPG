'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ClassWarStandings } from '@/lib/classwar-types';

function isValidStandings(value: unknown): value is ClassWarStandings {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.weekId === 'string' &&
    typeof obj.week === 'object' && obj.week !== null &&
    Array.isArray(obj.scores) &&
    typeof obj.totalBattles === 'number' &&
    typeof obj.updatedAt === 'number'
  );
}

type ClassWarStatus = 'idle' | 'loading' | 'success' | 'error';

interface ClassWarState {
  readonly status: ClassWarStatus;
  readonly data: ClassWarStandings | null;
  readonly error: string | null;
}

const INITIAL_STATE: ClassWarState = {
  status: 'idle',
  data: null,
  error: null,
};

export function useClassWar() {
  const [state, setState] = useState<ClassWarState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current !== null) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchStandings = useCallback(async (): Promise<void> => {
    if (abortControllerRef.current !== null) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState({ status: 'loading', data: null, error: null });

    try {
      const response = await fetch('/api/classwar/standings', {
        signal: controller.signal,
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const errorBody = body as { error?: { message?: string } };
        setState({
          status: 'error',
          data: null,
          error: errorBody?.error?.message ?? 'Failed to load Class War standings.',
        });
        return;
      }

      if (!isValidStandings(body)) {
        setState({
          status: 'error',
          data: null,
          error: 'Unexpected response format from server.',
        });
        return;
      }

      setState({
        status: 'success',
        data: body,
        error: null,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setState({
        status: 'error',
        data: null,
        error: 'Failed to connect to the Class War server.',
      });
    }
  }, []);

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    fetchStandings,
  } as const;
}
