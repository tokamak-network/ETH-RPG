'use client';

import { useState } from 'react';
import { PixelCharacter } from '@/components/pixel-sprites';
import { CLASS_THEMES } from '@/styles/themes';
import type { CharacterStats, CharacterClassId } from '@/lib/types';

const ALL_CLASSES: readonly CharacterClassId[] = [
  'hunter',
  'rogue',
  'summoner',
  'merchant',
  'priest',
  'elder_wizard',
  'guardian',
  'warrior',
] as const;

const STAT_PRESETS: Record<string, CharacterStats> = {
  'Low Stats (Lv.3)': {
    level: 3,
    hp: 110,
    mp: 85,
    str: 55,
    int: 55,
    dex: 120,
    luck: 52,
    power: 5_800,
  },
  'Mid Stats (Lv.25)': {
    level: 25,
    hp: 320,
    mp: 260,
    str: 200,
    int: 190,
    dex: 300,
    luck: 150,
    power: 42_000,
  },
  'High Stats (Lv.55)': {
    level: 55,
    hp: 580,
    mp: 480,
    str: 380,
    int: 370,
    dex: 450,
    luck: 280,
    power: 92_000,
  },
  'Max Level (Lv.60)': {
    level: 60,
    hp: 900,
    mp: 600,
    str: 550,
    int: 500,
    dex: 550,
    luck: 300,
    power: 100_000,
  },
};

const PRESET_KEYS = Object.keys(STAT_PRESETS);

export default function PreviewPage() {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_KEYS[0]);
  const [customStats, setCustomStats] = useState<CharacterStats | null>(null);

  const activeStats = customStats ?? STAT_PRESETS[selectedPreset];

  const handleSliderChange = (key: keyof CharacterStats, value: number) => {
    const base = customStats ?? STAT_PRESETS[selectedPreset];
    setCustomStats({ ...base, [key]: value });
  };

  const resetCustom = () => setCustomStats(null);

  return (
    <div
      className="min-h-screen p-6 sm:p-10"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <h1
        className="text-3xl font-bold font-display text-center mb-2"
        style={{ color: 'var(--color-accent-gold)' }}
      >
        Sprite Visual Effects Preview
      </h1>
      <p className="text-center text-text-muted text-sm mb-8">
        Sprite effect preview by stats
      </p>

      {/* Preset buttons */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {PRESET_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => {
              setSelectedPreset(key);
              setCustomStats(null);
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor:
                selectedPreset === key && !customStats
                  ? 'var(--color-accent-gold)'
                  : 'var(--color-bg-tertiary)',
              color:
                selectedPreset === key && !customStats
                  ? '#0a0a0f'
                  : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Stat sliders */}
      <div
        className="max-w-2xl mx-auto rounded-xl p-5 mb-8"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-text-secondary">
            Custom Adjust {customStats && '(manual)'}
          </p>
          {customStats && (
            <button
              onClick={resetCustom}
              className="text-xs px-3 py-1 rounded"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-muted)',
              }}
            >
              Restore Preset
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {([
            { key: 'level' as const, label: 'Level', min: 1, max: 60, color: '#f4c430' },
            { key: 'hp' as const, label: 'HP', min: 100, max: 900, color: '#ef4444' },
            { key: 'mp' as const, label: 'MP', min: 80, max: 600, color: '#8b5cf6' },
            { key: 'str' as const, label: 'STR', min: 50, max: 550, color: '#f97316' },
            { key: 'int' as const, label: 'INT', min: 50, max: 500, color: '#60a5fa' },
            { key: 'dex' as const, label: 'DEX', min: 50, max: 550, color: '#10b981' },
            { key: 'luck' as const, label: 'LUCK', min: 50, max: 300, color: '#eab308' },
            { key: 'power' as const, label: 'Power', min: 0, max: 100000, color: '#f4c430' },
          ]).map(({ key, label, min, max, color }) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color }}>{label}</span>
                <span className="text-text-muted font-mono">{activeStats[key].toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={activeStats[key]}
                onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: color,
                  background: `linear-gradient(to right, ${color} ${((activeStats[key] - min) / (max - min)) * 100}%, var(--color-bg-tertiary) 0%)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* All classes grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {ALL_CLASSES.map((classId) => {
          const theme = CLASS_THEMES[classId];
          return (
            <div
              key={classId}
              className="flex flex-col items-center gap-3 rounded-xl p-4"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: `1px solid ${theme.primary}30`,
              }}
            >
              <div
                className="rounded-lg p-3"
                style={{
                  border: `1px solid ${theme.primary}20`,
                  background: `radial-gradient(circle, ${theme.primary}08 0%, transparent 70%)`,
                }}
              >
                <PixelCharacter classId={classId} size={128} stats={activeStats} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold font-display" style={{ color: theme.primary }}>
                  {theme.icon} {classId.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Lv.{activeStats.level} / Power {activeStats.power.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side by side comparison: all 4 presets for one class */}
      <h2
        className="text-xl font-bold font-display text-center mt-12 mb-6"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Compare Presets
      </h2>
      <div className="space-y-6 max-w-5xl mx-auto">
        {ALL_CLASSES.map((classId) => {
          const theme = CLASS_THEMES[classId];
          return (
            <div
              key={classId}
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: `1px solid ${theme.primary}20`,
              }}
            >
              <p className="text-sm font-bold font-display mb-4" style={{ color: theme.primary }}>
                {theme.icon} {classId.replace(/_/g, ' ')}
              </p>
              <div className="flex justify-around items-end flex-wrap gap-4">
                {PRESET_KEYS.map((presetKey) => {
                  const stats = STAT_PRESETS[presetKey];
                  return (
                    <div key={presetKey} className="flex flex-col items-center gap-2">
                      <div
                        className="rounded-lg p-2"
                        style={{
                          border: `1px solid ${theme.primary}15`,
                          background: `radial-gradient(circle, ${theme.primary}05 0%, transparent 70%)`,
                        }}
                      >
                        <PixelCharacter classId={classId} size={96} stats={stats} />
                      </div>
                      <p className="text-[10px] text-text-muted text-center">{presetKey}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
