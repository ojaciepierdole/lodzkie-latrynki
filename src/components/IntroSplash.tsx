'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

const STORAGE_KEY = 'latrynki-intro-seen';
const FADE_DURATION = 800; // ms
const FADE_START_BEFORE_END = 1.2; // seconds before video ends, start fade to black

export function IntroSplash({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'video' | 'black' | 'fadein' | 'done'>('video');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeToBlack, setFadeToBlack] = useState(false);
  const playStarted = useRef(false);

  // Check sessionStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setPhase('done');
      return;
    }

    // Manually try to play the video after mount (autoPlay is unreliable)
    const v = videoRef.current;
    if (v) {
      v.play().catch(() => {
        // Autoplay blocked — skip intro
        sessionStorage.setItem(STORAGE_KEY, '1');
        setPhase('done');
      });
    }

    // Safety timeout — if video hasn't started playing within 5s, skip
    const timeout = setTimeout(() => {
      if (!playStarted.current) {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setPhase('done');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  const handlePlaying = useCallback(() => {
    playStarted.current = true;
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    playStarted.current = true;
    if (v.duration - v.currentTime <= FADE_START_BEFORE_END && !fadeToBlack) {
      setFadeToBlack(true);
    }
  }, [fadeToBlack]);

  const handleEnded = useCallback(() => {
    setPhase('black');
    sessionStorage.setItem(STORAGE_KEY, '1');
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
        {phase === 'black' && (
          <Image
            src="/logo.png"
            alt="wcgo.pl"
            width={320}
            height={96}
            className="w-48 sm:w-64 h-auto"
            priority
          />
        )}
        {phase === 'video' && (
          <>
            <video
              ref={videoRef}
              src="/intro.mp4"
              autoPlay
              muted
              playsInline
              onPlaying={handlePlaying}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onError={handleError}
              className="max-h-dvh max-w-full object-contain"
            />
            {/* Fade-to-black overlay with logo on top of video */}
            <div
              className="absolute inset-0 bg-black pointer-events-none flex items-center justify-center"
              style={{
                opacity: fadeToBlack ? 1 : 0,
                transition: `opacity ${FADE_START_BEFORE_END}s ease-in`,
              }}
            >
              <Image
                src="/logo.png"
                alt="wcgo.pl"
                width={320}
                height={96}
                className="w-48 sm:w-64 h-auto opacity-0"
                style={{
                  opacity: fadeToBlack ? 1 : 0,
                  transition: `opacity 0.6s ease-in ${FADE_START_BEFORE_END * 0.5}s`,
                }}
                priority
              />
            </div>
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
