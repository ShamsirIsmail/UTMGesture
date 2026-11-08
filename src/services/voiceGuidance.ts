// ============================================================
// UTM Gesture Quest V3.3 — Smarter Bilingual Voice Guidance
// Event-driven, non-repetitive, once-per-phase narration
// Offline SpeechSynthesis with intelligent locale matching & subtitle fallback
// ============================================================

import type { Language } from '../types';

export type VoiceEvent =
  | 'WELCOME'
  | 'CALIBRATION'
  | 'HAND_DETECTED'
  | 'GAMEPLAY_START'
  | 'FINAL_MISSION'
  | 'COMPLETION'
  | 'LEADERBOARD';

export const VOICE_SCRIPTS: Record<VoiceEvent, Record<Language, string>> = {
  WELCOME: {
    bm: 'Selamat datang ke UTM Gesture Quest! Dalam permainan ini, anda boleh bermain menggunakan gerakan tangan. Tekan Mula dan benarkan akses kamera. Gerakkan jari telunjuk untuk mengawal penunjuk di skrin. Rapatkan ibu jari dan jari telunjuk untuk kumpul tenaga dengan lebih pantas. Kumpul semua bola tenaga dan aktifkan teras untuk menyelesaikan misi. Dah sedia? Jom cuba!',
    en: "Welcome to UTM Gesture Quest! In this game, you control the action using your hand movements. Press Start and allow camera access. Move your index finger to control the cursor. Bring your thumb and index finger together to charge energy faster. Collect all the energy orbs and activate the core to complete your mission. Ready? Let's play!",
  },
  CALIBRATION: {
    bm: 'Buka tapak tangan anda di hadapan kamera untuk penentukuran AI.',
    en: 'Please show your hand in front of the camera for AI calibration.',
  },
  HAND_DETECTED: {
    bm: 'Bagus! Tangan anda telah berjaya dikesan.',
    en: 'Great! Your hand has been detected.',
  },
  GAMEPLAY_START: {
    bm: 'Gerakkan jari telunjuk anda untuk kumpul sasaran tenaga.',
    en: 'Move your index finger to collect the energy targets.',
  },
  FINAL_MISSION: {
    bm: 'Misi terakhir! Halakan penunjuk pada teras tenaga untuk aktifkannya.',
    en: 'Final mission! Hold your cursor on the energy core to activate.',
  },
  COMPLETION: {
    bm: 'Tahniah! Anda berjaya habiskan misi!',
    en: 'Congratulations! You have completed the mission!',
  },
  LEADERBOARD: {
    bm: 'Masa anda telah direkodkan ke papan skor. Tahniah!',
    en: 'Your time has been recorded in the leaderboard. Congratulations!',
  },
};

type CaptionListener = (caption: string | null) => void;

class VoiceGuidanceService {
  public enabled: boolean = true;
  public volume: number = 0.9;

  private voices: SpeechSynthesisVoice[] = [];
  private hasSpokenWelcome: boolean = false;
  private hasSpokenCalibration: boolean = false;
  private hasSpokenGameplayStart: boolean = false;
  private hasSpokenFinalMission: boolean = false;
  private hasSpokenCompletion: boolean = false;
  private lastHandDetectedTime: number = 0;
  private lastEventTime: Record<string, number> = {};

  private captionListeners: Set<CaptionListener> = new Set();
  private captionTimer: number | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Load stored preferences
      const storedEnabled = localStorage.getItem('utm_voice_enabled');
      if (storedEnabled !== null) {
        this.enabled = storedEnabled === 'true';
      }
      const storedVol = localStorage.getItem('utm_voice_volume');
      if (storedVol !== null) {
        const parsed = parseFloat(storedVol);
        if (!isNaN(parsed)) this.volume = Math.max(0, Math.min(1, parsed));
      }

      if ('speechSynthesis' in window) {
        this.initVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('utm_voice_enabled', String(val));
    } catch {
      // ignore
    }
    if (!val) {
      this.cancel();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('utm_voice_volume', String(this.volume));
    } catch {
      // ignore
    }
  }

  public subscribeCaption(listener: CaptionListener): () => void {
    this.captionListeners.add(listener);
    return () => this.captionListeners.delete(listener);
  }

  private emitCaption(text: string | null, durationMs = 3800) {
    if (this.captionTimer) {
      clearTimeout(this.captionTimer);
      this.captionTimer = null;
    }
    this.captionListeners.forEach((fn) => fn(text));
    if (text) {
      this.captionTimer = window.setTimeout(() => {
        this.captionListeners.forEach((fn) => fn(null));
        this.captionTimer = null;
      }, durationMs);
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
    return this.voices;
  }

  public hasNativeMalayVoice(): boolean {
    const all = this.getAvailableVoices();
    return all.some(
      (v) =>
        v.lang.toLowerCase().startsWith('ms') ||
        v.name.toLowerCase().includes('malay') ||
        v.name.toLowerCase().includes('malaysia') ||
        v.lang.toLowerCase().startsWith('id') ||
        v.name.toLowerCase().includes('indonesia')
    );
  }

  public findBestVoice(lang: Language): SpeechSynthesisVoice | null {
    const all = this.getAvailableVoices();
    if (!all.length) return null;

    if (lang === 'bm') {
      const msVoice = all.find(
        (v) =>
          v.lang.toLowerCase().startsWith('ms') ||
          v.name.toLowerCase().includes('malay') ||
          v.name.toLowerCase().includes('malaysia')
      );
      if (msVoice) return msVoice;

      const idVoice = all.find(
        (v) =>
          v.lang.toLowerCase().startsWith('id') ||
          v.name.toLowerCase().includes('indonesia')
      );
      if (idVoice) return idVoice;

      // DO NOT return an English voice to read Malay text; return null so we don't phonetic butcher!
      return null;
    }

    // English voices
    const enVoice = all.find(
      (v) =>
        v.lang.toLowerCase().startsWith('en-us') ||
        v.lang.toLowerCase().startsWith('en-gb') ||
        v.lang.toLowerCase().startsWith('en')
    );
    return enVoice || all[0] || null;
  }

  /**
   * Core speaking method with priority, subtitle emission, and voice locale safety
   */
  private speakRaw(text: string, lang: Language) {
    // Always show clean on-screen subtitle caption
    this.emitCaption(text);

    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const voice = this.findBestVoice(lang);
      // Safety rule: if BM selected but no Malay/Indonesian voice exists on laptop,
      // rely on subtitles instead of allowing an English robotic voice to mangle Malay!
      if (lang === 'bm' && !voice) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.volume;
      utterance.rate = 0.95; // Calm, clear pacing
      utterance.pitch = 1.0;

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'en-US';
      }

      this.currentUtterance = utterance;
      utterance.onend = () => { this.currentUtterance = null; };
      utterance.onerror = () => { this.currentUtterance = null; };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  // ============================================================
  // EVENT-DRIVEN NARRATION API (ONCE PER EVENT RULES)
  // ============================================================

  /**
   * V3.7: Manual Welcome Narration for exhibition operators
   * Allows unlimited replays with clean restart and synchronized subtitles
   */
  public playWelcomeManual(lang: Language): boolean {
    const text = VOICE_SCRIPTS.WELCOME[lang];

    // Immediate restart: cancel any playing speech and clear previous subtitle timer
    this.cancel();

    // Emit synchronized caption banner with extended duration (~24 seconds)
    this.emitCaption(text, 24000);

    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    try {
      const voice = this.findBestVoice(lang);
      // If BM selected but no native Malay/Indonesian voice exists, rely on on-screen subtitles
      if (lang === 'bm' && !voice) {
        console.warn('[VoiceGuidance] No native Malay/Indonesian voice found; displaying subtitles only.');
        return false;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.volume;
      utterance.rate = 0.95; // Calm, friendly, exhibition-suited pacing
      utterance.pitch = 1.0;

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'en-US';
      }

      this.currentUtterance = utterance;

      utterance.onend = () => {
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
          this.emitCaption(null);
        }
      };

      utterance.onerror = () => {
        if (this.currentUtterance === utterance) {
          this.currentUtterance = null;
          this.emitCaption(null);
        }
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.warn('Speech synthesis error in playWelcomeManual:', e);
      return false;
    }
  }

  /**
   * V3.7: Stop Welcome Narration immediately & clear subtitles (Shift + W)
   */
  public stopWelcome() {
    this.cancel();
  }

  /** Legacy welcome helper */
  public speakWelcome(lang: Language) {
    if (this.hasSpokenWelcome) return;
    this.hasSpokenWelcome = true;
    this.speakRaw(VOICE_SCRIPTS.WELCOME[lang], lang);
  }

  /** Calibration instructions: plays once when calibration opens */
  public speakCalibration(lang: Language) {
    if (this.hasSpokenCalibration) return;
    this.hasSpokenCalibration = true;
    this.speakRaw(VOICE_SCRIPTS.CALIBRATION[lang], lang);
  }

  /** Hand detected: plays strictly on stable detection with 45s cooldown */
  public speakHandDetected(lang: Language) {
    const now = performance.now();
    if (now - this.lastHandDetectedTime < 45000) return; // 45s cooldown
    this.lastHandDetectedTime = now;
    this.speakRaw(VOICE_SCRIPTS.HAND_DETECTED[lang], lang);
  }

  /** Gameplay start: plays once per round */
  public speakGameplayStart(lang: Language) {
    if (this.hasSpokenGameplayStart) return;
    this.hasSpokenGameplayStart = true;
    this.speakRaw(VOICE_SCRIPTS.GAMEPLAY_START[lang], lang);
  }

  /** Final mission (Future Core): plays once when core activates */
  public speakFinalMission(lang: Language) {
    if (this.hasSpokenFinalMission) return;
    this.hasSpokenFinalMission = true;
    this.speakRaw(VOICE_SCRIPTS.FINAL_MISSION[lang], lang);
  }

  /** Mission complete celebration */
  public speakCompletion(lang: Language) {
    if (this.hasSpokenCompletion) return;
    this.hasSpokenCompletion = true;
    this.speakRaw(VOICE_SCRIPTS.COMPLETION[lang], lang);
  }

  /** Level unlocked announcement */
  public speakLevelUnlocked(diff: string, lang: Language) {
    if (diff === 'CHALLENGE') {
      this.speakRaw(lang === 'bm' ? 'Tahap Cabaran dibuka!' : 'Challenge level unlocked!', lang);
    } else if (diff === 'MASTER') {
      this.speakRaw(lang === 'bm' ? 'Tahap Pakar AI dibuka!' : 'Master AI level unlocked!', lang);
    }
  }

  /** Leaderboard submission */
  public speakLeaderboard(lang: Language) {
    const now = performance.now();
    const last = this.lastEventTime['LEADERBOARD'] || 0;
    if (now - last < 15000) return;
    this.lastEventTime['LEADERBOARD'] = now;
    this.speakRaw(VOICE_SCRIPTS.LEADERBOARD[lang], lang);
  }

  /** Backward-compatible helper that routes legacy calls and silences noisy events */
  public speak(event: VoiceEvent | 'ORB_COLLECTED' | string, lang: Language, delayMs = 0) {
    if (event === 'ORB_COLLECTED') {
      // Intentionally silent per user requirement: SFX only for orb pickups
      return;
    }
    const trigger = () => {
      if (event === 'WELCOME') this.speakWelcome(lang);
      else if (event === 'CALIBRATION') this.speakCalibration(lang);
      else if (event === 'HAND_DETECTED') this.speakHandDetected(lang);
      else if (event === 'GAMEPLAY_START') this.speakGameplayStart(lang);
      else if (event === 'FINAL_MISSION') this.speakFinalMission(lang);
      else if (event === 'COMPLETION') this.speakCompletion(lang);
      else if (event === 'LEADERBOARD') this.speakLeaderboard(lang);
    };

    if (delayMs > 0) {
      setTimeout(trigger, delayMs);
    } else {
      trigger();
    }
  }

  /** Reset per-round flags when a new game begins */
  public resetRound() {
    this.hasSpokenGameplayStart = false;
    this.hasSpokenFinalMission = false;
    this.hasSpokenCompletion = false;
  }

  /** Reset calibration flag when entering calibration */
  public resetCalibration() {
    this.hasSpokenCalibration = false;
  }

  /** Cancel current speech & clear subtitle */
  public cancel() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.emitCaption(null);
  }
}

export const voice = new VoiceGuidanceService();
