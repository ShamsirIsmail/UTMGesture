// ============================================================
// UTM Gesture Quest V3.5 — Cinematic Completion & Next Level Progression
// Phase 1: Cinematic Celebration Sequence (Trophy, Confetti, Fanfare, Skip option)
// Phase 2: Refined Result Presentation (Prominent Final Time centerpiece, Grade, Stats)
// Phase 3: Next Level Progression (Casual -> Challenge -> Master AI -> Play Again)
// Unsaved Score Guard Dialog & Sleek Level Unlock Transition
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Trophy,
  Home,
  Check,
  Camera,
  Sparkles,
  Zap,
  Send,
  ArrowRight,
  Flame,
  Leaf,
  ChevronRight,
  X,
  FastForward,
} from 'lucide-react';
import { PhotoCaptureModal } from '../components/PhotoCaptureModal';
import { Avatar } from '../components/Avatar';
import { Medal } from '../components/Medal';
import { useTranslation } from '../i18n/useTranslation';
import { addLeaderboardEntry, getLeaderboard } from '../services/leaderboardDb';
import { sfx } from '../services/audioEngine';
import { voice } from '../services/voiceGuidance';
import { DIFFICULTY_CONFIGS } from '../constants';
import type { DifficultyLevel, ControlMode } from '../types';

interface CompleteScreenProps {
  difficulty: DifficultyLevel;
  elapsedSeconds: number;
  glitchHits: number;
  maxCombo: number;
  controlMode: ControlMode;
  onPlayAgain: () => void;
  onStartNextLevel: (nextDifficulty: DifficultyLevel) => void;
  onHome: () => void;
  onOpenLeaderboard: () => void;
  streamRef?: React.RefObject<MediaStream | null>;
}

export const CompleteScreen: React.FC<CompleteScreenProps> = ({
  difficulty,
  elapsedSeconds,
  glitchHits,
  maxCombo,
  controlMode,
  onPlayAgain,
  onStartNextLevel,
  onHome,
  onOpenLeaderboard,
  streamRef,
}) => {
  console.log('[CompleteScreen] Mounted with difficulty:', difficulty);
  const { t, language } = useTranslation();
  const cfg = DIFFICULTY_CONFIGS[difficulty];

  // Determine Next Level progression
  const nextDifficulty: DifficultyLevel =
    difficulty === 'CASUAL'
      ? 'CHALLENGE'
      : difficulty === 'CHALLENGE'
      ? 'MASTER'
      : 'MASTER';

  const isHighestDifficulty = difficulty === 'MASTER';

  // Cinematic Celebration State
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [animationPhase, setAnimationPhase] = useState<'CELEBRATING' | 'REVEALED'>(
    prefersReducedMotion ? 'REVEALED' : 'CELEBRATING'
  );

  // Submission & Navigation States
  const [nickname, setNickname] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [selectedAvatarId, setSelectedAvatarId] = useState(1);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [assignedRank, setAssignedRank] = useState<number | null>(null);
  const [isSkipped, setIsSkipped] = useState(false);

  // V3.5 Progression Modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTransitioningLevel, setIsTransitioningLevel] = useState(false);

  // Skip Celebration Sequence
  const skipCelebration = useCallback(() => {
    setAnimationPhase('REVEALED');
  }, []);

  // Phase 1: Celebration Timer & Audio Trigger
  useEffect(() => {
    if (animationPhase === 'CELEBRATING') {
      sfx.playVictoryFanfare();
      voice.speakCompletion(language);

      const timer = setTimeout(() => {
        setAnimationPhase('REVEALED');
      }, 1400);

      // Keyboard skip listener (Space, Enter, Esc)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
          skipCelebration();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [animationPhase, language, skipCelebration]);

  // Performance Grade Calculation
  const getRankInfo = () => {
    if (glitchHits === 0 && elapsedSeconds <= cfg.orbCount * 4.5) {
      return { grade: 'S', title: t('rankS'), color: 'text-amber-500 bg-amber-50 border-amber-300' };
    }
    if (glitchHits <= 2 && elapsedSeconds <= cfg.orbCount * 7.0) {
      return { grade: 'A', title: t('rankA'), color: 'text-sky-600 bg-sky-50 border-sky-300' };
    }
    return { grade: 'B', title: t('rankB'), color: 'text-stone-700 bg-stone-100 border-stone-300' };
  };

  const rankInfo = getRankInfo();

  // Submit to IndexedDB
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitted || isSubmitting) return;

    setIsSubmitting(true);
    sfx.playClick();
    try {
      const entry = await addLeaderboardEntry({
        nickname: nickname.trim() || (language === 'bm' ? 'Peserta UTM' : 'UTM Visitor'),
        photo: photoDataUrl,
        avatarId: selectedAvatarId,
        difficulty,
        timeSeconds: parseFloat(elapsedSeconds.toFixed(1)),
        controlMode,
      });

      const currentBoard = await getLeaderboard(difficulty, 100);
      const userIndex = currentBoard.findIndex((b) => b.id === entry.id);
      const userRank = userIndex !== -1 ? userIndex + 1 : 1;
      setAssignedRank(userRank);
      setIsSubmitted(true);
      voice.speakLeaderboard(language);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Level Transition
  const transitionTimerRef = useRef<number | null>(null);

  const triggerLevelTransition = useCallback(
    (targetDiff: DifficultyLevel) => {
      console.log('[CompleteScreen] triggerLevelTransition called with:', targetDiff);
      sfx.playClick();
      setIsConfirmModalOpen(false);
      setIsTransitioningLevel(true);
      voice.speakLevelUnlocked(targetDiff, language);

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      transitionTimerRef.current = window.setTimeout(() => {
        console.log('[CompleteScreen] Auto-timer calling onStartNextLevel with:', targetDiff);
        onStartNextLevel(targetDiff);
      }, 1200);
    },
    [language, onStartNextLevel]
  );

  const handleStartNow = useCallback(() => {
    console.log('[CompleteScreen] handleStartNow called with:', nextDifficulty);
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    onStartNextLevel(nextDifficulty);
  }, [nextDifficulty, onStartNextLevel]);

  // Handle Next Level Button Click
  const handleNextLevelClick = () => {
    if (isHighestDifficulty) {
      // If Master AI is already completed, primary action is to Play Again
      sfx.playClick();
      onPlayAgain();
      return;
    }

    // Check if score is unsaved
    if (!isSubmitted && !isSkipped) {
      setIsConfirmModalOpen(true);
    } else {
      triggerLevelTransition(nextDifficulty);
    }
  };

  const difficultyLabel =
    difficulty === 'CASUAL'
      ? t('diffCasual')
      : difficulty === 'CHALLENGE'
      ? t('diffChallenge')
      : t('diffMaster');

  // Next difficulty text
  const nextDifficultyLabel =
    nextDifficulty === 'CHALLENGE'
      ? t('diffChallenge')
      : t('diffMaster');

  return (
    <div className="relative w-full h-full min-h-0 bg-complete-light overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
      {/* ============================================================ */}
      {/* PHASE 1: CINEMATIC CELEBRATION SEQUENCE */}
      {/* ============================================================ */}
      {animationPhase === 'CELEBRATING' ? (
        <div
          onClick={skipCelebration}
          className="w-full max-w-xl mx-auto rounded-3xl bg-white/95 backdrop-blur-md border border-amber-200/90 shadow-exhibition-lg p-8 sm:p-12 text-center animate-scaleUp relative overflow-hidden cursor-pointer my-auto"
        >
          {/* Subtle Warm Radial Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-100/40 via-rose-50/20 to-transparent pointer-events-none" />

          {/* Floating Gold Confetti / Sparkle Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-amber-400 animate-floatParticle"
                style={{
                  left: `${8 + (i * 8)}%`,
                  bottom: `${10 + (i % 4) * 8}%`,
                  animationDelay: `${(i * 0.12).toFixed(2)}s`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>

          {/* Celebration Achievement Emblem */}
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute inset-0 rounded-full bg-amber-400/20 filter blur-xl animate-pulse" />
            <div className="relative p-5 sm:p-6 rounded-full bg-gradient-to-tr from-[#7a1636] to-[#a32249] text-amber-300 shadow-exhibition border-2 border-amber-300/40">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 fill-amber-300" />
            </div>
          </div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#7a1636] text-white font-black text-xs uppercase tracking-widest shadow-2xs">
              🌿 {t('missionComplete')} 🌿
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-black text-stone-900 mt-2">
              {t('celebrationSubtitle')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-medium">
              {t('futureStarts')}
            </p>
          </div>

          {/* Skip Option Pill */}
          <div className="relative z-10 mt-8">
            <button
              onClick={(e) => {
                e.stopPropagation();
                skipCelebration();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>{t('skipCelebration')}</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* PHASE 2: RESULT PRESENTATION */
        /* ============================================================ */
        <div className="w-full max-w-3xl mx-auto rounded-3xl bg-white/95 backdrop-blur-xs border border-stone-200/90 shadow-exhibition p-5 sm:p-8 text-center animate-fadeIn my-auto relative">
          {/* 1. TOP CELEBRATORY BANNER (LAUREL RIBBON STYLE) */}
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
            <span className="text-amber-500 text-base sm:text-lg select-none">🌿</span>
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#7a1636] text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xs">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-300 text-amber-300" />
              <span>{t('missionComplete')}</span>
            </div>
            <span className="text-amber-500 text-base sm:text-lg select-none transform -scale-x-100">🌿</span>
          </div>

          {/* 2. Main Title & Encouraging Subtitle */}
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-900 mt-1">
            {t('futureStarts')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">
            {t('missionCompleteSubtitle')}
          </p>

          {/* ============================================================ */}
          {/* 3. PERFORMANCE STATISTICS CARD (VISUAL FOCUS: FINAL TIME) */}
          {/* ============================================================ */}
          <div className="my-4 sm:my-5 p-3.5 sm:p-5 rounded-2xl bg-stone-50/90 border border-stone-200/90 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
              {/* Metric 1: Performance Grade */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-1">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 flex items-center justify-center font-black text-xl sm:text-2xl shadow-xs shrink-0 ${rankInfo.color}`}
                >
                  {rankInfo.grade}
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-stone-400 leading-tight">
                    {difficultyLabel} {t('performanceGrade')}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-stone-900 truncate max-w-[120px]">
                    {rankInfo.title}
                  </div>
                </div>
              </div>

              {/* Metric 2: Final Time (Large visual centerpiece) */}
              <div className="p-1 sm:pl-4 text-center sm:text-left">
                <div className="text-[10px] uppercase font-bold text-stone-400">
                  {t('yourFinalTime')}
                </div>
                <div className="text-2xl sm:text-4xl font-mono font-black text-[#7a1636]">
                  {elapsedSeconds.toFixed(1)}
                  <span className="text-xs sm:text-sm font-bold ml-0.5 text-stone-600">s</span>
                </div>
              </div>

              {/* Metric 3: Best Combo */}
              <div className="pt-2 sm:pt-0 sm:pl-4 text-center sm:text-left">
                <div className="text-[10px] uppercase font-bold text-stone-400">
                  {t('bestCombo')}
                </div>
                <div className="text-lg sm:text-2xl font-black text-emerald-600 font-mono">
                  {maxCombo}×
                </div>
              </div>

              {/* Metric 4: Hazard Hits */}
              <div className="pt-2 sm:pt-0 sm:pl-4 text-center sm:text-left">
                <div className="text-[10px] uppercase font-bold text-stone-400">
                  {t('hazardHits')}
                </div>
                <div
                  className={`text-lg sm:text-2xl font-black font-mono ${
                    glitchHits === 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {glitchHits}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 4. LEADERBOARD SUBMISSION SECTION */}
          {/* ============================================================ */}
          <div className="mb-4 sm:mb-5 p-3.5 sm:p-5 rounded-2xl bg-white border border-[#7a1636]/25 shadow-xs text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-200/50 via-amber-100/20 to-transparent pointer-events-none rounded-tr-2xl" />

            {!isSubmitted && !isSkipped ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                    <Trophy className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-stone-900 text-xs sm:text-sm">
                      {t('joinLeaderboardPrompt')}
                    </h2>
                    <p className="text-[11px] text-stone-500">{t('joinLeaderboardDesc')}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-center pt-1">
                  {/* Avatar / Photo with live camera button */}
                  <div className="relative group shrink-0">
                    <Avatar
                      photo={photoDataUrl}
                      avatarId={selectedAvatarId}
                      nickname={nickname || 'U'}
                      size="lg"
                    />
                    {streamRef?.current && (
                      <button
                        type="button"
                        onClick={() => setIsPhotoModalOpen(true)}
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#7a1636] text-white shadow-xs hover:bg-[#62102b] transition-colors cursor-pointer"
                        title={t('takeLivePhoto')}
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Nickname Input Field */}
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      {t('enterNickname')}
                    </label>
                    <input
                      type="text"
                      maxLength={18}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={t('nicknamePlaceholder')}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm focus:outline-none focus:border-[#7a1636] focus:ring-2 focus:ring-[#7a1636]/20 bg-stone-50/50"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7a1636] text-white font-bold text-xs sm:text-sm shadow-xs hover:bg-[#62102b] disabled:opacity-50 transition-all cursor-pointer self-end"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? t('submitting') : t('submitScore')}</span>
                  </button>
                </div>

                {/* Option to skip leaderboard submission */}
                <div className="text-right pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsSkipped(true)}
                    className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors underline cursor-pointer"
                  >
                    {t('skipLeaderboard')}
                  </button>
                </div>
              </form>
            ) : isSubmitted ? (
              /* Success Confirmation & Achievement Badge */
              <div className="text-center py-2.5 space-y-2 animate-fadeIn">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-2xs">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{t('submittedSuccess')}</span>
                </div>

                {assignedRank && (
                  <div className="flex flex-col items-center justify-center gap-1 mt-1">
                    {assignedRank <= 3 && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black">
                        <Medal rank={assignedRank as 1 | 2 | 3} size="md" />
                        <span>{t('top3PodiumAchieved')}</span>
                      </div>
                    )}
                    <p className="text-sm sm:text-base font-bold text-[#7a1636]">
                      {t('rank')}: #{assignedRank} ({difficultyLabel})
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* ============================================================ */}
          {/* 5. PRIMARY NEXT LEVEL & ACTION NAVIGATION BUTTONS */}
          {/* ============================================================ */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-1">
            {/* Primary Action Button (Next Level Progression) */}
            <button
              data-testid="next-level-btn"
              onClick={handleNextLevelClick}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl bg-[#7a1636] text-white font-black text-sm sm:text-base shadow-exhibition hover:bg-[#62102b] hover:scale-102 active:scale-98 transition-all cursor-pointer w-full sm:w-auto"
            >
              {difficulty === 'CASUAL' && <Zap className="w-4 h-4 text-amber-300" />}
              {difficulty === 'CHALLENGE' && <Flame className="w-4 h-4 text-amber-300" />}
              {difficulty === 'MASTER' && <RotateCcw className="w-4 h-4 text-amber-300" />}
              <span>
                {difficulty === 'CASUAL'
                  ? t('tryChallenge')
                  : difficulty === 'CHALLENGE'
                  ? t('tryMaster')
                  : t('playAgain')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Replay Current Level (if not Master AI) */}
            {!isHighestDifficulty && (
              <button
                data-testid="replay-level-btn"
                onClick={() => {
                  sfx.playClick();
                  onPlayAgain();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>{t('replayLevel')}</span>
              </button>
            )}

            {/* View Leaderboard */}
            <button
              onClick={() => {
                sfx.playClick();
                onOpenLeaderboard();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-2xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>{t('viewLeaderboard')}</span>
            </button>

            {/* Home */}
            <button
              onClick={() => {
                sfx.playClick();
                onHome();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4 text-stone-500" />
              <span>{t('home')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. UNSAVED SCORE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-exhibition-lg p-6 sm:p-7 animate-scaleUp text-center relative">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Trophy className="w-6 h-6" />
            </div>

            <h3 className="font-serif font-black text-lg text-stone-900">
              {t('confirmUnsavedTitle')}
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              {t('confirmUnsavedDesc')}
            </p>

            <div className="my-4 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
              <span className="text-stone-500">{t('yourFinalTime')}:</span>
              <span className="font-mono font-bold text-[#7a1636] text-sm">
                {elapsedSeconds.toFixed(1)}s
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                data-testid="save-score-continue-btn"
                onClick={async () => {
                  await handleSubmit();
                  triggerLevelTransition(nextDifficulty);
                }}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#7a1636] text-white font-bold text-xs sm:text-sm hover:bg-[#62102b] transition-all shadow-xs cursor-pointer"
              >
                {t('saveScoreAndContinue')}
              </button>

              <button
                data-testid="continue-without-saving-btn"
                onClick={() => {
                  setIsSkipped(true);
                  triggerLevelTransition(nextDifficulty);
                }}
                className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('continueWithoutSaving')}
              </button>

              <button
                data-testid="cancel-confirm-btn"
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-[11px] text-stone-400 hover:text-stone-600 pt-1 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. LEVEL UNLOCKED TRANSITION OVERLAY */}
      {/* ============================================================ */}
      {isTransitioningLevel && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-amber-200 shadow-exhibition-lg p-6 sm:p-8 text-center animate-scaleUp relative">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="p-4 rounded-2xl bg-[#7a1636] text-white shadow-exhibition border border-amber-300">
                {nextDifficulty === 'CHALLENGE' ? (
                  <Zap className="w-8 h-8 text-amber-300" />
                ) : (
                  <Flame className="w-8 h-8 text-amber-300" />
                )}
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('nextChallengeUnlocked')}</span>
            </div>

            <h3 className="font-serif font-black text-xl text-stone-900 mt-1">
              {nextDifficultyLabel}
            </h3>

            <p className="text-xs text-stone-600 mt-2 px-4 leading-relaxed">
              {nextDifficulty === 'CHALLENGE' ? t('nextChallengeDesc') : t('nextMasterDesc')}
            </p>

            <div className="mt-6">
              <button
                data-testid="start-next-level-now-btn"
                onClick={handleStartNow}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#7a1636] text-white font-black text-sm shadow-exhibition hover:bg-[#62102b] hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                <span>{t('startNextLevelNow')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Capture Modal */}
      <PhotoCaptureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotoAccepted={(dataUrl) => setPhotoDataUrl(dataUrl)}
        existingStream={streamRef?.current}
      />
    </div>
  );
};
