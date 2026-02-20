'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'eth-rpg-muted';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function loadMuted(): boolean {
  try {
    if (typeof window === 'undefined') return true;
    if (prefersReducedMotion()) return true;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return true;
  }
}

function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(muted));
  } catch {
    // ignore
  }
}

type OscType = OscillatorType;

function playTone(
  ctx: AudioContext,
  type: OscType,
  freqStart: number,
  freqEnd: number,
  duration: number,
  gain: number,
) {
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration / 1000);
  vol.gain.setValueAtTime(gain, ctx.currentTime);
  vol.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);
  osc.connect(vol).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration / 1000);
}

function playNoteSequence(
  ctx: AudioContext,
  notes: readonly number[],
  noteDuration: number,
  gain: number,
) {
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * noteDuration) / 1000);
    const start = ctx.currentTime + (i * noteDuration) / 1000;
    vol.gain.setValueAtTime(gain, start);
    vol.gain.linearRampToValueAtTime(0, start + noteDuration / 1000);
    osc.connect(vol).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + noteDuration / 1000);
  });
}

/** Internal engine — use `useSound()` from `@/contexts/SoundContext` instead. */
export function useSoundEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    setIsMuted(loadMuted());
  }, []);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (fn: (ctx: AudioContext) => void) => {
      if (isMuted) return;
      const ctx = getCtx();
      if (ctx) fn(ctx);
    },
    [isMuted, getCtx],
  );

  const playHit = useCallback(
    () => play((ctx) => playTone(ctx, 'square', 200, 100, 80, 0.15)),
    [play],
  );

  const playCrit = useCallback(
    () => play((ctx) => playTone(ctx, 'sawtooth', 300, 150, 150, 0.2)),
    [play],
  );

  const playDodge = useCallback(
    () => play((ctx) => playTone(ctx, 'sine', 800, 400, 100, 0.12)),
    [play],
  );

  const playHeal = useCallback(
    () => play((ctx) => playTone(ctx, 'sine', 400, 800, 200, 0.12)),
    [play],
  );

  const playVictory = useCallback(
    // C5=523, E5=659, G5=784
    () => play((ctx) => playNoteSequence(ctx, [523, 659, 784], 200, 0.15)),
    [play],
  );

  const playSummon = useCallback(
    () => play((ctx) => playTone(ctx, 'sine', 600, 1200, 300, 0.12)),
    [play],
  );

  // Card reveal: low rumble when sealed card appears
  const playRevealSeal = useCallback(
    () => play((ctx) => playTone(ctx, 'sine', 80, 120, 600, 0.08)),
    [play],
  );

  // Card reveal: ascending chime when tier/level shown
  const playRevealTier = useCallback(
    () => play((ctx) => playNoteSequence(ctx, [330, 440], 180, 0.1)),
    [play],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      saveMuted(next);
      // Resume AudioContext on unmute (user gesture)
      if (!next) getCtx();
      return next;
    });
  }, [getCtx]);

  return {
    playHit,
    playCrit,
    playDodge,
    playHeal,
    playVictory,
    playSummon,
    playRevealSeal,
    playRevealTier,
    isMuted,
    toggleMute,
  } as const;
}
