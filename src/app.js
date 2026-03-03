/**
 * app.js — Entry point
 */

import { CONFIG }                        from './config.js';
import { renderHero }                    from './sections/hero.js';
import { renderAbout }                   from './sections/about.js';
import { renderSkills }                  from './sections/skills.js';
import { renderProjects }                from './sections/projects.js';
import { renderContact }                 from './sections/contact.js';
import { initCursor }                    from './utils/cursor.js';
import { initAnimations }                from './utils/animations.js';
import { initBackground }                from './utils/background.js';
import { initSmoothScroll }              from './utils/smoothscroll.js';
import { loadSettings, applySettings,
         watchSystemTheme, getSettings } from './utils/settings.js';
import { createSettingsPanel }           from './components/settings-panel.js';
import { createT }                       from './i18n.js';

// ─── Nav ────────────────────────────────────────────────────
function createNav(t) {
  const nav = document.createElement('nav');
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  const items = [
    { href: '#about',    key: 'nav_about'    },
    { href: '#skills',   key: 'nav_skills'   },
    { href: '#projects', key: 'nav_projects' },
    { href: '#contact',  key: 'nav_contact'  },
  ];

  nav.innerHTML = `
    <a href="#hero" class="nav-logo" aria-label="Home">
      ${CONFIG.meta.firstName}<span>.</span>
    </a>
    <ul class="nav-links" role="list">
      ${items.map(i => `<li><a href="${i.href}">${t(i.key)}</a></li>`).join('')}
    </ul>
    <button class="nav-hamburger" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <div class="nav-mobile" role="dialog" aria-label="Mobile navigation">
      ${items.map(i => `<a href="${i.href}">${t(i.key)}</a>`).join('')}
    </div>
  `;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveLink(nav);
  }, { passive: true });

  const hamburger  = nav.querySelector('.nav-hamburger');
  const mobileMenu = nav.querySelector('.nav-mobile');

  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  return nav;
}

function updateActiveLink(nav) {
  const scrollY = window.scrollY + 140;
  let activeId  = 'hero';
  document.querySelectorAll('section[id]').forEach(s => {
    if (s.offsetTop <= scrollY) activeId = s.id;
  });
  nav.querySelectorAll('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href').replace('#', '');
    a.classList.toggle('active', id === activeId);
  });
}

// ─── Footer ────────────────────────────────────────────────
function createFooter(t) {
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <p class="footer-copy">
      © ${new Date().getFullYear()} <span>${CONFIG.meta.fullName}</span>
    </p>
    <a href="#hero" class="footer-top" aria-label="${t('back_top')}">
      ${t('back_top')}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </a>
  `;
  return footer;
}

// ─── Scroll progress bar ───────────────────────────────────
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
}

// ─── Spotlight (project cards) ──────────────────────────────
function initProjectSpotlight() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

// ─── Cursor controller ─────────────────────────────────────
let _cursorCleanup = null;

function syncCursor() {
  const { cursor } = getSettings();
  if (cursor && !_cursorCleanup) {
    _cursorCleanup = initCursor();
  } else if (!cursor && _cursorCleanup) {
    _cursorCleanup();
    _cursorCleanup = null;
  }
}

// ─── Background controller ─────────────────────────────────
let _bgCleanup = null;

function syncBackground() {
  const { bgfx } = getSettings();
  if (bgfx && !_bgCleanup) {
    _bgCleanup = initBackground();
  } else if (!bgfx && _bgCleanup) {
    _bgCleanup();
    _bgCleanup = null;
  }
}

// ─── Stylesheet ─────────────────────────────────────────────
function loadStyles() {
  return new Promise(resolve => {
    if (document.querySelector('link[href*="styles.css"]')) return resolve();
    const link  = document.createElement('link');
    link.rel    = 'stylesheet';
    link.href   = './src/styles.css';
    link.onload  = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

// ─── Head meta ──────────────────────────────────────────────
function injectMeta() {
  document.title = `${CONFIG.meta.fullName} — Portfolio`;
  const metas = [
    { name: 'description', content: `${CONFIG.meta.fullName} — ${CONFIG.meta.roles[0]}. Portfolio.` },
    { name: 'theme-color',  content: '#090909' },
  ];
  metas.forEach(m => {
    let el = document.head.querySelector(`meta[name="${m.name}"]`);
    if (!el) {
      el = document.createElement('meta');
      Object.entries(m).forEach(([k,v]) => el.setAttribute(k,v));
      document.head.appendChild(el);
    } else {
      el.content = m.content;
    }
  });
}

// ─── Full page render ───────────────────────────────────────
let _initialized = false;

async function render() {
  const root = document.getElementById('__root__');
  const t    = createT(getSettings());

  if (!_initialized) {
    await loadStyles();
    injectMeta();

    const { panel, trigger, backdrop } = createSettingsPanel();

    root.innerHTML = '';
    root.appendChild(createNav(t));
    root.appendChild(renderHero(CONFIG, t));
    root.appendChild(renderAbout(CONFIG, t));
    root.appendChild(renderSkills(CONFIG, t));
    root.appendChild(renderProjects(CONFIG, t));
    root.appendChild(renderContact(CONFIG, t));
    root.appendChild(createFooter(t));

    document.body.appendChild(backdrop);
    document.body.appendChild(trigger);
    document.body.appendChild(panel);

    _initialized = true;
    initAnimations();
    initSmoothScroll();
    initScrollProgress();
    initProjectSpotlight();
  } else {
    rerenderText(root, t);
  }

  syncCursor();
  syncBackground();
}

function rerenderText(root, t) {
  root.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const map = {
      '#about': 'nav_about', '#skills': 'nav_skills',
      '#projects': 'nav_projects', '#contact': 'nav_contact',
    };
    const key = map[a.getAttribute('href')];
    if (key) a.textContent = t(key);
  });
}

// ─── Bootstrap ─────────────────────────────────────────────
async function initApp() {
  const settings = loadSettings();
  applySettings(settings);
  watchSystemTheme();
  await render();
  window.addEventListener('pf:settings-changed', render);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
