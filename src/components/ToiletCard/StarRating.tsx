'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}

export default function StarRating({
  rating,
  onChange,
  size = 18,
}: StarRatingProps) {
  const [hoverIndex, setHoverIndex] = useState<number>(0);

  const isInteractive = typeof onChange === 'function';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = isInteractive
          ? star <= (hoverIndex || rating)
          : star <= rating;

        return (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => isInteractive && setHoverIndex(star)}
            onMouseLeave={() => isInteractive && setHoverIndex(0)}
            className={
              isInteractive
                ? 'cursor-pointer transition-colors disabled:cursor-default'
                : 'cursor-default'
            }
            aria-label={`${star} / 5`}
          >
            <Star
              size={size}
              className={
                isFilled
                  ? 'text-amber-500'
                  : 'text-[var(--color-border-strong)]'
              }
              fill={isFilled ? 'currentColor' : 'none'}
            />
          </button>
        );
      })}
    </div>
  );
}
