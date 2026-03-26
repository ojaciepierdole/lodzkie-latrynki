'use client';

import { useTranslations } from 'next-intl';

export type FilterState = {
  showFree: boolean;
  showPaid: boolean;
  accessible: boolean;
  openNow: boolean;
};

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

// Inline SVG icons — no Lucide dependency for filter bar
const IconFreeNo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="4" x2="20" y2="20" />
    <path d="M17.2 7a4 4 0 0 0-5.2-.8M7 15.5c.5 1.5 2 2.5 4 2.5 1.3 0 2.4-.4 3.2-1" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
  </svg>
);

const IconPaid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 8c-.7-1.4-2.3-2-4.5-2-3 0-4.5 1.5-4.5 3s1.5 2.5 4.5 3c3 .5 4.5 1.5 4.5 3s-1.5 3-4.5 3c-2.2 0-3.8-.6-4.5-2" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
  </svg>
);

const IconWheelchair = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="17" r="4" />
    <path d="M10 13V6" />
    <circle cx="10" cy="4" r="1" fill="currentColor" stroke="none" />
    <path d="M10 9h5l2 8" />
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

type FilterItem = {
  key: keyof FilterState;
  icon: () => React.JSX.Element;
  label: string;
  activeColor: string;
};

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const t = useTranslations('filters');

  function toggle(key: keyof FilterState) {
    onFilterChange({ ...filters, [key]: !filters[key] });
  }

  const items: FilterItem[] = [
    { key: 'showFree', icon: IconFreeNo, label: t('free'), activeColor: '#059669' },
    { key: 'showPaid', icon: IconPaid, label: t('paid'), activeColor: '#2563eb' },
    { key: 'accessible', icon: IconWheelchair, label: t('accessible'), activeColor: '#7C3AED' },
    { key: 'openNow', icon: IconClock, label: t('openNow'), activeColor: '#D97706' },
  ];

  return (
    <div
      style={{
        background: 'var(--color-card)',
        borderBottom: '1px solid var(--color-border)',
        padding: '6px 10px',
        display: 'flex',
        gap: 6,
        flexShrink: 0,
        overflowX: 'auto',
      }}
    >
      {items.map(({ key, icon: Icon, label, activeColor }) => {
        const active = filters[key];
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 150ms',
              border: active ? `2px solid ${activeColor}` : '2px solid var(--color-border)',
              background: active ? `${activeColor}12` : 'transparent',
              color: active ? activeColor : 'var(--color-text-secondary)',
              flexShrink: 0,
            }}
          >
            <Icon />
            {label}
          </button>
        );
      })}
    </div>
  );
}
