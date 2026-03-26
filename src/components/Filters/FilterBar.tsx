'use client';

import { useTranslations } from 'next-intl';
import { Clock, BadgeCheck, Accessibility, MapPin } from 'lucide-react';
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
    { key: 'free', icon: BadgeCheck, label: t('free') },
    { key: 'accessible', icon: Accessibility, label: t('accessible') },
    { key: 'nearest', icon: MapPin, label: t('nearest') },
  ];

  return (
    <div
      style={{
        background: 'var(--color-card)',
        borderBottom: '1px solid var(--color-border)',
        padding: '8px 12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
        flexShrink: 0,
      }}
    >
      {chips.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '8px 4px',
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: 'all 150ms',
            border: filters[key] ? '1px solid transparent' : '1px solid var(--color-border)',
            background: filters[key] ? 'var(--color-primary)' : 'var(--color-surface)',
            color: filters[key] ? 'white' : 'var(--color-text-secondary)',
          }}
        >
          <Icon size={14} strokeWidth={2} />
          {label}
        </button>
      ))}
    </div>
  );
}
