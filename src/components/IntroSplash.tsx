'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'latrynki-intro-seen';
const FADE_DURATION = 800; // ms
const FADE_START_BEFORE_END = 1.2; // seconds before video ends, start fade to black

export function IntroSplash({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'video' | 'black' | 'fadein' | 'done'>('video');

  // Check sessionStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setPhase('done');
    }
  }, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeToBlack, setFadeToBlack] = useState(false);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.duration - v.currentTime <= FADE_START_BEFORE_END && !fadeToBlack) {
      setFadeToBlack(true);
    }
  }, [fadeToBlack]);

  const handleEnded = useCallback(() => {
    setPhase('black');
    sessionStorage.setItem(STORAGE_KEY, '1');
    // Short pause on black, then fade in the app
    setTimeout(() => setPhase('fadein'), 300);
  }, []);

  // If video fails to load, skip intro
  const handleError = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setPhase('done');
  }, []);

  useEffect(() => {
    if (phase === 'fadein') {
      const t = setTimeout(() => setPhase('done'), FADE_DURATION);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === 'done') return <>{children}</>;

  return (
    <>
      {/* App renders underneath during fadein */}
      {phase === 'fadein' && (
        <div style={{ opacity: 1 }} className="animate-[fadeIn_800ms_ease-out_forwards]">
          {children}
        </div>
      )}

      {/* Splash overlay */}
      <div
        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
        style={{
          opacity: phase === 'fadein' ? 0 : 1,
          transition: phase === 'fadein' ? `opacity ${FADE_DURATION}ms ease-in-out` : undefined,
          pointerEvents: phase === 'fadein' ? 'none' : 'auto',
        }}
      >
        {phase === 'video' && (
          <>
            <video
              ref={videoRef}
              src="/intro.mp4"
              autoPlay
              muted
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onError={handleError}
              className="h-full max-h-dvh w-auto object-contain"
            />
            {/* Fade-to-black overlay on top of video */}
            <div
              className="absolute inset-0 bg-black pointer-events-none"
              style={{
                opacity: fadeToBlack ? 1 : 0,
                transition: `opacity ${FADE_START_BEFORE_END}s ease-in`,
              }}
            />
            {/* Skip button */}
            <button
              onClick={handleEnded}
              className="absolute bottom-8 right-6 text-white/40 text-xs tracking-wider uppercase hover:text-white/70 transition-colors"
            >
              Pomiń
            </button>
          </>
        )}
      </div>
    </>
  );
}
