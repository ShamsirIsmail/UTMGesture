// ============================================================
// UTM Gesture Quest V3.1 — Energy Orb (Light Exhibition)
// Uses /asset/game/energy_orb_*.png with genuine alpha channel
// Supports Developer Debug Mode hit radius visualization
// ============================================================

import React, { useState } from 'react';
import type { DifficultyLevel } from '../types';

interface EnergyOrbProps {
  id: number;
  orderNumber: number;
  x: number; // percentage
  y: number; // percentage
  collected: boolean;
  collectedAt?: number;
  progress: number; // 0..1 dwell progress
  isHovering: boolean;
  isNextTarget: boolean;
  isLocked: boolean; // sequential but not next
  isPinching: boolean;
  sequential: boolean;
  difficulty?: DifficultyLevel;
  hitRadiusPct?: number;
  debugMode?: boolean;
}

export const EnergyOrb: React.FC<EnergyOrbProps> = ({
  id,
  orderNumber,
  x,
  y,
  collected,
  collectedAt,
  progress,
  isHovering,
  isNextTarget,
  isLocked,
  isPinching,
  sequential,
  difficulty = 'CASUAL',
  hitRadiusPct = 12.0,
  debugMode = false,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Asset selection according to exhibition specifications:
  // Casual: blue & gold
  // Challenge: blue, gold, purple mix
  // Master: purple emphasis
  const getOrbAsset = () => {
    if (difficulty === 'CASUAL') {
      return (id % 2 === 1)
        ? { file: 'energy_orb_blue.png', base: '#0284c7', ring: '#38bdf8', glow: 'rgba(2,132,199,0.3)', text: '#0369a1' }
        : { file: 'energy_orb_gold.png', base: '#d97706', ring: '#fbbf24', glow: 'rgba(217,119,6,0.3)', text: '#b45309' };
    }
    if (difficulty === 'MASTER') {
      return (id % 2 === 0)
        ? { file: 'energy_orb_purple.png', base: '#7c3aed', ring: '#a78bfa', glow: 'rgba(124,58,237,0.35)', text: '#6d28d9' }
        : { file: 'energy_orb_gold.png', base: '#d97706', ring: '#fbbf24', glow: 'rgba(217,119,6,0.3)', text: '#b45309' };
    }
    // CHALLENGE: Mix of blue, gold, purple
    const mod = id % 3;
    if (mod === 1) return { file: 'energy_orb_blue.png', base: '#0284c7', ring: '#38bdf8', glow: 'rgba(2,132,199,0.3)', text: '#0369a1' };
    if (mod === 2) return { file: 'energy_orb_gold.png', base: '#d97706', ring: '#fbbf24', glow: 'rgba(217,119,6,0.3)', text: '#b45309' };
    return { file: 'energy_orb_purple.png', base: '#7c3aed', ring: '#a78bfa', glow: 'rgba(124,58,237,0.35)', text: '#6d28d9' };
  };

  const theme = getOrbAsset();
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  if (collected) {
    const age = collectedAt ? performance.now() - collectedAt : 0;
    if (age > 1000) return null;

    return (
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        {/* Radial 8-particle burst */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const dist = 30 + (age / 1000) * 45;
          const px = Math.cos(rad) * dist;
          const py = Math.sin(rad) * dist;
          const pOpacity = Math.max(0, 1 - age / 600);
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 5,
                height: 5,
                backgroundColor: theme.ring,
                boxShadow: `0 0 6px ${theme.glow}`,
                transform: `translate(${px}px, ${py}px)`,
                opacity: pOpacity,
              }}
            />
          );
        })}

        <div
          className="flex flex-col items-center"
          style={{ opacity: Math.max(0, 1 - age / 700) }}
        >
          <div
            className="w-14 h-14 rounded-full border-2 flex items-center justify-center bg-white shadow-md animate-burst"
            style={{ borderColor: theme.base }}
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7" style={{ color: theme.base }} fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span
            className="mt-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-white border shadow-2xs"
            style={{ color: theme.text, borderColor: `${theme.base}40` }}
          >
            Disahkan
          </span>
        </div>
      </div>
    );
  }

  const scale = isHovering ? 1.12 : isLocked ? 0.88 : 1.0;
  const orbOpacity = isLocked ? 0.4 : 1.0;

  return (
    <div
      data-testid={`energy-orb-${id}`}
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {/* DEVELOPER DEBUG MODE: Outline of actual hit collision zone */}
      {debugMode && (
        <div
          className={`absolute rounded-full border-2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
            isHovering
              ? 'border-emerald-500 bg-emerald-500/15'
              : 'border-amber-500/60 bg-amber-500/5'
          }`}
          style={{
            left: '50%',
            top: '50%',
            width: `${hitRadiusPct * 2.2}vw`,
            height: `${hitRadiusPct * 2.2 * 0.75}vw`,
          }}
        >
          <span className="absolute top-1 left-2 text-[9px] font-mono font-bold text-amber-700 bg-white/90 px-1 rounded">
            r={hitRadiusPct}% {isHovering ? 'HIT!' : ''}
          </span>
        </div>
      )}

      <div
        className="relative flex items-center justify-center transition-all duration-200"
        style={{ transform: `scale(${scale})`, opacity: orbOpacity }}
      >
        {/* Next target indicator */}
        {sequential && isNextTarget && (
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase animate-bounce whitespace-nowrap shadow-xs"
            style={{
              backgroundColor: theme.base,
              color: '#ffffff',
            }}
          >
            #{orderNumber} SASARAN
          </div>
        )}

        {/* Outer soft illumination glow */}
        <div
          className="absolute w-24 h-24 rounded-full blur-lg transition-opacity"
          style={{
            backgroundColor: theme.base,
            opacity: isHovering ? 0.4 : isNextTarget ? 0.22 : 0.08,
          }}
        />

        {/* Dwell progress circular track */}
        <svg className="-rotate-90 overflow-visible" style={{ width: 116, height: 116 }} viewBox="0 0 116 116">
          <circle
            cx="58"
            cy="58"
            r={radius}
            fill="rgba(255,255,255,0.7)"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="5"
          />
          <circle
            cx="58"
            cy="58"
            r={radius}
            fill="none"
            stroke={isPinching ? '#0284c7' : theme.base}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 4px ${theme.glow})`,
              transition: 'stroke-dashoffset 0.05s linear',
            }}
          />
        </svg>

        {/* Central Orb body */}
        <div
          className="absolute flex items-center justify-center rounded-full bg-white/90 shadow-exhibition border-2 overflow-hidden"
          style={{
            width: 62,
            height: 62,
            borderColor: theme.ring,
          }}
        >
          {!imageFailed ? (
            <img
              src={`/asset/game/${theme.file}`}
              alt=""
              onError={() => setImageFailed(true)}
              className="w-13 h-13 object-contain select-none"
            />
          ) : (
            /* Vector fallback */
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 35% 30%, #ffffff, ${theme.ring} 80%, ${theme.base})`,
              }}
            >
              <span className="text-xl font-black text-white drop-shadow-xs">
                {orderNumber}
              </span>
            </div>
          )}

          {/* Sequential number badge on top */}
          <span
            className="absolute text-sm font-black text-stone-900 drop-shadow-xs"
            style={{ color: theme.text }}
          >
            {orderNumber}
          </span>
        </div>

        {/* Percentage badge during hover */}
        {progress > 0.03 && (
          <div
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-xs whitespace-nowrap"
            style={{ backgroundColor: isPinching ? '#0284c7' : theme.base }}
          >
            {Math.round(progress * 100)}%
          </div>
        )}
      </div>
    </div>
  );
};
