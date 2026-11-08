// ============================================================
// UTM Gesture Quest V3.3 — Web Audio Synthesizer
// Clean synthesized SFX with volume scaling & persistence
// ============================================================

export class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.8;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('utm_sfx_enabled');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
      const storedVol = localStorage.getItem('utm_sfx_volume');
      if (storedVol !== null) {
        const parsed = parseFloat(storedVol);
        if (!isNaN(parsed)) this.volume = Math.max(0, Math.min(1, parsed));
      }
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('utm_sfx_enabled', String(val));
    } catch {
      // ignore
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('utm_sfx_volume', String(this.volume));
    } catch {
      // ignore
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private play(fn: (ctx: AudioContext, now: number, masterGain: number) => void) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      fn(this.ctx, this.ctx.currentTime, this.volume);
    } catch {
      // Ignore audio errors
    }
  }

  public playClick() {
    this.play((ctx, now, vol) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
      gain.gain.setValueAtTime(0.08 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.09);
    });
  }

  public playHoverTick(progress: number) {
    this.play((ctx, now, vol) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340 + progress * 480, now);
      gain.gain.setValueAtTime(0.025 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.05);
    });
  }

  public playOrbCollect(count: number) {
    this.play((ctx, now, vol) => {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      const shift = 1 + (count - 1) * 0.12;
      notes.forEach((note, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note * shift, now + i * 0.065);
        gain.gain.setValueAtTime(0.12 * vol, now + i * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.35);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.065); osc.stop(now + i * 0.065 + 0.36);
      });
    });
  }

  public playCoreCharge(progress: number) {
    this.play((ctx, now, vol) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const freq = 300 + progress * 600;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.07);
    });
  }

  public playCoreActivate() {
    this.play((ctx, now, vol) => {
      // Deep bass boom + rising arpeggio
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(80, now);
      bass.frequency.exponentialRampToValueAtTime(40, now + 0.5);
      bassGain.gain.setValueAtTime(0.3 * vol, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      bass.connect(bassGain); bassGain.connect(ctx.destination);
      bass.start(now); bass.stop(now + 0.65);

      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + 0.15 + i * 0.07);
        gain.gain.setValueAtTime(0.15 * vol, now + 0.15 + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.07 + 0.5);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + 0.15 + i * 0.07); osc.stop(now + 0.15 + i * 0.07 + 0.55);
      });
    });
  }

  public playGlitchHit() {
    this.play((ctx, now, vol) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.28);
      gain.gain.setValueAtTime(0.25 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.3);
    });
  }

  public playPinchEngage() {
    this.play((ctx, now, vol) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.09 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.11);
    });
  }

  public playVictoryFanfare() {
    this.play((ctx, now, vol) => {
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.12 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 1.25);
      });
    });
  }
}

export const sfx = new SoundEffects();
