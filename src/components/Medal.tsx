// ============================================================
// UTM Gesture Quest V3.1 — Medal Component
// Uses /asset/medals/{gold,silver,bronze}.png with vector fallback
// ============================================================

import React, { useState } from 'react';

interface MedalProps {
  rank: 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Medal: React.FC<MedalProps> = ({ rank, size = 'md', className = '' }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const fileMap = {
    1: 'gold.png',
    2: 'silver.png',
    3: 'bronze.png',
  };

  const badgeConfig = {
    1: { bg: 'bg-amber-400 text-stone-950 border-amber-300', text: '#1' },
    2: { bg: 'bg-slate-300 text-slate-900 border-slate-200', text: '#2' },
    3: { bg: 'bg-amber-700 text-white border-amber-600', text: '#3' },
  }[rank];

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  }[size];

  if (!imageFailed) {
    return (
      <img
        src={`/asset/medals/${fileMap[rank]}`}
        alt={`Medal Rank ${rank}`}
        onError={() => setImageFailed(true)}
        className={`object-contain select-none drop-shadow-md ${sizeClasses} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full border flex items-center justify-center font-black shadow-xs select-none ${badgeConfig.bg} ${sizeClasses} ${className}`}
    >
      <span>{badgeConfig.text}</span>
    </div>
  );
};
