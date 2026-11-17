// "The Man Who Became Mayor By Accident" - noodle-people short (toon shading + ink outlines), rendered frame by frame.
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
  gear(g, o, spine, head, HR, R);
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
// ===================== MAYOR: cast, props, SHOTS =====================
const talkIf = (tc, a, b) => tc >= tm(a) - .03 && tc <= tm(b) ? talkShape(tc) : null;
function walkTo(scene, o, x0, z0, x1, z1, k, t, ry) { const x = lerp(x0, x1, k), z = lerp(z0, z1, k), wd = stepPose(walkPhase(Math.hypot(x - x0, z - z0))), moving = k > 0 && k < 1; return place(scene, { ...o, ...(moving ? wd : {}), arms: moving ? wd.arms : o.arms }, x, moving ? wd.bob : 0, z, ry); }
function studio(bg) { const scene = new THREE.Scene(); scene.background = new THREE.Color(bg); scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b0a0, 1.6)); const k = new THREE.DirectionalLight(0xffffff, 1.6); k.position.set(2, 5, 5); k.castShadow = true; scene.add(k); const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), toon(new THREE.Color(bg).multiplyScalar(.85).getHex())); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl); return { scene }; }
const DOUG = { color: 0x5ac85a, eyes: 'half', mouth: 'smirk', shoe: 0xf2f2f2, tuft: true };
const NEIGH2 = { color: 0xff6aa8, glasses: true, curlers: true, shoe: 0xffffff };
const BOB = { color: 0x5aa8ff, mustache: true, glasses: true, shoe: 0x16121a };
const TED = { color: 0xff8a2a, hat: 'cap', hatColor: 0x3a3a48, shoe: 0x16121a };
const PAL2 = PAL.filter(c => c !== 0x7ad85a);
const plain = (i, extra = {}) => ({ ...crowdOpt(i), color: PAL2[i % PAL2.length], hat: ['cap', null, 'party', null][i % 4], tag: null, ...extra });
const DX = HX.gary;   // Doug's house
// a flat card with drawn content (posters, ballots, newspaper, signs)
function card(w, h, draw, pw = 256) { const ph = Math.round(pw * h / w); const D = document.createElement('canvas'); D.width = pw; D.height = ph; const g = D.getContext('2d'); const T = new THREE.CanvasTexture(D); T.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: T, side: THREE.DoubleSide }));
  m.userData.draw = (...a) => { g.clearRect(0, 0, pw, ph); draw(g, pw, ph, ...a); T.needsUpdate = true; }; m.userData.draw(); return m; }
const posterDraw = (name, col) => (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `900 ${w * .16}px Nunito`; g.textAlign = 'center'; g.fillText('VOTE', w / 2, h * .2); g.font = `900 ${w * .22}px Nunito`; g.fillText(name, w / 2, h * .92);
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(w / 2, h * .52, w * .24, 0, 7); g.fill(); g.fillStyle = '#16121a'; g.beginPath(); g.arc(w * .42, h * .48, w * .03, 0, 7); g.arc(w * .58, h * .48, w * .03, 0, 7); g.fill(); g.lineWidth = w * .02; g.strokeStyle = '#16121a'; g.beginPath(); g.arc(w / 2, h * .55, w * .08, .2, Math.PI - .2); g.stroke(); g.lineWidth = 8; g.strokeRect(0, 0, w, h); };
function ballotDraw(g, w, h, k = 0, write = 0) { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = `900 ${w * .1}px Nunito`; g.textAlign = 'center'; g.fillText('BALLOT', w / 2, h * .13); g.font = `700 ${w * .05}px Nunito`; g.fillText('MAYOR OF MILLBROOK', w / 2, h * .21);
  g.textAlign = 'left'; g.font = `900 ${w * .09}px Nunito`; [['BOB', .38], ['TED', .55]].forEach(([n, y], i) => { g.strokeStyle = '#16121a'; g.lineWidth = 4; g.strokeRect(w * .1, h * y - w * .07, w * .08, w * .08); g.fillStyle = '#16121a'; g.fillText(n, w * .25, h * y); const c = clamp(k * 2 - i); if (c > 0) { g.strokeStyle = '#e8323a'; g.lineWidth = 9; g.beginPath(); g.moveTo(w * .22, h * y - w * .03); g.lineTo(w * .22 + w * .5 * c, h * y - w * .03 + w * .02 * c); g.stroke(); } });
  g.strokeStyle = '#16121a'; g.lineWidth = 4; g.strokeRect(w * .1, h * .72 - w * .07, w * .08, w * .08); g.font = `700 ${w * .05}px Nunito`; g.fillText('WRITE-IN:', w * .25, h * .66); g.beginPath(); g.moveTo(w * .25, h * .76); g.lineTo(w * .9, h * .76); g.stroke();
  if (write > 0) { g.save(); g.beginPath(); g.rect(w * .25, h * .6, w * .7 * write, h * .2); g.clip(); g.fillStyle = '#2a5ab8'; g.font = `900 ${w * .15}px Nunito`; g.save(); g.translate(w * .27, h * .75); g.rotate(-.06); g.fillText('DOUG', 0, 0); g.restore(); g.restore(); if (write > .99) { g.strokeStyle = '#2a5ab8'; g.lineWidth = 7; g.beginPath(); g.moveTo(w * .11, h * .69); g.lineTo(w * .14, h * .72); g.lineTo(w * .19, h * .66); g.stroke(); } } }
function makePencil() { const g = new THREE.Group(); g.add(at3(inked(new THREE.CylinderGeometry(.03, .03, .5, 8), 0xffd23a, .008), 0, .25, 0)); g.add(at3(inked(new THREE.ConeGeometry(.03, .08, 8), 0xe8c8a0, .006), 0, -.04, 0)); g.children[1].rotation.x = Math.PI; g.add(at3(inked(new THREE.CylinderGeometry(.031, .031, .06, 8), 0xff8ab8, .006), 0, .52, 0)); return g; }
function makeBooth() { const g = new THREE.Group(); g.add(at3(box(1.1, .06, .7, 0xd8dce4), 0, 1.0, 0)); for (const s of [-1, 1]) g.add(at3(box(.06, 1.9, .7, 0x3a6ad8), s * .55, .95, 0)); g.add(at3(box(1.16, .5, .06, 0x3a6ad8), 0, 1.75, -.35)); const st = sprite('VOTE', '#ffffff', .7, 80); st.position.set(0, 1.75, -.3); g.add(st); g.add(at3(box(.06, 1.0, .06, 0x8a8a96), -.5, .5, .3)); g.add(at3(box(.06, 1.0, .06, 0x8a8a96), .5, .5, .3)); return g; }
function makeCouch(col = 0x8a5ad8) { const g = new THREE.Group(); g.add(at3(box(2.2, .45, .9, col), 0, .3, 0)); g.add(at3(box(2.2, .7, .25, col), 0, .75, -.35)); for (const s of [-1, 1]) g.add(at3(box(.25, .55, .9, col), s * 1.0, .45, 0)); return g; }
function makePizza(r = .6) { const g = new THREE.Group(); g.add(inked(new THREE.CylinderGeometry(r, r, .06, 24), 0xe8a050, .012)); g.add(at3(inked(new THREE.CylinderGeometry(r * .88, r * .88, .065, 24), 0xffd25a, .006), 0, .01, 0)); const r_ = rng(r * 100); for (let i = 0; i < 9; i++) { const a = r_() * 6.28, d = r_() * r * .7; g.add(at3(inked(new THREE.CylinderGeometry(r * .1, r * .1, .07, 10), 0xd8323a, .005), Math.cos(a) * d, .02, Math.sin(a) * d)); } return g; }
function phoneCard() { return card(.36, .66, (g, w, h, n = 0, t = 0) => { g.fillStyle = '#0e1220'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `900 ${w * .16}px Nunito`; g.textAlign = 'center'; g.fillText('7:02', w / 2, h * .15);
  const msgs = ['📞 Missed call', 'Congrats Mayor!!', 'DOUG YOU WON??', '📞 Missed call', 'News crew outside', 'Mr. Mayor!!', '📞 Missed call', 'Speech at noon?'];
  for (let i = 0; i < Math.min(n, 8); i++) { const y = h * .24 + i * h * .095; g.fillStyle = i % 3 === 0 ? '#2a8a4a' : '#2a3a5a'; g.fillRect(w * .06, y, w * .88, h * .085); g.fillStyle = '#fff'; g.font = `700 ${w * .075}px Nunito`; g.textAlign = 'left'; g.fillText(msgs[i], w * .1, y + h * .057); }
  g.strokeStyle = '#16121a'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); }, 160); }

// 1 "Every year, the town of Millbrook held an election for mayor." - town square: posters, banner, a booth; crane down
shot(0, 3.6, () => { const S = world('day'), cam = newCam(44), bn = card(4, .7, g => { g.fillStyle = '#e8323a'; g.fillRect(0, 0, 512, 90); g.fillStyle = '#fff'; g.font = '900 56px Nunito'; g.textAlign = 'center'; g.fillText('ELECTION DAY', 256, 64); }, 512); bn.position.set(DX - 1, 3.2, -3.9); S.scene.add(bn);
  for (const [x, n, c] of [[DX - 2.6, 'BOB', '#3a6ad8'], [DX + .6, 'TED', '#e8742a']]) { const p = card(.9, 1.2, posterDraw(n, c)); p.position.set(x, 1.7, -3.95); S.scene.add(p); S.scene.add(at3(box(.06, 1.7, .06, 0x5a4a3a, .008), x, .85, -4.0)); }
  const b = makeBooth(); b.position.set(DX - 1, 0, -2.8); S.scene.add(b);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, DX - 1, -2); const k = ss(0, fd, f); look(cam, DX - 1 + Math.sin(f * .5) * .6, lerp(6.5, 2.0, k), lerp(9, 4.4, k), DX - 1, lerp(1.0, 1.8, k), -3.4); } }; }, { noCut: true });
// 2 "And every year, nobody cared." - people walk right past; one yawns; a tumbleweed rolls by
shot(3.6, 6.4, () => { const S = world('day'), cam = newCam(42), tw = new THREE.Group(); S.scene.add(tw); for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.22, .02, 4, 10), toon(0xb8925a)); c.rotation.set(i * .7, i * 1.1, 0); tw.add(c); }
  for (const [x, n, c] of [[DX - 2.6, 'BOB', '#3a6ad8'], [DX + .6, 'TED', '#e8742a']]) { const p = card(.9, 1.2, posterDraw(n, c)); p.position.set(x, 1.7, -3.95); S.scene.add(p); }
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, DX - 1, -1); [0, 1, 2].forEach(i => { const k = clamp((f + i * .7) / (fd + 1.5)); walkTo(S.scene, plain(i + 2, { eyes: i === 1 ? 'closed' : 'half', mouth: i === 1 ? 'o' : 'flat', arms: i === 1 ? [[-.4, .6, 0], [.4, .2, .1]] : undefined }), DX - 6 + i, -1.6 + i * .5, DX + 4 + i, -1.6 + i * .5, k, t, Math.PI / 2); });
    tw.position.set(DX + 3 - f * 2.4, .25 + Math.abs(Math.sin(f * 7)) * .25, -.4); tw.rotation.z = f * 6;
    look(cam, DX - 1, 1.5, 4.5, DX - 1, 1.1, -1.5); } }; }, { xf: true });
// 3 "So when Doug got his ballot, he crossed out both names," - the ballot, close: BOB and TED get scratched out
shot(6.4, 9.6, () => { const R = room(0xe8f0ff), cam = newCam(40), bal = card(.8, 1.1, ballotDraw, 320), pen = makePencil(); R.scene.add(at3(box(2.4, .1, 1.4, 0xc8955a), 0, .95, -1)); bal.rotation.x = -Math.PI / 2; bal.position.set(0, 1.01, -.95); R.scene.add(bal); R.scene.add(pen); const X0 = at(6.4, 8.14);
  return { scene: R.scene, cam, update(f, fd, t) { const k = clamp((f - X0) / .9); bal.userData.draw(k, 0); place(R.scene, { ...DOUG, nod: .5, hands: [V(-.3, .95, .4), V(.25, 1.0, .5)] }, 0, 0, -2.1, 0);
    const row = k < .5 ? .38 : .55, c = (k * 2) % 1; pen.position.set((.22 + .5 * c - .5) * .8, 1.06, -.95 - (.5 - (row - .03)) * 1.1); pen.rotation.set(-.6, 0, .5); pen.visible = f > X0 - .3;
    look(cam, .1, 2.3, .2, 0, 1.0, -.95); } }; });
// 4 "and wrote in his own. As a joke." - DOUG scribbled in; then Doug winks
shot(9.6, 11.9, () => { const R = room(0xe8f0ff), cam = newCam(40), bal = card(.8, 1.1, ballotDraw, 320), pen = makePencil(); R.scene.add(at3(box(2.4, .1, 1.4, 0xc8955a), 0, .95, -1)); bal.rotation.x = -Math.PI / 2; bal.position.set(0, 1.01, -.95); R.scene.add(bal); R.scene.add(pen); const J = at(9.6, 11.09);
  return { scene: R.scene, cam, update(f, fd, t) { const w = clamp((f - .05) / .8); bal.userData.draw(1, w); pen.position.set((.27 + .6 * w - .5) * .8, 1.06, -.95 - (.5 - .73) * 1.1); pen.rotation.set(-.6, 0, .5); pen.visible = f < J;
    const g = place(R.scene, { ...DOUG, eyes: f > J ? 'happy' : 'half', mouth: f > J ? 'grin' : 'smirk', nod: f > J ? 0 : .5, hands: f > J ? [V(-.3, .95, .4), V(.3, 1.6, .5)] : [V(-.3, .95, .4), V(.25, 1.0, .5)] }, 0, 0, -2.1, 0);
    if (f < J) look(cam, .1, 2.3, .2, 0, 1.0, -.95); else { g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, 0, 0)); look(cam, hp.x + .2, hp.y + .05, hp.z + 2.0, hp.x, hp.y - .1, hp.z); } } }; });
// 5 "He thought nothing of it." - on the couch, chips, TV glow
shot(11.9, 13.3, () => { const R = room(0xdfe6ff), cam = newCam(42), c = makeCouch(); c.position.set(0, 0, -1.8); R.scene.add(c); const tv = at3(box(1.4, .85, .1, 0x16121a), 0, 1.2, 1.6); R.scene.add(tv); const chips = at3(box(.25, .35, .12, 0xffd23a, .01), .5, 1.0, -1.3); R.scene.add(chips);
  return { scene: R.scene, cam, update(f, fd, t) { const g = place(R.scene, { ...DOUG, sit: true, eyes: 'half', mouth: 'flat', hands: [V(-.3, .85, .35), V(.4, .5 + Math.abs(Math.sin(t * 3)) * .5, .4)] }, 0, .05, -1.75, 0); g.updateMatrixWorld(true); chips.position.copy(g.localToWorld(V(.45, .75, .35)));
    look(cam, .6, 1.5, 1.2, 0, 1.2, -1.7); } }; }, { xf: true });
// 6 "Until the next morning, when his phone wouldn't stop ringing." - phone buzzing off the nightstand, notifications stacking up
shot(13.3, 16.8, () => { const B = bedroom(), cam = newCam(40), ph = phoneCard(); B.scene.add(ph); ph.rotation.x = -Math.PI / 2;
  return { scene: B.scene, cam, update(f, fd, t) { const n = Math.floor(clamp((f - .2) / (fd - .4)) * 8.99), bz = n > 0 ? Math.sin(t * 70) * .006 : 0; ph.userData.draw(n, t); ph.position.set(.4 + bz, .63, -1.75 + bz); ph.rotation.z = bz * 5;
    const up = ss(fd * .6, fd, f); const g = place(B.scene, { ...DOUG, eyes: up > .3 ? 'wide' : 'closed', mouth: up > .3 ? 'o' : 'flat', sit: true, arms: [[-.4, .3, 0], [.4, .3, 0]] }, -1.2, .25, -.15, 0); g.rotation.x = lerp(-1.35, 0, up);
    look(cam, .7, 1.7, -.6, .35, .78, -1.8); } }; }, { xf: true });
// 7 "Doug had won." - a newspaper spins into the camera: DOUG WINS!
shot(16.8, 18.3, () => { const S = studio(0xffe8b0), cam = newCam(40), np = card(1.4, 1.9, (g, w, h) => { g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = `900 ${w * .07}px Nunito`; g.textAlign = 'center'; g.fillText('THE MILLBROOK TIMES', w / 2, h * .08); g.fillRect(w * .05, h * .1, w * .9, 4); g.font = `900 ${w * .2}px Nunito`; g.fillText('DOUG', w / 2, h * .3); g.fillText('WINS!', w / 2, h * .46);
  g.fillStyle = '#5ac85a'; g.beginPath(); g.arc(w / 2, h * .66, w * .15, 0, 7); g.fill(); g.fillRect(w * .41, h * .74, w * .18, h * .14); g.fillStyle = '#16121a'; g.beginPath(); g.arc(w * .45, h * .65, w * .02, 0, 7); g.arc(w * .55, h * .65, w * .02, 0, 7); g.fill(); g.fillStyle = '#bbb'; for (let i = 0; i < 6; i++) g.fillRect(w * .06, h * (.62 + i * .05), w * .25, 6); for (let i = 0; i < 6; i++) g.fillRect(w * .69, h * (.62 + i * .05), w * .25, 6); }, 400); S.scene.add(np);
  return { scene: S.scene, cam, update(f, fd, t) { const k = clamp(f / .55); np.rotation.set(0, 0, (1 - k) * 12); np.scale.setScalar(.05 + .95 * (1 - (1 - k) ** 3)); np.position.set(0, 1.5, 0); look(cam, 0, 1.5, 3.4 - f * .3, 0, 1.5, 0); } }; }, { noCut: true });
// 8 "Turns out, his neighbor saw the joke, and told everyone." - the neighbor peeks over the fence, then the gossip spreads phone to phone
shot(18.3, 21.95, () => { const S = world('day'), cam = newCam(40), SW = at(18.3, 20.57); const fence = new THREE.Group(); S.scene.add(fence); for (let i = 0; i < 9; i++) fence.add(at3(box(.12, 1.3, .06, 0xf2f2f2, .01), DX - 2.5 + i * .25, .65, -2.0)); fence.add(at3(box(2.3, .1, .07, 0xf2f2f2, .01), DX - 1.5, 1.0, -2.0));
  const tel = [0, 1, 2, 3].map(() => { const p = at3(box(.12, .22, .02, 0x16121a, .005), 0, 0, 0); S.scene.add(p); return p; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, DX - 1, -2); tel.forEach(p => p.visible = false);
    if (f < SW) { place(S.scene, { ...NEIGH2, mouth: 'grin', eyes: 'happy', blush: true, hands: [V(-.25, 1.2, .3), V(.25, 1.2, .3)] }, DX - 1.5, -.35 + Math.sin(clamp(f * 2) * Math.PI / 2) * .35, -2.5, 0); look(cam, DX - 1.3, 1.6, .9, DX - 1.5, 1.3, -2.2); }
    else { const a = f - SW; [0, 1, 2, 3].forEach(i => { const g = place(S.scene, { ...(i ? plain(i + 4) : NEIGH2), mouth: a > i * .25 ? 'o' : 'smile', eyes: a > i * .25 ? 'wide' : 'open', hands: [V(-.3, .9, .2), V(.22, 1.65, .25)] }, DX - 3 + i * 1.5, 0, -1.2, 0); g.updateMatrixWorld(true); tel[i].visible = true; tel[i].position.copy(g.localToWorld(V(.24, 1.68, .28))); });
      look(cam, DX - .75 + (a - .6) * .8, 1.7, 3.8, DX - .75 + (a - .6) * .8, 1.4, -1.2); } } }; }, { xf: true });
// 9 "Half the town wrote in Doug too." - booths full of people; ballots flying into the box, every one says DOUG
shot(21.95, 24.4, () => { const S = world('day'), cam = newCam(44), boxB = at3(box(.8, .7, .6, 0x3a6ad8), DX - 1, .35, -.4); S.scene.add(boxB); const slips = [...Array(10)].map(() => { const c = card(.3, .18, (g, w, h) => { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a5ab8'; g.font = `900 ${h * .6}px Nunito`; g.textAlign = 'center'; g.fillText('DOUG', w / 2, h * .72); }, 128); S.scene.add(c); return c; });
  for (let i = 0; i < 4; i++) { const b = makeBooth(); b.position.set(DX - 4 + i * 2, 0, -2.6); S.scene.add(b); staticNoodle(S.scene, plain(i, { nod: .4 }), DX - 4 + i * 2, -2.9, Math.PI); }
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, DX - 1, -1); slips.forEach((c, i) => { const q = clamp((f - i * .18) / .7); c.visible = q > 0 && q < 1; c.position.set(lerp(DX - 4 + (i % 4) * 2, DX - 1, q), .7 + Math.sin(q * Math.PI) * 1.4, lerp(-2.4, -.4, q)); c.rotation.set(q * 8, q * 5, 0); });
    look(cam, DX - 1, 2.6, 3.8, DX - 1, 1.0, -1.4); } }; }, { xf: true });
// 10 "Doug had no plan. No speech." - at the podium: a blank page, sweating
shot(24.4, 26.95, () => { const R = room(0xdce8ff), cam = newCam(40); const pd = new THREE.Group(); pd.position.set(0, 0, -1.4); R.scene.add(pd); pd.add(at3(box(1.1, 1.0, .6, 0x8a5a3a), 0, .5, 0)); const paper = card(.4, .5, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }, 64); paper.rotation.x = -1.2; paper.position.set(0, 1.03, -.3); pd.add(paper);
  pd.add(at3(inked(new THREE.CylinderGeometry(.015, .015, .4, 6), 0x2a2a30, .005), .2, 1.2, .1)); pd.add(at3(inked(new THREE.SphereGeometry(.05, 8, 6), 0x2a2a30, .006), .2, 1.42, .14)); const dr = [0, 1, 2].map(() => { const d = inked(new THREE.SphereGeometry(.04, 8, 6), 0x9ad8ff, .006, null, true); R.scene.add(d); return d; });
  return { scene: R.scene, cam, update(f, fd, t) { const g = place(R.scene, { ...DOUG, hat: 'top', sash: true, eyes: 'wide', mouth: 'wavy', brow: .3, browUp: .05, arms: [[-.4, .05, .3], [.4, .05, .3]] }, 0, 0, -1.95, 0); g.updateMatrixWorld(true); dr.forEach((d, i) => { const q = (t * 1.4 + i / 3) % 1; d.position.copy(g.userData.head.localToWorld(V(.32 - i * .2, .25 - q * .5, .3))); });
    look(cam, 0, 1.8, 2.6 - f * .3, 0, 1.55, -1.8); } }; });
// 11 "No idea what a mayor even does." - spinning in the office chair; a big search bar; question marks
shot(26.95, 29.25, () => { const R = room(0xe0f0e8), cam = newCam(42), desk = at3(box(2.0, .1, .9, 0x6a4a2a), 0, .9, -1.2); R.scene.add(desk); const sb = card(2.2, .45, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a6ad8'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#16121a'; g.font = `700 ${h * .36}px Nunito`; g.fillText('what does a mayor do', w * .06, h * .62); }, 512); sb.position.set(0, 2.6, -2.85); R.scene.add(sb); const qs = [0, 1, 2].map(() => { const s = sprite('?', '#ffe21f', .6); R.scene.add(s); return s; });
  return { scene: R.scene, cam, update(f, fd, t) { const g = place(R.scene, { ...DOUG, hat: 'top', sash: true, sit: true, eyes: 'open', mouth: 'wavy', brow: -.25, arms: [[-.5, .3, .1], [.5, .3, .1]] }, 0, .05, -2.0, f * 7); qs.forEach((s, i) => { s.position.set(-.6 + i * .6, 2.1 + Math.sin(t * 4 + i) * .06, -1.9); s.scale.setScalar(.6 * pop(f - .3 - i * .15)); });
    look(cam, 0, 1.9, 2.2, 0, 1.7, -2); } }; }, { xf: true });
// 12 "So on his first day, he fixed the potholes, because they annoyed him." - shovel, potholes, pop-pop-pop
shot(29.25, 33.45, () => { const S = world('day'), cam = newCam(42), holes = [0, 1, 2].map(i => { const h = new THREE.Mesh(new THREE.CircleGeometry(.35, 14), flat(0x26262c)); h.rotation.x = -Math.PI / 2; h.scale.set(1.3, 1, 1); h.position.set(DX - 2 + i * 1.6, .02, 2.2); S.scene.add(h); return h; }); const sh = new THREE.Group(); S.scene.add(sh); sh.add(at3(box(.04, .9, .04, 0x8a5a3a, .006), 0, .45, 0)); sh.add(at3(box(.24, .04, .3, 0xa8acb8, .008), 0, 0, .1));
  const A = at(29.25, 32.52);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, DX, 2); const per = (fd - .4) / 3, i = Math.min(2, Math.floor(f / per)), local = (f - i * per) / per; holes.forEach((h, j) => { h.scale.setScalar(j < i || (j === i && local > .7) ? 0 : 1); h.scale.x *= 1.3; });
    const x = DX - 2 + i * 1.6 - .5, ang = f > A && f < A + .7; const g = place(S.scene, { ...DOUG, hat: 'top', sash: true, eyes: ang ? 'open' : 'half', mouth: ang ? 'frown' : 'flat', brow: ang ? -.35 : 0, hands: [V(.1, .6 + Math.sin(local * 18) * .15, .35), V(.25, .9, .3)] }, x, 0, 1.9, Math.PI / 2);
    g.updateMatrixWorld(true); sh.position.copy(g.localToWorld(V(.25, .2 + Math.sin(local * 18) * .12, .35))); sh.rotation.set(0, Math.PI / 2, -.5);
    look(cam, x + 1.0, 1.9, 6.4, x + .5, .8, 2.0); } }; }, { noCut: true });
// 13 "On his second day, he put free snacks at every bus stop." - bus stop, a big FREE SNACKS basket, happy commuters
shot(33.45, 36.9, () => { const S = world('day'), cam = newCam(42), bs = new THREE.Group(); bs.position.set(DX - 1, 0, -.2); S.scene.add(bs); bs.add(at3(box(3, .1, 1.1, 0x3a6ad8), 0, 2.3, 0)); for (const s of [-1, 1]) bs.add(at3(box(.08, 2.3, .08, 0x8a8a96, .008), s * 1.4, 1.15, .45)); bs.add(at3(box(2.6, .1, .5, 0x8a5a3a), 0, .55, -.2));
  const sign = card(1.2, .4, (g, w, h) => { g.fillStyle = '#ffe21f'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = `900 ${h * .5}px Nunito`; g.textAlign = 'center'; g.fillText('FREE SNACKS', w / 2, h * .68); g.lineWidth = 8; g.strokeRect(0, 0, w, h); }, 300); sign.position.set(.9, 1.6, .5); bs.add(sign);
  const bk = new THREE.Group(); bk.position.set(.9, .62, .3); bs.add(bk); bk.add(at3(inked(new THREE.CylinderGeometry(.35, .28, .3, 14), 0xb8925a, .01), 0, .15, 0)); for (let i = 0; i < 6; i++) bk.add(at3(box(.14, .2, .06, PAL[i], .006), Math.cos(i) * .18, .35, Math.sin(i) * .18));
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, DX, 0); [0, 1, 2].forEach(i => { const g = place(S.scene, plain(i + 1, { eyes: 'happy', mouth: 'grin', blush: true, hands: i === 1 ? [V(-.3, .9, .3), V(.3, 1.25 + Math.abs(Math.sin(t * 6)) * .2, .4)] : undefined }), DX - 2.3 + i * .9, 0, .25, 0); });
    place(S.scene, { ...DOUG, hat: 'top', sash: true, eyes: 'happy', mouth: 'smirk', hands: [V(-.3, .9, .3), V(.35, 1.5, .3)] }, DX + 1.4, 0, .6, -.5); look(cam, DX - .4, 1.8, 4.6, DX - .5, 1.2, 0); } }; }, { xf: true });
// 14 "Then he made every Friday, Pizza Friday." - a giant pizza, everyone with a slice, confetti, banner
shot(36.9, 40.05, () => { const S = world('day'), cam = newCam(46), pz = makePizza(1.1); pz.position.set(DX - 1, 1.0, -.6); S.scene.add(pz); S.scene.add(at3(box(2.8, .08, 1.6, 0xffffff, .015), DX - 1, .95, -.6)); for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 0], [1.2, 0]]) S.scene.add(at3(box(.08, .95, .08, 0x8a5a3a, .008), DX - 1 + x, .47, -.6 + z));
  const bn = card(3.6, .7, g => { g.fillStyle = '#e8323a'; g.fillRect(0, 0, 512, 100); g.fillStyle = '#fff'; g.font = '900 64px Nunito'; g.textAlign = 'center'; g.fillText('PIZZA FRIDAY!', 256, 72); }, 512); bn.position.set(DX - 1, 3.0, -2.2); S.scene.add(bn);
  const conf = [...Array(40)].map((_, i) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(.07, .11), new THREE.MeshBasicMaterial({ color: PAL[i % 10], side: THREE.DoubleSide })); c.userData = i; S.scene.add(c); return c; }); const crowd = [];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; crowd.push(staticNoodle(S.scene, plain(i, { eyes: 'happy', mouth: 'grin', arms: [[-.45, .7, .1], [.45, .7, .1]] }), DX - 1 + Math.cos(a) * 2.2, -.6 + Math.sin(a) * 1.5, -a - Math.PI / 2)); }
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, DX - 1, 0); crowd.forEach((g, i) => { g.position.y = Math.abs(Math.sin(t * 8 + i)) * .25; }); pz.rotation.y = t * .5; conf.forEach(c => { const i = c.userData, q = ((t * .5 + i / 40) % 1); c.position.set(DX - 1 + Math.sin(i * 2.3) * 3, 4 - q * 4, -.6 + Math.cos(i * 1.7) * 2); c.rotation.set(t * 5 + i, t * 4, i); });
    const k = ss(0, fd, f); look(cam, DX - 1 + Math.sin(k * 2) * 2, lerp(2.4, 3.6, k), lerp(4.6, 4.0, k), DX - 1, 1.2, -.6); } }; }, { xf: true, noCut: true });
// 15 "The town loved him." - crowd-surfing Doug, hearts everywhere
shot(40.05, 41.6, () => { const S = world('day'), cam = newCam(44), hs = [...Array(6)].map(() => { const s = sprite('♥', '#ff4a7a', .5, 140); S.scene.add(s); return s; }); const crowd = []; for (let i = 0; i < 5; i++) crowd.push(staticNoodle(S.scene, plain(i, { eyes: 'happy', mouth: 'grin', arms: [[-.3, 1.0, .1], [.3, 1.0, .1]] }), DX - 2.4 + i * 1.2, -.6, 0));
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, DX, 0); crowd.forEach((g, i) => g.position.y = Math.abs(Math.sin(t * 7 + i)) * .1); const g = place(S.scene, { ...DOUG, hat: 'top', sash: true, eyes: 'happy', mouth: 'grin', blush: true, arms: [[-.5, .5, 0], [.5, .5, 0]] }, DX - 1 + f * .8, 2.35, -.6, 0); g.rotation.z = Math.PI / 2; g.rotation.y = .3;
    hs.forEach((s, i) => { const q = (t * .6 + i / 6) % 1; s.position.set(DX - 2.4 + i * .9, 2.6 + q * 1.4, -.4); s.material.opacity = 1 - q; s.scale.setScalar(.45); }); look(cam, DX - .6, 2.2, 4.8, DX - .6, 1.9, -.6); } }; }, { xf: true });
// 16 "Crime went down. Happiness went up." - two big bars: CRIME shrinks, HAPPINESS grows
shot(41.6, 43.95, () => { const S = studio(0x1a2a4a), cam = newCam(40), H2 = at(41.6, 42.81); const cr = inked(new THREE.BoxGeometry(.8, 1, .5), 0xe8323a, .02), hp = inked(new THREE.BoxGeometry(.8, 1, .5), 0x5ad85a, .02); S.scene.add(cr, hp);
  const l1 = sprite('CRIME', '#ff6a6a', .8, 70), l2 = sprite('HAPPY', '#7aff7a', .8, 70); S.scene.add(l1, l2); l1.position.set(-.7, .32, .4); l2.position.set(.7, .32, .4);
  const a1 = sprite('▼', '#ff4a4a', .7, 140), a2 = sprite('▲', '#5aff5a', .7, 140); S.scene.add(a1, a2);
  return { scene: S.scene, cam, update(f, fd, t) { const c = lerp(2.2, .25, ss(.1, .7, f)), h = lerp(.25, 2.6, ss(H2, H2 + .6, f)); cr.scale.y = c; cr.position.set(-.7, .5 + c / 2, 0); hp.scale.y = h; hp.position.set(.7, .5 + h / 2, 0); a1.position.set(-.7, .8 + c + .2, .3); a2.position.set(.7, .8 + h + .2, .3); a2.visible = f > H2;
    look(cam, 0, 2.0, 5.8, 0, 1.5, 0); } }; }, { xf: true, noCut: true });
// 17 "And at the next election, Doug won again." - the newspaper again: DOUG WINS AGAIN!, confetti, Doug in sash + hoodie
shot(43.95, 46.75, () => { const S = studio(0xffe8b0), cam = newCam(40), np = card(1.3, 1.75, (g, w, h) => { g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = `900 ${w * .07}px Nunito`; g.textAlign = 'center'; g.fillText('THE MILLBROOK TIMES', w / 2, h * .08); g.font = `900 ${w * .17}px Nunito`; g.fillText('DOUG WINS', w / 2, h * .3); g.fillStyle = '#e8323a'; g.fillText('AGAIN!', w / 2, h * .48); g.fillStyle = '#bbb'; for (let i = 0; i < 8; i++) g.fillRect(w * .08, h * (.58 + i * .045), w * .84, 6); }, 400); S.scene.add(np);
  const conf = [...Array(30)].map((_, i) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(.07, .11), new THREE.MeshBasicMaterial({ color: PAL[i % 10], side: THREE.DoubleSide })); c.userData = i; S.scene.add(c); return c; });
  return { scene: S.scene, cam, update(f, fd, t) { const k = clamp(f / .5); np.rotation.set(0, 0, (1 - k) * 12); np.scale.setScalar(.05 + .95 * (1 - (1 - k) ** 3)); np.position.set(-.4, 1.5, 0);
    place(S.scene, { ...DOUG, hat: 'top', sash: true, eyes: 'happy', mouth: 'grin', blush: true, arms: [[-.45, .7, .1], [.45, .7, .1]] }, .75, 0, .2, -.3); conf.forEach(c => { const i = c.userData, q = ((t * .5 + i / 30) % 1); c.visible = f > .5; c.position.set(Math.sin(i * 2.3) * 1.8, 3.2 - q * 3.2, Math.cos(i * 1.7) * .8); c.rotation.set(t * 5 + i, t * 4, i); });
    look(cam, .15, 1.6, 5.4 - f * .2, .15, 1.4, 0); } }; }, { noCut: true });
// 18 "This time, even his opponent voted for him." - Bob at the voting table, glancing around... then writes DOUG. Shh.
shot(46.75, 99, () => { const S = world('day'), cam = newCam(40), T0 = V(DX - 1, 0, -1.55); S.scene.add(at3(box(1.2, .06, .7, 0xd8dce4), T0.x, .97, T0.z)); for (const [x, z] of [[-.55, -.3], [.55, -.3], [-.55, .3], [.55, .3]]) S.scene.add(at3(box(.05, .95, .05, 0x8a8a96, .006), T0.x + x, .47, T0.z + z));
  const sg = card(1.0, .35, (g, w, h) => { g.fillStyle = '#3a6ad8'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `900 ${h * .6}px Nunito`; g.textAlign = 'center'; g.fillText('VOTE', w / 2, h * .72); }, 256); sg.position.set(T0.x, 2.55, T0.z - 1.0); S.scene.add(sg);
  const bal = card(.36, .5, ballotDraw, 200), pen = makePencil(); bal.rotation.x = -Math.PI / 2; bal.position.set(T0.x, 1.005, T0.z + .05); S.scene.add(bal); S.scene.add(pen); const VT = at(46.75, 48.6);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, T0.x, -1); const w = clamp((f - VT) / .7); bal.userData.draw(0, w); const glance = f < VT ? Math.sin(f * 6) * .8 : 0, shh = f > VT + .8;
    place(S.scene, { ...BOB, turn: glance, eyes: f < VT ? 'half' : 'happy', mouth: shh ? 'o' : f < VT ? 'wavy' : 'smirk', brow: -.2, hands: shh ? [V(-.3, .9, .3), V(.05, 1.6, .42)] : [V(-.3, 1.0, .45), V(.12, 1.02, .55)] }, T0.x, 0, T0.z - .62, 0);
    pen.position.set(T0.x + (.27 + .6 * w - .5) * .36, 1.06, T0.z + .05 - (.5 - .73) * .5); pen.rotation.set(-.6, 0, .5); pen.visible = !shh;
    if (f < VT) look(cam, T0.x + .4, 1.8, T0.z + 2.6, T0.x, 1.45, T0.z - .4); else if (!shh) look(cam, T0.x, 2.0, T0.z + .75, T0.x, 1.0, T0.z + .05); else look(cam, T0.x + .2, 1.75, T0.z + 1.9, T0.x, 1.55, T0.z - .6);
    this.fade = ss(fd - .5, fd - .05, f); } }; }, { noCut: true });
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
// ---- camera energy layer, applied on top of every shot ----
const KEY = /doug|millbrook|nobody|joke|won|everyone|plan|speech|potholes|snacks|pizza|crime|happiness|again|opponent/i;
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
  whipBlur(tc); drawCaption(tc);
}
window.renderTime = tc => { renderAt(tc); return out.toDataURL('image/jpeg', .92); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(TOTAL * FPS);
await document.fonts.load('900 96px Nunito');
window.captionChunks = words.slice(0, 3); window.ready = true;
