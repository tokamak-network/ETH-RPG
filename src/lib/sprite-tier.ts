import type { CharacterClassId } from './types';

/** Convert a level (1-60) to a tier (1-6). Each tier spans 10 levels. */
export function getLevelTier(level: number): number {
  return Math.min(6, Math.max(1, Math.ceil(level / 10)));
}

/** Get the sprite URL for a class at a given level. */
export function getSpriteUrl(classId: CharacterClassId, level: number): string {
  return `/sprites/${classId}_lv${getLevelTier(level)}.png`;
}
