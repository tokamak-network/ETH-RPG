'use client';

import { useRef, useEffect } from 'react';
import type { BattleAction, BattleFighter } from '@/lib/types';

interface BattleLogProps {
  readonly turns: readonly BattleAction[];
  readonly fighters: readonly [BattleFighter, BattleFighter];
}

function getActorName(fighter: BattleFighter): string {
  return fighter.ensName ?? `${fighter.address.slice(0, 6)}...${fighter.address.slice(-4)}`;
}

function ActionTag({ label, color }: { readonly label: string; readonly color: string }) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ml-1"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}

export default function BattleLog({ turns, fighters }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)' }}
        >
          Battle Log
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="max-h-80 overflow-y-auto p-4 flex flex-col gap-3"
      >
        {turns.map((action) => {
          const actor = fighters[action.actorIndex];
          const actorName = getActorName(actor);
          const isPlayer0 = action.actorIndex === 0;

          return (
            <div
              key={action.turn}
              className="flex gap-3 text-sm"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {/* Turn number */}
              <span
                className="shrink-0 w-8 text-right font-mono text-xs pt-0.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                T{action.turn}
              </span>

              {/* Content */}
              <div className="flex-1">
                <span
                  className="font-semibold"
                  style={{ color: isPlayer0 ? '#60a5fa' : '#f87171' }}
                >
                  {actorName}
                </span>

                <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {action.narrative}
                </span>

                {/* Tags */}
                <span className="inline-flex gap-1 ml-1">
                  {action.isDodge && <ActionTag label="DODGE" color="#10b981" />}
                  {action.isCrit && <ActionTag label="CRIT" color="#f4c430" />}
                  {action.isStun && <ActionTag label="STUN" color="#ef4444" />}
                  {action.reflected !== undefined && action.reflected > 0 && (
                    <ActionTag label={`${action.reflected} REFLECTED`} color="#f97316" />
                  )}
                  {action.mpDrained !== undefined && action.mpDrained > 0 && (
                    <ActionTag label={`-${action.mpDrained} MP`} color="#8b5cf6" />
                  )}
                  {action.healed !== undefined && action.healed > 0 && (
                    <ActionTag label={`+${action.healed} HP`} color="#22c55e" />
                  )}
                </span>

                {/* Damage */}
                {!action.isDodge && action.damage > 0 && (
                  <span className="ml-2 font-mono font-bold text-xs" style={{ color: '#ef4444' }}>
                    -{action.damage}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
