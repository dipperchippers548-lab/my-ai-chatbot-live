// "The Cat Who Came Home Fatter Every Night" - noodle-people short (toon shading + ink outlines), rendered frame by frame.
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
  if (o.headband) { const hb = inked(new THREE.TorusGeometry(HR * 1.0, .035, 8, 28), o.headband, .01); hb.rotation.x = Math.PI / 2; hb.position.y = .17; head.add(hb); }
  if (o.tears) for (const x of [-.13, .13]) for (let k = 0; k < 2; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), flat(0x5ab8ff)); const q = ((NOW * 1.6 + k * .5 + (x > 0 ? .25 : 0)) % 1); d.position.set(x * (1 + q * .2), -.02 - q * .35, HR * .97 - q * .08); d.scale.set(.8, 1.3, .8); head.add(d); }
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

// ===================== SHOTS (voiceover clock) =====================
// 1 "A cat named Biscuit came home every single night... a little fatter." - moonlit kitchen, floor level: the flap swings, he waddles in, belly bounces
shot(0, 4.45, () => { const K = kitchen(true), cam = newCam(70), c = makeCat(.35); K.scene.add(c);
  return { scene: K.scene, cam, update(f, fd, t) { const k = ss(.5, 3.2, f); c.position.set(-.6, 0, lerp(-3.3, -1.9, k)); c.userData.anim(t, k > 0 && k < 1 ? 1 : 0); K.flap.rotation.x = f > .4 && f < 1.4 ? -Math.sin((f - .4) / 1 * Math.PI) * 1.1 : Math.sin(t * 6) * .05 * (f < 2);
    const F_ = at(0, 3.77); c.userData.body.scale.y = .78 * 1.26 * (1 + .12 * Math.exp(-Math.max(0, f - F_) * 8) * Math.cos((f - F_) * 30) * (f > F_)); catFace(c, f, [[0, 'open'], [at(0, 2.4), 'happy'], [F_, 'half'], [F_ + .4, 'happy']]);
    path(cam, f, [[0, -.5, .18, -1.6, -.6, .3, -2.9], [2.0, -.2, .22, -.7, -.6, .35, -2.0], [fd, .2, .6, -.6, -.6, .45, -1.9]]); } }; });
// 2 "At first, nobody noticed, because who weighs their cat?" - morning breakfast, the family busy... glide down past Biscuit to a dusty scale with a cobweb
shot(4.45, 7.7, () => { const K = kitchen(), cam = newCam(66), c = makeCat(.6), b = bowl(); K.scene.add(c, b); c.position.set(-1.2, 0, .6); c.rotation.y = .6; b.position.set(-.9, 0, .95);
  const scale = new THREE.Group(); scale.position.set(1.7, 0, 1.6); K.scene.add(scale); scale.add(at3(box(.4, .06, .4, 0xe8e8f0, .008), 0, .03, 0)); const dial = labelCard('0', .14, .08); dial.rotation.x = -Math.PI / 2; dial.position.set(0, .065, .1); scale.add(dial);
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(.004, .004, .35), flat(0xf2f2f2)); w.position.set(.2, .1 + i * .03, .05); w.rotation.y = .5 + i * .3; scale.add(w); }
  return { scene: K.scene, cam, update(f, fd, t) { c.userData.anim(t); c.userData.head.rotation.x = .5; catFace(c, f, [[0, 'happy:open'], [1.2, 'closed:open']]);
    place(K.scene, { ...DAD, ...fx(f, [[0, 'smile'], [1.0, 'happy']]), hands: [V(-.25, .95, .4), V(.3, 1.1 + Math.sin(t * 5) * .05, .35)] }, -.3, 0, -1.2, 0); place(K.scene, { ...MOM, ...fx(f, [[0, 'happy'], [1.4, 'smile']]), arms: [[-.4, .4, .3], [.5, .5, .4]] }, .9, 0, -1.2, -.2); place(K.scene, { ...KIDO, ...EX.laugh }, .25, 0, .1, Math.PI).scale.multiplyScalar(.75);
    path(cam, f, [[0, 0, 2.0, 2.4, .1, 1.0, -1.0], [1.4, -1.6, .9, 2.0, -1.1, .3, .6], [fd, 2.0, .5, 2.35, 1.7, .05, 1.6]]); } }; }, { xf: true });
// 3 "By the end of the month, Biscuit couldn't fit through the cat door." - floor level: fat Biscuit wedged in the flap, legs paddling; the family stares
shot(7.7, 11.3, () => { const K = kitchen(), cam = newCam(68), c = makeCat(1.1); K.scene.add(c); c.position.set(-.6, 0, -3.0);
  return { scene: K.scene, cam, update(f, fd, t) { const strain = Math.sin(t * 9); c.position.z = -3.05 + Math.max(0, strain) * .03; c.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 16 + i) * .7); K.flap.rotation.x = -1.3; c.userData.tail.visible = false; catFace(c, f, [[0, 'wide:open'], [1.0, 'closed:open'], [1.8, 'wide:open'], [2.6, 'half']]);
    place(K.scene, { ...DAD, ...fx(f, [[0, 'shock'], [1.6, 'sad']]), arms: [[-.5, .2, .3], [.5, .2, .3]] }, .2, 0, -1.0, -2.6); place(K.scene, { ...MOM, ...fx(f, [[0, 'shock'], [1.2, 'scream'], [2.2, 'shock']]), hands: [V(-.15, 1.45, .3), V(.15, 1.45, .3)] }, -1.4, 0, -1.3, 2.5);
    path(cam, f, [[0, -.6, .2, -1.2, -.6, .45, -3.0], [fd, -.55, .25, -1.85, -.6, .5, -3.0]]); } }; });
// 4 "So the family put him on a diet. Half a scoop. No treats. Biscuit got fatter." - straight down on the bowl, half a scoop... over to the taped-shut treat jar... back to Biscuit: POP, bigger
shot(11.3, 16.85, () => { const K = kitchen(), cam = newCam(64), c = makeCat(1.1), b = bowl(.18), sc = new THREE.Group(), jar = new THREE.Group(); K.scene.add(c, b, sc, jar); b.position.set(.3, 0, .5); c.position.set(-.5, 0, .9); c.rotation.y = 2.0;
  const kib = [...Array(8)].map((_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 5), toon(0x8a5a2a)); m.position.set(.3 + Math.cos(i * 2.3) * .06, .07, .5 + Math.sin(i * 2.3) * .06); K.scene.add(m); return m; });
  sc.add(at3(box(.12, .1, .2, 0xe8e8f0, .008), 0, 0, 0)); jar.position.set(-2.0, .9, -2.4); jar.add(at3(inked(new THREE.CylinderGeometry(.14, .14, .3, 14), 0xfff2a0, .01), 0, .15, 0)); const lb = labelCard('TREATS', .26, .1); lb.position.set(0, .16, .145); jar.add(lb); const no = labelCard('NO!!', .3, .14, '#ffd23a', '#16121a'); no.position.set(0, .45, .15); no.rotation.z = .2; jar.add(no);
  for (const r of [-.6, .6]) { const tp = at3(box(.36, .04, .02, 0xc8c8d0, .004), 0, .25, .14); tp.rotation.z = r; jar.add(tp); }
  const TP = at(11.3, 13.14), TF = at(11.3, 16.13);
  return { scene: K.scene, cam, update(f, fd, t) { const pour = ss(TP - .4, TP + .1, f); sc.position.set(.3, .4 - pour * .15, .5); sc.rotation.z = -pour * 1.2; kib.forEach((m, i) => m.visible = f > TP - .1 + i * .02);
    const pop = f > TF ? 1 + .2 * Math.min(1, (f - TF) * 8) + .06 * Math.exp(-(f - TF) * 8) * Math.cos((f - TF) * 30) : 1; c.scale.setScalar(pop); c.userData.anim(t); catFace(c, f, [[0, 'wide'], [TP + .2, 'half'], [at(11.3, 14.13), 'wide:open'], [TF, 'half'], [TF + .5, 'happy']]);
    path(cam, f, [[0, .32, 1.6, .55, .3, 0, .5], [TP + .3, .3, 1.3, .52, .3, 0, .5], [at(11.3, 14.0), -1.4, 1.2, -1.4, -2.0, 1.0, -2.4], [at(11.3, 15.0), -1.2, 1.1, -1.2, -2.0, 1.0, -2.4], [fd, .4, .5, 2.3, -.5, .45, .9]]); } }; });
// 5a "They took him to the vet. The vet looked at Biscuit, then at the dad," - the clinic: huge Biscuit on the steel table; the vet's head turns... and turns
shot(16.85, 21.5, () => { const R = room(0xd8f0f0), cam = newCam(64), c = makeCat(1.4), tb = new THREE.Group(); R.scene.add(tb, c); tb.add(at3(box(1.3, .08, .8, 0xc8ccd8, .01), 0, .9, 0)); tb.add(at3(box(.1, .86, .1, 0x9a9aa8, .006), 0, .45, 0)); c.position.set(0, .94, 0); c.rotation.y = .3;
  const poster = labelCard('VET', .9, .4, '#ffffff', '#3a8ad8'); poster.position.set(-1.2, 2.0, -2.88); R.scene.add(poster); const T1 = at(16.85, 18.88), T2 = at(16.85, 19.88);
  return { scene: R.scene, cam, update(f, fd, t) { c.userData.anim(t); catFace(c, f, [[0, 'happy'], [T1, 'half'], [T2, 'happy']]);
    const turn = f < T1 ? 0 : f < T2 ? -.6 : .7; place(R.scene, { ...VET, ...fx(f, [[0, 'smile'], [T1, 'shock'], [T1 + .5, 'deadpan'], [T2, 'smug']]), turn, arms: [[-.4, .1, .3], [.4, .3, .4]] }, -.9, 0, -.4, .9);
    place(R.scene, { ...DAD, ...fx(f, [[0, 'smile'], [T2, 'shock'], [T2 + .6, 'sad']]), arms: [[-.4, -.1, .2], [.45, .2, .3]] }, 1.0, 0, -.5, -.8);
    path(cam, f, [[0, 0, 1.9, 3.6, 0, 1.2, 0], [T1 + .2, -.5, 1.7, 2.2, -.5, 1.4, -.2], [fd, .6, 1.7, 2.2, .5, 1.4, -.3]]); } }; }, { xf: true });
// 5b "and said, Sir... are you feeding him cheeseburgers?" - dutch angle on the vet (lip sync), the dad sweating behind
shot(21.5, 24.35, () => { const R = room(0xd8f0f0), cam = newCam(58);
  return { scene: R.scene, cam, update(f, fd, t) { const m = talkIf(t, 21.6, 24.2); const v = place(R.scene, { ...VET, ...fx(f, [[0, 'deadpan'], [at(21.5, 22.64), 'smug']]), mouth: m || 'flat', arms: [[-.4, .1, .3], [.3, .6, .5]] }, -.3, 0, -.4, .45);
    place(R.scene, { ...DAD, ...fx(f, [[0, 'sad'], [at(21.5, 23.26), 'shock']]), tears: f > at(21.5, 23.26), arms: [[-.4, -.1, .2], [.4, -.1, .2]] }, 1.1, 0, -1.4, -.5); faceCam(cam, v, 1.5, -.3, .0, -.2); cam.rotation.z += .2; } }; });
// 6a "They hid every crumb of food in the house," - the fridge in chains, a padlock, the family on guard
shot(24.35, 27.0, () => { const K = kitchen(), cam = newCam(66), c = makeCat(1.7); K.scene.add(c); c.position.set(-.9, 0, .7); c.rotation.y = .9;
  const links = [...Array(18)].map((_, i) => { const l = inked(new THREE.TorusGeometry(.05, .014, 6, 10), 0x9a9aa8, .004); l.position.set(1.7 + (i - 9) * .05, 1.0 + Math.sin(i * .35) * .05, -2.03); l.rotation.y = i % 2 ? Math.PI / 2 : 0; K.scene.add(l); return l; });
  const lock = at3(box(.14, .16, .06, 0xffc83a, .008), 1.7, .92, -1.99); K.scene.add(lock);
  return { scene: K.scene, cam, update(f, fd, t) { links.forEach((l, i) => l.visible = f > .2 + i * .03); lock.visible = f > .8; lock.scale.setScalar(1 + .3 * Math.exp(-Math.max(0, f - .8) * 10)); c.userData.anim(t); catFace(c, f, [[0, 'wide'], [1.0, 'half']]);
    place(K.scene, { ...DAD, ...fx(f, [[0, 'angry'], [1.3, 'smug']]), arms: [[-.5, .5, .1], [.5, .5, .1]] }, .8, 0, -1.3, .2); place(K.scene, { ...MOM, ...fx(f, [[0, 'determined'], [1.0, 'angry']]), hands: [V(-.3, .8, .2), V(.25, 1.85, .2)] }, -1.8, 0, -2.0, .4);
    path(cam, f, [[0, 1.6, 1.3, -1.0, 1.7, 1.0, -2.2], [fd, -.2, 1.5, 2.8, .2, .9, -1.0]]); } }; });
// 6b "but Biscuit kept growing, until he was basically a beanbag with legs." - straight down on the couch: he swells... and swells... tiny legs wiggle
shot(27.0, 31.9, () => { const R = room(0xffe8c8), cam = newCam(60), ch = couch(0x3a8ad8); R.scene.add(ch); ch.position.set(0, 0, -.4); let cat = null, fatNow = -1;
  return { scene: R.scene, cam, update(f, fd, t) { const fat = Math.round(lerp(1.7, 3.0, ss(0, at(27, 30.35), f)) * 10) / 10; if (fat !== fatNow) { if (cat) R.scene.remove(cat); cat = makeCat(fat); cat.position.set(0, .42, -.3); cat.rotation.y = .4; R.scene.add(cat); fatNow = fat; }
    cat.userData.anim(t); cat.userData.legs.forEach((l, i) => l.rotation.x = f > at(27, 31.16) ? Math.sin(t * 22 + i) * .8 : 0); catFace(cat, f, [[0, 'happy'], [1.6, 'half'], [at(27, 30.35), 'wide:open'], [at(27, 31.3), 'happy']]);
    path(cam, f, [[0, .01, 4.0, .5, 0, .4, -.3], [fd, .01, 2.9, .4, 0, .4, -.3]]); } }; }, { xf: true });
// 7 "So the dad clipped a tiny camera onto Biscuit's collar." - close: big hands, tiny camera, CLICK, the red light blinks on; Biscuit unimpressed
shot(31.9, 35.95, () => { const K = kitchen(), cam = newCam(56), c = makeCat(2.2, { collar: true, cam: true }); K.scene.add(c); c.position.set(0, 0, 0); const TC = at(31.9, 32.81);
  return { scene: K.scene, cam, update(f, fd, t) { c.userData.anim(t); catFace(c, f, [[0, 'half'], [TC, 'wide'], [TC + .4, 'half']]); c.updateMatrixWorld(true); const cp = c.userData.head.localToWorld(V(0, -.2, .2));
    const d = place(K.scene, { ...DAD, ...fx(f, [[0, 'determined'], [TC, 'smug'], [TC + 1.2, 'happy']]), hands: [V(-.12, .75 + Math.sin(f * 6) * .02, .5), V(.12, .75, .5)], lean: .35 }, -.75, 0, .75, Math.PI / 2); 
    path(cam, f, [[0, .9, cp.y + .3, cp.z + .8, cp.x - .2, cp.y, cp.z], [fd, .65, cp.y + .2, cp.z + .6, cp.x - .15, cp.y + .02, cp.z]]); } }; });
// 8 "That night, Biscuit squeezed under the fence, waddled two houses down, and scratched on a door." - COLLAR CAM: under the fence, across the lawns, up to a door... paw scratching
shot(35.95, 42.3, () => { const S = lights(world('night')), cam = newCam(96), paw = at3(inked(new THREE.SphereGeometry(.07, 10, 8), 0xf0a040, .008), 0, 0, 0); S.scene.add(paw);
  for (let i = 0; i < 26; i++) S.scene.add(at3(box(.1, 1.0, .04, 0xe8e2d4, .008), -.9, .78, -5.6 + i * .2));
  S.scene.add(at3(box(.06, .06, 5.4, 0xe8e2d4, .006), -.92, 1.0, -3.0)); S.scene.add(at3(box(.06, .06, 5.4, 0xe8e2d4, .006), -.92, .55, -3.0));
  const P = [[0, 1.2, .14, -2.4], [at(35.95, 37.3), -.3, .14, -2.4], [at(35.95, 38.1), -1.5, .12, -2.5], [at(35.95, 40.0), -3.0, .16, -3.5], [at(35.95, 40.8), -3.95, .16, -4.45]];
  return { scene: S.scene, cam, camLabel: 'COLLAR CAM', doorcam: '02:14 AM', update(f, fd, t) { setSun(S, -2, -3); let i = 0; while (i < P.length - 2 && f > P[i + 1][0]) i++; const a = P[i], b = P[i + 1], k = clamp((f - a[0]) / (b[0] - a[0]));
    const x = lerp(a[1], b[1], k), z = lerp(a[3], b[3], k), y = lerp(a[2], b[2], k) + Math.abs(Math.sin(t * 9)) * .03 * (f < P[4][0]), dir = f < P[4][0] ? Math.atan2(b[3] - a[3], b[1] - a[1]) : -Math.PI / 2;
    look(cam, x, y, z, x + Math.cos(dir) * 2, y + .05 + (f > P[4][0] ? .25 : 0), z + Math.sin(dir) * 2); cam.rotation.z += Math.sin(t * 9) * .04 * (f < P[4][0]);
    const sc_ = f > at(35.95, 40.9); paw.visible = sc_; if (sc_) { paw.position.set(x + Math.sin(t * 18) * .06, y + .05 + Math.abs(Math.sin(t * 18)) * .08, z - .25); } } }; }, { xf: true });
// 9 "A lady opened it and said, There you are, Mr. Whiskers! and set down a giant bowl of salmon." - warm light spills out; she beams (lip sync); a GIANT bowl; Biscuit dives in
shot(42.3, 49.0, () => { const S = lights(world('night')), cam = newCam(62), hx = HX.dave, c = makeCat(1.6, { collar: true, cam: true }), bw = bowl(.32, 0xff8ab8), dr = new THREE.Group(); S.scene.add(c, bw, dr);
  S.daveHouse.userData.door.scale.setScalar(.001); dr.position.set(hx - .35, 0, -4.87); dr.add(at3(box(.7, 1.2, .08, 0x7a4a2a, .015), .35, .6, 0)); const glow = at3(new THREE.Mesh(new THREE.BoxGeometry(.7, 1.2, .02), flat(0xffd87a)), hx, .6, -4.92); S.scene.add(glow); const warm = new THREE.PointLight(0xffc870, 0, 5); warm.position.set(hx, 1.0, -4.3); S.scene.add(warm);
  const fish = [...Array(7)].map((_, i) => { const m = inked(new THREE.BoxGeometry(.12, .06, .08), 0xff8a6a, .006); m.rotation.y = i; S.scene.add(m); return m; }); c.position.set(hx + .55, 0, -4.2); c.rotation.y = Math.PI + .6;
  const TO = at(42.3, 42.94), TB = at(42.3, 46.67);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, hx, -3); const op = ss(TO - .1, TO + .5, f); dr.rotation.y = -op * 1.7; warm.intensity = op * 6; const m = talkIf(t, 44.25, 45.95);
    const bend = ss(TB - .6, TB, f); const L = place(S.scene, { ...LADY, ...fx(f, [[0, 'shock'], [TO + .4, 'happy'], [at(42.3, 44.29), 'laugh'], [TB, 'smile']]), mouth: m || undefined, lean: bend * .5, hands: bend > .1 ? [V(-.2, lerp(1.0, .55, bend), lerp(.3, .55, bend)), V(.2, lerp(1.0, .55, bend), lerp(.3, .55, bend))] : undefined, arms: [[-.6, .6, .3], [.6, .6, .3]] }, hx, 0, lerp(-5.2, -4.55, op), 0);
    bw.visible = bend > .05; bw.position.set(hx - .05, bend < 1 ? lerp(.8, 0, bend) : 0, -4.3); fish.forEach((m, i) => { m.visible = bw.visible; m.position.set(bw.position.x + Math.cos(i * 2.3) * .14, bw.position.y + .2 + (i % 3) * .04, bw.position.z + Math.sin(i * 2.3) * .14); });
    const dive = f > TB + .4; c.position.x = dive ? hx + .4 : hx + 1.05; c.userData.head.rotation.x = dive ? .7 + Math.sin(t * 14) * .1 : -.3; c.userData.anim(t); catFace(c, f, [[0, 'wide'], [TO + .5, 'happy'], [TB, 'wide:open'], [TB + .4, 'happy:open']]);
    path(cam, f, [[0, hx + .5, .5, -2.9, hx, .9, -4.9], [TO + .7, hx - .7, 1.45, -2.7, hx, 1.45, -4.6], [TB - .6, hx - .6, 1.5, -2.2, hx, 1.1, -4.4], [fd, hx + .35, 1.75, -1.7, hx + .2, .5, -4.3]]); } }; });
// 10 "Turns out, for six years, Biscuit had two families, two names, and two dinners." - dusk, crane up over the two houses: BISCUIT here, MR. WHISKERS there, a bowl at each door
shot(49.0, 55.9, () => { const S = lights(world('morning')), cam = newCam(56), c = makeCat(2.2, { collar: true }); S.scene.add(c);
  const n1 = sprite('BISCUIT', '#ffd23a', 1.6, 46), n2 = sprite('MR. WHISKERS', '#ff8ab8', 1.9, 34); n1.position.set(HX.gary, 4.6, -5.2); n2.position.set(HX.dave, 4.6, -5.2); S.scene.add(n1, n2); const b1 = bowl(.22), b2 = bowl(.22, 0xff8ab8); b1.position.set(HX.gary + .4, 0, -4.4); b2.position.set(HX.dave + .4, 0, -4.4); S.scene.add(b1, b2);
  const T1 = at(49, 52.3), T2 = at(49, 53.47), T3 = at(49, 54.74);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -1, -3); const q = (Math.sin(f * .9 - 1.6) + 1) / 2, x = lerp(HX.gary - .2, HX.dave + .2, q); c.position.set(x, 0, -2.2); c.rotation.y = Math.cos(f * .9 - 1.6) > 0 ? -Math.PI / 2 : Math.PI / 2; c.userData.anim(t, 1); catFace(c, f, [[0, 'happy'], [T3, 'happy:open']]);
    const fam = f > T1; if (fam) { place(S.scene, { ...DAD, ...EX.happy, arms: [[-.5, .2, .1], [.5, .9 + Math.sin(t * 6) * .2, .1]] }, HX.gary + 1, 0, -3.6, 0); place(S.scene, { ...MOM, ...EX.happy }, HX.gary - .6, 0, -3.7, 0); place(S.scene, { ...LADY, ...EX.laugh, arms: [[-.5, .9 + Math.sin(t * 6 + 1) * .2, .1], [.5, .2, .1]] }, HX.dave - .8, 0, -3.6, 0); }
    [n1, n2].forEach(n => n.scale.setScalar((n === n1 ? 1.6 : 1.9) * pop(f - T2))); [b1, b2].forEach(b => b.scale.setScalar(Math.max(.001, pop(f - T3))));
    path(cam, f, [[0, -1, .9, 1.4, -1, .6, -2.2], [T1, -1, 3.5, 5.5, -1, .8, -3.4], [fd, -1, 6.5, 9.0, -1, 1.2, -4.0]]); } }; }, { xf: true });
// 11 "Now both families split the vet bill. Biscuit still eats twice." - one bill, torn in half between them... and Biscuit between two bowls: munch, munch
shot(55.9, 999, () => { const R = room(0xd8f0f0), cam = newCam(60), c = makeCat(1.8), b1 = bowl(.2), b2 = bowl(.2, 0xff8ab8); R.scene.add(c, b1, b2); c.position.set(0, 0, .3); b1.position.set(-.75, 0, .7); b2.position.set(.75, 0, .7);
  const half = s => card(.45, .6, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = `900 ${h * .1}px Nunito`; g.textAlign = s < 0 ? 'right' : 'left'; g.fillText(s < 0 ? 'VET B' : 'ILL', s < 0 ? w : 0, h * .18); g.font = `900 ${h * .16}px Nunito`; g.fillText(s < 0 ? '$40' : '0.00', s < 0 ? w : 0, h * .5); g.strokeStyle = '#16121a'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); }, 128);
  const h1 = half(-1), h2 = half(1); R.scene.add(h1, h2); const TE = at(55.9, 58.95);
  return { scene: R.scene, cam, update(f, fd, t) { const tear = ss(at(55.9, 57.09), at(55.9, 57.6), f); h1.position.set(-.24 - tear * .25, 1.55, -.7); h2.position.set(.24 + tear * .25, 1.55, -.7); h1.rotation.z = tear * .25; h2.rotation.z = -tear * .25;
    place(R.scene, { ...DAD, ...fx(f, [[0, 'sad'], [1.2, 'smile']]), hands: [V(-.2, .9, .3), V(.3, 1.55 - 0, .45)] }, -1.0, 0, -.9, .5); place(R.scene, { ...LADY, ...fx(f, [[0, 'smile'], [1.0, 'happy']]), hands: [V(-.3, 1.55, .45), V(.2, .9, .3)] }, 1.0, 0, -.9, -.5);
    const side = f > TE ? (Math.sin((f - TE) * 7) > 0 ? -1 : 1) : 0; c.rotation.y = 0; c.userData.head.rotation.y = side * .9; c.userData.head.rotation.x = side ? .35 + Math.sin(t * 16) * .1 : 0; c.userData.anim(t); catFace(c, f, [[0, 'happy'], [TE, 'happy:open']]);
    path(cam, f, [[0, 0, 1.6, 2.6, 0, 1.4, -.7], [TE - .2, 0, 1.0, 2.0, 0, .5, .4], [fd, 0, 1.5, 3.3, 0, .5, .4]]); this.fade = ss(fd - .5, fd - .05, f); } }; });
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
const KEY = /fatter|weighs|^door$|^diet$|treats|^vet$|cheeseburgers|crumb|beanbag|^legs$|^camera$|^fence$|scratched|whiskers|salmon|families|^names$|dinners|^bill$|twice/i
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
  cam.fov = fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); renderer.render(s.scene, cam); cam.fov = fov0; cam.updateProjectionMatrix();
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
