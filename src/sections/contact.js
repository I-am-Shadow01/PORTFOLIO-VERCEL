/**
 * sections/contact.js
 */

export function renderContact({ contact }, t) {
  const section = document.createElement('section');
  section.id = 'contact';

  section.innerHTML = `
    <p class="section-label reveal">${t('label_contact')}</p>
    <div class="contact-inner">
      <h2 class="section-title reveal d1">${contact.heading}</h2>
      <p class="contact-sub reveal d2">${contact.subheading}</p>
      <div class="contact-grid">
        ${contact.links.map((link, i) => {
          const ext = !link.href.startsWith('mailto');
          return `
            <a href="${link.href}"
               ${ext ? 'target="_blank" rel="noopener noreferrer"' : ''}
               class="contact-item reveal d${(i % 3) + 1}${link.copyable ? ' copyable' : ''}"
               ${link.copyable ? `data-copy="${link.value}"` : ''}
               aria-label="${link.label}: ${link.value}">
              ${link.copyable ? `<span class="copy-toast" aria-live="polite">${t('copied')}</span>` : ''}
              <div class="contact-icon" aria-hidden="true">${link.icon}</div>
              <div class="contact-info">
                <span class="contact-label">${link.label}</span>
                <span class="contact-value">${link.value}</span>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `;

  section.querySelectorAll('.copyable').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.preventDefault();
      const text = el.dataset.copy;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = Object.assign(document.createElement('textarea'), { value: text });
        Object.assign(ta.style, { position:'fixed', opacity:'0' });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      el.classList.add('copied');
      setTimeout(() => el.classList.remove('copied'), 2000);
    });
  });

  return section;
}
