import { test, expect } from '@playwright/test';
import { elapsedMotionTime, advanceAngle, followTarget } from '../src/utils/orbit-motion.js';

test('integrated rotation is continuous when interaction speed changes', () => {
  const omega = 0.000195;
  let phase = 0;
  for (let frame = 0; frame < 1200; frame++) {
    phase = advanceAngle(phase, 1000 / 120, omega);
  }
  const before = phase;
  // An input surge changes angular velocity, not the previously accumulated
  // orientation. This used to jump by elapsed time * omega * energy.
  phase = advanceAngle(phase, 1000 / 120, omega, 1.65);
  const chord = Math.hypot(Math.cos(phase) - Math.cos(before), Math.sin(phase) - Math.sin(before));
  expect(chord).toBeLessThan(0.003);
  expect(chord).toBeGreaterThan(0);
});

test('orbital speed is independent of 60/120/144 Hz display refresh', () => {
  const simulate = fps => {
    let angle = 0;
    for (let i = 0; i < fps * 5; i++) {
      angle = advanceAngle(angle, 1000 / fps, 0.0008, 1.55);
    }
    return angle;
  };
  expect(simulate(60)).toBeCloseTo(simulate(120), 10);
  expect(simulate(120)).toBeCloseTo(simulate(144), 10);
});

test('mouse tilt interpolation is smooth and frame-rate independent', () => {
  const interpolate = fps => {
    let angle = 0;
    for (let i = 0; i < fps; i++) {
      angle = followTarget(angle, 0.55, 1000 / fps, 170);
    }
    return angle;
  };
  expect(interpolate(60)).toBeCloseTo(interpolate(120), 10);
  expect(interpolate(120)).toBeCloseTo(interpolate(144), 10);
  expect(followTarget(0.4, 0, 8, 170)).toBeGreaterThan(0.38);
});

test('returning from a background tab cannot teleport the orbital phase', () => {
  expect(elapsedMotionTime(50_000, null)).toBe(0);
  expect(elapsedMotionTime(50_000, 2_000)).toBe(50);
  expect(elapsedMotionTime(50_000, 49_990)).toBe(10);
  expect(elapsedMotionTime(49_000, 50_000)).toBe(0);
  const before = 1.4;
  const after = advanceAngle(before, elapsedMotionTime(50_000, 2_000), 0.000195, 1.65);
  expect(Math.abs(after - before)).toBeLessThan(0.017);
});

test('Lorenz integration advances by elapsed time rather than display frames', () => {
  const timeBudget = fps => {
    let previous = null;
    let elapsedTotal = 0;
    for (let i = 1; i <= fps * 5; i++) {
      const now = i * (1000 / fps);
      elapsedTotal += elapsedMotionTime(now, previous);
      previous = now;
    }
    // One initial frame is for initialization; subsequent elapsed time is
    // invariant at each supported refresh rate.
    return elapsedTotal / 1000;
  };
  expect(timeBudget(60)).toBeGreaterThan(4.97);
  expect(timeBudget(120)).toBeGreaterThan(4.98);
  expect(timeBudget(144)).toBeGreaterThan(4.98);
  expect(Math.abs(timeBudget(60) - timeBudget(144))).toBeLessThan(0.012);
});

test('performance-mode orbit stays interactive without browser exceptions', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('pf_settings', JSON.stringify({
    theme: 'dark', bgfx: true, perfMode: 'performance', cursor: false, trail: false,
  })));
  await page.goto('/');
  const canvas = page.locator('#bg-canvas');
  await expect(canvas).toHaveCount(1);
  await page.waitForTimeout(300);
  const initial = await canvas.evaluate(el => el.toDataURL());
  await page.mouse.move(750, 490);
  await page.waitForTimeout(400);
  const interactive = await canvas.evaluate(el => el.toDataURL());
  expect(interactive).not.toBe(initial);
  await page.mouse.move(1430, 880);
  await page.waitForTimeout(150);
  expect(errors).toEqual([]);
});

test.describe('performance-mode phone viewport', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('renders while preserving native scrolling and page controls', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem('pf_settings', JSON.stringify({
      perfMode: 'performance', bgfx: true, cursor: false, trail: false,
    })));
    await page.goto('/');
    await expect(page.locator('#bg-canvas')).toHaveCount(1);
    await page.touchscreen.tap(190, 420);
    await page.evaluate(() => window.scrollTo(0, 560));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect(page.locator('#projects .project-card')).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(errors).toEqual([]);
  });
});
