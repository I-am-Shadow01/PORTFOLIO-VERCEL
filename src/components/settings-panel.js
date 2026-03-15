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
    // ── Save scroll position before rebuild ──────────────────
    const savedScroll = panel.querySelector('.sp-body')?.scrollTop ?? 0;
    const s = getSettings();
    t = createT(s);

    panel.innerHTML = `
      <div class="sp-header">
        <h2 class="sp-title">${t('settings_title')}</h2>
        <button class="sp-close" aria-label="${t('settings_close')}">${CLOSE_ICON}</button>
      </div>

      <div class="sp-body">

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
            <label class="sp-swatch sp-swatch-custom" title="Custom color" aria-label="Custom color">
              <input type="color" value="${ACCENT_PRESETS.find(p=>p.value===s.accent)?.value ?? s.accent}"
                     class="sp-color-input" aria-label="Custom accent color">
              ${PICKER_ICON}
            </label>
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
            <button class="sp-seg-btn sp-perf-btn ${s.perfMode === 'dynamic' || !s.perfMode ? 'active' : ''}"
                    data-setting="perfMode" data-value="dynamic">
              ${PERF_DYNAMIC_ICON}
              <span>${t('settings_perf_dynamic')}</span>
            </button>
            <button class="sp-seg-btn sp-perf-btn ${s.perfMode === 'performance' ? 'active' : ''}"
                    data-setting="perfMode" data-value="performance">
              ${PERF_PERFORMANCE_ICON}
              <span>${t('settings_perf_performance') || 'Performance'}</span>
            </button>
          </div>
          <p class="sp-perf-hint">${
            s.perfMode === 'eco'         ? t('settings_perf_eco_hint') :
            s.perfMode === 'performance' ? t('settings_perf_performance_hint') :
                                           t('settings_perf_dynamic_hint')
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

    // ── Restore scroll position after DOM rebuild ────────────
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const body = panel.querySelector('.sp-body');
        if (body && savedScroll > 0) body.scrollTop = savedScroll;
      });
    });

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

    // Color picker
    const colorInput = panel.querySelector('.sp-color-input');
    if (colorInput) {
      colorInput.addEventListener('input', (e) => {
        saveSettings({ accent: e.target.value });
        dispatchPageRerender();
      });
    }

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

    // Close button
    panel.querySelector('.sp-close')?.addEventListener('click', close);
  }

  // ── Open / Close ────────────────────────────────────────
  function open() {
    build();
    panel.classList.add('open');
    backdrop.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    panel.querySelector('.sp-close')?.focus();
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

const PERF_DYNAMIC_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
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
