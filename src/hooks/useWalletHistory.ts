'use client';

import { useState, useCallback, useEffect } from 'react';
import type { CharacterClassId } from '@/lib/types';

const STORAGE_KEY = 'eth-rpg-history';
const MAX_ENTRIES = 5;

export interface WalletHistoryEntry {
  readonly address: string;
  readonly ensName?: string;
  readonly classId: CharacterClassId;
  readonly className: string;
  readonly classIcon: string;
  readonly level: number;
  readonly power: number;
  readonly timestamp: number;
}

function isValidEntry(item: unknown): item is WalletHistoryEntry {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.address === 'string' &&
    typeof obj.classId === 'string' &&
    typeof obj.className === 'string' &&
    typeof obj.classIcon === 'string' &&
    typeof obj.level === 'number' &&
    typeof obj.power === 'number' &&
    typeof obj.timestamp === 'number'
  );
}

function loadEntries(): readonly WalletHistoryEntry[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

function saveEntries(entries: readonly WalletHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useWalletHistory() {
  const [entries, setEntries] = useState<readonly WalletHistoryEntry[]>([]);

  // Load on mount (client only)
  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const addEntry = useCallback(
    (entry: Omit<WalletHistoryEntry, 'timestamp'>) => {
      setEntries((prev) => {
        const now = Date.now();
        const withoutDuplicate = prev.filter(
          (e) => e.address.toLowerCase() !== entry.address.toLowerCase(),
        );
        const updated: readonly WalletHistoryEntry[] = [
          { ...entry, timestamp: now },
          ...withoutDuplicate,
        ].slice(0, MAX_ENTRIES);
        saveEntries(updated);
        return updated;
      });
    },
    [],
  );

  return { entries, addEntry } as const;
}
