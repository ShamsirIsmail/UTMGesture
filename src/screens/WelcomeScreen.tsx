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
    <div className="relative w-full h-full bg-welcome-light overflow-y-auto flex flex-col justify-between select-none">
      {/* 1. Official 5 Borderless Organizer Logos (Welcome Screen ONLY) */}
      <div className="w-full pt-4 pb-2 z-10">
        <OrganizerLogos />
      </div>

      {/* 2. Main Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-4 text-center max-w-4xl mx-auto w-full z-10">
        {/* Event Name & Date Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/85 border border-[#7a1636]/20 shadow-2xs text-xs font-semibold text-[#7a1636] mb-4 backdrop-blur-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>{t('eventName')}</span>
        </div>

        {/* Large Prominent Game Title */}
        <h1 className="font-sans tracking-tight leading-none text-stone-900 select-none mb-2">
          <span className="inline-block text-4xl sm:text-6xl lg:text-7xl font-black text-[#7a1636] drop-shadow-2xs mr-2 sm:mr-3">
            UTM
          </span>
          <span className="inline-block text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900">
            Gesture Quest
          </span>
        </h1>

        {/* Concise University Tagline */}
        <p className="text-base sm:text-xl font-bold text-[#b45309] tracking-wide mt-1">
          {t('appSubtitle')}
        </p>

        {/* Short Community-Friendly Description */}
        <p className="mt-2.5 text-xs sm:text-sm text-stone-700 font-medium max-w-xl mx-auto leading-relaxed">
          {t('welcomeIntro')}
        </p>

        {/* Solid Professional Action Buttons */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {/* Start Game Button (Solid UTM Maroon) */}
          <button
            onClick={handleStart}
            className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 rounded-2xl bg-[#7a1636] text-white font-bold text-base sm:text-lg tracking-wide shadow-exhibition hover:bg-[#62102b] hover:shadow-exhibition-lg hover:scale-102 active:scale-98 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Play className="w-5 h-5 fill-white text-white group-hover:translate-x-0.5 transition-transform" />
            <span>{t('startGame')}</span>
          </button>

          {/* Leaderboard Button (Solid Secondary Card) */}
          <button
            onClick={() => {
              sfx.playClick();
              onOpenLeaderboard();
            }}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-white/95 hover:bg-stone-50 border border-[#7a1636]/35 text-[#7a1636] font-bold text-sm sm:text-base shadow-2xs hover:shadow-xs transition-all cursor-pointer w-full sm:w-auto"
          >
            <Trophy className="w-5 h-5 text-amber-600" />
            <span>{t('leaderboard')}</span>
          </button>
        </div>

        {/* Discreet Mouse Practice Mode Option */}
        <div className="mt-3.5">
          <button
            onClick={() => {
              sfx.playClick();
              onMousePreview();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-stone-600 hover:text-[#7a1636] hover:bg-white/60 font-semibold text-xs transition-colors cursor-pointer"
          >
            <MousePointer className="w-3.5 h-3.5 text-stone-400" />
            <span>{t('quickMouseTest')}</span>
          </button>
        </div>
      </div>

      {/* 3. Subtle University Exhibition Footer */}
      <div className="w-full py-2 px-6 flex items-center justify-center border-t border-stone-200/50 bg-white/30 backdrop-blur-2xs text-[11px] text-stone-500 font-medium z-10">
        <span>Universiti Teknologi Malaysia • Fakulti Komputeran • CCIN • 2026</span>
      </div>
    </div>
  );
};
