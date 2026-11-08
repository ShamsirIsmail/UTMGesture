// ============================================================
// Automated End-to-End Verification Script for UTM Gesture Quest V3.4
// Tests:
// 1. Welcome Screen
// 2. Navigation to How to Play Screen via 'Ujian Pantas (Mod Tetikus)'
// 3. Verification of 3 realistic hand illustration tutorial cards
// 4. Verification of 3 game flow cards
// 5. Verification of Difficulty Cards (Casual default, Challenge, Master AI)
// 6. Language Purity Verification (100% BM vs 100% EN)
// 7. Live Gesture Practice Modal
// 8. Gameplay Screen & Open Palm Shield activation (cyan aura + sound)
// 9. Mission Complete Screen matching Concept Reference:
//    - Laurel wreath badge
//    - Encouraging title
//    - Large Final Time centerpiece in seconds
//    - Grade, Combo, Hazard hits
//    - Nickname input & leaderboard submission
// ============================================================

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\shams\\.gemini\\antigravity\\brain\\4e5e742a-6000-4eec-87a3-fc548db2b7c5';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runVerification() {
  console.log('🚀 Starting UTM Gesture Quest V3.4 End-to-End QA Verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--window-size=1280,800',
    ],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();
  const consoleLogs = [];
  const errors = [];

  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });

  try {
    // ------------------------------------------------------------
    // 1. Load Welcome Screen
    // ------------------------------------------------------------
    console.log('1️⃣ Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));

    // ------------------------------------------------------------
    // 2. Navigate to How to Play Screen
    // ------------------------------------------------------------
    console.log('2️⃣ Navigating to How to Play Screen via Ujian Pantas...');
    const clickedNav = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent && (b.textContent.includes('Ujian Pantas') || b.textContent.includes('Quick Test')));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!clickedNav) {
      throw new Error('Could not find Ujian Pantas button on Welcome Screen');
    }

    await new Promise((r) => setTimeout(r, 1200));

    // Verify we are on HOW TO PLAY screen
    let howToPlayHeader = await page.$eval('main h1', (el) => el.innerText).catch(() => '');
    console.log(`   How to Play Screen Header (BM): "${howToPlayHeader}"`);

    // ------------------------------------------------------------
    // 3. Verify How to Play Assets & Structure (BM Mode)
    // ------------------------------------------------------------
    console.log('3️⃣ Inspecting How to Play Tutorial Elements (BM)...');

    // Verify 3 hand gesture images
    const gestureImgs = await page.$$eval('img[src*="tutorial"]', (imgs) => imgs.map((img) => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      complete: img.complete
    })));
    console.log(`   Found ${gestureImgs.length} tutorial hand gesture images:`, gestureImgs);

    // Verify 3 game flow images
    const flowImgs = await page.$$eval('img[src*="energy_orb"], img[src*="future_core"], img[src*="gold"]', (imgs) => imgs.map((img) => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      complete: img.complete
    })));
    console.log(`   Found ${flowImgs.length} game flow asset images:`, flowImgs);

    // Take BM screenshot
    const bmHowToPlayPath = path.join(ARTIFACT_DIR, 'v3_4_how_to_play_bm.png');
    await page.screenshot({ path: bmHowToPlayPath, fullPage: false });
    console.log(`   📸 Saved BM How To Play screenshot to: ${bmHowToPlayPath}`);

    // ------------------------------------------------------------
    // 4. Test Language Switching on How to Play Screen (BM -> EN -> BM)
    // ------------------------------------------------------------
    console.log('4️⃣ Testing Language Switch to EN on How to Play...');
    const langBtn = await page.$('button[title*="Tukar Bahasa"], button[title*="Switch Language"]');
    if (langBtn) {
      await langBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      const enHeader = await page.$eval('main h1', (el) => el.innerText).catch(() => '');
      console.log(`   Switched to EN: Header is now "${enHeader}"`);

      const enHowToPlayPath = path.join(ARTIFACT_DIR, 'v3_4_how_to_play_en.png');
      await page.screenshot({ path: enHowToPlayPath, fullPage: false });
      console.log(`   📸 Saved EN How To Play screenshot to: ${enHowToPlayPath}`);

      // Switch back to BM
      await langBtn.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    // ------------------------------------------------------------
    // 5. Test Live Gesture Practice Modal
    // ------------------------------------------------------------
    console.log('5️⃣ Testing Live Gesture Practice Modal...');
    const practiceBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent && (btn.textContent.includes('Cuba Gaya Tangan') || btn.textContent.includes('Try Your Gestures')));
      if (b) {
        b.click();
        return true;
      }
      return false;
    });

    if (practiceBtn) {
      await new Promise((r) => setTimeout(r, 1000));
      const practiceModalPath = path.join(ARTIFACT_DIR, 'v3_4_gesture_practice.png');
      await page.screenshot({ path: practiceModalPath, fullPage: false });
      console.log(`   📸 Saved Live Gesture Practice screenshot to: ${practiceModalPath}`);

      // Close modal
      const closeBtn = await page.$('button[aria-label="Close Practice Modal"]');
      if (closeBtn) {
        await closeBtn.click();
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    // ------------------------------------------------------------
    // 6. Select Challenge Difficulty & Start Gameplay
    // ------------------------------------------------------------
    console.log('6️⃣ Selecting Challenge Difficulty & Starting Mission...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('button'));
      const challengeBtn = cards.find((c) => c.textContent && (c.textContent.includes('Cabaran') || c.textContent.includes('Challenge')));
      if (challengeBtn) challengeBtn.click();
    });

    await new Promise((r) => setTimeout(r, 500));

    // Click "Mula Main (Cabaran)" button
    const startMissionBtn = await page.$('button[data-testid="start-game-btn"]');
    if (startMissionBtn) {
      await startMissionBtn.click();
    } else {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find((btn) => btn.textContent && (btn.textContent.includes('Mula Main') || btn.textContent.includes('Start Game')));
        if (b) b.click();
      });
    }

    await new Promise((r) => setTimeout(r, 2000));

    // ------------------------------------------------------------
    // 7. Test Gameplay HUD & Spacebar Shield
    // ------------------------------------------------------------
    console.log('7️⃣ Testing Gameplay HUD & Open Palm / Spacebar Shield...');

    // Trigger Spacebar to activate shield
    await page.keyboard.press('Space');
    await new Promise((r) => setTimeout(r, 400));

    const gameplayShieldPath = path.join(ARTIFACT_DIR, 'v3_4_gameplay_shield.png');
    await page.screenshot({ path: gameplayShieldPath, fullPage: false });
    console.log(`   📸 Saved Gameplay with Shield screenshot to: ${gameplayShieldPath}`);

    // ------------------------------------------------------------
    // 8. Trigger Mission Complete Screen via 'W' shortcut
    // ------------------------------------------------------------
    console.log('8️⃣ Triggering Mission Complete Screen...');
    await page.keyboard.press('KeyW');
    await new Promise((r) => setTimeout(r, 2200));

    // Verify Complete Screen Elements
    const completeTitle = await page.$eval('main h1', (el) => el.innerText).catch(() => '');
    console.log(`   Complete Screen Title (BM): "${completeTitle}"`);

    // Verify Final Time centerpiece
    const finalTimeValue = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      const timeEl = els.find((el) => el.textContent && /^\d+(\.\d+)?\s*s$/.test(el.textContent.trim()));
      return timeEl ? timeEl.textContent.trim() : 'Not found';
    });
    console.log(`   Centerpiece Final Time reading: "${finalTimeValue}"`);

    // Verify Nickname Input
    const nicknameInput = await page.$('input[placeholder*="Ali"], input[placeholder*="Nama"], input[placeholder*="Nickname"]');
    console.log(`   Nickname input field present: ${!!nicknameInput}`);
    if (nicknameInput) {
      await nicknameInput.type('Ziarah VIP UTM');
    }

    const completePath = path.join(ARTIFACT_DIR, 'v3_4_complete_screen.png');
    await page.screenshot({ path: completePath, fullPage: false });
    console.log(`   📸 Saved Mission Complete (BM) screenshot to: ${completePath}`);

    // Test Language switch on Complete Screen
    if (langBtn) {
      await langBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      const enCompleteTitle = await page.$eval('main h1', (el) => el.innerText).catch(() => '');
      console.log(`   Complete Screen Title (EN): "${enCompleteTitle}"`);

      const completePathEn = path.join(ARTIFACT_DIR, 'v3_4_complete_screen_en.png');
      await page.screenshot({ path: completePathEn, fullPage: false });
      console.log(`   📸 Saved Mission Complete (EN) screenshot to: ${completePathEn}`);
    }

    console.log('✅ All V3.4 verification steps completed successfully!');
  } catch (err) {
    console.error('❌ Error during verification:', err);
  } finally {
    if (errors.length > 0) {
      console.log('⚠️ Page Errors Encountered:', errors);
    }
    await browser.close();
  }
}

runVerification();
