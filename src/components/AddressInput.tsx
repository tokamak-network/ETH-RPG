'use client';

import { useState, type FormEvent } from 'react';

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
    setAddress(value);
    if (hasAttemptedSubmit) {
      setHasAttemptedSubmit(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="0x... or ENS name"
            disabled={isLoading}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 px-4 py-3 rounded-lg bg-bg-tertiary border border-border text-white placeholder-text-muted font-mono text-sm focus:outline-none focus:border-accent-gold transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="px-6 py-3 rounded-lg bg-accent-gold text-black font-semibold text-sm whitespace-nowrap transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Summoning...' : 'Summon Hero'}
          </button>
        </div>
        {showError && (
          <p className="text-accent-red text-xs pl-1">
            Please enter a valid Ethereum address (0x...) or ENS name (.eth).
          </p>
        )}
      </div>
    </form>
  );
}
