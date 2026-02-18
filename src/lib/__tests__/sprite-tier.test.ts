import { describe, it, expect } from 'vitest';
import { getLevelTier, getSpriteUrl } from '../sprite-tier';

describe('getLevelTier', () => {
  it('returns tier 1 for levels 1-10', () => {
    expect(getLevelTier(1)).toBe(1);
    expect(getLevelTier(5)).toBe(1);
    expect(getLevelTier(10)).toBe(1);
  });

  it('returns tier 2 for levels 11-20', () => {
    expect(getLevelTier(11)).toBe(2);
    expect(getLevelTier(20)).toBe(2);
  });

  it('returns tier 3 for levels 21-30', () => {
    expect(getLevelTier(21)).toBe(3);
    expect(getLevelTier(30)).toBe(3);
  });

  it('returns tier 4 for levels 31-40', () => {
    expect(getLevelTier(31)).toBe(4);
    expect(getLevelTier(40)).toBe(4);
  });

  it('returns tier 5 for levels 41-50', () => {
    expect(getLevelTier(41)).toBe(5);
    expect(getLevelTier(50)).toBe(5);
  });

  it('returns tier 6 for levels 51-60', () => {
    expect(getLevelTier(51)).toBe(6);
    expect(getLevelTier(60)).toBe(6);
  });

  it('clamps to minimum tier 1 for edge cases', () => {
    expect(getLevelTier(0)).toBe(1);
    expect(getLevelTier(-5)).toBe(1);
  });

  it('clamps to maximum tier 6 for values above 60', () => {
    expect(getLevelTier(61)).toBe(6);
    expect(getLevelTier(100)).toBe(6);
  });
});

describe('getSpriteUrl', () => {
  it('returns correct URL for a class and level', () => {
    expect(getSpriteUrl('warrior', 1)).toBe('/sprites/warrior_lv1.png');
    expect(getSpriteUrl('hunter', 25)).toBe('/sprites/hunter_lv3.png');
    expect(getSpriteUrl('elder_wizard', 60)).toBe('/sprites/elder_wizard_lv6.png');
  });

  it('handles all class IDs', () => {
    const classes = [
      'hunter', 'rogue', 'summoner', 'merchant',
      'priest', 'elder_wizard', 'guardian', 'warrior',
    ] as const;
    for (const classId of classes) {
      const url = getSpriteUrl(classId, 30);
      expect(url).toBe(`/sprites/${classId}_lv3.png`);
    }
  });

  it('returns tier-appropriate URLs at boundaries', () => {
    expect(getSpriteUrl('rogue', 10)).toBe('/sprites/rogue_lv1.png');
    expect(getSpriteUrl('rogue', 11)).toBe('/sprites/rogue_lv2.png');
    expect(getSpriteUrl('rogue', 50)).toBe('/sprites/rogue_lv5.png');
    expect(getSpriteUrl('rogue', 51)).toBe('/sprites/rogue_lv6.png');
  });
});
