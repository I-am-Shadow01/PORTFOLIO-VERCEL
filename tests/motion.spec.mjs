import { test, expect } from '@playwright/test';

test('animated sculpture renders distinct frames when WebGL is supported', async ({ page }) => {
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

  const bounds = await canvas.boundingBox();
  await page.mouse.move(bounds.x + bounds.width * .8, bounds.y + bounds.height * .2);
  await page.waitForTimeout(420);
  const third = await canvas.screenshot({ animations: 'disabled' });
  expect(second.equals(third)).toBe(false);
});

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
  // Inspect actual CSS animation objects so the regression test does not
  // depend on decorative classes or specific keyframe names.
  const animationStates = () => feature.evaluate(el =>
    el.getAnimations({ subtree: true })
      .filter(animation => animation.effect?.getTiming().iterations === Infinity)
      .map(animation => animation.playState));
  await expect.poll(async () => (await animationStates()).includes('running')).toBe(true);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(feature).toHaveClass(/motion-idle/);
  await expect.poll(async () => (await animationStates()).every(state => state !== 'running')).toBe(true);
});

test('reduced motion gives a static composition, not hidden content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#hero-title')).toBeVisible();
  await expect.poll(() => page.locator('#hero-canvas').getAttribute('data-motion'), {timeout: 10000})
    .toMatch(/static|unavailable/);
  await expect.poll(() => page.locator('.hero-copy h1 em').evaluate(el =>
    el.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0);
  await page.locator('.featured-stage').scrollIntoViewIfNeeded();
  expect(await page.locator('.featured-stage').evaluate(el =>
    el.getAnimations({ subtree: true }).filter(animation =>
      animation.playState === 'running' && animation.effect?.getTiming().iterations === Infinity).length)).toBe(0);
  expect(await page.locator('.featured-work').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
});

test('visibility changes pause continuous motion and resume when visible again', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const scene = page.locator('#hero-canvas');
  await expect.poll(() => scene.getAttribute('data-motion'), { timeout: 12000 })
    .toMatch(/running|unavailable/);
  const available = await scene.getAttribute('data-motion') === 'running';
  // Headless Chromium does not reliably mark background tabs hidden.
  // Exercise the browser visibility listener deterministically.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('html')).toHaveClass(/motion-suspended/);
  if (available) await expect(scene).toHaveAttribute('data-motion', 'paused');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('html')).not.toHaveClass(/motion-suspended/);
  if (available) await expect(scene).toHaveAttribute('data-motion', 'running');
});

test('scene controls pause drawing, reset a paused view, and resume continuous drawing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    window.__sceneDrawTimes = [];
    if (!window.WebGL2RenderingContext) return;
    const draw = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      if (this.canvas.id === 'hero-canvas') window.__sceneDrawTimes.push(performance.now());
      return draw.apply(this, args);
    };
  });
  await page.goto('/');
  const canvas = page.locator('#hero-canvas');
  const pause = page.locator('[data-scene-action="pause"]');
  const reset = page.locator('[data-scene-action="reset"]');
  const draws = () => page.evaluate(() => window.__sceneDrawTimes.length);
  await expect.poll(() => canvas.getAttribute('data-motion'), { timeout: 12000 })
    .toMatch(/running|unavailable/);
  if (await canvas.getAttribute('data-motion') === 'unavailable') {
    await expect(pause).toBeDisabled();
    await expect(reset).toBeDisabled();
    test.skip(true, 'WebGL is unavailable; canvas control fallback verified');
  }
  await expect(pause).toBeEnabled();
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(draws).toBeGreaterThan(3);
  await pause.focus();
  await page.keyboard.press('Enter');
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas).toHaveAttribute('data-motion', 'paused');
  // Allow a pending resize/single redraw to settle before comparing counts.
  await page.waitForTimeout(150);
  const paused = await draws();
  await page.waitForTimeout(400);
  expect(await draws()).toBe(paused);

  await reset.focus();
  await page.keyboard.press('Enter');
  await expect.poll(draws).toBeGreaterThan(paused);
  await expect(canvas).toHaveAttribute('data-motion', 'paused');
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(150);
  const resetCount = await draws();
  await page.waitForTimeout(400);
  expect(await draws()).toBe(resetCount);

  await pause.focus();
  await page.keyboard.press('Enter');
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
  await expect(canvas).toHaveAttribute('data-motion', 'running');
  await expect.poll(draws).toBeGreaterThan(resetCount + 3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(canvas).toHaveAttribute('data-motion', 'static');
  await expect(pause).toBeDisabled();
  await expect(reset).toBeEnabled();
});

test('material control changes actual rendered pixels while the scene remains paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    window.__captureScenePixels = false;
    window.__scenePixelHash = null;
    if (!window.WebGL2RenderingContext) return;
    const draw = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      const result = draw.apply(this, args);
      if (this.canvas.id === 'hero-canvas' && window.__captureScenePixels) {
        window.__captureScenePixels = false;
        const pixels = new Uint8Array(this.drawingBufferWidth * this.drawingBufferHeight * 4);
        this.readPixels(0, 0, this.drawingBufferWidth, this.drawingBufferHeight,
          this.RGBA, this.UNSIGNED_BYTE, pixels);
        let hash = 2166136261;
        let opaque = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3]) opaque++;
          hash = Math.imul(hash ^ pixels[i], 16777619);
          hash = Math.imul(hash ^ pixels[i + 1], 16777619);
          hash = Math.imul(hash ^ pixels[i + 2], 16777619);
          hash = Math.imul(hash ^ pixels[i + 3], 16777619);
        }
        window.__scenePixelHash = { hash: hash >>> 0, opaque };
      }
      return result;
    };
  });
  await page.goto('/');
  const canvas = page.locator('#hero-canvas');
  const pause = page.locator('[data-scene-action="pause"]');
  const mode = page.locator('[data-scene-action="mode"]');
  const reset = page.locator('[data-scene-action="reset"]');
  await expect.poll(() => canvas.getAttribute('data-motion'), { timeout: 12000 })
    .toMatch(/running|unavailable/);
  if (await canvas.getAttribute('data-motion') === 'unavailable') {
    await expect(mode).toBeDisabled();
    test.skip(true, 'WebGL is unavailable; material control fallback verified');
  }
  await pause.click();
  await expect(canvas).toHaveAttribute('data-motion', 'paused');
  const captureAfter = async button => {
    await page.evaluate(() => {
      window.__captureScenePixels = true;
      window.__scenePixelHash = null;
    });
    await button.click();
    await expect.poll(() => page.evaluate(() => window.__scenePixelHash)).not.toBeNull();
    const signature = await page.evaluate(() => window.__scenePixelHash);
    expect(signature.opaque).toBeGreaterThan(0);
    await expect(canvas).toHaveAttribute('data-motion', 'paused');
    return signature;
  };
  const original = await captureAfter(reset);
  await expect(mode).toHaveAttribute('aria-pressed', 'false');
  const alternate = await captureAfter(mode);
  await expect(mode).toHaveAttribute('aria-pressed', 'true');
  expect(alternate.hash).not.toBe(original.hash);
  const restored = await captureAfter(reset);
  await expect(mode).toHaveAttribute('aria-pressed', 'false');
  expect(restored.hash).toBe(original.hash);
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
  await expect(page.locator('[data-scene-action="pause"]')).toBeDisabled();
  await expect(page.locator('[data-scene-action="reset"]')).toBeDisabled();
  await expect(page.locator('[data-scene-action="mode"]')).toBeDisabled();
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

test.describe('touch interaction', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('horizontal canvas drag tilts the sculpture and vertical swipe still scrolls', async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      window.__sceneTilt = [0, 0];
      if (!window.WebGL2RenderingContext) return;
      const uniform = WebGL2RenderingContext.prototype.uniform2f;
      WebGL2RenderingContext.prototype.uniform2f = function (location, x, y) {
        if (this.canvas.id === 'hero-canvas') window.__sceneTilt = [x, y];
        return uniform.call(this, location, x, y);
      };
    });
    await page.goto('/');
    const canvas = page.locator('#hero-canvas');
    await canvas.scrollIntoViewIfNeeded();
    await expect.poll(() => canvas.getAttribute('data-motion'), { timeout: 12000 })
      .toMatch(/running|unavailable/);
    test.skip(await canvas.getAttribute('data-motion') === 'unavailable', 'WebGL unavailable');
    expect(await canvas.evaluate(el => getComputedStyle(el).touchAction)).toMatch(/\bpan-y\b/);
    const cdp = await context.newCDPSession(page);
    const drag = async (x, y, dx, dy, hold = false) => {
      const event = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
      await event('touchStart', [{ x, y, id: 1 }]);
      for (let i = 1; i <= 5; i++) {
        await event('touchMove', [{ x: x + dx * i / 5, y: y + dy * i / 5, id: 1 }]);
        await page.waitForTimeout(20);
      }
      if (hold) await hold();
      await event('touchEnd', []);
    };
    const rect = await canvas.boundingBox();
    const x = rect.x + rect.width * .3;
    const y = Math.min(rect.y + rect.height * .55, 690);
    const scrollBefore = await page.evaluate(() => scrollY);
    await drag(x, y, rect.width * .35, 0, async () => {
      await expect.poll(() => page.evaluate(() => Math.abs(window.__sceneTilt[0]))).toBeGreaterThan(.05);
    });
    expect(Math.abs(await page.evaluate(() => scrollY) - scrollBefore)).toBeLessThan(5);
    await expect.poll(() => page.evaluate(() => Math.abs(window.__sceneTilt[0]))).toBeLessThan(.05);
    await drag(x, y, 0, -130);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollBefore + 30);
    await cdp.detach();
  });
});
