import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('cid.locale')) localStorage.setItem('cid.locale', 'en');
    if (!localStorage.getItem('cid.theme')) localStorage.setItem('cid.theme', 'dark');
  });
});

test('category filters expose only matching projects and update their accessible state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const projects = page.locator('[data-project-category]');
  const visibleProjects = page.locator('[data-project-category]:visible');
  const filters = page.locator('[data-project-filter]');
  const status = page.locator('.filter-status');
  await expect(projects).toHaveCount(4);
  await expect(filters).toHaveCount(4);
  await expect(status).toBeAttached();

  for (const [category, count] of [['all', 4], ['audio', 2], ['systems', 1], ['web', 1], ['all', 4]]) {
    const selected = page.locator(`[data-project-filter="${category}"]`);
    await selected.focus();
    await page.keyboard.press('Enter');
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-project-filter][aria-pressed="true"]')).toHaveCount(1);
    await expect(visibleProjects).toHaveCount(count);
    await expect(status).toContainText(String(count));
    const states = await projects.evaluateAll(items => items.map(item => ({
      category: item.dataset.projectCategory,
      hidden: item.hidden,
    })));
    for (const state of states) {
      expect(state.hidden).toBe(category !== 'all' && state.category !== category);
    }
    await expect(selected).toBeFocused();
  }
});

test('keyboard navigation can open and dismiss the mobile menu without trapping focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const menu = page.locator('.menu-button');
  const nav = page.locator('#mobile-nav');

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main');

  await expect(nav).toHaveAttribute('inert', '');
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).not.toHaveAttribute('inert', '');
  await page.keyboard.press('Tab');
  await expect(nav.locator('a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toHaveAttribute('inert', '');
  await expect(menu).toBeFocused();

  await page.keyboard.press('Space');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await nav.locator('a[href="#work"]').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#work$/);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('locale rerender preserves keyboard focus on the language control', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const language = page.locator('.lang-button');
  await language.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  await expect(language).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(language).toBeFocused();
});

test('layout stays within viewport in both languages and themes at critical widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  for (const locale of ['en', 'th']) {
    if (await page.locator('html').getAttribute('lang') !== locale) {
      await page.locator('.lang-button').click();
    }
    for (const theme of ['dark', 'light']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) {
        await page.locator('.theme-toggle').click();
      }
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        const label = `${locale} / ${theme} / ${width}px`;
        const result = await page.evaluate(() => ({
          viewport: innerWidth,
          document: document.documentElement.scrollWidth,
          outside: [...document.querySelectorAll('h1, h2, .header-inner, .sculpture, .featured-work, .work-card, .contact-actions, [data-project-filter]')]
            .map(element => ({ name: element.id || element.className, rect: element.getBoundingClientRect() }))
            .filter(({ rect }) => rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1))
            .map(({ name }) => name),
        }));
        expect(result.document, label).toBeLessThanOrEqual(result.viewport + 1);
        expect(result.outside, label).toEqual([]);
      }
    }
  }
});
