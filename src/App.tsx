// ============================================================
// UTM Gesture Quest V3.0 — Main Application Orchestrator
// Bilingual support, Leaderboard, Operator Management & Light Theme
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TranslationProvider, useTranslation } from './i18n/useTranslation';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OperatorModal } from './components/OperatorModal';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { CalibrationScreen } from './screens/CalibrationScreen';
import { HowToPlayScreen } from './screens/HowToPlayScreen';
import { GameplayScreen } from './screens/GameplayScreen';
import { CompleteScreen } from './screens/CompleteScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { VoiceCaptionBanner } from './components/VoiceCaptionBanner';
import { OrientationGuard } from './components/OrientationGuard';
import { sfx } from './services/audioEngine';
import { voice } from './services/voiceGuidance';
import { createHandLandmarker, isHandLandmarkerReady, detectHand } from './services/mediapipe';
import type { ScreenState, ControlMode, DifficultyLevel, LandmarkPoint } from './types';

function AppContent() {
  const { language } = useTranslation();

  // Navigation & Game Modes
  const [screen, setScreen] = useState<ScreenState>('WELCOME');
  const [previousScreen, setPreviousScreen] = useState<ScreenState>('WELCOME');
  const [controlMode, setControlMode] = useState<ControlMode>('CAMERA');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('CASUAL');
  const [isPracticeRun, setIsPracticeRun] = useState(false);

  // UI & Operator Controls
  const [sfxEnabled, setSfxEnabled] = useState(() => sfx.enabled);
  const [voiceEnabled, setVoiceEnabled] = useState(() => voice.enabled);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [submissionsEnabled, setSubmissionsEnabled] = useState(true);

  // Camera & MediaPipe Tracking State
  const [cameraStatus, setCameraStatus] = useState<'IDLE' | 'LOADING' | 'READY' | 'ERROR'>('IDLE');
  const [cameraErrorMsg, setCameraErrorMsg] = useState('');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [calibrationLandmarks, setCalibrationLandmarks] = useState<LandmarkPoint[] | null>(null);

  // Performance metrics for current game session
  const [elapsed, setElapsed] = useState(0);
  const [glitchHits, setGlitchHits] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameRound, setGameRound] = useState(0);

  // Media streams & video references
  const streamRef = useRef<MediaStream | null>(null);
  const calibrationVideoRef = useRef<HTMLVideoElement>(null);

  // Toggle SFX
  const toggleSfx = useCallback(() => {
    setSfxEnabled((prev) => {
      const next = !prev;
      sfx.setEnabled(next);
      if (next) sfx.playClick();
      return next;
    });
  }, []);

  // Toggle Voice Narration
  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      voice.setEnabled(next);
      sfx.playClick();
      return next;
    });
  }, []);

  // Fullscreen Handler
  const toggleFullscreen = useCallback(() => {
    sfx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Cleanup camera stream on unmount
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Connect stream to calibration video preview
  useEffect(() => {
    if (screen === 'CALIBRATION' && controlMode === 'CAMERA' && calibrationVideoRef.current && streamRef.current) {
      calibrationVideoRef.current.srcObject = streamRef.current;
      calibrationVideoRef.current.play().catch(() => {});
    }
  }, [screen, controlMode]);

  // Camera & MediaPipe initialization flow
  const initializeCameraAndModel = useCallback(async () => {
    sfx.playClick();
    setCameraStatus('LOADING');
    setCameraErrorMsg('');
    setHandDetected(false);
    setScreen('CALIBRATION');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Webcam API is not available in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      if (calibrationVideoRef.current) {
        calibrationVideoRef.current.srcObject = stream;
        calibrationVideoRef.current.play().catch(() => {});
      }

      if (!isHandLandmarkerReady()) {
        await createHandLandmarker();
      }
      setModelLoaded(true);
      setCameraStatus('READY');
      setControlMode('CAMERA');

      // Calibration hand landmark tracking loop
      let rafId: number;
      let lastVideoTime = -1;
      let active = true;

      const detectLoop = () => {
        if (!active) return;
        const video = calibrationVideoRef.current;
        if (video && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          try {
            const result = detectHand(video, performance.now());
            if (result.landmarks) {
              setHandDetected(true);
              setCalibrationLandmarks(result.landmarks);
            } else {
              setHandDetected(false);
              setCalibrationLandmarks(null);
            }
          } catch {
            // ignore
          }
        }
        rafId = requestAnimationFrame(detectLoop);
      };
      rafId = requestAnimationFrame(detectLoop);

      return () => {
        active = false;
        cancelAnimationFrame(rafId);
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access webcam or load AI model.';
      setCameraStatus('ERROR');
      setCameraErrorMsg(
        msg.includes('Permission') || msg.includes('NotAllowed')
          ? 'Kebenaran kamera tidak diberikan. Sila benarkan akses kamera atau guna Mod Tetikus.'
          : `${msg} — Sila guna Mod Tetikus sekiranya kamera tidak tersedia.`
      );
    }
  }, []);

  // Activate Mouse Preview Mode
  const activateMousePreview = useCallback(() => {
    sfx.playClick();
    setControlMode('MOUSE');
    setHandDetected(true);
    setScreen('HOW_TO_PLAY');
  }, []);

  // Select difficulty
  const selectDifficulty = useCallback((d: DifficultyLevel) => {
    sfx.playClick();
    setDifficulty(d);
  }, []);

  // Stop welcome speech whenever transitioning away from WELCOME screen
  useEffect(() => {
    if (screen !== 'WELCOME') {
      voice.stopWelcome();
    }
  }, [screen]);

  // Navigation handlers
  const goHome = useCallback(() => {
    voice.stopWelcome();
    sfx.playClick();
    setScreen('WELCOME');
    setElapsed(0);
    setGlitchHits(0);
    setMaxCombo(0);
    setHandDetected(false);
    setIsPracticeRun(false);
  }, []);

  const startGame = useCallback(() => {
    sfx.playClick();
    setElapsed(0);
    setGlitchHits(0);
    setMaxCombo(0);
    setIsPracticeRun(false);
    setGameRound((r) => r + 1);
    setScreen('GAMEPLAY');
  }, []);

  const startNextLevel = useCallback((nextDiff: DifficultyLevel) => {
    console.log('[App] startNextLevel called with:', nextDiff);
    sfx.playClick();
    setDifficulty(nextDiff);
    setElapsed(0);
    setGlitchHits(0);
    setMaxCombo(0);
    setIsPracticeRun(false);
    setGameRound((r) => r + 1);
    setScreen('GAMEPLAY');
  }, []);

  const openLeaderboard = useCallback(() => {
    setPreviousScreen(screen);
    setScreen('LEADERBOARD');
  }, [screen]);

  // Switch between Camera and Mouse mode in gameplay
  const switchMode = useCallback(
    (mode: ControlMode) => {
      if (mode === 'CAMERA') {
        if (streamRef.current && isHandLandmarkerReady()) {
          setControlMode('CAMERA');
        } else {
          initializeCameraAndModel();
        }
      } else {
        setControlMode('MOUSE');
        setHandDetected(true);
      }
    },
    [initializeCameraAndModel]
  );

  // Global Exhibition Keyboard Shortcuts (W, Shift+W, R, 1/2/3, M, F, Esc/H, O, S, V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Safeguard 1: Ignore shortcuts when typing inside form inputs or editable areas
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      // Safeguard 2: Ignore key combinations with Ctrl, Alt, Meta
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Safeguard 3: Ignore repeated keydown events when key is held down
      if (e.repeat) return;

      // V3.7: Operator Welcome Narration Shortcuts
      if (e.code === 'KeyW' || e.key === 'w' || e.key === 'W') {
        if (isOperatorModalOpen) return;

        if (e.shiftKey) {
          // Shift + W: Immediately stop welcome narration & clear subtitles
          voice.stopWelcome();
          return;
        } else {
          // W: Play / Replay Welcome Narration (ONLY on Welcome Screen)
          if (screen === 'WELCOME') {
            voice.playWelcomeManual(language);
            return;
          }
          // Intentionally do NOT activate W during gameplay or other screens
          return;
        }
      }

      // Safeguard 4: If operator modal is open, only allow Escape or O to close it
      if (isOperatorModalOpen) {
        if (e.key === 'Escape' || e.key === 'o' || e.key === 'O') {
          sfx.playClick();
          setIsOperatorModalOpen(false);
        }
        return;
      }

      switch (e.key) {
        case 'r':
        case 'R':
          sfx.playClick();
          if (screen === 'GAMEPLAY' || screen === 'COMPLETE') startGame();
          break;
        case '1':
          selectDifficulty('CASUAL');
          break;
        case '2':
          selectDifficulty('CHALLENGE');
          break;
        case '3':
          selectDifficulty('MASTER');
          break;
        case 'Escape':
        case 'h':
        case 'H':
          if (screen === 'LEADERBOARD') {
            setScreen(previousScreen);
          } else {
            goHome();
          }
          break;
        case 'm':
        case 'M':
          sfx.playClick();
          if (controlMode === 'MOUSE') {
            if (streamRef.current && isHandLandmarkerReady()) {
              setControlMode('CAMERA');
            } else {
              initializeCameraAndModel();
            }
          } else {
            setControlMode('MOUSE');
            setHandDetected(true);
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 's':
        case 'S':
          toggleSfx();
          break;
        case 'v':
        case 'V':
          toggleVoice();
          break;
        case 'o':
        case 'O':
          sfx.playClick();
          setIsOperatorModalOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    screen,
    previousScreen,
    controlMode,
    selectDifficulty,
    goHome,
    startGame,
    toggleFullscreen,
    toggleSfx,
    toggleVoice,
    initializeCameraAndModel,
    isOperatorModalOpen,
    language,
  ]);

  const handleGameComplete = useCallback(() => {
    setScreen('COMPLETE');
  }, []);

  return (
    <div className="relative w-full h-full h-[100dvh] overflow-hidden bg-[#faf9f6] text-stone-900 font-sans select-none flex flex-col">
      {/* Exhibition Header Bar */}
      <Header
        screen={screen}
        difficulty={difficulty}
        controlMode={controlMode}
        sfxEnabled={sfxEnabled}
        voiceEnabled={voiceEnabled}
        isFullscreen={isFullscreen}
        onSelectDifficulty={selectDifficulty}
        onSwitchToCamera={() => {
          if (streamRef.current && isHandLandmarkerReady()) {
            setControlMode('CAMERA');
          } else {
            initializeCameraAndModel();
          }
        }}
        onSwitchToMouse={() => {
          sfx.playClick();
          setControlMode('MOUSE');
          setHandDetected(true);
        }}
        onToggleSfx={toggleSfx}
        onToggleVoice={toggleVoice}
        onToggleFullscreen={toggleFullscreen}
        onGoHome={goHome}
        onOpenLeaderboard={openLeaderboard}
      />

      {/* Main Screen Router */}
      <main className="relative flex-1 min-h-0 overflow-hidden">
        {screen === 'WELCOME' && (
          <WelcomeScreen
            controlMode={controlMode}
            cameraStatus={cameraStatus}
            hasExistingStream={!!streamRef.current}
            onStartCamera={initializeCameraAndModel}
            onMousePreview={activateMousePreview}
            onOpenLeaderboard={openLeaderboard}
          />
        )}

        {screen === 'CALIBRATION' && (
          <CalibrationScreen
            cameraStatus={cameraStatus}
            cameraErrorMsg={cameraErrorMsg}
            handDetected={handDetected}
            modelLoaded={modelLoaded}
            videoRef={calibrationVideoRef}
            landmarks={calibrationLandmarks}
            onProceedToHowToPlay={() => {
              sfx.playClick();
              setScreen('HOW_TO_PLAY');
            }}
            onMousePreview={activateMousePreview}
            onRetryCamera={initializeCameraAndModel}
          />
        )}

        {screen === 'HOW_TO_PLAY' && (
          <HowToPlayScreen
            difficulty={difficulty}
            controlMode={controlMode}
            onSelectDifficulty={selectDifficulty}
            onStartGame={startGame}
            streamRef={streamRef}
          />
        )}

        {screen === 'GAMEPLAY' && (
          <GameplayScreen
            key={`game-${difficulty}-${controlMode}-${gameRound}`}
            difficulty={difficulty}
            controlMode={controlMode}
            onComplete={handleGameComplete}
            onHome={goHome}
            onRestart={startGame}
            onSwitchMode={switchMode}
            streamRef={streamRef}
            onElapsedUpdate={setElapsed}
            onGlitchHitsUpdate={setGlitchHits}
            onMaxComboUpdate={setMaxCombo}
          />
        )}

        {screen === 'COMPLETE' && (
          <CompleteScreen
            difficulty={difficulty}
            elapsedSeconds={elapsed}
            glitchHits={glitchHits}
            maxCombo={maxCombo}
            controlMode={controlMode}
            onPlayAgain={startGame}
            onStartNextLevel={startNextLevel}
            onHome={goHome}
            onOpenLeaderboard={openLeaderboard}
            streamRef={streamRef}
            isPracticeRun={isPracticeRun}
          />
        )}

        {screen === 'LEADERBOARD' && (
          <LeaderboardScreen
            onBack={() => setScreen(previousScreen)}
            defaultDifficulty={difficulty}
          />
        )}
      </main>

      {/* Exhibition Footer Bar */}
      <Footer
        screen={screen}
        controlMode={controlMode}
        modelLoaded={modelLoaded}
        onOpenOperatorModal={() => setIsOperatorModalOpen(true)}
      />

      {/* Operator Modal */}
      <OperatorModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
        onResetGame={goHome}
        cameraStatus={cameraStatus}
        submissionsEnabled={submissionsEnabled}
        onToggleSubmissions={() => setSubmissionsEnabled(!submissionsEnabled)}
      />

      {/* Real-time Subtitles / Voice Caption Banner */}
      <VoiceCaptionBanner />

      {/* Mobile & Tablet Landscape Orientation Guard System */}
      <OrientationGuard
        isGameplay={screen === 'GAMEPLAY'}
        onRestartGameplay={startGame}
        onResumePractice={() => setIsPracticeRun(true)}
        isPracticeRun={isPracticeRun}
      />
    </div>
  );
}

export default function App() {
  return (
    <TranslationProvider>
      <AppContent />
    </TranslationProvider>
  );
}
