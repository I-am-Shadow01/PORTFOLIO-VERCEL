test('fluid surface renders distinct frames instead of rotating a static image', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const canvas = page.locator('#hero-canvas');
  const canRender = await page.evaluate(() => {
    const probe = document.createElement('canvas');
    return !!probe.getContext('webgl2');
  });
  if (!canRender) {
    await expect(canvas).toHaveAttribute('data-motion', 'unavailable');
    return;
  }

  await expect.poll(() => canvas.getAttribute('data-motion'), { timeout: 12000 })
    .toBe('running');
  await expect(canvas).toHaveClass(/scene-ready/);
  const first = await canvas.screenshot({ animations: 'disabled' });
  await page.waitForTimeout(440);
  const second = await canvas.screenshot({ animations: 'disabled' });
  expect(first.equals(second)).toBe(false);

  await page.mouse.move(1200, 200);
  await page.waitForTimeout(420);
  const third = await canvas.screenshot({ animations: 'disabled' });
  expect(second.equals(third)).toBe(false);
});

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cid.locale', 'en');
    localStorage.setItem('cid.theme', 'dark');
  });
});

test('kinetic sculpture is progressive enhancement with graceful WebGL fallback', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  await page.goto('/');
  const scene = page.locator('#hero-canvas');
  await expect(scene).toBeAttached();
  await expect.poll(() => scene.getAttribute('data-motion'), {timeout: 12000})
    .toMatch(/running|static|unavailable/);
  await expect(page.locator('.sculpture-fallback')).toBeAttached();
  const mode = await scene.getAttribute('data-motion');
  if (mode === 'running') {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect.poll(() => scene.getAttribute('data-motion')).toBe('paused');
    await page.locator('#hero-title').scrollIntoViewIfNeeded();
    await expect.poll(() => scene.getAttribute('data-motion')).toBe('running');
  }
  expect(pageErrors).toEqual([]);
});

test('featured scene animates only in view, and secondary motion pauses offscreen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const feature = page.locator('.featured-stage');
  await feature.scrollIntoViewIfNeeded();
  await expect(feature).toHaveClass(/motion-seen/);
  await expect.poll(() => feature.locator('.album-disc').evaluate(el => getComputedStyle(el).animationName))
    .toContain('vinyl-turn');
  const bar = feature.locator('.album-wave span').first();
  const barHeight = await bar.evaluate(el => getComputedStyle(el).height);
  expect(parseFloat(barHeight)).toBeGreaterThan(8);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(feature).toHaveClass(/motion-idle/);
  await expect.poll(() => feature.locator('.album-disc').evaluate(el => getComputedStyle(el).animationPlayState))
    .toBe('paused');
});

test('reduced motion gives a static composition, not hidden content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#hero-title')).toBeVisible();
  const mode = await page.locator('#hero-canvas').getAttribute('data-motion');
  await expect.poll(() => page.locator('#hero-canvas').getAttribute('data-motion'), {timeout: 10000})
    .toMatch(/static|unavailable/);
  const names = await page.locator('.hero-copy h1 em').evaluate(el => getComputedStyle(el).animationName);
  expect(names).toBe('none');
  await page.locator('.featured-stage').scrollIntoViewIfNeeded();
  expect(await page.locator('.album-disc').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await page.locator('.featured-work').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
});

test('WebGL disabled does not prevent use of the site', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl2') return null;
      return original.call(this, type, ...args);
    };
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#hero-canvas')).toHaveAttribute('data-motion', 'unavailable');
  await expect(page.locator('.sculpture-fallback')).toBeAttached();
  await expect(page.locator('.work-card')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('language switch cleans up old scene and secondary observer', async ({ page }) => {
  await page.goto('/');
  for (let i=0;i<3;i++) {
    await page.locator('.lang-button').click();
    await expect(page.locator('#hero-canvas')).toHaveCount(1);
    await expect.poll(() => page.locator('#hero-canvas').getAttribute('data-motion'), {timeout: 10000})
      .toMatch(/running|static|unavailable/);
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
});

test('touch layout keeps visual treatments bounded and avoids sideways scrolling', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('.sculpture')).toBeVisible();
  await page.locator('#work').scrollIntoViewIfNeeded();
  const metrics=await page.evaluate(() => ({
    content:document.documentElement.scrollWidth,
    viewport:window.innerWidth,
    card:document.querySelector('.featured-stage')?.getBoundingClientRect().width,
  }));
  expect(metrics.content).toBeLessThanOrEqual(metrics.viewport+1);
  expect(metrics.card).toBeLessThanOrEqual(metrics.viewport);
});
