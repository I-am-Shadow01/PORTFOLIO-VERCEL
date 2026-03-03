/**
 * effects.js — Extra visual flair
 * Magnetic buttons · 3D tilt · Text scramble · Counter · Ripple · Particle trail · Parallax
 */

// ── 1. Magnetic Buttons ──────────────────────────────────────
export function initMagneticButtons() {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

  document.querySelectorAll('.btn, .footer-top, .nav-logo').forEach(el => {
    let raf;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * 0.28;
      const dy = (e.clientY - cy) * 0.28;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${dx}px,${dy}px)`;
      });
    });
    el.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      el.style.transform = '';
    });
  });
}

// ── 2. 3D Tilt on Cards ──────────────────────────────────────
export function initTiltCards() {
  const TILT = 14;
  document.querySelectorAll('.project-card, .skill-cat, .stat-card, .terminal-card, .contact-item').forEach(card => {
    let raf;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(700px) rotateX(${-y * TILT}deg) rotateY(${x * TILT}deg) translateZ(8px)`;
        card.style.transition = 'transform 0.08s ease';
      });
    });
    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(.23,1,.32,1)';
    });
  });
}

// ── 3. Text Scramble on .section-title ──────────────────────
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01';

function scrambleReveal(el) {
  const original = el.textContent;
  const len = original.length;
  let frame = 0;
  const totalFrames = len * 3.5;

  function tick() {
    let out = '';
    for (let i = 0; i < len; i++) {
      if (original[i] === ' ') { out += ' '; continue; }
      const reveal = frame / totalFrames;
      const pos    = i / len;
      if (pos < reveal) {
        out += original[i];
      } else {
        out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
    }
    el.textContent = out;
    frame++;
    if (frame <= totalFrames + 4) requestAnimationFrame(tick);
    else el.textContent = original;
  }
  tick();
}

export function initTextScramble() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        scrambleReveal(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.section-title').forEach(el => obs.observe(el));
}

// ── 4. Counter Animations ────────────────────────────────────
function animateCount(el) {
  const raw = el.textContent.trim();
  const match = raw.match(/^([\d.]+)(.*)$/);
  if (!match) return;
  const target = parseFloat(match[1]);
  const suffix = match[2] || '';
  const isFloat = raw.includes('.');
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = target * ease;
    el.textContent = (isFloat ? val.toFixed(1) : Math.round(val)) + suffix;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = raw;
  }
  requestAnimationFrame(tick);
}

export function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.8 });

  document.querySelectorAll('.stat-num, .hstat-n').forEach(el => obs.observe(el));
}

// ── 5. Ripple on Click ───────────────────────────────────────
export function initRipple() {
  document.querySelectorAll('.btn, .nav-link, .mob-item, .contact-item, .project-link-btn').forEach(el => {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('click', e => {
      const r = el.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      const dot  = document.createElement('span');
      Object.assign(dot.style, {
        position: 'absolute',
        borderRadius: '50%',
        background: 'rgba(198,241,53,0.25)',
        width: size + 'px', height: size + 'px',
        left:  (e.clientX - r.left  - size / 2) + 'px',
        top:   (e.clientY - r.top   - size / 2) + 'px',
        transform: 'scale(0)',
        animation: 'ripplePop 0.55s ease-out forwards',
        pointerEvents: 'none',
      });
      el.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    });
  });
}

// ── 6. Particle Burst on CTA buttons ────────────────────────
function burst(x, y) {
  const COUNT = 16;
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('span');
    const angle  = (i / COUNT) * Math.PI * 2;
    const dist   = 40 + Math.random() * 55;
    const size   = 3 + Math.random() * 4;
    const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#c6f135';
    const colors = [ac, ac, '#fff'];
    const color  = colors[Math.floor(Math.random() * colors.length)];

    Object.assign(p.style, {
      position: 'fixed',
      left: x + 'px', top: y + 'px',
      width: size + 'px', height: size + 'px',
      borderRadius: '50%',
      background: color,
      pointerEvents: 'none',
      zIndex: 99999,
      transform: 'translate(-50%,-50%) scale(1)',
      transition: `transform 0.6s ease, opacity 0.6s ease`,
    });
    document.body.appendChild(p);

    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px)) scale(0)`;
      p.style.opacity = '0';
    });

    setTimeout(() => p.remove(), 650);
  }
}

export function initParticleBurst() {
  document.querySelectorAll('.btn-primary, .footer-top').forEach(el => {
    el.addEventListener('click', e => burst(e.clientX, e.clientY));
  });
}

// ── 7. Parallax on hero deco lines ──────────────────────────
export function initParallax() {
  const root = document.getElementById('__root__');
  const decos = document.querySelectorAll('.deco-line');
  const heroSide = document.querySelector('.hero-side');
  if (!decos.length) return;

  const scroller = root || window;
  scroller.addEventListener('scroll', () => {
    const scrollTop = root ? root.scrollTop : window.scrollY;
    const ratio = scrollTop / (window.innerHeight || 800);
    decos.forEach((d, i) => {
      const dir   = i % 2 === 0 ? 1 : -1;
      const speed = 0.18 + i * 0.06;
      d.style.transform = `translateY(${dir * ratio * speed * 80}px)`;
    });
    if (heroSide) heroSide.style.transform = `translateY(${ratio * 0.12 * 80}px)`;
  }, { passive: true });
}

// ── 8. Skill tag hover glow  ─────────────────────────────────
export function initSkillGlow() {
  document.querySelectorAll('.skill-tag, .about-tag, .project-tech').forEach(tag => {
    tag.addEventListener('mouseenter', () => {
      tag.style.setProperty('--glow', '1');
    });
    tag.addEventListener('mouseleave', () => {
      tag.style.removeProperty('--glow');
    });
  });
}

// ── 9. Cursor Sparkle Trail ──────────────────────────────────
let _sparkleActive = false;
let _sparkleKill = null;

export function initSparkleTrail() {
  if (_sparkleActive) return;
  _sparkleActive = true;

  const trail = [];
  const MAX = 18;

  function Dot() {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed',
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: 88888,
      width: '5px', height: '5px',
      background: getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#c6f135',
      transform: 'translate(-50%,-50%)',
      transition: 'opacity 0.3s ease',
    });
    document.body.appendChild(el);
    this.el = el;
    this.x = 0; this.y = 0;
    this.life = 0;
  }

  for (let i = 0; i < MAX; i++) trail.push(new Dot());

  let mx = 0, my = 0, idx = 0;
  function onMove(e) { mx = e.clientX; my = e.clientY; }
  document.addEventListener('mousemove', onMove);

  let raf;
  function frame() {
    const dot = trail[idx % MAX];
    dot.x = mx; dot.y = my;
    const age = (idx % MAX) / MAX;
    dot.el.style.left = mx + 'px';
    dot.el.style.top  = my + 'px';
    dot.el.style.opacity = '0.7';
    dot.el.style.width  = (2 + age * 4) + 'px';
    dot.el.style.height = (2 + age * 4) + 'px';
    dot.el.style.background = age < 0.5 ? '#c6f135' : '#a8d120';

    // fade old dots
    trail.forEach((d, i) => {
      const diff = ((idx - i) % MAX + MAX) % MAX;
      d.el.style.opacity = Math.max(0, 0.7 - diff / MAX);
    });

    idx++;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  _sparkleKill = () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('mousemove', onMove);
    trail.forEach(d => d.el.remove());
    _sparkleActive = false;
    _sparkleKill = null;
  };

  return _sparkleKill;
}
