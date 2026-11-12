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
  if (e === 'shocked') { for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * ex, ey, 16, 0, 7); g.fillStyle = '#fff'; g.fill(); ink(5); g.beginPath(); g.arc(cx + s * ex, ey, 7, 0, 7); g.fillStyle = PLUM; g.fill(); } g.beginPath(); g.ellipse(cx, cy + hh * .27, 14, 18, 0, 0, 7); g.fillStyle = PLUM; g.fill(); }
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
const ENGINEER = { top: '#f2f2f2', pants: '#3a3d4a', tie: '#c0403a', hair: '#5a4a3a', style: 'side', glasses: true };
const PASSENGER = { top: '#e8862a', pants: '#2f3a5a', hair: '#7a3a1a' };
const PILOT = { top: '#1f2c4f', pants: '#1a2038', cap: '#1f2c4f', buttons: true };
// ---------- shots ----------
function shotJet() { const s = new THREE.Scene(); s.background = sky; lights(s); const j = jet(true); j.rotation.y = -.75; j.rotation.z = .08; j.position.set(0, .5, 0); s.add(j); cloud(s, -6, -3, -8, 2.2); cloud(s, 7, -5, -14, 3); cloud(s, -3, 4, -20, 2.6); const cam = new THREE.PerspectiveCamera(42, W / H, .1, 300); cam.position.set(4, 3, 30); cam.lookAt(0, .4, 0); return { s, cam, cap: 'square' }; }
function shotCabin() { const s = new THREE.Scene(); s.background = new THREE.Color(0xf4ead8); lights(s); cabin(s); const p = person({ ...PASSENGER, face: 'happy', armL: 2.3 }); p.position.set(.9, 0, 1.7); s.add(p); const p2 = person({ top: '#5aa86a', pants: '#3a3d4a', hair: '#1a1410', face: 'neutral' }); p2.position.set(-.85, 0, .4); s.add(p2); const cam = new THREE.PerspectiveCamera(60, W / H, .05, 100); p.position.set(-1.15, 0, 1.6); p2.position.set(-1.15, 0, -1.0); cam.position.set(.45, 1.6, 4.6); cam.lookAt(-1.5, 1.2, -.5); face(p, cam); face(p2, cam); return { s, cam, cap: 'windows' }; }
function shotCrack() {
  const s = new THREE.Scene(); s.background = new THREE.Color(0xe6dfcf); lights(s); const wall = add(s, rb(6, 8, .3, .05), toon(0xe6dfcf, 3), 0, 1.6, -1);
  add(s, rb(1.5, .18, .2, .05), toon(0xf4f1ea), 0, 2.45, -.8); add(s, rb(1.5, .18, .2, .05), toon(0xf4f1ea), 0, 1.15, -.8); add(s, rb(.18, 1.48, .2, .05), toon(0xf4f1ea), -.66, 1.8, -.8); add(s, rb(.18, 1.48, .2, .05), toon(0xf4f1ea), .66, 1.8, -.8);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.12), new THREE.MeshBasicMaterial({ color: 0x9ccaf4 })); gl.position.set(0, 1.8, -.84); s.add(gl);
  const ct = ctex(512, 512, g => { const r = rng(5); g.lineCap = 'round'; for (const [x, y] of [[120, 120], [392, 392], [392, 120]]) { const rg = g.createRadialGradient(x, y, 0, x, y, 90); rg.addColorStop(0, 'rgba(255,60,40,.75)'); rg.addColorStop(1, 'rgba(255,60,40,0)'); g.fillStyle = rg; g.fillRect(x - 90, y - 90, 180, 180); for (let k = 0; k < 4; k++) { let px = x, py = y, a = Math.atan2(y - 256, x - 256) + (r() - .5) * 1.4; g.beginPath(); g.moveTo(px, py); for (let i = 0; i < 6; i++) { px += Math.cos(a) * 18; py += Math.sin(a) * 18; a += (r() - .5) * .9; g.lineTo(px, py); } g.strokeStyle = '#120c10'; g.lineWidth = 5; g.stroke(); } } });
  const cr = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: ct, transparent: true })); cr.position.set(0, 1.8, -.7); s.add(cr);
  const e = person({ ...ENGINEER, face: 'shocked', armL: 2.4 }); e.position.set(-.85, 0, .6); s.add(e); const cam = new THREE.PerspectiveCamera(50, W / H, .05, 100); cam.position.set(-.1, 1.6, 4.8); cam.lookAt(-.1, 1.5, 0); face(e, cam); return { s, cam, cap: 'corners' };
}
function shotBoard() {
  const s = new THREE.Scene(); s.background = new THREE.Color(0xd8cdb8); lights(s); add(s, rb(10, 6, .2, .05), toon(0xc8b89a, 3), 0, 2.5, -1.5); const fl = add(s, new THREE.PlaneGeometry(12, 8), toon(0x7a5a4a, 4), 0, 0, 1, false); fl.rotation.x = -Math.PI / 2;
  const bp = ctex(1024, 640, g => { g.fillStyle = '#1f4f9a'; g.fillRect(0, 0, 1024, 640); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; for (let x = 0; x < 1024; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 640); g.stroke(); } for (let y = 0; y < 640; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
    g.lineWidth = 8; g.strokeStyle = '#ffffff'; g.strokeRect(150, 190, 240, 240); g.beginPath(); g.arc(770, 310, 125, 0, 7); g.stroke();
    g.lineWidth = 5; for (let k = 0; k < 5; k++) { const y = 150 + k * 80; g.strokeStyle = (k === 0 || k === 4) ? '#ff5a4a' : '#ffffff'; g.beginPath(); g.moveTo(40, y); if (y < 190 || y > 430) { g.bezierCurveTo(140, y, 140, k === 0 ? 180 : 440, 150, k === 0 ? 190 : 430); g.moveTo(390, k === 0 ? 190 : 430); g.bezierCurveTo(400, y, 420, y, 500, y); } else { g.lineTo(140, y); g.moveTo(400, y); g.lineTo(500, y); } g.stroke(); g.strokeStyle = '#7aff9a'; g.beginPath(); g.moveTo(560, y); g.bezierCurveTo(640, y, 650, 310 + (y - 310) * 1.15, 770 + 0, 310 + (y - 310) * 1.15); g.bezierCurveTo(890, 310 + (y - 310) * 1.15, 900, y, 990, y); g.stroke(); }
    for (const [x, y] of [[150, 190], [390, 190], [150, 430], [390, 430]]) { g.fillStyle = 'rgba(255,90,74,.85)'; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); } });
  const b = add(s, rb(3.6, 2.3, .1, .04), toon(0x6a4a2a), 0, 2.2, -1.3); const sc = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.12), new THREE.MeshBasicMaterial({ map: bp })); sc.position.set(0, 2.2, -1.24); s.add(sc);
  const e = person({ ...ENGINEER, face: 'happy', armR: 2.6 }); e.position.set(1.15, 0, -.3); s.add(e); const pi = person({ ...PILOT, face: 'worried' }); pi.position.set(-1.25, 0, .2); s.add(pi);
  const cam = new THREE.PerspectiveCamera(52, W / H, .05, 100); cam.position.set(0, 1.9, 5.2); cam.lookAt(0, 1.7, 0); face(e, cam); face(pi, cam); return { s, cam, cap: 'round' };
}
const SH = [shotJet(), shotCabin(), shotCrack(), shotBoard()];
window.renderTime = i => { const S = SH[i]; renderer.render(S.s, S.cam); og.drawImage(renderer.domElement, 0, 0);
  og.font = '900 84px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.lineWidth = 16; og.strokeStyle = '#0b0a0c'; og.strokeText(S.cap, W / 2, H * .5); og.fillStyle = '#ffffff'; og.fillText(S.cap, W / 2, H * .5);
  return out.toDataURL('image/jpeg', .93); };
await document.fonts.load('900 84px Nunito'); window.ready = true;
