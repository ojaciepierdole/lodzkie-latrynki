'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const t = useTranslations('cookies');

  useEffect(() => {
    const stored = localStorage.getItem('wcgo-cookie-consent');
    if (stored !== 'accepted' && stored !== 'rejected') {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem('wcgo-cookie-consent', 'accepted');
    setVisible(false);
    window.dispatchEvent(new Event('wcgo-consent-change'));
  }

  function reject() {
    localStorage.setItem('wcgo-cookie-consent', 'rejected');
    setVisible(false);
    window.dispatchEvent(new Event('wcgo-consent-change'));
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 16px 16px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          width: '100%',
          background: 'var(--color-surface, rgba(255,255,255,0.95))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
          borderRadius: 16,
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 -2px 24px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
          pointerEvents: 'auto',
          animation: 'cookieSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--color-text, #1a1a1a)',
          }}
        >
          {t('message')}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={accept}
            style={{
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: '#EA580C',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#C2410C';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#EA580C';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {t('accept')}
          </button>

          <button
            onClick={reject}
            style={{
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-text-secondary, #666)',
              background: 'transparent',
              border: '1px solid var(--color-border, rgba(0,0,0,0.15))',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-hover, rgba(0,0,0,0.04))';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {t('reject')}
          </button>

          <a
            href="/privacy"
            style={{
              fontSize: 13,
              color: 'var(--color-text-secondary, #888)',
              textDecoration: 'underline',
              textUnderlineOffset: 2,
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {t('privacy')}
          </a>
        </div>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
