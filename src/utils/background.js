/**
 * background.js — Multi-layer visual engine (Canvas2D, zero dependency)
 *
 * Modes: eco | medium | performance
 *
 * 3B1B-inspired layers (performance):
 *   A. Fourier Epicycles   — mouse warps rotation speed of closest system
 *   B. Lorenz Attractor    — mouse perturbs the attractor position
 *   C. Wave Interference   — mouse adds a 4th wave source at cursor
 *   D. Vector Flow Field   — mouse creates a local vortex in the field
 *   E. 4D Hypersphere      — mouse tilt controls XY rotation plane
 *   F. Times-Table Cardioid — mouse x-position steers the multiplier k
 *
 * ── ทำไมไม่ใช้ three.js ─────────────────────────────────────────
 * โปรเจกต์นี้เป็น static site แบบไม่มี build step และไม่มี dependency เลย
 * three.js = +~160KB gzip ที่ต้องโหลดก่อนเริ่มวาด + ต้องจ่ายค่า GPU context
 * ทั้งที่สิ่งที่เราวาดเป็น "เส้น/จุด" ล้วน ซึ่ง Canvas2D ทำได้ถูกกว่ามาก
 * ถ้าอยากได้ 3D จริงๆ ก็ยังได้: ทั้ง hypersphere/Lorenz ในไฟล์นี้คือคณิต 3D/4D
 * ที่ project ลงจอเองอยู่แล้ว — เราจึงเลือกรีด Canvas2D ให้สุดแทนการเพิ่ม dep
 *
 * ── สิ่งที่เวอร์ชันนี้ทำต่างจากเดิม (resource management) ──────
 *  1. ใช้ frame loop กลางจาก loop.js (เหลือ rAF loop เดียวทั้งเว็บ)
 *  2. Batch เส้นทั้งหมดเข้า path เดียวต่อ "ระดับความโปร่งใส"
 *     → stroke() ลดจากหลักพัน/เฟรม เหลือ ~9 ครั้ง/เลเยอร์
 *     → ไม่ต้องสร้าง string `rgba(...)` ใหม่ทุกเส้น (ใช้ตารางสีที่ cache ไว้)
 *  3. Spatial grid เป็น typed array (counting sort) แทน Map<string,[]>
 *     → ไม่มีการ allocate string/array ทุกเฟรม
 *  4. trail/lorenz เก็บใน Float32Array ring buffer แทน object {x,y} ต่อจุด
 *     → ไม่มี GC pressure (เดิมสร้าง object ~3,500 ตัว/เฟรม)
 *  5. Wave interference เขียนลง buffer เล็ก (~100x56 px) แล้วขยายตอน draw
 *     → pixel write ลดจาก 921,600 เหลือ ~5,500 ต่อเฟรม (~166 เท่า)
 *  6. Adaptive resolution: ถ้า fps ตก จะลด backing-store scale ก่อนทิ้งเลเยอร์
 *     (ภาพยังครบทุกเลเยอร์ แค่คม 덜ลง) — คมขึ้นเองอัตโนมัติเมื่อเครื่องว่าง
 *  7. หยุดสนิทตอนแท็บถูกซ่อน, เคารพ prefers-reduced-motion, และเบาลงตอนผู้ใช้หยุดนิ่ง
 *
 * ── ความ dynamic ที่เพิ่ม ──────────────────────────────────────
 *  • ทุกเลเยอร์มี "depth" ของตัวเอง → เลื่อนตาม scroll ไม่เท่ากัน (parallax จริง)
 *  • energy (ความเร็วเมาส์ + ความเร็ว scroll) ขับความเร็ว/ความสว่างของทั้งฉาก
 *  • คลิก = shockwave ผลักอนุภาคจริง + วงคลื่น + เส้นรัศมี
 */

import { getSettings, onSettingsChange } from './settings.js';
import { onFrame, onResize, getPointer, getScrollState, getViewport, getLoopInfo } from './loop.js';
import { STEP_MS, motionSteps, wrapPosition, pairImpulse, flowDirection } from './motion-physics.js';
import { elapsedMotionTime, advanceAngle, followTarget } from './orbit-motion.js';

export function initBackground() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    zIndex: '0', pointerEvents: 'none',
  });
  const ctx = canvas.getContext('2d', { alpha: true });
  document.body.insertBefore(canvas, document.body.firstChild);

  const mouse  = getPointer();
  const scroll = getScrollState();
  const vp     = getViewport();

  let W = 1, H = 1, dpr = 1, scale = 1;
  let sceneScrollY = 0, sceneScrollDy = 0;
  let alive = true;
  const sceneInitializations = { particles: 0, stars: 0, flow: 0, lorenz: 0 };

  // ── Helpers ─────────────────────────────────────────────────
  let dark = true;
  let themeReady = false;
  const isDark = () => dark;
  function refreshTheme() {
    const d = document.documentElement.getAttribute('data-theme') !== 'light';
    if (d !== dark || !themeReady) {
      dark = d;
      themeReady = true;
      cM = alphaMult({ r: cR, g: cG, b: cB });
      rebuildColors();
      staticDrawn = false;
    }
  }

  function hexToRgb(hex) {
    let h = (hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return Number.isFinite(n)
      ? { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
      : { r: 198, g: 241, b: 53 };
  }

  function lum({ r, g, b }) {
    const s = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * s(r) + 0.7152 * s(g) + 0.0722 * s(b);
  }
  function alphaMult(rgb) {
    const l = lum(rgb), bg = dark ? 0.03 : 0.93, c = Math.abs(l - bg);
    return c < 0.12 ? 4.5 : c < 0.25 ? 2.5 : 1.3;
  }

  // ════════════════════════════════════════════════════════════
  // ALPHA BUCKETS — หัวใจของการลด draw call
  // ทุกเลเยอร์ส่ง "ค่า alpha ที่อยากได้" มา เราปัดเข้า stop ที่ใกล้ที่สุด
  // แล้วรวมเส้นทุกเส้นของ stop เดียวกันเป็น path เดียว → stroke() ครั้งเดียว
  // ════════════════════════════════════════════════════════════
  const STOPS = [0.012, 0.022, 0.036, 0.055, 0.080, 0.115, 0.165, 0.235, 0.330, 0.460];
  const NBUCK = STOPS.length;
  const WIDTHS = [0.35, 0.42, 0.5, 0.6, 0.72, 0.85, 1.0, 1.2, 1.45, 1.8];
  const MID = new Float64Array(NBUCK - 1);
  for (let i = 0; i < NBUCK - 1; i++) MID[i] = (STOPS[i] + STOPS[i + 1]) / 2;

  let cR = 198, cG = 241, cB = 53, cM = 1.3;
  let COLS = [];          // rgba string ต่อ bucket (cache — สร้างใหม่เฉพาะตอน accent เปลี่ยน)
  let GLOW_COLS = [];     // เส้นสีขาว/ดำ (grid)
  function bucketOf(a) {
    if (!(a > 0) || a < STOPS[0] * 0.6) return -1;
    let i = 0;
    while (i < NBUCK - 1 && a > MID[i]) i++;
    return i;
  }
  function rebuildColors() {
    COLS = STOPS.map(s => `rgba(${cR},${cG},${cB},${s})`);
    GLOW_COLS = STOPS.map(s => dark ? `rgba(255,255,255,${s})` : `rgba(0,0,0,${s})`);
  }

  // ── Glow texture (cache แทนการสร้าง radial gradient ทุกเฟรม) ──
  let glowTexture = null;
  function rebuildGlowTexture() {
    const SIZE = 256;
    const tex = document.createElement('canvas');
    tex.width = tex.height = SIZE;
    const tctx = tex.getContext('2d');
    const g = tctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2);
    g.addColorStop(0,    `rgba(${cR},${cG},${cB},1)`);
    g.addColorStop(0.41, `rgba(${cR},${cG},${cB},0.28)`);
    g.addColorStop(1,    `rgba(${cR},${cG},${cB},0)`);
    tctx.fillStyle = g;
    tctx.fillRect(0, 0, SIZE, SIZE);
    glowTexture = tex;
  }

  function syncAccent() {
    const { r, g, b } = hexToRgb(getSettings().accent || '#C6F135');
    cR = r; cG = g; cB = b;
    dark = document.documentElement.getAttribute('data-theme') !== 'light';
    themeReady = true;
    cM = alphaMult({ r, g, b });
    rebuildColors();
    rebuildGlowTexture();
  }

  // ════════════════════════════════════════════════════════════
  // SEGMENT BATCH — เก็บเส้นเป็น typed array แล้ว flush เป็น path ต่อ bucket
  // ════════════════════════════════════════════════════════════
  function createBatch(capacity) {
    let cap = capacity;
    let x1 = new Float32Array(cap), y1 = new Float32Array(cap);
    let x2 = new Float32Array(cap), y2 = new Float32Array(cap);
    let bk = new Int8Array(cap);
    let order = new Int32Array(cap);
    const counts = new Int32Array(NBUCK);
    const starts = new Int32Array(NBUCK + 1);
    const cursor = new Int32Array(NBUCK);
    let n = 0;

    function grow() {
      cap *= 2;
      const nx1 = new Float32Array(cap); nx1.set(x1); x1 = nx1;
      const ny1 = new Float32Array(cap); ny1.set(y1); y1 = ny1;
      const nx2 = new Float32Array(cap); nx2.set(x2); x2 = nx2;
      const ny2 = new Float32Array(cap); ny2.set(y2); y2 = ny2;
      const nbk = new Int8Array(cap); nbk.set(bk); bk = nbk;
      order = new Int32Array(cap);
    }

    return {
      reset() { n = 0; },
      get count() { return n; },
      seg(ax1, ay1, ax2, ay2, b) {
        if (b < 0) return;
        if (n >= cap) grow();
        const i = n++;
        x1[i] = ax1; y1[i] = ay1; x2[i] = ax2; y2[i] = ay2; bk[i] = b;
      },
      /**
       * counting sort ตาม bucket แล้ว stroke bucket ละครั้ง
       * (นี่คือจุดที่เปลี่ยน ~1,000 stroke()/เฟรม ให้เหลือ ≤10 ครั้ง/เฟรม)
       */
      flush(colors, widths) {
        if (n === 0) return;
        counts.fill(0);
        for (let i = 0; i < n; i++) counts[bk[i]]++;
        let acc = 0;
        for (let b = 0; b < NBUCK; b++) { starts[b] = acc; cursor[b] = acc; acc += counts[b]; }
        for (let i = 0; i < n; i++) { const b = bk[i]; order[cursor[b]++] = i; }
        for (let b = 0; b < NBUCK; b++) {
          const s = starts[b], e = s + counts[b];
          if (e === s) continue;
          ctx.beginPath();
          for (let j = s; j < e; j++) {
            const i = order[j];
            ctx.moveTo(x1[i], y1[i]);
            ctx.lineTo(x2[i], y2[i]);
          }
          ctx.strokeStyle = colors[b];
          ctx.lineWidth = widths ? widths[b] : WIDTHS[b];
          ctx.stroke();
        }
      },
    };
  }

  const batchMain = createBatch(8192);   // เส้นทั่วไป (particles/multtable/grid)
  const batchTrail = createBatch(8192);  // เส้น trail (lorenz/flow/epicycles)

  // ════════════════════════════════════════════════════════════
  // RING BUFFER — trail/lorenz เก็บใน typed array (ไม่มี object ต่อจุด)
  // ════════════════════════════════════════════════════════════
  function ring(capacity, stride) {
    const data = new Float32Array(capacity * stride);
    let head = 0, len = 0;
    return {
      data, stride, capacity,
      push(a, b, c) {
        const o = head * stride;
        data[o] = a; data[o + 1] = b;
        if (stride > 2) data[o + 2] = c;
        head = (head + 1) % capacity;
        if (len < capacity) len++;
      },
      get length() { return len; },
      /** offset ของจุดที่ i (0 = เก่าที่สุด) */
      at(i) {
        let idx = head - len + i;
        idx %= capacity;
        if (idx < 0) idx += capacity;
        return idx * stride;
      },
      reset() { head = 0; len = 0; },
    };
  }

  // ════════════════════════════════════════════════════════════
  // SPATIAL GRID — typed array + counting sort (ไม่มี Map/string key)
  // ════════════════════════════════════════════════════════════
  let gCell = 155, gCols = 1, gRows = 1;
  let gCount = null, gStart = null, gCursor = null, gItems = null;

  function allocGrid() {
    const cells = gCols * gRows;
    if (!gCount || gCount.length < cells) {
      gCount = new Int32Array(cells);
      gStart = new Int32Array(cells + 1);
      gCursor = new Int32Array(cells);
    }
    if (!gItems || gItems.length < particles.length) {
      gItems = new Int32Array(Math.max(64, particles.length));
    }
  }

  function buildGrid() {
    const cells = gCols * gRows;
    gCount.fill(0, 0, cells);
    const n = particles.length;
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      let gx = (p.x / gCell) | 0; if (gx < 0) gx = 0; else if (gx >= gCols) gx = gCols - 1;
      let gy = (p.y / gCell) | 0; if (gy < 0) gy = 0; else if (gy >= gRows) gy = gRows - 1;
      const c = gy * gCols + gx;
      p.c = c;
      gCount[c]++;
    }
    let acc = 0;
    for (let c = 0; c < cells; c++) { gStart[c] = acc; gCursor[c] = acc; acc += gCount[c]; }
    gStart[cells] = acc;
    for (let i = 0; i < n; i++) { const c = particles[i].c; gItems[gCursor[c]++] = i; }
  }

  // ════════════════════════════════════════════════════════════
  // AURORA BLOBS
  // ════════════════════════════════════════════════════════════
  const BLOBS = [
    { ox: 0.78, oy: -0.05, r: 0.60, sp: 0.00013, ph: 0.0, depth: 0.10 },
    { ox: -0.1, oy: 0.80,  r: 0.48, sp: 0.00010, ph: 2.1, depth: 0.22 },
    { ox: 0.45, oy: 0.50,  r: 0.36, sp: 0.00017, ph: 4.3, depth: 0.34 },
    { ox: 0.20, oy: 0.10,  r: 0.28, sp: 0.00008, ph: 1.6, depth: 0.46 },
  ];
  // ตำแหน่ง blob ต่อเฟรม (cache ไว้ใช้ทั้ง aurora + แรงดึงดูดของอนุภาค)
  const blobXY = BLOBS.map(() => ({ cx: 0, cy: 0 }));

  function drawAurora(t, info) {
    if (!glowTexture) return;
    const energyBoost = 1 + info.energy * 0.55;
    const base = (dark ? 0.065 : 0.110) * cM * energyBoost;
    ctx.save();
    ctx.globalAlpha = Math.min(1, base);
    for (let i = 0; i < BLOBS.length; i++) {
      const n = BLOBS[i];
      // parallax: blob แต่ละก้อนเลื่อนตาม scroll ไม่เท่ากัน
      const par = sceneScrollY * n.depth * 0.06;
      const cx = (n.ox + Math.sin(t * n.sp + n.ph) * 0.12) * W;
      const cy = (n.oy + Math.cos(t * n.sp * 0.7 + n.ph) * 0.10) * H - par;
      blobXY[i].cx = cx; blobXY[i].cy = cy;
      const rad = n.r * Math.max(W, H) * (1 + info.energy * 0.05);
      ctx.drawImage(glowTexture, cx - rad, cy - rad, rad * 2, rad * 2);
    }
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // CURSOR ORB
  // ════════════════════════════════════════════════════════════
  const orb = { x: 0, y: 0, boost: 0, alpha: 0, ready: false };
  function drawOrb(info) {
    const steps = motionSteps(info.dt, info.motion);
    if (mouse.inside) {
      if (!orb.ready) { orb.x = mouse.x; orb.y = mouse.y; orb.ready = true; }
      const blend = 1 - Math.pow(0.90, steps);
      orb.x += (mouse.x - orb.x) * blend;
      orb.y += (mouse.y - orb.y) * blend;
    }
    orb.alpha += ((mouse.inside ? 1 : 0) - orb.alpha) * (1 - Math.pow(0.82, steps));
    orb.boost *= Math.pow(0.90, steps);
    if (orb.alpha < 0.001 || !glowTexture) { if (!mouse.inside) orb.ready = false; return; }
    const a = (dark ? 0.11 : 0.14) * cM * (1 + info.energy * 0.6);
    const rad = 185 + orb.boost * 70 + info.energy * 45;
    ctx.save();
    ctx.globalAlpha = Math.min(1, a * orb.alpha);
    ctx.drawImage(glowTexture, orb.x - rad, orb.y - rad, rad * 2, rad * 2);
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // PARTICLES
  // ════════════════════════════════════════════════════════════
  let particles = [];
  let particleGoal = 0;
  const CONNECT = 155, REPEL = 115, LJ_RADIUS = 70;
  let adaptQ = 0;   // adaptive quality level (performance mode)

  function makeParticle() {
    const vx = (Math.random() - 0.5) * 0.28, vy = (Math.random() - 0.5) * 0.28;
    return { x: Math.random() * W, y: Math.random() * H, vx, vy, bvx: vx, bvy: vy, r: Math.random() * 1.4 + 0.5, c: 0 };
  }

  function targetCount() {
    const mode = currentMode();
    if (mode === 'eco') return Math.min(Math.floor((W * H) / 28000), 26);
    if (mode === 'performance') {
      const div = [5000, 8000, 12000, 16000, 24000][adaptQ] ?? 24000;
      const max = [210, 140, 90, 60, 36][adaptQ] ?? 36;
      return Math.min(Math.floor((W * H) / div), max);
    }
    return Math.min(Math.floor((W * H) / 9000), 130);
  }

  function initParticles() {
    sceneInitializations.particles++;
    const n = targetCount();
    particles = Array.from({ length: n }, makeParticle);
    particleGoal = n;
  }
  /** โต/หดแบบนุ่ม — ไม่ล้างทั้งชุด (กันภาพวาปตอนคุณภาพปรับ) */
  function softRebuildParticles() {
    particleGoal = targetCount();
  }

  const shockwaves = [];  // คลื่นกระแทกจากคลิก → ผลักอนุภาคจริง
  function pushShockwave(x, y) { shockwaves.push({ x, y, r: 0, life: 1 }); }

  function drawParticles(t, info, mode) {
    const steps = motionSteps(info.dt, info.motion);
    const countDelta = Math.max(1, Math.ceil(2 * steps));
    if (particles.length < particleGoal) {
      const add = Math.min(particleGoal - particles.length, countDelta);
      for (let i = 0; i < add; i++) particles.push(makeParticle());
      allocGrid();
    } else if (particles.length > particleGoal) {
      particles.length -= Math.min(particles.length - particleGoal, countDelta);
    }
    const perf = mode === 'performance';
    const dotB  = (dark ? 0.60 : 0.55) * cM * (1 + info.energy * 0.35);
    const lineB = (dark ? 0.20 : 0.18) * cM * (1 + info.energy * 0.5);
    const speedMul = 1 + info.energy * 0.9;
    const n = particles.length;

    // parallax ตาม scroll — อนุภาคเลื่อนจริงใน world space (wrap ได้เอง)
    if (sceneScrollDy) {
      const shift = sceneScrollDy * 0.22;
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        p.y = wrapPosition(p.y + shift, H);
      }
    }

    // ── shockwave impulse ──
    for (let s = shockwaves.length - 1; s >= 0; s--) {
      const w = shockwaves[s];
    w.r += 26 * steps; w.life -= 0.035 * steps;
      if (w.life <= 0) { shockwaves.splice(s, 1); continue; }
      const R = w.r;
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        const dx = p.x - w.x, dy = p.y - w.y;
        const d = Math.hypot(dx, dy);
        if (d < R && d > R - 70 && d > 1) {
          const f = (1 - Math.abs(d - (R - 35)) / 35) * 2.4 * w.life;
          if (f > 0) { p.vx += (dx / d) * f * steps; p.vy += (dy / d) * f * steps; }
        }
      }
    }

    // ── integrate ──
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      const flow = Math.sin(p.x * 0.004 + t * 0.00025) * Math.PI
                 + Math.cos(p.y * 0.004 + t * 0.00018) * Math.PI * 0.6;

      const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
      const md = Math.hypot(mdx, mdy);
      if (md < REPEL && md > 0) {
        const f = (1 - md / REPEL) * (0.68 + info.energy * 0.5);
        p.vx += (mdx / md) * f * steps; p.vy += (mdy / md) * f * steps;
      }

      if (perf) {
        for (let b = 0; b < blobXY.length; b++) {
          const bdx = blobXY[b].cx - p.x, bdy = blobXY[b].cy - p.y;
          const bd = Math.hypot(bdx, bdy);
          if (bd > 10 && bd < 300) { const f = 0.0009 * (300 - bd) / 300 * steps; p.vx += (bdx / bd) * f; p.vy += (bdy / bd) * f; }
        }
      }

      const decay = Math.pow(0.96, steps);
      p.vx = p.vx * decay + (p.bvx + Math.cos(flow) * 0.010) * (1 - decay);
      p.vy = p.vy * decay + (p.bvy + Math.sin(flow) * 0.010) * (1 - decay);
      const spd = Math.hypot(p.vx, p.vy);
      const cap = 4.5 * speedMul;
      if (spd > cap) { p.vx = (p.vx / spd) * cap; p.vy = (p.vy / spd) * cap; }
      p.x = wrapPosition(p.x + p.vx * speedMul * steps, W);
      p.y = wrapPosition(p.y + p.vy * speedMul * steps, H);
    }

    // ── grid หนึ่งครั้งต่อเฟรม ใช้ทั้ง LJ และเส้นเชื่อม ──
    buildGrid();

    if (perf) {
      // Lennard-Jones กับเพื่อนบ้านใกล้จริง (3x3 cells)
      for (let i = 0; i < (adaptQ >= 4 ? 0 : n); i++) {
        const p = particles[i];
        const gx = p.c % gCols, gy = (p.c / gCols) | 0;
        for (let oy = -1; oy <= 1; oy++) {
          const yy = gy + oy; if (yy < 0 || yy >= gRows) continue;
          for (let ox = -1; ox <= 1; ox++) {
            const xx = gx + ox; if (xx < 0 || xx >= gCols) continue;
            const c = yy * gCols + xx;
            for (let k = gStart[c], ke = gStart[c + 1]; k < ke; k++) {
              const j = gItems[k];
              if (j <= i) continue;
              const q = particles[j];
              const dx = q.x - p.x, dy = q.y - p.y;
              const d = Math.hypot(dx, dy);
              if (d < LJ_RADIUS && d > 0) {
                const [fx, fy] = pairImpulse(dx, dy, steps);
                p.vx -= fx; p.vy -= fy;
                q.vx += fx; q.vy += fy;
              }
            }
          }
        }
      }
    }

    // ── เส้นเชื่อม → batch ──
    batchMain.reset();
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      const gx = p.c % gCols, gy = (p.c / gCols) | 0;
      for (let oy = -1; oy <= 1; oy++) {
        const yy = gy + oy; if (yy < 0 || yy >= gRows) continue;
        for (let ox = -1; ox <= 1; ox++) {
          const xx = gx + ox; if (xx < 0 || xx >= gCols) continue;
          const c = yy * gCols + xx;
          const ke = gStart[c + 1];
          for (let k = gStart[c]; k < ke; k++) {
            const j = gItems[k];
            if (j <= i) continue;
            const q = particles[j];
            const dx = p.x - q.x, dy = p.y - q.y;
            const d = Math.hypot(dx, dy);
            if (d < CONNECT) batchMain.seg(p.x, p.y, q.x, q.y, bucketOf((1 - d / CONNECT) * lineB));
          }
        }
      }
    }
    batchMain.flush(COLS, WIDTHS);

    // ── จุด: รวมทุกจุดเป็น path เดียว (2 path: ใกล้เมาส์ / ไกล) ──
    const near = [], far = [];
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      (d < REPEL ? near : far).push(p);
    }
    const drawDots = (list, boost) => {
      if (!list.length) return;
      ctx.beginPath();
      for (const p of list) {
        ctx.moveTo(p.x + p.r, p.y);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      ctx.fillStyle = `rgba(${cR},${cG},${cB},${Math.min(1, dotB + boost)})`;
      ctx.fill();
    };
    drawDots(far, 0);
    drawDots(near, 0.45);
  }

  // ════════════════════════════════════════════════════════════
  // SHOOTING STARS — spawn rate ผูกกับ energy (ขยับเมาส์ = ดาวเยอะ)
  // ════════════════════════════════════════════════════════════
  function mkStar() {
    return {
      x: Math.random() * W * 1.2 - W * 0.1, y: Math.random() * H * 0.4,
      len: Math.random() * 130 + 50, spd: Math.random() * 7 + 5,
      ang: (Math.PI / 180) * (Math.random() * 22 + 18),
      life: 0, max: Math.random() * 45 + 25, wait: Math.random() * 500 + 180,
    };
  }
  let STARS = [];
  function initStars() { sceneInitializations.stars++; STARS = Array.from({ length: 7 }, mkStar); }

  function drawStars(info) {
    const steps = motionSteps(info.dt, info.motion);
    const waitScale = (1 + info.energy * 2) * steps;
    for (const s of STARS) {
      if (s.wait > 0) { s.wait -= waitScale; continue; }
      s.x += Math.cos(s.ang) * s.spd * steps;
      s.y += Math.sin(s.ang) * s.spd * steps + sceneScrollDy * 0.05;
      s.life += steps;
      if (s.life >= s.max || s.x > W + 200 || s.y > H + 200) Object.assign(s, mkStar());
      const a = Math.sin((s.life / s.max) * Math.PI) * (dark ? 0.78 : 0.52) * cM;
      if (a <= 0.01) continue;
      const tx = s.x - Math.cos(s.ang) * s.len, ty = s.y - Math.sin(s.ang) * s.len;
      const g = ctx.createLinearGradient(tx, ty, s.x, s.y);
      g.addColorStop(0, `rgba(${cR},${cG},${cB},0)`);
      g.addColorStop(0.6, `rgba(${cR},${cG},${cB},${a * 0.35})`);
      g.addColorStop(1, `rgba(${cR},${cG},${cB},${a})`);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cR},${cG},${cB},${a})`; ctx.fill();
    }
    ctx.lineCap = 'butt';
  }

  // ════════════════════════════════════════════════════════════
  // RIPPLES + CLICK STARBURST
  // ════════════════════════════════════════════════════════════
  let ripples = [];
  let bursts = [];
  const BURST_RAYS = 14, BURST_LEN = 90, BURST_DECAY = 0.05;

  function spawnRipple() {
    if (!mouse.inside) return;
    if (Math.hypot(mouse.x - mouse.px, mouse.y - mouse.py) > 8 && ripples.length < 24) {
      ripples.push({ x: mouse.x, y: mouse.y, r: 0, maxR: 65, life: 1 });
    }
  }
  function drawRipples(info) {
    if (!ripples.length) return;
    const steps = motionSteps(info.dt, info.motion);
    const base = (dark ? 0.18 : 0.13) * cM;
    batchMain.reset();
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += (r.maxR - r.r) * (1 - Math.pow(0.925, steps));
      r.life -= 0.022 * steps;
      if (r.life <= 0) { ripples.splice(i, 1); continue; }
      // วงกลม ≈ 12 เส้น → รวมเข้า batch (ถูกกว่า arc+stroke ต่อวง)
      const SEG = 12;
      for (let k = 0; k < SEG; k++) {
        const a1 = (k / SEG) * Math.PI * 2, a2 = ((k + 1) / SEG) * Math.PI * 2;
        batchMain.seg(
          r.x + Math.cos(a1) * r.r, r.y + Math.sin(a1) * r.r,
          r.x + Math.cos(a2) * r.r, r.y + Math.sin(a2) * r.r,
          bucketOf(r.life * base)
        );
      }
    }
    batchMain.flush(COLS, WIDTHS);
  }

  function spawnBurst(x, y) {
    if (bursts.length > 6) bursts.shift();
    const rays = [];
    for (let i = 0; i < BURST_RAYS; i++) {
      rays.push({ angle: (i / BURST_RAYS) * Math.PI * 2 + Math.random() * 0.3, len: BURST_LEN * (0.6 + Math.random() * 0.8) });
    }
    bursts.push({ x, y, rays, life: 1 });
  }
  function drawBursts(info) {
    if (!bursts.length) return;
    const steps = motionSteps(info.dt, info.motion);
    const base = (dark ? 0.55 : 0.42) * cM;
    batchMain.reset();
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life -= BURST_DECAY * steps;
      if (b.life <= 0) { bursts.splice(i, 1); continue; }
      const ease = b.life * b.life;
      const grow = 1 - b.life;
      const bk = bucketOf(ease * base);
      for (const r of b.rays) {
        batchMain.seg(b.x, b.y, b.x + Math.cos(r.angle) * r.len * grow, b.y + Math.sin(r.angle) * r.len * grow, bk);
      }
    }
    batchMain.flush(COLS, WIDTHS);
  }

  function onClick(e) {
    if (!cachedAnimate || currentMode() === 'eco' || getLoopInfo().reducedMotion) return;
    const x = e.clientX, y = e.clientY;
    if (ripples.length > 36) ripples.length = 0;
    if (shockwaves.length > 12) shockwaves.length = 0;
    for (let i = 0; i < 3; i++) ripples.push({ x, y, r: 0, maxR: 80 + i * 30, life: 1 - i * 0.22 });
    orb.boost = 1;
    spawnBurst(x, y);
    pushShockwave(x, y);
  }

  // ════════════════════════════════════════════════════════════
  // GRID — เส้นทั้งหมดรวมเป็น 2 path (เดิม stroke ทีละเส้น ~41 ครั้ง/เฟรม)
  // ════════════════════════════════════════════════════════════
  function drawGrid(t, info) {
    const a = (dark ? 0.028 : 0.044) * (1 + info.energy * 0.8);
    const b = bucketOf(a);
    if (b < 0) return;
    const CW = W / 26;
    const off = (t * 0.016 + sceneScrollY * 0.12) % CW;
    ctx.beginPath();
    for (let x = -off; x <= W + CW; x += CW) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let row = 0; row <= Math.ceil(H / CW) + 1; row++) { ctx.moveTo(0, row * CW); ctx.lineTo(W, row * CW); }
    ctx.strokeStyle = GLOW_COLS[b];
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // ════════════════════════════════════════════════════════════
  // A — FOURIER EPICYCLES
  // ════════════════════════════════════════════════════════════
  const TRAIL_LEN = 200;
  const ESYS = [
    { cx: 0.18, cy: 0.22, sc: 0.048, to: 0,          h: [1.0, 0.5, 0.33, 0.25, 0.20, 0.17, 0.14], depth: 0.30 },
    { cx: 0.82, cy: 0.78, sc: 0.040, to: Math.PI,    h: [1.0, 0.33, 0.20, 0.14, 0.11, 0.09],      depth: 0.18 },
    { cx: 0.50, cy: 0.50, sc: 0.030, to: Math.PI * 0.5, h: [0.8, 0.4, 0.22, 0.15, 0.11],         depth: 0.42 },
  ];
  const epicycleTrails = ESYS.map(() => ring(TRAIL_LEN, 2));
  const epicycleSampleClock = new Float64Array(ESYS.length);
  const epicyclePhases = new Float64Array(ESYS.length);
  const epicycleInfluence = new Float64Array(ESYS.length);
  const epicycleTilt = new Float64Array(ESYS.length);
  const epicycleCircles = ESYS.map(sys => new Float32Array(sys.h.length * 3));
  let lastEpicycleTime = null;

  function drawEpicycles(t, info) {
    const base = (dark ? 0.18 : 0.14) * cM;
    const sc = Math.min(W, H);
    const dt = elapsedMotionTime(t, lastEpicycleTime);
    lastEpicycleTime = t;

    batchTrail.reset();
    for (let si = 0; si < ESYS.length; si++) {
      const sys = ESYS[si];
      const par = sceneScrollY * sys.depth * 0.05;
      const cxPx = sys.cx * W, cyPx = sys.cy * H - par;
      const md = Math.hypot(mouse.x - cxPx, mouse.y - cyPx);
      const targetInfluence = mouse.inside ? Math.max(0, 1 - md / (sc * 0.35)) : 0;
      const inf = epicycleInfluence[si] = followTarget(
        epicycleInfluence[si], targetInfluence, dt, 120
      );
      // A vertical tilt is continuous across the entire pointer plane; unlike
      // atan2, it does not flip by 2π while crossing the negative X axis.
      const tiltTarget = inf * Math.max(-1, Math.min(1, (mouse.y - cyPx) / (sc * 0.35))) * 0.13;
      const tiltAngle = epicycleTilt[si] = followTarget(epicycleTilt[si], tiltTarget, dt, 150);
      epicyclePhases[si] = advanceAngle(
        epicyclePhases[si], dt, 0.00080, (1 + inf * 0.8) * (1 + info.energy * 0.65)
      );
      const phase = epicyclePhases[si];
      const circles = epicycleCircles[si];

      let x = cxPx, y = cyPx;
      for (let idx = 0; idx < sys.h.length; idx++) {
        const amp = sys.h[idx];
        const freq = idx + 1;
        const radius = amp * sys.sc * sc;
        // Orbit circles and the harmonic arms must share these exact centers.
        const offset = idx * 3;
        circles[offset] = x;
        circles[offset + 1] = y;
        circles[offset + 2] = radius;
        const angle = phase * freq + sys.to + idx * 0.7 + tiltAngle * freq;
        const nx = x + radius * Math.cos(angle);
        const ny = y + radius * Math.sin(angle);
        batchTrail.seg(x, y, nx, ny, bucketOf(base * 0.30 * (1 + inf * 0.5)));
        x = nx; y = ny;
      }

      // tip dot
      ctx.beginPath(); ctx.arc(x, y, 2.5 + inf * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cR},${cG},${cB},${Math.min(1, base * (1.2 + inf * 1.5))})`;
      ctx.fill();

      const trail = epicycleTrails[si];
      epicycleSampleClock[si] += dt;
      if (trail.length === 0 || epicycleSampleClock[si] >= STEP_MS) {
        // Keep the history in orbit-local coordinates: subsequent scroll,
        // orientation and toolbar changes translate/scale the whole trail
        // using exactly the same transform as the live harmonic geometry.
        trail.push((x - cxPx) / sc, (y - cyPx) / sc);
        epicycleSampleClock[si] %= STEP_MS;
      }
      const L = trail.length;
      if (L > 2) {
        for (let i = 1; i < L; i++) {
          const o0 = trail.at(i - 1), o1 = trail.at(i);
          const frac = i / L;
          batchTrail.seg(cxPx + trail.data[o0] * sc, cyPx + trail.data[o0 + 1] * sc,
                         cxPx + trail.data[o1] * sc, cyPx + trail.data[o1 + 1] * sc,
                         bucketOf(frac * base * (0.85 + inf * 0.5)));
        }
      }
    }
    batchTrail.flush(COLS, WIDTHS);

    // วงโคจร (circle) — วาดรวมเป็น path เดียว
    ctx.beginPath();
    for (let si = 0; si < ESYS.length; si++) {
      const circles = epicycleCircles[si];
      for (let idx = 0; idx < circles.length; idx += 3) {
        const x = circles[idx], y = circles[idx + 1], radius = circles[idx + 2];
        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, Math.PI * 2);
      }
    }
    const cb = bucketOf(base * 0.14);
    if (cb >= 0) { ctx.strokeStyle = COLS[cb]; ctx.lineWidth = 0.4; ctx.stroke(); }
  }

  // ════════════════════════════════════════════════════════════
  // B — LORENZ ATTRACTOR
  // ════════════════════════════════════════════════════════════
  const sigma = 10, rhoL = 28, betaL = 8 / 3;
  const LORENZ_MAX = 1800;
  const lorenz = ring(LORENZ_MAX, 3);
  let lx = 0.1, ly = 0, lz = 20;
  let lastLorenzTime = null;

  function buildLorenz() {
    sceneInitializations.lorenz++;
    lorenz.reset();
    lastLorenzTime = null;
    lx = 0.1 + Math.random() * 0.5; ly = Math.random() * 0.4; lz = 20 + Math.random() * 5;
  }

  function updateDrawLorenz(info) {
    const elapsed = elapsedMotionTime(info.t, lastLorenzTime);
    lastLorenzTime = info.t;
    // Numerical integration previously used a fixed 0.012 per display frame,
    // causing the same attractor to run 2.4× faster at 144Hz than at 60Hz.
    const frameScale = elapsed / (1000 / 60);
    const lcx = W * 0.75, lcy = H * 0.5 - sceneScrollY * 0.04, sc = Math.min(W, H) * 0.013;
    const projX = lcx + lx * sc, projZ = lcy + (lz - 25) * sc;
    const md = Math.hypot(mouse.x - projX, mouse.y - projZ);
    if (mouse.inside && md < 120) {
      const f = (1 - md / 120) * 0.008 * frameScale;
      lx += (mouse.x - projX) / sc * f;
      ly += (mouse.y - projZ) / sc * f * 0.5;
    }

    const dt = 0.012 * frameScale * (1 + info.energy * 0.8);
    const df = (x, y, z) => ({ dx: sigma * (y - x), dy: x * (rhoL - z) - y, dz: x * y - betaL * z });
    const k1 = df(lx, ly, lz);
    const k2 = df(lx + dt / 2 * k1.dx, ly + dt / 2 * k1.dy, lz + dt / 2 * k1.dz);
    const k3 = df(lx + dt / 2 * k2.dx, ly + dt / 2 * k2.dy, lz + dt / 2 * k2.dz);
    const k4 = df(lx + dt * k3.dx, ly + dt * k3.dy, lz + dt * k3.dz);
    lx += dt / 6 * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
    ly += dt / 6 * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
    lz += dt / 6 * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz);
    lorenz.push(lx, ly, lz);

    const L = lorenz.length;
    if (L < 2) return;
    const base = (dark ? 0.28 : 0.22) * cM;
    batchTrail.reset();
    const d = lorenz.data;
    for (let i = 2; i < L; i += 2) {
      const o0 = lorenz.at(i - 2), o1 = lorenz.at(i);
      batchTrail.seg(
        lcx + d[o0] * sc, lcy + (d[o0 + 2] - 25) * sc,
        lcx + d[o1] * sc, lcy + (d[o1 + 2] - 25) * sc,
        bucketOf((i / L) * base)
      );
    }
    batchTrail.flush(COLS, WIDTHS);
  }

  // ════════════════════════════════════════════════════════════
  // C — WAVE INTERFERENCE (buffer เล็ก + upscale)
  // ════════════════════════════════════════════════════════════
  const WSTEP = 13;                 // px ต่อ 1 เซลล์ของ buffer
  const waveCanvas = document.createElement('canvas');
  const waveCtx = waveCanvas.getContext('2d');
  let waveImg = null, waveW = 1, waveH = 1;

  function resizeWaveCanvas() {
    waveW = Math.max(1, Math.ceil(W / WSTEP));
    waveH = Math.max(1, Math.ceil(H / WSTEP));
    waveCanvas.width = waveW;
    waveCanvas.height = waveH;
    waveImg = waveCtx.createImageData(waveW, waveH);
  }

  let waveMouseWeight = 0, waveMouseX = 0, waveMouseY = 0, waveMouseReady = false;
  function drawWaveInterference(t, info) {
    if (!waveImg) return;
    const base = (dark ? 0.040 : 0.060) * cM;
    const s0x = W * 0.28, s0y = H * 0.32;
    const s1x = W * 0.72, s1y = H * 0.32;
    const s2x = W * 0.50, s2y = H * 0.75;
    const dt = Math.max(0, Math.min(50, info.dt ?? 0));
    if (mouse.inside) {
      if (!waveMouseReady) { waveMouseX = mouse.x; waveMouseY = mouse.y; waveMouseReady = true; }
      waveMouseX = followTarget(waveMouseX, mouse.x, dt, 80);
      waveMouseY = followTarget(waveMouseY, mouse.y, dt, 80);
    }
    waveMouseWeight = followTarget(waveMouseWeight, mouse.inside ? 1 : 0, dt, 160);
    const smx = waveMouseX, smy = waveMouseY;
    const k = 0.018, omega = t * 0.0015;
    const data = waveImg.data;
    data.fill(0);

    let idx = 0;
    for (let gy = 0; gy < waveH; gy++) {
      const py = gy * WSTEP;
      for (let gx = 0; gx < waveW; gx++, idx += 4) {
        const px = gx * WSTEP;
        let amp = Math.cos(k * Math.hypot(px - s0x, py - s0y) - omega)
                + Math.cos(k * Math.hypot(px - s1x, py - s1y) - omega)
                + Math.cos(k * Math.hypot(px - s2x, py - s2y) - omega);
        if (waveMouseWeight > 0.001) amp += waveMouseWeight * Math.cos(k * Math.hypot(px - smx, py - smy) - omega);
        const intensity = Math.abs(amp / (3 + waveMouseWeight));
        if (intensity <= 0.52) continue;
        data[idx] = cR; data[idx + 1] = cG; data[idx + 2] = cB;
        data[idx + 3] = Math.min(255, (intensity - 0.52) * base * 2.8 * 255 * (1 + info.energy * 0.4));
      }
    }
    waveCtx.putImageData(waveImg, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(waveCanvas, 0, 0, W, H);

    // source dots
    ctx.beginPath();
    const pos = [s0x, s0y, s1x, s1y, s2x, s2y];
    for (let i = 0; i < 3; i++) {
      const r = 3.5;
      ctx.moveTo(pos[i * 2] + r, pos[i * 2 + 1]);
      ctx.arc(pos[i * 2], pos[i * 2 + 1], r, 0, Math.PI * 2);
    }
    ctx.fillStyle = `rgba(${cR},${cG},${cB},${0.6 * cM})`;
    ctx.fill();
    if (waveMouseWeight > 0.001) {
      ctx.beginPath(); ctx.arc(smx, smy, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cR},${cG},${cB},${0.6 * cM * waveMouseWeight})`;
      ctx.fill();
    }
  }

  // ════════════════════════════════════════════════════════════
  // D — VECTOR FLOW FIELD (trail ใน typed array)
  // ════════════════════════════════════════════════════════════
  const FLOW_N = 104, FLOW_TRAIL = 16;
  let flowPts = [];
  let flowTrail = null;

  function buildFlowParticles() {
    sceneInitializations.flow++;
    flowPts = Array.from({ length: FLOW_N }, () => ({
      x: Math.random() * W, y: Math.random() * H, head: 0, len: 0, age: Math.random() * 200, trailClock: 0,
    }));
    flowTrail = new Float32Array(FLOW_N * FLOW_TRAIL * 2);
  }

  function drawFlowField(t, info) {
    const base = (dark ? 0.18 : 0.14) * cM;
    const steps = motionSteps(info.dt, info.motion);
    batchTrail.reset();
    for (let pi = 0; pi < flowPts.length; pi++) {
      const p = flowPts[pi];
      const baseOff = pi * FLOW_TRAIL * 2;

      p.age += steps;
      // A finite path stays alive; only crossing the hidden viewport margin
      // starts a new stroke. No arbitrary 250-frame in-viewport respawn.

      let angle = Math.sin(p.x * 0.006 + t * 0.0003) * Math.PI * 1.5
                + Math.cos(p.y * 0.006 + t * 0.00025) * Math.PI * 0.8;
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const [dirX, dirY] = mouse.inside
        ? flowDirection(angle, dx, dy) : [Math.cos(angle), Math.sin(angle)];
      const spd = 1.6 * (1 + info.energy * 1.1);
      p.x += dirX * spd * steps;
      p.y += dirY * spd * steps + sceneScrollDy * 0.12;
      // ถ้าหลุดขอบ/ห่อกลับจอ ให้เริ่มหางใหม่ — กันเส้นยาวลากข้ามจอ (artifact เดิม)
      let wrapped = false;
      if (p.x < 0 || p.x > W) { p.x = wrapPosition(p.x, W, 0); wrapped = true; }
      if (p.y < 0 || p.y > H) { p.y = wrapPosition(p.y, H, 0); wrapped = true; }
      if (wrapped) { p.len = 0; p.head = 0; p.trailClock = 0; }
      p.trailClock += steps;
      if (p.len === 0 || p.trailClock >= 1) {
        const ho = baseOff + p.head * 2;
        flowTrail[ho] = p.x; flowTrail[ho + 1] = p.y;
        p.head = (p.head + 1) % FLOW_TRAIL;
        if (p.len < FLOW_TRAIL) p.len++;
        p.trailClock %= 1;
      }

      const L = p.len;
      for (let i = 1; i < L; i++) {
        let a = p.head - L + i; a %= FLOW_TRAIL; if (a < 0) a += FLOW_TRAIL;
        let b = a - 1; if (b < 0) b += FLOW_TRAIL;
        const oa = baseOff + a * 2, ob = baseOff + b * 2;
        batchTrail.seg(flowTrail[ob], flowTrail[ob + 1], flowTrail[oa], flowTrail[oa + 1],
                       bucketOf((i / L) * base * 0.65));
      }
    }
    batchTrail.flush(COLS, WIDTHS);
  }

  // ════════════════════════════════════════════════════════════
  // E — 4D HYPERSPHERE (cache cos/sin ของมุมหมุน — เดิมคำนวณ trig 8 ครั้ง/จุด)
  // ════════════════════════════════════════════════════════════
  // Independent 4D plane rotations advance continuously, even as interaction
  // energy changes. Smoothed pointer offsets cannot snap on pointerleave.
  const hyperAngles = new Float64Array(4);
  const HYPER_SEGS = 48, HYPER_LATS = 10;
  const hyperCircleCos = new Float64Array(HYPER_SEGS + 1);
  const hyperCircleSin = new Float64Array(HYPER_SEGS + 1);
  const hyperMeridianCos = new Float64Array(HYPER_SEGS + 1);
  const hyperMeridianSin = new Float64Array(HYPER_SEGS + 1);
  for (let i = 0; i <= HYPER_SEGS; i++) {
    const circleAngle = i / HYPER_SEGS * Math.PI * 2;
    const meridianAngle = i / HYPER_SEGS * Math.PI;
    hyperCircleCos[i] = Math.cos(circleAngle);
    hyperCircleSin[i] = Math.sin(circleAngle);
    hyperMeridianCos[i] = Math.cos(meridianAngle);
    hyperMeridianSin[i] = Math.sin(meridianAngle);
  }
  let hyperTiltXY = 0, hyperTiltZW = 0, lastHyperTime = null;
  function drawHyperSphere(t, info) {
    const base = (dark ? 0.22 : 0.18) * cM;
    const dt = elapsedMotionTime(t, lastHyperTime);
    lastHyperTime = t;
    const speed = 1 + info.energy * 0.65;
    hyperAngles[0] = advanceAngle(hyperAngles[0], dt, 0.000195, speed);
    hyperAngles[1] = advanceAngle(hyperAngles[1], dt, 0.000130, speed);
    hyperAngles[2] = advanceAngle(hyperAngles[2], dt, 0.000085, speed);
    hyperAngles[3] = advanceAngle(hyperAngles[3], dt, 0.000060, speed);
    hyperTiltXY = followTarget(hyperTiltXY, mouse.inside ? mouse.nx * 0.55 : 0, dt, 170);
    hyperTiltZW = followTarget(hyperTiltZW, mouse.inside ? mouse.ny * 0.35 : 0, dt, 170);

    const aXW = hyperAngles[0] + hyperTiltZW;
    const aYW = hyperAngles[1];
    const aZW = hyperAngles[2];
    const aXY = hyperAngles[3] + hyperTiltXY;
    const cxw = Math.cos(aXW), sxw = Math.sin(aXW);
    const cyw = Math.cos(aYW), syw = Math.sin(aYW);
    const czw = Math.cos(aZW), szw = Math.sin(aZW);
    const cxy = Math.cos(aXY), sxy = Math.sin(aXY);

    const offY = -sceneScrollY * 0.05;
    const scale3 = Math.min(W, H) * 0.14;

    // project 4D → 2D (inline, ไม่มี object ต่อจุด)
    // Reuse scalar outputs instead of allocating ~1,300 [x,y] arrays/frame.
    let projectedX = 0, projectedY = 0;
    const px4 = (x, y, z, w) => {
      let xx = x, yy = y, zz = z, ww = w, t1, t2;
      t1 = xx * cxw - ww * sxw; t2 = xx * sxw + ww * cxw; xx = t1; ww = t2;
      t1 = yy * cyw - ww * syw; t2 = yy * syw + ww * cyw; yy = t1; ww = t2;
      t1 = zz * czw - ww * szw; t2 = zz * szw + ww * czw; zz = t1; ww = t2;
      t1 = xx * cxy - yy * sxy; t2 = xx * sxy + yy * cxy; xx = t1; yy = t2;
      const s4 = 1 / Math.max(0.01, 2.2 - ww);
      const px = xx * s4, py = yy * s4, pz = zz * s4;
      const s3 = 1 / Math.max(0.01, 3.5 - pz);
      projectedX = W * 0.25 + px * s3 * scale3;
      projectedY = H * 0.5 + py * s3 * scale3 + offY;
    };

    batchTrail.reset();
    for (let li = 1; li < HYPER_LATS; li++) {
      const chi = (li / HYPER_LATS) * Math.PI;
      const sinC = Math.sin(chi), cosC = Math.cos(chi);
      const la = base * (0.30 + 0.70 * sinC);
      const bk = bucketOf(la), bk2 = bucketOf(la * 0.4);
      let prevX = 0, prevY = 0;
      for (let si = 0; si <= HYPER_SEGS; si++) {
        px4(sinC * hyperCircleCos[si], sinC * hyperCircleSin[si], 0, cosC);
        if (si) batchTrail.seg(prevX, prevY, projectedX, projectedY, bk);
        prevX = projectedX;
        prevY = projectedY;
      }
      for (let si = 0; si <= HYPER_SEGS; si++) {
        px4(sinC * hyperCircleCos[si], 0, sinC * hyperCircleSin[si], cosC);
        if (si) batchTrail.seg(prevX, prevY, projectedX, projectedY, bk2);
        prevX = projectedX;
        prevY = projectedY;
      }
    }
    for (let lo = 0; lo < 9; lo++) {
      const phi = (lo / 9) * Math.PI * 2;
      const bk = bucketOf(base * 0.22);
      const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
      let prevX = 0, prevY = 0;
      for (let si = 0; si <= HYPER_SEGS; si++) {
        const sinC = hyperMeridianSin[si];
        px4(sinC * cosPhi, sinC * sinPhi, 0, hyperMeridianCos[si]);
        if (si) batchTrail.seg(prevX, prevY, projectedX, projectedY, bk);
        prevX = projectedX;
        prevY = projectedY;
      }
    }
    batchTrail.flush(COLS, WIDTHS);
  }

  // ════════════════════════════════════════════════════════════
  // F — TIMES-TABLE CARDIOID
  // ════════════════════════════════════════════════════════════
  const MT_POINTS = 180;
  // Low-order multiplication patterns have recognizable cardioid/epicycloid
  // structure. Values near 45 produce a noisy pin-cushion instead of an orbit.
  const MT_K_MIN = 2, MT_K_MAX = 6.5;
  const MT_K_SPEED = 0.000045;
  const MT_R_FRAC = 0.42, MT_ROT = 0.00005;
  const MT_BREATHE = 0.015, MT_BREATHE_SPEED = 0.00028;
  let multTableK = MT_K_MIN;
  let multTablePhase = 0, multTableRotation = 0, lastMultTableTime = null;
  // cache cos/sin ของจุดบนวงกลม (ไม่ต้องเรียก trig 360 ครั้ง/เฟรม)
  const mtCos = new Float32Array(MT_POINTS), mtSin = new Float32Array(MT_POINTS);
  for (let i = 0; i < MT_POINTS; i++) {
    const a = (i / MT_POINTS) * Math.PI * 2;
    mtCos[i] = Math.cos(a); mtSin[i] = Math.sin(a);
  }

  function drawMultTable(t, info) {
    const base = (dark ? 0.16 : 0.13) * cM;
    const cx = W * 0.5, cy = H * 0.5 - sceneScrollY * 0.03;
    const dt = elapsedMotionTime(t, lastMultTableTime);
    lastMultTableTime = t;
    const breathe = 1 + Math.sin(t * MT_BREATHE_SPEED) * MT_BREATHE;
    const R = Math.min(W, H) * MT_R_FRAC * breathe * (1 + info.energy * 0.04);
    const n = MT_POINTS;

    multTablePhase = advanceAngle(multTablePhase, dt, MT_K_SPEED, 1 + info.energy * 0.5);
    // Start as an actual cardioid (k=2), evolve through a few low-order curves.
    const autoK = MT_K_MIN + (1 - Math.cos(multTablePhase)) * 0.5 * (MT_K_MAX - MT_K_MIN);
    const mouseDist = Math.hypot(mouse.x - cx, mouse.y - cy);
    const influence = mouse.inside
      ? Math.max(0, Math.min(1, (R * 1.25 - mouseDist) / (R * 0.35)))
      : 0;
    const mouseK = MT_K_MIN + Math.max(0, Math.min(1, (mouse.x - (cx - R)) / (2 * R))) * (MT_K_MAX - MT_K_MIN);
    const targetK = autoK + (mouseK - autoK) * influence;
    multTableK = followTarget(multTableK, targetK, dt, 300);
    const k = multTableK;

    multTableRotation = advanceAngle(multTableRotation, dt, MT_ROT, 1 + info.energy * 0.6);
    const rot = multTableRotation;
    const cr = Math.cos(rot), sr = Math.sin(rot);

    batchMain.reset();
    for (let i = 0; i < n; i++) {
      // หมุนทั้งภาพด้วยการหมุน 2D ธรรมดา (ถูกกว่าเรียก trig ใหม่ทุกจุด)
      const ax = mtCos[i] * cr - mtSin[i] * sr;
      const ay = mtCos[i] * sr + mtSin[i] * cr;
      const jPos = (i * k) % n;
      const ji = jPos | 0;
      const frac = jPos - ji;
      const jn = (ji + 1) % n;
      // interpolate ระหว่างจุด → k ไหลลื่น ไม่กระตุก
      let bx = mtCos[ji] + (mtCos[jn] - mtCos[ji]) * frac;
      let by = mtSin[ji] + (mtSin[jn] - mtSin[ji]) * frac;
      const bl = Math.hypot(bx, by) || 1; bx /= bl; by /= bl;
      const bxx = bx * cr - by * sr, byy = bx * sr + by * cr;

      const rawDist = Math.abs(i - jPos);
      const angDist = Math.min(rawDist, n - rawDist) / (n / 2);
      const edgeFade = Math.max(0, Math.min(1, (0.96 - angDist) / 0.10));
      if (edgeFade === 0) continue;
      const alpha = base * (0.35 + 0.65 * (1 - angDist)) * edgeFade;
      batchMain.seg(cx + ax * R, cy + ay * R, cx + bxx * R, cy + byy * R, bucketOf(alpha));
    }
    batchMain.flush(COLS, WIDTHS);
  }

  // ════════════════════════════════════════════════════════════
  // SETTINGS / MODE / ADAPTIVE QUALITY
  // ════════════════════════════════════════════════════════════
  let cachedMode = 'medium';
  let cachedAdaptive = true;
  let cachedAnimate = true;
  function currentMode() { return cachedMode; }
  function syncMode() {
    const s = getSettings();
    cachedMode = s.perfMode || 'medium';
    cachedAdaptive = s.adaptive !== false;
    cachedAnimate = s.anim !== false;
    if (cachedMode === 'eco' || !cachedAnimate) {
      ripples.length = 0;
      bursts.length = 0;
      shockwaves.length = 0;
    }
  }

  function applyScale(next) {
    if (Math.abs(next - scale) < 0.01) return;
    scale = next;
    resizeCanvas();
  }

  // fps history → quality level (มี hysteresis กันกระเพื่อมขึ้นลงถี่ๆ)
  let fpsHist = [];
  let lastAdaptAt = 0;
  const QUALITY_DWELL_MS = 8000;
  function adapt(info, mode) {
    if (info.frame % 30 !== 0) return;
    fpsHist.push(info.fps);
    if (fpsHist.length < 4) return;
    const avg = fpsHist.reduce((a, b) => a + b, 0) / fpsHist.length;
    fpsHist = [];

    const auto = cachedAdaptive;
    let q = adaptQ;

    if (mode === 'performance' && auto) {
      if      (q === 0 && avg < 46) q = 1;   // ลด resolution ก่อน (ภาพยังครบเลเยอร์)
      else if (q === 1 && avg < 40) q = 2;   // แล้วค่อยทิ้ง wave
      else if (q === 2 && avg < 28) q = 3;   // ทิ้ง epicycles + flow
      else if (q === 3 && avg < 20) q = 4;   // เหลือฐาน
      else if (q === 1 && avg > 57) q = 0;
      else if (q === 2 && avg > 52) q = 1;
      else if (q === 3 && avg > 46) q = 2;
      else if (q === 4 && avg > 42) q = 3;
    } else if (mode === 'medium' && auto) {
      q = q === 0 ? (avg < 32 ? 1 : 0) : (avg > 44 ? 0 : 1);
    } else {
      q = 0;
    }

    if (q !== adaptQ && (lastAdaptAt === 0 || info.t - lastAdaptAt >= QUALITY_DWELL_MS)) {
      adaptQ = q;
      const want = q <= 1 ? (q === 0 ? 1 : 0.85) : (q === 2 ? 0.8 : 0.72);
      applyScale(want);
      softRebuildParticles();
      lastAdaptAt = info.t;
      emitQuality(info);
    } else if (info.t - lastAdaptAt > 2000 && info.frame % 120 === 0) {
      emitQuality(info); // ให้ panel เห็น fps ล่าสุดเป็นระยะ
    }
  }

  function emitQuality(info) {
    const step = adaptQ <= 1 ? 0 : adaptQ === 2 ? 1 : 2;
    window.dispatchEvent(new CustomEvent('pf:adaptive-quality', {
      detail: { fps: info.fps, step, quality: adaptQ, scale: +scale.toFixed(2) },
    }));
  }

  // ════════════════════════════════════════════════════════════
  // RESIZE
  // ════════════════════════════════════════════════════════════
  function resizeCanvas() {
    W = vp.w; H = vp.h;
    dpr = vp.dpr;
    // The moving background is decorative: bound its backing-store budget
    // on 4K/8K monitors without scaling down text or the actual page UI.
    // High-density touch phones pay for every extra pixel on every Canvas2D
    // frame. In adaptive mode, 1.4x is enough for fine decorative lines:
    // the native layout, text and controls still render at device resolution.
    // Manual quality (adaptive off) retains the full original 2x option.
    const mobileAdaptiveRatio = vp.touch && vp.small && cachedAdaptive
      ? Math.min(dpr, 1.4) : dpr;
    const maxPixels = vp.touch ? 3_000_000 : 8_000_000;
    const ratio = Math.min(mobileAdaptiveRatio * scale, Math.sqrt(maxPixels / (W * H)));
    canvas.width = Math.max(1, Math.round(W * ratio));
    canvas.height = Math.max(1, Math.round(H * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    gCell = CONNECT;
    gCols = Math.max(1, Math.ceil(W / gCell) + 1);
    gRows = Math.max(1, Math.ceil(H / gCell) + 1);
    allocGrid();
  }

  function onViewportChange() {
    staticDrawn = false;
    const oldW = W, oldH = H;
    const hasScene = flowTrail !== null && particles.length > 0;
    resizeCanvas();
    if (!hasScene) {
      sceneScrollY = scroll.y;
      initParticles();
      initStars();
      buildFlowParticles();
      buildLorenz();
    } else {
      // The same visual points survive a toolbar resize or orientation change.
      // Transform all historical trail coordinates with the viewport, while
      // Lorenz' intrinsic 3D state and orbital phases remain untouched.
      const sx = W / oldW, sy = H / oldH;
      for (const p of particles) { p.x *= sx; p.y *= sy; }
      for (const s of STARS) { s.x *= sx; s.y *= sy; }
      for (const p of flowPts) { p.x *= sx; p.y *= sy; }
      for (let i = 0; i < flowTrail.length; i += 2) {
        flowTrail[i] *= sx; flowTrail[i + 1] *= sy;
      }
      // Epicycle trails are orbit-local and follow center/scale changes at
      // render time. Rescaling them as screen pixels would distort the circles.
      for (const item of [...ripples, ...bursts, ...shockwaves]) {
        item.x *= sx; item.y *= sy;
      }
      if (orb.ready) { orb.x *= sx; orb.y *= sy; }
      if (waveMouseReady) { waveMouseX *= sx; waveMouseY *= sy; }
      softRebuildParticles();
    }
    allocGrid();
    resizeWaveCanvas();
  }

  // ════════════════════════════════════════════════════════════
  // MAIN LOOP (ผ่าน loop กลาง — ไม่มี rAF ของตัวเอง)
  // ════════════════════════════════════════════════════════════
  let ecoAcc = 0;
  const ECO_MS = 1000 / 14;
  let staticDrawn = false;
  let advancedAlpha = 1, waveAlpha = 1;

  function frame(info) {
    if (!alive) return;
    const mode = currentMode();
    refreshTheme();
    const previousSceneScrollY = sceneScrollY;
    sceneScrollY = followTarget(
      sceneScrollY, scroll.y, Math.max(0, Math.min(50, info.dt)), 135
    );
    // A programmatic scrollTo(bottom) may move thousands of CSS pixels in a
    // single frame. Bound the decorative drift independently of page scroll.
    sceneScrollDy = Math.max(-30, Math.min(30, sceneScrollY - previousSceneScrollY));

    // prefers-reduced-motion → วาดภาพนิ่งครั้งเดียวพอ
    if (info.reducedMotion || !cachedAnimate) {
      if (staticDrawn) return;
      staticDrawn = true;
      ctx.clearRect(0, 0, W, H);
      drawAurora(info.t, { energy: 0 });
      drawGrid(info.t, { energy: 0 });
      drawParticles(info.t, { energy: 0, dt: 0, motion: 0 }, 'eco');
      return;
    }
    staticDrawn = false;

    // eco = จำกัด frame rate (ประหยัด CPU จริง ไม่ใช่แค่ลดเลเยอร์)
    if (mode === 'eco') {
      ecoAcc += info.dt;
      if (ecoAcc < ECO_MS) return;
      ecoAcc = 0;
    }

    adapt(info, mode);

    ctx.clearRect(0, 0, W, H);

    drawAurora(info.t, info);
    drawOrb(info);

    if (mode === 'eco') { drawGrid(info.t, info); return; }

    drawStars(info);
    spawnRipple();
    drawGrid(info.t, info);
    drawParticles(info.t, info, mode);
    drawRipples(info);
    drawBursts(info);

    let paintedLayers = 0;
    if (mode === 'performance') {
      // Every cleared frame must repaint every visible layer. The previous
      // odd-frame skip caused visible on/off flashing even at perfect FPS.
      // Fade adaptive LOD changes rather than abruptly dropping geometry.
      const dt = Math.max(0, Math.min(50, info.dt));
      advancedAlpha = followTarget(advancedAlpha, adaptQ < 3 ? 1 : 0, dt, 170);
      waveAlpha = followTarget(waveAlpha, adaptQ < 2 ? 1 : 0, dt, 170);
      if (advancedAlpha > 0.002) {
        ctx.save();
        ctx.globalAlpha = advancedAlpha;
        updateDrawLorenz(info); drawHyperSphere(info.t, info); drawMultTable(info.t, info);
        drawEpicycles(info.t, info); paintedLayers |= 1;
        drawFlowField(info.t, info); paintedLayers |= 2;
        ctx.restore();
      }
      if (waveAlpha > 0.002) {
        ctx.save();
        ctx.globalAlpha = waveAlpha;
        drawWaveInterference(info.t, info); paintedLayers |= 4;
        ctx.restore();
      }
    }
    // Opt-in read-only instrumentation for Chrome motion tests. No allocations
    // and no externally exposed mutable state during ordinary production use.
    if (typeof window.__pfMotionProbe === 'function') {
      const p = particles[0], f = flowPts[0];
      let epicycleMaxGap = 0;
      for (const trail of epicycleTrails) {
        for (let i = 1; i < trail.length; i++) {
          const a = trail.at(i - 1), b = trail.at(i);
          epicycleMaxGap = Math.max(epicycleMaxGap, Math.hypot(
            trail.data[b] - trail.data[a], trail.data[b + 1] - trail.data[a + 1]
          ) * Math.min(W, H));
        }
      }
      window.__pfMotionProbe({
        frame: info.frame, t: info.t, dt: info.dt, mode, quality: adaptQ,
        width: W, height: H, layerMask: paintedLayers,
        sceneScrollY, sceneScrollDy,
        resets: { ...sceneInitializations },
        phases: {
          epicycle: Array.from(epicyclePhases),
          hyper: Array.from(hyperAngles),
          table: multTablePhase, rotation: multTableRotation,
        },
        particle: p ? { x: p.x, y: p.y, vx: p.vx, vy: p.vy } : null,
        flow: f ? { x: f.x, y: f.y } : null,
        lorenz: { x: lx, y: ly, z: lz },
        epicycleMaxGap,
      });
    }
  }

  function pointerIdle() { return mouse.idle > 2500; }

  // ── wiring ──────────────────────────────────────────────────
  syncAccent();
  syncMode();
  const unsubSettings = onSettingsChange(() => {
    const wasAdaptive = cachedAdaptive;
    const previousMode = cachedMode;
    syncAccent();
    syncMode();
    if (cachedMode !== previousMode) softRebuildParticles();
    // Changing the automatic-resolution policy needs a backing-store resize
    // immediately, not after the next 120-frame quality sampling window.
    if (wasAdaptive !== cachedAdaptive) {
      if (!cachedAdaptive) {
        // A manual override must also restore layers that adaptive quality
        // previously shed. Otherwise they stay missing until the next sample.
        const wasDegraded = adaptQ !== 0;
        adaptQ = 0;
        if (scale !== 1) applyScale(1);
        else resizeCanvas();
        if (wasDegraded) softRebuildParticles();
        emitQuality(getLoopInfo());
      } else {
        resizeCanvas();
      }
    }
    staticDrawn = false;
    fpsHist = [];
  });
  const unsubResize = onResize(onViewportChange);
  const unsubFrame = onFrame(frame);
  window.addEventListener('click', onClick, { passive: true });

  emitQuality(loopInfoShim());

  function loopInfoShim() {
    return { fps: 60, frame: 0, t: 0, energy: 0 };
  }

  return function cleanup() {
    alive = false;
    unsubFrame();
    unsubResize();
    unsubSettings();
    window.removeEventListener('click', onClick);
    particles = [];
    ripples = []; bursts.length = 0; shockwaves.length = 0;
    canvas.remove();
  };
}
