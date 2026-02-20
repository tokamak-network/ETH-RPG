'use client';

import { useState, useCallback } from 'react';
import type { LeaderboardResponse, LeaderboardType } from '@/lib/types';

type LeaderboardStatus = 'idle' | 'loading' | 'success' | 'error';

interface LeaderboardState {
  readonly status: LeaderboardStatus;
  readonly data: LeaderboardResponse | null;
  readonly error: string | null;
}

interface FetchOptions {
  readonly season?: string;
  readonly address?: string;
  readonly page?: number;
  readonly limit?: number;
}

const INITIAL_STATE: LeaderboardState = {
  status: 'idle',
  data: null,
  error: null,
};

export function useLeaderboard() {
  const [state, setState] = useState<LeaderboardState>(INITIAL_STATE);

  const fetchLeaderboard = useCallback(
    async (type: LeaderboardType, options?: FetchOptions): Promise<void> => {
      setState({ status: 'loading', data: null, error: null });

      try {
        const params = new URLSearchParams({ type });
        if (options?.season) params.set('season', options.season);
        if (options?.address) params.set('address', options.address);
        if (options?.page) params.set('page', String(options.page));
        if (options?.limit) params.set('limit', String(options.limit));

        const response = await fetch(`/api/ranking/leaderboard?${params.toString()}`);
        const body: unknown = await response.json();

        if (!response.ok) {
          const errorBody = body as { error?: { message?: string } };
          setState({
            status: 'error',
            data: null,
            error: errorBody?.error?.message ?? 'Failed to load leaderboard.',
          });
          return;
        }

        setState({
          status: 'success',
          data: body as LeaderboardResponse,
          error: null,
        });
      } catch {
        setState({
          status: 'error',
          data: null,
          error: 'Failed to connect to the ranking server.',
        });
      }
    },
    [],
  );

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    fetchLeaderboard,
  } as const;
}
