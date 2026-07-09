/**
 * sections/donate.js
 *
 * PromptPay QR ถูกสร้างทั้งหมดฝั่ง client (ไม่มีการส่ง PromptPay ID
 * หรือจำนวนเงินออกไปเซิร์ฟเวอร์ภายนอกใดๆ):
 *   - promptpay-qr  → สร้าง payload string ตามมาตรฐาน EMVCo/BOT
 *   - qrcode        → วาด payload นั้นเป็น QR ลง <canvas>
 * ทั้งสอง lib โหลดแบบ dynamic import() จาก esm.sh เฉพาะตอนเข้า section นี้
 */

const EXT_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
</svg>`;

// การ์ด "คัดลอกแล้วโอนเอง" — ใช้ซ้ำได้กับทุกช่องทาง (ธนาคาร, TrueMoney, ฯลฯ)
function copyCardHtml({ className, icon, copyValue, label, value, heading, hint }) {
  return `
    <div class="donate-copy-card ${className} reveal d2">
      ${heading ? `<p class="donate-links-heading">${heading}</p>` : ''}
      <button type="button" class="contact-item donate-copy-btn" data-copy="${copyValue}">
        <span class="copy-toast" aria-live="polite" data-copied-label></span>
        <div class="contact-icon" aria-hidden="true">${icon}</div>
        <div class="contact-info">
          <span class="contact-label">${label}</span>
          <span class="contact-value">${value}</span>
        </div>
      </button>
      ${hint ? `<p class="donate-copy-hint">${hint}</p>` : ''}
    </div>
  `;
}

let qrLibsPromise = null;
function loadQrLibs() {
  if (!qrLibsPromise) {
    qrLibsPromise = Promise.all([
      import('https://esm.sh/promptpay-qr@0.5.0'),
      import('https://esm.sh/qrcode@1.5.4'),
    ]).then(([ppqr, qrcode]) => ({
      generatePayload: ppqr.default,
      QRCode: qrcode.default,
    }));
  }
  return qrLibsPromise;
}

export function renderDonate({ donate }, t) {
  const section = document.createElement('section');
  section.id = 'donate';
  if (!donate) return section;

  const pp = donate.promptpay || {};
  const bank = donate.bankTransfer || {};
  const tmn = donate.trueMoneyWallet || {};
  const validLinks = (donate.links || []).filter(
    (l) => l.href && !/yourusername/i.test(l.href)
  );
  const nothingConfigured = !pp.enabled && !bank.enabled && !tmn.enabled && !validLinks.length;

  section.innerHTML = `
    <div class="section-eyebrow reveal">
      <span class="section-label">${t('label_donate')}</span>
      <span class="section-line"></span>
    </div>
    <h2 class="section-title reveal d1">${donate.heading}</h2>
    <p class="contact-sub reveal d2">${donate.subheading}</p>

    <div class="donate-grid">
      ${pp.enabled ? `
        <div class="donate-qr-card reveal d2">
          <div class="donate-qr-canvas-wrap">
            <canvas class="donate-qr-canvas" width="220" height="220" aria-label="PromptPay QR code"></canvas>
            <div class="donate-qr-status">${t('donate_generating')}</div>
          </div>

          <div class="donate-amounts" role="group" aria-label="${t('donate_amount_label')}">
            ${(pp.presetAmounts || []).map((amt) => `
              <button type="button" class="donate-amount-btn" data-amount="${amt}">${amt}</button>
            `).join('')}
          </div>

          ${pp.allowCustomAmount ? `
            <div class="donate-custom-row">
              <input type="number" min="1" step="1" inputmode="numeric"
                class="donate-custom-input" placeholder="${t('donate_custom_placeholder')}"
                aria-label="${t('donate_custom_placeholder')}">
            </div>
          ` : ''}

          ${copyCardHtml({
            className: 'donate-pp-copy',
            icon: 'PP',
            copyValue: pp.id,
            label: t('donate_id_label'),
            value: pp.accountName || '',
          })}
        </div>
      ` : ''}

      ${bank.enabled ? copyCardHtml({
        className: 'donate-bank-copy',
        icon: '฿',
        copyValue: bank.accountNumber,
        label: bank.bankName || '',
        value: bank.accountNumber || '',
        heading: t('donate_bank_heading'),
        hint: `${bank.accountName || ''} · ${t('donate_bank_copy_hint')}`,
      }) : ''}

      ${tmn.enabled ? copyCardHtml({
        className: 'donate-tmn-copy',
        icon: 'TW',
        copyValue: tmn.phoneNumber,
        label: t('donate_tmn_heading'),
        value: tmn.phoneNumber || '',
        heading: t('donate_tmn_heading'),
        hint: t('donate_tmn_hint'),
      }) : ''}

      ${validLinks.length ? `
        <div class="donate-links-card reveal d3">
          <p class="donate-links-heading">${t('donate_other_ways')}</p>
          <div class="contact-grid">
            ${validLinks.map((link, i) => `
              <a href="${link.href}" target="_blank" rel="noopener noreferrer"
                 class="contact-item reveal d${(i % 3) + 1}"
                 aria-label="${link.label}: ${link.value}">
                <div class="contact-icon" aria-hidden="true">${link.icon}</div>
                <div class="contact-info">
                  <span class="contact-label">${link.label}</span>
                  <span class="contact-value">${link.value}</span>
                </div>
                <span class="donate-ext-icon" aria-hidden="true">${EXT_ICON}</span>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${nothingConfigured ? `<p class="donate-empty-hint">${t('donate_not_configured')}</p>` : ''}
    </div>
  `;

  if (pp.enabled) {
    wireQr(section, pp, t);
  }

  // ทุกการ์ด copy (PromptPay ID, ธนาคาร, TrueMoney) ใช้ปุ่ม class เดียวกัน — wire ทีเดียวทั้งหมด
  section.querySelectorAll('.donate-copy-btn').forEach((btn) => wireCopyButton(btn, t));

  return section;
}

function wireCopyButton(btn, t) {
  const toast = btn.querySelector('[data-copied-label]');
  if (toast) toast.textContent = t('copied');

  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      Object.assign(ta.style, { position: 'fixed', opacity: '0' });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 2000);
  });
}

function wireQr(section, pp, t) {
  const canvas = section.querySelector('.donate-qr-canvas');
  const status = section.querySelector('.donate-qr-status');
  const amountBtns = [...section.querySelectorAll('.donate-amount-btn')];
  const customInput = section.querySelector('.donate-custom-input');

  let currentAmount = pp.defaultAmount || (pp.presetAmounts && pp.presetAmounts[0]) || null;
  let debounceTimer = null;

  function setActiveButton(amount) {
    amountBtns.forEach((b) => b.classList.toggle('active', Number(b.dataset.amount) === amount));
  }

  async function draw(amount) {
    status.textContent = t('donate_generating');
    status.classList.remove('is-error');
    try {
      const { generatePayload, QRCode } = await loadQrLibs();
      const payload = generatePayload(pp.id, amount ? { amount } : {});
      await QRCode.toCanvas(canvas, payload, {
        width: 220,
        margin: 1,
        color: { dark: '#0a0a0a', light: '#ffffff' },
      });
      status.textContent = '';
    } catch (err) {
      status.textContent = t('donate_generate_error');
      status.classList.add('is-error');
    }
  }

  setActiveButton(currentAmount);
  draw(currentAmount);

  amountBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentAmount = Number(btn.dataset.amount);
      if (customInput) customInput.value = '';
      setActiveButton(currentAmount);
      draw(currentAmount);
    });
  });

  if (customInput) {
    customInput.addEventListener('input', () => {
      setActiveButton(null);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const val = parseFloat(customInput.value);
        currentAmount = val > 0 ? val : null;
        draw(currentAmount);
      }, 400);
    });
  }
}
