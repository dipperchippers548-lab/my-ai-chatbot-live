// "He Bet His Life Savings He Could Beat One Guy" - noodle-people short (toon shading + ink outlines), rendered frame by frame.
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

// ===================== SHOTS (voiceover clock) =====================
// 1 "Seven years ago, Benny bet his entire life savings" - slow drift down onto the ring: Benny slaps a fat money bag on the apron, grinning

shot(0, 3.8, () => { const R = ring(), cam = newCam(44), bag = new THREE.Group(); bag.add(inked(new THREE.SphereGeometry(.38, 14, 12), 0xe8d8a0, .015)); const sg = sprite('$', '#2a8a3a', .55, 150); sg.position.set(0, .05, .38); bag.add(sg); R.scene.add(bag); bag.position.set(.9, RT + .36, 1.4); flipYear(R.banner, 2019);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const e = fx(f, [[0, 'happy'], [at(0, 2.32), 'determined'], [at(0, 3.25), 'happy']]); const g = place(R.scene, { ...BENNY, ...e, arms: [[-.4, .1, .2], [.5, .5 + Math.max(0, Math.sin(f * 7)) * .15, .4]] }, .3, RT, 1.2, .5);
    bag.scale.setScalar(1 + .08 * Math.exp(-Math.max(0, f - at(0, 1.87)) * 9) * (f > at(0, 1.87)));
    sweepCam(cam, f, fd, [3.2, 4.2, 7.2, 0, 1.2, 0], [2.0, 2.2, 4.2, .4, 1.4, 1.0]); } }; }, { xf: false });
// 2 "...that he could beat one guy in a boxing match." - THE CHAMP: low angle, cracking his neck, smug
shot(3.8, 6.85, () => { const R = ring(), cam = newCam(42);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const e = fx(f, [[0, 'smug'], [at(3.8, 5.1), 'angry'], [at(3.8, 5.61), 'smug']]); const crack = Math.sin(f * 5) > .6 ? .25 : -.1;
    const g = big(place(R.scene, { ...CHAMP, ...e, tilt: crack, arms: GUARD }, -.4, RT, -1.0, .3)); sweepCam(cam, f, fd, [.4, .9, 2.4, -.4, 2.0, -1.0], [.2, .75, 1.8, -.4, 2.3, -1.0]); } }; });
// 3 "He lost." - floor level: Benny face-down on the canvas, the champ's shoes in frame
shot(6.85, 7.85, () => { const R = ring(), cam = newCam(46);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const e = fx(f, [[0, 'shock'], [.25, 'dazed']]); const b = place(R.scene, { ...BENNY, ...e, arms: [[-.6, .4, .1], [.6, .4, .1]] }, 0, RT, 0, 0); b.rotation.x = Math.PI / 2; b.position.set(0, RT + .26, -.1);
    big(place(R.scene, { ...CHAMP, ...EX.smug, arms: GUARD }, 1.2, RT, -.9, -.6)); sweepCam(cam, f, fd, [-2.3, RT + .15, .9, 0, RT + .3, .6], [-2.1, RT + .15, .8, 0, RT + .3, .5]); } }; });
// 4 "In nine seconds." - straight down from the lights: Benny starfished, the ref counting
shot(7.85, 9.7, () => { const R = ring(), cam = newCam(40);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); lieDown(place(R.scene, { ...BENNY, ...EX.dazed, arms: [[-.8, .2, 0], [.8, .2, 0]], feet: [[0, .1], [0, .1]] }, 0, RT, 0, 0), RT + .26);
    place(R.scene, { ...REF, ...fx(f, [[0, 'shock'], [.6, 'deadpan']]), arms: [[-.4, -.1, .2], [.45, .5 + Math.sin(f * 12) * .2, .45]] }, 1.0, RT, -.5, -1.2);
    sweepCam(cam, f, fd, [.01, 5.0, -.6, 0, RT, -.9], [.01, 4.3, -.65, 0, RT, -.9]); cam.rotation.z += f * .08; } }; });
// 5 "So he bet again. And lost." - (dissolve) a year later, same ring: grin... BAM... dazed
shot(9.7, 12.5, () => { const R = ring({ seed: 4 }), cam = newCam(42), T = at(9.7, 11.3); flipYear(R.banner, 2020);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const down = ss(T, T + .25, f), e = fx(f, [[0, 'happy'], [at(9.7, 10.4), 'determined'], [T, 'shock'], [T + .2, 'dazed']]);
    const b = place(R.scene, { ...BENNY, ...e, arms: down > .5 ? [[-.6, .5, .1], [.6, .5, .1]] : GUARD }, 0, RT, .3, -.8); b.rotation.z = down * 1.45; b.position.x = down * .5; b.position.y = RT + down * .2;
    big(place(R.scene, { ...CHAMP, ...fx(f, [[0, 'smug'], [T - .1, 'angry'], [T + .3, 'smug']]), arms: f > T - .15 && f < T + .15 ? [[-.2, .7, .5], [-.1, .3, 1.1]] : GUARD }, -1.3, RT, .1, 1.2)); sweepCam(cam, f, fd, [-.3, 1.7, 5.0, -.5, 1.4, .2], [.2, 1.6, 4.4, -.5, 1.4, .2]); } }; }, { xf: true });
// 6 "And again." - (dissolve) straight down again, another year
shot(12.5, 13.85, () => { const R = ring({ seed: 5, canvas: 0x3ac8a8 }), cam = newCam(40);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); lieDown(place(R.scene, { ...BENNY, ...EX.dazed, arms: [[-.8, .3, 0], [.6, -.2, 0]], feet: [[0, .1], [.1, .2]] }, .3, RT, .2, .4), RT + .26); sweepCam(cam, f, fd, [.31, 4.8, -.4, .3, RT, -.7], [.31, 4.1, -.45, .3, RT, -.7]); cam.rotation.z -= f * .1; } }; }, { xf: true });
// 7 "Every year, same ring, same guy, same result." - the banner year flips 2021, 22, 23... Benny drops again and again below it
shot(13.85, 18.5, () => { const R = ring({ seed: 6 }), cam = newCam(46);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const yr = 2021 + Math.min(4, Math.floor(f / (fd / 5))); flipYear(R.banner, yr); const ph = (f % (fd / 5)) / (fd / 5), down = ss(.45, .6, ph);
    const b = place(R.scene, { ...BENNY, ...(down > .5 ? EX.dazed : fx(ph, [[0, 'happy'], [.25, 'determined']])), arms: GUARD }, .4, RT, .6, -.5); b.rotation.z = down * 1.45; b.position.y = RT + down * .22;
    big(place(R.scene, { ...CHAMP, ...EX.smug, arms: GUARD }, -1.0, RT, .2, 1.1)); sweepCam(cam, f, fd, [0, 1.6, 7.0, 0, 3.0, -4], [0, 2.4, 6.0, 0, 3.4, -4]); } }; }, { xf: true });
// 8 "Benny sold his car." - the street: he hands over the keys... it drives off
shot(18.5, 20.3, () => { const S = lights(world('day')), cam = newCam(44), c = car(0xe8323a, false); S.scene.add(c); const T = at(18.5, 19.5);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, 0); const k = Math.pow(clamp((f - T - .2) / 1.2), 2); c.position.set(-1 - k * 9, 0, 1.3); c.rotation.y = Math.PI; c.updateMatrixWorld(true); const dp = c.localToWorld(V(.25, .08, .28)); place(S.scene, { ...nb(5), sit: true, ...EX.happy, turn: -.8 }, dp.x, dp.y, dp.z, -Math.PI / 2);
    place(S.scene, { ...BEN, ...fx(f, [[0, 'smile'], [T, 'sad']]), arms: f < T ? [[-.4, -.1, .2], [.3, .35, .7]] : [[-.4, -.2, .1], [.4, -.2, .1]], nod: f > T ? .12 : 0 }, -.2, 0, -.2, .5); sweepCam(cam, f, fd, [1.6, 1.25, 3.4, -.5, 1.1, .1], [1.3, 1.2, 3.1, -.7, 1.1, .1]); } }; });
// 9 "Then his couch." - top-down on the apartment: POP, the couch is gone
shot(20.3, 21.6, () => { const R = room(0xffe8c8), cam = newCam(44), c1 = couch(0x3a8ad8), c2 = couch(0xe8742a); R.scene.add(c1, c2); c1.position.set(-1.1, 0, -1.2); c2.position.set(1.3, 0, -1.2); const T = at(20.3, 20.81);
  return { scene: R.scene, cam, update(f, fd, t) { const k = f > T ? Math.max(0, 1 - (f - T) / .12) : 1; c1.scale.setScalar(Math.max(.001, k)); place(R.scene, { ...BEN, ...fx(f, [[0, 'smile'], [T + .05, 'shock']]) }, 0, 0, .6, 0); sweepCam(cam, f, fd, [.01, 7.0, 1.5, 0, 0, -.4], [.01, 6.2, 1.2, 0, 0, -.4]); } }; });
// 10 "Then his other couch." - same angle: POP. He just stands there.
shot(21.6, 23.5, () => { const R = room(0xffe8c8), cam = newCam(44), c2 = couch(0xe8742a); R.scene.add(c2); c2.position.set(1.3, 0, -1.2); const T = at(21.6, 22.6);
  return { scene: R.scene, cam, update(f, fd, t) { const k = f > T ? Math.max(0, 1 - (f - T) / .12) : 1; c2.scale.setScalar(Math.max(.001, k)); place(R.scene, { ...BEN, ...fx(f, [[0, 'sad'], [T + .05, 'deadpan']]), still: true }, 0, 0, .6, 0); sweepCam(cam, f, fd, [.01, 6.2, 1.2, 0, 0, -.4], [.01, 5.4, 1.0, 0, 0, -.4]); } }; });
// 11 "His wife left." - she walks out the door with a suitcase; his face drops instantly
shot(23.5, 25.3, () => { const R = room(0xffe8c8), cam = newCam(42), door = at3(box(.9, 2.0, .1, 0x8a5a3a), 1.6, 1.0, -2.88), sc = cardBox(.5); R.scene.add(door, sc);
  return { scene: R.scene, cam, update(f, fd, t) { const k = clamp(f / (fd * .9)); const w = walkTo(R.scene, { ...WIFE, ...EX.angry, hands: [V(-.3, .9, .2), V(.35, .55, .1)] }, .6, .3, 1.6, -2.4, k, t, Math.atan2(1.0, -2.7)); w.updateMatrixWorld(true); sc.position.copy(w.localToWorld(V(.4, .35, .1)));
    place(R.scene, { ...BEN, ...fx(f, [[0, 'happy'], [.35, 'sad']]) }, -.9, 0, .4, .3); sweepCam(cam, f, fd, [-.3, 1.6, 4.0, .2, 1.1, -1.0], [-.1, 1.5, 3.6, .3, 1.1, -1.2]); } }; });
// 12 "His dog left." - the dog trots out after her, tail up
shot(25.3, 26.85, () => { const R = room(0xffe8c8), cam = newCam(40), door = at3(box(.9, 2.0, .1, 0x8a5a3a), 1.6, 1.0, -2.88), d = makeDog(), sc = cardBox(.2); R.scene.add(door, d, sc);
  return { scene: R.scene, cam, update(f, fd, t) { const k = clamp(f / fd); d.position.set(lerp(.3, 1.6, k), Math.abs(Math.sin(t * 14)) * .04, lerp(.4, -2.4, k)); d.rotation.y = Math.atan2(-2.8, 1.3) + Math.PI / 2; d.userData.tail.rotation.z = Math.sin(t * 20) * .5; d.updateMatrixWorld(true); sc.position.copy(d.localToWorld(V(.36, .25, .22)));
    sweepCam(cam, f, fd, [1.3, .35, 1.6, 1.0, .35, -1.0], [1.5, .3, 1.2, 1.2, .35, -1.4]); } }; });
// 13 "His goldfish... looked like it was thinking about it." - extreme close on the bowl: the fish slowly turns... and looks at the door
shot(26.85, 30.45, () => { const R = room(0xffe8c8), cam = newCam(36), fb = fishbowl(), tbl = at3(box(.8, .7, .6, 0x8a5a3a), 0, .35, 0); R.scene.add(tbl, fb); fb.position.set(0, .87, 0); const eye = new THREE.Mesh(new THREE.SphereGeometry(.012, 6, 6), flat(0x16121a)); fb.userData.fish.add(eye); eye.position.set(.035, .015, .03);
  return { scene: R.scene, cam, update(f, fd, t) { const k = ss(fd * .45, fd * .75, f); fb.userData.fish.rotation.y = lerp(-1.2, .9, k); fb.userData.fish.position.set(Math.sin(t * 1.3) * .03 * (1 - k), Math.sin(t * 2) * .01, 0); sweepCam(cam, f, fd, [.05, .95, .75, 0, .87, 0], [.03, .92, .55, 0, .87, 0]); } }; });
// 14 "This year, Benny trained like a madman." - the gym: headband on, he destroys the heavy bag
shot(30.45, 33.85, () => { const R = room(0xd8d8e0), cam = newCam(42), bag = new THREE.Group(); R.scene.add(bag); bag.position.set(.6, 2.6, -.4); bag.add(at3(box(.03, .6, .03, 0x9a9aa8, .004), 0, -.3, 0)); bag.add(at3(inked(new THREE.CylinderGeometry(.28, .28, 1.1, 14), 0xe8323a, .015), 0, -1.15, 0));
  return { scene: R.scene, cam, update(f, fd, t) { const hit = Math.max(0, Math.sin(t * 13)); bag.rotation.z = Math.sin(t * 13 - .8) * .12 + .05; const e = fx(f, [[0, 'determined'], [.8, 'scream'], [1.4, 'angry'], [2.2, 'scream'], [2.7, 'determined']]);
    place(R.scene, { ...BEN, ...e, headband: 0xe8323a, gloves: 0xe8323a, arms: [[-.25, .7, .45 + hit * .4 * (Math.sin(t * 6.5) > 0)], [.25, .7, .45 + hit * .4 * (Math.sin(t * 6.5) <= 0)]] }, -.2, 0, .2, 1.2); sweepCam(cam, f, fd, [2.2, .9, 2.8, -.1, 1.4, -.1], [1.9, .85, 2.5, -.1, 1.4, -.1]); cam.rotation.z += .08; } }; });
// 15 "Four AM runs." - dark street, low angle: he pounds past under the streetlight
shot(33.85, 35.5, () => { const S = lights(world('night')), cam = newCam(44);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -7, 0); const k = clamp(f / fd), sp = stepPose(t * 15); place(S.scene, { ...BEN, ...fx(f, [[0, 'determined'], [.9, 'scream']]), headband: 0xe8323a, ...sp, lean: .25 }, lerp(-4.5, -9.5, k), sp.bob, .1, -Math.PI / 2); sweepCam(cam, f, fd, [-6.3, .35, 3.2, -6.8, 1.1, -.2], [-7.4, .35, 3.0, -8.2, 1.1, -.2]); } }; });
// 16 "Raw eggs." - kitchen counter, a glass of raw eggs... down it goes. His face: instant regret
shot(35.5, 36.75, () => { const R = room(0xfff0d8), cam = newCam(38), gl = new THREE.Mesh(new THREE.CylinderGeometry(.07, .06, .2, 12), new THREE.MeshToonMaterial({ color: 0xfff2a0, gradientMap: ramp, transparent: true, opacity: .8 })); R.scene.add(gl, at3(box(2, .9, .6, 0xd8d0c8), 0, .45, -.6)); for (let i = 0; i < 4; i++) R.scene.add(at3(inked(new THREE.SphereGeometry(.06, 10, 8), 0xfff8e8, .006), -.5 + i * .14, .96, -.5));
  return { scene: R.scene, cam, update(f, fd, t) { const up = ss(0, .35, f), e = fx(f, [[0, 'determined'], [.45, 'gross'], [.8, 'scream']]); const b = place(R.scene, { ...BEN, ...e, headband: 0xe8323a, hands: [V(-.3, .9, .2), V(.12, lerp(1.0, 1.42, up), .35)] }, .2, 0, .2, 0); b.updateMatrixWorld(true); gl.position.copy(b.localToWorld(V(.12, lerp(1.06, 1.5, up), .38))); gl.rotation.z = up * 1.3;
    const fc = b.userData.head.localToWorld(V(0, -.2, 0)); look(cam, fc.x + .9, fc.y + .05, fc.z + 1.4, fc.x, fc.y - .1, fc.z); } }; });
// 17 "Punching frozen meat." - the meat locker, cold blue: punch, punch, punch
shot(36.75, 38.9, () => { const R = room(0xb8d8f0), cam = newCam(42), slabs = [-1.0, 0, 1.0].map((x, i) => { const m = meatSlab(); m.position.set(x, 0, -1.2 - (i % 2) * .4); R.scene.add(m); return m; });
  return { scene: R.scene, cam, update(f, fd, t) { slabs.forEach((m, i) => m.rotation.z = Math.sin(t * 9 + i) * (i === 1 ? .2 : .05)); const right = Math.sin(t * 8) > 0, e = fx(f, [[0, 'angry'], [.6, 'scream'], [1.2, 'angry'], [1.7, 'scream']]);
    place(R.scene, { ...BEN, ...e, headband: 0xe8323a, gloves: 0xe8323a, arms: right ? [[-.25, .7, .45], [.1, .6, 1.0]] : [[-.1, .6, 1.0], [.25, .7, .45]] }, 0, 0, -.25, Math.PI); sweepCam(cam, f, fd, [.9, .35, -2.8, 0, 1.4, -.6], [.7, .3, -2.5, 0, 1.4, -.6]); } }; });
// 18 "He steps into the ring," - low behind the ropes: Benny ducks through, the crowd roaring
shot(38.9, 40.7, () => { const R = ring({ seed: 7 }), cam = newCam(44); flipYear(R.banner, 2026);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const k = clamp(f / (fd * .8)); place(R.scene, { ...BENNY, ...fx(f, [[0, 'determined'], [.9, 'angry']]), headband: 0xe8323a, lean: .3 * (1 - k), arms: GUARD }, lerp(2.9, 1.6, k), RT, lerp(2.4, 1.5, k), -2.3); big(place(R.scene, { ...CHAMP, ...EX.smug, arms: GUARD }, -1.3, RT, -1.1, .8));
    sweepCam(cam, f, fd, [.9, .95, 4.2, 2.6, 1.4, 2.1], [.8, .9, 3.9, 1.6, 1.5, 1.4]); } }; });
// 19 "...looks the champ dead in the eye, and says," - extreme close on Benny's eyes, slow push
shot(40.7, 43.9, () => { const R = ring({ seed: 7 }), cam = newCam(30);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const b = place(R.scene, { ...BENNY, ...fx(f, [[0, 'determined'], [1.4, 'angry']]), headband: 0xe8323a, arms: GUARD, still: true }, .9, RT, .4, -1.9); b.updateMatrixWorld(true); const eye = b.userData.head.localToWorld(V(0, .06, .3)), fw = b.userData.head.localToWorld(V(0, .06, 1.3)).sub(eye);
    const d = lerp(1.7, 1.15, ss(0, fd, f)); look(cam, eye.x + fw.x * d, eye.y + .02, eye.z + fw.z * d, eye.x, eye.y, eye.z); } }; });
// 20 "You're going DOWN." - dutch angle, lip sync, nostrils flaring
shot(43.9, 46.3, () => { const R = ring({ seed: 7 }), cam = newCam(36);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const m = talkIf(t, 43.95, 45.6); const b = place(R.scene, { ...BENNY, ...EX.angry, mouth: m || 'flat', headband: 0xe8323a, arms: [[-.25, .8, .55], [.4, .9, .6]] }, .9, RT, .4, -1.9); faceCam(cam, b, 1.6, .35, .0, -.1); cam.rotation.z += .14; } }; });
// 21 "The champ just laughs." - smug... then he cracks up
shot(46.3, 48.3, () => { const R = ring({ seed: 7 }), cam = newCam(38);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const e = fx(f, [[0, 'smug'], [at(46.3, 47.42), 'laugh']]); const g = big(place(R.scene, { ...CHAMP, ...e, nod: e.mouth === 'open' ? Math.sin(t * 18) * .12 : 0, arms: GUARD }, -.9, RT, -.6, 1.1)); faceCam(cam, g, 2.4, -.4, -.2, -.1); } }; });
// 22 "Hahaha. Good luck, pal. You're gonna need it." - low dutch angle, lip sync, towering over
shot(48.3, 52.4, () => { const R = ring({ seed: 7 }), cam = newCam(40);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const m = talkIf(t, 48.35, 52.0); const e = fx(f, [[0, 'laugh'], [at(48.3, 49.38), 'smug']]); const g = big(place(R.scene, { ...CHAMP, ...e, mouth: m || e.mouth, arms: [[-.3, .6, .4], [.55, .9, .35]] }, -.9, RT, -.6, 1.1)); g.updateMatrixWorld(true);
    const hp = g.userData.head.localToWorld(V(0, -.2, 0)); sweepCam(cam, f, fd, [hp.x + 1.9, RT + .5, hp.z + 1.2, hp.x, hp.y - .2, hp.z], [hp.x + 1.7, RT + .45, hp.z + .9, hp.x, hp.y - .15, hp.z]); cam.rotation.z -= .15; } }; });
// 23 "The bell rings." - ringside bell, hammer: DING
shot(52.4, 54.0, () => { const R = ring({ seed: 8 }), cam = newCam(36), bl = bellProp(); R.scene.add(bl); bl.position.set(3.25, 0, 0); const T = at(52.4, 52.6);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); bl.userData.ham.rotation.z = f < T ? lerp(0, -.8, f / T) : -.8 + Math.min(1, (f - T) * 8) * 1.2 * Math.exp(-(f - T) * 5); bl.children[1].scale.setScalar(1 + .06 * Math.exp(-Math.max(0, f - T) * 12) * (f > T));
    sweepCam(cam, f, fd, [4.0, .85, .75, 3.25, .55, 0], [3.85, .8, .6, 3.25, .55, 0]); } }; });
// 24 "Benny swings..." - SLOW MOTION: the glove travels across the frame
shot(54.0, 56.3, () => { const R = ring({ seed: 8 }), cam = newCam(40);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const k = ss(.2, fd, f), slow = tm(54) + f * .25; NOW = slow;
    place(R.scene, { ...BENNY, ...fx(f, [[0, 'angry'], [.6, 'scream']]), headband: 0xe8323a, arms: [[-.25, .75, .45], [lerp(.4, -.05, k), lerp(.4, .75, k), lerp(-.2, 1.15, k)]], lean: k * .25 }, .7, RT, .2, -1.6);
    big(place(R.scene, { ...CHAMP, ...fx(f, [[0, 'smug'], [fd * .75, 'shock']]), arms: GUARD }, -.9, RT, -.4, 1.4)); sweepCam(cam, f, fd, [.2, 1.4, 2.8, -.2, 1.7, -.1], [-.2, 1.5, 2.5, -.3, 1.8, -.2]); } }; });
// 25 "...and the champ hits the floor." - floor level, slow motion: he topples straight at us
shot(56.3, 57.9, () => { const R = ring({ seed: 8 }), cam = newCam(44);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const k = ss(0, fd * .8, f); const g = big(place(R.scene, { ...CHAMP, ...EX.dazed, arms: [[-.6, .5, -.2], [.6, .5, -.2]], still: true }, 0, RT, -1.2, 0)); g.rotation.x = k * Math.PI / 2 * .98; g.position.z = -1.2;
    place(R.scene, { ...BENNY, ...fx(f, [[0, 'scream'], [fd * .7, 'shock']]), headband: 0xe8323a, arms: GUARD }, 1.2, RT, -2.4, -.4); sweepCam(cam, f, fd, [.2, RT + .12, 1.4, 0, RT + .5, -1.5], [.1, RT + .1, 1.3, 0, RT + .4, -1.5]); } }; });
// 26 "Out cold." - straight down: the champ starfished, Benny over him: shock -> joy -> shock
shot(57.9, 59.7, () => { const R = ring({ seed: 8 }), cam = newCam(40);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const g = big(place(R.scene, { ...CHAMP, ...EX.dazed, arms: [[-.8, .3, 0], [.8, .3, 0]], feet: [[0, .1], [0, .1]] }, 0, RT, 0, 0)); lieDown(g, RT + .3);
    place(R.scene, { ...BENNY, ...fx(f, [[0, 'shock'], [.55, 'happy'], [1.0, 'shock'], [1.3, 'happy']]), headband: 0xe8323a, arms: f > .55 ? [[-.4, 1.0, .1], [.4, 1.0, .1]] : GUARD }, .9, RT, 1.1, -.6); sweepCam(cam, f, fd, [.01, 5.4, -.5, .2, RT, -.7], [.01, 4.7, -.55, .2, RT, -.7]); cam.rotation.z += f * .1; } }; });
// 27 "After the fight, the champ hands him a dusty old shoebox." - the locker room: ice pack, a dusty box held out
shot(59.7, 64.4, () => { const R = room(0x9ab8c8), cam = newCam(42), sb = shoebox(), ice = at3(inked(new THREE.SphereGeometry(.16, 10, 8), 0x8ad8ff, .01), 0, 0, 0); R.scene.add(sb, ice); for (let i = 0; i < 7; i++) R.scene.add(at3(box(.55, 2.1, .5, 0x5a7a9a, .015), -2.4 + i * .6, 1.05, -2.7)); R.scene.add(at3(box(2.4, .4, .5, 0x8a5a3a), 0, .2, -1.6));
  const puff = [...Array(8)].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 5), new THREE.MeshBasicMaterial({ color: 0xd8c8a8, transparent: true, opacity: .7 })); R.scene.add(m); return m; }); const T = at(59.7, 61.63);
  return { scene: R.scene, cam, update(f, fd, t) { const k = ss(T - .4, T + .3, f), hx = lerp(.1, .45, k);
    const c = big(place(R.scene, { ...CHAMP, ...fx(f, [[0, 'dazed'], [.7, 'smile']]), hands: [V(-.25, 1.55, .25), V(hx, 1.0, .45)] }, -.8, 0, -.5, .9), 1.2); c.updateMatrixWorld(true); ice.position.copy(c.userData.head.localToWorld(V(-.15, .4, .1))); sb.position.copy(c.localToWorld(V(hx, 1.0, .65))); sb.rotation.y = .9;
    puff.forEach((m, i) => { const q = ((f * .5 + i / 8) % 1); m.position.copy(sb.position).add(V(Math.sin(i * 2) * q * .4, .2 + q * .5, Math.cos(i * 2) * q * .3)); m.material.opacity = .6 * (1 - q) * (f > T - .2); });
    place(R.scene, { ...BEN, ...fx(f, [[0, 'happy'], [T, 'shock']]), headband: 0xe8323a }, .9, 0, .3, -1.9); sweepCam(cam, f, fd, [.2, 1.5, 3.6, 0, 1.1, -.2], [.1, 1.4, 3.1, 0, 1.1, -.2]); } }; });
// 28 "Inside is every dollar Benny ever lost." - straight down: the lid lifts... stacks and stacks of cash
shot(64.4, 68.8, () => { const R = room(0x9ab8c8), cam = newCam(40), sb = shoebox(), glow = new THREE.PointLight(0xfff2a0, 0, 2); R.scene.add(sb, glow, at3(box(1.4, .8, .9, 0x8a5a3a), 0, .4, 0)); sb.position.set(0, .8, 0); glow.position.set(0, 1.2, 0);
  return { scene: R.scene, cam, update(f, fd, t) { const k = ss(.2, 1.0, f); sb.userData.lid.rotation.x = -k * 2.0; glow.intensity = 0; sb.userData.cash.children.forEach((c, i) => c.scale.y = 1 + k * (1 + (i % 3) * .5)); sweepCam(cam, f, fd, [.01, 2.4, .35, 0, .9, 0], [.01, 1.8, .25, 0, .9, 0]); } }; });
// 29 "I kept it all, he says. Figured you'd need it when you finally got good." - the champ, warm smile (lip sync)
shot(68.8, 74.7, () => { const R = room(0x9ab8c8), cam = newCam(38); for (let i = 0; i < 7; i++) R.scene.add(at3(box(.55, 2.1, .5, 0x5a7a9a, .015), -2.4 + i * .6, 1.05, -2.7));
  return { scene: R.scene, cam, update(f, fd, t) { const m = talkIf(t, 68.85, 70.4) || talkIf(t, 71.05, 73.8); const c = big(place(R.scene, { ...CHAMP, ...fx(f, [[0, 'smile'], [at(68.8, 73.4), 'happy']]), mouth: m || (f > at(68.8, 73.4) ? 'grin' : 'smile') }, -.3, 0, -.6, .35), 1.2);
    faceCam(cam, c, 2.4 - f * .06, -.5, -.15, -.15); } }; });
// 30 "Benny cried." - full waterworks
shot(74.7, 76.2, () => { const R = room(0x9ab8c8), cam = newCam(38);
  return { scene: R.scene, cam, update(f, fd, t) { const b = place(R.scene, { ...BEN, ...EX.cry, headband: 0xe8323a, squash: Math.abs(Math.sin(t * 9)) * .04 }, .6, 0, .2, -.7); faceCam(cam, b, 1.7, .2, .05, -.12); } }; });
// 31 "Then he spent all of it... on a rematch." - the shoebox slaps down on the ring apron. The banner: 2027. The champ cracks his knuckles. DING DING.
shot(76.2, 999, () => { const R = ring({ seed: 9 }), cam = newCam(44), sb = shoebox(); R.scene.add(sb); sb.position.set(.9, RT + .02, 2.0); flipYear(R.banner, 2027); const T = at(76.2, 77.19);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); sb.visible = f > T; sb.scale.setScalar(1 + .15 * Math.exp(-Math.max(0, f - T) * 10)); place(R.scene, { ...BENNY, ...fx(f, [[0, 'cry'], [T, 'happy'], [T + 1.1, 'determined']]), headband: 0xe8323a, arms: GUARD }, .5, RT, 1.3, .3);
    const c = big(place(R.scene, { ...CHAMP, ...fx(f, [[0, 'smile'], [T + 1.1, 'smug']]), arms: GUARD }, -1.0, RT, -.8, .7)); sweepCam(cam, f, fd, [1.0, 1.4, 3.9, -.2, 1.6, 0], [.5, 2.6, 4.3, -.2, 1.9, -1]); this.fade = ss(fd - .5, fd - .05, f); } }; });
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
const KEY = /^lost$|nine|^again$|^car$|^couch$|^left$|goldfish|madman|^eggs$|^meat$|^down$|laughs|^luck$|rings|swings|floor|^cold$|shoebox|dollar|cried|rematch/i
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
