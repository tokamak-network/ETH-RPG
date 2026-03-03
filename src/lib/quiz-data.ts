// Quiz question definitions with class weight mappings
import type { QuizQuestion } from '@/lib/quiz-types';

export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'activity',
    question: 'What do you mostly do on-chain?',
    options: [
      {
        label: 'Collect & trade NFTs',
        classWeights: { hunter: 3, rogue: 1 },
      },
      {
        label: 'Swap tokens on DEXes',
        classWeights: { rogue: 3, merchant: 1 },
      },
      {
        label: 'Bridge assets across chains',
        classWeights: { summoner: 3, priest: 1 },
      },
      {
        label: 'Transfer stablecoins',
        classWeights: { merchant: 3, guardian: 1 },
      },
      {
        label: 'Deploy & interact with contracts',
        classWeights: { priest: 3, elder_wizard: 1 },
      },
      {
        label: 'Just hold ETH and wait',
        classWeights: { guardian: 3, elder_wizard: 1 },
      },
    ],
  },
  {
    id: 'frequency',
    question: 'How often do you make transactions?',
    options: [
      {
        label: 'Multiple times a day',
        classWeights: { rogue: 2, priest: 2, warrior: 1 },
      },
      {
        label: 'A few times a week',
        classWeights: { hunter: 2, summoner: 1, warrior: 2 },
      },
      {
        label: 'A few times a month',
        classWeights: { merchant: 2, guardian: 1 },
      },
      {
        label: 'Rarely — only when necessary',
        classWeights: { elder_wizard: 3, guardian: 2 },
      },
    ],
  },
  {
    id: 'gas',
    question: 'How do you feel about gas fees?',
    options: [
      {
        label: 'I spend freely — speed matters',
        classWeights: { priest: 3, rogue: 1 },
      },
      {
        label: 'I optimize and wait for low gas',
        classWeights: { merchant: 2, elder_wizard: 1 },
      },
      {
        label: 'I use L2s to avoid high fees',
        classWeights: { summoner: 3, warrior: 1 },
      },
      {
        label: "I barely notice — I don't transact much",
        classWeights: { guardian: 2, elder_wizard: 2 },
      },
    ],
  },
  {
    id: 'age',
    question: 'When did you first use Ethereum?',
    options: [
      {
        label: 'Before 2020 (OG)',
        classWeights: { elder_wizard: 3, priest: 1 },
      },
      {
        label: '2020-2021 (DeFi Summer / NFT boom)',
        classWeights: { hunter: 2, rogue: 1, warrior: 1 },
      },
      {
        label: '2022-2023 (Bear market survivor)',
        classWeights: { guardian: 2, merchant: 1 },
      },
      {
        label: '2024 or later (New explorer)',
        classWeights: { warrior: 3, summoner: 1 },
      },
    ],
  },
  {
    id: 'balance',
    question: 'What best describes your ETH balance?',
    options: [
      {
        label: "It's mostly in tokens and NFTs",
        classWeights: { hunter: 2, rogue: 2 },
      },
      {
        label: 'Spread across DeFi protocols',
        classWeights: { priest: 2, summoner: 1, merchant: 1 },
      },
      {
        label: 'Sitting in my wallet — untouched',
        classWeights: { guardian: 3, elder_wizard: 1 },
      },
      {
        label: 'I keep moving it around',
        classWeights: { warrior: 2, rogue: 1, summoner: 1 },
      },
    ],
  },
] as const;

export const TOTAL_QUESTIONS = QUIZ_QUESTIONS.length;
