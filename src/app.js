import { CONFIG }               from './config.js';
import { renderHero }           from './sections/hero.js';
import { renderAbout }          from './sections/about.js';
import { renderSkills }         from './sections/skills.js';
import { renderProjects }       from './sections/projects.js';
import { renderContact }        from './sections/contact.js';
import { initCursor }           from './utils/cursor.js';
import { initAnimations }       from './utils/animations.js';
import { initBackground }       from './utils/background.js';
import { initSmoothScroll }     from './utils/smoothscroll.js';
import { initMagneticButtons, initTiltCards, initTextScramble, initCounters, initRipple, initParticleBurst, initParallax, initSkillGlow, initSparkleTrail } from './utils/effects.js';
import { loadSettings, applySettings, watchSystemTheme, getSettings } from './utils/settings.js';
import { createSettingsPanel }  from './components/settings-panel.js';
import { createT }              from './i18n.js';

// ── Nav ──────────────────────────────────────────────────────
function createNav(t) {
  const nav = document.createElement('nav');
  const items = [
    { id:'about',    key:'nav_about'    },
    { id:'skills',   key:'nav_skills'   },
    { id:'projects', key:'nav_projects' },
    { id:'contact',  key:'nav_contact'  },
  ];

  nav.innerHTML = `
    <button class="nav-logo" onclick="window.__go('hero')">
      ${CONFIG.meta.firstName}<span>.</span>
    </button>
    <ul class="nav-links" role="list">
      ${items.map(i=>`
        <li>
          <button class="nav-link" data-navid="${i.id}" onclick="window.__go('${i.id}')">
            ${t(i.key)}
          </button>
        </li>`).join('')}
    </ul>
    <button class="nav-hamburger" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  `;

  const burger = nav.querySelector('.nav-hamburger');
  let overlay = null;

  burger.addEventListener('click', () => overlay ? closeMobile() : openMobile());
  document.addEventListener('keydown', e => { if (e.key==='Escape' && overlay) closeMobile(); });

  function openMobile() {
    burger.classList.add('open');
    burger.setAttribute('aria-expanded','true');
    overlay = buildOverlay(items, t, closeMobile);
    document.body.appendChild(overlay);
    // rAF ให้ browser paint initial state ก่อน แล้วค่อย add .open
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('open');
      });
    });
    document.body.style.overflow = 'hidden';
  }

  function closeMobile() {
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
    if (!overlay) return;
    overlay.classList.remove('open');
    const el = overlay; overlay = null;
    el.addEventListener('transitionend', ()=>el.remove(), { once:true });
  }

  const root = document.getElementById('__root__');
  const scroller = root || window;

  // ── Scrolled class for nav background ──
  scroller.addEventListener('scroll', ()=>{
    const scrollTop = root ? root.scrollTop : window.scrollY;
    nav.classList.toggle('scrolled', scrollTop > 50);
  }, { passive:true });

  // ── Active section via IntersectionObserver ──
  const visibleMap = new Map();
  const navObs = new IntersectionObserver(entries => {
    entries.forEach(e => visibleMap.set(e.target.id, e.intersectionRatio));
    let bestId = 'hero', bestRatio = -1;
    const order = ['hero','about','skills','projects','contact'];
    order.forEach(id => {
      const r = visibleMap.get(id) ?? 0;
      if (r > bestRatio) { bestRatio = r; bestId = id; }
    });
    nav.querySelectorAll('.nav-link').forEach(b => {
      b.classList.toggle('active', b.dataset.navid === bestId);
    });
  }, {
    root: root || null,
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  });
  document.querySelectorAll('section[id]').forEach(s => navObs.observe(s));

  return nav;
}

// ── Mobile side-drawer overlay ───────────────────────────────
function buildOverlay(items, t, onClose) {
  const ov = document.createElement('div');
  ov.className = 'mob-overlay';
  ov.setAttribute('role','dialog');
  ov.setAttribute('aria-modal','true');
  ov.setAttribute('aria-label','Navigation menu');
  ov.innerHTML = `
    <div class="mob-glass">

      <!-- Header -->
      <div class="mob-header">
        <span class="mob-header-logo">${CONFIG.meta.firstName}<span>.</span></span>
        <button class="mob-close" aria-label="Close menu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Nav links -->
      <nav class="mob-nav">
        ${items.map((item,i)=>`
          <button class="mob-item" style="--i:${i}"
            onclick="this.closest('.mob-overlay').__close(); setTimeout(()=>window.__go('${item.id}'),120)">
            <span class="mob-num">0${i+1}</span>
            <span class="mob-label">${t('nav_'+item.id)}</span>
            <span class="mob-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M7 17L17 7M17 7H7M17 7v10"/>
              </svg>
            </span>
          </button>`).join('')}
      </nav>

      <!-- Footer -->
      <div class="mob-footer">
        <span>${CONFIG.meta.location}</span>
        <span>${new Date().getFullYear()}</span>
      </div>
    </div>
  `;
  ov.__close = onClose;
  // Close on backdrop click (outside the drawer panel)
  ov.addEventListener('click', e => { if (e.target === ov) onClose(); });
  // Wire close button
  ov.querySelector('.mob-close').addEventListener('click', onClose);
  return ov;
}

// ── Footer ───────────────────────────────────────────────────
function createFooter(t) {
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <p class="footer-copy">© ${new Date().getFullYear()} <span>${CONFIG.meta.fullName}</span></p>
    <button class="footer-top" onclick="window.__go('hero')">
      ${t('back_top')}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  `;
  return footer;
}

// ── Scroll progress bar ───────────────────────────────────────
function initScrollProgress() {
  const bar = Object.assign(document.createElement('div'), { className:'scroll-progress' });
  document.body.appendChild(bar);
  const root = document.getElementById('__root__');
  const scroller = root || window;
  scroller.addEventListener('scroll', ()=>{
    const scrollTop = root ? root.scrollTop : window.scrollY;
    const scrollHeight = root ? root.scrollHeight - root.clientHeight : document.body.scrollHeight - window.innerHeight;
    bar.style.width = Math.min(scrollTop / scrollHeight * 100, 100) + '%';
  }, { passive:true });
}

// ── Spotlight on project cards ────────────────────────────────
function initSpotlight() {
  document.querySelectorAll('.project-card').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX-r.left}px`);
      card.style.setProperty('--my', `${e.clientY-r.top}px`);
    });
  });
}

// ── Cursor ────────────────────────────────────────────────────
let _cur = null;
function syncCursor() {
  const on = getSettings().cursor;
  if (on && !_cur)  _cur = initCursor();
  if (!on && _cur) { _cur(); _cur = null; }
}

// ── Background canvas ─────────────────────────────────────────
let _bg = null;
function syncBg() {
  const on = getSettings().bgfx;
  if (on && !_bg)  _bg = initBackground();
  if (!on && _bg) { _bg(); _bg = null; }
}

// ── Load CSS ──────────────────────────────────────────────────
function loadStyles() {
  return new Promise(res=>{
    if (document.querySelector('link[href*="styles.css"]')) return res();
    const l = document.createElement('link');
    l.rel='stylesheet'; l.href='./src/styles.css';
    l.onload=res; l.onerror=res;
    document.head.appendChild(l);
  });
}

function injectMeta() {
  document.title = `${CONFIG.meta.fullName} — Portfolio`;
  [{ name:'description', content:`${CONFIG.meta.fullName} — ${CONFIG.meta.roles[0]}` },
   { name:'theme-color', content:'#080810' }]
  .forEach(m=>{
    let el = document.head.querySelector(`meta[name="${m.name}"]`);
    if (!el) { el=document.createElement('meta'); document.head.appendChild(el); }
    Object.entries(m).forEach(([k,v])=>el.setAttribute(k,v));
  });
}

// ── Main render ───────────────────────────────────────────────
let _ready = false;

async function render() {
  const root = document.getElementById('__root__');
  const t = createT(getSettings());

  if (!_ready) {
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

    _ready = true;

    // initSmoothScroll must run first — registers window.__go
    initSmoothScroll();
    initAnimations();
    initScrollProgress();
    initSpotlight();

    // 25002500 Extra effects 2500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500
    initMagneticButtons();
    initTiltCards();
    initTextScramble();
    initCounters();
    initRipple();
    initParticleBurst();
    initParallax();
    initSkillGlow();
    initSparkleTrail();
  }

  syncCursor();
  syncBg();
}

async function boot() {
  applySettings(loadSettings());
  watchSystemTheme();
  await render();
  window.addEventListener('pf:settings-changed', render);
}

if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', boot);
else boot();
