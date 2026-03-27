'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useSwipeDismiss } from '@/lib/hooks/useSwipeDismiss';

interface SuggestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuggestForm({ isOpen, onClose }: SuggestFormProps) {
  const t = useTranslations('suggest');
  const tf = useTranslations('filters');
  const tc = useTranslations('common');

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'free' | 'paid'>('free');
  const [accessible, setAccessible] = useState(false);
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setName('');
      setAddress('');
      setType('free');
      setAccessible(false);
      setHours('');
      setNotes('');
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Auto-close after successful submission
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [status, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !address.trim()) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          type,
          accessible,
          hours: hours.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || t('error'));
        setStatus('error');
      }
    } catch {
      setErrorMessage(t('error'));
      setStatus('error');
    }
  }, [name, address, type, accessible, hours, notes, t]);

  const swipe = useSwipeDismiss(onClose);

  const isValid = name.trim().length > 0 && address.trim().length > 0;

  if (!isOpen) return null;

  // --- Shared inline styles ---
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1200,
  };

  const sheetStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'var(--color-card)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
    zIndex: 1201,
    maxHeight: '85dvh',
    overflowY: 'auto',
  };

  const dragHandleStyle: React.CSSProperties = {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'var(--color-border)',
    margin: '0 auto 16px',
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    padding: 4,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--color-text)',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    marginTop: 4,
    lineHeight: 1.4,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 16,
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--color-text)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'none' as const,
    height: 80,
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: 16,
  };

  const radioGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    marginTop: 4,
  };

  const radioLabelStyle = (selected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    border: `2px solid ${selected ? 'var(--color-cta)' : 'var(--color-border)'}`,
    backgroundColor: selected ? 'rgba(234,88,12,0.08)' : 'transparent',
    color: selected ? 'var(--color-cta)' : 'var(--color-text)',
    transition: 'all 150ms ease',
  });

  const checkboxWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
  };

  const checkboxStyle: React.CSSProperties = {
    width: 20,
    height: 20,
    borderRadius: 6,
    border: `2px solid ${accessible ? 'var(--color-cta)' : 'var(--color-border)'}`,
    backgroundColor: accessible ? 'var(--color-cta)' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 150ms ease',
  };

  const submitButtonStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 16px',
    borderRadius: 16,
    fontSize: 14,
    fontWeight: 600,
    color: 'white',
    backgroundColor: 'var(--color-cta)',
    border: 'none',
    cursor: isValid && status !== 'submitting' ? 'pointer' : 'not-allowed',
    opacity: isValid && status !== 'submitting' ? 1 : 0.5,
    transition: 'all 200ms ease',
    marginTop: 8,
  };

  const errorBannerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 12,
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={overlayStyle}
        onClick={status === 'success' ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        ref={swipe.ref}
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
      >
        <div style={{ padding: '20px 20px 32px' }}>
          {/* Drag handle */}
          <div style={dragHandleStyle} aria-hidden="true" />

          {status === 'success' ? (
            /* Success state */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 0',
                gap: 12,
                cursor: 'pointer',
              }}
              onClick={onClose}
            >
              <CheckCircle size={48} color="#059669" />
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                {t('success')}
              </p>
            </div>
          ) : (
            <>
              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                style={closeButtonStyle}
                aria-label={tc('close')}
              >
                <X size={20} aria-hidden="true" />
              </button>

              {/* Title */}
              <h3 style={titleStyle}>{t('title')}</h3>
              <p style={subtitleStyle}>{t('subtitle')}</p>

              {/* Form fields */}
              <div style={{ marginTop: 20 }}>
                {/* Error banner */}
                {status === 'error' && errorMessage && (
                  <div style={errorBannerStyle}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Name */}
                <div style={fieldGroupStyle}>
                  <label htmlFor="suggest-name" style={labelStyle}>{t('name')} *</label>
                  <input
                    id="suggest-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    style={inputStyle}
                  />
                </div>

                {/* Address */}
                <div style={fieldGroupStyle}>
                  <label htmlFor="suggest-address" style={labelStyle}>{t('address')} *</label>
                  <input
                    id="suggest-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('addressPlaceholder')}
                    style={inputStyle}
                  />
                </div>

                {/* Type (radio) */}
                <div style={fieldGroupStyle}>
                  <span id="suggest-type-label" style={labelStyle}>{t('type')}</span>
                  <div style={radioGroupStyle} role="radiogroup" aria-labelledby="suggest-type-label">
                    <label
                      style={radioLabelStyle(type === 'free')}
                      onClick={() => setType('free')}
                    >
                      <input
                        type="radio"
                        name="suggest-toilet-type"
                        value="free"
                        checked={type === 'free'}
                        onChange={() => setType('free')}
                        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}
                      />
                      <span aria-hidden="true" style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `2px solid ${type === 'free' ? 'var(--color-cta)' : 'var(--color-border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {type === 'free' && (
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-cta)',
                          }} />
                        )}
                      </span>
                      {tf('free')}
                    </label>
                    <label
                      style={radioLabelStyle(type === 'paid')}
                      onClick={() => setType('paid')}
                    >
                      <input
                        type="radio"
                        name="suggest-toilet-type"
                        value="paid"
                        checked={type === 'paid'}
                        onChange={() => setType('paid')}
                        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}
                      />
                      <span aria-hidden="true" style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `2px solid ${type === 'paid' ? 'var(--color-cta)' : 'var(--color-border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {type === 'paid' && (
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-cta)',
                          }} />
                        )}
                      </span>
                      {tf('paid')}
                    </label>
                  </div>
                </div>

                {/* Accessible (checkbox) */}
                <div style={fieldGroupStyle}>
                  <div
                    style={checkboxWrapperStyle}
                    onClick={() => setAccessible(!accessible)}
                    role="checkbox"
                    aria-checked={accessible}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setAccessible(!accessible);
                      }
                    }}
                  >
                    <div style={checkboxStyle}>
                      {accessible && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6L5 9L10 3"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--color-text)' }}>
                      {t('accessibleLabel')}
                    </span>
                  </div>
                </div>

                {/* Hours */}
                <div style={fieldGroupStyle}>
                  <label htmlFor="suggest-hours" style={labelStyle}>{t('hours')}</label>
                  <input
                    id="suggest-hours"
                    type="text"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder={t('hoursPlaceholder')}
                    style={inputStyle}
                  />
                </div>

                {/* Notes */}
                <div style={fieldGroupStyle}>
                  <label htmlFor="suggest-notes" style={labelStyle}>{t('notes')}</label>
                  <textarea
                    id="suggest-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={textareaStyle}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isValid || status === 'submitting'}
                  style={submitButtonStyle}
                  onMouseEnter={(e) => {
                    if (isValid && status !== 'submitting') {
                      e.currentTarget.style.backgroundColor = 'var(--color-cta-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-cta)';
                  }}
                >
                  {status === 'submitting' ? (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                  ) : (
                    <>
                      <Send size={16} />
                      {t('submit')}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Keyframe for spinner (inline styles can't define @keyframes, add via style tag) */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
