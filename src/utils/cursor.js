/**
 * utils/cursor.js — Custom cursor (v2: ขับเคลื่อนจาก loop กลาง ไม่มี rAF ของตัวเอง)
 * Adds .cursor-active to <body> for CSS cursor:none. Returns a cleanup function.
 */

import { onFrame, getPointer } from './loop.js';

export function initCursor() {
  // Skip on touch-primary devices
  if (window.matchMedia('(pointer: coarse)').matches) return () => {};

  const dot  = Object.assign(document.createElement('div'), { className: 'cursor-dot' });
  const ring = Object.assign(document.createElement('div'), { className: 'cursor-ring' });
  document.body.append(dot, ring);
  document.body.classList.add('cursor-active');

  let rx = -200, ry = -200;
  let visible = false;

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
  const onLeave = () => { dot.style.opacity = '0'; ring.style.opacity = '0'; visible = false; };
  const onEnter = () => { dot.style.opacity = '1'; ring.style.opacity = '1'; visible = true; };

  document.addEventListener('mouseover',  onOver,  { passive: true });
  document.addEventListener('mouseout',   onOut,   { passive: true });
  document.addEventListener('mousedown',  onDown);
  document.addEventListener('mouseup',    onUp);
  document.addEventListener('mouseleave', onLeave);
  document.addEventListener('mouseenter', onEnter);

  // dot ตามทันที, ring ค่อยๆ เลื้อยตาม — ทำในเฟรมเดียวกับ background
  const unsub = onFrame(() => {
    const p = getPointer();
    if (p.inside) {
      if (!visible) { visible = true; dot.style.opacity = '1'; ring.style.opacity = '1'; rx = p.x; ry = p.y; }
      // ใช้ left/top ตาม CSS เดิม (will-change:left,top) เพื่อให้ .hover/.click
      // ที่คุม transform ผ่าน CSS ยังทำงานได้
      dot.style.left = p.x + 'px';
      dot.style.top  = p.y + 'px';
      rx += (p.x - rx) * 0.13;
      ry += (p.y - ry) * 0.13;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
    }
  });

  return function cleanup() {
    unsub();
    document.removeEventListener('mouseover',  onOver);
    document.removeEventListener('mouseout',   onOut);
    document.removeEventListener('mousedown',  onDown);
    document.removeEventListener('mouseup',    onUp);
    document.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('mouseenter', onEnter);
    dot.remove();
    ring.remove();
    document.body.classList.remove('cursor-active');
  };
}
