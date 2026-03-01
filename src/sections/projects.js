/**
 * sections/projects.js
 */

const GH_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.09.682-.217.682-.482
  0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.341-3.369-1.341-.454-1.156-1.11-1.463-1.11-1.463
  -.908-.62.069-.608.069-.608 1.003.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.087 2.91.831
  .09-.646.349-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682
  -.103-.254-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.026A9.578 9.578 0 0 1 12 6.836
  c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.026 2.748-1.026.546 1.376.202 2.394.1 2.646
  .64.698 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852
  0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.166 22 16.418 22 12
  c0-5.523-4.477-10-10-10z"/>
</svg>`;

const EXT_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
</svg>`;

export function renderProjects({ projects }, t) {
  const section = document.createElement('section');
  section.id = 'projects';

  section.innerHTML = `
    <p class="section-label reveal">${t('label_projects')}</p>
    <h2 class="section-title reveal d1">${t('title_projects')}</h2>
    <div class="projects-grid">
      ${projects.map((p, i) => `
        <article class="project-card reveal d${(i % 3) + 1}">
          <div class="project-header">
            <div class="project-icon" aria-hidden="true">${p.icon}</div>
            <div class="project-actions">
              ${p.github ? `
                <a href="${p.github}" target="_blank" rel="noopener noreferrer"
                   class="project-link-btn" title="${t('github')}" aria-label="${t('github')} — ${p.name}">
                  ${GH_ICON}
                </a>` : ''}
              ${p.demo ? `
                <a href="${p.demo}" target="_blank" rel="noopener noreferrer"
                   class="project-link-btn" title="${t('demo')}" aria-label="${t('demo')} — ${p.name}">
                  ${EXT_ICON}
                </a>` : ''}
            </div>
          </div>
          <h3 class="project-name">${p.name}</h3>
          <p class="project-desc">${p.description}</p>
          <div class="project-techs" aria-label="Technologies">
            ${p.tech.map(tag => `<span class="project-tech">${tag}</span>`).join('')}
          </div>
        </article>
      `).join('')}
    </div>
  `;

  return section;
}
