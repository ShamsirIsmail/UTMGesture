import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Camera,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Home,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MousePointer,
  Hand,
  Gamepad2,
  Award,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Info,
  XCircle,
  Zap,
  ShieldAlert,
  Timer,
  Flame,
  Target,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type ScreenState = 'WELCOME' | 'PERMISSION' | 'HOW_TO_PLAY' | 'GAMEPLAY' | 'COMPLETE';
type ControlMode = 'CAMERA' | 'MOUSE';
type DifficultyLevel = 'CASUAL' | 'CHALLENGE' | 'MASTER';

interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  malaySubtitle: string;
  badgeColor: string;
  starCount: number;
  sequential: boolean;
  starSpeed: number;
  evasiveFactor: number;
  dwellSeconds: number;
  hitRadiusPct: number;
  glitchCount: number;
  description: string;
}

const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  CASUAL: {
    id: 'CASUAL',
    label: 'Casual',
    malaySubtitle: 'Kanak-kanak & Warga Emas',
    badgeColor: 'from-emerald-500 to-teal-700 border-emerald-300/50',
    starCount: 3,
    sequential: false,
    starSpeed: 0.35,
    evasiveFactor: 0,
    dwellSeconds: 0.95,
    hitRadiusPct: 11.0,
    glitchCount: 0,
    description: '3 gently drifting stars in any order. No hazards—ideal for young children & senior visitors.',
  },
  CHALLENGE: {
    id: 'CHALLENGE',
    label: 'Challenge',
    malaySubtitle: 'Cabaran Pameran Standard',
    badgeColor: 'from-amber-500 to-orange-700 border-amber-300/60',
    starCount: 5,
    sequential: true,
    starSpeed: 1.0,
    evasiveFactor: 0.35,
    dwellSeconds: 1.15,
    hitRadiusPct: 9.2,
    glitchCount: 2,
    description: '5 moving stars in strict #1–#5 order + 2 patrolling Red Glitch Drones. Pinch fingers for 2× lock speed!',
  },
  MASTER: {
    id: 'MASTER',
    label: 'Master AI',
    malaySubtitle: 'Belia & Gamers Tegar',
    badgeColor: 'from-rose-500 to-purple-800 border-rose-300/60',
    starCount: 6,
    sequential: true,
    starSpeed: 1.55,
    evasiveFactor: 0.85,
    dwellSeconds: 1.25,
    hitRadiusPct: 8.2,
    glitchCount: 3,
    description: '6 fast, evasive stars in #1–#6 order + 3 fast Glitch Drones. Requires sharp tracking & Pinch Boost!',
  },
};

interface StarItem {
  id: number;
  orderNumber: number;
  /** Base anchor Percentage X (0 to 100) */
  baseX: number;
  /** Base anchor Percentage Y (0 to 100) */
  baseY: number;
  /** Current live Percentage X (0 to 100) within the playfield */
  x: number;
  /** Current live Percentage Y (0 to 100) within the playfield */
  y: number;
  /** Orbital / sinusoidal phase offset */
  phaseX: number;
  phaseY: number;
  ampX: number;
  ampY: number;
  freqX: number;
  freqY: number;
  collected: boolean;
  /** Dwell progress from 0 to 1 */
  progress: number;
  /** Timestamp when collected for burst animations */
  collectedAt?: number;
}

interface GlitchOrb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radiusPct: number;
}

interface Point2D {
  x: number; // Normalized 0..1 across playfield
  y: number; // Normalized 0..1 across playfield
}

interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

// Standard 21-point MediaPipe Hand Connections for skeleton drawing
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb (4 is tip)
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index finger (8 is tip)
  [5, 9], [9, 10], [10, 11], [11, 12],  // Middle finger
  [9, 13], [13, 14], [14, 15], [15, 16],// Ring finger
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky & Palm
];

// Helper to build dynamic stars for a selected difficulty
function createStarsForDifficulty(diff: DifficultyLevel): StarItem[] {
  const cfg = DIFFICULTY_CONFIGS[diff];
  const presets: { x: number; y: number; ax: number; ay: number; fx: number; fy: number }[] = [
    { x: 34, y: 52, ax: 7, ay: 10, fx: 1.1, fy: 1.5 },
    { x: 56, y: 34, ax: 10, ay: 8, fx: 1.4, fy: 1.1 },
    { x: 80, y: 54, ax: 8, ay: 11, fx: 1.2, fy: 1.6 },
    { x: 44, y: 68, ax: 9, ay: 7, fx: 1.6, fy: 1.3 },
    { x: 70, y: 36, ax: 8, ay: 9, fx: 1.3, fy: 1.7 },
    { x: 58, y: 64, ax: 11, ay: 8, fx: 1.5, fy: 1.2 },
  ];

  return presets.slice(0, cfg.starCount).map((p, idx) => ({
    id: idx + 1,
    orderNumber: idx + 1,
    baseX: p.x,
    baseY: p.y,
    x: p.x,
    y: p.y,
    phaseX: idx * 1.3,
    phaseY: idx * 2.1,
    ampX: p.ax,
    ampY: p.ay,
    freqX: p.fx,
    freqY: p.fy,
    collected: false,
    progress: 0,
  }));
}

// Helper to spawn patrolling Red AI Glitch Drones
function createGlitchesForDifficulty(diff: DifficultyLevel): GlitchOrb[] {
  const cfg = DIFFICULTY_CONFIGS[diff];
  const templates: GlitchOrb[] = [
    { id: 1, x: 46, y: 45, vx: 11 * cfg.starSpeed, vy: 8.5 * cfg.starSpeed, radiusPct: 5.5 },
    { id: 2, x: 68, y: 55, vx: -12.5 * cfg.starSpeed, vy: 9.5 * cfg.starSpeed, radiusPct: 5.5 },
    { id: 3, x: 54, y: 30, vx: 10 * cfg.starSpeed, vy: -11.5 * cfg.starSpeed, radiusPct: 5.5 },
  ];
  return templates.slice(0, cfg.glitchCount);
}

// ============================================================================
// WEB AUDIO API SOUND SYNTHESIZER (No external audio files needed)
// ============================================================================

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = false; // Muted by default per exhibition requirement

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playClick() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.085);
    } catch {
      // Ignore audio errors
    }
  }

  public playHoverTick(progress: number) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const freq = 340 + progress * 480;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignore
    }
  }

  public playStarCollect(starCount: number) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const baseNotes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const pitchShift = 1 + (starCount - 1) * 0.12;
      baseNotes.forEach((note, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note * pitchShift, now + idx * 0.065);
        gain.gain.setValueAtTime(0.12, now + idx * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.36);
      });
    } catch {
      // Ignore
    }
  }

  public playGlitchHit() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.linearRampToValueAtTime(95, now + 0.25);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.27);
    } catch {
      // Ignore
    }
  }

  public playPinchEngage() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.09);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  public playVictoryFanfare() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.14, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.09 + 0.85);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.9);
      });
    } catch {
      // Ignore
    }
  }
}

const sfx = new SoundEffects();

// ============================================================================
// CUSTOM SVG ILLUSTRATIONS & DECORATIVE COMPONENTS
// ============================================================================

/**
 * Clean, respectful UTM Typographic Emblem Placeholder
 * Follows user requirement: Never invent or distort the official university crest.
 */
const UtmBrandBadge: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  if (size === 'lg') {
    return (
      <div className="inline-flex flex-col items-center select-none">
        <div className="flex items-center gap-4 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#2b0714]/90 via-[#4a0e24]/95 to-[#2b0714]/90 border border-[#f5b942]/45 shadow-[0_0_35px_rgba(245,185,66,0.22)]">
          {/* Dignified Academic Seal Monogram Placeholder */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f5b942] via-[#d99326] to-[#8c5308] p-0.5 shadow-inner flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#3d091c] flex flex-col items-center justify-center border border-[#ffd166]/60">
              <span className="text-[11px] font-black tracking-widest text-[#ffd166] leading-none">UTM</span>
              <span className="text-[7px] uppercase tracking-tighter text-[#f5b942]/80 mt-0.5">MALAYSIA</span>
            </div>
          </div>
          <div className="text-left">
            <div className="text-4xl sm:text-5xl font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#f5b942] to-[#d48b19] drop-shadow">
              UTM
            </div>
            <div className="text-xs sm:text-sm font-medium tracking-[0.16em] text-amber-100/90 uppercase -mt-1">
              Universiti Teknologi Malaysia
            </div>
          </div>
        </div>
        <div className="mt-2 text-[11px] tracking-[0.25em] uppercase text-[#f5b942]/80 font-medium">
          Kerana Tuhan Untuk Manusia
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#2a0817]/90 border border-[#f5b942]/35 shadow-[0_0_15px_rgba(245,185,66,0.12)] select-none">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f5b942] to-[#b57310] flex items-center justify-center text-[#2a0817] font-black text-[9px] tracking-tighter shadow">
        UTM
      </div>
      <div className="flex flex-col text-left">
        <span className="text-xs font-serif font-extrabold tracking-wider text-[#ffd166] leading-none">
          UTM
        </span>
        <span className="text-[9px] tracking-wider text-amber-100/75 leading-tight">
          Universiti Teknologi Malaysia
        </span>
      </div>
    </div>
  );
};

/**
 * Illustrated AI Gesture Robot Car (Tribute on Welcome Screen left corner)
 */
const AiRobotCarIllustration: React.FC = () => (
  <svg viewBox="0 0 260 190" className="w-full h-full drop-shadow-[0_12px_25px_rgba(0,0,0,0.65)]">
    <defs>
      <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#84cc16" />
        <stop offset="100%" stopColor="#3f6212" />
      </linearGradient>
      <linearGradient id="wheelGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
      <linearGradient id="sensorMetallic" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <radialGradient id="sonarPulse" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Wireless AI Signal Waves */}
    <circle cx="135" cy="40" r="28" fill="url(#sonarPulse)" className="animate-ping" style={{ animationDuration: '3s' }} />
    <path d="M 115 32 Q 135 15 155 32" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
    <path d="M 105 22 Q 135 0 165 22" fill="none" stroke="#f5b942" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />

    {/* Shadow */}
    <ellipse cx="130" cy="168" rx="92" ry="12" fill="rgba(0,0,0,0.55)" />

    {/* Back Wheel */}
    <ellipse cx="62" cy="130" rx="22" ry="28" fill="#18181b" stroke="#27272a" strokeWidth="4" />
    <ellipse cx="62" cy="130" rx="13" ry="18" fill="url(#wheelGold)" />
    <circle cx="62" cy="130" r="5" fill="#1e293b" />

    {/* Lower Acrylic Chassis */}
    <polygon points="45,122 185,134 225,112 85,100" fill="url(#chassisGrad)" stroke="#bef264" strokeWidth="1.5" />

    {/* Microcontroller & Motor Driver Board */}
    <rect x="82" y="75" width="75" height="32" rx="4" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" transform="skewY(5)" />
    {/* LED Indicators */}
    <circle cx="96" cy="90" r="3" fill="#22c55e" className="animate-pulse" />
    <circle cx="106" cy="91" r="3" fill="#ef4444" className="animate-pulse" />
    <circle cx="116" cy="92" r="3" fill="#f5b942" />

    {/* Jumper Wires */}
    <path d="M 110 82 Q 125 50 155 68" fill="none" stroke="#ef4444" strokeWidth="2.5" />
    <path d="M 118 82 Q 135 45 162 68" fill="none" stroke="#eab308" strokeWidth="2.5" />
    <path d="M 126 82 Q 145 52 170 68" fill="none" stroke="#3b82f6" strokeWidth="2.5" />

    {/* Upper Deck */}
    <polygon points="65,98 195,110 230,90 100,78" fill="url(#chassisGrad)" stroke="#d9f99d" strokeWidth="1.5" />

    {/* Ultrasonic Sensor PCB (HC-SR04) */}
    <rect x="145" y="54" width="68" height="30" rx="4" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.5" transform="rotate(6 179 69)" />
    {/* Left Ultrasonic Eye */}
    <circle cx="163" cy="68" r="13" fill="url(#sensorMetallic)" stroke="#cbd5e1" strokeWidth="2" />
    <circle cx="163" cy="68" r="8" fill="#0f172a" />
    <circle cx="163" cy="68" r="5" fill="#334155" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
    {/* Right Ultrasonic Eye */}
    <circle cx="195" cy="71" r="13" fill="url(#sensorMetallic)" stroke="#cbd5e1" strokeWidth="2" />
    <circle cx="195" cy="71" r="8" fill="#0f172a" />
    <circle cx="195" cy="71" r="5" fill="#334155" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />

    {/* Front Left Wheel */}
    <ellipse cx="132" cy="144" rx="24" ry="30" fill="#09090b" stroke="#27272a" strokeWidth="4" />
    <ellipse cx="132" cy="144" rx="15" ry="20" fill="url(#wheelGold)" />
    <circle cx="132" cy="144" r="6" fill="#18181b" />

    {/* Front Right Wheel */}
    <ellipse cx="212" cy="128" rx="20" ry="26" fill="#09090b" stroke="#27272a" strokeWidth="3.5" />
    <ellipse cx="212" cy="128" rx="12" ry="17" fill="url(#wheelGold)" />
  </svg>
);

/**
 * Animated AI Wireframe Hand Illustration (Welcome Screen right corner)
 */
const WireframeHandIllustration: React.FC = () => {
  const nodes = [
    { x: 100, y: 185 }, // 0: Wrist
    { x: 62, y: 162 }, { x: 42, y: 138 }, { x: 28, y: 115 }, { x: 18, y: 95 }, // 1-4: Thumb
    { x: 75, y: 112 }, { x: 68, y: 78 }, { x: 64, y: 50 }, { x: 60, y: 24 },   // 5-8: Index (8 is tip)
    { x: 98, y: 106 }, { x: 98, y: 68 }, { x: 98, y: 40 }, { x: 98, y: 15 },   // 9-12: Middle
    { x: 122, y: 112 }, { x: 128, y: 78 }, { x: 132, y: 52 }, { x: 136, y: 28 }, // 13-16: Ring
    { x: 144, y: 125 }, { x: 156, y: 98 }, { x: 165, y: 76 }, { x: 173, y: 56 }, // 17-20: Pinky
  ];

  return (
    <svg viewBox="0 0 200 210" className="w-full h-full overflow-visible drop-shadow-[0_0_20px_rgba(245,185,66,0.35)]">
      <defs>
        <linearGradient id="wireGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Subtle Mesh Triangulation Lines */}
      <g stroke="rgba(253, 224, 71, 0.22)" strokeWidth="1">
        <line x1={nodes[0].x} y1={nodes[0].y} x2={nodes[9].x} y2={nodes[9].y} />
        <line x1={nodes[0].x} y1={nodes[0].y} x2={nodes[13].x} y2={nodes[13].y} />
        <line x1={nodes[1].x} y1={nodes[1].y} x2={nodes[5].x} y2={nodes[5].y} />
        <line x1={nodes[5].x} y1={nodes[5].y} x2={nodes[13].x} y2={nodes[13].y} />
        <line x1={nodes[9].x} y1={nodes[9].y} x2={nodes[17].x} y2={nodes[17].y} />
      </g>

      {/* Main Skeleton Connections */}
      <g stroke="url(#wireGlow)" strokeWidth="2.4" strokeLinecap="round">
        {HAND_CONNECTIONS.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
          />
        ))}
      </g>

      {/* Highlighted Index Fingertip (Landmark 8) Target Ring */}
      <circle
        cx={nodes[8].x}
        cy={nodes[8].y}
        r="14"
        fill="none"
        stroke="#f5b942"
        strokeWidth="2"
        strokeDasharray="4 3"
        className="animate-spin"
        style={{ transformOrigin: `${nodes[8].x}px ${nodes[8].y}px`, animationDuration: '6s' }}
      />
      <circle
        cx={nodes[8].x}
        cy={nodes[8].y}
        r="8"
        fill="rgba(245, 185, 66, 0.35)"
        className="animate-ping"
        style={{ animationDuration: '2s' }}
      />

      {/* 21 Landmark Nodes */}
      {nodes.map((pt, idx) => {
        const isIndexTip = idx === 8;
        return (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r={isIndexTip ? 5.5 : 3.8}
            fill={isIndexTip ? '#ffd166' : '#4ade80'}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
};

/**
 * Stylized UTM Campus Gate / Archway & Digital Grid Horizon at bottom of Gameplay Screen
 */
const UtmArchwayHorizon: React.FC = () => (
  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden select-none z-0">
    <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b0a20" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#12040d" stopOpacity="0.98" />
        </linearGradient>
        <linearGradient id="gridGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#f5b942" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="archPillars" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f3d5b5" />
          <stop offset="100%" stopColor="#8a4b5c" />
        </linearGradient>
      </defs>

      {/* Distant Mountain Silhouettes */}
      <polygon points="0,170 220,65 460,155 740,55 1020,150 1260,75 1440,160 1440,220 0,220" fill="url(#mountainGrad)" />
      <polygon points="140,175 410,95 650,165 920,85 1190,170 1440,115 1440,220 0,220" fill="#230614" opacity="0.7" />

      {/* Digital Wave Grid Lines */}
      <g stroke="url(#gridGlow)" strokeWidth="1" fill="none">
        <path d="M 0,195 Q 360,155 720,195 T 1440,195" />
        <path d="M 0,208 Q 360,168 720,208 T 1440,208" />
        <path d="M 0,182 Q 360,145 720,182 T 1440,182" />
        {/* Perspective grid rays */}
        <line x1="720" y1="145" x2="180" y2="220" />
        <line x1="720" y1="145" x2="380" y2="220" />
        <line x1="720" y1="145" x2="560" y2="220" />
        <line x1="720" y1="145" x2="720" y2="220" />
        <line x1="720" y1="145" x2="880" y2="220" />
        <line x1="720" y1="145" x2="1060" y2="220" />
        <line x1="720" y1="145" x2="1260" y2="220" />
      </g>

      {/* Center Stylized UTM Grand Archway Silhouette */}
      <g transform="translate(565, 92)">
        {/* Base Platform */}
        <rect x="10" y="108" width="290" height="14" rx="2" fill="#4a152b" />
        {/* 4 Pillars */}
        <rect x="36" y="48" width="18" height="60" fill="url(#archPillars)" />
        <rect x="86" y="48" width="18" height="60" fill="url(#archPillars)" />
        <rect x="206" y="48" width="18" height="60" fill="url(#archPillars)" />
        <rect x="256" y="48" width="18" height="60" fill="url(#archPillars)" />
        {/* Main Header Beam */}
        <polygon points="15,48 295,48 282,22 28,22" fill="#d69f7e" stroke="#f5b942" strokeWidth="1" />
        <rect x="65" y="10" width="180" height="26" rx="3" fill="#e6be9a" stroke="#7f1d1d" strokeWidth="1.5" />
        {/* UTM Text on Archway */}
        <text x="155" y="28" textAnchor="middle" fill="#4a0e24" fontFamily="serif" fontWeight="900" fontSize="15" letterSpacing="3">
          UTM
        </text>
      </g>
    </svg>
  </div>
);

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Navigation, Difficulty & Mode State
  const [screen, setScreen] = useState<ScreenState>('WELCOME');
  const [controlMode, setControlMode] = useState<ControlMode>('CAMERA');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('CHALLENGE');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Camera & MediaPipe State
  const [cameraStatus, setCameraStatus] = useState<'IDLE' | 'LOADING' | 'READY' | 'ERROR'>('IDLE');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string>('');
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [isPinching, setIsPinching] = useState<boolean>(false);

  // Gameplay State
  const [stars, setStars] = useState<StarItem[]>(() => createStarsForDifficulty('CHALLENGE'));
  const [glitches, setGlitches] = useState<GlitchOrb[]>(() => createGlitchesForDifficulty('CHALLENGE'));
  const [cursorPos, setCursorPos] = useState<Point2D>({ x: 0.5, y: 0.5 });
  const [activeHoverStarId, setActiveHoverStarId] = useState<number | null>(null);

  // Live Challenge Metrics
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [glitchHits, setGlitchHits] = useState<number>(0);
  const [shieldAlertFlash, setShieldAlertFlash] = useState<boolean>(false);

  // Refs for real-time animation loop & MediaPipe instances
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handLandmarkerRef = useRef<any>(null);
  const rafIdRef = useRef<number | null>(null);

  // Mutable tracking coordinates for smooth 60fps LERP without React re-render lag
  const rawTargetPosRef = useRef<Point2D>({ x: 0.5, y: 0.5 });
  const smoothedPosRef = useRef<Point2D>({ x: 0.5, y: 0.5 });
  const handDetectedRef = useRef<boolean>(false);
  const isPinchingRef = useRef<boolean>(false);
  const starsRef = useRef<StarItem[]>(createStarsForDifficulty('CHALLENGE'));
  const glitchesRef = useRef<GlitchOrb[]>(createGlitchesForDifficulty('CHALLENGE'));
  const difficultyRef = useRef<DifficultyLevel>('CHALLENGE');
  const gameStartTimeRef = useRef<number>(performance.now());
  const lastFrameTimeRef = useRef<number>(performance.now());
  const lastHoverSoundTimeRef = useRef<number>(0);
  const lastGlitchHitTimeRef = useRef<number>(0);
  const latestLandmarksRef = useRef<LandmarkPoint[] | null>(null);

  // Sync difficultyRef
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  // Toggle Audio
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      sfx.enabled = next;
      if (next) sfx.playClick();
      return next;
    });
  }, []);

  // Fullscreen Toggle
  const toggleFullscreen = useCallback(() => {
    sfx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Stop Webcam Stream cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Reset stars, glitches, and metrics for a fresh round
  const resetGameStars = useCallback((customDiff?: DifficultyLevel) => {
    const activeDiff = customDiff || difficultyRef.current;
    const freshStars = createStarsForDifficulty(activeDiff);
    const freshGlitches = createGlitchesForDifficulty(activeDiff);
    starsRef.current = freshStars;
    glitchesRef.current = freshGlitches;
    setStars(freshStars);
    setGlitches(freshGlitches);
    setActiveHoverStarId(null);
    setElapsedSeconds(0);
    setComboCount(0);
    setMaxCombo(0);
    setGlitchHits(0);
    setShieldAlertFlash(false);
    gameStartTimeRef.current = performance.now();
  }, []);

  // Change difficulty level cleanly
  const selectDifficulty = useCallback(
    (newDiff: DifficultyLevel) => {
      sfx.playClick();
      difficultyRef.current = newDiff;
      setDifficulty(newDiff);
      resetGameStars(newDiff);
    },
    [resetGameStars]
  );

  // Initialize MediaPipe HandLandmarker + Browser Webcam
  const initializeCameraAndMediaPipe = useCallback(async () => {
    sfx.playClick();
    setCameraStatus('LOADING');
    setCameraErrorMsg('');

    try {
      // 1. Request Browser Webcam Stream
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not available in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      // 2. Load MediaPipe Tasks Vision dynamically from CDN if not already initialized
      if (!handLandmarkerRef.current) {
        // Dynamic ESM import from official jsDelivr CDN so no local install is required
        const visionModule = await import(
          /* webpackIgnore: true */
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/+esm'
        );
        const { FilesetResolver, HandLandmarker } = visionModule;

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
        setModelLoaded(true);
      }

      setControlMode('CAMERA');
      setCameraStatus('READY');
      setScreen('HOW_TO_PLAY');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to access webcam or load AI hand-tracking model.';
      setCameraStatus('ERROR');
      setCameraErrorMsg(
        message.includes('Permission') || message.includes('NotAllowedError')
          ? 'Camera permission was denied or blocked by the browser preview sandbox. You can allow camera access in your browser bar or test immediately using Mouse Preview Mode.'
          : `${message} — If you are viewing inside a restricted preview sandbox, click "Switch to Mouse Preview Mode" below to test the full game.`
      );
    }
  }, []);

  // Activate Mouse Preview Mode directly
  const activateMousePreviewMode = useCallback(
    (targetScreen: ScreenState = 'HOW_TO_PLAY') => {
      sfx.playClick();
      setControlMode('MOUSE');
      handDetectedRef.current = true;
      setHandDetected(true);
      setScreen(targetScreen);
    },
    []
  );

  // Attach webcam stream to the HUD <video> element whenever we enter GAMEPLAY in CAMERA mode
  useEffect(() => {
    if (screen === 'GAMEPLAY' && controlMode === 'CAMERA' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [screen, controlMode]);

  // Global Keyboard Shortcuts for Exhibition Operator (R = Restart, 1/2/3 = Difficulty, Esc/H = Home, M = Mode Toggle, F = Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        sfx.playClick();
        resetGameStars();
        setScreen('GAMEPLAY');
      } else if (e.key === '1') {
        selectDifficulty('CASUAL');
      } else if (e.key === '2') {
        selectDifficulty('CHALLENGE');
      } else if (e.key === '3') {
        selectDifficulty('MASTER');
      } else if (e.key === 'Escape' || e.key === 'h' || e.key === 'H') {
        sfx.playClick();
        resetGameStars();
        setScreen('WELCOME');
      } else if (e.key === 'm' || e.key === 'M') {
        sfx.playClick();
        setControlMode((prev) => {
          const next = prev === 'CAMERA' ? 'MOUSE' : 'CAMERA';
          if (next === 'MOUSE') {
            handDetectedRef.current = true;
            setHandDetected(true);
          } else if (!streamRef.current) {
            setScreen('PERMISSION');
          }
          return next;
        });
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGameStars, selectDifficulty, toggleFullscreen]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [stopCameraStream]);

  // ============================================================================
  // HUD SKELETON DRAWING HELPER (Draws 21 Landmarks + Pinch Boost Line)
  // ============================================================================
  const drawHudCanvas = useCallback(
    (landmarks: LandmarkPoint[] | null, isMouseMode: boolean, pinching: boolean) => {
      const canvas = hudCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      let pts: LandmarkPoint[] = [];

      if (isMouseMode) {
        const cx = rawTargetPosRef.current.x;
        const cy = rawTargetPosRef.current.y;
        const dx = (cx - 0.5) * 0.35;
        const dy = (cy - 0.5) * 0.35;

        const thumbTipX = pinching ? 0.31 : 0.13;
        const thumbTipY = pinching ? 0.14 : 0.45;

        const template: [number, number][] = [
          [0.5, 0.86], // 0: wrist
          [0.33, 0.76], [0.24, 0.65], [0.21, 0.38], [thumbTipX, thumbTipY], // thumb (4)
          [0.39, 0.52], [0.36, 0.36], [0.34, 0.23], [0.32, 0.11], // index (8)
          [0.49, 0.49], [0.49, 0.32], [0.49, 0.19], [0.49, 0.08], // middle
          [0.59, 0.52], [0.62, 0.36], [0.64, 0.24], [0.66, 0.13], // ring
          [0.69, 0.58], [0.74, 0.46], [0.78, 0.35], [0.82, 0.26], // pinky
        ];
        pts = template.map(([tx, ty]) => ({
          x: Math.min(0.95, Math.max(0.05, tx + dx)),
          y: Math.min(0.95, Math.max(0.05, ty + dy)),
        }));
      } else if (landmarks && landmarks.length >= 21) {
        pts = landmarks.map((lm) => ({
          x: 1 - lm.x,
          y: lm.y,
        }));
      }

      if (pts.length === 0) return;

      // Draw Connector Bones
      ctx.strokeStyle = pinching ? 'rgba(253, 224, 71, 0.95)' : 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';

      HAND_CONNECTIONS.forEach(([i, j]) => {
        const p1 = pts[i];
        const p2 = pts[j];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
          ctx.stroke();
        }
      });

      // Draw Laser Connection between Thumb Tip (4) and Index Tip (8)
      const thumbTip = pts[4];
      const indexTip = pts[8];
      if (thumbTip && indexTip) {
        ctx.beginPath();
        ctx.moveTo(thumbTip.x * w, thumbTip.y * h);
        ctx.lineTo(indexTip.x * w, indexTip.y * h);
        ctx.strokeStyle = pinching ? '#38bdf8' : 'rgba(245, 185, 66, 0.45)';
        ctx.lineWidth = pinching ? 3.5 : 1.5;
        ctx.setLineDash(pinching ? [] : [3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw 21 Nodes + Highlight on Landmark 4 (Thumb) & Landmark 8 (Index)
      pts.forEach((p, idx) => {
        const px = p.x * w;
        const py = p.y * h;
        const isIndexTip = idx === 8;
        const isThumbTip = idx === 4;

        if (isIndexTip) {
          ctx.beginPath();
          ctx.arc(px, py, pinching ? 13 : 10, 0, Math.PI * 2);
          ctx.strokeStyle = pinching ? '#38bdf8' : '#ffd166';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(px, py, isIndexTip || isThumbTip ? 5.5 : 3.8, 0, Math.PI * 2);
        ctx.fillStyle = isIndexTip
          ? pinching
            ? '#38bdf8'
            : '#f5b942'
          : isThumbTip
          ? '#fbbf24'
          : '#22c55e';
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });
    },
    []
  );

  // ============================================================================
  // MAIN GAMEPLAY LOOP (Moving Stars + Glitch Drones + Pinch 2x Boost + Dwell)
  // ============================================================================
  useEffect(() => {
    if (screen !== 'GAMEPLAY') {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    let lastVideoTime = -1;
    lastFrameTimeRef.current = performance.now();
    gameStartTimeRef.current = performance.now();

    const updateGameplayLoop = (now: number) => {
      const dt = Math.min(0.1, (now - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = now;

      const cfg = DIFFICULTY_CONFIGS[difficultyRef.current];
      const elapsedSec = (now - gameStartTimeRef.current) / 1000;
      setElapsedSeconds(elapsedSec);

      // 1. Detect Hand Landmarks & Pinch Gesture if in CAMERA mode
      if (controlMode === 'CAMERA') {
        const video = videoRef.current;
        const landmarker = handLandmarkerRef.current;

        if (video && landmarker && video.readyState >= 2) {
          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            try {
              const results = landmarker.detectForVideo(video, now);
              if (results.landmarks && results.landmarks.length > 0) {
                const hand = results.landmarks[0];
                latestLandmarksRef.current = hand;

                // Landmark 8 = Index Fingertip, Landmark 4 = Thumb Tip
                const indexTip = hand[8];
                const thumbTip = hand[4];
                if (indexTip) {
                  const mirroredX = 1 - indexTip.x;
                  const clampedX = Math.min(0.98, Math.max(0.02, (mirroredX - 0.08) / 0.84));
                  const clampedY = Math.min(0.98, Math.max(0.02, (indexTip.y - 0.08) / 0.84));
                  rawTargetPosRef.current = { x: clampedX, y: clampedY };
                }

                // Detect Pinch (Thumb tip #4 close to Index tip #8)
                if (indexTip && thumbTip) {
                  const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
                  const nowPinching = pinchDist < 0.068;
                  if (nowPinching !== isPinchingRef.current) {
                    isPinchingRef.current = nowPinching;
                    setIsPinching(nowPinching);
                    if (nowPinching) sfx.playPinchEngage();
                  }
                }

                if (!handDetectedRef.current) {
                  handDetectedRef.current = true;
                  setHandDetected(true);
                }
              } else {
                latestLandmarksRef.current = null;
                if (handDetectedRef.current) {
                  handDetectedRef.current = false;
                  setHandDetected(false);
                }
                if (isPinchingRef.current) {
                  isPinchingRef.current = false;
                  setIsPinching(false);
                }
              }
            } catch {
              // Ignore transient frame detection errors
            }
          }
        }
        drawHudCanvas(latestLandmarksRef.current, false, isPinchingRef.current);
      } else {
        // MOUSE PREVIEW MODE
        if (!handDetectedRef.current) {
          handDetectedRef.current = true;
          setHandDetected(true);
        }
        drawHudCanvas(null, true, isPinchingRef.current);
      }

      // 2. Smooth Cursor Movement (LERP)
      const lerpFactor = controlMode === 'CAMERA' ? 0.24 : 0.38;
      smoothedPosRef.current = {
        x: smoothedPosRef.current.x + (rawTargetPosRef.current.x - smoothedPosRef.current.x) * lerpFactor,
        y: smoothedPosRef.current.y + (rawTargetPosRef.current.y - smoothedPosRef.current.y) * lerpFactor,
      };
      setCursorPos({ ...smoothedPosRef.current });

      const cursorPctX = smoothedPosRef.current.x * 100;
      const cursorPctY = smoothedPosRef.current.y * 100;
      const isTrackingActive = controlMode === 'MOUSE' || handDetectedRef.current;

      // 3. Update Patrolling Red AI Glitch Drones & Check Collision
      let hitGlitchThisFrame = false;
      if (glitchesRef.current.length > 0) {
        const nextGlitches = glitchesRef.current.map((g) => {
          let nx = g.x + g.vx * dt;
          let ny = g.y + g.vy * dt;
          let nvx = g.vx;
          let nvy = g.vy;

          // Keep Glitch Drones inside active playfield bounds (avoiding left HUD)
          if (nx < 27 || nx > 92) {
            nvx = -nvx;
            nx = Math.min(92, Math.max(27, nx));
          }
          if (ny < 18 || ny > 78) {
            nvy = -nvy;
            ny = Math.min(78, Math.max(18, ny));
          }

          if (isTrackingActive && now - lastGlitchHitTimeRef.current > 1100) {
            const gDist = Math.hypot(cursorPctX - nx, (cursorPctY - ny) * 0.78);
            if (gDist <= g.radiusPct) {
              hitGlitchThisFrame = true;
            }
          }

          return { ...g, x: nx, y: ny, vx: nvx, vy: nvy };
        });

        glitchesRef.current = nextGlitches;
        setGlitches(nextGlitches);
      }

      if (hitGlitchThisFrame) {
        lastGlitchHitTimeRef.current = now;
        sfx.playGlitchHit();
        setGlitchHits((prev) => prev + 1);
        setComboCount(0);
        setShieldAlertFlash(true);
        setTimeout(() => setShieldAlertFlash(false), 550);
      }

      // 4. Determine Next Required Sequence Order Number (if sequential mode)
      const uncollectedStars = starsRef.current.filter((s) => !s.collected);
      const nextRequiredOrder =
        cfg.sequential && uncollectedStars.length > 0
          ? Math.min(...uncollectedStars.map((s) => s.orderNumber))
          : null;

      // 5. Update Star Orbital Motion, Evasion & Hover Dwell Progress
      let newlyCollectedCount = 0;
      let currentlyHoveringId: number | null = null;
      const chargeMultiplier = isPinchingRef.current ? 1.85 : 1.0;

      const updatedStars = starsRef.current.map((star) => {
        if (star.collected) return star;

        // Calculate smooth figure-8 / orbital trajectory
        const t = elapsedSec * cfg.starSpeed;
        let nextX =
          star.baseX +
          Math.sin(t * star.freqX + star.phaseX) * star.ampX * (cfg.starSpeed > 0.5 ? 1 : 0.45);
        let nextY =
          star.baseY +
          Math.cos(t * star.freqY + star.phaseY) * star.ampY * (cfg.starSpeed > 0.5 ? 1 : 0.45);

        // Subtle evasive drift when cursor approaches in Challenge/Master modes
        const dxToCursor = nextX - cursorPctX;
        const dyToCursor = nextY - cursorPctY;
        const distToCursor = Math.hypot(dxToCursor, dyToCursor * 0.75);

        if (cfg.evasiveFactor > 0 && distToCursor < 16 && distToCursor > 0.5) {
          const push = ((16 - distToCursor) / 16) * 4.2 * cfg.evasiveFactor;
          nextX += (dxToCursor / distToCursor) * push;
          nextY += (dyToCursor / distToCursor) * push;
        }

        // Clamp inside comfortable playfield area
        nextX = Math.min(91, Math.max(27, nextX));
        nextY = Math.min(77, Math.max(20, nextY));

        // If hit by a Glitch Drone this frame, drain star lock progress
        if (hitGlitchThisFrame) {
          return { ...star, x: nextX, y: nextY, progress: Math.max(0, star.progress - 0.55) };
        }

        // Check if this star is currently unlocked for collection
        const isUnlockedTarget =
          !cfg.sequential || star.orderNumber === nextRequiredOrder;

        if (!isTrackingActive || !isUnlockedTarget) {
          const decayed = Math.max(0, star.progress - dt * 2.2);
          return { ...star, x: nextX, y: nextY, progress: decayed };
        }

        const hitDist = Math.hypot(cursorPctX - nextX, (cursorPctY - nextY) * 0.75);

        if (hitDist <= cfg.hitRadiusPct) {
          currentlyHoveringId = star.id;
          const nextProgress = Math.min(
            1,
            star.progress + (dt / cfg.dwellSeconds) * chargeMultiplier
          );

          if (now - lastHoverSoundTimeRef.current > 105) {
            lastHoverSoundTimeRef.current = now;
            sfx.playHoverTick(nextProgress);
          }

          if (nextProgress >= 1) {
            const totalCollected =
              starsRef.current.filter((s) => s.collected).length + 1;
            newlyCollectedCount = totalCollected;
            return {
              ...star,
              x: nextX,
              y: nextY,
              collected: true,
              progress: 1,
              collectedAt: now,
            };
          }

          return { ...star, x: nextX, y: nextY, progress: nextProgress };
        } else {
          // Decay slower so moving stars feel fair and rewarding to track
          const decayed = Math.max(0, star.progress - dt * 1.15);
          return { ...star, x: nextX, y: nextY, progress: decayed };
        }
      });

      setActiveHoverStarId(currentlyHoveringId);
      starsRef.current = updatedStars;
      setStars(updatedStars);

      if (newlyCollectedCount > 0) {
        sfx.playStarCollect(newlyCollectedCount);
        setComboCount((prev) => {
          const nextCombo = prev + 1;
          setMaxCombo((m) => Math.max(m, nextCombo));
          return nextCombo;
        });

        if (newlyCollectedCount >= cfg.starCount) {
          setTimeout(() => {
            sfx.playVictoryFanfare();
            setScreen('COMPLETE');
          }, 600);
        }
      }

      rafIdRef.current = requestAnimationFrame(updateGameplayLoop);
    };

    rafIdRef.current = requestAnimationFrame(updateGameplayLoop);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [screen, controlMode, drawHudCanvas]);

  // Handle Mouse Movement & Mouse Click Pinch Simulation in Mouse Preview Mode
  const handlePlayfieldMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (controlMode !== 'MOUSE' || !playfieldRef.current) return;
    const rect = playfieldRef.current.getBoundingClientRect();
    const normX = Math.min(0.98, Math.max(0.02, (e.clientX - rect.left) / rect.width));
    const normY = Math.min(0.98, Math.max(0.02, (e.clientY - rect.top) / rect.height));
    rawTargetPosRef.current = { x: normX, y: normY };
  };

  const handlePlayfieldMouseDown = () => {
    if (controlMode !== 'MOUSE') return;
    isPinchingRef.current = true;
    setIsPinching(true);
    sfx.playPinchEngage();
  };

  const handlePlayfieldMouseUp = () => {
    if (controlMode !== 'MOUSE') return;
    isPinchingRef.current = false;
    setIsPinching(false);
  };

  // Handle Touch Movement for touchscreen laptops
  const handlePlayfieldTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (controlMode !== 'MOUSE' || !playfieldRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = playfieldRef.current.getBoundingClientRect();
    const normX = Math.min(0.98, Math.max(0.02, (touch.clientX - rect.left) / rect.width));
    const normY = Math.min(0.98, Math.max(0.02, (touch.clientY - rect.top) / rect.height));
    rawTargetPosRef.current = { x: normX, y: normY };
  };

  const currentDiffConfig = DIFFICULTY_CONFIGS[difficulty];
  const collectedStarsCount = stars.filter((s) => s.collected).length;
  const uncollectedOrderNums = stars.filter((s) => !s.collected).map((s) => s.orderNumber);
  const nextTargetNumber =
    currentDiffConfig.sequential && uncollectedOrderNums.length > 0
      ? Math.min(...uncollectedOrderNums)
      : null;

  // Calculate Performance Rank for Mission Complete Screen
  const getPerformanceRank = () => {
    if (glitchHits === 0 && elapsedSeconds <= currentDiffConfig.starCount * 4.2) {
      return {
        grade: 'S',
        title: 'AI Grandmaster',
        malay: 'Tahap Kecemerlangan Tertinggi!',
        color: 'from-[#fffbeb] via-[#fde047] to-[#f59e0b]',
      };
    }
    if (glitchHits <= 2 && elapsedSeconds <= currentDiffConfig.starCount * 6.5) {
      return {
        grade: 'A',
        title: 'Cyber Navigator',
        malay: 'Pencapaian Cemerlang!',
        color: 'from-sky-200 via-cyan-400 to-blue-500',
      };
    }
    return {
      grade: 'B',
      title: 'Future Explorer',
      malay: 'Syabas! Teruskan Mencuba!',
      color: 'from-amber-200 via-orange-400 to-amber-600',
    };
  };

  const rankInfo = getPerformanceRank();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="relative w-full h-screen min-h-[640px] overflow-hidden bg-[#080b1a] text-white font-sans select-none flex flex-col justify-between">
      {/* ====================================================================
          ATMOSPHERIC BACKGROUND (Deep Navy, UTM Maroon Glows & Star Particles)
         ==================================================================== */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Radial Maroon & Gold Ambient Glows */}
        <div
          className="absolute -top-28 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full opacity-55 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #6b132f 0%, #3b0819 55%, transparent 100%)',
          }}
        />
        <div
          className="absolute bottom-[-160px] left-1/2 -translate-x-1/2 w-[1200px] h-[500px] rounded-full opacity-65 blur-[130px]"
          style={{
            background: 'radial-gradient(circle, #7a1636 0%, #42091c 60%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-1/3 right-[-120px] w-[420px] h-[420px] rounded-full opacity-25 blur-[110px]"
          style={{
            background: 'radial-gradient(circle, #f5b942 0%, transparent 75%)',
          }}
        />

        {/* Twinkling Background Starfield */}
        <div className="absolute inset-0 opacity-70">
          {[
            { top: '12%', left: '18%', size: 2, delay: '0s' },
            { top: '22%', left: '78%', size: 3, delay: '1.2s' },
            { top: '16%', left: '46%', size: 2, delay: '0.5s' },
            { top: '38%', left: '12%', size: 2.5, delay: '2.1s' },
            { top: '44%', left: '88%', size: 2, delay: '0.9s' },
            { top: '65%', left: '24%', size: 3, delay: '1.7s' },
            { top: '58%', left: '68%', size: 2, delay: '0.3s' },
            { top: '28%', left: '33%', size: 1.5, delay: '1.5s' },
            { top: '14%', left: '91%', size: 2.5, delay: '2.4s' },
            { top: '72%', left: '82%', size: 2, delay: '0.7s' },
          ].map((s, idx) => (
            <span
              key={idx}
              className="absolute rounded-full bg-amber-200 animate-pulse"
              style={{
                top: s.top,
                left: s.left,
                width: `${s.size}px`,
                height: `${s.size}px`,
                animationDelay: s.delay,
                boxShadow: '0 0 8px #ffd166',
              }}
            />
          ))}
        </div>
      </div>

      {/* ====================================================================
          TOP EXHIBITION HEADER & CONTROLS BAR
         ==================================================================== */}
      <header className="relative z-30 w-full px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#090c1d]/75 backdrop-blur-md">
        {/* Left: UTM Brand Badge & Event Programme Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sfx.playClick();
              resetGameStars();
              setScreen('WELCOME');
            }}
            className="hover:opacity-90 transition-opacity focus:outline-none"
            title="Return to Welcome Screen (Esc)"
          >
            <UtmBrandBadge size="sm" />
          </button>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-amber-100/80">
            <Sparkles className="w-3.5 h-3.5 text-[#f5b942]" />
            <span>Ziarah Kasih dan Cakna Komuniti • 10 Nov 2026</span>
          </div>
        </div>

        {/* Center: Difficulty Selector Pills (1: Casual, 2: Challenge, 3: Master) */}
        <div className="flex items-center rounded-full bg-[#150819]/90 border border-white/15 p-0.5 text-xs">
          {(['CASUAL', 'CHALLENGE', 'MASTER'] as DifficultyLevel[]).map((lvl, i) => {
            const cfg = DIFFICULTY_CONFIGS[lvl];
            const active = difficulty === lvl;
            return (
              <button
                key={lvl}
                onClick={() => selectDifficulty(lvl)}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  active
                    ? `bg-gradient-to-r ${cfg.badgeColor} text-white shadow`
                    : 'text-white/60 hover:text-white'
                }`}
                title={`${cfg.description} (Shortcut: ${i + 1})`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Right: Mode Indicator + Quick Switch, Audio & Fullscreen Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Interactive Mode Switcher Pill */}
          <div className="flex items-center rounded-full bg-[#1a0b1e]/90 border border-[#f5b942]/35 p-0.5 text-xs">
            <button
              onClick={() => {
                sfx.playClick();
                if (streamRef.current && handLandmarkerRef.current) {
                  setControlMode('CAMERA');
                } else {
                  setScreen('PERMISSION');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
                controlMode === 'CAMERA'
                  ? 'bg-gradient-to-r from-[#8c193f] to-[#61102b] text-white shadow-[0_0_12px_rgba(244,63,94,0.4)] border border-rose-400/40'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Use real webcam with MediaPipe AI Hand Tracking"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">AI Camera</span>
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                setControlMode('MOUSE');
                handDetectedRef.current = true;
                setHandDetected(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
                controlMode === 'MOUSE'
                  ? 'bg-gradient-to-r from-amber-500/80 to-amber-600/80 text-slate-950 font-semibold shadow-[0_0_12px_rgba(245,185,66,0.45)]'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Test all screens with mouse movement (Shortcut: M)"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mouse Mode</span>
            </button>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
              soundEnabled
                ? 'bg-amber-500/20 border-[#f5b942]/60 text-[#ffd166]'
                : 'bg-white/5 border-white/15 text-white/65 hover:text-white hover:bg-white/10'
            }`}
            title={soundEnabled ? 'Mute Audio' : 'Enable Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#f5b942]" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all"
            title="Toggle Fullscreen Exhibition Mode (Shortcut: F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ====================================================================
          MAIN SCREEN CONTAINER
         ==================================================================== */}
      <main className="relative z-20 flex-1 flex items-center justify-center w-full overflow-hidden">
        {/* ------------------------------------------------------------------
            SCREEN 1: WELCOME SCREEN
           ------------------------------------------------------------------ */}
        {screen === 'WELCOME' && (
          <div className="relative w-full h-full max-w-7xl mx-auto px-6 py-6 flex flex-col items-center justify-center">
            {/* Center Hero Content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
              {/* Top UTM Emblem */}
              <div className="mb-4">
                <UtmBrandBadge size="md" />
              </div>

              {/* Decorative Star-Trail Arc around Title */}
              <div className="relative px-6 py-2">
                <svg
                  viewBox="0 0 500 160"
                  className="pointer-events-none absolute -inset-x-6 -inset-y-4 w-[calc(100%+48px)] h-[calc(100%+32px)] overflow-visible"
                >
                  <defs>
                    <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f5b942" stopOpacity="0" />
                      <stop offset="50%" stopColor="#ffd166" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#f5b942" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 35,125 C 10,45 360,-15 470,40"
                    fill="none"
                    stroke="url(#arcGrad)"
                    strokeWidth="2.2"
                  />
                  <path
                    d="M 465,35 C 495,115 140,165 30,120"
                    fill="none"
                    stroke="url(#arcGrad)"
                    strokeWidth="1.8"
                  />
                  {/* Sparkle star on top right of arc */}
                  <polygon
                    points="430,18 434,28 445,30 434,33 430,44 426,33 415,30 426,28"
                    fill="#fffbeb"
                    className="animate-pulse"
                  />
                  {/* Sparkle star on bottom left of arc */}
                  <polygon
                    points="65,122 68,130 76,132 68,135 65,143 62,135 54,132 62,130"
                    fill="#fde047"
                    className="animate-pulse"
                  />
                </svg>

                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black italic tracking-tight leading-none">
                  <span className="block text-transparent bg-clip-text bg-gradient-to-b from-[#fff3c4] via-[#f5b942] to-[#d98218] drop-shadow-[0_4px_24px_rgba(245,185,66,0.45)]">
                    UTM
                  </span>
                  <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-b from-white via-[#fff5d6] to-[#f3c66f] drop-shadow-[0_6px_28px_rgba(255,255,255,0.28)]">
                    Gesture Quest
                  </span>
                </h1>
              </div>

              {/* Tagline & Subtitle */}
              <p className="mt-3 text-xl sm:text-2xl font-semibold text-[#ffd166] tracking-wide drop-shadow">
                Unlock the Future
              </p>
              <p className="mt-1.5 text-sm sm:text-base text-amber-100/85 font-medium tracking-wide">
                Experience AI Through Your Hands • A hand gesture game powered by AI
              </p>

              {/* Primary Start Game CTA Button (Matching Maroon Pill Reference) */}
              <div className="mt-7 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => {
                    sfx.playClick();
                    if (controlMode === 'MOUSE') {
                      setScreen('HOW_TO_PLAY');
                    } else if (cameraStatus === 'READY' && streamRef.current) {
                      setScreen('HOW_TO_PLAY');
                    } else {
                      setScreen('PERMISSION');
                    }
                  }}
                  className="group relative inline-flex items-center justify-center gap-3 px-11 py-4 rounded-full bg-gradient-to-b from-[#b51f49] via-[#851435] to-[#590b22] text-white font-bold text-lg sm:text-xl tracking-wide border-2 border-[#f47296]/60 shadow-[0_0_35px_rgba(225,29,72,0.55),inset_0_2px_6px_rgba(255,255,255,0.35)] hover:scale-105 hover:shadow-[0_0_45px_rgba(245,185,66,0.65)] active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-white text-white group-hover:translate-x-0.5 transition-transform" />
                  <span>Start Game</span>
                </button>

                <button
                  onClick={() => activateMousePreviewMode('HOW_TO_PLAY')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/5 hover:bg-white/15 border border-[#f5b942]/40 text-amber-200 text-sm font-medium transition-all cursor-pointer"
                >
                  <MousePointer className="w-4 h-4 text-[#f5b942]" />
                  <span>Quick Test (Mouse Mode)</span>
                </button>
              </div>

              {/* Key Features Mini Strip */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-amber-100/75">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#f5b942]" />
                  <span>Real-time Hand Tracking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-[#f5b942]" />
                  <span>Interactive AI Mini-Game</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#f5b942]" />
                  <span>Easy &amp; Fun for All Ages</span>
                </div>
              </div>
            </div>

            {/* Bottom-Left Showcase Element: Tribute to the AI Gesture-Controlled Robot Car */}
            <div className="hidden lg:flex flex-col items-start absolute left-6 bottom-5 w-64 p-3.5 rounded-2xl bg-[#180716]/80 border border-[#f5b942]/25 backdrop-blur-md shadow-xl">
              <div className="w-full h-36 -mt-8">
                <AiRobotCarIllustration />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Cpu className="w-4 h-4 text-lime-400 shrink-0" />
                <span className="text-xs font-bold text-amber-200 tracking-wide">
                  AI Gesture Robot Companion
                </span>
              </div>
              <p className="text-[11px] text-white/65 leading-snug mt-1">
                Showcased alongside our physical AI Gesture-Controlled Robot Car at Ziarah Kasih &amp; Cakna Komuniti.
              </p>
            </div>

            {/* Bottom-Right Showcase Element: Animated Wireframe Hand Illustration */}
            <div className="hidden lg:flex flex-col items-center absolute right-8 bottom-4 w-56 pointer-events-none">
              <div className="w-48 h-52">
                <WireframeHandIllustration />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[11px] text-emerald-300 font-medium">
                MediaPipe 21-Point Hand AI
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            SCREEN 3: HOW TO PLAY (INSTRUCTION & DIFFICULTY SELECTION SCREEN)
           ------------------------------------------------------------------ */}
        {screen === 'HOW_TO_PLAY' && (
          <div className="w-full max-w-5xl mx-auto px-6 py-4">
            <div className="rounded-3xl bg-gradient-to-b from-[#260919]/90 via-[#160612]/95 to-[#0f040c]/95 border border-[#f47296]/35 p-6 sm:p-8 shadow-[0_0_55px_rgba(133,20,53,0.4)] backdrop-blur-xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#4a0e24] border border-[#f5b942]/40">
                    <Gamepad2 className="w-7 h-7 text-[#ffd166]" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                      How to Play &amp; Select Difficulty
                    </h2>
                    <p className="text-xs text-amber-200/80">
                      Choose a challenge level for the participant
                    </p>
                  </div>
                </div>

                {/* Difficulty Tier Selector Cards */}
                <div className="flex items-center gap-2 bg-[#160510] p-1.5 rounded-2xl border border-white/15">
                  {(['CASUAL', 'CHALLENGE', 'MASTER'] as DifficultyLevel[]).map((lvl) => {
                    const cfg = DIFFICULTY_CONFIGS[lvl];
                    const isSelected = difficulty === lvl;
                    return (
                      <button
                        key={lvl}
                        onClick={() => selectDifficulty(lvl)}
                        className={`px-4 py-2 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? `bg-gradient-to-r ${cfg.badgeColor} text-white shadow-lg border`
                            : 'text-white/65 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-extrabold leading-none">
                          {cfg.label}
                        </div>
                        <div className="text-[10px] opacity-85 mt-0.5">{cfg.malaySubtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Difficulty Summary Banner */}
              <div className="mb-6 px-4 py-3 rounded-2xl bg-white/5 border border-[#f5b942]/30 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-amber-100">
                  <Target className="w-4 h-4 text-[#ffd166] shrink-0" />
                  <span>
                    <strong className="text-[#ffd166]">{currentDiffConfig.label} Mode:</strong>{' '}
                    {currentDiffConfig.description}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-[#ffd166] text-xs font-bold">
                  {currentDiffConfig.starCount} Moving Stars • {currentDiffConfig.glitchCount} Glitch Drones
                </span>
              </div>

              {/* 3 Step Instruction Cards with Arrows */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch relative">
                {/* Step 1 */}
                <div className="relative flex flex-col items-center text-center p-5 rounded-2xl bg-[#2a0c1d]/80 border border-white/15 hover:border-[#f5b942]/50 transition-all">
                  <div className="w-20 h-20 mb-3 flex items-center justify-center rounded-2xl bg-[#160610] border border-white/10">
                    <svg viewBox="0 0 100 100" className="w-14 h-14">
                      <path
                        d="M32,78 C24,70 22,55 22,46 C22,42 26,42 27,46 L30,55 L34,25 C34,20 40,20 40,25 L41,50 L47,18 C48,13 54,13 54,18 L53,50 L60,22 C61,17 67,18 66,23 L63,53 L71,34 C73,30 78,32 76,37 L67,66 C64,75 56,82 44,82 Z"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                      <circle cx="34" cy="24" r="4.5" fill="#f5b942" />
                      <circle cx="24" cy="45" r="4.5" fill="#38bdf8" />
                      <line x1="24" y1="45" x2="34" y2="24" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />
                    </svg>
                  </div>
                  <div className="text-base font-bold text-white">
                    <span className="text-[#f5b942] mr-1.5">1</span>
                    Track &amp; Pinch Boost
                  </div>
                  <p className="mt-1 text-xs text-amber-100/80">
                    Point your index finger to steer.{' '}
                    <strong className="text-sky-300">Pinch thumb &amp; index finger</strong> (or hold Left Click) for{' '}
                    <strong className="text-[#ffd166]">2× Turbo Lock!</strong>
                  </p>

                  <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#3d091c] border border-[#f5b942]/50 items-center justify-center text-[#ffd166]">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex flex-col items-center text-center p-5 rounded-2xl bg-[#2a0c1d]/80 border border-white/15 hover:border-[#f5b942]/50 transition-all">
                  <div className="w-20 h-20 mb-3 flex items-center justify-center rounded-2xl bg-[#160610] border border-white/10">
                    <svg viewBox="0 0 100 100" className="w-14 h-14">
                      <circle
                        cx="50"
                        cy="50"
                        r="34"
                        fill="none"
                        stroke="#f5b942"
                        strokeWidth="3.5"
                        strokeDasharray="16 8"
                        className="animate-spin"
                        style={{ transformOrigin: '50px 50px', animationDuration: '8s' }}
                      />
                      <polygon
                        points="50,24 58,40 75,42 62,54 65,71 50,62 35,71 38,54 25,42 42,40"
                        fill="#ffd166"
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                      <text x="50" y="55" textAnchor="middle" fill="#3b0819" fontWeight="900" fontSize="16">
                        #1
                      </text>
                    </svg>
                  </div>
                  <div className="text-base font-bold text-white">
                    <span className="text-[#f5b942] mr-1.5">2</span>
                    Follow Moving Stars in Order
                  </div>
                  <p className="mt-1 text-xs text-amber-100/80">
                    {currentDiffConfig.sequential
                      ? `Keep your cursor inside the moving target star (#1 → #${currentDiffConfig.starCount}) until the golden ring fills!`
                      : 'Keep your cursor inside any of the 3 drifting stars for 1 second to collect them!'}
                  </p>

                  <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[#3d091c] border border-[#f5b942]/50 items-center justify-center text-[#ffd166]">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-[#2a0c1d]/80 border border-white/15 hover:border-[#f5b942]/50 transition-all">
                  <div className="w-20 h-20 mb-3 flex items-center justify-center rounded-2xl bg-[#160610] border border-white/10">
                    <svg viewBox="0 0 100 100" className="w-14 h-14">
                      <circle cx="50" cy="50" r="26" fill="rgba(244,63,94,0.25)" stroke="#f43f5e" strokeWidth="3" strokeDasharray="8 5" />
                      <polygon points="50,28 70,50 50,72 30,50" fill="#e11d48" stroke="#fda4af" strokeWidth="2" />
                      <circle cx="50" cy="50" r="6" fill="#fff1f2" />
                    </svg>
                  </div>
                  <div className="text-base font-bold text-white">
                    <span className="text-[#f5b942] mr-1.5">3</span>
                    Dodge Red AI Glitch Orbs!
                  </div>
                  <p className="mt-1 text-xs text-amber-100/80">
                    {currentDiffConfig.glitchCount > 0
                      ? 'Avoid patrolling Red Glitch Drones! Touching one drains your lock meter and resets your combo.'
                      : 'Casual mode has zero Glitch Drones—enjoy a relaxed, stress-free AI hand experience!'}
                  </p>
                </div>
              </div>

              {/* Play Now Button */}
              <div className="mt-7 flex flex-col items-center">
                <button
                  onClick={() => {
                    sfx.playClick();
                    resetGameStars();
                    setScreen('GAMEPLAY');
                  }}
                  className="inline-flex items-center justify-center gap-3 px-12 py-4 rounded-full bg-gradient-to-b from-[#b51f49] via-[#851435] to-[#590b22] text-white font-bold text-xl border-2 border-[#f47296]/60 shadow-[0_0_35px_rgba(225,29,72,0.55),inset_0_2px_6px_rgba(255,255,255,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-white" />
                  <span>Start {currentDiffConfig.label} Mission</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            SCREEN 4: MAIN GAMEPLAY SCREEN
           ------------------------------------------------------------------ */}
        {screen === 'GAMEPLAY' && (
          <div
            ref={playfieldRef}
            onMouseMove={handlePlayfieldMouseMove}
            onMouseDown={handlePlayfieldMouseDown}
            onMouseUp={handlePlayfieldMouseUp}
            onTouchMove={handlePlayfieldTouchMove}
            className="relative w-full h-full overflow-hidden cursor-none"
          >
            {/* Red Shield Alert Flash when hitting a Glitch Orb */}
            {shieldAlertFlash && (
              <div className="pointer-events-none absolute inset-0 z-40 bg-rose-600/25 border-4 border-rose-500 animate-pulse flex items-center justify-center">
                <div className="px-6 py-2.5 rounded-full bg-rose-950/90 border border-rose-400 text-rose-200 font-black tracking-wider uppercase text-sm flex items-center gap-2 shadow-2xl">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span>AI Glitch Interference! Combo Reset!</span>
                </div>
              </div>
            )}

            {/* Bottom Stylized UTM Archway & Digital Grid Horizon */}
            <UtmArchwayHorizon />

            {/* Top Center Instruction & Next Target Banner */}
            <div className="relative z-20 pt-3 flex flex-col items-center justify-center pointer-events-none">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-[#2b091c]/90 via-[#4a0e24]/90 to-[#2b091c]/90 border border-[#f47296]/45 shadow-[0_0_25px_rgba(225,29,72,0.35)] backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-[#ffd166] animate-pulse" />
                <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {nextTargetNumber !== null
                    ? `Track Moving Star #${nextTargetNumber} in Order!`
                    : 'Collect All Drifting Stars!'}
                </span>
                {isPinching && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/30 border border-sky-300 text-sky-200 text-xs font-extrabold animate-pulse">
                    <Zap className="w-3.5 h-3.5 fill-sky-300" />
                    2× TURBO LOCK
                  </span>
                )}
              </div>
            </div>

            {/* Top Right Score, Timer & Combo HUD Pills */}
            <div className="absolute top-3 right-6 z-20 flex items-center gap-2.5 pointer-events-none">
              {/* Combo Pill */}
              {comboCount > 1 && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500/20 border border-amber-400/50 text-[#ffd166] font-black text-sm shadow-lg animate-bounce">
                  <Flame className="w-4 h-4 fill-amber-400 text-orange-500" />
                  <span>{comboCount}× COMBO</span>
                </div>
              )}

              {/* Live Stopwatch Pill */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#13091f]/90 border border-white/20 text-amber-100 font-mono text-sm">
                <Timer className="w-4 h-4 text-[#f5b942]" />
                <span>{elapsedSeconds.toFixed(1)}s</span>
              </div>

              {/* Stars Counter Pill */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#13091f]/90 border border-white/25 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#ffd166] text-[#f59e0b]">
                  <polygon points="12,2 15,9 22,9.5 16.5,14.5 18,22 12,18 6,22 7.5,14.5 2,9.5 9,9" />
                </svg>
                <span className="text-xl sm:text-2xl font-extrabold tracking-wider text-white">
                  {collectedStarsCount} / {currentDiffConfig.starCount}
                </span>
              </div>
            </div>

            {/* Left HUD Card: Webcam Hand Tracking Preview + Landmark Skeleton Overlay */}
            <div className="absolute left-4 sm:left-6 top-16 sm:top-20 z-20 w-56 sm:w-64 rounded-2xl bg-[#130a1e]/90 border border-white/20 p-3.5 shadow-[0_12px_35px_rgba(0,0,0,0.65)] backdrop-blur-lg">
              {/* HUD Card Header */}
              <div className="flex items-center justify-between mb-2.5 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      controlMode === 'CAMERA'
                        ? handDetected
                          ? 'bg-emerald-400 animate-ping'
                          : 'bg-amber-400'
                        : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span
                    className={`w-2.5 h-2.5 rounded-full -ml-4 ${
                      controlMode === 'CAMERA'
                        ? handDetected
                          ? 'bg-emerald-400'
                          : 'bg-amber-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    {controlMode === 'CAMERA' ? 'Hand Tracking' : 'Mouse Preview Mode'}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-amber-200">
                  {currentDiffConfig.label}
                </span>
              </div>

              {/* Video + 21-Landmark Canvas Container */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#1e162b] border border-white/15">
                {controlMode === 'CAMERA' ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-end p-2 bg-gradient-to-b from-[#251536] to-[#140a1f] text-center">
                    <span className="text-[10px] text-amber-200/75 bg-black/40 px-2 py-0.5 rounded-full">
                      Move mouse • Hold Left Click = 2× Pinch
                    </span>
                  </div>
                )}

                {/* Overlaid 21-Point Hand Skeleton Canvas */}
                <canvas
                  ref={hudCanvasRef}
                  width={240}
                  height={180}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </div>

              {/* Gesture & Pinch Status Pills */}
              <div className="mt-2.5 space-y-1.5">
                {controlMode === 'CAMERA' ? (
                  handDetected ? (
                    <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-emerald-950/70 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Gesture: Tracking</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-amber-950/70 border border-amber-400/40 text-amber-200 text-xs font-semibold animate-pulse">
                      <Hand className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Show Hand to Camera</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-amber-950/60 border border-amber-400/40 text-amber-200 text-xs font-semibold">
                    <MousePointer className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Mouse Preview Active</span>
                  </div>
                )}

                {/* Pinch Boost Status Indicator */}
                <div
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                    isPinching
                      ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.35)]'
                      : 'bg-white/5 border-white/10 text-white/55'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${isPinching ? 'text-sky-300 fill-sky-300' : 'text-white/40'}`} />
                  <span>
                    {isPinching
                      ? 'Pinch Boost: 2× SPEED ACTIVE!'
                      : controlMode === 'CAMERA'
                      ? 'Pinch Thumb + Index for 2× Lock'
                      : 'Hold Left Click for 2× Pinch Lock'}
                  </span>
                </div>
              </div>
            </div>

            {/* ================================================================
                PATROLLING RED AI GLITCH DRONES (HAZARDS)
               ================================================================ */}
            {glitches.map((g) => (
              <div
                key={`glitch-${g.id}`}
                style={{
                  left: `${g.x}%`,
                  top: `${g.y}%`,
                }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-rose-600/35 blur-md animate-pulse" />
                  <svg viewBox="0 0 80 80" className="w-16 h-16 animate-spin" style={{ animationDuration: '4s' }}>
                    <circle
                      cx="40"
                      cy="40"
                      r="30"
                      fill="rgba(136, 19, 55, 0.55)"
                      stroke="#f43f5e"
                      strokeWidth="3"
                      strokeDasharray="10 6"
                    />
                    <polygon
                      points="40,14 66,40 40,66 14,40"
                      fill="#e11d48"
                      stroke="#fda4af"
                      strokeWidth="2.5"
                    />
                    <circle cx="40" cy="40" r="7" fill="#fff1f2" />
                  </svg>
                  <span className="absolute -bottom-4 px-2 py-0.5 rounded bg-rose-950/90 border border-rose-400/50 text-[9px] font-black text-rose-200 tracking-wider uppercase">
                    GLITCH
                  </span>
                </div>
              </div>
            ))}

            {/* ================================================================
                MOVING & SEQUENTIAL GLOWING STARS ON PLAYFIELD
               ================================================================ */}
            {stars.map((star) => {
              const isHovering = activeHoverStarId === star.id && !star.collected;
              const isNextSequentialTarget =
                !currentDiffConfig.sequential || star.orderNumber === nextTargetNumber;
              const isLockedFutureStar = !star.collected && !isNextSequentialTarget;

              const radius = 50;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference * (1 - star.progress);

              return (
                <div
                  key={star.id}
                  style={{
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                >
                  {star.collected ? (
                    /* Collected Star Celebration Burst */
                    <div className="relative flex flex-col items-center justify-center opacity-80 scale-90">
                      <div className="w-16 h-16 rounded-full bg-emerald-400/20 border border-emerald-300/50 flex items-center justify-center shadow-[0_0_25px_rgba(52,211,153,0.5)]">
                        <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                      </div>
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-bold tracking-wider uppercase">
                        #{star.orderNumber} Cleared
                      </span>
                    </div>
                  ) : (
                    /* Active Moving Star + Dwell Progress Ring */
                    <div
                      className={`relative flex items-center justify-center transition-transform duration-150 ${
                        isHovering
                          ? 'scale-110'
                          : isLockedFutureStar
                          ? 'opacity-45 scale-90'
                          : 'scale-100'
                      }`}
                    >
                      {/* Next Target Pulsing Indicator Banner */}
                      {currentDiffConfig.sequential && isNextSequentialTarget && (
                        <div className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-[0_0_15px_#f5b942] animate-bounce">
                          TARGET #{star.orderNumber}
                        </div>
                      )}

                      {/* Outer Ambient Glow */}
                      <div
                        className={`absolute w-28 h-28 rounded-full blur-xl transition-opacity duration-200 ${
                          isHovering
                            ? isPinching
                              ? 'bg-sky-400/65 opacity-100'
                              : 'bg-amber-300/60 opacity-100'
                            : isNextSequentialTarget
                            ? 'bg-amber-400/30 opacity-85'
                            : 'bg-slate-500/10 opacity-40'
                        }`}
                      />

                      {/* Circular Dwell Progress Indicator SVG */}
                      <svg className="w-32 h-32 -rotate-90 overflow-visible" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r={radius + 5}
                          fill="none"
                          stroke={
                            isNextSequentialTarget
                              ? 'rgba(253, 224, 71, 0.35)'
                              : 'rgba(255, 255, 255, 0.12)'
                          }
                          strokeWidth="2"
                          strokeDasharray="8 6"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="rgba(24, 10, 28, 0.45)"
                          stroke="rgba(255, 255, 255, 0.15)"
                          strokeWidth="6"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="none"
                          stroke={isPinching ? '#38bdf8' : '#fde047'}
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          style={{
                            filter: isPinching
                              ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.95))'
                              : 'drop-shadow(0 0 8px rgba(253, 224, 71, 0.9))',
                          }}
                        />
                      </svg>

                      {/* 3D Beveled Golden Star SVG */}
                      <svg
                        viewBox="0 0 100 100"
                        className="absolute w-18 h-18 drop-shadow-[0_0_18px_rgba(250,204,21,0.85)]"
                      >
                        <defs>
                          <linearGradient id={`starGrad-${star.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fffbeb" />
                            <stop offset="35%" stopColor="#fde047" />
                            <stop offset="75%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#b45309" />
                          </linearGradient>
                        </defs>
                        <polygon
                          points="50,6 63,34 94,38 71,59 77,90 50,74 23,90 29,59 6,38 37,34"
                          fill={`url(#starGrad-${star.id})`}
                          stroke="#fef08a"
                          strokeWidth="3"
                          strokeLinejoin="round"
                        />
                        {/* Sequence Order Number Inside Star */}
                        <text
                          x="50"
                          y="61"
                          textAnchor="middle"
                          fill="#3b0819"
                          fontWeight="900"
                          fontSize="24"
                        >
                          {star.orderNumber}
                        </text>
                      </svg>

                      {/* Percentage Badge when Hovering */}
                      {star.progress > 0.04 && (
                        <div
                          className={`absolute -bottom-5 px-2.5 py-0.5 rounded-full font-extrabold text-xs shadow ${
                            isPinching ? 'bg-sky-400 text-slate-950' : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          {Math.round(star.progress * 100)}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ================================================================
                ON-SCREEN HAND / INDEX FINGER CURSOR (WITH PINCH VORTEX AURA)
               ================================================================ */}
            <div
              style={{
                left: `${cursorPos.x * 100}%`,
                top: `${cursorPos.y * 100}%`,
              }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-opacity duration-150"
            >
              <div
                className={`relative flex items-center justify-center ${
                  controlMode === 'CAMERA' && !handDetected ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div
                  className={`absolute w-16 h-16 rounded-full blur-md animate-pulse ${
                    isPinching ? 'bg-sky-400/50 scale-125' : 'bg-amber-400/30'
                  }`}
                />
                <div
                  className={`absolute w-12 h-12 rounded-full border-2 transition-transform ${
                    isPinching
                      ? 'border-sky-300 scale-110 shadow-[0_0_20px_#38bdf8]'
                      : 'border-[#ffd166] shadow-[0_0_15px_#f5b942]'
                  }`}
                />

                {/* White Hand Pointer Icon */}
                <svg
                  viewBox="0 0 36 42"
                  className="w-10 h-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] translate-x-1 translate-y-2"
                >
                  <path
                    d="M13,4 C13,1.8 14.8,0 17,0 C19.2,0 21,1.8 21,4 L21,16 L23,16 C25,16 26.5,17.5 26.5,19.5 L26.5,20.5 L28.5,20.5 C30.5,20.5 32,22 32,24 L32,29 C32,35.5 27,40 20.5,40 L14.5,40 C9.5,40 6.5,36.5 4.5,31.5 L1.5,24 C0.6,21.8 2,19.5 4.2,19.5 C5.8,19.5 7.2,20.5 8,22 L13,29 L13,4 Z"
                    fill={isPinching ? '#e0f2fe' : '#ffffff'}
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Bottom Quick Operator Controls Bar */}
            <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center px-4 pointer-events-auto">
              <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-2 rounded-full bg-[#11071a]/85 border border-white/15 backdrop-blur-md shadow-lg text-xs">
                <button
                  onClick={() => {
                    sfx.playClick();
                    resetGameStars();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all cursor-pointer"
                  title="Restart Stars (Shortcut: R)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#ffd166]" />
                  <span>Restart (R)</span>
                </button>

                <button
                  onClick={() => {
                    sfx.playClick();
                    setControlMode((prev) => (prev === 'CAMERA' ? 'MOUSE' : 'CAMERA'));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-amber-200 font-medium transition-all cursor-pointer"
                  title="Switch between AI Camera & Mouse Preview (Shortcut: M)"
                >
                  {controlMode === 'CAMERA' ? (
                    <>
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>Switch to Mouse (M)</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Switch to Camera (M)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    sfx.playClick();
                    resetGameStars();
                    setScreen('WELCOME');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/35 border border-rose-400/30 text-rose-200 font-medium transition-all cursor-pointer"
                  title="Exit to Welcome Screen (Shortcut: Esc)"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Exit (Esc)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            SCREEN 5: MISSION COMPLETE (UTM REVEAL, RANK BADGE & STATS)
           ------------------------------------------------------------------ */}
        {screen === 'COMPLETE' && (
          <div className="relative w-full h-full flex items-center justify-center px-6 py-6 overflow-hidden">
            {/* Celebratory Floating Gold Confetti & Ribbons */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {[
                { left: '8%', top: '18%', color: '#f5b942', rot: '25deg', delay: '0s' },
                { left: '16%', top: '65%', color: '#f43f5e', rot: '-40deg', delay: '0.4s' },
                { left: '24%', top: '28%', color: '#fde047', rot: '15deg', delay: '0.9s' },
                { left: '75%', top: '20%', color: '#f5b942', rot: '-25deg', delay: '0.2s' },
                { left: '85%', top: '58%', color: '#fb7185', rot: '35deg', delay: '0.7s' },
                { left: '90%', top: '30%', color: '#fef08a', rot: '-15deg', delay: '1.1s' },
                { left: '12%', top: '42%', color: '#fde047', rot: '50deg', delay: '0.5s' },
                { left: '80%', top: '76%', color: '#f5b942', rot: '-30deg', delay: '0.3s' },
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    left: c.left,
                    top: c.top,
                    backgroundColor: c.color,
                    transform: `rotate(${c.rot})`,
                    animationDelay: c.delay,
                  }}
                  className="absolute w-4 h-8 rounded-sm opacity-80 animate-bounce shadow-[0_0_12px_rgba(245,185,66,0.6)]"
                />
              ))}
            </div>

            {/* Central Celebration Card */}
            <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center">
              {/* Golden Ribbon Banner: "Mission Complete!" */}
              <div className="relative mb-4 px-9 py-2.5 rounded-2xl bg-gradient-to-r from-[#d98218] via-[#ffd166] to-[#d98218] text-[#3b0819] font-black text-2xl sm:text-3xl tracking-wide shadow-[0_8px_30px_rgba(245,185,66,0.5)] border-2 border-amber-100">
                <div className="flex items-center gap-2.5">
                  <Award className="w-7 h-7 text-[#4a0e24]" />
                  <span>Mission Complete!</span>
                </div>
              </div>

              {/* Dynamic S / A / B Performance Rank & Metrics Card */}
              <div className="w-full max-w-lg mb-5 p-4 rounded-2xl bg-[#1b0816]/90 border border-[#f5b942]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${rankInfo.color} flex items-center justify-center text-slate-950 font-black text-4xl shadow-[0_0_25px_rgba(245,185,66,0.5)]`}
                  >
                    {rankInfo.grade}
                  </div>
                  <div className="text-left">
                    <div className="text-xs uppercase tracking-widest text-amber-300/80 font-bold">
                      {currentDiffConfig.label} Mode Rank
                    </div>
                    <div className="text-xl font-extrabold text-white">{rankInfo.title}</div>
                    <div className="text-xs text-amber-100/75">{rankInfo.malay}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-center border-t sm:border-t-0 sm:border-l border-white/15 pt-3 sm:pt-0 sm:pl-4">
                  <div>
                    <div className="text-[10px] uppercase text-white/60">Time</div>
                    <div className="text-base font-mono font-bold text-[#ffd166]">
                      {elapsedSeconds.toFixed(1)}s
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-white/60">Max Combo</div>
                    <div className="text-base font-bold text-emerald-300">{maxCombo}×</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-white/60">Glitch Hits</div>
                    <div className="text-base font-bold text-rose-300">{glitchHits}</div>
                  </div>
                </div>
              </div>

              {/* Dignified UTM Brand Reveal */}
              <div className="my-1 transform hover:scale-[1.02] transition-transform">
                <UtmBrandBadge size="lg" />
              </div>

              {/* Inspiring Tagline */}
              <p className="mt-4 text-xl sm:text-2xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-[#ffd166] to-amber-200 drop-shadow">
                The Future Starts With You!
              </p>

              {/* Play Again & Home Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => {
                    sfx.playClick();
                    resetGameStars();
                    setScreen('GAMEPLAY');
                  }}
                  className="inline-flex items-center justify-center gap-3 px-9 py-3.5 rounded-full bg-gradient-to-b from-[#b51f49] via-[#851435] to-[#590b22] text-white font-bold text-lg border-2 border-[#f47296]/60 shadow-[0_0_30px_rgba(225,29,72,0.55),inset_0_2px_5px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Play Again</span>
                </button>

                <button
                  onClick={() => {
                    sfx.playClick();
                    resetGameStars();
                    setScreen('HOW_TO_PLAY');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-amber-200 font-bold text-base border border-amber-400/40 transition-all cursor-pointer"
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span>Change Difficulty</span>
                </button>

                <button
                  onClick={() => {
                    sfx.playClick();
                    resetGameStars();
                    setScreen('WELCOME');
                  }}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1a0b1e]/90 hover:bg-[#2d1233] text-white font-bold text-base border-2 border-[#f5b942]/45 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Home className="w-5 h-5 text-[#ffd166]" />
                  <span>Home</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          FOOTER BAR (Exhibition Status & Keyboard Shortcuts Guide)
         ==================================================================== */}
      <footer className="relative z-30 w-full px-6 py-2 border-t border-white/10 bg-[#070917]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/55">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#f5b942]" />
          <span>
            Mode:{' '}
            <strong className="text-amber-200">
              {controlMode === 'CAMERA'
                ? modelLoaded
                  ? 'MediaPipe HandLandmarker (Index #8 + Pinch #4)'
                  : 'Camera Hand Tracking'
                : 'Mouse Preview Mode (Hold Left Click = 2× Pinch Boost)'}
            </strong>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-200">1/2/3</kbd> Difficulty
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-200">R</kbd> Restart
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-200">M</kbd> Switch Mode
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-200">F</kbd> Fullscreen
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-amber-200">Esc</kbd> Home
          </span>
        </div>
      </footer>
    </div>
  );
}