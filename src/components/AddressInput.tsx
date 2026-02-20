'use client';

import { useState, useRef, type FormEvent } from 'react';
import { trackEvent } from '@/lib/analytics';

interface AddressInputProps {
  readonly onSubmit: (address: string) => void;
  readonly isLoading: boolean;
}

const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const ENS_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.eth$/;

function isValidAddressOrEns(value: string): boolean {
  const trimmed = value.trim();
  return ETH_ADDRESS_REGEX.test(trimmed) || ENS_NAME_REGEX.test(trimmed);
}

export default function AddressInput({ onSubmit, isLoading }: AddressInputProps) {
  const [address, setAddress] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const hasTrackedInput = useRef(false);

  const trimmedAddress = address.trim();
  const isValid = isValidAddressOrEns(trimmedAddress);
  const showError = hasAttemptedSubmit && trimmedAddress.length > 0 && !isValid;
  const isSubmitDisabled = isLoading || !isValid;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (isValid) {
      onSubmit(trimmedAddress);
    }
  }

  function handleChange(value: string) {
    if (!hasTrackedInput.current && value.length > 0) {
      hasTrackedInput.current = true;
      trackEvent('address_input_start');
    }
    setAddress(value);
    if (hasAttemptedSubmit) {
      setHasAttemptedSubmit(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="flex flex-col gap-3">
        <div
          className="flex flex-col sm:flex-row gap-2 p-2 rounded-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-accent-gold/50"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex-1 flex items-center gap-2 px-2">
            <label htmlFor="address-input" className="sr-only">
              Ethereum address or ENS name
            </label>
            <span className="text-text-muted text-sm shrink-0" aria-hidden="true">{'\u{1F50D}'}</span>
            <input
              id="address-input"
              type="text"
              value={address}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="0x... or vitalik.eth"
              disabled={isLoading}
              spellCheck={false}
              autoComplete="off"
              aria-describedby="address-error"
              className="flex-1 py-3 bg-transparent text-white placeholder-text-muted font-mono text-base sm:text-sm focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
            style={{
              backgroundColor: 'var(--color-accent-gold)',
              color: '#000',
            }}
          >
            {isLoading ? 'Summoning...' : 'Summon \u2192'}
          </button>
        </div>
        {showError && (
          <p id="address-error" role="alert" className="text-accent-red text-xs pl-1">
            Please enter a valid Ethereum address (0x...) or ENS name (.eth).
          </p>
        )}
      </div>
    </form>
  );
}
