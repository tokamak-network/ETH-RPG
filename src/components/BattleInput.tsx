'use client';

import { useState, type FormEvent } from 'react';

interface BattleInputProps {
  readonly onSubmit: (addr1: string, addr2: string) => void;
  readonly isLoading: boolean;
}

const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const ENS_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.eth$/;

function isValidAddressOrEns(value: string): boolean {
  const trimmed = value.trim();
  return ETH_ADDRESS_REGEX.test(trimmed) || ENS_NAME_REGEX.test(trimmed);
}

export default function BattleInput({ onSubmit, isLoading }: BattleInputProps) {
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const trimmed1 = address1.trim();
  const trimmed2 = address2.trim();
  const isValid1 = isValidAddressOrEns(trimmed1);
  const isValid2 = isValidAddressOrEns(trimmed2);
  const isSameAddress = trimmed1.length > 0 && trimmed2.length > 0
    && trimmed1.toLowerCase() === trimmed2.toLowerCase();

  const showError1 = hasAttemptedSubmit && trimmed1.length > 0 && !isValid1;
  const showError2 = hasAttemptedSubmit && trimmed2.length > 0 && !isValid2;
  const showSameError = hasAttemptedSubmit && isSameAddress;
  const isSubmitDisabled = isLoading || !isValid1 || !isValid2 || isSameAddress;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (isValid1 && isValid2 && !isSameAddress) {
      onSubmit(trimmed1, trimmed2);
    }
  }

  function handleChange1(value: string) {
    setAddress1(value);
    if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
  }

  function handleChange2(value: string) {
    setAddress2(value);
    if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="flex flex-col gap-4">
        {/* Challenger input */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Challenger
          </label>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              border: showError1
                ? '1px solid var(--color-accent-red)'
                : '1px solid var(--color-border)',
            }}
          >
            <span className="text-text-muted text-sm shrink-0" aria-hidden="true">{'\u2694\uFE0F'}</span>
            <input
              type="text"
              value={address1}
              onChange={(e) => handleChange1(e.target.value)}
              placeholder="0x... or vitalik.eth"
              disabled={isLoading}
              spellCheck={false}
              autoComplete="off"
              className="flex-1 py-2 bg-transparent text-white placeholder-text-muted font-mono text-sm focus:outline-none disabled:opacity-50"
            />
          </div>
          {showError1 && (
            <p className="text-xs mt-1 pl-1" style={{ color: 'var(--color-accent-red)' }}>
              Please enter a valid Ethereum address or ENS name.
            </p>
          )}
        </div>

        {/* VS divider */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          <span
            className="text-lg font-bold"
            style={{ color: 'var(--color-accent-gold)', fontFamily: 'var(--font-display)' }}
          >
            VS
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
        </div>

        {/* Opponent input */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Opponent
          </label>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              border: showError2
                ? '1px solid var(--color-accent-red)'
                : '1px solid var(--color-border)',
            }}
          >
            <span className="text-text-muted text-sm shrink-0" aria-hidden="true">{'\u{1F6E1}\uFE0F'}</span>
            <input
              type="text"
              value={address2}
              onChange={(e) => handleChange2(e.target.value)}
              placeholder="0x... or opponent.eth"
              disabled={isLoading}
              spellCheck={false}
              autoComplete="off"
              className="flex-1 py-2 bg-transparent text-white placeholder-text-muted font-mono text-sm focus:outline-none disabled:opacity-50"
            />
          </div>
          {showError2 && (
            <p className="text-xs mt-1 pl-1" style={{ color: 'var(--color-accent-red)' }}>
              Please enter a valid Ethereum address or ENS name.
            </p>
          )}
        </div>

        {/* Same address error */}
        {showSameError && (
          <p className="text-xs text-center" style={{ color: 'var(--color-accent-red)' }}>
            Cannot battle yourself. Please enter two different addresses.
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 cursor-pointer"
          style={{
            backgroundColor: 'var(--color-accent-gold)',
            color: '#000',
          }}
        >
          {isLoading ? 'Preparing Battle...' : '\u2694\uFE0F Start Battle'}
        </button>
      </div>
    </form>
  );
}
