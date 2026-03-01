/**
 * app.js — Entry point
 * Builds the full page and initializes all systems
 */

import { CONFIG }          from './config.js';
import { renderHero }      from './sections/hero.js';
import { renderAbout }     from './sections/about.js';
import { renderSkills }    from './sections/skills.js';
import { renderProjects }  from './sections/projects.js';
import { renderContact }   from './sections/contact.js';
import { initCursor }      from './utils/cursor.js';
import { initAnimations }  from './utils/animations.js';

// ─── Navigation ───────────────────────────────────────────
function createNav() {
  const nav = document.createElement('nav');
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  const navItems = [
    { href: '#about',    label: 'About' },
    { href: '#skills',   label: 'Skills' },
    { href: '#projects', label: 'Projects' },
    { href: '#contact',  label: 'Contact' },
  ];

  nav.innerHTML = `
    <a href="#hero" class="nav-logo" aria-label="Home">
      ${CONFIG.meta.firstName}<span>.</span>
    </a>

    <ul class="nav-links" role="list">
      ${navItems.map(item => `
        <li><a href="${item.href}">${item.label}</a></li>
      `).join('')}
    </ul>

    <button class="nav-hamburger" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>

    <div class="nav-mobile" role="dialog" aria-label="Mobile navigation">
      ${navItems.map(item => `<a href="${item.href}">${item.label}</a>`).join('')}
    </div>
  `;

  // ── Scroll: blur glass effect + active link ──
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveLink(nav);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Hamburger toggle ──
  const hamburger = nav.querySelector('.nav-hamburger');
  const mobileMenu = nav.querySelector('.nav-mobile');

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // ── Close mobile on link click ──
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
  const sections = document.querySelectorAll('section[id]');
  const scrollY   = window.scrollY + 100;
  let activeId = 'hero';

  sections.forEach(s => {
    if (s.offsetTop <= scrollY) activeId = s.id;
  });

  nav.querySelectorAll('a[href^="#"]').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${activeId}`);
  });
}

// ─── Footer ───────────────────────────────────────────────
function createFooter() {
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <p class="footer-copy">
      © ${new Date().getFullYear()} <span>${CONFIG.meta.fullName}</span>
    </p>
    <a href="#hero" class="footer-top" aria-label="Back to top">
      Back to top
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </a>
  `;
  return footer;
}

// ─── Stylesheet loader ────────────────────────────────────
function loadStyles() {
  return new Promise(resolve => {
    const link = document.createElement('link');
    link.rel   = 'stylesheet';
    link.href  = './src/styles.css';
    link.onload = resolve;
    link.onerror = resolve; // still continue if fails
    document.head.appendChild(link);
  });
}

// ─── Head meta ────────────────────────────────────────────
function injectMeta() {
  document.title = `${CONFIG.meta.fullName} — Portfolio`;

  const metas = [
    { name: 'description', content: `${CONFIG.meta.fullName} — ${CONFIG.meta.roles[0]}. Portfolio & Projects.` },
    { name: 'theme-color',  content: '#090909' },
    { property: 'og:title', content: `${CONFIG.meta.fullName} — Portfolio` },
    { property: 'og:type',  content: 'website' },
  ];

  metas.forEach(m => {
    const el = document.createElement('meta');
    Object.entries(m).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  });
}

// ─── Project card mouse spotlight ─────────────────────────
function initProjectSpotlight() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

// ─── Bootstrap ────────────────────────────────────────────
async function initApp() {
  injectMeta();
  await loadStyles();

  const root = document.getElementById('__root__');

  // Build DOM
  root.appendChild(createNav());
  root.appendChild(renderHero(CONFIG));
  root.appendChild(renderAbout(CONFIG));
  root.appendChild(renderSkills(CONFIG));
  root.appendChild(renderProjects(CONFIG));
  root.appendChild(renderContact(CONFIG));
  root.appendChild(createFooter());

  // Init systems
  initCursor();
  initAnimations();
  initProjectSpotlight();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
