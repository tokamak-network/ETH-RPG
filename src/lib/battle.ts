// PvP Battle simulation engine — pure functions, deterministic via seeded PRNG
import type {
  BattleAction,
  BattleFighter,
  BattleResult,
  CharacterClassId,
} from '@/lib/types';
import {
  CLASS_SKILLS,
  CLASS_PASSIVES,
  type FighterState,
  type SkillResult,
} from '@/lib/skills';
import { resolveMatchup, getDamageModifier, getReceiveModifier } from '@/lib/matchups';
import { generateNarrative } from '@/lib/battle-narrative';

// --- Constants ---

const MAX_TURNS = 20;
const BASE_CRIT_CHANCE = 0.08;
const LUCK_CRIT_SCALING = 0.0003;
const CRIT_MULTIPLIER = 1.8;
const BASE_DODGE_SCALING = 0.0003;

// --- FNV-1a hash (32-bit) for PRNG seeding ---

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// --- Mulberry32 PRNG ---

export function mulberry32(seed: number): () => number {
  let state = seed;
  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Seed generation ---

export function generateBattleSeed(addr1: string, addr2: string, nonce: string): string {
  const input = `${addr1.toLowerCase()}${addr2.toLowerCase()}${nonce}`;
  const hash = fnv1a(input);
  return hash.toString(16).padStart(8, '0');
}

// --- Fighter state initialization ---

function initFighterState(fighter: BattleFighter): FighterState {
  const passive = CLASS_PASSIVES[fighter.class.id];
  const baseHp = fighter.stats.hp;
  const maxHp = Math.round(baseHp * (1 + passive.battleStartHpBonus));
  const startHeal = Math.round(maxHp * passive.battleStartHealPercent);

  return {
    currentHp: Math.min(maxHp, maxHp + startHeal), // startHeal can't exceed maxHp
    maxHp,
    currentMp: fighter.stats.mp,
    maxMp: fighter.stats.mp,
    stats: fighter.stats,
    classId: fighter.class.id,
    skillCooldown: 0,
    isStunned: false,
    damageReceivedModifier: 1.0,
    damageDealtModifier: 1.0,
    isReflecting: false,
    turnsElapsed: 0,
  };
}

// --- Helper: get display name for narrative ---

function getDisplayName(fighter: BattleFighter): string {
  return fighter.ensName ?? `${fighter.address.slice(0, 6)}...${fighter.address.slice(-4)}`;
}

// --- Helper: calculate defense ---

function calculateDefense(state: FighterState): number {
  const passive = CLASS_PASSIVES[state.classId];
  const baseDef = Math.floor(state.stats.hp * 0.02);
  return Math.round(baseDef * (1 + passive.defenseMultiplier));
}

// --- Helper: apply anti-burst (Guardian passive) ---

function applyAntiBurst(
  damage: number,
  target: FighterState,
): number {
  const passive = CLASS_PASSIVES[target.classId];
  if (passive.antiBurstThreshold <= 0) return damage;

  const threshold = target.maxHp * passive.antiBurstThreshold;
  if (damage > threshold) {
    const excess = damage - threshold;
    return Math.round(threshold + excess * 0.5);
  }
  return damage;
}

// --- Helper: determine first mover ---

function determineFirstMover(
  fighter0: BattleFighter,
  fighter1: BattleFighter,
  random: () => number,
): 0 | 1 {
  const score0 = fighter0.stats.luck + fighter0.stats.dex * 0.3;
  const score1 = fighter1.stats.luck + fighter1.stats.dex * 0.3;

  if (score0 > score1) return 0;
  if (score1 > score0) return 1;

  // Tie: lower address goes first
  const addr0 = fighter0.address.toLowerCase();
  const addr1 = fighter1.address.toLowerCase();
  if (addr0 < addr1) return 0;
  if (addr1 < addr0) return 1;

  // Absolute tie: random
  return random() < 0.5 ? 0 : 1;
}

// --- Core simulation ---

export function simulateBattle(
  fighter0: BattleFighter,
  fighter1: BattleFighter,
  nonce: string,
): BattleResult {
  const battleSeed = generateBattleSeed(fighter0.address, fighter1.address, nonce);
  const seedNum = parseInt(battleSeed, 16);
  const random = mulberry32(seedNum);

  const fighters: readonly [BattleFighter, BattleFighter] = [fighter0, fighter1];
  const states: [FighterState, FighterState] = [
    initFighterState(fighter0),
    initFighterState(fighter1),
  ];

  const matchup = resolveMatchup(fighter0.class.id, fighter1.class.id);
  const advantages = [matchup.fighter0Advantage, matchup.fighter1Advantage] as const;

  const firstMover = determineFirstMover(fighter0, fighter1, random);
  const turnOrder: [0 | 1, 0 | 1] = firstMover === 0 ? [0, 1] : [1, 0];

  const turns: BattleAction[] = [];
  let turnNumber = 0;

  for (let round = 0; round < MAX_TURNS; round++) {
    for (const actorIdx of turnOrder) {
      const targetIdx: 0 | 1 = actorIdx === 0 ? 1 : 0;
      const actor = states[actorIdx];
      const target = states[targetIdx];

      // Check if battle is already over
      if (actor.currentHp <= 0 || target.currentHp <= 0) break;

      turnNumber += 1;
      actor.turnsElapsed += 1;

      // Stun check — skip turn
      if (actor.isStunned) {
        actor.isStunned = false;
        turns.push({
          turn: turnNumber,
          actorIndex: actorIdx,
          actionType: 'basic_attack',
          damage: 0,
          isCrit: false,
          isStun: false,
          isDodge: false,
          actorHpAfter: actor.currentHp,
          targetHpAfter: target.currentHp,
          narrative: `${getDisplayName(fighters[actorIdx])} is stunned and cannot act!`,
        });
        applyTurnEndPassives(actor, target, random);
        continue;
      }

      // Determine action: skill or basic attack
      const skill = CLASS_SKILLS[actor.classId];
      const passive = CLASS_PASSIVES[actor.classId];
      const effectiveMpCost = Math.round(skill.mpCost * (1 - passive.mpCostReduction));
      const canUseSkill = actor.currentMp >= effectiveMpCost && actor.skillCooldown <= 0;

      let skillResult: SkillResult | null = null;
      let actionType: 'skill' | 'basic_attack' = 'basic_attack';
      let skillName: string | undefined;
      let rawDamage = 0;

      if (canUseSkill) {
        actionType = 'skill';
        skillName = skill.name;
        actor.currentMp -= effectiveMpCost;
        actor.skillCooldown = skill.cooldown;
        skillResult = skill.execute(actor, target, random);
        rawDamage = skillResult.damage;
      } else {
        // Basic attack: STR * 0.3 + random(0, LUCK * 0.1) + random(0, DEX * 0.05)
        rawDamage = Math.floor(
          actor.stats.str * 0.3 +
          random() * actor.stats.luck * 0.1 +
          random() * actor.stats.dex * 0.05,
        );

        // Crit check for basic attacks
        const critChance = BASE_CRIT_CHANCE + actor.stats.luck * LUCK_CRIT_SCALING + passive.critChanceBonus;
        const isCrit = random() < critChance;
        if (isCrit) {
          rawDamage = Math.round(rawDamage * CRIT_MULTIPLIER);
        }

        skillResult = {
          damage: rawDamage,
          healed: 0,
          isCrit,
          isStun: false,
          mpDrained: 0,
          reflected: 0,
        };
      }

      // Skill crit passive bonus (applied if it was a skill and the skill didn't have its own crit logic override)
      if (actionType === 'skill' && passive.critChanceBonus > 0 && !skillResult.isCrit) {
        // Re-roll crit with passive bonus for skills that use base crit
        const bonusCritRoll = random() < passive.critChanceBonus;
        if (bonusCritRoll) {
          rawDamage = Math.round(rawDamage * CRIT_MULTIPLIER);
          skillResult = { ...skillResult, damage: rawDamage, isCrit: true };
        }
      }

      // Dodge check (target dodges)
      const targetPassive = CLASS_PASSIVES[target.classId];
      const dodgeChance = target.stats.dex * BASE_DODGE_SCALING + targetPassive.dodgeChanceBonus;
      const isDodge = rawDamage > 0 && random() < dodgeChance;

      if (isDodge) {
        // Dodge: no damage dealt
        turns.push({
          turn: turnNumber,
          actorIndex: actorIdx,
          actionType,
          skillName,
          damage: 0,
          healed: skillResult.healed > 0 ? skillResult.healed : undefined,
          isCrit: false,
          isStun: false,
          isDodge: true,
          actorHpAfter: actor.currentHp,
          targetHpAfter: target.currentHp,
          narrative: generateNarrative(
            { actionType, skillName, damage: 0, isCrit: false, isStun: false, isDodge: true },
            getDisplayName(fighters[actorIdx]),
            getDisplayName(fighters[targetIdx]),
            actor.classId,
          ),
        });

        if (actor.skillCooldown > 0) actor.skillCooldown -= 1;
        applyTurnEndPassives(actor, target, random);
        continue;
      }

      // Apply damage modifiers
      let effectiveDamage = rawDamage;

      // Matchup modifier
      effectiveDamage = Math.round(effectiveDamage * getDamageModifier(advantages[actorIdx]));
      effectiveDamage = Math.round(effectiveDamage * getReceiveModifier(advantages[targetIdx]));

      // Actor's damage dealt modifier (e.g., Merchant boost)
      effectiveDamage = Math.round(effectiveDamage * actor.damageDealtModifier);

      // Target's damage received modifier (e.g., Priest shield)
      effectiveDamage = Math.round(effectiveDamage * target.damageReceivedModifier);

      // Defense calculation
      let defense = calculateDefense(target);
      // Elder Wizard Ancient Spell: only 50% of target defense applies
      if (skillName === 'Ancient Spell') {
        defense = Math.floor(defense * 0.5);
      }
      effectiveDamage = Math.max(1, effectiveDamage - defense);

      // Anti-burst (Guardian passive)
      effectiveDamage = applyAntiBurst(effectiveDamage, target);

      // Summoner passive: bonus damage per turn
      const actorPassive = CLASS_PASSIVES[actor.classId];
      if (actorPassive.bonusDamagePerTurn > 0) {
        const bonusDmg = Math.round(actor.stats.int * actorPassive.bonusDamagePerTurn);
        effectiveDamage += bonusDmg;
      }

      // Apply damage to target
      target.currentHp = Math.max(0, target.currentHp - effectiveDamage);

      // Apply stun
      if (skillResult.isStun) {
        target.isStunned = true;
      }

      // Guardian Counter Stance reflection
      let reflected = 0;
      if (target.isReflecting && effectiveDamage > 0) {
        reflected = Math.round(effectiveDamage * 0.5);
        actor.currentHp = Math.max(0, actor.currentHp - reflected);
        target.isReflecting = false;
      }

      // Reset one-shot modifiers after use
      actor.damageDealtModifier = 1.0;
      target.damageReceivedModifier = 1.0;

      // Build action record
      const action: BattleAction = {
        turn: turnNumber,
        actorIndex: actorIdx,
        actionType,
        skillName,
        damage: effectiveDamage,
        healed: skillResult.healed > 0 ? skillResult.healed : undefined,
        isCrit: skillResult.isCrit,
        isStun: skillResult.isStun,
        isDodge: false,
        reflected: reflected > 0 ? reflected : undefined,
        mpDrained: skillResult.mpDrained > 0 ? skillResult.mpDrained : undefined,
        actorHpAfter: actor.currentHp,
        targetHpAfter: target.currentHp,
        narrative: generateNarrative(
          {
            actionType,
            skillName,
            damage: effectiveDamage,
            healed: skillResult.healed > 0 ? skillResult.healed : undefined,
            isCrit: skillResult.isCrit,
            isStun: skillResult.isStun,
            isDodge: false,
            reflected: reflected > 0 ? reflected : undefined,
            mpDrained: skillResult.mpDrained > 0 ? skillResult.mpDrained : undefined,
          },
          getDisplayName(fighters[actorIdx]),
          getDisplayName(fighters[targetIdx]),
          actor.classId,
        ),
      };

      turns.push(action);

      // Cooldown tick
      if (actor.skillCooldown > 0) actor.skillCooldown -= 1;

      // Check for KO
      if (target.currentHp <= 0 || actor.currentHp <= 0) break;

      // Turn-end passives
      applyTurnEndPassives(actor, target, random);
    }

    // Check for KO after round
    if (states[0].currentHp <= 0 || states[1].currentHp <= 0) break;
  }

  // Determine winner
  const winner = determineWinner(states, fighters);
  const winnerState = states[winner];
  const winnerHpPercent = Math.round((winnerState.currentHp / winnerState.maxHp) * 100);

  return {
    fighters,
    winner,
    turns,
    totalTurns: turnNumber,
    winnerHpRemaining: winnerState.currentHp,
    winnerHpPercent,
    matchup,
    nonce,
    battleSeed,
  };
}

// --- Turn-end passives ---

function applyTurnEndPassives(
  actor: FighterState,
  _target: FighterState,
  _random: () => number,
): void {
  const passive = CLASS_PASSIVES[actor.classId];

  // Priest: heal at end of each turn
  if (passive.turnEndHealPercent > 0) {
    const heal = Math.round(actor.maxHp * passive.turnEndHealPercent);
    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
  }

  // Merchant: MP recovery every N turns
  if (
    passive.mpRecoveryInterval > 0 &&
    actor.turnsElapsed % passive.mpRecoveryInterval === 0
  ) {
    const mpRecovery = Math.round(actor.maxMp * passive.mpRecoveryPercent);
    actor.currentMp = Math.min(actor.maxMp, actor.currentMp + mpRecovery);
  }
}

// --- Winner determination ---

function determineWinner(
  states: [FighterState, FighterState],
  fighters: readonly [BattleFighter, BattleFighter],
): 0 | 1 {
  // One is dead
  if (states[0].currentHp <= 0 && states[1].currentHp > 0) return 1;
  if (states[1].currentHp <= 0 && states[0].currentHp > 0) return 0;

  // Both alive (max turns reached): compare HP%
  const hpPercent0 = states[0].currentHp / states[0].maxHp;
  const hpPercent1 = states[1].currentHp / states[1].maxHp;

  if (hpPercent0 > hpPercent1) return 0;
  if (hpPercent1 > hpPercent0) return 1;

  // HP% tied: higher Power wins
  if (fighters[0].stats.power > fighters[1].stats.power) return 0;
  if (fighters[1].stats.power > fighters[0].stats.power) return 1;

  // Absolute tie: fighter 0 wins (deterministic)
  return 0;
}
