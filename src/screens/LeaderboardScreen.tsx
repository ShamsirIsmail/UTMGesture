// ============================================================
// UTM Gesture Quest V3.1 — Dedicated Leaderboard Screen
// Sports-style Top 3 Podium + Ranked Table with local IndexedDB
// Uses /asset/medals/{gold,silver,bronze}.png
// ============================================================

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Timer, Calendar, RefreshCw, Eye } from 'lucide-react';
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

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  onBack,
  defaultDifficulty = 'CHALLENGE',
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<DifficultyLevel>(defaultDifficulty);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [spectatorMode, setSpectatorMode] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getLeaderboard(activeTab, 25);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    voice.speak('LEADERBOARD', language, 1500);
  }, [activeTab]);

  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];
  const remaining = entries.slice(3);

  return (
    <div className={`relative w-full h-full bg-leaderboard-light overflow-y-auto flex flex-col justify-between ${spectatorMode ? 'p-8 sm:p-12' : 'p-4 sm:p-6'}`}>
      <div className="w-full max-w-5xl mx-auto flex flex-col flex-1">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            {!spectatorMode && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onBack();
                }}
                className="p-2 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
                title={t('back')}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" />
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900">
                  {t('leaderboardTitle')}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                {t('leaderboardSubtitle')}
              </p>
            </div>
          </div>

          {/* Controls: Spectator toggle + Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpectatorMode(!spectatorMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors ${spectatorMode
                  ? 'bg-[#7a1636] text-white border-[#7a1636]'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('spectatorMode')}</span>
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                loadData();
              }}
              className="p-2 rounded-full bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Difficulty Selector Tabs */}
        <div className="flex justify-center my-5">
          <div className="inline-flex rounded-2xl bg-stone-100 p-1 border border-stone-200 shadow-2xs text-xs sm:text-sm font-bold">
            {(['CASUAL', 'CHALLENGE', 'MASTER'] as DifficultyLevel[]).map((tab) => {
              const active = activeTab === tab;
              const label = tab === 'CASUAL' ? t('diffCasual') : tab === 'CHALLENGE' ? t('diffChallenge') : t('diffMaster');

              return (
                <button
                  key={tab}
                  onClick={() => {
                    sfx.playClick();
                    setActiveTab(tab);
                  }}
                  className={`px-5 py-2 rounded-xl transition-all cursor-pointer ${active
                      ? 'bg-[#7a1636] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TOP 3 PODIUM DISPLAY */}
        {entries.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end max-w-3xl mx-auto pt-4">
              {/* Rank 2 (Silver) */}
              <div className="order-2 sm:order-1 flex flex-col items-center">
                {top2 ? (
                  <div className="w-full flex flex-col items-center p-4 rounded-3xl bg-white border border-stone-200 shadow-exhibition hover:scale-102 transition-transform relative">
                    <div className="absolute -top-3.5 left-4">
                      <Medal rank={2} size="md" />
                    </div>
                    <div className="relative mb-2 mt-1">
                      <Avatar photo={top2.photo} avatarId={top2.avatarId} nickname={top2.nickname} size="lg" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-slate-300 text-slate-800 font-black text-[10px] border border-white shadow-xs">
                        #2
                      </div>
                    </div>
                    <span className="font-bold text-sm text-stone-900 truncate max-w-[140px] mt-2">
                      {top2.nickname}
                    </span>
                    <span className="font-mono font-bold text-base text-stone-700 mt-0.5">
                      {top2.timeSeconds}s
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-3xl border border-dashed border-stone-300 flex items-center justify-center text-xs text-stone-400">
                    #2 Menanti Rekod
                  </div>
                )}
              </div>

              {/* Rank 1 (Gold - Center & Elevated) */}
              <div className="order-1 sm:order-2 flex flex-col items-center -mt-3">
                {top1 ? (
                  <div className="w-full flex flex-col items-center p-5 rounded-3xl bg-white border-2 border-amber-400 shadow-exhibition-lg hover:scale-103 transition-transform relative">
                    <div className="absolute -top-4 left-4">
                      <Medal rank={1} size="lg" />
                    </div>

                    <div className="absolute -top-3.5 right-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>JUARA</span>
                    </div>

                    <div className="relative mb-2 mt-1">
                      <Avatar photo={top1.photo} avatarId={top1.avatarId} nickname={top1.nickname} size="xl" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-xs border border-white shadow-xs">
                        #1
                      </div>
                    </div>

                    <span className="font-bold text-base text-stone-900 truncate max-w-[160px] mt-2">
                      {top1.nickname}
                    </span>
                    <span className="font-mono font-black text-xl text-[#7a1636] mt-0.5">
                      {top1.timeSeconds}s
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-40 rounded-3xl border-2 border-dashed border-amber-300 flex items-center justify-center text-xs text-amber-700 font-bold">
                    #1 Menanti Juara
                  </div>
                )}
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="order-3 flex flex-col items-center">
                {top3 ? (
                  <div className="w-full flex flex-col items-center p-4 rounded-3xl bg-white border border-stone-200 shadow-exhibition hover:scale-102 transition-transform relative">
                    <div className="absolute -top-3.5 left-4">
                      <Medal rank={3} size="md" />
                    </div>
                    <div className="relative mb-2 mt-1">
                      <Avatar photo={top3.photo} avatarId={top3.avatarId} nickname={top3.nickname} size="lg" />
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-700 text-white font-black text-[10px] border border-white shadow-xs">
                        #3
                      </div>
                    </div>
                    <span className="font-bold text-sm text-stone-900 truncate max-w-[140px] mt-2">
                      {top3.nickname}
                    </span>
                    <span className="font-mono font-bold text-base text-stone-700 mt-0.5">
                      {top3.timeSeconds}s
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-3xl border border-dashed border-stone-300 flex items-center justify-center text-xs text-stone-400">
                    #3 Menanti Rekod
                  </div>
                )}
              </div>
            </div>

            {/* REMAINING RANKS TABLE (4th to 25th) */}
            {remaining.length > 0 && (
              <div className="rounded-3xl bg-white border border-stone-200/90 shadow-exhibition overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-[11px] tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4 w-16 text-center">{t('rank')}</th>
                      <th className="py-3 px-4">{t('participant')}</th>
                      <th className="py-3 px-4 text-center">{t('mode')}</th>
                      <th className="py-3 px-4 text-right">{t('time')}</th>
                      <th className="py-3 px-4 text-right hidden sm:table-cell">{t('date')}</th>
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
                        <tr key={entry.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-stone-600 font-mono">
                            #{rankNum}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                photo={entry.photo}
                                avatarId={entry.avatarId}
                                nickname={entry.nickname}
                                size="sm"
                              />
                              <span className="font-semibold text-stone-900">
                                {entry.nickname}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700">
                              {entry.controlMode}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                            {entry.timeSeconds}s
                          </td>
                          <td className="py-3 px-4 text-right text-stone-400 text-xs hidden sm:table-cell font-mono">
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
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-exhibition my-8">
            <Trophy className="w-16 h-16 text-stone-300 mb-3" />
            <h3 className="font-serif font-black text-xl text-stone-800 mb-1">
              {t('noRecordsYet')}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm">
              Jadilah peserta pertama menyelesaikan misi kategori ini menggunakan Kawalan Tangan AI!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
