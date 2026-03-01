/**
 * sections/hero.js
 */

export function renderHero({ meta, about }, t) {
  const section = document.createElement('section');
  section.id = 'hero';

  section.innerHTML = `
    <div class="hero-glow"   aria-hidden="true"></div>
    <div class="hero-glow-2" aria-hidden="true"></div>
    <div class="hero-content">
      <p class="hero-eyebrow reveal">${meta.greeting}</p>
      <h1 class="hero-name reveal d1">
        <span class="accent">${meta.firstName}</span>${meta.lastName}
      </h1>
      <p class="hero-role reveal d2">
        <span class="typed-text" aria-live="polite"></span><span class="typed-cursor" aria-hidden="true">|</span>
      </p>
      <div class="hero-tags reveal d3" aria-label="Focus areas">
        ${about.tags.map(tag => `<span class="hero-tag">${tag}</span>`).join('')}
      </div>
      <div class="hero-cta reveal d4">
        <a href="#projects" class="btn btn-primary">
          ${t('cta_projects')}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>
        <a href="#contact" class="btn btn-secondary">${t('cta_contact')}</a>
      </div>
      ${meta.available ? `
        <div class="available-badge reveal d5" role="status">
          <span class="available-dot" aria-hidden="true"></span>
          ${t('available')}
        </div>
      ` : ''}
    </div>
    <div class="hero-scroll" aria-hidden="true">
      <span class="scroll-bar"></span>
      <span>${t('scroll')}</span>
    </div>
  `;

  // Typing animation
  const typedEl = section.querySelector('.typed-text');
  const roles   = meta.roles;
  let roleIdx = 0, charIdx = 0, deleting = false, timer;

  function tick() {
    const cur = roles[roleIdx];
    if (deleting) { typedEl.textContent = cur.slice(0, --charIdx); }
    else          { typedEl.textContent = cur.slice(0, ++charIdx); }
    let delay = deleting ? 45 : 95;
    if (!deleting && charIdx === cur.length) { delay = 2200; deleting = true; }
    else if (deleting && charIdx === 0)      { deleting = false; roleIdx = (roleIdx + 1) % roles.length; delay = 350; }
    timer = setTimeout(tick, delay);
  }
  setTimeout(tick, 900);

  return section;
}
