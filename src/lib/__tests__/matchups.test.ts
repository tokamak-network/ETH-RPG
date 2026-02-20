import { describe, it, expect } from 'vitest';
import { resolveMatchup, getDamageModifier, getReceiveModifier, getMatchupInfo } from '@/lib/matchups';
import type { CharacterClassId } from '@/lib/types';

describe('resolveMatchup', () => {
  // -----------------------------------------------------------
  // Ring A: warrior -> rogue -> merchant -> priest -> elder_wizard -> warrior
  // -----------------------------------------------------------
  describe('Ring A advantages', () => {
    it('warrior is advantaged vs rogue', () => {
      const result = resolveMatchup('warrior', 'rogue');

      expect(result.fighter0Advantage).toBe('advantaged');
      expect(result.fighter1Advantage).toBe('disadvantaged');
    });

    it('rogue is advantaged vs merchant', () => {
      const result = resolveMatchup('rogue', 'merchant');

      expect(result.fighter0Advantage).toBe('advantaged');
      expect(result.fighter1Advantage).toBe('disadvantaged');
    });

    it('merchant is advantaged vs priest', () => {
      const result = resolveMatchup('merchant', 'priest');

      expect(result.fighter0Advantage).toBe('advantaged');
      expect(result.fighter1Advantage).toBe('disadvantaged');
    });

    it('priest is advantaged vs elder_wizard', () => {
      const result = resolveMatchup('priest', 'elder_wizard');

      expect(result.fighter0Advantage).toBe('advantaged');
      expect(result.fighter1Advantage).toBe('disadvantaged');
    });

    it('elder_wizard is advantaged vs warrior', () => {
      const result = resolveMatchup('elder_wizard', 'warrior');

      expect(result.fighter0Advantage).toBe('advantaged');
      expect(result.fighter1Advantage).toBe('disadvantaged');
    });
  });

  // -----------------------------------------------------------
  // Ring A reversed (fighter1 has the advantage)
  // -----------------------------------------------------------
  describe('Ring A reversed order', () => {
    it('rogue is disadvantaged vs warrior', () => {
      const result = resolveMatchup('rogue', 'warrior');

      expect(result.fighter0Advantage).toBe('disadvantaged');
      expect(result.fighter1Advantage).toBe('advantaged');
    });

    it('merchant is disadvantaged vs rogue', () => {
      const result = resolveMatchup('merchant', 'rogue');

      expect(result.fighter0Advantage).toBe('disadvantaged');
      expect(result.fighter1Advantage).toBe('advantaged');
    });

    it('warrior is disadvantaged vs elder_wizard', () => {
      const result = resolveMatchup('warrior', 'elder_wizard');

      expect(result.fighter0Advantage).toBe('disadvantaged');
      expect(result.fighter1Advantage).toBe('advantaged');
    });
  });

  // -----------------------------------------------------------
  // Ring B: hunter -> summoner -> guardian -> hunter
  // -----------------------------------------------------------
  describe('Ring B advantages', () => {
    it('hunter is advantaged vs summoner', () => {
      const result = resolveMatchup('hunter', 'summoner');

      expect(result.fighter0Advantage).toBe('advantaged');
      expect(result.fighter1Advantage).toBe('disadvantaged');
    });

    it('summoner is advantaged vs guardian', () => {
      const result = resolveMatchup('summoner', 'guardian');

      expect(result.fighter0Advantage).toBe('advantaged');
      expect(result.fighter1Advantage).toBe('disadvantaged');
    });

    it('guardian is advantaged vs hunter', () => {
      const result = resolveMatchup('guardian', 'hunter');

      expect(result.fighter0Advantage).toBe('advantaged');
      expect(result.fighter1Advantage).toBe('disadvantaged');
    });
  });

  // -----------------------------------------------------------
  // Ring B reversed
  // -----------------------------------------------------------
  describe('Ring B reversed order', () => {
    it('summoner is disadvantaged vs hunter', () => {
      const result = resolveMatchup('summoner', 'hunter');

      expect(result.fighter0Advantage).toBe('disadvantaged');
      expect(result.fighter1Advantage).toBe('advantaged');
    });

    it('hunter is disadvantaged vs guardian', () => {
      const result = resolveMatchup('hunter', 'guardian');

      expect(result.fighter0Advantage).toBe('disadvantaged');
      expect(result.fighter1Advantage).toBe('advantaged');
    });

    it('guardian is disadvantaged vs summoner', () => {
      const result = resolveMatchup('guardian', 'summoner');

      expect(result.fighter0Advantage).toBe('disadvantaged');
      expect(result.fighter1Advantage).toBe('advantaged');
    });
  });

  // -----------------------------------------------------------
  // Cross-ring matchups are neutral
  // -----------------------------------------------------------
  describe('cross-ring matchups are neutral', () => {
    const ringAClasses: readonly CharacterClassId[] = [
      'warrior', 'rogue', 'merchant', 'priest', 'elder_wizard',
    ];
    const ringBClasses: readonly CharacterClassId[] = [
      'hunter', 'summoner', 'guardian',
    ];

    for (const a of ringAClasses) {
      for (const b of ringBClasses) {
        it(`${a} vs ${b} is neutral`, () => {
          const result = resolveMatchup(a, b);

          expect(result.fighter0Advantage).toBe('neutral');
          expect(result.fighter1Advantage).toBe('neutral');
        });

        it(`${b} vs ${a} is neutral`, () => {
          const result = resolveMatchup(b, a);

          expect(result.fighter0Advantage).toBe('neutral');
          expect(result.fighter1Advantage).toBe('neutral');
        });
      }
    }
  });

  // -----------------------------------------------------------
  // Same class is neutral
  // -----------------------------------------------------------
  describe('same class is neutral', () => {
    const allClasses: readonly CharacterClassId[] = [
      'warrior', 'rogue', 'merchant', 'priest', 'elder_wizard',
      'hunter', 'summoner', 'guardian',
    ];

    for (const cls of allClasses) {
      it(`${cls} vs ${cls} is neutral`, () => {
        const result = resolveMatchup(cls, cls);

        expect(result.fighter0Advantage).toBe('neutral');
        expect(result.fighter1Advantage).toBe('neutral');
      });
    }
  });

  // -----------------------------------------------------------
  // Non-adjacent same-ring pairs are neutral
  // -----------------------------------------------------------
  describe('non-adjacent Ring A pairs are neutral', () => {
    it('warrior vs merchant is neutral', () => {
      const result = resolveMatchup('warrior', 'merchant');

      expect(result.fighter0Advantage).toBe('neutral');
      expect(result.fighter1Advantage).toBe('neutral');
    });

    it('warrior vs priest is neutral', () => {
      const result = resolveMatchup('warrior', 'priest');

      expect(result.fighter0Advantage).toBe('neutral');
      expect(result.fighter1Advantage).toBe('neutral');
    });

    it('rogue vs priest is neutral', () => {
      const result = resolveMatchup('rogue', 'priest');

      expect(result.fighter0Advantage).toBe('neutral');
      expect(result.fighter1Advantage).toBe('neutral');
    });

    it('rogue vs elder_wizard is neutral', () => {
      const result = resolveMatchup('rogue', 'elder_wizard');

      expect(result.fighter0Advantage).toBe('neutral');
      expect(result.fighter1Advantage).toBe('neutral');
    });

    it('merchant vs elder_wizard is neutral', () => {
      const result = resolveMatchup('merchant', 'elder_wizard');

      expect(result.fighter0Advantage).toBe('neutral');
      expect(result.fighter1Advantage).toBe('neutral');
    });
  });
});

describe('getDamageModifier', () => {
  it('returns 1.15 for advantaged', () => {
    expect(getDamageModifier('advantaged')).toBe(1.15);
  });

  it('returns 0.80 for disadvantaged', () => {
    expect(getDamageModifier('disadvantaged')).toBe(0.80);
  });

  it('returns 1.0 for neutral', () => {
    expect(getDamageModifier('neutral')).toBe(1.0);
  });
});

describe('getReceiveModifier', () => {
  it('returns 0.80 for advantaged', () => {
    expect(getReceiveModifier('advantaged')).toBe(0.80);
  });

  it('returns 1.15 for disadvantaged', () => {
    expect(getReceiveModifier('disadvantaged')).toBe(1.15);
  });

  it('returns 1.0 for neutral', () => {
    expect(getReceiveModifier('neutral')).toBe(1.0);
  });
});

describe('getMatchupInfo', () => {
  it('warrior is strong vs rogue, weak vs elder_wizard', () => {
    const info = getMatchupInfo('warrior');

    expect(info.strongVs).toContain('rogue');
    expect(info.weakVs).toContain('elder_wizard');
  });

  it('hunter is strong vs summoner, weak vs guardian', () => {
    const info = getMatchupInfo('hunter');

    expect(info.strongVs).toContain('summoner');
    expect(info.weakVs).toContain('guardian');
  });

  it('does not include self in strong or weak', () => {
    const info = getMatchupInfo('priest');

    expect(info.strongVs).not.toContain('priest');
    expect(info.weakVs).not.toContain('priest');
  });

  it('returns empty arrays for classes with no cross-ring advantage', () => {
    // warrior (Ring A) has no advantage vs hunter (Ring B) — cross-ring = neutral
    const info = getMatchupInfo('warrior');

    expect(info.strongVs).not.toContain('hunter');
    expect(info.weakVs).not.toContain('hunter');
  });

  it('each class has at most 1 strong and 1 weak (ring-adjacent only)', () => {
    const classes: CharacterClassId[] = [
      'warrior', 'rogue', 'summoner', 'merchant', 'priest',
      'elder_wizard', 'guardian', 'hunter',
    ];

    for (const cls of classes) {
      const info = getMatchupInfo(cls);
      // Each class beats exactly 1 adjacent in its ring
      expect(info.strongVs.length).toBe(1);
      expect(info.weakVs.length).toBe(1);
    }
  });
});
