'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface OnboardingDialogProps {
  onComplete: () => void;
}

const SLIDE_COUNT = 4;

const featureColors = ['#059669', '#2563eb', '#7C3AED', '#EA580C'];
const featureEmojis = ['\u{1F6BD}', '\u{1F4B0}', '\u{267F}', '\u{1F7E2}'];

export function OnboardingDialog({ onComplete }: OnboardingDialogProps) {
  const t = useTranslations('onboarding');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'enter' | 'exit'>('enter');

  const goToSlide = useCallback((index: number) => {
    setSlideDirection('exit');
    setTimeout(() => {
      setCurrentSlide(index);
      setSlideDirection('enter');
    }, 200);
  }, []);

  const handleNext = useCallback(() => {
    if (currentSlide < SLIDE_COUNT - 1) {
      goToSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  }, [currentSlide, goToSlide, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Styles as objects (inline) because Tailwind v4 doesn't generate CSS for dynamic imports
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '16px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#FAFAF9',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '420px',
    padding: '40px 28px 28px',
    position: 'relative',
    boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  };

  const slideContentStyle: React.CSSProperties = {
    opacity: slideDirection === 'enter' ? 1 : 0,
    transform: slideDirection === 'enter' ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '20px',
    lineHeight: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1C1917',
    marginBottom: '12px',
    lineHeight: 1.3,
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: '15px',
    color: '#78716C',
    lineHeight: 1.6,
    marginBottom: '16px',
    maxWidth: '340px',
  };

  const asideStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#A8A29E',
    fontStyle: 'italic',
    marginTop: '8px',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 24px',
    background: '#EA580C',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s ease, transform 0.15s ease',
    marginTop: '8px',
  };

  const skipStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#A8A29E',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '12px 16px',
    transition: 'color 0.2s ease',
    marginTop: '4px',
  };

  const dotsContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '20px',
    marginBottom: '8px',
  };

  const featureItemStyle = (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    textAlign: 'left',
    marginBottom: '10px',
  });

  const featureCircleStyle = (color: string): React.CSSProperties => ({
    width: '36px',
    height: '36px',
    minWidth: '36px',
    borderRadius: '50%',
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    lineHeight: 1,
  });

  const featureTextStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#44403C',
    lineHeight: 1.4,
  };

  const gradientTitleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #EA580C, #F59E0B)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '12px',
    lineHeight: 1.3,
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div style={slideContentStyle}>
            <div style={iconStyle} role="img" aria-hidden="true">{'\u{1F6BB}'}</div>
            <div style={titleStyle}>{t('slide1Title')}</div>
            <div style={bodyStyle}>{t('slide1Body')}</div>
          </div>
        );
      case 1:
        return (
          <div style={slideContentStyle}>
            <div style={iconStyle} role="img" aria-hidden="true">{'\u{1F5FA}\uFE0F'}</div>
            <div style={titleStyle}>{t('slide2Title')}</div>
            <div style={{ width: '100%', maxWidth: '320px', marginTop: '8px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={featureItemStyle(featureColors[i - 1])}>
                  <div style={featureCircleStyle(featureColors[i - 1])}>
                    <span style={{ filter: 'brightness(0) invert(1)', fontSize: '16px' }}>
                      {featureEmojis[i - 1]}
                    </span>
                  </div>
                  <span style={featureTextStyle}>
                    {t(`slide2Feature${i}` as 'slide2Feature1' | 'slide2Feature2' | 'slide2Feature3' | 'slide2Feature4')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div style={slideContentStyle}>
            <div style={iconStyle} role="img" aria-hidden="true">{'\u{1F4CD}'}</div>
            <div style={titleStyle}>{t('slide3Title')}</div>
            <div style={bodyStyle}>{t('slide3Body')}</div>
            <div style={asideStyle}>{t('slide3Aside')}</div>
          </div>
        );
      case 3:
        return (
          <div style={slideContentStyle}>
            <div style={iconStyle} role="img" aria-hidden="true">{'\u{1F60E}'}</div>
            <div style={gradientTitleStyle}>{t('slide4Title')}</div>
            <div style={{ ...bodyStyle, fontSize: '16px', color: '#57534E' }}>
              {t('slide4Subtitle')}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {renderSlide()}

        {/* Dots */}
        <div style={dotsContainerStyle}>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: currentSlide === i ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                background: currentSlide === i ? '#EA580C' : '#D6D3D1',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={handleNext}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#DC4C05';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#EA580C';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {currentSlide === SLIDE_COUNT - 1 ? t('slide4Button') : t('next')}
        </button>

        {/* Skip */}
        {currentSlide < SLIDE_COUNT - 1 && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleSkip}
              style={skipStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#78716C'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#A8A29E'; }}
            >
              {t('skip')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
