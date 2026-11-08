// ============================================================
// UTM Gesture Quest V3.1 — Game Constants & Difficulty Configs
// Tuned for Exhibition Reliability & Accessibility
// ============================================================

import type { DifficultyConfig, DifficultyLevel, OrbItem, GlitchDrone } from './types';

// MediaPipe Hand Connections for 21-landmark skeleton drawing
export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb (4 is tip)
  [0, 5], [5, 6], [6, 7], [7, 8],        // Index (8 is tip)
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20], // Pinky & Palm
];

// Core activation parameters
export const CORE_ACTIVATION_SECONDS = 2.0;
export const CORE_X_PCT = 50;
export const CORE_Y_PCT = 50;
export const CORE_HIT_RADIUS_PCT = 14.0; // Generous 14% hit radius for reliable core activation

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  CASUAL: {
    id: 'CASUAL',
    label: 'Casual',
    malaySubtitle: 'Kanak-kanak & Warga Emas',
    badgeColor: 'from-emerald-500 to-teal-700 border-emerald-300/50',
    orbCount: 3,
    sequential: false,
    orbSpeed: 0.25,
    evasiveFactor: 0,
    dwellSeconds: 0.75,
    hitRadiusPct: 13.0, // Generous hit area for children & seniors
    glitchCount: 0,
    description: '3 sasaran tenaga mesra pelawat — kumpul dalam sebarang urutan tanpa halangan.',
  },
  CHALLENGE: {
    id: 'CHALLENGE',
    label: 'Challenge',
    malaySubtitle: 'Cabaran Pameran Standard',
    badgeColor: 'from-amber-500 to-orange-700 border-amber-300/60',
    orbCount: 5,
    sequential: true,
    orbSpeed: 0.85,
    evasiveFactor: 0.25,
    dwellSeconds: 0.95,
    hitRadiusPct: 10.5,
    glitchCount: 2,
    description: '5 sasaran bernombor #1–#5 + 2 dron gangguan. Kuncupkan jari untuk 2× kelajuan!',
  },
  MASTER: {
    id: 'MASTER',
    label: 'Master AI',
    malaySubtitle: 'Belia & Gamers Tegar',
    badgeColor: 'from-rose-500 to-purple-800 border-rose-300/60',
    orbCount: 6,
    sequential: true,
    orbSpeed: 1.35,
    evasiveFactor: 0.55,
    dwellSeconds: 1.1,
    hitRadiusPct: 9.5,
    glitchCount: 3,
    description: '6 sasaran pantas & elakan AI + 3 dron gangguan. Kawalan tangan berketepatan tinggi!',
  },
};

// Orb position presets (% of playfield, keeping clear of left HUD)
const ORB_PRESETS: { x: number; y: number; ax: number; ay: number; fx: number; fy: number }[] = [
  { x: 38, y: 48, ax: 5, ay: 8,  fx: 0.9, fy: 1.2 },
  { x: 58, y: 32, ax: 7, ay: 6,  fx: 1.1, fy: 0.9 },
  { x: 76, y: 50, ax: 6, ay: 8,  fx: 1.0, fy: 1.3 },
  { x: 48, y: 68, ax: 7, ay: 6,  fx: 1.2, fy: 1.0 },
  { x: 70, y: 34, ax: 6, ay: 7,  fx: 1.0, fy: 1.4 },
  { x: 60, y: 65, ax: 8, ay: 6,  fx: 1.1, fy: 0.9 },
];

export function createOrbsForDifficulty(diff: DifficultyLevel): OrbItem[] {
  const cfg = DIFFICULTY_CONFIGS[diff];
  return ORB_PRESETS.slice(0, cfg.orbCount).map((p, idx) => ({
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

export function createGlitchesForDifficulty(diff: DifficultyLevel): GlitchDrone[] {
  const cfg = DIFFICULTY_CONFIGS[diff];
  const templates: GlitchDrone[] = [
    { id: 1, x: 42, y: 30, vx: 14, vy: 11, radiusPct: 5.5 },
    { id: 2, x: 72, y: 62, vx: -12, vy: -13, radiusPct: 5.5 },
    { id: 3, x: 55, y: 72, vx: 11, vy: -15, radiusPct: 5.5 },
  ];
  return templates.slice(0, cfg.glitchCount);
}
