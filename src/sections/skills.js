/**
 * sections/skills.js — with animated skill bars + tech ticker
 */

export function renderSkills({ skills }, t) {
  const section = document.createElement('section');
  section.id = 'skills';

  // Flatten all tags for ticker
  const allTags = skills.flatMap(c => c.tags);
  const tickerItems = [...allTags, ...allTags]; // duplicate for seamless loop

  section.innerHTML = `
    <div class="section-eyebrow reveal">
      <span class="section-label">${t('label_skills')}</span>
      <span class="section-line"></span>
    </div>
    <h2 class="section-title reveal d1">${t('title_skills')}</h2>

    <!-- Ticker tape -->
    <div class="ticker-wrap reveal d2" aria-hidden="true">
      <div class="ticker-inner">
        ${tickerItems.map(tag => `
          <span class="ticker-item">
            <span class="ticker-dot"></span>${tag}
          </span>
        `).join('')}
      </div>
    </div>

    <div class="skills-grid">
      ${skills.map((cat, i) => `
        <div class="skill-cat reveal d${(i % 4) + 1}">
          <div class="skill-cat-header">
            <p class="skill-cat-title">${cat.category}</p>
            <span class="skill-cat-count">${cat.tags.length}</span>
          </div>
          <div class="skill-tags">
            ${cat.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  return section;
}
