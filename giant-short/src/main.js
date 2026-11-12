// "Our Town Is Built On A Sleeping Giant" - bright blocky-avatar style, rendered frame by frame.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const W = 1080, H = 1920, RW = 540, RH = 960, FPS = 30, DUR = 35.675;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const pop = x => x <= 0 ? 0 : Math.min(1, x / .08) * (1 + .3 * Math.exp(-x * 7) * Math.cos(x * 20));
const punch = (tl, k = .15) => 1 + k * Math.exp(-tl * 9);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(RW, RH, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
const out = document.getElementById('out'); out.width = W; out.height = H; const og = out.getContext('2d');
const rb = (w, h, d, r = .14) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001));
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .62, metalness: 0, ...o });
const mesh = (g, m, x = 0, y = 0, z = 0, sh = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; return o; };
const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const dtex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { g: c.getContext('2d'), t }; };
// cartoon faces
function faceTex(e) {
  return ctex(256, 256, (g) => {
    g.lineCap = 'round'; g.lineJoin = 'round'; const ink = '#1d1a24';
    const blush = () => { g.fillStyle = 'rgba(255,120,140,.45)'; for (const x of [70, 186]) { g.beginPath(); g.ellipse(x, 160, 22, 13, 0, 0, 7); g.fill(); } };
    const eye = (x, y, rx, ry) => { g.fillStyle = ink; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - rx * .35, y - ry * .4, rx * .38, ry * .3, 0, 0, 7); g.fill(); };
    if (e === 'happy') { eye(92, 112, 13, 19); eye(164, 112, 13, 19); g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); g.arc(128, 150, 34, .25, Math.PI - .25); g.stroke(); blush(); }
    if (e === 'grin') { eye(92, 108, 13, 19); eye(164, 108, 13, 19); g.fillStyle = ink; g.beginPath(); g.moveTo(84, 152); g.quadraticCurveTo(128, 214, 172, 152); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.fillRect(96, 152, 64, 10); g.fillStyle = '#ff6f8a'; g.beginPath(); g.ellipse(128, 186, 20, 9, 0, 0, 7); g.fill(); blush(); }
    if (e === 'shocked') { for (const x of [92, 164]) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, 108, 24, 28, 0, 0, 7); g.fill(); g.strokeStyle = ink; g.lineWidth = 6; g.stroke(); eye(x, 112, 9, 11); } g.fillStyle = ink; g.beginPath(); g.ellipse(128, 176, 18, 24, 0, 0, 7); g.fill(); }
    if (e === 'sad') { eye(92, 116, 12, 16); eye(164, 116, 12, 16); g.strokeStyle = ink; g.lineWidth = 8; g.beginPath(); g.moveTo(70, 82); g.lineTo(108, 92); g.moveTo(186, 82); g.lineTo(148, 92); g.stroke(); g.beginPath(); g.arc(128, 196, 30, Math.PI + .5, -.5); g.stroke(); g.fillStyle = '#7ec8ff'; g.beginPath(); g.ellipse(84, 150, 9, 15, 0, 0, 7); g.fill(); }
    if (e === 'shh') { eye(92, 112, 13, 19); eye(164, 112, 13, 19); g.strokeStyle = ink; g.lineWidth = 8; g.beginPath(); g.moveTo(108, 168); g.lineTo(148, 168); g.stroke(); blush(); }
    if (e === 'snore') { g.strokeStyle = ink; g.lineWidth = 9; for (const x of [92, 164]) { g.beginPath(); g.arc(x, 100, 20, .3, Math.PI - .3); g.stroke(); } g.fillStyle = ink; g.beginPath(); g.ellipse(128, 176, 30, 36, 0, 0, 7); g.fill(); g.fillStyle = '#ff6f8a'; g.beginPath(); g.ellipse(128, 196, 18, 12, 0, 0, 7); g.fill(); blush(); }
    if (e === 'oneEye') { g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); g.arc(92, 104, 20, .3, Math.PI - .3); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(164, 104, 30, 34, 0, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); eye(164, 108, 13, 15); g.lineWidth = 8; g.beginPath(); g.moveTo(108, 172); g.lineTo(148, 172); g.stroke(); }
    if (e === 'smug') { g.strokeStyle = ink; g.lineWidth = 9; for (const x of [92, 164]) { g.beginPath(); g.arc(x, 104, 20, .3, Math.PI - .3); g.stroke(); } g.beginPath(); g.arc(128, 150, 32, .25, Math.PI - .25); g.stroke(); blush(); }
    if (e === 'sneeze') { g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); g.moveTo(74, 96); g.lineTo(108, 110); g.lineTo(74, 124); g.moveTo(182, 96); g.lineTo(148, 110); g.lineTo(182, 124); g.stroke(); g.fillStyle = ink; g.beginPath(); g.ellipse(128, 176, 28, 30, 0, 0, 7); g.fill(); blush(); }
    if (e === 'annoyed') { eye(92, 116, 13, 10); eye(164, 116, 13, 10); g.strokeStyle = ink; g.lineWidth = 8; g.beginPath(); g.moveTo(72, 96); g.lineTo(110, 102); g.moveTo(184, 96); g.lineTo(146, 102); g.stroke(); g.beginPath(); g.moveTo(104, 174); g.lineTo(152, 168); g.stroke(); }
    if (e === 'sleep') { g.strokeStyle = ink; g.lineWidth = 9; for (const x of [92, 164]) { g.beginPath(); g.arc(x, 104, 20, .3, Math.PI - .3); g.stroke(); } g.fillStyle = ink; g.beginPath(); g.ellipse(128, 168, 14, 18, 0, 0, 7); g.fill(); blush(); }
  });
}
const FACES = {}; for (const e of ['happy', 'grin', 'shocked', 'sad', 'shh', 'sleep', 'snore', 'oneEye', 'smug', 'sneeze', 'annoyed']) FACES[e] = faceTex(e);
// a blocky avatar (about 5 units tall before scaling)
function avatar(o) {
  const root = new THREE.Group(), skin = mat(o.skin), top = mat(o.top), bottom = mat(o.pants), hair = mat(o.hair);
  const legs = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .5, 2, 0); p.add(mesh(rb(.98, 2, 1, .12), bottom, 0, -1, 0)); if (o.shoes) p.add(mesh(rb(1, .45, 1.08, .12), mat(o.shoes), 0, -1.8, .02)); root.add(p); return p; });
  const torso = mesh(rb(2, 2, 1, .16), top, 0, 3, 0); root.add(torso); if (o.stripe) torso.add(mesh(rb(2.02, .3, 1.02, .08), mat(o.stripe), 0, .2, 0));
  const arms = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * 1.5, 3.85, 0); p.add(mesh(rb(.95, 2, .95, .14), o.sleeves === false ? skin : top, 0, -.85, 0)); p.add(mesh(rb(.9, .55, .9, .14), skin, 0, -1.65, 0)); root.add(p); return p; });
  const head = new THREE.Group(); head.position.set(0, 4.6, 0); root.add(head); head.add(mesh(rb(1.3, 1.25, 1.2, .3), skin));
  const fm = new THREE.MeshStandardMaterial({ map: FACES[o.face || 'happy'], transparent: true, roughness: .8 }), face = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), fm); face.position.set(0, -.02, .605); head.add(face);
  if (o.style === 'spiky') { for (let i = 0; i < 7; i++) { const b = mesh(rb(.42, .55 + (i % 3) * .1, .42, .12), hair, -.55 + i * .18, .72, -.05 + (i % 2) * .2); b.rotation.z = (i - 3) * .12; head.add(b); } head.add(mesh(rb(1.42, .35, 1.3, .14), hair, 0, .55, -.05)); }
  if (o.style === 'long') { head.add(mesh(rb(1.46, .42, 1.34, .16), hair, 0, .58, -.02)); head.add(mesh(rb(1.46, 1.5, .4, .14), hair, 0, -.1, -.52)); for (const s of [-1, 1]) head.add(mesh(rb(.3, 1.4, .9, .12), hair, s * .7, -.05, -.18)); }
  if (o.style === 'bun') { head.add(mesh(rb(1.44, .4, 1.32, .16), hair, 0, .56, -.02)); head.add(mesh(new THREE.SphereGeometry(.42, 16, 12), hair, 0, .82, -.45)); }
  if (o.glasses) { const gm = mat(0x1d1a24); for (const s of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(.17, .035, 6, 16), gm, s * .27, .06, .62); head.add(r); } head.add(mesh(rb(.2, .04, .04, .01), gm, 0, .08, .62)); }
  if (o.style === 'cap') { head.add(mesh(rb(1.42, .45, 1.32, .18), mat(o.capColor), 0, .58, -.02)); head.add(mesh(rb(1.0, .1, .7, .05), mat(o.capColor), 0, .38, .8)); }
  root.scale.setScalar(o.s || .3);
  const A = { root, head, arms, legs, face: fm, set(e) { fm.map = FACES[e]; }, reset() { for (const o of [head, ...arms, ...legs]) o.rotation.set(0, 0, 0); } };
  return A;
}
const PEOPLE = [
  { skin: 0xf6c9a0, top: 0xff6b6b, pants: 0x3b5ba5, hair: 0x5a3622, style: 'spiky', shoes: 0xffffff },
  { skin: 0x9a6a48, top: 0x5ed39a, pants: 0x2f3a4a, hair: 0x1d1a24, style: 'long', shoes: 0xffd45e },
  { skin: 0xffd9b8, top: 0xffd45e, pants: 0x7f6ad8, hair: 0xd97a3a, style: 'cap', capColor: 0x4aa8ff, shoes: 0xffffff, stripe: 0xffffff },
  { skin: 0xc98d68, top: 0x7ec8ff, pants: 0x3b5ba5, hair: 0x3a2a1a, style: 'spiky', shoes: 0xff6b6b },
];
// the world
const skyTex = ctex(16, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#5ab0ff'); gr.addColorStop(.6, '#a8dcff'); gr.addColorStop(1, '#fff0d8'); g.fillStyle = gr; g.fillRect(0, 0, 16, 256); });
function lightsFor(scene, target = new THREE.Vector3()) {
  scene.add(new THREE.HemisphereLight(0xdff3ff, 0x8fc77a, 1.3)); const sun = new THREE.DirectionalLight(0xfff2dd, 2.3); sun.position.set(target.x + 14, target.y + 26, target.z + 16); sun.target.position.copy(target); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const c = sun.shadow.camera; c.left = c.bottom = -22; c.right = c.top = 22; c.near = 1; c.far = 90; sun.shadow.bias = -.0005; sun.shadow.radius = 4;
}
function cloud(scene, x, y, z, s) { const g = new THREE.Group(), m = mat(0xffffff, { roughness: .9 }); for (const [dx, dy, r] of [[-1.2, 0, 1], [0, .4, 1.35], [1.3, 0, 1.05], [.4, -.2, .9]]) g.add(mesh(new THREE.SphereGeometry(r, 20, 14), m, dx, dy, 0, false)); g.position.set(x, y, z); g.scale.setScalar(s); scene.add(g); return g; }
function house(c, roofC) { const g = new THREE.Group(); g.add(mesh(rb(2.2, 1.8, 2, .12), mat(c), 0, .9, 0)); const roof = mesh(new THREE.CylinderGeometry(1.45, 1.45, 2.3, 3), mat(roofC), 0, 2.15, 0); roof.rotation.set(0, 0, Math.PI / 2); roof.rotation.y = Math.PI / 2; roof.scale.set(.62, 1, .55); roof.position.y = 2.05; g.add(roof); g.add(mesh(rb(.55, .9, .1, .05), mat(0x7a4a2a), 0, .45, 1.01)); for (const x of [-.6, .6]) g.add(mesh(rb(.42, .42, .1, .05), mat(0xbfe9ff, { emissive: 0x335577, emissiveIntensity: .2 }), x, 1.15, 1.01)); return g; }
function tree(s = 1) { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.18, .24, 1.2, 10), mat(0x8a5a3a), 0, .6, 0)); g.add(mesh(new THREE.SphereGeometry(.85, 18, 14), mat(0x6fd36a), 0, 1.6, 0)); g.scale.setScalar(s); return g; }
function zLetter(scene) { const t = ctex(128, 128, g => { g.fillStyle = '#ffffff'; g.strokeStyle = '#5a6ad8'; g.lineWidth = 10; g.font = '900 104px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('Z', 64, 70); g.fillText('Z', 64, 70); }); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t })); scene.add(s); return s; }
// the giant: lying on his back, the town on his belly
function giant(scene) {
  const g = new THREE.Group(), shirt = mat(0x7ec8ff), skin = mat(0xf6c9a0), pants = mat(0x5a6ad8);
  g.add(mesh(rb(16, 7, 13, 2.2), shirt, 0, 3.5, 0)); g.add(mesh(rb(16.2, 1.6, 13.2, .6), mat(0xffffff), 0, 3.6, 0));
  for (const s of [-1, 1]) { g.add(mesh(rb(6.6, 6, 12, 1.6), pants, s * 4.1, 3.0, 12)); g.add(mesh(rb(6.8, 4.2, 3.6, 1.2), mat(0xff6b6b), s * 4.1, 4.0, 19.2)); }
  for (const s of [-1, 1]) { const a = mesh(rb(6, 5.6, 12.5, 1.6), shirt, s * 11.2, 2.8, -.5); g.add(a); g.add(mesh(rb(5.6, 5.2, 4, 1.5), skin, s * 11.2, 2.8, -8.6)); }
  const head = new THREE.Group(); head.position.set(0, 4.6, -12); g.add(head); head.add(mesh(rb(11, 9.6, 9.6, 2.6), skin, 0, 0, 0)); head.add(mesh(rb(11.4, 3.4, 10, 1.6), mat(0x5a3622), 0, -3.6, -1.2));
  const fc = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({ map: FACES.sleep, transparent: true, roughness: .8 })); fc.position.set(0, 4.81, .3); fc.rotation.set(-Math.PI / 2, 0, Math.PI); head.add(fc);
  scene.add(g); return { g, head };
}
function townOnBelly(parent) {
  const top = 7.0, cols = [[0xfff2d8, 0xff6b6b], [0xffd9e8, 0x5a6ad8], [0xd8f7ff, 0xff9a3a], [0xfff7b0, 0x5ed39a], [0xffe0c8, 0xb05ad8]], hs = [];
  [[-4.6, -3.6], [-1.2, -4.2], [2.6, -3.4], [5.2, -1.0], [-5.0, .9], [-1.6, 1.2], [1.8, 1.6], [5.0, 3.0], [-3.4, 3.8]].forEach(([x, z], i) => { const h = house(...cols[i % 5]); h.position.set(x, top, z); h.rotation.y = (i % 3 - 1) * .3; h.scale.setScalar(.85); parent.add(h); hs.push(h); });
  [[0, -1.2], [3.6, .4], [-3.2, -1.0], [.3, 4.4]].forEach(([x, z], i) => { const t = tree(.85 + (i % 2) * .2); t.position.set(x, top, z); parent.add(t); });
  const road = mesh(new THREE.PlaneGeometry(1.2, 11), mat(0xf2e3c0), .3, top + .02, 0, false); road.rotation.x = -Math.PI / 2; road.rotation.z = .25; parent.add(road);
  return hs;
}
function ground(scene) { const gr = mesh(new THREE.PlaneGeometry(400, 400), mat(0x8fdc7a), 0, 0, 0, false); gr.rotation.x = -Math.PI / 2; scene.add(gr); for (const [x, z, r, c] of [[-40, -60, 26, 0x7fd06c], [35, -70, 30, 0x74c862], [0, -95, 34, 0x6cbf5c]]) { const h = mesh(new THREE.SphereGeometry(r, 32, 16), mat(c), x, -r * .55, z, false); scene.add(h); } }
// ---------- giant short: extra models ----------
const nightTex = ctex(16, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#0b1240'); gr.addColorStop(.7, '#2a3a8a'); gr.addColorStop(1, '#5a5aa8'); g.fillStyle = gr; g.fillRect(0, 0, 16, 256); g.fillStyle = '#fff'; for (let i = 0; i < 26; i++) g.fillRect((i * 7) % 16, (i * 37) % 150, 1, 1); });
const dawnTex = ctex(16, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#6a8ae8'); gr.addColorStop(.55, '#ffb08a'); gr.addColorStop(1, '#ffe0a0'); g.fillStyle = gr; g.fillRect(0, 0, 16, 256); });
const WINM = [];
function house2(c, roofC, sign) {
  const g = new THREE.Group(); g.add(mesh(rb(2.2, 1.8, 2, .12), mat(c), 0, .9, 0)); const roof = mesh(new THREE.CylinderGeometry(1.45, 1.45, 2.3, 3), mat(roofC), 0, 2.05, 0); roof.rotation.set(0, Math.PI / 2, Math.PI / 2); roof.scale.set(.62, 1, .55); g.add(roof);
  g.add(mesh(rb(.55, .9, .1, .05), mat(0x7a4a2a), 0, .45, 1.01)); const wm = mat(0xbfe9ff, { emissive: 0xffd27a, emissiveIntensity: 0 }); WINM.push(wm); const wins = [-.6, .6].map(x => { const w = mesh(rb(.42, .42, .1, .05), wm, x, 1.15, 1.01); g.add(w); return w; });
  if (sign) { const t = ctex(256, 64, s => { s.fillStyle = '#fff6e0'; s.fillRect(0, 0, 256, 64); s.fillStyle = '#c0503a'; s.font = '900 40px Nunito, sans-serif'; s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillText(sign, 128, 34); }); g.add(mesh(new THREE.PlaneGeometry(1.7, .42), new THREE.MeshStandardMaterial({ map: t }), 0, 1.72, 1.03, false)); }
  g.userData.wins = wins; return g;
}
function giant2(scene) {
  const g = new THREE.Group(), belly = new THREE.Group(), shirt = mat(0x7ec8ff), skin = mat(0xf6c9a0), pants = mat(0x5a6ad8); g.add(belly);
  belly.add(mesh(rb(16, 7, 13, 2.2), shirt, 0, 3.5, 0)); belly.add(mesh(rb(16.2, 1.6, 13.2, .6), mat(0xffffff), 0, 3.6, 0));
  for (const s of [-1, 1]) { g.add(mesh(rb(6.6, 6, 12, 1.6), pants, s * 4.1, 3.0, 12)); g.add(mesh(rb(6.8, 4.2, 3.6, 1.2), mat(0xff6b6b), s * 4.1, 4.0, 19.2)); }
  const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * 11.2, 2.8, -.5); a.add(mesh(rb(6, 5.6, 12.5, 1.6), shirt)); const hand = mesh(rb(5.6, 5.2, 4, 1.5), skin, 0, 0, -8.1); a.add(hand); g.add(a); return a; });
  const head = new THREE.Group(); head.position.set(0, 4.6, -12); g.add(head); head.add(mesh(rb(11, 9.6, 9.6, 2.6), skin, 0, 0, 0)); head.add(mesh(rb(11.4, 3.4, 10, 1.6), mat(0x5a3622), 0, -3.6, -1.2));
  const fm = new THREE.MeshStandardMaterial({ map: FACES.sleep, transparent: true, roughness: .8 }), fc = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), fm); fc.position.set(0, 4.81, .3); fc.rotation.set(-Math.PI / 2, 0, Math.PI); head.add(fc);
  scene.add(g); return { g, belly, head, arms, face(e) { fm.map = FACES[e]; }, breathe(k) { belly.position.y = k * 1.1; head.position.y = 4.6 + k * .25; } };
}
const HOUSES = [[-4.6, -3.6], [-1.2, -4.2], [2.6, -3.4], [5.2, -1.0], [-5.0, .9], [-1.6, 1.2], [1.8, 1.6], [5.0, 3.0], [-3.4, 3.8]], BAKERY = 6;
function town(belly, withBakery = true) {
  const top = 7.0, cols = [[0xfff2d8, 0xff6b6b], [0xffd9e8, 0x5a6ad8], [0xd8f7ff, 0xff9a3a], [0xfff7b0, 0x5ed39a], [0xffe0c8, 0xb05ad8]], hs = [];
  HOUSES.forEach(([x, z], i) => { if (i === BAKERY && !withBakery) return hs.push(null); const h = i === BAKERY ? house2(0xffe0b8, 0xd8603a, 'BAKERY') : house2(...cols[i % 5]); h.position.set(x, top, z); h.rotation.y = (i % 3 - 1) * .3; h.scale.setScalar(.85); belly.add(h); hs.push(h); });
  [[0, -1.2], [3.6, .4], [-3.2, -1.0], [.3, 4.4]].forEach(([x, z], i) => { const t = tree(.85 + (i % 2) * .2); t.position.set(x, top, z); belly.add(t); });
  const road = mesh(new THREE.PlaneGeometry(1.2, 11), mat(0xf2e3c0), .3, top + .02, 0, false); road.rotation.x = -Math.PI / 2; road.rotation.z = .25; belly.add(road);
  return hs;
}
function world(sky = skyTex, night = false) {
  const scene = new THREE.Scene(); scene.background = sky; ground(scene); const G = giant2(scene);
  scene.add(new THREE.HemisphereLight(night ? 0x6a7ad8 : 0xdff3ff, night ? 0x2a3a5a : 0x8fc77a, night ? 1.05 : 1.3)); const sun = new THREE.DirectionalLight(night ? 0xb0bcff : 0xfff2dd, night ? 1.3 : 2.3); sun.position.set(14, 26, 16); scene.add(sun, sun.target); sun.target.position.set(0, 6, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); const c = sun.shadow.camera; c.left = c.bottom = -22; c.right = c.top = 22; c.near = 1; c.far = 90; sun.shadow.bias = -.0006;
  if (!night) { cloud(scene, -14, 26, -40, 2.4); cloud(scene, 16, 32, -55, 3); cloud(scene, 2, 20, -30, 1.6); }
  [-4, 12, 24, 36].forEach((x, i) => { const t = tree(2.2); t.position.set(x - 18, 0, 10 - i * 14); scene.add(t); }); [-24, 26].forEach(x => { const t = tree(2.6); t.position.set(x, 0, -6); scene.add(t); });
  const cam = new THREE.PerspectiveCamera(45, RW / RH, .1, 600); scene.add(cam);
  return { scene, cam, G };
}
const person = (belly, p, x, z, ry = 0, s = .32) => { const a = avatar({ ...p, s }); a.root.position.set(x, 7, z); a.root.rotation.y = ry; belly.add(a.root); return a; };
const GRANDMA = { skin: 0xf6d2b8, top: 0xb08ad8, pants: 0x5a4a6a, hair: 0xe8e8ee, style: 'bun', glasses: true, shoes: 0x6a4a3a };
const BAKER = { skin: 0xf0c8a0, top: 0xffffff, pants: 0x3a3a4a, hair: 0x6a4a2a, style: 'cap', capColor: 0xffffff, shoes: 0x3a2a1a };
function hudSign(cam, text, bg = '#ffffff', fg = '#5a6ad8', y = .62) {
  const t = ctex(512, 160, g => { g.fillStyle = bg; g.beginPath(); g.roundRect(6, 6, 500, 148, 34); g.fill(); g.strokeStyle = fg; g.lineWidth = 10; g.stroke(); g.fillStyle = fg; let px = 88; do { g.font = '900 ' + px + 'px Nunito, sans-serif'; px -= 4; } while (g.measureText(text).width > 450); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 84); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .47), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false })); m.renderOrder = 999; m.position.set(0, y, -3); cam.add(m); return m;
}
function sparkles(scene, n, c = 0xffffff, s = .12) { return [...Array(n)].map(() => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(s), new THREE.MeshBasicMaterial({ color: c, toneMapped: false })); scene.add(m); return m; }); }
function chicken() { const g = new THREE.Group(), w = mat(0xffffff); g.add(mesh(rb(.7, .55, .8, .2), w, 0, .55, 0)); g.add(mesh(rb(.4, .45, .4, .14), w, 0, .95, .32)); g.add(mesh(rb(.14, .12, .2, .04), mat(0xffb020), 0, .92, .58)); g.add(mesh(rb(.08, .16, .22, .04), mat(0xff4a4a), 0, 1.22, .3)); const wings = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * .36, .65, 0); p.add(mesh(rb(.1, .38, .55, .05), w, s * .04, -.12, 0)); g.add(p); return p; }); for (const s of [-1, 1]) g.add(mesh(rb(.06, .3, .06, .02), mat(0xffb020), s * .15, .15, 0)); g.userData.wings = wings; return g; }
function rulesBoard(cam) {
  const D = dtex(512, 640), m = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.31), new THREE.MeshBasicMaterial({ map: D.t, transparent: true, depthTest: false, toneMapped: false })); m.renderOrder = 999; m.position.set(0, .15, -3.6); cam.add(m);
  return { m, draw(lines, hi = -1, strike = -1) { const g = D.g; g.clearRect(0, 0, 512, 640); g.fillStyle = '#8a5a3a'; g.beginPath(); g.roundRect(8, 8, 496, 624, 30); g.fill(); g.fillStyle = '#fff6e0'; g.beginPath(); g.roundRect(28, 28, 456, 584, 22); g.fill();
    g.fillStyle = '#5a6ad8'; g.font = '900 64px Nunito, sans-serif'; g.textAlign = 'center'; g.fillText('TOWN RULES', 256, 100); g.textAlign = 'left';
    lines.forEach((l, i) => { g.fillStyle = i === hi ? '#ff4a6a' : '#3a2a3a'; let px = 50; do { g.font = '900 ' + px + 'px Nunito, sans-serif'; px -= 2; } while (g.measureText(l).width > 400); g.fillText(l, 56, 190 + i * 100); if (i === strike) { g.strokeStyle = '#ff4a6a'; g.lineWidth = 8; g.beginPath(); g.moveTo(50, 176 + i * 100); g.lineTo(470, 176 + i * 100); g.stroke(); } }); D.t.needsUpdate = true; } };
}
const shake = (cam, t, a) => { cam.position.x += Math.sin(t * 91) * a; cam.position.y += Math.cos(t * 73) * a; };
const look = (cam, p, q) => { cam.position.set(...p); cam.lookAt(...q); };
const breath = t => (Math.sin(t * 1.6) + 1) / 2;

// ---------- giant short: shots (times are in the original recording) ----------
const shots = [];
const shot = (t0, t1, build) => shots.push({ t0, t1, ...build() });
// 1 "Our town is built on a sleeping giant."
shot(0, 2.47, () => { const S = world(), hs = town(S.G.belly), zs = [0, 1, 2].map(() => zLetter(S.scene)), ppl = [0, 1, 2].map(i => person(S.G.belly, PEOPLE[i], -2 + i * 2, 5.4)); ppl.forEach(p => p.set('happy'));
  return { ...S, update(tl, d, t) { S.G.breathe(breath(t)); zs.forEach((z, i) => { const q = (t * .3 + i / 3) % 1; z.position.set(-3 - q * 5, 12 + q * 9, -14 - q * 4); z.scale.setScalar(2 + q * 3.5); z.material.opacity = 1 - q * .6; }); const k = ss(0, 2.4, tl); look(S.cam, [lerp(-34, -22, k), lerp(28, 20, k), lerp(-50, -36, k)], [0, 5, -3]); } }; });
// 2 "Every time he breathes in, our houses rise."
shot(2.47, 4.86, () => { const S = world(), hs = town(S.G.belly), kid = person(S.G.belly, PEOPLE[0], .6, 5.4, -.2), arrow = hudSign(S.cam, '↑ breathe in ↑', '#ffffff', '#5ed39a', .7);
  return { ...S, update(tl, d, t) { const k = ss(.3, 1.9, tl); S.G.breathe(k); kid.set(k > .5 ? 'grin' : 'happy'); kid.arms[0].rotation.z = -.4 * k; kid.arms[1].rotation.z = .4 * k; arrow.scale.setScalar(pop(tl - .3)); look(S.cam, [2.4, 11.2, 13.5], [0, 7.6, 1.5]); } }; });
// 3 "Every time he breathes out, they bounce back down."
shot(4.86, 7.05, () => { const S = world(), hs = town(S.G.belly), kid = person(S.G.belly, PEOPLE[0], .6, 5.4, -.2), ppl = [1, 2].map((i, j) => person(S.G.belly, PEOPLE[i], -1.8 + j * 3.6, 4.6, j ? -.4 : .4));
  return { ...S, update(tl, d, t) { const k = 1 - ss(.5, 1.0, tl), a = tl - 1.0; S.G.breathe(k); hs.forEach((h, i) => { if (h) h.position.y = 7 + (a > 0 ? Math.abs(Math.sin(a * 9 + i)) * .7 * Math.exp(-a * 3) : 0); }); [kid, ...ppl].forEach((p, i) => { p.set(a > 0 ? 'grin' : 'happy'); p.root.position.y = 7 + (a > 0 ? Math.abs(Math.sin(a * 9 + i * 2)) * .5 * Math.exp(-a * 3) : 0); p.arms[0].rotation.z = -.5; p.arms[1].rotation.z = .5; }); look(S.cam, [2.4, 11.2, 13.5], [0, 7.6, 1.5]); if (a > 0) shake(S.cam, t, .1 * Math.exp(-a * 4)); } }; });
// 4 "You get used to it."
shot(7.05, 8.03, () => { const S = world(), hs = town(S.G.belly), kid = person(S.G.belly, PEOPLE[2], .5, 5.6, -.15, .36), bowl = new THREE.Group(); bowl.add(mesh(new THREE.CylinderGeometry(.5, .32, .35, 16), mat(0xffffff), 0, 0, 0)); bowl.add(mesh(new THREE.CylinderGeometry(.45, .45, .05, 16), mat(0xffd45e), 0, .14, 0)); kid.arms[0].add(bowl); bowl.position.set(0, -1.95, .55); bowl.scale.setScalar(2.2);
  return { ...S, update(tl, d, t) { S.G.breathe(breath(t * 2)); kid.set('smug'); kid.arms[0].rotation.x = -1.3; kid.root.position.y = 7 + Math.abs(Math.sin(t * 6)) * .35; look(S.cam, [2.2, 9.2, 10.2], [.4, 8.4, 5.4]); } }; });
// 5-8 the three rules
function sRules(n, hi, extra) { return () => { const S = world(), hs = town(S.G.belly), B = rulesBoard(S.cam), kid = person(S.G.belly, PEOPLE[n === 0 ? 1 : n === 1 ? 0 : n === 2 ? 3 : 2], .2, 5.8, 0, .36), lines = ['1. never run', '2. never shout', '3. never EVER sneeze'].slice(0, n);
  return { ...S, update(tl, d, t) { S.G.breathe(breath(t)); B.draw(lines, hi); B.m.scale.setScalar(n === 0 ? pop(tl) : 1); B.m.position.set(-.44, .6, -3.6); B.m.scale.multiplyScalar(.78); extra && extra(kid, tl, t); look(S.cam, [-.5, 8.5, 9.8], [-.6, 7.9, 5.8]); } }; }; }
shot(8.03, 9.22, sRules(0, -1, (k, tl) => { k.set('happy'); }));
shot(9.22, 9.78, sRules(1, 0, (k, tl, t) => { k.set('shocked'); k.legs[0].rotation.x = -.7; k.legs[1].rotation.x = .6; k.arms[0].rotation.x = .7; k.arms[1].rotation.x = -.7; }));
shot(9.78, 10.63, sRules(2, 1, (k, tl, t) => { k.set('shh'); k.arms[1].rotation.x = -2.2; k.arms[1].rotation.z = -.15; }));
shot(10.63, 11.74, sRules(3, 2, (k, tl, t) => { k.set(tl > .5 ? 'sneeze' : 'shocked'); k.arms[0].rotation.x = k.arms[1].rotation.x = -2.3; k.arms[0].rotation.z = .25; k.arms[1].rotation.z = -.25; k.head.rotation.x = tl > .5 ? -.15 : 0; }));
// 9 "Because if he wakes up, he rolls over, and we all fall off."
shot(11.74, 14.28, () => { const S = world(), hs = town(S.G.belly), ppl = [0, 1, 2, 3].map(i => person(S.G.belly, PEOPLE[i], -3 + i * 2, 5.2, 0));
  return { ...S, update(tl, d, t) { const r = ss(.7, 1.5, tl) * .55; S.G.g.rotation.z = r; S.G.g.position.y = r * 3; S.G.face(tl > .5 ? 'annoyed' : 'sleep'); const sl = ss(1.1, 2.4, tl);
    hs.forEach((h, i) => { if (!h) return; h.position.x = HOUSES[i][0] - sl * (8 + i * .6); h.position.y = 7 - Math.max(0, h.position.x < -8 ? (-8 - h.position.x) * 1.4 : 0); h.rotation.z = sl * (1 + i * .2); });
    ppl.forEach((p, i) => { p.set('shocked'); p.root.position.x = -3 + i * 2 - sl * 10; p.root.position.y = 7 - Math.max(0, (-8 - p.root.position.x)) * 1.6; p.root.rotation.z = sl * 3; p.arms[0].rotation.z = -2.6; p.arms[1].rotation.z = 2.6; });
    look(S.cam, [-6, 22, 34], [-2, 5, 0]); if (tl > .7) shake(S.cam, t, .3); } }; });
// 10 "Mornings are the worst."
shot(14.28, 15.38, () => { const S = world(dawnTex), hs = town(S.G.belly), kid = person(S.G.belly, PEOPLE[0], 1.4, 2.6, 0, .34); kid.root.position.z = 2.9;
  return { ...S, update(tl, d, t) { S.G.breathe(breath(t)); kid.set('annoyed'); kid.head.rotation.z = .1; look(S.cam, [2.4, 8.6, 6.0], [1.4, 8.2, 2.9]); } }; });
// 11 "He snores so loud, the windows rattle"
shot(15.38, 17.41, () => { const S = world(dawnTex), hs = town(S.G.belly), rings = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(2, .18, 6, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false })); r.rotation.x = Math.PI / 2; S.scene.add(r); return r; }), zs = [0, 1, 2].map(() => zLetter(S.scene));
  return { ...S, update(tl, d, t) { const sn = Math.max(0, Math.sin(t * 5)); S.G.face(sn > .3 ? 'snore' : 'sleep'); S.G.breathe(breath(t)); rings.forEach((r, i) => { const q = (tl * 1.2 + i / 3) % 1; r.position.set(0, 10 + q * 3, -12); r.scale.setScalar(1 + q * 4); r.material.opacity = 1 - q; });
    zs.forEach((z, i) => { const q = (t * .5 + i / 3) % 1; z.position.set(-2 + i * 2, 11 + q * 6, -13); z.scale.setScalar(1.5 + q * 2); });
    hs.forEach((h, i) => { if (h) { h.userData.wins.forEach(w => { w.position.x = (w.position.x > 0 ? .6 : -.6) + Math.sin(t * 60 + i) * .06; w.rotation.z = Math.sin(t * 50 + i) * .2; }); h.rotation.z = Math.sin(t * 40 + i) * .03; } });
    const k = ss(0, 1.0, tl); S.cam.up.set(0, 0, k < .5 ? 0 : 1); if (k < .5) look(S.cam, [0, 30, -32], [0, 9, -10]); else look(S.cam, [0, 26, -6], [0, 9.4, -11]); shake(S.cam, t, .15 * sn); } }; });
// 12 "and the chickens lift off the ground."
shot(17.41, 19.23, () => { const S = world(dawnTex), hs = town(S.G.belly), ch = [...Array(6)].map((_, i) => { const c = chicken(); c.position.set(-2.5 + i, 7, 4 + (i % 2)); S.G.belly.add(c); return c; });
  return { ...S, update(tl, d, t) { S.G.breathe(breath(t)); ch.forEach((c, i) => { const up = ss(.2 + i * .1, 1.6, tl); c.position.y = 7 + up * (2 + i * .3) + Math.sin(t * 4 + i) * .1; c.rotation.z = Math.sin(t * 3 + i) * .3 * up; c.userData.wings.forEach((w, j) => w.rotation.z = (j ? 1 : -1) * (.3 + Math.abs(Math.sin(t * 22 + i)) * 1.0)); }); look(S.cam, [1, 9.0, 12.5], [.3, 9.0, 4.5]); shake(S.cam, t, .05); } }; });
// 13 "Grandma says he's been asleep for three hundred years."
shot(19.23, 21.77, () => { const S = world(), hs = town(S.G.belly), gm = person(S.G.belly, GRANDMA, .4, 5.4, 0, .36), chair = new THREE.Group(); chair.add(mesh(rb(1.2, .2, 1.1, .06), mat(0x9a6a3a), 0, .9, 0)); chair.add(mesh(rb(1.2, 1.6, .2, .06), mat(0x9a6a3a), 0, 1.7, -.5)); for (const s of [-1, 1]) chair.add(mesh(rb(.12, .2, 1.6, .05), mat(0x7a4a2a), s * .5, .1, 0)); chair.position.set(.4, 7, 5.3); chair.scale.setScalar(.6); S.G.belly.add(chair); const sign = hudSign(S.cam, '300 YEARS', '#ffffff', '#b05ad8', .7);
  return { ...S, update(tl, d, t) { S.G.breathe(breath(t)); const rk = Math.sin(t * 2.4) * .12; chair.rotation.x = rk; gm.set(tl > 1.3 ? 'smug' : 'happy'); gm.root.position.y = 7 + .28; gm.root.rotation.x = rk; gm.legs[0].rotation.x = gm.legs[1].rotation.x = -1.4; gm.arms[1].rotation.x = -1.2; gm.arms[1].rotation.z = .3; sign.scale.setScalar(pop(tl - 1.25)); look(S.cam, [1.2, 9.2, 10.4], [.4, 8.2, 5.3]); } }; });
// 14 "Last night, someone sneezed."
shot(21.77, 23.38, () => { const S = world(nightTex, true), hs = town(S.G.belly), kid = person(S.G.belly, PEOPLE[3], .5, 5.4, 0, .36), ach = hudSign(S.cam, 'ACHOO!', '#ffd45e', '#3a2a3a', .55), sp = sparkles(S.scene, 10, 0xbfe9ff, .1);
  return { ...S, update(tl, d, t) { WINM.forEach(w => w.emissiveIntensity = 1.4); S.G.breathe(breath(t)); const a = tl - .85; kid.set(a > 0 ? 'sneeze' : 'shocked'); kid.head.rotation.x = a > 0 ? .3 : -.25; kid.root.position.z = 5.4 - (a > 0 ? .3 * Math.exp(-a * 5) : 0); ach.scale.setScalar(a > 0 ? lerp(2.2, 1, clamp(a / .08)) : .001); sp.forEach((s, i) => { const q = clamp(a * 2 - i * .03); s.visible = a > 0 && q < 1; s.position.set(1.0 + q * 2.0, 8.5 + Math.sin(i * 2) * q * .9, 5.7 + Math.cos(i) * q * .6); s.scale.setScalar(.5); });
    look(S.cam, [.9, 9.0, 9.4], [.4, 8.4, 5.4]); if (a > 0) shake(S.cam, t, .1 * Math.exp(-a * 6)); } }; });
// 15 "The whole town froze."
shot(23.38, 25.6, () => { const S = world(nightTex, true), hs = town(S.G.belly), ppl = PEOPLE.map((p, i) => person(S.G.belly, p, -2.7 + i * 1.8, 5.0 + (i % 2) * .6, (i - 1.5) * -.2)), gm = person(S.G.belly, GRANDMA, 3.2, 3.8, -.4);
  return { ...S, update(tl, d, t) { WINM.forEach(w => w.emissiveIntensity = 1.4); S.G.breathe(.5); [...ppl, gm].forEach((p, i) => { p.set('shocked'); p.arms[0].rotation.z = -.7 - (i % 2) * .5; p.arms[1].rotation.z = .7 + (i % 2) * .5; p.legs[0].rotation.x = (i % 3 - 1) * .4; }); look(S.cam, [lerp(-2, 2, tl / d), 9.2, 10.8], [0, 7.9, 4.8]); } }; });
// 16 "The giant scratched his belly."
shot(25.6, 27.36, () => { const S = world(nightTex, true), hs = town(S.G.belly), ppl = [0, 1, 2].map(i => person(S.G.belly, PEOPLE[i], -3 + i * 1.6, 5.2));
  return { ...S, update(tl, d, t) { WINM.forEach(w => w.emissiveIntensity = 1.4); S.G.breathe(.5); S.G.face('smug'); ppl.forEach(p => { p.set('shocked'); p.arms[0].rotation.z = -2.6; p.arms[1].rotation.z = 2.6; }); const A = S.G.arms[1], k = ss(.1, .6, tl), sc = Math.sin((tl - .6) * 12) * (tl > .6 ? 1 : 0);
    A.rotation.set(-1.0 * k, 0, 1.25 * k); A.position.set(lerp(11.2, 9.0, k), lerp(2.8, 6.5, k), lerp(-.5, 4.0, k) + sc * 1.4); const b = hs[BAKERY]; if (b) { const hit = tl > .75; b.visible = !hit; } look(S.cam, [14, 18, 22], [3, 7, 1]); if (tl > .6) shake(S.cam, t, .25); } }; });
// 17 "Right where the bakery used to be."
shot(27.36, 29.01, () => { const S = world(nightTex, true), hs = town(S.G.belly, false), baker = person(S.G.belly, BAKER, 1.8, 2.6, -.3, .36), crumbs = [...Array(14)].map((_, i) => { const c = mesh(rb(.3, .18, .3, .06), mat([0xe8b060, 0xc88a40, 0xffe0a0][i % 3]), 1.8 + Math.cos(i * 2.4) * (.4 + i * .08), 7.1, 1.6 + Math.sin(i * 2.4) * (.4 + i * .08)); c.rotation.y = i; S.G.belly.add(c); return c; });
  const sign = new THREE.Group(), t2 = ctex(256, 64, s => { s.fillStyle = '#fff6e0'; s.fillRect(0, 0, 256, 64); s.fillStyle = '#c0503a'; s.font = '900 40px Nunito, sans-serif'; s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillText('BAKERY', 128, 34); }); sign.add(mesh(new THREE.PlaneGeometry(1.7, .42), new THREE.MeshStandardMaterial({ map: t2, side: THREE.DoubleSide }), 0, 0, 0)); sign.position.set(1.2, 7.15, 1.9); sign.rotation.set(-Math.PI / 2 + .15, 0, .4); S.G.belly.add(sign);
  return { ...S, update(tl, d, t) { WINM.forEach(w => w.emissiveIntensity = 1.4); S.G.breathe(.5); baker.set('sad'); baker.head.rotation.x = .25; look(S.cam, [3.6, 10.2, 7.2], [1.6, 7.4, 1.8]); } }; });
// 18 "So now we have four rules."
shot(29.01, 30.77, () => { const S = world(), hs = town(S.G.belly, false), B = rulesBoard(S.cam), kid = person(S.G.belly, PEOPLE[2], .2, 5.8, 0, .36);
  return { ...S, update(tl, d, t) { S.G.breathe(breath(t)); B.draw(['1. never run', '2. never shout', '3. never EVER sneeze', tl > .8 ? '4. NO. SNEEZING.' : ''], tl > .8 ? 3 : -1); B.m.position.set(-.44, .6, -3.6); B.m.scale.setScalar(.78); kid.set('annoyed'); look(S.cam, [-.5, 8.5, 9.8], [-.6, 7.9, 5.8]); } }; });
// 19 "And no more bakery."
shot(30.77, 32.28, () => { const S = world(), hs = town(S.G.belly, false), baker = person(S.G.belly, BAKER, 1.8, 2.6, -.3, .36), bread = mesh(rb(.9, .45, .45, .2), mat(0xd89048), 0, 0, 0), sign = hudSign(S.cam, 'CLOSED FOREVER', '#ffffff', '#ff4a6a', .7); baker.arms[0].add(bread); bread.position.set(0, -2.05, .4);
  return { ...S, update(tl, d, t) { S.G.breathe(breath(t)); baker.set('sad'); baker.arms[0].rotation.x = -1.2; baker.head.rotation.z = Math.sin(t * 3) * .08; sign.scale.setScalar(pop(tl - .35)); look(S.cam, [2.6, 9.4, 6.8], [1.8, 8.4, 2.6]); } }; });
// 20 "And this morning, for the first time ever,"
shot(32.28, 34.66, () => { const S = world(dawnTex), hs = town(S.G.belly, false), ppl = [0, 1, 2].map(i => person(S.G.belly, PEOPLE[i], -2 + i * 2, 5.0)), zs = [0, 1].map(() => zLetter(S.scene));
  return { ...S, update(tl, d, t) { S.G.breathe(breath(t)); ppl.forEach(p => p.set('happy')); zs.forEach((z, i) => { const q = (t * .3 + i / 2) % 1; z.position.set(-2 - q * 4, 12 + q * 7, -14); z.scale.setScalar(2 + q * 3); }); const k = ss(0, d, tl); S.cam.up.set(0, 0, k > .5 ? 1 : 0); look(S.cam, [lerp(-18, 0, k), lerp(18, 28, k), lerp(26, -8, k)], [0, lerp(6, 9.4, k), lerp(0, -11, k)]); } }; });
// 21 "he opened one eye."
shot(34.66, DUR + .1, () => { const S = world(dawnTex), hs = town(S.G.belly, false);
  return { ...S, update(tl, d, t) { S.G.breathe(.6); S.G.face(tl > .2 ? 'oneEye' : 'sleep'); S.cam.up.set(0, 0, 1); const z = tl > .2 ? lerp(19, 15, ss(.2, .6, tl)) : 19; look(S.cam, [1.5, z + 9.4, -12], [1.5, 9.4, -11]); if (tl > .2) shake(S.cam, t, .2 * Math.exp(-(tl - .2) * 6)); } }; });

// ---------- captions: one small lowercase word at a time ----------
let words = [];
function drawCaption(t) {
  const w = words.find((w, i) => t >= w.s - .05 && t < (words[i + 1] ? words[i + 1].s - .05 : w.e + .4)); if (!w) return;
  const txt = w.w.toLowerCase().replace(/[.,!?]+$/, ''), k = 1 + .12 * Math.exp(-(t - w.s) * 20);
  og.save(); og.translate(W / 2, H * .7); og.scale(k, k); og.font = '800 70px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  og.lineWidth = 12; og.strokeStyle = 'rgba(20,16,28,.9)'; og.strokeText(txt, 0, 0); og.fillStyle = '#ffffff'; og.fillText(txt, 0, 0); og.restore();
}
function renderAt(t) {
  const s = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1], tl = t - s.t0;
  WINM.forEach(w => w.emissiveIntensity = 0); s.update(tl, s.t1 - s.t0, t); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam);
  og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high'; og.drawImage(renderer.domElement, 0, 0, W, H); drawCaption(t);
}
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .93); };
const cutInfo = await (await fetch('/build/cuts.json')).json();
const toOriginal = tc => { let t = tc * (cutInfo.speed || 1); for (const [a, b] of cutInfo.cuts) { if (t >= a) t += b - a; else break; } return Math.min(t, DUR - .001); };
window.renderFrame = i => window.renderTime(toOriginal((i + .5) / FPS));
window.frameCount = Math.round(cutInfo.duration * FPS);
words = await (await fetch('/build/words.json')).json();
await document.fonts.load('800 70px Nunito'); await document.fonts.load('900 40px Nunito');
window.captionChunks = []; window.ready = true;
