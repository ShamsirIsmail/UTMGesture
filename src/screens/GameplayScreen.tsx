// ============================================================
// UTM Gesture Quest V3.1 — Professional Gameplay Screen
// Clear 3-zone layout: Compact Status, Main Arena, Compact Progress
// Fixes: Stable game loop without unmount/reset oscillations,
// generous accessible hit zones, tracking loss freeze, Developer Debug Mode
// ============================================================

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  RotateCcw,
  XCircle,
  MousePointer,
  Camera,
  Timer,
  Zap,
  Flame,
  ShieldAlert,
  Award,
  Bug,
} from 'lucide-react';
import { GestureCursor } from '../components/GestureCursor';
import { EnergyOrb } from '../components/EnergyOrb';
import { GlitchDrone } from '../components/GlitchDrone';
import { FutureCore } from '../components/FutureCore';
import { HudPanel } from '../components/HudPanel';
import { sfx } from '../services/audioEngine';
import { voice } from '../services/voiceGuidance';
import { detectHand } from '../services/mediapipe';
import { useTranslation } from '../i18n/useTranslation';
import {
  DIFFICULTY_CONFIGS,
  createOrbsForDifficulty,
  createGlitchesForDifficulty,
  CORE_X_PCT,
  CORE_Y_PCT,
  CORE_HIT_RADIUS_PCT,
  CORE_ACTIVATION_SECONDS,
} from '../constants';
import type {
  OrbItem,
  GlitchDrone as GlitchDroneType,
  Point2D,
  LandmarkPoint,
  DifficultyLevel,
  ControlMode,
  GamePhase,
} from '../types';

interface GameplayScreenProps {
  difficulty: DifficultyLevel;
  controlMode: ControlMode;
  onComplete: () => void;
  onHome: () => void;
  onRestart: () => void;
  onSwitchMode: (mode: ControlMode) => void;
  streamRef: React.RefObject<MediaStream | null>;
  onElapsedUpdate: (s: number) => void;
  onGlitchHitsUpdate: (h: number) => void;
  onMaxComboUpdate: (c: number) => void;
}

interface FeedbackMsg {
  id: number;
  text: string;
  x: number;
  y: number;
  ts: number;
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  difficulty,
  controlMode,
  onComplete,
  onHome,
  onRestart,
  onSwitchMode,
  streamRef,
  onElapsedUpdate,
  onGlitchHitsUpdate,
  onMaxComboUpdate,
}) => {
  const { t, language } = useTranslation();
  const cfg = DIFFICULTY_CONFIGS[difficulty];

  // DOM refs
  const playfieldRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Stable callback refs to PREVENT parent re-renders from restarting RAF loop!
  const onCompleteRef = useRef(onComplete);
  const onElapsedUpdateRef = useRef(onElapsedUpdate);
  const onGlitchHitsUpdateRef = useRef(onGlitchHitsUpdate);
  const onMaxComboUpdateRef = useRef(onMaxComboUpdate);
  const languageRef = useRef(language);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onElapsedUpdateRef.current = onElapsedUpdate; }, [onElapsedUpdate]);
  useEffect(() => { onGlitchHitsUpdateRef.current = onGlitchHitsUpdate; }, [onGlitchHitsUpdate]);
  useEffect(() => { onMaxComboUpdateRef.current = onMaxComboUpdate; }, [onMaxComboUpdate]);
  useEffect(() => { languageRef.current = language; }, [language]);

  // Game state
  const [orbs, setOrbs] = useState<OrbItem[]>(() => createOrbsForDifficulty(difficulty));
  const [glitches, setGlitches] = useState<GlitchDroneType[]>(() => createGlitchesForDifficulty(difficulty));
  const [cursorPos, setCursorPos] = useState<Point2D>({ x: 0.5, y: 0.5 });
  const [handDetected, setHandDetected] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [landmarks, setLandmarks] = useState<LandmarkPoint[] | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('ORBS');
  const [coreProgress, setCoreProgress] = useState(0);
  const [coreHovering, setCoreHovering] = useState(false);
  const [shieldFlash, setShieldFlash] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [feedbackMsgs, setFeedbackMsgs] = useState<FeedbackMsg[]>([]);
  const [activeHoverOrbId, setActiveHoverOrbId] = useState<number | null>(null);
  const [collectedCount, setCollectedCount] = useState(0);
  const [isShieldActive, setIsShieldActive] = useState(false);

  // Developer Debug Mode state
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    cursorX: number;
    cursorY: number;
    activeTargetId: number | null;
    targetX: number;
    targetY: number;
    distance: number;
    threshold: number;
    inCollision: boolean;
    dwellPct: number;
  }>({
    cursorX: 50,
    cursorY: 50,
    activeTargetId: null,
    targetX: 0,
    targetY: 0,
    distance: 0,
    threshold: cfg.hitRadiusPct,
    inCollision: false,
    dwellPct: 0,
  });

  // Mutable refs for RAF loop
  const orbsRef = useRef(orbs);
  const glitchesRef = useRef(glitches);
  const rawPosRef = useRef<Point2D>({ x: 0.5, y: 0.5 });
  const smoothPosRef = useRef<Point2D>({ x: 0.5, y: 0.5 });
  const handDetectedRef = useRef(false);
  const isPinchingRef = useRef(false);
  const latestLandmarksRef = useRef<LandmarkPoint[] | null>(null);
  const gamePhaseRef = useRef<GamePhase>('ORBS');
  const coreProgressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastHoverSoundRef = useRef(0);
  const lastGlitchHitRef = useRef(0);
  const gameStartRef = useRef(performance.now());
  const lastFrameRef = useRef(performance.now());
  const lastTrackingSeenRef = useRef(performance.now());
  const glitchHitsRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const feedbackIdRef = useRef(0);
  const isShieldActiveRef = useRef(false);
  const shieldExpiresAtRef = useRef(0);
  const shieldCooldownUntilRef = useRef(0);
  const palmStartRef = useRef(0);
  const difficultyRef = useRef(difficulty);
  const controlModeRef = useRef(controlMode);
  const lastParentElapsedReportRef = useRef(0);

  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { controlModeRef.current = controlMode; }, [controlMode]);
  useEffect(() => { gamePhaseRef.current = gamePhase; }, [gamePhase]);
  useEffect(() => { coreProgressRef.current = coreProgress; }, [coreProgress]);

  // Voice greeting on gameplay start (plays once per round)
  useEffect(() => {
    voice.resetRound();
    const timer = setTimeout(() => {
      voice.speakGameplayStart(languageRef.current);
    }, 800);
    return () => {
      clearTimeout(timer);
      voice.cancel();
    };
  }, []);

  // Floating feedback popups
  const showFeedback = useCallback((text: string, x: number, y: number) => {
    const id = ++feedbackIdRef.current;
    const msg: FeedbackMsg = { id, text, x, y, ts: performance.now() };
    setFeedbackMsgs((prev) => [...prev.slice(-3), msg]);
    setTimeout(() => setFeedbackMsgs((prev) => prev.filter((m) => m.id !== id)), 1500);
  }, []);

  // Developer Debug Mode toggle via key 'D' & Spacebar Shield for Mouse Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'd' || e.key === 'D') {
        setDebugMode((prev) => !prev);
      }
      if (e.key === 'w' || e.key === 'W') {
        const now = performance.now();
        const elap = Math.max(1, (now - gameStartRef.current) / 1000);
        onElapsedUpdateRef.current(elap);
        onCompleteRef.current();
      }
      if (e.code === 'Space' && controlModeRef.current === 'MOUSE' && difficultyRef.current !== 'CASUAL') {
        const now = performance.now();
        if (now >= shieldCooldownUntilRef.current && !isShieldActiveRef.current) {
          isShieldActiveRef.current = true;
          shieldExpiresAtRef.current = now + 3000;
          shieldCooldownUntilRef.current = now + 8500;
          setIsShieldActive(true);
          sfx.playShieldActivate();
          showFeedback(t('shieldActive'), smoothPosRef.current.x * 100, smoothPosRef.current.y * 100 - 10);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFeedback, t]);

  // Attach webcam stream to video element
  useEffect(() => {
    if (controlMode === 'CAMERA' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [controlMode, streamRef]);

  // Mouse handlers (Mouse Preview Mode)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (controlModeRef.current !== 'MOUSE' || !playfieldRef.current) return;
    const rect = playfieldRef.current.getBoundingClientRect();
    rawPosRef.current = {
      x: Math.min(0.98, Math.max(0.02, (e.clientX - rect.left) / rect.width)),
      y: Math.min(0.98, Math.max(0.02, (e.clientY - rect.top) / rect.height)),
    };
    lastTrackingSeenRef.current = performance.now();
  }, []);

  const handleMouseDown = useCallback(() => {
    if (controlModeRef.current !== 'MOUSE') return;
    isPinchingRef.current = true;
    setIsPinching(true);
    sfx.playPinchEngage();
  }, []);

  const handleMouseUp = useCallback(() => {
    if (controlModeRef.current !== 'MOUSE') return;
    isPinchingRef.current = false;
    setIsPinching(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (controlModeRef.current !== 'MOUSE' || !playfieldRef.current || !e.touches.length) return;
    const touch = e.touches[0];
    const rect = playfieldRef.current.getBoundingClientRect();
    rawPosRef.current = {
      x: Math.min(0.98, Math.max(0.02, (touch.clientX - rect.left) / rect.width)),
      y: Math.min(0.98, Math.max(0.02, (touch.clientY - rect.top) / rect.height)),
    };
    lastTrackingSeenRef.current = performance.now();
  }, []);

  // ============================================================
  // STABLE RAF GAMEPLAY LOOP
  // Note: Dependencies strictly limited to difficulty and controlMode
  // to prevent re-render tearing or resetting orb collection progress!
  // ============================================================
  useEffect(() => {
    const currentDiff = difficulty;
    const currentMode = controlMode;
    const freshOrbs = createOrbsForDifficulty(currentDiff);
    const freshGlitches = createGlitchesForDifficulty(currentDiff);

    orbsRef.current = freshOrbs;
    glitchesRef.current = freshGlitches;
    setOrbs(freshOrbs);
    setGlitches(freshGlitches);
    gamePhaseRef.current = 'ORBS';
    coreProgressRef.current = 0;
    setGamePhase('ORBS');
    setCoreProgress(0);
    setComboCount(0);
    setElapsedSeconds(0);
    setCollectedCount(0);
    glitchHitsRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    gameStartRef.current = performance.now();
    lastFrameRef.current = performance.now();
    lastVideoTimeRef.current = -1;
    lastTrackingSeenRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;
      const activeCfg = DIFFICULTY_CONFIGS[difficultyRef.current];
      const elapsed = (now - gameStartRef.current) / 1000;
      setElapsedSeconds(elapsed);

      // Throttle reporting to parent App to prevent 60Hz parent re-render oscillation
      if (now - lastParentElapsedReportRef.current > 200) {
        lastParentElapsedReportRef.current = now;
        onElapsedUpdateRef.current(elapsed);
      }

      // 1. Hand Tracking (CAMERA mode)
      if (controlModeRef.current === 'CAMERA') {
        const video = videoRef.current;
        if (video && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const result = detectHand(video, now);
          if (result.landmarks && result.landmarks.length > 0) {
            lastTrackingSeenRef.current = now;
            latestLandmarksRef.current = result.landmarks as LandmarkPoint[];
            if (result.indexTip) {
              const mx = 1 - result.indexTip.x;
              // Mirror selfie and map to calibrated usable region
              rawPosRef.current = {
                x: Math.min(0.98, Math.max(0.02, (mx - 0.08) / 0.84)),
                y: Math.min(0.98, Math.max(0.02, (result.indexTip.y - 0.08) / 0.84)),
              };
            }
            if (result.isPinching !== isPinchingRef.current) {
              isPinchingRef.current = result.isPinching;
              setIsPinching(result.isPinching);
              if (result.isPinching) sfx.playPinchEngage();
            }

            // Open Palm Shield Detection (Challenge & Master difficulty only)
            if (difficultyRef.current !== 'CASUAL') {
              if (result.isOpenPalm) {
                if (palmStartRef.current === 0) palmStartRef.current = now;
                // Require stable pose for >= 320ms before triggering to prevent false positives
                if (
                  now - palmStartRef.current >= 320 &&
                  now >= shieldCooldownUntilRef.current &&
                  !isShieldActiveRef.current
                ) {
                  isShieldActiveRef.current = true;
                  shieldExpiresAtRef.current = now + 3000; // 3.0s duration
                  shieldCooldownUntilRef.current = now + 8500; // 8.5s cooldown
                  setIsShieldActive(true);
                  sfx.playShieldActivate();
                  showFeedback(t('shieldActive'), smoothPosRef.current.x * 100, smoothPosRef.current.y * 100 - 10);
                  palmStartRef.current = 0;
                }
              } else {
                palmStartRef.current = 0;
              }
            }

            if (!handDetectedRef.current) {
              handDetectedRef.current = true;
              setHandDetected(true);
            }
          } else {
            palmStartRef.current = 0;
            // Transient tracking drop
            latestLandmarksRef.current = null;
            // Grace period: only declare hand lost if missing for > 350ms
            if (now - lastTrackingSeenRef.current > 350) {
              if (handDetectedRef.current) {
                handDetectedRef.current = false;
                setHandDetected(false);
              }
              if (isPinchingRef.current) {
                isPinchingRef.current = false;
                setIsPinching(false);
              }
            }
          }
          setLandmarks(latestLandmarksRef.current);
        }
      } else {
        // MOUSE mode
        lastTrackingSeenRef.current = now;
        if (!handDetectedRef.current) {
          handDetectedRef.current = true;
          setHandDetected(true);
        }
      }

      // 2. Smooth Cursor Positioning (LERP)
      const lerp = controlModeRef.current === 'CAMERA' ? 0.28 : 0.42;
      smoothPosRef.current = {
        x: smoothPosRef.current.x + (rawPosRef.current.x - smoothPosRef.current.x) * lerp,
        y: smoothPosRef.current.y + (rawPosRef.current.y - smoothPosRef.current.y) * lerp,
      };
      setCursorPos({ ...smoothPosRef.current });

      const cx = smoothPosRef.current.x * 100;
      const cy = smoothPosRef.current.y * 100;

      // Tracking validity check: active if in mouse mode or tracked recently within grace window
      const isTracking =
        controlModeRef.current === 'MOUSE' ||
        handDetectedRef.current ||
        now - lastTrackingSeenRef.current < 350;

      // Expire shield
      if (isShieldActiveRef.current && now > shieldExpiresAtRef.current) {
        isShieldActiveRef.current = false;
        setIsShieldActive(false);
      }

      // 3. PHASE 1: ORBS COLLECTION
      if (gamePhaseRef.current === 'ORBS') {
        let hitGlitch = false;

        // Patrol AI Glitch Drones
        if (glitchesRef.current.length > 0) {
          const nextGlitches = glitchesRef.current.map((g) => {
            let nx = g.x + g.vx * dt;
            let ny = g.y + g.vy * dt;
            let nvx = g.vx, nvy = g.vy;
            if (nx < 27 || nx > 92) { nvx = -nvx; nx = Math.min(92, Math.max(27, nx)); }
            if (ny < 15 || ny > 82) { nvy = -nvy; ny = Math.min(82, Math.max(15, ny)); }
            if (isTracking && now - lastGlitchHitRef.current > 1100) {
              const d = Math.hypot(cx - nx, (cy - ny) * 0.85);
              if (d <= g.radiusPct) hitGlitch = true;
            }
            return { ...g, x: nx, y: ny, vx: nvx, vy: nvy };
          });
          glitchesRef.current = nextGlitches;
          setGlitches(nextGlitches);
        }

        if (hitGlitch) {
          lastGlitchHitRef.current = now;
          if (isShieldActiveRef.current) {
            // Deflected by Open Palm Shield!
            sfx.playShieldBlock();
            showFeedback(t('shieldBlocked'), cx, cy - 8);
          } else {
            sfx.playGlitchHit();
            glitchHitsRef.current++;
            onGlitchHitsUpdateRef.current(glitchHitsRef.current);
            comboRef.current = 0;
            setComboCount(0);
            setShieldFlash(true);
            setTimeout(() => setShieldFlash(false), 550);
          }
        }

        // Sequential target tracking
        const uncollected = orbsRef.current.filter((o) => !o.collected);
        const nextOrder =
          activeCfg.sequential && uncollected.length > 0
            ? Math.min(...uncollected.map((o) => o.orderNumber))
            : null;

        let newlyCollected = 0;
        let currentHoverId: number | null = null;
        let debugTargetInfo = {
          targetId: null as number | null,
          tx: 0,
          ty: 0,
          dist: 999,
          inHit: false,
          dwell: 0,
        };

        const chargeBoost = isPinchingRef.current ? 1.85 : 1.0;

        const updatedOrbs = orbsRef.current.map((orb) => {
          if (orb.collected) return orb;

          const tSec = elapsed * activeCfg.orbSpeed;
          let nx = orb.baseX + Math.sin(tSec * orb.freqX + orb.phaseX) * orb.ampX * (activeCfg.orbSpeed > 0.5 ? 1 : 0.4);
          let ny = orb.baseY + Math.cos(tSec * orb.freqY + orb.phaseY) * orb.ampY * (activeCfg.orbSpeed > 0.5 ? 1 : 0.4);

          // Evasion (smoothed by dt * 50 so it doesn't repel instantaneously)
          if (activeCfg.evasiveFactor > 0) {
            const dxC = nx - cx, dyC = ny - cy;
            const dist = Math.hypot(dxC, dyC * 0.85);
            if (dist < 15 && dist > 0.5) {
              const push = ((15 - dist) / 15) * 45 * activeCfg.evasiveFactor * dt;
              nx += (dxC / dist) * push;
              ny += (dyC / dist) * push;
            }
          }

          nx = Math.min(91, Math.max(27, nx));
          ny = Math.min(80, Math.max(18, ny));

          if (hitGlitch) {
            return { ...orb, x: nx, y: ny, progress: Math.max(0, orb.progress - 0.4) };
          }

          const isUnlocked = !activeCfg.sequential || orb.orderNumber === nextOrder;

          // Track debug info for the current sequential target (or first uncollected)
          if (isUnlocked && debugTargetInfo.targetId === null) {
            const d = Math.hypot(cx - nx, (cy - ny) * 0.85);
            debugTargetInfo = {
              targetId: orb.id,
              tx: nx,
              ty: ny,
              dist: d,
              inHit: d <= activeCfg.hitRadiusPct,
              dwell: orb.progress,
            };
          }

          // If tracking dropped recently, freeze progress instead of rapid wipe
          if (!isTracking) {
            return { ...orb, x: nx, y: ny }; // freeze dwell progress during brief tracking loss
          }

          if (!isUnlocked) {
            return { ...orb, x: nx, y: ny, progress: Math.max(0, orb.progress - dt * 1.5) };
          }

          const dist = Math.hypot(cx - nx, (cy - ny) * 0.85);

          if (dist <= activeCfg.hitRadiusPct) {
            currentHoverId = orb.id;
            const nextProg = Math.min(1, orb.progress + (dt / activeCfg.dwellSeconds) * chargeBoost);

            if (now - lastHoverSoundRef.current > 110) {
              lastHoverSoundRef.current = now;
              sfx.playHoverTick(nextProg);
            }

            if (nextProg >= 1) {
              const totalDone = orbsRef.current.filter((o) => o.collected).length + 1;
              newlyCollected = totalDone;
              return { ...orb, x: nx, y: ny, collected: true, progress: 1, collectedAt: now };
            }
            return { ...orb, x: nx, y: ny, progress: nextProg };
          } else {
            // Gentle decay when cursor leaves target
            return { ...orb, x: nx, y: ny, progress: Math.max(0, orb.progress - dt * 0.8) };
          }
        });

        setActiveHoverOrbId(currentHoverId);
        orbsRef.current = updatedOrbs;
        setOrbs(updatedOrbs);

        // Update Developer Debug Mode readings
        setDebugInfo({
          cursorX: cx,
          cursorY: cy,
          activeTargetId: debugTargetInfo.targetId,
          targetX: debugTargetInfo.tx,
          targetY: debugTargetInfo.ty,
          distance: debugTargetInfo.dist,
          threshold: activeCfg.hitRadiusPct,
          inCollision: debugTargetInfo.inHit,
          dwellPct: Math.round(debugTargetInfo.dwell * 100),
        });

        if (newlyCollected > 0) {
          sfx.playOrbCollect(newlyCollected);
          // Orb collection uses short positive SFX only (no voice sentence per orb)
          setCollectedCount(newlyCollected);
          comboRef.current++;
          if (comboRef.current > maxComboRef.current) {
            maxComboRef.current = comboRef.current;
            onMaxComboUpdateRef.current(maxComboRef.current);
          }
          setComboCount(comboRef.current);

          const collectedOrb = updatedOrbs.find((o) => o.collected && o.collectedAt === now);
          if (collectedOrb) {
            showFeedback(t('energyCollected'), collectedOrb.x, collectedOrb.y - 7);
          }

          // Advance to Mission 2: Future Core
          if (newlyCollected >= activeCfg.orbCount) {
            setTimeout(() => {
              gamePhaseRef.current = 'CORE';
              setGamePhase('CORE');
              voice.speakFinalMission(languageRef.current);
              showFeedback(t('activateCore'), 50, 25);
            }, 450);
          }
        }
      }

      // 4. PHASE 2: FUTURE CORE ACTIVATION
      else if (gamePhaseRef.current === 'CORE') {
        const dxCore = cx - CORE_X_PCT;
        const dyCore = cy - CORE_Y_PCT;
        const distCore = Math.hypot(dxCore, dyCore * 0.85);
        const isHoverCore = isTracking && distCore <= CORE_HIT_RADIUS_PCT;
        setCoreHovering(isHoverCore);

        // Debug info during Core Phase
        setDebugInfo({
          cursorX: cx,
          cursorY: cy,
          activeTargetId: 99,
          targetX: CORE_X_PCT,
          targetY: CORE_Y_PCT,
          distance: distCore,
          threshold: CORE_HIT_RADIUS_PCT,
          inCollision: isHoverCore,
          dwellPct: Math.round(coreProgressRef.current * 100),
        });

        if (isHoverCore) {
          const nextProg = Math.min(1, coreProgressRef.current + dt / CORE_ACTIVATION_SECONDS);
          coreProgressRef.current = nextProg;
          setCoreProgress(nextProg);

          if (now - lastHoverSoundRef.current > 120) {
            lastHoverSoundRef.current = now;
            sfx.playCoreCharge(nextProg);
          }

          if (nextProg >= 1) {
            gamePhaseRef.current = 'TRANSITION';
            setGamePhase('TRANSITION');
            sfx.playCoreActivate();
            voice.speakCompletion(languageRef.current);
            setTimeout(() => {
              sfx.playVictoryFanfare();
              onElapsedUpdateRef.current(elapsed);
              onCompleteRef.current();
            }, 1200);
          }
        } else {
          // If tracking temporarily lost, freeze core progress; otherwise slow decay
          if (isTracking) {
            coreProgressRef.current = Math.max(0, coreProgressRef.current - dt * 0.35);
            setCoreProgress(coreProgressRef.current);
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [difficulty, controlMode, showFeedback, t]);

  const nextTargetOrder = cfg.sequential
    ? (() => {
        const unc = orbs.filter((o) => !o.collected);
        return unc.length > 0 ? Math.min(...unc.map((o) => o.orderNumber)) : null;
      })()
    : null;

  const totalOrbs = cfg.orbCount;

  return (
    <div
      ref={playfieldRef}
      className="relative w-full h-full bg-gameplay-light overflow-hidden cursor-none select-none touch-none"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
    >
      {/* Glitch Flash Alert */}
      {shieldFlash && (
        <div className="pointer-events-none absolute inset-0 z-40 bg-rose-500/20 border-4 border-rose-500 flex items-center justify-center">
          <div className="px-5 py-2 rounded-full bg-white text-rose-700 font-bold text-xs uppercase shadow-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            {t('glitchAlert')}
          </div>
        </div>
      )}

      {/* Core Activation Transition Overlay */}
      {gamePhase === 'TRANSITION' && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-xs animate-fadeIn">
          <div className="text-center p-8 rounded-3xl bg-white border border-[#7a1636]/30 shadow-exhibition-lg">
            <Award className="w-16 h-16 text-[#7a1636] mx-auto mb-3 animate-bounce" />
            <div className="text-3xl font-serif font-black text-[#7a1636] mb-1">
              {t('coreActivated')}
            </div>
            <div className="text-sm font-semibold text-stone-600">
              {t('futureStarts')}
            </div>
          </div>
        </div>
      )}

      {/* DEVELOPER DEBUG MODE OVERLAY PANEL (Operator Key 'D') */}
      {debugMode && (
        <div className="absolute top-16 right-5 z-40 p-3.5 rounded-2xl bg-stone-900/95 text-white font-mono text-[11px] shadow-exhibition-lg border border-amber-400/50 backdrop-blur-md max-w-xs space-y-1">
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-stone-700 text-amber-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5" /> DEV DEBUG MODE (D)
            </span>
            <span className="text-[9px] bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded font-black">
              ACTIVE
            </span>
          </div>
          <div>Mode: <span className="text-sky-400 font-bold">{controlMode}</span> | Diff: <span className="text-amber-300 font-bold">{difficulty}</span></div>
          <div>Hand Detected: <span className={handDetected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{handDetected ? 'YES' : 'NO'}</span></div>
          <div>Cursor: <span className="text-white font-bold">({debugInfo.cursorX.toFixed(1)}%, {debugInfo.cursorY.toFixed(1)}%)</span></div>
          <div>Target: <span className="text-amber-300 font-bold">#{debugInfo.activeTargetId || '-'} ({debugInfo.targetX.toFixed(1)}%, {debugInfo.targetY.toFixed(1)}%)</span></div>
          <div>Distance: <span className={debugInfo.inCollision ? 'text-emerald-400 font-bold' : 'text-stone-300'}>{debugInfo.distance.toFixed(1)}%</span> / Threshold: <span className="text-amber-400">{debugInfo.threshold.toFixed(1)}%</span></div>
          <div>Collision: <span className={debugInfo.inCollision ? 'text-emerald-400 font-bold animate-pulse' : 'text-rose-400'}>{debugInfo.inCollision ? 'YES (HIT!)' : 'NO'}</span></div>
          <div>Dwell Charge: <span className="text-sky-300 font-bold">{debugInfo.dwellPct}%</span></div>
          <div>Phase: <span className="text-purple-300 font-bold">{gamePhase}</span> ({collectedCount}/{totalOrbs})</div>
        </div>
      )}

      {/* ZONE A: Compact Status Panel (Top-Left) */}
      <HudPanel
        controlMode={controlMode}
        handDetected={handDetected}
        isPinching={isPinching}
        difficulty={difficulty}
        videoRef={videoRef}
        landmarks={landmarks}
        cursorX={cursorPos.x}
        cursorY={cursorPos.y}
        collectedCount={collectedCount}
        totalOrbs={totalOrbs}
        currentMissionText={
          gamePhase === 'ORBS'
            ? nextTargetOrder !== null
              ? `${t('collectTarget')} #${nextTargetOrder}`
              : t('collectAllOrbs')
            : t('activateCore')
        }
      />

      {/* ZONE C: Compact Progress Display (Top-Right) */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-5 z-20 flex items-center gap-1.5 sm:gap-2 pointer-events-none safe-area-pr">
        {/* Debug indicator button (hidden on mobile landscape via hud-hide-short) */}
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`hud-hide-short pointer-events-auto hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
            debugMode
              ? 'bg-amber-500 text-white border-amber-400 shadow-xs'
              : 'bg-white/90 border-stone-200 text-stone-600 hover:bg-stone-100'
          }`}
          title="Toggle Developer Debug Mode (Shortcut: D)"
        >
          <Bug className="w-3.5 h-3.5" />
          <span className="text-[10px]">Debug (D)</span>
        </button>

        {/* Combo Badge */}
        {comboCount > 1 && (
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-500 text-white font-black text-[10px] sm:text-xs shadow-xs animate-bounce">
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{comboCount}×</span>
          </div>
        )}

        {/* Stopwatch */}
        <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/95 border border-stone-200 text-stone-800 font-mono text-[11px] sm:text-xs font-bold shadow-xs">
          <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#7a1636]" />
          <span>{elapsedSeconds.toFixed(1)}s</span>
        </div>

        {/* Energy Orb Counter */}
        <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/95 border border-stone-200 text-stone-800 text-[11px] sm:text-xs font-black shadow-xs">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#7a1636]" />
          <span>
            {gamePhase === 'ORBS' ? `${collectedCount}/${totalOrbs}` : `${totalOrbs}/${totalOrbs}`}
          </span>
        </div>
      </div>

      {/* Top Center Mission Notice */}
      <div className="absolute top-3 sm:top-4 inset-x-0 z-10 flex justify-center pointer-events-none">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1 sm:py-1.5 rounded-full bg-white/90 border border-[#7a1636]/30 shadow-xs text-[10px] sm:text-xs font-bold text-stone-800">
          <span className="w-2 h-2 rounded-full bg-[#7a1636] animate-ping" />
          <span>
            {gamePhase === 'ORBS'
              ? nextTargetOrder !== null
                ? `${t('collectTarget')} #${nextTargetOrder}`
                : t('collectAllOrbs')
              : t('holdSteadyOnCore')}
          </span>
          {isPinching && (
            <span className="px-1.5 sm:px-2 py-0.2 rounded-full bg-sky-500 text-white text-[9px] sm:text-[9.5px] font-black animate-pulse">
              {t('turboActive')}
            </span>
          )}
        </div>
      </div>

      {/* ZONE B: Main Interactive Arena */}

      {/* Red AI Glitch Drones */}
      {gamePhase === 'ORBS' &&
        glitches.map((g) => <GlitchDrone key={`drone-${g.id}`} x={g.x} y={g.y} />)}

      {/* Energy Orbs */}
      {gamePhase === 'ORBS' &&
        orbs.map((orb) => (
          <EnergyOrb
            key={`orb-${orb.id}`}
            id={orb.id}
            orderNumber={orb.orderNumber}
            x={orb.x}
            y={orb.y}
            collected={orb.collected}
            collectedAt={orb.collectedAt}
            progress={orb.progress}
            isHovering={activeHoverOrbId === orb.id && !orb.collected}
            isNextTarget={!cfg.sequential || orb.orderNumber === nextTargetOrder}
            isLocked={!orb.collected && cfg.sequential && orb.orderNumber !== nextTargetOrder}
            isPinching={isPinching}
            sequential={cfg.sequential}
            difficulty={difficulty}
            hitRadiusPct={cfg.hitRadiusPct}
            debugMode={debugMode}
          />
        ))}

      {/* Future Core (Phase 2) */}
      <FutureCore
        progress={coreProgress}
        isHovering={coreHovering}
        visible={gamePhase === 'CORE' || gamePhase === 'TRANSITION'}
        debugMode={debugMode}
      />

      {/* Floating feedback text */}
      {feedbackMsgs.map((msg) => {
        const age = performance.now() - msg.ts;
        const alpha = Math.max(0, 1 - age / 1500);
        const dy = -(age / 1500) * 35;
        return (
          <div
            key={msg.id}
            className="pointer-events-none absolute z-30 -translate-x-1/2 font-black text-xs sm:text-sm px-2.5 py-1 rounded-full bg-white border border-[#7a1636]/30 shadow-xs"
            style={{
              left: `${msg.x}%`,
              top: `${msg.y}%`,
              transform: `translateX(-50%) translateY(${dy}px)`,
              opacity: alpha,
              color: '#7a1636',
            }}
          >
            {msg.text}
          </div>
        );
      })}

      {/* Virtual Gesture Cursor */}
      <GestureCursor
        x={cursorPos.x}
        y={cursorPos.y}
        isPinching={isPinching}
        isShieldActive={isShieldActive}
        handDetected={handDetected}
        controlMode={controlMode}
        coreProgress={gamePhase === 'CORE' && coreHovering ? coreProgress : 0}
      />

      {/* Bottom Operator & Quick Action Bar */}
      <div className="absolute bottom-2 sm:bottom-3 inset-x-0 z-20 flex items-center justify-center px-2 sm:px-4 pointer-events-auto safe-area-pb">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/95 border border-stone-200/90 shadow-exhibition text-[11px] sm:text-xs">
          <button
            onClick={() => {
              sfx.playClick();
              onHome();
            }}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
          >
            <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-500" />
            <span>{t('home')}</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              const nextMode: ControlMode = controlMode === 'CAMERA' ? 'MOUSE' : 'CAMERA';
              onSwitchMode(nextMode);
            }}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
          >
            {controlMode === 'CAMERA' ? (
              <>
                <MousePointer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-500" />
                <span>{t('mousePreview')}</span>
              </>
            ) : (
              <>
                <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                <span>{t('aiCamera')}</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              onRestart();
            }}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#7a1636] text-white font-bold cursor-pointer hover:bg-[#62102b] transition-colors"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{t('restart')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
