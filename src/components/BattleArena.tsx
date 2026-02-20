'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BattleAction, BattleFighter } from '@/lib/types';
import { CLASS_THEMES, BATTLE_TOKENS } from '@/styles/themes';
import { PixelCharacter } from '@/components/pixel-sprites';
import { formatFighterName } from '@/lib/format-utils';

const LIVE_LOG_MAX_LINES = 10;

interface BattleArenaProps {
  readonly turns: readonly BattleAction[];
  readonly fighters: readonly [BattleFighter, BattleFighter];
  readonly onComplete: () => void;
}

function getHpForFighter(
  turns: readonly BattleAction[],
  upToIndex: number,
  fighterIndex: 0 | 1,
): number {
  for (let i = upToIndex; i >= 0; i--) {
    const turn = turns[i];
    if (turn.actorIndex === fighterIndex) return turn.actorHpAfter;
    if (turn.actorIndex !== fighterIndex) return turn.targetHpAfter;
  }
  return 100;
}

function ActionTag({ label, color }: { readonly label: string; readonly color: string }) {
  return (
    <span
      style={{
        color,
        border: `1px solid ${color}`,
        borderRadius: 4,
        padding: '1px 6px',
        fontSize: 11,
        fontWeight: 700,
        marginLeft: 4,
      }}
    >
      {label}
    </span>
  );
}

export default function BattleArena({ turns, fighters, onComplete }: BattleArenaProps) {
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const maxHp0 = fighters[0].stats.hp;
  const maxHp1 = fighters[1].stats.hp;

  useEffect(() => {
    if (!isPlaying || isComplete) return;
    if (currentTurnIndex >= turns.length) {
      setIsComplete(true);
      setIsPlaying(false);
      onComplete();
      return;
    }
    const timer = setTimeout(() => {
      setCurrentTurnIndex((prev) => prev + 1);
    }, BATTLE_TOKENS.timing.turnDelay);
    return () => clearTimeout(timer);
  }, [currentTurnIndex, isPlaying, isComplete, turns.length, onComplete]);

  // Auto-scroll live log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [currentTurnIndex]);

  const handleSkip = useCallback(() => {
    setCurrentTurnIndex(turns.length);
    setIsComplete(true);
    setIsPlaying(false);
    onComplete();
  }, [turns.length, onComplete]);

  const visibleIndex = Math.min(currentTurnIndex, turns.length) - 1;
  const hp0 = visibleIndex >= 0 ? getHpForFighter(turns, visibleIndex, 0) : maxHp0;
  const hp1 = visibleIndex >= 0 ? getHpForFighter(turns, visibleIndex, 1) : maxHp1;
  const currentAction = visibleIndex >= 0 ? turns[visibleIndex] : null;

  // Visible log entries: all turns up to current index
  const visibleTurns = turns.slice(0, Math.max(0, currentTurnIndex));

  const theme0 = CLASS_THEMES[fighters[0].class.id];
  const theme1 = CLASS_THEMES[fighters[1].class.id];

  const renderFighterPanel = (fighter: BattleFighter, hp: number, maxHp: number, playerColor: string, theme: typeof theme0) => (
    <div style={{ flex: 1, textAlign: 'center', padding: 12 }}>
      <PixelCharacter classId={fighter.class.id} size={80} stats={fighter.stats} />
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: playerColor, marginTop: 8 }}>
        {formatFighterName(fighter)}
      </div>
      <div style={{ fontSize: 11, color: theme.primary, marginTop: 2 }}>
        {fighter.class.nameEn}
      </div>
      <div style={{ marginTop: 8, background: '#1a1a2e', borderRadius: 6, height: 10, overflow: 'hidden' }}>
        <div
          role="progressbar"
          aria-valuenow={Math.max(0, Math.round(hp))}
          aria-valuemin={0}
          aria-valuemax={maxHp}
          aria-label={`${formatFighterName(fighter)} HP`}
          style={{
            height: '100%',
            width: `${Math.max(0, (hp / maxHp) * 100)}%`,
            backgroundColor: hp / maxHp > 0.25 ? '#ef4444' : '#b91c1c',
            borderRadius: 6,
            transition: `width ${BATTLE_TOKENS.timing.hpTransition}ms ease`,
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, fontFamily: 'monospace' }}>
        {Math.max(0, Math.round(hp))} / {maxHp}
      </div>
    </div>
  );

  const renderLogEntry = (turn: BattleAction, isLatest: boolean) => (
    <div
      key={turn.turn}
      style={{
        padding: '6px 10px',
        background: isLatest ? '#1a1a2e' : '#12121a',
        borderRadius: 6,
        border: `1px solid ${isLatest ? '#3a3a5e' : '#2a2a3e'}`,
        fontSize: 12,
        color: isLatest ? '#e8e8ed' : '#9ca3af',
        lineHeight: 1.4,
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ color: turn.actorIndex === 0 ? BATTLE_TOKENS.colors.player0 : BATTLE_TOKENS.colors.player1, fontWeight: 600 }}>
        T{turn.turn}
      </span>{' '}
      {turn.narrative}
      {turn.isCrit && <ActionTag label="CRIT" color={BATTLE_TOKENS.colors.crit} />}
      {turn.isDodge && <ActionTag label="DODGE" color={BATTLE_TOKENS.colors.dodge} />}
      {turn.isStun && <ActionTag label="STUN" color={BATTLE_TOKENS.colors.stun} />}
      {turn.reflected !== undefined && turn.reflected > 0 && (
        <ActionTag label={`${turn.reflected} REFL`} color={BATTLE_TOKENS.colors.reflect} />
      )}
      {turn.healed !== undefined && turn.healed > 0 && (
        <ActionTag label={`+${turn.healed} HP`} color={BATTLE_TOKENS.colors.heal} />
      )}
      {!turn.isDodge && turn.damage > 0 && (
        <span style={{ marginLeft: 6, fontFamily: 'monospace', fontWeight: 700, color: '#ef4444', fontSize: 11 }}>
          -{turn.damage}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-30px); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {renderFighterPanel(fighters[0], hp0, maxHp0, BATTLE_TOKENS.colors.player0, theme0)}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 60, paddingTop: 40 }}>
          {currentAction && !isComplete && (
            <div
              key={visibleIndex}
              aria-hidden="true"
              style={{
                animation: `float-up ${BATTLE_TOKENS.timing.damageFloat}ms ease-out forwards`,
                fontSize: 22,
                fontWeight: 800,
                color: currentAction.isCrit ? BATTLE_TOKENS.colors.crit : '#fff',
                fontFamily: 'monospace',
              }}
            >
              {currentAction.isDodge ? 'MISS' : `-${currentAction.damage}`}
            </div>
          )}
          <div style={{ fontSize: 20, color: '#6b7280', marginTop: 8 }}>VS</div>
        </div>

        {renderFighterPanel(fighters[1], hp1, maxHp1, BATTLE_TOKENS.colors.player1, theme1)}
      </div>

      {/* Live battle log — shows up to LIVE_LOG_MAX_LINES during animation */}
      {visibleTurns.length > 0 && (
        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="Battle log"
          style={{
            marginTop: 12,
            maxHeight: LIVE_LOG_MAX_LINES * 36,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {visibleTurns.map((turn, idx) =>
            renderLogEntry(turn, idx === visibleTurns.length - 1 && !isComplete),
          )}
        </div>
      )}

      {!isComplete && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: '1px solid #2a2a3e',
              color: '#6b7280',
              padding: '4px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Skip Animation
          </button>
        </div>
      )}
    </div>
  );
}
