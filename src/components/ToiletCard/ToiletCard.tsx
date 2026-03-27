'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSwipeDismiss } from '@/lib/hooks/useSwipeDismiss';
import {
  X,
  Clock,
  DoorOpen,
  DoorClosed,
  Navigation,
  MapPin,
  BadgeCheck,
  Coins,
  Accessibility,
  MessageSquarePlus,
  FileWarning,
  Building2,
  Landmark,
  Palette,
  User,
  Users,
  Baby,
  SmilePlus,
  CircleDot,
  Sparkles,
} from 'lucide-react';
import type { Toilet, Review, ToiletFeature, ToiletCategory } from '@/lib/types/toilet';
import ReviewList from './ReviewList';
import { isOpenNow, formatHours } from '@/lib/utils/open-hours';
import { haversineDistance, formatDistance } from '@/lib/utils/distance';

const FEATURE_CONFIG: Record<ToiletFeature, { icon: typeof User; labelKey: string }> = {
  female: { icon: User, labelKey: 'feature.female' },
  male: { icon: User, labelKey: 'feature.male' },
  neutral: { icon: Users, labelKey: 'feature.neutral' },
  changing_table: { icon: Baby, labelKey: 'feature.changing_table' },
  child_friendly: { icon: SmilePlus, labelKey: 'feature.child_friendly' },
  porcelain: { icon: CircleDot, labelKey: 'feature.porcelain' },
  hygiene_supplies: { icon: Sparkles, labelKey: 'feature.hygiene_supplies' },
};

const CATEGORY_CONFIG: Partial<Record<ToiletCategory, { icon: typeof Building2; labelKey: string; colors: string }>> = {
  commercial: { icon: Building2, labelKey: 'category.commercial', colors: 'bg-amber-100 text-amber-800' },
  cultural: { icon: Palette, labelKey: 'category.cultural', colors: 'bg-purple-100 text-purple-800' },
  government: { icon: Landmark, labelKey: 'category.government', colors: 'bg-slate-100 text-slate-800' },
};

interface ToiletCardProps {
  toilet: Toilet | null;
  userLocation: [number, number] | null;
  reviews: Review[];
  onClose: () => void;
  onOpenReviewForm: () => void;
  onOpenCorrectionForm: () => void;
}

type OpenStatus = 'h24' | 'open' | 'closed' | null;

interface CardContentProps {
  toilet: Toilet;
  distance: string | null;
  openStatus: OpenStatus;
  reviews: Review[];
  onClose: () => void;
  onOpenReviewForm: () => void;
  onOpenCorrectionForm: () => void;
  showDragHandle: boolean;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}

function CardContent({
  toilet,
  distance,
  openStatus,
  reviews,
  onClose,
  onOpenReviewForm,
  onOpenCorrectionForm,
  showDragHandle,
  t,
  tc,
}: CardContentProps) {
  const toiletReviews = reviews.filter(r => r.toiletId === toilet.id);
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

      {/* Label + Name and address */}
      <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide flex items-center gap-1 mb-1">
        <DoorOpen size={12} />
        {t('label')}
      </p>
      <h3 className="text-lg font-bold text-[var(--color-text)] pr-8">
        {toilet.name}
      </h3>
      {toilet.address !== toilet.name && (
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          {toilet.address}
        </p>
      )}

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
          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <BadgeCheck size={13} />
            {t('free')}
          </span>
        ) : (
          <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Coins size={13} />
            {t('paid')}
            {toilet.price && ` ${toilet.price}`}
          </span>
        )}

        {toilet.accessible && (
          <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Accessibility size={13} />
            {t('accessible')}
          </span>
        )}

        {toilet.category && CATEGORY_CONFIG[toilet.category] && (() => {
          const cfg = CATEGORY_CONFIG[toilet.category]!;
          const CatIcon = cfg.icon;
          return (
            <span className={`${cfg.colors} px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
              <CatIcon size={13} />
              {t(cfg.labelKey)}
            </span>
          );
        })()}
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

      {/* Images */}
      {toilet.images && toilet.images.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {toilet.images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${toilet.name} ${i + 1}`}
              loading="lazy"
              className="h-20 w-auto rounded-lg object-cover shrink-0"
            />
          ))}
        </div>
      )}

      {/* Description */}
      {toilet.description && (
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          {toilet.description}
        </p>
      )}

      {/* Features */}
      {toilet.features && toilet.features.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {toilet.features.map((feature) => {
            const cfg = FEATURE_CONFIG[feature];
            if (!cfg) return null;
            const FeatureIcon = cfg.icon;
            return (
              <span
                key={feature}
                title={t(cfg.labelKey)}
                className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full text-xs"
              >
                <FeatureIcon size={12} />
                {t(cfg.labelKey)}
              </span>
            );
          })}
        </div>
      )}

      {/* Cabin count */}
      {toilet.cabinCount != null && toilet.cabinCount > 0 && (
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
          {t('cabins', { count: toilet.cabinCount })}
        </p>
      )}

      {/* Divider */}
      <div className="mt-5 mb-4 border-t border-[var(--color-border)]" />

      {/* Reviews */}
      <ReviewList reviews={toiletReviews} maxVisible={3} />

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

      {/* Review CTA */}
      <button
        onClick={onOpenReviewForm}
        className="mt-3 w-full bg-[var(--color-surface)] hover:bg-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-colors border border-[var(--color-border)] cursor-pointer"
      >
        <MessageSquarePlus size={18} />
        {t('addReview')}
      </button>

      {/* Correction CTA */}
      <button
        onClick={onOpenCorrectionForm}
        className="mt-2 w-full text-[var(--color-text-secondary)] hover:text-[var(--color-text)] flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium transition-colors cursor-pointer"
      >
        <FileWarning size={14} />
        {t('reportCorrection')}
      </button>

      {/* Source info */}
      <p className="mt-4 text-xs text-[var(--color-text-muted)] text-center">
        {toilet.source === 'uml'
          ? t('source.uml')
          : toilet.source === 'gdziejesttron'
            ? t('source.gdziejesttron')
            : t('source.community')}
      </p>
    </div>
  );
}

export default function ToiletCard({
  toilet,
  userLocation,
  reviews,
  onClose,
  onOpenReviewForm,
  onOpenCorrectionForm,
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

  const swipe = useSwipeDismiss(onClose);

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
        ref={swipe.ref}
        className={`bottom-sheet lg:hidden bg-[var(--color-card)] rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.1)] ${
          isOpen ? 'open' : ''
        }`}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
      >
        {toilet && (
          <CardContent
            toilet={toilet}
            distance={distance}
            openStatus={openStatus}
            reviews={reviews}
            onClose={onClose}
            onOpenReviewForm={onOpenReviewForm}
            onOpenCorrectionForm={onOpenCorrectionForm}
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
            reviews={reviews}
            onClose={onClose}
            onOpenReviewForm={onOpenReviewForm}
            onOpenCorrectionForm={onOpenCorrectionForm}
            showDragHandle={false}
            t={t}
            tc={tc}
          />
        )}
      </div>
    </>
  );
}
