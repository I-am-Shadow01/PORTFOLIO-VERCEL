import { test, expect } from '@playwright/test';
import { STEP_MS, motionSteps, frameBlend, pairImpulse, flowDirection, wrapPosition } from '../src/utils/motion-physics.js';

const settings = {
  theme: 'dark', perfMode: 'performance', adaptive: false,
  anim: true, bgfx: true, cursor: false, trail: false,
};

test('particle motion is elapsed-time invariant at 60, 120 and 144 Hz', () => {
  const distance = hz => {
    let x = 0;
    for (let i = 0; i < hz * 5; i++) x += 1.35 * motionSteps(1000 / hz);
    return x;
  };
  expect(distance(60)).toBeCloseTo(distance(120), 8);
  expect(distance(60)).toBeCloseTo(distance(144), 8);
  expect(distance(60)).toBeCloseTo(300 * 1.35, 8);
  expect(motionSteps(0)).toBe(0);
  expect(motionSteps(1000)).toBe(3);
  expect(STEP_MS).toBeCloseTo(1000 / 60);
});

test('cursor speed and interaction energy smoothing agree across refresh rates', () => {
  const smooth = hz => {
    let value = 0;
    for (let i = 0; i < hz * 2; i++) value += (1 - value) * frameBlend(0.12, 1000 / hz);
    return value;
  };
  expect(smooth(60)).toBeCloseTo(smooth(120), 10);
  expect(smooth(60)).toBeCloseTo(smooth(144), 10);
  expect(frameBlend(0.25, 0)).toBe(0);
});

test('soft-core pair forces remain bounded and continuous near collisions', () => {
  for (const distance of [0, 0.001, 0.5, 0.999, 1.001, 5, 12, 20, 35, 69.9, 70]) {
    const [x, y] = pairImpulse(distance, 0, 1);
    expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
    expect(Math.hypot(x, y)).toBeLessThanOrEqual(0.1600001);
  }
  expect(Math.abs(pairImpulse(0.999, 0)[0] - pairImpulse(1.001, 0)[0])).toBeLessThan(0.01);
  expect(Math.abs(pairImpulse(0, 0)[0] - pairImpulse(1e-9, 0)[0])).toBeLessThan(1e-8);
  expect(Math.abs(pairImpulse(-1e-9, 0)[0] - pairImpulse(1e-9, 0)[0])).toBeLessThan(1e-8);
});

test('flow tangent is continuous across the atan2 branch cut', () => {
  const left = flowDirection(0.4, -0.0001, -100);
  const right = flowDirection(0.4, 0.0001, -100);
  expect(Math.hypot(left[0] - right[0], left[1] - right[1])).toBeLessThan(0.001);
  const coincidentLeft = flowDirection(0, -1e-9, 0);
  const coincidentRight = flowDirection(0, 1e-9, 0);
  expect(Math.hypot(coincidentLeft[0] - coincidentRight[0], coincidentLeft[1] - coincidentRight[1])).toBeLessThan(1e-8);
  for (const [x, y] of [left, right, flowDirection(0, 0, 0), flowDirection(1.2, 30, 30)]) {
    expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
    expect(Math.hypot(x, y)).toBeCloseTo(1, 6);
  }
});

test('torus wrap is bounded even for giant scroll deltas', () => {
  for (const extent of [390, 844, 1440]) {
    for (const n of [-25_000, -100, -11, 0, 1, extent, extent + 11, 65_000]) {
      const wrapped = wrapPosition(n, extent);
      expect(wrapped).toBeGreaterThanOrEqual(-10);
      expect(wrapped).toBeLessThan(extent + 10);
    }
  }
});

test('mobile toolbar resize preserves the existing randomly seeded scene', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(value => {
    localStorage.setItem('pf_settings', JSON.stringify(value));
    const originalRandom = Math.random.bind(Math);
    window.__rngCalls = 0;
    Math.random = () => { window.__rngCalls++; return originalRandom(); };
  }, settings);
  await page.goto('/');
  await expect(page.locator('#bg-canvas')).toHaveCount(1);
  const before = await page.evaluate(() => window.__rngCalls);
  await page.setViewportSize({ width: 390, height: 800 });
  await expect.poll(() => page.locator('#bg-canvas').evaluate(e => e.height)).toBe(800);
  const after = await page.evaluate(() => window.__rngCalls);
  // Ambient stars may occasionally respawn, but viewport changes must not
  // repopulate 100+ flow agents and dozens of particles from fresh randomness.
  expect(after - before).toBeLessThan(20);
});

test('idle performance mode paints orbit geometry in every cleared frame', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(value => {
    localStorage.setItem('pf_settings', JSON.stringify(value));
    window.__orbitFrames = [];
    let arcs = 0;
    const arc = CanvasRenderingContext2D.prototype.arc;
    const clearRect = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.arc = function (...args) {
      if (this.canvas.id === 'bg-canvas') arcs++;
      return arc.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.id === 'bg-canvas') {
        window.__orbitFrames.push({ time: performance.now(), arcs });
        if (window.__orbitFrames.length > 100) window.__orbitFrames.shift();
        arcs = 0;
      }
      return clearRect.apply(this, args);
    };
  }, settings);
  await page.goto('/');
  await expect(page.locator('#bg-canvas')).toHaveCount(1);
  await page.evaluate(async () => {
    const { getPointer, getScrollState } = await import('/src/utils/loop.js');
    getPointer().idle = 4000;
    getScrollState().vel = 0;
  });
  await expect.poll(async () => page.evaluate(() => window.__orbitFrames.length)).toBeGreaterThan(8);
  await page.waitForTimeout(180);
  const last = await page.evaluate(() => window.__orbitFrames.slice(-8).map(f => f.arcs));
  expect(Math.max(...last) - Math.min(...last)).toBeLessThan(9);
});

test('ordinary default adaptive-medium experience survives a browser resize', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('pf_settings', JSON.stringify({
      theme: 'dark', bgfx: true, anim: true, perfMode: 'medium', adaptive: true,
      cursor: false, trail: false,
    }));
    window.__mediumTrace = [];
    window.__pfMotionProbe = data => {
      window.__mediumTrace.push(data);
      if (window.__mediumTrace.length > 80) window.__mediumTrace.shift();
    };
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__mediumTrace.length)).toBeGreaterThan(6);
  const before = await page.evaluate(() => window.__mediumTrace.at(-1));
  expect(before.mode).toBe('medium');
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect.poll(() => page.evaluate(() => window.__mediumTrace.at(-1)?.width)).toBe(1280);
  const records = await page.evaluate(() => window.__mediumTrace.slice(-6));
  for (const current of records) {
    expect(current.resets).toEqual(before.resets);
    expect(Object.values({ ...current.particle, ...current.lorenz }).every(Number.isFinite)).toBe(true);
    expect(current.epicycleMaxGap).toBeLessThan(35);
  }
  expect(errors).toEqual([]);
});

test.describe('real-Chrome motion telemetry under viewport and visibility changes', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  test('keeps phases, particle identities, and trails across toolbar and orientation changes', async ({ page, context }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(value => {
      localStorage.setItem('pf_settings', JSON.stringify(value));
      window.__motionTrace = [];
      window.__pfMotionProbe = entry => {
        window.__motionTrace.push(entry);
        if (window.__motionTrace.length > 400) window.__motionTrace.shift();
      };
    }, settings);
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => window.__motionTrace.length)).toBeGreaterThan(5);
    const getLast = () => page.evaluate(() => window.__motionTrace.at(-1));
    const initial = await getLast();
    expect(initial.layerMask).toBe(7);
    const expectedResets = initial.resets;
    const phaseGap = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    const verify = (before, after) => {
      expect(after.resets).toEqual(expectedResets);
      expect(after.layerMask).toBe(7);
      expect(after.epicycleMaxGap).toBeLessThan(35);
      const elapsed = Math.max(0, after.t - before.t);
      expect(phaseGap(after.phases.hyper[0], before.phases.hyper[0]))
        .toBeLessThanOrEqual(elapsed * 0.000195 * 1.65 + 0.002);
      expect(phaseGap(after.phases.epicycle[0], before.phases.epicycle[0]))
        .toBeLessThanOrEqual(elapsed * 0.0008 * 2.97 + 0.002);
      for (const sample of [after.particle, after.flow, after.lorenz]) {
        expect(Object.values(sample).every(Number.isFinite)).toBe(true);
      }
      // A particle may drift a few pixels between frames; changing the CSS
      // viewport must not randomize its normalized position.
      expect(Math.abs(after.particle.x / after.width - before.particle.x / before.width)).toBeLessThan(0.08);
      expect(Math.abs(after.particle.y / after.height - before.particle.y / before.height)).toBeLessThan(0.08);
    };
    await page.screenshot({ path: testInfo.outputPath('mobile-before.png') });
    await page.setViewportSize({ width: 390, height: 800 });
    await expect.poll(async () => (await getLast()).height).toBe(800);
    let after = await getLast();
    verify(initial, after);
    await page.screenshot({ path: testInfo.outputPath('mobile-after-toolbar.png') });
    await page.setViewportSize({ width: 844, height: 390 });
    await expect.poll(async () => (await getLast()).width).toBe(844);
    const rotated = await getLast();
    verify(after, rotated);
    const recorded = await page.evaluate(() => window.__motionTrace.slice(-20));
    expect(recorded.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < recorded.length; i++) {
      const prior = recorded[i - 1], current = recorded[i];
      expect(current.frame).toBeGreaterThan(prior.frame);
      expect(current.layerMask).toBe(7);
      expect(current.epicycleMaxGap).toBeLessThan(35);
      expect(current.resets).toEqual(expectedResets);
      expect(phaseGap(current.phases.hyper[0], prior.phases.hyper[0]))
        .toBeLessThanOrEqual(Math.min(50, current.t - prior.t) * 0.000195 * 1.65 + 0.002);
      for (const val of Object.values({ ...current.particle, ...current.flow, ...current.lorenz })) {
        expect(Number.isFinite(val)).toBe(true);
      }
    }
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.touchscreen.tap(120, 100);
    await page.waitForTimeout(150);
    expect((await getLast()).resets).toEqual(expectedResets);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(170);
    const afterLargeScroll = await page.evaluate(() => window.__motionTrace.slice(-12));
    for (const sample of afterLargeScroll) {
      expect(Math.abs(sample.sceneScrollDy)).toBeLessThanOrEqual(30.000001);
      expect(Number.isFinite(sample.sceneScrollY)).toBe(true);
      expect(sample.resets).toEqual(expectedResets);
      expect(sample.epicycleMaxGap).toBeLessThan(35);
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    const foreground = await getLast();
    const other = await context.newPage();
    await other.goto('about:blank');
    await other.bringToFront();
    const reallyHidden = await page.evaluate(() => document.hidden);
    await page.bringToFront();
    if (reallyHidden) {
      await expect.poll(async () => (await getLast()).frame).toBeGreaterThan(foreground.frame);
      const resumed = await getLast();
      expect(phaseGap(resumed.phases.hyper[0], foreground.phases.hyper[0])).toBeLessThan(0.02);
    } else {
      testInfo.annotations.push({ type: 'visibility', description: 'headless Chrome did not mark previous tab hidden' });
    }
    await other.close();
    expect(errors).toEqual([]);
  });
});
