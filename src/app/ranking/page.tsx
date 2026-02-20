'use client';

import { useState, useEffect, useCallback } from 'react';
import TrustBanner from '@/components/TrustBanner';
import SeasonInfoBar from '@/components/SeasonInfoBar';
import RankingTabs from '@/components/RankingTabs';
import LeaderboardTable from '@/components/LeaderboardTable';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { usePageView } from '@/hooks/useAnalytics';
import type { LeaderboardType, Season } from '@/lib/types';

export default function RankingPage() {
  usePageView('ranking');

  const [activeTab, setActiveTab] = useState<LeaderboardType>('power');
  const [season, setSeason] = useState<Season | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const { status, data, error, fetchLeaderboard } = useLeaderboard();

  // Fetch season info
  useEffect(() => {
    fetch('/api/ranking/season')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((body: { season: Season | null } | null) => {
        if (body?.season) setSeason(body.season);
      })
      .catch(() => { /* season fetch failed silently */ });
  }, []);

  // Fetch leaderboard whenever tab changes
  useEffect(() => {
    fetchLeaderboard(activeTab, {
      address: searchAddress || undefined,
    });
  }, [activeTab, fetchLeaderboard, searchAddress]);

  const handleTabChange = useCallback((tab: LeaderboardType) => {
    setActiveTab(tab);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchLeaderboard(activeTab, {
      address: searchAddress || undefined,
    });
  }, [activeTab, searchAddress, fetchLeaderboard]);

  return (
    <div className="min-h-screen flex flex-col bg-atmosphere">
      <TrustBanner />

      <main className="relative z-10 flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Page title */}
          <div className="text-center">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: '#f4c430', fontFamily: 'var(--font-display)' }}
            >
              Leaderboard
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Season rankings updated every 30 minutes
            </p>
          </div>

          {/* Season info */}
          <SeasonInfoBar season={season} />

          {/* Tabs */}
          <RankingTabs activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Search by wallet address or ENS..."
              className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
            <button
              type="submit"
              className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#f4c430', color: '#0a0a0f' }}
            >
              Find
            </button>
          </form>

          {/* Leaderboard content */}
          {status === 'loading' && (
            <div className="text-center py-12">
              <div
                className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#f4c430', borderTopColor: 'transparent' }}
              />
              <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Loading rankings...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          {status === 'success' && data && data.entries.length > 0 && (
            <LeaderboardTable
              type={activeTab}
              entries={data.entries}
              playerRank={data.playerRank}
              totalPlayers={data.totalPlayers}
            />
          )}

          {status === 'success' && data && data.entries.length === 0 && (
            <div className="text-center py-16">
              <p
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                No rankings yet
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Battle other wallets to appear on the leaderboard.
                Rankings update every 30 minutes.
              </p>
            </div>
          )}

          {/* Back link */}
          <div className="text-center pt-4">
            <a
              href="/"
              className="text-sm transition-colors hover:underline"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
