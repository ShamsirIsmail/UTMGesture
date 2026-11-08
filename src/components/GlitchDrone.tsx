// ============================================================
// UTM Gesture Quest V3.0 — Glitch Drone (Light Exhibition)
// Clean red AI hazard drone
// ============================================================

import React from 'react';

interface GlitchDroneProps {
  x: number; // percentage
  y: number; // percentage
}

export const GlitchDrone: React.FC<GlitchDroneProps> = ({ x, y }) => (
  <div
    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20"
    style={{ left: `${x}%`, top: `${y}%` }}
  >
    <div className="relative flex items-center justify-center">
      {/* Subtle pulsing danger aura */}
      <div className="absolute w-16 h-16 rounded-full bg-rose-500/20 blur-md animate-pulse" />

      {/* Main drone SVG */}
      <svg viewBox="0 0 80 80" className="w-14 h-14 animate-spin" style={{ animationDuration: '4s' }}>
        <circle
          cx="40"
          cy="40"
          r="28"
          fill="rgba(255, 255, 255, 0.9)"
          stroke="#e11d48"
          strokeWidth="3"
          strokeDasharray="8 5"
        />
        <polygon
          points="40,16 64,40 40,64 16,40"
          fill="#e11d48"
          stroke="#fda4af"
          strokeWidth="2"
        />
        <circle cx="40" cy="40" r="6" fill="#ffffff" />
        <circle cx="40" cy="40" r="3" fill="#be123c" />
      </svg>

      {/* Label */}
      <span className="absolute -bottom-4 px-2 py-0.2 rounded-full bg-rose-600 text-[8.5px] font-black text-white tracking-wider uppercase shadow-xs">
        GLITCH
      </span>
    </div>
  </div>
);
