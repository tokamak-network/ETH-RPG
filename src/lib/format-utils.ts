// Shared formatting utilities used across components and API routes.

/** Shorten an Ethereum address to 0x1234...abcd format. */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
