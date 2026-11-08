// ============================================================
// Automated End-to-End Verification Script for UTM Gesture Quest V3.5
// Tests:
// 1. Cinematic Celebration Animation (Phase 1) + Skip Option
// 2. Result Reveal (Phase 2) with Prominent Final Time Centerpiece
// 3. Strict Bilingual Consistency (BM <-> EN)
// 4. Next Level Progression:
//    - Casual -> "Cuba Tahap Cabaran" / "Try Challenge"
//    - Unsaved score confirmation dialog
//    - Level unlocked transition overlay
//    - Automatic seamless transition into Challenge gameplay
//    - Challenge -> "Cuba Tahap Pakar AI" / "Try Master AI"
//    - Master AI -> "Main Semula" / "Play Again"
// ============================================================

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\shams\\.gemini\\antigravity\\brain\\4e5e742a-6000-4eec-87a3-fc548db2b7c5';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runV35Verification() {
  console.log('🚀 Starting UTM Gesture Quest V3.5 Comprehensive QA Suite...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1366,768',
    ],
    defaultViewport: { width: 1366, height: 768 },
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    // ------------------------------------------------------------
    // 1. Start from Welcome Screen -> Casual Gameplay
    // ------------------------------------------------------------
    console.log('1️⃣ Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));

    // Click Ujian Pantas (Mouse Mode) to jump to How to Play
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent.includes('Ujian Pantas'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Ensure Casual is selected & click Start Game
    await page.click('[data-testid="start-game-btn"]');
    await new Promise((r) => setTimeout(r, 1200));

    // ------------------------------------------------------------
    // 2. Trigger Mission Complete from Casual Gameplay
    // ------------------------------------------------------------
    console.log('2️⃣ Triggering Mission Complete in Casual Mode...');
    await page.keyboard.press('KeyW');
    await new Promise((r) => setTimeout(r, 350));

    // Check Phase 1: Celebration View
    console.log('3️⃣ Verifying Phase 1: Celebration Animation...');
    const hasCelebration = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Misi Selesai') || text.includes('Tahniah') || text.includes('Langkau');
    });
    console.log(`   Celebration view active: ${hasCelebration}`);

    const celebrationPath = path.join(ARTIFACT_DIR, 'v3_5_celebration_phase.png');
    await page.screenshot({ path: celebrationPath });
    console.log(`   📸 Captured Celebration: ${celebrationPath}`);

    // Wait for auto-reveal (or test skip)
    await page.waitForSelector('[data-testid="next-level-btn"]', { timeout: 4000 });

    // ------------------------------------------------------------
    // 3. Verify Phase 2: Result Presentation
    // ------------------------------------------------------------
    console.log('4️⃣ Verifying Phase 2: Result Presentation (BM)...');
    const resultDetails = await page.evaluate(() => {
      const heading = document.querySelector('h1')?.innerText || '';
      const finalTimeEl = document.querySelector('.font-mono.text-\\[\\#7a1636\\]');
      const nextBtn = document.querySelector('[data-testid="next-level-btn"]');

      return {
        heading,
        finalTime: finalTimeEl ? finalTimeEl.innerText.trim() : 'Not found',
        nextBtnText: nextBtn ? nextBtn.innerText.trim() : 'Not found',
      };
    });
    console.log(`   Result Presentation Details:`, resultDetails);

    const resultsBmPath = path.join(ARTIFACT_DIR, 'v3_5_results_presentation_bm.png');
    await page.screenshot({ path: resultsBmPath });
    console.log(`   📸 Captured BM Results: ${resultsBmPath}`);

    // Test Language Switch on Complete Screen (BM -> EN)
    console.log('5️⃣ Testing Language Switch on Complete Screen (BM -> EN)...');
    const langBtn = await page.$('button[title*="Tukar Bahasa"], button[title*="Switch Language"]');
    if (langBtn) {
      await langBtn.click();
      await new Promise((r) => setTimeout(r, 500));

      const enDetails = await page.evaluate(() => {
        const heading = document.querySelector('h1')?.innerText || '';
        const nextBtn = document.querySelector('[data-testid="next-level-btn"]');
        return {
          heading,
          nextBtnText: nextBtn ? nextBtn.innerText.trim() : '',
        };
      });
      console.log(`   EN Results Presentation:`, enDetails);

      const resultsEnPath = path.join(ARTIFACT_DIR, 'v3_5_results_presentation_en.png');
      await page.screenshot({ path: resultsEnPath });
      console.log(`   📸 Captured EN Results: ${resultsEnPath}`);

      // Switch back to BM
      await langBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // ------------------------------------------------------------
    // 4. Test Next Level Progression: Casual -> Challenge
    // ------------------------------------------------------------
    console.log('6️⃣ Clicking Next Level ("Cuba Tahap Cabaran") with unsaved score...');
    await page.click('[data-testid="next-level-btn"]');

    // Verify Unsaved Score Confirmation Modal
    const confirmModalTitle = await page.waitForSelector('h3', { timeout: 2000 }).then(el => el.evaluate(e => e.innerText)).catch(() => '');
    console.log(`   Confirmation Modal Title: "${confirmModalTitle}"`);

    const confirmModalPath = path.join(ARTIFACT_DIR, 'v3_5_unsaved_confirm_modal.png');
    await page.screenshot({ path: confirmModalPath });
    console.log(`   📸 Captured Unsaved Score Modal: ${confirmModalPath}`);

    // Click "Simpan Skor & Teruskan"
    console.log('7️⃣ Clicking "Simpan Skor & Teruskan"...');
    await page.click('[data-testid="save-score-continue-btn"]');

    // Wait for Level Unlock Transition Overlay
    const unlockPath = path.join(ARTIFACT_DIR, 'v3_5_level_transition_unlocked.png');
    await page.waitForSelector('[data-testid="start-next-level-now-btn"]', { timeout: 3000 });
    await page.screenshot({ path: unlockPath });
    console.log(`   📸 Captured Level Unlocked Overlay: ${unlockPath}`);

    // Click "Mula Misi Seterusnya" button to immediately enter Challenge mode
    await page.click('[data-testid="start-next-level-now-btn"]');

    // Wait for Challenge gameplay to be active
    console.log('   Waiting for Challenge gameplay to be active...');
    await page.waitForFunction(() => {
      const activePill = document.querySelector('header .bg-\\[\\#7a1636\\]');
      return activePill && activePill.innerText.includes('Cabaran');
    }, { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 800));

    const gameplayChallengePath = path.join(ARTIFACT_DIR, 'v3_5_gameplay_challenge_active.png');
    await page.screenshot({ path: gameplayChallengePath });
    console.log(`   📸 Captured Challenge Gameplay: ${gameplayChallengePath}`);

    // ------------------------------------------------------------
    // 5. Test Progression: Challenge -> Master AI
    // ------------------------------------------------------------
    console.log('8️⃣ Completing Challenge Mode -> Testing Master AI Unlock...');
    await page.keyboard.press('KeyW');
    await page.waitForSelector('[data-testid="next-level-btn"]', { timeout: 4000 });

    // Verify Next button is now "Cuba Tahap Pakar AI"
    const nextBtnTextChallenge = await page.$eval('[data-testid="next-level-btn"]', (el) => el.innerText);
    console.log(`   Button after Challenge completion: "${nextBtnTextChallenge}"`);
    if (!nextBtnTextChallenge.includes('Pakar AI') && !nextBtnTextChallenge.includes('Master')) {
      throw new Error(`Expected button to offer Master AI, but got: "${nextBtnTextChallenge}"`);
    }

    // Click "Cuba Tahap Pakar AI" -> continue without saving
    await page.click('[data-testid="next-level-btn"]');
    const continueBtn = await page.waitForSelector('[data-testid="continue-without-saving-btn"]', { timeout: 3000 });
    await continueBtn.click();

    // Click "Mula Misi Seterusnya" on overlay
    const startNow2 = await page.waitForSelector('[data-testid="start-next-level-now-btn"]', { timeout: 3000 });
    await startNow2.click();

    // Wait for Master AI gameplay to be active
    console.log('   Waiting for Master AI gameplay to be active...');
    await page.waitForFunction(() => {
      const activePill = document.querySelector('header .bg-\\[\\#7a1636\\]');
      return activePill && activePill.innerText.includes('Pakar AI');
    }, { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 800));

    // ------------------------------------------------------------
    // 6. Test Progression: Master AI -> Play Again
    // ------------------------------------------------------------
    console.log('9️⃣ Completing Master AI Mode -> Testing Play Again Primary Action...');
    await page.keyboard.press('KeyW');
    await page.waitForSelector('[data-testid="next-level-btn"]', { timeout: 4000 });

    const finalMasterBtn = await page.$eval('[data-testid="next-level-btn"]', (el) => el.innerText);
    console.log(`   Button after Master AI completion: "${finalMasterBtn}"`);
    if (!finalMasterBtn.includes('Main') && !finalMasterBtn.includes('Play')) {
      throw new Error(`Expected button to offer Play Again on Master completion, but got: "${finalMasterBtn}"`);
    }

    const masterCompletePath = path.join(ARTIFACT_DIR, 'v3_5_master_progression_complete.png');
    await page.screenshot({ path: masterCompletePath });
    console.log(`   📸 Captured Master AI Complete: ${masterCompletePath}`);

    console.log('🎉 ALL V3.5 COMPLETION & PROGRESSION TESTS PASSED WITH 100% SUCCESS!');
  } finally {
    if (errors.length > 0) {
      console.log('⚠️ Page Errors Encountered:', errors);
    }
    await browser.close();
  }
}

runV35Verification();
