/**
 * sections/hero.js
 */

export function renderHero({ meta, about }, t) {
  const section = document.createElement('section');
  section.id = 'hero';

  section.innerHTML = `
    <div class="hero-glow"   aria-hidden="true"></div>
    <div class="hero-glow-2" aria-hidden="true"></div>

    <!-- Floating decorative code lines -->
    <div class="hero-deco" aria-hidden="true">
      <span class="deco-line deco-1">const dev = new Developer();</span>
      <span class="deco-line deco-2">// building cool stuff</span>
      <span class="deco-line deco-3">git commit -m "init 🚀"</span>
      <span class="deco-line deco-4">npm run deploy</span>
    </div>

    <div class="hero-content">
      <p class="hero-eyebrow reveal">
        <span class="eyebrow-dot"></span>${meta.greeting}
      </p>

      <h1 class="hero-name reveal d1">
        <span class="name-first">${meta.firstName}</span><span class="name-last">${meta.lastName}</span><span class="name-accent">.</span>
      </h1>

      <div class="hero-role-wrap reveal d2">
        <span class="role-bracket">&lt;</span>
        <span class="typed-text" aria-live="polite"></span>
        <span class="typed-cursor" aria-hidden="true">_</span>
        <span class="role-bracket">/&gt;</span>
      </div>

      ${meta.available ? `
        <div class="available-badge reveal d3" role="status">
          <span class="available-dot" aria-hidden="true"></span>
          ${t('available')}
        </div>
      ` : ''}

      <div class="hero-cta reveal d4">
        <a href="#projects" class="btn btn-primary">
          ${t('cta_projects')}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>
        <a href="#contact" class="btn btn-secondary">${t('cta_contact')}</a>
      </div>

      <!-- Quick stats row -->
      <div class="hero-stats reveal d5" aria-label="Quick stats">
        ${about.stats.map(s => `
          <div class="hero-stat">
            <span class="hero-stat-num">${s.number}</span>
            <span class="hero-stat-label">${s.label}</span>
          </div>
        `).join('<div class="hero-stat-divider" aria-hidden="true"></div>')}
      </div>
    </div>

    <!-- Side metadata strip -->
    <div class="hero-side" aria-hidden="true">
      <span class="hero-side-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        ${meta.location}
      </span>
      <div class="hero-side-line"></div>
      <span class="hero-side-year">${new Date().getFullYear()}</span>
    </div>
  `;

  // Typing animation
  const typedEl = section.querySelector('.typed-text');
  const roles   = meta.roles;
  let roleIdx = 0, charIdx = 0, deleting = false, timer;

  function tick() {
    const cur = roles[roleIdx];
    typedEl.textContent = deleting ? cur.slice(0, --charIdx) : cur.slice(0, ++charIdx);
    let delay = deleting ? 40 : 85;
    if (!deleting && charIdx === cur.length) { delay = 2400; deleting = true; }
    else if (deleting && charIdx === 0)      { deleting = false; roleIdx = (roleIdx + 1) % roles.length; delay = 400; }
    timer = setTimeout(tick, delay);
  }
  setTimeout(tick, 1000);

  // Name glitch hover
  const nameEl = section.querySelector('.hero-name');
  if (nameEl) {
    nameEl.addEventListener('mouseenter', () => nameEl.classList.add('glitch'));
    nameEl.addEventListener('animationend', () => nameEl.classList.remove('glitch'));
  }

  return section;
}
