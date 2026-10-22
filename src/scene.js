// Native WebGL2 sculptural ribbon; one visibility-aware animation clock.
const VS=`#version 300 es
precision highp float;
layout(location=0) in vec2 aUV;
uniform vec2 uTilt;
uniform float uTime;
uniform float uAspect;
uniform float uLayer;
out vec3 vNormal;
out vec3 vView;
out vec2 vUV;

const float TAU=6.28318530718;

mat3 rotX(float a) {
  float c=cos(a),s=sin(a);
  return mat3(1.,0.,0., 0.,c,s, 0.,-s,c);
}
mat3 rotY(float a) {
  float c=cos(a),s=sin(a);
  return mat3(c,0.,-s, 0.,1.,0., s,0.,c);
}
mat3 rotZ(float a) {
  float c=cos(a),s=sin(a);
  return mat3(c,s,0., -s,c,0., 0.,0.,1.);
}

// Deform the surface itself: the light follows actual travelling folds.
vec3 silk(float u,float v,float t,float layer) {
  float a=u*TAU;
  float phase=mix(.35,2.35,layer);
  float radius=mix(.79,.83,layer);
  float width=mix(.185,.078,layer);
  float depth=mix(.15,.23,layer);
  float turns=mix(1.,2.,layer);

  float traveling=.054*sin(a*3.-t*.66+phase)
                 +.024*sin(a*5.+t*.31-phase);
  float twist=a*turns+phase
            +.23*sin(a*2.-t*.44+phase)
            +.12*sin(a*4.+t*.26-phase);
  float softWidth=width*(1.+.13*sin(a*2.-t*.42+phase));
  float radial=radius+traveling+cos(twist)*v*softWidth;

  float bend=depth*sin(a*2.+phase+.18*sin(t*.38))
             +.068*sin(a*3.-t*.49+phase);
  float flutter=.053*v*v*sin(a*3.-t*.83+phase+v*.9);
  return vec3(cos(a)*radial,
              sin(a)*radial,
              bend+sin(twist)*v*softWidth+flutter);
}

void main() {
  float t=uTime;
  vec3 pos=silk(aUV.x,aUV.y,t,uLayer);
  vec3 tangentU=silk(aUV.x+.00035,aUV.y,t,uLayer)
               -silk(aUV.x-.00035,aUV.y,t,uLayer);
  vec3 tangentV=silk(aUV.x,aUV.y+.002,t,uLayer)
               -silk(aUV.x,aUV.y-.002,t,uLayer);
  vec3 normal=normalize(cross(tangentU,tangentV));

  // Camera drifts in a slow arc, rather than doing a robotic full revolution.
  mat3 rotation=rotY(.23+.22*sin(t*.19)+uTilt.x*.36)
               *rotX(-.31+.13*sin(t*.14+1.2)-uTilt.y*.29)
               *rotZ(-.15+.17*sin(t*.11-.7));
  pos=rotation*pos;
  normal=normalize(rotation*normal);

  vec3 eye=vec3(0.,0.,3.5);
  float distance=eye.z-pos.z;
  gl_Position=vec4(pos.x*2.40/uAspect,pos.y*2.40,
                   (distance-1.3)*.85,distance);
  vNormal=normal;
  vView=eye-pos;
  vUV=aUV;
}`;
const FS=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vView;
in vec2 vUV;
uniform float uLayer;
out vec4 color;

void main() {
  vec3 view=normalize(vView);
  vec3 n=normalize(vNormal);
  if(!gl_FrontFacing) n=-n;

  vec3 key=normalize(vec3(-.53,.85,1.17));
  vec3 fill=normalize(vec3(.92,-.44,.51));
  float lit=.5+.5*dot(n,key);
  float bounced=.5+.5*dot(n,fill);
  float edge=pow(1.-max(dot(n,view),0.),2.45);
  float sheen=pow(max(dot(n,normalize(key+view)),0.),31.);
  float bloom=pow(max(dot(n,normalize(fill+view)),0.),10.);

  float weaving=.5+.5*sin(10.*vUV.x+1.3*vUV.y);
  vec3 midnight=vec3(.046,.055,.15);
  vec3 lilac=vec3(.31,.28,.62);
  vec3 silver=vec3(.72,.76,.93);
  vec3 sky=vec3(.35,.70,.93);

  vec3 base=mix(midnight,mix(lilac,silver,weaving*.56),.59+.23*lit);
  vec3 satin=base*(.38+.58*lit+.12*bounced);
  satin+=mix(lilac,sky,lit)*edge*.47;
  satin+=silver*sheen*.34+sky*bloom*.095;
  satin+=silver*.035*pow(abs(sin(vUV.y*10.)),16.);

  if(uLayer>.5) satin=mix(satin,sky,.20);
  satin=vec3(1.)-exp(-satin*1.09);
  color=vec4(pow(max(satin,vec3(0.)),vec3(.93)),1.);
}`;
function compile(gl,kind,source){
  const x=gl.createShader(kind);gl.shaderSource(x,source);gl.compileShader(x);
  if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){console.warn('Sculpture shader:',gl.getShaderInfoLog(x));gl.deleteShader(x);return null;}
  return x;
}
function programFor(gl){
  const v=compile(gl,gl.VERTEX_SHADER,VS),f=compile(gl,gl.FRAGMENT_SHADER,FS);
  if(!v||!f){if(v)gl.deleteShader(v);if(f)gl.deleteShader(f);return null;}
  const p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
  gl.deleteShader(v);gl.deleteShader(f);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.warn('Sculpture link:',gl.getProgramInfoLog(p));gl.deleteProgram(p);return null;}
  return p;
}
// Both fabric layers use the same lightweight UV surface. The GPU shapes it.
function buildMesh(gl) {
  const rings=240,steps=26,stride=steps+1;
  const uv=new Float32Array((rings+1)*stride*2);
  let cursor=0;
  for(let i=0;i<=rings;i++)
    for(let j=0;j<=steps;j++) {
      uv[cursor++]=i/rings;
      uv[cursor++]=2*j/steps-1;
    }
  const indices=new Uint16Array(rings*steps*6);
  let k=0;
  for(let i=0;i<rings;i++) for(let j=0;j<steps;j++) {
    const a=i*stride+j,b=a+stride;
    indices.set([a,b,a+1,b,b+1,a+1],k);
    k+=6;
  }
  const vao=gl.createVertexArray();
  const vbo=gl.createBuffer();
  const faces=gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
  gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,2,gl.FLOAT,false,2*4,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,faces);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return {vao,vbo,faces,count:indices.length};
}
function freeMesh(gl,m) {
  gl.deleteVertexArray(m.vao);
  gl.deleteBuffer(m.vbo);
  gl.deleteBuffer(m.faces);
}
export function startSculpture(canvas,host){
  if(!canvas||!host)return ()=>{};
  let gl;
  try{gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:false,powerPreference:'low-power'});}catch{}
  if(!gl){canvas.dataset.motion='unavailable';return ()=>{};}
  const query=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer:coarse)');
  let reduced=query.matches,visible=true,lost=false,disposed=false,raf=0,elapsed=1.7,lastFrame=0,lastDraw=0,quality=1,slow=0,fast=0;
  const pointer={x:0,y:0,vx:0,vy:0,tx:0,ty:0};
  let program,mesh=null,uni;
  function clearGpu(){if(mesh)freeMesh(gl,mesh);mesh=null;if(program)gl.deleteProgram(program);program=null;}
  function initialize(){
    program=programFor(gl);
    if(!program)return false;
    try{mesh=buildMesh(gl);}catch(e){console.warn('Sculpture mesh:',e);clearGpu();return false;}
    gl.useProgram(program);
    uni=Object.fromEntries(['tilt','time','aspect','layer'].map(x=>[x,gl.getUniformLocation(program,'u'+x[0].toUpperCase()+x.slice(1))]));
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }
  if(!initialize()){canvas.dataset.motion='unavailable';return ()=>{};}
  const allowed=()=>!disposed&&!lost&&visible&&!document.hidden;
  function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;}
  function schedule(){if(allowed()&&!raf)raf=requestAnimationFrame(frame);}
  function resize(){
    const r=host.getBoundingClientRect(),cap=coarse.matches?1.1:1.55,dpr=Math.min(devicePixelRatio||1,cap)*quality;
    const factor=Math.min(1,1200/Math.max(r.width*dpr,r.height*dpr));
    const w=Math.max(1,Math.round(r.width*dpr*factor)),h=Math.max(1,Math.round(r.height*dpr*factor));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  }
  function draw(){
    resize();gl.useProgram(program);
    gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(uni.tilt,pointer.x,pointer.y);
    gl.uniform1f(uni.time,elapsed);gl.uniform1f(uni.aspect,canvas.width/Math.max(canvas.height,1));
    gl.bindVertexArray(mesh.vao);
    for(let layer=0;layer<2;layer++){
      gl.uniform1f(uni.layer,layer);
      gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
    }
    gl.bindVertexArray(null);
    canvas.classList.add('scene-ready');
  }
  function frame(now){
    raf=0;if(!allowed())return;
    const interval=1000/(coarse.matches?30:60);
    if(lastDraw&&now-lastDraw<interval-2&&!reduced){schedule();return;}
    const dt=lastDraw?Math.min(now-lastDraw,64):16.7;lastDraw=now;lastFrame=now;
    // A damped spring gives pointer motion weight without snapping or wobbling.
    const seconds=Math.min(.06,dt/1000);
    const spring=48,damping=12.5;
    pointer.vx+=(spring*(pointer.tx-pointer.x)-damping*pointer.vx)*seconds;
    pointer.vy+=(spring*(pointer.ty-pointer.y)-damping*pointer.vy)*seconds;
    pointer.x+=pointer.vx*seconds;
    pointer.y+=pointer.vy*seconds;
    if(!reduced)elapsed+=dt/1000;
    if(dt>interval*1.75&&dt<220){slow++;fast=0;}else{slow=Math.max(0,slow-2);fast++;}
    if(slow>22&&quality>.65){quality=Math.max(.65,quality*.84);slow=0;}
    else if(fast>260&&quality<1){quality=Math.min(1,quality*1.12);fast=0;}
    draw();canvas.dataset.motion=reduced?'static':'running';
    if(!reduced)schedule();
  }
  function pause(){cancel();lastFrame=0;lastDraw=0;canvas.dataset.motion=lost?'unavailable':'paused';}
  function resume(){if(!allowed())return;lastFrame=0;lastDraw=0;schedule();}
  const pointerMove=e=>{
    if(reduced||coarse.matches)return;
    const r=host.getBoundingClientRect();
    pointer.tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/Math.max(r.width,1)*2-1));
    pointer.ty=Math.max(-1,Math.min(1,(e.clientY-r.top)/Math.max(r.height,1)*2-1));
  };
  const leave=()=>{pointer.tx=0;pointer.ty=0;};
  const visibility=()=>document.hidden?pause():resume();
  const motion=()=>{reduced=query.matches;leave();pause();resume();};
  const lostContext=e=>{e.preventDefault();lost=true;pause();};
  const restored=()=>{
    lost=false;mesh=null;program=null;
    if(!initialize()){lost=true;canvas.dataset.motion='unavailable';return;}
    resume();
  };
  host.addEventListener('pointermove',pointerMove,{passive:true});
  host.addEventListener('pointerleave',leave);
  document.addEventListener('visibilitychange',visibility);
  query.addEventListener?.('change',motion);
  canvas.addEventListener('webglcontextlost',lostContext);
  canvas.addEventListener('webglcontextrestored',restored);
  const ro=typeof ResizeObserver==='function'?new ResizeObserver(()=>{if(reduced)resume();}):null;
  if(ro)ro.observe(host);
  const onResize=()=>{if(reduced)resume();};
  if(!ro)window.addEventListener('resize',onResize);
  const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
    const seen=entries[0]?.isIntersecting??true;
    if(seen===visible)return;
    visible=seen;seen?resume():pause();
  },{threshold:0}):null;
  observer?.observe(host);
  canvas.dataset.motion='initializing';resume();
  return ()=>{
    disposed=true;cancel();ro?.disconnect();observer?.disconnect();
    if(!ro)window.removeEventListener('resize',onResize);
    host.removeEventListener('pointermove',pointerMove);host.removeEventListener('pointerleave',leave);
    document.removeEventListener('visibilitychange',visibility);
    query.removeEventListener?.('change',motion);
    canvas.removeEventListener('webglcontextlost',lostContext);canvas.removeEventListener('webglcontextrestored',restored);
    if(!lost)clearGpu();canvas.dataset.motion='disposed';
  };
}