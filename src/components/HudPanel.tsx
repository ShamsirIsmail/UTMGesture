// ============================================================
// UTM Gesture Quest V3.0 — Compact HUD Panel (Light Exhibition)
// Compact webcam view + 21-point hand skeleton canvas overlay
// ============================================================

import React, { useRef, useEffect, useCallback } from 'react';
import { CheckCircle2, Hand, MousePointer, Zap, Camera } from 'lucide-react';
import { HAND_CONNECTIONS } from '../constants';
import { useTranslation } from '../i18n/useTranslation';
import type { LandmarkPoint, ControlMode, DifficultyLevel } from '../types';

interface HudPanelProps {
  controlMode: ControlMode;
  handDetected: boolean;
  isPinching: boolean;
  difficulty: DifficultyLevel;
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarks: LandmarkPoint[] | null;
  cursorX: number; // 0..1
  cursorY: number; // 0..1
  collectedCount: number;
  totalOrbs: number;
  currentMissionText: string;
}

export const HudPanel: React.FC<HudPanelProps> = ({
  controlMode,
  handDetected,
  isPinching,
  difficulty,
  videoRef,
  landmarks,
  cursorX,
  cursorY,
  collectedCount,
  totalOrbs,
  currentMissionText,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    let pts: { x: number; y: number }[] = [];

    if (controlMode === 'MOUSE') {
      const cx = cursorX;
      const cy = cursorY;
      const dx = (cx - 0.5) * 0.35;
      const dy = (cy - 0.5) * 0.35;
      const pinching = isPinching;
      const thumbTipX = pinching ? 0.31 : 0.13;
      const thumbTipY = pinching ? 0.14 : 0.45;

      const template: [number, number][] = [
        [0.5, 0.86],
        [0.33, 0.76], [0.24, 0.65], [0.21, 0.38], [thumbTipX, thumbTipY],
        [0.39, 0.52], [0.36, 0.36], [0.34, 0.23], [0.32, 0.11],
        [0.49, 0.49], [0.49, 0.32], [0.49, 0.19], [0.49, 0.08],
        [0.59, 0.52], [0.62, 0.36], [0.64, 0.24], [0.66, 0.13],
        [0.69, 0.58], [0.74, 0.46], [0.78, 0.35], [0.82, 0.26],
      ];
      pts = template.map(([tx, ty]) => ({
        x: Math.min(0.95, Math.max(0.05, tx + dx)),
        y: Math.min(0.95, Math.max(0.05, ty + dy)),
      }));
    } else if (landmarks && landmarks.length >= 21) {
      pts = landmarks.map((lm) => ({ x: 1 - lm.x, y: lm.y }));
    }

    if (pts.length === 0) return;

    // Connect bones
    ctx.strokeStyle = isPinching ? '#0284c7' : '#7a1636';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    HAND_CONNECTIONS.forEach(([i, j]) => {
      const p1 = pts[i];
      const p2 = pts[j];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    });

    // Draw pinch indicator laser
    const thumb = pts[4];
    const index = pts[8];
    if (thumb && index) {
      ctx.beginPath();
      ctx.moveTo(thumb.x * w, thumb.y * h);
      ctx.lineTo(index.x * w, index.y * h);
      ctx.strokeStyle = isPinching ? '#0284c7' : '#d4af37';
      ctx.lineWidth = isPinching ? 3 : 1.2;
      ctx.stroke();
    }

    // Draw 21 landmark nodes
    pts.forEach((p, idx) => {
      const px = p.x * w;
      const py = p.y * h;
      const isIndex = idx === 8;
      const isThumb = idx === 4;

      if (isIndex) {
        ctx.beginPath();
        ctx.arc(px, py, isPinching ? 10 : 8, 0, Math.PI * 2);
        ctx.strokeStyle = isPinching ? '#0284c7' : '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(px, py, isIndex || isThumb ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isIndex ? '#7a1636' : isThumb ? '#d4af37' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#333333';
      ctx.stroke();
    });
  }, [controlMode, landmarks, isPinching, cursorX, cursorY]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <>
      {/* 1. Mobile Compact HUD Bar (Height < 560px or Width < 768px / Mobile Landscape) */}
      <div className="hud-mobile-compact absolute left-3 top-3 z-20 items-center gap-1.5 pointer-events-auto safe-area-pl">
        {/* Tracking Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-stone-200/90 shadow-xs backdrop-blur-md">
          <span
            className={`w-2 h-2 rounded-full ${
              controlMode === 'CAMERA'
                ? handDetected
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-400'
                : 'bg-blue-400'
            }`}
          />
          <span className="text-[10px] font-bold text-stone-800">
            {controlMode === 'CAMERA'
              ? handDetected
                ? t('trackingActive')
                : t('raiseHand')
              : t('mousePreview')}
          </span>
        </div>

        {/* Pinch Boost Indicator Pill */}
        {isPinching && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-500 text-white font-black text-[10px] shadow-xs animate-pulse">
            <Zap className="w-3 h-3" />
            <span>2×</span>
          </div>
        )}
      </div>

      {/* 2. Desktop & Tablet Full HUD Panel (Height >= 561px and Width >= 768px) */}
      <div className="hud-desktop-card absolute left-4 top-4 z-20 w-48 sm:w-56 rounded-2xl bg-white/95 border border-stone-200/90 p-2.5 shadow-exhibition backdrop-blur-md safe-area-pl">
        {/* Header with Camera status */}
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                controlMode === 'CAMERA'
                  ? handDetected
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-400'
                  : 'bg-blue-400'
              }`}
            />
            <span className="text-[11px] font-bold text-stone-800">
              {controlMode === 'CAMERA' ? t('aiCamera') : t('mousePreview')}
            </span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-stone-100 text-[#7a1636]">
            {difficulty}
          </span>
        </div>

        {/* Video / Skeleton Canvas */}
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80">
          {controlMode === 'CAMERA' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-stone-50">
              <Camera className="w-5 h-5 text-stone-400 mb-1" />
              <span className="text-[8.5px] text-stone-500 leading-tight">
                {t('holdClickTip')}
              </span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={240}
            height={180}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>

        {/* Tracking feedback banner */}
        <div className="mt-2 space-y-1 text-center">
          {controlMode === 'CAMERA' ? (
            handDetected ? (
              <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-emerald-50 text-emerald-800 text-[10.5px] font-semibold border border-emerald-200/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{t('trackingActive')}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-amber-50 text-amber-800 text-[10.5px] font-semibold border border-amber-200/60 animate-pulse">
                <Hand className="w-3 h-3 text-amber-600 shrink-0" />
                <span>{t('raiseHand')}</span>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-sky-50 text-sky-800 text-[10.5px] font-semibold border border-sky-200/60">
              <MousePointer className="w-3 h-3 text-sky-600 shrink-0" />
              <span>{t('mousePreview')}</span>
            </div>
          )}

          {/* Pinch Boost Indicator */}
          <div
            className={`flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
              isPinching
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-stone-50 text-stone-500 border border-stone-200/60'
            }`}
          >
            <Zap className="w-3 h-3 shrink-0" />
            <span>{isPinching ? t('turboActive') : controlMode === 'CAMERA' ? t('pinchTip') : t('holdClickTip')}</span>
          </div>
        </div>
      </div>
    </>
  );
};
