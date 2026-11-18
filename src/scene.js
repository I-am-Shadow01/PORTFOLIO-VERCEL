// A closed, folded spectral sculpture. One indexed mesh, one draw, no textures.
const VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aUV;
uniform vec2 uTilt;
uniform float uTime;
uniform float uAspect;
out vec3 vNormal;
out vec3 vPosition;
out vec2 vUV;
const float TAU=6.28318530718;

mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1,0,0,0,c,s,0,-s,c);}
mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0,-s,0,1,0,s,0,c);}
mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0,-s,c,0,0,0,1);}

// The longitudinal frame uses the analytic center-line derivative. Its twist
// changes the cross-section itself, so the highlights follow a real volume.
void surface(float a,float b,float t,out vec3 p,out vec3 side) {
  float c=cos(2.*a),s=sin(2.*a);
  float phase=3.*a+.24*sin(t*.48);
  float q=cos(phase),h=sin(phase);
  float r=.67+.245*q;
  float dr=-.735*h;
  vec3 center=vec3(c*r,s*r,.30*h);
  vec3 tangent=normalize(vec3(dr*c-2.*r*s,dr*s+2.*r*c,.90*q));
  vec3 axis=normalize(vec3(c,s,0.)-tangent*dot(vec3(c,s,0.),tangent));
  vec3 binormal=cross(tangent,axis);
  float twist=2.*a+.78+.35*sin(3.*a-t*.62)+.13*sin(t*.45);
  float ct=cos(twist),st=sin(twist);
  vec3 w=axis*ct+binormal*st;
  vec3 d=binormal*ct-axis*st;
  float width=.178+.032*sin(3.*a+.6+t*.43);
  float depth=.058+.011*cos(3.*a-t*.51);
  float cb=cos(b),sb=sin(b);
  // A flattened, softly faceted cross-section: broad satin faces and fine bevels.
  float flatten=1.+.12*cb*cb;
  p=center+w*(width*cb)+d*(depth*sb*flatten);
  side=w*(-width*sb)+d*(depth*cb*(1.+.12*(cb*cb-2.*sb*sb)));
}

void main(){
  float a=aUV.x*TAU,b=aUV.y*TAU;
  vec3 p,side,next,unused;
  surface(a,b,uTime,p,side);
  surface(a+.002,b,uTime,next,unused);
  vec3 n=normalize(cross(side,next-p));
  // A slow bounded orbit maintains the composition; input only adds a tilt.
  mat3 rot=ry(.37+.24*sin(uTime*.21)+uTilt.x*.53)
           *rx(-.32+.17*sin(uTime*.19+.4)-uTilt.y*.43)
           *rz(-.26+.16*sin(uTime*.15));
  p=rot*p;
  vPosition=p;
  vNormal=rot*n;
  vUV=aUV;
  float distance=3.65-p.z;
  // Keep the object inside the frame in both portrait and landscape.
  float fit=min(1.,uAspect)*2.78;
  gl_Position=vec4(p.x*fit/uAspect,p.y*fit,(distance-1.0)*1.09,distance);
}`;

const FS = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vPosition;
in vec2 vUV;
uniform float uMode;
out vec4 color;
const float TAU=6.28318530718;

// Analytic studio softboxes in reflection space; sharp on polished edges,
// broad on satin faces. Lighting stays fixed while the object moves.
float panel(vec3 r,vec3 dir,vec3 up,float spanX,float spanY,float softness){
  vec3 right=normalize(cross(dir,up));
  vec3 vertical=cross(right,dir);
  float front=dot(r,dir);
  vec2 uv=abs(vec2(dot(r,right),dot(r,vertical))/max(front,.05));
  vec2 edge=1.-smoothstep(vec2(spanX,spanY),vec2(spanX,spanY)+softness,uv);
  return edge.x*edge.y*smoothstep(0.,.22,front);
}
vec3 studio(vec3 r,float rough){
  float key=panel(r,normalize(vec3(-.62,.71,.88)),vec3(0,1,0),.62,.91,.14+rough*.48);
  float strip=panel(r,normalize(vec3(.85,.13,.53)),vec3(0,1,0),.13,1.45,.07+rough*.32);
  float top=panel(r,normalize(vec3(.08,1.,-.32)),vec3(0,0,1),1.28,.19,.13+rough*.45);
  float bounce=panel(r,normalize(vec3(-.28,-.81,.51)),vec3(0,1,0),1.1,.34,.25);
  vec3 env=mix(vec3(.035,.042,.095),vec3(.16,.20,.37),smoothstep(-.9,1.,r.y));
  return env+key*vec3(2.65,2.7,2.95)+strip*vec3(.68,1.65,2.9)
            +top*vec3(1.14,.75,2.25)+bounce*vec3(.23,.18,.48);
}
vec3 filmic(vec3 x){
  return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);
}
void main(){
  vec3 n=normalize(vNormal);
  if(!gl_FrontFacing)n=-n;
  vec3 v=normalize(vec3(0.,0.,3.65)-vPosition);
  float NoV=max(dot(n,v),.001);
  vec3 r=reflect(-v,n);
  float stripe=cos(TAU*vUV.y);
  // Contrasting faces in a single uninterrupted material, with polished ribs.
  float bevel=smoothstep(.69,.94,abs(stripe));
  float brightFace=smoothstep(-.18,.32,sin(TAU*vUV.y));
  float hue=.5+.5*cos(TAU*(3.*vUV.x+.12));
  vec3 ink=mix(vec3(.023,.032,.11),vec3(.10,.042,.21),hue);
  vec3 alloy=mix(vec3(.31,.48,.76),vec3(.58,.49,.85),hue);
  vec3 ceramic=mix(ink,alloy,brightFace*.88);
  vec3 edge=mix(vec3(.39,.71,.95),vec3(.84,.68,1.),hue);
  vec3 base=mix(ceramic,edge,bevel*.88);
  if(uMode>.5) base=mix(base,vec3(.76,.81,.89),.64);
  float metal=mix(.48,.94,max(bevel,brightFace*.78));
  float rough=mix(.37,.11,max(bevel,brightFace*.5));
  vec3 f0=mix(vec3(.043),base,metal);
  float fres=pow(1.-NoV,5.);
  vec3 F=f0+(1.-f0)*fres;
  float diffuse=.24+.61*max(dot(n,normalize(vec3(-.5,.8,1.))),0.)
                   +.18*max(dot(n,normalize(vec3(.8,-.4,.4))),0.);
  // Grazing reflections on the volume give it a crisp, silver rim.
  vec3 radiance=base*(1.-metal)*diffuse+studio(r,rough)*F;
  radiance+=vec3(.045,.095,.18)*pow(1.-NoV,2.);
  // Narrow inlaid rim, intentionally much subtler than the softbox highlights.
  float inlay=1.-smoothstep(0.,.022,abs(abs(stripe)-.87));
  radiance+=inlay*mix(vec3(.045,.16,.30),vec3(.24,.08,.35),hue);
  color=vec4(pow(filmic(max(radiance,vec3(0.))),vec3(1./2.2)),1.);
}`;

function shader(gl,type,source) {
  const value=gl.createShader(type);
  if(!value)return null;
  gl.shaderSource(value,source);
  gl.compileShader(value);
  if(gl.getShaderParameter(value,gl.COMPILE_STATUS))return value;
  console.warn('Sculpture shader:',gl.getShaderInfoLog(value));
  gl.deleteShader(value);
  return null;
}

function makeProgram(gl) {
  const vert=shader(gl,gl.VERTEX_SHADER,VS),frag=shader(gl,gl.FRAGMENT_SHADER,FS);
  let program=null;
  if(vert&&frag){
    program=gl.createProgram();
    if(program){
      gl.attachShader(program,vert);
      gl.attachShader(program,frag);
      gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
        console.warn('Sculpture link:',gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        program=null;
      }
    }
  }
  if(vert)gl.deleteShader(vert);
  if(frag)gl.deleteShader(frag);
  return program;
}

function meshFor(gl,coarse) {
  const rings=coarse?192:256,steps=coarse?32:40,stride=steps+1;
  const uv=new Float32Array((rings+1)*stride*2);
  const indices=new Uint16Array(rings*steps*6);
  let p=0,k=0;
  for(let i=0;i<=rings;i++)for(let j=0;j<=steps;j++){
    uv[p++]=i/rings;uv[p++]=j/steps;
  }
  for(let i=0;i<rings;i++)for(let j=0;j<steps;j++){
    const a=i*stride+j,b=a+stride;
    indices[k++]=a;indices[k++]=a+1;indices[k++]=b;
    indices[k++]=b;indices[k++]=a+1;indices[k++]=b+1;
  }
  const vao=gl.createVertexArray(),vbo=gl.createBuffer(),ibo=gl.createBuffer();
  if(!vao||!vbo||!ibo){
    if(vao)gl.deleteVertexArray(vao);
    if(vbo)gl.deleteBuffer(vbo);
    if(ibo)gl.deleteBuffer(ibo);
    return null;
  }
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
  gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return {vao,vbo,ibo,count:indices.length};
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const LEVELS=[1,.86,.72,.60];
const REST_TIME=2.3;

export function startSculpture(canvas,host) {
  if(!canvas||!host)return ()=>{};
  const controls=[...host.querySelectorAll('button[data-scene-action]')];
  const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
  const coarseQuery=matchMedia('(pointer: coarse)');
  let reduced=reducedQuery.matches,coarse=coarseQuery.matches;
  let gl=null,gpu=null,lost=false,disposed=false,failed=false;
  let visible=true,userPaused=false,mode=0,dirty=true,raf=0;
  let time=REST_TIME,previous=0,nextDue=0,lastPeriod=0;
  let refresh=1000/60,slow=0,fast=0,samples=0,tier=0,constrained=false;
  let width=1,height=1,pixelRatio=0,bufferWidth=0,bufferHeight=0,ready=false;
  const tilt={x:0,y:0,tx:0,ty:0};
  let touch=null;

  function status(value){
    if(canvas.dataset.motion!==value)canvas.dataset.motion=value;
  }
  function syncControls(){
    for(const button of controls){
      const action=button.dataset.sceneAction;
      button.disabled=failed||lost||(reduced&&action==='pause');
      if(action==='pause'){
        const paused=userPaused||reduced;
        button.setAttribute('aria-pressed',String(paused));
        const label=button.querySelector('[data-scene-label]');
        const next=paused?button.dataset.labelResume:button.dataset.labelPause;
        if(label&&next)label.textContent=next;
      }else if(action==='mode'){
        button.setAttribute('aria-pressed',String(mode===1));
      }
    }
  }
  function disposeGpu(){
    if(!gpu)return;
    if(!lost){
      gl.deleteVertexArray(gpu.mesh.vao);
      gl.deleteBuffer(gpu.mesh.vbo);
      gl.deleteBuffer(gpu.mesh.ibo);
      gl.deleteProgram(gpu.program);
    }
    gpu=null;
  }
  function initialize(){
    const program=makeProgram(gl);
    if(!program)return false;
    const mesh=meshFor(gl,coarse);
    if(!mesh){gl.deleteProgram(program);return false;}
    const uniforms=Object.fromEntries(['Tilt','Time','Aspect','Mode'].map(name=>[name,gl.getUniformLocation(program,'u'+name)]));
    gpu={program,mesh,uniforms};
    bufferWidth=bufferHeight=0;
    ready=false;
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0,0,0,0);
    return true;
  }
  function unavailable(){
    failed=true;
    cancel();
    canvas.classList.remove('scene-ready');
    status('unavailable');
    syncControls();
  }
  try{
    gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:false,powerPreference:'low-power'});
    if(!gl||!initialize()){unavailable();return ()=>{disposed=true;disposeGpu();status('disposed');};}
  }catch(error){
    console.warn('Sculpture initialization:',error);
    unavailable();
    return ()=>{disposed=true;disposeGpu();status('disposed');};
  }

  const allowed=()=>!disposed&&!failed&&!lost&&visible&&!document.hidden;
  const animating=()=>!reduced&&!userPaused;
  function cancel(){
    if(raf)cancelAnimationFrame(raf);
    raf=0;
    previous=nextDue=lastPeriod=0;
  }
  function schedule(){
    if(allowed()&&!raf&&(dirty||animating()))raf=requestAnimationFrame(frame);
  }
  function updateState(){
    if(lost||failed){status('unavailable');return;}
    if(!allowed()){endTouch();cancel();status('paused');return;}
    if(!animating()){
      endTouch();
      cancel();
      status(reduced?'static':'paused');
    }
    schedule();
  }
  function measure(){
    const bounds=canvas.getBoundingClientRect();
    width=Math.max(1,bounds.width);
    height=Math.max(1,bounds.height);
    dirty=true;
    schedule();
  }
  function resizeBuffer(){
    const cap=coarse?1.35:1.95,pixels=coarse?560000:1350000;
    const dpr=Math.min(devicePixelRatio||1,cap,Math.sqrt(pixels/(width*height)))*LEVELS[tier];
    const w=Math.max(1,Math.round(width*dpr)),h=Math.max(1,Math.round(height*dpr));
    if(canvas.width!==w||canvas.height!==h){
      canvas.width=w;
      canvas.height=h;
    }
    if(bufferWidth!==w||bufferHeight!==h){
      gl.viewport(0,0,w,h);
      bufferWidth=w;bufferHeight=h;
    }
    pixelRatio=devicePixelRatio||1;
  }
  function draw(){
    resizeBuffer();
    const {program,mesh,uniforms:u}=gpu;
    gl.useProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(u.Tilt,tilt.x,tilt.y);
    gl.uniform1f(u.Time,time);
    gl.uniform1f(u.Aspect,canvas.width/canvas.height);
    gl.uniform1f(u.Mode,mode);
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
    gl.bindVertexArray(null);
    if(!ready){canvas.classList.add('scene-ready');ready=true;}
    dirty=false;
  }
  function targetRate(){
    if(constrained)return 30;
    // Native high refresh during direct manipulation; idle touch devices
    // conserve power at 60 Hz. The display's rAF cadence is the upper bound.
    const engaged=touch?.axis==='x'||Math.abs(tilt.x)>.025||Math.abs(tilt.y)>.025;
    return coarse&&!engaged?60:120;
  }
  function adapt(dt,rate){
    if(dt<5||dt>150)return;
    // Learn the display cadence only from faster samples; a slow GPU must
    // not redefine a missed refresh as the expected interval.
    if(dt<refresh)refresh+=.08*(dt-refresh);
    const interval=Math.max(refresh,1000/rate);
    if(++samples<24)return;
    if(dt>interval*1.48){slow++;fast=0;}
    else{
      slow=Math.max(0,slow-.35);
      if(dt<interval*1.16)fast++;
      else fast=0;
    }
    if(slow>=18){
      if(tier<LEVELS.length-1)tier++;
      else constrained=true;
      slow=fast=0;
      dirty=true;
    }else if(fast>=480){
      // Recover gradually, avoiding oscillation on thermally limited devices.
      if(constrained)constrained=false;
      else if(tier>0)tier--;
      slow=fast=0;
      dirty=true;
    }
  }
  function frame(now){
    raf=0;
    if(!allowed())return;
    const active=animating();
    const dt=previous?now-previous:0;
    previous=now;
    if(active){
      if(dt>0)adapt(dt,targetRate());
      const seconds=Math.min(.05,dt/1000);
      const damping=1-Math.exp(-(touch?.axis==='x'?19:7.8)*seconds);
      tilt.x+=(tilt.tx-tilt.x)*damping;
      tilt.y+=(tilt.ty-tilt.y)*damping;
      time+=seconds;
    }
    if(pixelRatio!==(devicePixelRatio||1))dirty=true;
    const period=1000/targetRate();
    if(!nextDue||lastPeriod!==period){nextDue=now;lastPeriod=period;}
    // Preserve the deadline phase even when a frame is late or a resize
    // forces an early draw. Never queue catch-up renders.
    const due=now>=nextDue-.7;
    if(dirty||(active&&due)){
      draw();
      if(due)nextDue+=period*(Math.floor(Math.max(0,now+.7-nextDue)/period)+1);
      status(reduced?'static':userPaused?'paused':'running');
    }
    if(active)schedule();
  }
  function reset(){
    endTouch();
    tilt.x=tilt.y=tilt.tx=tilt.ty=0;
    time=REST_TIME;
    mode=0;
    dirty=true;
    syncControls();
    schedule();
  }
  function pointerMove(e){
    if(!animating()||!allowed()||e.pointerType==='touch')return;
    const r=host.getBoundingClientRect();
    tilt.tx=clamp((e.clientX-r.left)/Math.max(1,r.width)*2-1,-1,1);
    tilt.ty=clamp((e.clientY-r.top)/Math.max(1,r.height)*2-1,-1,1);
  }
  function leave(e){if(e?.pointerType!=='touch')tilt.tx=tilt.ty=0;}
  function touchStart(e){
    if(e.pointerType!=='touch'||!e.isPrimary||touch||!animating()||!allowed())return;
    // Only the canvas listens to touch; the overlaid buttons never start a drag.
    touch={id:e.pointerId,x:e.clientX,y:e.clientY,axis:null};
  }
  function touchMove(e){
    if(!touch||e.pointerId!==touch.id||!animating()||!allowed())return;
    const dx=e.clientX-touch.x,dy=e.clientY-touch.y;
    if(!touch.axis){
      if(Math.max(Math.abs(dx),Math.abs(dy))<7)return;
      if(Math.abs(dx)>Math.abs(dy)*1.15){
        touch.axis='x';
        try{canvas.setPointerCapture(e.pointerId);}catch{}
      }else if(Math.abs(dy)>Math.abs(dx)*1.15){touch.axis='y';}
    }
    if(touch.axis!=='x')return;
    // Cached CSS width; no layout reads or preventDefault on touch moves.
    tilt.tx=clamp(dx/Math.max(80,width*.34),-1,1);
    tilt.ty=0;
  }
  function endTouch(e){
    if(!touch||(e&&e.pointerId!==touch.id))return;
    const id=touch.id;
    touch=null;
    tilt.tx=tilt.ty=0;
    try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}catch{}
  }
  function visibility(){updateState();}
  function motion(){
    reduced=reducedQuery.matches;
    if(reduced){endTouch();tilt.x=tilt.y=tilt.tx=tilt.ty=0;dirty=true;}
    syncControls();
    cancel();
    updateState();
  }
  function inputMode(){
    endTouch();
    coarse=coarseQuery.matches;
    tier=slow=fast=samples=0;constrained=false;refresh=1000/60;
    leave();
    measure();
  }
  function click(e){
    const button=e.target.closest?.('button[data-scene-action]');
    if(!button||!host.contains(button)||button.disabled)return;
    switch(button.dataset.sceneAction){
      case 'pause':
        if(reduced)return;
        userPaused=!userPaused;
        cancel();
        syncControls();
        updateState();
        break;
      case 'reset': reset(); break;
      case 'mode': mode=1-mode;dirty=true;syncControls();schedule();break;
    }
  }
  function lostContext(e){
    e.preventDefault();
    lost=true;
    endTouch();
    disposeGpu();
    cancel();
    canvas.classList.remove('scene-ready');
    status('unavailable');
    syncControls();
  }
  function restored(){
    if(disposed)return;
    lost=false;
    try{if(!initialize()){unavailable();return;}}
    catch(error){console.warn('Sculpture restore:',error);unavailable();return;}
    dirty=true;
    syncControls();
    updateState();
  }
  host.addEventListener('pointermove',pointerMove,{passive:true});
  host.addEventListener('pointerleave',leave);
  host.addEventListener('click',click);
  canvas.addEventListener('pointerdown',touchStart,{passive:true});
  canvas.addEventListener('pointermove',touchMove,{passive:true});
  canvas.addEventListener('pointerup',endTouch,{passive:true});
  canvas.addEventListener('pointercancel',endTouch,{passive:true});
  canvas.addEventListener('lostpointercapture',endTouch);
  document.addEventListener('visibilitychange',visibility);
  reducedQuery.addEventListener?.('change',motion);
  coarseQuery.addEventListener?.('change',inputMode);
  canvas.addEventListener('webglcontextlost',lostContext);
  canvas.addEventListener('webglcontextrestored',restored);
  const ro=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;
  ro?.observe(canvas);
  window.addEventListener('resize',measure,{passive:true});
  const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
    const next=entries[0]?.isIntersecting??true;
    if(next===visible)return;
    visible=next;
    updateState();
  },{threshold:0}):null;
  observer?.observe(host);
  status('initializing');
  syncControls();
  measure();
  updateState();
  return ()=>{
    disposed=true;
    endTouch();
    cancel();
    ro?.disconnect();
    observer?.disconnect();
    host.removeEventListener('pointermove',pointerMove);
    host.removeEventListener('pointerleave',leave);
    host.removeEventListener('click',click);
    canvas.removeEventListener('pointerdown',touchStart);
    canvas.removeEventListener('pointermove',touchMove);
    canvas.removeEventListener('pointerup',endTouch);
    canvas.removeEventListener('pointercancel',endTouch);
    canvas.removeEventListener('lostpointercapture',endTouch);
    document.removeEventListener('visibilitychange',visibility);
    reducedQuery.removeEventListener?.('change',motion);
    coarseQuery.removeEventListener?.('change',inputMode);
    window.removeEventListener('resize',measure);
    canvas.removeEventListener('webglcontextlost',lostContext);
    canvas.removeEventListener('webglcontextrestored',restored);
    disposeGpu();
    canvas.classList.remove('scene-ready');
    status('disposed');
  };
}
