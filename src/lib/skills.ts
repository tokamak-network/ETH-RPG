// Class skill and passive definitions for PvP battle system
import type { CharacterClassId, CharacterStats } from '@/lib/types';

// --- Fighter state (mutable internal simulation state) ---

export interface FighterState {
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  stats: CharacterStats;
  classId: CharacterClassId;
  skillCooldown: number;
  isStunned: boolean;
  damageReceivedModifier: number;
  damageDealtModifier: number;
  isReflecting: boolean;
  turnsElapsed: number;
}

// --- Skill result (immutable output of skill execution) ---

export interface SkillResult {
  readonly damage: number;
  readonly healed: number;
  readonly isCrit: boolean;
  readonly isStun: boolean;
  readonly mpDrained: number;
  readonly reflected: number;
}

// --- Skill definition ---

export interface SkillDefinition {
  readonly name: string;
  readonly mpCost: number;
  readonly cooldown: number;
  readonly execute: (
    actor: FighterState,
    target: FighterState,
    random: () => number,
  ) => SkillResult;
}

// --- Passive definition ---

export interface PassiveDefinition {
  readonly name: string;
  readonly battleStartHpBonus: number;
  readonly battleStartHealPercent: number;
  readonly turnEndHealPercent: number;
  readonly critChanceBonus: number;
  readonly dodgeChanceBonus: number;
  readonly defenseMultiplier: number;
  readonly mpCostReduction: number;
  readonly bonusDamagePerTurn: number;
  readonly mpRecoveryInterval: number;
  readonly mpRecoveryPercent: number;
  readonly antiBurstThreshold: number;
}

// --- Constants ---

const BASE_CRIT_CHANCE = 0.08;
const LUCK_CRIT_SCALING = 0.0003;
const CRIT_MULTIPLIER = 1.8;

// --- Helpers ---

function baseCritChance(luck: number): number {
  return BASE_CRIT_CHANCE + luck * LUCK_CRIT_SCALING;
}

function emptyResult(): SkillResult {
  return {
    damage: 0,
    healed: 0,
    isCrit: false,
    isStun: false,
    mpDrained: 0,
    reflected: 0,
  };
}

// --- Skill definitions (one per class) ---

const warriorSkill: SkillDefinition = {
  name: 'Heavy Strike',
  mpCost: 15,
  cooldown: 2,
  execute: (actor, _target, random) => {
    const baseDamage = actor.stats.str * 0.5;
    const critChance = baseCritChance(actor.stats.luck);
    const isCrit = random() < critChance;
    const damage = isCrit ? baseDamage * CRIT_MULTIPLIER : baseDamage;
    const isStun = random() < 0.15;

    return {
      ...emptyResult(),
      damage: Math.round(damage),
      isCrit,
      isStun,
    };
  },
};

const rogueSkill: SkillDefinition = {
  name: 'Arbitrage',
  mpCost: 18,
  cooldown: 3,
  execute: (actor, _target, random) => {
    const hitDamage = actor.stats.str * 0.25;

    // First hit: base crit chance
    const firstCritChance = baseCritChance(actor.stats.luck);
    const firstCrit = random() < firstCritChance;
    const firstDamage = firstCrit ? hitDamage * CRIT_MULTIPLIER : hitDamage;

    // Second hit: 35% crit chance (skill-specific override)
    const secondCrit = random() < 0.35;
    const secondDamage = secondCrit ? hitDamage * CRIT_MULTIPLIER : hitDamage;

    // Defense applied once to total (sum both hits in raw damage)
    const totalDamage = firstDamage + secondDamage;
    const isCrit = firstCrit || secondCrit;

    return {
      ...emptyResult(),
      damage: Math.round(totalDamage),
      isCrit,
    };
  },
};

const hunterSkill: SkillDefinition = {
  name: 'NFT Snipe',
  mpCost: 18,
  cooldown: 2,
  execute: (actor, target, random) => {
    const baseDamage = actor.stats.luck * 0.4 + actor.stats.str * 0.1;

    // Crit threshold depends on LUCK comparison
    const critChance = actor.stats.luck > target.stats.luck ? 0.80 : 0.25;
    const isCrit = random() < critChance;
    const damage = isCrit ? baseDamage * CRIT_MULTIPLIER : baseDamage;

    return {
      ...emptyResult(),
      damage: Math.round(damage),
      isCrit,
    };
  },
};

const merchantSkill: SkillDefinition = {
  name: 'Hostile Takeover',
  mpCost: 20,
  cooldown: 3,
  execute: (actor, target, random) => {
    const baseDamage = actor.stats.str * 0.25;
    const critChance = baseCritChance(actor.stats.luck);
    const isCrit = random() < critChance;
    const damage = isCrit ? baseDamage * CRIT_MULTIPLIER : baseDamage;

    // Side effects: reduce target's next attack, boost own next attack
    // These are mutations on the mutable FighterState (intentional for simulation)
    target.damageDealtModifier *= 0.75;
    actor.damageDealtModifier *= 1.15;

    return {
      ...emptyResult(),
      damage: Math.round(damage),
      isCrit,
    };
  },
};

const priestSkill: SkillDefinition = {
  name: 'Divine Shield',
  mpCost: 18,
  cooldown: 3,
  execute: (actor, _target, _random) => {
    const healAmount = Math.round(actor.stats.int * 0.3);
    const actualHeal = Math.min(healAmount, actor.maxHp - actor.currentHp);

    // Heal the actor (mutable simulation state)
    actor.currentHp += actualHeal;

    // Reduce next incoming damage by 20%
    actor.damageReceivedModifier *= 0.8;

    return {
      ...emptyResult(),
      healed: actualHeal,
    };
  },
};

const elderWizardSkill: SkillDefinition = {
  name: 'Ancient Spell',
  mpCost: 35,
  cooldown: 3,
  execute: (actor, _target, random) => {
    const baseDamage = actor.stats.int * 0.45;
    const critChance = baseCritChance(actor.stats.luck);
    const isCrit = random() < critChance;
    const damage = isCrit ? baseDamage * CRIT_MULTIPLIER : baseDamage;

    // Note: defense halving (50% of target defense) is applied in the battle engine,
    // not here. This function returns raw damage only.

    return {
      ...emptyResult(),
      damage: Math.round(damage),
      isCrit,
    };
  },
};

const guardianSkill: SkillDefinition = {
  name: 'Counter Stance',
  mpCost: 15,
  cooldown: 2,
  execute: (actor, _target, _random) => {
    // Set reflecting state -- 50% of received damage reflected back
    actor.isReflecting = true;

    return emptyResult();
  },
};

const summonerSkill: SkillDefinition = {
  name: 'Portal Strike',
  mpCost: 22,
  cooldown: 3,
  execute: (actor, target, random) => {
    const baseDamage = (actor.stats.str + actor.stats.int) * 0.2;
    const critChance = baseCritChance(actor.stats.luck);
    const isCrit = random() < critChance;
    const damage = isCrit ? baseDamage * CRIT_MULTIPLIER : baseDamage;

    // Drain 10 MP from opponent
    const mpDrained = Math.min(10, target.currentMp);
    target.currentMp -= mpDrained;

    return {
      ...emptyResult(),
      damage: Math.round(damage),
      isCrit,
      mpDrained,
    };
  },
};

// --- Exported skill map ---

export const CLASS_SKILLS: Readonly<Record<CharacterClassId, SkillDefinition>> = {
  warrior: warriorSkill,
  rogue: rogueSkill,
  hunter: hunterSkill,
  merchant: merchantSkill,
  priest: priestSkill,
  elder_wizard: elderWizardSkill,
  guardian: guardianSkill,
  summoner: summonerSkill,
};

// --- Passive definitions (one per class) ---

function makePassive(
  name: string,
  overrides: Partial<Omit<PassiveDefinition, 'name'>> = {},
): PassiveDefinition {
  return {
    name,
    battleStartHpBonus: 0,
    battleStartHealPercent: 0,
    turnEndHealPercent: 0,
    critChanceBonus: 0,
    dodgeChanceBonus: 0,
    defenseMultiplier: 0,
    mpCostReduction: 0,
    bonusDamagePerTurn: 0,
    mpRecoveryInterval: 0,
    mpRecoveryPercent: 0,
    antiBurstThreshold: 0,
    ...overrides,
  };
}

export const CLASS_PASSIVES: Readonly<Record<CharacterClassId, PassiveDefinition>> = {
  warrior: makePassive('Iron Will', {
    battleStartHpBonus: 0.10,
  }),
  rogue: makePassive('Evasion', {
    dodgeChanceBonus: 0.10,
  }),
  hunter: makePassive('Keen Eye', {
    critChanceBonus: 0.15,
  }),
  merchant: makePassive('Compound Interest', {
    mpRecoveryInterval: 4,
    mpRecoveryPercent: 0.15,
  }),
  priest: makePassive('Blessing', {
    battleStartHealPercent: 0.05,
    turnEndHealPercent: 0.015,
  }),
  elder_wizard: makePassive('Mana Well', {
    mpCostReduction: 0.15,
  }),
  guardian: makePassive('Unbreakable', {
    defenseMultiplier: 0.20,
    antiBurstThreshold: 0.20,
  }),
  summoner: makePassive('Summon Familiar', {
    bonusDamagePerTurn: 0.05,
  }),
};
