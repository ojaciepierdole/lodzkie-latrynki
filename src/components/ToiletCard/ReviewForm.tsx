'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, Camera, Send, CheckCircle } from 'lucide-react';
import StarRating from './StarRating';

interface ReviewFormProps {
  toiletId: string;
  toiletName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: { rating: number; text: string }) => void;
}

export default function ReviewForm({
  toiletId,
  toiletName,
  isOpen,
  onClose,
  onSubmit,
}: ReviewFormProps) {
  const t = useTranslations('reviews');

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Reset state when the form opens for a new toilet
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setText('');
      setSubmitted(false);
    }
  }, [isOpen, toiletId]);

  // Auto-close after successful submission
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [submitted, onClose]);

  const handleSubmit = useCallback(() => {
    if (rating === 0) return;
    onSubmit({ rating, text });
    setSubmitted(true);
  }, [rating, text, onSubmit]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`bottom-sheet-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[1002] bg-[var(--color-card)] rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.15)] transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="relative p-5 pb-8">
          {/* Drag handle */}
          <div className="drag-handle" />

          {submitted ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <CheckCircle size={48} className="text-emerald-500" />
              <p className="text-lg font-bold text-[var(--color-text)]">
                Dzięki za opinię!
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Łódź Ci nie zapomni.
              </p>
            </div>
          ) : (
            <>
              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                aria-label="Zamknij"
              >
                <X size={20} />
              </button>

              {/* Title */}
              <h3 className="text-lg font-bold text-[var(--color-text)]">
                Oceń tę latrynkę
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                {toiletName}
              </p>

              {/* Star rating */}
              <div className="flex justify-center mt-5 mb-5">
                <StarRating rating={rating} onChange={setRating} size={32} />
              </div>

              {/* Text area */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Napisz opinię..."
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
              />

              {/* Photo button (disabled) */}
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] px-3 py-2 mt-2">
                <Camera size={16} />
                <span>Dodaj zdjęcie (wkrótce)</span>
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={rating === 0}
                className={`w-full bg-[var(--color-cta)] hover:bg-[var(--color-cta-hover)] text-white flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-colors mt-2 ${
                  rating === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Send size={16} />
                Wyślij opinię
              </button>

              {/* Footer */}
              <p className="text-xs text-[var(--color-text-muted)] text-center mt-3">
                Opinia jest anonimowa.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
