// "The Neighbor Who Mowed Lawns At 3 AM" - noodle-people short (toon shading + ink outlines), rendered frame by frame.
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
  const bodyMap = o.pj ? stripesT : null, bodyCol = o.pj ? 0xffffff : col;
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
  const sh = spine.getPoint(.62);
  for (const s of [-1, 1]) {
    const i = s < 0 ? 0 : 1, from = sh.clone().add(V(s * R * .85, 0, 0));
    const to = o.hands ? o.hands[i].clone() : from.clone().add(V(...(o.arms ? o.arms[i] : [s * .5, -.2, .05])).multiplyScalar(.62));
    const mid = from.clone().lerp(to, .5).add(V(0, .05, 0)); g.add(curveTube([from, mid, to], .055, o.pj ? 0xffffff : col, .016));
    const hand = inked(new THREE.SphereGeometry(.085, 14, 10), col, .016); hand.position.copy(to); g.add(hand);
    const fo = o.feet ? o.feet[i] : [0, 0];
    const hip = V(s * .12, base - .1, 0), foot = o.sit ? V(s * .14, base - .12, .35) : V(s * .16, .06 + fo[1], .02 + fo[0]);
    g.add(curveTube([hip, hip.clone().lerp(foot, .5).add(V(0, 0, .03)), foot], .06, o.pj ? 0xffffff : col, .016));
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
function place(scene, opts, x, y, z, ry = 0) { const g = noodle(opts); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); live.push(g); return g; }
function waddle(t, sp = 7.5) { const p = t * sp, sw = Math.sin(p); return { bend: sw * .12, tilt: -sw * .08, feet: [[sw * .14, Math.max(0, Math.cos(p)) * .1], [-sw * .14, Math.max(0, -Math.cos(p)) * .1]], arms: [[-.45, -.12 + sw * .12, -sw * .35], [.45, -.12 - sw * .12, sw * .35]], bob: Math.abs(Math.cos(p)) * .05 }; }
// Gary pushing the mower: hands on the grips, sleep-shuffling
function garyMowing(scene, mower, x, z, ry, t, extra = {}) { const p = t * 6, sw = Math.sin(p); mower.position.set(x + Math.cos(ry) * .95, 0, z - Math.sin(ry) * .95); mower.rotation.y = ry; mower.updateMatrixWorld(true);
  const pos = V(x, Math.abs(Math.cos(p)) * .03, z), gry = ry + Math.PI / 2; const hands = [1, -1].map(s => toLocal(mower.localToWorld(mower.userData.grip(s)), pos, gry));
  return place(scene, { ...GARY, hands, lean: .25, bend: sw * .05, nod: .15, feet: [[sw * .12, Math.max(0, Math.cos(p)) * .08], [-sw * .12, Math.max(0, -Math.cos(p)) * .08]], ...extra }, pos.x, pos.y, pos.z, gry); }

// ===================== SHOTS =====================
// 1 "Every morning, the whole street woke up..." - sunrise, the camera sinks down to the street
shot(0, 1.95, () => { const S = world('morning'), cam = newCam(42);
  return { scene: S.scene, cam, update(f, fd, t) { const k = ss(0, fd, f); look(cam, lerp(-1, -1, k), lerp(9, 3.2, k), lerp(14, 9, k), -1, lerp(4, 1.4, k), -4); setSun(S, -1, -3); } }; });
// 1b doors open, neighbors step out yawning... and stop
shot(1.95, 4.0, () => { const S = world('morning'), cam = newCam(38), STOP = at(1.95, 3.17);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -1, -3);
    [['patel', PATEL, -1.5], ['dave', DAVE, 0], ['orange', ORANGE, 1.5]].forEach(([k, P, d], i) => { const walkK = clamp((f - i * .15) / 1.2), x = HX.dave + d, z = lerp(-4.9, -2.2, ss(0, 1, walkK)), wd = waddle(t + i, 7); const froze = f > STOP + i * .06;
      place(S.scene, { ...P, ...(froze ? { eyes: 'wide', mouth: 'o', browUp: .06, arms: [[-.5, .2, .1], [.5, .2, .1]] } : { ...wd, eyes: f < .5 ? 'closed' : 'open', mouth: f < .5 ? 'o' : 'smile', arms: f < .5 ? [[-.4, .5, 0], [.4, .5, 0]] : wd.arms }) }, x, froze ? 0 : wd.bob, z, 0); });
    look(cam, HX.dave + Math.sin(f * .5) * .3, 1.8, 3.6 - f * .3, HX.dave, 1.2, -3); drift(cam, t); } }; }, { xf: true });
// 2 "Every single lawn, was perfectly mowed." - glide low across perfect stripes; sparkles
shot(4.0, 7.2, () => { const S = world('morning'), cam = newCam(55), sp = [...Array(10)].map(() => sprite('✦', '#ffffff', .4)); sp.forEach(s => S.scene.add(s)); const P = at(4.0, 5.79);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, -3); const x = lerp(-12, 9, f / fd); look(cam, x, .45, -.6, x + 3, .2, -3.6); sp.forEach((s, i) => { s.visible = f > P; s.position.set(x + 1.5 + (i % 5) * .8, .3 + (i % 3) * .3, -2 - (i % 4) * .7); s.scale.setScalar(.35 * pop(f - P - i * .04) * (.6 + .4 * Math.sin(t * 9 + i))); }); } }; });
// 3 "Nobody knew who was doing it." - everyone shrugs; question marks pop
shot(7.2, 9.1, () => { const S = world('morning'), cam = newCam(40), qs = [0, 1, 2].map(() => { const s = sprite('?', '#ffe21f', .7); S.scene.add(s); return s; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -1, -1);
    [[PATEL, -2.2], [DAVE, -1], [ORANGE, .2]].forEach(([P, x], i) => { const sh = Math.sin(clamp((f - i * .1) * 3) * Math.PI); const g = place(S.scene, { ...P, mouth: 'wavy', brow: -.25, browUp: .03, arms: [[-.55, .1 + sh * .25, .1], [.55, .1 + sh * .25, .1]], tilt: (i - 1) * .15 }, x, 0, -1.2, .15 - i * .15); qs[i].position.set(x + .15, 2.5 + Math.sin(t * 4 + i) * .05, -1.2); qs[i].scale.setScalar(.7 * pop(f - .25 - i * .12)); });
    look(cam, -1 + f * .2, 1.8, 5.8 - f * .3, -1, 1.2, -1.2); drift(cam, t); } }; }, { xf: true });
// dream frame for the theories (soft tint + cloud border drawn in post)
// 4 "Some people thought it was a prank." - imagined: a giggling kid noodle mowing at night
shot(9.1, 10.9, () => { const S = world('night'), cam = newCam(40), mw = makeMower(); S.scene.add(mw);
  return { scene: S.scene, cam, dream: '#ffe27a', update(f, fd, t) { setSun(S, 2, -3); const x = lerp(-.5, 2.5, f / fd); mw.position.set(x + .95, 0, -2.6); mw.updateMatrixWorld(true); const pos = V(x, 0, -2.6); const hands = [1, -1].map(s => toLocal(mw.localToWorld(mw.userData.grip(s)), pos, Math.PI / 2));
    place(S.scene, { ...YELLOW, ...waddle(t, 9), arms: undefined, hands, mouth: 'grin', eyes: 'happy', blush: true }, x, 0, -2.6, Math.PI / 2);
    look(cam, x - .2, 1.6, 3.0, x + .5, .9, -2.6); drift(cam, t); } }; }, { xf: true });
// 5 "Some thought it was the city." - imagined: an orange city truck with a mower deck
shot(10.9, 12.7, () => { const S = world('night'), cam = newCam(40), tr = new THREE.Group(); S.scene.add(tr);
  tr.add(at3(box(2.6, 1.2, 1.4, 0xff8a1a), 0, 1.0, 0)); tr.add(at3(box(1.0, 1.0, 1.35, 0xff8a1a), 1.75, .95, 0)); tr.add(at3(box(.7, .5, 1.36, 0x9ad8ff, .015), 1.85, 1.15, 0)); tr.add(at3(box(.8, .2, 2.4, 0x2a2a30), 2.6, .25, 0)); const lt = inked(new THREE.SphereGeometry(.12, 10, 8), 0xffe21f, .015); lt.position.set(.4, 1.72, 0); tr.add(lt);
  for (const [x, z] of [[-.8, .72], [-.8, -.72], [1.6, .72], [1.6, -.72]]) { const w = inked(new THREE.CylinderGeometry(.35, .35, .25, 14), 0x16161a, .015); w.rotation.x = Math.PI / 2; w.position.set(x, .35, z); tr.add(w); } const sign = sprite('CITY', '#ffffff', .9, 80); sign.position.set(0, 1.0, .75); tr.add(sign);
  return { scene: S.scene, cam, dream: '#ffb06a', update(f, fd, t) { setSun(S, 0, 2); tr.position.set(lerp(-4, 2, f / fd), Math.abs(Math.sin(t * 14)) * .02, 2.0); lt.children[0].material.color.setHex(Math.sin(t * 12) > 0 ? 0xffe21f : 0xff6a1a); look(cam, 1.8, 1.9, 9.8, 0, 1.0, 2); drift(cam, t); } }; }, { xf: true });
// 6 "Mrs. Patel thought it was ghosts." - her face (blue fear flash) -> a ghost noodle pushing a mower
shot(12.7, 15.1, () => { const S = world('morning'), N = world('night'), cam = newCam(38), cam2 = newCam(40), SW = at(12.7, 14.0), mw = makeMower(); N.scene.add(mw);
  const ghost = new THREE.Group(); N.scene.add(ghost); ghost.add(inked(new THREE.SphereGeometry(.45, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), 0xf8f8ff, .022)); ghost.children[0].position.y = 1.35; ghost.add(inked(new THREE.CylinderGeometry(.45, .55, 1.1, 20, 1, true), 0xf8f8ff, .022)); ghost.children[1].position.y = .8; for (const x of [-.15, .15]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), flat(INK)); e.scale.set(.8, 1.3, .3); e.position.set(x, 1.45, .43); ghost.add(e); } const gm = new THREE.Mesh(new THREE.TorusGeometry(.06, .015, 6, 14), flat(INK)); gm.position.set(0, 1.25, .44); ghost.add(gm);
  const glow = new THREE.PointLight(0x7aff9a, 10, 6); N.scene.add(glow);
  return { scene: S.scene, cam, update(f, fd, t) { if (f < SW) { this.scene = S.scene; this.cam = cam; setSun(S, HX.patel, -2); place(S.scene, { ...PATEL, eyes: 'wide', mouth: 'scream', browUp: .08, brow: .3, arms: [[-.25, .45, .3], [.25, .45, .3]] }, HX.patel, 0, -2, .2); look(cam, HX.patel + .3, 1.6, .5, HX.patel, 1.5, -2); this.flash = f > .25 ? '#4a8aff' : null; drift(cam, t); return; }
    this.scene = N.scene; this.cam = cam2; this.flash = null; this.dream = '#9affb0'; setSun(N, 2, -3); const a = f - SW, x = lerp(0, 2.2, a / (fd - SW)); ghost.position.set(x, .1 + Math.sin(t * 3) * .1, -2.6); ghost.rotation.y = Math.PI / 2; mw.position.set(x + .95, 0, -2.6); glow.position.set(x, 1.5, -1.6); look(cam2, x - .3, 1.3, 1.8, x + .4, 1.0, -2.6); drift(cam2, t); } }; });
// 7 "So one night, Dave set up a camera." - Dave in his robe on the porch at night, tripod, red REC light
shot(15.1, 17.9, () => { const S = world('night'), cam = newCam(40), tri = new THREE.Group(); S.scene.add(tri); tri.position.set(HX.dave + 1.2, 0, -3.6);
  for (const a of [0, 2.1, 4.2]) { const l = curveTube([V(0, 1.1, 0), V(Math.cos(a) * .35, 0, Math.sin(a) * .35)], .02, 0x2a2a30, .008, 4); tri.add(l); } const cbody = at3(box(.36, .26, .22, 0x2a2a30, .015), 0, 1.25, 0); tri.add(cbody); const lens = inked(new THREE.CylinderGeometry(.08, .1, .18, 12), 0x16161a, .012); lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.25, .18); tri.add(lens); const rec = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), flat(0xff2020)); rec.position.set(.12, 1.36, .11); tri.add(rec);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.dave, -3); tri.rotation.y = -.5; rec.visible = f > fd * .6 && Math.sin(t * 8) > 0; const k = ss(0, .8, f);
    place(S.scene, { ...DAVE, mouth: f > fd * .6 ? 'smirk' : 'flat', eyes: f > fd * .6 ? 'half' : 'open', brow: -.2, hands: k < 1 ? [V(-.3, .9, .3), V(.3, .9, .3)] : [V(-.2, 1.2, .4), V(.32, 1.25, .45)] }, HX.dave + .5, 0, -3.9, .6);
    look(cam, HX.dave + 3.2, 1.6, -.4 - f * .2, HX.dave + .9, 1.2, -3.8); drift(cam, t); } }; }, { xf: true });
// 8 "At exactly 3 AM, someone walked out." - through the camera: REC, 03:00 AM; Gary's door opens, he shuffles out
shot(17.9, 21.4, () => { const S = world('night'), cam = newCam(34), OUT = at(17.9, 19.83);
  return { scene: S.scene, cam, viewfinder: true, update(f, fd, t) { setSun(S, HX.gary, -4); const d = S.garyHouse.userData.door; d.rotation.y = -1.6 * ss(OUT - .5, OUT, f); d.position.x = -.35 * ss(OUT - .5, OUT, f);
    if (f > OUT - .1) { const k = clamp((f - OUT) / 1.4), wd = waddle(t, 5); place(S.scene, { ...GARY, ...wd, arms: [[-.2, .25, .55], [.2, .25, .55]], nod: .15 }, HX.gary, wd.bob, lerp(-4.95, -3.4, k), .3); }
    look(cam, HX.dave + 1.2, 1.25, -3.4, HX.gary, 1.3, -4.4); } }; });
// 9 "It was Gary." - SNAP zoom on his sleeping face
shot(21.4, 22.3, () => { const S = world('night'), cam = newCam(40);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.gary, -3); const g = place(S.scene, { ...GARY, arms: [[-.2, .25, .55], [.2, .25, .55]], nod: .15 }, HX.gary, 0, -3.4, .3); const z = clamp(spring(f * 1.6), 0, 1.05), d = lerp(4.8, 2.4, z); look(cam, HX.gary + Math.sin(.3) * d, 1.65, -3.4 + Math.cos(.3) * d, HX.gary, 1.55, -3.4); } }; });
// 10 "The quiet guy next door." - wide: Dave's house, Gary's house; Gary standing there asleep
shot(22.3, 24.15, () => { const S = world('night'), cam = newCam(40), zs = [0, 1, 2].map(i => { const s = sprite('Z', '#ffffff', .4); S.scene.add(s); return s; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -1, -3); place(S.scene, { ...GARY, arms: [[-.2, .25, .55], [.2, .25, .55]], nod: .15, tilt: Math.sin(t * 1.5) * .05 }, HX.gary, 0, -3.4, .3);
    zs.forEach((s, i) => { const q = (t * .5 + i / 3) % 1; s.position.set(HX.gary + .3 + q * .5, 2.1 + q * .9, -3.4); s.scale.setScalar(.25 + q * .2); s.material.opacity = 1 - q; });
    cam.fov = 55; cam.updateProjectionMatrix(); look(cam, -1 + f * .3, 2.4, 8.5 - f * .3, -1, 1.3, -4); drift(cam, t); } }; }, { xf: true });
// 11 "Pushing a lawn mower, in his pajamas." - side tracking shot: stripes appear behind him
shot(24.15, 26.95, () => { const S = world('night', { shaggy: true }), cam = newCam(40), mw = makeMower(); S.scene.add(mw); const trail = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.0), toon(0xffffff, MOWED)); trail.rotation.x = -Math.PI / 2; S.scene.add(trail);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.gary, -2.8); const x0 = HX.gary - 2.2, x = lerp(x0, HX.gary + 1.2, f / fd); garyMowing(S.scene, mw, x, -2.6, 0, t); trail.scale.x = x + .95 - x0; trail.position.set((x0 + x + .95) / 2, .03, -2.6);
    look(cam, x + .3, 1.3, 1.9, x + .5, .8, -2.6); drift(cam, t); } }; });
// 12 "With his eyes closed." - extreme close-up: eyes shut, a little snore bubble
shot(26.95, 28.75, () => { const S = world('night'), cam = newCam(36), mw = makeMower(); S.scene.add(mw); const bub = inked(new THREE.SphereGeometry(.1, 14, 10), 0xc8eaff, .01, null, true); S.scene.add(bub);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.gary, -2.6); const g = garyMowing(S.scene, mw, HX.gary, -2.6, 0, t * .4); g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, 0, 0)); const b = (Math.sin(t * 2.6) + 1) / 2; bub.position.copy(g.userData.head.localToWorld(V(.12, -.12, .45))); bub.scale.setScalar(.6 + b * 1.1);
    look(cam, hp.x + 1.6, hp.y + .1, hp.z + 1.0 - f * .1, hp.x, hp.y - .1, hp.z); drift(cam, t, .002); } }; }, { xf: true });
// 13 "Gary was sleepwalking." - low wide: Gary, the mower, the moon
shot(28.75, 30.75, () => { const S = world('night', { shaggy: true }), cam = newCam(50), mw = makeMower(); S.scene.add(mw);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.gary, -2.6); const x = HX.gary - .8 + f * .4; garyMowing(S.scene, mw, x, -2.6, 0, t); look(cam, x + 3.4, .4, -.3, x + .2, 1.2, -2.8); drift(cam, t); } }; });
// 14 "For two years, he'd been mowing the entire street, in his sleep." - from above: Gary blitzes lawn after lawn
shot(30.75, 35.05, () => { const S = world('night', { shaggy: true }), cam = newCam(45), mw = makeMower(); S.scene.add(mw);
  return { scene: S.scene, cam, update(f, fd, t) { const k = f / fd, x = lerp(HX.patel - 2.5, HX.orange + 2.5, k), z = -2.6 + Math.sin(k * 40) * 1.4; setSun(S, x, -2.6); garyMowing(S.scene, mw, x, z, Math.cos(k * 40) > 0 ? -.4 : .4, t * 3);
    for (const [kk, L] of Object.entries(S.lawns)) { const done = x > HX[kk] + 2.2; L.shaggy.visible = !done; } look(cam, x - 1, 12, 5, x, 0, -2.6); } }; }, { xf: true });
// 15 "He even trimmed the hedges." - big scissors... and a hedge shaped exactly like Gary
shot(35.05, 36.8, () => { const S = world('night'), cam = newCam(40), top = new THREE.Group(); S.scene.add(top); top.position.set(HX.gary + 2.7, 0, -4.5); S.garyHedge.visible = false;
  const leaf = 0x3a9a3e; top.add(at3(box(1.4, .5, .6, leaf), 0, .25, 0)); const tb = inked(new THREE.CapsuleGeometry(.28, .7, 6, 12), leaf, .025); tb.position.y = 1.05; top.add(tb); const th = inked(new THREE.SphereGeometry(.42, 16, 12), leaf, .025); th.position.y = 1.85; top.add(th); const tc = inked(new THREE.ConeGeometry(.3, .6, 10), leaf, .02); tc.position.set(.12, 2.35, 0); tc.rotation.z = -.5; top.add(tc);
  const sc = new THREE.Group(); S.scene.add(sc); for (const s of [-1, 1]) { const bl = at3(box(.05, .02, .6, 0xc8ccd8, .008), 0, 0, .3); const pv = new THREE.Group(); pv.add(bl); pv.userData.s = s; sc.add(pv); }
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.gary + 2, -4); const snip = Math.abs(Math.sin(t * 9)) * .4; sc.children.forEach(p => p.rotation.y = p.userData.s * snip); sc.position.set(HX.gary + 2.15, 1.3, -3.9); sc.rotation.y = -.6;
    place(S.scene, { ...GARY, hands: [V(.2, 1.15, .55), V(.42, 1.2, .5)], nod: .15 }, HX.gary + 1.7, 0, -3.5, .9); top.scale.y = 1; const k = ss(0, fd, f); look(cam, HX.gary + 2.0 + k * .6, 1.7, .4 - k * .3, HX.gary + 2.3, 1.2, -4.1); drift(cam, t); } }; }, { xf: true });
// 16 "One night, he mowed a giant smiley face into the park." - overhead, the face gets drawn; the camera rises
shot(36.8, 40.35, () => { const P = park(), cam = newCam(50), mw = makeMower(); P.scene.add(mw);
  return { scene: P.scene, cam, update(f, fd, t) { const k = clamp(f / (fd - .5)), e = P.paint(k), x = (e.cx - 256) / 512 * 14, z = (e.cy - 256) / 512 * 14;
    garyMowing(P.scene, mw, x - .9, z, 0, t * 2); const h = lerp(8, 17, ss(0, fd, f)); look(cam, 0, h, h * .3, 0, 0, .3); } }; });
// 17 "Another night, he mowed straight into Dave's pool." - right off the edge: SPLASH
shot(40.35, 43.35, () => { const S = world('night'), cam = newCam(42), mw = makeMower(); S.scene.add(mw); const SPL = at(40.35, 42.71), drops = [...Array(26)].map((_, i) => { const d = inked(new THREE.SphereGeometry(.07 + (i % 3) * .03, 8, 6), 0xbfe8ff, .01, null, true); d.userData = i; S.scene.add(d); return d; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -1, -2.6); const px = S.pool.position.x; const x = Math.min(lerp(px - 4.2, px - 1.9, f / SPL), px - 1.9), sink = ss(SPL - .15, SPL + .3, f);
    if (f < SPL) garyMowing(S.scene, mw, x, -2.6, 0, t); else { mw.position.set(px - .4, lerp(.1, -.6, sink), -2.6); mw.rotation.z = -.9 * sink; place(S.scene, { ...GARY, arms: [[-.5, .4, .1], [.5, .4, .1]], nod: -.2 }, px - .5, lerp(.2, -.9, sink), -2.6, Math.PI / 2).rotation.z = -1.2 * sink; }
    drops.forEach(d => { const i = d.userData, q = clamp((f - SPL) * 1.3), an = i * .7; d.visible = f > SPL && q < 1; d.position.set(px - .4 + Math.cos(an) * q * (1 + i % 4 * .3), .2 + q * 3.2 * (1 - q) * (1 + (i % 5) * .2), -2.6 + Math.sin(an) * q * (1 + i % 3 * .3)); });
    look(cam, px - 2.6, 2.6, 2.6, px - 1.9, .4, -2.6); if (f > SPL) { cam.position.x += Math.sin(t * 70) * .03 * Math.exp(-(f - SPL) * 5); } drift(cam, t); } }; });
// 18 "And he still didn't wake up." - floating on his back, asleep, Z's; the mower bubbling below
shot(43.35, 45.35, () => { const S = world('night'), cam = newCam(40), zs = [0, 1, 2].map(() => { const s = sprite('Z', '#ffffff', .4); S.scene.add(s); return s; }), bub = [...Array(6)].map(() => { const b = inked(new THREE.SphereGeometry(.04, 8, 6), 0xffffff, .008, null, true); S.scene.add(b); return b; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -1, -2.6); const px = S.pool.position.x, g = place(S.scene, { ...GARY, arms: [[-.55, 0, 0], [.55, 0, 0]], feet: [[.0, 0], [0, 0]] }, px - .1, .2 + Math.sin(t * 1.8) * .02, -1.9, 0); g.rotation.x = -Math.PI / 2; g.rotation.z = Math.sin(t * .8) * .1;
    zs.forEach((s, i) => { const q = (t * .45 + i / 3) % 1; s.position.set(px + .2 + q * .4, .7 + q * 1.1, -3.3); s.scale.setScalar(.25 + q * .2); s.material.opacity = 1 - q; }); bub.forEach((b, i) => { const q = (t * .7 + i / 6) % 1; b.position.set(px - .4 + Math.sin(i * 3) * .2, .11, -2.6 + Math.cos(i * 2) * .2); b.scale.setScalar(q < .5 ? q * 2 : 0); });
    look(cam, px + .1, 2.6 - f * .1, -.6, px - .05, .2, -2.6); drift(cam, t); } }; }, { xf: true });
// 19 "Every morning, Gary woke up wondering, why his slippers were covered in grass." - bedroom: wakes, sees the slippers
shot(45.35, 50.3, () => { const B = bedroom(), cam = newCam(44), SL = at(45.35, 48.4), qs = [0, 1, 2].map(() => { const s = sprite('?', '#ffe21f', .6); B.scene.add(s); return s; });
  return { scene: B.scene, cam, update(f, fd, t) { const up = ss(.2, .9, f), look2 = f > SL;
    const g = place(B.scene, { ...GARY, eyes: f < .35 ? 'closed' : look2 ? 'wide' : 'half', mouth: look2 ? 'o' : f < .9 ? 'o' : 'flat', sit: true, nod: look2 ? .45 : 0, arms: f < .9 ? [[-.4, .6, 0], [.4, .6, 0]] : [[-.45, -.1, .2], [.45, -.1, .2]], browUp: look2 ? .06 : 0 }, -1.2, .25, -.15, .0);
    g.rotation.x = lerp(-1.35, 0, up); qs.forEach((s, i) => { s.position.set(-1 + i * .3, 2.4 + Math.sin(t * 4 + i) * .05, -.9); s.scale.setScalar(.6 * pop(f - SL - .2 - i * .1)); });
    if (!look2) look(cam, 1.9, 2.3, 3.4, -1.1, .9, -1.0); else look(cam, 1.0, .8, 1.5, .38, .1, .4); drift(cam, t); } }; });
// 20 "When Dave showed him the video, Gary just stared at it." - porch, phone, a long blank stare
shot(50.3, 53.65, () => { const S = world('day'), cam = newCam(36), ph = new THREE.Group(); S.scene.add(ph); ph.add(at3(box(.32, .58, .04, 0x2a2a30, .01), 0, 0, 0)); const scr = ctex(64, 112, g => { g.fillStyle = '#0a1030'; g.fillRect(0, 0, 64, 112); g.fillStyle = '#3a2a6a'; g.fillRect(6, 40, 52, 40); g.fillStyle = '#a87ae8'; g.beginPath(); g.ellipse(32, 52, 7, 7, 0, 0, 7); g.fill(); g.fillRect(27, 58, 10, 16); g.fillStyle = '#ff2020'; g.beginPath(); g.arc(10, 10, 4, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.fillText('3:00 AM', 18, 13); }); const sm = new THREE.Mesh(new THREE.PlaneGeometry(.27, .5), new THREE.MeshBasicMaterial({ map: scr })); sm.position.z = .025; ph.add(sm);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, -1); const dp = V(-.55, 0, -1.2), gp = V(.55, 0, -1.2); place(S.scene, { ...DAVE, robe: null, mouth: 'smile', hands: [V(-.25, .85, .2), V(.35, 1.3, .55)] }, dp.x, 0, dp.z, .9);
    ph.position.set(-.05, 1.33, -1.0); ph.rotation.y = .9;
    place(S.scene, { ...GARY, eyes: 'open', mouth: 'flat', hat: null, nod: .12, arms: [[-.4, -.25, 0], [.4, -.25, 0]] }, gp.x, 0, gp.z, -1.0);
    const k = ss(0, fd, f); look(cam, lerp(0, .4, k), 1.75, lerp(3.4, 2.4, k), .1, 1.45, -1.2); drift(cam, t, .002); } }; }, { xf: true });
// 21 "Then he said, That explains a lot." - close on Gary; he says it (lip sync); snap zoom on the line
shot(53.65, 56.4, () => { const S = world('day'), cam = newCam(36), L = at(53.65, 54.8);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, -1); const talking = f > L - .05 && f < at(53.65, 56.0); const g = place(S.scene, { ...GARY, eyes: 'half', hat: null, mouth: talking ? talkShape(t) : 'flat', nod: .05, arms: [[-.4, -.25, 0], [.4, -.25, 0]] }, .55, 0, -1.2, -.4);
    g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, 0, 0)), z = f > L ? spring((f - L) * 1.5) : 0; const d = lerp(3.0, 1.9, clamp(z, 0, 1.05)); look(cam, hp.x + Math.sin(-.4) * d - .1, hp.y, hp.z + Math.cos(-.4) * d, hp.x, hp.y - .05, hp.z); } }; });
// 22 "Now the whole street pays him twenty bucks a month." - a line of neighbors, $20 bills; Gary with a fan of cash
shot(56.4, 59.6, () => { const S = world('day'), cam = newCam(40), B1 = bills(5); S.scene.add(B1); const flying = [0, 1, 2].map(() => { const b = bills(1); S.scene.add(b); return b; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, -1); const g = place(S.scene, { ...GARY, hat: null, eyes: 'happy', mouth: 'grin', blush: true, hands: [V(-.25, 1.0, .4), V(.32, 1.05, .45)] }, 1.4, 0, -1.4, -.5);
    g.updateMatrixWorld(true); B1.position.copy(g.localToWorld(V(.05, 1.12, .5))); B1.rotation.y = -.5; B1.scale.setScalar(.5 + .5 * clamp(f / fd * 1.5));
    [[DAVE, 0], [PATEL, -1.2], [ORANGE, -2.4], [YELLOW, -3.6]].forEach(([P, dx], i) => { const wd = waddle(t + i, 6); place(S.scene, { ...P, robe: null, mouth: 'smile', ...wd, arms: i === 0 ? [[-.45, -.1, .1], [.35, .2, .55]] : wd.arms }, .3 + dx, 0, -1.3 + (i % 2) * .15, Math.PI / 2 - .2); });
    flying.forEach((b, i) => { const q = clamp((f - .3 - i * .7) / .6); b.visible = q > 0 && q < 1; b.position.set(lerp(.5, 1.45, q), 1.2 + Math.sin(q * Math.PI) * .4, -1.3); b.rotation.set(q * 6, q * 3, 0); });
    look(cam, -.1 + f * .2, 1.9, 6.9, .1, 1.1, -1.3); drift(cam, t); } }; }, { xf: true });
// 23 "And Gary still doesn't remember doing it." - night again: he sleep-mows right past the camera
shot(59.6, 99, () => { const S = world('night', { shaggy: true }), cam = newCam(42), mw = makeMower(); S.scene.add(mw); const trail = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.0), toon(0xffffff, MOWED)); trail.rotation.x = -Math.PI / 2; S.scene.add(trail);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.gary, -2.6); const x0 = HX.gary - 3, x = x0 + f * 1.4; garyMowing(S.scene, mw, x, -2.0, 0, t); trail.scale.x = x + .95 - x0; trail.position.set((x0 + x + .95) / 2, .03, -2.0);
    look(cam, HX.gary - .2, 1.4, 2.2, HX.gary - 1.2 + f * .8, 1.0, -2.0); drift(cam, t); this.fade = ss(fd - .6, fd - .05, f); } }; });

// ---------- captions: one word at a time, white with a thick black outline, pop-in ----------
const words = (await (await fetch('/build/words.json')).json()).map(w => ({ w: w.w.replace(/[.,?!]+$/, ''), s: tm(w.s), e: tm(w.e) }));
words.forEach((w, i) => { const n = words[i + 1]; w.s -= .04; w.e = n ? Math.max(w.e, n.s - .04) : w.e + .5; });
function drawCaption(tc) {
  const c = words.find(w => tc >= w.s && tc < w.e); if (!c) return; const k = 1 + .12 * Math.exp(-(tc - c.s) * 18);
  og.save(); og.translate(W / 2, H * .66); og.scale(k, k); og.font = '900 96px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  og.lineWidth = 20; og.strokeStyle = '#16121a'; og.strokeText(c.w.toUpperCase(), 0, 0); og.fillStyle = '#ffffff'; og.fillText(c.w.toUpperCase(), 0, 0); og.restore();
}
// ---------- frame: render, cross-fades between shots, dream frames, viewfinder, emotion flash, fades ----------
const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d');
function renderShot(s, tc) { for (const g of live) { if (g.parent) g.parent.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } live = []; const f = tc - s.f0; s.update(f, s.f1 - s.f0, tc); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam); }
function post(s, tc) {
  if (s.dream) { og.save(); og.globalCompositeOperation = 'soft-light'; og.globalAlpha = .55; og.fillStyle = s.dream; og.fillRect(0, 0, W, H); og.restore();
    og.save(); og.fillStyle = 'rgba(255,255,255,.92)'; const r = rng(7); for (let i = 0; i < 44; i++) { const side = i % 4, u = r(); const x = side < 2 ? (side ? W : 0) : u * W, y = side < 2 ? u * H : (side === 2 ? 0 : H); og.beginPath(); og.arc(x, y, 70 + r() * 70 + Math.sin(tc * 2 + i) * 6, 0, 7); og.fill(); } og.restore(); }
  if (s.viewfinder) { og.save(); og.strokeStyle = 'rgba(255,255,255,.9)'; og.lineWidth = 8; const m = 90, L = 110; for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { og.beginPath(); og.moveTo(x, y + dy * L); og.lineTo(x, y); og.lineTo(x + dx * L, y); og.stroke(); }
    if (Math.sin(tc * 6) > 0) { og.fillStyle = '#ff2020'; og.beginPath(); og.arc(m + 50, m + 70, 20, 0, 7); og.fill(); } og.font = '900 54px Nunito'; og.fillStyle = '#fff'; og.fillText('REC', m + 85, m + 88); og.textAlign = 'right'; og.fillText('03:00 AM', W - m - 30, m + 88);
    og.globalCompositeOperation = 'multiply'; og.fillStyle = 'rgba(160,200,255,.6)'; og.fillRect(0, 0, W, H); og.restore(); }
  if (s.flash) { og.save(); const gr = og.createRadialGradient(W / 2, H * .38, 50, W / 2, H * .38, 700); gr.addColorStop(0, s.flash + 'aa'); gr.addColorStop(1, s.flash + '00'); og.globalCompositeOperation = 'screen'; og.fillStyle = gr; og.fillRect(0, 0, W, H); og.restore(); }
  const vg = og.createRadialGradient(W / 2, H * .45, W * .45, W / 2, H * .45, H * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); og.fillStyle = vg; og.fillRect(0, 0, W, H);
  if (s.fade) { og.fillStyle = `rgba(0,0,0,${s.fade})`; og.fillRect(0, 0, W, H); }
}
const XF = .22;
function renderAt(tc) {
  const i = shots.findIndex(s => tc >= s.f0 && tc < s.f1), s = shots[i < 0 ? shots.length - 1 : i], nx = shots[i + 1];
  renderShot(s, tc); og.drawImage(renderer.domElement, 0, 0); post(s, tc);
  if (nx && nx.xf && tc > s.f1 - XF) { tg.drawImage(out, 0, 0); renderShot(nx, nx.f0 + .001); og.drawImage(renderer.domElement, 0, 0); post(nx, nx.f0); const a = (tc - (s.f1 - XF)) / XF; og.save(); og.globalAlpha = 1 - a; og.drawImage(tmp, 0, 0); og.restore(); }
  drawCaption(tc);
}
window.renderTime = tc => { renderAt(tc); return out.toDataURL('image/jpeg', .92); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(TOTAL * FPS);
await document.fonts.load('900 96px Nunito');
window.captionChunks = words.slice(0, 3); window.ready = true;
