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
  Download,
  FileSpreadsheet,
  FileCode,
  Info,
  Play,
  Square,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import {
  getLeaderboard,
  deleteLeaderboardEntry,
  deleteEntryPhoto,
  clearAllLeaderboard,
  getTotalEntriesCount,
  exportLeaderboardJson,
  exportLeaderboardCsv,
  downloadExportFile,
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

  // Data Export settings
  const [includePhotosInExport, setIncludePhotosInExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Voice & SFX diagnostics and controls
  const [installedVoices, setInstalledVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [modalSfxEnabled, setModalSfxEnabled] = useState(() => sfx.enabled);
  const [modalSfxVolume, setModalSfxVolume] = useState(() => Math.round(sfx.volume * 100));
  const [modalVoiceEnabled, setModalVoiceEnabled] = useState(() => voice.enabled);
  const [modalVoiceVolume, setModalVoiceVolume] = useState(() => Math.round(voice.volume * 100));

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
      setModalSfxEnabled(sfx.enabled);
      setModalSfxVolume(Math.round(sfx.volume * 100));
      setModalVoiceEnabled(voice.enabled);
      setModalVoiceVolume(Math.round(voice.volume * 100));
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

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      sfx.playClick();
      const csv = await exportLeaderboardCsv();
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadExportFile(csv, `utm_gesture_leaderboard_${dateStr}.csv`, 'text/csv;charset=utf-8;');
      setExportSuccessMsg(
        language === 'bm'
          ? 'Eksport CSV berjaya dimuat turun!'
          : 'CSV export downloaded successfully!'
      );
      setTimeout(() => setExportSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async () => {
    try {
      setIsExporting(true);
      sfx.playClick();
      const json = await exportLeaderboardJson({ includePhotos: includePhotosInExport });
      const dateStr = new Date().toISOString().slice(0, 10);
      const photoSuffix = includePhotosInExport ? '_with_photos' : '_sanitized';
      downloadExportFile(
        json,
        `utm_gesture_leaderboard_${dateStr}${photoSuffix}.json`,
        'application/json'
      );
      setExportSuccessMsg(
        language === 'bm'
          ? 'Eksport JSON berjaya dimuat turun!'
          : 'JSON export downloaded successfully!'
      );
      setTimeout(() => setExportSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to export JSON:', err);
    } finally {
      setIsExporting(false);
    }
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
            data-testid="close-operator-modal"
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
              PIN ini bertujuan mengelakkan akses tidak sengaja oleh pengunjung pameran. Sila rujuk ketua teknikal bertugas jika anda terlupa PIN akses petugas.
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
                  <div className="font-bold">
                    {language === 'bm'
                      ? `Penyertaan: ${submissionsEnabled ? 'Buka' : 'Tutup'}`
                      : `Submissions: ${submissionsEnabled ? 'Open' : 'Closed'}`}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {language === 'bm' ? 'Borang papan pendahulu' : 'Leaderboard form'}
                  </div>
                </div>
              </button>
            </div>

            {/* Audio & Voice Guidance Management */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                  <Volume2 className="w-4 h-4 text-[#7a1636]" />
                  <span>
                    {language === 'bm'
                      ? 'Kawalan Audio & Suara Panduan Acara'
                      : 'Exhibition Audio & Voice Guidance Controls'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      voice.playWelcomeManual('bm');
                    }}
                    className="px-2.5 py-1 rounded-full bg-[#7a1636] text-white text-[10px] font-bold cursor-pointer hover:bg-[#62102b] transition-colors"
                    title="Uji suara Bahasa Melayu"
                  >
                    Uji BM
                  </button>
                  <button
                    onClick={() => {
                      voice.playWelcomeManual('en');
                    }}
                    className="px-2.5 py-1 rounded-full bg-stone-800 text-white text-[10px] font-bold cursor-pointer hover:bg-stone-700 transition-colors"
                    title="Test English voice"
                  >
                    Test EN
                  </button>
                </div>
              </div>

              {/* V3.7: Welcome Narration Operator Trigger (Follows selected language) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-white border border-[#7a1636]/20 shadow-2xs">
                <div>
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>
                      {language === 'bm'
                        ? 'Suara Aluan Pameran (Skrin Utama)'
                        : 'Exhibition Welcome Narration'}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {language === 'bm'
                      ? 'Siarkan penerangan AI apabila kumpulan pelawat baharu tiba'
                      : 'Broadcast AI introduction when a new visitor group arrives'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    data-testid="play-welcome-narration-btn"
                    onClick={() => {
                      voice.playWelcomeManual(language);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7a1636] hover:bg-[#62102b] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-98"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{language === 'bm' ? 'Mainkan Suara Aluan' : 'Play Welcome Narration'}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[9px] text-white/90">W</kbd>
                  </button>

                  <button
                    data-testid="stop-welcome-narration-btn"
                    onClick={() => {
                      voice.stopWelcome();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-98"
                  >
                    <Square className="w-3.5 h-3.5 fill-stone-700 text-stone-700" />
                    <span>{language === 'bm' ? 'Hentikan' : 'Stop Narration'}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-stone-300 font-mono text-[9px] text-stone-700">Shift+W</kbd>
                  </button>
                </div>
              </div>

              {/* SFX Control Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-xs font-semibold text-stone-800">
                    {language === 'bm' ? 'Kesan Bunyi (SFX)' : 'Sound Effects (SFX)'}
                  </span>
                  <button
                    onClick={() => {
                      const next = !modalSfxEnabled;
                      setModalSfxEnabled(next);
                      sfx.setEnabled(next);
                      if (next) sfx.playClick();
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                      modalSfxEnabled
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-stone-100 text-stone-500 border border-stone-300'
                    }`}
                  >
                    {modalSfxEnabled
                      ? language === 'bm'
                        ? 'AKTIF'
                        : 'ACTIVE'
                      : language === 'bm'
                      ? 'SENYAP'
                      : 'MUTED'}
                  </button>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-[11px] font-medium text-stone-500 w-16">
                    {language === 'bm' ? 'Volum SFX:' : 'SFX Vol:'}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={modalSfxVolume}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setModalSfxVolume(val);
                      sfx.setVolume(val / 100);
                    }}
                    className="flex-1 accent-[#7a1636] cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-stone-700 w-8 text-right">
                    {modalSfxVolume}%
                  </span>
                </div>
              </div>

              {/* Voice Narration Control Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-xs font-semibold text-stone-800">
                    {language === 'bm' ? 'Suara Panduan (TTS)' : 'Voice Narration (TTS)'}
                  </span>
                  <button
                    onClick={() => {
                      const next = !modalVoiceEnabled;
                      setModalVoiceEnabled(next);
                      voice.setEnabled(next);
                      sfx.playClick();
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                      modalVoiceEnabled
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-stone-100 text-stone-500 border border-stone-300'
                    }`}
                  >
                    {modalVoiceEnabled
                      ? language === 'bm'
                        ? 'AKTIF'
                        : 'ACTIVE'
                      : language === 'bm'
                      ? 'SENYAP'
                      : 'MUTED'}
                  </button>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-[11px] font-medium text-stone-500 w-16">
                    {language === 'bm' ? 'Volum Suara:' : 'Voice Vol:'}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={modalVoiceVolume}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setModalVoiceVolume(val);
                      voice.setVolume(val / 100);
                    }}
                    className="flex-1 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-stone-700 w-8 text-right">
                    {modalVoiceVolume}%
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-stone-600 flex flex-wrap items-center justify-between gap-1 pt-1">
                <span>
                  {language === 'bm' ? 'Suara Melayu Tempatan: ' : 'Local Malay Voice Pack: '}
                  {voice.hasNativeMalayVoice() ? (
                    <span className="font-bold text-emerald-700">
                      {language === 'bm'
                        ? 'Tersedia (Pertuturan Asli)'
                        : 'Installed (Native Speech)'}
                    </span>
                  ) : (
                    <span className="font-bold text-amber-700">
                      {language === 'bm'
                        ? 'Tiada (Mod Perlindungan: Teks Sahaja)'
                        : 'Not Installed (Safe Subtitle Mode)'}
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-stone-400">
                  {installedVoices.length}{' '}
                  {language === 'bm' ? 'suara sistem dikesan' : 'system voices found'}
                </span>
              </div>
            </div>

            {/* Change Operator PIN */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 mb-2">
                <Key className="w-4 h-4 text-[#7a1636]" />
                <span>
                  {language === 'bm' ? 'Tukar PIN Petugas Acara' : 'Change Operator PIN'}
                </span>
              </div>
              <form onSubmit={handleSaveNewPin} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={8}
                  placeholder={
                    language === 'bm'
                      ? 'PIN Baharu (min. 4 aksara)'
                      : 'New PIN (min. 4 characters)'
                  }
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono bg-white outline-none focus:border-[#7a1636] flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  {language === 'bm' ? 'Simpan PIN' : 'Save PIN'}
                </button>
              </form>
              {pinChangeSuccess && (
                <p className="text-[11px] text-emerald-700 font-bold mt-1.5 animate-fadeIn">
                  {language === 'bm'
                    ? 'PIN petugas berjaya dikemas kini!'
                    : 'Operator PIN successfully updated!'}
                </p>
              )}
            </div>

            {/* Export & Data Privacy Management */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                  <Download className="w-4 h-4 text-[#7a1636]" />
                  <span>
                    {language === 'bm'
                      ? 'Eksport Data Papan Skor (Petugas Sahaja)'
                      : 'Export Leaderboard Data (Operator Only)'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 font-mono text-stone-700">
                  {totalCount} {language === 'bm' ? 'Rekod' : 'Records'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={isExporting || totalCount === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>
                    {language === 'bm' ? 'Eksport CSV (Privasi)' : 'Export CSV (Privacy-safe)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  disabled={isExporting || totalCount === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7a1636] hover:bg-[#62102b] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{language === 'bm' ? 'Eksport JSON' : 'Export JSON'}</span>
                </button>

                <label className="flex items-center gap-2 text-[11px] text-stone-600 cursor-pointer ml-auto select-none">
                  <input
                    type="checkbox"
                    checked={includePhotosInExport}
                    onChange={(e) => setIncludePhotosInExport(e.target.checked)}
                    className="rounded border-stone-300 text-[#7a1636] focus:ring-[#7a1636]"
                  />
                  <span>
                    {language === 'bm'
                      ? 'Sertakan foto peserta (JSON)'
                      : 'Include photos in JSON'}
                  </span>
                </label>
              </div>

              {exportSuccessMsg && (
                <p className="text-[11px] text-emerald-700 font-bold animate-fadeIn">
                  ✓ {exportSuccessMsg}
                </p>
              )}

              {/* Data Isolation & Privacy Notice */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[10.5px] text-amber-900 space-y-1">
                <div className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>
                      {language === 'bm'
                        ? 'Penyimpanan Setempat (IndexedDB):'
                        : 'Local Storage (IndexedDB):'}
                    </strong>{' '}
                    {language === 'bm'
                      ? 'Data tersimpan dalam pelayar pada peranti ini sahaja (Origin Isolated). Sesi localhost tidak bersinkronisasi ke peranti lain atau GitHub Pages.'
                      : 'Data is strictly stored inside this browser origin. Localhost sessions do not sync across devices or to GitHub Pages.'}
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>
                      {language === 'bm' ? 'Pematuhan Privasi:' : 'Privacy Compliance:'}
                    </strong>{' '}
                    {language === 'bm'
                      ? 'Foto peserta adalah sulit. Jangan komit atau muat naik fail eksport yang mengandungi gambar ke repositori GitHub awam.'
                      : 'Participant photos are private. Never commit or push exported files containing photos to public repositories.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Leaderboard Management */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-black text-sm text-stone-900">
                  {language === 'bm'
                    ? `Senarai Rekod (${totalCount} Jumlah)`
                    : `Leaderboard Entries (${totalCount} Total)`}
                </h4>

                {/* Clear All Data */}
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'bm' ? 'Kosongkan Semua' : 'Clear All'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-700 font-bold">
                      {language === 'bm' ? 'Pasti?' : 'Confirm?'}
                    </span>
                    <button
                      onClick={handleClearAll}
                      className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
                    >
                      {language === 'bm' ? 'Ya, Padam' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 text-xs cursor-pointer"
                    >
                      {language === 'bm' ? 'Batal' : 'Cancel'}
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
                    {tab === 'CASUAL'
                      ? t('diffCasual')
                      : tab === 'CHALLENGE'
                      ? t('diffChallenge')
                      : t('diffMaster')}
                  </button>
                ))}
              </div>

              {/* Table of Entries */}
              <div className="rounded-2xl border border-stone-200 overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-600 uppercase text-[10px] tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">{t('participant')}</th>
                      <th className="py-2 px-3">{t('time')}</th>
                      <th className="py-2 px-3">{language === 'bm' ? 'Foto' : 'Photo'}</th>
                      <th className="py-2 px-3 text-right">
                        {language === 'bm' ? 'Tindakan' : 'Action'}
                      </th>
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
