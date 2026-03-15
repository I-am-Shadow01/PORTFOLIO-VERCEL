/**
 * src/components/settings-panel.js
 * Full settings drawer with all controls
 */

import {
  ACCENT_PRESETS,
  getSettings,
  saveSettings,
  resetSettings,
  onSettingsChange,
} from '../utils/settings.js';
import { createT } from '../i18n.js';

export function createSettingsPanel() {
  let t = createT(getSettings());

  // Adaptive quality hint updater (attached/detached with each build)
  function _onAdaptiveQuality(e) {
    const hint = panel.querySelector('.sp-perf-hint');
    if (!hint || getSettings().perfMode !== 'performance') return;
    const labels = ['Ultra quality ⚡', 'High quality', 'Reduced quality 🔋'];
    hint.textContent = `${e.detail.fps} FPS — ${labels[e.detail.step] || ''}`;
  }

  // ── Panel element ───────────────────────────────────────
  const panel = document.createElement('div');
  panel.id    = 'settings-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Settings');

  // Static shell — created once, never replaced in build()
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

  // ── Trigger button ──────────────────────────────────────
  const trigger = document.createElement('button');
  trigger.id            = 'settings-trigger';
  trigger.className     = 'settings-trigger';
  trigger.setAttribute('aria-label', 'Open settings');
  trigger.setAttribute('aria-controls', 'settings-panel');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML     = GEAR_ICON;

  // ── Backdrop ────────────────────────────────────────────
  const backdrop = document.createElement('div');
  backdrop.className = 'settings-backdrop';

  // ── Build panel ─────────────────────────────────────────
  function build() {
    // Header is static — only update text, no scroll reset
    const savedScroll = _spBody.scrollTop;
    _spTitleEl.textContent = t('settings_title');
    _spCloseBtn.setAttribute('aria-label', t('settings_close'));
    _spCloseBtn.onclick = close;

    const s = getSettings();
    t = createT(s);
    _spTitleEl.textContent = t('settings_title');

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

        <!-- Toggles row -->
        <div class="sp-section">
          <!-- Animations -->
          <div class="sp-toggle-row">
            <div class="sp-toggle-info">
              ${ANIM_ICON}
              <span>${t('settings_anim')}</span>
            </div>
            <button class="sp-toggle ${s.anim ? 'on' : ''}"
                    data-setting="anim" data-value="${!s.anim}"
                    role="switch" aria-checked="${s.anim}"
                    aria-label="${t('settings_anim')}">
              <span class="sp-toggle-knob"></span>
            </button>
          </div>
          <!-- Custom cursor -->
          <div class="sp-toggle-row">
            <div class="sp-toggle-info">
              ${CURSOR_ICON}
              <span>${t('settings_cursor')}</span>
            </div>
            <button class="sp-toggle ${s.cursor ? 'on' : ''}"
                    data-setting="cursor" data-value="${!s.cursor}"
                    role="switch" aria-checked="${s.cursor}"
                    aria-label="${t('settings_cursor')}">
              <span class="sp-toggle-knob"></span>
            </button>
          </div>
          <!-- Background FX -->
          <div class="sp-toggle-row">
            <div class="sp-toggle-info">
              ${BG_ICON}
              <span>${t('settings_bgfx')}</span>
            </div>
            <button class="sp-toggle ${s.bgfx ? 'on' : ''}"
                    data-setting="bgfx" data-value="${!s.bgfx}"
                    role="switch" aria-checked="${s.bgfx}"
                    aria-label="${t('settings_bgfx')}">
              <span class="sp-toggle-knob"></span>
            </button>
          </div>
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

        <!-- FPS Counter toggle -->
        <div class="sp-section">
          <div class="sp-toggle-row">
            <div class="sp-toggle-info">
              ${FPS_ICON}
              <span>${t('settings_showfps')}</span>
            </div>
            <button class="sp-toggle ${s.showFps ? 'on' : ''}"
                    data-setting="showFps" data-value="${!s.showFps}"
                    role="switch" aria-checked="${s.showFps}"
                    aria-label="${t('settings_showfps')}">
              <span class="sp-toggle-knob"></span>
            </button>
          </div>
        </div>

        <!-- Reset -->
        <div class="sp-section">
          <button class="sp-reset" id="sp-reset-btn">${t('settings_reset')}</button>
        </div>

      </div>
    `;

    // Restore scroll position (header is static, no flash)
    if (savedScroll > 0) _spBody.scrollTop = savedScroll;

    // ── Subscribe to adaptive quality updates ────────────────
    window.removeEventListener('pf:adaptive-quality', _onAdaptiveQuality);
    window.addEventListener('pf:adaptive-quality', _onAdaptiveQuality);

    // ── Event listeners (re-bind each rebuild) ──────────────
    // Segmented buttons
    panel.querySelectorAll('.sp-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.setting;
        const val = btn.dataset.value;
        saveSettings({ [key]: val });
        build();           // full rebuild so labels retranslate
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

    // Hue wheel picker
    initHueWheel(panel, (hex) => {
      saveSettings({ accent: hex });
      dispatchPageRerender();
    }, getSettings().accent);

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

    // Reset
    panel.querySelector('#sp-reset-btn')?.addEventListener('click', () => {
      resetSettings();
      build();
      dispatchPageRerender();
    });


  }

  // ── Open / Close ────────────────────────────────────────
  function open() {
    build();
    panel.classList.add('open');
    backdrop.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    _spCloseBtn.focus();
  }

  function close() {
    window.removeEventListener('pf:adaptive-quality', _onAdaptiveQuality);
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    trigger.focus();
  }

  // ── Wire up ─────────────────────────────────────────────
  trigger.addEventListener('click', () => {
    panel.classList.contains('open') ? close() : open();
  });

  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  return { panel, trigger, backdrop };
}

// ─── Hue Wheel Color Picker ───────────────────────────────────
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
  let h = hex.replace('#','');
  if (h.length===3) h = h.split('').map(c=>c+c).join('');
  const r=parseInt(h.slice(0,2),16)/255, g=parseInt(h.slice(2,4),16)/255, b=parseInt(h.slice(4,6),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let hh=0, ss=0, ll=(max+min)/2;
  if (d) {
    ss = d / (1 - Math.abs(2*ll-1));
    if (max===r) hh=((g-b)/d+6)%6;
    else if (max===g) hh=(b-r)/d+2;
    else hh=(r-g)/d+4;
    hh *= 60;
  }
  return {h:Math.round(hh), s:Math.round(ss*100), l:Math.round(ll*100)};
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

  // Cursor positions (0-1)
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
    // White → pure hue (horizontal)
    const gradW = sc.createLinearGradient(0,0,W,0);
    gradW.addColorStop(0, '#fff');
    gradW.addColorStop(1, `hsl(${hDeg},100%,50%)`);
    sc.fillStyle = gradW; sc.fillRect(0,0,W,H);
    // Transparent → black (vertical)
    const gradB = sc.createLinearGradient(0,0,0,H);
    gradB.addColorStop(0, 'rgba(0,0,0,0)');
    gradB.addColorStop(1, '#000');
    sc.fillStyle = gradB; sc.fillRect(0,0,W,H);
    // Cursor
    const cx = svX*W, cy = svY*H;
    sc.beginPath(); sc.arc(cx,cy,7,0,Math.PI*2);
    sc.strokeStyle='#fff'; sc.lineWidth=2; sc.stroke();
    sc.beginPath(); sc.arc(cx,cy,5,0,Math.PI*2);
    sc.strokeStyle='rgba(0,0,0,0.4)'; sc.lineWidth=1; sc.stroke();
  }

  function drawHue() {
    const W = hCanvas.width, H = hCanvas.height;
    const grad = hc.createLinearGradient(0,0,W,0);
    for (let i=0;i<=12;i++) grad.addColorStop(i/12, `hsl(${i*30},100%,50%)`);
    hc.fillStyle = grad; hc.fillRect(0,0,W,H);
    // Cursor line
    const cx = hueX * W;
    hc.fillStyle='#fff'; hc.fillRect(cx-2,0,4,H);
    hc.fillStyle='rgba(0,0,0,0.4)'; hc.fillRect(cx-1,0,2,H);
  }

  function render() { drawSV(); drawHue(); commit(); }

  // SV square — drag
  function onSVEvent(e) {
    e.preventDefault();
    const rect = svCanvas.getBoundingClientRect();
    const cx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const cy = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    svX = Math.max(0, Math.min(1, cx / rect.width));
    svY = Math.max(0, Math.min(1, cy / rect.height));
    render();
  }
  let svDrag = false;
  svCanvas.addEventListener('mousedown',  e => { svDrag=true; onSVEvent(e); });
  svCanvas.addEventListener('touchstart', e => { svDrag=true; onSVEvent(e); }, {passive:false});
  window.addEventListener('mousemove',  e => { if(svDrag) onSVEvent(e); });
  window.addEventListener('touchmove',  e => { if(svDrag) onSVEvent(e); }, {passive:false});
  window.addEventListener('mouseup',   () => svDrag=false);
  window.addEventListener('touchend',  () => svDrag=false);

  // Hue bar — drag
  function onHueEvent(e) {
    e.preventDefault();
    const rect = hCanvas.getBoundingClientRect();
    const cx = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    hueX = Math.max(0, Math.min(1, cx / rect.width));
    render();
  }
  let hueDrag = false;
  hCanvas.addEventListener('mousedown',  e => { hueDrag=true; onHueEvent(e); });
  hCanvas.addEventListener('touchstart', e => { hueDrag=true; onHueEvent(e); }, {passive:false});
  window.addEventListener('mousemove',  e => { if(hueDrag) onHueEvent(e); });
  window.addEventListener('touchmove',  e => { if(hueDrag) onHueEvent(e); }, {passive:false});
  window.addEventListener('mouseup',   () => hueDrag=false);
  window.addEventListener('touchend',  () => hueDrag=false);

  // Hex input
  if (hexInput) {
    hexInput.addEventListener('input', e => {
      const v = e.target.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        const h2 = hexToHsl(v);
        hsl = h2;
        hueX = h2.h/360;
        svX  = h2.s/100;
        svY  = 1 - h2.l/100;
        render();
      }
    });
    hexInput.addEventListener('keydown', e => { if(e.key==='Enter') { hexInput.blur(); } });
  }

  // Toggle popover
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isHidden = pop.hidden;
    pop.hidden = !isHidden;
    if (isHidden) {
      // Re-sync from current accent when opening
      const cur = hexToHsl(getSettings ? getSettings().accent : '#C6F135');
      hsl = cur; hueX=cur.h/360; svX=cur.s/100; svY=1-cur.l/100;
      render();
    }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !pop.contains(e.target)) pop.hidden = true;
  });

  render();
}

// Signal app to re-render dynamic parts (lang-sensitive text)
function dispatchPageRerender() {
  window.dispatchEvent(new CustomEvent('pf:settings-changed'));
}

// ─── SVG icons (inline, no deps) ──────────────────────────
const GEAR_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0
    0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65
    0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0
    0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2
    0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4
    0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65
    1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>`;

const SYS_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" aria-hidden="true">
  <rect x="2" y="3" width="20" height="14" rx="2"/>
  <line x1="8" y1="21" x2="16" y2="21"/>
  <line x1="12" y1="17" x2="12" y2="21"/>
</svg>`;

const ANIM_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <path d="M5 3l14 9-14 9V3z"/>
</svg>`;

const CURSOR_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" aria-hidden="true">
  <path d="M5 3l6.5 18 3-6.5L21 11.5z"/>
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
const PICKER_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path d="M12 2l-1 9h2L12 2z" fill="currentColor" stroke="none"/>
  <circle cx="12" cy="20" r="3"/>
  <line x1="12" y1="11" x2="12" y2="17"/>
</svg>`;
