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
export function applySettings(s) {
  const html = document.documentElement;

  // Theme
  const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const theme = s.theme === 'system' ? systemTheme : s.theme;
  html.setAttribute('data-theme', theme);

  // Lang
  const systemLang = (navigator.language || 'en').startsWith('th') ? 'th' : 'en';
  const lang = s.lang === 'system' ? systemLang : s.lang;
  html.lang = lang;

  // Accent color
  html.style.setProperty('--accent', s.accent);

  // Derive accent variants automatically from hex
  const dim  = hexToRgba(s.accent, 0.09);
  const glow = hexToRgba(s.accent, 0.22);
  html.style.setProperty('--accent-dim',  dim);
  html.style.setProperty('--accent-glow', glow);

  // Font size
  html.style.fontSize = FS_MAP[s.fontSize] || '16px';

  // Animations
  html.classList.toggle('no-anim', !s.anim);
}

// ─── Helpers ──────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const len = h.length === 3 ? 1 : 2;
  const r = parseInt(h.slice(0, len) + (len === 1 ? h[0] : ''), 16);
  const g = parseInt(h.slice(len, len * 2) + (len === 1 ? h[len] : ''), 16);
  const b = parseInt(h.slice(len * 2, len * 3) + (len === 1 ? h[len * 2] : ''), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Listen to system theme changes and re-apply if mode is 'system' */
export function watchSystemTheme() {
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', () => {
    if (_settings.theme === 'system') applySettings(_settings);
  });
}
