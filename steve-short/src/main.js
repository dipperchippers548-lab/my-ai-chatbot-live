// "The Town Where Everyone Had The Same Name" - noodle-people short (toon shading + ink outlines), rendered frame by frame.
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
function place(scene, opts, x, y, z, ry = 0) { const g = noodle(opts); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); live.push(g); return g; }
function waddle(t, sp = 7.5) { const p = t * sp, sw = Math.sin(p); return { bend: sw * .12, tilt: -sw * .08, feet: [[sw * .14, Math.max(0, Math.cos(p)) * .1], [-sw * .14, Math.max(0, -Math.cos(p)) * .1]], arms: [[-.45, -.12 + sw * .12, -sw * .35], [.45, -.12 - sw * .12, sw * .35]], bob: Math.abs(Math.cos(p)) * .05 }; }
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
function staticNoodle(scene, o, x, z, ry = 0, s = 1) { const g = noodle(o); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); scene.add(g); return g; }
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
// ===================== STEVE: SHOTS =====================
// helpers for this episode
const talkIf = (tc, a, b) => tc >= tm(a) - .03 && tc <= tm(b) ? talkShape(tc) : null;
function walkTo(scene, o, x0, z0, x1, z1, k, t, ry, sp = 7) { const wd = waddle(t, sp), x = lerp(x0, x1, k), z = lerp(z0, z1, k), moving = k > 0 && k < 1; return place(scene, { ...o, ...(moving ? wd : {}), arms: moving ? wd.arms : o.arms }, x, moving ? wd.bob : 0, z, ry); }
const MX = HX.gary;   // Mark's new house (purple roof)
// 1 "When Mark moved to a tiny new town," - the moving truck pulls up; Mark hops out with a box
shot(0, 2.15, () => { const S = world('day'), cam = newCam(42), tr = makeTruck(); S.scene.add(tr); const bx = cardBox(.45); S.scene.add(bx);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, 0); const k = ss(0, 1.0, f); tr.position.set(lerp(MX - 14, MX - 1.2, k), Math.abs(Math.sin(t * 20)) * .02 * (1 - k), 2.3);
    if (f > 1.1) { const a = ss(1.1, fd, f); place(S.scene, { ...MARK, mouth: 'grin', eyes: 'happy', hands: [V(-.3, 1.0, .35), V(.3, 1.0, .35)] }, MX + .4, 0, lerp(1.4, .3, a), Math.PI); bx.visible = true; bx.position.set(MX + .4, 1.1, lerp(1.4, .3, a) - .35); } else bx.visible = false;
    look(cam, MX + 1.5 - f * .4, 2.4, 9 - f * .5, MX - .5, 1.0, 1.2); drift(cam, t); } }; });
// 1b "his neighbor came over to say hi." - the neighbor waddles over, waving
shot(2.15, 4.2, () => { const S = world('day'), cam = newCam(40), bx = cardBox(.45); S.scene.add(bx);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); place(S.scene, { ...MARK, mouth: 'smile', hands: [V(-.3, 1.0, .35), V(.3, 1.0, .35)] }, MX, 0, -1.2, -.5); bx.position.set(MX - .17, 1.1, -.9); bx.rotation.y = -.5;
    const k = ss(0, fd * .8, f), wave = Math.sin(t * 12) * .15; walkTo(S.scene, { ...NEIGH, tag: null, mouth: 'grin', arms: [[-.45, -.15, .05], [.45, .7 + wave, .1]] }, MX - 4, -1.0, MX - 1.2, -1.0, k, t, Math.PI / 2 - .35);
    look(cam, MX - 1.5, 1.7, 3.6, MX - 1.2, 1.2, -1.1); drift(cam, t); } }; }, { xf: true });
// 2 "Hi, I'm Steve." - close: he says it; the name tag pops on his chest
shot(4.2, 5.7, () => { const S = world('day'), cam = newCam(36);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); const tp = pop(f - at(4.2, 4.85)); const m = talkIf(t, 4.34, 5.4);
    const g = place(S.scene, { ...NEIGH, tagPop: tp, mouth: m || 'grin', eyes: 'open', arms: [[-.45, -.1, .05], [.3, .55, .5]] }, MX - 1.2, 0, -1.0, .5); g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, -.3, 0));
    look(cam, hp.x + 1.4, hp.y + .05, hp.z + 1.9, hp.x, hp.y - .5, hp.z); drift(cam, t); } }; });
// 3 "Then the mailman showed up." - the mailman waddles in with letters
shot(5.7, 7.3, () => { const S = world('day'), cam = newCam(40), lt = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.22, .14), flat(0xf6f2e8)); S.scene.add(m); return m; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); place(S.scene, { ...MARK, mouth: 'smile' }, MX, 0, -1.2, -.9); place(S.scene, { ...NEIGH, mouth: 'smile' }, MX - 1.2, 0, -1.0, .6);
    const k = ss(0, fd, f), g = walkTo(S.scene, { ...MAIL, mouth: 'grin', arms: [[-.45, -.15, .05], [.35, .3, .45]] }, MX + 5, .2, MX + 1.3, .2, k, t, -Math.PI / 2 - .4); g.updateMatrixWorld(true); const h = g.localToWorld(V(.3, 1.08, .55)); lt.forEach((m, i) => { m.position.copy(h).add(V(0, i * .03, i * .01)); m.rotation.set(-.3, -1.2, i * .2); });
    look(cam, MX + 1.4, 1.7, 5.0, MX + 1.2, 1.1, -.4); drift(cam, t); } }; }, { xf: true });
// 4 "His name was also Steve." - snap zoom on the mailman's tag; Mark baffled
shot(7.3, 9.1, () => { const S = world('day'), cam = newCam(36), Z = at(7.3, 8.44);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); place(S.scene, { ...MARK, eyes: f > Z ? 'wide' : 'open', mouth: f > Z ? 'o' : 'smile', browUp: f > Z ? .06 : 0 }, MX, 0, -1.2, .4);
    const g = place(S.scene, { ...MAIL, mouth: 'grin' }, MX + 1.3, 0, .2, -1.0); g.updateMatrixWorld(true); const tg = g.localToWorld(V(0, .75, .3)); const z = clamp(spring((f - Z) * 1.6), 0, 1.05);
    if (f < Z) look(cam, MX + .5, 1.6, 3.6, MX + .6, 1.2, -.4); else look(cam, tg.x - Math.sin(1.0) * lerp(3, 1.0, z), tg.y + .05, tg.z + Math.cos(1.0) * lerp(3, 1.0, z), tg.x, tg.y, tg.z); drift(cam, t, .002); } }; });
// 5 "The barber? Steve." - barbershop: spinning pole, snip-snip, snap on "Steve"
shot(9.1, 10.7, () => { const R = room(0xe8f6ff), cam = newCam(40), Z = at(9.1, 10.11), pole = new THREE.Group(); R.scene.add(pole); pole.position.set(1.7, 0, -2.6);
  const poleT = ctex(32, 64, g => { for (let i = -64; i < 128; i += 16) { g.fillStyle = '#e8323a'; g.beginPath(); g.moveTo(0, i); g.lineTo(32, i + 16); g.lineTo(32, i + 22); g.lineTo(0, i + 6); g.fill(); g.fillStyle = '#3a6ad8'; g.beginPath(); g.moveTo(0, i + 8); g.lineTo(32, i + 24); g.lineTo(32, i + 28); g.lineTo(0, i + 12); g.fill(); } }); poleT.wrapS = poleT.wrapT = THREE.RepeatWrapping; poleT.repeat.set(1, 2);
  pole.add(at3(inked(new THREE.CylinderGeometry(.14, .14, 1.0, 16), 0xffffff, .012, poleT), 0, 1.6, 0)); pole.add(at3(inked(new THREE.SphereGeometry(.16, 12, 8), 0xe8e8e8, .01), 0, 2.15, 0));
  R.scene.add(at3(box(1.6, 1.4, .05, 0xbfe8ff, .02), -.3, 1.9, -2.85)); const ch = new THREE.Group(); ch.position.set(-.3, 0, -1.4); R.scene.add(ch); ch.add(at3(box(.8, .15, .8, 0xe8323a), 0, .6, 0)); ch.add(at3(box(.8, .9, .15, 0xe8323a), 0, 1.1, -.4)); ch.add(at3(inked(new THREE.CylinderGeometry(.08, .2, .55, 12), 0xc8ccd8, .01), 0, .28, 0));
  const sc = new THREE.Group(); R.scene.add(sc); for (const s of [-1, 1]) { const p = new THREE.Group(); p.add(at3(box(.04, .015, .3, 0xc8ccd8, .006), 0, 0, .15)); p.userData.s = s; sc.add(p); }
  return { scene: R.scene, cam, update(f, fd, t) { poleT.offset.y = -t * .8; const g = place(R.scene, { ...BARBER, mouth: f > Z ? 'grin' : 'smile', eyes: f > Z ? 'happy' : 'open', hands: [V(-.4, 1.1, .3), V(.35, 1.35, .45)] }, .8, 0, -1.2, -.6); g.updateMatrixWorld(true); sc.position.copy(g.localToWorld(V(.35, 1.4, .5))); sc.children.forEach(p => p.rotation.y = p.userData.s * Math.abs(Math.sin(t * 14)) * .4);
    const z = clamp(spring((f - Z) * 1.6), 0, 1.05), hp = g.localToWorld(V(0, 1.35, 0)); look(cam, lerp(1.0, hp.x - .9, z), lerp(1.8, hp.y + .1, z), lerp(3.6, hp.z + 1.8, z), lerp(.4, hp.x, z), lerp(1.3, hp.y - .05, z), lerp(-1.5, hp.z, z)); drift(cam, t); } }; });
// 6 "The mayor? Steve." - podium, flags, top hat; snap on "Steve"
shot(10.7, 12.6, () => { const R = room(0xdce8ff), cam = newCam(40), Z = at(10.7, 11.75); const pd = new THREE.Group(); pd.position.set(0, 0, -1.4); R.scene.add(pd); pd.add(at3(box(1.1, 1.0, .6, 0x8a5a3a), 0, .5, 0)); pd.add(at3(inked(new THREE.CircleGeometry(.22, 5), 0xffd23a, .008), 0, .62, .31));
  for (const x of [-1.8, 1.8]) { R.scene.add(at3(inked(new THREE.CylinderGeometry(.03, .03, 2.6, 8), 0xc8a050, .008), x, 1.3, -2.5)); const fl = at3(box(.7, .45, .02, 0x3a6ad8, .01), x + .36, 2.3, -2.5); R.scene.add(fl); }
  const conf = [...Array(30)].map((_, i) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(.06, .1), new THREE.MeshBasicMaterial({ color: PAL[i % 10], side: THREE.DoubleSide })); c.userData = i; R.scene.add(c); return c; });
  return { scene: R.scene, cam, update(f, fd, t) { const g = place(R.scene, { ...MAYOR, mouth: f > Z ? 'grin' : 'smile', arms: f > Z ? [[-.45, .7, .1], [.45, .7, .1]] : [[-.4, -.05, .3], [.4, -.05, .3]] }, 0, .02, -1.9, 0);
    conf.forEach(c => { const i = c.userData, q = ((t * .5 + i / 30) % 1); c.visible = f > Z; c.position.set(Math.sin(i * 2.3) * 2.2, 3.6 - q * 3.6, -1.2 + Math.cos(i * 1.7) * 1.0); c.rotation.set(t * 4 + i, t * 3, i); });
    const z = clamp(spring((f - Z) * 1.6), 0, 1.05); look(cam, 0, lerp(1.6, 1.85, z), lerp(4.2, 2.2, z), 0, lerp(1.35, 1.55, z), -1.9); drift(cam, t); } }; });
// 7 "Even the mayor's dog, was named Steve." - floor level: a tiny noodle dog, tail wagging, tag on the collar
shot(12.6, 15.5, () => { const S = world('day'), cam = newCam(50), dog = makeDog(); S.scene.add(dog); dog.position.set(MX - 1, 0, -.5); dog.rotation.y = -1.2; const Z = at(12.6, 14.77);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, 0); dog.userData.tail.rotation.x = Math.sin(t * 22) * .6; dog.userData.hd.rotation.z = Math.sin(t * 3) * .1; dog.position.y = Math.abs(Math.sin(t * 6)) * .02;
    const z = clamp(spring((f - Z) * 1.6), 0, 1.05), tg = dog.localToWorld(V(.36, .32, 0)); look(cam, lerp(MX + .4, tg.x + .5, z), lerp(.35, .38, z), lerp(1.3, tg.z + .55, z), lerp(MX - 1, tg.x, z), lerp(.35, tg.y, z), lerp(-.5, tg.z, z)); drift(cam, t); } }; }, { xf: true });
// 8 "Every single person in the town was named Steve." - crane up over a crowd, every tag says STEVE
shot(15.5, 18.7, () => { const S = world('day'), cam = newCam(45), crowd = []; for (let i = 0; i < 16; i++) { const x = -6 + (i % 8) * 1.6 + (i > 7 ? .8 : 0), z = i > 7 ? .9 : -.6; crowd.push(staticNoodle(S.scene, crowdOpt(i, { arms: [[-.45, .65, .1], [.45, .65, .1]] }), x, z, 0)); }
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, 0); crowd.forEach((g, i) => { g.position.y = Math.abs(Math.sin(t * 6 + i)) * .12; g.rotation.y = Math.sin(t * 2 + i) * .15; });
    const k = ss(0, fd, f); look(cam, -.4, lerp(1.6, 7.5, k), lerp(4.2, 8.5, k), -.4, lerp(1.4, .6, k), 0); } }; });
// 9 "Nobody knew how it started." - Mark in the middle of the Steves, shrugging; ? marks
shot(18.7, 20.6, () => { const S = world('day'), cam = newCam(40), crowd = []; for (let i = 0; i < 7; i++) { const a = Math.PI / 2 + .95 + i * (Math.PI * 2 - 1.9) / 6; crowd.push(staticNoodle(S.scene, crowdOpt(i + 3, { mouth: 'smile' }), MX - 1 + Math.cos(a) * 2.2, -1 + Math.sin(a) * 1.6, -a + Math.PI / 2 * 0)); }
  const qs = [0, 1].map(() => { const s = sprite('?', '#ffe21f', .7); S.scene.add(s); return s; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); crowd.forEach((g, i) => g.lookAt(MX - 1, 0, -1)); const sh = Math.sin(clamp(f * 2.5) * Math.PI);
    place(S.scene, { ...MARK, mouth: 'wavy', brow: -.25, browUp: .03, arms: [[-.55, .1 + sh * .25, .1], [.55, .1 + sh * .25, .1]] }, MX - 1, 0, -1, 0); qs.forEach((s, i) => { s.position.set(MX - 1.3 + i * .6, 2.6 + Math.sin(t * 4 + i) * .05, -1); s.scale.setScalar(.7 * pop(f - .2 - i * .15)); });
    look(cam, MX - 1, 2.0, 3.6 - f * .3, MX - 1, 1.3, -1); drift(cam, t); } }; }, { xf: true });
// 10 "Some people said it was a tradition." - dream: old-timey founders with a STEVE banner (sepia)
shot(20.6, 22.5, () => { const S = world('day'), cam = newCam(42), bn = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .7), new THREE.MeshBasicMaterial({ map: textTex('STEVE DAY', '#ffe8b0', 70), color: 0xffffff, transparent: true })); bn.position.set(MX - 1, 2.6, -1.6); S.scene.add(bn); S.scene.add(at3(box(3.4, .78, .02, 0x8a3a2a, .012), MX - 1, 2.6, -1.62));
  const f3 = [0, 1, 2].map(i => staticNoodle(S.scene, crowdOpt(i, { hat: 'top', mustache: true, mouth: 'smile', arms: [[-.45, .7, .1], [.45, .7, .1]] }), MX - 2.2 + i * 1.2, -1.2, 0));
  return { scene: S.scene, cam, dream: '#d8a060', update(f, fd, t) { setSun(S, MX, -1); f3.forEach((g, i) => g.position.y = Math.abs(Math.sin(t * 5 + i)) * .08); look(cam, MX - 1, 1.8, 3.6 - f * .3, MX - 1, 1.6, -1.4); drift(cam, t); } }; }, { xf: true });
// 11 "Others said the first guy who moved there just really liked the name." - a pioneer hugging a STEVE sign, hearts
shot(22.5, 26.0, () => { const S = world('day'), cam = newCam(40), sg = new THREE.Group(); S.scene.add(sg); sg.position.set(MX - .4, 0, -1.4); sg.add(at3(box(.12, 1.4, .12, 0x8a5a3a, .01), 0, .7, 0)); sg.add(at3(box(1.4, .6, .08, 0xc8955a, .015), 0, 1.4, 0)); const st = sprite('STEVE', '#ffffff', 1.0, 80); st.position.set(0, 1.4, .06); sg.add(st);
  const hs = [0, 1, 2, 3].map(() => { const s = sprite('♥', '#ff4a7a', .5, 140); S.scene.add(s); return s; });
  return { scene: S.scene, cam, dream: '#ffd0a0', update(f, fd, t) { setSun(S, MX, -1); place(S.scene, { color: 0xc8a06a, hat: 'pioneer', mustache: true, eyes: 'happy', mouth: 'grin', blush: true, lean: .15, hands: [V(-.25, 1.25, .45), V(.4, 1.3, .4)] }, MX - 1.1, 0, -1.3, .9);
    hs.forEach((s, i) => { const q = (t * .6 + i / 4) % 1; s.position.set(MX - .9 + Math.sin(i * 2) * .5, 2.0 + q * 1.2, -1.2); s.scale.setScalar(.45 * (1 - q * .5)); s.material.opacity = 1 - q; });
    look(cam, MX - .7, 1.7, 3.2 - f * .2, MX - .8, 1.4, -1.4); drift(cam, t); } }; }, { xf: true });
// 12 "Mark thought it was a prank." - smirk, arms crossed, eyeing the camera
shot(26.0, 27.8, () => { const S = world('day'), cam = newCam(38);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); const g = place(S.scene, { ...MARK, mouth: 'smirk', eyes: 'half', brow: -.25, hands: [V(.15, .92, .32), V(-.15, .9, .34)], turn: Math.sin(f * 3) * .25 }, MX, 0, -1, 0); g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, -.2, 0));
    look(cam, hp.x + .2, hp.y + .1, hp.z + 2.4 - f * .3, hp.x, hp.y - .2, hp.z); drift(cam, t); } }; }, { xf: true });
// 13 "Until he went to the grocery store, yelled Steve!" - aisle; Mark cups his hands and yells
shot(27.8, 30.95, () => { const G = store(), cam = newCam(42), backs = []; for (let i = 0; i < 12; i++) backs.push(staticNoodle(G.scene, crowdOpt(i, { mouth: 'smile' }), -1.1 + (i % 3) * 1.1 + (i > 5 ? .3 : 0), -2 - Math.floor(i / 3) * 2.2, Math.PI));
  return { scene: G.scene, cam, update(f, fd, t) { const m = talkIf(t, 30.2, 30.9), yell = !!m; const g = place(G.scene, { ...MARK, mouth: yell ? 'scream' : 'smile', eyes: yell ? 'closed' : 'open', hands: yell ? [V(-.18, 1.55, .5), V(.18, 1.55, .5)] : [V(-.35, .9, .35), V(.35, .9, .35)] }, 0, 0, 1.6, Math.PI);
    if (!yell) look(cam, .6, 1.8, 4.4, 0, 1.2, -2); else { look(cam, .5, 1.7, -.3, 0, 1.6, 1.6); shake(cam, t, .02); } drift(cam, t); } }; });
// 14 "and forty people turned around." - every noodle in the store spins round to look; snap zoom
shot(30.95, 33.7, () => { const G = store(), cam = newCam(44), crowd = []; for (let i = 0; i < 40; i++) crowd.push(staticNoodle(G.scene, crowdOpt(i, { mouth: 'o', eyes: 'wide' }), -1.2 + (i % 4) * .8 + (Math.floor(i / 4) % 2) * .35, -1 - Math.floor(i / 4) * 1.3, Math.PI));
  return { scene: G.scene, cam, update(f, fd, t) { crowd.forEach((g, i) => { const k = clamp((f - .15 - (i % 7) * .04) / .18); g.rotation.y = Math.PI * (1 - k); g.position.y = k > 0 && k < 1 ? .1 : 0; });
    const z = clamp(spring((f - .2) * 1.3), 0, 1.05); look(cam, 0, lerp(1.7, 1.75, z), lerp(5.5, 2.6, z), 0, 1.3, -4); shake(cam, t, .015 * Math.exp(-f * 3)); } }; });
// 15 "Phone calls were a nightmare." - his phone: every contact is Steve; an incoming call from... Steve
shot(33.7, 35.9, () => { const S = world('day'), cam = newCam(36), ph = new THREE.Group(); S.scene.add(ph); ph.add(at3(box(.42, .78, .05, 0x2a2a30, .012), 0, 0, 0));
  const D = document.createElement('canvas'); D.width = 120; D.height = 220; const g2 = D.getContext('2d'), T = new THREE.CanvasTexture(D); T.colorSpace = THREE.SRGBColorSpace; const scr = new THREE.Mesh(new THREE.PlaneGeometry(.37, .68), new THREE.MeshBasicMaterial({ map: T })); scr.position.z = .03; ph.add(scr);
  const draw = (f) => { g2.fillStyle = '#f6f6fa'; g2.fillRect(0, 0, 120, 220); g2.fillStyle = '#16121a'; g2.font = '900 14px Nunito'; g2.fillText('Contacts', 8, 20); const names = ['Steve', 'Steve', 'Steve (barber)', 'Steve (mayor)', 'Steve (dog)', 'Steve', 'Steve??', 'Steve']; names.forEach((n, i) => { g2.fillStyle = i % 2 ? '#ffffff' : '#eef0f6'; g2.fillRect(0, 30 + i * 22, 120, 22); g2.fillStyle = '#16121a'; g2.font = '700 12px Nunito'; g2.fillText(n, 10, 45 + i * 22); });
    if (f > .9) { g2.fillStyle = 'rgba(40,180,90,.95)'; g2.fillRect(6, 150, 108, 62); g2.fillStyle = '#fff'; g2.font = '900 12px Nunito'; g2.fillText('Incoming call', 14, 170); g2.font = '900 20px Nunito'; g2.fillText('STEVE', 14, 196); } T.needsUpdate = true; };
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); draw(f); const g = place(S.scene, { ...MARK, mouth: f > .9 ? 'frown' : 'wavy', eyes: f > .9 ? 'wide' : 'half', brow: .25, hands: [V(-.05, 1.25, .5), V(.15, 1.2, .5)] }, MX, 0, -1, 0); g.updateMatrixWorld(true); ph.position.copy(g.localToWorld(V(.05, 1.42, .55))); ph.rotation.set(-.15, 0, Math.sin(t * 40) * .03 * (f > .9));
    look(cam, MX + .35, 1.85, .75, MX + .05, 1.45, -.5); drift(cam, t, .002); } }; }, { xf: true });
// 16 "Birthday parties were chaos." - party hats, confetti, everyone bouncing, every tag STEVE
shot(35.9, 37.9, () => { const R = room(0xfff0f6), cam = newCam(46), crowd = []; for (let i = 0; i < 10; i++) crowd.push(staticNoodle(R.scene, crowdOpt(i, { hat: 'party', mouth: 'grin', eyes: 'happy', arms: [[-.45, .7, .1], [.45, .7, .1]] }), -2.4 + (i % 5) * 1.2, -.6 - Math.floor(i / 5) * 1.3, 0));
  const conf = [...Array(50)].map((_, i) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(.07, .11), new THREE.MeshBasicMaterial({ color: PAL[i % 10], side: THREE.DoubleSide })); c.userData = i; R.scene.add(c); return c; });
  return { scene: R.scene, cam, update(f, fd, t) { crowd.forEach((g, i) => { g.position.y = Math.abs(Math.sin(t * 9 + i * 1.3)) * .35; g.rotation.y = Math.sin(t * 5 + i) * .4; }); conf.forEach(c => { const i = c.userData, q = ((t * .6 + i / 50) % 1); c.position.set(Math.sin(i * 2.3) * 3, 4 - q * 4, -1 + Math.cos(i * 1.7) * 1.5); c.rotation.set(t * 5 + i, t * 4, i); });
    look(cam, Math.sin(t * 1.3) * .3, 1.9, 4.6, 0, 1.2, -1.2); cam.rotation.z += Math.sin(t * 7) * .02; } }; }, { xf: true });
// 17 "Every cake just said, Happy Birthday, Steve." - close on a cake... then a row of identical ones
shot(37.9, 40.95, () => { const R = room(0xfff0f6), cam = newCam(40), Z = at(37.9, 39.6), cakes = []; R.scene.add(at3(box(9, .1, 1.4, 0xffffff, .015), 0, .9, 0)); for (let i = 0; i < 7; i++) { const c = makeCake(); c.position.set(-3.6 + i * 1.2, .95, 0); R.scene.add(c); cakes.push(c); }
  return { scene: R.scene, cam, update(f, fd, t) { cakes.forEach((c, i) => c.userData.flames.forEach(fl => fl.scale.y = 1.4 + Math.sin(t * 20 + i) * .3)); const z = clamp(spring((f - Z) * 1.3), 0, 1.05);
    look(cam, lerp(.4, 0, z), lerp(2.6, 2.4, z), lerp(1.2, 4.6, z), lerp(0, 0, z), lerp(1.1, 1.1, z), 0); drift(cam, t); } }; });
// 18 "Mark tried to stay himself." - Steves stream past him; he stands firm, sweating
shot(40.95, 42.9, () => { const S = world('day'), cam = newCam(40), dr = [0, 1, 2].map(() => { const d = inked(new THREE.SphereGeometry(.04, 8, 6), 0x9ad8ff, .006, null, true); S.scene.add(d); return d; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, 0); for (let i = 0; i < 6; i++) { const x = ((t * 1.6 + i * 1.3) % 8) - 4; const w = waddle(t + i, 8); place(S.scene, { ...crowdOpt(i), ...w }, MX + x, w.bob, i % 2 ? -.2 : .9, Math.PI / 2); }
    const g = place(S.scene, { ...MARK, mouth: 'flat', eyes: 'open', brow: -.3, hands: [V(-.3, .75, .2), V(.3, .75, .2)] }, MX, 0, .35, 0); g.updateMatrixWorld(true); dr.forEach((d, i) => { const q = (t * 1.5 + i / 3) % 1; d.position.copy(g.userData.head.localToWorld(V(.3 - i * .15, .2 - q * .4, .3))); });
    look(cam, MX, 1.7, 4.2 - f * .4, MX, 1.4, .3); drift(cam, t); } }; }, { xf: true });
// 19 "He lasted six months." - a calendar shedding pages JAN -> JUN; Mark looking more and more tired
shot(42.9, 44.9, () => { const R = room(0xf6f0e0), cam = newCam(40), pages = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'].map((m, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.1), new THREE.MeshBasicMaterial({ map: ctex(90, 110, g => { g.fillStyle = '#fff'; g.fillRect(0, 0, 90, 110); g.fillStyle = '#e8323a'; g.fillRect(0, 0, 90, 28); g.fillStyle = '#fff'; g.font = '900 20px Nunito'; g.textAlign = 'center'; g.fillText(m, 45, 21); g.fillStyle = '#c8c8d0'; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) g.fillRect(6 + c * 13.5, 36 + r * 17, 10, 12); g.strokeStyle = '#16121a'; g.lineWidth = 3; g.strokeRect(0, 0, 90, 110); }), side: THREE.DoubleSide })); p.position.set(.9, 2.1, -2.85 + (6 - i) * .004); R.scene.add(p); return p; });
  return { scene: R.scene, cam, update(f, fd, t) { pages.forEach((p, i) => { const k = clamp((f - .15 - i * .28) / .3); p.visible = i < 5 ? k < 1 : true; if (i < 5) { p.rotation.x = -k * 1.5; p.position.y = 2.1 + k * .6; p.position.z = -2.85 + (6 - i) * .004 + k * .5; } });
    const tired = clamp(f / fd); place(R.scene, { ...MARK, eyes: tired > .6 ? 'half' : 'open', mouth: tired > .6 ? 'wavy' : 'flat', tilt: tired * .2, nod: tired * .2, arms: [[-.4, -.3, 0], [.4, -.3, 0]] }, -.25, 0, -1.4, .3);
    look(cam, .35, 1.7, 2.6, .3, 1.6, -2); drift(cam, t); } }; }, { xf: true });
// 20 "Then one day, a new family moved in next door." - a new moving truck, a family with boxes
shot(44.9, 48.0, () => { const S = world('day'), cam = newCam(42), tr = makeTruck(); S.scene.add(tr); const boxes = [0, 1].map(() => { const b = cardBox(.35); S.scene.add(b); return b; });
  return { scene: S.scene, cam, update(f, fd, t) { const FX = HX.orange; setSun(S, FX, 0); const k = ss(0, .9, f); tr.position.set(lerp(FX + 12, FX + .8, k), 0, 2.3); tr.rotation.y = Math.PI;
    if (f > 1.0) { const a = ss(1.0, fd, f); [[{ color: 0x5ac85a, mouth: 'grin' }, -.7], [{ color: 0xff8ab8, mouth: 'smile', curlers: false, glasses: true }, .4], [{ color: 0xffd23a, mouth: 'grin', eyes: 'happy', tuft: true }, 1.2]].forEach(([o, dx], i) => { const w = waddle(t + i, 8); const g = place(S.scene, { ...o, ...w, hands: i < 2 ? [V(-.3, 1.0, .35), V(.3, 1.0, .35)] : undefined }, FX + dx, w.bob, lerp(1.2, -.6, a), Math.PI); if (i === 2) g.scale.setScalar(.7); if (i < 2) { boxes[i].position.set(FX + dx, 1.1, lerp(1.2, -.6, a) - .35); boxes[i].visible = true; } }); } else boxes.forEach(b => b.visible = false);
    look(cam, FX + .3, 1.9, -3.9, FX + .3, 1.0, .5); drift(cam, t); } }; }, { xf: true });
// 21 "Mark walked over, smiled, and said," - Mark waddles over to them (tag hidden from camera)
shot(48.0, 50.6, () => { const S = world('day'), cam = newCam(40);
  return { scene: S.scene, cam, update(f, fd, t) { const FX = HX.orange; setSun(S, FX, 0); [[{ color: 0x5ac85a, mouth: 'smile' }, -.2], [{ color: 0xff8ab8, mouth: 'smile', glasses: true }, .7], [{ color: 0xffd23a, mouth: 'smile', tuft: true }, 1.4]].forEach(([o, dx], i) => { const g = place(S.scene, o, FX + dx, 0, -.6, -Math.PI / 2 + .3); if (i === 2) g.scale.setScalar(.7); });
    const k = ss(0, fd * .75, f), sm = f > at(48.0, 49.24); walkTo(S.scene, { ...MARK, tag: 'STEVE', mouth: sm ? 'grin' : 'smile', eyes: sm ? 'happy' : 'open' }, FX - 5, -.6, FX - 1.5, -.6, k, t, Math.PI / 2);
    look(cam, FX - 1.3, 1.8, 4.6, FX - 1.1, 1.1, -.6); drift(cam, t); } }; }, { xf: true });
// 22 "Hi. I'm Steve." - snap zoom: Mark's grin and his brand new STEVE tag; the family's faces drop
shot(50.6, 99, () => { const S = world('day'), cam = newCam(36), Z = at(50.6, 51.45);
  return { scene: S.scene, cam, update(f, fd, t) { const FX = HX.orange; setSun(S, FX, 0); const m = talkIf(t, 50.7, 52.1);
    [[{ color: 0x5ac85a }, -.2], [{ color: 0xff8ab8, glasses: true }, .7], [{ color: 0xffd23a, tuft: true }, 1.4]].forEach(([o, dx], i) => { const g = place(S.scene, { ...o, mouth: f > Z + .3 ? 'o' : 'smile', eyes: f > Z + .3 ? 'wide' : 'open' }, FX + dx, 0, -.6, -Math.PI / 2 + .3); if (i === 2) g.scale.setScalar(.7); });
    const g = place(S.scene, { ...MARK, tag: 'STEVE', tagPop: f > Z ? 1 + .25 * Math.exp(-(f - Z) * 8) : 1, mouth: m || 'grin', eyes: 'happy', blush: true, arms: [[-.45, -.1, .05], [.45, .55, .2]] }, FX - 1.5, 0, -.6, .45);
    g.updateMatrixWorld(true); const c = g.localToWorld(V(0, 1.1, 0)), z = clamp(spring((f - Z) * 1.4), 0, 1.05), dir = V(Math.sin(.2), 0, Math.cos(.2)), d = lerp(4.6, 2.4, z);
    if (f < Z + .9) look(cam, c.x + dir.x * d - .4, c.y + .25, c.z + dir.z * d, c.x, c.y + .1, c.z); else look(cam, FX - .5, 1.6, 2.6, FX + .6, 1.35, -.6); this.fade = ss(fd - .5, fd - .05, f); } }; });
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
