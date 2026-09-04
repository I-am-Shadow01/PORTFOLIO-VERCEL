/**
 * smoke.mjs — boots the REAL app.js headlessly and exercises the whole page:
 *   • sections render, typing animates, nav highlight observer attached
 *   • background canvas is drawing (stats > 0)
 *   • settings panel opens; toggles persist; language rebuild keeps DOM intact
 *   • clicks (ripple/burst/shockwave) don't throw
 *   • no uncaught module errors
 */
import { createEnv } from './env.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '../PORTFOLIO-VERCEL');
const env = createEnv({ width: 1280, height: 720 });
const { window, document } = env;

const errors = [];
window.addEventListener('error', e => errors.push('window: ' + e.message));

localStorage.setItem('pf_settings', JSON.stringify({
  theme: 'dark', lang: 'en', accent: '#C6F135', fontSize: 'md',
  anim: true, cursor: true, trail: true, bgfx: true,
  perfMode: 'performance', adaptive: true, showFps: true, motion: 100,
}));

// loadStyles() resolves immediately when the link tag is already present
const link = document.createElement('link');
link.rel = 'stylesheet'; link.href = './src/styles.css';
document.head.appendChild(link);

await import(pathToFileURL(path.join(root, 'src/app.js')).href);
await new Promise(r => setTimeout(r, 50));

const results = [];
function check(name, ok, extra = '') {
  results.push({ name, ok: !!ok, extra });
  if (!ok) console.error('FAIL:', name, extra);
}

// ── initial render ───────────────────────────────────────────
env.runFrames(120);
for (let i = 0; i < 40; i++) env.mouse(200 + i * 20, 300 + Math.sin(i) * 100);
env.runFrames(60);

check('nav rendered', document.querySelector('nav'));
const sections = ['hero','about','skills','projects','donate','contact'];
for (const id of sections) check(`section #${id}`, document.getElementById(id));
check('bg canvas present', document.getElementById('bg-canvas'));
check('fps overlay present', document.getElementById('fps-overlay'));
check('settings trigger present', document.getElementById('settings-trigger'));
check('scroll progress present', document.querySelector('.scroll-progress'));

// typing animation progresses
const typed1 = document.querySelector('.typed-text')?.textContent;
env.runFrames(200);
const typed2 = document.querySelector('.typed-text')?.textContent;
check('typing animation runs', typed1 !== undefined && typed1 !== typed2, `${JSON.stringify(typed1)} → ${JSON.stringify(typed2)}`);

// background is drawing (canvas stats accumulated)
const draws = Object.values(env.stats.methodCalls).reduce((a,b)=>a+b,0);
check('background draws', draws > 100, `draw calls=${draws}`);

// ── interactions ─────────────────────────────────────────────
env.click(640, 300);
env.scroll(800);
env.runFrames(60);
check('click + scroll ok', true);

// nav go()
window.__go && window.__go('projects');
env.runFrames(30);

// ── settings panel ───────────────────────────────────────────
const trigger = document.getElementById('settings-trigger');
trigger.click();
await new Promise(r => setTimeout(r, 20));
check('settings panel opens', document.getElementById('settings-panel').classList.contains('open'));

// toggle cursor off
const cursorToggle = document.querySelector('.sp-toggle[data-setting="cursor"]');
cursorToggle.click();
await new Promise(r => setTimeout(r, 20));
env.runFrames(10);
check('cursor toggle persists', JSON.parse(localStorage.getItem('pf_settings')).cursor === false);

// language → th (rebuild content)
const settingsMod = await import(pathToFileURL(path.join(root, 'src/utils/settings.js')).href);
settingsMod.saveSettings({ lang: 'th' });
window.dispatchEvent(new window.CustomEvent('pf:settings-changed'));
await new Promise(r => setTimeout(r, 30));
env.runFrames(30);
check('thai rebuild keeps sections', sections.every(id => document.getElementById(id)));
check('thai nav text', document.querySelector('.nav-link')?.textContent.trim() === 'เกี่ยวกับ',
      document.querySelector('.nav-link')?.textContent);

// language back to en
settingsMod.saveSettings({ lang: 'en' });
window.dispatchEvent(new window.CustomEvent('pf:settings-changed'));
await new Promise(r => setTimeout(r, 30));
env.runFrames(30);

// perfMode switch (background must adapt without teardown errors)
settingsMod.saveSettings({ perfMode: 'eco' });
env.runFrames(60);
settingsMod.saveSettings({ perfMode: 'performance' });
env.runFrames(60);
check('perf mode switch ok', true);

// bgfx off/on
settingsMod.saveSettings({ bgfx: false });
window.dispatchEvent(new window.CustomEvent('pf:settings-changed'));
env.runFrames(10);
check('bgfx off removes canvas', !document.getElementById('bg-canvas'));
settingsMod.saveSettings({ bgfx: true });
window.dispatchEvent(new window.CustomEvent('pf:settings-changed'));
env.runFrames(30);
check('bgfx on restores canvas', !!document.getElementById('bg-canvas'));

// ── errors ───────────────────────────────────────────────────
check('no window errors', errors.length === 0, errors.join(' | '));

console.log('\n===== SMOKE RESULTS =====');
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.extra && !r.ok ? '  (' + r.extra + ')' : ''}`);
const failed = results.filter(r => !r.ok).length;
console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
