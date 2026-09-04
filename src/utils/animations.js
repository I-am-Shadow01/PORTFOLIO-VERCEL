/**
 * utils/animations.js
 * Scroll-triggered reveal animations via IntersectionObserver
 */

let _observer = null;

export function initAnimations() {
  // rebuild เนื้อหา (สลับภาษา) จะเรียกซ้ำ — disconnect ตัวเก่าก่อน กัน observer ค้าง
  _observer?.disconnect();
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

  _observer = observer;

  // Observe all .reveal elements
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Hero is visible on load — reveal immediately with slight stagger
  requestAnimationFrame(() => {
    document.querySelectorAll('#hero .reveal').forEach(el => el.classList.add('in'));
  });
}
