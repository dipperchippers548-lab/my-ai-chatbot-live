// Style test: flat 2D cartoon characters in a painted, ink-lined 3D world - "Why Plane Windows Are Round".
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
const out = document.getElementById('out'); out.width = W; out.height = H; const og = out.getContext('2d');
const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const rng = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
// two-tone toon shading with a painted-paper texture
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255]); const t = new THREE.DataTexture(new Uint8Array([105, 105, 105, 255, 225, 225, 225, 255, 255, 255, 255, 255]), 3, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const paper = ctex(256, 256, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); const r = rng(7); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${r() * .022})`; const x = r() * 256, y = r() * 256; g.fillRect(x, y, 6 + r() * 26, 2 + r() * 3); } }); paper.wrapS = paper.wrapT = THREE.RepeatWrapping;
const toon = (c, rep = 1) => { const m = new THREE.MeshToonMaterial({ color: c, gradientMap: grad, map: paper }); m.map = paper.clone(); m.map.repeat.set(rep, rep); m.map.needsUpdate = true; return m; };
// screen-space ink outline (back-face hull pushed out by a constant number of pixels)
const inkMat = new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { px: { value: 3.2 }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: 'uniform float px; uniform vec2 res; void main(){ vec4 c = projectionMatrix * modelViewMatrix * vec4(position,1.); vec3 n = normalize(normalMatrix * normal); vec2 cn = (projectionMatrix * vec4(n,0.)).xy; float l = length(cn); if (l > 1e-5) cn /= l; c.xy += cn * px * 2. / res * c.w; gl_Position = c; }',
  fragmentShader: 'void main(){ gl_FragColor = vec4(.04,.04,.05,1.); }' });
const add = (parent, geo, m, x = 0, y = 0, z = 0, ink = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (ink) o.add(new THREE.Mesh(geo, inkMat)); parent.add(o); return o; };
const rb = (w, h, d, r = .06) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001));
// ---------- 2D character cards (bean heads, stick limbs, plum ink) ----------
const PLUM = '#241726';
function person(o) {
  const c = document.createElement('canvas'); c.width = 600; c.height = 1000; const g = c.getContext('2d'); g.lineJoin = g.lineCap = 'round';
  const hw = 230, hh = hw * .94, cx = 300, cy = 40 + hh / 2, LW = 9;
  const bean = () => { g.beginPath(); g.moveTo(cx, cy - hh / 2 - 8); g.bezierCurveTo(cx + hw * .42, cy - hh / 2 - 2, cx + hw / 2 + 4, cy - hh * .08, cx + hw * .44, cy + hh * .22); g.bezierCurveTo(cx + hw * .36, cy + hh * .46, cx + hw * .12, cy + hh / 2, cx, cy + hh / 2); g.bezierCurveTo(cx - hw * .12, cy + hh / 2, cx - hw * .36, cy + hh * .46, cx - hw * .44, cy + hh * .22); g.bezierCurveTo(cx - hw / 2 - 4, cy - hh * .08, cx - hw * .42, cy - hh / 2 - 2, cx, cy - hh / 2 - 8); g.closePath(); };
  const ink = (w = LW) => { g.strokeStyle = PLUM; g.lineWidth = w; g.stroke(); };
  const sh = cy + hh / 2 + 18, hip = 640, sole = 975, limb = hw * .055;
  // legs
  if (!o.seated) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 34, hip); g.lineTo(cx + s * 40, sole - 14); g.strokeStyle = PLUM; g.lineWidth = limb + 6; g.stroke(); g.strokeStyle = o.pants; g.lineWidth = limb; g.stroke(); g.beginPath(); g.ellipse(cx + s * 52, sole - 8, 30, 13, 0, 0, 7); g.fillStyle = '#2a2230'; g.fill(); }
  // arms
  const arm = (s, a, len = 250) => { const x0 = cx + s * 78, y0 = sh + 40, x1 = x0 + Math.sin(a) * len * s, y1 = y0 + Math.cos(a) * len; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = PLUM; g.lineWidth = limb + 6; g.stroke(); g.strokeStyle = o.top; g.lineWidth = limb; g.stroke(); g.beginPath(); g.arc(x1, y1, 15, 0, 7); g.fillStyle = PLUM; g.fill(); };
  // torso
  g.beginPath(); g.moveTo(cx - 70, sh); g.quadraticCurveTo(cx, sh - 14, cx + 70, sh); g.lineTo(cx + 86, hip); g.quadraticCurveTo(cx, hip + 14, cx - 86, hip); g.closePath(); g.fillStyle = o.top; g.fill(); ink();
  if (o.tie) { g.beginPath(); g.moveTo(cx - 12, sh + 4); g.lineTo(cx + 12, sh + 4); g.lineTo(cx + 18, sh + 150); g.lineTo(cx, sh + 172); g.lineTo(cx - 18, sh + 150); g.closePath(); g.fillStyle = o.tie; g.fill(); ink(5); }
  if (o.buttons) for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx + 30, sh + 40 + i * 60, 7, 0, 7); g.fillStyle = '#e8c33a'; g.fill(); }
  arm(-1, o.armL ?? .15); arm(1, o.armR ?? .15);
  // head
  bean(); g.fillStyle = '#ece8e2'; g.fill(); ink(10);
  if (o.hair) { g.save(); bean(); g.clip(); g.fillStyle = o.hair; if (o.style === 'side') { g.fillRect(cx - hw, cy - hh, hw * .38, hh * .9); g.fillRect(cx + hw * .62 - hw / 2, cy - hh, hw, hh * .9); } else { g.beginPath(); g.ellipse(cx, cy - hh * .52, hw * .62, hh * .36, 0, 0, 7); g.fill(); } g.restore(); bean(); ink(10); }
  if (o.cap) { g.beginPath(); g.moveTo(cx - hw * .5, cy - hh * .3); g.quadraticCurveTo(cx, cy - hh * .95, cx + hw * .5, cy - hh * .3); g.closePath(); g.fillStyle = o.cap; g.fill(); ink(8); g.fillStyle = '#e8c33a'; g.fillRect(cx - hw * .45, cy - hh * .36, hw * .9, 12); g.beginPath(); g.ellipse(cx + hw * .1, cy - hh * .28, hw * .38, 18, 0, 0, 7); g.fillStyle = '#16182a'; g.fill(); }
  // face (eyes .26 W apart, no blush, no highlights)
  const ey = cy + hh * .02, ex = hw * .13, e = o.face || 'neutral';
  if (e === 'blink') { g.strokeStyle = PLUM; g.lineWidth = 7; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * ex - 12, ey); g.lineTo(cx + s * ex + 12, ey); g.stroke(); } g.beginPath(); g.moveTo(cx - 20, cy + hh * .27); g.lineTo(cx + 20, cy + hh * .27); g.stroke(); }
  else if (e === 'shocked') { for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * ex, ey, 16, 0, 7); g.fillStyle = '#fff'; g.fill(); ink(5); g.beginPath(); g.arc(cx + s * ex, ey, 7, 0, 7); g.fillStyle = PLUM; g.fill(); } g.beginPath(); g.ellipse(cx, cy + hh * .27, 14, 18, 0, 0, 7); g.fillStyle = PLUM; g.fill(); }
  else { for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * ex, ey, 9, 0, 7); g.fillStyle = PLUM; g.fill(); }
    g.strokeStyle = PLUM; g.lineWidth = 7; g.beginPath();
    if (e === 'happy') g.arc(cx, cy + hh * .18, 30, .3, Math.PI - .3); else if (e === 'worried') { g.moveTo(cx - 24, cy + hh * .3); g.quadraticCurveTo(cx, cy + hh * .22, cx + 24, cy + hh * .3); g.moveTo(cx - ex - 20, ey - 30); g.lineTo(cx - ex + 14, ey - 40); g.moveTo(cx + ex + 20, ey - 30); g.lineTo(cx + ex - 14, ey - 40); } else { g.moveTo(cx - 20, cy + hh * .27); g.lineTo(cx + 20, cy + hh * .27); } g.stroke(); }
  if (o.glasses) { g.strokeStyle = PLUM; g.lineWidth = 6; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * ex, ey, 24, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(cx - ex + 24, ey); g.lineTo(cx + ex - 24, ey); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.8), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .4 })); m.geometry.translate(0, .9 - .045, 0);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.28, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .25 })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .01; const grp = new THREE.Group(); grp.add(m, shadow); grp.userData.card = m; return grp;
}
const face = (grp, cam) => { const m = grp.userData.card, p = new THREE.Vector3(); m.getWorldPosition(p); m.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z) - grp.rotation.y; };
// ---------- world ----------
const sky = ctex(16, 512, g => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#3e7fd2'); gr.addColorStop(1, '#b8d0ec'); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); });
function lights(scene) { scene.add(new THREE.AmbientLight(0xc8d4ff, .55)); const d = new THREE.DirectionalLight(0xfff2dc, 2.1); d.position.set(5, 8, 6); scene.add(d); }
function cloud(scene, x, y, z, s) { const g = new THREE.Group(), m = toon(0xffffff); for (const [dx, dy, r] of [[-1.2, 0, 1], [0, .45, 1.35], [1.3, 0, 1.05], [.4, -.2, .9]]) add(g, new THREE.SphereGeometry(r, 22, 16), m, dx, dy, 0); g.position.set(x, y, z); g.scale.set(s, s * .7, s); scene.add(g); }
function jet(square = true) {
  const g = new THREE.Group(), white = toon(0xe9ecf0), grey = toon(0x9aa2ac), blue = toon(0x2f5aa8);
  const body = add(g, new THREE.CapsuleGeometry(1, 13, 8, 24), white); body.rotation.z = Math.PI / 2;
  const fin = add(g, rb(2.4, 2.6, .25, .1), white, -7, 1.9, 0); fin.rotation.z = -.4;
  for (const s of [-1, 1]) { const w = add(g, rb(3, .22, 8, .1), white, .2, -.4, s * 4.6); w.rotation.y = s * .35; add(g, new THREE.CylinderGeometry(.42, .42, 1.6, 16), grey, 1.2, -.4, s * 1.8).rotation.z = Math.PI / 2; const ts = add(g, rb(1.2, .14, 3, .06), white, -7.2, .1, s * 1.6); ts.rotation.y = s * .3; }
  add(g, new THREE.BoxGeometry(14, .22, .02), blue, 0, -.15, 1.0, false);
  const winM = new THREE.MeshBasicMaterial({ color: 0x24324a }); for (let i = 0; i < 11; i++) { const geo = square ? new THREE.PlaneGeometry(.42, .42) : new THREE.CircleGeometry(.22, 20); const w = new THREE.Mesh(geo, winM); w.position.set(-5 + i * 1.0, .35, 1.0); g.add(w); }
  const cw = new THREE.Mesh(new THREE.PlaneGeometry(.9, .32), winM); cw.position.set(7.15, .45, .55); cw.rotation.y = .9; g.add(cw); return g;
}
function cabin(scene) {
  const g = new THREE.Group(), wall = toon(0xe6dfcf, 2), seat = toon(0x3f6ab8), floor = toon(0x8a5a4a, 4);
  add(g, new THREE.BoxGeometry(.1, 3, 20), wall, -1.9, 1.5, 0, false); add(g, new THREE.BoxGeometry(.1, 3, 20), wall, 1.9, 1.5, 0, false); add(g, new THREE.BoxGeometry(3.9, .1, 20), toon(0xf4efe4), 0, 2.6, 0, false); add(g, new THREE.BoxGeometry(.5, .3, 20), toon(0xd8d0c0), -1.6, 2.35, 0); add(g, new THREE.BoxGeometry(.5, .3, 20), toon(0xd8d0c0), 1.6, 2.35, 0);
  add(g, new THREE.BoxGeometry(3.6, .1, 20), floor, 0, -.05, 0, false); add(g, new THREE.BoxGeometry(.9, .02, 20), toon(0xb8403a), 0, .01, 0, false);
  for (let r = 0; r < 7; r++) for (const x of [-1.15, -.6, .6, 1.15]) { const z = 3 - r * 1.3; add(g, rb(.48, .45, .5, .06), seat, x, .32, z); add(g, rb(.48, .85, .14, .06), seat, x, .85, z + .28); add(g, rb(.36, .12, .1, .05), toon(0xf0ece4), x, 1.22, z + .3); }
  for (let r = 0; r < 8; r++) for (const s of [-1, 1]) { const z = 3.4 - r * 1.3, wg = new THREE.Group(); wg.position.set(s * 1.82, 1.25, z); wg.rotation.y = -s * Math.PI / 2; wg.rotation.x = 0; add(wg, new THREE.TorusGeometry(.2, .05, 10, 28), toon(0xf4f1ea), 0, 0, 0); const gl = new THREE.Mesh(new THREE.CircleGeometry(.2, 28), new THREE.MeshBasicMaterial({ color: 0xa8d4ff })); wg.add(gl); g.add(wg); }
  scene.add(g); return g;
}
// ---------- full short: settings ----------
const FPS = 30, DUR = 45.793;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const pop = x => x <= 0 ? 0 : Math.min(1, x / .08) * (1 + .3 * Math.exp(-x * 7) * Math.cos(x * 20));
const look = (cam, p, q) => { cam.position.set(...p); cam.lookAt(...q); };
const shake = (cam, t, a) => { cam.position.x += Math.sin(t * 91) * a; cam.position.y += Math.cos(t * 73) * a; };
const newCam = (fov = 50) => new THREE.PerspectiveCamera(fov, W / H, .05, 400);
// animated character card: redraws when the face or arms change, blinks on its own
function actor(o, scale = 1) {
  const g = new THREE.Group(), cache = {}; let key = '';
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.08 * scale, 1.8 * scale), new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .4 })); plane.geometry.translate(0, (.9 - .045) * scale, 0); g.add(plane);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(.28 * scale, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .22 })); sh.rotation.x = -Math.PI / 2; sh.position.y = .01; g.add(sh);
  const A = { g, plane, face: 'neutral', armL: .15, armR: .15, seed: Math.random() * 9,
    set(f, aL = .15, aR = .15) { A.face = f; A.armL = aL; A.armR = aR; },
    draw(t, cam) { const blink = A.face !== 'shocked' && ((t + A.seed) % 2.3) < .12; const k = (blink ? 'blink' : A.face) + '|' + A.armL.toFixed(2) + '|' + A.armR.toFixed(2);
      if (k !== key) { key = k; if (!cache[k]) cache[k] = person({ ...o, face: blink ? 'blink' : A.face, armL: A.armL, armR: A.armR }).userData.card.material.map; plane.material.map = cache[k]; plane.material.needsUpdate = true; }
      const p = new THREE.Vector3(); plane.getWorldPosition(p); plane.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z) - g.rotation.y; } };
  return A;
}
const ENGINEER = { top: '#f2f2f2', pants: '#3a3d4a', tie: '#c0403a', hair: '#5a4a3a', style: 'side', glasses: true };
const ENGINEER2 = { top: '#e8d8a8', pants: '#5a4a3a', tie: '#2f5aa8', hair: '#1a1410' };
const PASSENGER = { top: '#e8862a', pants: '#2f3a5a', hair: '#7a3a1a' };
const PASS2 = { top: '#5aa86a', pants: '#3a3d4a', hair: '#1a1410' };
const PILOT = { top: '#1f2c4f', pants: '#1a2038', cap: '#1f2c4f', buttons: true };
function hudSign(cam, text, bg = '#ffffff', fg = '#16120a', y = .62) {
  const t = ctex(512, 160, g => { g.fillStyle = '#0b0a0c'; g.beginPath(); g.roundRect(4, 4, 504, 152, 26); g.fill(); g.fillStyle = bg; g.beginPath(); g.roundRect(14, 14, 484, 132, 20); g.fill(); g.fillStyle = fg; let px = 84; do { g.font = '900 ' + px + 'px Nunito, sans-serif'; px -= 4; } while (g.measureText(text).width > 440); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 84); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .47), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false })); m.renderOrder = 999; m.position.set(0, y, -3); cam.add(m); return m;
}
const qmark = (parent) => { const t = ctex(128, 160, g => { g.font = '900 140px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 14; g.strokeStyle = '#0b0a0c'; g.strokeText('?', 64, 84); g.fillStyle = '#ffd23a'; g.fillText('?', 64, 84); }); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t })); s.scale.set(.32, .4, 1); parent.add(s); return s; };
// the jet, in two halves so it can come apart
function jet2(round = false) {
  const g = new THREE.Group(), front = new THREE.Group(), rear = new THREE.Group(); g.add(front, rear);
  const white = toon(0xe9ecf0), grey = toon(0x9aa2ac), blue = toon(0x2f5aa8), dark = new THREE.MeshBasicMaterial({ color: 0x24324a });
  const nose = add(front, new THREE.SphereGeometry(1, 24, 16), white, 3.2, 0, 0); nose.scale.set(2.2, 1, 1);
  add(front, new THREE.CylinderGeometry(1, 1, 6.4, 24), white, 0, 0, 0).rotation.z = Math.PI / 2;
  add(rear, new THREE.CylinderGeometry(1, .55, 7, 24), white, -6.7, .12, 0).rotation.z = Math.PI / 2;
  const fin = add(rear, rb(2.2, 2.6, .22, .1), white, -9.2, 1.7, 0); fin.rotation.z = -.5;
  for (const s of [-1, 1]) { const w = add(front, rb(3.2, .24, 8.5, .1), white, -1.2, -.35, s * 4.6); w.rotation.y = s * .4; add(front, new THREE.CylinderGeometry(.42, .42, 1.8, 16), grey, -.6, -.35, s * 1.55).rotation.z = Math.PI / 2; const ts = add(rear, rb(1.3, .16, 3.2, .06), white, -9.6, .25, s * 1.6); ts.rotation.y = s * .35; }
  add(front, new THREE.BoxGeometry(6.4, .2, .02), blue, 0, -.2, 1.0, false); add(rear, new THREE.BoxGeometry(6.6, .2, .02), blue, -6.5, -.12, .9, false);
  const win = (parent, x, z) => { const geo = round ? new THREE.CircleGeometry(.2, 20) : rb(.4, .36, .02, .05); const w = new THREE.Mesh(geo, dark); w.position.set(x, .3, z); parent.add(w); };
  for (let i = 0; i < 6; i++) win(front, -2.6 + i * 1.0, 1.01); for (let i = 0; i < 5; i++) win(rear, -4.0 - i * 1.0, .95 - i * .06);
  const cw = new THREE.Mesh(new THREE.PlaneGeometry(.9, .32), dark); cw.position.set(4.7, .5, .55); cw.rotation.y = 1.0; front.add(cw);
  const seam = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24), new THREE.MeshBasicMaterial({ color: 0x14121a, side: THREE.DoubleSide })); seam.rotation.y = Math.PI / 2; seam.position.x = -3.21; front.add(seam);
  const seam2 = seam.clone(); seam2.position.x = -3.19; rear.add(seam2);
  return { g, front, rear, split(k) { rear.position.set(-k * 3, -k * 2.2, 0); rear.rotation.z = -k * .8; front.position.set(k * .6, -k * .6, 0); front.rotation.z = k * .25; } };
}
function skyScene(top = '#3e7fd2', bot = '#b8d0ec') { const s = new THREE.Scene(); s.background = ctex(16, 512, g => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); }); lights(s); return s; }
function clouds(s, n = 8, seed = 3) { const r = rng(seed), cs = []; for (let i = 0; i < n; i++) { const g = new THREE.Group(), m = toon(0xffffff); for (const [dx, dy, rr] of [[-1.2, 0, 1], [0, .45, 1.35], [1.3, 0, 1.05], [.4, -.2, .9]]) add(g, new THREE.SphereGeometry(rr, 18, 12), m, dx, dy, 0); g.userData = { x: (r() - .5) * 60, y: (r() - .5) * 18, z: -10 - r() * 25, s: 1.5 + r() * 2 }; g.scale.set(g.userData.s, g.userData.s * .7, g.userData.s); s.add(g); cs.push(g); } return { flow(off) { cs.forEach(c => { const u = c.userData; c.position.set(((u.x + off) % 60 + 90) % 60 - 30, u.y, u.z); }); } }; }
function cabin2(s, round = true) {
  const g = new THREE.Group(), wall = toon(0xe6dfcf, 2), seat = toon(0x3f6ab8), floor = toon(0x8a5a4a, 4);
  add(g, new THREE.BoxGeometry(.1, 3, 20), wall, -1.9, 1.5, 0, false); add(g, new THREE.BoxGeometry(.1, 3, 20), wall, 1.9, 1.5, 0, false); add(g, new THREE.BoxGeometry(3.9, .1, 20), toon(0xf4efe4), 0, 2.6, 0, false);
  add(g, new THREE.BoxGeometry(.5, .3, 20), toon(0xd8d0c0), -1.6, 2.35, 0); add(g, new THREE.BoxGeometry(.5, .3, 20), toon(0xd8d0c0), 1.6, 2.35, 0);
  add(g, new THREE.BoxGeometry(3.6, .1, 20), floor, 0, -.05, 0, false); add(g, new THREE.BoxGeometry(.9, .02, 20), toon(0xb8403a), 0, .01, 0, false);
  for (let r = 0; r < 7; r++) for (const x of [-1.15, -.6, .6, 1.15]) { const z = 3 - r * 1.3; add(g, rb(.48, .45, .5, .06), seat, x, .32, z); add(g, rb(.48, .85, .14, .06), seat, x, .85, z + .28); }
  for (let r = 0; r < 8; r++) for (const sd of [-1, 1]) { const z = 3.4 - r * 1.3, wg = new THREE.Group(); wg.position.set(sd * 1.84, 1.3, z); wg.rotation.y = -sd * Math.PI / 2; if (round) { add(wg, new THREE.TorusGeometry(.22, .05, 10, 28), toon(0xf4f1ea)); wg.add(new THREE.Mesh(new THREE.CircleGeometry(.22, 28), new THREE.MeshBasicMaterial({ color: 0xa8d4ff }))); } else { add(wg, rb(.5, .5, .06, .05), toon(0xf4f1ea)); const gl = new THREE.Mesh(new THREE.PlaneGeometry(.4, .4), new THREE.MeshBasicMaterial({ color: 0xa8d4ff })); gl.position.z = .035; wg.add(gl); } g.add(wg); }
  s.add(g); return g;
}
function hangar(s) { const corr = ctex(64, 64, g => { g.fillStyle = '#8f98a4'; g.fillRect(0, 0, 64, 64); for (let x = 0; x < 64; x += 8) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, 0, 3, 64); } }); corr.wrapS = corr.wrapT = THREE.RepeatWrapping; corr.repeat.set(8, 2);
  add(s, new THREE.BoxGeometry(30, 12, .3), new THREE.MeshToonMaterial({ map: corr, gradientMap: grad }), 0, 6, -8, false); const fl = add(s, new THREE.PlaneGeometry(40, 30), toon(0x9a9488, 6), 0, 0, 0, false); fl.rotation.x = -Math.PI / 2;
  for (const x of [-6, 0, 6]) { const l = new THREE.Mesh(new THREE.BoxGeometry(2, .15, .6), new THREE.MeshBasicMaterial({ color: 0xfff6d0 })); l.position.set(x, 9, -3); s.add(l); } }
function tank(s) { const g = new THREE.Group(), frame = toon(0x5a5e6c);
  const water = new THREE.Mesh(new THREE.BoxGeometry(8, 3.4, 3.4), new THREE.MeshToonMaterial({ color: 0x4f9ae0, gradientMap: grad, transparent: true, opacity: .45, depthWrite: false })); water.position.y = 1.7; g.add(water);
  for (const [x, z] of [[-4, -1.7], [4, -1.7], [-4, 1.7], [4, 1.7]]) add(g, rb(.18, 3.6, .18, .05), frame, x, 1.8, z); for (const y of [0, 3.5]) for (const z of [-1.7, 1.7]) add(g, rb(8.2, .16, .16, .05), frame, 0, y, z);
  s.add(g); return { g, water }; }
function fuselageOnly() { const g = new THREE.Group(), white = toon(0xe9ecf0), dark = new THREE.MeshBasicMaterial({ color: 0x24324a }); add(g, new THREE.CapsuleGeometry(.95, 5.2, 8, 24), white).rotation.z = Math.PI / 2; for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(rb(.36, .32, .02, .04), dark); w.position.set(-2.4 + i * .95, .25, .96); g.add(w); } return g; }
function blueprint(mode) { return ctex(1024, 1024, g => { g.fillStyle = '#1f4f9a'; g.fillRect(0, 0, 1024, 1024); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; for (let x = 0; x < 1024; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(1024, x); g.stroke(); }
  g.lineWidth = 10; g.strokeStyle = '#ffffff'; if (mode === 'square') g.strokeRect(362, 362, 300, 300); else { g.beginPath(); g.arc(512, 512, 165, 0, 7); g.stroke(); }
  for (let k = 0; k < 7; k++) { const y = 260 + k * 84, off = y - 512, inside = Math.abs(off) < 160; g.lineWidth = 7;
    if (mode === 'square') { g.strokeStyle = (k === 1 || k === 5) ? '#ff4a3a' : '#ffffff'; g.beginPath(); g.moveTo(40, y); if (inside) { g.lineTo(340, y); g.moveTo(684, y); g.lineTo(984, y); } else { const cy = off < 0 ? 362 : 662; g.bezierCurveTo(250, y, 330, cy, 362, cy); g.moveTo(662, cy); g.bezierCurveTo(694, cy, 774, y, 984, y); } g.stroke(); }
    else { g.strokeStyle = '#7aff9a'; const bend = 512 + off * 1.25; g.beginPath(); g.moveTo(40, y); g.bezierCurveTo(250, y, 300, bend, 512, bend); g.bezierCurveTo(724, bend, 774, y, 984, y); g.stroke(); } }
  if (mode === 'square') for (const [x, y] of [[362, 362], [662, 362], [362, 662], [662, 662]]) { const rg = g.createRadialGradient(x, y, 0, x, y, 60); rg.addColorStop(0, 'rgba(255,70,50,.95)'); rg.addColorStop(1, 'rgba(255,70,50,0)'); g.fillStyle = rg; g.fillRect(x - 60, y - 60, 120, 120); } }); }
function room(s, col = 0xc8b89a) { add(s, rb(12, 7, .2, .05), toon(col, 3), 0, 3, -1.6); const fl = add(s, new THREE.PlaneGeometry(14, 10), toon(0x7a5a4a, 4), 0, 0, 2, false); fl.rotation.x = -Math.PI / 2; }

// ---------- shots (original-recording times) ----------
const shots = []; const shot = (t0, t1, build) => shots.push({ t0, t1, ...build() });
function sWindow(end) { return () => { const s = new THREE.Scene(); s.background = new THREE.Color(0xf4ead8); lights(s); cabin2(s, true); const p = actor(PASSENGER, 1.1); p.g.position.set(-1.25, 0, 1.7); s.add(p.g); const p2 = actor(PASS2, 1.1); p2.g.position.set(-1.2, 0, -.9); s.add(p2.g); const cam = newCam(56);
  return { s, cam, update(tl, d, t) { p.set(end ? 'happy' : (tl > 1.0 ? 'happy' : 'neutral'), end ? 2.5 + Math.sin(t * 8) * .2 : .15, end ? .15 : (tl > 1.0 ? 2.3 : .15)); p2.set('neutral'); look(cam, [.35 - tl * .05, 1.65, 3.9 - tl * .12], [-1.55, 1.35, .4]); p.draw(t, cam); p2.draw(t, cam); } }; }; }
shot(0, 2.95, sWindow(false));
// 2 square windows rip planes apart
shot(2.95, 6.87, () => { const s = skyScene(), J = jet2(false), C = clouds(s); J.g.rotation.y = -1.05; s.add(J.g); const cam = newCam(44);
  return { s, cam, update(tl, d, t) { C.flow(t * 4); const a = tl - 1.95; J.split(a > 0 ? ss(0, .9, a) : 0); look(cam, [6, 4, 34 - tl * .6], [-2.5, -.5, 0]); if (a > 0) shake(cam, t, .25 * Math.exp(-a * 3)); } }; });
// 3 the 1950s
shot(6.87, 9.21, () => { const s = skyScene('#5a9ae0', '#e8dcc0'), J = jet2(false); J.g.rotation.y = -.9; J.g.position.y = 2.1; s.add(J.g); const gr = add(s, new THREE.PlaneGeometry(200, 200), toon(0x8fb86a, 8), 0, 0, 0, false); gr.rotation.x = -Math.PI / 2; add(s, new THREE.BoxGeometry(8, .02, 120), toon(0x5a5e66), 0, .02, 0, false);
  const fans = [ENGINEER2, PASS2, PASSENGER].map((o, i) => { const a = actor(o, 1.1); a.g.position.set(-5.6 + i * 1.1, 0, 8.5 + (i % 2) * .5); s.add(a.g); return a; }); const cam = newCam(48); const sg = hudSign(cam, '1950s', '#ffd23a');
  return { s, cam, update(tl, d, t) { fans.forEach((f, i) => f.set('happy', i === 1 ? 2.6 + Math.sin(t * 9 + i) * .2 : .2, 2.5 + Math.sin(t * 8 + i) * .25)); sg.scale.setScalar(pop(tl - .1)); look(cam, [-6.5 + tl * .2, 2.0, 13], [-1, 2.2, 0]); fans.forEach(f => f.draw(t, cam)); } }; });
// 4 the de Havilland Comet, square-ish windows
shot(9.21, 12.6, () => { const s = skyScene(), J = jet2(false), C = clouds(s, 6, 9); s.add(J.g); const cam = newCam(46), sg = hudSign(cam, 'DE HAVILLAND COMET');
  return { s, cam, update(tl, d, t) { C.flow(t * 4); sg.scale.setScalar(pop(tl - .15)); const k = ss(1.4, 2.6, tl); J.g.rotation.y = lerp(-1.0, -.2, k); look(cam, [lerp(4, -1.0, k), lerp(2.5, .5, k), lerp(30, 4.2, k)], [lerp(-2.5, -1.1, k), lerp(0, .3, k), lerp(0, 1, k)]); } }; });
// 5 higher and faster
shot(12.6, 16.05, () => { const s = skyScene('#2f6fd0', '#a8d0f0'), J = jet2(false), C = clouds(s, 10, 5); s.add(J.g); const lines = [...Array(12)].map((_, i) => { const l = new THREE.Mesh(new THREE.BoxGeometry(3, .04, .04), new THREE.MeshBasicMaterial({ color: 0xffffff })); l.userData = i; s.add(l); return l; }); const cam = newCam(48);
  return { s, cam, update(tl, d, t) { C.flow(t * 14); J.g.rotation.y = -.9; J.g.rotation.z = .18; J.g.position.y = tl * .4; lines.forEach(l => { const i = l.userData, q = (t * 1.6 + i / 12) % 1; l.position.set(12 - q * 30, -2 + (i * 37 % 12) / 3, -2 + (i % 4)); }); look(cam, [7, 1 + tl * .4, 30], [-1.5, tl * .4, 0]); shake(cam, t, .03); } }; });
// 6 1954, broke apart in mid-air
shot(16.05, 19.93, () => { const s = skyScene('#4a5aa0', '#e8a888'), J = jet2(false), C = clouds(s, 7, 11); J.g.rotation.y = -1.0; s.add(J.g); const cam = newCam(46), sg = hudSign(cam, '1954', '#ffffff', '#c0303a');
  return { s, cam, update(tl, d, t) { C.flow(t * 4); sg.scale.setScalar(pop(tl - .4)); const a = tl - 2.1; J.split(a > 0 ? ss(0, 1.2, a) : 0); look(cam, [5, 3.5, 33 - tl * .5], [-2.5, -1, 0]); if (a > 0) shake(cam, t, .3 * Math.exp(-a * 3)); } }; });
// 7 nobody knew why
shot(19.93, 21.29, () => { const s = new THREE.Scene(); s.background = new THREE.Color(0xd8cdb8); lights(s); hangar(s); const F = fuselageOnly(); F.position.set(0, .9, -3.5); F.rotation.z = .12; s.add(F); const es = [ENGINEER, ENGINEER2, PILOT].map((o, i) => { const a = actor(o, 1.15); a.g.position.set(-1.5 + i * 1.5, 0, 1.2 - (i % 2) * .4); s.add(a.g); return a; }); const qs = es.map(e => qmark(s)); const cam = newCam(50);
  return { s, cam, update(tl, d, t) { es.forEach((e, i) => { e.set('worried', i === 1 ? 2.8 : .3, .3); }); qs.forEach((q, i) => { const k = pop(tl - .1 - i * .15); q.position.set(es[i].g.position.x, 2.45 + Math.sin(t * 3 + i) * .05, es[i].g.position.z); q.scale.set(.32 * k, .4 * k, 1); }); look(cam, [0, 2.0, 8.6 - tl * .2], [0, 1.5, -.5]); es.forEach(e => e.draw(t, cam)); } }; });
// 8 a giant water tank
shot(21.29, 25.43, () => { const s = new THREE.Scene(); s.background = new THREE.Color(0xd8cdb8); lights(s); hangar(s); const T = tank(s); T.g.position.set(0, 0, -1); const F = fuselageOnly(); s.add(F); const hook = add(s, rb(.2, 4, .2, .05), toon(0x5a5e6c), 0, 6, -1); const e = actor(ENGINEER, 1.15); e.g.position.set(3.2, 0, 2); s.add(e.g); const cam = newCam(50);
  return { s, cam, update(tl, d, t) { const k = ss(.6, 3.4, tl); F.position.set(0, lerp(6.5, 1.75, k), -1); hook.position.y = F.position.y + 3.0; T.water.position.y = 1.7 + (k > .9 ? Math.sin(t * 12) * .05 : 0); e.set(tl > 3.4 ? 'happy' : 'neutral', .2, 2.6); look(cam, [2.6, 4.2, 17 - tl * .3], [.8, 2.6, -1]); e.draw(t, cam); } }; });
// 9 pumped it up and down, thousands of flights
shot(25.43, 30.06, () => { const s = new THREE.Scene(); s.background = new THREE.Color(0xd8cdb8); lights(s); hangar(s); const T = tank(s); T.g.position.set(-.8, 0, -1); const F = fuselageOnly(); F.position.set(-.8, 1.75, -1); s.add(F);
  const pump = new THREE.Group(); add(pump, rb(.7, 1.0, .7, .08), toon(0xc0403a), 0, .5, 0); const lever = new THREE.Group(); lever.position.set(0, 1.0, 0); add(lever, rb(.1, .1, 1.6, .04), toon(0x5a5e6c), 0, 0, .7); pump.add(lever); pump.position.set(3.6, 0, .6); s.add(pump); const e = actor(ENGINEER2, 1.15); e.g.position.set(3.6, 0, 2.0); s.add(e.g);
  const cam = newCam(50), D = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 160; const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .47), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthTest: false })); m.renderOrder = 999; m.position.set(0, .62, -3); cam.add(m); return { g: c.getContext('2d'), tx }; })();
  return { s, cam, update(tl, d, t) { const r = 1 + .06 * Math.max(0, Math.sin(t * 7)); F.scale.set(1, r, r); lever.rotation.x = Math.sin(t * 7) * .5; e.set('happy', 2.2 + Math.sin(t * 7) * .3, 2.2 + Math.sin(t * 7) * .3);
    const n = Math.round(Math.pow(clamp(tl / 4.2), 1.6) * 3000); const g = D.g; g.clearRect(0, 0, 512, 160); g.fillStyle = '#0b0a0c'; g.beginPath(); g.roundRect(4, 4, 504, 152, 26); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(14, 14, 484, 132, 20); g.fill(); g.fillStyle = '#16120a'; g.font = '900 64px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FLIGHTS: ' + n.toLocaleString('en-US'), 256, 84); D.tx.needsUpdate = true;
    look(cam, [2.0, 3.6, 16 - tl * .2], [1.2, 2.0, -.5]); e.draw(t, cam); } }; });
// 10 until it split open
shot(30.06, 31.87, () => { const s = new THREE.Scene(); s.background = new THREE.Color(0xd8cdb8); lights(s); hangar(s); const T = tank(s); T.g.position.set(0, 0, -1); const F = fuselageOnly(); F.position.set(0, 1.75, -1); s.add(F); const crack = ctex(512, 256, g => { g.strokeStyle = '#0b0a0c'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); let x = 256, y = 0; g.moveTo(x, y); const r = rng(4); while (y < 256) { x += (r() - .5) * 60; y += 24; g.lineTo(x, y); } g.stroke(); }); const cm = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.9), new THREE.MeshBasicMaterial({ map: crack, transparent: true })); cm.position.set(.3, 1.75, -.02); s.add(cm);
  const bub = [...Array(16)].map((_, i) => { const b = add(s, new THREE.SphereGeometry(.08 + (i % 3) * .04, 10, 8), toon(0xd8f0ff), 0, 0, 0, false); b.userData = i; return b; }); const cam = newCam(48);
  return { s, cam, update(tl, d, t) { const a = tl - .45; cm.scale.set(1, a > 0 ? ss(0, .3, a) : .001, 1); bub.forEach(b => { const i = b.userData, q = ((a > 0 ? a : 0) * .8 + i / 16) % 1; b.visible = a > 0; b.position.set(.3 + Math.sin(i * 2.3) * .5, 1.75 + q * 1.8, -.2 + Math.cos(i) * .3); }); look(cam, [.6, 2.2, 7.2 - tl * .3], [.2, 1.8, -1]); if (a > 0) shake(cam, t, .12 * Math.exp(-a * 4)); } }; });
// 11 right at a corner
shot(31.87, 33.44, () => { const s = new THREE.Scene(); s.background = new THREE.Color(0xe6dfcf); lights(s); add(s, rb(6, 8, .3, .05), toon(0xe6dfcf, 3), 0, 1.6, -1);
  add(s, rb(1.5, .18, .2, .05), toon(0xf4f1ea), 0, 2.45, -.8); add(s, rb(1.5, .18, .2, .05), toon(0xf4f1ea), 0, 1.15, -.8); add(s, rb(.18, 1.48, .2, .05), toon(0xf4f1ea), -.66, 1.8, -.8); add(s, rb(.18, 1.48, .2, .05), toon(0xf4f1ea), .66, 1.8, -.8); const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.12), new THREE.MeshBasicMaterial({ color: 0x9ccaf4 })); gl.position.set(0, 1.8, -.84); s.add(gl);
  const ct = ctex(512, 512, g => { const r = rng(5); g.lineCap = 'round'; const [x, y] = [392, 120]; const rg = g.createRadialGradient(x, y, 0, x, y, 110); rg.addColorStop(0, 'rgba(255,60,40,.85)'); rg.addColorStop(1, 'rgba(255,60,40,0)'); g.fillStyle = rg; g.fillRect(x - 110, y - 110, 220, 220); for (let k = 0; k < 5; k++) { let px = x, py = y, a = -.8 + (r() - .5) * 1.6; g.beginPath(); g.moveTo(px, py); for (let i = 0; i < 7; i++) { px += Math.cos(a) * 18; py += Math.sin(a) * 18; a += (r() - .5) * .9; g.lineTo(px, py); } g.strokeStyle = '#120c10'; g.lineWidth = 6; g.stroke(); } });
  const cr = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: ct, transparent: true })); cr.position.set(0, 1.8, -.7); s.add(cr); const cam = newCam(46);
  return { s, cam, update(tl, d, t) { cr.material.opacity = ss(0, .3, tl); look(cam, [.3, 2.2, 3.4 - tl * .5], [.66, 2.45, -.8]); } }; });
// 12 like a balloon
shot(33.44, 37.42, () => { const s = new THREE.Scene(); s.background = new THREE.Color(0xd8cdb8); lights(s); room(s); const e = actor(ENGINEER, 1.2); e.g.position.set(-.9, 0, 0); s.add(e.g); const bl = add(s, new THREE.SphereGeometry(.5, 24, 18), toon(0xe84a5a), 0, 0, 0); const str = add(s, new THREE.CylinderGeometry(.01, .01, 1.2, 4), toon(0x333333), 0, 0, 0, false); const cam = newCam(50);
  return { s, cam, update(tl, d, t) { const k = .35 + ss(.3, 3.4, tl) * 1.0 + Math.sin(t * 9) * .02; bl.scale.set(k, k * 1.15, k); bl.position.set(.55, 1.6 + k * .55, .2); str.position.set(.45, 1.15, .2); e.set(tl > 2.6 ? 'shocked' : 'happy', .2, 2.0); look(cam, [0, 1.9, 5.2 - tl * .2], [0, 1.6, 0]); e.draw(t, cam); } }; });
// 13-14 the blueprint: stress piles up at corners / a curve spreads it out
function sBoard(mode) { return () => { const s = new THREE.Scene(); s.background = new THREE.Color(0xd8cdb8); lights(s); room(s); add(s, rb(3.0, 3.0, .1, .04), toon(0x6a4a2a), 0, 2.15, -1.3); const sc = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial({ map: blueprint(mode) })); sc.position.set(0, 2.15, -1.24); s.add(sc);
  const e = actor(ENGINEER, 1.2); e.g.position.set(1.3, 0, -.4); s.add(e.g); const cam = newCam(50);
  return { s, cam, update(tl, d, t) { e.set(mode === 'square' ? 'worried' : 'happy', .2, 2.6); look(cam, [0, 2.1, 4.9 - tl * .25], [.15, 1.95, -1]); e.draw(t, cam); } }; }; }
shot(37.42, 40.0, sBoard('square'));
shot(40.0, 42.1, sBoard('round'));
shot(42.1, DUR + .1, sWindow(true));

// ---------- captions: one word at a time, big white, mid-screen ----------
let words = [];
function drawCaption(t) { const w = words.find((w, i) => t >= w.s - .05 && t < (words[i + 1] ? words[i + 1].s - .05 : w.e + .4)); if (!w) return; const k = 1 + .1 * Math.exp(-(t - w.s) * 20);
  og.save(); og.translate(W / 2, H * .55); og.scale(k, k); og.font = '900 88px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.lineWidth = 16; og.strokeStyle = '#0b0a0c'; og.strokeText(w.w, 0, 0); og.fillStyle = '#ffffff'; og.fillText(w.w, 0, 0); og.restore(); }
function renderAt(t) { const S = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1], tl = t - S.t0; if (!S.cam.parent) S.s.add(S.cam); S.update(tl, S.t1 - S.t0, t); S.cam.updateMatrixWorld(); renderer.render(S.s, S.cam); og.drawImage(renderer.domElement, 0, 0); drawCaption(t); }
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .93); };
const cutInfo = await (await fetch('/build/cuts.json')).json();
const toOriginal = tc => { let t = tc * (cutInfo.speed || 1); for (const [a, b] of cutInfo.cuts) { if (t >= a) t += b - a; else break; } return Math.min(t, DUR - .001); };
window.renderFrame = i => window.renderTime(toOriginal((i + .5) / FPS)); window.frameCount = Math.round(cutInfo.duration * FPS);
words = await (await fetch('/build/words.json')).json(); await document.fonts.load('900 88px Nunito'); window.captionChunks = []; window.ready = true;
