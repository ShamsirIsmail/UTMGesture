// ============================================================
// UTM Gesture Quest V3.0 — Main Application Orchestrator
// Bilingual support, Leaderboard, Operator Management & Light Theme
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TranslationProvider } from './i18n/useTranslation';
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
import { sfx } from './services/audioEngine';
import { voice } from './services/voiceGuidance';
import { createHandLandmarker, isHandLandmarkerReady, detectHand } from './services/mediapipe';
import type { ScreenState, ControlMode, DifficultyLevel, LandmarkPoint } from './types';

function AppContent() {
  // Navigation & Game Modes
  const [screen, setScreen] = useState<ScreenState>('WELCOME');
  const [previousScreen, setPreviousScreen] = useState<ScreenState>('WELCOME');
  const [controlMode, setControlMode] = useState<ControlMode>('CAMERA');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('CASUAL');

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

  // Navigation handlers
  const goHome = useCallback(() => {
    sfx.playClick();
    setScreen('WELCOME');
    setElapsed(0);
    setGlitchHits(0);
    setMaxCombo(0);
    setHandDetected(false);
  }, []);

  const startGame = useCallback(() => {
    sfx.playClick();
    setElapsed(0);
    setGlitchHits(0);
    setMaxCombo(0);
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

  // Global Exhibition Keyboard Shortcuts (R, 1/2/3, M, F, Esc/H, O, S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

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
  ]);

  const handleGameComplete = useCallback(() => {
    setScreen('COMPLETE');
  }, []);

  return (
    <div className="relative w-full h-screen min-h-[600px] overflow-hidden bg-[#faf9f6] text-stone-900 font-sans select-none flex flex-col">
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
      <main className="relative flex-1 overflow-hidden">
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
            onPlayAgain={() => setScreen('GAMEPLAY')}
            onHome={goHome}
            onOpenLeaderboard={openLeaderboard}
            streamRef={streamRef}
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
