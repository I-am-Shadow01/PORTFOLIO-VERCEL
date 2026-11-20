/**
 * bench.mjs — runs the REAL background engine headlessly and reports cost.
 *
 *   node bench.mjs <srcRoot> <perfMode>
 *
 * Measures, over the same scripted interaction (mouse sweep + scroll + clicks):
 *   • mean / p95 CPU time per frame (rasterizer included)
 *   • canvas draw calls per frame (stroke/fill/drawImage/putImageData)
 *   • canvas state writes (fillStyle/strokeStyle/...) per frame
 *   • pixels pushed through putImageData per frame
 * and writes a PNG of the final frame so output can be eyeballed.
 */
import { createEnv } from './env.mjs';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '../PORTFOLIO-VERCEL');
const mode = process.argv[3] || 'performance';
const FRAMES = Number(process.argv[4] || 420);
const theme = process.argv[5] || 'dark';

const env = createEnv({ width: 1280, height: 720, dpr: 1, theme });
const { window, document } = env;

// settings the engine reads
localStorage.setItem('pf_settings', JSON.stringify({
  theme: 'dark', lang: 'en', accent: '#C6F135', fontSize: 'md',
  anim: true, cursor: true, bgfx: true, perfMode: mode, showFps: false,
}));

// settings module must be loaded first so the engine sees the requested perfMode
const settingsMod = await import(pathToFileURL(path.join(root, 'src/utils/settings.js')).href);
settingsMod.loadSettings();
const mod = await import(pathToFileURL(path.join(root, 'src/utils/background.js')).href);
const cleanup = mod.initBackground();

// warm-up (particles need to spread, trails need to fill)
env.resetStats();
env.runFrames(90);
for (let i = 0; i < 30; i++) env.mouse(100 + i * 30, 200 + Math.sin(i / 3) * 120);
env.runFrames(60);

// ── measured section: scripted interaction ─────────────────────
env.resetStats();
const perFrame = [];
const BATCH = 20;
for (let b = 0; b < FRAMES / BATCH; b++) {
  // moving pointer + scrolling page + occasional click
  for (let i = 0; i < BATCH; i++) {
    const f = b * BATCH + i;
    env.mouse(120 + (Math.sin(f / 23) * 0.5 + 0.5) * 1000, 120 + (Math.cos(f / 17) * 0.5 + 0.5) * 460);
    if (f % 60 === 0) env.click(600, 300);
    if (f % 7 === 0) env.scroll((f * 3) % 3000);
  }
  perFrame.push(...env.runFrames(BATCH));
}

const s = env.stats;
const total = Object.values(s.methodCalls).reduce((a, b) => a + b, 0);
const sorted = [...perFrame].sort((a, b) => a - b);
const mean = perFrame.reduce((a, b) => a + b, 0) / perFrame.length;

const out = {
  src: root,
  perfMode: mode,
  frames: perFrame.length,
  meanMsPerFrame: +mean.toFixed(3),
  p95MsPerFrame: +sorted[Math.floor(sorted.length * 0.95)].toFixed(3),
  drawCallsPerFrame: +(total / perFrame.length).toFixed(1),
  stateWritesPerFrame: +(s.propSets / perFrame.length).toFixed(1),
  putImageDataPixelsPerFrame: Math.round(s.pixelWrites / perFrame.length),
  breakdownPerFrame: Object.fromEntries(
    Object.entries(s.methodCalls)
      .map(([k, v]) => [k, +(v / perFrame.length).toFixed(1)])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  ),
};
console.log(JSON.stringify(out, null, 2));

const png = env.snapshotCanvas();
if (png) {
  const name = `shot-${path.basename(root)}-${mode}-${theme}.png`;
  writeFileSync(path.join(import.meta.dirname, name), png);
  console.error('screenshot:', name, png.length, 'bytes');
}
cleanup?.();
