// QA: verifies the camera path never enters a wall, pane of glass, piece of
// furniture or the ground, and that room labels match the camera position.
// Usage: node tools/check-path.mjs [baseUrl]
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`${base}?q=low&ao=0&bloom=0`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__villa?.ready, null, { timeout: 600000 });
const report = await page.evaluate(() => {
  const { colliders, sample, KEYFRAMES, heightAt, roomAt } = window.__villa;
  const N = 6000;
  const margin = 0.2;
  const hits = new Map();
  const ground = [];
  const s = {};
  let minClear = Infinity;
  for (let i = 0; i <= N; i++) {
    const p = i / N;
    sample(p, s);
    const { x, y, z } = s.pos;
    for (const c of colliders) {
      if (x > c.min[0] - margin && x < c.max[0] + margin && y > c.min[1] - margin && y < c.max[1] + margin && z > c.min[2] - margin && z < c.max[2] + margin) {
        const key = `${c.name} [${c.min.map((v) => v.toFixed(2))}]→[${c.max.map((v) => v.toFixed(2))}]`;
        if (!hits.has(key)) hits.set(key, []);
        hits.get(key).push({ p: +p.toFixed(4), seg: s.index, pos: [x, y, z].map((v) => +v.toFixed(2)) });
      }
    }
    const g = heightAt(x, z);
    const inside = roomAt(x, z);
    if (!inside && y - g < 1.0) ground.push({ p: +p.toFixed(4), y: +y.toFixed(2), g: +g.toFixed(2) });
  }
  return {
    colliders: colliders.length,
    hits: [...hits.entries()].map(([k, v]) => ({ collider: k, count: v.length, first: v[0], last: v[v.length - 1] })),
    ground: ground.slice(0, 10),
    groundCount: ground.length,
    keyframes: KEYFRAMES.map((k, i) => ({ i, id: k.id, at: +k.at.toFixed(4), room: roomAt(k.pos.x, k.pos.z)?.id ?? '-' })),
  };
});
console.log(`colliders: ${report.colliders}`);
console.log(`collisions: ${report.hits.length}`);
for (const h of report.hits) console.log('  HIT', h.collider, 'x', h.count, 'first', JSON.stringify(h.first), 'last', JSON.stringify(h.last));
console.log(`ground clearance violations (outside rooms, < 1.0 m): ${report.groundCount}`, JSON.stringify(report.ground));
console.log(report.keyframes.map((k) => `${k.i}:${k.id ?? ''}@${k.at}=${k.room}`).join('  '));
await browser.close();
process.exit(report.hits.length || report.groundCount ? 1 : 0);
