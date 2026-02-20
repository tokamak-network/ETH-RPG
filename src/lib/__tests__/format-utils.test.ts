import { describe, it, expect } from 'vitest';
import { shortenAddress } from '@/lib/format-utils';

describe('shortenAddress', () => {
  it('shortens a standard 42-char Ethereum address', () => {
    const result = shortenAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');

    expect(result).toBe('0xd8da...6045');
  });

  it('returns first 6 and last 4 characters with ellipsis', () => {
    const result = shortenAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12');

    expect(result).toBe('0xABCD...EF12');
    expect(result.length).toBe(13);
  });
});
