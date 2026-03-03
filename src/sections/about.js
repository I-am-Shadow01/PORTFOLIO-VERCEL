/**
 * sections/about.js — enhanced
 */

export function renderAbout({ about }, t) {
  const section = document.createElement('section');
  section.id = 'about';

  section.innerHTML = `
    <div class="section-eyebrow reveal">
      <span class="section-label">${t('label_about')}</span>
      <span class="section-line"></span>
    </div>

    <div class="about-grid">
      <div class="about-text-col">
        <h2 class="section-title reveal d1">${t('title_about')}</h2>
        <div class="about-bio reveal d2">
          ${about.bio.map(p => `<p>${p}</p>`).join('')}
        </div>
        <div class="about-tags reveal d3">
          ${about.tags.map(tag => `
            <span class="about-tag">
              <span class="about-tag-dot"></span>${tag}
            </span>
          `).join('')}
        </div>
      </div>

      <div class="about-right-col">
        <!-- Terminal card -->
        <div class="terminal-card reveal d1">
          <div class="terminal-top">
            <span class="t-dot t-red"></span>
            <span class="t-dot t-yellow"></span>
            <span class="t-dot t-green"></span>
            <span class="t-title">~/whoami</span>
          </div>
          <div class="terminal-body">
            <p><span class="t-prompt">$</span> <span class="t-cmd">whoami</span></p>
            <p class="t-out">${about.bio[0].replace(/`([^`]+)`/g, '<code>$1</code>')}</p>
            <p class="t-blank"></p>
            <p><span class="t-prompt">$</span> <span class="t-cmd">cat skills.txt</span></p>
            <p class="t-out t-accent">${about.tags.join('  •  ')}</p>
            <p class="t-blank"></p>
            <p><span class="t-prompt">$</span> <span class="t-cursor-blink">▌</span></p>
          </div>
        </div>

        <!-- Stats -->
        <div class="about-stats reveal d2">
          ${about.stats.map(s => `
            <div class="stat-card">
              <div class="stat-num">${s.number}</div>
              <div class="stat-label">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  return section;
}
