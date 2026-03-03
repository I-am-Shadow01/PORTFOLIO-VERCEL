/**
 * smoothscroll.js
 * Exposes window.__go(id) — callable from any inline or attached handler
 */

export function initSmoothScroll() {
  // Strip hash immediately
  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }

  // Global scroll function — used everywhere
  window.__go = function(id) {
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    const target = document.getElementById(id);
    if (!target) return;
    const root = document.getElementById('__root__');
    const scroller = root || window;
    const scrollTop = root ? root.scrollTop : window.scrollY;
    const top = target.getBoundingClientRect().top + scrollTop - 64;
    scroller.scrollTo({ top, behavior: 'smooth' });
  };
}
