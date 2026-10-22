const VERTEX = `#version 300 es
precision highp float;
void main() {
  vec2 v = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform vec2 uPointer;
uniform float uTime;

float lineGlow(float d, float width) {
  return width / (abs(d) + width);
}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  p += uPointer * 0.06;
  float time = uTime;
  float r = length(p);
  float a = atan(p.y,p.x);
  vec3 base = vec3(0.032, 0.048, 0.097);
  base += 0.037 * exp(-3.4 * r) * vec3(0.26, 0.35, 0.80);
  float envelope = exp(-2.8 * r * r);
  float distortion = 0.042 * sin(5.0 * a + 7.0 * r + time * 0.35)
                   + 0.028 * cos(9.0 * a - 3.3 * r - time * 0.19);
  float offset = r + distortion;
  float ring1 = lineGlow(offset - 0.30, 0.0045);
  float ring2 = lineGlow(offset - 0.41, 0.006);
  float ring3 = lineGlow(offset - 0.53, 0.0032);
  float ring4 = lineGlow(offset - 0.64, 0.0031);
  float wires = pow(max(0.0, cos(38.0 * offset + 3.7 * a + time * 0.18)), 13.0);
  vec3 violet = vec3(0.52, 0.46, 0.94);
  vec3 blue = vec3(0.20, 0.65, 0.97);
  vec3 ice = vec3(0.78, 0.89, 1.00);
  vec3 color = base;
  float blob = exp(-9.5 * dot(p - vec2(0.05,0.02),p - vec2(0.05,0.02)));
  color += blob * vec3(0.075,0.09,0.18);
  color += envelope * (ring1 * 0.13 * violet + ring2 * 0.30 * blue + ring3 * 0.18 * ice + ring4 * 0.08 * violet);
  color += wires * envelope * vec3(0.11,0.13,0.32);
  float beam = pow(max(0.0,cos(a - 0.46 + time * 0.035)),13.0) * exp(-12.0 * pow(r - 0.41,2.0));
  color += beam * vec3(0.14,0.28,0.38);
  float core = exp(-55.0 * r * r);
  color += core * vec3(0.18,0.22,0.32);
  float speckle = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
  color += (speckle - 0.5) * 0.011;
  float fade = 1.0 - 0.34 * smoothstep(0.35,0.85,r);
  fragColor = vec4(clamp(color * fade, 0.0, 1.0), 1.0);
}`;

function shader(gl, type, source) {
  const handle = gl.createShader(type);
  gl.shaderSource(handle, source);
  gl.compileShader(handle);
  if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS)) {
    console.warn('Visual engine shader compile failed:', gl.getShaderInfoLog(handle));
    gl.deleteShader(handle);
    return null;
  }
  return handle;
}

export function startSculpture(canvas, host) {
  if (!canvas || !host) return () => {};
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let gl;
  try {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  } catch { return () => {}; }
  if (!gl) return () => {};

  const vertex = shader(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return () => {};
  }
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Visual engine program link failed:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return () => {};
  }

  const resLocation = gl.getUniformLocation(program, 'uRes');
  const pointerLocation = gl.getUniformLocation(program, 'uPointer');
  const timeLocation = gl.getUniformLocation(program, 'uTime');
  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);
  gl.useProgram(program);
  let active = true, visible = true, frame = 0, last = 0, start = performance.now(), quality = 1;
  let pointer = [0,0], target = [0,0], slowFrames = 0;
  const pointerMove = event => {
    const box = host.getBoundingClientRect();
    target = [(event.clientX - box.left) / Math.max(box.width, 1) * 2 - 1,
      1 - (event.clientY - box.top) / Math.max(box.height, 1) * 2];
  };
  const pointerLeave = () => { target = [0,0]; };
  const onVisibility = () => { if (!document.hidden && visible && active) schedule(); };
  const onContextLost = event => { event.preventDefault(); active = false; cancelAnimationFrame(frame); };
  host.addEventListener('pointermove', pointerMove, { passive: true });
  host.addEventListener('pointerleave', pointerLeave);
  canvas.addEventListener('webglcontextlost', onContextLost);
  document.addEventListener('visibilitychange', onVisibility);

  function sizeCanvas() {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.4) * quality;
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  function draw(now) {
    if (!active || document.hidden || !visible) return;
    if (!reduced && now - last < 32) { frame = requestAnimationFrame(draw); return; }
    const delta = now - last;
    last = now;
    if (delta > 56 && delta < 250) slowFrames++; else slowFrames = Math.max(0, slowFrames - 2);
    if (slowFrames > 18 && quality > 0.7) { quality = Math.max(0.7, quality * 0.83); slowFrames = 0; }
    sizeCanvas();
    pointer[0] += (target[0] - pointer[0]) * 0.055;
    pointer[1] += (target[1] - pointer[1]) * 0.055;
    gl.uniform2f(resLocation, canvas.width, canvas.height);
    gl.uniform2f(pointerLocation, pointer[0], pointer[1]);
    gl.uniform1f(timeLocation, reduced ? 0 : (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.classList.add('scene-ready');
    if (!reduced) frame = requestAnimationFrame(draw);
  }
  function schedule() { if (frame) cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); }
  const resize = new ResizeObserver(() => { if (reduced) schedule(); });
  resize.observe(host);
  const intersection = new IntersectionObserver(entries => {
    const wasVisible = visible;
    visible = entries[0]?.isIntersecting ?? false;
    if (visible && !wasVisible) schedule();
    if (!visible) cancelAnimationFrame(frame);
  }, { threshold: 0 });
  intersection.observe(host);
  schedule();

  return () => {
    active = false;
    cancelAnimationFrame(frame);
    resize.disconnect();
    intersection.disconnect();
    host.removeEventListener('pointermove', pointerMove);
    host.removeEventListener('pointerleave', pointerLeave);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    document.removeEventListener('visibilitychange', onVisibility);
    gl.bindVertexArray(null);
    gl.deleteVertexArray(vertexArray);
    gl.deleteProgram(program);
  };
}