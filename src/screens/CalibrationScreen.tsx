// ============================================================
// UTM Gesture Quest V3.0 — AI Hand Calibration Screen
// Stage 2: Real camera test, local MediaPipe model, live skeleton
// ============================================================

import React, { useRef, useEffect, useState } from 'react';
import { Camera, CheckCircle2, AlertTriangle, Loader2, Hand, MousePointer, ArrowRight } from 'lucide-react';
import { UtmBrandBadge } from '../components/UtmBrandBadge';
import { useTranslation } from '../i18n/useTranslation';
import { sfx } from '../services/audioEngine';
import { voice } from '../services/voiceGuidance';
import { HAND_CONNECTIONS } from '../constants';
import type { CameraStatus, LandmarkPoint } from '../types';

interface CalibrationScreenProps {
  cameraStatus: CameraStatus;
  cameraErrorMsg: string;
  handDetected: boolean;
  modelLoaded: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  landmarks?: LandmarkPoint[] | null;
  onProceedToHowToPlay: () => void;
  onMousePreview: () => void;
  onRetryCamera: () => void;
}

type CalibrationStep = 'REQUESTING' | 'LOADING_AI' | 'LOOKING' | 'DETECTED' | 'READY';

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({
  cameraStatus,
  cameraErrorMsg,
  handDetected,
  modelLoaded,
  videoRef,
  landmarks,
  onProceedToHowToPlay,
  onMousePreview,
  onRetryCamera,
}) => {
  const { t, language } = useTranslation();
  const [step, setStep] = useState<CalibrationStep>('REQUESTING');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Voice guidance on calibration start (once per calibration entry)
  useEffect(() => {
    voice.resetCalibration();
    const timer = setTimeout(() => {
      voice.speakCalibration(language);
    }, 600);
    return () => clearTimeout(timer);
  }, [language]);

  // Derive step from tracking states
  useEffect(() => {
    if (cameraStatus === 'LOADING') setStep('LOADING_AI');
    else if (cameraStatus === 'READY' && !modelLoaded) setStep('LOADING_AI');
    else if (cameraStatus === 'READY' && modelLoaded && !handDetected) setStep('LOOKING');
    else if (cameraStatus === 'READY' && modelLoaded && handDetected) {
      setStep('DETECTED');
      voice.speakHandDetected(language);
      const timer = setTimeout(() => setStep('READY'), 1200);
      return () => clearTimeout(timer);
    }
  }, [cameraStatus, modelLoaded, handDetected, language]);

  // Draw 21-landmark skeleton on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (landmarks && landmarks.length >= 21) {
      // Mirror X coordinates for user preview
      const pts = landmarks.map((lm) => ({ x: (1 - lm.x) * w, y: lm.y * h }));

      // Bones
      ctx.strokeStyle = '#7a1636';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      HAND_CONNECTIONS.forEach(([i, j]) => {
        const p1 = pts[i];
        const p2 = pts[j];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // Nodes
      pts.forEach((p, idx) => {
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        const isIndex = idx === 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isIndex ? 6.5 : isTip ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isIndex ? '#f5b942' : isTip ? '#059669' : '#ffffff';
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = '#7a1636';
        ctx.stroke();
      });
    }
  }, [landmarks]);

  const stepInfo = {
    REQUESTING: { icon: <Camera className="w-5 h-5 text-amber-500 animate-pulse" />, text: t('lookingForHand'), color: 'text-amber-800 bg-amber-50 border-amber-200' },
    LOADING_AI: { icon: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />, text: t('initializingAI'), color: 'text-blue-800 bg-blue-50 border-blue-200' },
    LOOKING: { icon: <Hand className="w-5 h-5 text-amber-600 animate-pulse" />, text: t('lookingForHand'), color: 'text-amber-900 bg-amber-50 border-amber-200' },
    DETECTED: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, text: t('handDetected'), color: 'text-emerald-900 bg-emerald-50 border-emerald-200' },
    READY: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, text: t('youAreReady'), color: 'text-emerald-900 bg-emerald-100 border-emerald-300' },
  }[step];

  const isError = cameraStatus === 'ERROR';
  const isReady = step === 'READY';

  return (
    <div className="relative w-full h-full bg-instruction-light overflow-y-auto flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">
        {/* Header */}
        <UtmBrandBadge size="sm" className="mb-3" />
        <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900">
          {t('calibrationTitle')}
        </h2>
        <p className="text-stone-500 text-xs sm:text-sm mt-1 mb-5">
          {t('calibrationSubtitle')}
        </p>

        {/* Viewfinder Card */}
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-stone-200 shadow-exhibition bg-white p-3">
          {isError ? (
            <div className="w-full aspect-[4/3] rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center p-6 text-center gap-2">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <p className="text-rose-900 font-bold text-sm">{t('cameraDeniedTitle')}</p>
              <p className="text-rose-700 text-xs leading-relaxed">{cameraErrorMsg || t('cameraDeniedMsg')}</p>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas
                ref={canvasRef}
                width={384}
                height={288}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Corner target brackets */}
              <div className="pointer-events-none absolute inset-3">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#7a1636]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#7a1636]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#7a1636]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#7a1636]" />
              </div>

              {/* Success frame flash */}
              {handDetected && (
                <div className="pointer-events-none absolute inset-0 border-3 border-emerald-500 rounded-2xl animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Stepper Status Pill */}
        {!isError && (
          <div className="mt-5 flex flex-col items-center gap-3">
            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border shadow-xs text-xs font-bold ${stepInfo.color}`}>
              {stepInfo.icon}
              <span>{stepInfo.text}</span>
            </div>

            {step === 'LOOKING' && (
              <p className="text-xs text-stone-500 max-w-xs animate-pulse">
                {t('calibrationInstruction')}
              </p>
            )}

            {isReady && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onProceedToHowToPlay();
                }}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#7a1636] text-white font-black text-sm shadow-md hover:bg-[#62102b] hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                <span>{t('continue')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Error controls */}
        {isError && (
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                sfx.playClick();
                onRetryCamera();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{t('retryCamera')}</span>
            </button>
            <button
              onClick={() => {
                sfx.playClick();
                onMousePreview();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold cursor-pointer"
            >
              <MousePointer className="w-4 h-4" />
              <span>{t('mousePreview')}</span>
            </button>
          </div>
        )}

        {/* Skip to Mouse Mode option */}
        {!isError && !isReady && (
          <button
            onClick={() => {
              sfx.playClick();
              onMousePreview();
            }}
            className="mt-4 text-xs text-stone-500 hover:text-[#7a1636] transition-colors underline cursor-pointer"
          >
            {t('quickMouseTest')}
          </button>
        )}
      </div>
    </div>
  );
};
