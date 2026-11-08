// ============================================================
// UTM Gesture Quest V3.3 — Welcome Screen (Stage 1: Attract Mode)
// Professional University Branding, Prominent Typography, Solid Buttons
// ============================================================

import React from 'react';
import { Play, Trophy, MousePointer, Sparkles } from 'lucide-react';
import { OrganizerLogos } from '../components/OrganizerLogos';
import { useTranslation } from '../i18n/useTranslation';
import { sfx } from '../services/audioEngine';
import type { ControlMode, CameraStatus } from '../types';

interface WelcomeScreenProps {
  controlMode: ControlMode;
  cameraStatus: CameraStatus;
  hasExistingStream: boolean;
  onStartCamera: () => void;
  onMousePreview: () => void;
  onOpenLeaderboard: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  controlMode,
  cameraStatus,
  hasExistingStream,
  onStartCamera,
  onMousePreview,
  onOpenLeaderboard,
}) => {
  const { t } = useTranslation();

  const handleStart = () => {
    sfx.playClick();
    if (controlMode === 'MOUSE' || (cameraStatus === 'READY' && hasExistingStream)) {
      onMousePreview();
    } else {
      onStartCamera();
    }
  };

  return (
    <div className="relative w-full h-full bg-welcome-light overflow-y-auto flex flex-col justify-between select-none safe-area-px">
      {/* 1. Official 5 Borderless Organizer Logos (Welcome Screen ONLY) */}
      <div className="w-full pt-1.5 sm:pt-4 pb-0.5 sm:pb-2 z-10 shrink-0">
        <OrganizerLogos />
      </div>

      {/* 2. Main Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-6 py-1 sm:py-4 text-center max-w-4xl mx-auto w-full z-10">
        {/* Event Name & Date Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-white/85 border border-[#7a1636]/20 shadow-2xs text-[10px] sm:text-xs font-semibold text-[#7a1636] mb-1.5 sm:mb-3 backdrop-blur-2xs">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#d4af37]" />
          <span>{t('eventName')}</span>
        </div>

        {/* Large Prominent Game Title */}
        <h1 className="font-sans tracking-tight leading-none text-stone-900 select-none mb-1 sm:mb-2">
          <span className="inline-block text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#7a1636] drop-shadow-2xs mr-1.5 sm:mr-3">
            UTM
          </span>
          <span className="inline-block text-xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-stone-900">
            Gesture Quest
          </span>
        </h1>

        {/* Concise University Tagline */}
        <p className="text-xs sm:text-lg md:text-xl font-bold text-[#b45309] tracking-wide mt-0.5 sm:mt-1">
          {t('appSubtitle')}
        </p>

        {/* Short Community-Friendly Description */}
        <p className="mt-1 sm:mt-2.5 text-[11px] sm:text-xs md:text-sm text-stone-700 font-medium max-w-xl mx-auto leading-relaxed line-clamp-2 sm:line-clamp-none">
          {t('welcomeIntro')}
        </p>

        {/* Solid Professional Action Buttons */}
        <div className="mt-2.5 sm:mt-6 flex flex-row items-center justify-center gap-2.5 sm:gap-3 w-auto">
          {/* Start Game Button (Solid UTM Maroon) */}
          <button
            onClick={handleStart}
            className="group relative inline-flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-9 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#7a1636] text-white font-bold text-xs sm:text-base md:text-lg tracking-wide shadow-exhibition hover:bg-[#62102b] hover:shadow-exhibition-lg hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-white text-white group-hover:translate-x-0.5 transition-transform" />
            <span>{t('startGame')}</span>
          </button>

          {/* Leaderboard Button (Solid Secondary Card) */}
          <button
            onClick={() => {
              sfx.playClick();
              onOpenLeaderboard();
            }}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2.5 px-4 sm:px-7 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/95 hover:bg-stone-50 border border-[#7a1636]/35 text-[#7a1636] font-bold text-xs sm:text-sm md:text-base shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-600" />
            <span>{t('leaderboard')}</span>
          </button>
        </div>

        {/* Discreet Mouse Practice Mode Option */}
        <div className="mt-1.5 sm:mt-3">
          <button
            onClick={() => {
              sfx.playClick();
              onMousePreview();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-stone-600 hover:text-[#7a1636] hover:bg-white/60 font-semibold text-[10px] sm:text-xs transition-colors cursor-pointer"
          >
            <MousePointer className="w-3 h-3 text-stone-400" />
            <span>{t('quickMouseTest')}</span>
          </button>
        </div>
      </div>

      {/* 3. Subtle University Exhibition Footer */}
      <div className="w-full py-1 sm:py-2 px-4 sm:px-6 flex items-center justify-center border-t border-stone-200/50 bg-white/30 backdrop-blur-2xs text-[10px] sm:text-[11px] text-stone-500 font-medium z-10 shrink-0">
        <span>Universiti Teknologi Malaysia • Fakulti Komputeran • CCIN • 2026</span>
      </div>
    </div>
  );
};
