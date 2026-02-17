import React from 'react';
import type { CharacterClassId } from '@/lib/types';
import { CLASS_THEMES } from '@/styles/themes';
import { SPRITE_DATA } from './sprite-data';

interface PixelCharacterProps {
  readonly classId: CharacterClassId;
  readonly size?: number;
}

function lightenColor(hex: string): string {
  const mix = 0.3;
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * (1 - mix) + 255 * mix);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * (1 - mix) + 255 * mix);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * (1 - mix) + 255 * mix);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function resolveColor(
  char: string,
  palette: Readonly<Record<string, string>>,
  primaryColor: string,
  secondaryColor: string,
  highlightColor: string,
): string | null {
  if (char === '.') return null;
  if (char === '1') return primaryColor;
  if (char === '2') return highlightColor;
  if (char === '6') return secondaryColor;
  return palette[char] ?? null;
}

function PixelCharacterInner({ classId, size = 128 }: PixelCharacterProps) {
  const sprite = SPRITE_DATA[classId];
  const theme = CLASS_THEMES[classId];
  const gridW = sprite.grid[0].length;
  const gridH = sprite.grid.length;
  const highlight = lightenColor(theme.primary);

  const rects: React.JSX.Element[] = [];

  for (let y = 0; y < gridH; y++) {
    const row = sprite.grid[y];
    for (let x = 0; x < row.length; x++) {
      const color = resolveColor(
        row[x],
        sprite.palette,
        theme.primary,
        theme.secondary,
        highlight,
      );
      if (color) {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill={color}
          />,
        );
      }
    }
  }

  return (
    <div
      className="pixel-character"
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
    >
      <svg
        viewBox={`0 0 ${gridW} ${gridH}`}
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated' }}
        role="img"
        aria-label={`${classId.replace(/_/g, ' ')} pixel character`}
      >
        {rects}
      </svg>
    </div>
  );
}

const PixelCharacter = React.memo(PixelCharacterInner);
export default PixelCharacter;
