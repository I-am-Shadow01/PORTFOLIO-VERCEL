import { test, expect } from '@playwright/test';

test('restores the original visual identity and project explorer', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.hero-name')).toContainText('CIDKAGENOU');
  await expect(page.locator('#bg-canvas')).toHaveCount(1);
  await expect(page.locator('.hstat')).toHaveCount(4);
  await expect(page.locator('#projects .project-card')).toHaveCount(5);
  await expect(page.locator('#donate')).toBeVisible();
  await page.locator('#projects [data-filter="apps"]').click();
  await expect(page.locator('#projects .project-card:visible')).toHaveCount(1);
  expect(errors).toEqual([]);
});

for (const width of [320, 360, 390, 640, 768, 1024, 1440]) {
  test(`hero and stats remain complete at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('.hero-name').waitFor();
    const result = await page.evaluate(() => {
      const name = document.querySelector('.hero-name').getBoundingClientRect();
      const stats = document.querySelector('.hero-stats').getBoundingClientRect();
      const last = document.querySelector('.hstat:last-of-type').getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        viewport: innerWidth,
        wordmarkOverflow: document.querySelector('.name-last').scrollWidth >
          document.querySelector('.name-last').clientWidth + 1,
        nameLeft: name.left,
        nameRight: name.right,
        statsLeft: stats.left,
        statsRight: stats.right,
        lastLeft: last.left,
        lastRight: last.right,
        lastWidth: last.width,
      };
    });
    expect(result.scrollWidth).toBeLessThanOrEqual(width + 1);
    expect(result.wordmarkOverflow).toBe(false);
    expect(result.nameLeft).toBeGreaterThanOrEqual(-1);
    expect(result.nameRight).toBeLessThanOrEqual(width + 1);
    expect(result.statsRight).toBeLessThanOrEqual(width + 1);
    expect(result.lastWidth).toBeGreaterThan(25);
    expect(result.lastLeft).toBeGreaterThanOrEqual(result.statsLeft - 1);
    expect(result.lastRight).toBeLessThanOrEqual(result.statsRight + 1);
  });
}

test('animations off freezes the canvas and respects reduced motion', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pf_settings', JSON.stringify({ anim: false, bgfx: true, perfMode: 'performance' }));
  });
  await page.goto('/');
  await expect(page.locator('#bg-canvas')).toHaveCount(1);
  await page.waitForTimeout(300);
  const image1 = await page.locator('#bg-canvas').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(400);
  const image2 = await page.locator('#bg-canvas').evaluate(canvas => canvas.toDataURL());
  expect(image2).toBe(image1);
  await page.setViewportSize({ width: 900, height: 800 });
  await expect.poll(() => page.locator('#bg-canvas').evaluate(canvas => canvas.width)).toBe(900);
  const image3 = await page.locator('#bg-canvas').evaluate(canvas => canvas.toDataURL());
  expect(image3).not.toBe(image1);
});

test('rapid theme toggles keep the latest choice', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings-trigger').click();
  await page.locator('[data-setting="theme"][data-value="light"]').click();
  await page.locator('[data-setting="theme"][data-value="dark"]').click();
  await page.waitForTimeout(350);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('mobile navigation is keyboard accessible and returns focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const burger = page.locator('.nav-hamburger');
  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.mob-overlay.open')).toHaveCount(1);
  await expect(page.locator('.mob-close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await expect(burger).toBeFocused();
  await expect(page.locator('.mob-overlay')).toHaveCount(0);
});

test('reduced-motion resize repaints a static canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const canvas = page.locator('#bg-canvas');
  await expect(canvas).toHaveCount(1);
  await page.waitForTimeout(150);
  const before = await canvas.evaluate(el => el.toDataURL());
  await page.setViewportSize({ width: 1000, height: 700 });
  await expect.poll(() => canvas.evaluate(el => el.width)).toBe(1000);
  await page.waitForTimeout(150);
  const after = await canvas.evaluate(el => el.toDataURL());
  expect(after).not.toBe(before);
  await page.waitForTimeout(200);
  expect(await canvas.evaluate(el => el.toDataURL())).toBe(after);
});

test('decorative canvas caps its 4K backing-store budget', async ({ page }) => {
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.goto('/');
  const dims = await page.locator('#bg-canvas').evaluate(canvas => ({
    width: canvas.width,
    height: canvas.height,
  }));
  expect(dims.width * dims.height).toBeLessThanOrEqual(8_100_000);
  expect(dims.width).toBeGreaterThan(1000);
});

test('settings preserve accent, language and animation controls', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings-trigger').click();
  await page.locator('[data-setting="accent"][data-value="#A78BFA"]').click();
  await page.locator('[data-setting="lang"][data-value="th"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  await expect(page.locator('#projects .project-card')).toHaveCount(5);
  await expect(page.locator('html')).toHaveCSS('--ac', 'rgb(167, 139, 250)');
});
