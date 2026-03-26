'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const t = useTranslations('meta');

  return (
    <header className="relative z-[1000] bg-[var(--color-card)] border-b border-[var(--color-border)] px-4 py-2 sm:py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="wcgo.pl"
          width={240}
          height={72}
          className="h-[44px] sm:h-[56px] w-auto"
          priority
        />
        <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] leading-tight max-w-[100px]">
          {t('tagline')}
        </p>
      </div>
      <LanguageSwitcher />
    </header>
  );
}
