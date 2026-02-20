import { describe, it, expect } from 'vitest';
import { getPowerTier, POWER_TIERS } from '@/styles/themes';

describe('getPowerTier', () => {
  it('returns bronze for power 0', () => {
    expect(getPowerTier(0).id).toBe('bronze');
  });

  it('returns bronze for power just below silver threshold', () => {
    expect(getPowerTier(14999).id).toBe('bronze');
  });

  it('returns silver at exactly 15000', () => {
    expect(getPowerTier(15000).id).toBe('silver');
  });

  it('returns silver for power just below gold threshold', () => {
    expect(getPowerTier(34999).id).toBe('silver');
  });

  it('returns gold at exactly 35000', () => {
    expect(getPowerTier(35000).id).toBe('gold');
  });

  it('returns gold for power just below diamond threshold', () => {
    expect(getPowerTier(54999).id).toBe('gold');
  });

  it('returns diamond at exactly 55000', () => {
    expect(getPowerTier(55000).id).toBe('diamond');
  });

  it('returns diamond for very high power', () => {
    expect(getPowerTier(100000).id).toBe('diamond');
  });

  it('returns correct frameColor for each tier', () => {
    expect(getPowerTier(0).frameColor).toBe('#cd7f32');
    expect(getPowerTier(15000).frameColor).toBe('#c0c0c0');
    expect(getPowerTier(35000).frameColor).toBe('#f4c430');
    expect(getPowerTier(55000).frameColor).toBe('#b9f2ff');
  });
});

describe('POWER_TIERS', () => {
  it('is sorted by minPower descending', () => {
    for (let i = 1; i < POWER_TIERS.length; i++) {
      expect(POWER_TIERS[i - 1].minPower).toBeGreaterThan(POWER_TIERS[i].minPower);
    }
  });

  it('has 4 tiers', () => {
    expect(POWER_TIERS).toHaveLength(4);
  });

  it('lowest tier starts at 0', () => {
    expect(POWER_TIERS[POWER_TIERS.length - 1].minPower).toBe(0);
  });
});
