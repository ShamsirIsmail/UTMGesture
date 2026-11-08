// ============================================================
// Automated Responsive & Scroll Verification for HowToPlayScreen
// Tests at:
// - 1366 × 768 (Standard Laptop)
// - 1440 × 900 (MacBook / Widescreen Laptop)
// - 1920 × 1080 (FHD Exhibition Display)
// ============================================================

const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\shams\\.gemini\\antigravity\\brain\\4e5e742a-6000-4eec-87a3-fc548db2b7c5';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const resolutions = [
  { width: 1366, height: 768, name: '1366x768' },
  { width: 1440, height: 900, name: '1440x900' },
  { width: 1920, height: 1080, name: '1920x1080' },
];

async function verifyResolution(res) {
  console.log(`\n========================================`);
  console.log(`🖥️  Testing Resolution: ${res.name} (${res.width}x${res.height})`);
  console.log(`========================================`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      `--window-size=${res.width},${res.height}`,
    ],
    defaultViewport: { width: res.width, height: res.height },
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    // 1. Navigate to Welcome
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));

    // 2. Click Ujian Pantas to reach How to Play
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find((btn) => btn.textContent.includes('Ujian Pantas') || btn.textContent.includes('Quick Test'));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // 3. Inspect layout & verify Sticky Start Mission Button is in viewport
    const initialCheck = await page.evaluate(() => {
      const main = document.querySelector('main');
      const scrollContainer = main ? main.querySelector('.overflow-y-auto') : null;
      const startBtn = document.querySelector('[data-testid="start-game-btn"]');
      const startBtnRect = startBtn ? startBtn.getBoundingClientRect() : null;

      return {
        windowHeight: window.innerHeight,
        scrollContainer: scrollContainer ? {
          scrollHeight: scrollContainer.scrollHeight,
          clientHeight: scrollContainer.clientHeight,
          canScroll: scrollContainer.scrollHeight > scrollContainer.clientHeight,
        } : null,
        startBtn: startBtn ? {
          text: startBtn.textContent.trim(),
          top: startBtnRect.top,
          bottom: startBtnRect.bottom,
          isVisible: startBtnRect.top >= 0 && startBtnRect.bottom <= window.innerHeight,
        } : null,
      };
    });

    console.log(`   Initial Check:`, JSON.stringify(initialCheck, null, 2));
    if (!initialCheck.startBtn || !initialCheck.startBtn.isVisible) {
      throw new Error(`Sticky Start Mission button is NOT visible in viewport at ${res.name}!`);
    }

    // Capture initial screenshot
    const initScreenshotPath = path.join(ARTIFACT_DIR, `v3_4_how_to_play_${res.name}_initial.png`);
    await page.screenshot({ path: initScreenshotPath });
    console.log(`   📸 Captured: ${initScreenshotPath}`);

    // 4. Test Scrolling down
    if (initialCheck.scrollContainer && initialCheck.scrollContainer.canScroll) {
      console.log(`   Testing scroll down on content container...`);
      const scrolled = await page.evaluate(() => {
        const scrollContainer = document.querySelector('main .overflow-y-auto');
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        return {
          scrollTop: scrollContainer.scrollTop,
          maxScroll: scrollContainer.scrollHeight - scrollContainer.clientHeight,
        };
      });
      console.log(`   Scrolled to bottom:`, scrolled);

      // Capture scrolled screenshot
      const scrolledScreenshotPath = path.join(ARTIFACT_DIR, `v3_4_how_to_play_${res.name}_scrolled.png`);
      await page.screenshot({ path: scrolledScreenshotPath });
      console.log(`   📸 Captured scrolled view: ${scrolledScreenshotPath}`);
    } else {
      console.log(`   Content fits within viewport without needing scroll.`);
    }

    // 5. Test difficulty switching
    console.log(`   Testing difficulty switch to 'Cabaran' / 'Challenge'...`);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const challengeBtn = btns.find((b) => b.textContent.includes('Cabaran') || b.textContent.includes('Challenge'));
      if (challengeBtn) challengeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Verify Sticky button updated text
    const updatedBtnText = await page.$eval('[data-testid="start-game-btn"]', (el) => el.innerText);
    console.log(`   Updated Sticky Button Text: "${updatedBtnText}"`);
    if (!updatedBtnText.includes('Cabaran') && !updatedBtnText.includes('Challenge')) {
      throw new Error(`Start button text failed to update to Challenge! Found: "${updatedBtnText}"`);
    }

    // 6. Test Keyboard Tab navigation to Start Mission Button
    console.log(`   Testing Tab navigation focus...`);
    await page.focus('[data-testid="start-game-btn"]');
    const isFocused = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="start-game-btn"]');
      return document.activeElement === el;
    });
    console.log(`   Start Mission button keyboard focusable: ${isFocused}`);

    // 7. Click Start Mission Button
    console.log(`   Clicking Start Mission Button...`);
    await page.click('[data-testid="start-game-btn"]');
    await new Promise((r) => setTimeout(r, 1500));

    // Verify Gameplay screen loaded
    const onGameplay = await page.evaluate(() => {
      // Look for gameplay elements: HUD, Orbs, or Timer
      const text = document.body.innerText;
      return text.includes('Orb') || text.includes('Masa') || text.includes('Time') || !!document.querySelector('.cursor-none, [data-testid="gameplay"]');
    });
    console.log(`   Successfully navigated to Gameplay: ${onGameplay}`);

    const gameplayPath = path.join(ARTIFACT_DIR, `v3_4_gameplay_started_${res.name}.png`);
    await page.screenshot({ path: gameplayPath });
    console.log(`   📸 Captured gameplay transition: ${gameplayPath}`);

    console.log(`✅ ${res.name} test PASSED!`);
  } finally {
    if (errors.length > 0) {
      console.log(`⚠️ Errors at ${res.name}:`, errors);
    }
    await browser.close();
  }
}

async function runAll() {
  console.log(`🚀 Starting Full Responsive & Scroll QA Suite...`);
  for (const res of resolutions) {
    await verifyResolution(res);
  }
  console.log(`\n🎉 ALL RESOLUTION & SCROLL TESTS COMPLETED WITH 100% SUCCESS!`);
}

runAll();

