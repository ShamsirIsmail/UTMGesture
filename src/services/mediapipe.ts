// ============================================================
// UTM Gesture Quest V2 — MediaPipe Hand Tracking Service
// Uses locally installed @mediapipe/tasks-vision (no CDN)
// WASM files served from /mediapipe-wasm/ in public/
// Model file served from /models/hand_landmarker.task
// ============================================================

import type { LandmarkPoint } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let HandLandmarker: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let FilesetResolver: any = null;

export interface HandTrackingResult {
  landmarks: LandmarkPoint[] | null;
  indexTip: { x: number; y: number } | null;
  thumbTip: { x: number; y: number } | null;
  isPinching: boolean;
  isOpenPalm: boolean;
}

export async function loadMediaPipeModules(): Promise<void> {
  if (HandLandmarker && FilesetResolver) return; // already loaded

  // Import from the locally installed npm package
  const module = await import('@mediapipe/tasks-vision');
  HandLandmarker = module.HandLandmarker;
  FilesetResolver = module.FilesetResolver;
}

import { getAssetUrl } from '../utils/assets';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let handLandmarkerInstance: any = null;

export async function createHandLandmarker(): Promise<void> {
  if (handLandmarkerInstance) return; // already initialized

  await loadMediaPipeModules();

  // Try local WASM first (respects Vite base path), fall back to CDN if not available
  const localWasmPath = getAssetUrl('/mediapipe-wasm');
  let vision;
  try {
    vision = await FilesetResolver.forVisionTasks(localWasmPath);
  } catch {
    // Fallback: use CDN WASM (requires internet)
    vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
  }

  // Try local model first (respects Vite base path), fall back to CDN
  let modelAssetPath = getAssetUrl('/models/hand_landmarker.task');
  try {
    const res = await fetch(modelAssetPath, { method: 'HEAD' });
    if (!res.ok) throw new Error('Local model not found');
  } catch {
    modelAssetPath =
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  }

  // Try GPU first with CPU fallback
  try {
    handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });
  } catch (gpuErr) {
    console.warn('MediaPipe GPU delegate failed or not supported, falling back to CPU:', gpuErr);
    handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.55,
      minHandPresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });
  }
}

export function detectHand(
  videoElement: HTMLVideoElement,
  timestampMs: number
): HandTrackingResult {
  if (!handLandmarkerInstance) {
    return { landmarks: null, indexTip: null, thumbTip: null, isPinching: false, isOpenPalm: false };
  }

  try {
    const results = handLandmarkerInstance.detectForVideo(videoElement, timestampMs);

    if (results.landmarks && results.landmarks.length > 0) {
      const hand = results.landmarks[0] as LandmarkPoint[];
      const wrist = hand[0];
      const thumbTip = hand[4];
      const indexPip = hand[6];
      const indexTip = hand[8];
      const middlePip = hand[10];
      const middleTip = hand[12];
      const ringPip = hand[14];
      const ringTip = hand[16];
      const pinkyPip = hand[18];
      const pinkyTip = hand[20];

      let isPinching = false;
      if (indexTip && thumbTip) {
        const dist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
        isPinching = dist < 0.068;
      }

      // Open Palm Classification: all 5 fingers fully extended and spread
      let isOpenPalm = false;
      if (
        !isPinching &&
        wrist &&
        thumbTip &&
        indexPip &&
        indexTip &&
        middlePip &&
        middleTip &&
        ringPip &&
        ringTip &&
        pinkyPip &&
        pinkyTip
      ) {
        const dWrist = (p: LandmarkPoint) => Math.hypot(p.x - wrist.x, p.y - wrist.y);
        const indexExtended = dWrist(indexTip) > dWrist(indexPip) * 1.15;
        const middleExtended = dWrist(middleTip) > dWrist(middlePip) * 1.15;
        const ringExtended = dWrist(ringTip) > dWrist(ringPip) * 1.15;
        const pinkyExtended = dWrist(pinkyTip) > dWrist(pinkyPip) * 1.15;
        const thumbExtended = dWrist(thumbTip) > dWrist(hand[2]) * 1.12;

        const palmSpread = Math.hypot(indexTip.x - pinkyTip.x, indexTip.y - pinkyTip.y) > 0.14;

        isOpenPalm =
          indexExtended &&
          middleExtended &&
          ringExtended &&
          pinkyExtended &&
          thumbExtended &&
          palmSpread;
      }

      return {
        landmarks: hand,
        indexTip: indexTip ? { x: indexTip.x, y: indexTip.y } : null,
        thumbTip: thumbTip ? { x: thumbTip.x, y: thumbTip.y } : null,
        isPinching,
        isOpenPalm,
      };
    }
  } catch {
    // Ignore transient frame errors
  }

  return { landmarks: null, indexTip: null, thumbTip: null, isPinching: false, isOpenPalm: false };
}

export function destroyHandLandmarker(): void {
  if (handLandmarkerInstance) {
    try { handLandmarkerInstance.close(); } catch { /* ignore */ }
    handLandmarkerInstance = null;
  }
}

export function isHandLandmarkerReady(): boolean {
  return handLandmarkerInstance !== null;
}

