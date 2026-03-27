'use client';

import React, { useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSwipeDismiss } from '@/lib/hooks/useSwipeDismiss';
import {
  X,
  Clock,
  DoorOpen,
  Navigation,
  MapPin,
  BadgeCheck,
  Coins,
  Accessibility,
  MessageSquarePlus,
  FileWarning,
  Cable,
  Building2,
  Landmark,
  Palette,
  User,
  Users,
  Baby,
  SmilePlus,
  CircleDot,
  Sparkles,
  Hospital,
  Stethoscope,
  BookOpen,
  UtensilsCrossed,
  Fuel,
  ShoppingBag,
  TrainFront,
  TreePine,
  GraduationCap,
  Cross,
} from 'lucide-react';
import type { Toilet, Review, ToiletFeature, ToiletCategory } from '@/lib/types/toilet';
import ReviewList from './ReviewList';
import { isOpenNow, formatHours, inferHoursFromCategory } from '@/lib/utils/open-hours';
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
  commercial: { icon: Building2, labelKey: 'category.commercial', colors: 'bg-amber-600 text-white' },
  cultural: { icon: Palette, labelKey: 'category.cultural', colors: 'bg-purple-600 text-white' },
  government: { icon: Landmark, labelKey: 'category.government', colors: 'bg-slate-600 text-white' },
  hospital: { icon: Hospital, labelKey: 'category.hospital', colors: 'bg-red-600 text-white' },
  clinic: { icon: Stethoscope, labelKey: 'category.clinic', colors: 'bg-pink-600 text-white' },
  library: { icon: BookOpen, labelKey: 'category.library', colors: 'bg-indigo-600 text-white' },
  restaurant: { icon: UtensilsCrossed, labelKey: 'category.restaurant', colors: 'bg-orange-600 text-white' },
  gas_station: { icon: Fuel, labelKey: 'category.gas_station', colors: 'bg-yellow-600 text-white' },
  shopping: { icon: ShoppingBag, labelKey: 'category.shopping', colors: 'bg-rose-600 text-white' },
  transit: { icon: TrainFront, labelKey: 'category.transit', colors: 'bg-cyan-600 text-white' },
  park: { icon: TreePine, labelKey: 'category.park', colors: 'bg-green-600 text-white' },
  university: { icon: GraduationCap, labelKey: 'category.university', colors: 'bg-blue-600 text-white' },
  cemetery: { icon: Cross, labelKey: 'category.cemetery', colors: 'bg-stone-600 text-white' },
};

interface ToiletCardProps {
  toilet: Toilet | null;
  userLocation: [number, number] | null;
  reviews: Review[];
  onClose: () => void;
  onOpenReviewForm: () => void;
  onOpenCorrectionForm: () => void;
}

type OpenStatus = 'h24' | 'open' | 'closed' | 'inferred_open' | 'inferred_closed' | null;

interface CardContentProps {
  toilet: Toilet;
  distance: string | null;
  openStatus: OpenStatus;
  reviews: Review[];
  onClose: () => void;
  onOpenReviewForm: () => void;
  onOpenCorrectionForm: () => void;
  showDragHandle: boolean;
  locale: string;
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
  locale,
  t,
  tc,
}: CardContentProps) {
  const toiletReviews = reviews.filter(r => r.toiletId === toilet.id);
  const formattedHours = formatHours(toilet.hours, locale);

  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${toilet.lat},${toilet.lng}`;

  return (
    <div className="relative p-5">
      {/* Drag handle (mobile only) */}
      {showDragHandle && <div className="drag-handle lg:hidden" aria-hidden="true" />}

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
        {toilet.category && toilet.category !== 'public' && CATEGORY_CONFIG[toilet.category] ? (
          <>
            {React.createElement(CATEGORY_CONFIG[toilet.category]!.icon, { size: 12 })}
            {t(`category.${toilet.category}`)}
          </>
        ) : (
          <>
            <DoorOpen size={12} />
            {t('label')}
          </>
        )}
      </p>
      <h2 className="text-lg font-bold text-[var(--color-text)] pr-8">
        {toilet.name}
      </h2>
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
          <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <BadgeCheck size={13} />
            {t('free')}
          </span>
        ) : (
          <span className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Coins size={13} />
            {t('paid')}
            {toilet.price && ` ${toilet.price}`}
          </span>
        )}

        {toilet.accessible && (
          <span className="bg-purple-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Accessibility size={13} />
            {t('accessible')}
          </span>
        )}

        {/* Category badge removed — shown as label above name */}
      </div>

      {/* Hours and status — only show when there's something to display */}
      {(openStatus || formattedHours) && (
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
            <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              {t('open')}
            </span>
          )}
          {openStatus === 'closed' && (
            <span className="text-gray-500 font-semibold flex items-center gap-1.5">
              <span className="inline-flex rounded-full h-2.5 w-2.5 bg-gray-400" aria-hidden="true"></span>
              {t('closed')}
            </span>
          )}
          {openStatus === 'inferred_open' && (
            <span className="text-emerald-500 font-medium flex items-center gap-1.5 text-sm">
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-400 opacity-60" aria-hidden="true"></span>
              {t('inferredOpen')}
            </span>
          )}
          {openStatus === 'inferred_closed' && (
            <span className="text-gray-400 font-medium flex items-center gap-1.5 text-sm">
              <span className="inline-flex rounded-full h-2 w-2 bg-gray-300" aria-hidden="true"></span>
              {t('inferredClosed')}
            </span>
          )}
        </div>
      )}

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

      {/* Description — filter out attribution patterns */}
      {toilet.description && (() => {
        const cleaned = toilet.description
          .replace(/Dane dzięki[^.]*\./gi, '')
          .replace(/CC BY[-\s]*SA[^.]*\./gi, '')
          .replace(/Open\s*Street\s*Map[^.]*\./gi, '')
          .trim();
        return cleaned ? (
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            {cleaned}
          </p>
        ) : null;
      })()}

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
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs"
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

      {/* Source + attribution footer */}
      <div className="mt-4 flex flex-col items-center gap-0.5 text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-1.5">
          <Cable size={12} />
          {toilet.source === 'uml' ? (
            <a href="https://uml.lodz.pl/dla-mieszkancow/toalety-miejskie/" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Urząd Miasta Łodzi
            </a>
          ) : toilet.source === 'gdziejesttron' ? (
            <a href="https://gdziejesttron.pl" target="_blank" rel="noopener noreferrer" className="hover:underline">
              gdziejesttron.pl
            </a>
          ) : (
            <span>{t('source.community')}</span>
          )}
          <span className="text-[var(--color-border-strong)]">·</span>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">
            © OpenStreetMap
          </a>
        </div>
      </div>
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
  const locale = useLocale();
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
    // Infer from category when no hours data
    const inferred = inferHoursFromCategory(toilet.category);
    if (inferred) {
      if (inferred.is24h) return 'h24';
      if (inferred.hours) {
        const inferredOpen = isOpenNow(inferred.hours);
        if (inferredOpen === true) return 'inferred_open';
        if (inferredOpen === false) return 'inferred_closed';
      }
    }
    return null;
  }, [toilet]);

  const swipe = useSwipeDismiss(onClose);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

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
        role="dialog"
        aria-modal="true"
        aria-label={toilet?.name}
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
            locale={locale}
            t={t}
            tc={tc}
          />
        )}
      </div>

      {/* Side panel (desktop) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={toilet?.name}
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
            locale={locale}
            t={t}
            tc={tc}
          />
        )}
      </div>
    </>
  );
}
