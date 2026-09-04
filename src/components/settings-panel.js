/**
 * src/components/settings-panel.js — Full settings drawer with all controls
 *
 * สิ่งที่แก้จากเวอร์ชันเดิม (resource/QoL):
 *   • Hue picker เดิมเพิ่ม window mousemove/touchmove/document-click listener
 *     ใหม่ทุกครั้งที่ build() ทำงาน (เปิด panel 10 ครั้ง = listener ค้าง 10 ชุด)
 *     → ตอนนี้ใช้ Pointer Events + setPointerCapture บน canvas — listener ผูกกับ
 *     ตัว canvas เองเท่านั้น ไม่มีอะไรค้างที่ window เลย
 *   • Adaptive quality hint เดิมฟัง event ที่ไม่มีใครยิง → ตอนนี้ background
 *     ยิง `pf:adaptive-quality` จริง พร้อม fps/scale
 *   • เพิ่ม Motion slider, Cursor trail toggle, Adaptive quality toggle
 *   • Focus trap ง่ายๆ ใน panel (Tab/Shift+Tab วนอยู่ใน dialog)
 */

import {
  ACCENT_PRESETS,
  getSettings,
  saveSettings,
  resetSettings,
} from '../utils/settings.js';
import { createT } from '../i18n.js';

export function createSettingsPanel() {
  let t = createT(getSettings());

  // ── Panel element ─────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id    = 'settings-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Settings');

  // Static shell — สร้างครั้งเดียว ไม่ถูกแทนที่ใน build()
  const _spHeader = document.createElement('div');
  _spHeader.className = 'sp-header';
  const _spTitleEl = document.createElement('h2');
  _spTitleEl.className = 'sp-title';
  const _spCloseBtn = document.createElement('button');
  _spCloseBtn.className = 'sp-close';
  _spCloseBtn.innerHTML = CLOSE_ICON;
  _spHeader.appendChild(_spTitleEl);
  _spHeader.appendChild(_spCloseBtn);
  panel.appendChild(_spHeader);

  const _spBody = document.createElement('div');
  _spBody.className = 'sp-body';
  panel.appendChild(_spBody);

  // ── Trigger button ────────────────────────────────────────
  const trigger = document.createElement('button');
  trigger.id            = 'settings-trigger';
  trigger.className     = 'settings-trigger';
  trigger.setAttribute('aria-label', 'Open settings');
  trigger.setAttribute('aria-controls', 'settings-panel');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML     = GEAR_ICON;

  // ── Backdrop ──────────────────────────────────────────────
  const backdrop = document.createElement('div');
  backdrop.className = 'settings-backdrop';

  // ── Adaptive quality hint (ต่อตรงจาก background) ──────────
  function _onAdaptiveQuality(e) {
    const hint = panel.querySelector('.sp-perf-hint');
    if (!hint || getSettings().perfMode !== 'performance') return;
    const d = e.detail || {};
    const labels = [t('settings_fps_quality_ultra'), t('settings_fps_quality_high'), t('settings_fps_quality_medium')];
    const scale = d.scale != null && d.scale !== 1 ? ` · ${Math.round(d.scale * 100)}% res` : '';
    hint.textContent = `${d.fps} FPS — ${labels[d.step] || ''}${scale}`;
  }

  // ── Focus trap ────────────────────────────────────────────
  function trapFocus(e) {
    if (e.key !== 'Tab' || !panel.classList.contains('open')) return;
    const focusables = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const list = [...focusables].filter(el => !el.disabled && el.offsetParent !== null || el === document.activeElement);
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // ── Build panel ───────────────────────────────────────────
  function build() {
    const savedScroll = _spBody.scrollTop;
    const s = getSettings();
    t = createT(s);
    _spTitleEl.textContent = t('settings_title');
    _spCloseBtn.setAttribute('aria-label', t('settings_close'));
    _spCloseBtn.onclick = close;

    _spBody.innerHTML = `

        <!-- Theme -->
        <div class="sp-section">
          <p class="sp-label">${t('settings_theme')}</p>
          <div class="sp-seg" role="group" aria-label="${t('settings_theme')}">
            ${['dark','light','system'].map(v => `
              <button class="sp-seg-btn ${s.theme === v ? 'active' : ''}"
                      data-setting="theme" data-value="${v}">
                ${v === 'dark' ? MOON_ICON : v === 'light' ? SUN_ICON : SYS_ICON}
                <span>${t('settings_theme_' + (v === 'system' ? 'sys' : v))}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Language -->
        <div class="sp-section">
          <p class="sp-label">${t('settings_lang')}</p>
          <div class="sp-seg" role="group" aria-label="${t('settings_lang')}">
            ${['en','th','system'].map(v => `
              <button class="sp-seg-btn ${s.lang === v ? 'active' : ''}"
                      data-setting="lang" data-value="${v}">
                <span>${t('settings_lang_' + (v === 'system' ? 'sys' : v))}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Accent -->
        <div class="sp-section">
          <p class="sp-label">${t('settings_accent')}</p>
          <div class="sp-swatches" role="group" aria-label="${t('settings_accent')}">
            ${ACCENT_PRESETS.map(p => `
              <button
                class="sp-swatch ${s.accent === p.value ? 'active' : ''}"
                data-setting="accent" data-value="${p.value}"
                style="--sw:${p.value}"
                aria-label="${p.name}"
                title="${p.name}">
              </button>
            `).join('')}
            <button class="sp-hue-open" title="Custom color" aria-label="Custom color">
              <span class="sp-hue-dot" style="background:${s.accent}"></span>
            </button>
            <div class="sp-hue-popover" id="sp-hue-popover" hidden style="cursor:default">
              <canvas class="sp-sv-square" width="192" height="140" id="sp-sv-canvas"></canvas>
              <canvas class="sp-hue-bar" width="192" height="16" id="sp-hue-canvas"></canvas>
              <div class="sp-picker-bottom">
                <div class="sp-hue-preview" id="sp-preview"></div>
                <input type="text" class="sp-hex-input" id="sp-hex-input" maxlength="7" spellcheck="false">
              </div>
            </div>
          </div>
        </div>

        <!-- Font size -->
        <div class="sp-section">
          <p class="sp-label">${t('settings_fontsize')}</p>
          <div class="sp-seg" role="group" aria-label="${t('settings_fontsize')}">
            ${[['sm','settings_fs_sm'],['md','settings_fs_md'],['lg','settings_fs_lg']].map(([v,lk]) => `
              <button class="sp-seg-btn ${s.fontSize === v ? 'active' : ''}"
                      data-setting="fontSize" data-value="${v}">
                <span>${t(lk)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Motion intensity -->
        <div class="sp-section">
          <div class="sp-slider-row">
            <div class="sp-toggle-info">
              ${MOTION_ICON}
              <span>${t('settings_motion')}</span>
            </div>
            <output class="sp-slider-out" id="sp-motion-out">${s.motion ?? 100}%</output>
          </div>
          <input type="range" class="sp-range" id="sp-motion" min="20" max="140" step="10"
                 value="${s.motion ?? 100}" aria-label="${t('settings_motion')}">
        </div>

        <!-- Toggles row -->
        <div class="sp-section">
          ${toggleRow('anim', ANIM_ICON, t('settings_anim'), s.anim)}
          ${toggleRow('cursor', CURSOR_ICON, t('settings_cursor'), s.cursor)}
          ${toggleRow('trail', TRAIL_ICON, t('settings_trail'), s.trail)}
          ${toggleRow('bgfx', BG_ICON, t('settings_bgfx'), s.bgfx)}
          ${toggleRow('adaptive', ADAPT_ICON, t('settings_adaptive'), s.adaptive)}
          ${toggleRow('showFps', FPS_ICON, t('settings_showfps'), s.showFps)}
        </div>

        <!-- Performance Mode -->
        <div class="sp-section">
          <p class="sp-label">${t('settings_perfmode')}</p>
          <div class="sp-seg sp-seg--perf" role="group" aria-label="${t('settings_perfmode')}">
            <button class="sp-seg-btn sp-perf-btn ${s.perfMode === 'eco' ? 'active' : ''}"
                    data-setting="perfMode" data-value="eco">
              ${PERF_ECO_ICON}
              <span>${t('settings_perf_eco')}</span>
            </button>
            <button class="sp-seg-btn sp-perf-btn ${s.perfMode === 'medium' || !s.perfMode ? 'active' : ''}"
                    data-setting="perfMode" data-value="medium">
              ${PERF_MEDIUM_ICON}
              <span>${t('settings_perf_medium')}</span>
            </button>
            <button class="sp-seg-btn sp-perf-btn ${s.perfMode === 'performance' ? 'active' : ''}"
                    data-setting="perfMode" data-value="performance">
              ${PERF_PERFORMANCE_ICON}
              <span>${t('settings_perf_performance') || 'Performance'}</span>
            </button>
          </div>
          <p class="sp-perf-hint" id="perf-hint">${
            s.perfMode === 'eco'         ? t('settings_perf_eco_hint') :
            s.perfMode === 'performance' ? t('settings_perf_performance_hint') :
                                           t('settings_perf_medium_hint')
          }</p>
        </div>

        <!-- Shortcuts -->
        <div class="sp-section">
          <p class="sp-shortcuts-hint">${t('settings_shortcuts')}</p>
        </div>

        <!-- Reset -->
        <div class="sp-section">
          <button class="sp-reset" id="sp-reset-btn">${t('settings_reset')}</button>
        </div>

      </div>
    `;

    if (savedScroll > 0) _spBody.scrollTop = savedScroll;

    window.removeEventListener('pf:adaptive-quality', _onAdaptiveQuality);
    window.addEventListener('pf:adaptive-quality', _onAdaptiveQuality);

    // Segmented buttons
    panel.querySelectorAll('.sp-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        saveSettings({ [btn.dataset.setting]: btn.dataset.value });
        build();
        dispatchPageRerender();
      });
    });

    // Swatch buttons
    panel.querySelectorAll('.sp-swatch[data-setting]').forEach(btn => {
      btn.addEventListener('click', () => {
        saveSettings({ accent: btn.dataset.value });
        build();
        dispatchPageRerender();
      });
    });

    // Hue wheel picker (listener อยู่บน canvas เท่านั้น — ไม่รั่ว)
    initHueWheel(panel, (hex) => {
      saveSettings({ accent: hex });
      dispatchPageRerender();
    }, s.accent);

    // Toggle switches
    panel.querySelectorAll('.sp-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.setting;
        const val = btn.dataset.value === 'true';
        saveSettings({ [key]: val });
        dispatchPageRerender();
        build();
      });
    });

    // Motion slider — live preview ตอนลาก, commit ตอนปล่อย
    const range = panel.querySelector('#sp-motion');
    const out = panel.querySelector('#sp-motion-out');
    const syncFill = () => {
      const pct = ((Number(range.value) - 20) / (140 - 20)) * 100;
      range.style.setProperty('--fill', pct + '%');
      out.textContent = range.value + '%';
    };
    syncFill();
    range?.addEventListener('input', syncFill);
    range?.addEventListener('change', () => {
      saveSettings({ motion: Number(range.value) });
      dispatchPageRerender();
    });

    // Reset
    panel.querySelector('#sp-reset-btn')?.addEventListener('click', () => {
      resetSettings();
      build();
      dispatchPageRerender();
    });
  }

  function toggleRow(key, icon, label, on) {
    return `
      <div class="sp-toggle-row">
        <div class="sp-toggle-info">
          ${icon}
          <span>${label}</span>
        </div>
        <button class="sp-toggle ${on ? 'on' : ''}"
                data-setting="${key}" data-value="${!on}"
                role="switch" aria-checked="${!!on}"
                aria-label="${label}">
          <span class="sp-toggle-knob"></span>
        </button>
      </div>
    `;
  }

  // ── Open / Close ──────────────────────────────────────────
  function open() {
    build();
    panel.classList.add('open');
    backdrop.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    _spCloseBtn.focus();
    document.addEventListener('keydown', trapFocus);
  }

  function close() {
    window.removeEventListener('pf:adaptive-quality', _onAdaptiveQuality);
    document.removeEventListener('keydown', trapFocus);
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', () => {
    panel.classList.contains('open') ? close() : open();
  });

  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  return { panel, trigger, backdrop };
}

// ─── Hue Wheel Color Picker (Pointer Events + capture — ไม่รั่ว) ──
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

function hexToHsl(hex) {
  let h = (hex || '').replace('#','');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0,2),16)/255, g = parseInt(h.slice(2,4),16)/255, b = parseInt(h.slice(4,6),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
  let hh = 0, ss = 0, ll = (max+min)/2;
  if (d) {
    ss = d / (1 - Math.abs(2*ll-1));
    if (max === r) hh = ((g-b)/d + 6) % 6;
    else if (max === g) hh = (b-r)/d + 2;
    else hh = (r-g)/d + 4;
    hh *= 60;
  }
  return { h: Math.round(hh), s: Math.round(ss*100), l: Math.round(ll*100) };
}

function initHueWheel(panel, onChange, currentHex) {
  const btn      = panel.querySelector('.sp-hue-open');
  const pop      = panel.querySelector('#sp-hue-popover');
  const svCanvas = panel.querySelector('#sp-sv-canvas');
  const hCanvas  = panel.querySelector('#sp-hue-canvas');
  const preview  = panel.querySelector('#sp-preview');
  const hexInput = panel.querySelector('#sp-hex-input');
  if (!btn || !pop || !svCanvas || !hCanvas) return;

  const sc = svCanvas.getContext('2d');
  const hc = hCanvas.getContext('2d');

  let hsl = hexToHsl(currentHex || '#C6F135');
  if (hsl.l < 8)  hsl.l = 55;
  if (hsl.s < 15) hsl.s = 85;

  let svX = hsl.s / 100;
  let svY = 1 - hsl.l / 100;
  let hueX = hsl.h / 360;

  function commit() {
    const hex = hslToHex(Math.round(hueX*360), Math.round(svX*100), Math.round((1-svY)*100));
    if (preview)  { preview.style.background = hex; }
    if (hexInput) { hexInput.value = hex; }
    if (btn)      { btn.querySelector('.sp-hue-dot').style.background = hex; }
    onChange(hex);
  }

  function drawSV() {
    const W = svCanvas.width, H = svCanvas.height;
    const hDeg = Math.round(hueX * 360);
    const gradW = sc.createLinearGradient(0,0,W,0);
    gradW.addColorStop(0, '#fff');
    gradW.addColorStop(1, `hsl(${hDeg},100%,50%)`);
    sc.fillStyle = gradW; sc.fillRect(0,0,W,H);
    const gradB = sc.createLinearGradient(0,0,0,H);
    gradB.addColorStop(0, 'rgba(0,0,0,0)');
    gradB.addColorStop(1, '#000');
    sc.fillStyle = gradB; sc.fillRect(0,0,W,H);
    const cx = svX*W, cy = svY*H;
    sc.beginPath(); sc.arc(cx,cy,7,0,Math.PI*2);
    sc.strokeStyle = '#fff'; sc.lineWidth = 2; sc.stroke();
    sc.beginPath(); sc.arc(cx,cy,5,0,Math.PI*2);
    sc.strokeStyle = 'rgba(0,0,0,0.4)'; sc.lineWidth = 1; sc.stroke();
  }

  function drawHue() {
    const W = hCanvas.width, H = hCanvas.height;
    const grad = hc.createLinearGradient(0,0,W,0);
    for (let i = 0; i <= 12; i++) grad.addColorStop(i/12, `hsl(${i*30},100%,50%)`);
    hc.fillStyle = grad; hc.fillRect(0,0,W,H);
    const cx = hueX * W;
    hc.fillStyle = '#fff'; hc.fillRect(cx-2,0,4,H);
    hc.fillStyle = 'rgba(0,0,0,0.4)'; hc.fillRect(cx-1,0,2,H);
  }

  function render() { drawSV(); drawHue(); commit(); }

  // drag ด้วย Pointer Events + capture — event วิ่งบน canvas เอง ไม่มี listener ที่ window
  function dragOn(canvas, onPoint) {
    let dragging = false;
    canvas.addEventListener('pointerdown', e => {
      dragging = true;
      canvas.setPointerCapture?.(e.pointerId);
      onPoint(e);
    });
    canvas.addEventListener('pointermove', e => { if (dragging) onPoint(e); });
    canvas.addEventListener('pointerup',   () => { dragging = false; });
    canvas.addEventListener('pointercancel', () => { dragging = false; });
  }

  dragOn(svCanvas, e => {
    const rect = svCanvas.getBoundingClientRect();
    svX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    svY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    render();
  });

  dragOn(hCanvas, e => {
    const rect = hCanvas.getBoundingClientRect();
    hueX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    render();
  });

  if (hexInput) {
    hexInput.addEventListener('input', e => {
      const v = e.target.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        const h2 = hexToHsl(v);
        hsl = h2; hueX = h2.h/360; svX = h2.s/100; svY = 1 - h2.l/100;
        render();
      }
    });
    hexInput.addEventListener('keydown', e => { if (e.key === 'Enter') hexInput.blur(); });
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isHidden = pop.hidden;
    pop.hidden = !isHidden;
    if (isHidden) {
      const cur = hexToHsl(getSettings().accent);
      hsl = cur; hueX = cur.h/360; svX = cur.s/100; svY = 1 - cur.l/100;
      render();
    }
  });

  // ปิด popover เมื่อคลิกนอก — ผูกกับ panel (ไม่ใช่ document) และผูกครั้งเดียวต่อ build
  panel.addEventListener('click', e => {
    if (!pop.hidden && !btn.contains(e.target) && !pop.contains(e.target)) pop.hidden = true;
  });

  render();
}

// Signal app to re-render dynamic parts (lang-sensitive text)
function dispatchPageRerender() {
  window.dispatchEvent(new CustomEvent('pf:settings-changed'));
}

// ─── SVG icons (inline, no deps) ─────────────────────────────
const GEAR_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65
    0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65
    1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65
    0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2
    2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4
    0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65
    1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</svg>`;

const CLOSE_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" aria-hidden="true">
  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

const MOON_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`;

const SUN_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" aria-hidden="true">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.42"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.28"/>
</svg>`;

const SYS_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" aria-hidden="true">
  <rect x="2" y="3" width="20" height="14" rx="2"/>
  <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
</svg>`;

const ANIM_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <path d="M5 3l14 9-14 9V3z"/>
</svg>`;

const CURSOR_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <path d="M5 3l6.5 18 3-6.5L21 11.5z"/>
</svg>`;

const TRAIL_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <circle cx="19" cy="5" r="2.5"/><circle cx="14" cy="10" r="2" opacity=".7"/>
  <circle cx="9.5" cy="14.5" r="1.5" opacity=".45"/><circle cx="6" cy="18" r="1" opacity=".3"/>
</svg>`;

const ADAPT_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`;

const BG_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <circle cx="12" cy="12" r="3"/>
  <circle cx="12" cy="12" r="8" stroke-dasharray="2 3"/>
  <circle cx="12" cy="12" r="1" fill="currentColor"/>
</svg>`;

const PERF_PERFORMANCE_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="19" cy="5" r="3" fill="currentColor" stroke="none"/>
</svg>`;

const FPS_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  <path d="M7 8v5M10 10v3M13 7v6M16 9v4" stroke-linecap="round"/>
</svg>`;

const PERF_MEDIUM_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" aria-hidden="true">
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
</svg>`;

const PERF_ECO_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path d="M12 22V12m0 0C12 6 7 3 2 3c0 7 3 12 10 13zm0 0c0-6 5-9 10-9-1 7-5 12-10 13"/>
</svg>`;

const MOTION_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <path d="M3 12h4l3-7 4 14 3-7h4"/>
</svg>`;
