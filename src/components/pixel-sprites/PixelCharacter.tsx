import React from 'react';
import Image from 'next/image';
import type { CharacterClassId, CharacterStats } from '@/lib/types';
import StatVisualEffects from './StatVisualEffects';

interface PixelCharacterProps {
  readonly classId: CharacterClassId;
  readonly size?: number;
  readonly stats?: CharacterStats;
}

function PixelCharacterInner({ classId, size = 128, stats }: PixelCharacterProps) {
  const image = (
    <Image
      src={`/sprites/${classId}.png`}
      alt={`${classId.replace(/_/g, ' ')} pixel character`}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
      unoptimized
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
