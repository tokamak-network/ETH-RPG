// Client-side event tracking for funnel analytics.
// In development: console.log. In production: POST to /api/events via sendBeacon.

type EventProperties = Record<string, string | number | boolean>;

const IS_BROWSER = typeof window !== 'undefined';
const IS_DEV = process.env.NODE_ENV === 'development';

/** Track a funnel event with optional properties. */
export function trackEvent(name: string, properties?: EventProperties): void {
  if (!IS_BROWSER) return;

  const payload = {
    event: name,
    properties: properties ?? {},
    url: window.location.href,
    referrer: document.referrer || undefined,
    timestamp: Date.now(),
  };

  if (IS_DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', name, properties ?? '');
    return;
  }

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/events', blob);
  } catch {
    // sendBeacon may fail in some environments — silently ignore
  }
}
