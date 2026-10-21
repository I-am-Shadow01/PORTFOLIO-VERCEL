import { localize } from '../utils/localize.js';

const GH_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.162 19.487c.5.093.682-.217.682-.482l-.013-1.7c-2.782.603-3.369-1.341-3.369-1.341-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.532 1.03 1.532 1.03.892 1.529 2.341 1.087 2.91.831.09-.646.349-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.254-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.026A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.026 2.748-1.026.546 1.376.202 2.394.1 2.646.64.698 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10 10 0 0 0 12 2z"/></svg>';
const EXT_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

const CATEGORIES = ['all', 'apps', 'ai', 'tools', 'bots', 'web'];
let repoMetaPromise;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function formatPushed(date, lang) {
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.valueOf())) return '';
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', {
    month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(parsed);
}

function fetchPublicRepos(projects) {
  if (!window.fetch || !projects.length) return Promise.resolve(null);
  if (repoMetaPromise) return repoMetaPromise;
  const owner = new URL(projects[0].github).pathname.split('/')[1];
  const url = `https://api.github.com/users/${encodeURIComponent(owner)}/repos?type=owner&per_page=100`;
  repoMetaPromise = window.fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  }).then(response => {
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    return response.json();
  }).then(rows => {
    if (!Array.isArray(rows)) throw new Error('Unexpected GitHub response');
    return new Map(rows.filter(row => row && !row.private && typeof row.name === 'string')
      .map(row => [row.name.toLowerCase(), row.pushed_at]));
  }).catch(() => null);
  return repoMetaPromise;
}

function projectCard(project, index, t) {
  const lang = t.lang;
  const desc = localize(project.description, lang);
  const title = escapeHtml(project.name);
  const highlights = localize(project.highlights, lang);
  return `
    <article class="project-card case-card reveal ${project.featured ? 'case-featured' : ''}"
             data-project="${escapeHtml(project.slug)}" data-category="${escapeHtml(project.type)}"
             aria-labelledby="case-${escapeHtml(project.slug)}">
      <span class="project-sweep" aria-hidden="true"></span>
      <div class="case-topline">
        <span class="case-serial">${String(index + 1).padStart(2, '0')} / ${String(t.total).padStart(2, '0')}</span>
        <span class="case-label">${escapeHtml(localize(project.eyebrow, lang))}</span>
        ${project.featured ? `<span class="case-feature-tag">${escapeHtml(t('case_featured'))}</span>` : ''}
      </div>
      <div class="case-main">
        <div class="case-info">
          <div class="project-header">
            <div class="project-icon" aria-hidden="true">${escapeHtml(project.icon)}</div>
            <div class="project-actions">
              <a class="project-link-btn" href="${escapeHtml(project.github)}"
                 target="_blank" rel="noopener noreferrer"
                 aria-label="${escapeHtml(t('github'))}: ${title}" title="${escapeHtml(t('github'))}">${GH_ICON}</a>
              ${project.demo ? `<a class="project-link-btn" href="${escapeHtml(project.demo)}"
                   target="_blank" rel="noopener noreferrer"
                   aria-label="${escapeHtml(t('demo'))}: ${title}" title="${escapeHtml(t('demo'))}">${EXT_ICON}</a>` : ''}
            </div>
          </div>
          <h3 id="case-${escapeHtml(project.slug)}" class="project-name">${title}</h3>
          <p class="project-desc">${escapeHtml(desc)}</p>
          <ul class="case-highlights">
            ${highlights.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
          <div class="project-techs" aria-label="${escapeHtml(t('case_stack'))}">
            ${project.tech.map(tag => `<span class="project-tech">${escapeHtml(tag)}</span>`).join('')}
          </div>
          <div class="case-links">
            <a class="case-primary-link" href="${escapeHtml(project.github)}"
               target="_blank" rel="noopener noreferrer">${GH_ICON}<span>${escapeHtml(t('case_source'))}</span>${EXT_ICON}</a>
            ${project.demo ? `<a class="case-secondary-link" href="${escapeHtml(project.demo)}"
               target="_blank" rel="noopener noreferrer">${escapeHtml(t('demo'))} ${EXT_ICON}</a>` : ''}
          </div>
        </div>
        <div class="case-visual" aria-hidden="true">
          <div class="case-visual-head"><span></span><span></span><span></span><small>${escapeHtml(project.slug.toUpperCase())}</small></div>
          <div class="case-visual-body">
            <span class="case-code-mark">&gt;_</span>
            ${project.preview.map((line, i) => `<div class="case-code-line"><span>${String(i + 1).padStart(2, '0')}</span><b>${escapeHtml(line)}</b><i></i></div>`).join('')}
            <span class="case-code-footer">SYSTEM / ONLINE <span class="case-visual-pulse"></span></span>
          </div>
        </div>
      </div>
      <div class="case-bottomline">
        <details class="case-detail">
          <summary>${escapeHtml(t('case_explore'))}<span aria-hidden="true">+</span></summary>
          <div class="case-detail-body">
            <strong>${escapeHtml(t('case_approach'))}</strong>
            <p>${escapeHtml(localize(project.approach, lang))}</p>
          </div>
        </details>
        <span class="case-updated">${escapeHtml(t('case_pushed'))}
          <time data-repo-date="${escapeHtml(project.slug)}" datetime="${escapeHtml(project.updated)}">${escapeHtml(formatPushed(project.updated, lang))}</time>
        </span>
      </div>
    </article>`;
}

export function renderProjects({ projects }, t) {
  const section = document.createElement('section');
  section.id = 'projects';
  const currentT = Object.assign(key => t(key), { total: projects.length });
  const lang = t.lang;

  section.innerHTML = `
    <div class="section-eyebrow reveal">
      <span class="section-label">${escapeHtml(t('label_projects'))}</span>
      <span class="section-line"></span>
    </div>
    <div class="case-intro reveal d1">
      <div>
        <h2 class="section-title">${escapeHtml(t('title_projects'))}</h2>
        <p class="case-subtitle">${escapeHtml(t('case_subtitle'))}</p>
      </div>
      <a class="case-profile-link" href="https://github.com/${escapeHtml(new URL(projects[0].github).pathname.split('/')[1])}"
         target="_blank" rel="noopener noreferrer">${GH_ICON} ${escapeHtml(t('case_profile'))} ${EXT_ICON}</a>
    </div>
    <div class="case-toolbar reveal d2">
      <div class="case-filters" role="group" aria-label="${escapeHtml(t('case_filters'))}">
        ${CATEGORIES.map((category, i) => `
          <button class="case-filter${i === 0 ? ' active' : ''}" type="button"
                  data-filter="${category}" aria-pressed="${i === 0}">
            ${escapeHtml(t('case_filter_' + category))}
          </button>`).join('')}
      </div>
      <label class="case-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
        <span class="sr-only">${escapeHtml(t('case_search_label'))}</span>
        <input type="search" autocomplete="off" placeholder="${escapeHtml(t('case_search'))}"
               aria-label="${escapeHtml(t('case_search_label'))}" />
        <kbd>/</kbd>
      </label>
    </div>
    <div class="case-result-row reveal">
      <span class="case-result-count" role="status" aria-live="polite"></span>
      <span class="case-data-source">${escapeHtml(t('case_data_note'))}</span>
    </div>
    <div class="projects-grid case-grid">
      ${projects.map((p, i) => projectCard(p, i, currentT)).join('')}
    </div>
    <p class="case-empty" hidden role="status">${escapeHtml(t('case_empty'))}</p>
  `;

  const filters = [...section.querySelectorAll('.case-filter')];
  const search = section.querySelector('.case-search input');
  const cards = [...section.querySelectorAll('.case-card')];
  const count = section.querySelector('.case-result-count');
  const empty = section.querySelector('.case-empty');
  let active = 'all';

  function updateResults() {
    const query = search.value.trim().toLocaleLowerCase(lang === 'th' ? 'th' : 'en');
    let shown = 0;
    projects.forEach((project, i) => {
      const text = [project.name, project.tech.join(' '),
        localize(project.description, lang), localize(project.eyebrow, lang)].join(' ').toLocaleLowerCase(lang === 'th' ? 'th' : 'en');
      const visible = (active === 'all' || project.type === active) && (!query || text.includes(query));
      cards[i].hidden = !visible;
      if (visible) shown++;
    });
    count.textContent = `${shown} / ${projects.length} ${t('case_results')}`;
    empty.hidden = shown !== 0;
  }

  filters.forEach(button => button.addEventListener('click', () => {
    active = button.dataset.filter;
    filters.forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    updateResults();
  }));
  search.addEventListener('input', updateResults);
  section.addEventListener('keydown', event => {
    if (event.key === '/' && event.target !== search && !event.altKey && !event.ctrlKey &&
        !event.metaKey && !['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
      event.preventDefault();
      search.focus();
    } else if (event.key === 'Escape' && event.target === search) {
      search.value = '';
      updateResults();
      search.blur();
    }
  });
  updateResults();

  if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) {
    cards.forEach(card => card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    }, { passive: true }));
  }

  fetchPublicRepos(projects).then(byName => {
    if (!byName || !section.isConnected) return;
    projects.forEach(project => {
      const repoName = new URL(project.github).pathname.split('/').pop().toLowerCase();
      const pushed = byName.get(repoName);
      const target = section.querySelector(`[data-repo-date="${project.slug}"]`);
      if (!pushed || !target || !Number.isFinite(Date.parse(pushed))) return;
      target.dateTime = pushed.slice(0, 10);
      target.textContent = formatPushed(pushed, lang);
    });
  });

  return section;
}
