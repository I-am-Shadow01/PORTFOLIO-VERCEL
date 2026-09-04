/**
 * smoothscroll.js
 * Exposes window.__go(id) — callable from any inline or attached handler
 *
 * เดิมสมมติว่า #__root__ คือ scroller เสมอ ทั้งที่หน้าจริง scroll บน window
 * → คลิก nav แล้วไม่เลื่อนเลย ตอนนี้ใช้ scroller detection จาก loop.js
 */

import { scrollToTop, getScrollerEl } from './loop.js';

export function initSmoothScroll() {
  // Strip hash immediately
  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }

  // Global scroll function — used everywhere
  window.__go = function (id) {
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    const target = document.getElementById(id);
    if (!target) return;

    const scroller = getScrollerEl();
    const scrollTop = (scroller && scroller !== window)
      ? scroller.scrollTop
      : (window.scrollY || document.documentElement.scrollTop || 0);
    const top = target.getBoundingClientRect().top + scrollTop - 64;
    scrollToTop(Math.max(0, top));
  };
}
