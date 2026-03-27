'use client';

import { Navigation } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FindNearestFABProps {
  onFindNearest: () => void;
  isLocating: boolean;
}

export default function FindNearestFAB({
  onFindNearest,
  isLocating,
}: FindNearestFABProps) {
  const t = useTranslations('map');

  return (
    <button
      onClick={onFindNearest}
      disabled={isLocating}
      style={{
        position: 'fixed',
        bottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 24px',
        borderRadius: '9999px',
        fontSize: '14px',
        fontWeight: 600,
        whiteSpace: 'nowrap' as const,
        color: 'white',
        backgroundColor: 'var(--color-cta)',
        boxShadow: '0 4px 16px rgba(234,88,12,0.4)',
        cursor: 'pointer',
        border: 'none',
        transition: 'all 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-cta-hover)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(234,88,12,0.5)';
        e.currentTarget.style.transform = 'translateX(-50%) scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-cta)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(234,88,12,0.4)';
        e.currentTarget.style.transform = 'translateX(-50%)';
      }}
    >
      {isLocating ? (
        <>
          <div
            className="animate-spin"
            style={{
              width: 20,
              height: 20,
              border: '2px solid white',
              borderTopColor: 'transparent',
              borderRadius: '50%',
            }}
          />
          {t('locating')}
        </>
      ) : (
        <>
          <Navigation size={20} />
          {t('findNearest')}
        </>
      )}
    </button>
  );
}
