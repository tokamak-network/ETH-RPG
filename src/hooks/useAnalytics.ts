'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';
import { captureUtm } from '@/lib/utm';

/** Track a page view on mount. Also captures UTM params from the URL. */
export function usePageView(page: string): void {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    captureUtm();
    trackEvent('page_view', { page, referrer: document.referrer || '' });
  }, [page]);
}
