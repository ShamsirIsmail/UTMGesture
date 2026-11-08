// ============================================================
// UTM Gesture Quest V3.0 — Welcome Screen (Stage 1: Attract Mode)
// Features the 5 official organizer logos (Welcome Screen ONLY)
// ============================================================

import React, { useEffect } from 'react';
import { Play, Trophy, MousePointer, Camera, Cpu, Sparkles, Globe } from 'lucide-react';
import { OrganizerLogos } from '../components/OrganizerLogos';
import { useTranslation } from '../i18n/useTranslation';
import { sfx } from '../services/audioEngine';
import { voice } from '../services/voiceGuidance';
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
  const { t, language, toggleLanguage } = useTranslation();

  useEffect(() => {
    voice.speak('WELCOME', language, 1500);
  }, [language]);

  const handleStart = () => {
    sfx.playClick();
    if (controlMode === 'MOUSE' || (cameraStatus === 'READY' && hasExistingStream)) {
      onMousePreview();
    } else {
      onStartCamera();
    }
  };

  return (
    <div className="relative w-full h-full bg-welcome-light overflow-y-auto flex flex-col justify-between">
      {/* 1. Official Organizer / Strategic Partners Logos Bar (Welcome screen ONLY) */}
      <div className="w-full pt-3 pb-1 border-b border-stone-200/60 bg-white/60 backdrop-blur-xs">
        <OrganizerLogos />
      </div>

      {/* 2. Main Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 text-center max-w-4xl mx-auto w-full">
        {/* Event Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#7a1636]/20 shadow-xs text-xs font-semibold text-[#7a1636] mb-5">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>{t('eventName')}</span>
        </div>

        {/* Game Title */}
        <h1 className="font-serif font-black tracking-tight leading-none text-stone-900 select-none">
          <span className="block text-4xl sm:text-6xl text-[#7a1636] drop-shadow-xs">
            UTM
          </span>
          <span className="block mt-1 text-3xl sm:text-5xl text-stone-900">
            Gesture Quest
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-lg sm:text-xl font-bold text-[#b45309] tracking-wide">
          {t('appSubtitle')}
        </p>

        {/* Concise Description */}
        <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
          {t('welcomeIntro')}
        </p>

        {/* Primary & Secondary Action Buttons */}
        <div className="mt-7 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          {/* Start Game Button (Primary Maroon) */}
          <button
            onClick={handleStart}
            className="group relative inline-flex items-center justify-center gap-3 px-9 py-3.5 rounded-full bg-[#7a1636] text-white font-bold text-base sm:text-lg tracking-wide shadow-exhibition hover:bg-[#63102b] hover:shadow-exhibition-lg hover:scale-102 active:scale-98 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Play className="w-5 h-5 fill-white text-white group-hover:translate-x-0.5 transition-transform" />
            <span>{t('startGame')}</span>
          </button>

          {/* Leaderboard Button (Secondary Gold/Amber) */}
          <button
            onClick={() => {
              sfx.playClick();
              onOpenLeaderboard();
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-sm sm:text-base shadow-xs hover:shadow-sm transition-all cursor-pointer w-full sm:w-auto"
          >
            <Trophy className="w-5 h-5 text-amber-600" />
            <span>{t('leaderboard')}</span>
          </button>

          {/* Mouse Mode Quick Button */}
          <button
            onClick={() => {
              sfx.playClick();
              onMousePreview();
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer w-full sm:w-auto"
          >
            <MousePointer className="w-4 h-4 text-stone-400" />
            <span>{t('quickMouseTest')}</span>
          </button>
        </div>

        {/* Feature Highlights Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-xs text-stone-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-[#7a1636]" />
            <span>{t('feature1')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#7a1636]" />
            <span>{t('feature2')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#7a1636]" />
            <span>{t('feature3')}</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Language Switcher Strip */}
      <div className="w-full py-2.5 px-6 flex items-center justify-center gap-2 border-t border-stone-200/60 bg-white/40 text-xs">
        <span className="text-stone-500 font-medium flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#7a1636]" />
          Pilihan Bahasa:
        </span>
        <button
          onClick={() => {
            sfx.playClick();
            toggleLanguage();
          }}
          className="px-3 py-1 rounded-full bg-white border border-stone-200 font-bold text-[#7a1636] hover:bg-stone-50 shadow-xs transition-colors cursor-pointer"
        >
          {language === 'bm' ? 'Bahasa Melayu (Tukar ke EN)' : 'English (Switch to BM)'}
        </button>
      </div>
    </div>
  );
};
