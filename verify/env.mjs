/**
 * env.mjs — minimal browser environment (jsdom DOM + @napi-rs/canvas rasterizer)
 * so the real site modules can be executed headlessly and measured.
 */
import { JSDOM } from 'jsdom';
import { createCanvas } from '@napi-rs/canvas';

export function createEnv({ width = 1280, height = 720, dpr = 1, theme = 'dark' } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html data-theme="${theme}"><head></head><body>
       <div id="__root__"></div>
     </body></html>`,
    { url: 'http://localhost/', pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;

  // ── viewport ────────────────────────────────────────────────
  Object.defineProperty(window, 'innerWidth',  { value: width,  writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
  Object.defineProperty(window, 'devicePixelRatio', { value: dpr, writable: true });
  window.matchMedia = () => ({
    matches: false, media: '', addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, onchange: null,
  });

  // ── deterministic rAF queue ─────────────────────────────────
  const rafQueue = new Map();
  let rafId = 1;
  window.requestAnimationFrame = (cb) => { const id = rafId++; rafQueue.set(id, cb); return id; };
  window.cancelAnimationFrame = (id) => { rafQueue.delete(id); };

  // ── canvas: real rasterizer behind a jsdom element ──────────
  const stats = { methodCalls: Object.create(null), propSets: 0, pixelWrites: 0 };
  const COUNTED = ['beginPath','stroke','fill','fillRect','clearRect','arc','moveTo','lineTo',
                   'drawImage','putImageData','createLinearGradient','createRadialGradient',
                   'save','restore','setTransform','rect','closePath','fillText','clip','translate'];

  function wrapCtx(nctx, el) {
    const target = {};
    return new Proxy(target, {
      get(_t, prop) {
        if (prop === '__napi') return nctx;
        if (prop === '__el') return el;
        const v = nctx[prop];
        if (typeof v === 'function') {
          return (...args) => {
            if (typeof prop === 'string') stats.methodCalls[prop] = (stats.methodCalls[prop] || 0) + 1;
            if (prop === 'putImageData') stats.pixelWrites += args[0]?.data?.length / 4 || 0;
            const a = args.map(x => (x && x.__napi) ? x.__napi : x);
            return v.apply(nctx, a);
          };
        }
        return v;
      },
      set(_t, prop, value) {
        stats.propSets++;
        nctx[prop] = (value && value.__napi) ? value.__napi : value;
        return true;
      },
    });
  }

  const canvases = [];
  window.HTMLCanvasElement.prototype.getContext = function (type) {
    if (this.__ctx) return this.__ctx;
    const w = this.width || 300, h = this.height || 150;
    const nc = createCanvas(Math.max(1, w), Math.max(1, h));
    this.__napi = nc;
    this.__ctx = wrapCtx(nc.getContext('2d'), this);
    canvases.push(this);
    return this.__ctx;
  };
  const proto = window.HTMLCanvasElement.prototype;
  for (const dim of ['width', 'height']) {
    const d = Object.getOwnPropertyDescriptor(proto, dim) || {};
    Object.defineProperty(proto, dim, {
      get() { return d.get ? d.get.call(this) : this['__' + dim] || 0; },
      set(v) {
        if (d.set) d.set.call(this, v);
        this['__' + dim] = v;
        if (this.__napi) this.__napi[dim] = Math.max(1, v);
      },
      configurable: true,
    });
  }
  proto.__toPNG = function () { return this.__napi ? this.__napi.toBuffer('image/png') : null; };

  // ── globals for module scope ────────────────────────────────
  globalThis.window = window;
  globalThis.document = document;
  Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
  globalThis.localStorage = window.localStorage;
  globalThis.matchMedia = window.matchMedia;
  globalThis.getComputedStyle = window.getComputedStyle.bind(window);
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
  globalThis.HTMLElement = window.HTMLElement;
  Object.defineProperty(globalThis, 'location', { value: window.location, configurable: true });
  globalThis.history = window.history;
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.MouseEvent = window.MouseEvent;
  globalThis.Event = window.Event;
  // ── minimal Web Animations API polyfill (jsdom ไม่มี) ────────
  window.Element.prototype.animate = window.Element.prototype.animate || function (frames, opts) {
    const anim = { finished: Promise.resolve(), cancel() {}, pause() {}, play() {} };
    setTimeout(() => anim.onfinish && anim.onfinish(), Math.min(opts?.duration || 0, 32));
    return anim;
  };

  globalThis.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; this.targets = []; }
    observe(el) { this.targets.push(el); }
    unobserve() {}
    disconnect() { this.targets = []; }
    takeRecords() { return []; }
  };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.IntersectionObserver = globalThis.IntersectionObserver;
  window.ResizeObserver = globalThis.ResizeObserver;
  Object.defineProperty(window, 'performance', { value: globalThis.performance, configurable: true });

  /** Advance N frames at `step` ms of fake clock time. */
  function runFrames(n, step = 16.7) {
    const times = [];
    for (let i = 0; i < n; i++) {
      clock += step;
      const cbs = [...rafQueue.entries()];
      rafQueue.clear();
      const t0 = process.hrtime.bigint();
      for (const [, cb] of cbs) cb(clock);
      times.push(Number(process.hrtime.bigint() - t0) / 1e6);
    }
    return times;
  }
  let clock = 0;

  function mouse(x, y) {
    for (const type of ['pointermove', 'mousemove']) {
      window.dispatchEvent(new window.MouseEvent(type, { clientX: x, clientY: y }));
      document.dispatchEvent(new window.MouseEvent(type, { clientX: x, clientY: y }));
    }
  }
  function scroll(y) {
    const root = document.getElementById('__root__');
    if (root) {
      root.scrollTop = y;
      root.dispatchEvent(new window.Event('scroll'));
    }
    window.scrollY = y;
    window.dispatchEvent(new window.Event('scroll'));
  }
  function click(x, y) {
    window.dispatchEvent(new window.MouseEvent('pointerdown', { clientX: x, clientY: y }));
    window.dispatchEvent(new window.MouseEvent('click', { clientX: x, clientY: y }));
    window.dispatchEvent(new window.MouseEvent('pointerup', { clientX: x, clientY: y }));
  }
  function snapshotCanvas() {
    const c = document.getElementById('bg-canvas');
    return c && c.__toPNG ? c.__toPNG() : null;
  }

  return {
    window, document, stats, canvases,
    runFrames, mouse, scroll, click, snapshotCanvas,
    resetStats() { stats.methodCalls = Object.create(null); stats.propSets = 0; stats.pixelWrites = 0; },
    get rafPending() { return rafQueue.size; },
  };
}
