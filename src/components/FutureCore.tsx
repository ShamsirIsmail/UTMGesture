// ============================================================
// UTM Gesture Quest V3.1 — Future Core (Light Exhibition)
// Uses /asset/game/future_core.png with genuine alpha channel
// Supports Developer Debug Mode hit zone outline
// ============================================================

import React, { useState } from 'react';
import { getAssetUrl } from '../utils/assets';
import { CORE_X_PCT, CORE_Y_PCT, CORE_HIT_RADIUS_PCT } from '../constants';
import { useTranslation } from '../i18n/useTranslation';

interface FutureCoreProps {
  progress: number; // 0..1 charge progress
  isHovering: boolean;
  visible: boolean;
  debugMode?: boolean;
}

export const FutureCore: React.FC<FutureCoreProps> = ({
  progress,
  isHovering,
  visible,
  debugMode = false,
}) => {
  const { t } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);

  if (!visible) return null;

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const pct = Math.round(progress * 100);

  return (
    <div
      data-testid="future-core"
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-15"
      style={{ left: `${CORE_X_PCT}%`, top: `${CORE_Y_PCT}%` }}
    >
      {/* DEVELOPER DEBUG MODE: Outline of actual core hit zone */}
      {debugMode && (
        <div
          className={`absolute rounded-full border-2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
            isHovering
              ? 'border-emerald-500 bg-emerald-500/20'
              : 'border-amber-500/70 bg-amber-500/10'
          }`}
          style={{
            left: '50%',
            top: '50%',
            width: `${CORE_HIT_RADIUS_PCT * 2.2}vw`,
            height: `${CORE_HIT_RADIUS_PCT * 2.2 * 0.75}vw`,
          }}
        >
          <span className="absolute top-1 left-2 text-[9px] font-mono font-bold text-amber-800 bg-white/90 px-1 rounded">
            CORE r={CORE_HIT_RADIUS_PCT}% {isHovering ? 'CHARGING!' : ''}
          </span>
        </div>
      )}

      {/* Final Mission Header Banner */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 select-none whitespace-nowrap">
        <div className="px-3 py-1 rounded-full bg-[#7a1636] text-white text-[11px] font-black tracking-widest uppercase shadow-xs">
          {t('finalMission')}
        </div>
        <div className="text-stone-800 text-xs font-bold tracking-wide">
          {t('activateCore')}
        </div>
      </div>

      {/* Outer ambient glow */}
      <div
        className="absolute rounded-full blur-xl transition-all duration-300"
        style={{
          width: 190,
          height: 190,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          backgroundColor: `rgba(122, 22, 54, ${0.15 + progress * 0.35})`,
        }}
      />

      {/* Orbit ring 1 */}
      <div
        className="absolute rounded-full border border-[#7a1636]/30 animate-spin"
        style={{
          width: 170,
          height: 170,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          animationDuration: '6s',
        }}
      />

      {/* Orbit ring 2 */}
      <div
        className="absolute rounded-full border border-amber-400/40 animate-spin"
        style={{
          width: 145,
          height: 145,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          animationDuration: '4s',
          animationDirection: 'reverse',
        }}
      />

      {/* Charging circular track SVG */}
      <svg
        className="absolute"
        style={{
          width: 140,
          height: 140,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%) rotate(-90deg)',
        }}
        viewBox="0 0 140 140"
      >
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(122,22,54,0.12)" strokeWidth="5" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#7a1636"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: 'drop-shadow(0 0 6px rgba(122,22,54,0.4))',
            transition: 'stroke-dashoffset 0.08s linear',
          }}
        />
      </svg>

      {/* Core Center Body */}
      <div
        className="relative flex items-center justify-center rounded-full bg-white shadow-exhibition-lg border-2 border-[#d4af37] transition-transform duration-200"
        style={{
          width: 92,
          height: 92,
          transform: isHovering ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        {!imageFailed ? (
          <img
            src={getAssetUrl('/asset/game/future_core.png')}
            alt=""
            onError={() => setImageFailed(true)}
            className="w-20 h-20 object-contain select-none"
          />
        ) : (
          /* High-end vector fallback */
          <div
            className="w-18 h-18 rounded-full flex flex-col items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #fffdf8, #f5b942 60%, #7a1636)',
            }}
          >
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-[#7a1636]/70 shadow-xs">
              <span className="text-[10px] font-black text-[#ffd166]">UTM</span>
            </div>
          </div>
        )}

        {/* Live percentage overlay */}
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-stone-900 text-white text-xs font-black shadow-xs"
        >
          {pct}%
        </div>
      </div>

      {/* Convergent charge particles */}
      {isHovering && progress < 1 && [0, 60, 120, 180, 240, 300].map((deg) => (
        <div
          key={deg}
          className="absolute rounded-full bg-[#7a1636] animate-ping"
          style={{
            width: 5,
            height: 5,
            top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 70}px)`,
            left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 70}px)`,
            transform: 'translate(-50%,-50%)',
            animationDelay: `${deg / 360}s`,
            animationDuration: '1.2s',
          }}
        />
      ))}
    </div>
  );
};
