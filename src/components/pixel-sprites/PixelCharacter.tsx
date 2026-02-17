import React from 'react';
import Image from 'next/image';
import type { CharacterClassId } from '@/lib/types';

interface PixelCharacterProps {
  readonly classId: CharacterClassId;
  readonly size?: number;
}

function PixelCharacterInner({ classId, size = 128 }: PixelCharacterProps) {
  return (
    <div
      className="pixel-character"
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
    >
      <Image
        src={`/sprites/${classId}.png`}
        alt={`${classId.replace(/_/g, ' ')} pixel character`}
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
        unoptimized
      />
    </div>
  );
}

const PixelCharacter = React.memo(PixelCharacterInner);
export default PixelCharacter;
