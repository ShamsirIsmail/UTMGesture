// ============================================================
// UTM Gesture Quest V3.1 — Official Organizer & Strategic Partner Logos
// Uses real local files from /asset/logo/ (Welcome Screen ONLY)
// ============================================================

import React, { useState } from 'react';

interface LogoItem {
  id: string;
  name: string;
  sub: string;
  src: string;
  badgeText: string;
}

const OFFICIAL_LOGOS: LogoItem[] = [
  {
    id: 'utm',
    name: 'UTM',
    sub: 'UNIVERSITI TEKNOLOGI MALAYSIA',
    src: '/asset/logo/utm_logo.png',
    badgeText: 'UTM',
  },
  {
    id: 'ascend',
    name: 'ASCEND UTM',
    sub: 'INNOVATION & COMMUNITY',
    src: '/asset/logo/ascend_utm.png',
    badgeText: 'ASCEND',
  },
  {
    id: 'ksj',
    name: 'KSJ',
    sub: 'KELAB SAHABAT JAYA',
    src: '/asset/logo/KSJ.png',
    badgeText: 'KSJ',
  },
  {
    id: 'jkm_ksj',
    name: 'JKM KSJ',
    sub: 'KEBAJIKAN MAHASISWA KSJ',
    src: '/asset/logo/jkm_ksj.png',
    badgeText: 'JKM KSJ',
  },
  {
    id: 'jkm_lk',
    name: 'JKM LK',
    sub: 'KEBAJIKAN MAHASISWA LK',
    src: '/asset/logo/jkm_lk.png',
    badgeText: 'JKM LK',
  },
];

export const OrganizerLogos: React.FC = () => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2.5">
      {/* Header Label */}
      <div className="text-center mb-2">
        <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#7a1636]/80 uppercase">
          Anjuran Bersama &amp; Rakan Strategik Komuniti
        </span>
      </div>

      {/* 5 Logos Balanced Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 items-center justify-center">
        {OFFICIAL_LOGOS.map((logo) => {
          const hasError = imageErrors[logo.id];

          return (
            <div
              key={logo.id}
              className="flex items-center justify-center p-2 rounded-xl bg-white/80 border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all h-14"
            >
              {!hasError ? (
                <img
                  src={logo.src}
                  alt={logo.name}
                  onError={() => handleError(logo.id)}
                  className="max-h-10 max-w-[110px] object-contain select-none transition-transform hover:scale-105"
                />
              ) : (
                /* Typographic / vector fallback */
                <div className="flex items-center gap-1.5 select-none text-left">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7a1636] to-[#540d24] flex items-center justify-center text-[#f5b942] font-black text-[9px] shrink-0 shadow-2xs">
                    {logo.badgeText}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-black text-[#7a1636] leading-tight">
                      {logo.name}
                    </span>
                    <span className="text-[7px] font-medium text-stone-500 leading-none">
                      {logo.sub}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
