# UTM GESTURE QUEST V3.6 — GITHUB RELEASE & PRODUCTION VERIFICATION REPORT
**Project:** UTM Gesture Quest — Power the Future  
**Event:** Ziarah Kasih & Cakna Komuniti (10 November 2026, Universiti Teknologi Malaysia)  
**Release:** V3.6 Final GitHub Publishing, Deployment & Production Verification  
**Date:** 8 November 2026  
**Repository:** [https://github.com/ShamsirIsmail/UTMGesture](https://github.com/ShamsirIsmail/UTMGesture)  
**GitHub Pages URL:** [https://shamsirismail.github.io/UTMGesture/](https://shamsirismail.github.io/UTMGesture/)  
**Latest Local Commit:** `b62cffb`  
**Latest Remote Commit:** `40a54ff`  
**Working Tree Status:** Clean  

---

## 1. Executive Summary

The UTM Gesture Quest project has completed its final inspection, security audit, and GitHub publishing preparation. The repository is configured to deploy to **GitHub Pages** while ensuring the **local exhibition launcher remains 100% offline and independent**.

### Key Findings
1. **GitHub Remote Verified:** The remote repository is linked to `https://github.com/ShamsirIsmail/UTMGesture.git`.
2. **Clean Staging & Git History Preserved:** Remote commit `40a54ff` is on GitHub. Local commit `b62cffb` cleanly untracks `node_modules` from Git tracking (while preserving local files on disk), preventing Ubuntu CI build conflicts in GitHub Actions.
3. **Zero Secrets or Private Data:** Security and privacy audit confirmed 0 API keys, 0 private tokens, and 0 participant records/photos in Git.
4. **Offline Resilience:** Local exhibition mode runs completely independent of GitHub Pages using browser-local IndexedDB.

---

## 2. Security & Privacy Audit Results

| Audit Item | Scope | Status | Notes |
|---|---|---|---|
| **API Keys & Credentials** | Entire codebase & Git log | ✅ PASS | Zero API keys, tokens, or private secrets detected |
| **Environment Secrets** | `.env*` files | ✅ PASS | Excluded by `.gitignore`; no `.env` tracked |
| **Participant Photo Privacy** | Snapshots & Leaderboard | ✅ PASS | Photos saved in client IndexedDB only; never tracked in Git |
| **Export File Leakage** | `*.csv`, `*.json` | ✅ PASS | `leaderboard-export*.json/csv` strictly ignored |
| **Diagnostic Traces** | `test_diag.cjs`, logs | ✅ PASS | Excluded from Git index |
| **Destructive Operator Actions** | Database wipe / reset | ✅ PASS | Protected by PIN (`2026`) and confirmation guard |
| **Git Tracking Footprint** | `node_modules`, `dist` | ✅ PASS | Cleanly untracked with `--cached` (disk intact) |

---

## 3. GitHub Pages Deployment Configuration

### 3.1 Workflow Architecture (`.github/workflows/deploy.yml`)
- **Trigger:** Automated on push to `main` and manual `workflow_dispatch`.
- **Environment:** Ubuntu Latest, Node.js 20.
- **Build Step:** Executes `npm ci` followed by `npm run build` with:
  ```env
  GITHUB_PAGES=true
  VITE_BASE_PATH=/UTMGesture/
  ```
- **Deployment Action:** `actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`.

### 3.2 Dynamic Asset Resolution (`src/utils/assets.ts`)
- Automatically prefixes `/UTMGesture/` for all images, logos, and MediaPipe WASM/model assets when running on GitHub Pages.
- Automatically falls back to relative `./` for local offline execution.

---

## 4. Required Steps to Activate GitHub Pages

GitHub Pages requires a one-time toggle in repository settings to allow GitHub Actions to publish:

### Step 1: Enable GitHub Actions Source
1. Navigate to: [https://github.com/ShamsirIsmail/UTMGesture/settings/pages](https://github.com/ShamsirIsmail/UTMGesture/settings/pages)
2. Under **Build and deployment**:
   - Find the **Source** dropdown.
   - Select **GitHub Actions** (do NOT choose *Deploy from a branch*).

### Step 2: Push the Clean Commit from Terminal
In your local PowerShell or VS Code terminal at `C:\Dev\UTMGesture`, run:
```powershell
git push origin main
```
*Note: Running this command in your interactive terminal allows Windows Git Credential Manager to authenticate smoothly.*

### Step 3: Verify Deployment
1. Go to the **Actions** tab on GitHub: [https://github.com/ShamsirIsmail/UTMGesture/actions](https://github.com/ShamsirIsmail/UTMGesture/actions)
2. Confirm that the **Deploy UTM Gesture Quest to GitHub Pages** workflow succeeds.
3. Open the live site: [https://shamsirismail.github.io/UTMGesture/](https://shamsirismail.github.io/UTMGesture/)

---

## 5. Production Testing & Verification Matrix

Automated verification tests were executed against the production build:

| Scenario | Component / Flow | Result |
|---|---|---|
| **P1** | **Welcome Screen & Official Logos** | UTM, ASCEND UTM, KSJ, JKM KSJ, and JKM LK logos render crisply | ✅ PASS |
| **P2** | **Bilingual Language Switch** | Instant toggle between Bahasa Melayu and English without layout shift | ✅ PASS |
| **P3** | **How to Play Screen** | Index pointing, Pinch Turbo, and Open Palm Shield cards render with images; vertical scroll works seamlessly | ✅ PASS |
| **P4** | **Mouse Preview Mode** | Smooth cursor targeting, hold-to-collect, and visual reticle | ✅ PASS |
| **P5** | **Energy Orb Collection** | Orbs charge and detonate correctly with particles and audio | ✅ PASS |
| **P6** | **Future Core Activation** | 2-second sustained lock charges core to 100% | ✅ PASS |
| **P7** | **Mission Complete Animation** | 1.2s celebration sequence with golden emblem, confetti, and victory fanfare | ✅ PASS |
| **P8** | **Next Level Progression** | Casual $\to$ Challenge $\to$ Master AI $\to$ Play Again progression loop | ✅ PASS |
| **P9** | **Operator Console & Export** | PIN login (`2026`), CSV export, JSON export, and isolation notices | ✅ PASS |
| **P10** | **MediaPipe AI Vision** | Local WASM and Float16 models resolve with CDN fallback | ✅ PASS |
| **P11** | **Network & Console Errors** | Zero 404 missing assets; zero unhandled React exceptions | ✅ PASS |

---

## 6. Leaderboard Architecture & Origin Isolation

> [!IMPORTANT]
> **Data Scope Notice:**
> - GitHub Pages is a static web host and **does not provide a shared cloud database**.
> - The leaderboard uses **IndexedDB** (`UTMGestureQuestDB`), which is scoped strictly to each individual browser origin.
> - Scores recorded on the exhibition laptop (`http://localhost:5173`) remain private to that machine and **will not appear** on remote visitor phones or GitHub Pages.
> - Visitors viewing GitHub Pages on their own devices will have their own independent, client-side leaderboard.
> - An optional cloud database (such as Supabase or Firebase) can be integrated in the future using the service abstraction at `src/services/leaderboardBackend.ts`.

---

## 7. Exhibition Day Operator Manual (Offline Mode)

### Starting the Exhibition Laptop
```powershell
cd C:\Dev\UTMGesture
npm run preview
```
Open `http://localhost:4173` (or `http://localhost:5173` via `npm run dev`).

### Operator Hotkeys & Actions
- `O`: Open Operator Management Modal (PIN: `2026`).
- `M`: Toggle between AI Webcam Tracking and Mouse Preview.
- `F`: Toggle Fullscreen.
- `H` or `Esc`: Emergency Home Reset.
- **End-of-Day Backup:** Open Operator Modal $\to$ Click **Eksport CSV (Privasi)** to download the day's verified records to your backup drive.
