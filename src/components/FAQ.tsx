'use client';

import { useState, useCallback } from 'react';

interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: '\uAC1C\uC778\uC815\uBCF4\uB294 \uC548\uC804\uD55C\uAC00\uC694?',
    answer:
      '\uB124, \uC644\uC804\uD788 \uC548\uC804\uD569\uB2C8\uB2E4. Eth\u00B7RPG\uB294 \uACF5\uAC1C\uB41C \uBE14\uB85D\uCCB4\uC778 \uB370\uC774\uD130\uB9CC \uC870\uD68C\uD569\uB2C8\uB2E4. \uC9C0\uAC11 \uC5F0\uACB0, \uAC1C\uC778\uD0A4, \uC11C\uBA85\uC744 \uC694\uAD6C\uD558\uC9C0 \uC54A\uC73C\uBA70, \uC8FC\uC18C \uC678 \uC5B4\uB5A4 \uAC1C\uC778\uC815\uBCF4\uB3C4 \uC800\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
  },
  {
    question: '\uC5B4\uB5A4 \uB370\uC774\uD130\uB97C \uC0AC\uC6A9\uD558\uB098\uC694?',
    answer:
      '\uC774\uB354\uB9AC\uC6C0 \uBA54\uC778\uB137\uC758 \uACF5\uAC1C \uD2B8\uB79C\uC7AD\uC158 \uAE30\uB85D\uC744 \uBD84\uC11D\uD569\uB2C8\uB2E4. \uC794\uC561, \uAC70\uB798 \uD69F\uC218, \uC0AC\uC6A9\uD55C \uD504\uB85C\uD1A0\uCF5C(DEX, NFT, \uBE0C\uB9BF\uC9C0 \uB4F1), \uD65C\uB3D9 \uAE30\uAC04 \uB4F1\uC744 \uBC14\uD0D5\uC73C\uB85C RPG \uC2A4\uD0EF\uACFC \uC9C1\uC5C5\uC744 \uC0B0\uCD9C\uD569\uB2C8\uB2E4.',
  },
  {
    question: '\uBE44\uC6A9\uC774 \uC788\uB098\uC694?',
    answer:
      '\uBB34\uB8CC\uC785\uB2C8\uB2E4. \uBCC4\uB3C4\uC758 \uAC00\uC785\uC774\uB098 \uACB0\uC81C \uC5C6\uC774 \uBC14\uB85C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  },
] as const;

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <section className="w-full max-w-lg mx-auto">
      <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
        FAQ
      </h3>
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
