import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.TARGET_URL ?? 'http://localhost:5173/';
const OUT = process.env.SHOT_DIR ?? 'public';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--hide-scrollbars',
    '--font-render-hinting=none',
  ],
});

const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()}`));

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 45000 });
await new Promise((r) => setTimeout(r, 2500));

const layout = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  scrollWidth: document.documentElement.scrollWidth,
  bodyScrollWidth: document.body.scrollWidth,
  overflow: document.documentElement.scrollWidth - window.innerWidth,
  dockWidth: document.querySelector('.sv-dock')?.getBoundingClientRect().width ?? -1,
  dockRight: document.querySelector('.sv-dock')?.getBoundingClientRect().right ?? -1,
  segRight: document.querySelector('.sv-seg')?.getBoundingClientRect().right ?? -1,
  topRight: document.querySelector('.sv-top')?.getBoundingClientRect().right ?? -1,
  introRight: document.querySelector('.sv-intro-card')?.getBoundingClientRect().right ?? -1,
}));

await page.screenshot({ path: `${OUT}/v1-intro.png` });

// Dismiss the intro.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => /begin survey/i.test(b.textContent ?? ''));
  btn?.click();
});
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: `${OUT}/v2-world.png` });

// World sheet, and a planet tour.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.sv-dock-item')].find((b) => /world/i.test(b.textContent ?? ''));
  btn?.click();
});
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: `${OUT}/v3-world-sheet.png` });

const tour = ['Luna', 'Venus', 'Titan', 'Jupiter Deck', 'Earth'];
const tourShots = [];
for (const planetName of tour) {
  const picked = await page.evaluate((name) => {
    const chip = [...document.querySelectorAll('.sv-chip')].find((c) =>
      (c.textContent ?? '').trim().toLowerCase().startsWith(name.toLowerCase())
    );
    if (!chip) return false;
    chip.click();
    return true;
  }, planetName);
  if (!picked) continue;
  await new Promise((r) => setTimeout(r, 1400));
  // Close the sheet so the world is unobstructed.
  await page.evaluate(() => {
    const close = document.querySelector('.sv-sheet-head .sv-icon-btn');
    close?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 900));
  const file = `${OUT}/p-${planetName.toLowerCase().replace(/\s+/g, '-')}.png`;
  await page.screenshot({ path: file });
  tourShots.push(file);
}

// Crew sheet.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.sv-dock-item')].find((b) => /crew/i.test(b.textContent ?? ''));
  btn?.click();
});
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: `${OUT}/v4-crew.png` });

// Data sheet.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.sv-dock-item')].find((b) => /data/i.test(b.textContent ?? ''));
  btn?.click();
});
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: `${OUT}/v5-data.png` });

// Close the sheet and jump.
await page.evaluate(() => {
  document.querySelector('.sv-icon-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 700));
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('.sv-act')].find((b) => /jump/i.test(b.textContent ?? ''));
  btn?.click();
});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: `${OUT}/v6-jump.png` });

// Desktop.
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await new Promise((r) => setTimeout(r, 1400));
await page.screenshot({ path: `${OUT}/v7-desktop.png` });

const desktopLayout = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth - window.innerWidth,
}));

writeFileSync(
  'public/verify.json',
  JSON.stringify({ layout, desktopLayout, tourShots, logs }, null, 2)
);

console.log(JSON.stringify({ layout, desktopLayout, logCount: logs.length }, null, 2));
console.log(logs.slice(0, 25).join('\n'));

await browser.close();
