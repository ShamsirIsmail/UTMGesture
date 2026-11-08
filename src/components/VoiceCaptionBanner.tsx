// ============================================================
// UTM Gesture Quest V3.1 — Voice Caption Banner
// Displays on-screen subtitles when voice guidance speaks
// ============================================================

import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { voice } from '../services/voiceGuidance';

export const VoiceCaptionBanner: React.FC = () => {
  const [caption, setCaption] = useState<string | null>(null);

  useEffect(() => {
    return voice.subscribeCaption((text) => setCaption(text));
  }, []);

  if (!caption) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 sm:bottom-12 inset-x-0 z-50 flex justify-center px-3 sm:px-4 animate-fadeIn safe-area-pb">
      <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-full bg-stone-900/90 text-white border border-stone-700/80 shadow-exhibition backdrop-blur-md max-w-md sm:max-w-xl text-center">
        <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 animate-pulse" />
        <span className="text-[11px] sm:text-sm font-semibold tracking-wide leading-snug">
          {caption}
        </span>
      </div>
    </div>
  );
};

