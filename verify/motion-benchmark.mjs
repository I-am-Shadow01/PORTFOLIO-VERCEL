// Paired, real-Chrome visual evidence. Run from repo root:
// node verify/motion-benchmark.mjs
// Measures background Canvas submissions, not monitor presentation FPS.
import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve('.');
const outputDir = join(root, 'test-results', 'motion-evidence');
const base = 'https://cid-02.vercel.app/';
const candidate = 'http://127.0.0.1:4177/';
const baseVersion = '20261120-orbit-fix';
const patchVersion = '20261121-motion-continuity';
const profiles = [
  { label: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  { label: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
];
const settings = {
  theme: 'dark', bgfx: true, anim: true, perfMode: 'performance',
  adaptive: true, cursor: false, trail: false,
};

const server = spawn(process.execPath, ['tests/serve.mjs'], { cwd: root, stdio: 'ignore', windowsHide: true });
let browser;
try {
  await mkdir(outputDir, { recursive: true });
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(candidate + 'index.html');
      if (res.ok && (await res.text()).includes(patchVersion)) break;
    } catch {}
    if (i === 39) throw new Error('Local preview HTTP server unavailable');
    await delay(100);
  }
  const currentProduction = await fetch(base);
  if (!currentProduction.ok || !(await currentProduction.text()).includes(baseVersion)) {
    throw new Error('Production baseline has moved; reverify commit before comparison');
  }
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  for (const profile of profiles) {
    for (const [revision, url] of [['baseline', base], ['patch', candidate]]) {
      const context = await browser.newContext({
        viewport: profile.viewport, isMobile: profile.isMobile, hasTouch: profile.hasTouch,
        deviceScaleFactor: profile.deviceScaleFactor,
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.addInitScript(value => {
        localStorage.setItem('pf_settings', JSON.stringify(value));
        // Same deterministic scene seed on both revisions.
        let seed = 0x13A4C681;
        Math.random = () => {
          seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
          return (seed >>> 0) / 0x100000000;
        };
        window.__canvasFrames = [];
        window.__canvasArcs = [];
        let arcs = 0;
        const clear = CanvasRenderingContext2D.prototype.clearRect;
        const arc = CanvasRenderingContext2D.prototype.arc;
        CanvasRenderingContext2D.prototype.arc = function (...args) {
          if (this.canvas.id === 'bg-canvas') arcs++;
          return arc.apply(this, args);
        };
        CanvasRenderingContext2D.prototype.clearRect = function (...args) {
          if (this.canvas.id === 'bg-canvas') {
            window.__canvasFrames.push(performance.now());
            window.__canvasArcs.push(arcs);
            if (window.__canvasFrames.length > 2000) window.__canvasFrames.shift();
            if (window.__canvasArcs.length > 2000) window.__canvasArcs.shift();
            arcs = 0;
          }
          return clear.apply(this, args);
        };
      }, settings);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.locator('#bg-canvas').waitFor({ timeout: 15_000 });
      const videoDir = join(outputDir, `${profile.label}-${revision}-frames`);
      await mkdir(videoDir, { recursive: true });
      const cdp = await context.newCDPSession(page);
      await cdp.send('Page.enable');
      let videoFrames = 0;
      const frameWrites = [];
      const captureTimes = [];
      cdp.on('Page.screencastFrame', frame => {
        videoFrames++;
        captureTimes.push(frame.metadata.timestamp ?? 0);
        const name = 'frame-' + String(videoFrames).padStart(5, '0') + '.jpg';
        frameWrites.push(writeFile(join(videoDir, name), Buffer.from(frame.data, 'base64')));
        void cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {});
      });
      await cdp.send('Page.startScreencast', {
        format: 'jpeg', quality: 72, everyNthFrame: 2,
        maxWidth: profile.viewport.width, maxHeight: profile.viewport.height,
      });
      await page.waitForTimeout(1000);
      await page.evaluate(() => { window.__canvasFrames = []; window.__canvasArcs = []; });
      await page.waitForTimeout(2400);
      const { timestamps, arcCounts } = await page.evaluate(() => ({
        timestamps: window.__canvasFrames, arcCounts: window.__canvasArcs,
      }));
      const gaps = timestamps.slice(1).map((v, i) => v - timestamps[i]).sort((a, b) => a - b);
      const p95 = gaps[Math.floor(0.95 * (gaps.length - 1))] ?? null;
      const interval = timestamps.length > 1 ? timestamps.at(-1) - timestamps[0] : 0;
      const cps = interval > 0 ? (timestamps.length - 1) * 1000 / interval : null;
      await page.screenshot({ path: join(outputDir, `${profile.label}-${revision}.png`) });
      if (profile.hasTouch) {
        await page.touchscreen.tap(180, 420);
        await page.evaluate(() => window.scrollTo(0, 520));
        await page.setViewportSize({ width: 390, height: 780 });
      } else {
        await page.mouse.move(800, 450);
        await page.mouse.move(100, 120, { steps: 12 });
        await page.evaluate(() => window.scrollTo(0, 550));
        await page.setViewportSize({ width: 1280, height: 800 });
      }
      await page.waitForTimeout(250);
      await page.screenshot({ path: join(outputDir, `${profile.label}-${revision}-interaction.png`) });
      await cdp.send('Page.stopScreencast');
      await Promise.all(frameWrites);
      const videoPath = join(outputDir, `${profile.label}-${revision}.mp4`);
      let videoSaved = false;
      if (videoFrames >= 3) {
        const encoded = spawnSync('ffmpeg', [
          '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '24',
          '-i', join(videoDir, 'frame-%05d.jpg'),
          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', videoPath,
        ], { windowsHide: true, timeout: 60_000 });
        videoSaved = encoded.status === 0;
        if (!videoSaved) errors.push('Video encoding unavailable: ' + String(encoded.error || encoded.stderr).slice(0, 200));
      }
      const tailArcCounts = arcCounts.slice(-12);
      results.push({
        device: profile.label, revision, url,
        canvasDraws: timestamps.length,
        canvasDrawsPerSecond: cps && Number(cps.toFixed(1)),
        p95CanvasDrawGapMs: p95 && Number(p95.toFixed(1)),
        idleArcCountRange: tailArcCounts.length ? Math.max(...tailArcCounts) - Math.min(...tailArcCounts) : null,
        videoFrames, videoTimeSamples: captureTimes.length,
        videoFile: videoSaved ? videoPath : null,
        screenshots: [
          join(outputDir, `${profile.label}-${revision}.png`),
          join(outputDir, `${profile.label}-${revision}-interaction.png`),
        ],
        errors,
      });
      await context.close();
    }
  }
  await writeFile(join(outputDir, 'benchmark.json'), JSON.stringify({
    testedAt: new Date().toISOString(),
    baselineCommit: 'c52f81ee013604288c5d5bf0b8b474fc3e60e877',
    baselineVersion: baseVersion, candidateVersion: patchVersion,
    settings, profiles,
    note: 'Real Windows Chrome headless emulation; Canvas clear/draw submissions per second are not physical-device presentation FPS. Videos assembled from CDP screenshot frames at illustrative 24fps, not original real-time cadence. Visual continuity separately asserted by Playwright regression.',
    results,
  }, null, 2));
  process.stdout.write(JSON.stringify(results, null, 2) + '\n');
} finally {
  if (browser) await browser.close();
  server.kill();
}
