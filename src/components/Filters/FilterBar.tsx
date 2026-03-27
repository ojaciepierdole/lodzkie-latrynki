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

type FilterItem = {
  key: keyof FilterState;
  label: string;
  activeColor: string;
};

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const t = useTranslations('filters');

  function toggle(key: keyof FilterState) {
    onFilterChange({ ...filters, [key]: !filters[key] });
  }

  const items: FilterItem[] = [
    { key: 'showFree', label: t('free'), activeColor: '#059669' },
    { key: 'showPaid', label: t('paid'), activeColor: '#2563eb' },
    { key: 'accessible', label: t('accessible'), activeColor: '#7C3AED' },
    { key: 'openNow', label: t('openNow'), activeColor: '#D97706' },
  ];

  return (
    <div
      style={{
        background: 'var(--color-card)',
        borderBottom: '1px solid var(--color-border)',
        padding: '4px 8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 4,
        flexShrink: 0,
      }}
    >
      {items.map(({ key, label, activeColor }) => {
        const active = filters[key];
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            role="switch"
            aria-checked={active}
            aria-label={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '5px 2px',
              minHeight: '44px',
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 150ms',
              border: 'none',
              background: 'transparent',
              color: active ? activeColor : '#78716C',
            }}
          >
            {/* Toggle switch */}
            <div
              style={{
                width: 28,
                height: 16,
                borderRadius: 8,
                background: active ? activeColor : '#A8A29E',
                position: 'relative',
                transition: 'background 150ms',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: 2,
                  left: active ? 14 : 2,
                  transition: 'left 150ms',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              />
            </div>
            <span style={{ color: active ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
