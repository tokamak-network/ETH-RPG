'use client';

import { useState, useEffect } from 'react';
import { COPY } from '@/lib/experiment-copy';

const SUBTITLES = COPY.rotatingSubtitles;

const CYCLE_MS = 3500;

export default function RotatingSubtitle() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setVisible(false);
      timeoutId = setTimeout(() => {
        setIndex((prev) => (prev + 1) % SUBTITLES.length);
        setVisible(true);
      }, 200);
    }, CYCLE_MS);

    return () => {
      clearInterval(timer);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <p
      className="text-xl sm:text-2xl font-semibold mb-8 transition-all duration-300"
      style={{
        color: 'var(--color-text-primary)',
        opacity: visible ? 1 : 0,
        filter: visible ? 'blur(0px)' : 'blur(4px)',
        minHeight: '2em',
      }}
    >
      {SUBTITLES[index]}
    </p>
  );
}
