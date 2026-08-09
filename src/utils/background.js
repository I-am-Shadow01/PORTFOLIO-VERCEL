/**
 * Mathematical background — one canvas, capped frame rate, no dependencies.
 *
 * The composition combines a perspective lattice, a rotating torus projection,
 * and a multiplication-table curve. Quality changes only the line density and
 * refresh rate, keeping the visual language consistent on every device.
 */
import { getSettings, onSettingsChange } from './settings.js';

const FRAME_RATE = { eco: 20, medium: 30, performance: 45 };
const QUALITY = {
  eco: { rings: 8, segments: 28, chords: 72 },
  medium: { rings: 12, segments: 40, chords: 120 },
  performance: { rings: 16, segments: 56, chords: 180 },
};

function hexToRgb(hex) {
  const value = (hex || '#D8B777').replace('#', '');
  const normalized = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16) || 216,
    g: Number.parseInt(normalized.slice(2, 4), 16) || 183,
    b: Number.parseInt(normalized.slice(4, 6), 16) || 119,
  };
}

export function initBackground() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none',
  });
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0;
  let height = 0;
  let active = true;
  let visible = !document.hidden;
  let lastFrame = 0;
  let accent = hexToRgb(getSettings().accent);
  let pointer = { x: -1, y: -1 };

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function stroke(alpha, lineWidth = 1) {
    ctx.strokeStyle = `rgba(${accent.r},${accent.g},${accent.b},${alpha})`;
    ctx.lineWidth = lineWidth;
  }

  function drawLattice(time) {
    const horizon = height * 0.62;
    const centreX = width * 0.5;
    const spacing = Math.max(52, Math.min(width, height) * 0.075);
    stroke(0.075, 0.7);
    ctx.beginPath();
    for (let i = -10; i <= 10; i += 1) {
      const x = centreX + i * spacing;
      ctx.moveTo(centreX + (x - centreX) * 0.13, horizon);
      ctx.lineTo(x, height + 50);
    }
    for (let i = 1; i < 15; i += 1) {
      const depth = i / 15;
      const y = horizon + Math.pow(depth, 1.85) * (height - horizon + 35);
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    const shimmerX = pointer.x > 0 ? pointer.x : centreX + Math.sin(time * 0.00018) * width * 0.18;
    const glow = ctx.createRadialGradient(shimmerX, horizon, 0, shimmerX, horizon, Math.min(width, height) * 0.5);
    glow.addColorStop(0, `rgba(${accent.r},${accent.g},${accent.b},0.09)`);
    glow.addColorStop(1, `rgba(${accent.r},${accent.g},${accent.b},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizon - 100, width, height - horizon + 100);
  }

  function drawTorus(time, quality) {
    const cx = width * 0.76;
    const cy = height * 0.38;
    const scale = Math.min(width, height) * 0.105;
    const major = 1.38;
    const minor = 0.54;
    const yaw = time * 0.00022 + (pointer.x > 0 ? (pointer.x / width - 0.5) * 0.7 : 0);
    const pitch = 0.58 + (pointer.y > 0 ? (pointer.y / height - 0.5) * 0.42 : 0);
    const project = (u, v) => {
      const x = (major + minor * Math.cos(v)) * Math.cos(u);
      const y = (major + minor * Math.cos(v)) * Math.sin(u);
      const z = minor * Math.sin(v);
      const rx = x * Math.cos(yaw) - z * Math.sin(yaw);
      const rz = x * Math.sin(yaw) + z * Math.cos(yaw);
      const ry = y * Math.cos(pitch) - rz * Math.sin(pitch);
      const depth = 1 + (y * Math.sin(pitch) + rz * Math.cos(pitch)) * 0.13;
      return [cx + (rx / depth) * scale, cy + (ry / depth) * scale];
    };
    stroke(0.24, 0.75);
    for (let ring = 0; ring < quality.rings; ring += 1) {
      ctx.beginPath();
      for (let step = 0; step <= quality.segments; step += 1) {
        const p = project((step / quality.segments) * Math.PI * 2, (ring / quality.rings) * Math.PI * 2);
        step ? ctx.lineTo(...p) : ctx.moveTo(...p);
      }
      ctx.stroke();
    }
    stroke(0.13, 0.55);
    for (let arc = 0; arc < quality.rings; arc += 1) {
      ctx.beginPath();
      for (let step = 0; step <= quality.segments; step += 1) {
        const p = project((arc / quality.rings) * Math.PI * 2, (step / quality.segments) * Math.PI * 2);
        step ? ctx.lineTo(...p) : ctx.moveTo(...p);
      }
      ctx.stroke();
    }
  }

  function drawChordField(time, quality) {
    const cx = width * 0.25;
    const cy = height * 0.42;
    const radius = Math.min(width, height) * 0.23;
    const multiplier = 2.3 + (Math.sin(time * 0.00011) + 1) * 8.7;
    const rotation = time * 0.00005;
    stroke(0.16, 0.65);
    ctx.beginPath();
    for (let i = 0; i < quality.chords; i += 1) {
      const a = (i / quality.chords) * Math.PI * 2 + rotation;
      const b = ((i * multiplier) / quality.chords) * Math.PI * 2 + rotation;
      ctx.moveTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
      ctx.lineTo(cx + Math.cos(b) * radius, cy + Math.sin(b) * radius);
    }
    ctx.stroke();
    stroke(0.3, 0.9);
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  }

  function render(time) {
    if (!active) return;
    requestAnimationFrame(render);
    if (!visible) return;
    const mode = getSettings().perfMode || 'medium';
    if (time - lastFrame < 1000 / FRAME_RATE[mode]) return;
    lastFrame = time;
    ctx.clearRect(0, 0, width, height);
    drawLattice(time);
    drawChordField(time, QUALITY[mode]);
    drawTorus(time, QUALITY[mode]);
  }

  const unsubscribe = onSettingsChange((settings) => { accent = hexToRgb(settings.accent); });
  const onPointerMove = (event) => { pointer = { x: event.clientX, y: event.clientY }; };
  const onVisibilityChange = () => { visible = !document.hidden; };
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  resize();
  requestAnimationFrame(render);

  return () => {
    active = false;
    unsubscribe();
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    canvas.remove();
  };
}
