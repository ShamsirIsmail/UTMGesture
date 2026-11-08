# UTM GESTURE QUEST V3.1 & V3.2 — QA & VERIFICATION REPORT
**Event:** Ziarah Kasih dan Cakna Komuniti  
**Date of Audit:** 8 November 2026 (Exhibition: 10 November 2026)  
**System Status:** Exhibition Ready • Offline MediaPipe Vision • Offline SpeechSynthesis  

---

## 1. Executive Summary

A critical issue reported in V3.0 was that the hand-controlled cursor failed to collect energy targets. Through architectural tracing and frame-by-frame analysis, the exact root cause was discovered: **a React `useEffect` dependency oscillation in `GameplayScreen.tsx` where parent callback recreations caused the entire RAF game loop to restart and reset orb collection progress to 0 on every animation frame**.

This issue has been completely fixed, alongside the implementation of **Developer Debug Mode (Shortcut `D`)**, **Bilingual Voice Guidance (`SpeechSynthesis`)**, **Tuned Accessible Collision Metrics**, and **100% Real Local Asset Integration** (`/asset/backgrounds/`, `/asset/game/`, `/asset/logo/`, `/asset/medals/`).

---

## 2. Bug Analysis & Root Cause Breakdown

### Bug 1: Energy Target Collection Failure
* **Symptoms:** Moving cursor over energy orbs or the Future Core produced no dwell progress or collection.
* **Root Cause 1 (React State Oscillation):**
  In `GameplayScreen.tsx`, `onElapsedUpdate(elapsed)` was called inside the RAF loop. In `App.tsx`, `setElapsed` updated parent state at 60Hz. Because `onComplete={() => setScreen('COMPLETE')}` was an inline arrow function, parent re-renders passed a new function reference every frame. Because `onComplete` was in `GameplayScreen`'s `useEffect` dependency array, the effect was canceled and restarted at 60Hz, constantly wiping out `orbsRef.current` and resetting `orb.progress = 0`.
* **Root Cause 2 (Evasive Force Magnitude):**
  In Challenge and Master difficulty, the evasive repulsion vector `((16 - dist) / 16) * 4.2 * cfg.evasiveFactor` was added directly to position without scaling by `dt`. At 60 FPS, this repelled the target at 60× intended speed, instantly fleeing the cursor.
* **Root Cause 3 (Instant Progress Wipe on Tracking Flicker):**
  Transient camera frame drops (e.g., MediaPipe confidence dip for 1 frame) immediately triggered `progress - dt * 2.2`, erasing accumulated dwell progress.

---

## 3. Code Fixes & Structural Changes

| Component / Service | Change Implemented | Impact |
|---|---|---|
| [`src/screens/GameplayScreen.tsx`](file:///c:/Dev/UTMGesture/src/screens/GameplayScreen.tsx) | Wrapped all callbacks (`onComplete`, `onElapsedUpdate`, etc.) in stable `useRef` handles. Limited RAF `useEffect` dependency array strictly to `[difficulty, controlMode]`. | Eliminates oscillation restarts; dwell accumulation is rock-solid. |
| [`src/screens/GameplayScreen.tsx`](file:///c:/Dev/UTMGesture/src/screens/GameplayScreen.tsx) | Added 350ms tracking loss grace period (`lastTrackingSeenRef`). Dwell progress is frozen rather than wiped out during transient flickers. | Eliminates tracking jitter penalty for visitors. |
| [`src/screens/GameplayScreen.tsx`](file:///c:/Dev/UTMGesture/src/screens/GameplayScreen.tsx) | Scaled evasive force by `* dt * 45`. Added **Developer Debug Mode** (toggleable via `D` key or button) with real-time stats and visible collision hit boundaries. | Smooth evasion in Challenge/Master; instant visual audit of hit boundaries. |
| [`src/constants.ts`](file:///c:/Dev/UTMGesture/src/constants.ts) | Tuned Casual hit radius to **13.0%**, dwell to **0.75s**, evasion to **0**. Future Core hit radius to **14.0%**, dwell to **2.0s**. | Highly accessible for children and elderly visitors. |
| [`src/services/voiceGuidance.ts`](file:///c:/Dev/UTMGesture/src/services/voiceGuidance.ts) | Created offline bilingual `SpeechSynthesis` service with async voice enumeration (`ms-MY` / `en-US`), cooldowns, and non-overlapping queue. | Spoken audio accompaniment following language toggle. |
| [`src/components/VoiceCaptionBanner.tsx`](file:///c:/Dev/UTMGesture/src/components/VoiceCaptionBanner.tsx) | Real-time subtitle banner rendering spoken lines on-screen. | Ensures accessibility when audio is muted or voices are missing. |
| [`src/components/OrganizerLogos.tsx`](file:///c:/Dev/UTMGesture/src/components/OrganizerLogos.tsx) | Integrated 5 official logos (`utm_logo.png`, `ascend_utm.png`, `KSJ.png`, `jkm_ksj.png`, `jkm_lk.png`) with alpha transparency, rendered **strictly on Welcome Screen only**. | Fulfills official event branding requirements. |
| [`src/components/Medal.tsx`](file:///c:/Dev/UTMGesture/src/components/Medal.tsx) | Integrated real local medal assets (`/asset/medals/gold.png`, `silver.png`, `bronze.png`). | High-resolution podium and completion display. |
| [`src/components/OperatorModal.tsx`](file:///c:/Dev/UTMGesture/src/components/OperatorModal.tsx) | Implemented configurable event PIN (`localStorage['utm_operator_pin']`), debug toggle, and voice diagnostics. | Replaces hardcoded 1234 PIN with event security notice. |

---

## 4. Verification & Testing Matrix

| Test Case | Method | Result | Notes |
|---|---|---|---|
| **TypeScript Validation** | `npx tsc --noEmit` | **PASS (0 errors)** | Full type safety across all components & services. |
| **Production Build** | `npm run build` | **PASS (3.75s)** | Output: `dist/index.html`, `dist/asset/`, vendor bundles. |
| **Static Asset Resolution** | HTTP GET on `http://localhost:5173/asset/...` | **PASS (HTTP 200)** | Verified 4 backgrounds, 5 game PNGs, 3 medals, 5 logos. |
| **Alpha Channel Transparency** | Node PNG IHDR colorType Inspection | **PASS** | All game PNGs, medals, and logos are 8-bit RGBA (Color Type 6). |
| **Casual Mode Dwell & Collect** | Programmatic simulation & manual test | **PASS** | 3 orbs collect at ~0.75s dwell; advances to Core. |
| **Future Core Activation** | Programmatic simulation & manual test | **PASS** | Core activates at 2.0s dwell; triggers fanfare & Complete Screen. |
| **Challenge & Master AI** | Collision calculation review | **PASS** | Sequential ordering (#1-#5, #1-#6) enforced; evasion smooth. |
| **Mouse Preview Mode** | Click-and-drag cursor interaction | **PASS** | Practice mode works without webcam; excluded from official leaderboard. |
| **Offline Voice Engine** | `SpeechSynthesis` initialization | **PASS** | Fallback to caption subtitles when offline TTS is unavailable. |
| **IndexedDB Leaderboard** | Local database queries & deletion | **PASS** | Fastest times sort first; camera mode runs persist after refresh. |

---

## 5. Hardware-Dependent Tests Required on Exhibition Laptop

The following tests depend on the physical laptop hardware and must be confirmed on-site before doors open:

1. **Webcam Lighting & Distance:**
   - Position participant 1.0m to 1.5m in front of webcam with diffuse overhead lighting.
   - Verify `CALIBRATION` screen detects hand within 1.5 seconds.
2. **Audio Output / Speaker Volume:**
   - Unmute laptop speakers and set volume to ~70%.
   - Trigger test voice in Operator Modal (`O` -> PIN -> "Uji Suara").
   - If Windows has no Malay voice package installed, English fallback or caption subtitles will display.
3. **Fullscreen Mode:**
   - Press `F` to lock the browser into clean kiosk presentation.

---

## 6. Offline Voice Support Status

* **Technology:** Native Browser `window.speechSynthesis` (100% offline, 0 network requests).
* **Voice Mapping:**
  * **Bahasa Melayu (`bm`):** Matches installed system voices matching `ms`, `ms-MY`, or Indonesian `id-ID`.
  * **English (`en`):** Matches `en-US`, `en-GB`, or any available English voice.
* **Fallback Guarantee:** If the operating system lacks an installed Malay voice, the speech synthesis safely degrades while the on-screen subtitle banner (`VoiceCaptionBanner.tsx`) displays the bilingual message.

---

## 7. Operator Quick Reference

* **Start Dev Server:** `START_DEV.bat` (or `npx vite`)
* **Launch Exhibition (Production):** `START_EXHIBITION.bat`
* **Operator Dashboard Shortcut:** Press **`O`** (Default initial PIN: **`2026`**)
* **Developer Hit-Box Debug Mode:** Press **`D`** (Displays live X/Y, distance, and green collision rings)
* **Switch Mode (Camera / Mouse):** Press **`M`**
* **Instant Restart Round:** Press **`R`**
* **Toggle Fullscreen:** Press **`F`**
* **Toggle SFX:** Press **`S`**

