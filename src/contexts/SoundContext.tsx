'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSoundEngine } from '@/hooks/useSound';

type SoundApi = ReturnType<typeof useSoundEngine>;

const SoundContext = createContext<SoundApi | null>(null);

export function SoundProvider({ children }: { readonly children: ReactNode }) {
  const sound = useSoundEngine();
  return <SoundContext.Provider value={sound}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundApi {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within SoundProvider');
  return ctx;
}
