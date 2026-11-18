
import { COPY, PROJECTS, GITHUB, EMAIL } from './content.js';
import { startSculpture } from './scene.js';
import { startEditorialMotion } from './motion.js';
import { projectArtwork } from './project-art.js';

const icons = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  out: '<path d="M6 18 18 6M7 6h11v11"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.2 15.5A8.5 8.5 0 0 1 8.5 3.8 8.5 8.5 0 1 0 20.2 15.5Z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  git: '<path d="M9 19c-4.3 1.3-4.3-2-6-2.5M15 22v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6A4.7 4.7 0 0 0 18.4 7a4.4 4.4 0 0 0-.1-3.3S17.2 3.4 15 5a12 12 0 0 0-6 0C6.8 3.4 5.7 3.7 5.7 3.7A4.4 4.4 0 0 0 5.6 7a4.7 4.7 0 0 0-1.3 3.3c0 4.7 2.8 5.7 5.5 6A3 3 0 0 0 9 18.6V22"/>',
  reset: '<path d="M4 11a8 8 0 1 1 2 6m-2-6V5m0 6h6"/>',
  material: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M12 4a8 8 0 0 1 0 16" fill="currentColor"/>',
  pause: '<path d="M9 5v14M15 5v14"/>'
};
const icon = name => '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6">'+icons[name]+'</svg>';
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
function read(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
function save(key, val) { try { localStorage.setItem(key,val); } catch {} }
let locale=read('cid.locale',navigator.language?.toLowerCase().startsWith('th')?'th':'en');
if(!Object.hasOwn(COPY,locale)) locale='en';
let theme=read('cid.theme',matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')==='light'?'light':'dark';
let filter='all';
let stopScene=()=>{},stopMotion=()=>{},stopUI=()=>{};
const category = p => p.id==='native-c-bot'?'systems':p.id==='translate-unlocker'?'web':'audio';
const tr = (th,en) => locale==='th'?th:en;
const tags = list => '<div class="tag-list">'+list.map(s=>'<span>'+esc(s)+'</span>').join('')+'</div>';
const repoUrl = p=>GITHUB+'/'+encodeURIComponent(p.repo);
const external=(href,label,className='inline-link')=>'<a class="'+className+'" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' '+icon('out')+'<span class="sr-only"> '+esc(COPY[locale].external)+'</span></a>';
const artLabel = p => p.id==='music-app'?tr('แนวคิดภาพประกอบ • ไม่ใช่ภาพหน้าจอ','VISUAL STUDY · NOT A SCREENSHOT'):tr('ภาพประกอบแนวคิด','CONCEPT ILLUSTRATION');
function detail(p,t){
  const d=p[locale];
  return '<details class="project-details"><summary>'+esc(t.details)+'<span class="details-plus" aria-hidden="true">+</span></summary><div class="details-body"><h4>'+esc(t.challenge)+'</h4><p>'+esc(d.challenge)+'</p><h4>'+esc(t.solution)+'</h4><p>'+esc(d.solution)+'</p></div></details>';
}
function project(p,t) {
  const d=p[locale],isFeatured=p.featured;
  return '<article class="'+(isFeatured?'featured-work':'work-card')+' reveal" id="'+esc(p.id)+'" data-project-category="'+category(p)+'" aria-labelledby="title-'+esc(p.id)+'">'+
    '<div class="'+(isFeatured?'featured-stage':'card-art')+' card-art-'+esc(p.id)+'"><div class="art-top"><span>FIG. '+esc(p.number)+'</span><span>'+esc(p.kind)+'</span></div>'+projectArtwork(p)+'<div class="art-bottom"><span>'+esc(artLabel(p))+'</span><span>'+esc(p.number)+' / 04</span></div></div>'+
    '<div class="'+(isFeatured?'featured-copy':'card-content')+'"><div class="card-meta"><span>'+esc(p.kind)+'</span><span>2026 / '+esc(p.number)+'</span></div>'+
    '<h3 id="title-'+esc(p.id)+'">'+esc(p.title)+'</h3><p class="project-description">'+esc(d.description)+'</p>'+
    (isFeatured?'<div class="feature-facts"><div><h4>'+esc(t.challenge)+'</h4><p>'+esc(d.challenge)+'</p></div><div><h4>'+esc(t.solution)+'</h4><p>'+esc(d.solution)+'</p></div></div>':'')+
    tags(p.tech)+(isFeatured?'':detail(p,t))+external(repoUrl(p),isFeatured?t.featureView:t.source,isFeatured?'feature-link':'inline-link')+'</div></article>';
}
function sectionHead(kicker,id,title,lead){
  return '<div class="section-heading reveal"><div class="eyebrow"><span class="index-mark"></span>'+esc(kicker)+'</div><div class="section-heading-row"><h2 id="'+id+'">'+esc(title)+'</h2><p>'+esc(lead)+'</p></div></div>';
}
function navigation(t){
  return [['work',t.navWork],['approach',t.navApproach],['now',t.navNow],['contact',t.navContact]].map(([id,label])=>'<a href="#'+id+'" data-nav="'+id+'">'+esc(label)+'</a>').join('');
}
function render(){
  const t=COPY[locale];
  document.documentElement.lang=locale;
  document.documentElement.dataset.theme=theme;
  document.querySelector('.skip-link').textContent=t.skip;
  setThemeMeta();
  const filters=[['all',tr('ทั้งหมด','All work')],['audio',tr('เสียง / มีเดีย','Audio / media')],['systems',tr('ระบบ / AI','Systems / AI')],['web',tr('เว็บ','Web')]];
  document.getElementById('app').innerHTML =
    '<header class="site-header" id="top"><div class="header-inner wrap"><a href="#top" class="brand" aria-label="CID home"><span class="brand-mark" aria-hidden="true">C</span><span>cid<span class="brand-dot">.</span><small> / PORTFOLIO</small></span></a>'+
    '<nav class="desktop-nav" aria-label="'+esc(tr('เมนูหลัก','Main navigation'))+'">'+navigation(t)+'</nav>'+
    '<div class="header-controls"><button type="button" class="lang-button" aria-label="'+esc(t.switchLanguage)+'"><span class="'+(locale==='th'?'chosen':'')+'">TH</span><i>/</i><span class="'+(locale==='en'?'chosen':'')+'">EN</span></button>'+
    '<button type="button" class="icon-button theme-toggle" aria-label="'+esc(t.switchTheme)+'" aria-pressed="'+(theme==='light')+'">'+icon(theme==='dark'?'sun':'moon')+'</button>'+
    '<button type="button" class="menu-button" aria-label="'+esc(t.menu)+'" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span></button></div></div>'+
    '<nav id="mobile-nav" class="mobile-nav" aria-label="'+esc(tr('เมนูมือถือ','Mobile navigation'))+'" inert>'+navigation(t)+'</nav></header>'+
    '<main id="main"><section class="hero wrap" aria-labelledby="hero-title"><div class="hero-copy"><div class="eyebrow hero-eyebrow"><span class="signal-dot"></span>'+esc(t.topLabel)+'</div>'+
    '<div class="hero-identity">CID<span> / </span>'+esc(tr('นักพัฒนาซอฟต์แวร์','SOFTWARE DEVELOPER'))+'</div>'+
    '<h1 id="hero-title"><span>'+esc(t.heroOne)+'</span><span>'+esc(t.heroTwo)+'</span><em>'+esc(t.heroThree)+'</em></h1>'+
    '<p class="hero-intro">'+esc(t.intro)+'</p><div class="hero-actions"><a href="#work" class="button button-primary">'+esc(t.explore)+icon('arrow')+'</a><a href="'+esc(GITHUB)+'" class="button button-quiet" target="_blank" rel="noopener noreferrer">'+icon('git')+esc(t.github)+icon('out')+'</a></div>'+
    '<div class="hero-foot"><span>01 — 04</span><span class="hero-scroll"><span class="scroll-line"></span>'+esc(t.scroll)+'</span></div></div>'+
    '<div class="hero-art"><div class="sculpture" id="sculpture"><div class="sculpture-fallback" aria-hidden="true"></div><canvas id="hero-canvas" aria-hidden="true"></canvas><div class="sculpture-frame" aria-hidden="true"><span><b>FIELD / 001</b><small>FORM IN MOTION</small></span><span>INTERACTIVE<br>STUDY</span></div>'+
    '<div class="sculpture-coordinates" aria-hidden="true"><span>+</span><span>+</span><span>+</span><span>+</span></div>'+
    '<div class="scene-tools"><span class="scene-hint">'+esc(tr('ขยับหรือลากเพื่อสำรวจ','MOVE / DRAG'))+'</span><div><button class="scene-button" type="button" data-scene-action="pause" aria-pressed="false" data-label-pause="'+esc(tr('หยุด','Pause'))+'" data-label-resume="'+esc(tr('เล่นต่อ','Resume'))+'">'+icon('pause')+'<span data-scene-label>'+esc(tr('หยุด','Pause'))+'</span></button><button class="scene-button" type="button" data-scene-action="mode" aria-pressed="false" aria-label="'+esc(tr('สลับวัสดุผิว','Switch material'))+'" title="'+esc(tr('สลับวัสดุผิว','Switch material'))+'">'+icon('material')+'</button><button class="scene-button" type="button" data-scene-action="reset" aria-label="'+esc(tr('คืนมุมมองเริ่มต้น','Reset view'))+'">'+icon('reset')+'</button></div></div></div>'+
    '<div class="art-caption"><span><b>01.</b> '+esc(t.artLabel)+'</span><span>'+esc(t.artifactCaption)+'</span></div></div></section>'+
    '<section class="work-section section-pad" id="work" aria-labelledby="work-title"><div class="wrap">'+sectionHead(t.workKicker,'work-title',t.workTitle,t.workLead)+
    '<div class="work-toolbar"><div class="filters" role="group" aria-label="'+esc(tr('กรองผลงาน','Filter projects'))+'">'+filters.map(([val,label])=>'<button type="button" data-project-filter="'+val+'" aria-pressed="'+(filter===val)+'">'+esc(label)+'</button>').join('')+'</div><span class="filter-status" role="status" aria-live="polite"></span></div>'+
    project(PROJECTS[0],t)+'<div class="work-grid">'+PROJECTS.slice(1).map(p=>project(p,t)).join('')+'</div></div></section>'+
    '<section class="approach-section section-pad" id="approach" aria-labelledby="approach-title"><div class="wrap approach-layout"><div class="approach-intro reveal"><div class="eyebrow"><span class="index-mark"></span>'+esc(t.approachKicker)+'</div><h2 id="approach-title">'+esc(t.approachTitle)+'</h2><p>'+esc(t.approachLead)+'</p>'+
    '<div class="approach-signet" aria-hidden="true"><svg viewBox="0 0 240 120" fill="none"><g stroke="currentColor" stroke-width=".8"><path d="M0 60h240M120 0v120" opacity=".24"/><ellipse cx="120" cy="60" rx="94" ry="32" transform="rotate(-22 120 60)"/><ellipse cx="120" cy="60" rx="94" ry="32" transform="rotate(22 120 60)"/><circle cx="120" cy="60" r="42" stroke-dasharray="3 6"/><circle cx="120" cy="60" r="5" fill="currentColor"/></g></svg><small>THINK / BUILD / REFINE</small></div></div>'+
    '<div class="principles">'+[1,2,3].map(n=>'<article class="principle reveal"><span class="principle-number">0'+n+'.</span><div><h3>'+esc(t['principle'+n+'Title'])+'</h3><p>'+esc(t['principle'+n+'Body'])+'</p></div><span class="principle-arrow" aria-hidden="true">↗</span></article>').join('')+'</div></div></section>'+
    '<section class="now-section section-pad" id="now" aria-labelledby="now-title"><div class="wrap">'+sectionHead(t.nowKicker,'now-title',t.nowTitle,t.nowLead)+
    '<div class="exploration-grid">'+[1,2,3].map(n=>'<article class="exploration reveal"><span class="exploration-top"><span>RESEARCH / 0'+n+'</span><span class="small-dot"></span></span><div class="exploration-symbol symbol-'+n+'" aria-hidden="true">'+['','∿','⌘','◌'][n]+'</div><h3>'+esc(t['now'+n])+'</h3><p>'+esc(t['now'+n+'Detail'])+'</p></article>').join('')+'</div></div></section>'+
    '<section class="contact-section section-pad" id="contact" aria-labelledby="contact-title"><div class="wrap"><div class="contact-inner reveal"><div class="eyebrow"><span class="index-mark"></span>'+esc(t.contactKicker)+'</div><div class="contact-grid"><div><h2 id="contact-title">'+esc(t.contactTitle)+'</h2><p>'+esc(t.contactLead)+'</p></div><div class="contact-actions"><a href="mailto:'+esc(EMAIL)+'" class="button button-primary">'+esc(t.contactEmail)+icon('out')+'</a><a href="'+esc(GITHUB)+'" class="button button-quiet" target="_blank" rel="noopener noreferrer">'+icon('git')+esc(t.openGithub)+icon('out')+'</a><button type="button" class="copy-email" aria-label="'+esc(t.copyEmail)+'">'+esc(EMAIL)+icon('copy')+'</button><span class="copy-status" role="status" aria-live="polite"></span></div></div></div></div></section></main>'+
    '<footer class="footer"><div class="wrap footer-inner"><a href="#top" class="brand" aria-label="CID home"><span class="brand-mark" aria-hidden="true">C</span>cid<span class="brand-dot">.</span></a><span>© '+new Date().getFullYear()+' CID. '+esc(t.footer)+'</span><a href="#top" class="back-to-top">'+esc(t.footerTop)+' ↑</a></div></footer>';
}
function setThemeMeta(){document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#0b0d14':'#f2f0eb';}
function applyFilter(value){
  filter=value;
  document.querySelectorAll('[data-project-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.projectFilter===filter)));
  let count=0;
  document.querySelectorAll('[data-project-category]').forEach(card=>{
    card.hidden=filter!=='all'&&card.dataset.projectCategory!==filter;
    if(!card.hidden)count++;
  });
  document.querySelector('.work-grid').hidden=![...document.querySelectorAll('.work-card')].some(c=>!c.hidden);
  document.querySelector('.filter-status').textContent=tr(count+' จาก '+PROJECTS.length+' ผลงาน',count+' / '+PROJECTS.length+' projects');
}
function bind(){
  const t=COPY[locale], abort=new AbortController(), signal=abort.signal;
  const on=(el,event,fn,opts={})=>el.addEventListener(event,fn,{...opts,signal});
  const menu=document.querySelector('.menu-button'), mobile=document.getElementById('mobile-nav');
  const setMenu=(open,focus=false)=>{
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?t.closeMenu:t.menu);menu.classList.toggle('open',open);
    mobile.classList.toggle('open',open);mobile.inert=!open;
    if(focus)menu.focus();
  };
  on(menu,'click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
  mobile.querySelectorAll('a').forEach(a=>on(a,'click',()=>setMenu(false)));
  on(document,'keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true')setMenu(false,true);});
  const desktop=matchMedia('(min-width: 861px)');
  on(desktop,'change',e=>{if(e.matches)setMenu(false);});
  on(document.querySelector('.lang-button'),'click',()=>{
    locale=locale==='th'?'en':'th';save('cid.locale',locale);rerender();
    document.querySelector('.lang-button').focus({preventScroll:true});
  });
  on(document.querySelector('.theme-toggle'),'click',()=>{
    theme=theme==='dark'?'light':'dark';save('cid.theme',theme);document.documentElement.dataset.theme=theme;setThemeMeta();
    const b=document.querySelector('.theme-toggle');b.innerHTML=icon(theme==='dark'?'sun':'moon');b.setAttribute('aria-pressed',String(theme==='light'));
  });
  on(document.querySelector('.copy-email'),'click',async()=>{
    const status=document.querySelector('.copy-status');
    try{await navigator.clipboard.writeText(EMAIL);status.textContent=t.copied;}catch{status.textContent=EMAIL;}
  });
  document.querySelectorAll('[data-project-filter]').forEach(b=>on(b,'click',()=>applyFilter(b.dataset.projectFilter)));
  applyFilter(filter);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let revealObserver=null,navObserver=null;
  if('IntersectionObserver' in window){
    if(!reduced.matches){
      revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');revealObserver.unobserve(e.target);}}),{threshold:.10,rootMargin:'0px 0px 36px 0px'});
      document.querySelectorAll('.reveal').forEach(e=>revealObserver.observe(e));
    }
    const active=new Set();
    const links=[...document.querySelectorAll('[data-nav]')];
    const sections=[...document.querySelectorAll('main > section')];
    const initNav=()=>{
      navObserver?.disconnect();
      active.clear();
      const viewport=Math.max(1,innerHeight);
      const top=Math.min(110,Math.round(viewport*.17)),bottom=Math.round(viewport*.59);
      navObserver=new IntersectionObserver(entries=>{
        entries.forEach(e=>{if(e.isIntersecting)active.add(e.target);else active.delete(e.target);});
        const shown=sections.find(e=>active.has(e));
        links.forEach(a=>{if(shown?.id&&a.dataset.nav===shown.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
      },{rootMargin:'-'+top+'px 0px -'+bottom+'px 0px',threshold:0});
      sections.forEach(e=>navObserver.observe(e));
    };
    initNav();
    on(window,'resize',initNav,{passive:true});
  }
  return ()=>{abort.abort();revealObserver?.disconnect();navObserver?.disconnect();};
}
function rerender(){
  stopScene();stopMotion();stopUI();render();stopUI=bind();
  stopMotion=startEditorialMotion(document);
  stopScene=startSculpture(document.getElementById('hero-canvas'),document.getElementById('sculpture'));
}
rerender();
