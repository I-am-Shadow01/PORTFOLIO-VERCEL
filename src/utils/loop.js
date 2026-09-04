/**
 * src/utils/loop.js — one frame loop + one set of input listeners for the whole site
 *
 * ทำไมต้องมีไฟล์นี้:
 *   เดิมทุก effect สร้าง requestAnimationFrame loop ของตัวเอง (background, cursor ring,
 *   sparkle trail, FPS overlay, hero typing) และทุกตัวผูก mousemove/scroll listener แยกกัน
 *   → มี rAF loop วิ่งพร้อมกัน 5+ ตัว และ mousemove listener 6+ ตัวต่อ 1 เฟรม
 *   ตอนนี้เหลือ rAF loop เดียว + pointer listener เดียว + scroll listener เดียว
 *   แล้วให้ทุก effect สมัครสมาชิก (subscribe) แทน
 *
 * สิ่งที่ loop จัดการให้:
 *   • หยุดทั้งระบบตอนแท็บถูกซ่อน (document.hidden) — ไม่เผา CPU/Battery ทิ้ง
 *   • dt ถูก clamp ไม่ให้กระโดดหลังกลับเข้าแท็บ (กัน animation "วาร์ป")
 *   • pointer state (ตำแหน่ง/ความเร็ว/เวลาที่หยุดนิ่ง) คำนวณครั้งเดียว ใช้ได้ทุกที่
 *   • scroll state (ตำแหน่ง/ความเร็ว/progress) + ตรวจให้เองว่าใครคือ scroller ตัวจริง
 *   • energy 0..1 = ระดับ "ความเคลื่อนไหว" ของผู้ใช้ ใช้ขับความ dynamic ของ background
 *   • prefers-reduced-motion — แจ้ง subscribers ให้ลด/หยุดการเคลื่อนไหว
 *
 * เทสต์ได้โดยไม่ต้องมี browser: Loop.__tick(now) ขับเฟรมเองได้ตรงๆ
 */

const subs = new Set();
const resizeSubs = new Set();

let running = false;
let rafId = 0;
let last = 0;
let clock = 0;        // accumulated animation time (ms), respects `motion`
let frameNo = 0;

// ── FPS sampling (ใช้ทั้งใน FPS overlay และ adaptive quality) ──
let fpsFrames = 0;
let fpsWindowStart = 0;
let fps = 60;

// ── Shared state ──────────────────────────────────────────────
export const pointer = {
  x: -9999, y: -9999,      // ตำแหน่งล่าสุด (px, viewport space) — -9999 = อยู่นอกจอ
  px: -9999, py: -9999,    // ตำแหน่งเฟรมก่อน (สำหรับหาความเร็ว)
  nx: 0, ny: 0,            // normalized -1..1
  vx: 0, vy: 0,            // px/s
  speed: 0,                // px/s (smoothed)
  inside: false,
  down: false,
  idle: 0,                 // ms นับตั้งแต่มีการขยับครั้งล่าสุด
};

export const scrollState = {
  y: 0, dy: 0, vel: 0, progress: 0, max: 1, changed: false,
};

export const viewport = {
  w: 1, h: 1, dpr: 1, small: false, touch: false,
};

export const loopInfo = {
  t: 0, dt: 16.7, frame: 0, fps: 60, energy: 0,
  reducedMotion: false, hidden: false, motion: 1,
};

let energy = 0;
let motionScale = 1;

// ── Environment probes ────────────────────────────────────────
function refreshViewport() {
  viewport.w = window.innerWidth || 1;
  viewport.h = window.innerHeight || 1;
  viewport.dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewport.small = viewport.w < 720;
  viewport.touch = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
}

/**
 * หา "ตัวที่ scroll จริง" — เดิมโค้ดฟัง scroll บน #__root__ เสมอ ทั้งที่ #__root__
 * ไม่ได้เป็น scroll container (ไม่มี overflow) → event ไม่เคยยิง ทำให้ scroll progress,
 * nav.scrolled และ parallax ตายเงียบๆ ทั้งระบบ ตอนนี้เช็คจริงๆ ว่าใคร scroll ได้
 */
let scroller = null;
function getScroller() {
  const root = document.getElementById('__root__');
  if (root) {
    const ov = window.getComputedStyle?.(root)?.overflowY;
    const scrollable = (ov === 'auto' || ov === 'scroll') && root.scrollHeight > root.clientHeight + 1;
    if (scrollable) return root;
  }
  return window;
}
function scrollTop() {
  if (scroller && scroller !== window) return scroller.scrollTop || 0;
  return window.scrollY || document.documentElement?.scrollTop || 0;
}
function scrollMax() {
  if (scroller && scroller !== window) {
    return Math.max(1, scroller.scrollHeight - scroller.clientHeight);
  }
  const doc = document.documentElement;
  return Math.max(1, (doc?.scrollHeight || 0) - viewport.h);
}

const reduceMQ = () => window.matchMedia?.('(prefers-reduced-motion: reduce)');

// ── Input listeners (ผูกครั้งเดียวตลอดอายุหน้า) ──────────────
let bound = false;

function onPointerMove(e) {
  const x = e.clientX, y = e.clientY;
  if (!pointer.inside) { pointer.px = x; pointer.py = y; }
  pointer.x = x; pointer.y = y;
  pointer.inside = true;
  pointer.idle = 0;
}
function onPointerDown() { pointer.down = true; }
function onPointerUp() { pointer.down = false; }
function onPointerLeave() {
  pointer.inside = false;
  pointer.x = pointer.y = -9999;
  pointer.speed = 0;
}
function onTouchMove(e) {
  const t0 = e.touches && e.touches[0];
  if (t0) onPointerMove(t0);
}
function onScroll() { scrollState.changed = true; }

function onResizeNow() {
  const prevW = viewport.w, prevH = viewport.h;
  refreshViewport();
  if (prevW === viewport.w && prevH === viewport.h) return;
  for (const cb of resizeSubs) {
    try { cb(viewport); } catch (err) { console.error('[loop] resize handler', err); }
  }
}

function bind() {
  if (bound) return;
  bound = true;
  refreshViewport();
  scroller = getScroller();

  const opt = { passive: true };
  window.addEventListener('pointermove', onPointerMove, opt);
  window.addEventListener('touchmove', onTouchMove, opt);
  window.addEventListener('pointerdown', onPointerDown, opt);
  window.addEventListener('pointerup', onPointerUp, opt);
  window.addEventListener('pointerleave', onPointerLeave, opt);
  window.addEventListener('blur', onPointerUp, opt);
  window.addEventListener('resize', onResizeNow, opt);
  window.addEventListener('orientationchange', onResizeNow, opt);
  window.addEventListener('scroll', onScroll, opt);
  if (scroller !== window) scroller.addEventListener('scroll', onScroll, opt);
  document.addEventListener('visibilitychange', onVisibility, opt);

  const mq = reduceMQ();
  mq?.addEventListener?.('change', onReduceChange);
  onReduceChange();

  scrollState.y = scrollTop();
  scrollState.max = scrollMax();
  scrollState.progress = Math.min(1, scrollState.y / scrollState.max);
}

function onVisibility() {
  loopInfo.hidden = document.hidden;
  if (document.hidden) stop();
  else start();
}
function onReduceChange() {
  loopInfo.reducedMotion = reduceMQ()?.matches ?? false;
}

// ── The loop ──────────────────────────────────────────────────
function tick(now) {
  rafId = requestAnimationFrame(tick);

  let dt = last ? now - last : 16.7;
  last = now;
  // clamp: หลังสลับแท็บกลับมา dt อาจเป็นวินาที — ปล่อยไปจะทำให้ physics ระเบิด
  if (dt > 100) dt = 16.7;
  if (dt <= 0) dt = 16.7;

  clock += dt * motionScale;
  frameNo++;

  // ── pointer derived state ──
  if (pointer.inside && pointer.x > -1000) {
    const dx = pointer.x - pointer.px, dy = pointer.y - pointer.py;
    const inst = Math.hypot(dx, dy) * (1000 / dt);
    pointer.vx = dx * (1000 / dt);
    pointer.vy = dy * (1000 / dt);
    pointer.speed += (inst - pointer.speed) * 0.25;
    pointer.nx = (pointer.x / viewport.w) * 2 - 1;
    pointer.ny = (pointer.y / viewport.h) * 2 - 1;
  } else {
    pointer.speed *= 0.9;
  }
  pointer.px = pointer.x;
  pointer.py = pointer.y;
  pointer.idle += dt;

  // ── scroll derived state ──
  const y = scrollTop();
  scrollState.dy = y - scrollState.y;
  scrollState.y = y;
  const instVel = Math.abs(scrollState.dy) * (1000 / dt);
  scrollState.vel += (instVel - scrollState.vel) * 0.2;
  if (scrollState.vel < 1) scrollState.vel = 0;
  scrollState.max = scrollMax();
  scrollState.progress = Math.min(1, Math.max(0, y / scrollState.max));
  if (scrollState.changed) { scrollState.changed = false; }

  // ── energy: เมาส์ไว / scroll ไว = พลังงานสูง (คลายตัวช้าๆ) ──
  const target = Math.min(1, pointer.speed / 2600 + scrollState.vel / 5000 + (pointer.down ? 0.25 : 0));
  energy += (target - energy) * (target > energy ? 0.12 : 0.035);
  if (energy < 0.001) energy = 0;

  // ── fps sampling ──
  fpsFrames++;
  if (!fpsWindowStart) fpsWindowStart = now;
  const elapsed = now - fpsWindowStart;
  if (elapsed >= 500) {
    fps = Math.round((fpsFrames * 1000) / elapsed);
    fpsFrames = 0;
    fpsWindowStart = now;
    loopInfo.fps = fps;
  }

  // ── frame context ──
  loopInfo.t = clock;
  loopInfo.dt = dt;
  loopInfo.frame = frameNo;
  loopInfo.energy = energy;
  loopInfo.motion = motionScale;

  for (const cb of subs) {
    try { cb(loopInfo); } catch (err) { console.error('[loop] frame handler', err); }
  }

}

export function start() {
  bind();
  if (running || document.hidden) return;
  running = true;
  last = 0;
  rafId = requestAnimationFrame(tick);
}

export function stop() {
  if (!running) return;
  running = false;
  cancelAnimationFrame(rafId);
}

export function isRunning() { return running; }

/** สมัครรับเฟรม — คืนฟังก์ชันยกเลิก (ต้องเรียกตอน cleanup เพื่อไม่ให้ handler ค้าง) */
export function onFrame(cb) {
  subs.add(cb);
  start();
  return () => subs.delete(cb);
}

export function onResize(cb) {
  resizeSubs.add(cb);
  bind();
  cb(viewport); // เรียกทันทีหนึ่งครั้งเพื่อให้ subscriber ตั้งขนาดเริ่มต้นได้
  return () => resizeSubs.delete(cb);
}

/** ตั้งตัวคูณความเร็ว animation ทั้งเว็บ (settings → Motion) */
export function setMotionScale(v) {
  motionScale = Math.max(0, Math.min(2, Number(v) || 0));
}

/** scroll ไปยังพิกัด y ของ scroller ตัวจริง (window หรือ #__root__ ถ้ามัน scroll ได้จริง) */
export function scrollToTop(top, smooth = true) {
  bind();
  if (scroller && scroller !== window) {
    scroller.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  } else {
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  }
}

export function getScrollerEl() { bind(); return scroller; }

export function getFps() { return fps; }
export function getEnergy() { return energy; }
export function getPointer() { return pointer; }
export function getScrollState() { return scrollState; }
export function getViewport() { return viewport; }
export function getLoopInfo() { return loopInfo; }

/** สำหรับเทสต์: ขับเฟรมเองโดยไม่พึ่ง rAF */
export function __tick(now) {
  const id = rafId;
  rafId = 0;
  tick(now);
  cancelAnimationFrame(rafId);
  rafId = id;
}
