// UTM parameter management for share link attribution.
// Reads UTM params from URL on page load, persists in sessionStorage,
// and appends them to share URLs.

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const STORAGE_KEY = 'eth_rpg_utm';

type UtmParams = Partial<Record<typeof UTM_KEYS[number], string>>;

const IS_BROWSER = typeof window !== 'undefined';

/** Capture UTM params from current URL and persist in sessionStorage. */
export function captureUtm(): void {
  if (!IS_BROWSER) return;

  const url = new URL(window.location.href);
  const params: UtmParams = {};
  let hasUtm = false;

  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key);
    if (value) {
      params[key] = value;
      hasUtm = true;
    }
  }

  if (hasUtm) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    } catch {
      // sessionStorage may be unavailable
    }
  }
}

/** Get stored UTM params from sessionStorage. */
export function getUtmParams(): UtmParams {
  if (!IS_BROWSER) return {};

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UtmParams;
    }
  } catch {
    // sessionStorage may be unavailable
  }

  return {};
}

/** Append UTM params to a URL string. Adds share attribution automatically. */
export function appendUtmToUrl(url: string, overrides?: UtmParams): string {
  const stored = getUtmParams();
  const merged: UtmParams = {
    // Default share attribution
    utm_source: 'share',
    utm_medium: 'card',
    utm_campaign: 'viral',
    // Override with stored inbound UTM if exists
    ...stored,
    // Override with explicit params
    ...overrides,
  };

  try {
    const parsed = new URL(url);
    for (const [key, value] of Object.entries(merged)) {
      if (value) {
        parsed.searchParams.set(key, value);
      }
    }
    return parsed.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}
