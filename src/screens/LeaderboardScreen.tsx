// ============================================================
// UTM Gesture Quest V3.3 — Professional Exhibition Hall of Fame & Leaderboard
// Sports-style Top 3 Podium + Clean Ranked Table with local IndexedDB
// Enhanced Spectator Mode: 10s auto-cycling, interactive pause/resume,
// 15s inactivity reset, high-contrast 2-3 meter distance typography.
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Trophy,
  Timer,
  Calendar,
  RefreshCw,
  Eye,
  Play,
  Pause,
  Award,
  Maximize2,
  Minimize2,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Medal } from '../components/Medal';
import { useTranslation } from '../i18n/useTranslation';
import { getLeaderboard } from '../services/leaderboardDb';
import { sfx } from '../services/audioEngine';
import { voice } from '../services/voiceGuidance';
import type { LeaderboardEntry, DifficultyLevel } from '../types';

interface LeaderboardScreenProps {
  onBack: () => void;
  defaultDifficulty?: DifficultyLevel;
}

const CATEGORIES: DifficultyLevel[] = ['CASUAL', 'CHALLENGE', 'MASTER'];
const CYCLE_INTERVAL_SECONDS = 10;
const INACTIVITY_RESUME_SECONDS = 15;

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  onBack,
  defaultDifficulty = 'CHALLENGE',
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<DifficultyLevel>(defaultDifficulty);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Spectator Mode State
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [isCyclingPaused, setIsCyclingPaused] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(CYCLE_INTERVAL_SECONDS);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const inactivityTimerRef = useRef<number | null>(null);

  // Load records from IndexedDB
  const loadData = useCallback(async (diff: DifficultyLevel) => {
    setIsLoading(true);
    try {
      const data = await getLeaderboard(diff, 30);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  // Voice announcement once on screen open
  useEffect(() => {
    voice.speakLeaderboard(language);
  }, [language]);

  // Auto-cycling timer in Spectator Mode (cycles every 10 seconds)
  useEffect(() => {
    if (!spectatorMode || isCyclingPaused || isUserInteracting) return;

    setSecondsRemaining(CYCLE_INTERVAL_SECONDS);
    const interval = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Advance to next difficulty
          setActiveTab((curr) => {
            const nextIdx = (CATEGORIES.indexOf(curr) + 1) % CATEGORIES.length;
            return CATEGORIES[nextIdx];
          });
          return CYCLE_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [spectatorMode, isCyclingPaused, isUserInteracting, activeTab]);

  // User interaction detector: pause auto-cycle and resume after 15s inactivity
  const handleUserActivity = useCallback(() => {
    if (!spectatorMode) return;
    setIsUserInteracting(true);

    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = window.setTimeout(() => {
      setIsUserInteracting(false);
      setSecondsRemaining(CYCLE_INTERVAL_SECONDS);
    }, INACTIVITY_RESUME_SECONDS * 1000);
  }, [spectatorMode]);

  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, []);

  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];
  const remaining = entries.slice(3);

  // Difficulty badge styling
  const getTabBadge = (tab: DifficultyLevel) => {
    switch (tab) {
      case 'CASUAL':
        return { label: t('diffCasual'), color: 'emerald' };
      case 'CHALLENGE':
        return { label: t('diffChallenge'), color: 'sky' };
      case 'MASTER':
        return { label: t('diffMaster'), color: 'amber' };
    }
  };

  return (
    <div
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      onTouchStart={handleUserActivity}
      className={`relative w-full h-full bg-leaderboard-light overflow-y-auto flex flex-col justify-between transition-all duration-300 ${
        spectatorMode ? 'p-6 sm:p-10 lg:p-12' : 'p-4 sm:p-6 lg:p-8'
      }`}
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col flex-1">
        {/* ============================================================ */}
        {/* HEADER BAR & CONTROLS */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-stone-200/90">
          {/* Title and University Branding */}
          <div className="flex items-center gap-3.5">
            {!spectatorMode && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onBack();
                }}
                className="p-2.5 rounded-2xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors shadow-2xs cursor-pointer focus:outline-none"
                title={t('back')}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-600 shadow-2xs">
                  <Trophy className={spectatorMode ? 'w-7 h-7 text-amber-500' : 'w-5 h-5 text-amber-500'} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#7a1636] bg-[#7a1636]/10 px-2 py-0.5 rounded-full">
                      {t('hallOfFame')}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-400">
                      Ziarah Kasih & Cakna Komuniti UTM
                    </span>
                  </div>
                  <h1
                    className={`font-serif font-black text-stone-900 tracking-tight ${
                      spectatorMode ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl sm:text-3xl'
                    }`}
                  >
                    {t('leaderboardTitle')}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Auto-cycling indicator in Spectator Mode */}
            {spectatorMode && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 text-white text-xs font-semibold shadow-xs">
                <button
                  onClick={() => {
                    sfx.playClick();
                    setIsCyclingPaused((prev) => !prev);
                  }}
                  className="flex items-center gap-1.5 hover:text-amber-400 transition-colors cursor-pointer"
                  title={isCyclingPaused ? t('resumeCycle') : t('pauseCycle')}
                >
                  {isCyclingPaused || isUserInteracting ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{isUserInteracting ? t('interactionPause') : t('pauseCycle')}</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                      <span>{t('autoCycleCountdown')} {secondsRemaining}s</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Spectator Mode Toggle */}
            <button
              onClick={() => {
                sfx.playClick();
                setSpectatorMode((prev) => !prev);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-xs ${
                spectatorMode
                  ? 'bg-[#7a1636] text-white border-[#7a1636] ring-2 ring-[#7a1636]/20'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{t('spectatorMode')}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                sfx.playClick();
                loadData(activeTab);
              }}
              className="p-2 rounded-2xl bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer shadow-2xs"
              title={t('refreshRecords')}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* DIFFICULTY SELECTOR TABS */}
        {/* ============================================================ */}
        <div className="flex justify-center my-5 sm:my-6">
          <div className="inline-flex rounded-2xl bg-stone-100/90 p-1.5 border border-stone-200 shadow-xs">
            {CATEGORIES.map((tab) => {
              const active = activeTab === tab;
              const badge = getTabBadge(tab);

              return (
                <button
                  key={tab}
                  onClick={() => {
                    sfx.playClick();
                    setActiveTab(tab);
                    setSecondsRemaining(CYCLE_INTERVAL_SECONDS);
                  }}
                  className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl font-black transition-all cursor-pointer ${
                    spectatorMode ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                  } ${
                    active
                      ? 'bg-[#7a1636] text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  {badge.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* TOP 3 PODIUM DISPLAY */}
        {/* ============================================================ */}
        {entries.length > 0 ? (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-end max-w-4xl mx-auto pt-2">
              {/* ----------------- Rank 2 (Silver - Left) ----------------- */}
              <div className="order-2 sm:order-1 flex flex-col items-center">
                {top2 ? (
                  <div className="w-full flex flex-col items-center p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-exhibition hover:scale-102 transition-transform relative">
                    {/* Medal Top-Left Badge */}
                    <div className="absolute -top-4 left-4 drop-shadow-sm">
                      <Medal rank={2} size={spectatorMode ? 'lg' : 'md'} />
                    </div>

                    <div className="relative mb-3 mt-2">
                      <Avatar
                        photo={top2.photo}
                        avatarId={top2.avatarId}
                        nickname={top2.nickname}
                        size={spectatorMode ? 'xl' : 'lg'}
                      />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-black text-[11px] border border-white shadow-xs whitespace-nowrap">
                        {t('rank2Badge')}
                      </div>
                    </div>

                    <span
                      className={`font-black text-stone-900 truncate max-w-[160px] text-center mt-2 ${
                        spectatorMode ? 'text-lg sm:text-xl' : 'text-base'
                      }`}
                    >
                      {top2.nickname}
                    </span>

                    <div className="flex items-baseline gap-1 mt-1">
                      <span
                        className={`font-mono font-black text-slate-700 ${
                          spectatorMode ? 'text-2xl sm:text-3xl' : 'text-xl'
                        }`}
                      >
                        {top2.timeSeconds}
                      </span>
                      <span className="text-xs font-bold text-stone-400">s</span>
                    </div>

                    <div className="mt-2 text-[10px] uppercase font-bold text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200/60">
                      {top2.controlMode === 'CAMERA' ? t('aiCamera') : t('mousePreview')}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-36 rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50/50 flex flex-col items-center justify-center p-4 text-center">
                    <span className="font-bold text-xs text-stone-400">#2 {t('awaitingRecord')}</span>
                  </div>
                )}
              </div>

              {/* ----------------- Rank 1 (Gold - Center & Elevated) ----------------- */}
              <div className="order-1 sm:order-2 flex flex-col items-center -mt-4 sm:-mt-6">
                {top1 ? (
                  <div className="w-full flex flex-col items-center p-6 sm:p-7 rounded-3xl bg-white border-2 border-amber-400 shadow-exhibition-lg hover:scale-103 transition-transform relative ring-4 ring-amber-400/15">
                    {/* Medal Top-Left Badge */}
                    <div className="absolute -top-5 left-4 drop-shadow-md">
                      <Medal rank={1} size={spectatorMode ? 'xl' : 'lg'} />
                    </div>

                    {/* Juara Gold Ribbon */}
                    <div className="absolute -top-3.5 right-4 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 fill-stone-950" />
                      <span>{t('champion')}</span>
                    </div>

                    <div className="relative mb-3 mt-3">
                      <Avatar
                        photo={top1.photo}
                        avatarId={top1.avatarId}
                        nickname={top1.nickname}
                        size={spectatorMode ? '2xl' : 'xl'}
                      />
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-xs border-2 border-white shadow-xs whitespace-nowrap">
                        {t('rank1Badge')}
                      </div>
                    </div>

                    <span
                      className={`font-black text-stone-900 truncate max-w-[200px] text-center mt-2 ${
                        spectatorMode ? 'text-xl sm:text-2xl' : 'text-lg'
                      }`}
                    >
                      {top1.nickname}
                    </span>

                    <div className="flex items-baseline gap-1 mt-1">
                      <span
                        className={`font-mono font-black text-[#7a1636] ${
                          spectatorMode ? 'text-3xl sm:text-4xl' : 'text-2xl'
                        }`}
                      >
                        {top1.timeSeconds}
                      </span>
                      <span className="text-sm font-bold text-[#7a1636] ml-0.5">{t('secondsUnit')}</span>
                    </div>

                    <div className="mt-2 text-[11px] uppercase font-bold text-amber-900 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-300">
                      {top1.controlMode === 'CAMERA' ? t('aiCamera') : t('mousePreview')}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-44 rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/30 flex flex-col items-center justify-center p-4 text-center">
                    <Trophy className="w-8 h-8 text-amber-400 mb-1" />
                    <span className="font-bold text-sm text-amber-800">{t('awaitingChampion')}</span>
                  </div>
                )}
              </div>

              {/* ----------------- Rank 3 (Bronze - Right) ----------------- */}
              <div className="order-3 flex flex-col items-center">
                {top3 ? (
                  <div className="w-full flex flex-col items-center p-5 rounded-3xl bg-white border-2 border-amber-700/30 shadow-exhibition hover:scale-102 transition-transform relative">
                    {/* Medal Top-Left Badge */}
                    <div className="absolute -top-4 left-4 drop-shadow-sm">
                      <Medal rank={3} size={spectatorMode ? 'lg' : 'md'} />
                    </div>

                    <div className="relative mb-3 mt-2">
                      <Avatar
                        photo={top3.photo}
                        avatarId={top3.avatarId}
                        nickname={top3.nickname}
                        size={spectatorMode ? 'xl' : 'lg'}
                      />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-700 text-white font-black text-[11px] border border-white shadow-xs whitespace-nowrap">
                        {t('rank3Badge')}
                      </div>
                    </div>

                    <span
                      className={`font-black text-stone-900 truncate max-w-[160px] text-center mt-2 ${
                        spectatorMode ? 'text-lg sm:text-xl' : 'text-base'
                      }`}
                    >
                      {top3.nickname}
                    </span>

                    <div className="flex items-baseline gap-1 mt-1">
                      <span
                        className={`font-mono font-black text-amber-800 ${
                          spectatorMode ? 'text-2xl sm:text-3xl' : 'text-xl'
                        }`}
                      >
                        {top3.timeSeconds}
                      </span>
                      <span className="text-xs font-bold text-stone-400">s</span>
                    </div>

                    <div className="mt-2 text-[10px] uppercase font-bold text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200/60">
                      {top3.controlMode === 'CAMERA' ? t('aiCamera') : t('mousePreview')}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-36 rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50/50 flex flex-col items-center justify-center p-4 text-center">
                    <span className="font-bold text-xs text-stone-400">#3 {t('awaitingRecord')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================ */}
            {/* REMAINING RANKS TABLE (#4 to #30) */}
            {/* ============================================================ */}
            {remaining.length > 0 && (
              <div className="rounded-3xl bg-white border border-stone-200 shadow-exhibition overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-[11px] font-bold tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-3.5 px-5 w-20 text-center">{t('rank')}</th>
                      <th className="py-3.5 px-5">{t('participant')}</th>
                      <th className="py-3.5 px-5 text-center">{t('mode')}</th>
                      <th className="py-3.5 px-5 text-right">{t('time')}</th>
                      <th className="py-3.5 px-5 text-right hidden sm:table-cell">{t('date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {remaining.map((entry, idx) => {
                      const rankNum = idx + 4;
                      const dateStr = new Date(entry.createdAt).toLocaleDateString(
                        language === 'bm' ? 'ms-MY' : 'en-US',
                        { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                      );

                      return (
                        <tr
                          key={entry.id}
                          className="hover:bg-stone-50/90 transition-colors"
                        >
                          <td className="py-3.5 px-5 text-center font-black text-stone-500 font-mono text-sm sm:text-base">
                            #{rankNum}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <Avatar
                                photo={entry.photo}
                                avatarId={entry.avatarId}
                                nickname={entry.nickname}
                                size={spectatorMode ? 'md' : 'sm'}
                              />
                              <span
                                className={`font-bold text-stone-900 ${
                                  spectatorMode ? 'text-base sm:text-lg' : 'text-sm'
                                }`}
                              >
                                {entry.nickname}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200/60">
                              {entry.controlMode === 'CAMERA' ? t('aiCamera') : t('mousePreview')}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-black text-stone-900 text-sm sm:text-base">
                            {entry.timeSeconds}s
                          </td>
                          <td className="py-3.5 px-5 text-right text-stone-400 text-xs hidden sm:table-cell font-mono">
                            {dateStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Empty State when no entries exist yet */
          <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center bg-white rounded-3xl border border-stone-200 shadow-exhibition my-8">
            <div className="p-4 rounded-full bg-amber-50 border border-amber-200 mb-4">
              <Trophy className="w-12 h-12 text-amber-500" />
            </div>
            <h3 className="font-serif font-black text-2xl text-stone-900 mb-2">
              {t('noRecordsYet')}
            </h3>
            <p className="text-sm text-stone-500 max-w-md">
              {t('emptyBoardDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
