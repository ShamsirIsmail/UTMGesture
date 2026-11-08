// ============================================================
// UTM Gesture Quest V3.0 — Footer Bar (Light Exhibition Theme)
// ============================================================

import React from 'react';
import { Shield, Info } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import type { ControlMode } from '../types';

interface FooterProps {
  controlMode: ControlMode;
  modelLoaded: boolean;
  onOpenOperatorModal: () => void;
  screen?: string;
}

export const Footer: React.FC<FooterProps> = ({
  controlMode,
  modelLoaded,
  onOpenOperatorModal,
  screen,
}) => {
  const { t } = useTranslation();

  // On short landscape screens during gameplay, hide footer to give max arena height
  if (screen === 'GAMEPLAY') {
    return (
      <footer className="hidden lg:flex relative z-30 w-full px-5 py-1.5 border-t border-stone-200/80 bg-white/90 backdrop-blur-md items-center justify-between gap-2 text-[11px] text-stone-500 safe-area-px">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#7a1636]" />
          <span>
            {t('modeLabel')}:{' '}
            <strong className="text-stone-800">
              {controlMode === 'CAMERA'
                ? modelLoaded
                  ? t('trackingStatusCamera')
                  : t('aiCamera')
                : t('mousePreviewNotice')}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenOperatorModal}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-stone-400 hover:text-[#7a1636] hover:bg-stone-100 transition-colors cursor-pointer text-[10.5px]"
            title="Operator Panel (Shortcut: O)"
          >
            <Shield className="w-3 h-3 text-[#7a1636]" />
            <span>Staff (O)</span>
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative z-30 w-full px-3 sm:px-5 py-1 sm:py-2 border-t border-stone-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-stone-500 safe-area-px">
      <div className="flex items-center gap-2 truncate">
        <Info className="w-3.5 h-3.5 text-[#7a1636] shrink-0" />
        <span className="truncate">
          {t('modeLabel')}:{' '}
          <strong className="text-stone-800">
            {controlMode === 'CAMERA'
              ? modelLoaded
                ? t('trackingStatusCamera')
                : t('aiCamera')
              : t('mousePreviewNotice')}
          </strong>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Keyboard shortcut pills */}
        <div className="hidden lg:flex items-center gap-3 text-stone-500">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 font-mono text-[10px] text-stone-700">1/2/3</kbd> {t('changeDifficulty')}
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 font-mono text-[10px] text-stone-700">R</kbd> {t('restart')}
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 font-mono text-[10px] text-stone-700">M</kbd> Mod
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 font-mono text-[10px] text-stone-700">F</kbd> {t('fullscreen')}
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 font-mono text-[10px] text-stone-700">Esc</kbd> {t('home')}
          </span>
        </div>

        {/* Discreet Operator Access Button */}
        <button
          onClick={onOpenOperatorModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-stone-400 hover:text-[#7a1636] hover:bg-stone-100 transition-colors cursor-pointer text-[10.5px]"
          title="Operator Panel (Shortcut: O)"
        >
          <Shield className="w-3 h-3 text-[#7a1636]" />
          <span>Staff (O)</span>
        </button>
      </div>
    </footer>
  );
};
