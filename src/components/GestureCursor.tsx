// ============================================================
// UTM Gesture Quest V3.1 — Gesture Cursor (Light Exhibition)
// Uses /asset/game/gesture_cursor.png with genuine alpha channel
// Smooth virtual reticle with turbo pinch aura & core charging ring
// ============================================================

import React, { useState } from 'react';
import { getAssetUrl } from '../utils/assets';

interface GestureCursorProps {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  isPinching: boolean;
  handDetected: boolean;
  controlMode: 'CAMERA' | 'MOUSE';
  coreProgress?: number; // 0..1 when hovering core
  isShieldActive?: boolean;
}

export const GestureCursor: React.FC<GestureCursorProps> = ({
  x,
  y,
  isPinching,
  handDetected,
  controlMode,
  coreProgress = 0,
  isShieldActive = false,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const isActive = controlMode === 'MOUSE' || handDetected;
  const opacity = isActive ? 1 : 0.35;

  return (
    <div
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        opacity,
        transition: 'opacity 0.15s ease',
      }}
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30"
    >
      {/* Protective Shield Aura (Open Palm gesture) */}
      {isShieldActive && (
        <div className="absolute w-22 h-22 rounded-full border-2 border-cyan-400 bg-cyan-400/20 animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.6)]" />
      )}

      {/* 1. Custom Transparent PNG Asset */}
      {!imageFailed ? (
        <div className="relative flex items-center justify-center">
          <img
            src={getAssetUrl('/asset/game/gesture_cursor.png')}
            alt=""
            onError={() => setImageFailed(true)}
            className={`w-14 h-14 object-contain transition-transform duration-100 ${
              isPinching ? 'scale-115' : 'scale-100'
            }`}
          />
          {/* Subtle centering reticle */}
          <div
            className={`absolute w-2 h-2 rounded-full ${
              coreProgress > 0 ? 'bg-purple-600' : isPinching ? 'bg-sky-500' : 'bg-[#7a1636]'
            }`}
          />
        </div>
      ) : (
        /* Vector Fallback Reticle */
        <div className="relative flex items-center justify-center">
          {/* Outer gentle illumination */}
          <div
            className={`absolute rounded-full blur-md transition-all ${
              coreProgress > 0
                ? 'w-20 h-20 bg-purple-400/35'
                : isPinching
                ? 'w-16 h-16 bg-sky-400/35 scale-110'
                : 'w-14 h-14 bg-amber-400/30'
            }`}
          />

          {/* Primary ring */}
          <div
            className={`rounded-full border-2 transition-all duration-150 ${
              coreProgress > 0
                ? 'w-14 h-14 border-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : isPinching
                ? 'w-12 h-12 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]'
                : 'w-10 h-10 border-[#7a1636] shadow-[0_0_12px_rgba(122,22,54,0.35)]'
            }`}
          />

          {/* Center reticle */}
          <div
            className={`absolute rounded-full ${
              coreProgress > 0
                ? 'w-2.5 h-2.5 bg-purple-600'
                : isPinching
                ? 'w-2.5 h-2.5 bg-sky-500'
                : 'w-2 h-2 bg-[#7a1636]'
            }`}
          />
        </div>
      )}

      {/* Core charging progress ring around cursor */}
      {coreProgress > 0 && (
        <svg
          className="absolute -top-3.5 -left-3.5 w-21 h-21 -rotate-90 pointer-events-none"
          viewBox="0 0 84 84"
        >
          <circle
            cx="42"
            cy="42"
            r="38"
            fill="none"
            stroke="#7a1636"
            strokeWidth="3.5"
            strokeDasharray={2 * Math.PI * 38}
            strokeDashoffset={2 * Math.PI * 38 * (1 - coreProgress)}
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Pinch Turbo Aura */}
      {isPinching && (
        <div className="absolute inset-0 -m-3 rounded-full border-2 border-sky-400/80 animate-ping pointer-events-none" />
      )}
    </div>
  );
};
