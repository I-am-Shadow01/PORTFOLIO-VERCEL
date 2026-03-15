/**
 * src/utils/background.js
 *
 * Layers (bottom → top):
 *   0. Static noise texture  (CSS, always on)
 *   1. Fluid noise / organic wash  (canvas, new)
 *   2. Aurora blobs          (canvas, slow drift + scroll reactive)
 *   3. Cursor magnetic orb   (canvas, smooth follow)
 *   4. Shooting stars        (canvas, occasional streaks)
 *   5. Particle constellation (canvas, mouse-interactive + flow field)
 *   6. Subtle scrolling grid (canvas)
 *   7. Mouse ripples         (canvas)
 *
 * Performance modes:
 *   'dynamic' (default) – full 60 fps, all layers
 *   'eco'               – ~14 fps cap, simplified layers, fewer particles
 */

import { getSettings } from './settings.js';

export function initBackground() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0',
    width: '100%', height: '100%',
    zIndex: '0', pointerEvents: 'none',
  });
  document.getElementById('__root__').prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  let active = true;
  let mouse   = { x: -9999, y: -9999, px: -9999, py: -9999 };
  let scrollY = 0;

  // ── Helpers ─────────────────────────────────────────────────
  function isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  /** Read accent from --ac (what settings.js actually sets) */
  function getAccent() {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue('--ac').trim() || '#C6F135'
    );
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3
      ? h.split('').map(c => c + c).join('')
      : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  function relativeLuminance({ r, g, b }) {
    const lin = c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  /** Returns alpha multiplier so low-contrast accents stay visible */
  function getAlphaMultiplier(accentRgb) {
    const lum    = relativeLuminance(accentRgb);
    const bgLum  = isDark() ? 0.03 : 0.93;
    const contrast = Math.abs(lum - bgLum);
    if (contrast < 0.12) return 4.0;
    if (contrast < 0.25) return 2.2;
    return 1.0;
  }

  // ── Performance mode ────────────────────────────────────────
  function getPerfMode() {
    return getSettings().perfMode || 'dynamic';
  }
  let lastFrameTime = 0;
  const ECO_FPS_MS = 1000 / 14;

  // ── Resize ──────────────────────────────────────────────────
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
    initFluidNodes();
  }
  window.addEventListener('resize', resize, { passive: true });

  // ── Scroll ──────────────────────────────────────────────────
  const root = document.getElementById('__root__');
  (root || window).addEventListener('scroll', () => {
    scrollY = root ? root.scrollTop : window.scrollY;
  }, { passive: true });

  // ══════════════════════════════════════════════════════════════
  // LAYER 1 — Fluid noise (organic animated wash)
  // ══════════════════════════════════════════════════════════════
  let fluidNodes = [];
  function initFluidNodes() {
    fluidNodes = Array.from({ length: 7 }, (_, i) => ({
      ox:    Math.random(),
      oy:    Math.random(),
      r:     0.32 + Math.random() * 0.24,
      spdX:  (0.00005 + Math.random() * 0.00009) * (Math.random() < 0.5 ? 1 : -1),
      spdY:  (0.00004 + Math.random() * 0.00008) * (Math.random() < 0.5 ? 1 : -1),
      phase: (i / 7) * Math.PI * 2,
      amp:   0.07 + Math.random() * 0.07,
    }));
  }

  function drawFluid(t, rgb, mult) {
    const { r, g, b } = rgb;
    const dark = isDark();
    const base = dark ? 0.030 * mult : 0.048 * mult;
    const scrollShift = (scrollY / Math.max(H, 1)) * 0.05;

    fluidNodes.forEach((n, i) => {
      const nx = n.ox + Math.sin(t * n.spdX * 60000 + n.phase) * n.amp;
      const ny = n.oy + Math.cos(t * n.spdY * 60000 + n.phase * 1.3) * n.amp
               + scrollShift * (i % 2 === 0 ? 1 : -0.7);
      const cx = nx * W;
      const cy = ny * H;
      const radius = n.r * Math.max(W, H);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0,    `rgba(${r},${g},${b},${base * 0.9})`);
      grad.addColorStop(0.35, `rgba(${r},${g},${b},${base * 0.45})`);
      grad.addColorStop(0.7,  `rgba(${r},${g},${b},${base * 0.12})`);
      grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // LAYER 2 — Aurora blobs
  // ══════════════════════════════════════════════════════════════
  class AuroraBlob {
    constructor(ox, oy, r, speed, phase) {
      this.ox = ox; this.oy = oy; this.r = r;
      this.speed = speed; this.phase = phase;
    }
    draw(t, rgb, alphaMult) {
      const { r, g, b } = rgb;
      const dark = isDark();
      const base = dark ? 0.050 * alphaMult : 0.092 * alphaMult;
      const scrollNudge = (scrollY / Math.max(H, 1)) * 0.06;
      const drift = Math.sin(t * this.speed + this.phase);
      const cx = (this.ox + drift * 0.12) * W;
      const cy = (this.oy + Math.cos(t * this.speed * 0.7 + this.phase) * 0.10 + scrollNudge) * H;
      const radius = this.r * Math.max(W, H);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0,    `rgba(${r},${g},${b},${base})`);
      grad.addColorStop(0.42, `rgba(${r},${g},${b},${base * 0.28})`);
      grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
  }

  const blobs = [
    new AuroraBlob(0.78, -0.1,  0.58, 0.00013, 0.0),
    new AuroraBlob(-0.1, 0.80,  0.42, 0.00010, 2.1),
    new AuroraBlob(0.45, 0.50,  0.32, 0.00017, 4.3),
    new AuroraBlob(0.20, 0.10,  0.25, 0.00008, 1.6),
  ];

  // ══════════════════════════════════════════════════════════════
  // LAYER 3 — Cursor magnetic orb
  // ══════════════════════════════════════════════════════════════
  const orb = { x: -9999, y: -9999, tx: -9999, ty: -9999, boost: 0 };

  function updateOrb() {
    orb.x += (orb.tx - orb.x) * 0.08;
    orb.y += (orb.ty - orb.y) * 0.08;
    orb.boost *= 0.92;
  }

  function drawOrb(rgb, mult) {
    if (orb.x < -500) return;
    const { r, g, b } = rgb;
    const dark = isDark();
    const alpha = (dark ? 0.095 : 0.12) * mult;
    const radius = 170 + orb.boost * 50;

    const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, radius);
    grad.addColorStop(0,    `rgba(${r},${g},${b},${alpha})`);
    grad.addColorStop(0.38, `rgba(${r},${g},${b},${alpha * 0.4})`);
    grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ══════════════════════════════════════════════════════════════
  // LAYER 4 — Shooting stars
  // ══════════════════════════════════════════════════════════════
  class ShootingStar {
    constructor() { this.reset(); }
    reset() {
      this.x       = Math.random() * W * 1.2 - W * 0.1;
      this.y       = Math.random() * H * 0.4;
      this.len     = Math.random() * 130 + 50;
      this.spd     = Math.random() * 7 + 5;
      this.ang     = (Math.PI / 180) * (Math.random() * 22 + 18);
      this.life    = 0;
      this.maxLife = Math.random() * 45 + 25;
      this.waiting = Math.random() * 500 + 180;
    }
    update() {
      if (this.waiting > 0) { this.waiting--; return; }
      this.x   += Math.cos(this.ang) * this.spd;
      this.y   += Math.sin(this.ang) * this.spd;
      this.life++;
      if (this.life >= this.maxLife) this.reset();
    }
    draw(rgb, alphaMult) {
      if (this.waiting > 0) return;
      const { r, g, b } = rgb;
      const progress = this.life / this.maxLife;
      const alpha = Math.sin(progress * Math.PI) * (isDark() ? 0.75 : 0.50) * alphaMult;
      if (alpha <= 0) return;

      const tailX = this.x - Math.cos(this.ang) * this.len;
      const tailY = this.y - Math.sin(this.ang) * this.len;

      const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
      grad.addColorStop(0,   `rgba(${r},${g},${b},0)`);
      grad.addColorStop(0.6, `rgba(${r},${g},${b},${alpha * 0.35})`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},${alpha})`);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
      ctx.restore();
    }
  }
  const stars = Array.from({ length: 5 }, () => new ShootingStar());

  // ══════════════════════════════════════════════════════════════
  // LAYER 5 — Particle constellation + flow field
  // ══════════════════════════════════════════════════════════════
  let particles = [];
  const CONNECT = 145;
  const REPEL   = 115;

  function flowAngle(x, y, t) {
    return (
      Math.sin(x * 0.004 + t * 0.00025) * Math.PI +
      Math.cos(y * 0.004 + t * 0.00018) * Math.PI * 0.6
    );
  }

  function initParticles() {
    const eco   = getPerfMode() === 'eco';
    const count = eco
      ? Math.min(Math.floor((W * H) / 28000), 28)
      : Math.min(Math.floor((W * H) / 9500),  128);

    particles = Array.from({ length: count }, () => {
      const vx = (Math.random() - 0.5) * 0.30;
      const vy = (Math.random() - 0.5) * 0.30;
      return { x: Math.random() * W, y: Math.random() * H, vx, vy, bvx: vx, bvy: vy, r: Math.random() * 1.5 + 0.6 };
    });
  }

  function drawParticles(t, rgb, alphaMult) {
    const { r, g, b } = rgb;
    const dark     = isDark();
    const dotBase  = (dark ? 0.55 : 0.50) * alphaMult;
    const lineBase = (dark ? 0.18 : 0.16) * alphaMult;

    particles.forEach(p => {
      const angle  = flowAngle(p.x, p.y, t);
      const dx   = p.x - mouse.x;
      const dy   = p.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < REPEL && dist > 0) {
        const f = (1 - dist / REPEL) * 0.65;
        p.vx += (dx / dist) * f;
        p.vy += (dy / dist) * f;
      }
      p.vx = p.vx * 0.97 + (p.bvx + Math.cos(angle) * 0.011) * 0.03;
      p.vy = p.vy * 0.97 + (p.bvy + Math.sin(angle) * 0.011) * 0.03;
      const spd = Math.hypot(p.vx, p.vy);
      if (spd > 4) { p.vx = (p.vx / spd) * 4; p.vy = (p.vy / spd) * 4; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
    });

    ctx.save();
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < CONNECT) {
          const a = (1 - dist / CONNECT) * lineBase;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    particles.forEach(p => {
      const dist  = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      const boost = dist < REPEL ? (1 - dist / REPEL) * 0.45 : 0;
      const alpha = Math.min(dotBase + boost, 1);
      if (dist < REPEL) {
        const gGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, REPEL * 0.28);
        gGrad.addColorStop(0, `rgba(${r},${g},${b},${0.07 * alphaMult})`);
        gGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, REPEL * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    });
  }

  // ══════════════════════════════════════════════════════════════
  // LAYER 6 — Scrolling grid
  // ══════════════════════════════════════════════════════════════
  function drawGrid(t) {
    const dark  = isDark();
    const alpha = dark ? 0.028 : 0.044;
    const COLS  = 26;
    const cellW = W / COLS;
    const offset = (t * 0.016 + scrollY * 0.12) % cellW;
    const ROWS  = Math.ceil(H / cellW);

    ctx.save();
    ctx.strokeStyle = dark ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 0.5;
    for (let x = -offset; x <= W + cellW; x += cellW) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let row = 0; row <= ROWS + 1; row++) {
      const y = row * cellW;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════
  // LAYER 7 — Ripples
  // ══════════════════════════════════════════════════════════════
  let ripples = [];

  function spawnRipple() {
    if (mouse.x < 0 || mouse.x > W) return;
    const dx = mouse.x - mouse.px;
    const dy = mouse.y - mouse.py;
    if (Math.hypot(dx, dy) > 8) {
      ripples.push({ x: mouse.x, y: mouse.y, r: 0, maxR: 65, life: 1 });
    }
    mouse.px = mouse.x; mouse.py = mouse.y;
  }

  function drawRipples(rgb, alphaMult) {
    const { r, g, b } = rgb;
    const dark = isDark();
    ripples = ripples.filter(rp => rp.life > 0);
    ripples.forEach(rp => {
      rp.r    += (rp.maxR - rp.r) * 0.075;
      rp.life -= 0.022;
      const a = rp.life * (dark ? 0.17 : 0.12) * alphaMult;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function onClickRipple(e) {
    for (let i = 0; i < 3; i++) {
      ripples.push({ x: e.clientX, y: e.clientY, r: 0, maxR: 80 + i * 30, life: 1 - i * 0.22 });
    }
    orb.boost = 1;
  }
  window.addEventListener('click', onClickRipple, { passive: true });

  // ── Main loop ────────────────────────────────────────────────
  function draw(t) {
    if (!active) return;
    requestAnimationFrame(draw);

    const eco = getPerfMode() === 'eco';
    if (eco && t - lastFrameTime < ECO_FPS_MS) return;
    lastFrameTime = t;

    ctx.clearRect(0, 0, W, H);

    const accentHex = getAccent();
    const accentRgb = hexToRgb(accentHex);
    const mult      = getAlphaMultiplier(accentRgb);

    if (eco) {
      blobs.forEach(b => b.draw(t, accentRgb, mult * 0.75));
      drawGrid(t);
    } else {
      drawFluid(t, accentRgb, mult);
      blobs.forEach(b => b.draw(t, accentRgb, mult));
      updateOrb();
      drawOrb(accentRgb, mult);
      stars.forEach(s => { s.update(); s.draw(accentRgb, mult); });
      spawnRipple();
      drawRipples(accentRgb, mult);
      drawGrid(t);
      drawParticles(t, accentRgb, mult);
    }
  }

  // ── Mouse ────────────────────────────────────────────────────
  const onMove = e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    orb.tx  = e.clientX; orb.ty  = e.clientY;
  };
  const onLeave = () => {
    mouse.x = -9999; mouse.y = -9999;
    orb.tx  = -9999; orb.ty  = -9999;
  };
  window.addEventListener('mousemove',  onMove,  { passive: true });
  window.addEventListener('mouseleave', onLeave, { passive: true });
  window.addEventListener('touchmove', e => {
    if (e.touches[0]) {
      mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
      orb.tx  = mouse.x; orb.ty = mouse.y;
    }
  }, { passive: true });

  resize();
  requestAnimationFrame(draw);

  return function cleanup() {
    active = false;
    window.removeEventListener('resize',     resize);
    window.removeEventListener('mousemove',  onMove);
    window.removeEventListener('mouseleave', onLeave);
    window.removeEventListener('click',      onClickRipple);
    canvas.remove();
  };
}
