// ============================================================
// UTM Gesture Quest V3.0 — Typographic UTM Brand Badge
// Respectful university emblem styling (Light Exhibition Theme)
// ============================================================

import React from 'react';

interface UtmBrandBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UtmBrandBadge: React.FC<UtmBrandBadgeProps> = ({ size = 'md', className = '' }) => {
  if (size === 'lg') {
    return (
      <div className={`inline-flex flex-col items-center select-none ${className}`}>
        <div className="flex items-center gap-4 px-7 py-3 rounded-2xl bg-white border border-[#7a1636]/20 shadow-exhibition-lg">
          <div className="w-13 h-13 rounded-full bg-gradient-to-br from-[#7a1636] to-[#4e0c21] p-0.5 shadow-sm flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#7a1636] flex flex-col items-center justify-center border border-[#f5b942]/60">
              <span className="text-[10px] font-black tracking-widest text-[#f5b942] leading-none">UTM</span>
              <span className="text-[6.5px] uppercase tracking-tighter text-amber-100/90 mt-0.5 font-bold">MALAYSIA</span>
            </div>
          </div>
          <div className="text-left">
            <div className="text-3xl sm:text-4xl font-serif font-black tracking-wider text-[#7a1636]">
              UTM
            </div>
            <div className="text-xs font-semibold tracking-[0.14em] text-stone-600 uppercase -mt-0.5">
              Universiti Teknologi Malaysia
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-[10px] tracking-[0.25em] uppercase text-[#7a1636]/80 font-bold">
          Kerana Tuhan Untuk Manusia
        </div>
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-[#7a1636]/20 shadow-exhibition select-none ${className}`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7a1636] to-[#4e0c21] flex items-center justify-center text-[#f5b942] font-black text-[9px] tracking-tighter shadow-xs">
          UTM
        </div>
        <div className="text-left">
          <div className="text-sm font-serif font-extrabold tracking-wide text-[#7a1636]">UTM Gesture Quest</div>
          <div className="text-[10px] tracking-wider text-stone-500 font-medium">Universiti Teknologi Malaysia</div>
        </div>
      </div>
    );
  }

  // sm
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#7a1636]/20 shadow-xs select-none ${className}`}>
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7a1636] to-[#4e0c21] flex items-center justify-center text-[#f5b942] font-black text-[8px] tracking-tighter shadow-xs">
        UTM
      </div>
      <div className="flex flex-col text-left">
        <span className="text-xs font-serif font-extrabold tracking-wider text-[#7a1636] leading-none">UTM</span>
        <span className="text-[8.5px] tracking-wider text-stone-500 font-medium leading-tight">Universiti Teknologi Malaysia</span>
      </div>
    </div>
  );
};
