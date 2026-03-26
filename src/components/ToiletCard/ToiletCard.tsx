'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  Clock,
  DoorOpen,
  DoorClosed,
  Navigation,
  MapPin,
  CircleDollarSign,
  Coins,
  Accessibility,
} from 'lucide-react';
import type { Toilet } from '@/lib/types/toilet';
import { isOpenNow, formatHours } from '@/lib/utils/open-hours';
import { haversineDistance, formatDistance } from '@/lib/utils/distance';

interface ToiletCardProps {
  toilet: Toilet | null;
  userLocation: [number, number] | null;
  onClose: () => void;
}

type OpenStatus = 'h24' | 'open' | 'closed' | null;

interface CardContentProps {
  toilet: Toilet;
  distance: string | null;
  openStatus: OpenStatus;
  onClose: () => void;
  showDragHandle: boolean;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}

function CardContent({
  toilet,
  distance,
  openStatus,
  onClose,
  showDragHandle,
  t,
  tc,
}: CardContentProps) {
  const formattedHours = formatHours(toilet.hours);

  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${toilet.lat},${toilet.lng}`;

  return (
    <div className="relative p-5">
      {/* Drag handle (mobile only) */}
      {showDragHandle && <div className="drag-handle lg:hidden" />}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        aria-label={tc('close')}
      >
        <X size={20} />
      </button>

      {/* Name and address */}
      <h3 className="text-lg font-bold text-[var(--color-text)] pr-8">
        {toilet.name}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
        {toilet.address}
      </p>

      {/* Distance */}
      {distance && (
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 flex items-center gap-1">
          <MapPin size={14} />
          {distance}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        {toilet.type === 'free' ? (
          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <CircleDollarSign size={13} />
            {t('free')}
          </span>
        ) : (
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Coins size={13} />
            {t('paid')}
            {toilet.price && ` ${toilet.price}`}
          </span>
        )}

        {toilet.accessible && (
          <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Accessibility size={13} />
            {t('accessible')}
          </span>
        )}
      </div>

      {/* Hours and status */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        <Clock size={16} className="text-[var(--color-text-secondary)] shrink-0" />
        {openStatus === 'h24' ? (
          <span className="text-[var(--color-primary)] font-semibold">
            {t('h24')}
          </span>
        ) : (
          <span className="text-[var(--color-text-secondary)]">
            {formattedHours}
          </span>
        )}
        {openStatus === 'open' && (
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <DoorOpen size={14} />
            {t('open')}
          </span>
        )}
        {openStatus === 'closed' && (
          <span className="text-red-600 font-semibold flex items-center gap-1">
            <DoorClosed size={14} />
            {t('closed')}
          </span>
        )}
      </div>

      {/* Description */}
      {toilet.description && (
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          {toilet.description}
        </p>
      )}

      {/* CTA button */}
      <a
        href={directionsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 w-full bg-[var(--color-cta)] hover:bg-[var(--color-cta-hover)] text-white flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-colors"
      >
        <Navigation size={18} />
        {t('navigate')}
      </a>

      {/* Source info */}
      <p className="mt-4 text-xs text-[var(--color-text-muted)] text-center">
        {toilet.source === 'uml' ? t('source.uml') : t('source.community')}
      </p>
    </div>
  );
}

export default function ToiletCard({
  toilet,
  userLocation,
  onClose,
}: ToiletCardProps) {
  const t = useTranslations('toilet');
  const tc = useTranslations('common');
  const isOpen = toilet !== null;

  // Calculate distance if user location available
  const distance = useMemo(() => {
    if (!toilet || !userLocation) return null;
    const meters = haversineDistance(
      userLocation[0],
      userLocation[1],
      toilet.lat,
      toilet.lng
    );
    return formatDistance(meters);
  }, [toilet, userLocation]);

  // Determine open/closed status
  const openStatus = useMemo((): OpenStatus => {
    if (!toilet) return null;
    if (toilet.is24h) return 'h24';
    const open = isOpenNow(toilet.hours);
    if (open === true) return 'open';
    if (open === false) return 'closed';
    return null;
  }, [toilet]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`bottom-sheet-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet (mobile) */}
      <div
        className={`bottom-sheet lg:hidden bg-[var(--color-card)] rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.1)] ${
          isOpen ? 'open' : ''
        }`}
      >
        {toilet && (
          <CardContent
            toilet={toilet}
            distance={distance}
            openStatus={openStatus}
            onClose={onClose}
            showDragHandle={true}
            t={t}
            tc={tc}
          />
        )}
      </div>

      {/* Side panel (desktop) */}
      <div
        className={`side-panel hidden lg:block bg-[var(--color-card)] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${
          isOpen ? 'open' : ''
        }`}
      >
        {toilet && (
          <CardContent
            toilet={toilet}
            distance={distance}
            openStatus={openStatus}
            onClose={onClose}
            showDragHandle={false}
            t={t}
            tc={tc}
          />
        )}
      </div>
    </>
  );
}
