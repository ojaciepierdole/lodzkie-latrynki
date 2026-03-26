'use client';

import { useTranslations } from 'next-intl';
import { Clock, CircleDollarSign, Accessibility, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type FilterState = {
  openNow: boolean;
  free: boolean;
  accessible: boolean;
  nearest: boolean;
};

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const t = useTranslations('filters');

  function toggle(key: keyof FilterState) {
    onFilterChange({ ...filters, [key]: !filters[key] });
  }

  const chips: { key: keyof FilterState; icon: LucideIcon; label: string }[] = [
    { key: 'openNow', icon: Clock, label: t('openNow') },
    { key: 'free', icon: CircleDollarSign, label: t('free') },
    { key: 'accessible', icon: Accessibility, label: t('accessible') },
    { key: 'nearest', icon: MapPin, label: t('nearest') },
  ];

  return (
    <div className="bg-[var(--color-card)] border-b border-[var(--color-border)] px-4 py-2.5 flex gap-2 overflow-x-auto shrink-0 filter-scroll">
      {chips.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
            filters[key]
              ? 'bg-[var(--color-primary)] text-white border border-transparent'
              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'
          }`}
        >
          <Icon size={15} strokeWidth={2} />
          {label}
        </button>
      ))}
    </div>
  );
}
