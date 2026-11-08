const puppeteer = require('puppeteer-core');

async function testWithFix() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1366, height: 768 }
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.textContent.includes('Ujian Pantas'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const testFix = await page.evaluate(() => {
    const main = document.querySelector('main');
    const screenDiv = main.firstElementChild;
    const card = screenDiv.firstElementChild;
    
    // Apply shrink-0
    card.style.flexShrink = '0';
    
    const beforeScroll = screenDiv.scrollTop;
    screenDiv.scrollTop = 400;
    const afterScroll = screenDiv.scrollTop;
    
    const startBtn = document.querySelector('[data-testid="start-game-btn"]');
    const btnRect = startBtn.getBoundingClientRect();

    return {
      screenDivScrollHeight: screenDiv.scrollHeight,
      screenDivClientHeight: screenDiv.clientHeight,
      beforeScroll,
      afterScroll,
      canScroll: afterScroll > 0,
      btnTop: btnRect.top,
      btnBottom: btnRect.bottom,
      btnVisible: btnRect.top >= 0 && btnRect.bottom <= window.innerHeight
    };
  });
  console.log('Test fix result:', testFix);
  await browser.close();
}

testWithFix();
