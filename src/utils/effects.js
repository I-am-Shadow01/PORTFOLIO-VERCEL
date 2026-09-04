/**
 * effects.js — Extra visual flair (v2: one shared frame loop, pooled nodes)
 *
 * Magnetic buttons · 3D tilt · Text scramble · Counter · Ripple · Particle trail · Parallax
 *
 * สิ่งที่เปลี่ยนจากเวอร์ชันเดิม (resource management):
 *   • เดิมแต่ละ effect ผูก listener + rAF ของตัวเอง → ตอนนี้ใช้ loop กลางจาก loop.js
 *     ทั้ง magnetic/tilt/parallax/sparkle วิ่งในเฟรมเดียวกันกับ background
 *   • magnetic/tilt ใช้ delegated listener เดียว (pointerover/out บน document)
 *     แทนการผูก mousemove แยกทุกปุ่ม/การ์ด (เดิม ~30 listener)
 *   • particle burst ใช้ pooled span + Web Animations API (ไม่สร้าง/ทิ้ง DOM ทุกคลิก
 *     และให้ compositor จัดการ transition แทน main thread)
 *   • ripple ไม่ยัด inline style overflow:hidden อีกต่อไป — ใช้ CSS class .ripple-host
 *   • skill glow เดิมตั้ง --glow ที่ไม่มี CSS ตัวไหนใช้เลย → ลบ (CSS :hover ทำอยู่แล้ว)
 *   • ทุกอย่างเคารพ prefers-reduced-motion และหยุดตอน pointer หยุดนิ่ง (sparkle)
 */

import { onFrame, onResize, getPointer, getScrollState, getLoopInfo } from './loop.js';
import { onSettingsChange, getSettings } from './settings.js';

let bound = false;
let animOn = true;

// ── shared hover registry (delegated) ────────────────────────
const MAGNET_SEL = '.btn, .footer-top, .nav-logo';
const TILT_SEL = '.project-card, .skill-cat, .stat-card, .terminal-card, .contact-item';
const TILT = 14;

const hover = { magnet: null, tilt: null, magnetRect: null, tiltRect: null };

function onOver(e) {
  const m = e.target.closest?.(MAGNET_SEL);
  if (m && m !== hover.magnet) {
    hover.magnet = m;
    hover.magnetRect = m.getBoundingClientRect();
  }
  const t = e.target.closest?.(TILT_SEL);
  if (t && t !== hover.tilt) {
    hover.tilt = t;
    hover.tiltRect = t.getBoundingClientRect();
  }
}
function onOut(e) {
  if (hover.magnet && !hover.magnet.contains(e.relatedTarget)) {
    hover.magnet.style.transform = '';
    hover.magnet = null; hover.magnetRect = null;
  }
  if (hover.tilt && !hover.tilt.contains(e.relatedTarget)) {
    const el = hover.tilt;
    el.style.transition = 'transform 0.5s cubic-bezier(.23,1,.32,1)';
    el.style.transform = '';
    hover.tilt = null; hover.tiltRect = null;
  }
}

// ── 1+2. Magnetic + Tilt (ขับเคลื่อนจาก loop กลาง) ─────────────
function tickHover(pointer) {
  if (hover.magnet) {
    const r = hover.magnetRect;
    if (r) {
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = (pointer.x - cx) * 0.28, dy = (pointer.y - cy) * 0.28;
      hover.magnet.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`;
    }
  }
  if (hover.tilt) {
    const r = hover.tiltRect;
    if (r && r.width > 0) {
      const x = (pointer.x - r.left) / r.width - 0.5;
      const y = (pointer.y - r.top) / r.height - 0.5;
      hover.tilt.style.transition = 'transform 0.08s ease';
      hover.tilt.style.transform =
        `perspective(700px) rotateX(${(-y * TILT).toFixed(2)}deg) rotateY(${(x * TILT).toFixed(2)}deg) translateZ(8px)`;
    }
  }
}

// ── 3. Text Scramble ─────────────────────────────────────────
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01';
let scrambleObs = null;
const scrambleTasks = new Set();

function scrambleReveal(el) {
  const original = el.textContent;
  const len = original.length;
  const totalFrames = Math.min(90, len * 3.5);
  let frame = 0;
  const task = () => {
    let out = '';
    const reveal = frame / totalFrames;
    for (let i = 0; i < len; i++) {
      const ch = original[i];
      if (ch === ' ') { out += ' '; continue; }
      out += (i / len) < reveal ? ch
           : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
    }
    el.textContent = out;
    frame++;
    if (frame > totalFrames + 4) { el.textContent = original; scrambleTasks.delete(task); }
  };
  scrambleTasks.add(task);
}

export function initTextScramble() {
  scrambleObs?.disconnect();
  scrambleObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (!getLoopInfo().reducedMotion && getSettings().anim !== false) scrambleReveal(e.target);
        scrambleObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.section-title').forEach(el => scrambleObs.observe(el));
}

// ── 4. Counter Animations ────────────────────────────────────
let counterObs = null;
const counterTasks = new Set();

function animateCount(el) {
  const raw = el.textContent.trim();
  const match = raw.match(/^([\d.]+)(.*)$/);
  if (!match) return;
  const target = parseFloat(match[1]);
  const suffix = match[2] || '';
  const isFloat = raw.includes('.');
  const start = performance.now();
  const duration = 1400;
  const task = () => {
    const t = Math.min((performance.now() - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = target * ease;
    el.textContent = (isFloat ? val.toFixed(1) : Math.round(val)) + suffix;
    if (t >= 1) { el.textContent = raw; counterTasks.delete(task); }
  };
  counterTasks.add(task);
}

export function initCounters() {
  counterObs?.disconnect();
  counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (!getLoopInfo().reducedMotion && getSettings().anim !== false) animateCount(e.target);
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.8 });
  document.querySelectorAll('.stat-num, .hstat-n').forEach(el => counterObs.observe(el));
}

// ── 5. Ripple on Click (CSS class host, pooled span) ─────────
const RIPPLE_SEL = '.btn, .nav-link, .mob-item, .contact-item, .project-link-btn';
let ripplePool = [];

function onRippleClick(e) {
  const el = e.target.closest?.(RIPPLE_SEL);
  if (!el || getLoopInfo().reducedMotion) return;
  if (!el.classList.contains('ripple-host')) el.classList.add('ripple-host');
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2;
  const dot = ripplePool.pop() || document.createElement('span');
  dot.className = 'ripple-ink';
  Object.assign(dot.style, {
    width: size + 'px', height: size + 'px',
    left: (e.clientX - r.left - size / 2) + 'px',
    top:  (e.clientY - r.top  - size / 2) + 'px',
  });
  el.appendChild(dot);
  const anim = dot.animate(
    [{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }],
    { duration: 550, easing: 'ease-out' }
  );
  anim.onfinish = () => { dot.remove(); ripplePool.length < 12 && ripplePool.push(dot); };
}
export function initRipple() {
  document.addEventListener('click', onRippleClick, { passive: true });
}

// ── 6. Particle Burst on CTA buttons (pool + WAAPI) ──────────
const BURST_SEL = '.btn-primary, .footer-top';
const BURST_COUNT = 16;
const burstPool = [];
let accentCache = '#c6f135';

function onBurst(e) {
  const el = e.target.closest?.(BURST_SEL);
  if (!el || getLoopInfo().reducedMotion) return;
  const x = e.clientX, y = e.clientY;
  const white = '#ffffff';
  for (let i = 0; i < BURST_COUNT; i++) {
    const p = burstPool.pop() || document.createElement('span');
    p.className = 'burst-dot';
    const angle = (i / BURST_COUNT) * Math.PI * 2;
    const dist = 40 + Math.random() * 55;
    const size = 3 + Math.random() * 4;
    Object.assign(p.style, {
      width: size + 'px', height: size + 'px',
      background: Math.random() < 0.66 ? accentCache : white,
      left: x + 'px', top: y + 'px',
    });
    document.body.appendChild(p);
    const anim = p.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0)`, opacity: 0 },
    ], { duration: 600, easing: 'ease-out' });
    anim.onfinish = () => { p.remove(); burstPool.length < 48 && burstPool.push(p); };
  }
}
export function initParticleBurst() {
  document.addEventListener('click', onBurst, { passive: true });
}

// ── 7. Parallax on hero deco lines (loop + cache, refresh ตอน rebuild) ──
let decos = [], heroSide = null;
function refreshParallaxTargets() {
  decos = [...document.querySelectorAll('.deco-line')];
  heroSide = document.querySelector('.hero-side');
}

function tickParallax() {
  if (!decos.length) return;
  const scroll = getScrollState();
  const ratio = scroll.y / (window.innerHeight || 800);
  for (let i = 0; i < decos.length; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const speed = 0.18 + i * 0.06;
    decos[i].style.transform = `translateY(${(dir * ratio * speed * 80).toFixed(1)}px)`;
  }
  if (heroSide) heroSide.style.transform = `translateY(${(ratio * 0.12 * 80).toFixed(1)}px)`;
}

// ── 8. Cursor Sparkle Trail (pool + loop + หยุดตอนนิ่ง) ───────
const TRAIL_MAX = 18;
let trailEnabled = true;
let trailDots = null;
let trailAcc = 0;

function ensureTrail() {
  if (trailDots) return;
  trailDots = Array.from({ length: TRAIL_MAX }, () => {
    const el = document.createElement('div');
    el.className = 'spark-dot';
    document.body.appendChild(el);
    return { el, life: 0 };
  });
}
function destroyTrail() {
  if (!trailDots) return;
  trailDots.forEach(d => d.el.remove());
  trailDots = null;
}

let trailIdx = 0;
function tickTrail(info) {
  const pointer = getPointer();
  if (!trailEnabled) { destroyTrail(); return; }
  const moving = pointer.inside && pointer.idle < 120;
  if (!trailDots) {
    if (!moving) return;        // ยังไม่เคยวาดและเมาส์นิ่ง → ไม่ต้องสร้าง DOM
    ensureTrail();
  }
  if (moving) {
    trailAcc += info.dt;
    while (trailAcc >= 16) {
      trailAcc -= 16;
      const dot = trailDots[trailIdx % TRAIL_MAX];
      trailIdx++;
      dot.life = 1;
      const age = (trailIdx % TRAIL_MAX) / TRAIL_MAX;
      const size = 2 + age * 4;
      dot.el.style.transform =
        `translate3d(${pointer.x}px,${pointer.y}px,0) translate(-50%,-50%)`;
      dot.el.style.width = size + 'px';
      dot.el.style.height = size + 'px';
    }
  }
  // จางจุดที่ยังมีชีวิต — พอจางหมดและเมาส์นิ่งแล้ว ค่อยเก็บ DOM ทั้งชุด
  let alive = false;
  for (let i = 0; i < TRAIL_MAX; i++) {
    const d = trailDots[i];
    if (d.life > 0) {
      d.life -= 0.045;
      d.el.style.opacity = Math.max(0, d.life * 0.7).toFixed(2);
      if (d.life > 0) alive = true;
    }
  }
  if (!alive && !moving) destroyTrail();
}

// ── single frame subscription ────────────────────────────────
function tick(info) {
  const pointer = getPointer();
  if (!info.reducedMotion && animOn) {
    tickHover(pointer);
    tickTrail(info);
  }
  tickParallax();   // ผูกกับ scroll — ยังทำงานเพราะไม่ใช่ "animation" แบบวน
  for (const t of scrambleTasks) t();
  for (const t of counterTasks) t();
}

export function initEffects() {
  if (bound) return refreshAfterRebuild();
  bound = true;

  document.addEventListener('pointerover', onOver, { passive: true });
  document.addEventListener('pointerout', onOut, { passive: true });
  initRipple();
  initParticleBurst();

  onSettingsChange(s => {
    accentCache = s.accent || '#c6f135';
    animOn = s.anim !== false;
    trailEnabled = s.trail !== false && animOn;
    if (!trailEnabled) destroyTrail();
  });
  animOn = getSettings().anim !== false;
  trailEnabled = getSettings().trail !== false && animOn;
  accentCache = (() => {
    try {
      return getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#c6f135';
    } catch { return '#c6f135'; }
  })();

  onResize(() => { hover.magnetRect = null; hover.tiltRect = null; refreshParallaxTargets(); });
  window.addEventListener('pf:content-rebuilt', refreshAfterRebuild);
  onFrame(tick);
  refreshAfterRebuild();
}

function refreshAfterRebuild() {
  refreshParallaxTargets();
  initTextScramble();
  initCounters();
}


