// Style test: bright, smooth blocky-avatar look (no pixelation), for "Our Town Is Built On A Sleeping Giant".
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
const out = document.getElementById('out'); out.width = W; out.height = H; const og = out.getContext('2d');
const rb = (w, h, d, r = .14) => new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001));
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .62, metalness: 0, ...o });
const mesh = (g, m, x = 0, y = 0, z = 0, sh = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; return o; };
const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
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
    if (e === 'sleep') { g.strokeStyle = ink; g.lineWidth = 9; for (const x of [92, 164]) { g.beginPath(); g.arc(x, 104, 20, .3, Math.PI - .3); g.stroke(); } g.fillStyle = ink; g.beginPath(); g.ellipse(128, 168, 14, 18, 0, 0, 7); g.fill(); blush(); }
  });
}
const FACES = {}; for (const e of ['happy', 'grin', 'shocked', 'sad', 'shh', 'sleep']) FACES[e] = faceTex(e);
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
  if (o.style === 'cap') { head.add(mesh(rb(1.42, .45, 1.32, .18), mat(o.capColor), 0, .58, -.02)); head.add(mesh(rb(1.0, .1, .7, .05), mat(o.capColor), 0, .38, .8)); }
  root.scale.setScalar(o.s || .3);
  const A = { root, head, arms, legs, face: fm, set(e) { fm.map = FACES[e]; } };
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
// shots
function wide() {
  const scene = new THREE.Scene(); scene.background = skyTex; const cam = new THREE.PerspectiveCamera(42, W / H, .1, 500);
  ground(scene); const G = giant(scene); townOnBelly(G.g); lightsFor(scene, new THREE.Vector3(0, 4, 0)); cloud(scene, -14, 26, -40, 2.4); cloud(scene, 16, 32, -55, 3); cloud(scene, 2, 20, -30, 1.6);
  const zs = [0, 1, 2].map(() => zLetter(scene)); [-4, 12, 24, 36].forEach((x, i) => { const t = tree(2.2); t.position.set(x - 18, 0, 10 - i * 14); scene.add(t); }); [-24, 26].forEach(x => { const t = tree(2.6); t.position.set(x, 0, -6); scene.add(t); });
  return { scene, cam, caption: 'our town is built on a sleeping giant', update(t) { G.g.position.y = 0; zs.forEach((z, i) => { const q = (t * .3 + i / 3) % 1; z.position.set(-3 - q * 5, 12 + q * 9, -14 - q * 4); z.scale.setScalar(2 + q * 3.5); z.material.opacity = 1 - q * .6; }); cam.position.set(-26, 22, -40); cam.lookAt(0, 5, -4); } };
}
function belly() {
  const scene = new THREE.Scene(); scene.background = skyTex; const cam = new THREE.PerspectiveCamera(48, W / H, .1, 500);
  ground(scene); const G = giant(scene); const hs = townOnBelly(G.g); lightsFor(scene, new THREE.Vector3(0, 7, 0)); cloud(scene, -10, 22, -30, 2); cloud(scene, 12, 26, -40, 2.4);
  const kid = avatar({ ...PEOPLE[0], s: .32 }); kid.root.position.set(.9, 7, 5.6); kid.root.rotation.y = -.25; G.g.add(kid.root); kid.set('grin'); kid.arms[1].rotation.z = 2.5; kid.arms[0].rotation.z = -.2;
  const mom = avatar({ ...PEOPLE[1], s: .32 }); mom.root.position.set(-1.6, 7, 4.6); mom.root.rotation.y = .3; G.g.add(mom.root); mom.set('shocked'); mom.arms[0].rotation.z = -.5; mom.arms[1].rotation.z = .5;
  return { scene, cam, caption: 'every time he breathes, the houses bounce', update(t) { hs.forEach((h, i) => { h.position.y = 7 + Math.abs(Math.sin(t * 3 + i)) * .45; h.rotation.z = Math.sin(t * 3 + i) * .06; }); cam.position.set(3.2, 9.7, 12.5); cam.lookAt(0, 7.9, 2.6); } };
}
function tiptoe() {
  const scene = new THREE.Scene(); scene.background = skyTex; const cam = new THREE.PerspectiveCamera(45, W / H, .1, 500);
  ground(scene); const G = giant(scene); townOnBelly(G.g); lightsFor(scene, new THREE.Vector3(0, 7, 3));
  const ppl = PEOPLE.map((p, i) => { const a = avatar({ ...p, s: .3 }); a.root.position.set(-2.2 + i * 1.35, 7, 6.2 - (i % 2) * .7); G.g.add(a.root); a.set('shh'); a.arms[1].rotation.x = -2.2; a.arms[1].rotation.z = -.15; a.arms[0].rotation.x = .35; a.legs[0].rotation.x = -.5; a.legs[1].rotation.x = .25; a.root.position.y += .1; return a; });
  const sign = ctex(256, 128, g => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#5a6ad8'; g.lineWidth = 10; g.strokeRect(5, 5, 246, 118); g.fillStyle = '#5a6ad8'; g.font = '900 54px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('QUIET!', 128, 68); });
  const post = new THREE.Group(); post.add(mesh(new THREE.CylinderGeometry(.08, .08, 2.2, 8), mat(0x8a5a3a), 0, 1.1, 0)); post.add(mesh(new THREE.PlaneGeometry(1.6, .8), new THREE.MeshStandardMaterial({ map: sign }), 0, 2.2, .05)); post.position.set(2.6, 7, 4.3); post.rotation.y = -.4; G.g.add(post);
  return { scene, cam, caption: 'nobody is allowed to sneeze', update() { cam.position.set(1.0, 9.0, 12.4); cam.lookAt(.2, 8.0, 4.8); } };
}
function faces() {
  const scene = new THREE.Scene(); scene.background = ctex(16, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#ffd1e8'); gr.addColorStop(1, '#ffeec8'); g.fillStyle = gr; g.fillRect(0, 0, 16, 256); }); const cam = new THREE.PerspectiveCamera(40, W / H, .1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffe0d0, 1.6)); const d = new THREE.DirectionalLight(0xffffff, 1.8); d.position.set(4, 8, 10); scene.add(d);
  const fl = mesh(new THREE.PlaneGeometry(40, 40), mat(0xffe6f0), 0, 0, 0, false); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  [['happy', 0], ['shocked', 1], ['sad', 2], ['grin', 3]].forEach(([e, i]) => { const a = avatar({ ...PEOPLE[i], s: .5 }); a.root.position.set((i % 2 ? 1 : -1) * 1.15, i < 2 ? 2.6 : 0, i < 2 ? -1.6 : .4); a.set(e); if (e === 'shocked') { a.arms[0].rotation.z = -2.6; a.arms[1].rotation.z = 2.6; } if (e === 'grin') a.arms[1].rotation.z = 2.4; if (e === 'sad') a.head.rotation.x = .15; scene.add(a.root); });
  return { scene, cam, caption: 'faces change with the story', update() { cam.position.set(0, 3.4, 12.5); cam.lookAt(0, 2.4, 0); } };
}
const SHOTS = [wide, belly, tiptoe, faces].map(f => f());
window.renderTime = i => {
  const s = SHOTS[i]; s.update(1.2); renderer.render(s.scene, s.cam); og.drawImage(renderer.domElement, 0, 0);
  og.font = '800 64px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; const words = s.caption.split(' '), w = words[Math.min(words.length - 1, 3)];
  og.lineWidth = 10; og.strokeStyle = 'rgba(20,16,28,.85)'; og.strokeText(w, W / 2, H * .66); og.fillStyle = '#ffffff'; og.fillText(w, W / 2, H * .66);
  return out.toDataURL('image/jpeg', .92);
};
await document.fonts.load('800 64px Nunito'); window.ready = true;
