// Centralized copy strings for A/B experiment: V1 (RPG) vs V2 (Personality Test)
// Rollback: change the export alias from V2 to V1.

const V1 = {
  title: 'Eth\u00B7RPG',
  subtitle: 'The blockchain holds your history.',
  rotatingSubtitles: [
    'What hero is your wallet?',
    'Are you a Rogue? A Guardian? An Elder Wizard?',
    'Your transactions tell your story.',
    'Discover your on-chain identity.',
  ] as readonly string[],
  ctaButton: 'Summon \u2192',
  ctaLoading: 'Summoning...',
  viralCta: 'What hero is YOUR wallet?',
  classesHeading: 'Character Classes',
  metaTitle: 'Eth\u00B7RPG \u2014 What hero is your wallet?',
  metaDescription:
    'Enter an Ethereum wallet address to analyze on-chain transactions and generate an RPG character card. Stats, class, and AI hero lore included.',
  metaTwitterDescription: 'What hero is your wallet?',
  ogTitle: 'Eth\u00B7RPG \u2014 What hero is your wallet?',
  ogDescription:
    'Enter an Ethereum wallet address to analyze on-chain transactions and generate an RPG character card.',
  errorHeading: 'Summoning Failed',
  noTxDescription:
    "This wallet hasn't made any transactions yet. Try a famous wallet to see what a hero card looks like!",
} as const;

const V2 = {
  title: 'Eth\u00B7RPG',
  subtitle: 'Your transactions reveal who you are.',
  rotatingSubtitles: [
    "What's your on-chain class?",
    'Are you a Rogue, Guardian, or Elder Wizard?',
    'Your transactions reveal your type.',
    'Find out in 10 seconds.',
  ] as readonly string[],
  ctaButton: 'Discover \u2192',
  ctaLoading: 'Analyzing...',
  viralCta: "What's YOUR on-chain class?",
  classesHeading: 'The 8 On-Chain Classes',
  metaTitle: 'Eth\u00B7RPG \u2014 On-Chain Personality Test',
  metaDescription:
    'What does your Ethereum wallet say about you? Analyze your on-chain transactions to discover your class, stats, and AI-generated lore.',
  metaTwitterDescription: 'What does your wallet say about you?',
  ogTitle: 'Eth\u00B7RPG \u2014 On-Chain Personality Test',
  ogDescription:
    'What does your Ethereum wallet say about you? Discover your on-chain class in 10 seconds.',
  errorHeading: 'Analysis Failed',
  noTxDescription:
    "This wallet hasn't made any transactions yet. Try a famous wallet to see what your on-chain class looks like!",
} as const;

/** Active copy variant. Change this line to switch experiments. */
export const COPY = V2;

export type ExperimentCopy = typeof V1;
