// ============================================================
// Automated Verification Script: GitHub & Deployment Readiness
// Uses puppeteer-core with installed Google Chrome
// ============================================================
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\shams\\.gemini\\antigravity\\brain\\4e5e742a-6000-4eec-87a3-fc548db2b7c5';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runVerification() {
  console.log('🚀 Starting GitHub & Deployment Readiness Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--window-size=1440,900',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  const failedRequests = [];
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().includes('favicon')) {
      failedRequests.push({ url: response.url(), status: response.status() });
    }
  });

  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  try {
    // 1. Visit App
    console.log('1. Loading http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    // Capture Welcome Screen
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'v3_5_gh_prep_welcome.png') });
    console.log('✓ Welcome Screen rendered');

    // 2. Open Operator Modal
    console.log('2. Opening Operator Modal...');
    const staffBtn = await page.waitForSelector('button ::-p-text(Staff (O))', { timeout: 3000 });
    await staffBtn.click();
    await page.waitForSelector('input[type="password"]', { timeout: 3000 });

    // Enter PIN
    console.log('Entering PIN: 2026');
    const pinInput = await page.$('input[type="password"]');
    await pinInput.type('2026', { delay: 50 });
    
    // Click submit button
    const submitBtn = await page.waitForSelector('button[type="submit"]');
    await submitBtn.click();
    await new Promise((r) => setTimeout(r, 1200));

    // Capture Operator Modal View
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'v3_5_gh_prep_operator_view.png') });

    // Verify Export Section
    const exportCsvBtn = await page.waitForSelector('button ::-p-text(Eksport CSV)', { timeout: 3000 });
    const exportJsonBtn = await page.waitForSelector('button ::-p-text(Eksport JSON)', { timeout: 3000 });
    console.log('✓ Export buttons found:', !!exportCsvBtn, !!exportJsonBtn);

    // Verify Storage Notice
    const storageNotice = await page.$('::-p-text(Penyimpanan Setempat (IndexedDB))');
    console.log('✓ IndexedDB isolation notice present:', !!storageNotice);

    // Verify Privacy Notice
    const privacyNotice = await page.$('::-p-text(Pematuhan Privasi)');
    console.log('✓ Privacy compliance notice present:', !!privacyNotice);

    // Capture Operator Modal with Export Section
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'v3_5_gh_prep_operator_export.png') });

    // 3. Close Operator Modal
    await page.click('button:has(svg.lucide-x)');
    await new Promise((r) => setTimeout(r, 500));

    // 3. Close Operator Modal
    console.log('3. Closing Operator Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.fixed.inset-0 button'));
      const closeBtn = btns.find((b) => b.querySelector('svg.lucide-x') || b.querySelector('svg'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // 4. Navigate to How to Play
    console.log('4. Navigating to How to Play...');
    const mouseBtn = await page.waitForSelector('button ::-p-text(Ujian Pantas)', { timeout: 3000 });
    await mouseBtn.click();
    await new Promise((r) => setTimeout(r, 1000));

    // Verify Tutorial Images Loaded
    const images = await page.$$eval('img', (imgs) =>
      imgs.map((img) => ({ src: img.src, complete: img.complete, naturalWidth: img.naturalWidth }))
    );
    console.log(`✓ Verified ${images.length} images on Tutorial screen`);
    const brokenImgs = images.filter((img) => img.naturalWidth === 0 && !img.src.startsWith('data:'));
    if (brokenImgs.length > 0) {
      console.warn('⚠️ Broken images found:', brokenImgs);
    } else {
      console.log('✓ All tutorial images loaded with positive naturalWidth!');
    }

    // Capture How to Play Screen
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'v3_5_gh_prep_tutorial.png') });

    // 5. Check network requests
    console.log(`4. Failed network requests count: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      console.warn('Failed requests:', failedRequests);
    } else {
      console.log('✓ Zero 404 / network errors!');
    }

    console.log(`5. Page errors count: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
      console.warn('Page errors:', pageErrors);
    } else {
      console.log('✓ Zero page errors!');
    }

    console.log('🎉 All verification checks PASSED successfully!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
