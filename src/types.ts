// ============================================================
// UTM Gesture Quest V3.0 — Shared Types & Interfaces
// ============================================================

export type ScreenState = 'WELCOME' | 'CALIBRATION' | 'HOW_TO_PLAY' | 'GAMEPLAY' | 'COMPLETE' | 'LEADERBOARD';
export type ControlMode = 'CAMERA' | 'MOUSE';
export type DifficultyLevel = 'CASUAL' | 'CHALLENGE' | 'MASTER';
export type GamePhase = 'ORBS' | 'CORE' | 'TRANSITION';
export type CameraStatus = 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
export type Language = 'bm' | 'en';

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  malaySubtitle?: string;
  badgeColor: string;
  orbCount: number;
  sequential: boolean;
  orbSpeed: number;
  evasiveFactor: number;
  dwellSeconds: number;
  hitRadiusPct: number;
  glitchCount: number;
  description?: string;
}

export interface OrbItem {
  id: number;
  orderNumber: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  phaseX: number;
  phaseY: number;
  ampX: number;
  ampY: number;
  freqX: number;
  freqY: number;
  collected: boolean;
  progress: number;
  collectedAt?: number;
}

export interface GlitchDrone {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radiusPct: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  photo?: string; // base64 data URL
  avatarId: number; // fallback avatar index (1-6)
  difficulty: DifficultyLevel;
  timeSeconds: number;
  createdAt: string; // ISO timestamp
  controlMode: ControlMode;
}
