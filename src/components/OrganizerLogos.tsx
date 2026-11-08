// ============================================================
// UTM Gesture Quest V3.3 — Official Organizer & Strategic Partner Logos
// Professional, borderless university event branding (Welcome Screen ONLY)
// ============================================================

import React, { useState } from 'react';

interface LogoItem {
  id: string;
  name: string;
  sub: string;
  src: string;
  badgeText: string;
  isWide?: boolean;
}

const OFFICIAL_LOGOS: LogoItem[] = [
  {
    id: 'utm',
    name: 'UTM',
    sub: 'UNIVERSITI TEKNOLOGI MALAYSIA',
    src: '/asset/logo/utm_logo.png',
    badgeText: 'UTM',
    isWide: true,
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
    <div className="w-full max-w-5xl mx-auto px-4 py-2 select-none">
      {/* Subtle University Branding Header */}
      <div className="text-center mb-2.5">
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-[#7a1636]/90 uppercase">
          Anjuran Bersama &amp; Rakan Strategik Komuniti
        </span>
      </div>

      {/* Clean, Borderless, Transparent Horizontal Brand Row */}
      <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-9 lg:gap-12">
        {OFFICIAL_LOGOS.map((logo) => {
          const hasError = imageErrors[logo.id];

          return (
            <div
              key={logo.id}
              className="flex items-center justify-center transition-transform hover:scale-104 duration-200"
            >
              {!hasError ? (
                <img
                  src={logo.src}
                  alt={logo.name}
                  onError={() => handleError(logo.id)}
                  className={`object-contain select-none drop-shadow-2xs ${
                    logo.isWide
                      ? 'h-14 sm:h-18 lg:h-20 max-w-[190px] sm:max-w-[230px]'
                      : 'h-13 sm:h-16 lg:h-18 max-w-[80px] sm:max-w-[100px]'
                  }`}
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
              ) : (
                /* Elegant vector fallback if image is unreachable */
                <div className="flex items-center gap-2 select-none text-left">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7a1636] to-[#540d24] flex items-center justify-center text-[#f5b942] font-black text-[10px] shrink-0 shadow-2xs">
                    {logo.badgeText}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#7a1636] leading-tight">
                      {logo.name}
                    </span>
                    <span className="text-[8px] font-medium text-stone-500 leading-none">
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
