import type { CharacterClassId } from '@/lib/types';

interface NarrativeInput {
  readonly actionType: 'skill' | 'basic_attack';
  readonly skillName?: string;
  readonly damage: number;
  readonly healed?: number;
  readonly isCrit: boolean;
  readonly isStun: boolean;
  readonly isDodge: boolean;
  readonly reflected?: number;
  readonly mpDrained?: number;
}

const DODGE_VARIANTS: Record<CharacterClassId, readonly string[]> = {
  warrior: ['Warrior sidesteps with raw instinct', 'Warrior braces and rolls aside'],
  rogue: ['Rogue vanishes into shadow', 'Rogue slips away like smoke', 'Rogue flickers out of reach'],
  hunter: ['Hunter leaps aside', 'Hunter ducks beneath the strike', 'Hunter rolls to safety'],
  merchant: ['Merchant deftly sidesteps', 'Merchant dodges with practiced ease'],
  priest: ['Priest is shielded by divine grace', 'Priest fades behind a holy ward'],
  elder_wizard: ['Elder Wizard blinks through space', 'Elder Wizard phases out of existence'],
  guardian: ['Guardian deflects with a raised shield', 'Guardian absorbs the blow harmlessly'],
  summoner: ['Summoner warps behind a portal', 'Summoner phases through the rift'],
};

const BASIC_ATTACK_VARIANTS: Record<CharacterClassId, readonly string[]> = {
  warrior: ['swings a heavy blade', 'strikes with steel resolve', 'delivers a crushing blow'],
  rogue: ['slashes from the shadows', 'delivers a quick cut', 'strikes with lethal precision'],
  hunter: ['releases a precise arrow', 'fires a swift bolt', 'lets fly a deadly shot'],
  merchant: ['throws weighted coins', 'hurls a bag of gold', 'flings a gilded dagger'],
  priest: ['channels divine light', 'strikes with holy force', 'unleashes sacred energy'],
  elder_wizard: ['casts a flickering spell', 'weaves arcane energy', 'hurls a crackling bolt'],
  guardian: ['bashes with a shield', 'delivers a heavy shove', 'slams with iron force'],
  summoner: ['commands a spirit to attack', 'sends a phantom strike', 'directs a spectral assault'],
};

const SKILL_VARIANTS: Record<string, readonly string[]> = {
  'Heavy Strike': [
    'brings down a devastating blow',
    'channels fury into a crushing strike',
    'slams the ground with earth-shaking force',
  ],
  'Arbitrage': [
    'exploits an opening with twin slashes',
    'strikes twice in rapid succession',
    'finds the gap and cuts deep, then deeper',
  ],
  'NFT Snipe': [
    'locks on and fires a lethal snipe',
    'takes aim at the rarest weak point',
    'releases a precision bolt infused with fortune',
  ],
  'Hostile Takeover': [
    'launches a ruthless corporate assault',
    'overwhelms the opponent with market force',
    'executes a leveraged strike on the enemy',
  ],
  'Divine Shield': [
    'calls upon holy light for protection',
    'invokes a radiant barrier of faith',
    'wraps in divine energy, mending wounds',
  ],
  'Ancient Spell': [
    'channels millennia of arcane knowledge',
    'unleashes a spell older than the blockchain',
    'weaves forbidden magic from the ancient ledger',
  ],
  'Counter Stance': [
    'braces behind an impenetrable wall',
    'raises a mirrored shield of retribution',
    'assumes an iron counter stance',
  ],
  'Portal Strike': [
    'tears open a rift and strikes through it',
    'summons a creature from beyond the veil',
    'channels spirit and steel through a portal',
  ],
};

function selectVariant(variants: readonly string[], actorName: string, damage: number): string {
  const index = (actorName.length + damage) % variants.length;
  return variants[index];
}

function buildSuffix(input: NarrativeInput): string {
  const parts: string[] = [];

  if (input.isCrit) {
    parts.push(`CRIT! ${input.damage} damage!`);
  } else {
    parts.push(`${input.damage} damage.`);
  }

  if (input.isStun) {
    parts.push('Target stunned!');
  }

  if (input.reflected !== undefined && input.reflected > 0) {
    parts.push(`${input.reflected} damage reflected!`);
  }

  if (input.mpDrained !== undefined && input.mpDrained > 0) {
    parts.push(`Drained ${input.mpDrained} MP!`);
  }

  if (input.healed !== undefined && input.healed > 0) {
    parts.push(`Recovered ${input.healed} HP!`);
  }

  return parts.join(' ');
}

export function generateNarrative(
  input: NarrativeInput,
  actorName: string,
  targetName: string,
  actorClass: CharacterClassId,
): string {
  if (input.isDodge) {
    const variants = DODGE_VARIANTS[actorClass];
    const dodgeText = selectVariant(variants, actorName, input.damage);
    return `${dodgeText} -- DODGE!`;
  }

  if (input.actionType === 'skill' && input.skillName !== undefined) {
    const variants = SKILL_VARIANTS[input.skillName];
    if (variants !== undefined) {
      const actionText = selectVariant(variants, actorName, input.damage);
      const className = formatClassName(actorClass);
      return `${className} ${actionText}! ${buildSuffix(input)}`;
    }
  }

  const basicVariants = BASIC_ATTACK_VARIANTS[actorClass];
  const actionText = selectVariant(basicVariants, actorName, input.damage);
  const className = formatClassName(actorClass);
  return `${className} ${actionText}. ${buildSuffix(input)}`;
}

function formatClassName(classId: CharacterClassId): string {
  const CLASS_NAMES: Record<CharacterClassId, string> = {
    warrior: 'Warrior',
    rogue: 'Rogue',
    hunter: 'Hunter',
    merchant: 'Merchant',
    priest: 'Priest',
    elder_wizard: 'Elder Wizard',
    guardian: 'Guardian',
    summoner: 'Summoner',
  };
  return CLASS_NAMES[classId];
}
