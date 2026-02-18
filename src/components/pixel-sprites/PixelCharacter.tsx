import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import type { CharacterClassId, CharacterStats } from '@/lib/types';
import { getSpriteUrl } from '@/lib/sprite-tier';
import StatVisualEffects from './StatVisualEffects';

interface PixelCharacterProps {
  readonly classId: CharacterClassId;
  readonly size?: number;
  readonly stats?: CharacterStats;
}

function PixelCharacterInner({ classId, size = 128, stats }: PixelCharacterProps) {
  const fallbackUrl = `/sprites/${classId}.png`;
  const tieredUrl = stats ? getSpriteUrl(classId, stats.level) : null;
  const [useFallback, setUseFallback] = useState(false);

  const handleError = useCallback(() => setUseFallback(true), []);

  const spriteUrl = tieredUrl && !useFallback ? tieredUrl : fallbackUrl;

  const image = (
    <Image
      src={spriteUrl}
      alt={`${classId.replace(/_/g, ' ')} pixel character`}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
      unoptimized
      onError={tieredUrl ? handleError : undefined}
    />
  );

  return (
    <div
      className="pixel-character"
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
    >
      {stats ? (
        <StatVisualEffects stats={stats}>{image}</StatVisualEffects>
      ) : (
        image
      )}
    </div>
  );
}

const PixelCharacter = React.memo(PixelCharacterInner);
export default PixelCharacter;
