import { describe, it, expect } from 'vitest';
import { FAMOUS_WALLETS, DEMO_WALLET, type FamousWallet } from '@/lib/famous-wallets';

describe('FAMOUS_WALLETS', () => {
  it('should contain at least 4 wallets', () => {
    expect(FAMOUS_WALLETS.length).toBeGreaterThanOrEqual(4);
  });

  it('each wallet should have required fields', () => {
    for (const wallet of FAMOUS_WALLETS) {
      expect(wallet.address).toBeTruthy();
      expect(wallet.label).toBeTruthy();
      expect(wallet.classId).toBeTruthy();
      expect(wallet.icon).toBeTruthy();
      expect(typeof wallet.level).toBe('number');
      expect(typeof wallet.power).toBe('number');
      expect(wallet.level).toBeGreaterThanOrEqual(1);
      expect(wallet.power).toBeGreaterThan(0);
    }
  });

  it('each address should be a valid ETH address or ENS name', () => {
    const ethRegex = /^0x[0-9a-fA-F]{40}$/;
    const ensRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.eth$/;

    for (const wallet of FAMOUS_WALLETS) {
      const isValid = ethRegex.test(wallet.address) || ensRegex.test(wallet.address);
      expect(isValid, `Invalid address: ${wallet.address}`).toBe(true);
    }
  });

  it('should not contain duplicate addresses', () => {
    const addresses = FAMOUS_WALLETS.map((w) => w.address.toLowerCase());
    const unique = new Set(addresses);
    expect(unique.size).toBe(addresses.length);
  });

  it('should not contain duplicate labels', () => {
    const labels = FAMOUS_WALLETS.map((w) => w.label);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });
});

describe('DEMO_WALLET', () => {
  it('should be vitalik.eth', () => {
    expect(DEMO_WALLET.address).toBe('vitalik.eth');
  });

  it('should be one of the FAMOUS_WALLETS', () => {
    const found = FAMOUS_WALLETS.find((w) => w.address === DEMO_WALLET.address);
    expect(found).toBeDefined();
  });
});
