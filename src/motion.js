// One observer governs secondary CSS motion; no extra animation loop.
export function startEditorialMotion(root = document) {
  const elements = [...root.querySelectorAll('.featured-stage, .card-art, .hero-copy')];
  if (!elements.length) return () => {};

  let active = true;
  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
        for (const entry of entries) {
          entry.target.classList.toggle('motion-idle', !entry.isIntersecting);
          if (entry.isIntersecting) entry.target.classList.add('motion-seen');
        }
      }, { rootMargin: '100px 0px 100px 0px', threshold: 0 })
    : null;

  elements.forEach(element => observer?.observe(element));

  const handleVisibility = () => {
    if (!active) return;
    root.documentElement.classList.toggle('motion-suspended', document.hidden);
  };
  document.addEventListener('visibilitychange', handleVisibility);
  handleVisibility();

  return () => {
    active = false;
    observer?.disconnect();
    document.removeEventListener('visibilitychange', handleVisibility);
    document.documentElement.classList.remove('motion-suspended');
    elements.forEach(element => element.classList.remove('motion-idle', 'motion-seen'));
  };
}
