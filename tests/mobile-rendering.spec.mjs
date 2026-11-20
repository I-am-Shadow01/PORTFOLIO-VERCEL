import { test, expect } from '@playwright/test';

const mobileSettings = {
  perfMode: 'performance', adaptive: true, bgfx: true,
  anim: false, cursor: false, trail: false,
};

test.describe('high-density mobile Canvas2D resolution', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  test('adaptive mode caps decorative pixels without reducing the page resolution', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(settings => {
      localStorage.setItem('pf_settings', JSON.stringify(settings));
    }, mobileSettings);
    await page.goto('/');
    const canvas = page.locator('#bg-canvas');
    await expect.poll(() => canvas.evaluate(el => el.width)).toBe(546);
    expect(await canvas.evaluate(el => el.height)).toBe(1182);
    expect(await canvas.evaluate(el => ({
      cssWidth: el.getBoundingClientRect().width,
      pointerEvents: getComputedStyle(el).pointerEvents,
    }))).toEqual({ cssWidth: 390, pointerEvents: 'none' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(errors).toEqual([]);
  });

  test('manual override and adaptive re-enable take effect immediately via Settings UI', async ({ page }) => {
    await page.addInitScript(settings => {
      localStorage.setItem('pf_settings', JSON.stringify(settings));
    }, mobileSettings);
    await page.goto('/');
    const canvas = page.locator('#bg-canvas');
    await expect.poll(() => canvas.evaluate(el => el.width)).toBe(546);
    await page.locator('#settings-trigger').click();
    const adaptive = page.locator('.sp-toggle[data-setting="adaptive"]');
    await expect(adaptive).toHaveAttribute('aria-checked', 'true');
    await adaptive.click();
    await expect.poll(() => canvas.evaluate(el => el.width)).toBe(780);
    expect(await canvas.evaluate(el => el.height)).toBe(1688);
    await expect(page.locator('.sp-toggle[data-setting="adaptive"]')).toHaveAttribute('aria-checked', 'false');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pf_settings')).adaptive)).toBe(false);

    await page.locator('.sp-toggle[data-setting="adaptive"]').click();
    await expect.poll(() => canvas.evaluate(el => el.width)).toBe(546);
    expect(await canvas.evaluate(el => el.height)).toBe(1182);
    await expect(page.locator('.sp-toggle[data-setting="adaptive"]')).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => document.querySelectorAll('#bg-canvas').length)).toBe(1);
  });

  test('viewport resize preserves mobile budget and reduced-motion static drawing', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(settings => {
      localStorage.setItem('pf_settings', JSON.stringify(settings));
    }, { ...mobileSettings, anim: true });
    await page.goto('/');
    const canvas = page.locator('#bg-canvas');
    await expect.poll(() => canvas.evaluate(el => el.width)).toBe(546);
    await page.waitForTimeout(150);
    const before = await canvas.evaluate(el => el.toDataURL());
    await page.setViewportSize({ width: 320, height: 700 });
    await expect.poll(() => canvas.evaluate(el => el.width)).toBe(448);
    expect(await canvas.evaluate(el => el.height)).toBe(980);
    await page.waitForTimeout(150);
    const after = await canvas.evaluate(el => el.toDataURL());
    expect(after).not.toBe(before);
    await page.waitForTimeout(150);
    expect(await canvas.evaluate(el => el.toDataURL())).toBe(after);
  });
});

test.describe('desktop backing-store quality', () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  });

  test('does not apply the mobile cap on fine-pointer desktop', async ({ page }) => {
    await page.addInitScript(settings => {
      localStorage.setItem('pf_settings', JSON.stringify(settings));
    }, mobileSettings);
    await page.goto('/');
    const canvas = page.locator('#bg-canvas');
    await expect.poll(() => canvas.evaluate(el => el.width)).toBe(2880);
    expect(await canvas.evaluate(el => el.height)).toBe(1800);
  });
});
