// ============================================================
// UTM Gesture Quest V3.4 — Redesigned Achievement & Complete Screen
// Clean visual hierarchy: Ribbon Header -> Large Final Time -> Performance Grade
// Compact secondary stats -> Welcoming Leaderboard submission -> Action buttons
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Trophy,
  Home,
  Check,
  Camera,
  User,
  Sparkles,
  Award,
  Zap,
  ShieldAlert,
  Send,
  ArrowRight,
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
  onHome,
  onOpenLeaderboard,
  streamRef,
}) => {
  const { t, language } = useTranslation();
  const cfg = DIFFICULTY_CONFIGS[difficulty];

  // Submission state
  const [nickname, setNickname] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [selectedAvatarId, setSelectedAvatarId] = useState(1);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [assignedRank, setAssignedRank] = useState<number | null>(null);
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    voice.speakCompletion(language);
  }, [language]);

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Find user's new rank in leaderboard
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

  const difficultyLabel =
    difficulty === 'CASUAL'
      ? t('diffCasual')
      : difficulty === 'CHALLENGE'
      ? t('diffChallenge')
      : t('diffMaster');

  return (
    <div className="relative w-full h-full bg-complete-light overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl mx-auto rounded-3xl bg-white/95 backdrop-blur-xs border border-stone-200/90 shadow-exhibition p-6 sm:p-8 text-center animate-fadeIn my-auto relative">
        {/* ============================================================ */}
        {/* 1. TOP CELEBRATORY BANNER (LAUREL RIBBON STYLE) */}
        {/* ============================================================ */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-amber-500 text-lg select-none">🌿</span>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#7a1636] text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xs">
            <Trophy className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>{t('missionComplete')}</span>
          </div>
          <span className="text-amber-500 text-lg select-none transform -scale-x-100">🌿</span>
        </div>

        {/* 2. Main Title & Encouraging Subtitle */}
        <h1 className="text-2xl sm:text-4xl font-serif font-black text-stone-900 mt-1">
          {t('futureStarts')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
          {t('missionCompleteSubtitle')}
        </p>

        {/* ============================================================ */}
        {/* 3. PERFORMANCE STATISTICS CARD (VISUAL FOCUS: FINAL TIME) */}
        {/* ============================================================ */}
        <div className="my-5 p-4 sm:p-5 rounded-2xl bg-stone-50/90 border border-stone-200/90 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
            {/* Metric 1: Performance Grade */}
            <div className="flex items-center gap-3 p-1">
              <div
                className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-2xl shadow-xs shrink-0 ${rankInfo.color}`}
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
                {t('finalTime')}
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-black text-[#7a1636]">
                {elapsedSeconds.toFixed(1)}
                <span className="text-sm font-bold ml-0.5">s</span>
              </div>
            </div>

            {/* Metric 3: Best Combo */}
            <div className="pt-2 sm:pt-0 sm:pl-4 text-center sm:text-left">
              <div className="text-[10px] uppercase font-bold text-stone-400">
                {t('maxComboLabel')}
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                {maxCombo}×
              </div>
            </div>

            {/* Metric 4: Hazard Hits */}
            <div className="pt-2 sm:pt-0 sm:pl-4 text-center sm:text-left">
              <div className="text-[10px] uppercase font-bold text-stone-400">
                {t('glitchHitsLabel')}
              </div>
              <div
                className={`text-xl sm:text-2xl font-black font-mono ${
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
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-white border border-[#7a1636]/25 shadow-xs text-left relative overflow-hidden">
            {/* Decorative Gold Accent Corner */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-200/50 via-amber-100/20 to-transparent pointer-events-none rounded-tr-2xl" />

            {!isSubmitted && !isSkipped ? (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                    <Trophy className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-stone-900 text-sm">
                      {t('joinLeaderboardPrompt')}
                    </h2>
                    <p className="text-[11px] text-stone-500">{t('joinLeaderboardDesc')}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center pt-1">
                  {/* Avatar / Photo with live camera button */}
                  <div className="relative group shrink-0">
                    <Avatar
                      photo={photoDataUrl}
                      avatarId={selectedAvatarId}
                      nickname={nickname || 'U'}
                      size="lg"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPhotoModalOpen(true)}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#7a1636] text-white shadow-xs hover:bg-[#62102b] transition-colors cursor-pointer"
                      title={t('takeLivePhoto')}
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#7a1636] focus:ring-2 focus:ring-[#7a1636]/20 bg-stone-50/50"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#7a1636] text-white font-bold text-sm shadow hover:bg-[#62102b] disabled:opacity-50 transition-all cursor-pointer self-end"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t('saveScoreAction')}</span>
                  </button>
                </div>

                {/* Option to skip leaderboard submission */}
                <div className="text-right pt-1">
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
              <div className="text-center py-3 space-y-2.5 animate-fadeIn">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-2xs">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{t('submittedSuccess')}</span>
                </div>

                {assignedRank && (
                  <div className="flex flex-col items-center justify-center gap-2 mt-2">
                    {assignedRank <= 3 && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black">
                        <Medal rank={assignedRank as 1 | 2 | 3} size="md" />
                        <span>{t('top3PodiumAchieved')}</span>
                      </div>
                    )}
                    <p className="text-base sm:text-lg font-bold text-[#7a1636]">
                      {t('rank')}: #{assignedRank} ({difficultyLabel})
                    </p>
                  </div>
                )}
              </div>
            ) : null}
        </div>

        {/* ============================================================ */}
        {/* 5. BOTTOM ACTION BUTTONS */}
        {/* ============================================================ */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {/* Play Again (Primary UTM Maroon) */}
          <button
            onClick={() => {
              sfx.playClick();
              onPlayAgain();
            }}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#7a1636] text-white font-black text-sm shadow hover:bg-[#62102b] hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('playAgain')}</span>
          </button>

          {/* View Leaderboard (Secondary White Card with Gold Trophy) */}
          <button
            onClick={() => {
              sfx.playClick();
              onOpenLeaderboard();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer"
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
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-stone-500" />
            <span>{t('home')}</span>
          </button>
        </div>
      </div>

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
