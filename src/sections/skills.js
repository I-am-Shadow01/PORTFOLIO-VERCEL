/**
 * sections/skills.js
 */

export function renderSkills({ skills }, t) {
  const section = document.createElement('section');
  section.id = 'skills';

  section.innerHTML = `
    <p class="section-label reveal">${t('label_skills')}</p>
    <h2 class="section-title reveal d1">${t('title_skills')}</h2>
    <div class="skills-grid">
      ${skills.map((cat, i) => `
        <div class="skill-cat reveal d${(i % 4) + 1}">
          <p class="skill-cat-title">${cat.category}</p>
          <div class="skill-tags">
            ${cat.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  return section;
}
