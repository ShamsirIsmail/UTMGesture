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
    <div className="pointer-events-none fixed bottom-12 inset-x-0 z-50 flex justify-center px-4 animate-fade-in">
      <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-stone-900/90 text-white border border-stone-700/80 shadow-exhibition backdrop-blur-md max-w-xl text-center">
        <Volume2 className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span className="text-xs sm:text-sm font-semibold tracking-wide">
          {caption}
        </span>
      </div>
    </div>
  );
};

