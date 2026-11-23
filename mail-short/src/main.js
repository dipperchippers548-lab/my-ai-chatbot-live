// "How a Man Mailed Himself Across the World" - noodle people in Ricks-style lit sets, rendered frame by frame.
import * as THREE from '/node_modules/three/build/three.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'; import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'; import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'; import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'; import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'; import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const W = 1080, H = 1920, FPS = 30;
await document.fonts.load('900 96px Nunito');
const out = document.getElementById('out'); out.width = W; out.height = H; const og = out.getContext('2d');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const spring = x => x <= 0 ? 0 : 1 - Math.exp(-x * 8) * Math.cos(x * 13);
const pop = x => x <= 0 ? 0 : Math.min(1, x / .08) * (1 + .3 * Math.exp(-x * 8) * Math.cos(x * 22));
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ctex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };

// ---------- toon look ----------
const ramp = (() => { const d = new Uint8Array([95, 175, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (c, map) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, map: map || null });
const INK = 0x16121a;
const inkCache = {};
function inkMat(w) { const k = w.toFixed(4); if (inkCache[k]) return inkCache[k]; const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${k};`); }; return inkCache[k] = m; }
function inked(geo, color, w = .022, map, noShadow) { const g = new THREE.Group(), m = new THREE.Mesh(geo, toon(color, map)); m.castShadow = !noShadow; m.receiveShadow = true; g.add(m); g.add(new THREE.Mesh(geo, inkMat(w))); return g; }
const flat = c => new THREE.MeshBasicMaterial({ color: c });
const box = (w, h, d, c, iw = .025) => inked(new THREE.BoxGeometry(w, h, d), c, iw);
const at3 = (o, x, y, z) => { o.position.set(x, y, z); return o; };

// ---------- text sprites (?, Z, $20, REC...) ----------
const tcache = {};
function textTex(txt, fill = '#ffffff', size = 120) { const k = txt + fill + size; if (tcache[k]) return tcache[k]; return tcache[k] = ctex(256, 256, g => { g.font = `900 ${size}px Nunito`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 18; g.strokeStyle = '#16121a'; g.lineJoin = 'round'; g.strokeText(txt, 128, 136); g.fillStyle = fill; g.fillText(txt, 128, 136); }); }
const sprite = (txt, fill, s = .5, size) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex(txt, fill, size), transparent: true, depthWrite: false })); m.scale.setScalar(s); return m; };

// ---------- noodle people ----------
const stripesT = ctex(8, 64, g => { for (let y = 0; y < 64; y += 16) { g.fillStyle = '#ffffff'; g.fillRect(0, y, 8, 8); g.fillStyle = '#b8b0ff'; g.fillRect(0, y + 8, 8, 8); } });
stripesT.wrapS = stripesT.wrapT = THREE.RepeatWrapping; stripesT.repeat.set(6, 1);
const burgT = ctex(8, 64, g => { for (let y = 0; y < 64; y += 16) { g.fillStyle = '#f2f2f2'; g.fillRect(0, y, 8, 8); g.fillStyle = '#24222c'; g.fillRect(0, y + 8, 8, 8); } }); burgT.wrapS = burgT.wrapT = THREE.RepeatWrapping; burgT.repeat.set(6, 1);
function curveTube(pts, r, col, w = .016, seg = 16) { return inked(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 10), col, w); }
function eyesOf(f, kind, r, s = 1) {
  for (const x of [-.13, .13]) {
    if (kind === 'closed' || kind === 'happy') { const up = kind === 'happy' ? 1 : -1, pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8 * 2 - 1; pts.push(V(x + u * .065, .06 + up * .035 * (1 - u * u), r * .955)); } f.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, .017, 6), flat(INK))); continue; }
    const e = new THREE.Group(), sc = kind === 'wide' ? 1.3 : kind === 'half' ? .9 : 1; const b = new THREE.Mesh(new THREE.SphereGeometry(.07 * sc * s, 16, 12), flat(INK)); b.scale.set(.8, kind === 'half' ? .55 : 1.15, .4); e.add(b);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 6), flat(0xffffff)); gl.position.set(.02, .035, .03); e.add(gl); if (kind === 'half') { const lid = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), flat(0x16121a)); lid.scale.set(.9, .5, .45); e.add(lid); }
    e.position.set(x, .06, r * .93); e.lookAt(e.position.clone().multiplyScalar(2)); f.add(e);
  }
}
function mouthOf(kind) {
  const g = new THREE.Group();
  if (kind === 'o' || kind === 'open' || kind === 'scream') { const sx = kind === 'o' ? 1 : kind === 'open' ? 1.5 : 2, sy = kind === 'o' ? 1 : kind === 'open' ? .8 : 1.4; const o = new THREE.Mesh(new THREE.TorusGeometry(.05, .016, 8, 20), flat(INK)); o.scale.set(sx, sy, 1); g.add(o); const fill = new THREE.Mesh(new THREE.CircleGeometry(.05, 20), flat(0x6a1a2a)); fill.scale.set(sx, sy, 1); fill.position.z = -.002; g.add(fill); return g; }
  const n = 16, wdt = kind === 'grin' ? .19 : .13, bend = { smile: .05, grin: .075, frown: -.045, flat: 0, wavy: 0, smirk: .03 }[kind] ?? 0, pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n * 2 - 1; pts.push(V(u * wdt / 2, -bend * (1 - u * u) + (kind === 'wavy' ? Math.sin(u * 9) * .012 : 0) + (kind === 'smirk' ? u * .02 : 0), 0)); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .015, 6), flat(INK)));
  if (kind === 'grin') { const sh = new THREE.Shape(); sh.moveTo(-wdt / 2, 0); for (let i = 0; i <= n; i++) { const u = i / n * 2 - 1; sh.lineTo(u * wdt / 2, -bend * (1 - u * u)); } const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), flat(0xffffff)); m.position.z = -.003; g.add(m); }
  return g;
}
// o: color, eyes, mouth, brow, browUp, blush, bend, lean, tilt, nod, turn(head yaw), arms [[x,y,z]x2] (offset from shoulder), hands [V,V] (local target), feet [[dz,lift]x2],
//    shoe, hat ('cap'|'sleep'), hatColor, glasses, curlers, robe, pj, grassy, sit
function noodle(o) {
  const g = new THREE.Group(), col = o.color, R = .25, HR = .41, bend = o.bend || 0, lean = o.lean || 0;
  const bodyMap = o.pj ? (o.pjMap === 'burglar' ? burgT : stripesT) : null, bodyCol = o.pj ? 0xffffff : col;
  const base = o.sit ? .5 : .32;
  const spine = new THREE.CatmullRomCurve3([V(0, base, 0), V(bend * .3, base + .3, lean * .1), V(bend * .55 + lean * .1, base + .6, lean * .3), V(bend * .6, base + .86, lean * .5)]);
  g.add(inked(new THREE.TubeGeometry(spine, 32, R, 18), bodyCol, .022, bodyMap));
  for (const y of [0, 1]) { const cap = inked(new THREE.SphereGeometry(R, 18, 12), y ? col : bodyCol, .022, y ? null : bodyMap); cap.position.copy(spine.getPoint(y)); g.add(cap); }
  if (o.robe) { const rb = inked(new THREE.CylinderGeometry(R + .04, R + .09, .5, 18, 1, true), o.robe, .02); rb.position.copy(spine.getPoint(.25)); g.add(rb); const belt = inked(new THREE.TorusGeometry(R + .055, o.beltW || .025, 6, 18), o.beltColor ?? 0xffffff, .012); belt.rotation.x = Math.PI / 2; belt.position.copy(spine.getPoint(.42)); g.add(belt); }
  const top = spine.getPoint(1), head = new THREE.Group(); head.position.copy(top).add(V(0, HR * .85, 0)); head.rotation.set(o.nod || 0, o.turn || 0, -(bend) * .35 + (o.tilt || 0)); g.add(head);
  head.add(inked(new THREE.SphereGeometry(HR, 28, 20), col, .024));
  if (o.hat === 'sleep') { const c = new THREE.Group(); c.position.set(0, HR * .72, -.02); c.rotation.z = .5; head.add(c); c.add(inked(new THREE.ConeGeometry(.3, .62, 14), o.hatColor || 0x7a5ad8, .02)); c.children[0].position.y = .25; const pom = inked(new THREE.SphereGeometry(.08, 10, 8), 0xffffff, .015); pom.position.y = .58; c.add(pom); const rim = inked(new THREE.TorusGeometry(.29, .05, 8, 18), 0xffffff, .015); rim.rotation.x = Math.PI / 2; rim.position.y = -.04; c.add(rim); }
  if (o.hat === 'cap') { const c = inked(new THREE.SphereGeometry(HR * 1.02, 24, 12, 0, Math.PI * 2, 0, Math.PI * .42), o.hatColor || 0xe8323a, .02); c.position.y = .02; head.add(c); const brim = inked(new THREE.CylinderGeometry(.24, .24, .03, 20), o.hatColor || 0xe8323a, .015); brim.position.set(0, .2, .26); brim.scale.z = .8; brim.rotation.x = .25; head.add(brim); }
  if (o.curlers) for (let i = 0; i < 4; i++) { const cu = inked(new THREE.CylinderGeometry(.055, .055, .2, 10), [0xff8ab8, 0x8ad8ff, 0xffe27a, 0xa8f08a][i], .012); const a = -1.1 + i * .73; cu.position.set(Math.sin(a) * HR * .8, HR * .75, Math.cos(a) * HR * .2 - .08); cu.rotation.z = Math.PI / 2 + a * .3; head.add(cu); }
  if (o.tuft) for (let i = 0; i < 3; i++) { const t = inked(new THREE.ConeGeometry(.06, .2, 8), col, .015); t.position.set(-.07 + i * .07, HR + .05, .05); t.rotation.z = (i - 1) * .4; head.add(t); }
  const f = new THREE.Group(); head.add(f); eyesOf(f, o.eyes || 'open', HR, o.eyeS || 1);
  if (o.glasses) for (const x of [-.13, .13]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.085, .014, 6, 18), flat(INK)); r.position.set(x, .06, HR * .99); f.add(r); }
  for (const [x, s] of [[-.13, -1], [.13, 1]]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(.018, .08, 4, 8), flat(INK)); b.rotation.z = Math.PI / 2 + s * (o.brow || 0); b.position.set(x, .2 + (o.browUp || 0), HR * .9); f.add(b); }
  const m = mouthOf(o.mouth || 'smile'); m.position.set(0, -.13, HR * .965); m.rotation.x = -.18; f.add(m);
  if (o.blush) for (const x of [-.22, .22]) { const c = new THREE.Mesh(new THREE.CircleGeometry(.05, 16), new THREE.MeshBasicMaterial({ color: 0xff7a9a, transparent: true, opacity: .55 })); c.position.set(x, -.06, HR * .86); c.lookAt(V(x * 3, -.1, HR * 3)); f.add(c); }
  gear(g, o, spine, head, HR, R);
  const sh = spine.getPoint(.62);
  for (const s of [-1, 1]) {
    const i = s < 0 ? 0 : 1, from = sh.clone().add(V(s * R * .85, 0, 0));
    const to = o.hands ? o.hands[i].clone() : from.clone().add(V(...(o.arms ? o.arms[i] : [s * .5, -.2, .05])).multiplyScalar(.62));
    const mid = from.clone().lerp(to, .5).add(V(0, .05, 0)); g.add(curveTube([from, mid, to], .055, o.pj ? (o.limb ?? 0xffffff) : col, .016));
    const hand = inked(new THREE.SphereGeometry(o.gloves ? .155 : .085, 14, 10), o.gloves || col, .016); if (o.gloves) hand.scale.set(1, .9, 1.15); hand.position.copy(to); g.add(hand);
    const fo = o.feet ? o.feet[i] : [0, 0];
    const hip = V(s * .12, base - .1, 0), foot = o.sit ? V(s * .14, base - .12, .35) : V(s * .16, .06 + fo[1], .02 + fo[0]);
    g.add(curveTube([hip, hip.clone().lerp(foot, .5).add(V(0, 0, .03)), foot], .06, o.pj ? (o.limb ?? 0xffffff) : col, .016));
    const shoe = inked(new THREE.SphereGeometry(.1, 14, 10), o.shoe || 0x2a2a34, .016); shoe.scale.set(1, .6, 1.4); shoe.position.copy(foot).add(V(0, -.01, .06)); g.add(shoe);
    if (o.grassy) for (let k = 0; k < 6; k++) { const bl = new THREE.Mesh(new THREE.ConeGeometry(.018, .09, 4), toon(0x4ab83a)); bl.position.copy(foot).add(V(-.07 + k * .028, .05, .06 + (k % 2) * .04)); bl.rotation.z = (k - 2.5) * .15; g.add(bl); }
  }
  g.userData.head = head; return g;
}
const DAVE = { color: 0x38c8c0, robe: 0x2a6ad8, shoe: 0x8a5a3a };
const GARY = { color: 0xa87ae8, pj: true, hat: 'sleep', hatColor: 0x6a4ac8, shoe: 0x6a4ac8, eyes: 'closed', mouth: 'flat' };
const PATEL = { color: 0xff6aa8, glasses: true, curlers: true, shoe: 0xffffff };
const ORANGE = { color: 0xff8a2a, tuft: true, blush: true };
const YELLOW = { color: 0xffd23a, hat: 'cap', hatColor: 0x3a8ad8 };
const toLocal = (target, pos, ry) => target.clone().sub(pos).applyAxisAngle(V(0, 1, 0), -ry);

// ---------- props ----------
function makeMower() { const g = new THREE.Group(); g.add(at3(box(.7, .18, .55, 0xe8323a), 0, .2, 0)); g.add(at3(box(.32, .22, .3, 0x2a2a30), -.05, .4, 0)); g.add(at3(box(.12, .05, .12, 0xc8c8d0), -.05, .54, 0));
  for (const [x, z] of [[-.28, -.26], [-.28, .26], [.28, -.26], [.28, .26]]) { const w = inked(new THREE.CylinderGeometry(.09, .09, .06, 12), 0x16161a, .012); w.rotation.x = Math.PI / 2; w.position.set(x, .09, z); g.add(w); }
  const h = curveTube([V(-.3, .3, -.18), V(-.7, .8, -.18), V(-.85, .98, -.18)], .025, 0x2a2a30, .01); g.add(h); const h2 = curveTube([V(-.3, .3, .18), V(-.7, .8, .18), V(-.85, .98, .18)], .025, 0x2a2a30, .01); g.add(h2);
  g.add(at3(inked(new THREE.CylinderGeometry(.03, .03, .4, 8), 0x16161a, .01), -.85, .98, 0)); g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  g.userData.grip = s => V(-.85, .98, s * .14); return g; }   // mower faces +x; handle toward -x
const lawnT = (mowed, seed = 1) => ctex(64, 64, g => { if (mowed) { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#5ec048' : '#78d85a'; g.fillRect(i * 8, 0, 8, 64); } } else { g.fillStyle = '#4a9a3a'; g.fillRect(0, 0, 64, 64); const r = rng(seed); for (let i = 0; i < 260; i++) { g.fillStyle = r() < .5 ? '#3a8a2e' : '#5aac44'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 1, 3); } } });
const MOWED = lawnT(true), SHAGGY = lawnT(false, 3);
function makeHouse(wall, roof, lit) { const g = new THREE.Group(); g.add(at3(box(3.2, 2.2, 2.6, wall, .03), 0, 1.1, 0)); const rf = inked(new THREE.ConeGeometry(2.5, 1.5, 4), roof, .03); rf.position.y = 2.95; rf.rotation.y = Math.PI / 4; rf.scale.z = .85; g.add(rf);
  g.add(at3(box(.7, 1.2, .08, 0x7a4a2a, .015), 0, .6, 1.31)); const winM = lit ? 0xffd87a : 0x9ad8ff; for (const x of [-1, 1]) { g.add(at3(box(.6, .55, .06, winM, .015), x, 1.35, 1.31)); }
  g.add(at3(box(.2, .7, .2, 0x8a5a4a), .9, 3.0, -.3)); g.userData.door = g.children[2]; return g; }
function tree(s = 1) { const t = new THREE.Group(); t.scale.setScalar(s); t.add(at3(inked(new THREE.CylinderGeometry(.12, .16, 1.0, 10), 0x9a6a3a), 0, .5, 0)); for (const [dx, dy, r] of [[0, 1.4, .6], [-.35, 1.15, .42], [.38, 1.2, .45]]) t.add(at3(inked(new THREE.SphereGeometry(r, 16, 12), 0x3fae4a, .03), dx, dy, 0)); return t; }
function hedge(w = 2) { return at3(box(w, .7, .6, 0x3a9a3e, .025), 0, .35, 0); }
function bills(n = 1) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(.36, .18), new THREE.MeshBasicMaterial({ map: textTex('$20', '#e8ffe0', 90), color: 0x7ad86a, side: THREE.DoubleSide })); b.position.set(i * .03, i * .01, i * .002); b.rotation.z = (i - n / 2) * .12; g.add(b); } return g; }

// ---------- the world: one street (Dave's teal-roof house, Gary's purple-roof house), lawns, pool, park ----------
const skyT = (top, mid, bot, stars) => ctex(8, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(.6, mid); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); });
const SKY = { morning: skyT('#5aa8ff', '#ffc8a0', '#ffe8c0'), day: skyT('#3aa8ff', '#9ad8ff', '#e0f6ff'), night: skyT('#06081c', '#1a2058', '#3a3a7a'), dream: skyT('#ffd8f0', '#d8c8ff', '#c8f0ff') };
const HX = { patel: -10, dave: -4, gary: 2, orange: 8 };
function world(mode = 'day', o = {}) {
  const scene = new THREE.Scene(); scene.background = SKY[mode === 'dream' ? 'dream' : mode];
  const night = mode === 'night';
  scene.add(new THREE.HemisphereLight(night ? 0x5a6ab8 : 0xffffff, night ? 0x1a2a3a : 0x8ab86a, night ? .9 : 1.3));
  const sun = new THREE.DirectionalLight(night ? 0x8aa8ff : mode === 'morning' ? 0xffd0a0 : 0xfff6e0, night ? 1.1 : 2.4); sun.position.set(night ? -6 : 6, night ? 12 : 9, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 }); sun.shadow.bias = -.0006; scene.add(sun, sun.target);
  scene.fog = new THREE.Fog(night ? 0x1a2058 : mode === 'morning' ? 0xffd8b8 : 0xc8ecff, 30, 80);
  const S = { scene, sun, night, lawns: {} };
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), toon(night ? 0x2a5a3a : 0x6ac04a)); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; scene.add(gnd);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 4), toon(night ? 0x2a2a38 : 0x6a6a74)); road.rotation.x = -Math.PI / 2; road.position.set(0, .01, 2.2); road.receiveShadow = true; scene.add(road);
  for (let x = -60; x < 60; x += 3) { const l = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .12), flat(night ? 0x8a8a6a : 0xfff2a0)); l.rotation.x = -Math.PI / 2; l.position.set(x, .02, 2.2); scene.add(l); }
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(200, .9), toon(night ? 0x5a5a68 : 0xd8d4cc)); walk.rotation.x = -Math.PI / 2; walk.position.set(0, .015, -.25); walk.receiveShadow = true; scene.add(walk);
  const houses = { patel: [0xffc8d8, 0xd84a6a], dave: [0xc8f0e8, 0x2a9a8a], gary: [0xe0d0ff, 0x7a4ac8], orange: [0xffe0b0, 0xe8742a] };
  for (const [k, [w, r]] of Object.entries(houses)) { const hx = HX[k]; const h = makeHouse(w, r, night); h.position.set(hx, 0, -6.2); scene.add(h); S[k + 'House'] = h;
    for (const mowed of [true, false]) { const lp = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.2), toon(0xffffff, mowed ? MOWED : SHAGGY)); lp.rotation.x = -Math.PI / 2; lp.position.set(hx, mowed ? .025 : .022, -2.8); lp.receiveShadow = true; scene.add(lp); (S.lawns[k] = S.lawns[k] || {})[mowed ? 'mowed' : 'shaggy'] = lp; }
    S.lawns[k].shaggy.visible = !!o.shaggy; const path = new THREE.Mesh(new THREE.PlaneGeometry(.8, 4.2), toon(night ? 0x5a5a68 : 0xd8d4cc)); path.rotation.x = -Math.PI / 2; path.position.set(hx, .03, -2.8); scene.add(path);
    const mb = new THREE.Group(); mb.position.set(hx - 1.7, 0, -.9); mb.add(at3(box(.08, .9, .08, 0x5a4a3a, .01), 0, .45, 0)); mb.add(at3(box(.28, .22, .4, k === 'gary' ? 0x7a4ac8 : 0x3a6ad8, .015), 0, 1.0, 0)); scene.add(mb);
    const hd = hedge(1.4); hd.position.set(hx + 2.7, 0, -4.5); scene.add(hd); S[k + 'Hedge'] = hd; }
  // Dave's pool, in the side yard between Dave and Gary
  const pool = new THREE.Group(); pool.position.set(-1, 0, -2.6); scene.add(pool); S.pool = pool;
  for (const [x, z, w, d] of [[0, -1.25, 2.0, .15], [0, 1.25, 2.0, .15], [-.93, 0, .15, 2.6], [.93, 0, .15, 2.6]]) pool.add(at3(box(w, .14, d, 0xf2f2f2, .015), x, .07, z)); const water = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.4), new THREE.MeshToonMaterial({ color: night ? 0x2a6ac8 : 0x4ac8f0, gradientMap: ramp })); water.rotation.x = -Math.PI / 2; water.position.y = .06; pool.add(water); S.water = water;
  for (const [x, z, s] of [[-18, -8, 1.6], [14, -8.5, 1.5], [-7, -8.6, 1.2], [5, -9, 1.3], [-22, 6, 1.4], [20, 6.5, 1.6], [-3, 7, 1.3], [9, 6.8, 1.2]]) { const t = tree(s); t.position.set(x, 0, z); scene.add(t); }
  for (const x of [-16, -7, 14]) { const lp = new THREE.Group(); lp.position.set(x, 0, .4); lp.add(at3(inked(new THREE.CylinderGeometry(.06, .08, 3.4, 8), 0x2a2a34, .012), 0, 1.7, 0)); const bulb = inked(new THREE.SphereGeometry(.2, 12, 10), night ? 0xffe8a0 : 0xe8e8e8, .015); bulb.position.y = 3.45; lp.add(bulb); scene.add(lp); if (night) { const pl = new THREE.PointLight(0xffd890, 18, 9); pl.position.set(x, 3.2, .6); scene.add(pl); } }
  if (night) { const moon = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), flat(0xfff6d8)); moon.position.set(-14, 16, -40); scene.add(moon); const r = rng(5); for (let i = 0; i < 70; i++) { const s = new THREE.Mesh(new THREE.CircleGeometry(.08 + r() * .08, 5), flat(0xffffff)); s.position.set((r() - .5) * 90, 8 + r() * 30, -45); scene.add(s); } }
  else for (const [x, y, z, s] of [[-8, 9, -24, 1.4], [6, 11, -28, 1.7], [-2, 13, -34, 1.5], [16, 9, -30, 1.2]]) { const c = new THREE.Group(); c.position.set(x, y, z); c.scale.setScalar(s); for (const [dx, r] of [[-.6, .55], [0, .75], [.65, .55]]) { const b = inked(new THREE.SphereGeometry(r, 14, 10), 0xffffff, .03, null, true); b.position.x = dx; c.add(b); } scene.add(c); }
  return S;
}
function setSun(S, x, z) { S.sun.target.position.set(x, 0, z); S.sun.position.set(x + (S.night ? -6 : 6), S.night ? 12 : 9, z + 8); }
function park() {
  const scene = new THREE.Scene(); scene.background = SKY.night; scene.add(new THREE.HemisphereLight(0x6a7ac8, 0x1a2a3a, 1.0)); const moon = new THREE.DirectionalLight(0x9ab8ff, 1.2); moon.position.set(-4, 14, 6); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 }); scene.add(moon);
  const D = document.createElement('canvas'); D.width = D.height = 512; const g = D.getContext('2d'); const T = new THREE.CanvasTexture(D); T.colorSpace = THREE.SRGBColorSpace;
  const base = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), toon(0x2a6a32)); base.rotation.x = -Math.PI / 2; base.receiveShadow = true; scene.add(base); const gnd = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), toon(0xffffff, T)); gnd.rotation.x = -Math.PI / 2; gnd.position.y = .01; gnd.receiveShadow = true; scene.add(gnd);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, t = tree(1.3 + (i % 3) * .2); t.position.set(Math.cos(a) * 9, 0, Math.sin(a) * 9); scene.add(t); }
  const paint = k => { g.fillStyle = '#2a6a32'; g.fillRect(0, 0, 512, 512); const r = rng(9); for (let i = 0; i < 2500; i++) { g.fillStyle = r() < .5 ? '#245e2c' : '#33783a'; g.fillRect(r() * 512 | 0, r() * 512 | 0, 2, 4); }
    g.strokeStyle = '#b8f58a'; g.lineCap = 'round'; g.lineWidth = 30; const segs = [[256, 256, 125, 0, Math.PI * 2], [256, 268, 68, .25, Math.PI - .25]]; let left = k * (Math.PI * 3 + .7);
    const arcSeg = ([cx, cy, r, a0, a1]) => { const L = a1 - a0, d = Math.min(L, left); if (d > 0) { g.beginPath(); g.arc(cx, cy, r, a0, a0 + d); g.stroke(); } left -= L; return a0 + d; };
    arcSeg(segs[0]); for (const [ex, ey] of [[214, 214], [298, 214]]) { if (left > 0) { g.beginPath(); g.arc(ex, ey, 19, 0, Math.PI * 2 * Math.min(1, left / .6)); g.fillStyle = '#b8f58a'; g.fill(); left -= .6; } } const end = arcSeg(segs[1]); T.needsUpdate = true; return { cx: 256 + Math.cos(end) * 68, cy: 268 + Math.sin(end) * 68 }; };
  return { scene, paint };
}
function bedroom() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf6e8ff); scene.add(new THREE.HemisphereLight(0xffffff, 0xc8b8d8, 1.4)); const sun = new THREE.DirectionalLight(0xfff0c8, 2.2); sun.position.set(4, 6, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);
  scene.add(at3(box(8, .1, 8, 0xc8a07a, .02), 0, -.05, 0)); scene.add(at3(box(8, 4, .2, 0xe8d8ff, .02), 0, 2, -2.5)); scene.add(at3(box(.2, 4, 8, 0xdcc8ff, .02), -3, 2, 0));
  scene.add(at3(box(1.4, 1.2, .1, 0x9ad8ff, .02), 1.4, 2.2, -2.38)); for (const x of [.85, 1.95]) scene.add(at3(box(.3, 1.4, .12, 0xffd86a, .015), x, 2.2, -2.32));
  const bed = new THREE.Group(); bed.position.set(-1.2, 0, -.8); scene.add(bed); bed.add(at3(box(1.8, .5, 2.6, 0x8a5a3a), 0, .25, 0)); bed.add(at3(box(1.75, .25, 2.5, 0xb8a0f0), 0, .62, .05)); bed.add(at3(box(1.8, 1.2, .15, 0x8a5a3a), 0, .6, -1.3)); bed.add(at3(box(.9, .2, .45, 0xffffff), 0, .82, -.95));
  const ns = new THREE.Group(); ns.position.set(.4, 0, -1.8); scene.add(ns); ns.add(at3(box(.6, .6, .5, 0x8a5a3a), 0, .3, 0)); ns.add(at3(inked(new THREE.CylinderGeometry(.14, .14, .1, 14), 0xe8323a, .012), 0, .7, 0)); ns.children[1].rotation.x = Math.PI / 2;
  const slip = []; for (const x of [.2, .55]) { const s = inked(new THREE.SphereGeometry(.13, 12, 10), 0x6a4ac8, .015); s.scale.set(1, .5, 1.6); s.position.set(x, .07, .4); scene.add(s); slip.push(s); for (let k = 0; k < 9; k++) { const bl = new THREE.Mesh(new THREE.ConeGeometry(.02, .11, 4), toon(0x4ab83a)); bl.position.set(x - .09 + (k % 3) * .09, .13, .3 + Math.floor(k / 3) * .1); bl.rotation.z = (k - 4) * .12; scene.add(bl); } }
  return { scene, bed };
}

// ---------- timing ----------
const cutInfo = await (await fetch('/build/cuts.json')).json();
const tm = t => (t - cutInfo.cuts.reduce((s, [a, b]) => s + (t > a ? Math.min(t, b) - a : 0), 0)) / cutInfo.speed;
const TOTAL = cutInfo.duration;
const mouthT = await (await fetch('/build/mouth.json')).json();
const talkShape = tc => { const l = mouthT.level[Math.round(tc * 100)] || 0; return ['flat', 'o', 'open', 'open'][l]; };
const shots = [];
const at = (t0, o) => tm(o) - tm(t0);
// a shot: t0/t1 on the voiceover clock; build() -> { scene, cam, update(f, fd, tc), cast() -> [noodle groups rebuilt each frame] }
const shot = (t0, t1, build, o = {}) => shots.push({ t0, t1, f0: tm(t0), f1: t1 > 90 ? TOTAL : tm(t1), ...o, ...build(t0) });
const newCam = (fov = 40) => new THREE.PerspectiveCamera(fov, W / H, .05, 300);
const look = (cam, px, py, pz, tx, ty, tz) => { cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz); };
const drift = (cam, t, a = .004) => { cam.rotation.x += Math.sin(t * 1.1) * a; cam.rotation.y += Math.sin(t * .9 + 1) * a; };
let live = [];
let NOW = 0;
const CHS = .8;   // characters a bit smaller than before, so the sets read bigger   // render clock, so every noodle stays alive between poses
// a noodle that is never quite still: arms drift, the body breathes (squash & stretch), the head bobs and tilts
function place(scene, opts, x, y, z, ry = 0) {
  const seed = (x * 7.13 + z * 3.71 + (opts.color || 0) % 97) % 6.283; let o = opts;
  if (!o.hands && !o.still) { const base = o.arms || [[-.5, -.2, .05], [.5, -.2, .05]], w = Math.sin(NOW * 3.1 + seed), w2 = Math.sin(NOW * 2.3 + seed * 2); o = { ...o, arms: base.map((a, i) => [a[0] + (i ? 1 : -1) * w2 * .03, a[1] + (i ? w : -w) * .07, a[2] + w2 * .04]) }; }
  const g = noodle(o); g.position.set(x, y, z); g.rotation.y = ry;
  const b = Math.sin(NOW * 4.4 + seed), sq = o.squash || 0; const CS = o.cs ?? CHS; g.scale.set(CS * (1 + .03 * b + sq * .6), CS * (1 - .04 * b - sq), CS * (1 + .03 * b + sq * .6));
  const hd = g.userData.head; hd.rotation.z += Math.sin(NOW * 2.6 + seed) * .07; hd.rotation.x += Math.sin(NOW * 3.9 + seed) * .035; hd.rotation.y += Math.sin(NOW * 1.7 + seed) * .06;
  scene.add(g); live.push(g); return g;
}
// static crowd noodles also bounce (transforms only, no rebuild)
const statics = [];
// waddle: phase p in radians (one step every pi). Bigger sway, opposite arm swing, a squash every time a foot lands, a bounce in between
function stepPose(p) { const sw = Math.sin(p), land = Math.pow(Math.max(0, -Math.cos(2 * p)), 6); return { bend: sw * .17, tilt: -sw * .12, feet: [[sw * .16, Math.max(0, Math.cos(p)) * .14], [-sw * .16, Math.max(0, -Math.cos(p)) * .14]], arms: [[-.48, -.08 + sw * .16, -sw * .45], [.48, -.08 - sw * .16, sw * .45]], bob: Math.abs(Math.cos(p)) * .08, squash: land * .07 }; }
function waddle(t, sp = 7.5) { return stepPose(t * sp); }
const STRIDE = .3;   // ground covered per step, so feet don't slide
const walkPhase = dist => dist / STRIDE * Math.PI;
// Gary pushing the mower: hands on the grips, sleep-shuffling
function garyMowing(scene, mower, x, z, ry, t, extra = {}) { const p = t * 6, sw = Math.sin(p); mower.position.set(x + Math.cos(ry) * .95, 0, z - Math.sin(ry) * .95); mower.rotation.y = ry; mower.updateMatrixWorld(true);
  const pos = V(x, Math.abs(Math.cos(p)) * .03, z), gry = ry + Math.PI / 2; const hands = [1, -1].map(s => toLocal(mower.localToWorld(mower.userData.grip(s)), pos, gry));
  return place(scene, { ...GARY, hands, lean: .25, bend: sw * .05, nod: .15, feet: [[sw * .12, Math.max(0, Math.cos(p)) * .08], [-sw * .12, Math.max(0, -Math.cos(p)) * .08]], ...extra }, pos.x, pos.y, pos.z, gry); }

// ================= STEVE episode: extra noodle gear + props =================
const tagCache = {};
const tagT = (name = 'STEVE') => tagCache[name] || (tagCache[name] = ctex(160, 120, g => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 160, 120); g.fillStyle = '#e8323a'; g.fillRect(0, 0, 160, 44); g.fillRect(0, 108, 160, 12);
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.font = '900 26px Nunito'; g.fillText('HELLO', 80, 26); g.font = '900 13px Nunito'; g.fillText('my name is', 80, 40);
  g.fillStyle = '#16121a'; g.font = '900 38px Nunito'; g.fillText(name, 80, 90); g.strokeStyle = '#16121a'; g.lineWidth = 6; g.strokeRect(0, 0, 160, 120); }));
function gear(g, o, spine, head, HR, R) {
  if (o.tag) { const p = spine.getPoint(.5), t = new THREE.Mesh(new THREE.PlaneGeometry(.34, .26), new THREE.MeshBasicMaterial({ map: tagT(o.tag) })); t.position.set(p.x, p.y, p.z + R + .012); t.rotation.z = -(o.bend || 0) * .25; t.scale.setScalar(o.tagPop ?? 1); g.add(t); }
  if (o.sash) { const p = spine.getPoint(.48), s = inked(new THREE.BoxGeometry(.09, .75, .03), 0xe8323a, .01); s.position.set(p.x, p.y, p.z + R - .02); s.rotation.z = .7; g.add(s); }
  if (o.bag) { const p = spine.getPoint(.25), b = inked(new THREE.BoxGeometry(.32, .28, .14), 0x8a5a3a, .015); b.position.set(p.x + R + .08, p.y, p.z + .05); g.add(b); const st = inked(new THREE.BoxGeometry(.04, .9, .03), 0x6a4a2a, .008); const q = spine.getPoint(.55); st.position.set(q.x + .05, q.y, q.z + R - .01); st.rotation.z = -.65; g.add(st); }
  if (o.mustache) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(.035, .16, 4, 8), flat(INK)); m.rotation.z = Math.PI / 2; m.position.set(0, -.07, HR * .97); head.add(m); }
  if (o.hat === 'top') { const c = new THREE.Group(); c.position.y = HR * .78; head.add(c); c.add(at3(inked(new THREE.CylinderGeometry(.24, .24, .42, 18), 0x16121a, .015), 0, .22, 0)); c.add(at3(inked(new THREE.CylinderGeometry(.38, .38, .03, 20), 0x16121a, .012), 0, .02, 0)); c.add(at3(inked(new THREE.CylinderGeometry(.245, .245, .07, 18), 0xe8323a, .008), 0, .1, 0)); }
  if (o.hat === 'party') { const c = new THREE.Group(); c.position.set(.06, HR * .8, 0); c.rotation.z = -.25; head.add(c); c.add(at3(inked(new THREE.ConeGeometry(.17, .42, 14), o.hatColor || 0xff4a8a, .015), 0, .2, 0)); c.add(at3(inked(new THREE.SphereGeometry(.06, 8, 6), 0xffe21f, .01), 0, .43, 0)); }
  if (o.hat === 'mail') { const c = inked(new THREE.SphereGeometry(HR * 1.02, 24, 12, 0, Math.PI * 2, 0, Math.PI * .42), 0x2a5ab8, .02); c.position.y = .02; head.add(c); const brim = inked(new THREE.CylinderGeometry(.24, .24, .03, 20), 0x16121a, .015); brim.position.set(0, .2, .26); brim.scale.z = .8; brim.rotation.x = .25; head.add(brim); }
  if (o.headband) { const hb = inked(new THREE.TorusGeometry(HR * 1.0, .035, 8, 28), o.headband, .01); hb.rotation.x = Math.PI / 2; hb.position.y = .17; head.add(hb); }
  if (o.tears) for (const x of [-.13, .13]) for (let k = 0; k < 2; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), flat(0x5ab8ff)); const q = ((NOW * 1.6 + k * .5 + (x > 0 ? .25 : 0)) % 1); d.position.set(x * (1 + q * .2), -.02 - q * .35, HR * .97 - q * .08); d.scale.set(.8, 1.3, .8); head.add(d); }
  if (o.shades) { for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.15, .085, .03), flat(0x0e0c14)); l.position.set(s * .12, .06, HR * .97); head.add(l); } const br = new THREE.Mesh(new THREE.BoxGeometry(.1, .025, .02), flat(0x0e0c14)); br.position.set(0, .08, HR * .99); head.add(br); }
  if (o.hat === 'beret') { const c = inked(new THREE.SphereGeometry(HR * .95, 18, 10), o.hatColor || 0xc8323a, .014); c.scale.set(1.1, .32, 1.1); c.position.set(-.06, HR * .78, 0); c.rotation.z = .25; head.add(c); head.add(at3(inked(new THREE.CylinderGeometry(.02, .02, .07, 6), o.hatColor || 0xc8323a, .006), -.08, HR * .98, 0)); }
  if (o.epaulets) for (const s of [-1, 1]) { const p = spine.getPoint(.85), e = inked(new THREE.BoxGeometry(.16, .04, .14), 0xffc83a, .006); e.position.set(p.x + s * (R + .02), p.y, p.z); g.add(e); }
  if (o.wig) { const wc = o.wig === true ? 0xf2efe6 : o.wig; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) head.add(at3(inked(new THREE.SphereGeometry(.12, 10, 8), wc, .01), s * (.36 + j * .06), .12 - i * .16, -.06 - j * .12));
    const top = inked(new THREE.SphereGeometry(HR * 1.04, 20, 12, 0, Math.PI * 2, 0, Math.PI * .42), wc, .016); top.position.y = .03; head.add(top); for (let i = 0; i < 4; i++) head.add(at3(inked(new THREE.SphereGeometry(.13, 10, 8), wc, .01), -.27 + i * .18, .14, -.3)); }
  if (o.hat === 'tricorn') { const c = new THREE.Group(); c.position.y = HR * .82; c.rotation.y = Math.PI / 3; head.add(c); c.add(inked(new THREE.ConeGeometry(.52, .2, 3), o.hatColor || 0x24222c, .014)); c.add(at3(inked(new THREE.CylinderGeometry(.22, .26, .2, 14), o.hatColor || 0x24222c, .012), 0, .12, 0)); }
  if (o.hat === 'crown') { const c = new THREE.Group(); c.position.y = HR * .84; head.add(c); c.add(inked(new THREE.CylinderGeometry(.26, .26, .16, 16, 1, true), 0xffc83a, .012)); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.add(at3(inked(new THREE.ConeGeometry(.05, .14, 4), 0xffc83a, .008), Math.cos(a) * .25, .14, Math.sin(a) * .25)); } }
  if (o.patch) { const p = new THREE.Mesh(new THREE.CircleGeometry(.075, 12), flat(INK)); p.position.set(.13, .07, HR * .985); head.add(p); const st = inked(new THREE.TorusGeometry(HR * 1.0, .012, 4, 24), 0x16121a, .002); st.rotation.set(Math.PI / 2 - .2, 0, .35); st.position.y = .07; head.add(st); }
  if (o.beard) { const bd = inked(new THREE.SphereGeometry(HR * .7, 14, 10, 0, Math.PI * 2, Math.PI * .45, Math.PI * .5), o.beard === true ? 0x3a2a1a : o.beard, .01); bd.position.set(0, -.12, .12); head.add(bd); }
  if (o.cravat) { const p = spine.getPoint(.9), cv = inked(new THREE.ConeGeometry(.1, .2, 6), 0xffffff, .008); cv.rotation.x = Math.PI; cv.position.set(p.x, p.y - .05, p.z + R + .02); g.add(cv); }
  if (o.badge) { const p = spine.getPoint(.62), b = new THREE.Mesh(new THREE.CircleGeometry(.055, 5), flat(0xffd23a)); b.position.set(p.x - .11, p.y, p.z + R + .008); g.add(b); }
  if (o.hat === 'beanie') { const c = inked(new THREE.SphereGeometry(HR * 1.05, 24, 12, 0, Math.PI * 2, 0, Math.PI * .33), 0x24222c, .02); c.position.y = .02; head.add(c); const rim = inked(new THREE.TorusGeometry(HR * .91, .05, 8, 24), 0x24222c, .012); rim.rotation.x = Math.PI / 2; rim.position.y = .24; head.add(rim); }
  if (o.raincoat) { const rc = inked(new THREE.CylinderGeometry(R + .045, R + .14, .82, 18, 1, true), 0xffd23a, .02); rc.position.copy(spine.getPoint(.42)); g.add(rc);
    head.add(inked(new THREE.SphereGeometry(HR * 1.1, 20, 12, Math.PI / 2 + 1.0, Math.PI * 2 - 2.0, 0, Math.PI * .62), 0xffd23a, .018)); }
  if (o.mask) { const pv = new THREE.Group(); pv.position.set(0, HR * .75, 0); pv.rotation.x = -(o.maskUp || 0) * 1.35; head.add(pv); const mk = new THREE.Group(); mk.position.y = -HR * .75; pv.add(mk);
    mk.add(inked(new THREE.SphereGeometry(HR * 1.09, 24, 16, Math.PI / 2 - 1.05, 2.1, Math.PI * .12, Math.PI * .66), 0x8ad84a, .016));
    for (const x of [-.13, .13]) { const e = new THREE.Mesh(new THREE.CircleGeometry(.075, 3), flat(INK)); e.position.set(x, .08, HR * 1.1); e.rotation.z = x < 0 ? -Math.PI / 2 + .35 : -Math.PI / 2 - .35; mk.add(e); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.22, .05), flat(INK)); m.position.set(0, -.12, HR * 1.07); m.rotation.x = -.3; mk.add(m);
    for (let i = 0; i < 4; i++) { const tt = new THREE.Mesh(new THREE.PlaneGeometry(.032, .028), flat(0xffffff)); tt.position.set(-.075 + i * .05, -.106, HR * 1.075); tt.rotation.x = -.3; mk.add(tt); }
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(.16, .012), flat(INK)); sc.position.set(.08, .24, HR * 1.0); sc.rotation.set(-.6, 0, .3); mk.add(sc); }
  if (o.hat === 'pioneer') { const c = new THREE.Group(); c.position.y = HR * .8; head.add(c); c.add(at3(inked(new THREE.CylinderGeometry(.55, .55, .03, 20), 0x8a5a2a, .012), 0, 0, 0)); c.add(at3(inked(new THREE.CylinderGeometry(.22, .28, .3, 16), 0x8a5a2a, .015), 0, .15, 0)); }
}
const shake = (cam, t, a) => { cam.position.x += Math.sin(t * 91) * a; cam.position.y += Math.cos(t * 73) * a; };
const MARK = { color: 0xff8a2a, tuft: true, blush: true, shoe: 0x3a3a48 };
const NEIGH = { color: 0x38c8c0, tag: 'STEVE', shoe: 0x8a5a3a };
const MAIL = { color: 0x5aa8ff, tag: 'STEVE', hat: 'mail', bag: true, shoe: 0x16121a };
const BARBER = { color: 0xffc8a0, tag: 'STEVE', mustache: true, shoe: 0x16121a };
const MAYOR = { color: 0xffd23a, tag: 'STEVE', hat: 'top', sash: true, shoe: 0x16121a };
const PAL = [0xff6aa8, 0x38c8c0, 0xffd23a, 0x5aa8ff, 0xa87ae8, 0x7ad85a, 0xff8a6a, 0xc8a0ff, 0x6ae0c8, 0xffb04a];
const crowdOpt = (i, extra = {}) => ({ color: PAL[i % PAL.length], tag: 'STEVE', hat: [null, 'cap', null, 'party', null, 'top'][i % 6], hatColor: PAL[(i + 3) % PAL.length], glasses: i % 4 === 1, mustache: i % 5 === 2, tuft: i % 3 === 0, mouth: ['smile', 'grin', 'smile', 'smirk'][i % 4], ...extra });
function staticNoodle(scene, o, x, z, ry = 0, s = 1) { const g = noodle(o); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); g.userData.s0 = s; g.userData.seed = (x * 5.3 + z * 2.1) % 6.28; scene.add(g); statics.push(g); return g; }
function makeDog() { const g = new THREE.Group(), c = 0xc8864a; const b = inked(new THREE.CapsuleGeometry(.16, .42, 6, 12), c, .02); b.rotation.z = Math.PI / 2; b.position.y = .32; g.add(b);
  for (const [x, z] of [[-.2, -.09], [-.2, .09], [.2, -.09], [.2, .09]]) g.add(at3(inked(new THREE.CapsuleGeometry(.045, .14, 4, 8), c, .012), x, .13, z));
  const hd = new THREE.Group(); hd.position.set(.36, .52, 0); g.add(hd); hd.add(inked(new THREE.SphereGeometry(.17, 16, 12), c, .018)); hd.add(at3(inked(new THREE.SphereGeometry(.07, 10, 8), 0x16121a, .008), .16, -.02, 0));
  for (const z of [-.07, .07]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), flat(INK)); e.position.set(.13, .06, z); hd.add(e); const ear = inked(new THREE.CapsuleGeometry(.05, .14, 4, 8), 0x8a5a2a, .012); ear.position.set(-.02, .02, z * 2.3); ear.rotation.x = z > 0 ? -.4 : .4; hd.add(ear); }
  const tongue = at3(inked(new THREE.BoxGeometry(.03, .08, .05), 0xff6a8a, .006), .14, -.1, 0); hd.add(tongue);
  const col = inked(new THREE.TorusGeometry(.12, .025, 6, 16), 0xe8323a, .008); col.rotation.y = Math.PI / 2; col.position.set(.26, .42, 0); g.add(col);
  const tg = new THREE.Mesh(new THREE.PlaneGeometry(.2, .15), new THREE.MeshBasicMaterial({ map: tagT('STEVE') })); tg.position.set(.36, .32, .0); tg.rotation.y = Math.PI / 2; g.add(tg);
  const tail = new THREE.Group(); tail.position.set(-.36, .38, 0); g.add(tail); tail.add(at3(inked(new THREE.CapsuleGeometry(.03, .2, 4, 6), c, .01), 0, .12, 0)); g.userData = { tail, hd }; return g; }
function makeTruck(label = 'MOVING') { const g = new THREE.Group(); g.add(at3(box(3.0, 1.9, 1.6, 0xf6f6f6), 0, 1.25, 0)); g.add(at3(box(3.02, .25, 1.62, 0x3a8ad8, .015), 0, .9, 0)); g.add(at3(box(1.1, 1.3, 1.55, 0x3a8ad8), 2.05, .95, 0)); g.add(at3(box(.55, .55, 1.56, 0x9ad8ff, .012), 2.3, 1.25, 0));
  for (const [x, z] of [[-.9, .78], [-.9, -.78], [1.9, .78], [1.9, -.78]]) { const w = inked(new THREE.CylinderGeometry(.36, .36, .25, 14), 0x16161a, .015); w.rotation.x = Math.PI / 2; w.position.set(x, .36, z); g.add(w); }
  const s = sprite(label, '#3a8ad8', 1.4, 70); s.position.set(0, 1.5, .85); g.add(s); return g; }
function cardBox(s = .4) { const g = new THREE.Group(); g.add(at3(box(s, s * .8, s, 0xc8955a, .015), 0, 0, 0)); g.add(at3(box(s * .25, .01, s + .01, 0xe8c88a, .004), 0, s * .4, 0)); return g; }
function makeCake(withText = true) { const g = new THREE.Group(); g.add(at3(inked(new THREE.CylinderGeometry(.5, .5, .32, 24), 0xffc8e0, .015), 0, .16, 0)); g.add(at3(inked(new THREE.CylinderGeometry(.5, .5, .06, 24), 0xffffff, .01), 0, .34, 0));
  if (withText) { const t = new THREE.Mesh(new THREE.CircleGeometry(.44, 24), new THREE.MeshBasicMaterial({ map: ctex(256, 256, c => { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(128, 128, 128, 0, 7); c.fill(); c.fillStyle = '#e8323a'; c.textAlign = 'center'; c.font = '900 34px Nunito'; c.fillText('HAPPY', 128, 92); c.fillText('BIRTHDAY', 128, 132); c.font = '900 52px Nunito'; c.fillStyle = '#3a8ad8'; c.fillText('STEVE', 128, 186); }) })); t.rotation.x = -Math.PI / 2; t.position.y = .375; g.add(t); }
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(at3(inked(new THREE.CylinderGeometry(.018, .018, .16, 6), PAL[i], .006), Math.cos(a) * .38, .45, Math.sin(a) * .38)); const fl = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 6), flat(0xffd23a)); fl.scale.y = 1.6; fl.position.set(Math.cos(a) * .38, .56, Math.sin(a) * .38); g.add(fl); (g.userData.flames = g.userData.flames || []).push(fl); } return g; }
function store() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf2f6ff); scene.add(new THREE.HemisphereLight(0xffffff, 0xc8c8d0, 1.6)); const k = new THREE.DirectionalLight(0xffffff, 1.4); k.position.set(2, 8, 6); k.castShadow = true; k.shadow.mapSize.set(2048, 2048); Object.assign(k.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(k);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), toon(0xffffff, ctex(32, 32, g => { g.fillStyle = '#eef2f6'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#d6dde6'; g.fillRect(0, 0, 16, 16); g.fillRect(16, 16, 16, 16); }, [20, 20]))); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  const r = rng(6); for (const x of [-2.2, 2.2]) for (let z = -14; z < 4; z += 3.2) { scene.add(at3(box(1.0, 2.2, 3.0, 0xd8dce4, .02), x, 1.1, z)); for (let lv = 0; lv < 3; lv++) for (let i = 0; i < 6; i++) scene.add(at3(box(.22, .3, .3, PAL[(r() * 10) | 0], .01), x - Math.sign(x) * .55, .45 + lv * .65, z - 1.2 + i * .48)); }
  for (let z = -14; z < 4; z += 3) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.6, .06, .3), flat(0xffffff)); l.position.set(0, 3.4, z); scene.add(l); }
  scene.add(at3(box(30, 4, .3, 0xffe8b0, .02), 0, 2, -16)); const sg = sprite('GROCERY', '#e8323a', 2.4, 60); sg.position.set(0, 3.2, -15.7); scene.add(sg);
  return { scene };
}
function room(col = 0xfff0d8) { const scene = new THREE.Scene(); scene.background = new THREE.Color(col); scene.add(new THREE.HemisphereLight(0xffffff, 0xc8b8a8, 1.5)); const k = new THREE.DirectionalLight(0xfff2e0, 1.6); k.position.set(3, 6, 5); k.castShadow = true; k.shadow.mapSize.set(1024, 1024); scene.add(k);
  scene.add(at3(box(12, .1, 10, 0xc8a07a, .02), 0, -.05, 0)); scene.add(at3(box(12, 4.5, .2, col, .02), 0, 2.2, -3)); return { scene }; }
// ===================== NEWSPAPER: cast, props, SHOTS =====================
const talkIf = (tc, a, b) => tc >= tm(a) - .03 && tc <= tm(b) ? talkShape(tc) : null;
function walkTo(scene, o, x0, z0, x1, z1, k, t, ry) { const x = lerp(x0, x1, k), z = lerp(z0, z1, k), wd = stepPose(walkPhase(Math.hypot(x - x0, z - z0))), moving = k > 0 && k < 1; return place(scene, { ...o, ...(moving ? wd : {}), arms: moving ? wd.arms : o.arms }, x, moving ? wd.bob : 0, z, ry); }
function card(w, h, draw, pw = 256) { const ph = Math.round(pw * h / w); const D = document.createElement('canvas'); D.width = pw; D.height = ph; const g = D.getContext('2d'); const T = new THREE.CanvasTexture(D); T.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: T, side: THREE.DoubleSide }));
  m.userData.draw = (...a) => { g.clearRect(0, 0, pw, ph); draw(g, pw, ph, ...a); T.needsUpdate = true; }; m.userData.draw(); return m; }
// camera in front of a noodle's face (d = distance, side = sideways offset)
function faceCam(cam, g, d = 1.8, side = 0, up = .1, dy = -.15) { g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, -.2, 0)), a = g.rotation.y, fw = V(Math.sin(a), 0, Math.cos(a)), rt = V(Math.cos(a), 0, -Math.sin(a));
  look(cam, hp.x + fw.x * d + rt.x * side, hp.y + up, hp.z + fw.z * d + rt.z * side, hp.x, hp.y + dy, hp.z); return hp; }
function lights(S) { S.hemi = S.scene.children.find(o => o.isHemisphereLight); return S; }
function dayNight(S, night) { S.scene.background = night ? SKY.night : SKY.day; S.hemi.intensity = night ? .7 : 1.3; S.hemi.color.set(night ? 0x5a6ab8 : 0xffffff); S.sun.intensity = night ? .8 : 2.4; S.sun.color.set(night ? 0x8aa8ff : 0xfff6e0); S.scene.fog.color.set(night ? 0x1a2058 : 0xc8ecff); }
function darkWindows(house) { for (const i of [3, 4]) house.children[i].children[0].material.color.set(0x2a3050); }

// ---------- cast ----------
const HS = { lees: HX.patel, millers: HX.dave, parkers: HX.gary, walt: HX.orange };
const WALT = { color: 0xc4ccdc, glasses: true, mustache: true, robe: 0x9a2a3a, shoe: 0x7a5a4a, eyes: 'half', mouth: 'flat' };
const COSTUME = { ...WALT, robe: null, raincoat: true, mask: true };
const COP = { color: 0xffd0a8, hat: 'mail', badge: true, shoe: 0x16121a, eyes: 'half', mouth: 'flat' };
const KID = { color: 0x7ad85a, hat: 'cap', hatColor: 0xe8323a, shoe: 0xffffff };
const BURG = { color: 0x9a9ab0, pj: true, pjMap: 'burglar', limb: 0x24222c, hat: 'beanie', shoe: 0x16121a, eyes: 'half', mouth: 'smirk' };
const MILLER = [{ color: 0xff8a6a, hat: 'cap', hatColor: 0x3a8ad8, glasses: true }, { color: 0xffd23a, blush: true }, { color: 0x6ae0c8, tuft: true }];
const NBC = [0xff6aa8, 0x38c8c0, 0xffd23a, 0x5aa8ff, 0xa87ae8, 0x7ad85a, 0xff8a6a, 0xffb04a];
const nb = (i, extra = {}) => ({ color: NBC[i % NBC.length], hat: [null, 'cap', null, null, 'cap'][i % 5], hatColor: NBC[(i + 3) % NBC.length], glasses: i % 4 === 1, mustache: i % 5 === 2, tuft: i % 3 === 0, curlers: i % 6 === 4, robe: [null, 0x3a6ad8, null, 0xff8ab8, null, 0x7a4ac8][i % 6], shoe: 0x3a3a48, mouth: 'smile', ...extra });

// ---------- props ----------
function paper() { const g = new THREE.Group(); const c = inked(new THREE.CylinderGeometry(.055, .055, .34, 12), 0xece6d6, .01); c.rotation.z = Math.PI / 2; g.add(c); const band = inked(new THREE.TorusGeometry(.058, .012, 6, 14), 0xe8323a, .004); band.rotation.y = Math.PI / 2; g.add(band); return g; }
function paperPile(n, seed = 1) { const g = new THREE.Group(), r = rng(seed), items = [], s0 = Math.max(3, Math.round(Math.sqrt(n * 1.3))); let L = 0, k = 0;
  const rowN = l => Math.max(1, s0 - Math.ceil(l / 2));
  for (let i = 0; i < n; i++) { if (k >= rowN(L)) { L++; k = 0; } const cnt = rowN(L); const p = paper(); p.position.set((r() - .5) * .08, .055 + L * .095, (k - (cnt - 1) / 2) * .112 + (L % 2) * .02); p.rotation.y = (r() - .5) * .35; g.add(p); items.push(p); k++; }
  g.userData.setN = m => items.forEach((p, i) => p.visible = i < m); g.userData.top = m => .1 + Math.floor(Math.max(0, m - 1) / s0) * .095; return g; }
function wagon() { const g = new THREE.Group(); g.add(at3(box(.8, .22, .48, 0xe8323a, .015), 0, .3, 0));
  for (const [x, z] of [[-.28, -.26], [-.28, .26], [.28, -.26], [.28, .26]]) { const w = inked(new THREE.CylinderGeometry(.1, .1, .05, 12), 0x16161a, .01); w.rotation.x = Math.PI / 2; w.position.set(x, .1, z); g.add(w); }
  g.add(curveTube([V(.4, .3, 0), V(.68, .42, 0), V(.85, .6, 0)], .02, 0x2a2a30, .008));
  const load = new THREE.Group(); load.position.y = .44; g.add(load); const items = [], r = rng(3);
  for (let i = 0; i < 16; i++) { const p = paper(); const layer = Math.floor(i / 6); p.position.set((r() - .5) * .3, layer * .085, ((i % 6) - 2.5) * .07); p.rotation.y = (r() - .5) * .5; p.scale.setScalar(.9); load.add(p); items.push(p); }
  g.userData.fill = n => items.forEach((p, i) => p.visible = i < n); g.userData.fill(0); return g; }   // handle points +x
function secCam() { const g = new THREE.Group(); g.add(at3(box(.08, .08, .12, 0xf2f2f2, .008), 0, 0, .02)); const b = inked(new THREE.CylinderGeometry(.06, .07, .22, 12), 0xf6f6f6, .01); b.rotation.x = Math.PI / 2; b.position.z = .14; g.add(b);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.045, 14), flat(0x16121a)); lens.position.z = .252; g.add(lens); const led = new THREE.Mesh(new THREE.SphereGeometry(.016, 6, 6), flat(0xff2020)); led.position.set(.04, .045, .22); g.add(led); g.userData.led = led; return g; }
function car(col, police) { const g = new THREE.Group(); g.add(at3(box(2.4, .45, 1.15, col), 0, .5, 0));
  if (police) { g.add(at3(box(2.42, .2, 1.17, 0x1a1a2a, .012), 0, .36, 0)); g.add(at3(box(1.3, .42, 1.05, col), -.1, .93, 0)); g.add(at3(box(1.22, .3, 1.07, 0x9ad8ff, .01), -.1, .95, 0));
    const red = at3(box(.26, .12, .3, 0xff2a2a, .01), -.25, 1.2, 0), blue = at3(box(.26, .12, .3, 0x2a5aff, .01), .05, 1.2, 0); g.add(red, blue); g.userData.red = red; g.userData.blue = blue; const s = sprite('POLICE', '#2a3a8a', 1.1, 60); s.position.set(0, .52, .64); g.add(s); }
  else { const ws = at3(box(.06, .35, 1.0, 0x9ad8ff, .01), .55, .9, 0); ws.rotation.z = -.35; g.add(ws); for (const [x, z, w, h, cc] of [[-1.0, -.25, .3, .3, 0xe8323a], [-1.0, .2, .28, .38, 0xffd23a]]) g.add(at3(box(w, h, .32, cc, .01), x, .72 + h / 2, z)); }
  for (const [x, z] of [[-.8, .58], [-.8, -.58], [.8, .58], [.8, -.58]]) { const w = inked(new THREE.CylinderGeometry(.24, .24, .18, 14), 0x16161a, .012); w.rotation.x = Math.PI / 2; w.position.set(x, .24, z); g.add(w); } return g; }   // faces +x
function mug() { const g = new THREE.Group(); g.add(inked(new THREE.CylinderGeometry(.06, .055, .12, 12), 0xffffff, .008)); const h = inked(new THREE.TorusGeometry(.035, .012, 6, 10), 0xffffff, .005); h.position.x = .07; g.add(h); return g; }
function binos() { const g = new THREE.Group(); for (const x of [-.07, .07]) { const c = inked(new THREE.CylinderGeometry(.05, .055, .16, 10), 0x24222c, .01); c.rotation.x = Math.PI / 2; c.position.x = x; g.add(c); } return g; }
function tv() { const g = new THREE.Group(); g.add(box(.7, .45, .08, 0x24222c, .012)); const s = new THREE.Mesh(new THREE.PlaneGeometry(.62, .37), flat(0x3a5a7a)); s.position.z = .045; g.add(s); return g; }
function lamp() { const g = new THREE.Group(); g.add(at3(inked(new THREE.CylinderGeometry(.03, .03, .7, 8), 0xc8a050, .008), 0, .35, 0)); g.add(at3(inked(new THREE.CylinderGeometry(.12, .2, .22, 14, 1, true), 0xffe8a0, .01), 0, .75, 0)); g.add(at3(inked(new THREE.CylinderGeometry(.12, .12, .04, 12), 0xc8a050, .008), 0, 0, 0)); return g; }
function fishbowl() { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.SphereGeometry(.17, 18, 14), new THREE.MeshToonMaterial({ color: 0x8ad8ff, gradientMap: ramp, transparent: true, opacity: .55 }))); g.add(new THREE.Mesh(new THREE.SphereGeometry(.17, 18, 14), inkMat(.006)));
  const fish = inked(new THREE.SphereGeometry(.045, 10, 8), 0xff8a2a, .006); fish.scale.set(1.5, 1, .8); g.add(fish); g.userData.fish = fish; return g; }
function rocker() { const g = new THREE.Group(), c = 0x9a6a3a; g.add(at3(box(.62, .07, .55, c, .012), 0, .45, 0)); g.add(at3(box(.62, .75, .07, c, .012), 0, .84, -.25));
  for (const x of [-.28, .28]) { g.add(at3(box(.05, .42, .05, c, .008), x, .23, .2)); g.add(at3(box(.05, .42, .05, c, .008), x, .23, -.2)); g.add(curveTube([V(x, .03, -.42), V(x, -.02, 0), V(x, .03, .42)], .025, 0x7a4a2a, .008)); } return g; }
function armchair() { const g = new THREE.Group(), c = 0x3a8a7a; g.add(at3(box(.95, .45, .8, c), 0, .22, 0)); g.add(at3(box(.95, .85, .2, c), 0, .68, -.35)); for (const x of [-.48, .48]) g.add(at3(box(.18, .35, .8, c), x, .58, 0)); return g; }
const stackT = ctex(32, 64, g => { g.fillStyle = '#efe9da'; g.fillRect(0, 0, 32, 64); for (let y = 0; y < 64; y += 4) { g.fillStyle = y % 8 ? '#cfc6b2' : '#b0a690'; g.fillRect(0, y, 32, 1); } });
function stack(h) { const t = stackT.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, h * 2.5); t.needsUpdate = true; return inked(new THREE.BoxGeometry(.42, h, .32), 0xffffff, .012, t); }
function shards(scene) { const ps = [...Array(10)].map((_, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(.06 + (i % 3) * .025, 3), new THREE.MeshBasicMaterial({ color: 0xd8f4ff, side: THREE.DoubleSide })); m.visible = false; scene.add(m); return m; });
  return { update(u, p) { ps.forEach((m, i) => { m.visible = u > 0 && u < 1.0; if (!m.visible) return; const a = i * 2.4, sp = 1.4 + (i % 4) * .45; m.position.set(p.x + Math.cos(a) * sp * u * .7, p.y + Math.sin(a) * .25 + sp * u * .8 - 4.9 * u * u, p.z + .1 + sp * u); m.rotation.set(u * 9 + i, u * 7, i); }); } }; }
// a newspaper flying from a to b along an arc (u: 0..1)
function flyPaper(p, a, b, u, hgt = 1.8) { p.visible = true; p.position.lerpVectors(a, b, u); p.position.y += Math.sin(u * Math.PI) * hgt; p.rotation.set(u * 11, u * 2, 0); }
const porchP = hx => V(hx + .3, .06, -4.35);


// ===================== BOXING: cast, sets, fast-changing faces =====================
const BEN = { color: 0x5aa8ff, tuft: true, shoe: 0x3a3a48 };
const BENNY = { ...BEN, robe: 0xe8323a, gloves: 0xe8323a, shoe: 0xf2f2f2 };
const CHAMP = { color: 0x8a5ad8, mustache: true, robe: 0x24222c, beltColor: 0xffd23a, beltW: .06, gloves: 0xffd23a, shoe: 0x16121a };
const WIFE = { color: 0xff6aa8, blush: true, shoe: 0xffffff };
const REF = { color: 0xffd0a8, pj: true, pjMap: 'burglar', limb: 0x24222c, hat: 'cap', hatColor: 0x24222c, shoe: 0x16121a };
const EX = { happy: { eyes: 'happy', mouth: 'grin' }, smile: { eyes: 'open', mouth: 'smile' }, sad: { eyes: 'half', mouth: 'frown', brow: -.4 }, shock: { eyes: 'wide', mouth: 'o', brow: -.25 },
  angry: { eyes: 'open', mouth: 'flat', brow: .45 }, smug: { eyes: 'half', mouth: 'smirk', brow: .2 }, dazed: { eyes: 'closed', mouth: 'wavy' }, scream: { eyes: 'wide', mouth: 'scream', brow: .35 },
  cry: { eyes: 'closed', mouth: 'wavy', brow: -.45, tears: true }, laugh: { eyes: 'happy', mouth: 'open' }, determined: { eyes: 'half', mouth: 'flat', brow: .5 }, deadpan: { eyes: 'half', mouth: 'flat' }, gross: { eyes: 'closed', mouth: 'wavy', brow: .3 } };
// expression timeline: [[localSeconds, 'name'], ...] - snaps to the new face with a quick squash-and-stretch pop
function fx(f, seq) { let cur = seq[0][1], tc = -9; for (const [a, n] of seq) if (f >= a) { cur = n; tc = a; } const p = f - tc; return { ...EX[cur], squash: p >= 0 && p < .3 ? -.12 * Math.exp(-p * 12) * Math.cos(p * 28) : 0 }; }
const sweepCam = (cam, f, fd, a, b) => { const k = ss(0, fd, f); look(cam, lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k), lerp(a[4], b[4], k), lerp(a[5], b[5], k)); };
const big = (g, s = 1.35) => { g.scale.multiplyScalar(s); return g; };
const lieDown = (g, y) => { g.rotation.x = -Math.PI / 2; g.position.y = y; return g; };
const GUARD = [[-.22, .75, .5], [.22, .8, .55]];
const RT = .64;   // top of the ring canvas
function textCard(w, h, draw, pw = 512) { return card(w, h, draw, pw); }
function ring(o = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0a16); scene.fog = new THREE.Fog(0x0c0a16, 12, 30);
  const hemi = new THREE.HemisphereLight(0x8a7ad8, 0x1a1626, .6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, .4); sun.position.set(3, 10, 6); scene.add(sun, sun.target);
  const spot = new THREE.SpotLight(0xfff2d8, 420, 30, .5, .55, 1.3); spot.position.set(0, 9, 0); spot.target.position.set(0, RT, 0); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); scene.add(spot, spot.target);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), toon(0x1a1626)); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  scene.add(at3(box(5.6, .6, 5.6, 0x24222c, .02), 0, .3, 0)); const mat_ = at3(box(5.3, .04, 5.3, o.canvas || 0x3a7ae8, .012), 0, .62, 0); scene.add(mat_);
  for (const [x, z, c] of [[-2.6, -2.6, 0xe8323a], [2.6, -2.6, 0x3a6ad8], [-2.6, 2.6, 0xf2f2f2], [2.6, 2.6, 0xf2f2f2]]) scene.add(at3(box(.18, 1.7, .18, c, .012), x, RT + .8, z));
  for (const h of [.42, .78, 1.14]) { for (const s of [-1, 1]) { scene.add(at3(box(5.2, .045, .045, 0xe8323a, .006), 0, RT + h, s * 2.6)); scene.add(at3(box(.045, .045, 5.2, 0xe8323a, .006), s * 2.6, RT + h, 0)); } }
  // the crowd: dark rows of noodle silhouettes all around, a few phone flashes
  const r = rng(o.seed || 3), N = 170, bodyG = new THREE.CapsuleGeometry(.24, .5, 4, 8), headG = new THREE.SphereGeometry(.3, 10, 8), m4 = new THREE.Matrix4();
  const bodies = new THREE.InstancedMesh(bodyG, toon(0xffffff), N), heads = new THREE.InstancedMesh(headG, toon(0xffffff), N); const seats = [];
  for (let i = 0; i < N; i++) { const row = i % 5, a = (i / N) * Math.PI * 2 + r() * .05, rad = 4.6 + row * .9, x = Math.cos(a) * rad, z = Math.sin(a) * rad, y = row * .35; seats.push([x, y, z]);
    const c = new THREE.Color(PAL[(r() * 10) | 0]).multiplyScalar(.35 + r() * .2); m4.makeTranslation(x, y + .55, z); bodies.setMatrixAt(i, m4); bodies.setColorAt(i, c); m4.makeTranslation(x, y + 1.25, z); heads.setMatrixAt(i, m4); heads.setColorAt(i, c); }
  scene.add(bodies, heads); for (let row = 0; row < 5; row++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(4.6 + row * .9 + .45, 4.6 + row * .9 + .45, row * .35 + .05, 48, 1, true), toon(0x15121e)); st.position.y = (row * .35) / 2; scene.add(st); }
  const flashes = [...Array(14)].map((_, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(.09, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); const s = seats[(i * 37) % N]; m.position.set(s[0] * .97, s[1] + 1.4, s[2] * .97); m.lookAt(0, 1.5, 0); scene.add(m); return m; });
  const rig = new THREE.Group(); rig.position.y = 6.5; scene.add(rig); rig.add(box(4, .15, 4, 0x24222c, .01)); for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) rig.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .5), flat(0xfff2c8)), x, -.1, z));
  const banner = textCard(7, 1.6, (g, w, h, yr = 2019) => { g.fillStyle = '#e8323a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23a'; g.fillRect(0, h * .82, w, h * .18); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `900 ${h * .42}px Nunito`; g.fillText('BENNY vs THE CHAMP', w / 2, h * .5); g.font = `900 ${h * .22}px Nunito`; g.fillStyle = '#16121a'; g.fillText('FIGHT NIGHT ' + yr, w / 2, h * .97); });
  banner.position.set(0, 5.2, -9.5); scene.add(banner);
  return { scene, spot, hemi, banner, mat: mat_, tick(t) { flashes.forEach((m, i) => m.visible = Math.sin(t * 7.3 + i * 4.1) > .93); } };
}
function room2(col, floorCol = 0xc8a07a) { const R = room(col); return R; }
function couch(col) { const g = new THREE.Group(); g.add(at3(box(1.7, .42, .8, col), 0, .21, 0)); g.add(at3(box(1.7, .6, .2, col), 0, .6, -.32)); for (const s of [-1, 1]) g.add(at3(box(.2, .55, .8, col), s * .8, .35, 0)); return g; }
function shoebox() { const g = new THREE.Group(); g.add(at3(box(.56, .24, .34, 0xc8955a, .012), 0, .12, 0)); const lid = new THREE.Group(); lid.position.set(0, .25, -.17); g.add(lid); lid.add(at3(box(.6, .06, .37, 0xb0804a, .012), 0, 0, .17));
  const cash = new THREE.Group(); g.add(cash); for (let i = 0; i < 6; i++) cash.add(at3(box(.15, .07, .08, 0x3a9a4a, .006), -.18 + (i % 3) * .18, .2 + Math.floor(i / 3) * .04, -.06 + Math.floor(i / 3) * .1));
  g.userData = { lid, cash }; return g; }
function bellProp() { const g = new THREE.Group(); g.add(at3(box(.7, .5, .5, 0x3a2a22), 0, .25, 0)); const b = inked(new THREE.SphereGeometry(.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xffc83a, .01); b.position.y = .5; g.add(b); const ham = new THREE.Group(); ham.position.set(.35, .6, 0); g.add(ham); ham.add(at3(box(.04, .4, .04, 0x5a3a22, .006), 0, .2, 0)); ham.add(at3(box(.12, .08, .08, 0x9a9aa8, .006), 0, .42, 0)); g.userData.ham = ham; return g; }
function meatSlab() { const g = new THREE.Group(); g.add(at3(box(.04, .8, .04, 0x9a9aa8, .004), 0, 2.6, 0)); g.add(at3(box(.45, .8, .25, 0xd84a5a, .012), 0, 1.85, 0)); g.add(at3(box(.3, .1, .26, 0xf2e0d8, .008), 0, 1.7, 0)); return g; }
const flipYear = (b, yr) => { if (b.userData.yr !== yr) { b.userData.draw(yr); b.userData.yr = yr; } };

// ===================== BISCUIT: the cat, the family, the sets =====================
const DAD = { color: 0x38c8c0, mustache: true, shoe: 0x5a4a3a };
const MOM = { color: 0xffd23a, blush: true, shoe: 0xffffff };
const KIDO = { color: 0xff8a6a, tuft: true, shoe: 0x3a3a48 };
const VET = { color: 0xffb04a, glasses: true, robe: 0xffffff, shoe: 0x16121a };
const LADY = { color: 0xc8a0ff, glasses: true, curlers: true, robe: 0xff8ab8, shoe: 0xffffff };
// a camera that glides through several framings in one take: keys = [[t, px,py,pz, tx,ty,tz], ...]
function path(cam, f, keys) { let i = 0; while (i < keys.length - 2 && f > keys[i + 1][0]) i++; const a = keys[i], b = keys[i + 1], k = ss(a[0], b[0], f);
  look(cam, ...[1, 2, 3, 4, 5, 6].map(j => lerp(a[j], b[j], k))); }
// ---- Biscuit: an orange tabby whose belly grows with `fat` (0 = normal, 2.5 = beanbag) ----
function makeCat(fat = 0, o = {}) {
  const g = new THREE.Group(), C = 0xf0a040, D = 0xc8742a, Wt = 0xfff4e8, sx = 1 + fat, sy = 1 + fat * .75, sz = 1 + fat * .45;
  const body = inked(new THREE.SphereGeometry(.3, 20, 16), C, .016); body.scale.set(.95 * sx, .78 * sy, 1.3 * sz); body.position.y = .3 + .22 * fat * .6; g.add(body);
  const belly = inked(new THREE.SphereGeometry(.22, 16, 12), Wt, .012); belly.scale.set(.9 * sx, .7 * sy, 1.1 * sz); belly.position.set(0, body.position.y - .07 * sy, .08 * sz); g.add(belly);
  for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.TorusGeometry(.29 * sx, .022, 6, 20, Math.PI), flat(D)); st.position.set(0, body.position.y, (-.15 + i * .14) * sz); st.scale.set(1, .78 * sy / sx, 1); g.add(st); }
  const legs = []; for (const [x, z] of [[-.14, .24], [.14, .24], [-.14, -.24], [.14, -.24]]) { const l = new THREE.Group(); l.position.set(x * sx, .16, z * sz); g.add(l); l.add(at3(inked(new THREE.CapsuleGeometry(.055, .1, 4, 8), C, .01), 0, -.06, 0)); l.add(at3(inked(new THREE.SphereGeometry(.065, 10, 8), Wt, .008), 0, -.14, .02)); legs.push(l); }
  const head = new THREE.Group(); head.position.set(0, .52 + fat * .2, .36 * sz + .05); g.add(head);
  const sk = inked(new THREE.SphereGeometry(.22, 18, 14), C, .014); sk.scale.set(1.15 + fat * .12, 1, 1); head.add(sk);
  head.add(at3(inked(new THREE.SphereGeometry(.1, 12, 10), Wt, .008), 0, -.06, .16)); head.children[head.children.length - 1].scale.set(1.4, .8, .7);
  head.add(at3(new THREE.Mesh(new THREE.SphereGeometry(.028, 8, 6), flat(0xff7a9a)), 0, -.01, .225));
  for (const s of [-1, 1]) { const e = inked(new THREE.ConeGeometry(.085, .16, 4), C, .01); e.position.set(s * .14, .18, -.02); e.rotation.z = -s * .35; head.add(e); const ei = new THREE.Mesh(new THREE.ConeGeometry(.045, .09, 4), flat(0xff9ab0)); ei.position.set(s * .14, .17, .02); ei.rotation.z = -s * .35; head.add(ei);
    for (const a of [-.15, .05]) { const w = new THREE.Mesh(new THREE.BoxGeometry(.16, .006, .006), flat(INK)); w.position.set(s * .17, -.04 + a * .2, .17); w.rotation.z = s * a; head.add(w); } }
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.025, .07, .01), flat(D)); b.position.set(-.04 + i * .04, .17, .19); b.rotation.x = -.6; head.add(b); }
  const eyes = [-1, 1].map(s => { const e = new THREE.Group(); e.position.set(s * .085, .04, .19); head.add(e); const b = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), flat(INK)); b.scale.set(.85, 1.2, .5); e.add(b); const gl = new THREE.Mesh(new THREE.SphereGeometry(.014, 6, 6), flat(0xffffff)); gl.position.set(.012, .02, .02); e.add(gl); return e; });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), flat(0x6a1a2a)); mouth.position.set(0, -.085, .2); mouth.scale.set(1.2, .2, .4); head.add(mouth);
  const tail = new THREE.Group(); tail.position.set(0, body.position.y + .1, -.36 * sz); g.add(tail); tail.add(curveTube([V(0, 0, 0), V(0, .25, -.18), V(0, .45, -.08)], .045, C, .01));
  let cam = null; if (o.collar) { const c = inked(new THREE.TorusGeometry(.13, .025, 6, 18), 0xe8323a, .006); c.rotation.x = Math.PI / 2 - .3; c.position.set(0, -.16, .05); head.add(c); if (o.cam) { cam = at3(box(.07, .05, .05, 0x24222c, .006), 0, -.2, .17); head.add(cam); cam.add(at3(new THREE.Mesh(new THREE.SphereGeometry(.012, 6, 6), flat(0xff2020)), .02, .02, .028)); } }
  g.userData = { head, tail, legs, eyes, mouth, body,
    face(kind = 'open', m = 'flat') { const s = { open: [1, 1], half: [1, .45], closed: [1, .1], wide: [1.25, 1.4], happy: [1.1, .2] }[kind] || [1, 1]; eyes.forEach(e => e.scale.set(s[0], s[1], 1)); mouth.scale.set(m === 'open' ? 1.4 : 1.2, m === 'open' ? 1.6 : .2, .4); },
    anim(t, walk = 0) { tail.rotation.x = Math.sin(t * 2.2) * .25; tail.rotation.z = Math.sin(t * 1.7) * .3; legs.forEach((l, i) => l.rotation.x = walk * Math.sin(t * 12 + (i === 0 || i === 3 ? 0 : Math.PI)) * .6); g.position.y = walk * Math.abs(Math.sin(t * 12)) * .02; const bl = ((t + .7) % 3.3) < .1; if (bl) eyes.forEach(e => e.scale.y = .1); } };
  return g;
}
const catFace = (c, f, seq) => { let cur = seq[0][1], tc = -9; for (const [a, n] of seq) if (f >= a) { cur = n; tc = a; } const [eyesK, m] = cur.split(':'); c.userData.face(eyesK, m || 'flat'); const p = f - tc; const sq = p >= 0 && p < .3 ? .1 * Math.exp(-p * 12) * Math.cos(p * 28) : 0; c.userData.head.scale.set(1 + sq, 1 - sq, 1 + sq); };
// ---- the house kitchen: back wall with a cat door, fridge, counter, table ----
function kitchen(night = false) { const R = room(night ? 0x2a3060 : 0xfff0d8); const sc = R.scene; if (night) { sc.children.filter(o => o.isHemisphereLight || o.isDirectionalLight).forEach(l => l.intensity *= .35); const moon = new THREE.PointLight(0x8aa8ff, 8, 10); moon.position.set(1.5, 2.5, 1); sc.add(moon); }
  const cd = new THREE.Group(); cd.position.set(-.6, 0, -2.88); sc.add(cd); cd.add(at3(box(.56, .52, .1, 0x5a4a3a, .012), 0, .29, 0)); const flap = new THREE.Group(); flap.position.set(0, .5, .06); cd.add(flap); flap.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.42, .4, .02), toon(0x9ad8ff)), 0, -.2, 0));
  const fridge = new THREE.Group(); fridge.position.set(1.7, 0, -2.4); sc.add(fridge); fridge.add(at3(box(.9, 2.0, .7, 0xf2f6ff), 0, 1.0, 0)); fridge.add(at3(box(.05, .5, .06, 0x9a9aa8, .006), -.32, 1.3, .38));
  sc.add(at3(box(1.6, .9, .6, 0xd8c8b0), -2.0, .45, -2.5)); const tbl = new THREE.Group(); tbl.position.set(.2, 0, -.6); sc.add(tbl); tbl.add(at3(box(1.6, .08, .9, 0x9a6a3a), 0, .78, 0)); for (const [x, z] of [[-.7, -.35], [.7, -.35], [-.7, .35], [.7, .35]]) tbl.add(at3(box(.07, .76, .07, 0x7a4a2a, .006), x, .38, z));
  return { scene: sc, flap, fridge, tbl }; }
const bowl = (r = .16, col = 0x3a8ad8) => { const g = new THREE.Group(); g.add(inked(new THREE.CylinderGeometry(r, r * .8, r * .55, 16), col, .01)); g.children[0].position.y = r * .27; return g; };
function labelCard(txt, w = .5, h = .22, bg = '#ffffff', fg = '#e8323a') { return card(w, h, (g, W2, H2) => { g.fillStyle = bg; g.fillRect(0, 0, W2, H2); g.fillStyle = fg; g.textAlign = 'center'; g.font = `900 ${H2 * .55}px Nunito`; g.fillText(txt, W2 / 2, H2 * .72); g.strokeStyle = '#16121a'; g.lineWidth = 6; g.strokeRect(0, 0, W2, H2); }, 256); }

function studio(bg) { const scene = new THREE.Scene(); scene.background = new THREE.Color(bg); scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b0a0, 1.6)); const k = new THREE.DirectionalLight(0xffffff, 1.6); k.position.set(2, 5, 5); k.castShadow = true; scene.add(k); const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), toon(new THREE.Color(bg).multiplyScalar(.85).getHex())); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl); return { scene }; }
function beam(scene, col, r = 1.1, L = 10) { const g = new THREE.Group(); const geo = new THREE.ConeGeometry(r, L, 20, 1, true); geo.translate(0, -L / 2, 0); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); g.add(m); scene.add(g);
  return { g, aim(from, to, on = 1) { g.position.copy(from); g.quaternion.setFromUnitVectors(V(0, -1, 0), to.clone().sub(from).normalize()); g.visible = on > .01; m.material.opacity = .16 * on; } }; }
// ===================== WHY COINS HAVE RIDGES: 1690s London =====================
const CLIP = { color: 0xd8b088, hat: 'tricorn', hatColor: 0x3a2a1a, beard: 0x4a3a2a, robe: 0x3a5a3a, shoe: 0x2a1a12, eyes: 'half', mouth: 'smirk' };
const NEWT = { color: 0xffd8b0, wig: true, robe: 0x2a2a48, cravat: true, shoe: 0x16121a };
const GANG = [{ color: 0x9a9ab0, hat: 'tricorn', hatColor: 0x24222c, patch: true, robe: 0x5a3a2a }, { color: 0xd8a070, hat: 'cap', hatColor: 0x6a4a2a, beard: true, robe: 0x3a3a48 }, { color: 0xa0c8a0, hat: 'tricorn', hatColor: 0x5a2a2a, mustache: true, robe: 0x4a2a3a }];
const KING = { color: 0xffc8a0, hat: 'crown', robe: 0xa82a3a, beltColor: 0xffc83a, mustache: true, wig: 0x8a5a3a, shoe: 0x16121a };
const BAKER = { color: 0xffe0b0, hat: 'sleep', hatColor: 0xffffff, robe: 0xffffff, blush: true };
const SHOP = { color: 0xd8b8f0, glasses: true, mustache: true, robe: 0x7a5a3a };
const KIDM = { color: 0x5aa8ff, hat: 'cap', hatColor: 0xe8323a, shoe: 0xffffff };
// ---- coins: real 2D outlines, extruded. 'plain', 'clipped' (a chord cut off), 'ridged' (teeth all round), 'ridgedCut' (teeth shaved off one side) ----
const coinFaceT = (txt = 'GVLIELMVS III') => ctex(256, 256, g => { g.fillStyle = '#d8dce8'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#9aa0b0'; g.beginPath(); g.arc(128, 118, 54, 0, 7); g.fill(); g.beginPath(); g.moveTo(178, 112); g.lineTo(198, 128); g.lineTo(176, 134); g.fill(); g.fillRect(96, 160, 64, 40);
  g.font = '900 22px Nunito'; g.fillStyle = '#6a7080'; g.textAlign = 'center'; for (let i = 0; i < txt.length; i++) { const a = -Math.PI * .85 + i / (txt.length - 1) * Math.PI * .7 * 2.4 / 2.4 * 1.0; g.save(); g.translate(128 + Math.cos(a - .1) * 100, 128 + Math.sin(a - .1) * 100); g.rotate(a + Math.PI / 2); g.fillText(txt[i], 0, 0); g.restore(); } });
const COINT = { old: coinFaceT(), new: coinFaceT('LIBERTY 25'), };
function coinShape(kind, r) { const sh = new THREE.Shape(), ridged = kind.startsWith('ridged'), cut = kind === 'clipped' || kind === 'ridgedCut', N = 240, mid = -.4, half = .75, d = r * .84;
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2; let rr = r * (ridged ? (i % 2 ? 1.0 : .965) : 1); let x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    const da = Math.atan2(Math.sin(a - mid), Math.cos(a - mid)); if (cut && Math.abs(da) < half) { const k = d / Math.cos(da); if (k < rr) { x = Math.cos(a) * k; y = Math.sin(a) * k; } } i ? sh.lineTo(x, y) : sh.moveTo(x, y); } return sh; }
function makeCoin(kind = 'plain', r = .3, th = .05, face = 'old') { const g = new THREE.Group(); const geo = new THREE.ExtrudeGeometry(coinShape(kind, r), { depth: th, bevelEnabled: false, curveSegments: 4 }); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, 0);
  g.add(inked(geo, 0xd8dce8, .006)); const top = new THREE.Mesh(new THREE.CircleGeometry(r * .86, 32), new THREE.MeshToonMaterial({ map: COINT[face], gradientMap: ramp })); top.rotation.x = -Math.PI / 2; top.position.y = th + .001; g.add(top); return g; }
function shears() { const g = new THREE.Group(), b = []; for (const s of [-1, 1]) { const h = new THREE.Group(); g.add(h); h.add(at3(box(.04, .015, .34, 0xc8ccd8, .004), 0, 0, .17)); const ring = inked(new THREE.TorusGeometry(.05, .012, 6, 12), 0x24222c, .003); ring.rotation.x = Math.PI / 2; ring.position.set(s * .05, 0, -.08); h.add(ring); b.push(h); } g.userData.open = k => { b[0].rotation.y = k * .35; b[1].rotation.y = -k * .35; }; return g; }
function candle(sc, x, y, z, I = 3) { const g = new THREE.Group(); g.position.set(x, y, z); sc.add(g); g.add(at3(inked(new THREE.CylinderGeometry(.04, .04, .18, 10), 0xfff4d8, .006), 0, .09, 0)); const fl = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), flat(0xffd23a)); fl.scale.y = 1.8; fl.position.y = .22; g.add(fl); const L = new THREE.PointLight(0xffb060, I, 5); L.position.y = .35; g.add(L); g.userData = { fl, L }; return g; }
const flick = (c, t) => { c.userData.L.intensity *= 1; c.userData.fl.scale.y = 1.8 + Math.sin(t * 23) * .3; };
function darkRoom(col, hemi = .45) { const R = room(col); R.scene.children.filter(o => o.isHemisphereLight || o.isDirectionalLight).forEach(l => l.intensity *= hemi); return R; }
const tableP = (sc, x, z, w = 1.6, d = .9, col = 0x7a4a2a) => { const t = new THREE.Group(); t.position.set(x, 0, z); sc.add(t); t.add(at3(box(w, .08, d, col), 0, .78, 0)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) t.add(at3(box(.07, .76, .07, 0x5a3a22, .006), a * (w / 2 - .08), .38, b * (d / 2 - .08))); return t; };
const mugP = () => { const g = new THREE.Group(); g.add(inked(new THREE.CylinderGeometry(.07, .065, .16, 10), 0x9a6a3a, .008)); g.add(at3(new THREE.Mesh(new THREE.CylinderGeometry(.062, .062, .01, 10), flat(0xfff2d8)), 0, .075, 0)); return g; };
function coinPile(sc, x, y, z, n = 14, seed = 2) { const r = rng(seed), cs = []; for (let i = 0; i < n; i++) { const c = makeCoin('plain', .07, .015); c.position.set(x + (r() - .5) * .3, y + Math.floor(i / 5) * .016, z + (r() - .5) * .2); c.rotation.y = r() * 6; sc.add(c); cs.push(c); } return cs; }
// ---- 1690s London street: cobbles, overhanging timber-frame houses both sides, lanterns ----
const cobT = ctex(64, 64, g => { g.fillStyle = '#6a6470'; g.fillRect(0, 0, 64, 64); const r = rng(8); for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 * 6; x < 64; x += 12) { g.fillStyle = r() < .5 ? '#827a88' : '#746c7c'; g.beginPath(); g.ellipse(x + 5, y + 4, 5, 3.2, 0, 0, 7); g.fill(); } }, [30, 30]);
function tudor() { const g = new THREE.Group(), cr = 0xf2e2c0, bm = 0x3a2a22;
  g.add(at3(box(2.8, 2.3, 2.6, cr, .02), 0, 1.15, 0)); g.add(at3(box(3.0, 1.7, 2.9, cr, .02), 0, 3.15, .15));
  const tri = new THREE.Shape(); tri.moveTo(-1.6, 0); tri.lineTo(1.6, 0); tri.lineTo(0, 1.5); tri.closePath(); const rf = inked(new THREE.ExtrudeGeometry(tri, { depth: 3.1, bevelEnabled: false }), 0x4a3a44, .02); rf.children.forEach(m => m.geometry.translate(0, 4.0, -1.4)); g.add(rf);
  for (const x of [-1.35, -.45, .45, 1.35]) { g.add(at3(box(.12, 2.3, .05, bm, .006), x, 1.15, 1.31)); g.add(at3(box(.12, 1.7, .05, bm, .006), x * 1.07, 3.15, 1.61)); }
  g.add(at3(box(2.82, .14, .06, bm, .006), 0, 2.28, 1.32)); g.add(at3(box(3.02, .14, .06, bm, .006), 0, 3.95, 1.62));
  const wins = []; for (const [x, y, zz] of [[-.9, 1.4, 1.33], [.9, 1.4, 1.33], [-.9, 3.2, 1.63], [.9, 3.2, 1.63]]) { const w = at3(new THREE.Mesh(new THREE.BoxGeometry(.6, .55, .04), flat(0xffc870)), x, y, zz); g.add(w); wins.push(w); }
  g.add(at3(box(.7, 1.4, .06, 0x5a3a22, .01), 0, .7, 1.33)); g.userData.wins = wins; return g; }
function london(mode = 'dusk', o = {}) {
  const scene = new THREE.Scene(), night = mode === 'night', day = mode === 'day';
  scene.background = ctex(8, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, day ? '#8ac8ff' : night ? '#0a0c24' : '#2a2060'); gr.addColorStop(.6, day ? '#d8eeff' : night ? '#24204a' : '#c86a7a'); gr.addColorStop(1, day ? '#fff2d8' : night ? '#3a2a4a' : '#ffb070'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); });
  scene.fog = new THREE.Fog(day ? 0xd8e8f8 : night ? 0x1a1a34 : 0x8a5a7a, 10, 38);
  scene.add(new THREE.HemisphereLight(day ? 0xffffff : 0x8a8ad8, 0x3a2a3a, day ? 1.4 : .6)); const sun = new THREE.DirectionalLight(day ? 0xfff2e0 : 0xffb080, day ? 2.0 : .7); sun.position.set(5, 10, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 }); scene.add(sun, sun.target);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), toon(0xffffff, cobT)); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; scene.add(gr);
  const houses = []; for (const s of [-1, 1]) for (let z = 5; z > -40; z -= 3.3) { const h = tudor(); h.position.set(s * 3.5, 0, z); h.rotation.y = -s * Math.PI / 2; scene.add(h); houses.push(h); if (day) h.userData.wins.forEach(w => w.material = flat(0x8aa8c8)); }
  const lamps = []; for (const s of [-1, 1]) for (let z = 3; z > -30; z -= 7) { const p = new THREE.Group(); p.position.set(s * 1.95, 0, z + (s > 0 ? 3.5 : 0)); scene.add(p); p.add(at3(box(.08, 2.4, .08, 0x24222c, .008), 0, 1.2, 0)); p.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.22, .3, .22), flat(day ? 0xc8c8c8 : 0xffd87a)), 0, 2.5, 0)); if (!day && Math.abs(z) < 12) { const L = new THREE.PointLight(0xffb060, 9, 7); L.position.set(0, 2.4, 0); p.add(L); } lamps.push(p); }
  return { scene, sun, houses }; }
// ---- interiors ----
function workshop() { const R = darkRoom(0x4a3428, .4), sc = R.scene; const tb = tableP(sc, 0, -.6); const cdl = candle(sc, -.5, .82, -.75, 3.5);
  const fur = new THREE.Group(); fur.position.set(1.9, 0, -2.2); sc.add(fur); fur.add(at3(box(1.0, 1.1, .9, 0x8a3a2a, .02), 0, .55, 0)); fur.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.45, .3, .02), flat(0xff8a2a)), 0, .5, .46)); const crc = at3(inked(new THREE.CylinderGeometry(.2, .14, .25, 12), 0x4a4a52, .01), 0, 1.22, 0); fur.add(crc); const melt = at3(new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .02, 12), flat(0xffd890)), 0, 1.34, 0); fur.add(melt);
  const fl = new THREE.PointLight(0xff7a2a, 6, 5); fl.position.set(1.9, 1.0, -1.5); sc.add(fl); return { scene: sc, tb, cdl, fur, melt, fl }; }
function tavern() { const R = darkRoom(0x6a4428, .55), sc = R.scene; tableP(sc, -.3, -.8, 1.8, 1.0); tableP(sc, 1.9, .4, 1.2, .8); for (const [x, z] of [[-2.6, -2.4], [-2.0, -2.5], [2.6, -2.4]]) { const b = inked(new THREE.CylinderGeometry(.35, .35, .9, 14), 0x8a5a3a, .015); b.position.set(x, .45, z); sc.add(b); }
  const fire = new THREE.PointLight(0xff8a3a, 7, 7); fire.position.set(-2.5, 1.0, -1.6); sc.add(fire); sc.add(at3(box(1.2, 1.0, .5, 0x6a5a5a, .02), -2.5, .5, -2.7)); sc.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.7, .5, .02), flat(0xff9a3a)), -2.5, .45, -2.44));
  const mugs = [[-.7, -.7], [-.2, -.95], [.25, -.65]].map(([x, z]) => { const m = mugP(); m.position.set(x, .9, z); sc.add(m); return m; }); candle(sc, .55, .82, -.5, 2.5); return { scene: sc, fire, mugs }; }

const vl = (a, b, k) => a.clone().lerp(b, k);
// ===================== HE WON THE LOTTERY 14 TIMES =====================
const MANDEL = { color: 0xffd8b0, glasses: true, mustache: true, robe: 0x6a3a8a, shoe: 0x2a1a12 };
const ANCHOR = { color: 0xffc8a0, robe: 0x2a3a6a, shoe: 0x16121a };
const ANCHOR2 = { color: 0xe8a878, blush: true, robe: 0xc83a5a, shoe: 0x16121a };
const OFFICIAL = { color: 0xd8d0c0, glasses: true, mustache: true, robe: 0x3a3a48, shoe: 0x16121a };
const VENDOR = { color: 0xffb04a, hat: 'cap', hatColor: 0xe8323a, shoe: 0x3a3a48 };
const TEAMO = i => ({ ...crowdOpt(i), tag: null, hat: [null, 'cap', null, null][i % 4], robe: [0x3a6ad8, null, 0x5ac87a, null, 0xe8742a][i % 5] });
// ---- lottery props ----
const slipT = ctex(64, 40, g => { g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 64, 40); g.fillStyle = '#e8323a'; g.fillRect(0, 0, 64, 9); g.fillStyle = '#c8b8d8'; for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) g.fillRect(4 + x * 7.5, 13 + y * 6.5, 4, 3.5); });
function ticketPile(n = 1400, R = 2.4, Hh = 1.8, seed = 4) { const geo = new THREE.BoxGeometry(.2, .008, .125), im = new THREE.InstancedMesh(geo, toon(0xffffff, slipT), n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), r = rng(seed);
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * R, y = Math.max(0, (1 - rr / R) * Hh * (.75 + r() * .3)); e.set((r() - .5) * .9, r() * 6, (r() - .5) * .9); q.setFromEuler(e); m4.compose(V(Math.cos(a) * rr, y, Math.sin(a) * rr), q, V(1, 1, 1)); im.setMatrixAt(i, m4); }
  im.castShadow = im.receiveShadow = true; return im; }
function bigCheck(amount = '$1,300,000', w = .9) { return card(w, w * .45, (g, W2, H2) => { g.fillStyle = '#e8f6e0'; g.fillRect(0, 0, W2, H2); g.fillStyle = '#2a8a3a'; g.fillRect(0, 0, W2, H2 * .18); g.fillStyle = '#16121a'; g.font = `900 ${H2 * .13}px Nunito`; g.textAlign = 'left'; g.fillText('PAY TO: S. MANDEL', W2 * .05, H2 * .42); g.font = `900 ${H2 * .24}px Nunito`; g.fillText(amount, W2 * .05, H2 * .78); g.strokeStyle = '#16121a'; g.lineWidth = 8; g.strokeRect(0, 0, W2, H2); }, 256); }
function ballMachine(sc, x, y, z, r = 1.0, n = 26) { const g = new THREE.Group(); g.position.set(x, y, z); sc.add(g); g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), new THREE.MeshBasicMaterial({ color: 0xc8f0ff, transparent: true, opacity: .18, depthWrite: false }))); g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), inkMat(.01)));
  g.add(at3(box(.5, r * .9, .5, 0xc83a3a), 0, -r - r * .4, 0)); const balls = [...Array(n)].map((_, i) => { const b = inked(new THREE.SphereGeometry(.11, 10, 8), [0xffffff, 0xffd23a, 0xff6a8a, 0x5ab8ff][i % 4], .006); g.add(b); return b; }); g.userData.tumble = t => balls.forEach((b, i) => { const a = t * (3 + i % 5) + i * 2.3, c = t * (2.4 + i % 3) + i; b.position.set(Math.sin(a) * Math.cos(c) * r * .75, Math.cos(a * 1.3) * r * .75, Math.sin(c) * Math.sin(a * .7) * r * .75); }); return g; }
function bulbSign(sc, txt, w, h, x, y, z, col = '#ffd23a') { const g = new THREE.Group(); g.position.set(x, y, z); sc.add(g); const c = card(w, h, (gg, W2, H2) => { gg.fillStyle = '#16121e'; gg.fillRect(0, 0, W2, H2); gg.fillStyle = col; gg.font = `900 ${H2 * .5}px Nunito`; gg.textAlign = 'center'; gg.fillText(txt, W2 / 2, H2 * .68); }, 512); g.add(c);
  const bulbs = []; for (let i = 0; i < 28; i++) { const u = i / 28, per = 2 * (w + h), d = u * per; let bx, by; if (d < w) { bx = -w / 2 + d; by = h / 2; } else if (d < w + h) { bx = w / 2; by = h / 2 - (d - w); } else if (d < 2 * w + h) { bx = w / 2 - (d - w - h); by = -h / 2; } else { bx = -w / 2; by = -h / 2 + (d - 2 * w - h); } const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 5), flat(0xffe8a0)); b.position.set(bx, by, .03); g.add(b); bulbs.push(b); }
  g.userData.flash = t => bulbs.forEach((b, i) => b.material.color.set((i + Math.floor(t * 8)) % 2 ? 0xffe8a0 : 0x6a5a30)); return g; }
function counterCard(w = 2.2, h = .6) { return card(w, h, (g, W2, H2, n = 0) => { g.fillStyle = '#0e1a14'; g.fillRect(0, 0, W2, H2); g.fillStyle = '#5aff8a'; g.font = `900 ${H2 * .62}px Nunito`; g.textAlign = 'center'; g.fillText(Math.floor(n).toLocaleString('en-US'), W2 / 2, H2 * .74); g.strokeStyle = '#3a3a44'; g.lineWidth = 10; g.strokeRect(0, 0, W2, H2); }, 512); }
function chalk(w = 2.6, h = 1.4) { return card(w, h, (g, W2, H2, lines = []) => { g.fillStyle = '#2a4a3a'; g.fillRect(0, 0, W2, H2); g.strokeStyle = '#8a6a3a'; g.lineWidth = 14; g.strokeRect(0, 0, W2, H2); g.fillStyle = '#f2f2e8'; g.textAlign = 'center'; lines.forEach(([txt, y, s, c]) => { g.fillStyle = c || '#f2f2e8'; g.font = `900 ${H2 * (s || .16)}px Nunito`; g.fillText(txt, W2 / 2, H2 * y); }); }, 512); }
function warehouse(dark = false) { const R = room(0x8a8c98), sc = R.scene; sc.children.filter(o => o.isHemisphereLight || o.isDirectionalLight).forEach(l => l.intensity *= dark ? .45 : .8);
  for (let i = 0; i < 4; i++) { sc.add(at3(new THREE.Mesh(new THREE.BoxGeometry(1.6, .05, .14), flat(0xf2fff8)), -3 + i * 2, 4.2, -1)); const L = new THREE.PointLight(0xe8fff0, dark ? 3 : 6, 8); L.position.set(-3 + i * 2, 3.9, -1); sc.add(L); }
  for (const x of [-4.5, 4.5]) for (let j = 0; j < 3; j++) { sc.add(at3(box(.5, 2.2, 1.6, 0x6a5a4a, .02), x, 1.1, -2.2 + j * 1.8)); for (let k = 0; k < 3; k++) sc.add(at3(box(.4, .35, .4, 0xc8955a, .01), x, .3 + k * .7, -2.2 + j * 1.8)); }
  return { scene: sc }; }
function wallClock() { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CircleGeometry(.4, 32), flat(0xfffaf0))); g.add(at3(new THREE.Mesh(new THREE.TorusGeometry(.4, .03, 6, 32), flat(0x16121a)), 0, 0, .01)); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.02, .06, .01), flat(0x16121a)), Math.sin(a) * .33, Math.cos(a) * .33, .01)); }
  const hh = new THREE.Group(), mh = new THREE.Group(); hh.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.035, .2, .01), flat(0x16121a)), 0, .1, .02)); mh.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.02, .3, .01), flat(0xe8323a)), 0, .15, .03)); g.add(hh, mh); g.userData.set = h => { hh.rotation.z = -h / 12 * Math.PI * 2; mh.rotation.z = -h * Math.PI * 2; }; return g; }
const sparkle = (sc, n = 40) => { const ps = [...Array(n)].map((_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.06, .1), flat([0xffd23a, 0xff6a8a, 0x5ab8ff, 0xffffff][i % 4])); m.material.side = THREE.DoubleSide; sc.add(m); m.visible = false; return m; }); return { at(t, t0, c) { ps.forEach((m, i) => { const d = t - t0; m.visible = d > 0; if (!m.visible) return; const a = i * 2.4; m.position.set(c.x + Math.cos(a) * d * 1.5, c.y + 1.5 * Math.min(d, .5) * 2 - Math.max(0, d - .5) * .8 + (i % 5) * .05, c.z + Math.sin(a) * d * 1.2); m.rotation.set(d * 5 + i, d * 4, i); }); } }; };

// ===================== HQ LOOK: PBR sets, soft GI-ish light, ambient occlusion, bloom, filmic tone, 1.5x supersampling =====================
const SSAA = 1.25; renderer.setPixelRatio(SSAA); renderer.setSize(W, H, false); renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const pmrem = new THREE.PMREMGenerator(renderer); const ENV = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
const composer = new EffectComposer(renderer); composer.setPixelRatio(SSAA); composer.setSize(W, H);
const rpass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera()); composer.addPass(rpass);
const gtao = new GTAOPass(new THREE.Scene(), new THREE.PerspectiveCamera(), W * SSAA, H * SSAA); gtao.updateGtaoMaterial({ radius: .5, distanceExponent: 1.5, thickness: 1.5, scale: 1.2, samples: 8 }); gtao.blendIntensity = .9; composer.addPass(gtao);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .14, .5, .97); composer.addPass(new OutputPass());
function hqRender(scene, cam) { scene.traverse(o => { if (o.material && (o.material.isMeshToonMaterial || o.material.isMeshBasicMaterial) && !o.material.userData.keepTone) o.material.toneMapped = false; }); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = scene.userData.exposure || 1.0; rpass.scene = gtao.scene = scene; rpass.camera = gtao.camera = cam; composer.render(); }
// PBR material helpers with painted canvas textures
const pbr = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, metalness: 0, envMapIntensity: .6, ...o });
function texC(w, h, draw, rx = 1, ry = 1) { const t = ctex(w, h, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; }
const pm = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; };
const blockTex = (top, bot) => texC(512, 512, (g, w, h) => { g.fillStyle = top; g.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const x = c * 128 + (r % 2) * 64, y = r * 64; g.fillStyle = `rgba(0,0,0,${.02 + Math.random() * .03})`; g.fillRect(x + 3, y + 3, 122, 58); g.strokeStyle = 'rgba(0,0,0,.13)'; g.lineWidth = 4; g.strokeRect(x, y, 128, 64); g.strokeRect(x - 128, y, 128, 64); }
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(80,60,40,${Math.random() * .05})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 30, 0, 7); g.fill(); } }, 3, 2);
const floorTex = col => texC(512, 512, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .05})`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 3 + Math.random() * 40, 2 + Math.random() * 10, Math.random() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 30; i++) { g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (Math.random() - .5) * 60; y += (Math.random() - .5) * 60; g.lineTo(x, y); } g.stroke(); } }, 4, 4);
// fake volumetric light shaft: additive gradient planes along a direction
function shaft(sc, from, to, w = .7, a = .22, col = 0xfff2d8) { const len = from.distanceTo(to); const tex = ctex(64, 256, (g, ww, hh) => { const gr = g.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, ww, hh); const gx = g.createLinearGradient(0, 0, ww, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, ww, hh); });
  const grp = new THREE.Group(); for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w * (1 - i * .2), len), new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, opacity: a * (1 - i * .25), blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); p.material.userData.keepTone = true; p.rotation.y = i * Math.PI / 3; p.position.y = -len / 2; grp.add(p); }
  grp.position.copy(from); grp.lookAt(to); grp.rotateX(-Math.PI / 2); sc.add(grp); return grp; }

// the ink outline shells wrap each noodle, so ambient occlusion would see the body as "buried" and darken it: hide them while AO is computed
{ const orig = gtao.render.bind(gtao); gtao.render = (...a) => { const hid = []; gtao.scene.traverse(o => { if (o.isMesh && o.visible && o.material && o.material.side === THREE.BackSide && o.material.isMeshBasicMaterial) { o.visible = false; hid.push(o); } }); orig(...a); hid.forEach(o => o.visible = true); }; }
// ===================== "How a Man Mailed Himself Across the World" =====================
const GRIME = ctex(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${90 + Math.random() * 40},${80 + Math.random() * 30},70,${Math.random() * .07})`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 3 + Math.random() * 26, 2 + Math.random() * 12, Math.random() * 3, 0, 7); g.fill(); } }); GRIME.wrapS = GRIME.wrapT = THREE.RepeatWrapping;
// Ricks look: sets lose their ink outlines and become lit, textured PBR; characters (added later, each frame) keep the toon + ink look
function upgradeSet(sc) { sc.traverse(o => { if (!o.isMesh || o.userData.keep) return; const m = o.material; if (!m) return;
  if (m.isMeshBasicMaterial && m.side === THREE.BackSide && m.color && m.color.getHex() === INK) { o.visible = false; return; }
  if (m.isMeshToonMaterial) { o.material = new THREE.MeshStandardMaterial({ color: m.color, map: m.map || GRIME, roughness: o.userData.rough ?? .72, metalness: o.userData.metal ?? 0, envMapIntensity: .7 }); } });
  sc.environment = ENV; const eI = sc.userData.envI ?? .55; sc.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = eI; }); return sc; }
const H_ = (t0, t1, build, o = {}) => shot(t0, t1, t => { const r = build(t); upgradeSet(r.scene); return { ...r, hq: true }; }, o);
const skyTex = (a, b, c) => ctex(8, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, a); gr.addColorStop(.6, b); gr.addColorStop(1, c); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); });
function sunLight(sc, col, I, x, y, z, size = 8) { const s = new THREE.DirectionalLight(col, I); s.position.set(x, y, z); s.castShadow = true; s.shadow.mapSize.set(2048, 2048); Object.assign(s.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: .5, far: 60 }); s.shadow.bias = -.0004; s.shadow.normalBias = .02; sc.add(s, s.target); return s; }
const KEEP = o => { o.traverse(c => c.userData.keep = true); return o; };
const plank = (w, h, d, c = 0xc8955a) => box(w, h, d, c, .012);
const woodT = ctex(256, 256, (g, w, h) => { g.fillStyle = '#d8a86a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(110,70,30,${.1 + Math.random() * .15})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 8, w * .6, y - 8, w, y + 3); g.stroke(); } for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(60,30,10,.35)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 8, 4, 0, 0, 7); g.fill(); } });
function woodBox(w, h, d) { const m = inked(new THREE.BoxGeometry(w, h, d), 0xffffff, .012, woodT); return m; }
// ---- the crate (front panel removable for the cutaway; lid on a hinge group) ----
function crate(o = {}) { const g = new THREE.Group(), W2 = .95, H2 = 1.0, D2 = .8, th = .05;
  const back = woodBox(W2, H2, th); back.position.set(0, H2 / 2, -D2 / 2); const front = woodBox(W2, H2, th); front.position.set(0, H2 / 2, D2 / 2); const L = woodBox(th, H2, D2), R = woodBox(th, H2, D2); L.position.set(-W2 / 2, H2 / 2, 0); R.position.set(W2 / 2, H2 / 2, 0); const bot = woodBox(W2, th, D2); bot.position.y = th / 2; g.add(back, front, L, R, bot);
  for (const y of [.15, .85]) for (const [x, z, rw, rd] of [[0, D2 / 2 + .03, W2 + .05, .03], [0, -D2 / 2 - .03, W2 + .05, .03], [-W2 / 2 - .03, 0, .03, D2 + .05], [W2 / 2 + .03, 0, .03, D2 + .05]]) g.add(at3(plank(rw, .1, rd, 0xa8783a), x, y, z));
  const lid = new THREE.Group(); lid.position.set(0, H2, -D2 / 2); g.add(lid); const lt = woodBox(W2 + .06, th, D2 + .06); lt.position.set(0, th / 2, D2 / 2); lid.add(lt);
  const fr = card(.62, .2, (c, w, h) => { c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, w, h); c.strokeStyle = '#c8282a'; c.lineWidth = 10; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#c8282a'; c.font = `900 ${h * .55}px Nunito`; c.textAlign = 'center'; c.fillText('FRAGILE', w / 2, h * .7); }, 256); fr.material.transparent = true; fr.position.set(0, .62, D2 / 2 + .03); front.parent.add(fr);
  const cod = card(.3, .2, (c, w, h) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, w, h); c.fillStyle = '#16121a'; c.font = `900 ${h * .3}px Nunito`; c.textAlign = 'center'; c.fillText('C.O.D.', w / 2, h * .42); c.font = `900 ${h * .17}px Nunito`; c.fillText('PERTH, W.A.', w / 2, h * .75); }, 256); cod.position.set(.47 + .031, .45, .15); cod.rotation.y = Math.PI / 2; g.add(cod);
  const thisUp = card(.3, .14, (c, w, h) => { c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, w, h); c.fillStyle = '#16121a'; c.font = `900 ${h * .34}px Nunito`; c.textAlign = 'center'; c.fillText('THIS SIDE UP', w / 2, h * .65); }, 256); thisUp.material.transparent = true; thisUp.position.set(0, .3, D2 / 2 + .03); g.add(thisUp);
  g.userData = { lid, front, fr, thisUp, W2, H2, D2 }; return g; }
// noodle eyes peeking out from under the lid (a cheap, readable gag)
function peekEyes() { const g = new THREE.Group(); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); w.scale.z = .5; w.position.x = s * .08; g.add(w); const p = new THREE.Mesh(new THREE.SphereGeometry(.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0x16121a })); p.position.set(s * .08, -.01, .03); g.add(p); } return KEEP(g); }
// ---- cargo plane ----
function plane(col = 0xf2f2f4, tail = 0x2a5ab0) { const g = new THREE.Group(); const fus = inked(new THREE.CapsuleGeometry(1.0, 7, 8, 18), col, .02); fus.rotation.z = Math.PI / 2; fus.position.y = 2.0; g.add(fus);
  g.add(at3(box(2.2, .12, 9, col), 0, 1.9, 0)); g.children.at(-1).rotation.y = Math.PI / 2; const w = box(2.4, .12, 11, col); w.position.set(.4, 1.8, 0); g.add(w);
  const fin = box(1.6, 1.8, .14, tail); fin.position.set(-4.2, 3.4, 0); g.add(fin); const hs = box(1.2, .1, 3.6, col); hs.position.set(-4.3, 2.3, 0); g.add(hs);
  for (const z of [-2.6, 2.6]) { const e = inked(new THREE.CylinderGeometry(.35, .3, 1.1, 14), 0x9aa0ac); e.rotation.z = Math.PI / 2; e.position.set(.7, 1.45, z); g.add(e); }
  for (let i = 0; i < 9; i++) { const wd = new THREE.Mesh(new THREE.CircleGeometry(.1, 12), flat(0x24304a)); wd.position.set(2.6 - i * .55, 2.35, .99); g.add(wd); }
  const stripe = box(8.2, .14, 2.02, tail, .004); stripe.position.y = 2.1; g.add(stripe);
  const door = box(1.3, 1.1, .08, 0xd8d8dc); door.position.set(-1.6, 1.85, 1.0); g.add(door); g.userData.door = door;
  for (const [x, z] of [[2.8, 0], [-.6, -.9], [-.6, .9]]) { g.add(at3(box(.1, .9, .1, 0x4a4a54), x, .55, z)); const wh = inked(new THREE.CylinderGeometry(.25, .25, .2, 16), 0x1c1c24); wh.rotation.x = Math.PI / 2; wh.position.set(x, .25, z); g.add(wh); }
  return g; }
function runway(mode = 'day', paris = false) { const sc = new THREE.Scene(), night = mode === 'night', hot = mode === 'hot';
  sc.background = night ? skyTex('#0a1030', '#1c2a5a', '#3a3a6a') : hot ? skyTex('#5aa8f0', '#ffd8a0', '#ffb070') : skyTex('#5aa8f0', '#bfe0ff', '#fff2d8'); sc.fog = new THREE.Fog(night ? 0x1c2448 : hot ? 0xffd0a0 : 0xd8e8f8, 25, 90);
  sc.add(new THREE.HemisphereLight(night ? 0x5a6ab8 : 0xffffff, night ? 0x1a2030 : 0x9a8a70, night ? .6 : 1.2)); sunLight(sc, night ? 0x8aa0ff : hot ? 0xffc890 : 0xfff2e0, night ? .9 : hot ? 3.6 : 2.8, night ? -6 : 8, 12, 6, 14);
  const asphaltT = ctex(256, 256, (g, w, h) => { g.fillStyle = '#6a6a70'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? 0 : 255},${Math.random() < .5 ? 0 : 255},${Math.random() < .5 ? 0 : 255},.05)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } for (let i = 0; i < 12; i++) { g.strokeStyle = 'rgba(30,30,30,.4)'; g.lineWidth = 2; g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - .5) * 40; y += (Math.random() - .5) * 40; g.lineTo(x, y); } g.stroke(); } }, [20, 20]);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x8ab86a, map: GRIME })); gr.rotation.x = -Math.PI / 2; gr.position.y = -.01; gr.receiveShadow = true; sc.add(gr);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(120, 14), new THREE.MeshStandardMaterial({ map: asphaltT, roughness: .85 })); rw.rotation.x = -Math.PI / 2; rw.receiveShadow = true; sc.add(rw);
  for (let x = -60; x < 60; x += 6) { const l = new THREE.Mesh(new THREE.PlaneGeometry(3, .25), new THREE.MeshStandardMaterial({ color: 0xf4f4f0 })); l.rotation.x = -Math.PI / 2; l.position.set(x, .005, 0); sc.add(l); }
  for (const z of [-6.8, 6.8]) for (let x = -60; x < 60; x += 4) { const b = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshBasicMaterial({ color: night ? 0xffd890 : 0xe8e8e8 })); b.position.set(x, .08, z); b.userData.keep = true; sc.add(b); if (night && Math.abs(x) < 14 && x % 8 === 0) { const L = new THREE.PointLight(0xffc870, 2.5, 5, 2); L.position.set(x, .4, z); sc.add(L); } }
  // terminal + control tower
  const term = new THREE.Group(); term.position.set(0, 0, -22); sc.add(term); term.add(at3(box(30, 4, 6, 0xe8e4dc), 0, 2, 0)); for (let i = 0; i < 12; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), new THREE.MeshBasicMaterial({ color: night ? 0xffd890 : 0x7aa8d8 })); w.position.set(-13 + i * 2.4, 2.2, 3.01); w.userData.keep = true; term.add(w); }
  term.add(at3(box(1.6, 9, 1.6, 0xd8d4cc), 12, 4.5, -1)); term.add(at3(box(3, 1.4, 3, 0x5a7a9a), 12, 9.6, -1));
  if (paris) { const tw = new THREE.Group(); tw.position.set(-14, 0, -48); sc.add(tw); const tm_ = 0x5a4434; const seg = (r0, r1, y0, y1) => { const m = box(1, 1, 1, tm_); m.children.forEach(c => { c.geometry = new THREE.CylinderGeometry(r1, r0, y1 - y0, 4, 1, false, Math.PI / 4); }); m.position.y = (y0 + y1) / 2; tw.add(m); };
    seg(6, 2.6, 0, 9); seg(2.6, 1.3, 9.5, 19); seg(1.2, .25, 19.4, 33); tw.add(at3(box(6.2, .6, 6.2, tm_), 0, 9.2, 0)); tw.add(at3(box(3, .4, 3, tm_), 0, 19.2, 0)); tw.add(at3(box(.2, 3, .2, tm_), 0, 34.5, 0)); const arch = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffc890 })); arch.scale.y = .9; arch.position.y = -.2; arch.userData.keep = true; tw.add(arch); }
  sc.userData.envI = night ? .15 : .5; sc.userData.exposure = night ? .95 : 1.05; return { scene: sc, term }; }
function hall(night = false, withBelt = true) { const sc = new THREE.Scene(); sc.background = new THREE.Color(night ? 0x0c1230 : 0xd8e0ea);
  sc.add(new THREE.HemisphereLight(night ? 0x5a6ab8 : 0xf0f4ff, night ? 0x1a1a24 : 0x8a7a6a, night ? .3 : 1.15)); sunLight(sc, night ? 0x9ab0ff : 0xfff0d8, night ? .7 : 3.4, -5, 9, -6, 10);
  const concT = ctex(256, 256, (g, w, h) => { g.fillStyle = '#9a9a98'; g.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(40,40,40,${Math.random() * .08})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 20, 0, 7); g.fill(); } g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); }, [8, 8]);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: concT, roughness: .5 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
  const ribT = ctex(256, 64, (g, w, h) => { for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#7a8a9a'); gr.addColorStop(.5, '#a8b8c8'); gr.addColorStop(1, '#6a7a8a'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); } }, [6, 3]);
  // back wall with high windows (sunlight pours through the gaps)
  for (let i = -3; i <= 3; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, .2), new THREE.MeshStandardMaterial({ map: ribT, roughness: .6, metalness: .3 })); p.position.set(i * 3, 1.7, -6); p.castShadow = p.receiveShadow = true; sc.add(p); const top = new THREE.Mesh(new THREE.BoxGeometry(3, 2, .2), p.material); top.position.set(i * 3, 6.2, -6); top.castShadow = true; sc.add(top); const post = box(.4, 7.4, .3, 0x5a6a7a); post.position.set(i * 3 + 1.5, 3.7, -6); sc.add(post); }
  const winM = new THREE.MeshBasicMaterial({ color: night ? 0x3a5aa8 : 0xfff8e8 }); for (let i = -3; i <= 3; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), winM); w.position.set(i * 3, 4.2, -6.15); w.userData.keep = true; sc.add(w); }
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(.2, 7.4, 20), new THREE.MeshStandardMaterial({ map: ribT, roughness: .6, metalness: .3 })); w.position.set(s * 9, 3.7, 3); w.receiveShadow = true; sc.add(w); }
  // shelving with boxes, pallets
  for (const x of [-6.5, 6.5]) for (let z = -4; z < 6; z += 2.6) { const sh = new THREE.Group(); sh.position.set(x, 0, z); sc.add(sh); for (const y of [0, 1.3, 2.6]) { sh.add(at3(box(1.2, .08, 2.2, 0xe86a2a), 0, y + .9, 0)); for (let k = 0; k < 3; k++) sh.add(at3(box(.9, .55, .6, [0xc8955a, 0xb8854a, 0xd8a86a][k], .01), 0, y + 1.25, -.7 + k * .7)); } for (const [a, b] of [[-.55, -1.05], [.55, -1.05], [-.55, 1.05], [.55, 1.05]]) sh.add(at3(box(.08, 3.8, .08, 0x2a5ab0), a, 1.9, b)); }
  // conveyor belt
  const belt = new THREE.Group(); if (withBelt) sc.add(belt); belt.add(at3(box(1.3, .12, 14, 0x2a2a30), 0, .72, 0)); for (let z = -7; z <= 7; z += .5) { const r = inked(new THREE.CylinderGeometry(.06, .06, 1.25, 10), 0x9aa0ac, .006); r.rotation.z = Math.PI / 2; r.position.set(0, .66, z); belt.add(r); } for (const s of [-1, 1]) belt.add(at3(box(.08, .2, 14, 0xf2c230), s * .68, .78, 0)); for (let z = -6; z <= 6; z += 2) for (const s of [-1, 1]) belt.add(at3(box(.08, .66, .08, 0x5a5a64), s * .6, .33, z));
  if (night) { const L = new THREE.PointLight(0xffc070, 8, 7, 1.6); L.position.set(2.5, 2.4, 1.5); sc.add(L); sc.add(at3(new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd890 })), 2.5, 2.4, 1.5)); }
  sc.userData.envI = night ? .1 : .5; sc.userData.exposure = night ? .85 : 1.05; return { scene: sc, belt }; }
function interior(wall = 0xe8dcc8, floor = 0x8a6a4a, envI = .55) { const sc = new THREE.Scene(); sc.background = new THREE.Color(0xdfe6ee); sc.add(new THREE.HemisphereLight(0xf4f6ff, 0x8a6a5a, 1.2)); sunLight(sc, 0xfff0d8, 3.0, -4, 7, 5, 8);
  const flr = box(14, .1, 14, floor); flr.position.y = -.05; sc.add(flr); const bw = box(14, 4.5, .2, wall); bw.position.set(0, 2.25, -3.5); sc.add(bw); const sw = box(.2, 4.5, 14, wall); sw.position.set(-3.6, 2.25, 0); sc.add(sw); sc.add(at3(box(14, .14, .25, 0xf4f0e8), 0, .07, -3.38)); sc.userData.envI = envI; return sc; }

// ---- cast ----
const REG = { color: 0xffe6cc, robe: 0x1f8a4a, hat: 'cap', hatColor: 0xf2c230, shoe: 0xf2f2f2 };
const MATE = { color: 0xffd8b0, robe: 0x8a3a2a, mustache: true, shoe: 0x3a2a1a };
const CLERK = { color: 0xf0c8a0, hat: 'mail', hatColor: 0x2a3a6a, robe: 0x2a3a6a, badge: true, shoe: 0x16121a };
const GUARDZ = { color: 0xe8c8a0, hat: 'cap', hatColor: 0x2a3446, robe: 0x3a4a6a, badge: true, mustache: true, shoe: 0x16121a };
const BOUNCER = { color: 0xc89070, shades: true, robe: 0x16121e, shoe: 0x16121a, cs: .95 };
const DELIV = { color: 0xffd8b0, hat: 'cap', hatColor: 0xe8423a, robe: 0xe8423a, shoe: 0x2a2a34 };

// 1 "In 1964, a man mailed himself across the world... in a wooden box." - FIRST FRAME: a FRAGILE crate rides the belt in a sunlit cargo hall; on "wooden box" the lid creaks up and two eyes peek out
H_(0, 5.6, t0 => { const S = hall(), cam = newCam(40), c = crate(), ey = peekEyes(); S.scene.add(c, ey); const TB = at(t0, 4.35);
  return { scene: S.scene, cam, update(f, fd, tc) { c.position.set(0, .78, lerp(-.7, .5, f / fd)); const k = ss(TB - .25, TB + .2, f); c.userData.lid.rotation.x = -.32 * k; c.updateMatrixWorld(true); ey.position.copy(c.localToWorld(V(0, .97, .3))); ey.visible = k > .2; ey.scale.setScalar(.8 + .2 * k); ey.rotation.y = Math.sin(f * 3) * .3 * k;
    path(cam, f, [[0, .95, 1.3, 2.3, 0, 1.2, -.7], [TB - .3, .75, 1.45, 2.35, 0, 1.4, -.1], [fd, .5, 1.6, 2.0, 0, 1.55, .2]]); } }; });
// 2 "His name was Reg Spiers. An Australian athlete, stuck in London. Broke. No money for a ticket home." - a London street; he turns out empty pockets; a moth flies out
H_(5.6, 12.3, t0 => { const L = london('day'), cam = newCam(44), fillL = new THREE.HemisphereLight(0xffffff, 0x9a8a7a, 1.0), moth = sprite('~', '#a89070', .35, 100), sign = card(1.4, .9, (g, w, h) => { g.fillStyle = '#16326a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23a'; g.font = `900 ${h * .16}px Nunito`; g.textAlign = 'center'; g.fillText('FLY TO', w / 2, h * .24); g.font = `900 ${h * .22}px Nunito`; g.fillText('AUSTRALIA', w / 2, h * .48); g.fillStyle = '#fff'; g.font = `900 ${h * .2}px Nunito`; g.fillText('£ 600', w / 2, h * .8); }, 512);
  sign.position.set(1.85, 1.55, -1.2); sign.rotation.y = -Math.PI / 2; L.scene.add(sign, moth, fillL); L.sun.position.set(.5, 12, 5); L.sun.target.position.set(0, 0, -2); const key = new THREE.DirectionalLight(0xfff4e8, 1.6); key.position.set(-2, 3, 6); L.scene.add(key); const TB = at(t0, 9.98), TN = at(t0, 10.6);
  return { scene: L.scene, cam, update(f, fd, tc) { const w = clamp(f / 2.2); const x = lerp(-.6, .6, w); const broke = f > TB;
    place(L.scene, { ...REG, ...fx(f, [[0, 'smile'], [1.4, 'determined'], [TB, 'sad'], [TN + .3, 'shock']]), hands: broke ? [V(-.33, .48, .12), V(.33, .48, .12)] : undefined, ...(f < 2.2 ? waddle(f) : {}) }, x, 0, -1.0, f < 2.2 ? Math.PI / 2 * .3 : (f > TN ? -Math.PI / 2 * .6 : 0));
    moth.visible = broke && f < TB + 1.2; moth.position.set(.6 + (f - TB) * .3, 1.0 + (f - TB) * .8, -.8);
    path(cam, f, [[0, -1.2, 1.6, 3.0, 0, 1.2, -1.5], [TB, .4, 1.25, 2.2, .5, 1.15, -1.0], [fd, 1.0, 1.3, 1.4, 1.6, 1.35, -1.2]]); } }; });
// 3 "His friend laughed. You can't mail a person. Reg said, Watch me." - the pub: his mate cracks up; Reg, cocky: "Watch me."
H_(12.3, 17.05, t0 => { const sc = interior(0x6a4a34, 0x5a3a24, .45), cam = newCam(50), tb = tableP(sc, 0, -.9, 1.3, .8, 0x7a4a2a); for (let i = 0; i < 4; i++) sc.add(at3(box(.9, .5, .4, [0x2a6a3a, 0x8a2a2a, 0x2a3a8a, 0xb8902a][i]), -2.4 + i * 1.1, 2.4, -3.3)); sc.add(at3(box(5, .08, .5, 0x4a2a18), -.8, 2.1, -3.3));
  const mugs = [-.3, .3].map(x => { const m = inked(new THREE.CylinderGeometry(.08, .07, .2, 14), 0xf2c230, .01); m.position.set(x, .9, -.9); sc.add(m); return m; }); const TW = at(t0, 16.19);
  return { scene: sc, cam, update(f, fd, tc) { const m = talkIf(tc, 16.1, 16.95); place(sc, { ...MATE, ...fx(f, [[0, 'laugh'], [TW - 1.2, 'laugh'], [TW + .2, 'shock']]), lean: f < TW - .8 ? Math.sin(f * 14) * .12 : 0, sit: true }, -.7, 0, -.6, .5);
    place(sc, { ...REG, ...fx(f, [[0, 'deadpan'], [TW - .3, 'smug']]), ...(m ? { mouth: m } : {}), sit: true }, .7, 0, -.6, -.5);
    path(cam, f, [[0, -.3, 1.3, 3.1, -.3, .95, -.7], [TW - .5, .15, 1.25, 2.7, .1, .95, -.7], [fd, .5, 1.2, 1.9, .65, 1.05, -.6]]); } }; });
// 4 "So they built a crate. Just big enough for one man. Some food. Some water. A blanket." - the workshop: the crate pops together plank by plank; supplies drop in one by one
H_(17.05, 22.45, t0 => { const sc = interior(0xb88a5a, 0x7a5a3a), cam = newCam(42), c = crate(); sc.add(c); c.position.set(0, 0, -.6); const parts = [c.userData.front, ...c.children.filter(o => o !== c.userData.lid)].slice(0, 6); const kids = c.children.slice();
  const can = inked(new THREE.CylinderGeometry(.07, .07, .14, 14), 0xc8423a, .01), bot = inked(new THREE.CylinderGeometry(.06, .06, .26, 14), 0x8ad8ff, .01), bl = box(.6, .1, .45, 0x3a6ad8, .01); [can, bot, bl].forEach(o => sc.add(o)); const TI = [at(t0, 20.27), at(t0, 21.02), at(t0, 21.82)];
  return { scene: sc, cam, update(f, fd, tc) { kids.forEach((o, i) => { const k = pop(f - .12 * i); o.visible = k > 0; o.scale.setScalar(Math.max(.001, k)); }); c.userData.lid.visible = false;
    [[can, -.25, .3], [bot, .2, .35], [bl, 0, .12]].forEach(([o, x, y], i) => { const d = f - TI[i]; o.visible = d > 0; o.position.set(x, Math.max(y, 1.8 - d * d * 14), -.6 + (i - 1) * .12); o.rotation.y = i; });
    place(sc, { ...REG, ...fx(f, [[0, 'determined'], [TI[0], 'happy']]), hands: [V(-.3, .62, .3), V(.3, .62 + Math.abs(Math.sin(f * 9)) * .1, .3)] }, .8, 0, .05, -.9);
    path(cam, f, [[0, .9, 2.3, 3.0, .3, .6, -.4], [fd, .5, 1.9, 2.4, .35, .6, -.4]]); } }; });
// 5 "And the best part? He sent it cash on delivery. The person at the other end would pay for it." - the shipping counter: the clerk SLAMS a C.O.D. stamp on the label
H_(22.45, 27.42, t0 => { const sc = interior(0xd8e4d0, 0x8a8a90), cam = newCam(42), c = crate(); sc.add(c); c.position.set(-.4, .95, -1.1); c.rotation.y = .5; sc.add(at3(box(3.2, .95, .8, 0x8a5a34), 0, .475, -1.1)); const stamp = new THREE.Group(); stamp.add(at3(box(.12, .18, .12, 0x6a3a1a), 0, .12, 0)); stamp.add(at3(box(.2, .05, .14, 0x2a2a2a), 0, 0, 0)); sc.add(stamp);
  const red = card(.42, .2, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h); g.strokeStyle = '#d8282a'; g.lineWidth = 12; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#d8282a'; g.font = `900 ${h * .42}px Nunito`; g.textAlign = 'center'; g.fillText('PAY ON', w / 2, h * .46); g.fillText('ARRIVAL', w / 2, h * .84); }, 256); red.material.transparent = true; red.userData.keep = true; sc.add(red); const TS = at(t0, 24.08), TP = at(t0, 26.64);
  return { scene: sc, cam, update(f, fd, tc) { const up = f < TS ? ss(TS - .6, TS - .15, f) : 1 - ss(TS + .2, TS + .5, f); c.updateMatrixWorld(true); const sp = c.localToWorld(V(0, c.userData.H2 + .08 + up * .3, 0)); stamp.position.copy(sp); red.visible = f > TS; c.localToWorld(red.position.set(.1, c.userData.H2 + .052, .1)); red.rotation.set(-Math.PI / 2, 0, -.5 + .2); red.scale.setScalar(f > TS ? 1 + .3 * Math.exp(-(f - TS) * 10) : 1);
    place(sc, { ...CLERK, ...fx(f, [[0, 'deadpan'], [TS, 'determined'], [TP, 'smug']]), hands: [V(-.3, .75, .3), V(.25, .8 + up * .25, .35)] }, .2, 0, -1.9, -.2);
    if (f > TS && f < TS + .12) shake(cam, tc, .02); path(cam, f, [[0, 1.6, 1.9, 2.4, -.1, 1.1, -1.3], [TS - .2, .9, 2.3, 1.3, -.3, 1.2, -1.2], [fd, 1.0, 2.1, 1.6, -.1, 1.25, -1.4]]); } }; }, { xf: true });
// 6 "Reg climbed in. The lid was nailed shut." - straight down into the crate: he folds himself in; the lid swings shut; the hammer comes down
H_(27.42, 30.2, t0 => { const sc = interior(0xb88a5a, 0x7a5a3a), cam = newCam(46), c = crate(); sc.add(c); c.position.set(0, 0, -.6); const hm = new THREE.Group(); hm.add(at3(box(.05, .4, .05, 0x8a5a34), 0, -.2, 0)); hm.add(at3(box(.18, .07, .07, 0x5a5a64), 0, 0, 0)); sc.add(hm); const TL = at(t0, 28.72), TN = at(t0, 29.31);
  return { scene: sc, cam, update(f, fd, tc) { const inK = ss(0, .8, f); place(sc, { ...REG, ...fx(f, [[0, 'determined'], [.8, 'smile'], [TL - .3, 'smug']]), sit: true, cs: lerp(.62, .43, inK), lean: .4 }, 0, lerp(.9, .06, inK), -.6 + lerp(.4, 0, inK), 0);
    c.userData.lid.rotation.x = -1.6 * (1 - ss(TL - .35, TL, f)); const hit = Math.max(0, Math.sin((f - TN) * 18)); hm.visible = f > TN - .2; hm.position.set(.3, 1.2 + hit * .3, -.25); hm.rotation.z = .6 - hit * .8; if (f > TN && Math.sin((f - TN) * 18) < -.9) shake(cam, tc, .012);
    path(cam, f, [[0, .1, 3.0, .4, 0, .4, -.6], [fd, .05, 2.4, .1, 0, .5, -.6]]); } }; });
// 7 "And the box was loaded onto a cargo plane." - the airfield: the crate rides a loader belt up into the plane's cargo door
H_(30.2, 32.65, t0 => { const R = runway('day'), cam = newCam(44), P = plane(), c = crate(); R.scene.add(P, c); P.position.set(1.5, 0, -2.5); const ld = new THREE.Group(); R.scene.add(ld); ld.add(at3(box(.9, .1, 3.4, 0xf2c230), 0, 0, 0)); ld.position.set(-.1, .95, -.2); ld.rotation.x = -.42;
  return { scene: R.scene, cam, update(f, fd, tc) { const k = clamp(f / fd); c.position.set(-.1, .2 + k * 1.6, 1.3 - k * 2.6); c.rotation.x = -.42; c.scale.setScalar(.8);
    path(cam, f, [[0, -3.5, 1.4, 4.5, .2, 1.4, -1.0], [fd, -2.2, 2.3, 3.4, -.1, 1.8, -1.6]]); } }; });
// 8 "Then things went wrong. In Paris, the plane was delayed. Reg's crate sat on the hot runway for over a day. No air. No room to move."
H_(32.65, 36.6, t0 => { const R = runway('hot', true), cam = newCam(40), c = crate(); R.scene.add(c); c.position.set(.35, 0, 1.9); const sun = new THREE.Mesh(new THREE.SphereGeometry(2.2, 20, 14), new THREE.MeshBasicMaterial({ color: 0xfff2c0 })); sun.position.set(-14, 18, -50); sun.userData.keep = true; R.scene.add(sun);
  return { scene: R.scene, cam, update(f, fd, tc) { c.position.y = Math.sin(f * 30) * .004; path(cam, f, [[0, .9, .5, 5.4, -1.2, 2.6, -10], [fd, .3, .45, 4.2, -1.0, 2.2, -8]]); } }; }, { xf: true });
H_(36.6, 42.1, t0 => { const R = runway('hot', true), cam = newCam(44), c = crate(); R.scene.add(c); c.position.set(0, 0, 0); c.userData.front.visible = c.userData.fr.visible = c.userData.thisUp.visible = false; const drops = [0, 1, 2].map(i => { const d = new THREE.Mesh(new THREE.SphereGeometry(.022, 10, 8), new THREE.MeshBasicMaterial({ color: 0x7ac8ff })); d.scale.y = 1.5; d.userData.keep = true; R.scene.add(d); return d; }); const TA = at(t0, 39.97), TM = at(t0, 40.81);
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(.95, 1.0), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 })); R.scene.add(dark);
  return { scene: R.scene, cam, update(f, fd, tc) { const sq = f > TM ? .12 + Math.sin(f * 20) * .02 : 0; place(R.scene, { ...REG, ...fx(f, [[0, 'sad'], [TA, 'shock'], [TM, 'dazed']]), sit: true, cs: .43, lean: .35, squash: sq, hands: [V(-.3, .7, .2), V(.3, .7, .2)] }, 0, .06, -.05, 0);
    drops.forEach((d, i) => { const k = ((f * .9 + i / 3) % 1); d.position.set(-.14 + i * .14, .8 - k * .4, .2); d.visible = f > .5; });
    path(cam, f, [[0, .9, .85, 2.5, 0, .6, 0], [fd, .25, .7, 1.4, 0, .58, 0]]); } }; }, { xf: true });
// 9 "Sixty-three hours later... the plane landed in Perth, Australia." - night: the plane touches down between the runway lights
H_(42.1, 46.05, t0 => { const R = runway('night'), cam = newCam(44), P = plane(); R.scene.add(P); const sign = card(4, 1, (g, w, h) => { g.fillStyle = '#16326a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23a'; g.font = `900 ${h * .55}px Nunito`; g.textAlign = 'center'; g.fillText('PERTH', w / 2, h * .72); }, 512); sign.position.set(0, 5.0, -18.9); sign.userData.keep = true; R.scene.add(sign); const TL = at(t0, 44.21);
  const hrs = counterCard(1.6, .45); hrs.position.set(-3, 2.2, -2); R.scene.add(hrs);
  return { scene: R.scene, cam, update(f, fd, tc) { const k = ss(0, TL, f); P.position.set(lerp(-26, -2, k) + Math.max(0, f - TL) * 3, lerp(5, 0, k), 0); P.rotation.z = lerp(.12, 0, k); hrs.visible = false; if (f > TL && f < TL + .12) shake(cam, tc, .025);
    path(cam, f, [[0, 6, 1.0, 9, -6, 2, 0], [fd, 3.5, 1.2, 7.5, 0, 1.5, 0]]); } }; });
// 10 "That night, Reg cut his way out of the crate... and walked out of the airport. Nobody stopped him." - moonlit cargo hall: a saw blade pokes through, the panel falls, he tiptoes past a snoring guard
H_(46.05, 51.4, t0 => { const S = hall(true, false), cam = newCam(42), c = crate(); S.scene.add(c); c.position.set(-1.2, 0, .4); const saw = new THREE.Group(); saw.add(at3(box(.02, .4, .32, 0xc8ccd8, .004), 0, 0, 0)); saw.add(at3(box(.06, .14, .2, 0xc8423a), 0, .26, 0)); KEEP(saw); S.scene.add(saw); const zz = sprite('Z', '#ffffff', .3, 140); S.scene.add(zz); const chair = box(.6, .5, .6, 0x3a3a44); chair.position.set(-.2, .25, -3.4); S.scene.add(chair);
  const door = box(1.3, 2.2, .1, 0x4a5a6a); door.position.set(3.2, 1.1, -5.85); S.scene.add(door); const ext = card(.8, .3, (g, w, h) => { g.fillStyle = '#1aa84a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `900 ${h * .6}px Nunito`; g.textAlign = 'center'; g.fillText('EXIT', w / 2, h * .74); }, 256); ext.position.set(3.2, 2.5, -5.84); ext.userData.keep = true; S.scene.add(ext);
  const TC = at(t0, 47.1), TO = at(t0, 48.02), TW = at(t0, 48.61), TN = at(t0, 50.11);
  return { scene: S.scene, cam, update(f, fd, tc) { const fp = c.userData.front; const fall = ss(TO, TO + .35, f); fp.rotation.x = fall * 1.45; fp.position.set(0, .5 - fall * .45, .4 + fall * .5); c.userData.fr.visible = fall < .1;
    saw.visible = f > TC - .2 && f < TO; saw.position.set(-1.2 + Math.sin(f * 14) * .12, .62 + (f - TC) * .15, .9);
    const out = ss(TW - .4, TN, f); const px = lerp(-1.2, 2.6, out), pz = lerp(.4, -4.8, out * out);
    place(S.scene, { ...REG, ...fx(f, [[0, 'determined'], [TW, 'smug'], [TN, 'happy']]), ...(f > TW - .4 ? { ...waddle(f, 6), lean: .15 } : { sit: f < TO + .2, cs: f < TO + .2 ? .43 : undefined }) }, f < TO + .2 ? -1.2 : px, f < TO + .2 ? .06 : 0, f < TO + .2 ? .35 : pz, f > TW - .4 ? Math.atan2(2.6 + 1.2, -4.8 - .4) : 0);
    place(S.scene, { ...GUARDZ, eyes: 'closed', mouth: 'o', sit: true, nod: .35, still: true }, -.2, .2, -3.4, .4); zz.position.set(0, 1.9 + (f * .4) % .6, -3.4); zz.material.opacity = 1 - ((f * .4) % .6) / .6;
    if (f < TW) path(cam, f, [[0, -.4, 1.1, 2.4, -1.2, .7, .4], [TW, -.1, 1.2, 2.6, -.9, .8, .2]]); else { const kk = ss(TW, TW + .6, f); look(cam, lerp(-.1, px + 2.0, kk), lerp(1.2, 1.6, kk), lerp(2.6, pz + 3.6, kk), lerp(-.9, px + .3, kk), lerp(.8, .9, kk), lerp(.2, pz - .6, kk)); } } }; }, { xf: true });
// 11 "He made it home. He'd mailed himself across the world." - sunrise in front of a little house: he throws his arms up; a WELCOME HOME banner
H_(51.4, 55.15, t0 => { const S = world('day'), cam = newCam(44), h = makeHouse(0xf4e4c8, 0xc8504a, false); h.position.set(0, 0, -4); S.scene.add(h); const ban = card(2.4, .5, (g, w, hh) => { g.fillStyle = '#ffd23a'; g.fillRect(0, 0, w, hh); g.fillStyle = '#1f8a4a'; g.font = `900 ${hh * .5}px Nunito`; g.textAlign = 'center'; g.fillText('WELCOME HOME', w / 2, hh * .68); }, 512); ban.position.set(0, 2.5, -2.68); S.scene.add(ban); const sp = sparkle(S.scene, 50);
  return { scene: S.scene, cam, update(f, fd, tc) { sp.at(tc, tm(53.0), V(0, 2.0, -1.5)); const jump = Math.max(0, Math.sin(f * 6)) * .25 * (f > .6);
    place(S.scene, { ...REG, ...fx(f, [[0, 'smile'], [.6, 'laugh']]), arms: f > .6 ? [[-.4, .7, .1], [.4, .7, .1]] : undefined }, 0, jump, -1.5, 0); place(S.scene, { ...crowdOpt(2), tag: null, ...fx(f, [[0, 'shock'], [1.0, 'happy']]) }, -1.2, 0, -2.0, .4); place(S.scene, { ...crowdOpt(5), tag: null, hat: null, ...fx(f, [[0, 'happy']]), cs: .55 }, 1.1, 0, -1.9, -.4);
    path(cam, f, [[0, 0, 1.2, 4.6, 0, 1.5, -1.8], [fd, .5, 1.3, 3.6, 0, 1.45, -1.8]]); } }; }, { xf: true });
// 12 "Here's why it worked. Back then, airport security checked people, not boxes. Cargo only got weighed and checked for paperwork. Nobody opened it."
H_(55.15, 63.7, t0 => { const S = hall(), cam = newCam(44), arch = new THREE.Group(); S.scene.add(arch); arch.position.set(-1.6, 0, -1.0); for (const s of [-1, 1]) arch.add(at3(box(.15, 2.1, .4, 0x9aa0ac), s * .55, 1.05, 0)); arch.add(at3(box(1.25, .15, .4, 0x9aa0ac), 0, 2.15, 0)); const lamp = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0x5aff8a })); lamp.position.set(-1.6, 2.32, -1.0); lamp.userData.keep = true; S.scene.add(lamp);
  const boxes = [0, 1, 2, 3].map(i => { const c = crate(); c.scale.setScalar(.55); S.scene.add(c); return c; }); const scale = new THREE.Group(); scale.position.set(1.8, 0, .6); S.scene.add(scale); scale.add(at3(box(1.0, .2, 1.0, 0x5a5a64), 0, .1, 0)); const dial = card(.5, .3, (g, w, h) => { g.fillStyle = '#0e1a14'; g.fillRect(0, 0, w, h); g.fillStyle = '#5aff8a'; g.font = `900 ${h * .5}px Nunito`; g.textAlign = 'center'; g.fillText('78 KG', w / 2, h * .68); }, 256); dial.position.set(0, .9, -.52); dial.userData.keep = true; scale.add(dial); scale.add(at3(box(.08, .7, .08, 0x5a5a64), 0, .45, -.55));
  const sc2 = crate(); sc2.scale.setScalar(.55); sc2.position.set(1.8, .2, .6); S.scene.add(sc2); const ok = card(.5, .5, (g, w, h) => { g.fillStyle = '#1aa84a'; g.beginPath(); g.arc(w / 2, h / 2, w * .45, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = w * .1; g.lineCap = 'round'; g.beginPath(); g.moveTo(w * .28, h * .52); g.lineTo(w * .44, h * .68); g.lineTo(w * .74, h * .34); g.stroke(); }, 256); ok.material.transparent = true; ok.userData.keep = true; S.scene.add(ok); const ey = peekEyes(); S.scene.add(ey);
  const TP = at(t0, 57.99), TC = at(t0, 59.97), TO = at(t0, 62.57);
  return { scene: S.scene, cam, update(f, fd, tc) { for (let i = 0; i < 3; i++) { const k = ((f * .25 + i / 3) % 1); place(S.scene, { ...crowdOpt(i + 1), tag: null, ...waddle(f + i), ...fx(f, [[0, 'smile']]) }, -1.6, 0, lerp(1.6, -3.0, k), Math.PI); }
    place(S.scene, { ...GUARDZ, shades: false, ...fx(f, [[0, 'determined']]) }, -2.5, 0, -1.0, Math.PI / 2 * .9); lamp.material.color.setHex(Math.sin(f * 7) > 0 ? 0x5aff8a : 0x2a6a3a);
    boxes.forEach((c, i) => { const k = ((f * .18 + i / 4) % 1); c.position.set(0, .78, lerp(1.5, -6, k)); });
    const okK = pop(f - TC - .9); ok.visible = f > TC + .9; ok.position.set(2.3, 1.6, .6); ok.scale.setScalar(Math.max(.001, okK)); place(S.scene, { ...CLERK, ...fx(f, [[0, 'deadpan'], [TC + .9, 'smile']]), hands: [V(-.25, .7, .35), V(.25, .75, .35)] }, 2.8, 0, .2, -.8);
    ey.visible = f > TO; sc2.updateMatrixWorld(true); ey.position.copy(sc2.localToWorld(V(0, .9, .4))); sc2.userData.lid.rotation.x = f > TO ? -.3 : 0; ey.scale.setScalar(.55);
    path(cam, f, [[0, -3.0, 1.8, 4.6, -1.4, 1.1, -1.4], [TP + .3, -.9, 2.4, 4.8, -.6, 1.0, -1.6], [TC, 1.8, 2.0, 4.4, 1.5, .9, .2], [fd, 2.4, 1.6, 3.2, 1.9, .9, .6]]); } }; }, { xf: true });
// 13 "It's like a club bouncer checking everyone's ID at the door... while somebody walks in through the back with the deliveries."
H_(63.7, 69.5, t0 => { const L = london('night'), cam = newCam(50), club = new THREE.Group(); club.position.set(0, 0, -2.6); L.scene.add(club); club.add(at3(box(5, 3.6, .3, 0x2a1a3a), 0, 1.8, 0)); const neon = card(2.4, .6, (g, w, h) => { g.fillStyle = '#16061e'; g.fillRect(0, 0, w, h); g.shadowColor = '#ff4ad8'; g.shadowBlur = 30; g.fillStyle = '#ff8ae8'; g.font = `900 ${h * .6}px Nunito`; g.textAlign = 'center'; g.fillText('CLUB', w / 2, h * .74); }, 512); neon.position.set(-.8, 2.8, .17); neon.userData.keep = true; club.add(neon); const pl = new THREE.PointLight(0xff4ad8, 6, 5, 1.6); pl.position.set(-.8, 2.6, .8); club.add(pl);
  club.add(at3(box(1.0, 2.0, .1, 0x16121a), -.8, 1.0, .17)); club.add(at3(box(.9, 1.8, .1, 0x4a4a54), 1.9, .9, .17)); const dl = card(.6, .2, (g, w, h) => { g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = `900 ${h * .55}px Nunito`; g.textAlign = 'center'; g.fillText('DELIVERIES', w / 2, h * .72); }, 256); dl.position.set(1.9, 2.0, .18); dl.userData.keep = true; club.add(dl);
  const rope = new THREE.Group(); L.scene.add(rope); for (let i = 0; i < 3; i++) rope.add(at3(box(.06, .9, .06, 0xd8b84a), -1.9 - i * .7, .45, -1.6)); const lp = new THREE.PointLight(0xffd8a0, 5, 6, 1.6); lp.position.set(1.9, 2.2, -1.6); L.scene.add(lp);
  const idc = card(.22, .14, (g, w, h) => { g.fillStyle = '#e8f2ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a8ad8'; g.fillRect(0, 0, w, h * .25); g.fillStyle = '#ffd0a8'; g.fillRect(w * .08, h * .35, w * .3, h * .5); }, 128); L.scene.add(idc); const c = crate(); c.scale.setScalar(.6); L.scene.add(c); const dolly = box(.5, .05, .5, 0x9aa0ac); L.scene.add(dolly); const ey = peekEyes(); L.scene.add(ey); const TB = at(t0, 66.58);
  return { scene: L.scene, cam, update(f, fd, tc) { place(L.scene, { ...BOUNCER, ...fx(f, [[0, 'determined'], [1.6, 'smug']]), hands: [V(-.3, .55, .2), V(.3, .95, .45)] }, -.8, 0, -1.95, .3); const bh = V(0, 0, 0); idc.position.set(-.62, 1.4, -1.3); idc.rotation.y = .3;
    for (let i = 0; i < 4; i++) place(L.scene, { ...crowdOpt(i + 3), tag: null, ...fx(f + i, [[0, 'smile']]), cs: .78 }, -1.6 - i * .7, 0, -1.2, -Math.PI / 2 * .8);
    const k = ss(TB - .3, fd - .3, f); const x = lerp(4.2, 1.9, k), z = lerp(-.2, -2.3, k * k); place(L.scene, { ...DELIV, ...fx(f, [[0, 'smile'], [TB + .8, 'smug']]), ...waddle(f), hands: [V(-.25, .7, .35), V(.25, .7, .35)] }, x + .5, 0, z, -Math.PI / 2 * .9);
    c.position.set(x, .06, z); dolly.position.set(x, .03, z); ey.visible = f > TB + 1.2; c.updateMatrixWorld(true); ey.position.copy(c.localToWorld(V(0, .9, .4))); ey.scale.setScalar(.6); c.userData.lid.rotation.x = ey.visible ? -.3 : 0;
    path(cam, f, [[0, -2.6, 1.6, 2.6, -1.3, 1.2, -1.8], [TB - .3, -.4, 1.7, 3.2, -.4, 1.2, -1.9], [fd, 2.6, 1.5, 2.4, 2.0, .9, -2.1]]); } }; }, { xf: true });
// 14 "And that's how, in 1964, a man mailed himself across the world... in a-" - back on the belt: glide to the exact opening frame (loops)
H_(69.5, 99, t0 => { const S = hall(), cam = newCam(40), c = crate(); S.scene.add(c);
  return { scene: S.scene, cam, update(f, fd, tc) { c.position.set(0, .78, lerp(-4.0, -.7, f / fd)); path(cam, f, [[0, -1.0, 2.6, 3.6, 0, 1.0, -3.0], [fd, .95, 1.3, 2.3, 0, 1.2, -.7]]); } }; }, { xf: true });
// ---------- captions: one word at a time, white with a thick black outline, pop-in ----------
const words0 = (await (await fetch('/build/words.json')).json()).map(w => ({ w: w.w, s: tm(w.s), e: tm(w.e) }));
// Ricks-style captions: lowercase, 1-2 words (tiny words ride with the next one), punctuation kept, smaller, low on screen
const words = []; for (let i = 0; i < words0.length; i++) { const w = words0[i], n = words0[i + 1];
  if (n && w.w.replace(/[^a-z']/gi, '').length <= 3 && !/[.,?!]$/.test(w.w) && n.s - w.e < .25) { words.push({ w: w.w + ' ' + n.w, raw: n.w, s: w.s, e: n.e }); i++; } else words.push({ w: w.w, raw: w.w, s: w.s, e: w.e }); }
words.forEach((w, i) => { const n = words[i + 1]; w.s -= .04; w.e = n ? Math.max(w.e, n.s - .04) : w.e + .5; });
function drawCaption(tc) {
  const c = words.find(w => tc >= w.s && tc < w.e); if (!c) return; const k = 1 + .08 * Math.exp(-(tc - c.s) * 18);
  og.save(); og.translate(W / 2, H * .7); og.scale(k, k); og.font = '900 68px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  const txt = c.w.toLowerCase().replace(/\.\.\./g, ''); og.lineWidth = 15; og.strokeStyle = '#16121a'; og.strokeText(txt, 0, 0); og.fillStyle = '#ffffff'; og.fillText(txt, 0, 0); og.restore();
}
// ---------- frame: render, cross-fades between shots, dream frames, viewfinder, emotion flash, fades ----------
const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d');
const scopeC = document.createElement('canvas'); scopeC.width = W; scopeC.height = H; { const b = scopeC.getContext('2d'); b.fillStyle = '#000'; b.fillRect(0, 0, W, H); b.globalCompositeOperation = 'destination-out'; b.beginPath(); b.arc(W / 2, H * .46, W * .44, 0, 7); b.fill(); }
const bino = document.createElement('canvas'); bino.width = W; bino.height = H; { const b = bino.getContext('2d'); b.fillStyle = '#000'; b.fillRect(0, 0, W, H); b.globalCompositeOperation = 'destination-out'; const r = W * .4; for (const x of [W / 2 - r * .62, W / 2 + r * .62]) { b.beginPath(); b.arc(x, H * .46, r, 0, 7); b.fill(); } }
// ---- camera energy layer, applied on top of every shot ----
const KEY = /1964|^box|broke|watch|crate|cash|nailed|cargo|wrong|paris|sixty|perth|walked|nobody|home|why|boxes|opened|bouncer|deliveries/i;
const kicks = () => words.filter((w, i) => KEY.test(w.w) || /[?!]$/.test(w.raw || '') || (i > 0 && /[?]$/.test(words[i - 1].raw || ''))).map(w => w.s + .04);
let KICKS = null;
function renderShot(s, tc) {
  for (const g of live) { if (g.parent) g.parent.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } live = [];
  NOW = tc; const f = tc - s.f0, fd = s.f1 - s.f0; s.update(f, fd, tc);
  statics.forEach(g => { if (g.parent !== s.scene) return; const b = Math.sin(tc * 4.4 + g.userData.seed), s0 = g.userData.s0; g.scale.set(s0 * (1 + .03 * b), s0 * (1 - .04 * b), s0 * (1 + .03 * b)); });
  const cam = s.cam, fov0 = cam.fov; KICKS = KICKS || kicks();
  let fov = fov0 * (1.06 - .06 * (f / Math.max(fd, .1)));   // slow, steady push through every shot                                   // punchy push-in at the top of every shot
  const kz = KICKS.reduce((a, k) => a + (tc >= k ? Math.exp(-(tc - k) * 9) * (1 - Math.exp(-(tc - k) * 60)) : 0), 0); fov *= 1 - .03 * Math.min(1.3, kz);   // kick-zooms on key words
  if (s.punch && fd > 2.4) { const mid = words.find(w => w.s > s.f0 + fd * .45 && w.s < s.f0 + fd * .78); if (mid && tc >= mid.s) { fov *= .74; cam.rotation.z += .02; } }   // punch-in cut: a second, tighter angle
  cam.rotation.x += (Math.sin(tc * 2.3) * .6 + Math.sin(tc * 5.3 + 1) * .35) * .007; cam.rotation.y += (Math.sin(tc * 1.9 + 2) * .6 + Math.sin(tc * 4.9) * .35) * .007;   // hand-held
  const wo = s.f1 - tc, wi = tc - s.f0;    // whip pan out / in
  cam.fov = fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); (s.hq ? hqRender(s.scene, cam) : (renderer.toneMapping = THREE.NoToneMapping, renderer.render(s.scene, cam))); cam.fov = fov0; cam.updateProjectionMatrix();
}
// motion-blur smear across hard cuts (whip pans)
function whipBlur(tc) { return; let w = 0; for (const s of shots) { if (s.f0 > 0 && !s.xf) w = Math.max(w, 1 - Math.abs(tc - s.f0) / .1); } if (w <= .02) return; tg.drawImage(out, 0, 0); og.save(); og.globalAlpha = .22; for (let k = -4; k <= 4; k++) og.drawImage(tmp, k * 26 * w, 0); og.restore(); }
function post(s, tc) {
  if (s.dream) { og.save(); og.globalCompositeOperation = 'soft-light'; og.globalAlpha = .55; og.fillStyle = s.dream; og.fillRect(0, 0, W, H); og.restore();
    og.save(); og.fillStyle = 'rgba(255,255,255,.92)'; const r = rng(7); for (let i = 0; i < 44; i++) { const side = i % 4, u = r(); const x = side < 2 ? (side ? W : 0) : u * W, y = side < 2 ? u * H : (side === 2 ? 0 : H); og.beginPath(); og.arc(x, y, 70 + r() * 70 + Math.sin(tc * 2 + i) * 6, 0, 7); og.fill(); } og.restore(); }
  if (s.viewfinder) { og.save(); og.strokeStyle = 'rgba(255,255,255,.9)'; og.lineWidth = 8; const m = 90, L = 110; for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { og.beginPath(); og.moveTo(x, y + dy * L); og.lineTo(x, y); og.lineTo(x + dx * L, y); og.stroke(); }
    if (Math.sin(tc * 6) > 0) { og.fillStyle = '#ff2020'; og.beginPath(); og.arc(m + 50, m + 70, 20, 0, 7); og.fill(); } og.font = '900 54px Nunito'; og.fillStyle = '#fff'; og.fillText('REC', m + 85, m + 88); og.textAlign = 'right'; og.fillText(typeof s.viewfinder === 'string' ? s.viewfinder : '03:00 AM', W - m - 30, m + 88);
    og.globalCompositeOperation = 'multiply'; og.fillStyle = 'rgba(160,200,255,.6)'; og.fillRect(0, 0, W, H); og.restore(); }
  if (s.flash) { og.save(); const gr = og.createRadialGradient(W / 2, H * .38, 50, W / 2, H * .38, 700); gr.addColorStop(0, s.flash + 'aa'); gr.addColorStop(1, s.flash + '00'); og.globalCompositeOperation = 'screen'; og.fillStyle = gr; og.fillRect(0, 0, W, H); og.restore(); }
  if (s.doorcam) { og.save(); og.globalCompositeOperation = 'multiply'; og.fillStyle = 'rgb(175,200,235)'; og.fillRect(0, 0, W, H); og.restore();
    const fe = og.createRadialGradient(W / 2, H / 2, W * .38, W / 2, H / 2, H * .6); fe.addColorStop(0, 'rgba(0,0,0,0)'); fe.addColorStop(1, 'rgba(0,0,0,.97)'); og.fillStyle = fe; og.fillRect(0, 0, W, H);
    og.save(); og.font = '900 52px Nunito'; og.fillStyle = '#fff'; og.textAlign = 'left'; og.fillText(s.camLabel || 'FRONT DOOR', 90, 190); og.textAlign = 'right'; og.fillText(s.doorcam, W - 90, 190); if (Math.sin(tc * 6) > 0) { og.fillStyle = '#ff2020'; og.beginPath(); og.arc(110, 262, 17, 0, 7); og.fill(); } og.fillStyle = '#fff'; og.textAlign = 'left'; og.fillText('LIVE', 142, 280); og.restore();
    if (s.circle) { const [cx, cy, rr, k] = s.circle; og.save(); og.strokeStyle = '#ff2a2a'; og.lineWidth = 16; og.lineCap = 'round'; og.beginPath(); og.ellipse(cx, cy, rr, rr * 1.12, -.25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2.15 * k); og.stroke(); og.restore(); } }
  if (s.binoc) og.drawImage(bino, 0, 0);
  if (s.scope) { og.drawImage(scopeC, 0, 0); og.save(); og.strokeStyle = 'rgba(20,20,20,.85)'; og.lineWidth = 4; const cx = W / 2, cy = H * .46, r = W * .44; og.beginPath(); og.moveTo(cx - r, cy); og.lineTo(cx + r, cy); og.moveTo(cx, cy - r); og.lineTo(cx, cy + r); og.stroke(); for (let i = -4; i <= 4; i++) { if (!i) continue; og.beginPath(); og.moveTo(cx + i * r / 5, cy - 14); og.lineTo(cx + i * r / 5, cy + 14); og.stroke(); } og.restore(); }
  if (s.sepia) { og.save(); og.globalCompositeOperation = 'color'; og.globalAlpha = .6; og.fillStyle = '#c8955a'; og.fillRect(0, 0, W, H); og.globalCompositeOperation = 'soft-light'; og.globalAlpha = .45; og.fillStyle = '#ffd08a'; og.fillRect(0, 0, W, H); og.restore(); }
  if (!s.hq) { const vg = og.createRadialGradient(W / 2, H * .45, W * .45, W / 2, H * .45, H * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); og.fillStyle = vg; og.fillRect(0, 0, W, H); }
  if (s.fade) { og.fillStyle = `rgba(0,0,0,${s.fade})`; og.fillRect(0, 0, W, H); }
}
const XF = .22;
function renderAt(tc) {
  const i = shots.findIndex(s => tc >= s.f0 && tc < s.f1), s = shots[i < 0 ? shots.length - 1 : i], nx = shots[i + 1];
  renderShot(s, tc); og.drawImage(renderer.domElement, 0, 0, W, H); post(s, tc);
  if (nx && nx.xf && tc > s.f1 - XF) { tg.drawImage(out, 0, 0); renderShot(nx, nx.f0 + .001); og.drawImage(renderer.domElement, 0, 0, W, H); post(nx, nx.f0); const a = (tc - (s.f1 - XF)) / XF; og.save(); og.globalAlpha = 1 - a; og.drawImage(tmp, 0, 0); og.restore(); }
  whipBlur(tc); drawCaption(tc);
}
window.renderTime = tc => { renderAt(tc); return out.toDataURL('image/jpeg', .92); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(TOTAL * FPS);
await document.fonts.load('900 96px Nunito');
window.captionChunks = words.slice(0, 3); window.ready = true;
