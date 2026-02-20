'use client';

import { useSound } from '@/contexts/SoundContext';

export default function SoundToggle() {
  const { isMuted, toggleMute } = useSound();

  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
      className="fixed bottom-20 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center text-base transition-all duration-200 hover:scale-110 cursor-pointer shadow-lg"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        color: isMuted ? 'var(--color-text-muted)' : 'var(--color-accent-gold)',
      }}
    >
      {isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
    </button>
  );
}
