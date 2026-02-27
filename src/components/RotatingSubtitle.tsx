'use client';

import { useState, useEffect } from 'react';

const SUBTITLES = [
  'What hero is your wallet?',
  'Are you a Rogue? A Guardian? An Elder Wizard?',
  'Your transactions tell your story.',
  'Discover your on-chain identity.',
] as const;

const CYCLE_MS = 3500;

export default function RotatingSubtitle() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % SUBTITLES.length);
        setVisible(true);
      }, 400);
    }, CYCLE_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <p
      className="text-xl sm:text-2xl font-semibold mb-12 transition-opacity duration-400"
      style={{
        color: 'var(--color-text-primary)',
        opacity: visible ? 1 : 0,
        minHeight: '2em',
      }}
    >
      {SUBTITLES[index]}
    </p>
  );
}
