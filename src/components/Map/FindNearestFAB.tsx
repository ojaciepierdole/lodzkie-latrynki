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
      className="fixed left-1/2 -translate-x-1/2 z-[900]
        bg-[var(--color-cta)] hover:bg-[var(--color-cta-hover)]
        text-white shadow-[0_4px_16px_rgba(234,88,12,0.4)]
        flex items-center gap-2.5 px-6 py-3.5 rounded-full
        font-semibold text-sm transition-all duration-200
        hover:shadow-[0_6px_20px_rgba(234,88,12,0.5)] hover:scale-[1.02]
        active:scale-[0.98]
        disabled:opacity-70 disabled:cursor-wait cursor-pointer"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
    >
      {isLocating ? (
        <>
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          Szukam...
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
