// ============================================================
// UTM Gesture Quest V3.0 — Header Bar (Light Exhibition Theme)
// Note: 5 organizer logos appear ONLY on Welcome Screen
// ============================================================

import React from 'react';
import {
  Camera,
  MousePointer,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Trophy,
  Globe,
} from 'lucide-react';
import { UtmBrandBadge } from './UtmBrandBadge';
import { useTranslation } from '../i18n/useTranslation';
import { sfx } from '../services/audioEngine';
import { DIFFICULTY_CONFIGS } from '../constants';
import type { DifficultyLevel, ControlMode, ScreenState } from '../types';

interface HeaderProps {
  screen: ScreenState;
  difficulty: DifficultyLevel;
  controlMode: ControlMode;
  soundEnabled: boolean;
  isFullscreen: boolean;
  onSelectDifficulty: (d: DifficultyLevel) => void;
  onSwitchToCamera: () => void;
  onSwitchToMouse: () => void;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onGoHome: () => void;
  onOpenLeaderboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  screen,
  difficulty,
  controlMode,
  soundEnabled,
  isFullscreen,
  onSelectDifficulty,
  onSwitchToCamera,
  onSwitchToMouse,
  onToggleSound,
  onToggleFullscreen,
  onGoHome,
  onOpenLeaderboard,
}) => {
  const { t, language, toggleLanguage } = useTranslation();

  return (
    <header className="relative z-30 w-full px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 bg-white/90 backdrop-blur-md shadow-xs">
      {/* Left: UTM Brand Emblem + Home Link */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          className="hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
          title={t('home')}
        >
          <UtmBrandBadge size="sm" />
        </button>

        {/* Leaderboard quick shortcut */}
        {screen !== 'LEADERBOARD' && (
          <button
            onClick={() => {
              sfx.playClick();
              onOpenLeaderboard();
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('leaderboard')}</span>
          </button>
        )}
      </div>

      {/* Center: Difficulty Tier Pills */}
      {screen !== 'WELCOME' && screen !== 'LEADERBOARD' && (
        <div className="flex items-center rounded-full bg-stone-100 p-0.5 border border-stone-200/80 text-xs">
          {(['CASUAL', 'CHALLENGE', 'MASTER'] as DifficultyLevel[]).map((lvl, i) => {
            const c = DIFFICULTY_CONFIGS[lvl];
            const active = difficulty === lvl;
            const labelKey = lvl === 'CASUAL' ? 'diffCasual' : lvl === 'CHALLENGE' ? 'diffChallenge' : 'diffMaster';

            return (
              <button
                key={lvl}
                onClick={() => {
                  sfx.playClick();
                  onSelectDifficulty(lvl);
                }}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#7a1636] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title={`Shortcut: ${i + 1}`}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      )}

      {/* Right: Language Switcher, Mode, Sound & Fullscreen */}
      <div className="flex items-center gap-2">
        {/* Bilingual Language Switcher Pill */}
        <button
          onClick={() => {
            sfx.playClick();
            toggleLanguage();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
          title="Tukar Bahasa / Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#7a1636]" />
          <span className={language === 'bm' ? 'text-[#7a1636] font-black' : 'text-stone-400'}>BM</span>
          <span className="text-stone-300">|</span>
          <span className={language === 'en' ? 'text-[#7a1636] font-black' : 'text-stone-400'}>EN</span>
        </button>

        {/* Mode switcher (Camera vs Mouse) */}
        <div className="flex items-center rounded-full bg-stone-100 border border-stone-200 p-0.5 text-xs">
          <button
            onClick={() => {
              sfx.playClick();
              onSwitchToCamera();
            }}
            title={t('aiCamera')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
              controlMode === 'CAMERA'
                ? 'bg-[#7a1636] text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Camera className="w-3 h-3 text-emerald-300" />
            <span className="hidden sm:inline">{t('aiCamera')}</span>
          </button>
          <button
            onClick={() => {
              sfx.playClick();
              onSwitchToMouse();
            }}
            title={t('mousePreview')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
              controlMode === 'MOUSE'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <MousePointer className="w-3 h-3" />
            <span className="hidden sm:inline">{t('mousePreview')}</span>
          </button>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => {
            sfx.playClick();
            onToggleSound();
          }}
          title={soundEnabled ? t('soundOff') : t('soundOn')}
          className={`p-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-amber-100/70 border-amber-300 text-amber-800'
              : 'bg-stone-100 border-stone-200 text-stone-400 hover:text-stone-700'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-[#7a1636]" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          title={t('fullscreen')}
          className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
