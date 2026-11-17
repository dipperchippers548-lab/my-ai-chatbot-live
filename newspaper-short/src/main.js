// "The Old Man Who Stole Every Newspaper" - noodle-people short (toon shading + ink outlines), rendered frame by frame.
import * as THREE from '/node_modules/three/build/three.module.js';
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
  if (o.robe) { const rb = inked(new THREE.CylinderGeometry(R + .04, R + .09, .5, 18, 1, true), o.robe, .02); rb.position.copy(spine.getPoint(.25)); g.add(rb); const belt = inked(new THREE.TorusGeometry(R + .055, .025, 6, 18), 0xffffff, .012); belt.rotation.x = Math.PI / 2; belt.position.copy(spine.getPoint(.42)); g.add(belt); }
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
    const hand = inked(new THREE.SphereGeometry(.085, 14, 10), col, .016); hand.position.copy(to); g.add(hand);
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
let NOW = 0;   // render clock, so every noodle stays alive between poses
// a noodle that is never quite still: arms drift, the body breathes (squash & stretch), the head bobs and tilts
function place(scene, opts, x, y, z, ry = 0) {
  const seed = (x * 7.13 + z * 3.71 + (opts.color || 0) % 97) % 6.283; let o = opts;
  if (!o.hands && !o.still) { const base = o.arms || [[-.5, -.2, .05], [.5, -.2, .05]], w = Math.sin(NOW * 3.1 + seed), w2 = Math.sin(NOW * 2.3 + seed * 2); o = { ...o, arms: base.map((a, i) => [a[0] + (i ? 1 : -1) * w2 * .03, a[1] + (i ? w : -w) * .07, a[2] + w2 * .04]) }; }
  const g = noodle(o); g.position.set(x, y, z); g.rotation.y = ry;
  const b = Math.sin(NOW * 4.4 + seed), sq = o.squash || 0; g.scale.set(1 + .03 * b + sq * .6, 1 - .04 * b - sq, 1 + .03 * b + sq * .6);
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

// ===================== SHOTS (voiceover clock) =====================
// 1 "Every morning at 5 AM, an old man..." - dark street, a little old man in a bathrobe tiptoeing with a red wagon
shot(0, 2.62, () => { const S = lights(world('night')), cam = newCam(42), wg = wagon(); S.scene.add(wg); wg.userData.fill(3);
  for (const hx of [HS.parkers, HS.millers]) S.scene.add(at3(paper(), hx + .3, .06, -4.35));
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 3, -1); const k = clamp(f / fd), x = lerp(5.4, 3.2, k);
    walkTo(S.scene, { ...WALT, eyes: 'half', mouth: 'smirk', lean: .18, arms: [[-.5, -.15, .15], [.4, -.35, -.3]] }, 5.4, -.15, 3.2, -.15, k, t, -Math.PI / 2);
    wg.position.set(x + 1.15, 0, -.15); wg.rotation.y = Math.PI; look(cam, 1.5, .75, 3.0, 4.2, 1.0, -.6); } }; }, { noCut: true });
// 2 "...named Walt." - close-up: the eyebrows, the smirk
shot(2.62, 3.5, () => { const S = lights(world('night')), cam = newCam(36), wg = wagon(); S.scene.add(wg); wg.userData.fill(3);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 3, -1); const g = place(S.scene, { ...WALT, eyes: 'half', mouth: 'smirk', browUp: Math.abs(Math.sin(t * 10)) * .05, lean: .1 }, 3, 0, -.15, -Math.PI / 2 + .55); wg.position.set(4.2, 0, -.3); wg.rotation.y = Math.PI; faceCam(cam, g, 2.1, .25, .05, -.12); } }; });
// 3 "...steals every newspaper on his street." - he rockets down the street, papers fly off every porch into the wagon
shot(3.5, 5.5, () => { const S = lights(world('night')), cam = newCam(46), wg = wagon(); S.scene.add(wg); const ps = [HS.lees, HS.millers, HS.parkers].map(hx => { const p = paper(); S.scene.add(p); return [p, hx]; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -2, -2); const k = clamp(f / fd), x = lerp(-11.5, 4.6, k), wx = x - 1.15; const sp = stepPose(t * 24);
    place(S.scene, { ...WALT, ...sp, eyes: 'wide', mouth: 'grin', lean: .35 }, x, sp.bob, -.15, Math.PI / 2); wg.position.set(wx, 0, -.15); wg.rotation.y = 0;
    let n = 3; ps.forEach(([p, hx]) => { const u = clamp((x - (hx - .9)) / 1.8); if (u <= 0) { p.visible = true; p.position.copy(porchP(hx)); p.rotation.set(0, 0, 0); } else if (u < 1) flyPaper(p, porchP(hx), V(wx, .55, -.15), u, 2.0); else { p.visible = false; n += 2; } });
    wg.userData.fill(n); look(cam, 7.4, 2.9, 1.7, -4, .5, -2.6); } }; }, { noCut: true });
// 4 "Every single one." - ground level: papers rain into the wagon on every word
shot(5.5, 6.8, () => { const S = lights(world('night')), cam = newCam(40), wg = wagon(); S.scene.add(wg); wg.position.set(-1, 0, -.15); const fl = [paper(), paper(), paper()]; fl.forEach(p => S.scene.add(p)); const T = [5.61, 6.04, 6.43].map(w => at(5.5, w));
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -1, 0); let n = 8, last = -9;
    fl.forEach((p, i) => { const u = clamp((f - T[i] + .22) / .22); if (u >= 1) { n += 2; last = T[i]; p.visible = false; return; } if (u <= 0) { p.visible = false; return; } flyPaper(p, V(-2.2, 1.6, .5), V(-1, .6, -.15), u, .5); });
    wg.userData.fill(Math.min(16, n)); const b = Math.exp(-(f - last) * 14); wg.scale.set(1 + .08 * b, 1 - .1 * b, 1 + .08 * b);
    look(cam, -.05, .42, 1.15, -1.05, .45, -.2); } }; }, { noCut: true });
// 5 "And nobody knows it's him." - morning: a neighbour stares at the empty sidewalk... Walt waves from his rocking chair
shot(6.8, 8.85, () => { const S = lights(world('morning')), cam = newCam(40), q = sprite('?', '#ffd23a', .55), rk = rocker(), mg = mug(); S.scene.add(q, rk, mg); rk.position.set(HS.walt + .2, 0, -4.2); rk.rotation.y = -.35;
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 6, -2); const g = place(S.scene, { ...nb(1), eyes: 'open', mouth: 'flat', nod: .35, arms: [[-.6, .1, .2], [.6, .1, .2]] }, 4.5, 0, -1.2, .5); g.updateMatrixWorld(true); q.position.copy(g.userData.head.localToWorld(V(0, .6, 0))); q.scale.setScalar(Math.max(.001, .6 * pop(f - .45)));
    const w = place(S.scene, { ...WALT, sit: true, eyes: 'happy', mouth: 'smile', hands: [V(-.32, 1.0 + Math.max(0, Math.sin(t * 7)) * .38, .3), V(.25, .95, .35)] }, HS.walt + .2, -.03, -4.15, -.35); w.updateMatrixWorld(true); mg.position.copy(w.localToWorld(V(.25, 1.0, .42)));
    look(cam, 3.7, 1.4, 2.2, 5.95, 1.0, -2.3); } }; });
// 6 "The neighbors buy cameras." - cameras pop onto the house front, one after another
shot(8.85, 10.6, () => { const S = lights(world('day')), cam = newCam(56); const hx = HS.parkers; const cams = [[-.55, 1.55, 0], [.85, 2.0, 0], [-.9, .95, 0], [.5, .9, 0], [0, 2.05, 0], [-.2, 1.3, 0]].map(([dx, y]) => { const c = secCam(); c.position.set(hx + dx, y, -4.86); S.scene.add(c); return c; }); const T0 = at(8.85, 9.45);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, hx, -3); cams.forEach((c, i) => { c.scale.setScalar(Math.max(.001, pop(f - T0 - i * .1))); c.rotation.set(.2, Math.sin(t * 2.4 + i * 1.3) * .5, 0); c.userData.led.visible = Math.sin(t * 9 + i) > 0; });
    look(cam, hx + .35, 1.45, -1.6, hx, 1.4, -4.9); } }; });
// 7 "Walt wears a raincoat and a Halloween mask." - on his porch at night: raincoat - POP - mask - POP
shot(10.6, 13.15, () => { const S = lights(world('night')), cam = newCam(40); const TR = at(10.6, 11.22), TM = at(10.6, 12.48);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -3); const rc = f >= TR, mk = f >= TM; const sq = mk ? .1 * Math.exp(-(f - TM) * 9) : rc ? .1 * Math.exp(-(f - TR) * 9) : 0;
    place(S.scene, { ...WALT, robe: rc ? null : WALT.robe, raincoat: rc, mask: mk, eyes: rc ? 'happy' : 'half', mouth: 'smirk', squash: -sq, arms: mk ? [[-.5, .25, .2], [.5, .25, .2]] : undefined }, HS.walt, 0, -4.35, 0);
    look(cam, HS.walt + .6, 1.4, -1.35, HS.walt, 1.1, -4.35); } }; }, { noCut: true });
// 8 "They call the police." - squad car slides in, lights going
shot(13.15, 14.45, () => { const S = lights(world('day')), cam = newCam(44), pc = car(0xf6f6f6, true); S.scene.add(pc); const pl = new THREE.PointLight(0xff2a2a, 14, 7); S.scene.add(pl);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 2, 0); const k = 1 - Math.pow(1 - clamp(f / (fd * .75)), 3); pc.position.set(lerp(10, 2.6, k), 0, 1.3); pc.rotation.y = Math.PI; const on = Math.sin(t * 14) > 0; pc.userData.red.visible = on; pc.userData.blue.visible = !on; pl.color.set(on ? 0xff2a2a : 0x2a5aff); pl.position.copy(pc.position).add(V(0, 1.8, -.6));
    look(cam, -.3, .75, 5.5, 3.0, .9, 1.0); } }; }, { noCut: true });
// 9 "The officer says," - low hero angle, a neighbour pointing at the porch
shot(14.45, 15.65, () => { const S = lights(world('day')), cam = newCam(46), pc = car(0xf6f6f6, true); S.scene.add(pc); pc.position.set(2.6, 0, 1.3); pc.rotation.y = Math.PI;
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 2, -1); const on = Math.sin(t * 14) > 0; pc.userData.red.visible = on; pc.userData.blue.visible = !on;
    place(S.scene, { ...COP }, 2.2, 0, -.6, .3); place(S.scene, { ...nb(3), eyes: 'wide', mouth: 'open', hands: [V(-.3, .9, .2), V(.45, 1.45, -.45)] }, 1.25, 0, -.8, .9);
    look(cam, 3.45, .4, .45, 2.0, 1.65, -.7); } }; }, { noCut: true });
// 10 "Sir... it's a newspaper. Just read it online." - deadpan (lip sync), holds up his phone on "online"
shot(15.65, 19.45, () => { const S = lights(world('day')), cam = newCam(38), ph = card(.16, .28, (g, w, h) => { g.fillStyle = '#16121a'; g.fillRect(0, 0, w, h); g.fillStyle = '#4ab8ff'; g.fillRect(w * .1, h * .07, w * .8, h * .86); g.fillStyle = '#fff'; g.font = `900 ${w * .22}px Nunito`; g.textAlign = 'center'; g.fillText('NEWS', w / 2, h * .28); for (let i = 0; i < 5; i++) g.fillRect(w * .2, h * (.4 + i * .1), w * .6, h * .035); }, 120); S.scene.add(ph); const TP = at(15.65, 18.4);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 2, -1); const m = talkIf(t, 15.7, 19.2), up = ss(TP, TP + .25, f);
    const hand = V(.3, lerp(.85, 1.42, up), lerp(.3, .5, up)); const g = place(S.scene, { ...COP, mouth: m || 'flat', eyes: 'half', hands: [V(-.3, .85, .28), hand] }, 2.2, 0, -.6, .3); g.updateMatrixWorld(true);
    ph.visible = up > .02; ph.position.copy(g.localToWorld(hand.clone().add(V(0, .14, .04)))); ph.rotation.set(0, .3, 0); faceCam(cam, g, 2.35, -.35, .05, -.18); } }; });
// 11 "For twenty years, nobody catches him." - time-lapse: day, night, day, night... and a blur with a wagon every night
shot(19.45, 22.25, () => { const S = lights(world('day')), cam = newCam(48), wg = wagon(); S.scene.add(wg); wg.userData.fill(12);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, -2); const ph = (f * 2.4) % 1, night = ph > .5; dayNight(S, night);
    if (night) { const x = lerp(-9, 9, (ph - .5) * 2), sp = stepPose(t * 30); place(S.scene, { ...WALT, ...sp, lean: .35, eyes: 'wide', mouth: 'grin' }, x, sp.bob, -.15, Math.PI / 2); wg.visible = true; wg.position.set(x - 1.15, 0, -.15); } else wg.visible = false;
    look(cam, 0, 7.5, 7.5, 0, 0, -2.3); } }; }, { noCut: true });
// 12 "Until a kid checks his doorbell camera," - a kid on his bed, face lit by the tablet
shot(22.25, 24.35, () => { const R = bedroom(), cam = newCam(40), tb = card(.42, .3, (g, w, h) => { g.fillStyle = '#24222c'; g.fillRect(0, 0, w, h); g.fillStyle = '#4ab8ff'; g.fillRect(w * .06, h * .08, w * .88, h * .84); }, 64), gl = new THREE.PointLight(0x6ab8ff, 1.0, 2.5); R.scene.add(tb, gl); const TC = at(22.25, 23.07);
  return { scene: R.scene, cam, update(f, fd, t) { const nar = f > TC; const g = place(R.scene, { ...KID, sit: true, eyes: nar ? 'half' : 'open', mouth: nar ? 'flat' : 'o', nod: .22, hands: [V(-.18, .95, .42), V(.18, .95, .42)] }, -1.2, .3, -.05, 0); g.scale.multiplyScalar(.82); g.updateMatrixWorld(true);
    tb.position.copy(g.localToWorld(V(0, 1.02, .52))); tb.rotation.set(-.55, 0, 0); gl.position.copy(g.localToWorld(V(0, 1.35, .45)));
    const hp = g.userData.head.localToWorld(V(0, -.2, 0)); look(cam, hp.x + .45, hp.y + .1, hp.z + 1.55, hp.x, hp.y - .2, hp.z); } }; });
// 13 "...and sees Walt lift the mask to sneeze." - doorbell-cam POV: mask up... ah... CHOO - freeze, zoom, red circle
shot(24.35, 26.95, () => { const S = lights(world('night')), cam = newCam(80), p = paper(); S.scene.add(p); const hx = HS.parkers, TL = at(24.35, 25.14), TS = at(24.35, 26.0), TF = TS + .25;
  return { scene: S.scene, cam, doorcam: '05:02 AM', update(f, fd, t) { setSun(S, hx, -3); const ff = Math.min(f, TF); NOW = tm(24.35) + ff;
    const pre = ff > TS - .32 && ff < TS ? (ff - TS + .32) / .32 : 0, hit = ff >= TS, z = ss(TF, TF + .25, f);
    const g = place(S.scene, { ...COSTUME, maskUp: ss(TL, TL + .3, ff), lean: .4 * (1 - ss(0, .35, ff)), eyes: hit || pre > 0 ? 'closed' : 'half', mouth: hit ? 'scream' : pre > 0 ? 'o' : 'flat', nod: hit ? .38 : -pre * .5, hands: [V(-.3, .85, .25), V(.28, .95, .3)] }, hx + .15, 0, -3.05, Math.PI);
    g.updateMatrixWorld(true); p.position.copy(g.localToWorld(V(-.33, .86, .3))); p.rotation.set(0, Math.PI / 2, 0);
    const hp = g.userData.head.localToWorld(V(0, 0, 0)); cam.fov = lerp(80, 42, z); look(cam, hx, 1.3, -4.75, hp.x, hp.y - .25 * (1 - z), hp.z);
    this.circle = f > TF + .1 ? [W / 2, H / 2, 290, clamp((f - TF - .1) / .3)] : null; } }; }, { noCut: true });
// 14 "The whole street storms Walt's porch," - from Walt's door: the mob marches up the path
shot(26.95, 28.65, () => { const S = lights(world('day')), cam = newCam(48);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2); const k = clamp(f / fd);
    for (let i = 0; i < 7; i++) { const row = Math.floor(i / 3), col = i % 3 - 1 + (row % 2) * .5, x = HS.walt + col * .75, z0 = .9 + row * .85 + (i % 2) * .15;
      walkTo(S.scene, { ...nb(i), eyes: 'open', mouth: i % 2 ? 'scream' : 'frown', brow: .35, arms: [[-.5, .55, .1], [.55, .75, .15]] }, x, z0, x, z0 - 3.1, k, t, Math.PI); }
    look(cam, HS.walt + .2, .55, -4.45, HS.walt, 1.25, -1.0); } }; }, { noCut: true });
// 15 "...screaming." - right in his face, fists shaking, camera shaking
shot(28.65, 30.3, () => { const S = lights(world('day')), cam = newCam(46);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2);
    [[-.6, -3.0, 0], [.08, -2.8, 1], [.65, -3.05, 2], [-.3, -2.15, 3], [.4, -2.05, 4]].forEach(([dx, z, i]) => place(S.scene, { ...nb(i), eyes: 'wide', mouth: 'scream', brow: .35, arms: [[-.5, .6 + Math.sin(t * 16 + i) * .25, .2], [.5, .6 + Math.cos(t * 15 + i) * .25, .2]] }, HS.walt + dx, Math.abs(Math.sin(t * 9 + i)) * .08, z, Math.PI + dx * .3));
    look(cam, HS.walt + .1, 1.55, -4.55, HS.walt, 1.35, -2.6); shake(cam, t, .025); } }; }, { noCut: true });
// 16 "Walt doesn't argue." - calm as anything, coffee in hand
shot(30.3, 31.35, () => { const S = lights(world('day')), cam = newCam(42), mg = mug(); S.scene.add(mg);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2); const w = place(S.scene, { ...WALT, eyes: 'half', mouth: 'flat', hands: [V(-.25, .85, .2), V(.2, 1.05, .38)] }, HS.walt, 0, -4.4, 0); w.updateMatrixWorld(true); mg.position.copy(w.localToWorld(V(.2, 1.1, .42)));
    [[-.95, -2.5, 0], [.9, -2.6, 2]].forEach(([dx, z, i]) => place(S.scene, { ...nb(i), mouth: 'scream', arms: [[-.5, .6 + Math.sin(t * 16 + i) * .2, .2], [.5, .6, .2]] }, HS.walt + dx, 0, z, Math.PI));
    look(cam, HS.walt - .2, 1.55, -1.3, HS.walt, 1.25, -4.4); } }; });
// 17 "He just says, Okay. I'll stop." - (lip sync) a little shrug
shot(31.35, 34.15, () => { const S = lights(world('day')), cam = newCam(38), mg = mug(); S.scene.add(mg); const TO = at(31.35, 32.41);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2); const m = talkIf(t, 32.35, 33.65), sh = ss(TO - .1, TO + .15, f) * (1 - ss(TO + 1.0, TO + 1.3, f));
    const w = place(S.scene, { ...WALT, eyes: 'half', mouth: m || 'flat', tilt: sh * .15, hands: [V(-.42 - sh * .15, .9 + sh * .32, .25), V(.2, 1.05, .38)] }, HS.walt, 0, -4.4, 0); w.updateMatrixWorld(true); mg.position.copy(w.localToWorld(V(.2, 1.1, .42)));
    faceCam(cam, w, 1.9, .3, .05, -.15); } }; });
// 18 "And he does." - next dawn: the paper just... lies there
shot(34.15, 35.4, () => { const S = lights(world('morning')), cam = newCam(40); S.scene.add(at3(paper(), HS.parkers + .3, .06, -4.3));
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.parkers, -3); look(cam, HS.parkers + .65, .24, -3.45, HS.parkers + .2, .32, -4.8); } }; }, { xf: true, noCut: true });
// 19 "The next week, the Millers go on vacation." - convertible, suitcases, waving... gone
shot(35.4, 37.9, () => { const S = lights(world('day')), cam = newCam(44), c = car(0x38b8e8, false); S.scene.add(c); const TG = at(35.4, 36.85);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.millers, 0); const k = Math.pow(clamp((f - TG) / 1.3), 2); c.position.set(HS.millers - k * 10, 0, 1.3); c.rotation.y = Math.PI; c.updateMatrixWorld(true);
    MILLER.forEach((o, i) => { const lp = [V(.25, .08, .28), V(.25, .08, -.28), V(-.45, .08, 0)][i], wp = c.localToWorld(lp.clone()); place(S.scene, { ...o, sit: true, eyes: 'happy', mouth: 'grin', turn: -.9, arms: [[-.5, .3, .1], [.5, .75 + Math.sin(t * 12 + i) * .25, .1]] }, wp.x, wp.y, wp.z, -Math.PI / 2); });
    look(cam, HS.millers - 2.6, 1.9, -2.7, HS.millers + .1, 1.0, 1.3); } }; }, { noCut: true });
// 20 "Their newspapers pile up on the porch." - day, night, day... thump, thump, thump
shot(37.9, 40.35, () => { const S = lights(world('day')), cam = newCam(42), pile = paperPile(9, 2); pile.position.set(HS.millers + .3, 0, -4.3); S.scene.add(pile); darkWindows(S.daveHouse); const T0 = at(37.9, 38.15);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.millers, -3); const n = 1 + clamp(Math.floor((f - T0) / .22) + 1, 0, 6) + (f > T0 + 1.6 ? 2 : 0); pile.userData.setN(n); dayNight(S, (f * 3.2) % 1 > .5);
    look(cam, HS.millers + 1.05, .38, -2.9, HS.millers + .25, .3, -4.5); } }; }, { noCut: true });
// 21 "And their house gets robbed." - CRASH, and out walks a burglar with their TV
shot(40.35, 42.1, () => { const S = lights(world('night')), cam = newCam(44), pile = paperPile(9, 2), tvp = tv(); pile.position.set(HS.millers + .3, 0, -4.3); pile.userData.setN(9); S.scene.add(pile, tvp); darkWindows(S.daveHouse); const sh = shards(S.scene), TB = at(40.35, 41.3);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.millers, -3); const k = clamp(f / fd), hd = V(0, 1.0, .38);
    const g = walkTo(S.scene, { ...BURG, eyes: 'half', mouth: 'grin', lean: .12, hands: [V(-.28, 1.0, .33), V(.28, 1.0, .33)] }, HS.millers - .35, -4.5, HS.millers - .15, -2.7, k, t, .1); g.updateMatrixWorld(true); tvp.position.copy(g.localToWorld(hd.clone().add(V(0, .05, .1)))); tvp.rotation.y = .1;
    sh.update(f - TB, V(HS.millers - 1, 1.35, -4.86)); look(cam, HS.millers + .95, 1.25, -1.2, HS.millers - .25, 1.0, -3.9); } }; }, { noCut: true });
// 22 "Then the Parkers." - CRASH - burglar with a lamp
shot(42.1, 43.15, () => { const S = lights(world('night')), cam = newCam(42), pile = paperPile(8, 3), lp = lamp(); pile.position.set(HS.parkers + .3, 0, -4.3); pile.userData.setN(8); S.scene.add(pile, lp); darkWindows(S.garyHouse); const sh = shards(S.scene), TB = at(42.1, 42.5);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.parkers, -3); const k = clamp(f / fd);
    const g = walkTo(S.scene, { ...BURG, eyes: 'half', mouth: 'smirk', hands: [V(-.2, 1.1, .3), V(.2, .85, .3)] }, HS.parkers + .1, -4.5, HS.parkers + 1.1, -3.3, k, t, .75); g.updateMatrixWorld(true); lp.position.copy(g.localToWorld(V(0, .5, .38)));
    sh.update(f - TB, V(HS.parkers + 1, 1.35, -4.86)); look(cam, HS.parkers + 2.7, .5, -2.3, HS.parkers + .6, 1.1, -4.3); } }; }, { noCut: true });
// 23 "Then the Lees." - CRASH - burglar tiptoeing off with the goldfish
shot(43.15, 44.4, () => { const S = lights(world('night')), cam = newCam(44), pile = paperPile(10, 4), fb = fishbowl(); pile.position.set(HS.lees + .3, 0, -4.3); pile.userData.setN(10); S.scene.add(pile, fb); darkWindows(S.patelHouse); const sh = shards(S.scene), TB = at(43.15, 43.55);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.lees, -3); const k = clamp(f / fd);
    const g = walkTo(S.scene, { ...BURG, eyes: 'wide', mouth: 'grin', hands: [V(-.18, 1.05, .36), V(.18, 1.05, .36)] }, HS.lees - .2, -4.4, HS.lees - .65, -2.75, k, t, -.25); g.updateMatrixWorld(true); fb.position.copy(g.localToWorld(V(0, 1.15, .45))); fb.userData.fish.position.x = Math.sin(t * 5) * .06;
    sh.update(f - TB, V(HS.lees - 1, 1.35, -4.86)); look(cam, HS.lees + .7, 3.3, -1.1, HS.lees - .35, .65, -3.9); } }; }, { noCut: true });
// 24 "Turns out, burglars look for one thing." - a burglar behind a hedge raises his binoculars
shot(44.4, 45.7, () => { const S = lights(world('night')), cam = newCam(40), bn = binos(), bush = hedge(1.5); bush.position.set(5, .35, .5); S.scene.add(bn, bush); const TU = at(44.4, 45.17);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 5, 0); const u = ss(TU - .3, TU, f);
    const g = place(S.scene, { ...BURG, eyes: 'half', mouth: 'smirk', hands: [V(-.13, lerp(.85, 1.58, u), lerp(.3, .44, u)), V(.13, lerp(.85, 1.58, u), lerp(.3, .44, u))] }, 5, 0, 1.0, Math.PI); g.updateMatrixWorld(true); bn.position.copy(g.localToWorld(V(0, lerp(.9, 1.6, u), lerp(.36, .52, u)))); bn.rotation.y = Math.PI;
    look(cam, 5.45, 1.15, -1.9, 5, 1.25, 1.0); } }; });
// 25 "A pile of newspapers." - binocular POV: clean porch, clean porch... PILE - zoom
shot(45.7, 48.8, () => { const S = lights(world('night')), cam = newCam(30), pile = paperPile(9, 2); pile.position.set(HS.millers + .3, 0, -4.3); pile.userData.setN(9); S.scene.add(pile); darkWindows(S.daveHouse); const TP = at(45.7, 47.21);
  return { scene: S.scene, cam, binoc: true, update(f, fd, t) { setSun(S, 2, -3); const k = ss(0, TP, f), x = lerp(HS.walt + .3, HS.millers + .3, k) + Math.sin(f * 6) * .2 * (1 - k);
    cam.fov = lerp(30, 12, ss(TP, TP + .35, f)); look(cam, 5, 1.45, 1.0, x, lerp(1.0, .3, k), -4.3); } }; }, { noCut: true });
// 26 "It means nobody's home." - dark windows, a pile on the porch, slow push in
shot(48.8, 50.4, () => { const S = lights(world('night')), cam = newCam(42), pile = paperPile(9, 2); pile.position.set(HS.millers + .3, 0, -4.3); pile.userData.setN(9); S.scene.add(pile); darkWindows(S.daveHouse);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.millers, -3); const k = ss(0, fd, f); look(cam, HS.millers + .4, lerp(1.7, .8, k), lerp(.8, -2.5, k), HS.millers + .2, lerp(1.4, .55, k), -4.6); } }; }, { noCut: true });
// 27 "For twenty years, Walt took every paper on the street," - flashback (warm, sepia): Walt and his wagon at dawn
shot(50.4, 53.65, () => { const S = lights(world('morning')), cam = newCam(42), wg = wagon(); S.scene.add(wg); const ps = [HS.millers, HS.parkers].map(hx => { const p = paper(); S.scene.add(p); return [p, hx]; });
  return { scene: S.scene, cam, sepia: true, update(f, fd, t) { setSun(S, 0, -2); const k = clamp(f / fd), x = lerp(-6, 1.8, k), wx = x - 1.15;
    walkTo(S.scene, { ...WALT, eyes: 'half', mouth: 'smile' }, -6, -.15, 1.8, -.15, k, t, Math.PI / 2); wg.position.set(wx, 0, -.15); wg.rotation.y = 0;
    let n = 4; ps.forEach(([p, hx]) => { const u = clamp((x - (hx - .6)) / 1.2); if (u <= 0) { p.visible = true; p.position.copy(porchP(hx)); p.rotation.set(0, 0, 0); } else if (u < 1) flyPaper(p, porchP(hx), V(wx, .55, -.15), u, 1.8); else { p.visible = false; n += 1; } }); wg.userData.fill(n);
    look(cam, x + 1.6, 1.3, 2.6, x - .2, .8, -1.2); } }; }, { xf: true, noCut: true });
// 28 "...so no house ever looked empty." - (flashback) the burglar checks: clean porch, clean porch... shrug
shot(53.65, 55.85, () => { const S = lights(world('morning')), cam = newCam(40), bn = binos(), bush = hedge(1.5), q = sprite('?', '#ffd23a', .5); bush.position.set(5, .35, .5); S.scene.add(bn, bush, q); const TS = at(53.65, 54.6);
  return { scene: S.scene, cam, sepia: true, update(f, fd, t) { setSun(S, 5, 0); const s = ss(TS, TS + .25, f);
    const g = place(S.scene, { ...BURG, eyes: s > .5 ? 'open' : 'half', mouth: s > .5 ? 'frown' : 'flat', tilt: s * .2, hands: [V(-.45 - s * .12, lerp(1.0, 1.3, s), .3), V(.45 + s * .12, lerp(1.0, 1.3, s), .3)] }, 5, 0, 1.0, Math.PI); g.updateMatrixWorld(true);
    bn.position.copy(g.localToWorld(V(-.5 - s * .12, lerp(1.03, 1.33, s), .32))); q.position.copy(g.userData.head.localToWorld(V(0, .62, 0))); q.scale.setScalar(Math.max(.001, .5 * pop(f - TS)));
    look(cam, 5.35, 1.35, -1.1, 5, 1.25, 1.0); } }; });
// 29 "Not one break-in. Ever." - Walt's living room: towers of 20 years of newspapers, Walt sipping his tea
shot(55.85, 58.1, () => { const R = room(0xffe8c8), cam = newCam(46), mg = mug(), ch = armchair(); R.scene.add(mg, ch); ch.position.set(0, 0, -.6); const r = rng(9);
  for (let i = 0; i < 30; i++) { const side = i % 3, h = 1.2 + r() * 2.0, s = stack(h); if (side === 2) s.position.set(-2.4 + (i / 30) * 4.8 + r() * .2, h / 2, -2.6); else s.position.set((side ? 1 : -1) * (1.25 + r() * .9), h / 2, -2.2 + r() * 2.6); s.rotation.y = (r() - .5) * .25; R.scene.add(s); }
  return { scene: R.scene, cam, update(f, fd, t) { const sp = Math.sin(t * 2.5) > .6; const w = place(R.scene, { ...WALT, sit: true, eyes: sp ? 'closed' : 'happy', mouth: 'smile', hands: [V(-.3, .9, .25), V(.2, sp ? 1.28 : 1.0, .38)] }, 0, -.05, -.6, 0); w.updateMatrixWorld(true); mg.position.copy(w.localToWorld(V(.2, sp ? 1.3 : 1.03, .44)));
    look(cam, .3, 1.55, 2.7 - f * .3, 0, 1.25, -1.0); } }; });
// 30 "Now every morning, the whole street walks their newspaper over to Walt's porch." - a happy line, the pile grows
shot(58.1, 62.3, () => { const S = lights(world('day')), cam = newCam(44), pile = paperPile(30, 5), rk = rocker(), fly = paper(); pile.position.set(HS.walt + .6, 0, -4.15); S.scene.add(pile, rk, fly); rk.position.set(HS.walt - .55, 0, -4.35); const held = [...Array(5)].map(() => { const p = paper(); S.scene.add(p); return p; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2); const per = .6, ph = (f % per) / per, cnt = Math.floor(f / per); pile.userData.setN(Math.min(30, 8 + cnt));
    for (let i = 0; i < 6; i++) { const z = -3.35 + i * .62, front = i === 0, ar = front ? Math.sin(ph * Math.PI) : 0;
      const g = place(S.scene, { ...nb(i + 2), eyes: 'happy', mouth: 'smile', hands: [V(-.3, .85, .2), V(.3, lerp(.95, 1.5, ar), lerp(.35, .5, ar))] }, HS.walt + .6 + (i % 2) * .08, 0, z, Math.PI); if (!front) { g.updateMatrixWorld(true); held[i - 1].position.copy(g.localToWorld(V(.3, .97, .42))); } }
    flyPaper(fly, V(HS.walt + .6, 1.45, -3.0), V(HS.walt + .6, pile.userData.top(8 + cnt) + .1, -4.15), ph, .5);
    place(S.scene, { ...WALT, sit: true, eyes: 'happy', mouth: 'smile', hands: [V(-.32, 1.0 + Math.max(0, Math.sin(t * 6)) * .32, .3), V(.25, .95, .35)] }, HS.walt - .55, -.03, -4.3, .3);
    look(cam, HS.walt - 2.9, 2.4, .3, HS.walt + .2, .95, -3.6); } }; }, { noCut: true });
// 31 "He still doesn't read them." - rocking chair, a mountain of papers, he glances at today's... tosses it on the pile. sip.
shot(62.3, 99, () => { const S = lights(world('day')), cam = newCam(38), pile = paperPile(42, 6), rk = rocker(), np = paper(), mg = mug(); pile.position.set(HS.walt + .75, 0, -4.25); S.scene.add(pile, rk, np, mg); rk.position.set(HS.walt - .2, 0, -4.35); const TA = at(62.3, 62.5), TT = at(62.3, 63.45);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2); const rock = Math.sin(t * 2.2) * .05; rk.rotation.x = rock; const a = ss(TA, TA + .3, f), k = ss(TT, TT + .4, f);
    const hand = V(lerp(.22, .5, k), lerp(.95, 1.25, a) + Math.sin(k * Math.PI) * .2, .38); const w = place(S.scene, { ...WALT, sit: true, eyes: 'half', mouth: 'flat', turn: k > .05 && k < .95 ? .45 : 0, nod: a * (1 - k) * .2, hands: [V(-.3, .95, .3), hand] }, HS.walt - .2, -.03, -4.3, 0); w.rotation.x = rock; w.updateMatrixWorld(true);
    const hw = w.localToWorld(hand.clone().add(V(0, .03, .04))); if (k <= 0) { np.visible = true; np.position.copy(hw); np.rotation.set(0, .3, 0); } else if (k < 1) flyPaper(np, hw, V(HS.walt + .75, 1.25, -4.25), k, .4); else { np.position.set(HS.walt + .75, 1.2, -4.2); np.rotation.set(0, .5, 0); }
    mg.position.copy(w.localToWorld(V(-.3, .98, .4)));
    const hp = w.userData.head.localToWorld(V(0, -.2, 0)); look(cam, hp.x - .45, hp.y + .1, hp.z + 2.4 - f * .12, hp.x + .25, hp.y - .25, hp.z); this.fade = ss(fd - .5, fd - .05, f); } }; }, { noCut: true });
// ---------- captions: one word at a time, white with a thick black outline, pop-in ----------
const words = (await (await fetch('/build/words.json')).json()).map(w => ({ w: w.w.replace(/[.,?!]+$/, ''), raw: w.w, s: tm(w.s), e: tm(w.e) }));
words.forEach((w, i) => { const n = words[i + 1]; w.s -= .04; w.e = n ? Math.max(w.e, n.s - .04) : w.e + .5; });
function drawCaption(tc) {
  const c = words.find(w => tc >= w.s && tc < w.e); if (!c) return; const k = 1 + .12 * Math.exp(-(tc - c.s) * 18);
  og.save(); og.translate(W / 2, H * .66); og.scale(k, k); og.font = '900 96px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  og.lineWidth = 20; og.strokeStyle = '#16121a'; og.strokeText(c.w.toUpperCase(), 0, 0); og.fillStyle = '#ffffff'; og.fillText(c.w.toUpperCase(), 0, 0); og.restore();
}
// ---------- frame: render, cross-fades between shots, dream frames, viewfinder, emotion flash, fades ----------
const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d');
const bino = document.createElement('canvas'); bino.width = W; bino.height = H; { const b = bino.getContext('2d'); b.fillStyle = '#000'; b.fillRect(0, 0, W, H); b.globalCompositeOperation = 'destination-out'; const r = W * .4; for (const x of [W / 2 - r * .62, W / 2 + r * .62]) { b.beginPath(); b.arc(x, H * .46, r, 0, 7); b.fill(); } }
// ---- camera energy layer, applied on top of every shot ----
const KEY = /^walt$|steals|single|cameras|mask|police|^sir|online|sneeze|storms|screaming|^stop|robbed|parkers|lees|thing|nobody's|empty|^ever$|^read/i
const kicks = () => words.filter((w, i) => KEY.test(w.w) || /[?!]$/.test(w.raw || '') || (i > 0 && /[?]$/.test(words[i - 1].raw || ''))).map(w => w.s + .04);
let KICKS = null;
function renderShot(s, tc) {
  for (const g of live) { if (g.parent) g.parent.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } live = [];
  NOW = tc; const f = tc - s.f0, fd = s.f1 - s.f0; s.update(f, fd, tc);
  statics.forEach(g => { if (g.parent !== s.scene) return; const b = Math.sin(tc * 4.4 + g.userData.seed), s0 = g.userData.s0; g.scale.set(s0 * (1 + .03 * b), s0 * (1 - .04 * b), s0 * (1 + .03 * b)); });
  const cam = s.cam, fov0 = cam.fov; KICKS = KICKS || kicks();
  let fov = fov0 * (1.13 - .13 * (1 - Math.exp(-f * 5)));                                   // punchy push-in at the top of every shot
  const kz = KICKS.reduce((a, k) => a + (tc >= k ? Math.exp(-(tc - k) * 9) * (1 - Math.exp(-(tc - k) * 60)) : 0), 0); fov *= 1 - .06 * Math.min(1.3, kz);   // kick-zooms on key words
  if (!s.noCut && fd > 2.4) { const mid = words.find(w => w.s > s.f0 + fd * .45 && w.s < s.f0 + fd * .78); if (mid && tc >= mid.s) { fov *= .74; cam.rotation.z += .02; } }   // punch-in cut: a second, tighter angle
  cam.rotation.x += (Math.sin(tc * 2.3) * .6 + Math.sin(tc * 5.3 + 1) * .35) * .007; cam.rotation.y += (Math.sin(tc * 1.9 + 2) * .6 + Math.sin(tc * 4.9) * .35) * .007;   // hand-held
  const wo = s.f1 - tc, wi = tc - s.f0; if (wo < .1) cam.rotation.y -= (1 - wo / .1) ** 2 * .35; if (wi < .1 && !s.xf) cam.rotation.y += (1 - wi / .1) ** 2 * .35;   // whip pan out / in
  cam.fov = fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); renderer.render(s.scene, cam); cam.fov = fov0; cam.updateProjectionMatrix();
}
// motion-blur smear across hard cuts (whip pans)
function whipBlur(tc) { let w = 0; for (const s of shots) { if (s.f0 > 0 && !s.xf) w = Math.max(w, 1 - Math.abs(tc - s.f0) / .1); } if (w <= .02) return; tg.drawImage(out, 0, 0); og.save(); og.globalAlpha = .22; for (let k = -4; k <= 4; k++) og.drawImage(tmp, k * 26 * w, 0); og.restore(); }
function post(s, tc) {
  if (s.dream) { og.save(); og.globalCompositeOperation = 'soft-light'; og.globalAlpha = .55; og.fillStyle = s.dream; og.fillRect(0, 0, W, H); og.restore();
    og.save(); og.fillStyle = 'rgba(255,255,255,.92)'; const r = rng(7); for (let i = 0; i < 44; i++) { const side = i % 4, u = r(); const x = side < 2 ? (side ? W : 0) : u * W, y = side < 2 ? u * H : (side === 2 ? 0 : H); og.beginPath(); og.arc(x, y, 70 + r() * 70 + Math.sin(tc * 2 + i) * 6, 0, 7); og.fill(); } og.restore(); }
  if (s.viewfinder) { og.save(); og.strokeStyle = 'rgba(255,255,255,.9)'; og.lineWidth = 8; const m = 90, L = 110; for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { og.beginPath(); og.moveTo(x, y + dy * L); og.lineTo(x, y); og.lineTo(x + dx * L, y); og.stroke(); }
    if (Math.sin(tc * 6) > 0) { og.fillStyle = '#ff2020'; og.beginPath(); og.arc(m + 50, m + 70, 20, 0, 7); og.fill(); } og.font = '900 54px Nunito'; og.fillStyle = '#fff'; og.fillText('REC', m + 85, m + 88); og.textAlign = 'right'; og.fillText(typeof s.viewfinder === 'string' ? s.viewfinder : '03:00 AM', W - m - 30, m + 88);
    og.globalCompositeOperation = 'multiply'; og.fillStyle = 'rgba(160,200,255,.6)'; og.fillRect(0, 0, W, H); og.restore(); }
  if (s.flash) { og.save(); const gr = og.createRadialGradient(W / 2, H * .38, 50, W / 2, H * .38, 700); gr.addColorStop(0, s.flash + 'aa'); gr.addColorStop(1, s.flash + '00'); og.globalCompositeOperation = 'screen'; og.fillStyle = gr; og.fillRect(0, 0, W, H); og.restore(); }
  if (s.doorcam) { og.save(); og.globalCompositeOperation = 'multiply'; og.fillStyle = 'rgb(175,200,235)'; og.fillRect(0, 0, W, H); og.restore();
    const fe = og.createRadialGradient(W / 2, H / 2, W * .38, W / 2, H / 2, H * .6); fe.addColorStop(0, 'rgba(0,0,0,0)'); fe.addColorStop(1, 'rgba(0,0,0,.97)'); og.fillStyle = fe; og.fillRect(0, 0, W, H);
    og.save(); og.font = '900 52px Nunito'; og.fillStyle = '#fff'; og.textAlign = 'left'; og.fillText('FRONT DOOR', 90, 190); og.textAlign = 'right'; og.fillText(s.doorcam, W - 90, 190); if (Math.sin(tc * 6) > 0) { og.fillStyle = '#ff2020'; og.beginPath(); og.arc(110, 262, 17, 0, 7); og.fill(); } og.fillStyle = '#fff'; og.textAlign = 'left'; og.fillText('LIVE', 142, 280); og.restore();
    if (s.circle) { const [cx, cy, rr, k] = s.circle; og.save(); og.strokeStyle = '#ff2a2a'; og.lineWidth = 16; og.lineCap = 'round'; og.beginPath(); og.ellipse(cx, cy, rr, rr * 1.12, -.25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2.15 * k); og.stroke(); og.restore(); } }
  if (s.binoc) og.drawImage(bino, 0, 0);
  if (s.sepia) { og.save(); og.globalCompositeOperation = 'color'; og.globalAlpha = .6; og.fillStyle = '#c8955a'; og.fillRect(0, 0, W, H); og.globalCompositeOperation = 'soft-light'; og.globalAlpha = .45; og.fillStyle = '#ffd08a'; og.fillRect(0, 0, W, H); og.restore(); }
  const vg = og.createRadialGradient(W / 2, H * .45, W * .45, W / 2, H * .45, H * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); og.fillStyle = vg; og.fillRect(0, 0, W, H);
  if (s.fade) { og.fillStyle = `rgba(0,0,0,${s.fade})`; og.fillRect(0, 0, W, H); }
}
const XF = .22;
function renderAt(tc) {
  const i = shots.findIndex(s => tc >= s.f0 && tc < s.f1), s = shots[i < 0 ? shots.length - 1 : i], nx = shots[i + 1];
  renderShot(s, tc); og.drawImage(renderer.domElement, 0, 0); post(s, tc);
  if (nx && nx.xf && tc > s.f1 - XF) { tg.drawImage(out, 0, 0); renderShot(nx, nx.f0 + .001); og.drawImage(renderer.domElement, 0, 0); post(nx, nx.f0); const a = (tc - (s.f1 - XF)) / XF; og.save(); og.globalAlpha = 1 - a; og.drawImage(tmp, 0, 0); og.restore(); }
  whipBlur(tc); drawCaption(tc);
}
window.renderTime = tc => { renderAt(tc); return out.toDataURL('image/jpeg', .92); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(TOTAL * FPS);
await document.fonts.load('900 96px Nunito');
window.captionChunks = words.slice(0, 3); window.ready = true;
