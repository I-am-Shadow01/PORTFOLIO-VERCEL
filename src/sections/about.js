/**
 * sections/about.js
 */

export function renderAbout({ about }) {
  const section = document.createElement('section');
  section.id = 'about';

  section.innerHTML = `
    <p class="section-label reveal">About</p>

    <div class="about-grid">

      <!-- Bio -->
      <div>
        <h2 class="section-title reveal d1">Who I Am</h2>
        <div class="about-bio reveal d2">
          ${about.bio.map(p => `<p>${p}</p>`).join('')}
        </div>
      </div>

      <!-- Stats -->
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
