/**
 * utils/cursor.js
 * Custom cursor — adds .cursor-active to <body> for CSS cursor:none
 * Returns a cleanup function
 */

export function initCursor() {
  // Skip on touch-primary devices
  if (window.matchMedia('(pointer: coarse)').matches) return () => {};

  const dot  = Object.assign(document.createElement('div'), { className: 'cursor-dot' });
  const ring = Object.assign(document.createElement('div'), { className: 'cursor-ring' });
  document.body.append(dot, ring);
  document.body.classList.add('cursor-active');

  let mx = -200, my = -200, rx = -200, ry = -200;
  let raf, active = true;

  const onMove = (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  };

  const HOVER = [
    'a', 'button', '[role="button"]',
    '.skill-tag', '.project-card', '.contact-item',
    '.stat-card', '.sp-seg-btn', '.sp-swatch',
    '.sp-toggle', '.sp-reset', '.sp-close',
    '.settings-trigger',
  ].join(',');

  const onOver  = e => { if (e.target.closest(HOVER)) ring.classList.add('hover'); };
  const onOut   = e => { if (e.target.closest(HOVER)) ring.classList.remove('hover'); };
  const onDown  = () => ring.classList.add('click');
  const onUp    = () => ring.classList.remove('click');
  const onLeave = () => { dot.style.opacity = '0'; ring.style.opacity = '0'; };
  const onEnter = () => { dot.style.opacity = '1'; ring.style.opacity = '1'; };

  document.addEventListener('mousemove',  onMove);
  document.addEventListener('mouseover',  onOver,  { passive: true });
  document.addEventListener('mouseout',   onOut,   { passive: true });
  document.addEventListener('mousedown',  onDown);
  document.addEventListener('mouseup',    onUp);
  document.addEventListener('mouseleave', onLeave);
  document.addEventListener('mouseenter', onEnter);

  function lerp(a, b, t) { return a + (b - a) * t; }
  function loop() {
    if (!active) return;
    rx = lerp(rx, mx, 0.13);
    ry = lerp(ry, my, 0.13);
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    raf = requestAnimationFrame(loop);
  }
  loop();

  // ── Cleanup ──────────────────────────────────────────
  return function cleanup() {
    active = false;
    cancelAnimationFrame(raf);
    document.removeEventListener('mousemove',  onMove);
    document.removeEventListener('mouseover',  onOver);
    document.removeEventListener('mouseout',   onOut);
    document.removeEventListener('mousedown',  onDown);
    document.removeEventListener('mouseup',    onUp);
    document.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('mouseenter', onEnter);
    dot.remove();
    ring.remove();
    // Remove cursor-active so native cursor returns
    document.body.classList.remove('cursor-active');
  };
}
