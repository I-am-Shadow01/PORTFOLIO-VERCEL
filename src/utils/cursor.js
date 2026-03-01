/**
 * utils/cursor.js
 * Custom cursor — dot + smooth-following ring
 */

export function initCursor() {
  // Skip on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot  = Object.assign(document.createElement('div'), { className: 'cursor-dot' });
  const ring = Object.assign(document.createElement('div'), { className: 'cursor-ring' });
  document.body.append(dot, ring);

  let mx = -100, my = -100;
  let rx = -100, ry = -100;
  let raf;

  // Instant dot follows mouse
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  // Smooth ring lerp
  function lerp(a, b, t) { return a + (b - a) * t; }
  function loop() {
    rx = lerp(rx, mx, 0.13);
    ry = lerp(ry, my, 0.13);
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    raf = requestAnimationFrame(loop);
  }
  loop();

  // Hover state
  const HOVER_SELECTOR = 'a, button, [role="button"], .skill-tag, .project-card, .contact-item, .stat-card';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER_SELECTOR)) ring.classList.add('hover');
  }, { passive: true });

  document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVER_SELECTOR)) ring.classList.remove('hover');
  }, { passive: true });

  // Click pulse
  document.addEventListener('mousedown', () => ring.classList.add('click'));
  document.addEventListener('mouseup',   () => ring.classList.remove('click'));

  // Visibility
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });
}
