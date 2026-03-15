/**
 * background.js — Visual background engine
 *
 * Modes: 'eco' | 'dynamic' | 'performance'
 * - eco:         Aurora + grid  ~14fps cap
 * - dynamic:     Full layers    ~60fps  (default)
 * - performance: + 4D Hypersphere + adaptive quality (more particles, reduces if fps drops)
 *
 * Anti-flicker: accent color is CACHED from settings — no getComputedStyle per frame.
 * 4D Hypersphere: inspired by 3Blue1Brown's rotating hypersphere projection.
 */

import { getSettings, onSettingsChange } from './settings.js';

export function initBackground(onFps) {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0',
    width: '100%', height: '100%',
    zIndex: '0', pointerEvents: 'none',
  });
  document.getElementById('__root__').prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  let active = true;
  const mouse = { x: -9999, y: -9999, px: -9999, py: -9999 };
  let scrollY = 0;

  // ── Cached accent (NO getComputedStyle per frame — this was the flicker source) ──
  let accentHex = '#C6F135';
  let accentRgb = { r: 198, g: 241, b: 53 };
  let alphaMult  = 1.0;

  function refreshAccentFromSettings() {
    const s = getSettings();
    accentHex = s.accent || '#C6F135';
    accentRgb = hexToRgb(accentHex);
    alphaMult  = getAlphaMultiplier(accentRgb);
  }
  refreshAccentFromSettings();

  const unsub = onSettingsChange(s => {
    accentHex = s.accent || accentHex;
    accentRgb = hexToRgb(accentHex);
    alphaMult  = getAlphaMultiplier(accentRgb);
  });

  // ── FPS ──────────────────────────────────────────────────────
  let fpsCount = 0, fpsLast = 0, fpsSmooth = 60;

  // ── Adaptive quality (performance mode) ─────────────────────
  let adaptiveStep = 0;  // 0=ultra 1=high 2=medium
  let adaptiveBuf  = [];
  let lastEcoTime  = 0;

  // ── Helpers ──────────────────────────────────────────────────
  const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const s = h.length === 3 ? h.split('').map(c => c+c).join('') : h;
    return { r: parseInt(s.slice(0,2),16), g: parseInt(s.slice(2,4),16), b: parseInt(s.slice(4,6),16) };
  }

  function relativeLuminance({r,g,b}) {
    const l = c => { c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); };
    return 0.2126*l(r) + 0.7152*l(g) + 0.0722*l(b);
  }

  function getAlphaMultiplier(rgb) {
    const lum = relativeLuminance(rgb);
    const bg  = isDark() ? 0.03 : 0.93;
    const c   = Math.abs(lum - bg);
    return c < 0.12 ? 4.0 : c < 0.25 ? 2.2 : 1.0;
  }

  // ── Resize ───────────────────────────────────────────────────
  function resize() {
    const mode = getSettings().perfMode || 'dynamic';
    dpr = Math.min(window.devicePixelRatio||1, mode==='performance' ? 3 : 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildParticles();
  }
  window.addEventListener('resize', resize, { passive: true });

  // ── Scroll ───────────────────────────────────────────────────
  const rootEl = document.getElementById('__root__');
  (rootEl||window).addEventListener('scroll', () => {
    scrollY = rootEl ? rootEl.scrollTop : window.scrollY;
  }, { passive: true });

  // ════════════════════════════════════════════════════════════
  // LAYER A — Aurora blobs (slow organic drift + scroll parallax)
  // No re-init on resize → positions never reset abruptly (fixes flicker)
  // ════════════════════════════════════════════════════════════
  const BLOBS = [
    { ox:0.78, oy:-0.05, r:0.55, sp:0.00013, ph:0.0  },
    { ox:-0.1, oy:0.80,  r:0.42, sp:0.00010, ph:2.1  },
    { ox:0.45, oy:0.50,  r:0.32, sp:0.00017, ph:4.3  },
    { ox:0.20, oy:0.10,  r:0.25, sp:0.00008, ph:1.6  },
  ];

  function drawAurora(t, rgb, m) {
    const { r, g, b } = rgb;
    const base = (isDark() ? 0.050 : 0.092) * m;
    const sy   = (scrollY / Math.max(H,1)) * 0.06;
    BLOBS.forEach(n => {
      const cx = (n.ox + Math.sin(t*n.sp+n.ph)*0.12) * W;
      const cy = (n.oy + Math.cos(t*n.sp*0.7+n.ph)*0.10 + sy) * H;
      const rad = n.r * Math.max(W,H);
      const g2 = ctx.createRadialGradient(cx,cy,0,cx,cy,rad);
      g2.addColorStop(0,    `rgba(${r},${g},${b},${base})`);
      g2.addColorStop(0.42, `rgba(${r},${g},${b},${base*0.28})`);
      g2.addColorStop(1,    `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = g2;
      ctx.fillRect(0,0,W,H);
    });
  }

  // ════════════════════════════════════════════════════════════
  // LAYER B — 4D Hypersphere  (3Blue1Brown-style rotating projection)
  //
  // A hypersphere is {(x,y,z,w) : x²+y²+z²+w²=1}.
  // We draw great circles at constant "latitude" χ (constant w=cos χ).
  // Four 4D rotation planes are combined; projected via two-step perspective.
  // ════════════════════════════════════════════════════════════
  function rotate4D([x,y,z,w], aXW, aYW, aZW, aXY) {
    let nx,ny,nz,nw;
    nx = x*Math.cos(aXW) - w*Math.sin(aXW); nw = x*Math.sin(aXW) + w*Math.cos(aXW); x=nx; w=nw;
    ny = y*Math.cos(aYW) - w*Math.sin(aYW); nw = y*Math.sin(aYW) + w*Math.cos(aYW); y=ny; w=nw;
    nz = z*Math.cos(aZW) - w*Math.sin(aZW); nw = z*Math.sin(aZW) + w*Math.cos(aZW); z=nz; w=nw;
    nx = x*Math.cos(aXY) - y*Math.sin(aXY); ny = x*Math.sin(aXY) + y*Math.cos(aXY); x=nx; y=ny;
    return [x,y,z,w];
  }

  function project4D([x,y,z,w]) {
    const d4=2.2, s4=1/(d4-w);
    const px=x*s4, py=y*s4, pz=z*s4;
    const d3=3.5, s3=1/(d3-pz);
    const sc = Math.min(W,H)*0.29;
    return { sx: W/2+px*s3*sc, sy: H/2+py*s3*sc, depth:(w+1)/2 };
  }

  function drawHyperSphere(t, rgb, m) {
    const { r, g, b } = rgb;
    const dark = isDark();
    const base = (dark ? 0.20 : 0.16) * m;

    const aXW = t*0.000195, aYW = t*0.000130, aZW = t*0.000085, aXY = t*0.000060;
    const SEGS = 72;

    ctx.save();

    // Latitude circles (constant χ slices through the 4-sphere)
    const LATS = 13;
    for (let li=1; li<LATS; li++) {
      const chi  = (li/LATS)*Math.PI;
      const sinC = Math.sin(chi), cosC = Math.cos(chi);
      const la   = base * (0.30 + 0.70*Math.sin(chi));

      // XY-plane circle at this latitude
      ctx.beginPath();
      for (let si=0; si<=SEGS; si++) {
        const th = (si/SEGS)*Math.PI*2;
        const p  = project4D(rotate4D([sinC*Math.cos(th), sinC*Math.sin(th), 0, cosC], aXW,aYW,aZW,aXY));
        si===0 ? ctx.moveTo(p.sx,p.sy) : ctx.lineTo(p.sx,p.sy);
      }
      ctx.strokeStyle = `rgba(${r},${g},${b},${la})`;
      ctx.lineWidth = 0.7; ctx.stroke();

      // XZ-plane circle (secondary rings, more subtle)
      ctx.beginPath();
      for (let si=0; si<=SEGS; si++) {
        const th = (si/SEGS)*Math.PI*2;
        const p  = project4D(rotate4D([sinC*Math.cos(th), 0, sinC*Math.sin(th), cosC], aXW,aYW,aZW,aXY));
        si===0 ? ctx.moveTo(p.sx,p.sy) : ctx.lineTo(p.sx,p.sy);
      }
      ctx.strokeStyle = `rgba(${r},${g},${b},${la*0.45})`;
      ctx.lineWidth = 0.45; ctx.stroke();
    }

    // Meridian great-circles
    const LONS = 10;
    for (let lo=0; lo<LONS; lo++) {
      const phi = (lo/LONS)*Math.PI*2;
      ctx.beginPath();
      for (let si=0; si<=SEGS; si++) {
        const chi = (si/SEGS)*Math.PI;
        const p   = project4D(rotate4D([
          Math.sin(chi)*Math.cos(phi), Math.sin(chi)*Math.sin(phi), 0, Math.cos(chi)
        ], aXW,aYW,aZW,aXY));
        si===0 ? ctx.moveTo(p.sx,p.sy) : ctx.lineTo(p.sx,p.sy);
      }
      ctx.strokeStyle = `rgba(${r},${g},${b},${base*0.25})`;
      ctx.lineWidth = 0.35; ctx.stroke();
    }

    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // LAYER C — Cursor magnetic orb
  // ════════════════════════════════════════════════════════════
  const orb = { x:-9999, y:-9999, tx:-9999, ty:-9999, boost:0 };

  function drawOrb(rgb, m) {
    orb.x += (orb.tx-orb.x)*0.08;
    orb.y += (orb.ty-orb.y)*0.08;
    orb.boost *= 0.90;
    if (orb.x < -500) return;
    const { r, g, b } = rgb;
    const a  = (isDark()?0.10:0.13)*m;
    const rd = 180+orb.boost*55;
    const g2 = ctx.createRadialGradient(orb.x,orb.y,0,orb.x,orb.y,rd);
    g2.addColorStop(0,    `rgba(${r},${g},${b},${a})`);
    g2.addColorStop(0.38, `rgba(${r},${g},${b},${a*0.4})`);
    g2.addColorStop(1,    `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = g2; ctx.fillRect(0,0,W,H);
  }

  // ════════════════════════════════════════════════════════════
  // LAYER D — Shooting stars
  // ════════════════════════════════════════════════════════════
  class Star {
    constructor() { this.reset(); }
    reset() {
      this.x=Math.random()*W*1.2-W*0.1; this.y=Math.random()*H*0.4;
      this.len=Math.random()*130+50; this.spd=Math.random()*7+5;
      this.ang=(Math.PI/180)*(Math.random()*22+18);
      this.life=0; this.maxLife=Math.random()*45+25;
      this.wait=Math.random()*500+180;
    }
    update() { if(this.wait>0){this.wait--;return;} this.x+=Math.cos(this.ang)*this.spd; this.y+=Math.sin(this.ang)*this.spd; this.life++; if(this.life>=this.maxLife)this.reset(); }
    draw(rgb,m) {
      if(this.wait>0)return;
      const {r,g,b}=rgb;
      const a=Math.sin((this.life/this.maxLife)*Math.PI)*(isDark()?0.75:0.50)*m;
      if(a<=0)return;
      const tx=this.x-Math.cos(this.ang)*this.len, ty=this.y-Math.sin(this.ang)*this.len;
      const g2=ctx.createLinearGradient(tx,ty,this.x,this.y);
      g2.addColorStop(0,`rgba(${r},${g},${b},0)`); g2.addColorStop(0.6,`rgba(${r},${g},${b},${a*0.35})`); g2.addColorStop(1,`rgba(${r},${g},${b},${a})`);
      ctx.save(); ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(this.x,this.y);
      ctx.strokeStyle=g2; ctx.lineWidth=1.5; ctx.lineCap='round'; ctx.stroke();
      ctx.beginPath(); ctx.arc(this.x,this.y,2.2,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${a})`; ctx.fill(); ctx.restore();
    }
  }
  const stars = Array.from({length:5},()=>new Star());

  // ════════════════════════════════════════════════════════════
  // LAYER E — Particle constellation + flow field
  // ════════════════════════════════════════════════════════════
  let particles = [];
  const CONNECT=145, REPEL=115;

  function flowAngle(x,y,t) {
    return Math.sin(x*0.004+t*0.00025)*Math.PI + Math.cos(y*0.004+t*0.00018)*Math.PI*0.6;
  }

  function rebuildParticles() {
    const mode=getSettings().perfMode||'dynamic';
    const step=adaptiveStep;
    let count;
    if      (mode==='eco')         count=Math.min(Math.floor((W*H)/28000),28);
    else if (mode==='performance') count=Math.min(Math.floor((W*H)/[5500,8000,11000][step]),180);
    else                           count=Math.min(Math.floor((W*H)/9500),128);
    particles=Array.from({length:count},()=>{
      const vx=(Math.random()-0.5)*0.30, vy=(Math.random()-0.5)*0.30;
      return {x:Math.random()*W,y:Math.random()*H,vx,vy,bvx:vx,bvy:vy,r:Math.random()*1.5+0.6};
    });
  }

  function drawParticles(t,rgb,m) {
    const {r,g,b}=rgb;
    const dotB=(isDark()?0.55:0.50)*m, lineB=(isDark()?0.18:0.16)*m;
    particles.forEach(p=>{
      const angle=flowAngle(p.x,p.y,t);
      const dx=p.x-mouse.x, dy=p.y-mouse.y, d=Math.hypot(dx,dy);
      if(d<REPEL&&d>0){const f=(1-d/REPEL)*0.65; p.vx+=(dx/d)*f; p.vy+=(dy/d)*f;}
      p.vx=p.vx*0.97+(p.bvx+Math.cos(angle)*0.011)*0.03;
      p.vy=p.vy*0.97+(p.bvy+Math.sin(angle)*0.011)*0.03;
      const spd=Math.hypot(p.vx,p.vy); if(spd>4){p.vx=(p.vx/spd)*4;p.vy=(p.vy/spd)*4;}
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<-10)p.x=W+10; if(p.x>W+10)p.x=-10;
      if(p.y<-10)p.y=H+10; if(p.y>H+10)p.y=-10;
    });
    ctx.save();
    for(let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++){
      const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.hypot(dx,dy);
      if(d<CONNECT){ ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.strokeStyle=`rgba(${r},${g},${b},${(1-d/CONNECT)*lineB})`; ctx.lineWidth=0.8; ctx.stroke(); }
    }
    ctx.restore();
    particles.forEach(p=>{
      const d=Math.hypot(p.x-mouse.x,p.y-mouse.y), boost=d<REPEL?(1-d/REPEL)*0.45:0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${Math.min(dotB+boost,1)})`; ctx.fill();
    });
  }

  // ════════════════════════════════════════════════════════════
  // LAYER F — Scrolling grid
  // ════════════════════════════════════════════════════════════
  function drawGrid(t) {
    const dark=isDark(), a=dark?0.028:0.044;
    const COLS=26, cW=W/COLS, off=(t*0.016+scrollY*0.12)%cW;
    ctx.save(); ctx.strokeStyle=dark?`rgba(255,255,255,${a})`:`rgba(0,0,0,${a})`; ctx.lineWidth=0.5;
    for(let x=-off;x<=W+cW;x+=cW){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let row=0;row<=Math.ceil(H/cW)+1;row++){ctx.beginPath();ctx.moveTo(0,row*cW);ctx.lineTo(W,row*cW);ctx.stroke();}
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // LAYER G — Mouse ripples
  // ════════════════════════════════════════════════════════════
  let ripples=[];

  function spawnRipple(){
    if(mouse.x<0||mouse.x>W)return;
    if(Math.hypot(mouse.x-mouse.px,mouse.y-mouse.py)>8)
      ripples.push({x:mouse.x,y:mouse.y,r:0,maxR:65,life:1});
    mouse.px=mouse.x; mouse.py=mouse.y;
  }

  function drawRipples(rgb,m){
    const {r,g,b}=rgb; const dark=isDark();
    ripples=ripples.filter(rp=>rp.life>0);
    ripples.forEach(rp=>{
      rp.r+=(rp.maxR-rp.r)*0.075; rp.life-=0.022;
      ctx.beginPath(); ctx.arc(rp.x,rp.y,rp.r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(${r},${g},${b},${rp.life*(dark?0.17:0.12)*m})`; ctx.lineWidth=1; ctx.stroke();
    });
  }

  function onClickRipple(e){
    for(let i=0;i<3;i++) ripples.push({x:e.clientX,y:e.clientY,r:0,maxR:80+i*30,life:1-i*0.22});
    orb.boost=1;
  }
  window.addEventListener('click',onClickRipple,{passive:true});

  // ── Main render loop ─────────────────────────────────────────
  function draw(t) {
    if (!active) return;
    requestAnimationFrame(draw);

    const mode = getSettings().perfMode || 'dynamic';

    // FPS counter
    fpsCount++;
    if (t - fpsLast >= 1000) {
      fpsSmooth = Math.round(fpsSmooth*0.3 + fpsCount*0.7);
      if (onFps) onFps(fpsSmooth, adaptiveStep);
      fpsCount = 0; fpsLast = t;

      // Adaptive quality (performance mode only)
      if (mode === 'performance') {
        adaptiveBuf.push(fpsSmooth);
        if (adaptiveBuf.length >= 4) {
          const avg = adaptiveBuf.reduce((a,b)=>a+b,0)/adaptiveBuf.length;
          const prev = adaptiveStep;
          adaptiveStep = avg < 28 ? 2 : avg < 46 ? 1 : 0;
          if (adaptiveStep !== prev) {
            rebuildParticles();
            window.dispatchEvent(new CustomEvent('pf:adaptive-quality',{detail:{step:adaptiveStep,fps:fpsSmooth}}));
          }
          adaptiveBuf = [];
        }
      } else {
        if (adaptiveStep !== 0) { adaptiveStep = 0; rebuildParticles(); }
      }
    }

    // Eco fps cap
    if (mode === 'eco' && t - lastEcoTime < 1000/14) return;
    lastEcoTime = t;

    ctx.clearRect(0, 0, W, H);

    const rgb=accentRgb, m=alphaMult;

    if (mode === 'eco') {
      drawAurora(t, rgb, m*0.75);
      drawGrid(t);
      return;
    }

    // Dynamic + Performance
    drawAurora(t, rgb, m);
    drawOrb(rgb, m);

    if (mode === 'performance' && adaptiveStep < 2) {
      drawHyperSphere(t, rgb, m);
    }

    stars.forEach(s => { s.update(); s.draw(rgb, m); });
    spawnRipple();
    drawRipples(rgb, m);
    drawGrid(t);
    drawParticles(t, rgb, m);
  }

  // ── Mouse / Touch ─────────────────────────────────────────────
  const onMove  = e => { mouse.x=e.clientX; mouse.y=e.clientY; orb.tx=e.clientX; orb.ty=e.clientY; };
  const onLeave = () => { mouse.x=-9999; mouse.y=-9999; orb.tx=-9999; orb.ty=-9999; };
  window.addEventListener('mousemove',  onMove,  { passive:true });
  window.addEventListener('mouseleave', onLeave, { passive:true });
  window.addEventListener('touchmove', e => {
    if (e.touches[0]) { mouse.x=e.touches[0].clientX; mouse.y=e.touches[0].clientY; orb.tx=mouse.x; orb.ty=mouse.y; }
  }, { passive:true });

  resize();
  requestAnimationFrame(draw);

  return function cleanup() {
    active = false;
    unsub();
    window.removeEventListener('resize',     resize);
    window.removeEventListener('mousemove',  onMove);
    window.removeEventListener('mouseleave', onLeave);
    window.removeEventListener('click',      onClickRipple);
    canvas.remove();
  };
}
