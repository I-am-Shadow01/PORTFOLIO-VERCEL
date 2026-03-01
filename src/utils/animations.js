/**
 * utils/animations.js
 * Scroll-triggered reveal animations via IntersectionObserver
 */

export function initAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target); // one-shot: unobserve after reveal
        }
      });
    },
    {
      threshold:  0.08,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  // Observe all .reveal elements
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Hero is visible on load — reveal immediately with slight stagger
  requestAnimationFrame(() => {
    document.querySelectorAll('#hero .reveal').forEach(el => el.classList.add('in'));
  });
}
