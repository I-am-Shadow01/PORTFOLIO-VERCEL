/**
 * src/utils/background.js
 *
 * Layered canvas background:
 *   Layer 0 — slow-drifting aurora gradient orbs
 *   Layer 1 — interactive particle constellation (mouse repel + connect)
 *   Layer 2 — subtle perspective grid
 */

export function initBackground() {
  // ─── Canvas setup ─────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '0',
    pointerEvents: 'none',
  });
  document.getElementById('__root__').prepend(canvas);

  const ctx  = canvas.getContext('2d');
  let W = 0, H = 0;
  let raf;
  let mouse = { x: -9999, y: -9999 };
  let active = true;

  // ─── Resize ───────────────────────────────────────────
  function resize() {
    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth  || window.innerWidth;
    H = canvas.offsetHeight || window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  window.addEventListener('resize', resize, { passive: true });

  // ─── Theme helpers ────────────────────────────────────
  function isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  function getAccent() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#C6F135';
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const len = h.length === 3 ? 1 : 2;
    return {
      r: parseInt(h.slice(0, len).padEnd(2, h[0]), 16),
      g: parseInt(h.slice(len, len * 2).padEnd(2, h[len] || h[0]), 16),
      b: parseInt(h.slice(len * 2).padEnd(2, h[len * 2] || h[0]), 16),
    };
  }

  // ─── Aurora orbs ──────────────────────────────────────
  const ORBS = [
    { ox: 0.75, oy: -0.15, r: 0.55, speed: 0.00012, phase: 0 },
    { ox: -0.1, oy: 0.85,  r: 0.40, speed: 0.00009, phase: 2.1 },
    { ox: 0.5,  oy: 0.5,   r: 0.30, speed: 0.00015, phase: 4.3 },
  ];

  function drawAurora(t) {
    const accent = getAccent();
    const { r, g, b } = hexToRgb(accent);
    const dark = isDark();
    const baseAlpha = dark ? 0.045 : 0.065;

    ORBS.forEach(orb => {
      const drift = Math.sin(t * orb.speed + orb.phase);
      const cx = (orb.ox + drift * 0.12) * W;
      const cy = (orb.oy + Math.cos(t * orb.speed * 0.7 + orb.phase) * 0.1) * H;
      const radius = orb.r * Math.max(W, H);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0,   `rgba(${r},${g},${b},${baseAlpha})`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${baseAlpha * 0.4})`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });
  }

  // ─── Perspective grid ─────────────────────────────────
  function drawGrid(t) {
    const dark = isDark();
    const alpha = dark ? 0.028 : 0.04;
    const COLS  = 24;
    const cellW = W / COLS;
    const scrollOffset = (t * 0.018) % cellW;

    ctx.save();
    ctx.strokeStyle = dark
      ? `rgba(255,255,255,${alpha})`
      : `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = -scrollOffset; x <= W + cellW; x += cellW) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Horizontal lines (fewer)
    const ROWS = Math.ceil(COLS * (H / W));
    const cellH = H / ROWS;
    for (let y = 0; y <= H + cellH; y += cellH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ─── Particles ────────────────────────────────────────
  let particles = [];
  const CONNECT_DIST = 130;
  const REPEL_DIST   = 110;
  const REPEL_FORCE  = 0.6;

  function initParticles() {
    const count = Math.min(Math.floor((W * H) / 12000), 110);
    particles = Array.from({ length: count }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.32,
      vy: (Math.random() - 0.5) * 0.32,
      r:  Math.random() * 1.5 + 0.8,
      // original velocity for restoring
      bvx: 0, bvy: 0,
    }));
    particles.forEach(p => { p.bvx = p.vx; p.bvy = p.vy; });
  }

  function updateParticles() {
    const accent = getAccent();
    const { r, g, b } = hexToRgb(accent);
    const dark = isDark();

    particles.forEach(p => {
      // Mouse repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_DIST && dist > 0) {
        const force = (1 - dist / REPEL_DIST) * REPEL_FORCE;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      // Velocity damping & drift back toward base velocity
      p.vx = p.vx * 0.97 + p.bvx * 0.03;
      p.vy = p.vy * 0.97 + p.bvy * 0.03;

      // Speed cap
      const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (spd > 3) { p.vx = (p.vx / spd) * 3; p.vy = (p.vy / spd) * 3; }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    });

    // Draw connections
    const dotAlpha  = dark ? 0.55 : 0.45;
    const lineAlpha = dark ? 0.18 : 0.14;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DIST) {
          const a = (1 - dist / CONNECT_DIST) * lineAlpha;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    // Draw dots
    particles.forEach(p => {
      // Glow ring for particles near mouse
      const dx   = p.x - mouse.x;
      const dy   = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const closeAlpha = dist < REPEL_DIST
        ? dotAlpha + (1 - dist / REPEL_DIST) * 0.4
        : dotAlpha;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${closeAlpha})`;
      ctx.fill();
    });
  }

  // ─── Mouse tracking ───────────────────────────────────
  const onMouseMove = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };
  const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };

  window.addEventListener('mousemove',  onMouseMove, { passive: true });
  window.addEventListener('mouseleave', onMouseLeave, { passive: true });

  // Touch support
  window.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  // ─── Main loop ────────────────────────────────────────
  function draw(t) {
    if (!active) return;
    raf = requestAnimationFrame(draw);

    ctx.clearRect(0, 0, W, H);

    drawAurora(t);
    drawGrid(t);
    updateParticles();
  }

  // ─── Init ─────────────────────────────────────────────
  resize();
  raf = requestAnimationFrame(draw);

  // ─── Cleanup ──────────────────────────────────────────
  return function cleanup() {
    active = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize',     resize);
    window.removeEventListener('mousemove',  onMouseMove);
    window.removeEventListener('mouseleave', onMouseLeave);
    canvas.remove();
  };
}
