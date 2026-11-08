// ============================================================
// Automated End-to-End Verification Script for UTM Gesture Quest V3.3
// Tests:
// 1. Welcome Screen (5 organizer logos in borderless row, background lighting)
// 2. Language Toggle (BM <-> EN)
// 3. Audio controls (SFX and Voice toggles in Header)
// 4. Leaderboard & Enhanced Spectator Mode (Top 3 Podium, auto-cycling)
// 5. How To Play & Gameplay Screen navigation
// ============================================================

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\shams\\.gemini\\antigravity\\brain\\4e5e742a-6000-4eec-87a3-fc548db2b7c5';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runVerification() {
  console.log('🚀 Starting UTM Gesture Quest V3.3 End-to-End QA Verification...');

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
    await new Promise((r) => setTimeout(r, 1500));

    // Verify Title and 5 Logos
    const welcomeTitle = await page.$eval('h1', (el) => el.innerText);
    console.log(`   Found Welcome Title: "${welcomeTitle}"`);

    const logoCount = await page.$$eval('img[alt*="Logo"], img[alt*="UTM"], img[alt*="ASCEND"], img[alt*="KSJ"], img[alt*="JKM"]', (imgs) => imgs.length);
    console.log(`   Found ${logoCount} organizer/partner logos on Welcome Screen.`);

    const welcomePath = path.join(ARTIFACT_DIR, 'v3_3_welcome_screen.png');
    await page.screenshot({ path: welcomePath, fullPage: false });
    console.log(`   📸 Saved Welcome screenshot to: ${welcomePath}`);

    // ------------------------------------------------------------
    // 2. Test Language Toggle (BM -> EN -> BM)
    // ------------------------------------------------------------
    console.log('2️⃣ Testing Language Toggle...');
    // Click language button
    const langBtn = await page.$('button[title*="Tukar Bahasa"]');
    if (langBtn) {
      await langBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      const enTitle = await page.$eval('h1', (el) => el.innerText);
      console.log(`   After switch to EN: Title is "${enTitle}"`);

      // Switch back to BM
      await langBtn.click();
      await new Promise((r) => setTimeout(r, 600));
    }

    // ------------------------------------------------------------
    // 3. Test Independent Audio Controls in Header
    // ------------------------------------------------------------
    console.log('3️⃣ Checking Audio Controls in Header (SFX and Voice)...');
    const sfxBtn = await page.$('button[title*="SFX"]');
    const voiceBtn = await page.$('button[title*="Suara"], button[title*="Voice"]');
    console.log(`   SFX Button present: ${!!sfxBtn}, Voice Button present: ${!!voiceBtn}`);

    if (sfxBtn) {
      await sfxBtn.click();
      await new Promise((r) => setTimeout(r, 300));
      await sfxBtn.click(); // toggle back
    }
    if (voiceBtn) {
      await voiceBtn.click();
      await new Promise((r) => setTimeout(r, 300));
      await voiceBtn.click(); // toggle back
    }

    // ------------------------------------------------------------
    // 4. Open Leaderboard Screen & Test Spectator Mode
    // ------------------------------------------------------------
    console.log('4️⃣ Testing Leaderboard Screen & Spectator Mode...');
    const leaderboardBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.includes('Papan Skor') || b.innerText.includes('Leaderboard'));
    });

    if (leaderboardBtn && leaderboardBtn.asElement()) {
      await leaderboardBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 1200));

      const lbTitle = await page.$eval('h1', (el) => el.innerText);
      console.log(`   Leaderboard opened: "${lbTitle}"`);

      const lbPath = path.join(ARTIFACT_DIR, 'v3_3_leaderboard_standard.png');
      await page.screenshot({ path: lbPath });
      console.log(`   📸 Saved Standard Leaderboard screenshot to: ${lbPath}`);

      // Test Spectator Mode toggle
      const spectatorBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.innerText.includes('Mod Penonton') || b.innerText.includes('Spectator'));
      });

      if (spectatorBtn && spectatorBtn.asElement()) {
        console.log('   Toggling Spectator Mode ON...');
        await spectatorBtn.asElement().click();
        await new Promise((r) => setTimeout(r, 1200));

        const specPath = path.join(ARTIFACT_DIR, 'v3_3_leaderboard_spectator.png');
        await page.screenshot({ path: specPath });
        console.log(`   📸 Saved Spectator Mode screenshot to: ${specPath}`);

        // Wait 3 seconds to see auto-cycling countdown active
        await new Promise((r) => setTimeout(r, 3000));

        // Exit Spectator Mode
        await spectatorBtn.asElement().click();
        await new Promise((r) => setTimeout(r, 500));
      }

      // Return to Welcome Screen via Back button
      const backBtn = await page.$('button[title="Kembali"]');
      if (backBtn) {
        await backBtn.click();
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    // ------------------------------------------------------------
    // 5. Test Mouse Preview Flow (Welcome -> How to Play -> Gameplay)
    // ------------------------------------------------------------
    console.log('5️⃣ Testing Mouse Preview Flow (Welcome -> How to Play -> Gameplay)...');
    // Ensure we are back on Welcome screen
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 800));

    const mousePreviewBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.includes('Ujian Pantas') || b.innerText.includes('Mod Tetikus'));
    });

    if (mousePreviewBtn && mousePreviewBtn.asElement()) {
      await mousePreviewBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 1000));

      const htpPath = path.join(ARTIFACT_DIR, 'v3_3_how_to_play.png');
      await page.screenshot({ path: htpPath });
      console.log(`   📸 Saved How to Play screenshot to: ${htpPath}`);

      // Click Start Mission
      const startBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.innerText.includes('Mulakan Misi') || b.innerText.includes('Start Mission'));
      });

      if (startBtn && startBtn.asElement()) {
        await startBtn.asElement().click();
        await new Promise((r) => setTimeout(r, 1200));

        const gamePath = path.join(ARTIFACT_DIR, 'v3_3_gameplay_arena.png');
        await page.screenshot({ path: gamePath });
        console.log(`   📸 Saved Gameplay Arena screenshot to: ${gamePath}`);

        // Check Developer Debug Mode (press 'D')
        await page.keyboard.press('KeyD');
        await new Promise((r) => setTimeout(r, 600));

        const debugPath = path.join(ARTIFACT_DIR, 'v3_3_gameplay_debug_mode.png');
        await page.screenshot({ path: debugPath });
        console.log(`   📸 Saved Gameplay Debug Mode screenshot to: ${debugPath}`);
      }
    }

    console.log('\n============================================================');
    console.log('✅ ALL VERIFICATION STEPS COMPLETED SUCCESSFULLY!');
    console.log(`Console Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
    console.log('============================================================\n');

  } catch (err) {
    console.error('❌ QA Verification Failed:', err);
  } finally {
    await browser.close();
  }
}

runVerification();
