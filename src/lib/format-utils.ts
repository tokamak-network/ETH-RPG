// Shared formatting utilities used across components and API routes.

/** Shorten an Ethereum address to 0x1234...abcd format. */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Return ENS name if available, otherwise shortened address. */
export function formatDisplayName(address: string, ensName?: string): string {
  return ensName ?? shortenAddress(address);
}

/** Return display name for a fighter-like object. */
export function formatFighterName(fighter: { readonly address: string; readonly ensName?: string }): string {
  return formatDisplayName(fighter.address, fighter.ensName);
}
