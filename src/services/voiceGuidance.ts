// ============================================================
// UTM Gesture Quest V3.1 — Offline Bilingual Voice Guidance
// Uses browser SpeechSynthesis API with installed offline voices
// ============================================================

import type { Language } from '../types';

export type VoiceEvent =
  | 'WELCOME'
  | 'CALIBRATION'
  | 'HAND_DETECTED'
  | 'GAMEPLAY_START'
  | 'ORB_COLLECTED'
  | 'FINAL_MISSION'
  | 'COMPLETION'
  | 'LEADERBOARD';

export interface VoiceMessage {
  text: string;
  lang: Language;
}

export const VOICE_SCRIPTS: Record<VoiceEvent, Record<Language, string>> = {
  WELCOME: {
    bm: 'Selamat datang ke UTM Gesture Quest! Bersedia untuk bermain?',
    en: 'Welcome to UTM Gesture Quest! Are you ready to play?',
  },
  CALIBRATION: {
    bm: 'Sila tunjukkan tangan anda di hadapan kamera.',
    en: 'Please show your hand to the camera.',
  },
  HAND_DETECTED: {
    bm: 'Bagus! Tangan anda berjaya dikesan.',
    en: 'Great! Your hand has been detected.',
  },
  GAMEPLAY_START: {
    bm: 'Gerakkan jari anda untuk mengumpul tenaga.',
    en: 'Move your finger to collect the energy.',
  },
  ORB_COLLECTED: {
    bm: 'Syabas! Tenaga berjaya dikumpul.',
    en: 'Well done! Energy collected.',
  },
  FINAL_MISSION: {
    bm: 'Misi terakhir! Aktifkan teras tenaga.',
    en: 'Final mission! Activate the energy core.',
  },
  COMPLETION: {
    bm: 'Tahniah! Anda berjaya menyelesaikan misi!',
    en: 'Congratulations! You have completed the mission!',
  },
  LEADERBOARD: {
    bm: 'Masa anda telah direkodkan. Tahniah!',
    en: 'Your time has been recorded. Congratulations!',
  },
};

type CaptionListener = (caption: string | null) => void;

class VoiceGuidanceService {
  public enabled: boolean = true;
  public volume: number = 0.9;
  private voices: SpeechSynthesisVoice[] = [];
  private lastEventTime: Record<string, number> = {};
  private captionListeners: Set<CaptionListener> = new Set();
  private captionTimer: number | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  public subscribeCaption(listener: CaptionListener): () => void {
    this.captionListeners.add(listener);
    return () => this.captionListeners.delete(listener);
  }

  private emitCaption(text: string | null, durationMs = 3500) {
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

  public findBestVoice(lang: Language): SpeechSynthesisVoice | null {
    const all = this.getAvailableVoices();
    if (!all.length) return null;

    if (lang === 'bm') {
      // 1. Exact Malay locale
      const msVoice = all.find(
        (v) =>
          v.lang.toLowerCase().startsWith('ms') ||
          v.name.toLowerCase().includes('malay') ||
          v.name.toLowerCase().includes('malaysia')
      );
      if (msVoice) return msVoice;

      // 2. Closely related Indonesian voice (sounds natural for Malay)
      const idVoice = all.find(
        (v) =>
          v.lang.toLowerCase().startsWith('id') ||
          v.name.toLowerCase().includes('indonesia')
      );
      if (idVoice) return idVoice;
    }

    // English voices
    const enVoice = all.find(
      (v) =>
        v.lang.toLowerCase().startsWith('en-us') ||
        v.lang.toLowerCase().startsWith('en-gb') ||
        v.lang.toLowerCase().startsWith('en')
    );
    if (enVoice) return enVoice;

    return all[0] || null;
  }

  public speak(event: VoiceEvent, lang: Language, cooldownMs = 2500) {
    const text = VOICE_SCRIPTS[event]?.[lang];
    if (!text) return;

    // Cooldown check to avoid spamming the same event
    const now = performance.now();
    const last = this.lastEventTime[event] || 0;
    if (now - last < cooldownMs) return;
    this.lastEventTime[event] = now;

    // Always show caption even if voice is disabled or voice synthesis fails
    this.emitCaption(text);

    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      // Cancel previous speech to prevent overlapping narration
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.volume;
      utterance.rate = 0.95; // Clear exhibition pace
      utterance.pitch = 1.0;

      const voice = this.findBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = lang === 'bm' ? 'ms-MY' : 'en-US';
      }

      this.currentUtterance = utterance;
      utterance.onend = () => {
        this.currentUtterance = null;
      };
      utterance.onerror = () => {
        this.currentUtterance = null;
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public cancel() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.emitCaption(null);
  }
}

export const voice = new VoiceGuidanceService();

