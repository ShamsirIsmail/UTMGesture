// ============================================================
// UTM Gesture Quest V2 — Web Audio Synthesizer
// No external audio files needed — all sounds are synthesized
// ============================================================

export class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private play(fn: (ctx: AudioContext, now: number) => void) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      fn(this.ctx, this.ctx.currentTime);
    } catch {
      // Ignore audio errors
    }
  }

  public playClick() {
    this.play((ctx, now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.09);
    });
  }

  public playHoverTick(progress: number) {
    this.play((ctx, now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340 + progress * 480, now);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.05);
    });
  }

  public playOrbCollect(count: number) {
    this.play((ctx, now) => {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      const shift = 1 + (count - 1) * 0.12;
      notes.forEach((note, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note * shift, now + i * 0.065);
        gain.gain.setValueAtTime(0.12, now + i * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.35);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.065); osc.stop(now + i * 0.065 + 0.36);
      });
    });
  }

  public playCoreCharge(progress: number) {
    this.play((ctx, now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const freq = 300 + progress * 600;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.07);
    });
  }

  public playCoreActivate() {
    this.play((ctx, now) => {
      // Deep bass boom + rising arpeggio
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(80, now);
      bass.frequency.exponentialRampToValueAtTime(40, now + 0.5);
      bassGain.gain.setValueAtTime(0.3, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      bass.connect(bassGain); bassGain.connect(ctx.destination);
      bass.start(now); bass.stop(now + 0.65);

      const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.14, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.07 + 1.0);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 1.05);
      });
    });
  }

  public playGlitchHit() {
    this.play((ctx, now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.25);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.27);
    });
  }

  public playPinchEngage() {
    this.play((ctx, now) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.09);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.1);
    });
  }

  public playVictoryFanfare() {
    this.play((ctx, now) => {
      const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.14, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.09 + 0.85);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.09); osc.stop(now + i * 0.09 + 0.9);
      });
    });
  }
}

// Singleton instance
export const sfx = new SoundEffects();

