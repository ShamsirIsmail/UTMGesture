// ============================================================
// UTM Gesture Quest V3.1 — Exhibition Operator Management Modal
// Event-specific PIN configuration, data deletion, diagnostics,
// Developer Debug Mode toggle, and offline voice tester
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Trash2,
  ImageOff,
  AlertTriangle,
  X,
  RotateCcw,
  Camera,
  CheckCircle2,
  Lock,
  Key,
  Volume2,
  Bug,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import {
  getLeaderboard,
  deleteLeaderboardEntry,
  deleteEntryPhoto,
  clearAllLeaderboard,
  getTotalEntriesCount,
} from '../services/leaderboardDb';
import { sfx } from '../services/audioEngine';
import { voice } from '../services/voiceGuidance';
import type { LeaderboardEntry, DifficultyLevel } from '../types';

interface OperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetGame: () => void;
  cameraStatus: string;
  submissionsEnabled: boolean;
  onToggleSubmissions: () => void;
  debugMode?: boolean;
  onToggleDebugMode?: () => void;
}

const PIN_STORAGE_KEY = 'utm_operator_pin';
const DEFAULT_INITIAL_PIN = '2026';

export const OperatorModal: React.FC<OperatorModalProps> = ({
  isOpen,
  onClose,
  onResetGame,
  cameraStatus,
  submissionsEnabled,
  onToggleSubmissions,
  debugMode = false,
  onToggleDebugMode,
}) => {
  const { t, language } = useTranslation();

  const [storedPin, setStoredPin] = useState<string>(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_INITIAL_PIN;
  });
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Operator settings
  const [activeTab, setActiveTab] = useState<DifficultyLevel>('CASUAL');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Voice diagnostics
  const [installedVoices, setInstalledVoices] = useState<SpeechSynthesisVoice[]>([]);

  const loadData = async () => {
    try {
      const data = await getLeaderboard(activeTab, 100);
      setEntries(data);
      const count = await getTotalEntriesCount();
      setTotalCount(count);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadData();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setInstalledVoices(voice.getAvailableVoices());
      }
    }
    if (!isOpen) {
      setPin('');
      setIsAuthenticated(false);
      setPinError(false);
      setConfirmClear(false);
      setNewPin('');
      setPinChangeSuccess(false);
    }
  }, [isOpen, isAuthenticated, activeTab]);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentValidPin = localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_INITIAL_PIN;
    if (pin === currentValidPin) {
      setIsAuthenticated(true);
      setPinError(false);
      sfx.playClick();
    } else {
      setPinError(true);
      sfx.playGlitchHit();
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 4) {
      localStorage.setItem(PIN_STORAGE_KEY, newPin.trim());
      setStoredPin(newPin.trim());
      setNewPin('');
      setPinChangeSuccess(true);
      sfx.playClick();
      setTimeout(() => setPinChangeSuccess(false), 2500);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Padam rekod peserta ini daripada pangkalan data?')) {
      sfx.playClick();
      await deleteLeaderboardEntry(id);
      loadData();
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (window.confirm('Padam foto peserta sahaja (mengekalkan markah masa)?')) {
      sfx.playClick();
      await deleteEntryPhoto(id);
      loadData();
    }
  };

  const handleClearAll = async () => {
    sfx.playGlitchHit();
    await clearAllLeaderboard();
    setConfirmClear(false);
    loadData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-exhibition-lg border border-stone-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7a1636] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-stone-900">
                {t('operatorDashboard')}
              </h3>
              <p className="text-[11px] text-stone-500">
                Kawalan Pameran &amp; Pengurusan Data Tempatan
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {!isAuthenticated ? (
          /* PIN Verification View */
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-[#7a1636] mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-stone-900 mb-1">
              Pengesahan Petugas Pameran
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mb-6 leading-relaxed">
              Masukkan PIN acara untuk mengakses diagnostik, tetapan debug, dan pengurusan data peserta.
            </p>

            <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-3">
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="Masukkan PIN Petugas"
                className={`w-full px-4 py-3 rounded-xl border text-center font-mono text-xl tracking-widest outline-none transition-all ${
                  pinError
                    ? 'border-rose-400 bg-rose-50 text-rose-800'
                    : 'border-stone-300 focus:border-[#7a1636] bg-stone-50 focus:bg-white'
                }`}
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-600 font-semibold">
                  PIN tidak sah. Sila cuba lagi.
                </p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#7a1636] text-white font-bold text-sm hover:bg-[#62102b] transition-colors cursor-pointer shadow-xs"
              >
                Log Masuk Petugas
              </button>
            </form>

            <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 text-left max-w-sm">
              <span className="font-bold block mb-0.5">Nota Keselamatan:</span>
              PIN klien ini bertujuan mengelakkan akses tidak sengaja oleh pengunjung pameran. PIN lalai awal adalah <code className="font-mono font-bold bg-white px-1 rounded">2026</code> (boleh ditukar di papan kawalan).
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Quick Actions & Diagnostics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Emergency Home Reset */}
              <button
                onClick={() => {
                  sfx.playClick();
                  onResetGame();
                  onClose();
                }}
                className="flex items-center gap-2 p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-[#7a1636]" />
                <div className="text-left">
                  <div className="font-bold">Reset ke Laman Utama</div>
                  <div className="text-[10px] text-stone-500">Mula semula sesi</div>
                </div>
              </button>

              {/* Developer Debug Mode Toggle */}
              {onToggleDebugMode && (
                <button
                  onClick={() => {
                    sfx.playClick();
                    onToggleDebugMode();
                  }}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-colors ${
                    debugMode
                      ? 'bg-amber-500 text-white border-amber-400'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                >
                  <Bug className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <div className="font-bold">Debug Mode: {debugMode ? 'ON' : 'OFF'}</div>
                    <div className="text-[10px] opacity-80">Garis sasaran &amp; koordinat</div>
                  </div>
                </button>
              )}

              {/* Toggle Submissions */}
              <button
                onClick={() => {
                  sfx.playClick();
                  onToggleSubmissions();
                }}
                className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-colors ${
                  submissionsEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-bold">Penyertaan: {submissionsEnabled ? 'Buka' : 'Tutup'}</div>
                  <div className="text-[10px] opacity-80">Borang papan pendahulu</div>
                </div>
              </button>
            </div>

            {/* Voice Guidance Test & Installed Voices */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                  <Volume2 className="w-4 h-4 text-[#7a1636]" />
                  <span>Sistem Suara Dwibahasa (Luar Talian)</span>
                </div>
                <button
                  onClick={() => {
                    voice.speak('WELCOME', language, 0);
                  }}
                  className="px-3 py-1 rounded-full bg-[#7a1636] text-white text-[11px] font-bold cursor-pointer hover:bg-[#62102b] transition-colors"
                >
                  Uji Suara ({language.toUpperCase()})
                </button>
              </div>
              <div className="text-[11px] text-stone-600">
                Status Enjin: <span className="font-bold text-emerald-700">Web Speech API Tersedia</span> | Bahasa Aktif: <span className="font-bold uppercase text-[#7a1636]">{language}</span>
              </div>
              <div className="text-[10px] text-stone-500">
                Suara Dipasang Pada Komputer: {installedVoices.length > 0 ? `${installedVoices.length} suara ditemui` : 'Mengimbas suara sistem...'}
              </div>
            </div>

            {/* Change Operator PIN */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 mb-2">
                <Key className="w-4 h-4 text-[#7a1636]" />
                <span>Tukar PIN Petugas Acara</span>
              </div>
              <form onSubmit={handleSaveNewPin} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={8}
                  placeholder="PIN Baharu (min. 4 aksara)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono bg-white outline-none focus:border-[#7a1636] flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Simpan PIN
                </button>
              </form>
              {pinChangeSuccess && (
                <p className="text-[11px] text-emerald-700 font-bold mt-1.5 animate-fadeIn">
                  PIN petugas berjaya dikemas kini!
                </p>
              )}
            </div>

            {/* Leaderboard Management */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-black text-sm text-stone-900">
                  Senarai Rekod ({totalCount} Jumlah)
                </h4>

                {/* Clear All Data */}
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Semua</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-700 font-bold">Pasti?</span>
                    <button
                      onClick={handleClearAll}
                      className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Ya, Padam
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              {/* Tab Selector */}
              <div className="flex gap-2 mb-3">
                {(['CASUAL', 'CHALLENGE', 'MASTER'] as DifficultyLevel[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      sfx.playClick();
                      setActiveTab(tab);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === tab
                        ? 'bg-[#7a1636] text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Table of Entries */}
              <div className="rounded-2xl border border-stone-200 overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-600 uppercase text-[10px] tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Nama</th>
                      <th className="py-2 px-3">Masa</th>
                      <th className="py-2 px-3">Foto</th>
                      <th className="py-2 px-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-stone-50">
                        <td className="py-2 px-3 font-semibold text-stone-900">
                          {entry.nickname}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-stone-700">
                          {entry.timeSeconds}s
                        </td>
                        <td className="py-2 px-3">
                          {entry.photo ? (
                            <img
                              src={entry.photo}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover border"
                            />
                          ) : (
                            <span className="text-[10px] text-stone-400">Avatar #{entry.avatarId}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right space-x-2">
                          {entry.photo && (
                            <button
                              onClick={() => handleDeletePhoto(entry.id)}
                              className="p-1 text-stone-400 hover:text-amber-600 cursor-pointer"
                              title="Padam foto sahaja"
                            >
                              <ImageOff className="w-3.5 h-3.5 inline" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                            title="Padam rekod"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {entries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-stone-400 italic">
                          Tiada rekod untuk kategori ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
