'use client';

import { useState, useCallback } from 'react';

interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: 'Is my data safe?',
    answer:
      'Absolutely. Eth\u00B7RPG only reads publicly available blockchain data. We never ask for wallet connections, private keys, or signatures. No personal information is stored beyond the wallet address.',
  },
  {
    question: 'How is my class determined?',
    answer:
      'Your class is based on your on-chain behavior. We analyze your transaction history \u2014 NFT trades, DEX swaps, bridge usage, stablecoin transfers, contract interactions, and more \u2014 then match you to one of 8 classes using a priority-based system.',
  },
  {
    question: 'What data do you analyze?',
    answer:
      'We look at your Ethereum Mainnet transaction history: balance, transaction count, protocols used (DEX, NFT, bridges), activity period, gas consumption, and unique contract interactions. All of this is public on-chain data.',
  },
  {
    question: 'Is this free?',
    answer:
      'Yes, completely free. No sign-up, no payment, no wallet connection required. Just enter an address and summon your hero.',
  },
] as const;

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <section className="w-full max-w-lg mx-auto">
      <div className="flex flex-col gap-2">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={item.question}
              className="rounded-lg border border-border bg-bg-secondary overflow-hidden"
            >
              <button
                type="button"
                onClick={() => handleToggle(index)}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-text-primary hover:bg-bg-tertiary transition-colors"
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <span
                  className="text-text-muted transition-transform duration-200 shrink-0 ml-2"
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                  aria-hidden="true"
                >
                  &#x25BC;
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
