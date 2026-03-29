'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';

// ── Exported filter state type ──────────────────────────────────────────────

export type FilterState = {
  type: 'all' | 'free' | 'paid';
  accessible: boolean;
  openNow: boolean;
};

// ── Props ───────────────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  filteredCount: number;
  totalCount: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

const TYPE_OPTIONS = ['all', 'free', 'paid'] as const;

const TYPE_COLORS: Record<FilterState['type'], string> = {
  all: 'var(--color-text)',
  free: '#059669',
  paid: '#2563eb',
};

const ACCESSIBLE_COLOR = '#7C3AED';
const OPEN_NOW_COLOR = '#D97706';

// ── Component ───────────────────────────────────────────────────────────────

export function FilterBar({
  filters,
  onFilterChange,
  filteredCount,
  totalCount,
}: FilterBarProps) {
  const t = useTranslations('filters');
  const [isExpanded, setIsExpanded] = useState(false);

  // Count active filters
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.accessible) count++;
    if (filters.openNow) count++;
    return count;
  }, [filters]);

  // Build preview chips for the summary row
  const previewChips = useMemo(() => {
    const chips: { label: string; color: string }[] = [];
    if (filters.type === 'free') chips.push({ label: t('free'), color: TYPE_COLORS.free });
    if (filters.type === 'paid') chips.push({ label: t('paid'), color: TYPE_COLORS.paid });
    if (filters.accessible) chips.push({ label: t('accessible'), color: ACCESSIBLE_COLOR });
    if (filters.openNow) chips.push({ label: t('openNow'), color: OPEN_NOW_COLOR });
    return chips;
  }, [filters, t]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleTypeChange = useCallback(
    (type: FilterState['type']) => {
      onFilterChange({ ...filters, type });
    },
    [filters, onFilterChange],
  );

  const handleToggleAccessible = useCallback(() => {
    onFilterChange({ ...filters, accessible: !filters.accessible });
  }, [filters, onFilterChange]);

  const handleToggleOpenNow = useCallback(() => {
    onFilterChange({ ...filters, openNow: !filters.openNow });
  }, [filters, onFilterChange]);

  const handleReset = useCallback(() => {
    onFilterChange({ type: 'all', accessible: false, openNow: false });
  }, [onFilterChange]);

  // i18n key map for type options
  const typeLabels: Record<FilterState['type'], string> = {
    all: t('typeAll'),
    free: t('free'),
    paid: t('paid'),
  };

  return (
    <div
      style={{
        background: 'var(--color-card)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 500,
      }}
    >
      {/* ── Summary Row ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-label={
          activeCount > 0
            ? t('activeFilters', { count: activeCount })
            : t('allToilets')
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          minHeight: 40,
          padding: '0 12px',
          gap: 8,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: 'inherit',
          color: 'var(--color-text)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Left: Filter icon + badge */}
        <span
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <SlidersHorizontal size={18} style={{ color: 'var(--color-text-muted)' }} />
          {activeCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -6,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                background: '#EA580C',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              {activeCount}
            </span>
          )}
        </span>

        {/* Center: Preview chips or "Wszystkie toalety" */}
        <span
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {previewChips.length === 0 ? (
            <span
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {t('allToilets')}
            </span>
          ) : (
            previewChips.map((chip) => (
              <span
                key={chip.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  background: chip.color,
                  color: 'white',
                  lineHeight: '18px',
                }}
              >
                {chip.label}
              </span>
            ))
          )}
        </span>

        {/* Right: Result counter */}
        <span
          style={{
            flexShrink: 0,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: filteredCount === 0 ? '#DC2626' : 'var(--color-text-muted)',
          }}
        >
          {t('showing', { filtered: filteredCount, total: totalCount })}
        </span>
      </button>

      {/* ── Expanded Sheet ───────────────────────────────────────────── */}
      <div
        style={{
          maxHeight: isExpanded ? 300 : 0,
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 200ms ease, opacity 200ms ease',
        }}
      >
        <div style={{ padding: '12px 16px' }}>
          {/* Section 1: Typ toalety — segmented control */}
          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)',
                marginBottom: 8,
              }}
            >
              {t('typeLabel')}
            </span>
            <div
              role="radiogroup"
              aria-label={t('typeLabel')}
              style={{
                display: 'flex',
                gap: 0,
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
              }}
            >
              {TYPE_OPTIONS.map((option, index) => {
                const isActive = filters.type === option;
                const color = TYPE_COLORS[option];
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={typeLabels[option]}
                    onClick={() => handleTypeChange(option)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 44,
                      padding: '0 8px',
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      border: 'none',
                      borderLeft: index > 0 ? '1px solid var(--color-border)' : 'none',
                      transition: 'all 150ms ease',
                      background: isActive ? color : 'transparent',
                      color: isActive ? 'white' : color,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {typeLabels[option]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Dodatkowe filtry — toggle chips */}
          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)',
                marginBottom: 8,
              }}
            >
              {t('featuresLabel')}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Accessible chip */}
              <button
                type="button"
                role="switch"
                aria-checked={filters.accessible}
                aria-label={t('accessible')}
                onClick={handleToggleAccessible}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 44,
                  padding: '0 16px',
                  borderRadius: 22,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  WebkitTapHighlightColor: 'transparent',
                  background: filters.accessible ? ACCESSIBLE_COLOR : 'transparent',
                  color: filters.accessible ? 'white' : ACCESSIBLE_COLOR,
                  border: `2px solid ${ACCESSIBLE_COLOR}`,
                }}
              >
                {t('accessible')}
              </button>

              {/* Open now chip */}
              <button
                type="button"
                role="switch"
                aria-checked={filters.openNow}
                aria-label={t('openNow')}
                onClick={handleToggleOpenNow}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 44,
                  padding: '0 16px',
                  borderRadius: 22,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  WebkitTapHighlightColor: 'transparent',
                  background: filters.openNow ? OPEN_NOW_COLOR : 'transparent',
                  color: filters.openNow ? 'white' : OPEN_NOW_COLOR,
                  border: `2px solid ${OPEN_NOW_COLOR}`,
                }}
              >
                {t('openNow')}
              </button>
            </div>
          </div>

          {/* Reset button — only visible when filters are active */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'block',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                color: '#EA580C',
                padding: '8px 0',
                minHeight: 44,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {t('reset')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
