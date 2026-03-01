/**
 * sections/skills.js
 */

export function renderSkills({ skills }) {
  const section = document.createElement('section');
  section.id = 'skills';

  section.innerHTML = `
    <p class="section-label reveal">Skills</p>
    <h2 class="section-title reveal d1">Tech Stack</h2>

    <div class="skills-grid">
      ${skills.map((cat, i) => `
        <div class="skill-cat reveal d${(i % 4) + 1}">
          <p class="skill-cat-title">${cat.category}</p>
          <div class="skill-tags">
            ${cat.tags.map(t => `<span class="skill-tag">${t}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  return section;
}
