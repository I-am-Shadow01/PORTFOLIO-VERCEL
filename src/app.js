import { CONFIG }               from './config.js';
import { renderHero }           from './sections/hero.js';
import { renderAbout }          from './sections/about.js';
import { renderSkills }         from './sections/skills.js';
import { renderProjects }       from './sections/projects.js';
import { renderDonate }         from './sections/donate.js';
import { renderContact }        from './sections/contact.js';
import { initCursor }           from './utils/cursor.js';
import { initAnimations }       from './utils/animations.js';
import { initBackground }       from './utils/background.js';
import { initSmoothScroll }     from './utils/smoothscroll.js';
import { initEffects }          from './utils/effects.js';
import { onFrame, getScrollState, getLoopInfo } from './utils/loop.js';
import { loadSettings, applySettings, watchSystemTheme, getSettings, saveSettings } from './utils/settings.js';
import { createSettingsPanel }  from './components/settings-panel.js';
import { createT }              from './i18n.js';

// ── Nav ──────────────────────────────────────────────────────
function createNav(t) {
  const nav = document.createElement('nav');
  const items = [
    { id: 'about',    key: 'nav_about'    },
    { id: 'skills',   key: 'nav_skills'   },
    { id: 'projects', key: 'nav_projects' },
    { id: 'donate',   key: 'nav_donate'   },
    { id: 'contact',  key: 'nav_contact'  },
  ];

  nav.innerHTML = `
    <button class="nav-logo" onclick="window.__go('hero')">
      ${CONFIG.meta.firstName}<span>.</span>
    </button>
    <ul class="nav-links" role="list">
      ${items.map(i => `
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
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay) closeMobile(); });

  function openMobile() {
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    overlay = buildOverlay(items, t, closeMobile);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { overlay && overlay.classList.add('open'); });
    });
    document.body.style.overflow = 'hidden';
  }

  function closeMobile() {
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (!overlay) return;
    overlay.classList.remove('open');
    const el = overlay; overlay = null;
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    el.focus?.();
  }

  return nav;
}

/**
 * พฤติกรรม nav ที่ผูกครั้งเดียวตอน boot (scroll + section highlight)
 * — เดิมผูก scroll listener แยก และ query nav ทุก scroll event; ตอนนี้ใช้
 * scroll state จาก loop กลาง (passive listener เดียวทั้งเว็บ) แล้ว query DOM
 * สดเฉพาะตอนจำเป็น
 */
function bindGlobalNavBehavior() {
  const ORDER = ['hero', 'about', 'skills', 'projects', 'donate', 'contact'];
  const visibleMap = new Map();

  const navObs = new IntersectionObserver(entries => {
    entries.forEach(e => visibleMap.set(e.target.id, e.intersectionRatio));
    let bestId = 'hero', bestRatio = -1;
    for (const id of ORDER) {
      const r = visibleMap.get(id) ?? 0;
      if (r > bestRatio) { bestRatio = r; bestId = id; }
    }
    document.querySelectorAll('.nav-link').forEach(b => {
      b.classList.toggle('active', b.dataset.navid === bestId);
    });
  }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] });

  // scroll-driven UI (nav.scrolled) — อ่านจาก loop ไม่ผูก listener เอง
  let lastScrolled = null;
  onFrame(() => {
    const scrolled = getScrollState().y > 50;
    if (scrolled !== lastScrolled) {
      lastScrolled = scrolled;
      document.querySelector('nav')?.classList.toggle('scrolled', scrolled);
    }
  });

  return {
    reobserveSections() {
      navObs.disconnect();
      visibleMap.clear();
      document.querySelectorAll('section[id]').forEach(s => navObs.observe(s));
    },
  };
}

// ── Mobile side-drawer overlay ───────────────────────────────
function buildOverlay(items, t, onClose) {
  const ov = document.createElement('div');
  ov.className = 'mob-overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Navigation menu');
  ov.innerHTML = `
    <div class="mob-glass"><div class="mob-glass-inner">

      <!-- Header -->
      <div class="mob-header">
        <span class="mob-header-logo">${CONFIG.meta.firstName}<span>.</span></span>
        <button class="mob-close" aria-label="Close menu">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <span>Close</span>
        </button>
      </div>

      <!-- Nav links -->
      <nav class="mob-nav">
        ${items.map((item, i) => `
          <button class="mob-item" style="--i:${i}"
            onclick="this.closest('.mob-overlay').__close(); setTimeout(()=>window.__go('${item.id}'),120)">
            <span class="mob-num">0${i + 1}</span>
            <span class="mob-label">${t('nav_' + item.id)}</span>
            <span class="mob-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M7 17L17 7M17 7H7M17 7v10"/>
              </svg>
            </span>
          </button>`).join('')}
      </nav>

      <!-- Footer -->
      <div class="mob-footer">
        <span>${CONFIG.meta.location}&nbsp;·&nbsp;${new Date().getFullYear()}</span>
      </div>
    </div></div>
  `;
  ov.__close = onClose;
  ov.addEventListener('click', e => { if (e.target === ov) onClose(); });
  ov.querySelector('.mob-close').addEventListener('click', onClose);
  return ov;
}

// ── Footer ──────────────────────────────────────────────────
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

// ── Scroll progress bar (อ่านค่าจาก loop กลาง — ไม่มี listener เอง) ──
function initScrollProgress() {
  const bar = Object.assign(document.createElement('div'), { className: 'scroll-progress' });
  document.body.appendChild(bar);
  let last = -1;
  onFrame(() => {
    const p = Math.min(getScrollState().progress * 100, 100);
    if (Math.abs(p - last) > 0.25) {   // เขียน DOM เฉพาะตอนเปลี่ยนจริง
      last = p;
      bar.style.width = p + '%';
    }
  });
}

// ── FPS Overlay (node ถาวร — ไม่ rebuild innerHTML ทุกวินาทีแบบเดิม) ──
function createFpsOverlay() {
  const el = document.createElement('div');
  el.id = 'fps-overlay';
  el.className = 'fps-overlay';

  const numEl = document.createElement('span');
  numEl.className = 'fps-num';
  numEl.textContent = '--';
  const unitEl = document.createElement('span');
  unitEl.className = 'fps-unit';
  unitEl.textContent = 'fps';
  const top = document.createElement('div');
  top.className = 'fps-top';
  top.append(numEl, unitEl);

  const BARS = 24;
  const barsWrap = document.createElement('div');
  barsWrap.className = 'fps-bars';
  const bars = [];
  for (let i = 0; i < BARS; i++) {
    const b = document.createElement('i');
    b.style.height = '9px';
    b.style.background = '#444';
    barsWrap.appendChild(b);
    bars.push(b);
  }
  el.append(top, barsWrap);
  document.body.appendChild(el);

  const history = new Array(BARS).fill(60);
  let histIdx = 0;
  let visible = false;
  let lastShown = -1;

  function setVisible(v) {
    visible = v;
    el.style.opacity = v ? '1' : '0';
    el.style.pointerEvents = v ? 'auto' : 'none';
  }

  // อัปเดต 2 ครั้ง/วินาที และเฉพาะตอนเปิดอยู่เท่านั้น (ปิด = cost เป็น 0)
  onFrame(info => {
    if (!visible || info.frame % 30 !== 0) return;
    const fps = info.fps;
    history[histIdx] = fps;
    histIdx = (histIdx + 1) % BARS;
    if (fps !== lastShown) {
      lastShown = fps;
      numEl.textContent = String(fps);
      numEl.style.color = fps >= 50 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#f87171';
    }
    for (let i = 0; i < BARS; i++) {
      const f = history[(histIdx + i) % BARS];
      bars[i].style.height = Math.max(1, Math.round((f / 60) * 16)) + 'px';
      bars[i].style.background = f >= 50 ? '#4ade80' : f >= 30 ? '#fbbf24' : '#f87171';
    }
  });

  return { el, setVisible };
}

// ── Load CSS ──────────────────────────────────────────────────
function loadStyles() {
  return new Promise(res => {
    if (document.querySelector('link[href*="styles.css"]')) return res();
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = './src/styles.css';
    l.onload = res; l.onerror = res;
    document.head.appendChild(l);
  });
}

function injectMeta() {
  document.title = `${CONFIG.meta.fullName} — Portfolio`;
  [{ name: 'description', content: `${CONFIG.meta.fullName} — ${CONFIG.meta.roles[0]}` },
   { name: 'theme-color', content: '#080810' }]
    .forEach(m => {
      let el = document.head.querySelector(`meta[name="${m.name}"]`);
      if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
      Object.entries(m).forEach(([k, v]) => el.setAttribute(k, v));
    });
}

// ── Content build (nav + sections + footer) ─────────────────
function buildContent(t) {
  const root = document.getElementById('__root__');
  root.innerHTML = '';
  root.appendChild(createNav(t));
  root.appendChild(renderHero(CONFIG, t));
  root.appendChild(renderAbout(CONFIG, t));
  root.appendChild(renderSkills(CONFIG, t));
  root.appendChild(renderProjects(CONFIG, t));
  root.appendChild(renderDonate(CONFIG, t));
  root.appendChild(renderContact(CONFIG, t));
  root.appendChild(createFooter(t));

  initAnimations();

  // effect ทุกตัวใช้ delegated listener → ไม่ต้อง bind ใหม่ตอน rebuild
  // แค่บอกว่าเนื้อหาเปลี่ยน เพื่อให้ refresh cache (parallax targets, observers)
  window.dispatchEvent(new CustomEvent('pf:content-rebuilt'));
  if (_navBehavior) _navBehavior.reobserveSections();
}

// ── Cursor ────────────────────────────────────────────────────
let _cur = null;
function syncCursor() {
  const on = getSettings().cursor && !getLoopInfo().reducedMotion;
  if (on && !_cur)  _cur = initCursor();
  if (!on && _cur) { _cur(); _cur = null; }
}

// ── Background canvas ─────────────────────────────────────────
// perfMode/accent/theme เปลี่ยน → background รับเองผ่าน settings subscription
// (เดิมทำลายแล้วสร้าง canvas ใหม่ทุกครั้งที่เปลี่ยน perfMode → ภาพวาป + เสีย state)
let _bg = null;
let _fpsOverlay = null;
function syncBg() {
  const s = getSettings();
  if (s.bgfx && !_bg) _bg = initBackground();
  if (!s.bgfx && _bg) { _bg(); _bg = null; }
  if (_fpsOverlay) _fpsOverlay.setVisible(!!s.showFps);
}

// ── Keyboard shortcuts ────────────────────────────────────────
function initShortcuts(openSettings) {
  document.addEventListener('keydown', e => {
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const k = e.key.toLowerCase();
      if (k === 's') { e.preventDefault(); openSettings(); }
      else if (k === 't') {
        e.preventDefault();
        const cur = getSettings().theme;
        const next = cur === 'dark' ? 'light' : cur === 'light' ? 'system' : 'dark';
        saveSettings({ theme: next });
      }
      else if (k === 'f') {
        e.preventDefault();
        saveSettings({ showFps: !getSettings().showFps });
      }
    }
  });
}

// ── Main render ───────────────────────────────────────────────
let _ready = false;
let _navBehavior = null;
let _lastLang = null;

async function render() {
  const t = createT(getSettings());

  if (!_ready) {
    await loadStyles();
    injectMeta();
    _fpsOverlay = createFpsOverlay();
    _fpsOverlay.setVisible(!!getSettings().showFps);
    const { panel, trigger, backdrop } = createSettingsPanel();
    document.body.appendChild(backdrop);
    document.body.appendChild(trigger);
    document.body.appendChild(panel);

    _navBehavior = bindGlobalNavBehavior();
    initSmoothScroll();
    initScrollProgress();
    initEffects();          // ครั้งเดียวตลอดอายุหน้า (delegated ทั้งชุด)
    initShortcuts(() => trigger.click());

    buildContent(t);
    _ready = true;
    _lastLang = t.lang;
  } else if (t.lang !== _lastLang) {
    buildContent(t);
    _lastLang = t.lang;
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
