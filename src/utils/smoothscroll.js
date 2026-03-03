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
    // getBoundingClientRect is reliable for any element depth
    const top = target.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: 'smooth' });
  };
}
