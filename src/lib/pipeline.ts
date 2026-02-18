// Core character generation pipeline — shared by generate, OG, and card routes
import { fetchWalletData } from '@/lib/alchemy';
import { classifyTransactions } from '@/lib/classifier';
import { calculateStats } from '@/lib/stats';
import { determineClass } from '@/lib/class';
import { generateLore, generateLongLore, generateFallbackLore, generateLongFallbackLore } from '@/lib/lore';
import { getCached, setCache } from '@/lib/cache';
import {
  getRelevantEvents,
  describeActivityPattern,
  formatWalletAge,
} from '@/lib/crypto-events';
import type { GenerateResponse, LoreInputData } from '@/lib/types';

export class EmptyWalletError extends Error {
  constructor(address: string) {
    super(`Wallet ${address} has no transactions`);
    this.name = 'EmptyWalletError';
  }
}

interface PipelineOptions {
  readonly skipAiLore?: boolean;
}

function formatTimestamp(ts: number | null): string {
  if (ts === null) {
    return 'No record';
  }
  return new Date(ts).toISOString().split('T')[0];
}

/**
 * Core character generation pipeline.
 *
 * 1. Check cache
 * 2. Fetch on-chain data via Alchemy
 * 3. Classify transactions
 * 4. Determine class
 * 5. Calculate stats
 * 6. Generate lore (AI or fallback)
 * 7. Cache and return
 *
 * @throws EmptyWalletError when the wallet has zero transactions
 */
export async function generateCharacterData(
  address: string,
  options: PipelineOptions = {},
): Promise<GenerateResponse> {
  const { skipAiLore = false } = options;

  // 1. Cache check
  const cached = getCached(address);
  if (cached) {
    return { ...cached, cached: true };
  }

  // 2. Fetch on-chain data
  const rawData = await fetchWalletData(address);

  // 3. Validate wallet has transactions
  if (rawData.txCount === 0 && rawData.transfers.length === 0) {
    throw new EmptyWalletError(address);
  }

  // 4. Classify transactions
  const classification = classifyTransactions(rawData.transfers);

  // 5. Determine class
  const characterClass = determineClass(rawData, classification);

  // 6. Calculate stats
  const stats = calculateStats(rawData, classification, characterClass.id);

  // 7. Prepare lore input data
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const loreInput: LoreInputData = {
    className: characterClass.name,
    classNameEn: characterClass.nameEn,
    level: stats.level,
    power: stats.power,
    txCount: rawData.txCount,
    walletAgeDescription: formatWalletAge(rawData.firstTxTimestamp),
    firstTxDate: formatTimestamp(rawData.firstTxTimestamp),
    lastTxDate: formatTimestamp(rawData.lastTxTimestamp),
    relevantEvents: getRelevantEvents(
      rawData.firstTxTimestamp,
      rawData.lastTxTimestamp,
    ),
    activityPattern: describeActivityPattern(classification),
  };

  // 8. Generate lore
  let lore: string;
  let longLore: string;

  if (skipAiLore) {
    lore = generateFallbackLore(loreInput);
    longLore = generateLongFallbackLore(loreInput);
  } else {
    [lore, longLore] = await Promise.all([
      generateLore(loreInput),
      generateLongLore(loreInput),
    ]);
  }

  // 9. Build response
  const resolvedAddress = rawData.address;
  const response: GenerateResponse = {
    address: resolvedAddress,
    ...(rawData.ensName ? { ensName: rawData.ensName } : {}),
    stats,
    class: characterClass,
    lore,
    longLore,
    cardImageUrl: `${siteUrl}/api/card/${resolvedAddress}`,
    ogImageUrl: `${siteUrl}/api/og/${resolvedAddress}`,
    cached: false,
  };

  // 10. Cache the result
  setCache(resolvedAddress, response);
  if (rawData.ensName) {
    setCache(rawData.ensName.toLowerCase(), response);
  }

  return response;
}
