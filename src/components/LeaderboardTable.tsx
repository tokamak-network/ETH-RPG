'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type {
  LeaderboardType,
  PowerRankingEntry,
  BattleRankingEntry,
  ExplorerRankingEntry,
  RankingEntry,
  CharacterClassId,
} from '@/lib/types';
import { CLASS_THEMES, CLASS_LABELS } from '@/styles/themes';
import { formatDisplayName } from '@/lib/format-utils';

interface LeaderboardTableProps {
  readonly type: LeaderboardType;
  readonly entries: readonly RankingEntry[];
  readonly playerRank?: number;
  readonly totalPlayers: number;
}

const RANK_BADGES: Record<number, string> = {
  1: '\u{1F947}',
  2: '\u{1F948}',
  3: '\u{1F949}',
};

function ClassBadge({ classId }: { readonly classId: CharacterClassId }) {
  const theme = CLASS_THEMES[classId];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
    >
      <span aria-hidden="true">{theme.icon}</span> {CLASS_LABELS[classId]}
    </span>
  );
}

function RankCell({ rank }: { readonly rank: number }) {
  const badge = RANK_BADGES[rank];
  return (
    <td className="px-3 py-3 text-center w-16">
      {badge ? (
        <span className="text-lg" aria-hidden="true">{badge}</span>
      ) : (
        <span className="tabular-nums text-sm" style={{ color: 'var(--color-text-muted)' }}>
          #{rank}
        </span>
      )}
    </td>
  );
}

interface ClickableRowProps {
  readonly address: string;
  readonly classId: CharacterClassId;
  readonly label: string;
  readonly withShadow?: boolean;
  readonly children: ReactNode;
}

function ClickableRow({ address, classId, label, withShadow, children }: ClickableRowProps) {
  const router = useRouter();
  const theme = CLASS_THEMES[classId];
  const [hovered, setHovered] = useState(false);
  const navigate = () => router.push(`/result/${address}`);
  return (
    <tr
      className="transition-colors duration-150 cursor-pointer"
      style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: hovered ? `${theme.primary}08` : 'transparent',
        boxShadow: hovered && withShadow ? `inset 0 0 20px ${theme.primary}05` : 'none',
      }}
      tabIndex={0}
      aria-label={label}
      onClick={navigate}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {children}
    </tr>
  );
}

function PowerRow({ entry }: { readonly entry: PowerRankingEntry }) {
  return (
    <ClickableRow
      address={entry.address}
      classId={entry.classId}
      label={`View ${formatDisplayName(entry.address, entry.ensName)} profile`}
      withShadow
    >
      <RankCell rank={entry.rank} />
      <td className="px-3 py-3"><ClassBadge classId={entry.classId} /></td>
      <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {formatDisplayName(entry.address, entry.ensName)}
      </td>
      <td className="px-3 py-3 text-sm text-center tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
        Lv.{entry.level}
      </td>
      <td className="px-3 py-3 text-sm text-right tabular-nums font-bold" style={{ color: '#f4c430' }}>
        {entry.power.toLocaleString()}
      </td>
    </ClickableRow>
  );
}

function BattleRow({ entry }: { readonly entry: BattleRankingEntry }) {
  return (
    <ClickableRow
      address={entry.address}
      classId={entry.classId}
      label={`View ${formatDisplayName(entry.address, entry.ensName)} profile`}
    >
      <RankCell rank={entry.rank} />
      <td className="px-3 py-3"><ClassBadge classId={entry.classId} /></td>
      <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {formatDisplayName(entry.address, entry.ensName)}
      </td>
      <td className="px-3 py-3 text-sm text-center tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
        <span style={{ color: '#22c55e' }}>{entry.wins}W</span>
        {' - '}
        <span style={{ color: '#ef4444' }}>{entry.losses}L</span>
      </td>
      <td className="px-3 py-3 text-sm text-center tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
        {entry.winRate}%
      </td>
      <td className="px-3 py-3 text-sm text-right tabular-nums font-bold" style={{ color: '#f4c430' }}>
        {entry.ratingScore.toLocaleString()}
      </td>
    </ClickableRow>
  );
}

function ExplorerRow({ entry }: { readonly entry: ExplorerRankingEntry }) {
  return (
    <ClickableRow
      address={entry.address}
      classId={entry.classId}
      label={`View ${formatDisplayName(entry.address, entry.ensName)} profile`}
    >
      <RankCell rank={entry.rank} />
      <td className="px-3 py-3"><ClassBadge classId={entry.classId} /></td>
      <td className="px-3 py-3 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {formatDisplayName(entry.address, entry.ensName)}
      </td>
      <td className="px-3 py-3 text-sm text-center tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
        {entry.achievementCount}
      </td>
      <td className="px-3 py-3 text-sm text-right tabular-nums font-bold" style={{ color: '#f4c430' }}>
        {entry.explorerScore.toLocaleString()}
      </td>
    </ClickableRow>
  );
}

function PowerHeader() {
  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      <th className="px-3 py-2 text-xs font-semibold text-center" style={{ color: 'var(--color-text-muted)' }}>Rank</th>
      <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: 'var(--color-text-muted)' }}>Class</th>
      <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: 'var(--color-text-muted)' }}>Address</th>
      <th className="px-3 py-2 text-xs font-semibold text-center" style={{ color: 'var(--color-text-muted)' }}>Level</th>
      <th className="px-3 py-2 text-xs font-semibold text-right" style={{ color: 'var(--color-text-muted)' }}>Power</th>
    </tr>
  );
}

function BattleHeader() {
  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      <th className="px-3 py-2 text-xs font-semibold text-center" style={{ color: 'var(--color-text-muted)' }}>Rank</th>
      <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: 'var(--color-text-muted)' }}>Class</th>
      <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: 'var(--color-text-muted)' }}>Address</th>
      <th className="px-3 py-2 text-xs font-semibold text-center" style={{ color: 'var(--color-text-muted)' }}>Record</th>
      <th className="px-3 py-2 text-xs font-semibold text-center" style={{ color: 'var(--color-text-muted)' }}>Win %</th>
      <th className="px-3 py-2 text-xs font-semibold text-right" style={{ color: 'var(--color-text-muted)' }}>Score</th>
    </tr>
  );
}

function ExplorerHeader() {
  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      <th className="px-3 py-2 text-xs font-semibold text-center" style={{ color: 'var(--color-text-muted)' }}>Rank</th>
      <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: 'var(--color-text-muted)' }}>Class</th>
      <th className="px-3 py-2 text-xs font-semibold text-left" style={{ color: 'var(--color-text-muted)' }}>Address</th>
      <th className="px-3 py-2 text-xs font-semibold text-center" style={{ color: 'var(--color-text-muted)' }}>Badges</th>
      <th className="px-3 py-2 text-xs font-semibold text-right" style={{ color: 'var(--color-text-muted)' }}>Score</th>
    </tr>
  );
}

export default function LeaderboardTable({
  type,
  entries,
  playerRank,
  totalPlayers,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          No rankings yet
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {type === 'battle'
            ? 'Battle other wallets to appear on this leaderboard (minimum 5 battles).'
            : 'Generate your character card to appear on this leaderboard.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Player rank callout */}
      {playerRank !== undefined && (
        <div
          className="rounded-lg px-4 py-2 mb-4 text-sm flex items-center justify-between"
          style={{ backgroundColor: '#f4c43015', border: '1px solid #f4c43030' }}
        >
          <span style={{ color: 'var(--color-text-secondary)' }}>Your ranking</span>
          <span className="font-bold" style={{ color: '#f4c430' }}>
            #{playerRank} of {totalPlayers}
          </span>
        </div>
      )}

      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <table className="w-full" aria-label={`${type} leaderboard rankings`}>
          <thead>
            {type === 'power' && <PowerHeader />}
            {type === 'battle' && <BattleHeader />}
            {type === 'explorer' && <ExplorerHeader />}
          </thead>
          <tbody>
            {type === 'power' && entries.map((entry) => (
              <PowerRow key={entry.address} entry={entry as PowerRankingEntry} />
            ))}
            {type === 'battle' && entries.map((entry) => (
              <BattleRow key={entry.address} entry={entry as BattleRankingEntry} />
            ))}
            {type === 'explorer' && entries.map((entry) => (
              <ExplorerRow key={entry.address} entry={entry as ExplorerRankingEntry} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Showing {entries.length} of {totalPlayers} players
      </div>
    </div>
  );
}
