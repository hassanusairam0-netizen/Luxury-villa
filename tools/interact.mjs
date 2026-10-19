// QA: real scroll (down + back up), room selector, restart, mobile layout.
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
const run = async (opts, fn) => {
  const page = await browser.newPage(opts);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '?q=low&ao=0', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__villa?.ready, null, { timeout: 600000 });
  await fn(page);
  await page.close();
};
let window_target_spa = 0;
const st = (p) => p.evaluate(() => window.__villa.getState());
await run({ viewport: { width: 1280, height: 720 } }, async (page) => {
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 1600); await page.waitForTimeout(400); }
  await page.waitForTimeout(4000);
  const down = await st(page);
  console.log('after scrolling down', JSON.stringify(down));
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -1600); await page.waitForTimeout(400); }
  await page.waitForTimeout(4000);
  const up = await st(page);
  console.log('after scrolling up  ', JSON.stringify(up), up.progress < down.progress ? 'OK reversed' : 'FAIL');
  await page.click('#explore-btn');
  await page.waitForTimeout(800);
  console.log('panel open:', await page.isVisible('#rooms-panel'));
  window_target_spa = await page.evaluate(() => window.__villa.KEYFRAMES.find((k) => k.id === 'spa').at);
  await page.click('#rooms-list li[data-id="spa"] button');
  await page.waitForTimeout(9000);
  const spa = await st(page);
  console.log('after selecting spa ', JSON.stringify(spa), Math.abs(spa.target - window_target_spa) < 0.01 ? 'OK (scroll target reached)' : 'FAIL');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__villa.navigate('outdoor'));
  await page.waitForTimeout(9000);
  console.log('nav outdoor', JSON.stringify(await st(page)));
  await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); });
  await page.waitForTimeout(6000);
  console.log('finale visible:', await page.evaluate(() => getComputedStyle(document.getElementById('restart-btn').parentElement).visibility));
  await page.click('#restart-btn', { force: true });
  await page.waitForTimeout(10000);
  const r = await st(page);
  console.log('after restart', JSON.stringify(r), r.target < 0.02 ? 'OK' : 'FAIL');
});
await run({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }, async (page) => {
  await page.evaluate(() => window.__villa.renderAt(0.25));
  await page.screenshot({ path: 'shots/mobile_living.png' });
  await page.evaluate(() => window.__villa.renderAt(0));
  await page.screenshot({ path: 'shots/mobile_hero.png' });
  const ow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log('mobile horizontal overflow:', ow);
});
console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
