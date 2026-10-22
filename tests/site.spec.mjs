import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('cid.locale')) localStorage.setItem('cid.locale', 'th');
    if (!localStorage.getItem('cid.theme')) localStorage.setItem('cid.theme', 'dark');
  });
});

test('renders verified public projects and functional details', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('ทำงานได้');
  await expect(page.locator('.featured-work h3')).toHaveText('Music App for Android');
  await expect(page.locator('.work-card')).toHaveCount(3);
  await expect(page.locator('.work-card a[target="_blank"]')).toHaveCount(3);
  const detail = page.locator('.project-details').first();
  await detail.locator('summary').click();
  await expect(detail).toHaveAttribute('open', '');
  await expect(detail.locator('.details-body')).toBeVisible();
  expect(errors).toEqual([]);
});

test('switches Thai and English, retaining user preference', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#work-title')).toHaveText('Things I have built.');
  await page.reload();
  await expect(page.locator('#work-title')).toHaveText('Things I have built.');
  await page.getByRole('button', { name: 'เปลี่ยนเป็นภาษาไทย' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
});

test('theme and anchors work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'สลับโหมดสี' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('.desktop-nav a[href="#work"]').click();
  await expect(page).toHaveURL(/#work$/);
  await page.getByRole('button', { name: 'สลับโหมดสี' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('mobile navigation, legibility and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'เปิดเมนู' });
  await menu.click();
  await expect(page.locator('#mobile-nav')).toHaveClass(/open/);
  await expect(page.locator('.menu-button')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#mobile-nav a[href="#now"]').click();
  await expect(page).toHaveURL(/#now$/);
  await expect(page.locator('.menu-button')).toHaveAttribute('aria-expanded', 'false');
  const unseenCards = await page.evaluate(() =>
    [...document.querySelectorAll('.featured-work, .work-card, .approach-intro')]
      .filter(el => {
        const style = getComputedStyle(el);
        // A short fade-in (opacity >= .75) is fine; fully hidden content is not.
        return style.display === 'none' || style.visibility === 'hidden' ||
          Number(style.opacity) < 0.15;
      }).length);
  expect(unseenCards).toBe(0);
  const width = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    window: innerWidth
  }));
  expect(width.content).toBeLessThanOrEqual(width.window + 1);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true, animations: 'disabled' });
});

test('reduced motion remains usable and fallback markup exists', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#sculpture .sculpture-fallback')).toBeAttached();
  await expect(page.getByRole('link', { name: /ดูผลงาน/ })).toBeVisible();
  await page.locator('#work').scrollIntoViewIfNeeded();
  await expect(page.locator('.featured-work')).toBeVisible();
});

test('desktop layout screenshot and keyboard access', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(async () => { await document.fonts.ready; });
  for (const id of ['work', 'approach', 'now', 'contact']) {
    await page.locator('#' + id).scrollIntoViewIfNeeded();
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(700);
  const width = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  expect(width[0]).toBeLessThanOrEqual(width[1] + 1);
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true, animations: 'disabled' });
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
});
