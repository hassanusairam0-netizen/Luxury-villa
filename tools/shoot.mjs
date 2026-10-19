// Renders the experience at given journey positions and saves screenshots.
// Usage: node tools/shoot.mjs [baseUrl] p1 p2 ... (or "all" for every keyframe)
import { chromium } from 'playwright';
import fs from 'node:fs';

const args = process.argv.slice(2);
const base = args[0]?.startsWith('http') ? args.shift() : 'http://localhost:5173/';
const width = +(process.env.W || 1280);
const height = +(process.env.H || 720);
const extra = process.env.Q || '';
const outDir = process.env.OUT || 'shots';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: !!process.env.MOBILE, hasTouch: !!process.env.MOBILE });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(`${base}?p=0${extra}`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__villa?.ready, null, { timeout: 600000 });
let ps = args;
if (args[0] === 'all') {
  ps = await page.evaluate(() => window.__villa.KEYFRAMES.map((k) => k.at));
}
for (const [i, p] of ps.entries()) {
  const v = +p;
  const ms = await page.evaluate((v) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, v * max);
    return window.__villa.renderAt(v);
  }, v);
  await page.waitForTimeout(+(process.env.WAIT || 1200));
  await page.evaluate((v) => window.__villa.renderAt(v), v);
  const st = await page.evaluate(() => ({ ...window.__villa.getState(), ...window.__villa.renderInfo() }));
  const name = `${outDir}/${String(i).padStart(2, '0')}_p${v.toFixed(3)}.png`;
  await page.screenshot({ path: name, timeout: 120000 });
  console.log(name, Math.round(ms) + 'ms', JSON.stringify(st));
}
console.log(logs.filter((l) => !l.includes('GPU stall')).slice(0, 40).join('\n'));
await browser.close();
