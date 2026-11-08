// ============================================================
// UTM Gesture Quest V3.0 — Reusable Participant Avatar
// Renders live photo (if consented) or clean vector avatar
// ============================================================

import React from 'react';

interface AvatarProps {
  photo?: string;
  avatarId?: number;
  nickname: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AVATAR_PALETTES = [
  { bg: 'from-sky-500 to-blue-700', text: 'text-white' },
  { bg: 'from-amber-400 to-orange-600', text: 'text-stone-900' },
  { bg: 'from-emerald-500 to-teal-700', text: 'text-white' },
  { bg: 'from-violet-500 to-purple-700', text: 'text-white' },
  { bg: 'from-rose-500 to-red-700', text: 'text-white' },
  { bg: 'from-[#7a1636] to-[#4a0d20]', text: 'text-[#ffd166]' },
];

export const Avatar: React.FC<AvatarProps> = ({
  photo,
  avatarId = 1,
  nickname,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  }[size];

  const initial = (nickname.trim()[0] || 'U').toUpperCase();
  const palette = AVATAR_PALETTES[(avatarId - 1) % AVATAR_PALETTES.length];

  if (photo) {
    return (
      <div
        className={`relative rounded-full overflow-hidden border-2 border-[#d4af37] shadow-sm shrink-0 ${sizeClasses} ${className}`}
      >
        <img src={photo} alt={nickname} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-gradient-to-br ${palette.bg} ${palette.text} border-2 border-white shadow-sm flex items-center justify-center font-bold tracking-tight select-none shrink-0 ${sizeClasses} ${className}`}
    >
      <span>{initial}</span>
    </div>
  );
};

