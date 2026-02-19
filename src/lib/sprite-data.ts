// Server-side helper: read sprite PNGs from public/ and return base64 data URLs.
// Used by OG/card image routes where Satori needs inline image data.

import { readFileSync } from 'fs';
import { join } from 'path';
import type { CharacterClassId } from './types';
import { getLevelTier } from './sprite-tier';

const spriteCache = new Map<string, string>();

/** Get the base64 data URL for a class sprite at a given level. */
export function getSpriteSrc(classId: CharacterClassId, level: number): string {
  const tier = getLevelTier(level);
  const filename = `${classId}_lv${tier}.png`;
  const cached = spriteCache.get(filename);
  if (cached) return cached;

  const spritePath = join(process.cwd(), 'public', 'sprites', filename);
  try {
    const buffer = readFileSync(spritePath);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    spriteCache.set(filename, dataUrl);
    return dataUrl;
  } catch {
    // Fallback to base sprite if tiered version doesn't exist
    const fallbackFilename = `${classId}.png`;
    const fallbackCached = spriteCache.get(fallbackFilename);
    if (fallbackCached) return fallbackCached;

    try {
      const fallbackPath = join(process.cwd(), 'public', 'sprites', fallbackFilename);
      const buffer = readFileSync(fallbackPath);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;
      spriteCache.set(fallbackFilename, dataUrl);
      return dataUrl;
    } catch {
      // Return empty string — route will render without sprite
      return '';
    }
  }
}
