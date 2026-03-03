export function renderHero({ meta, about }, t) {
  const s = document.createElement('section');
  s.id = 'hero';
  s.innerHTML = `
    <div class="hero-deco" aria-hidden="true">
      <span class="deco-line deco-1">const dev = new Developer();</span>
      <span class="deco-line deco-2">// always shipping ✦</span>
      <span class="deco-line deco-3">git push origin main</span>
      <span class="deco-line deco-4">npm run deploy</span>
    </div>
    <div class="hero-content">
      <p class="hero-eyebrow reveal"><span class="eyebrow-dot"></span>${meta.greeting}</p>
      <h1 class="hero-name reveal d1">
        <span class="name-first">${meta.firstName}</span><span class="name-last">${meta.lastName}</span><span class="name-dot">.</span>
      </h1>
      <div class="hero-role reveal d2">
        <span class="role-br">&lt;</span>
        <span class="typed-text" aria-live="polite"></span>
        <span class="typed-cur" aria-hidden="true">_</span>
        <span class="role-br">/&gt;</span>
      </div>
      ${meta.available ? `
        <div class="avail-badge reveal d3">
          <span class="avail-dot"></span>${t('available')}
        </div>` : ''}
      <div class="hero-cta reveal d4">
        <button class="btn btn-primary" onclick="window.__go('projects')">
          ${t('cta_projects')}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
        <button class="btn btn-ghost" onclick="window.__go('contact')">${t('cta_contact')}</button>
      </div>
      <div class="hero-stats glass reveal d5">
        ${about.stats.map(s=>`
          <div class="hstat">
            <span class="hstat-n">${s.number}</span>
            <span class="hstat-l">${s.label}</span>
          </div>
        `).join('<div class="hstat-sep"></div>')}
      </div>
    </div>
    <div class="hero-side" aria-hidden="true">
      <span class="hero-loc">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        ${meta.location}
      </span>
      <div class="hero-side-line"></div>
      <span class="hero-yr">${new Date().getFullYear()}</span>
    </div>
  `;

  // Typing animation
  const el = s.querySelector('.typed-text');
  let ri=0, ci=0, del=false;
  function tick() {
    const cur = meta.roles[ri];
    el.textContent = del ? cur.slice(0,--ci) : cur.slice(0,++ci);
    let d = del ? 38 : 82;
    if (!del && ci===cur.length) { d=2400; del=true; }
    else if (del && ci===0) { del=false; ri=(ri+1)%meta.roles.length; d=380; }
    setTimeout(tick, d);
  }
  setTimeout(tick, 900);

  // Glitch on name hover
  const name = s.querySelector('.hero-name');
  name?.addEventListener('mouseenter', ()=>name.classList.add('glitch'));
  name?.addEventListener('animationend',  ()=>name.classList.remove('glitch'));

  return s;
}
