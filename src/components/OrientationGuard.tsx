// ============================================================
// UTM Gesture Quest V3.8 — Mobile & Tablet Landscape Orientation Guard
// Enforces Landscape-only gameplay on smartphones and tablets.
// Suspends gameplay interactions and guards against timing exploits.
// ============================================================

import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, AlertCircle, Play, Globe } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { UtmBrandBadge } from './UtmBrandBadge';
import { sfx } from '../services/audioEngine';

interface OrientationGuardProps {
  isGameplay: boolean;
  onRestartGameplay: () => void;
  onResumePractice: () => void;
  isPracticeRun: boolean;
}

export const OrientationGuard: React.FC<OrientationGuardProps> = ({
  isGameplay,
  onRestartGameplay,
  onResumePractice,
  isPracticeRun,
}) => {
  const { t, language, toggleLanguage } = useTranslation();
  const [isPortrait, setIsPortrait] = useState(false);
  const [wasSuspendedDuringGameplay, setWasSuspendedDuringGameplay] = useState(false);
  const [showResumptionDialog, setShowResumptionDialog] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortraitAspect = height > width;

      if (!isPortraitAspect) {
        // Landscape orientation: allow through
        setIsPortrait(false);
        if (wasSuspendedDuringGameplay) {
          setShowResumptionDialog(true);
        }
        return;
      }

      // We are in portrait aspect (height > width)
      // Check device characteristics:
      const hasTouch =
        typeof window !== 'undefined' &&
        ('ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          window.matchMedia('(pointer: coarse)').matches);

      const isMobileOrTabletUA =
        typeof navigator !== 'undefined' &&
        (/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

      // Pure desktop browser with fine mouse pointer and no touch capability
      const isPureDesktopMouse =
        typeof window !== 'undefined' &&
        window.matchMedia('(pointer: fine)').matches &&
        !hasTouch &&
        !isMobileOrTabletUA;

      // Block portrait on phones and tablets of any size (including large tablets > 1024px width in portrait),
      // while preventing false positive blocks on desktop PC browser resizing with a mouse.
      const shouldBlock = isPortraitAspect && !isPureDesktopMouse && (hasTouch || isMobileOrTabletUA);

      setIsPortrait(shouldBlock);

      // If rotating into portrait during active gameplay, suspend and flag
      if (shouldBlock && isGameplay) {
        setWasSuspendedDuringGameplay(true);
      }
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isGameplay, wasSuspendedDuringGameplay]);

  // Clean up dialog if game finishes or leaves gameplay
  useEffect(() => {
    if (!isGameplay) {
      setWasSuspendedDuringGameplay(false);
      setShowResumptionDialog(false);
    }
  }, [isGameplay]);

  return (
    <>
      {/* ============================================================ */}
      {/* 1. FULLSCREEN PORTRAIT BLOCKING OVERLAY */}
      {/* ============================================================ */}
      {isPortrait && (
        <div
          data-testid="orientation-guard-overlay"
          className="fixed inset-0 z-[100] bg-[#faf9f6] flex flex-col items-center justify-between p-6 text-center select-none animate-fadeIn overflow-hidden"
          style={{ height: '100dvh' }}
        >
          {/* Top Bar with Brand Emblem & Language Toggle */}
          <div className="w-full flex items-center justify-between">
            <UtmBrandBadge size="sm" />
            <button
              onClick={() => {
                sfx.playClick();
                toggleLanguage();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700 text-xs font-bold shadow-2xs hover:bg-stone-50 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#7a1636]" />
              <span>{language === 'bm' ? 'EN' : 'BM'}</span>
            </button>
          </div>

          {/* Central Rotating Phone Illustration */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto my-auto py-4">
            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
              {/* Subtle Warm Amber Glow Behind Device */}
              <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />

              {/* Animated Phone SVG */}
              <div className="relative animate-rotatePhone">
                <svg
                  width="84"
                  height="120"
                  viewBox="0 0 84 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-md"
                >
                  {/* Phone Body */}
                  <rect
                    x="2"
                    y="2"
                    width="80"
                    height="116"
                    rx="16"
                    fill="white"
                    stroke="#7a1636"
                    strokeWidth="3.5"
                  />
                  {/* Inner Screen */}
                  <rect
                    x="8"
                    y="12"
                    width="68"
                    height="96"
                    rx="10"
                    fill="#f4f6f9"
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                  />
                  {/* Speaker Notch */}
                  <line
                    x1="34"
                    y1="7"
                    x2="50"
                    y2="7"
                    stroke="#a8a29e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Home Indicator */}
                  <line
                    x1="32"
                    y1="113"
                    x2="52"
                    y2="113"
                    stroke="#a8a29e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Screen Content Graphic (Mini Gesture Orb) */}
                  <circle cx="42" cy="60" r="14" fill="#7a1636" fillOpacity="0.15" />
                  <circle cx="42" cy="60" r="8" fill="#7a1636" />
                </svg>
              </div>

              {/* Circular Rotation Direction Arrow */}
              <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#7a1636] text-amber-300 shadow-xs border-2 border-white">
                <RotateCw className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>

            {/* Bilingual Orientation Instructions */}
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                📱 {t('mobileLandscapeOnly')}
              </span>

              <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-tight">
                {t('rotateDeviceTitle')}
              </h2>

              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed max-w-xs mx-auto">
                {t('rotateDeviceSubtitle')}
              </p>

              {/* In-Game Pause Notification */}
              {isGameplay && (
                <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-900 text-xs font-semibold flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t('gameSuspendedNotice')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Exhibition Info */}
          <div className="w-full text-[11px] text-stone-400 font-medium">
            Universiti Teknologi Malaysia • Ziarah Kasih &amp; Cakna Komuniti 2026
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MID-GAME ROTATION RESUMPTION / FAIRNESS GUARD MODAL */}
      {/* ============================================================ */}
      {showResumptionDialog && !isPortrait && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-exhibition p-6 text-center animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="font-serif font-black text-lg text-stone-900 mb-1">
              {t('gameSuspendedTitle')}
            </h3>

            <p className="text-xs text-stone-600 mb-5 leading-relaxed">
              {t('rotationUnrankedNotice')}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              {/* Option 1: Restart Ranked Round */}
              <button
                onClick={() => {
                  sfx.playClick();
                  setShowResumptionDialog(false);
                  setWasSuspendedDuringGameplay(false);
                  onRestartGameplay();
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7a1636] text-white text-xs font-bold shadow-xs hover:bg-[#62102b] cursor-pointer transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{t('restartRankedRound')}</span>
              </button>

              {/* Option 2: Resume Practice Round */}
              <button
                onClick={() => {
                  sfx.playClick();
                  setShowResumptionDialog(false);
                  setWasSuspendedDuringGameplay(false);
                  onResumePractice();
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold border border-stone-200 cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{t('resumePracticeRound')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

