'use client';

import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const t = useTranslations('meta');

  return (
    <header className="relative z-[1000] bg-[var(--color-card)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <MapPin
          size={24}
          className="text-[var(--color-primary)]"
          strokeWidth={2.25}
        />
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)] tracking-tight">
            Łódzkie Latrynki
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] hidden sm:block">
            {t('tagline')}
          </p>
        </div>
      </div>
      <LanguageSwitcher />
    </header>
  );
}
