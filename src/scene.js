// Native WebGL2 sculptural ribbon; one visibility-aware animation clock.
const TAU=Math.PI*2;
const VS=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUV;
uniform vec2 uTilt;
uniform float uTime;
uniform float uAspect;
uniform float uLayer;
out vec3 vNormal;
out vec3 vView;
out vec2 vUV;
mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
void main(){
  mat3 rotation=ry(.33+uTime*.14+uTilt.x*.38)*rx(-.36+sin(uTime*.19)*.12-uTilt.y*.27)*rz(-.25+sin(uTime*.10)*.13);
  vec3 local=aPos+aNormal*(.009*sin(aUV.x*25.1327-uTime*.68+uLayer*1.8)*( .35+.65*cos(aUV.y*1.5708)));
  vec3 pos=rotation*local;
  vec3 eye=vec3(0.,0.,3.50);
  float depth=eye.z-pos.z;
  gl_Position=vec4(pos.x*2.40/uAspect,pos.y*2.40,(depth-1.3)*.85,depth);
  vNormal=rotation*aNormal;
  vView=eye-pos;
  vUV=aUV;
}`;
const FS=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vView;
in vec2 vUV;
uniform float uLayer;
uniform float uEdge;
out vec4 color;
void main(){
  vec3 view=normalize(vView),n=normalize(vNormal);
  if(!gl_FrontFacing)n=-n;
  vec3 key=normalize(vec3(-.55,.92,1.25));
  vec3 fill=normalize(vec3(.90,-.38,.45));
  float ndv=max(0.,dot(n,view));
  float lit=max(0.,dot(n,key));
  float bounce=max(0.,dot(n,fill));
  float rim=pow(1.-ndv,2.1);
  float narrow=pow(max(0.,dot(n,normalize(key+view))),93.);
  float wide=pow(max(0.,dot(n,normalize(fill+view))),20.);
  float brushed=.5+.5*sin(vUV.x*21.0+vUV.y*2.25);
  vec3 deep=vec3(.025,.045,.125);
  vec3 plum=vec3(.19,.15,.46);
  vec3 pearl=vec3(.56,.65,.92);
  vec3 cyan=vec3(.26,.73,1.);
  vec3 base=mix(deep,mix(plum,pearl,brushed*.63),.54+.24*lit);
  vec3 film=mix(vec3(.39,.30,.94),cyan,.5+.5*sin(rim*9.+vUV.x*4.2));
  vec3 metal=base*(.38+.64*lit+.23*bounce);
  metal+=film*rim*.78;
  metal+=pearl*narrow*.77;
  metal+=cyan*wide*.19;
  float engraved=pow(.5+.5*cos(vUV.y*25.1327),34.);
  metal+=engraved*(.025+.035*rim)*pearl;
  if(uLayer>.5){
    metal=mix(metal,vec3(.20,.41,.66),.19);
    metal+=cyan*rim*.21;
  }
  if(uEdge>.5)metal=mix(metal,vec3(.76,.85,1.),.78);
  metal=vec3(1.)-exp(-metal*1.17);
  color=vec4(pow(max(metal,vec3(0.)),vec3(.88)),uEdge>.5?.76:1.);
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
function surface(a,v,b){
  const r=b.radius+.028*Math.sin(a*3+b.phase);
  const twist=a*b.twists+b.phase+.10*Math.sin(a*2+b.phase);
  const x=Math.cos(twist)*v*b.width*(1+.045*Math.cos(a*3));
  return [Math.cos(a)*(r+x),Math.sin(a)*(r+x),b.depth*Math.sin(a*2+b.phase)+Math.sin(twist)*v*b.width];
}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function diff(a,b){return a.map((v,i)=>v-b[i]);}
function normal(a,v,b){
  const x=diff(surface(a+.0007,v,b),surface(a-.0007,v,b));
  const y=diff(surface(a,v+.002,b),surface(a,v-.002,b));
  const n=cross(x,y),l=Math.hypot(...n)||1;
  return n.map(v=>v/l);
}
function meshFor(gl,b){
  const rings=288,steps=30,stride=steps+1;
  const vertex=new Float32Array((rings+1)*stride*8);
  let at=0;
  for(let i=0;i<=rings;i++){
    const u=i/rings,angle=TAU*u;
    for(let j=0;j<=steps;j++){
      const v=2*j/steps-1;
      vertex.set([...surface(angle,v,b),...normal(angle,v,b),u,v],at);
      at+=8;
    }
  }
  const faces=new Uint16Array(rings*steps*6),edges=new Uint16Array(rings*4);
  let a=0,e=0;
  for(let i=0;i<rings;i++){
    for(let j=0;j<steps;j++){
      const x=i*stride+j,y=x+stride;
      faces.set([x,y,x+1,y,y+1,x+1],a);a+=6;
    }
    const x=i*stride,y=(i+1)*stride;
    edges.set([x,y,x+steps,y+steps],e);e+=4;
  }
  const vao=gl.createVertexArray(),vbo=gl.createBuffer(),faceBuffer=gl.createBuffer(),edgeBuffer=gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,vertex,gl.STATIC_DRAW);
  for(let i=0;i<3;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,i===2?2:3,gl.FLOAT,false,32,(i===0?0:i===1?12:24));}
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,faceBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,faces,gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,edgeBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,edges,gl.STATIC_DRAW);
  return {vao,vbo,faceBuffer,edgeBuffer,faces:faces.length,edges:edges.length};
}
function release(gl,m){
  gl.deleteVertexArray(m.vao);gl.deleteBuffer(m.vbo);gl.deleteBuffer(m.faceBuffer);gl.deleteBuffer(m.edgeBuffer);
}
export function startSculpture(canvas,host){
  if(!canvas||!host)return ()=>{};
  let gl;
  try{gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:false,powerPreference:'low-power'});}catch{}
  if(!gl){canvas.dataset.motion='unavailable';return ()=>{};}
  const query=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer:coarse)');
  let reduced=query.matches,visible=true,lost=false,disposed=false,raf=0,elapsed=1.7,lastFrame=0,lastDraw=0,quality=1,slow=0,fast=0;
  const pointer={x:0,y:0,tx:0,ty:0};
  let program,meshes=[],uni;
  function clearGpu(){for(const m of meshes)release(gl,m);meshes=[];if(program)gl.deleteProgram(program);program=null;}
  function initialize(){
    program=programFor(gl);
    if(!program)return false;
    try{meshes=[
      meshFor(gl,{radius:.79,width:.185,twists:1,phase:.35,depth:.15}),
      meshFor(gl,{radius:.83,width:.078,twists:2,phase:2.35,depth:.23})
    ];}catch(e){console.warn('Sculpture mesh:',e);clearGpu();return false;}
    gl.useProgram(program);
    uni=Object.fromEntries(['tilt','time','aspect','layer','edge'].map(x=>[x,gl.getUniformLocation(program,'u'+x[0].toUpperCase()+x.slice(1))]));
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
    for(let i=0;i<meshes.length;i++){
      const m=meshes[i];gl.bindVertexArray(m.vao);gl.uniform1f(uni.layer,i);
      gl.uniform1f(uni.edge,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.faceBuffer);gl.drawElements(gl.TRIANGLES,m.faces,gl.UNSIGNED_SHORT,0);
      gl.uniform1f(uni.edge,1);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.edgeBuffer);gl.drawElements(gl.LINES,m.edges,gl.UNSIGNED_SHORT,0);
    }
    gl.bindVertexArray(null);canvas.classList.add('scene-ready');
  }
  function frame(now){
    raf=0;if(!allowed())return;
    const interval=1000/(coarse.matches?30:60);
    if(lastDraw&&now-lastDraw<interval-2&&!reduced){schedule();return;}
    const dt=lastDraw?Math.min(now-lastDraw,64):16.7;lastDraw=now;lastFrame=now;
    const damping=1-Math.exp(-dt*.008);
    pointer.x+=(pointer.tx-pointer.x)*damping;pointer.y+=(pointer.ty-pointer.y)*damping;
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
    lost=false;meshes=[];program=null;
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