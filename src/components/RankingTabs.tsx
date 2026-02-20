'use client';

import type { LeaderboardType } from '@/lib/types';

interface RankingTabsProps {
  readonly activeTab: LeaderboardType;
  readonly onTabChange: (tab: LeaderboardType) => void;
}

const TABS: readonly { readonly type: LeaderboardType; readonly label: string; readonly icon: string }[] = [
  { type: 'power', label: 'Power', icon: '\u26A1' },
  { type: 'battle', label: 'Battle', icon: '\u2694\uFE0F' },
  { type: 'explorer', label: 'Explorer', icon: '\u{1F9ED}' },
] as const;

export default function RankingTabs({ activeTab, onTabChange }: RankingTabsProps) {
  return (
    <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.type;
        return (
          <button
            key={tab.type}
            onClick={() => onTabChange(tab.type)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: isActive ? 'var(--color-surface)' : 'transparent',
              color: isActive ? '#f4c430' : 'var(--color-text-muted)',
              borderBottom: isActive ? '2px solid #f4c430' : '2px solid transparent',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
