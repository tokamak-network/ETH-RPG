'use client';

import { useState } from 'react';

const REPO_URL = 'https://github.com/tokamak-network/ETH-RPG';

const LINKS = [
  {
    label: 'Bug / Feedback',
    href: `${REPO_URL}/issues/new?template=feedback.yml`,
    icon: '\uD83D\uDCE8',
  },
  {
    label: 'Suggestion',
    href: `${REPO_URL}/issues/new?template=suggestion.yml`,
    icon: '\u2728',
  },
] as const;

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Popup menu */}
      {isOpen && (
        <div
          className="flex flex-col gap-2 mb-2 animate-fade-in-up"
          role="menu"
        >
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close feedback menu' : 'Open feedback menu'}
        aria-expanded={isOpen}
        className="w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-200 hover:scale-110 cursor-pointer shadow-lg"
        style={{
          backgroundColor: 'var(--color-accent-gold)',
          color: '#000',
        }}
      >
        {isOpen ? '\u2715' : '\uD83D\uDCAC'}
      </button>
    </div>
  );
}
