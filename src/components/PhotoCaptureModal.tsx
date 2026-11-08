// ============================================================
// UTM Gesture Quest V3.0 — Consent-Based Photo Capture Modal
// Safe, offline, 100% local storage only
// ============================================================

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { sfx } from '../services/audioEngine';

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoAccepted: (dataUrl: string) => void;
  existingStream?: MediaStream | null;
}

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoAccepted,
  existingStream,
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [hasParentalConsent, setHasParentalConsent] = useState(true);

  // Start webcam if no existing stream
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      if (existingStream && existingStream.active) {
        localStreamRef.current = existingStream;
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        localStreamRef.current = stream;
      }

      if (videoRef.current && localStreamRef.current) {
        videoRef.current.srcObject = localStreamRef.current;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      setCameraError('Unable to access camera for photo capture.');
    }
  }, [existingStream]);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera();
    } else {
      // Clean up only if we created our own stream
      if (localStreamRef.current && localStreamRef.current !== existingStream) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    }
  }, [isOpen, startCamera, existingStream]);

  if (!isOpen) return null;

  // Capture snapshot to canvas, resize to max 320x320 JPEG
  const handleCapture = () => {
    sfx.playClick();
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop center square
    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;
    const minDim = Math.min(vWidth, vHeight);
    const startX = (vWidth - minDim) / 2;
    const startY = (vHeight - minDim) / 2;

    // Mirror image horizontally to match webcam experience
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setCapturedImage(dataUrl);
  };

  const handleRetake = () => {
    sfx.playClick();
    setCapturedImage(null);
    if (videoRef.current && localStreamRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleAccept = () => {
    sfx.playClick();
    if (capturedImage) {
      onPhotoAccepted(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-stone-200 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#7a1636]/10 text-[#7a1636]">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-stone-900">{t('photoModalTitle')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950 mb-0.5">{t('photoPrivacyNotice')}</p>
            <p className="text-[11px] text-amber-800">{t('photoForKidsNotice')}</p>
          </div>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-[#7a1636]/20 bg-stone-900 shadow-inner flex items-center justify-center">
          {capturedImage ? (
            <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
          ) : cameraError ? (
            <div className="p-4 text-center text-rose-300 text-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <span>{cameraError}</span>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          )}

          {/* Guide circle overlay */}
          {!capturedImage && !cameraError && (
            <div className="pointer-events-none absolute inset-0 rounded-full border border-white/40" />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {t('retake')}
              </button>
              <button
                onClick={handleAccept}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7a1636] text-white font-bold text-sm shadow-md hover:bg-[#60112a] transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {t('usePhoto')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium text-sm hover:bg-stone-50 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCapture}
                disabled={!!cameraError}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7a1636] text-white font-bold text-sm shadow-md hover:bg-[#60112a] disabled:opacity-50 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                {t('captureSnapshot')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

