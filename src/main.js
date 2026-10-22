import { COPY, PROJECTS, GITHUB, EMAIL } from './content.js';
import { startSculpture } from './scene.js';

const icon = {
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  out: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  git: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.162 19.487c.5.093.682-.217.682-.482l-.013-1.7c-2.782.603-3.369-1.341-3.369-1.341-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.087 2.91.831.09-.646.349-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.254-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.026A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.026 2.748-1.026.546 1.376.202 2.394.1 2.646.64.698 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10 10 0 0 0 12 2z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.2 15.5A8.5 8.5 0 0 1 8.5 3.8 8.5 8.5 0 1 0 20.2 15.5Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>'
};
const esc = v => String(v ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
function read(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
function save(key, val) { try { localStorage.setItem(key, val); } catch {} }
let locale = read('cid.locale', navigator.language?.toLowerCase().startsWith('th') ? 'th' : 'en');
if (!(locale in COPY)) locale = 'en';
let theme = read('cid.theme', 'dark') === 'light' ? 'light' : 'dark';
let stopScene = () => {}, revealObserver;

const tags = list => `<div class="tag-list">${list.map(s => `<span>${esc(s)}</span>`).join('')}</div>`;
const repoUrl = p => `${GITHUB}/${encodeURIComponent(p.repo)}`;

function projectArtwork(p) {
  if (p.id === 'native-c-bot') return `<div class="art-network" aria-hidden="true">
    <svg viewBox="0 0 400 270" fill="none"><path d="M54 134H346M200 28V242M94 75l212 120M94 195 306 75" stroke="currentColor" stroke-opacity=".17"/><circle cx="200" cy="135" r="69" stroke="currentColor" stroke-opacity=".5"/><circle cx="200" cy="135" r="42" fill="currentColor" fill-opacity=".08" stroke="currentColor"/><circle cx="200" cy="135" r="6" fill="currentColor"/><circle cx="54" cy="134" r="5" fill="currentColor"/><circle cx="346" cy="134" r="5" fill="currentColor"/><circle cx="94" cy="75" r="5" fill="currentColor"/><circle cx="306" cy="195" r="5" fill="currentColor"/></svg>
    <span class="network-center">C / API</span><span class="network-label">ASYNC / CONTEXT / HTTP</span></div>`;
  if (p.id === 'translate-unlocker') return `<div class="art-type" aria-hidden="true"><div><span>あ</span><b>→</b><span>A</span></div><small>UNBLOCK / TRANSLATE</small><div class="type-underline"></div></div>`;
  return `<div class="art-sound" aria-hidden="true"><div class="record-disc"><div class="record-core"></div></div><div class="sound-waves">${Array.from({ length: 18 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div><small>QUEUE / PLAYBACK / CONTROL</small></div>`;
}

function smallProject(p, t) {
  const d = p[locale];
  return `<article class="work-card reveal" id="${esc(p.id)}">
    <div class="card-art card-art-${esc(p.id)}"><div class="card-art-index">${esc(p.number)} / 04</div>${projectArtwork(p)}</div>
    <div class="card-content">
      <div class="card-meta"><span>${esc(p.kind)}</span><span>2026</span></div>
      <h3>${esc(p.title)}</h3><p>${esc(d.description)}</p>${tags(p.tech)}
      <details class="project-details"><summary>${esc(t.details)} <span class="details-plus">+</span></summary>
        <div class="details-body"><h4>${esc(t.challenge)}</h4><p>${esc(d.challenge)}</p><h4>${esc(t.solution)}</h4><p>${esc(d.solution)}</p></div>
      </details>
      <a class="inline-link" href="${esc(repoUrl(p))}" target="_blank" rel="noopener noreferrer">${esc(t.source)} ${icon.out}<span class="sr-only">${esc(t.external)}</span></a>
    </div>
  </article>`;
}

function render() {
  const t = COPY[locale], f = PROJECTS[0], d = f[locale];
  document.documentElement.lang = locale;
  document.documentElement.dataset.theme = theme;
  document.querySelector('.skip-link').textContent = t.skip;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0b0e17' : '#f4f4f1';
  document.getElementById('app').innerHTML = `
    <header class="site-header" id="top">
      <div class="header-inner wrap">
        <a href="#top" class="brand" aria-label="CID home">cid<span>.</span><i>/</i></a>
        <nav class="desktop-nav" aria-label="Main navigation">
          <a href="#work">${esc(t.navWork)}</a><a href="#approach">${esc(t.navApproach)}</a><a href="#now">${esc(t.navNow)}</a><a href="#contact">${esc(t.navContact)}</a>
        </nav>
        <div class="header-controls">
          <button type="button" class="icon-button theme-toggle" aria-label="${esc(t.switchTheme)}" aria-pressed="${theme === 'light'}">${theme === 'dark' ? icon.sun : icon.moon}</button>
          <button type="button" class="lang-button" aria-label="${esc(t.switchLanguage)}"><span class="${locale === 'th' ? 'chosen' : ''}">TH</span><i></i><span class="${locale === 'en' ? 'chosen' : ''}">EN</span></button>
          <button type="button" class="menu-button" aria-label="${esc(t.menu)}" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span></button>
        </div>
      </div>
      <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation" inert>
        <a href="#work">${esc(t.navWork)}</a><a href="#approach">${esc(t.navApproach)}</a><a href="#now">${esc(t.navNow)}</a><a href="#contact">${esc(t.navContact)}</a>
      </nav>
    </header>

    <main id="main">
      <section class="hero wrap" aria-labelledby="hero-title">
        <div class="hero-copy">
          <div class="eyebrow hero-eyebrow"><span class="signal-dot"></span>${esc(t.topLabel)}</div>
          <h1 id="hero-title"><span>${esc(t.heroOne)}</span><span>${esc(t.heroTwo)}</span><em>${esc(t.heroThree)}</em></h1>
          <p class="hero-intro">${esc(t.intro)}</p>
          <div class="hero-actions">
            <a href="#work" class="button button-primary">${esc(t.explore)} ${icon.arrow}</a>
            <a href="${esc(GITHUB)}" class="button button-quiet" target="_blank" rel="noopener noreferrer">${icon.git} ${esc(t.github)} ${icon.out}</a>
          </div>
          <div class="hero-scroll"><span class="scroll-line"></span>${esc(t.scroll)}</div>
        </div>
        <div class="hero-art">
          <div class="sculpture" id="sculpture">
            <div class="sculpture-fallback" aria-hidden="true"></div>
            <canvas id="hero-canvas" aria-hidden="true"></canvas>
            <div class="sculpture-frame" aria-hidden="true"><span>FIG. 01</span><span>GENERATIVE / WEBGL</span></div>
            <div class="sculpture-cross" aria-hidden="true"></div>
          </div>
          <div class="art-caption"><span>${esc(t.artLabel)}</span><span>${esc(t.artifactCaption)}</span></div>
        </div>
      </section>

      <section class="work-section section-pad" id="work" aria-labelledby="work-title"><div class="wrap">
        <div class="section-heading reveal"><div class="eyebrow">${esc(t.workKicker)}</div><div class="section-heading-row"><h2 id="work-title">${esc(t.workTitle)}</h2><p>${esc(t.workLead)}</p></div></div>
        <article class="featured-work reveal" aria-labelledby="feature-title">
          <div class="featured-stage">
            <div class="stage-annot stage-top"><span>01 / ${esc(t.featureBadge)}</span><span>ANDROID</span></div>
            <div class="album-geometry" aria-hidden="true"><div class="album-shadow"></div><div class="album-disc"><div class="album-disc-inner"><div class="album-eye"></div></div></div>
              <div class="album-wave">${Array.from({ length: 25 }, (_, i) => `<span style="--i:${i}"></span>`).join('')}</div></div>
            <div class="stage-annot stage-bottom"><span>AUDIO / INTERACTION</span><span>VISUAL STUDY • NOT A SCREENSHOT</span></div>
          </div>
          <div class="featured-copy"><div class="eyebrow"><span class="small-dot"></span>${esc(t.featureBadge)} · 2026</div>
            <h3 id="feature-title">${esc(f.title)}</h3><p class="feature-desc">${esc(d.description)}</p>
            <div class="feature-facts"><div><span>01 / ${esc(t.challenge)}</span><p>${esc(d.challenge)}</p></div>
              <div><span>02 / ${esc(t.solution)}</span><p>${esc(d.solution)}</p></div></div>
            ${tags(f.tech)}
            <a href="${esc(repoUrl(f))}" target="_blank" rel="noopener noreferrer" class="feature-link">${esc(t.featureView)} ${icon.out}<span class="sr-only">${esc(t.external)}</span></a>
          </div>
        </article>
        <div class="more-heading reveal"><span>${esc(t.moreTitle)}</span><span>02—04 / ${esc(t.projectCount)}</span></div>
        <div class="work-grid">${PROJECTS.slice(1).map(p => smallProject(p, t)).join('')}</div>
      </div></section>

      <section class="approach-section section-pad" id="approach" aria-labelledby="approach-title"><div class="wrap approach-layout">
        <div class="approach-intro reveal"><div class="eyebrow">${esc(t.approachKicker)}</div>
          <h2 id="approach-title">${esc(t.approachTitle)}</h2><p>${esc(t.approachLead)}</p>
          <div class="approach-signet" aria-hidden="true"><span>↗</span><span>C / 26</span></div>
        </div>
        <div class="principles">${[1,2,3].map(n => `<div class="principle reveal"><span class="principle-number">0${n}</span>
          <div><h3>${esc(t[`principle${n}Title`])}</h3><p>${esc(t[`principle${n}Body`])}</p></div><span class="principle-arrow" aria-hidden="true">↗</span></div>`).join('')}</div>
      </div></section>

      <section class="now-section section-pad" id="now" aria-labelledby="now-title"><div class="wrap">
        <div class="section-heading reveal"><div class="eyebrow">${esc(t.nowKicker)}</div>
          <div class="section-heading-row"><h2 id="now-title">${esc(t.nowTitle)}</h2><p>${esc(t.nowLead)}</p></div></div>
        <div class="exploration-grid">${[1,2,3].map(n => `<article class="exploration reveal">
          <span class="exploration-top"><span>0${n} / 03</span><span>↗</span></span>
          <div class="exploration-symbol symbol-${n}" aria-hidden="true">${n === 1 ? '∿' : n === 2 ? '⌘' : '◌'}</div>
          <h3>${esc(t[`now${n}`])}</h3><p>${esc(t[`now${n}Detail`])}</p>
        </article>`).join('')}</div>
      </div></section>

      <section class="contact-section section-pad" id="contact" aria-labelledby="contact-title">
        <div class="wrap contact-inner reveal"><div class="eyebrow">${esc(t.contactKicker)}</div>
          <h2 id="contact-title">${esc(t.contactTitle)}</h2><p>${esc(t.contactLead)}</p>
          <div class="contact-actions"><a href="mailto:${esc(EMAIL)}" class="button contact-primary">${esc(t.contactEmail)} ${icon.out}</a>
            <a href="${esc(GITHUB)}" class="button contact-secondary" target="_blank" rel="noopener noreferrer">${icon.git} ${esc(t.openGithub)}</a></div>
          <button type="button" class="copy-email" aria-label="${esc(t.copyEmail)}">${esc(EMAIL)} ${icon.copy}</button>
          <span class="copy-status" role="status" aria-live="polite"></span>
        </div>
      </section>
    </main>
    <footer class="footer"><div class="wrap footer-inner">
      <a href="#top" class="brand" aria-label="CID home">cid<span>.</span><i>/</i></a>
      <span>© ${new Date().getFullYear()} CID. ${esc(t.footer)}</span>
      <a href="#top" class="back-to-top">${esc(t.footerTop)} ↑</a>
    </div></footer>`;
}

function bind() {
  const menu = document.querySelector('.menu-button'), mobile = document.getElementById('mobile-nav');
  const setMenu = isOpen => {
    menu.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-label', isOpen ? COPY[locale].closeMenu : COPY[locale].menu);
    menu.classList.toggle('open', isOpen);
    mobile.classList.toggle('open', isOpen);
    mobile.inert = !isOpen;
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', onEscape);
  function onEscape(e) {
    if (e.key === 'Escape') setMenu(false);
    if (!document.contains(menu)) document.removeEventListener('keydown', onEscape);
  }
  document.querySelector('.lang-button').addEventListener('click', () => {
    locale = locale === 'th' ? 'en' : 'th'; save('cid.locale', locale); rerender();
  });
  document.querySelector('.theme-toggle').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark'; save('cid.theme', theme);
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0b0e17' : '#f4f4f1';
    const b = document.querySelector('.theme-toggle');
    b.innerHTML = theme === 'dark' ? icon.sun : icon.moon;
    b.setAttribute('aria-pressed', String(theme === 'light'));
  });
  document.querySelector('.copy-email').addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    try { await navigator.clipboard.writeText(EMAIL); status.textContent = COPY[locale].copied; }
    catch { status.textContent = EMAIL; }
  });
}

function observeReveal() {
  revealObserver?.disconnect();
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); revealObserver.unobserve(entry.target); }
  }), { threshold: .07, rootMargin: '0px 0px 60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => { el.classList.add('reveal-ready'); revealObserver.observe(el); });
}
function rerender() {
  stopScene();
  render();
  bind();
  observeReveal();
  stopScene = startSculpture(document.getElementById('hero-canvas'), document.getElementById('sculpture'));
}
rerender();