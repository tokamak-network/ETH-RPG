// Fallback lore templates for when AI generation is unavailable
import type { CharacterClassId } from '@/lib/types';

export const FALLBACK_TEMPLATES: Record<CharacterClassId, readonly [string, string]> = {
  hunter: [
    'This hunter roamed the battlefield, collecting countless relics.',
    'Drawn by the call of ancient relics, an endless hunt continues.',
  ],
  rogue: [
    'A cunning assassin who sealed countless deals from the shadows.',
    'Exploiting every crack in the market is how this rogue survives.',
  ],
  summoner: [
    'A wanderer who opened dimensional gates to traverse worlds.',
    'A summoner born with a destiny that cannot stay in one world.',
  ],
  merchant: [
    'A merchant who quietly amassed wealth by hoarding stable coins.',
    'This merchant\'s cold-blooded composure, guarding the vault even in war, is legendary.',
  ],
  priest: [
    'A priest who devoted mana (gas) without hesitation to the network.',
    'One who illuminated the chain by officiating countless rituals (transactions).',
  ],
  elder_wizard: [
    'An ancient wizard who watched for ages, accumulating wisdom.',
    'Awakened long ago, now in seclusion, waiting for the right moment.',
  ],
  guardian: [
    'A guardian who silently protected assets without many words.',
    'This guardian\'s will, unshaken even in storms, is like steel.',
  ],
  warrior: [
    'No special powers, but a warrior who steadily marches to battle.',
    'A warrior who walked the blockchain battlefield with a single ordinary sword.',
  ],
} as const;

export const LONG_FALLBACK_TEMPLATES: Record<CharacterClassId, readonly [string, string]> = {
  hunter: [
    'The gallery of ancient relics is filled with this hunter\'s memories. Spoils collected from countless auction houses and dungeons serve as history books that testify to an entire era. No relic could ever escape this hunter\'s gaze.',
    'When the Era of Relic Collecting dawned, this hunter was the first to charge into the battlefield. The collection built through endless hunts became a treasure trove found nowhere else in this world. The legend is not yet over.',
  ],
  rogue: [
    'This rogue possesses an innate talent for seizing opportunities amid market chaos. Closing deals from the shadows when others tremble in fear, and quietly slipping away when others celebrate -- that is the rogue\'s way.',
    'Cunning is both weapon and shield for this rogue. The experience of exploiting gaps across countless exchanges has been refined into a survival instinct that no one else can match. The legend in the shadows continues.',
  ],
  summoner: [
    'It is the summoner\'s fate to never settle in a single world. This wanderer, who opened dimensional gates and traversed countless worlds, has woven wisdom and experience from each realm into new possibilities.',
    'The dimensional gates this summoner has opened are beyond count. On the bridges connecting world to world, this wanderer has forged a path with an unwavering will that no storm can shake. Awaiting the next gate to open.',
  ],
  merchant: [
    'This merchant\'s vault has never fallen in any war. Having quietly accumulated wealth by hoarding stable coins, this merchant is a legendary figure who never loses composure even amid market tempests.',
    'The merchant\'s path is an endless series of patience and calculation. No matter how many storms swept the market, this merchant sealed the vault tight and waited. The resulting fortune has become one of the most storied legends in this world.',
  ],
  priest: [
    'This priest, who devoted mana without hesitation to the network, has preserved the chain\'s flame by officiating countless rituals. Even in the era of exorbitant gas fees, their steadfast devotion is recorded in legend.',
    'This priest\'s devotion knows no end. Even when mana costs surged to famine levels, they officiated rituals ceaselessly for the stability of the network. Few know that today\'s chain exists upon that sacrifice.',
  ],
  elder_wizard: [
    'Awakened long ago, this ancient wizard has observed the rise and fall of countless eras. The Era of the Great Rise, the Fall of the Lunar Kingdom -- all reside within this wizard\'s memory. Now in seclusion, preparing for the next age.',
    'This ancient wizard\'s wisdom is born from ages of observation. Since their first awakening, they have witnessed the birth and extinction of countless kingdoms, and that experience holds secrets recorded in no spellbook.',
  ],
  guardian: [
    'This guardian does not say much. Even when storms rage and the world trembles, they silently hold their ground. That iron will, unswayed by any temptation, is proof of a true guardian.',
    'The guardian\'s path is lonely but unwavering. When everyone fled, this guardian held their post, and when everyone returned, they stood in the same place. True strength comes from standing still.',
  ],
  warrior: [
    'No special magic, no legendary weapons. All this warrior has is perseverance and will. The journey of this warrior, who marched to battle every day taking one step at a time, is an epic saga in itself.',
    'This warrior, who walked the blockchain battlefield with a single ordinary sword, may not be flashy but possesses an unbreakable will. The experience forged through countless battles is worth more than any legendary weapon.',
  ],
} as const;
