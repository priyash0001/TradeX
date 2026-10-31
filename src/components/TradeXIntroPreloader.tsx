'use client';

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/ui/snow-ball-loading-spinner';

type IntroStage = 'playing' | 'zooming' | 'holding' | 'fading' | 'done';

export default function TradeXIntroPreloader() {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<IntroStage>('playing');

  useEffect(() => {
    setMounted(true);
    // Check if user has already seen the intro during this browser session
    const hasSeenIntro = sessionStorage.getItem('tradex_intro_seen');
    if (hasSeenIntro) {
      setStage('done');
      return;
    }

    // Step 1: Play Snow Ball animation (0ms - 2200ms)
    const timer1 = setTimeout(() => {
      setStage('zooming'); // Snowball zooms inward/expands & TradeX reveals
    }, 2200);

    // Step 2: Hold TradeX branding prominently in the center (2800ms - 3600ms)
    const timer2 = setTimeout(() => {
      setStage('holding');
    }, 2800);

    // Step 3: Smoothly fade and zoom intro away into the app (3600ms)
    const timer3 = setTimeout(() => {
      setStage('fading');
    }, 3600);

    // Step 4: Complete transition and unmount (4300ms)
    const timer4 = setTimeout(() => {
      setStage('done');
      sessionStorage.setItem('tradex_intro_seen', 'true');
    }, 4300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  if (!mounted || stage === 'done') {
    return null;
  }

  const isZoomingOrBeyond = stage === 'zooming' || stage === 'holding' || stage === 'fading';
  const isFading = stage === 'fading';

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 transition-all duration-700 ease-out select-none overflow-hidden ${
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="TradeX Cinematic Intro"
    >
      {/* Ambient background glow that expands during the reveal */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out ${
          isZoomingOrBeyond
            ? 'w-[700px] h-[700px] bg-sky-500/25 scale-125'
            : 'w-96 h-96 bg-sky-500/15 scale-100'
        }`}
      />

      {/* Center Stage Container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-lg">
        {/* Layer 1: Exact Snow Ball Spinner with smooth zoom-in transition */}
        <div
          className={`transition-all duration-700 ease-in-out transform origin-center ${
            isZoomingOrBeyond
              ? 'scale-[2.4] opacity-0 blur-sm pointer-events-none -translate-y-4'
              : 'scale-75 sm:scale-90 opacity-100 blur-0 translate-y-0'
          }`}
        >
          <LoadingSpinner />
        </div>

        {/* Layer 2: Prominent "TradeX" Reveal with cinematic scale/fade */}
        <div
          className={`transition-all duration-700 ease-out transform ${
            isZoomingOrBeyond
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-75 translate-y-6 pointer-events-none'
          }`}
        >
          {/* Logo Badge */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-sky-400 via-sky-500 to-sky-700 flex items-center justify-center text-white font-black text-3xl sm:text-4xl shadow-2xl shadow-sky-500/50 ring-4 ring-sky-400/20 animate-pulse">
              T
            </div>
          </div>

          {/* Prominent TradeX Wordmark */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-lg">
            Trade<span className="text-sky-400">X</span>
          </h1>

          {/* Tagline */}
          <p className="text-xs sm:text-sm font-semibold text-sky-200/90 tracking-widest uppercase mt-3 drop-shadow">
            B2B Industrial Marketplace &amp; Sourcing Engine
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-400 font-medium">
            <span>Verified Manufacturers</span>
            <span>•</span>
            <span>Instant RFQs</span>
            <span>•</span>
            <span>Local Supply Chain</span>
          </div>
        </div>
      </div>
    </div>
  );
}
