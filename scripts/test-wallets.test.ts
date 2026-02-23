// Batch-test 100 famous wallets — classification + stats + class.
// Usage: npx vitest run scripts/test-wallets.ts --reporter=verbose
//
// This is a vitest test file that uses a single long-running test to
// call the real Alchemy API and classify 100 wallets.

import { describe, it } from 'vitest';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local before importing modules that need ALCHEMY_API_KEY
config({ path: resolve(process.cwd(), '.env.local') });

import { fetchWalletData } from '@/lib/alchemy';
import { classifyTransactions } from '@/lib/classifier';
import { calculateStats } from '@/lib/stats';
import { determineClass } from '@/lib/class';

const WALLETS = [
  // --- Ethereum Core (10) ---
  'vitalik.eth',
  'nick.eth',
  'brantly.eth',
  'timbeiko.eth',
  'superphiz.eth',
  'sassal.eth',
  'austingriffith.eth',
  'dannyryan.eth',
  'domothy.eth',
  'ethereumfoundation.eth',

  // --- DeFi Founders (15) ---
  'stani.eth',
  'hayden.eth',
  'rleshner.eth',
  'kain.eth',
  'banteg.eth',
  'julien.eth',
  'dcfgod.eth',
  'tetranode.eth',
  'degentrader.eth',
  'lefteris.eth',
  'andrecronje.eth',
  'jasperthefriendlyghost.eth',
  'lemiscate.eth',
  'tarun.eth',
  'matthuang.eth',

  // --- NFT / Art (15) ---
  'pranksy.eth',
  'punk6529.eth',
  'gmoney.eth',
  'dingaling.eth',
  'artchick.eth',
  'j1mmy.eth',
  'farokh.eth',
  'beeple.eth',
  'loopify.eth',
  'seedphrase.eth',
  'beani.eth',
  'meta4.eth',
  'cozomo.eth',
  'driftercrypto.eth',
  'nftgod.eth',

  // --- Builders / Developers (15) ---
  'ricmoo.eth',
  'wilsoncusack.eth',
  'jessepollak.eth',
  '0xfoobar.eth',
  'transmissions11.eth',
  'gakonst.eth',
  'samczsun.eth',
  'frangio.eth',
  'griff.eth',
  'owocki.eth',
  'scott.eth',
  'snxprofessor.eth',
  'pbrody.eth',
  'worm.eth',
  'ysiu.eth',

  // --- VCs / Investors (10) ---
  'balajis.eth',
  'barrysilbert.eth',
  'cdixon.eth',
  'linda.eth',
  'scoopy.eth',
  'coopahtroopa.eth',
  'cobie.eth',
  'hsaka.eth',
  'light.eth',
  'kevinrose.eth',

  // --- DAOs / Protocols (10) ---
  'ens.eth',
  'gitcoin.eth',
  'aave.eth',
  'optimism.eth',
  'zksync.eth',
  'arbitrum.eth',
  'uniswap.eth',
  'lido.eth',
  'safe.eth',
  'poap.eth',

  // --- Crypto Influencers (10) ---
  'evan.eth',
  'ryan.eth',
  'david.eth',
  'pet3rpan.eth',
  'jacob.eth',
  'zora.eth',
  'fire.eth',
  'simona.eth',
  'alexatallah.eth',
  'dfinzer.eth',

  // --- Raw addresses — whales / notable (15) ---
  '0xab5801a7d398351b8be11c439e05c5b3259aec9b',  // Vitalik old wallet
  '0x220866b1a2219f40e72f5c628b65d54268ca3a9d',  // Paradigm
  '0x2b6ed29a95753c3ad948348e3e7b1a251080ffb9',  // Jump Trading
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f',  // Three Arrows Capital
  '0xa679c6154b8d4619Af9F83f0bF9a13A680e01eCf',  // Kevin Rose (PROOF)
  '0x54BE3a794282C030b15E43aE2bB182E14c409C5e',  // Polychain Capital
  '0x40a7fd740213a4d2db52918e1e556a0a4b25b1a0',  // BAYC deployer
  '0xd26a3f686d43f2a62ba9eae2ff77e9f516d945b9',  // Gnosis Treasury
  '0xde30da39c46104798bb5aa3fe8b9e0e1f348163f',  // Gitcoin Treasury
  '0x1db3439a222c519ab44bb1144fc28167b4fa6ee6',  // Synthetix Treasury
  '0x0716a17FBAeE714f1E6aB0f9d59edbC5f09815C0',  // Justin Sun
  '0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296',  // Arthur Hayes
  '0xa7efae728d2936e78bda97dc267687568dd593f3',  // OlympusDAO Treasury
  '0x6f50C6bff08Ec925232937B204B0Ae23c488402a',  // CMC test whale
  '0xF977814e90dA44bFA03b6295A0616a897441aceC',  // Binance 8
];

interface WalletResult {
  readonly input: string;
  readonly address?: string;
  readonly class?: string;
  readonly classId?: string;
  readonly level?: number;
  readonly power?: number;
  readonly nftRatio?: string;
  readonly dexRatio?: string;
  readonly bridgeRatio?: string;
  readonly stableRatio?: string;
  readonly txCount?: number;
  readonly error?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function testWallet(address: string): Promise<WalletResult> {
  try {
    const rawData = await fetchWalletData(address);

    if (rawData.txCount === 0) {
      return { input: address, error: 'Empty wallet (0 tx)' };
    }

    const classification = classifyTransactions(rawData.transfers);
    const charClass = determineClass(rawData, classification);
    const stats = calculateStats(rawData, classification);

    return {
      input: address,
      address: rawData.address,
      class: charClass.nameEn,
      classId: charClass.id,
      level: stats.level,
      power: stats.power,
      nftRatio: (classification.nftRatio * 100).toFixed(1),
      dexRatio: (classification.dexRatio * 100).toFixed(1),
      bridgeRatio: (classification.bridgeRatio * 100).toFixed(1),
      stableRatio: (classification.stableRatio * 100).toFixed(1),
      txCount: rawData.txCount,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 100) : 'unknown';
    return { input: address, error: msg };
  }
}

describe('100 Famous Wallets Distribution Test', () => {
  it('classifies 100 wallets and prints distribution', async () => {
    const CONCURRENCY = 3;
    const results: WalletResult[] = [];

    for (let i = 0; i < WALLETS.length; i += CONCURRENCY) {
      const batch = WALLETS.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(w => testWallet(w)));
      results.push(...batchResults);

      if (i + CONCURRENCY < WALLETS.length) {
        await sleep(600);
      }
    }

    const successes = results.filter(r => !r.error);
    const failures = results.filter(r => r.error);

    // Class distribution
    const classCounts: Record<string, number> = {};
    for (const r of successes) {
      classCounts[r.class!] = (classCounts[r.class!] ?? 0) + 1;
    }
    const sorted = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);

    // Print distribution
    const lines: string[] = [];
    lines.push('');
    lines.push('='.repeat(80));
    lines.push(`RESULTS: ${successes.length} success, ${failures.length} failed`);
    lines.push('='.repeat(80));
    lines.push('');
    lines.push('## Class Distribution');
    lines.push('');
    lines.push('| Class          | Count | %     |');
    lines.push('|----------------|-------|-------|');
    for (const [cls, count] of sorted) {
      const pct = ((count / successes.length) * 100).toFixed(1);
      lines.push(`| ${cls.padEnd(14)} | ${String(count).padStart(5)} | ${pct.padStart(5)}% |`);
    }
    lines.push(`| **Total**      | **${successes.length}** |       |`);
    lines.push('');

    // Full results sorted by class then power
    const byClass = [...successes].sort((a, b) => {
      if (a.classId !== b.classId) return a.classId!.localeCompare(b.classId!);
      return b.power! - a.power!;
    });

    lines.push('## Full Results (sorted by class → power)');
    lines.push('');
    lines.push('| # | Wallet | Class | Lv | Power | NFT% | DEX% | BRG% | STB% | txCount |');
    lines.push('|---|--------|-------|----|-------|------|------|------|------|---------|');
    for (let i = 0; i < byClass.length; i++) {
      const r = byClass[i];
      const name = r.input.endsWith('.eth') ? r.input : r.input.slice(0, 10) + '...';
      lines.push(`| ${i + 1} | ${name} | ${r.class} | ${r.level} | ${r.power!.toLocaleString()} | ${r.nftRatio}% | ${r.dexRatio}% | ${r.bridgeRatio}% | ${r.stableRatio}% | ${r.txCount} |`);
    }

    if (failures.length > 0) {
      lines.push('');
      lines.push('## Failures');
      lines.push('');
      for (const f of failures) {
        lines.push(`- ${f.input}: ${f.error}`);
      }
    }

    const output = lines.join('\n');
    console.log(output);

    // Save to file
    const outPath = resolve(process.cwd(), 'tasks/wallet-test-results.json');
    writeFileSync(outPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      cacheVersion: 4,
      totalTested: WALLETS.length,
      successes: successes.length,
      failures: failures.length,
      distribution: Object.fromEntries(sorted),
      results,
    }, null, 2));

    const mdPath = resolve(process.cwd(), 'tasks/wallet-test-results.md');
    writeFileSync(mdPath, `# 100 Famous Wallets — Classification Test (cache v4, marketplace whitelist)\n\nGenerated: ${new Date().toISOString()}\n\n${output}\n`);

    console.log(`\nSaved to ${outPath} and ${mdPath}`);
  }, 600_000); // 10 minute timeout
});
