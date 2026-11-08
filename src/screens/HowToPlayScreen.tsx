// ============================================================
// UTM Gesture Quest V3.4 — Interactive Gesture Tutorial & Difficulty Select
// High-quality realistic isolated hand poses (/asset/tutorial/*.png)
// Section 1: Hand Gestures (Point, Pinch Boost 2×, Open Palm Shield)
// Section 2: Game Flow (3 Steps with real game assets)
// Section 3: Choose Difficulty (Casual default, Challenge, Master AI)
// Optional Live Gesture Practice Modal with real MediaPipe tracking
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Hand,
  Target,
  Zap,
  Shield,
  Move,
  Trophy,
  BarChart3,
  Sparkles,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  ChevronRight,
  Flame,
  Leaf,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { sfx } from '../services/audioEngine';
import { detectHand } from '../services/mediapipe';
import { DIFFICULTY_CONFIGS } from '../constants';
import { getAssetUrl } from '../utils/assets';
import type { DifficultyLevel, ControlMode, LandmarkPoint } from '../types';

interface HowToPlayScreenProps {
  difficulty: DifficultyLevel;
  controlMode: ControlMode;
  onSelectDifficulty: (d: DifficultyLevel) => void;
  onStartGame: () => void;
  streamRef?: React.RefObject<MediaStream | null>;
}

export const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({
  difficulty,
  controlMode,
  onSelectDifficulty,
  onStartGame,
  streamRef,
}) => {
  const { t, language } = useTranslation();
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);

  // Live gesture practice states
  const practiceVideoRef = useRef<HTMLVideoElement>(null);
  const [practiceTracking, setPracticeTracking] = useState(false);
  const [practiceIndexDetected, setPracticeIndexDetected] = useState(false);
  const [practicePinchDetected, setPracticePinchDetected] = useState(false);
  const [practicePalmDetected, setPracticePalmDetected] = useState(false);

  // Set default to CASUAL if not explicitly set
  useEffect(() => {
    if (!difficulty) {
      onSelectDifficulty('CASUAL');
    }
  }, [difficulty, onSelectDifficulty]);

  // Practice Modal RAF loop for real-time webcam gesture testing
  useEffect(() => {
    if (!isPracticeOpen || controlMode !== 'CAMERA' || !streamRef?.current) return;

    let active = true;
    let rafId: number;
    let lastVideoTime = -1;

    const video = practiceVideoRef.current;
    if (video && streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(() => {});
    }

    const loop = (now: number) => {
      if (!active) return;
      if (video && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        try {
          const res = detectHand(video, now);
          if (res.landmarks && res.landmarks.length > 0) {
            setPracticeTracking(true);
            setPracticeIndexDetected(!!res.indexTip);
            setPracticePinchDetected(res.isPinching);
            setPracticePalmDetected(res.isOpenPalm);
          } else {
            setPracticeTracking(false);
            setPracticeIndexDetected(false);
            setPracticePinchDetected(false);
            setPracticePalmDetected(false);
          }
        } catch {
          // ignore
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, [isPracticeOpen, controlMode, streamRef]);

  const activeCfg = DIFFICULTY_CONFIGS[difficulty];
  const activeDiffLabel =
    difficulty === 'CASUAL'
      ? t('diffCasual')
      : difficulty === 'CHALLENGE'
      ? t('diffChallenge')
      : t('diffMaster');

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col bg-instruction-light overflow-hidden">
      {/* 1. Natural Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 lg:p-6 scrollbar-thin">
        <div className="w-full max-w-5xl mx-auto rounded-3xl bg-white border border-stone-200/90 shadow-exhibition overflow-hidden animate-fadeIn mb-6">
          {/* ============================================================ */}
          {/* HEADER BANNER */}
          {/* ============================================================ */}
          <div className="bg-gradient-to-r from-[#7a1636] to-[#590f26] px-5 sm:px-8 py-3.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-xs text-amber-300">
                <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-serif font-black tracking-tight text-white">
                  {t('instructionsTitle')}
                </h1>
                <p className="text-xs text-stone-200 mt-0.5">
                  {t('instructionsSubtitle')}
                </p>
              </div>
            </div>

            {/* Quick Practice Mode Button */}
            <button
              onClick={() => {
                sfx.playClick();
                setIsPracticeOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs transition-colors cursor-pointer self-start sm:self-center"
            >
              <Camera className="w-4 h-4 text-amber-300" />
              <span>{t('tryGestures')}</span>
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* ============================================================ */}
            {/* SECTION 1: HAND GESTURES (CONTROLS) */}
            {/* ============================================================ */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="p-1 rounded-lg bg-[#7a1636]/10 text-[#7a1636]">
                  <Hand className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-stone-900 leading-tight">
                    {t('gestureControls')}
                  </h2>
                  <p className="text-[11px] text-stone-500">{t('gestureSubtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Gesture A: Point to Move */}
                <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-stone-50/80 border border-stone-200 hover:border-[#7a1636]/40 transition-all group">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#7a1636] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1.5 shadow-2xs">
                    <Move className="w-3 h-3 text-amber-300" />
                    <span>{t('gesturePointTitle')}</span>
                  </div>

                  <div className="relative w-full h-24 sm:h-28 flex items-center justify-center my-1">
                    <img
                      src={getAssetUrl('/asset/tutorial/index_point.png')}
                      alt={t('gesturePointTitle')}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-200"
                      loading="eager"
                    />
                    <div className="absolute right-2 top-2 p-1 rounded-lg bg-white/90 border border-stone-200 text-stone-600 shadow-2xs">
                      <Move className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs text-stone-700 font-medium leading-relaxed mt-1">
                    {t('gesturePointDesc')}
                  </p>
                </div>

                {/* Gesture B: Pinch Boost (2x) */}
                <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-stone-50/80 border border-stone-200 hover:border-amber-400/60 transition-all group">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#7a1636] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1.5 shadow-2xs">
                    <Zap className="w-3 h-3 text-[#ffd166]" />
                    <span>{t('gesturePinchTitle')}</span>
                  </div>

                  <div className="relative w-full h-24 sm:h-28 flex items-center justify-center my-1">
                    <img
                      src={getAssetUrl('/asset/tutorial/pinch_boost.png')}
                      alt={t('gesturePinchTitle')}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-200"
                      loading="eager"
                    />
                    <div className="absolute right-2 top-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-[10px] border border-amber-300 shadow-xs">
                      2×
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs text-stone-700 font-medium leading-relaxed mt-1">
                    {t('gesturePinchDesc')}
                  </p>
                </div>

                {/* Gesture C: Open Palm Shield */}
                <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-stone-50/80 border border-stone-200 hover:border-cyan-400/60 transition-all group">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#7a1636] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1.5 shadow-2xs">
                    <Shield className="w-3 h-3 text-cyan-300" />
                    <span>{t('gesturePalmTitle')}</span>
                  </div>

                  <div className="relative w-full h-24 sm:h-28 flex items-center justify-center my-1">
                    <img
                      src={getAssetUrl('/asset/tutorial/open_palm.png')}
                      alt={t('gesturePalmTitle')}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-200"
                      loading="eager"
                    />
                    <div className="absolute right-2 top-2 px-1.5 py-0.5 rounded-full bg-cyan-100 border border-cyan-300 text-cyan-900 font-black text-[9px] shadow-2xs">
                      🛡️ {t('gesturePalmBadge')}
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs text-stone-700 font-medium leading-relaxed mt-1">
                    {t('gesturePalmDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SECTION 2: GAME FLOW (3 STEPS) */}
            {/* ============================================================ */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-stone-900 leading-tight">
                  {t('gameFlowTitle')}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
                {/* Step 1: Energy Orbs */}
                <div className="flex flex-col p-3 rounded-2xl bg-stone-50/80 border border-stone-200/90 relative">
                  <div className="w-full h-18 sm:h-20 rounded-xl bg-stone-900/5 flex items-center justify-center overflow-hidden mb-2 p-1.5">
                    <img
                      src={getAssetUrl('/asset/game/energy_orb_blue.png')}
                      alt=""
                      className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-md animate-pulse"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full bg-[#7a1636] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900">{t('flowStep1Title')}</h3>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {t('flowStep1Desc')}
                  </p>
                </div>

                {/* Step 2: Future Core */}
                <div className="flex flex-col p-3 rounded-2xl bg-stone-50/80 border border-stone-200/90 relative">
                  <div className="w-full h-18 sm:h-20 rounded-xl bg-stone-900/5 flex items-center justify-center overflow-hidden mb-2 p-1.5">
                    <img
                      src={getAssetUrl('/asset/game/future_core.png')}
                      alt=""
                      className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-md"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full bg-[#7a1636] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900">{t('flowStep2Title')}</h3>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {t('flowStep2Desc')}
                  </p>
                </div>

                {/* Step 3: Complete Mission */}
                <div className="flex flex-col p-3 rounded-2xl bg-stone-50/80 border border-stone-200/90 relative">
                  <div className="w-full h-18 sm:h-20 rounded-xl bg-amber-500/5 flex items-center justify-center overflow-hidden mb-2 p-1.5">
                    <img
                      src={getAssetUrl('/asset/medals/gold.png')}
                      alt=""
                      className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-md"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full bg-[#7a1636] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900">{t('flowStep3Title')}</h3>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {t('flowStep3Desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* SECTION 3: CHOOSE DIFFICULTY (COMPACT) */}
            {/* ============================================================ */}
            <div className="pt-2 border-t border-stone-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#7a1636]" />
                  <h2 className="text-xs sm:text-sm font-bold text-stone-900">
                    {t('chooseDifficulty')}
                  </h2>
                </div>
                <span className="text-[11px] text-stone-400 hidden sm:inline">
                  {t('chooseDiffDesc')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Casual Option (Default) */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    onSelectDifficulty('CASUAL');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    difficulty === 'CASUAL'
                      ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                      : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {difficulty === 'CASUAL' && (
                    <div className="absolute top-2.5 right-2.5 text-amber-600">
                      <CheckCircle2 className="w-4 h-4 fill-amber-500 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-stone-900">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('diffCasual')}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5">{t('diffCasualSub')}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-stone-600">
                    <span className="px-1.5 py-0.5 rounded bg-white border border-stone-200">
                      3 {t('energy')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-emerald-700">
                      {t('noHazards')}
                    </span>
                  </div>
                </button>

                {/* Challenge Option */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    onSelectDifficulty('CHALLENGE');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    difficulty === 'CHALLENGE'
                      ? 'bg-sky-50/60 border-sky-400 ring-2 ring-sky-400/20 shadow-xs'
                      : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {difficulty === 'CHALLENGE' && (
                    <div className="absolute top-2.5 right-2.5 text-sky-600">
                      <CheckCircle2 className="w-4 h-4 fill-sky-500 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-stone-900">
                    <Zap className="w-3.5 h-3.5 text-sky-600" />
                    <span>{t('diffChallenge')}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5">{t('diffChallengeSub')}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-stone-600">
                    <span className="px-1.5 py-0.5 rounded bg-white border border-stone-200">
                      5 {t('energy')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-sky-700">
                      {t('withHazards')}
                    </span>
                  </div>
                </button>

                {/* Master AI Option */}
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    onSelectDifficulty('MASTER');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    difficulty === 'MASTER'
                      ? 'bg-[#7a1636]/10 border-[#7a1636] ring-2 ring-[#7a1636]/20 shadow-xs'
                      : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {difficulty === 'MASTER' && (
                    <div className="absolute top-2.5 right-2.5 text-[#7a1636]">
                      <CheckCircle2 className="w-4 h-4 fill-[#7a1636] text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-stone-900">
                    <Flame className="w-3.5 h-3.5 text-[#7a1636]" />
                    <span>{t('diffMaster')}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5">{t('diffMasterSub')}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-stone-600">
                    <span className="px-1.5 py-0.5 rounded bg-white border border-stone-200">
                      6 {t('energy')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-[#7a1636]">
                      {t('evasiveTargets')}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. STICKY BOTTOM ACTION BAR (PINNED ABOVE APPLICATION FOOTER) */}
      {/* ============================================================ */}
      <div className="shrink-0 w-full bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-exhibition-lg px-4 sm:px-8 py-2.5 sm:py-3 z-30">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Selected Difficulty Summary & Quick Level Picker */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium hidden xs:inline">
                {language === 'bm' ? 'Tahap Dipilih:' : 'Selected Level:'}
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 border border-stone-200 font-bold text-xs text-stone-800">
                {difficulty === 'CASUAL' && <Leaf className="w-3.5 h-3.5 text-emerald-600" />}
                {difficulty === 'CHALLENGE' && <Zap className="w-3.5 h-3.5 text-sky-600" />}
                {difficulty === 'MASTER' && <Flame className="w-3.5 h-3.5 text-[#7a1636]" />}
                <span>{activeDiffLabel}</span>
              </div>
            </div>

            {/* Quick Difficulty Pills on the sticky bar */}
            <div className="flex items-center gap-1 sm:border-l sm:border-stone-200 sm:pl-3">
              {(['CASUAL', 'CHALLENGE', 'MASTER'] as DifficultyLevel[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    onSelectDifficulty(d);
                  }}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                    difficulty === d
                      ? 'bg-[#7a1636] text-white shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  {d === 'CASUAL' ? t('diffCasual') : d === 'CHALLENGE' ? t('diffChallenge') : t('diffMaster')}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Start Mission Button */}
          <button
            data-testid="start-game-btn"
            onClick={() => {
              sfx.playClick();
              onStartGame();
            }}
            className="inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-2.5 sm:py-3 rounded-2xl bg-[#7a1636] text-white font-black text-sm sm:text-base shadow-exhibition hover:bg-[#62102b] hover:scale-102 active:scale-98 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            <span>
              {t('startMission')} ({activeDiffLabel})
            </span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* OPTIONAL LIVE GESTURE PRACTICE MODAL */}
      {/* ============================================================ */}
      {isPracticeOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-exhibition p-5 sm:p-6 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#7a1636]" />
                <h3 className="font-serif font-black text-lg text-stone-900">
                  {t('tryGestures')}
                </h3>
              </div>
              <button
                onClick={() => setIsPracticeOpen(false)}
                aria-label="Close Practice Modal"
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 mt-2">{t('tryGesturesDesc')}</p>

            {/* Webcam Live Feed */}
            <div className="relative w-full h-56 rounded-2xl bg-stone-900 overflow-hidden my-4 border border-stone-200 flex items-center justify-center">
              <video
                ref={practiceVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              {!practiceTracking && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/70 text-white p-4 text-center">
                  <Hand className="w-10 h-10 text-stone-300 animate-bounce mb-2" />
                  <span className="text-xs font-bold">{t('raiseHand')}</span>
                </div>
              )}
            </div>

            {/* 3 Real-time Gesture Detection Feedback Badges */}
            <div className="grid grid-cols-3 gap-2">
              <div
                className={`p-2.5 rounded-xl border text-center transition-colors ${
                  practiceIndexDetected
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-stone-50 border-stone-200 text-stone-400'
                }`}
              >
                <div className="text-[11px] font-bold">{t('practiceIndex')}</div>
                <div className="text-[10px] font-mono mt-0.5">
                  {practiceIndexDetected ? `✓ ${t('detected')}` : t('notDetected')}
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border text-center transition-colors ${
                  practicePinchDetected
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-stone-50 border-stone-200 text-stone-400'
                }`}
              >
                <div className="text-[11px] font-bold">{t('practicePinch')}</div>
                <div className="text-[10px] font-mono mt-0.5">
                  {practicePinchDetected ? `✓ ${t('detected')}` : t('notDetected')}
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border text-center transition-colors ${
                  practicePalmDetected
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                    : 'bg-stone-50 border-stone-200 text-stone-400'
                }`}
              >
                <div className="text-[11px] font-bold">{t('practicePalm')}</div>
                <div className="text-[10px] font-mono mt-0.5">
                  {practicePalmDetected ? `✓ ${t('detected')}` : t('notDetected')}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsPracticeOpen(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
