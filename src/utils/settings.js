/**
 * src/utils/settings.js
 * Settings manager — load, save, apply, subscribe
 */

const STORAGE_KEY = 'pf_settings';

export const ACCENT_PRESETS = [
  { name: 'Lime',     value: '#C6F135' },   // default
  { name: 'Cyan',     value: '#22D3EE' },
  { name: 'Violet',   value: '#A78BFA' },
  { name: 'Rose',     value: '#FB7185' },
  { name: 'Orange',   value: '#FB923C' },
  { name: 'Emerald',  value: '#34D399' },
  { name: 'Sky',      value: '#38BDF8' },
  { name: 'White',    value: '#F3F4F6' },
];

export const DEFAULTS = {
  theme:    'system',
  lang:     'system',
  accent:   '#C6F135',
  fontSize: 'md',
  anim:     true,
  cursor:   true,
  bgfx:     true,           // interactive canvas background
  perfMode: 'medium',       // 'eco' | 'medium' | 'performance'
  showFps:  false,          // FPS overlay
};

const FS_MAP = { sm: '14px', md: '16px', lg: '18px' };

// ─── In-memory store ──────────────────────────────────────
let _settings = { ...DEFAULTS };
let _listeners = [];

// ─── Persistence ──────────────────────────────────────────
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      _settings = { ...DEFAULTS, ...saved };
    }
  } catch (e) {
    _settings = { ...DEFAULTS };
  }
  return { ..._settings };
}

export function saveSettings(patch) {
  _settings = { ..._settings, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_settings));
  } catch (e) {}
  applySettings(_settings);
  _listeners.forEach(fn => fn({ ..._settings }));
  return { ..._settings };
}

export function getSettings() {
  return { ..._settings };
}

export function resetSettings() {
  return saveSettings({ ...DEFAULTS });
}

// ─── Subscribe ────────────────────────────────────────────
export function onSettingsChange(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

// ─── Apply to DOM ─────────────────────────────────────────
// Track last committed theme to prevent repeated ripples during animation
let _lastCommittedTheme = null;
let _rippleInProgress = false;

export function applySettings(s) {
  const html = document.documentElement;

  // Theme — only ripple when theme actually changes AND no ripple already running
  const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const theme = s.theme === 'system' ? systemTheme : s.theme;
  const currentTheme = _lastCommittedTheme || html.getAttribute('data-theme') || 'dark';

  if (currentTheme !== theme && !_rippleInProgress) {
    _rippleInProgress = true;
    _lastCommittedTheme = theme; // lock immediately — no double-fire

    const ripple = document.createElement('div');
    ripple.className = 'theme-ripple';
    document.body.appendChild(ripple);
    ripple.getBoundingClientRect(); // force reflow
    ripple.classList.add('expand');

    setTimeout(() => {
      html.setAttribute('data-theme', theme);
    }, 220);

    ripple.addEventListener('transitionend', () => {
      ripple.remove();
      _rippleInProgress = false;
    }, {once: true});

    // Safety: clear flag if transitionend never fires
    setTimeout(() => { _rippleInProgress = false; }, 700);
  } else if (!_rippleInProgress) {
    html.setAttribute('data-theme', theme);
    _lastCommittedTheme = theme;
  }

  // Lang
  const systemLang = (navigator.language || 'en').startsWith('th') ? 'th' : 'en';
  const lang = s.lang === 'system' ? systemLang : s.lang;
  html.lang = lang;

  // ── Accent color ──────────────────────────────────────────
  // Set --ac AND --accent (legacy alias) + all derived variants
  html.style.setProperty('--ac',     s.accent);
  html.style.setProperty('--accent', s.accent);   // legacy alias
  html.style.setProperty('--ac0', hexToRgba(s.accent, 0.09));
  html.style.setProperty('--ac1', hexToRgba(s.accent, 0.18));
  html.style.setProperty('--acg', hexToRgba(s.accent, 0.32));

  // --ac-on: readable text when accent IS the background (WCAG AA)
  const lum = relativeLuminance(s.accent);
  const acOn = lum > 0.179 ? '#0a0a0a' : '#f5f5f5';
  html.style.setProperty('--ac-on', acOn);

  // --ac-text: accent used AS text color — auto-adjusted for WCAG contrast
  const bgLum    = theme === 'light' ? 0.93 : 0.03;
  const contrast = (Math.max(lum, bgLum) + 0.05) / (Math.min(lum, bgLum) + 0.05);
  if (theme === 'light' && contrast < 4.5) {
    html.style.setProperty('--ac-text', darkenHex(s.accent, Math.min(0.72, 0.50 + (4.5 - contrast) * 0.08)));
  } else if (theme === 'dark' && contrast < 3.0) {
    html.style.setProperty('--ac-text', lightenHex(s.accent, Math.min(0.80, 0.45 + (3.0 - contrast) * 0.12)));
  } else {
    html.style.setProperty('--ac-text', s.accent);
  }

  // Font size
  html.style.fontSize = FS_MAP[s.fontSize] || '16px';

  // Animations
  html.classList.toggle('no-anim', !s.anim);
}

// ─── Helpers ──────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  let r, g, b;
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

/** WCAG relative luminance (0 = black, 1 = white) */
function relativeLuminance(hex) {
  const h = hex.replace('#', '');
  const parse = (s) => {
    const v = parseInt(s, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const len = h.length === 3 ? 1 : 2;
  const r = parse(h.length === 3 ? h[0]+h[0] : h.slice(0, 2));
  const g = parse(h.length === 3 ? h[1]+h[1] : h.slice(2, 4));
  const b = parse(h.length === 3 ? h[2]+h[2] : h.slice(4, 6));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Darken a hex color by a ratio (0–1) */
function darkenHex(hex, ratio) {
  const h = hex.replace('#', '');
  const parse = (s) => parseInt(h.length === 3 ? s+s : s, 16);
  const len = h.length === 3 ? 1 : 2;
  const r = Math.max(0, Math.round(parse(h.slice(0,      len)) * (1 - ratio)));
  const g = Math.max(0, Math.round(parse(h.slice(len,    len*2)) * (1 - ratio)));
  const b = Math.max(0, Math.round(parse(h.slice(len*2,  len*3)) * (1 - ratio)));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

/** Lighten a hex color by blending toward white */
function lightenHex(hex, ratio) {
  const h = hex.replace('#', '');
  const parse = (s) => parseInt(h.length === 3 ? s+s : s, 16);
  const len = h.length === 3 ? 1 : 2;
  const r = Math.min(255, Math.round(parse(h.slice(0,      len)) + (255 - parse(h.slice(0,      len))) * ratio));
  const g = Math.min(255, Math.round(parse(h.slice(len,    len*2)) + (255 - parse(h.slice(len,    len*2))) * ratio));
  const b = Math.min(255, Math.round(parse(h.slice(len*2,  len*3)) + (255 - parse(h.slice(len*2,  len*3))) * ratio));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

/** Listen to system theme changes and re-apply if mode is 'system' */
export function watchSystemTheme() {
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', () => {
    if (_settings.theme === 'system') applySettings(_settings);
  });
}
