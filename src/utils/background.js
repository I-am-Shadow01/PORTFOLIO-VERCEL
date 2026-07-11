/**
 * background.js — Multi-layer visual engine
 *
 * Modes: eco | medium | performance
 *
 * 3B1B-inspired layers (performance):
 *   A. Fourier Epicycles   — mouse warps rotation speed of closest system
 *   B. Lorenz Attractor    — mouse perturbs the attractor position
 *   C. Wave Interference   — mouse adds a 4th wave source at cursor
 *   D. Vector Flow Field   — mouse creates a local vortex in the field
 *   E. 4D Hypersphere      — mouse tilt controls XY rotation plane
 *   F. Times-Table Cardioid — mouse x-position steers the multiplier k,
 *                             morphing cardioid/nephroid/rose patterns live
 *                             (smoothed — doesn't snap instantly to cursor)
 *
 * Interaction extras: click spawns a radiating "starburst" on top of the
 * existing ripple, for a punchier hit-confirm feel.
 *
 * Physics: Lennard-Jones between particles + blob gravity + flow field
 */

import { getSettings, onSettingsChange } from './settings.js';

export function initBackground() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    zIndex: '0', pointerEvents: 'none',
  });
  const ctx = canvas.getContext('2d');
  document.body.insertBefore(canvas, document.body.firstChild);

  let W = 0, H = 0, dpr = 1, active = true;
  const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, nx: 0, ny: 0 };
  let scrollY = 0;

  // ── Helpers (defined before use) ──────────────────────────────
  const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

  function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c+c).join('');
    return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
  }

  function lum({r,g,b}) {
    const s = c => { c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); };
    return 0.2126*s(r) + 0.7152*s(g) + 0.0722*s(b);
  }

  function alphaMult(rgb) {
    const l = lum(rgb), bg = isDark() ? 0.03 : 0.93, c = Math.abs(l-bg);
    return c<0.12 ? 4.5 : c<0.25 ? 2.5 : 1.3;
  }

  // ── Cached accent ─────────────────────────────────────────────
  let cR=198, cG=241, cB=53, cM=1.3;

  // เดิม drawAurora/drawOrb สร้าง createRadialGradient + fillRect เต็มจอใหม่ทุกเฟรม
  // (รวมสูงสุด ~4-5 ครั้ง/เฟรม) ซึ่งหนักเพราะต้อง rasterize gradient ครอบทั้งจอซ้ำๆ
  // แคชเป็น texture เล็ก (256x256) ไว้ แล้วแค่ drawImage ขยาย/ย้ายตำแหน่งแทน — สร้าง
  // texture ใหม่เฉพาะตอน accent color เปลี่ยนจริง (ไม่ใช่ทุกเฟรม)
  let glowTexture = null;
  function rebuildGlowTexture() {
    const SIZE = 256;
    const tex = document.createElement('canvas');
    tex.width = tex.height = SIZE;
    const tctx = tex.getContext('2d');
    const g = tctx.createRadialGradient(SIZE/2,SIZE/2,0,SIZE/2,SIZE/2,SIZE/2);
    g.addColorStop(0,    `rgba(${cR},${cG},${cB},1)`);
    g.addColorStop(0.41, `rgba(${cR},${cG},${cB},0.28)`);
    g.addColorStop(1,    `rgba(${cR},${cG},${cB},0)`);
    tctx.fillStyle = g;
    tctx.fillRect(0,0,SIZE,SIZE);
    glowTexture = tex;
  }

  function syncAccent() {
    const hex = getSettings().accent || '#C6F135';
    const {r,g,b} = hexToRgb(hex);
    cR=r; cG=g; cB=b; cM=alphaMult({r,g,b});
    rebuildGlowTexture();
  }
  syncAccent();
  const unsub = onSettingsChange(() => syncAccent());

  // ── Resize ────────────────────────────────────────────────────
  function resize() {
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W*dpr; canvas.height = H*dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
    buildFlowParticles();
    buildLorenz();
    resizeWaveCanvas();
  }
  window.addEventListener('resize', resize, {passive:true});

  const rootEl = document.getElementById('__root__');
  (rootEl||window).addEventListener('scroll', () => {
    scrollY = rootEl ? rootEl.scrollTop : window.scrollY;
  }, {passive:true});

  // ════════════════════════════════════════════════════════════
  // AURORA BLOBS
  // ════════════════════════════════════════════════════════════
  const BLOBS = [
    {ox:0.78, oy:-0.05, r:0.60, sp:0.00013, ph:0.0},
    {ox:-0.1, oy:0.80,  r:0.48, sp:0.00010, ph:2.1},
    {ox:0.45, oy:0.50,  r:0.36, sp:0.00017, ph:4.3},
    {ox:0.20, oy:0.10,  r:0.28, sp:0.00008, ph:1.6},
  ];

  function blobPos(n, t) {
    return {
      cx: (n.ox + Math.sin(t*n.sp+n.ph)*0.12)*W,
      cy: (n.oy + Math.cos(t*n.sp*0.7+n.ph)*0.10 + (scrollY/Math.max(H,1))*0.06)*H,
    };
  }

  function drawAurora(t) {
    const base = (isDark() ? 0.065 : 0.110) * cM;
    if (!glowTexture) return;
    ctx.save();
    ctx.globalAlpha = base;
    BLOBS.forEach(n => {
      const {cx,cy} = blobPos(n, t);
      const rad = n.r * Math.max(W,H);
      ctx.drawImage(glowTexture, cx-rad, cy-rad, rad*2, rad*2);
    });
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // CURSOR ORB
  // ════════════════════════════════════════════════════════════
  const orb = {x:-9999, y:-9999, tx:-9999, ty:-9999, boost:0};

  function drawOrb() {
    orb.x += (orb.tx-orb.x)*0.08; orb.y += (orb.ty-orb.y)*0.08; orb.boost *= 0.90;
    if (orb.x < -500 || !glowTexture) return;
    const a = (isDark()?0.11:0.14)*cM, rad = 185+orb.boost*55;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(glowTexture, orb.x-rad, orb.y-rad, rad*2, rad*2);
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // PARTICLES — Lennard-Jones + blob gravity + flow + mouse
  // ════════════════════════════════════════════════════════════
  let particles = [];
  const CONNECT = 155, REPEL = 105, LJ_RADIUS = 70;

  function makeParticle() {
    const vx=(Math.random()-0.5)*0.28, vy=(Math.random()-0.5)*0.28;
    return {x:Math.random()*W, y:Math.random()*H, vx, vy, bvx:vx, bvy:vy, r:Math.random()*1.4+0.5};
  }

  // เดิมโค้ดเลือก "15 อนุภาคแรกในอาเรย์" มาคิด Lennard-Jones ไม่ใช่ 15 ตัวที่ใกล้ที่สุดจริง
  // ตรงนี้สร้าง spatial hash grid (cell = LJ_RADIUS) เพื่อหาเพื่อนบ้านที่อยู่ใกล้จริงๆ ในต้นทุน ~O(1) ต่ออนุภาค
  function buildSpatialGrid(cellSize) {
    const grid = new Map();
    for (const p of particles) {
      const key = `${Math.floor(p.x/cellSize)},${Math.floor(p.y/cellSize)}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(p);
    }
    return grid;
  }
  function nearbyParticles(grid, cellSize, p) {
    const gx = Math.floor(p.x/cellSize), gy = Math.floor(p.y/cellSize);
    const out = [];
    for (let dx=-1; dx<=1; dx++) for (let dy=-1; dy<=1; dy++) {
      const cell = grid.get(`${gx+dx},${gy+dy}`);
      if (cell) out.push(...cell);
    }
    return out;
  }

  function targetCount() {
    const mode = getSettings().perfMode || 'medium';
    const div = mode==='eco'?28000 : mode==='performance'?[5000,8000,12000][adaptStep]||5000 : 9000;
    const max = mode==='eco'?26    : mode==='performance'?[200,130,80][adaptStep]||200 : 120;
    return Math.min(Math.floor((W*H)/div), max);
  }

  function initParticles() {
    const n = targetCount();
    particles = Array.from({length:n}, makeParticle);
  }

  // Soft rebuild: grow or shrink without wiping — no visual flash
  function softRebuildParticles() {
    const n = targetCount();
    if (n > particles.length) {
      // Add new particles at random positions
      while (particles.length < n) particles.push(makeParticle());
    } else if (n < particles.length) {
      // Remove excess from the end
      particles.length = n;
    }
  }

  function drawParticles(t) {
    const perf = getSettings().perfMode === 'performance';
    const dotB  = (isDark()?0.60:0.55)*cM;
    const lineB = (isDark()?0.20:0.18)*cM;
    // idx ใช้กันเส้นเชื่อมซ้ำตอนหา neighbor จาก grid (วาดคู่ p-q แค่ครั้งเดียวตอน q.idx>p.idx)
    particles.forEach((p,i) => { p.idx = i; });
    // grid สำหรับ Lennard-Jones เท่านั้น (มีผลแค่ perf mode) — โหมดอื่นไม่ต้องเสียเวลาสร้าง
    const grid = perf ? buildSpatialGrid(CONNECT) : null;

    particles.forEach(p => {
      const flow = Math.sin(p.x*0.004+t*0.00025)*Math.PI + Math.cos(p.y*0.004+t*0.00018)*Math.PI*0.6;

      // Mouse repulsion
      const mdx=p.x-mouse.x, mdy=p.y-mouse.y, md=Math.hypot(mdx,mdy);
      if (md < REPEL && md > 0) { const f=(1-md/REPEL)*0.68; p.vx+=(mdx/md)*f; p.vy+=(mdy/md)*f; }

      if (perf) {
        // Blob gravity
        BLOBS.forEach(n => {
          const {cx,cy} = blobPos(n, t);
          const bdx=cx-p.x, bdy=cy-p.y, bd=Math.hypot(bdx,bdy);
          if (bd>10 && bd<300) { const f=0.0009*(300-bd)/300; p.vx+=(bdx/bd)*f; p.vy+=(bdy/bd)*f; }
        });
        // Lennard-Jones กับอนุภาคที่ "ใกล้จริง" ตาม grid (ก่อนหน้านี้บั๊ก เช็คแค่ particles[0..14])
        for (const q of nearbyParticles(grid, CONNECT, p)) {
          if (q===p) continue;
          const dx=q.x-p.x, dy=q.y-p.y, d=Math.hypot(dx,dy);
          if (d<LJ_RADIUS && d>1) { const s6=Math.pow(20/d,6),f=0.005*(2*s6*s6-s6)/d; p.vx-=(dx/d)*f; p.vy-=(dy/d)*f; }
        }
      }

      p.vx = p.vx*0.96+(p.bvx+Math.cos(flow)*0.010)*0.04;
      p.vy = p.vy*0.96+(p.bvy+Math.sin(flow)*0.010)*0.04;
      const spd=Math.hypot(p.vx,p.vy); if(spd>4.5){p.vx=(p.vx/spd)*4.5;p.vy=(p.vy/spd)*4.5;}
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<-10)p.x=W+10; if(p.x>W+10)p.x=-10;
      if(p.y<-10)p.y=H+10; if(p.y>H+10)p.y=-10;
    });

    // เดิม O(n²) วนคู่ทุกอนุภาค (สูงสุด ~19,900 คู่ตอน 200 อนุภาค) — ตอนนี้ดึงเฉพาะ
    // เพื่อนบ้านจาก grid ต่ออนุภาค เฉลี่ยเบากว่ามากเมื่อกระจายอนุภาคทั่วจอ
    // ต้อง rebuild grid ใหม่รอบนี้เพราะตำแหน่งขยับไปแล้วจาก loop ด้านบน
    const gridAfterMove = buildSpatialGrid(CONNECT);
    particles.forEach(p => {
      for (const q of nearbyParticles(gridAfterMove, CONNECT, p)) {
        if (q.idx <= p.idx) continue; // กันวาดเส้นซ้ำ (p-q กับ q-p)
        const dx=p.x-q.x, dy=p.y-q.y, d=Math.hypot(dx,dy);
        if (d<CONNECT) {
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
          ctx.strokeStyle=`rgba(${cR},${cG},${cB},${(1-d/CONNECT)*lineB})`; ctx.lineWidth=0.8; ctx.stroke();
        }
      }
    });
    particles.forEach(p => {
      const d=Math.hypot(p.x-mouse.x,p.y-mouse.y);
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${cR},${cG},${cB},${Math.min(dotB+(d<REPEL?(1-d/REPEL)*0.45:0),1)})`; ctx.fill();
    });
  }

  // ════════════════════════════════════════════════════════════
  // SHOOTING STARS
  // ════════════════════════════════════════════════════════════
  function mkStar(){return{x:Math.random()*W*1.2-W*0.1,y:Math.random()*H*0.4,len:Math.random()*130+50,spd:Math.random()*7+5,ang:(Math.PI/180)*(Math.random()*22+18),life:0,max:Math.random()*45+25,wait:Math.random()*500+180};}
  const STARS=Array.from({length:6},mkStar);
  function drawStars(){
    STARS.forEach(s=>{
      if(s.wait>0){s.wait--;return;} s.x+=Math.cos(s.ang)*s.spd;s.y+=Math.sin(s.ang)*s.spd;s.life++;
      if(s.life>=s.max)Object.assign(s,mkStar());
      const a=Math.sin((s.life/s.max)*Math.PI)*(isDark()?0.78:0.52)*cM; if(a<=0)return;
      const tx=s.x-Math.cos(s.ang)*s.len,ty=s.y-Math.sin(s.ang)*s.len;
      const g=ctx.createLinearGradient(tx,ty,s.x,s.y);
      g.addColorStop(0,`rgba(${cR},${cG},${cB},0)`);g.addColorStop(0.6,`rgba(${cR},${cG},${cB},${a*0.35})`);g.addColorStop(1,`rgba(${cR},${cG},${cB},${a})`);
      ctx.save();ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(s.x,s.y);ctx.strokeStyle=g;ctx.lineWidth=1.5;ctx.lineCap='round';ctx.stroke();
      ctx.beginPath();ctx.arc(s.x,s.y,2.2,0,Math.PI*2);ctx.fillStyle=`rgba(${cR},${cG},${cB},${a})`;ctx.fill();ctx.restore();
    });
  }

  // ════════════════════════════════════════════════════════════
  // RIPPLES
  // ════════════════════════════════════════════════════════════
  let ripples=[];
  function spawnRipple(){
    if(mouse.x<0||mouse.x>W)return;
    if(Math.hypot(mouse.x-mouse.px,mouse.y-mouse.py)>8) ripples.push({x:mouse.x,y:mouse.y,r:0,maxR:65,life:1});
    mouse.px=mouse.x;mouse.py=mouse.y;
  }
  function drawRipples(){
    ripples=ripples.filter(r=>r.life>0);
    ripples.forEach(r=>{r.r+=(r.maxR-r.r)*0.075;r.life-=0.022;
      ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(${cR},${cG},${cB},${r.life*(isDark()?0.18:0.13)*cM})`;ctx.lineWidth=1;ctx.stroke();
    });
  }
  function onClickRipple(e){for(let i=0;i<3;i++)ripples.push({x:e.clientX,y:e.clientY,r:0,maxR:80+i*30,life:1-i*0.22});orb.boost=1;spawnBurst(e.clientX,e.clientY);}
  window.addEventListener('click',onClickRipple,{passive:true});

  // ════════════════════════════════════════════════════════════
  // CLICK STARBURST — เอฟเฟ็คเส้นรัศมีระเบิดออกตอนคลิก ซ้อนบน ripple เดิม
  // ให้ความรู้สึก "hit confirm" ที่ชัดและเวอร์ขึ้น โดยยังคง cost ต่ำ
  // (ต่อคลิกวาดแค่ BURST_RAYS เส้น, อายุสั้น, กวาดทิ้งเองอัตโนมัติ)
  // ════════════════════════════════════════════════════════════
  const BURST_RAYS  = 14;   // จำนวนเส้นรัศมีต่อการระเบิดหนึ่งครั้ง
  const BURST_LEN   = 90;   // ความยาวสูงสุดของเส้น (px, ก่อนคูณ random)
  const BURST_DECAY = 0.05; // อัตราจางต่อเฟรม (ยิ่งมาก ยิ่งสั้น)
  let bursts = [];

  function spawnBurst(x, y) {
    const rays = [];
    for (let i = 0; i < BURST_RAYS; i++) {
      const angle = (i / BURST_RAYS) * Math.PI * 2 + Math.random() * 0.3;
      rays.push({ angle, len: BURST_LEN * (0.6 + Math.random() * 0.8) });
    }
    bursts.push({ x, y, rays, life: 1 });
  }

  function drawBursts() {
    bursts = bursts.filter(b => b.life > 0);
    bursts.forEach(b => {
      b.life -= BURST_DECAY;
      const ease = b.life * b.life; // ease-out — จางเร็วขึ้นตอนท้ายอายุ
      const grow = (1 - b.life) * 1; // 0..1 สัดส่วนที่เส้นยืดออกจากศูนย์กลางแล้ว
      b.rays.forEach(r => {
        const ex = b.x + Math.cos(r.angle) * r.len * grow;
        const ey = b.y + Math.sin(r.angle) * r.len * grow;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(${cR},${cG},${cB},${ease * (isDark() ? 0.55 : 0.42) * cM})`;
        ctx.lineWidth = 1.2 * ease + 0.3;
        ctx.stroke();
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // GRID
  // ════════════════════════════════════════════════════════════
  function drawGrid(t){
    const dark=isDark(),a=dark?0.028:0.044,CW=W/26,off=(t*0.016+scrollY*0.12)%CW;
    ctx.save();ctx.strokeStyle=dark?`rgba(255,255,255,${a})`:`rgba(0,0,0,${a})`;ctx.lineWidth=0.5;
    for(let x=-off;x<=W+CW;x+=CW){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let row=0;row<=Math.ceil(H/CW)+1;row++){ctx.beginPath();ctx.moveTo(0,row*CW);ctx.lineTo(W,row*CW);ctx.stroke();}
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // 3B1B A — FOURIER EPICYCLES
  // Mouse: proximity to a system warps its speed and tilts its plane
  // ════════════════════════════════════════════════════════════
  const epicycleTrails = [[], [], []];
  const TRAIL_LEN = 300;

  const ESYS = [
    {cx:0.18, cy:0.22, sc:0.048, to:0,           h:[1.0,0.5,0.33,0.25,0.20,0.17,0.14]},
    {cx:0.82, cy:0.78, sc:0.040, to:Math.PI,      h:[1.0,0.33,0.20,0.14,0.11,0.09]},
    {cx:0.50, cy:0.50, sc:0.030, to:Math.PI*0.5,  h:[0.8,0.4,0.22,0.15,0.11]},
  ];

  function drawEpicycles(t) {
    const base = (isDark()?0.18:0.14)*cM;
    const sc   = Math.min(W,H);

    ESYS.forEach((sys, si) => {
      const cxPx = sys.cx*W, cyPx = sys.cy*H;
      // Mouse influence: distance from system center
      const md  = Math.hypot(mouse.x - cxPx, mouse.y - cyPx);
      const inf = mouse.x > -100 ? Math.max(0, 1 - md/(sc*0.35)) : 0; // 0..1
      const speedWarp  = 1 + inf * 2.5;     // mouse nearby → spin faster
      const tiltAngle  = inf * (Math.atan2(mouse.y-cyPx, mouse.x-cxPx));

      let x=cxPx, y=cyPx;
      sys.h.forEach((amp, idx) => {
        const freq  = idx+1;
        const angle = t*0.00080*freq*speedWarp + sys.to + idx*0.7 + tiltAngle*0.15*freq;
        const nx=x+amp*sys.sc*sc*Math.cos(angle), ny=y+amp*sys.sc*sc*Math.sin(angle);

        // Arm
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(nx,ny);
        ctx.strokeStyle=`rgba(${cR},${cG},${cB},${base*0.30*(1+inf*0.5)})`;ctx.lineWidth=0.6+inf*0.4;ctx.stroke();
        // Circle
        ctx.beginPath();ctx.arc(x,y,amp*sys.sc*sc,0,Math.PI*2);
        ctx.strokeStyle=`rgba(${cR},${cG},${cB},${base*0.14})`;ctx.lineWidth=0.4;ctx.stroke();
        x=nx;y=ny;
      });

      // Tip dot — glows when mouse is near
      ctx.beginPath();ctx.arc(x,y,2.5+inf*3,0,Math.PI*2);
      ctx.fillStyle=`rgba(${cR},${cG},${cB},${base*(1.2+inf*1.5)})`;ctx.fill();

      // Trail — รวมเป็น bucket ละ ~15 จุดต่อ path เดียว แทนที่จะ stroke() ทีละเส้น (ลดจาก ~300 เหลือ ~20 draw call ต่อระบบ)
      epicycleTrails[si].push({x,y});
      if(epicycleTrails[si].length>TRAIL_LEN)epicycleTrails[si].shift();
      const trail=epicycleTrails[si];
      if(trail.length<2)return;
      const EBUCKET=15;
      for (let start=1; start<trail.length; start+=EBUCKET) {
        const end = Math.min(start+EBUCKET, trail.length);
        const midFrac = ((start+end)/2)/trail.length;
        ctx.beginPath();
        ctx.moveTo(trail[start-1].x, trail[start-1].y);
        for (let i=start; i<end; i++) ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle=`rgba(${cR},${cG},${cB},${midFrac*base*(0.85+inf*0.5)})`;
        ctx.lineWidth=0.4+midFrac*1.4;
        ctx.stroke();
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // 3B1B B — LORENZ ATTRACTOR
  // Mouse: perturbs the (x,y) state when nearby the projection
  // ════════════════════════════════════════════════════════════
  const sigma=10, rhoL=28, betaL=8/3;
  let lorenzPts=[], lx=0.1, ly=0, lz=20;

  function buildLorenz(){lorenzPts=[];lx=0.1+Math.random()*0.5;ly=Math.random()*0.4;lz=20+Math.random()*5;}

  function updateDrawLorenz() {
    // Lorenz center on screen
    const lcx=W*0.75, lcy=H*0.5, sc=Math.min(W,H)*0.013;
    // Mouse perturbation: if cursor near attractor, nudge lx/ly
    const projX = lcx+lx*sc, projZ = lcy+(lz-25)*sc;
    const md = Math.hypot(mouse.x-projX, mouse.y-projZ);
    if (mouse.x > -100 && md < 120) {
      const f = (1-md/120)*0.008;
      lx += (mouse.x-projX)/sc*f;
      ly += (mouse.y-projZ)/sc*f*0.5;
    }

    const dt=0.012;
    const df=(x,y,z)=>({dx:sigma*(y-x),dy:x*(rhoL-z)-y,dz:x*y-betaL*z});
    const k1=df(lx,ly,lz),k2=df(lx+dt/2*k1.dx,ly+dt/2*k1.dy,lz+dt/2*k1.dz);
    const k3=df(lx+dt/2*k2.dx,ly+dt/2*k2.dy,lz+dt/2*k2.dz),k4=df(lx+dt*k3.dx,ly+dt*k3.dy,lz+dt*k3.dz);
    lx+=dt/6*(k1.dx+2*k2.dx+2*k3.dx+k4.dx);
    ly+=dt/6*(k1.dy+2*k2.dy+2*k3.dy+k4.dy);
    lz+=dt/6*(k1.dz+2*k2.dz+2*k3.dz+k4.dz);
    lorenzPts.push({x:lx,y:ly,z:lz});
    if(lorenzPts.length>2000)lorenzPts.shift();

    if(lorenzPts.length<2)return;
    const base=(isDark()?0.28:0.22)*cM;
    ctx.save();
    // เดิม stroke() แยกทีละ segment (สูงสุด 2000 ครั้ง/เฟรม) — รวมเป็น "กลุ่ม" ละ ~40 จุด
    // ต่อ path เดียว ลด draw call เหลือ ~50 ครั้ง ยังคงเกรเดียนต์จางลงตามอายุของเส้นได้เหมือนเดิม
    const BUCKET = 40;
    for (let start=1; start<lorenzPts.length; start+=BUCKET) {
      const end = Math.min(start+BUCKET, lorenzPts.length);
      const midFrac = ((start+end)/2)/lorenzPts.length;
      ctx.beginPath();
      const p0 = lorenzPts[start-1];
      ctx.moveTo(lcx+p0.x*sc, lcy+(p0.z-25)*sc);
      for (let i=start; i<end; i++) {
        const q = lorenzPts[i];
        ctx.lineTo(lcx+q.x*sc, lcy+(q.z-25)*sc);
      }
      ctx.strokeStyle=`rgba(${cR},${cG},${cB},${midFrac*base})`;
      ctx.lineWidth=0.5+midFrac*0.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // 3B1B C — WAVE INTERFERENCE
  // Mouse adds a 4th coherent source at cursor position
  //
  // เดิมวนลูป fillRect() ~12,000+ ครั้ง/เฟรม (แต่ละครั้งสร้าง rgba string ใหม่)
  // ซึ่งเป็นภาระ main-thread หนักมาก — เปลี่ยนมาเขียนพิกเซลตรงลง ImageData
  // บน offscreen canvas แทน (แค่ 1 putImageData + 1 drawImage ต่อเฟรม)
  // ════════════════════════════════════════════════════════════
  const waveCanvas = document.createElement('canvas');
  const waveCtx = waveCanvas.getContext('2d');
  let waveImgData = null;

  function resizeWaveCanvas() {
    waveCanvas.width = Math.max(1, W);
    waveCanvas.height = Math.max(1, H);
    waveImgData = waveCtx.createImageData(waveCanvas.width, waveCanvas.height);
  }

  function drawWaveInterference(t) {
    if (!waveImgData) return;
    const base=(isDark()?0.040:0.060)*cM;
    const s0x=W*0.28,s0y=H*0.32, s1x=W*0.72,s1y=H*0.32, s2x=W*0.50,s2y=H*0.75;
    const hasMouse = mouse.x>0 && mouse.x<W;
    const smx=mouse.x, smy=mouse.y;
    const numSources = hasMouse ? 4 : 3;
    const k=0.018, omega=t*0.0015, STEP=13;

    const data = waveImgData.data;
    data.fill(0); // เคลียร์เป็น transparent ทั้งหมดก่อนเขียนรอบใหม่

    for (let px=0; px<W; px+=STEP) {
      for (let py=0; py<H; py+=STEP) {
        let amp = Math.cos(k*Math.hypot(px-s0x,py-s0y)-omega)
                + Math.cos(k*Math.hypot(px-s1x,py-s1y)-omega)
                + Math.cos(k*Math.hypot(px-s2x,py-s2y)-omega);
        if (hasMouse) amp += Math.cos(k*Math.hypot(px-smx,py-smy)-omega);
        amp /= numSources;
        const intensity = Math.abs(amp);
        if (intensity <= 0.52) continue;

        const alpha = Math.min(255, (intensity-0.52)*base*2.8*255);
        const bw = Math.min(STEP-1, W-px), bh = Math.min(STEP-1, H-py);
        for (let by=0; by<bh; by++) {
          let idx = ((py+by)*W + px) * 4;
          for (let bx=0; bx<bw; bx++) {
            data[idx]   = cR;
            data[idx+1] = cG;
            data[idx+2] = cB;
            data[idx+3] = alpha;
            idx += 4;
          }
        }
      }
    }
    waveCtx.putImageData(waveImgData, 0, 0);
    ctx.drawImage(waveCanvas, 0, 0);

    // Draw source dots (แค่ 3-4 วง เบาอยู่แล้ว วาดตรงบน main ctx ตามเดิม)
    const dots = hasMouse
      ? [{x:s0x,y:s0y},{x:s1x,y:s1y},{x:s2x,y:s2y},{x:smx,y:smy}]
      : [{x:s0x,y:s0y},{x:s1x,y:s1y},{x:s2x,y:s2y}];
    dots.forEach((s,i)=>{
      ctx.beginPath();ctx.arc(s.x,s.y,i===3?5:3.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(${cR},${cG},${cB},${(i===3?0.9:0.6)*cM})`;ctx.fill();
    });
  }

  // ════════════════════════════════════════════════════════════
  // 3B1B D — VECTOR FLOW FIELD
  // Mouse creates a local vortex / sink at cursor
  // ════════════════════════════════════════════════════════════
  let flowPts=[];
  function buildFlowParticles(){
    flowPts=Array.from({length:130},()=>({x:Math.random()*W,y:Math.random()*H,trail:[],age:Math.random()*200}));
  }

  function drawFlowField(t) {
    const base=(isDark()?0.18:0.14)*cM;
    flowPts.forEach(p=>{
      p.trail.push({x:p.x,y:p.y});
      if(p.trail.length>20)p.trail.shift();
      p.age++;
      if(p.age>250||p.x<0||p.x>W||p.y<0||p.y>H){p.x=Math.random()*W;p.y=Math.random()*H;p.trail=[];p.age=0;}

      // Base flow angle
      let angle=Math.sin(p.x*0.006+t*0.0003)*Math.PI*1.5+Math.cos(p.y*0.006+t*0.00025)*Math.PI*0.8;

      // Mouse vortex: curl around cursor
      if(mouse.x>0){
        const dx=p.x-mouse.x,dy=p.y-mouse.y,d=Math.hypot(dx,dy);
        if(d<200&&d>1){
          const strength=(1-d/200)*2.5;
          // Vortex = perpendicular to radius
          angle+=strength*(Math.atan2(-dx,dy)); // counter-clockwise spin
        }
      }

      p.x+=Math.cos(angle)*1.6; p.y+=Math.sin(angle)*1.6;
      if(p.trail.length<2)return;
      // เดิม stroke() ทีละ segment (สูงสุด 19 ครั้ง/จุด × 130 จุด = ~2,470 ครั้ง/เฟรม)
      // รวมเป็น bucket ละ 5 จุดต่อ path เดียว
      const FBUCKET=5;
      for (let start=1; start<p.trail.length; start+=FBUCKET) {
        const end = Math.min(start+FBUCKET, p.trail.length);
        const midFrac = ((start+end)/2)/p.trail.length;
        ctx.beginPath();
        ctx.moveTo(p.trail[start-1].x, p.trail[start-1].y);
        for (let i=start; i<end; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.strokeStyle=`rgba(${cR},${cG},${cB},${midFrac*base*0.65})`;
        ctx.lineWidth=0.7+midFrac*0.6;
        ctx.stroke();
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // 3B1B E — 4D HYPERSPHERE
  // Mouse tilt: normalized mouse position controls XY rotation bias
  // ════════════════════════════════════════════════════════════
  function rot4(x0,y0,z0,w0,aXW,aYW,aZW,aXY){
    let x=x0,y=y0,z=z0,w=w0,t1,t2;
    t1=x*Math.cos(aXW)-w*Math.sin(aXW);t2=x*Math.sin(aXW)+w*Math.cos(aXW);x=t1;w=t2;
    t1=y*Math.cos(aYW)-w*Math.sin(aYW);t2=y*Math.sin(aYW)+w*Math.cos(aYW);y=t1;w=t2;
    t1=z*Math.cos(aZW)-w*Math.sin(aZW);t2=z*Math.sin(aZW)+w*Math.cos(aZW);z=t1;w=t2;
    t1=x*Math.cos(aXY)-y*Math.sin(aXY);t2=x*Math.sin(aXY)+y*Math.cos(aXY);x=t1;y=t2;
    return {x,y,z,w};
  }
  function proj4(x,y,z,w){
    const s4=1/Math.max(0.01,2.2-w),px=x*s4,py=y*s4,pz=z*s4;
    const s3=1/Math.max(0.01,3.5-pz),sc=Math.min(W,H)*0.14;
    return{sx:W*0.25+px*s3*sc,sy:H*0.5+py*s3*sc};
  }

  function drawHyperSphere(t) {
    const base=(isDark()?0.22:0.18)*cM;
    // Mouse tilt: nx/ny are -1..1 normalized mouse position
    const tiltXY = mouse.x>0 ? mouse.nx*0.8 : 0;
    const tiltZW = mouse.x>0 ? mouse.ny*0.5 : 0;

    const aXW=t*0.000195+tiltZW, aYW=t*0.000130, aZW=t*0.000085, aXY=t*0.000060+tiltXY;
    const SEGS=64, LATS=11;
    ctx.save();
    for(let li=1;li<LATS;li++){
      const chi=(li/LATS)*Math.PI,sinC=Math.sin(chi),cosC=Math.cos(chi),la=base*(0.30+0.70*sinC);
      ctx.beginPath();
      for(let si=0;si<=SEGS;si++){const th=(si/SEGS)*Math.PI*2;const rp=rot4(sinC*Math.cos(th),sinC*Math.sin(th),0,cosC,aXW,aYW,aZW,aXY);const p=proj4(rp.x,rp.y,rp.z,rp.w);si===0?ctx.moveTo(p.sx,p.sy):ctx.lineTo(p.sx,p.sy);}
      ctx.strokeStyle=`rgba(${cR},${cG},${cB},${la})`;ctx.lineWidth=0.8;ctx.stroke();
      ctx.beginPath();
      for(let si=0;si<=SEGS;si++){const th=(si/SEGS)*Math.PI*2;const rp=rot4(sinC*Math.cos(th),0,sinC*Math.sin(th),cosC,aXW,aYW,aZW,aXY);const p=proj4(rp.x,rp.y,rp.z,rp.w);si===0?ctx.moveTo(p.sx,p.sy):ctx.lineTo(p.sx,p.sy);}
      ctx.strokeStyle=`rgba(${cR},${cG},${cB},${la*0.4})`;ctx.lineWidth=0.4;ctx.stroke();
    }
    for(let lo=0;lo<9;lo++){
      const phi=(lo/9)*Math.PI*2;
      ctx.beginPath();
      for(let si=0;si<=SEGS;si++){const chi=(si/SEGS)*Math.PI;const rp=rot4(Math.sin(chi)*Math.cos(phi),Math.sin(chi)*Math.sin(phi),0,Math.cos(chi),aXW,aYW,aZW,aXY);const p=proj4(rp.x,rp.y,rp.z,rp.w);si===0?ctx.moveTo(p.sx,p.sy):ctx.lineTo(p.sx,p.sy);}
      ctx.strokeStyle=`rgba(${cR},${cG},${cB},${base*0.22})`;ctx.lineWidth=0.35;ctx.stroke();
    }
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // 3B1B F — TIMES-TABLE CARDIOID (multiplication table mod n)
  // จุด n จุดบนวงกลม เชื่อมจุด i ไปยังจุด (i*k) mod n — เมื่อ k เปลี่ยนค่า
  // จะได้ลวดลาย cardioid/nephroid/rose ที่ morph ไปเรื่อยๆ (Mathologer-style)
  //
  // ตัว k "steer" ด้วยตำแหน่งเมาส์แกน x แต่ไม่สแนปตรงๆ (เดิมทำให้ภาพวาปเร็ว
  // เกินไปตอนขยับเมาส์ไว) เลย lerp เข้าเป้าหมายทีละนิดต่อเฟรมแทน นอกจากนี้
  // เพิ่มการหมุนช้าๆ ทั้งภาพ + ไล่ความจางตามระยะคอร์ด ให้ดูมีชีวิตไม่แข็งทื่อ
  // ════════════════════════════════════════════════════════════
  const MULT_TABLE_POINTS      = 180;      // จำนวนจุดบนวงกลม
  const MULT_TABLE_K_MIN       = 2;        // ตัวคูณ k ต่ำสุด
  const MULT_TABLE_K_MAX       = 45;       // ตัวคูณ k สูงสุด
  const MULT_TABLE_K_SPEED     = 0.000045; // ความเร็ว auto-drift ของ k เมื่อไม่มีเมาส์
  const MULT_TABLE_K_LERP      = 0.025;    // อัตรา smoothing ต่อเฟรมตอนเข้าใกล้ค่า k เป้าหมาย (ยิ่งน้อยยิ่งนุ่ม)
  const MULT_TABLE_RADIUS_FRAC = 0.42;     // รัศมีวงกลม เทียบกับ min(W,H)
  const MULT_TABLE_ROTATE_SPEED = 0.00005; // ความเร็วหมุนของภาพทั้งชุด (กันดูนิ่งแข็ง)
  const MULT_TABLE_BREATHE_AMT  = 0.015;   // สัดส่วนรัศมีที่ "หายใจ" เข้าออกช้าๆ
  const MULT_TABLE_BREATHE_SPEED = 0.00028;

  let multTableK = MULT_TABLE_K_MIN; // ค่า k ที่ smooth แล้ว คงอยู่ข้ามเฟรม

  function drawMultTable(t) {
    const base = (isDark() ? 0.16 : 0.13) * cM;
    const cx = W * 0.5, cy = H * 0.5;
    const breathe = 1 + Math.sin(t * MULT_TABLE_BREATHE_SPEED) * MULT_TABLE_BREATHE_AMT;
    const R = Math.min(W, H) * MULT_TABLE_RADIUS_FRAC * breathe;
    const n = MULT_TABLE_POINTS;
    const rot = t * MULT_TABLE_ROTATE_SPEED;

    // k ลอยตามเวลาโดย default แต่ถ้ามีเมาส์ ตำแหน่ง x จะเป็นเป้าหมายแทน
    const autoK = MULT_TABLE_K_MIN +
      (Math.sin(t * MULT_TABLE_K_SPEED) * 0.5 + 0.5) * (MULT_TABLE_K_MAX - MULT_TABLE_K_MIN);
    const hasMouse = mouse.x > 0 && mouse.x < W;
    const targetK = hasMouse
      ? MULT_TABLE_K_MIN + (mouse.x / W) * (MULT_TABLE_K_MAX - MULT_TABLE_K_MIN)
      : autoK;
    multTableK += (targetK - multTableK) * MULT_TABLE_K_LERP; // ค่อยๆ ไล่เข้าเป้าหมาย ไม่วาป
    const k = multTableK;

    ctx.save();
    ctx.lineWidth = 0.5;
    for (let i = 0; i < n; i++) {
      const a1 = (i / n) * Math.PI * 2 + rot;
      const j = Math.floor(i * k) % n;
      const a2 = (j / n) * Math.PI * 2 + rot;

      // ไล่ความจางตามระยะคอร์ด — เส้นสั้นชัด เส้นยาวจาง ให้เห็นมิติมากกว่าเส้นเท่ากันหมด
      const angDist = Math.min(Math.abs(i - j), n - Math.abs(i - j)) / (n / 2);
      const alpha = base * (0.35 + 0.65 * (1 - angDist));

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
      ctx.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R);
      ctx.strokeStyle = `rgba(${cR},${cG},${cB},${alpha})`;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════
  // MAIN LOOP
  // ════════════════════════════════════════════════════════════
  let lastEco=0; const ECO_MS=1000/14;
  let frames=0, secT=0, adaptStep=0, fpsHist=[];

  function draw(t) {
    if (!active) return;
    requestAnimationFrame(draw);
    const mode = getSettings().perfMode || 'medium';

    if (mode==='eco' && t-lastEco<ECO_MS) return;
    lastEco=t;

    frames++;
    if (t-secT>=1000) {
      const fps=frames; frames=0; secT=t;
      if (mode==='performance') {
        fpsHist.push(fps);
        if (fpsHist.length>=4) {
          const avg=fpsHist.reduce((a,b)=>a+b)/fpsHist.length;
          const prev=adaptStep;
          // Hysteresis: must exceed threshold by 8fps before changing step
          if      (adaptStep===0 && avg<37) adaptStep=1;
          else if (adaptStep===1 && avg<22) adaptStep=2;
          else if (adaptStep===1 && avg>53) adaptStep=0;
          else if (adaptStep===2 && avg>38) adaptStep=1;
          // Only smoothly fade in new particles — never hard-reset
          if (adaptStep!==prev) softRebuildParticles();
          fpsHist=[];
        }
      } else if(adaptStep!==0){adaptStep=0;} // just update step, no particle reset
    }

    ctx.clearRect(0,0,W,H);

    drawAurora(t);
    drawOrb();

    if (mode==='eco') { drawGrid(t); return; }

    drawStars();
    spawnRipple(); drawRipples(); drawBursts();
    drawGrid(t);
    drawParticles(t);

    if (mode==='performance') {
      if (adaptStep<2) { updateDrawLorenz(); drawHyperSphere(t); drawMultTable(t); }
      if (adaptStep<1) { drawEpicycles(t); drawFlowField(t); }
      if (adaptStep===0) { drawWaveInterference(t); }
    }
  }

  // ── Mouse ─────────────────────────────────────────────────────
  const onMove = e => {
    mouse.x=e.clientX; mouse.y=e.clientY;
    mouse.nx=(e.clientX/W)*2-1; mouse.ny=(e.clientY/H)*2-1;
    orb.tx=e.clientX; orb.ty=e.clientY;
  };
  const onLeave = () => { mouse.x=-9999; mouse.y=-9999; orb.tx=-9999; orb.ty=-9999; };
  window.addEventListener('mousemove', onMove, {passive:true});
  window.addEventListener('mouseleave', onLeave, {passive:true});
  window.addEventListener('touchmove', e => {
    if(e.touches[0]){mouse.x=e.touches[0].clientX;mouse.y=e.touches[0].clientY;orb.tx=mouse.x;orb.ty=mouse.y;
    mouse.nx=(mouse.x/W)*2-1;mouse.ny=(mouse.y/H)*2-1;}
  },{passive:true});

  resize();
  requestAnimationFrame(draw);

  return function cleanup(){
    active=false; unsub();
    window.removeEventListener('resize',resize);
    window.removeEventListener('mousemove',onMove);
    window.removeEventListener('mouseleave',onLeave);
    window.removeEventListener('click',onClickRipple);
    canvas.remove();
  };
}
