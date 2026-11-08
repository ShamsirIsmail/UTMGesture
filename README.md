# UTM Gesture Quest — Power the Future (V3.5)
### An Interactive AI Hand Gesture Exhibition Experience
**Event:** *Ziarah Kasih & Cakna Komuniti*  
**Date:** 10 November 2026  
**Venue:** Universiti Teknologi Malaysia (UTM)  
**Organizers & Partners:** Universiti Teknologi Malaysia (UTM), ASCEND UTM, Kelab Sahabat Jaya (KSJ), Jawatankuasa Kebajikan Mahasiswa Kolej Rahman Putra (JKM KSJ), Jawatankuasa Kebajikan Mahasiswa Kolej Tun Dr. Ismail (JKM LK)

---

## 🌟 Overview

**UTM Gesture Quest** is an interactive, browser-based vision AI game designed for public exhibition booths. Visitors—ranging from young children and university students to parents and senior citizens—control a real-time on-screen cursor entirely through natural hand gestures captured by a standard laptop webcam, without any physical controllers, wearables, or mouse input.

Participants collect glowing energy orbs, activate the **Future Core**, avoid AI glitch drones, and complete missions to claim a spot on the **Exhibition Leaderboard**.

---

## ✨ Key Features

- 🖐️ **Real-Time Computer Vision Tracking:** Powered by Google MediaPipe Hand Landmarker via WebAssembly and WebGL/GPU acceleration.
- ⚡ **Multi-Tier Gameplay Modes:**
  - **Santai (Casual):** 3 stationary orbs, no hazards, slow collection pacing. Perfect for young children, elderly visitors, and first-time AI users.
  - **Cabaran (Challenge):** 5 sequential orbs with 2 evasive AI Glitch Drones and tempo escalation.
  - **Pakar AI (Master AI):** 6 dynamic, evasive orbs with 3 high-speed glitch drones, combo multiplier rewards, and rapid core lock-in.
- 🎯 **Intuitive Gesture Mechanics:**
  - **Index Pointing:** Smooth real-time directional cursor movement.
  - **Pinch-to-Boost (Thumb + Index):** Activates 2× Turbo Lock for rapid energy absorption.
  - **Open-Palm Shield (5 Fingers Spread):** Deploys a protective kinetic energy barrier against Glitch Drones.
- 🌐 **100% Bilingual Interface & Voice Guidance:**
  - Seamless instant toggle between **Bahasa Melayu** (natural Malaysian localization) and **English**.
  - Event-driven voice narration powered by the Web Speech API (`speechSynthesis`).
- 🏆 **Exhibition Leaderboard & Optional Selfie Capture:**
  - Fast, reliable offline persistence via browser **IndexedDB** (`UTMGestureQuestDB`).
  - Spectator podium view displaying Top 10 rankings, completion times, and difficulty filters.
  - Live webcam photo snapshot capture (with full privacy opt-out / anonymous avatar support).
- 🛡️ **Exhibition Operator Console (PIN-Protected):**
  - Press `O` on any screen to access operator tools (Default PIN: `2026`).
  - Emergency home reset, developer debug overlay with live coordinate tracking, submission killswitch, and voice tester.
  - **Data Export:** Export full leaderboard records to **CSV** (privacy-safe, excludes raw photo data) or **JSON** (with optional Base64 photo inclusion).
- 🎬 **Cinematic Mission Complete Experience:**
  - 1.2s celebratory sequence with golden emblem animation, floating confetti, and victory fanfare.
  - Performance grade breakdown (S / A / B), max combo, hazard strikes, and prominent final time centerpiece.
  - Automatic progression loop (**Santai** $\to$ **Cabaran** $\to$ **Pakar AI** $\to$ **Main Semula**).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, TypeScript 5, Vite 5 |
| **Styling & Design** | Tailwind CSS 3, Custom Keyframe Animations |
| **Computer Vision AI** | `@mediapipe/tasks-vision` (Local WASM & Float16 Task Model) |
| **Icons** | Lucide React |
| **Audio & SFX** | Web Audio API (Synthesized polyphonic sound effects) |
| **Voice Guidance** | Web Speech API (`SpeechSynthesisUtterance`) |
| **Data Storage** | Client-Side IndexedDB (`UTMGestureQuestDB`) |
| **CI/CD** | GitHub Actions (`.github/workflows/deploy.yml`) |

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js (version 18.x or 20.x recommended)
- Modern web browser (Google Chrome, Microsoft Edge, or Chromium-based browser with WebRTC / webcam support)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<YOUR_ORGANIZATION>/UTMGesture.git
cd UTMGesture

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5173
```

### Production Build & Local Preview

```bash
# Type check and build bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🎮 Operator Shortcuts & Hotkeys

Exhibition operators and booth volunteers can manage the booth using the following keyboard shortcuts:

| Key | Action | Description |
|---|---|---|
| `O` | **Operator Panel** | Opens PIN-protected management modal (Default PIN: `2026`) |
| `M` | **Toggle Input Mode** | Switches between AI Webcam Tracking and Mouse Preview mode |
| `H` or `Esc` | **Home** | Returns to the Welcome Screen immediately |
| `L` | **Leaderboard** | Toggles the Exhibition Leaderboard screen |
| `F` | **Fullscreen** | Toggles browser fullscreen display mode |
| `S` | **SFX Audio** | Toggles sound effects on/off |
| `V` | **Voice Guidance** | Toggles spoken bilingual voice guidance on/off |
| `1` / `2` / `3` | **Difficulty Select** | Instantly switches difficulty: 1=Casual, 2=Challenge, 3=Master AI |
| `W` | **Operator Win** | Instantly triggers mission complete for quick presentation testing |

---

## 🔒 Data Privacy & IndexedDB Storage Architecture

1. **Origin Isolation:**  
   Leaderboard data and participant snapshots are stored client-side in the browser's **IndexedDB**. Data is isolated strictly to the running origin (e.g., `http://localhost:5173` is isolated from remote domains or other laptops). Data does not automatically synchronize across distinct machines or browsers.

2. **Participant Privacy Compliance:**  
   - Photo snapshots are completely optional. Participants may select an illustrated anonymous avatar instead.
   - Operators can delete individual photos without removing a participant's score.
   - The **CSV Export** utility excludes photo data entirely, generating lightweight, privacy-safe spreadsheets.
   - **Never commit or push participant data exports to public GitHub repositories.**

3. **Cloud Synchronization Readiness:**  
   The project includes an extensible backend service abstraction (`src/services/leaderboardBackend.ts`) ready for future cloud backends (e.g., Supabase) when multi-station synchronization is desired.

---

## 🚢 GitHub Pages Deployment

This repository includes an automated GitHub Actions deployment workflow:

1. Push your changes to the `main` branch.
2. In your GitHub repository settings, navigate to **Settings** $\to$ **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` builds the production bundle with the appropriate base path and publishes it to:
   ```
   https://<YOUR_USERNAME>.github.io/UTMGesture/
   ```

For detailed instructions, refer to [GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md).

---

## 🏛️ Acknowledgments & Credits

- **Host Institution:** Universiti Teknologi Malaysia (UTM)
- **Programme:** Ziarah Kasih & Cakna Komuniti 2026
- **Student Leadership Bodies:** ASCEND UTM, Kelab Sahabat Jaya (KSJ), JKM Kolej Rahman Putra, JKM Kolej Tun Dr. Ismail
- **Core Vision Engine:** Google MediaPipe Tasks-Vision Team
