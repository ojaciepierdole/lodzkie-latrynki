'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const t = useTranslations('meta');

  return (
    <header className="relative z-[1000] bg-[var(--color-card)] border-b border-[var(--color-border)] px-3 sm:px-4 flex items-center justify-between shrink-0 h-12 sm:h-14">
      <div className="flex items-center gap-1.5 overflow-hidden">
        <Image
          src="/logo.png"
          alt="wcgo.pl"
          width={320}
          height={96}
          className="h-20 sm:h-24 w-auto -my-4 sm:-my-5 shrink-0"
          priority
        />
        <div className="flex flex-col leading-tight">
          <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
            {t('tagline')}
          </span>
          <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] opacity-70 whitespace-nowrap">
            {t('motto')}
          </span>
        </div>
      </div>
      <LanguageSwitcher />
    </header>
  );
}
