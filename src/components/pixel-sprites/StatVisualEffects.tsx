import React from 'react';
import type { CharacterStats } from '@/lib/types';
import { normalizeStats } from '@/lib/stat-effects';

interface StatVisualEffectsProps {
  readonly stats: CharacterStats;
  readonly children: React.ReactNode;
}

const EFFECT_THRESHOLD = 0.05;

function StatVisualEffectsInner({ stats, children }: StatVisualEffectsProps) {
  const n = normalizeStats(stats);

  const hasHp = n.hp > EFFECT_THRESHOLD;
  const hasMp = n.mp > EFFECT_THRESHOLD;
  const hasStr = n.str > EFFECT_THRESHOLD;
  const hasInt = n.int > EFFECT_THRESHOLD;
  const hasLuck = n.luck > EFFECT_THRESHOLD;

  const cssVars = {
    '--fx-hp': n.hp,
    '--fx-mp': n.mp,
    '--fx-str': n.str,
    '--fx-int': n.int,
    '--fx-luck': n.luck,
    '--fx-tier': n.tier,
  } as React.CSSProperties;

  const filterParts: string[] = [];
  if (hasStr) {
    filterParts.push(`brightness(${1 + n.str * 0.3})`);
    filterParts.push(`contrast(${1 + n.str * 0.15})`);
  }
  if (n.tier > EFFECT_THRESHOLD) {
    const glowIntensity = Math.round(n.tier * 6);
    filterParts.push(`drop-shadow(0 0 ${glowIntensity}px rgba(244, 196, 48, ${n.tier * 0.4}))`);
  }

  const wrapperStyle: React.CSSProperties = {
    ...cssVars,
    ...(filterParts.length > 0 ? { filter: filterParts.join(' ') } : {}),
  };

  const classNames = [
    'sprite-effects-wrapper',
    hasHp ? 'sprite-fx-hp' : '',
    hasMp ? 'sprite-fx-mp' : '',
    hasInt ? 'sprite-fx-int' : '',
    hasLuck ? 'sprite-fx-luck' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} style={wrapperStyle}>
      {children}
      {hasLuck && <div className="sprite-fx-luck-overlay" />}
    </div>
  );
}

const StatVisualEffects = React.memo(StatVisualEffectsInner);
export default StatVisualEffects;
