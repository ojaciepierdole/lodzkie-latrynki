'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function ConditionalAnalytics() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const check = () => {
      setConsent(localStorage.getItem('wcgo-cookie-consent') === 'accepted');
    };
    check();

    // Re-check when storage changes (e.g. from another tab)
    window.addEventListener('storage', check);
    // Listen for custom event dispatched by CookieConsent component
    window.addEventListener('wcgo-consent-change', check);

    return () => {
      window.removeEventListener('storage', check);
      window.removeEventListener('wcgo-consent-change', check);
    };
  }, []);

  if (!consent) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
