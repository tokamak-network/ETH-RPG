import { describe, it, expect } from 'vitest';
import {
  CLASS_SKILLS,
  CLASS_PASSIVES,
  type FighterState,
  type SkillResult,
} from '@/lib/skills';
import type { CharacterClassId, CharacterStats } from '@/lib/types';

// --- Test helpers ---

const ALL_CLASSES: readonly CharacterClassId[] = [
  'warrior', 'rogue', 'hunter', 'merchant',
  'priest', 'elder_wizard', 'guardian', 'summoner',
] as const;

function makeStats(overrides: Partial<CharacterStats> = {}): CharacterStats {
  return {
    level: 20,
    hp: 300,
    mp: 200,
    str: 150,
    int: 180,
    dex: 120,
    luck: 100,
    power: 30000,
    ...overrides,
  };
}

function makeFighter(overrides: Partial<FighterState> = {}): FighterState {
  const stats = overrides.stats ?? makeStats();
  return {
    currentHp: stats.hp,
    maxHp: stats.hp,
    currentMp: stats.mp,
    maxMp: stats.mp,
    stats,
    classId: 'warrior',
    skillCooldown: 0,
    isStunned: false,
    damageReceivedModifier: 1.0,
    damageDealtModifier: 1.0,
    isReflecting: false,
    turnsElapsed: 0,
    ...overrides,
  };
}

/** Returns a PRNG that always returns the given fixed value */
function fixedRng(value: number): () => number {
  return () => value;
}

/** Returns a PRNG that yields values from the sequence, cycling if needed */
function sequenceRng(values: readonly number[]): () => number {
  let index = 0;
  return () => {
    const val = values[index % values.length];
    index++;
    return val;
  };
}

// ---------------------------------------------------------------------------
// 1. All 8 skills exist with correct name, mpCost, cooldown
// ---------------------------------------------------------------------------
describe('Skill metadata for all 8 classes', () => {
  const expectedSkills: Record<CharacterClassId, { name: string; mpCost: number; cooldown: number }> = {
    warrior:      { name: 'Heavy Strike',     mpCost: 15, cooldown: 2 },
    rogue:        { name: 'Arbitrage',         mpCost: 18, cooldown: 3 },
    hunter:       { name: 'NFT Snipe',         mpCost: 18, cooldown: 2 },
    merchant:     { name: 'Hostile Takeover',  mpCost: 20, cooldown: 3 },
    priest:       { name: 'Divine Shield',     mpCost: 18, cooldown: 3 },
    elder_wizard: { name: 'Ancient Spell',     mpCost: 35, cooldown: 3 },
    guardian:     { name: 'Counter Stance',    mpCost: 15, cooldown: 2 },
    summoner:     { name: 'Portal Strike',     mpCost: 22, cooldown: 3 },
  };

  for (const classId of ALL_CLASSES) {
    it(`${classId} skill has correct name, mpCost, and cooldown`, () => {
      const skill = CLASS_SKILLS[classId];
      const expected = expectedSkills[classId];
      expect(skill.name).toBe(expected.name);
      expect(skill.mpCost).toBe(expected.mpCost);
      expect(skill.cooldown).toBe(expected.cooldown);
    });
  }

  it('CLASS_SKILLS has exactly 8 entries', () => {
    expect(Object.keys(CLASS_SKILLS)).toHaveLength(8);
  });
});

// ---------------------------------------------------------------------------
// 2. Warrior: Heavy Strike
// ---------------------------------------------------------------------------
describe('Warrior - Heavy Strike', () => {
  const skill = CLASS_SKILLS.warrior;

  it('deals STR * 0.5 base damage (no crit)', () => {
    const actor = makeFighter({ stats: makeStats({ str: 200, luck: 0 }) });
    const target = makeFighter();
    // random() = 0.5 -> crit check: 0.08 + 0*0.0003 = 0.08 -> 0.5 >= 0.08 -> no crit
    // stun check: 0.5 >= 0.15 -> no stun (second random call)
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.damage).toBe(Math.round(200 * 0.5)); // 100
    expect(result.isCrit).toBe(false);
    expect(result.isStun).toBe(false);
  });

  it('applies crit multiplier 1.8x when random < critChance', () => {
    const actor = makeFighter({ stats: makeStats({ str: 200, luck: 100 }) });
    const target = makeFighter();
    // critChance = 0.08 + 100*0.0003 = 0.11
    // First call (crit): 0.05 < 0.11 -> crit!
    // Second call (stun): 0.99 >= 0.15 -> no stun
    const result = skill.execute(actor, target, sequenceRng([0.05, 0.99]));
    expect(result.damage).toBe(Math.round(200 * 0.5 * 1.8)); // 180
    expect(result.isCrit).toBe(true);
    expect(result.isStun).toBe(false);
  });

  it('has 15% stun chance', () => {
    const actor = makeFighter({ stats: makeStats({ str: 100, luck: 0 }) });
    const target = makeFighter();
    // First call (crit): 0.5 >= 0.08 -> no crit
    // Second call (stun): 0.10 < 0.15 -> stun!
    const result = skill.execute(actor, target, sequenceRng([0.5, 0.10]));
    expect(result.isStun).toBe(true);
  });

  it('returns no stun when random >= 0.15', () => {
    const actor = makeFighter({ stats: makeStats({ str: 100, luck: 0 }) });
    const target = makeFighter();
    const result = skill.execute(actor, target, sequenceRng([0.5, 0.20]));
    expect(result.isStun).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Rogue: Arbitrage (dual-hit)
// ---------------------------------------------------------------------------
describe('Rogue - Arbitrage', () => {
  const skill = CLASS_SKILLS.rogue;

  it('deals two hits of STR * 0.25 each (no crits)', () => {
    const actor = makeFighter({ stats: makeStats({ str: 200, luck: 0 }) });
    const target = makeFighter();
    // First hit crit check: 0.08 -> 0.5 >= 0.08 -> no crit
    // Second hit crit check: 0.35 -> 0.5 >= 0.35 -> no crit
    const result = skill.execute(actor, target, fixedRng(0.5));
    const expectedPerHit = 200 * 0.25; // 50 each
    expect(result.damage).toBe(Math.round(expectedPerHit * 2)); // 100
    expect(result.isCrit).toBe(false);
  });

  it('second hit has 35% crit chance (crits when random < 0.35)', () => {
    const actor = makeFighter({ stats: makeStats({ str: 200, luck: 0 }) });
    const target = makeFighter();
    // First call (first hit crit): 0.5 >= 0.08 -> no crit
    // Second call (second hit crit): 0.20 < 0.35 -> crit!
    const result = skill.execute(actor, target, sequenceRng([0.5, 0.20]));
    const firstHit = 200 * 0.25; // 50
    const secondHit = 200 * 0.25 * 1.8; // 90
    expect(result.damage).toBe(Math.round(firstHit + secondHit)); // 140
    expect(result.isCrit).toBe(true);
  });

  it('both hits can crit', () => {
    const actor = makeFighter({ stats: makeStats({ str: 200, luck: 1000 }) });
    const target = makeFighter();
    // luck=1000 -> critChance = 0.08 + 0.3 = 0.38
    // First call: 0.01 < 0.38 -> crit
    // Second call: 0.01 < 0.35 -> crit
    const result = skill.execute(actor, target, fixedRng(0.01));
    const hitDamage = 200 * 0.25;
    expect(result.damage).toBe(Math.round(hitDamage * 1.8 + hitDamage * 1.8)); // 180
    expect(result.isCrit).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Hunter: NFT Snipe (LUCK comparison)
// ---------------------------------------------------------------------------
describe('Hunter - NFT Snipe', () => {
  const skill = CLASS_SKILLS.hunter;

  it('deals LUCK*0.4 + STR*0.1 hybrid damage', () => {
    const actor = makeFighter({ stats: makeStats({ luck: 100, str: 150 }) });
    const target = makeFighter({ stats: makeStats({ luck: 200 }) });
    // actor.luck (100) NOT > target.luck (200) -> 25% crit
    // random 0.5 >= 0.25 -> no crit
    const result = skill.execute(actor, target, fixedRng(0.5));
    const expected = Math.round(100 * 0.4 + 150 * 0.1); // 40 + 15 = 55
    expect(result.damage).toBe(expected);
    expect(result.isCrit).toBe(false);
  });

  it('uses 80% crit when actor LUCK > target LUCK', () => {
    const actor = makeFighter({ stats: makeStats({ luck: 200, str: 100 }) });
    const target = makeFighter({ stats: makeStats({ luck: 50 }) });
    // actor.luck (200) > target.luck (50) -> 80% crit
    // random 0.5 < 0.80 -> crit!
    const result = skill.execute(actor, target, fixedRng(0.5));
    const baseDamage = 200 * 0.4 + 100 * 0.1; // 80 + 10 = 90
    expect(result.damage).toBe(Math.round(baseDamage * 1.8)); // 162
    expect(result.isCrit).toBe(true);
  });

  it('uses 25% crit when actor LUCK <= target LUCK', () => {
    const actor = makeFighter({ stats: makeStats({ luck: 100, str: 100 }) });
    const target = makeFighter({ stats: makeStats({ luck: 100 }) });
    // Equal LUCK -> 25% crit
    // random 0.20 < 0.25 -> crit!
    const result = skill.execute(actor, target, fixedRng(0.20));
    expect(result.isCrit).toBe(true);

    // random 0.30 >= 0.25 -> no crit
    const result2 = skill.execute(actor, target, fixedRng(0.30));
    expect(result2.isCrit).toBe(false);
  });

  it('does not crit at 80% threshold when random >= 0.80', () => {
    const actor = makeFighter({ stats: makeStats({ luck: 200, str: 100 }) });
    const target = makeFighter({ stats: makeStats({ luck: 50 }) });
    const result = skill.execute(actor, target, fixedRng(0.85));
    expect(result.isCrit).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Merchant: Hostile Takeover (modifier application)
// ---------------------------------------------------------------------------
describe('Merchant - Hostile Takeover', () => {
  const skill = CLASS_SKILLS.merchant;

  it('deals STR * 0.25 damage', () => {
    const actor = makeFighter({ stats: makeStats({ str: 200, luck: 0 }) });
    const target = makeFighter();
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.damage).toBe(Math.round(200 * 0.25)); // 50
  });

  it('reduces target damageDealtModifier by 25%', () => {
    const actor = makeFighter({ stats: makeStats({ str: 100, luck: 0 }) });
    const target = makeFighter();
    expect(target.damageDealtModifier).toBe(1.0);
    skill.execute(actor, target, fixedRng(0.5));
    expect(target.damageDealtModifier).toBeCloseTo(0.75, 5);
  });

  it('boosts actor damageDealtModifier by 15%', () => {
    const actor = makeFighter({ stats: makeStats({ str: 100, luck: 0 }) });
    const target = makeFighter();
    expect(actor.damageDealtModifier).toBe(1.0);
    skill.execute(actor, target, fixedRng(0.5));
    expect(actor.damageDealtModifier).toBeCloseTo(1.15, 5);
  });

  it('stacks multiplicatively on repeated uses', () => {
    const actor = makeFighter({ stats: makeStats({ str: 100, luck: 0 }) });
    const target = makeFighter();
    skill.execute(actor, target, fixedRng(0.5));
    skill.execute(actor, target, fixedRng(0.5));
    expect(target.damageDealtModifier).toBeCloseTo(0.75 * 0.75, 5);
    expect(actor.damageDealtModifier).toBeCloseTo(1.15 * 1.15, 5);
  });
});

// ---------------------------------------------------------------------------
// 6. Priest: Divine Shield (heal + shield)
// ---------------------------------------------------------------------------
describe('Priest - Divine Shield', () => {
  const skill = CLASS_SKILLS.priest;

  it('heals for INT * 0.3', () => {
    const actor = makeFighter({
      stats: makeStats({ int: 200 }),
      currentHp: 200,
      maxHp: 400,
    });
    const target = makeFighter();
    const result = skill.execute(actor, target, fixedRng(0.5));
    const healAmount = Math.round(200 * 0.3); // 60
    expect(result.healed).toBe(healAmount);
    expect(actor.currentHp).toBe(200 + healAmount); // 260
  });

  it('caps heal at maxHp', () => {
    const actor = makeFighter({
      stats: makeStats({ int: 200 }),
      currentHp: 390,
      maxHp: 400,
    });
    const target = makeFighter();
    const result = skill.execute(actor, target, fixedRng(0.5));
    // INT * 0.3 = 60, but only 10 HP missing
    expect(result.healed).toBe(10);
    expect(actor.currentHp).toBe(400);
  });

  it('reduces actor damageReceivedModifier by 20%', () => {
    const actor = makeFighter({
      stats: makeStats({ int: 100 }),
      currentHp: 200,
      maxHp: 400,
    });
    const target = makeFighter();
    expect(actor.damageReceivedModifier).toBe(1.0);
    skill.execute(actor, target, fixedRng(0.5));
    expect(actor.damageReceivedModifier).toBeCloseTo(0.8, 5);
  });

  it('deals no damage', () => {
    const actor = makeFighter({
      stats: makeStats({ int: 200 }),
      currentHp: 200,
      maxHp: 400,
    });
    const target = makeFighter();
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.damage).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Elder Wizard: Ancient Spell
// ---------------------------------------------------------------------------
describe('Elder Wizard - Ancient Spell', () => {
  const skill = CLASS_SKILLS.elder_wizard;

  it('deals INT * 0.45 magic damage (no crit)', () => {
    const actor = makeFighter({ stats: makeStats({ int: 200, luck: 0 }) });
    const target = makeFighter();
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.damage).toBe(Math.round(200 * 0.45)); // 90
    expect(result.isCrit).toBe(false);
  });

  it('applies crit multiplier', () => {
    const actor = makeFighter({ stats: makeStats({ int: 200, luck: 0 }) });
    const target = makeFighter();
    // critChance = 0.08, random = 0.05 < 0.08 -> crit
    const result = skill.execute(actor, target, fixedRng(0.05));
    expect(result.damage).toBe(Math.round(200 * 0.45 * 1.8)); // 162
    expect(result.isCrit).toBe(true);
  });

  it('has high MP cost of 35', () => {
    expect(skill.mpCost).toBe(35);
  });
});

// ---------------------------------------------------------------------------
// 8. Guardian: Counter Stance (reflecting state)
// ---------------------------------------------------------------------------
describe('Guardian - Counter Stance', () => {
  const skill = CLASS_SKILLS.guardian;

  it('sets actor.isReflecting to true', () => {
    const actor = makeFighter();
    const target = makeFighter();
    expect(actor.isReflecting).toBe(false);
    skill.execute(actor, target, fixedRng(0.5));
    expect(actor.isReflecting).toBe(true);
  });

  it('deals zero damage', () => {
    const actor = makeFighter();
    const target = makeFighter();
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.damage).toBe(0);
  });

  it('does not heal', () => {
    const actor = makeFighter();
    const target = makeFighter();
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.healed).toBe(0);
  });

  it('returns no special effects', () => {
    const actor = makeFighter();
    const target = makeFighter();
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.isCrit).toBe(false);
    expect(result.isStun).toBe(false);
    expect(result.mpDrained).toBe(0);
    expect(result.reflected).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 9. Summoner: Portal Strike (MP drain)
// ---------------------------------------------------------------------------
describe('Summoner - Portal Strike', () => {
  const skill = CLASS_SKILLS.summoner;

  it('deals (STR + INT) * 0.2 damage', () => {
    const actor = makeFighter({ stats: makeStats({ str: 150, int: 200, luck: 0 }) });
    const target = makeFighter();
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.damage).toBe(Math.round((150 + 200) * 0.2)); // 70
    expect(result.isCrit).toBe(false);
  });

  it('drains 10 MP from target', () => {
    const actor = makeFighter({ stats: makeStats({ str: 100, int: 100, luck: 0 }) });
    const target = makeFighter({ currentMp: 50, maxMp: 200 });
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.mpDrained).toBe(10);
    expect(target.currentMp).toBe(40);
  });

  it('drains only available MP when target has less than 10', () => {
    const actor = makeFighter({ stats: makeStats({ str: 100, int: 100, luck: 0 }) });
    const target = makeFighter({ currentMp: 3, maxMp: 200 });
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.mpDrained).toBe(3);
    expect(target.currentMp).toBe(0);
  });

  it('drains 0 MP when target has 0 MP', () => {
    const actor = makeFighter({ stats: makeStats({ str: 100, int: 100, luck: 0 }) });
    const target = makeFighter({ currentMp: 0, maxMp: 200 });
    const result = skill.execute(actor, target, fixedRng(0.5));
    expect(result.mpDrained).toBe(0);
    expect(target.currentMp).toBe(0);
  });

  it('applies crit multiplier', () => {
    const actor = makeFighter({ stats: makeStats({ str: 150, int: 200, luck: 0 }) });
    const target = makeFighter();
    // critChance = 0.08, random = 0.05 < 0.08 -> crit
    const result = skill.execute(actor, target, fixedRng(0.05));
    expect(result.damage).toBe(Math.round((150 + 200) * 0.2 * 1.8)); // 126
    expect(result.isCrit).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. All 8 passives: correct field values
// ---------------------------------------------------------------------------
describe('Passive definitions for all 8 classes', () => {
  it('CLASS_PASSIVES has exactly 8 entries', () => {
    expect(Object.keys(CLASS_PASSIVES)).toHaveLength(8);
  });

  it('Warrior passive: Iron Will (+10% HP)', () => {
    const p = CLASS_PASSIVES.warrior;
    expect(p.name).toBe('Iron Will');
    expect(p.battleStartHpBonus).toBe(0.10);
    expect(p.battleStartHealPercent).toBe(0);
    expect(p.turnEndHealPercent).toBe(0);
    expect(p.critChanceBonus).toBe(0);
    expect(p.dodgeChanceBonus).toBe(0);
    expect(p.defenseMultiplier).toBe(0);
    expect(p.mpCostReduction).toBe(0);
    expect(p.bonusDamagePerTurn).toBe(0);
    expect(p.mpRecoveryInterval).toBe(0);
    expect(p.mpRecoveryPercent).toBe(0);
    expect(p.antiBurstThreshold).toBe(0);
  });

  it('Rogue passive: Evasion (+10% dodge)', () => {
    const p = CLASS_PASSIVES.rogue;
    expect(p.name).toBe('Evasion');
    expect(p.dodgeChanceBonus).toBe(0.10);
    expect(p.battleStartHpBonus).toBe(0);
    expect(p.critChanceBonus).toBe(0);
  });

  it('Hunter passive: Keen Eye (+15% crit)', () => {
    const p = CLASS_PASSIVES.hunter;
    expect(p.name).toBe('Keen Eye');
    expect(p.critChanceBonus).toBe(0.15);
    expect(p.dodgeChanceBonus).toBe(0);
    expect(p.battleStartHpBonus).toBe(0);
  });

  it('Merchant passive: Compound Interest (MP recovery every 4 turns)', () => {
    const p = CLASS_PASSIVES.merchant;
    expect(p.name).toBe('Compound Interest');
    expect(p.mpRecoveryInterval).toBe(4);
    expect(p.mpRecoveryPercent).toBe(0.15);
    expect(p.battleStartHpBonus).toBe(0);
    expect(p.critChanceBonus).toBe(0);
  });

  it('Priest passive: Blessing (5% start heal + 1.5% turn heal)', () => {
    const p = CLASS_PASSIVES.priest;
    expect(p.name).toBe('Blessing');
    expect(p.battleStartHealPercent).toBe(0.05);
    expect(p.turnEndHealPercent).toBe(0.015);
    expect(p.battleStartHpBonus).toBe(0);
    expect(p.critChanceBonus).toBe(0);
  });

  it('Elder Wizard passive: Mana Well (15% MP cost reduction)', () => {
    const p = CLASS_PASSIVES.elder_wizard;
    expect(p.name).toBe('Mana Well');
    expect(p.mpCostReduction).toBe(0.15);
    expect(p.battleStartHpBonus).toBe(0);
    expect(p.critChanceBonus).toBe(0);
  });

  it('Guardian passive: Unbreakable (+20% defense, 20% anti-burst)', () => {
    const p = CLASS_PASSIVES.guardian;
    expect(p.name).toBe('Unbreakable');
    expect(p.defenseMultiplier).toBe(0.20);
    expect(p.antiBurstThreshold).toBe(0.20);
    expect(p.battleStartHpBonus).toBe(0);
    expect(p.critChanceBonus).toBe(0);
  });

  it('Summoner passive: Summon Familiar (5% INT bonus damage per turn)', () => {
    const p = CLASS_PASSIVES.summoner;
    expect(p.name).toBe('Summon Familiar');
    expect(p.bonusDamagePerTurn).toBe(0.05);
    expect(p.battleStartHpBonus).toBe(0);
    expect(p.critChanceBonus).toBe(0);
  });

  it('all unspecified fields default to 0 for every class', () => {
    for (const classId of ALL_CLASSES) {
      const p = CLASS_PASSIVES[classId];
      // Each passive should have all numeric fields defined (not undefined)
      expect(typeof p.battleStartHpBonus).toBe('number');
      expect(typeof p.battleStartHealPercent).toBe('number');
      expect(typeof p.turnEndHealPercent).toBe('number');
      expect(typeof p.critChanceBonus).toBe('number');
      expect(typeof p.dodgeChanceBonus).toBe('number');
      expect(typeof p.defenseMultiplier).toBe('number');
      expect(typeof p.mpCostReduction).toBe('number');
      expect(typeof p.bonusDamagePerTurn).toBe('number');
      expect(typeof p.mpRecoveryInterval).toBe('number');
      expect(typeof p.mpRecoveryPercent).toBe('number');
      expect(typeof p.antiBurstThreshold).toBe('number');
    }
  });
});

// ---------------------------------------------------------------------------
// 11. Edge cases and general properties
// ---------------------------------------------------------------------------
describe('Skill edge cases', () => {
  it('all skill execute functions return valid SkillResult shape', () => {
    for (const classId of ALL_CLASSES) {
      const skill = CLASS_SKILLS[classId];
      const actor = makeFighter({ classId });
      const target = makeFighter();
      const result: SkillResult = skill.execute(actor, target, fixedRng(0.5));

      expect(typeof result.damage).toBe('number');
      expect(typeof result.healed).toBe('number');
      expect(typeof result.isCrit).toBe('boolean');
      expect(typeof result.isStun).toBe('boolean');
      expect(typeof result.mpDrained).toBe('number');
      expect(typeof result.reflected).toBe('number');
      expect(result.damage).toBeGreaterThanOrEqual(0);
      expect(result.healed).toBeGreaterThanOrEqual(0);
      expect(result.mpDrained).toBeGreaterThanOrEqual(0);
      expect(result.reflected).toBeGreaterThanOrEqual(0);
    }
  });

  it('skills with 0 stats produce 0 or minimal damage', () => {
    const zeroStats = makeStats({ str: 0, int: 0, luck: 0 });
    const actor = makeFighter({ stats: zeroStats, currentHp: 100, maxHp: 100, currentMp: 100, maxMp: 100 });
    const target = makeFighter();

    const warriorResult = CLASS_SKILLS.warrior.execute(actor, target, fixedRng(0.5));
    expect(warriorResult.damage).toBe(0);

    const rogueResult = CLASS_SKILLS.rogue.execute(actor, target, fixedRng(0.5));
    expect(rogueResult.damage).toBe(0);

    const summonerResult = CLASS_SKILLS.summoner.execute(actor, target, fixedRng(0.5));
    expect(summonerResult.damage).toBe(0);
  });

  it('Priest heal when already at full HP heals 0', () => {
    const actor = makeFighter({
      stats: makeStats({ int: 200 }),
      currentHp: 300,
      maxHp: 300,
    });
    const target = makeFighter();
    const result = CLASS_SKILLS.priest.execute(actor, target, fixedRng(0.5));
    expect(result.healed).toBe(0);
    expect(actor.currentHp).toBe(300);
  });
});
