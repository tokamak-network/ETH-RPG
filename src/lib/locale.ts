// Browser locale detection for share text localization.
// Lightweight — no i18n framework needed.

/** Returns true if the user's browser language is Korean. SSR-safe. */
export function isKoreanLocale(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.language.startsWith('ko');
}
