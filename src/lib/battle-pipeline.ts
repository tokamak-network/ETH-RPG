// Battle execution pipeline — extracted from battle/route.ts for testability and reuse

import { generateCharacterData } from '@/lib/pipeline';
import { simulateBattle } from '@/lib/battle';
import { setCachedBattle } from '@/lib/battle-cache';
import type { BattleFighter, BattleResponse } from '@/lib/types';
import { getCurrentWeekId } from '@/lib/classwar-week';
import { getWeekBuff } from '@/lib/classwar-store';

interface BattlePipelineInput {
  readonly address1: string;
  readonly address2: string;
  readonly nonce?: string;
}

/**
 * Execute a full battle: generate both characters, build fighters, simulate, cache.
 * Returns a BattleResponse ready for the client.
 */
export async function executeBattle(input: BattlePipelineInput): Promise<BattleResponse> {
  const { address1, address2 } = input;

  // Generate both characters in parallel (skip AI lore for speed)
  const [char1, char2] = await Promise.all([
    generateCharacterData(address1, { skipAiLore: true }),
    generateCharacterData(address2, { skipAiLore: true }),
  ]);

  // Build fighters
  const fighter0: BattleFighter = {
    address: char1.address,
    ...(char1.ensName ? { ensName: char1.ensName } : {}),
    class: char1.class,
    stats: char1.stats,
    achievements: char1.achievements,
  };
  const fighter1: BattleFighter = {
    address: char2.address,
    ...(char2.ensName ? { ensName: char2.ensName } : {}),
    class: char2.class,
    stats: char2.stats,
    achievements: char2.achievements,
  };

  // Generate nonce if not provided
  const battleNonce = input.nonce ?? crypto.randomUUID();

  // Fetch Class War buff (fire-and-forget on failure — battles work without it)
  const classWarBuffClassId = await getWeekBuff(getCurrentWeekId()).catch(() => null);

  // Simulate
  const result = simulateBattle(fighter0, fighter1, battleNonce, classWarBuffClassId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const response: BattleResponse = {
    result,
    battleImageUrl: `${siteUrl}/api/og/battle/${char1.address}/${char2.address}?n=${battleNonce}`,
    ogImageUrl: `${siteUrl}/api/og/battle/${char1.address}/${char2.address}?n=${battleNonce}`,
    cached: false,
  };

  // Cache using resolved 0x addresses (consistent with URLs in the response)
  await setCachedBattle(char1.address, char2.address, battleNonce, response);

  return response;
}
