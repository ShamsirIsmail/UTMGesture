// ============================================================
// UTM Gesture Quest V3.1 — Mission Complete & Ranking Screen
// Stage 5: Celebration, Leaderboard Submission & Photo Feature
// Integrates real /asset/medals/ and bilingual voice guidance
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [assignedRank, setAssignedRank] = useState<number | null>(null);

  useEffect(() => {
    voice.speak('COMPLETION', language, 1000);
  }, []);

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
    if (isSubmitted) return;

    sfx.playClick();
    try {
      const entry = await addLeaderboardEntry({
        nickname: nickname.trim() || 'Peserta UTM',
        photo: photoDataUrl,
        avatarId: selectedAvatarId,
        difficulty,
        timeSeconds: elapsedSeconds,
        controlMode,
      });

      // Find user's new rank in leaderboard
      const currentBoard = await getLeaderboard(difficulty, 100);
      const userIndex = currentBoard.findIndex((b) => b.id === entry.id);
      const userRank = userIndex !== -1 ? userIndex + 1 : 1;
      setAssignedRank(userRank);
      setIsSubmitted(true);
      voice.speak('LEADERBOARD', language, 800);
    } catch {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="relative w-full h-full bg-complete-light overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white border border-stone-200/90 shadow-exhibition p-6 sm:p-8 text-center animate-fadeIn">
        {/* Mission Complete Header Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#7a1636] text-white font-black text-sm tracking-wider uppercase shadow-xs mb-3">
          <Award className="w-4 h-4 text-[#ffd166]" />
          <span>{t('missionComplete')}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 mt-1">
          {t('futureStarts')}
        </h2>

        {/* Performance Metrics Card */}
        <div className="my-5 p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-3xl shadow-xs ${rankInfo.color}`}>
              {rankInfo.grade}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-500">
                {difficulty === 'CASUAL' ? t('diffCasual') : difficulty === 'CHALLENGE' ? t('diffChallenge') : t('diffMaster')} {t('rankGrade')}
              </div>
              <div className="text-base font-extrabold text-stone-900">{rankInfo.title}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-center border-t sm:border-t-0 sm:border-l border-stone-200 pt-2 sm:pt-0 sm:pl-4">
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">{t('timeElapsed')}</span>
              <p className="text-lg font-mono font-bold text-[#7a1636]">{elapsedSeconds.toFixed(1)}s</p>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">{t('maxCombo')}</span>
              <p className="text-lg font-bold text-emerald-600">{maxCombo}×</p>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">{t('glitchHits')}</span>
              <p className="text-lg font-bold text-rose-600">{glitchHits}</p>
            </div>
          </div>
        </div>

        {/* Leaderboard Submission Form */}
        {controlMode === 'CAMERA' ? (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-[#7a1636]/20 shadow-xs text-left">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-stone-900 text-sm">{t('joinLeaderboardPrompt')}</h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  {/* Avatar / Photo preview */}
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
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#7a1636] text-white shadow hover:bg-[#62102b] transition-colors cursor-pointer"
                      title={t('takeLivePhoto')}
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

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
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#7a1636] focus:ring-2 focus:ring-[#7a1636]/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7a1636] text-white font-bold text-sm shadow hover:bg-[#62102b] transition-all cursor-pointer self-end"
                  >
                    {t('submitScore')}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Confirmation */
              <div className="text-center py-3 space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{t('submittedSuccess')}</span>
                </div>

                {assignedRank && (
                  <div className="flex flex-col items-center justify-center gap-2 mt-2">
                    {assignedRank <= 3 && (
                      <Medal rank={assignedRank as 1 | 2 | 3} size="lg" />
                    )}
                    <p className="text-lg font-bold text-[#7a1636]">
                      Kedudukan Anda: #{assignedRank} ({difficulty})
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-500">
            {t('mousePreviewNotice')}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              sfx.playClick();
              onPlayAgain();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#7a1636] text-white font-bold text-sm shadow hover:bg-[#62102b] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('playAgain')}</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              onOpenLeaderboard();
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-sm shadow-xs transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>{t('viewLeaderboard')}</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              onHome();
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition-colors cursor-pointer"
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
