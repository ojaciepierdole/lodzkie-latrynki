'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

const localeCodes: Record<Locale, string> = {
  pl: 'PL',
  en: 'EN',
  de: 'DE',
  es: 'ES',
  uk: 'UA',
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
        aria-label="Change language"
      >
        <Globe size={18} className="text-[var(--color-text)]" />
        <span className="hidden sm:inline text-[var(--color-text)]">
          {localeNames[locale]}
        </span>
        <span className="sm:hidden text-[var(--color-text)]">
          {localeCodes[locale]}
        </span>
        <ChevronDown size={14} className="text-[var(--color-text-secondary)]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 min-w-[180px]" style={{ zIndex: 10000 }}>
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--color-surface)] transition-colors rounded-xl mx-1 ${
                l === locale
                  ? 'font-semibold text-[var(--color-primary)]'
                  : 'text-[var(--color-text)]'
              }`}
              style={{ width: 'calc(100% - 0.5rem)' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] w-5 shrink-0">
                {localeCodes[l]}
              </span>
              <span className="flex-1">{localeNames[l]}</span>
              {l === locale && (
                <Check size={14} className="text-[var(--color-primary)] shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
