// ============================================================
// UTM Gesture Quest V3.0 — Instructions & Difficulty Select
// Stage 3: Clean light card presentation with bilingual support
// ============================================================

import React from 'react';
import { Play, Hand, Target, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { sfx } from '../services/audioEngine';
import { DIFFICULTY_CONFIGS } from '../constants';
import type { DifficultyLevel, ControlMode } from '../types';

interface HowToPlayScreenProps {
  difficulty: DifficultyLevel;
  controlMode: ControlMode;
  onSelectDifficulty: (d: DifficultyLevel) => void;
  onStartGame: () => void;
}

export const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({
  difficulty,
  controlMode,
  onSelectDifficulty,
  onStartGame,
}) => {
  const { t } = useTranslation();
  const cfg = DIFFICULTY_CONFIGS[difficulty];

  const diffDesc = {
    CASUAL: t('diffCasualDesc'),
    CHALLENGE: t('diffChallengeDesc'),
    MASTER: t('diffMasterDesc'),
  }[difficulty];

  return (
    <div className="relative w-full h-full bg-instruction-light overflow-y-auto p-4 sm:p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-4xl mx-auto rounded-3xl bg-white border border-stone-200/90 shadow-exhibition p-5 sm:p-8">
        {/* Header with Difficulty Selection */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900">
              {t('instructionsTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              {t('instructionsSubtitle')}
            </p>
          </div>

          {/* Difficulty Tabs */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
            {(['CASUAL', 'CHALLENGE', 'MASTER'] as DifficultyLevel[]).map((lvl) => {
              const active = difficulty === lvl;
              const label = lvl === 'CASUAL' ? t('diffCasual') : lvl === 'CHALLENGE' ? t('diffChallenge') : t('diffMaster');
              const sub = lvl === 'CASUAL' ? t('diffCasualSub') : lvl === 'CHALLENGE' ? t('diffChallengeSub') : t('diffMasterSub');

              return (
                <button
                  key={lvl}
                  onClick={() => {
                    sfx.playClick();
                    onSelectDifficulty(lvl);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[#7a1636] text-white shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60 font-semibold'
                  }`}
                >
                  <div className="text-xs sm:text-sm leading-tight">{label}</div>
                  <div className={`text-[9.5px] mt-0.5 hidden sm:block ${active ? 'text-amber-200/90' : 'text-stone-400'}`}>
                    {sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Difficulty Summary Banner */}
        <div className="my-5 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-950 font-medium">
            <Target className="w-4 h-4 text-[#7a1636] shrink-0" />
            <span>
              <strong className="text-[#7a1636] font-bold">
                {difficulty === 'CASUAL' ? t('diffCasual') : difficulty === 'CHALLENGE' ? t('diffChallenge') : t('diffMaster')}:
              </strong>{' '}
              {diffDesc}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white border border-amber-300 text-amber-900 font-bold text-[11px] shadow-2xs">
            {cfg.orbCount} {t('orbCount')} · {cfg.glitchCount} Glitch
          </span>
        </div>

        {/* 3 Step Instruction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-[#7a1636]/30 transition-all">
            <div className="w-13 h-13 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-[#7a1636] shadow-2xs mb-3">
              <Hand className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-stone-900">
              <span className="text-[#7a1636] mr-1.5">1.</span>
              {t('step1Title')}
            </div>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              {t('step1Desc')}
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-[#7a1636]/30 transition-all">
            <div className="w-13 h-13 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-amber-600 shadow-2xs mb-3">
              <Target className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-stone-900">
              <span className="text-[#7a1636] mr-1.5">2.</span>
              {t('step2Title')}
            </div>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              {t('step2Desc')}
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-[#7a1636]/30 transition-all">
            <div className="w-13 h-13 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-purple-600 shadow-2xs mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-stone-900">
              <span className="text-[#7a1636] mr-1.5">3.</span>
              {t('step3Title')}
            </div>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              {t('step3Desc')}
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              sfx.playClick();
              onStartGame();
            }}
            className="inline-flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-2xl bg-[#7a1636] text-white font-black text-base shadow-exhibition hover:bg-[#62102b] hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>
              {t('startMission')} ({difficulty === 'CASUAL' ? t('diffCasual') : difficulty === 'CHALLENGE' ? t('diffChallenge') : t('diffMaster')})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
