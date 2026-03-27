'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { User, Camera } from 'lucide-react';
import type { Review } from '@/lib/types/toilet';
import StarRating from './StarRating';

interface ReviewListProps {
  reviews: Review[];
  maxVisible?: number;
}

function useTimeAgo() {
  const t = useTranslations('reviews');

  return useCallback((dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return t('daysAgo', { days: diffDays });
    if (diffDays < 30) return t('weeksAgo', { weeks: Math.floor(diffDays / 7) });
    return t('monthsAgo', { months: Math.floor(diffDays / 30) });
  }, [t]);
}

export default function ReviewList({
  reviews,
  maxVisible = 3,
}: ReviewListProps) {
  const t = useTranslations('reviews');
  const timeAgo = useTimeAgo();
  const [showAll, setShowAll] = useState(false);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)] italic text-center py-4">
        {t('noReviews')}
      </p>
    );
  }

  const visibleReviews = showAll ? reviews : reviews.slice(0, maxVisible);
  const hasMore = reviews.length > maxVisible;

  return (
    <div>
      {/* Summary header */}
      <div className="flex items-center gap-2 mb-3">
        <StarRating rating={Math.round(averageRating)} size={16} />
        <span className="text-lg font-bold text-[var(--color-text)]">
          {averageRating.toFixed(1)}
        </span>
        <span className="text-sm text-[var(--color-text-secondary)]">
          &middot; {t('count', { count: reviews.length })}
        </span>
      </div>

      {/* Review cards */}
      <div className="space-y-2">
        {visibleReviews.map((review) => (
          <div
            key={review.id}
            className="bg-[var(--color-surface)] rounded-2xl p-3.5 space-y-2"
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <StarRating rating={review.rating} size={14} />
              <span className="text-xs text-[var(--color-text-muted)]">
                {review.authorName} &middot; {timeAgo(review.createdAt)}
              </span>
            </div>

            {/* Review text */}
            {review.text && (
              <p className="text-sm text-[var(--color-text)] italic">
                &ldquo;{review.text}&rdquo;
              </p>
            )}

            {/* Photo thumbnail */}
            {review.photoUrl && (
              <div className="flex items-center gap-1.5">
                <Camera
                  size={14}
                  className="text-[var(--color-text-muted)] shrink-0"
                />
                <img
                  src={review.photoUrl}
                  alt={t('photoBy', { author: review.authorName })}
                  className="h-20 w-20 rounded-xl object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show more button */}
      {hasMore && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-sm font-semibold text-[var(--color-primary)] hover:underline cursor-pointer mt-2"
        >
          {t('showAll', { count: reviews.length })}
        </button>
      )}
    </div>
  );
}
