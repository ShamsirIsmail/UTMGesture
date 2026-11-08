# UTM Gesture Quest — GitHub & Deployment Guide
**Project:** UTM Gesture Quest V3.5 — Power the Future  
**Event:** Ziarah Kasih & Cakna Komuniti (10 November 2026, Universiti Teknologi Malaysia)

---

## 1. Overview & Strategy

This guide provides exact, step-by-step instructions for publishing **UTM Gesture Quest** to a GitHub repository and hosting it on **GitHub Pages**.

### Core Principles
- **Dual-Mode Operation:**  
  - **Local Exhibition Mode:** Booth laptops run locally (`npm run dev` or `npm run preview`) to ensure 100% offline reliability without relying on convention venue Wi-Fi.
  - **GitHub Pages Mode:** Deployed to `https://<YOUR_USERNAME>.github.io/UTMGesture/` for online demonstrations, committee reviews, and participant portfolio access.
- **Data Privacy (PDPA):**  
  Participant selfies, real names, and event scores are stored in browser **IndexedDB** only. They are **never** included in Git commits or published to GitHub Pages.

---

## 2. Pre-Push Verification Checklist

Run these commands locally in PowerShell before pushing to ensure zero build errors or leaking artifacts:

```powershell
# 1. Verify TypeScript compiles cleanly with zero errors
npm run typecheck

# 2. Verify production bundle builds successfully
npm run build

# 3. Check Git status to verify untracked files are excluded
git status
```

Confirm that:
- `.gitignore` excludes `node_modules/`, `dist/`, `.env*`, and `leaderboard-export*.json/csv`.
- No personal participant photos or data exports appear in `git status`.

---

## 3. Creating & Linking the GitHub Repository

### Step 3.1: Create a New Repository on GitHub
1. Log in to your GitHub account at [github.com](https://github.com).
2. Click the **+** icon in the top-right corner and select **New repository**.
3. Configure the repository settings:
   - **Repository name:** `UTMGesture`
   - **Description:** `Interactive AI Hand Gesture Exhibition Game for UTM Ziarah Kasih dan Cakna Komuniti 2026`
   - **Visibility:** Public (or Private)
   - **Initialize repository with:** **Do NOT check** "Add a README file", "Add .gitignore", or choose a license (these already exist locally).
4. Click **Create repository**.

### Step 3.2: Connect Your Local Repository and Push

In your local terminal at `c:\Dev\UTMGesture`:

```powershell
# 1. Verify your current branch is main
git branch -M main

# 2. Add your GitHub repository as the origin remote (replace <YOUR_USERNAME> with your GitHub username or organization)
git remote add origin https://github.com/<YOUR_USERNAME>/UTMGesture.git

# 3. Confirm remote configuration
git remote -v

# 4. Push your commits to GitHub
git push -u origin main
```

---

## 4. Configuring GitHub Pages

GitHub Pages uses the automated GitHub Actions workflow included in `.github/workflows/deploy.yml`.

### Step 4.1: Enable GitHub Actions as Pages Source
1. In your GitHub repository, click on **Settings** (top navigation tab).
2. In the left sidebar, click **Pages** (under the "Code and automation" section).
3. Under **Build and deployment**:
   - Find the **Source** dropdown menu.
   - Select **GitHub Actions** (do NOT choose "Deploy from a branch").

### Step 4.2: Triggering and Monitoring Deployment
1. When you push to `main`, the workflow **Deploy UTM Gesture Quest to GitHub Pages** triggers automatically.
2. Click the **Actions** tab in your repository to watch the deployment progress.
3. Once the workflow completes (approximately 1–2 minutes), your application will be live at:
   ```
   https://<YOUR_USERNAME>.github.io/UTMGesture/
   ```

---

## 5. HTTPS & WebRTC Camera Permissions on GitHub Pages

- Modern browsers require a **Secure Context (HTTPS)** to allow webcam access (`navigator.mediaDevices.getUserMedia`).
- GitHub Pages automatically provides an SSL certificate and serves all assets over HTTPS.
- When opening the site for the first time on a visitor's device, the browser will prompt:
  > *"https://<YOUR_USERNAME>.github.io wants to Use your camera"*
- Click **Allow**. The local MediaPipe WASM and Float16 AI models will load from the repository subpath.

---

## 6. Understanding IndexedDB Origin Isolation

| Environment | Storage Origin | Data Scope |
|---|---|---|
| **Local Exhibition Laptop** | `http://localhost:5173` | Isolated to that specific laptop browser |
| **GitHub Pages Online** | `https://<user>.github.io` | Isolated to the visitor's individual browser |

> **IMPORTANT:** Data entered into the leaderboard on `localhost` **does not** sync to GitHub Pages, and data from GitHub Pages does not overwrite your local exhibition records. Each browser maintains its own private, isolated database.

---

## 7. Exhibition Day Operator Procedures

### Recommended Booth Setup
1. **Always run the exhibition from localhost:**
   ```powershell
   npm run preview
   ```
   This ensures zero reliance on venue Wi-Fi and instant response times.
2. **Exporting Data at the End of the Day:**
   - Press `O` on the laptop keyboard to open the Operator Console.
   - Enter operator PIN: `2026`.
   - Click **Eksport CSV (Privasi)** for a clean spreadsheet of all participants, completion times, and rankings.
   - Store the CSV securely on a designated backup drive.
3. **Resetting for Next Day or Next Session:**
   - Use the **Kosongkan Semua (Clear All)** button inside the Operator Console only after verifying your exported CSV backup.

---

## 8. Optional Future Cloud Synchronization (Supabase)

If you plan to synchronize multiple exhibition laptops to a live synchronized leaderboard screen in the future:
1. Review the backend service interface at `src/services/leaderboardBackend.ts`.
2. Follow the SQL schema instructions in that file to create a `leaderboard` table on [supabase.com](https://supabase.com).
3. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.production`.
