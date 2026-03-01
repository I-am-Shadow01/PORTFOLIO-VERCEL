/**
 * sections/about.js
 */

export function renderAbout({ about }, t) {
  const section = document.createElement('section');
  section.id = 'about';

  section.innerHTML = `
    <p class="section-label reveal">${t('label_about')}</p>
    <div class="about-grid">
      <div>
        <h2 class="section-title reveal d1">${t('title_about')}</h2>
        <div class="about-bio reveal d2">
          ${about.bio.map(p => `<p>${p}</p>`).join('')}
        </div>
      </div>
      <div>
        <div class="about-stats">
          ${about.stats.map((s, i) => `
            <div class="stat-card reveal d${i + 1}">
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
