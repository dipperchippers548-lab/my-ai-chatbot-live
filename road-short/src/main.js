// "Green Light Road Rage" - low-poly flat-shaded short, rendered frame by frame.
import * as THREE from '/node_modules/three/build/three.module.js';
const W = 1080, H = 1920;
await document.fonts.load('900 96px Nunito');
const out = document.getElementById('out'); out.width = W; out.height = H; const og = out.getContext('2d');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.NoToneMapping;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mat = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
const mesh = (g, c) => { const m = new THREE.Mesh(g, mat(c)); m.castShadow = m.receiveShadow = true; return m; };
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
// jittered low-poly geometry so nothing looks perfectly smooth
function lowpoly(g, amt = .03, seed = 1) { const p = g.attributes.position, map = new Map(); let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280 - .5;
  for (let i = 0; i < p.count; i++) { const k = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3); if (!map.has(k)) map.set(k, [r() * amt, r() * amt, r() * amt]); const d = map.get(k); p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]); } g.computeVertexNormals(); return g; }

// ---------- FACE (drawn on a canvas, swapped per expression) ----------
const FACES = {};
function faceTex(e) { if (FACES[e]) return FACES[e]; return FACES[e] = ctex(256, 256, (g, w, h) => {
  const eye = (x, y, sx, sy, look = 0) => { g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(x, y, sx, sy, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - sx * .3 + look, y - sy * .45, sx * .32, 0, 7); g.fill(); };
  const brow = (x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#3a2216'; g.fillRect(-24, -6, 48, 12); g.restore(); };
  g.lineCap = 'round'; g.strokeStyle = '#16121a'; g.lineWidth = 9;
  const E = { calm: [17, 22, 0, .0], shock: [16, 32, 0, -.3], worried: [15, 20, 0, .35], tired: [18, 10, 0, -.15], mad: [16, 18, 0, -.45], happy: [17, 22, 0, -.1] }[e] || [17, 22, 0, 0];
  if (e === 'happy') { g.beginPath(); g.arc(88, 120, 18, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.arc(168, 120, 18, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  else { eye(88, 118, E[0], E[1]); eye(168, 118, E[0], E[1]); if (e === 'tired') { g.fillStyle = '#e8a87a'; g.fillRect(60, 96, 136, 20); } }
  const ba = E[3]; brow(88, e === 'shock' ? 70 : 82, ba); brow(168, e === 'shock' ? 70 : 82, -ba);
  g.fillStyle = '#16121a';
  if (e === 'shock') { g.beginPath(); g.ellipse(128, 188, 16, 22, 0, 0, 7); g.fill(); }
  else if (e === 'worried') { g.beginPath(); g.moveTo(104, 190); g.quadraticCurveTo(128, 176, 152, 190); g.stroke(); }
  else if (e === 'happy') { g.beginPath(); g.moveTo(98, 172); g.quadraticCurveTo(128, 210, 158, 172); g.closePath(); g.fill(); }
  else if (e === 'mad') { g.beginPath(); g.moveTo(106, 192); g.lineTo(150, 186); g.stroke(); }
  else { g.beginPath(); g.moveTo(110, 186); g.lineTo(146, 186); g.stroke(); }
  g.fillStyle = 'rgba(255,120,110,.35)'; g.beginPath(); g.arc(58, 160, 14, 0, 7); g.arc(198, 160, 14, 0, 7); g.fill(); }); }

// ---------- CHARACTER: chunky low-poly "kid" (big head, tapered hoodie, big sneakers) ----------
const DALE = { skin: 0xf0b48a, hair: 0xd8632a, top: 0xf2b630, top2: 0xd8962a, pants: 0x3f7a4a, shoe: 0xe8423a, sole: 0xf4f4f0, sock: 0xf4f4f0, kind: 'hoodie' };
const MOM = { skin: 0xc98a64, hair: 0x2a1a14, top: 0x8a5ac8, top2: 0x6a40a8, pants: 0x2a2a44, shoe: 0x2a2a34, sole: 0xe8e0d8, sock: 0x2a2a44, kind: 'cardigan', bun: true, lashes: true };
function person(o) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  // legs (short pants + skinny legs + chunky shoes)
  const legs = [-1, 1].map(s => { const L = new THREE.Group(); L.position.set(s * .13, .62, 0); body.add(L);
    L.add(at(mesh(lowpoly(new THREE.CylinderGeometry(.11, .1, .3, 6), .02, 3 + s), o.pants), 0, -.12, 0));
    const K = new THREE.Group(); K.position.y = -.26; L.add(K); L.userData.knee = K;                          // knee joint
    K.add(at(mesh(new THREE.CylinderGeometry(.055, .055, .26, 5), o.kind === 'cardigan' ? o.pants : o.skin), 0, -.12, 0));
    if (o.kind !== 'cardigan') K.add(at(mesh(new THREE.CylinderGeometry(.065, .065, .1, 6), o.sock), 0, -.21, 0));
    const sh = new THREE.Group(); sh.position.set(0, -.29, .05); K.add(sh); sh.add(at(mesh(lowpoly(new THREE.BoxGeometry(.19, .1, .32, 2, 1, 2), .03, 7 + s), o.shoe), 0, .03, 0)); sh.add(at(mesh(new THREE.BoxGeometry(.2, .04, .33), o.sole), 0, -.03, 0)); return L; });
  // torso: tapered, low-poly
  const torso = new THREE.Group(); torso.position.y = .62; body.add(torso);
  torso.add(at(mesh(lowpoly(new THREE.CylinderGeometry(.21, .27, .6, 7, 2), .035, 11), o.top), 0, .3, 0));
  if (o.kind === 'hoodie') { torso.add(at(mesh(new THREE.BoxGeometry(.26, .12, .05), o.top2), 0, .2, .245)); const hood = mesh(lowpoly(new THREE.TorusGeometry(.17, .06, 5, 9), .02, 5), o.top2); hood.rotation.x = Math.PI / 2 + .3; hood.position.set(0, .6, -.04); torso.add(hood);
    for (const s of [-1, 1]) torso.add(at(mesh(new THREE.CylinderGeometry(.01, .01, .16, 4), 0xf4f4f0), s * .05, .5, .2)); }
  else { torso.add(at(mesh(new THREE.BoxGeometry(.06, .55, .05), 0xf4ead8), 0, .3, .235)); }
  // arms (shoulder pivot, low-poly sleeve, mitten hand)
  const arms = [-1, 1].map(s => { const A = new THREE.Group(); A.position.set(s * .27, .52, 0); torso.add(A);
    A.add(at(mesh(lowpoly(new THREE.CylinderGeometry(.075, .07, .23, 6), .02, 13 + s), o.top), 0, -.1, 0));
    const E = new THREE.Group(); E.position.y = -.21; A.add(E); A.userData.elbow = E;                                // elbow joint
    E.add(at(mesh(lowpoly(new THREE.CylinderGeometry(.07, .064, .22, 6), .02, 15 + s), o.top), 0, -.1, 0));
    const hand = at(mesh(lowpoly(new THREE.IcosahedronGeometry(.075, 0), .015, 17 + s), o.skin), 0, -.24, 0); E.add(hand); A.rotation.z = s * .12; A.userData.hand = hand; return A; });
  // head: big, low-poly, slightly squashed
  const head = new THREE.Group(); head.position.y = .66; torso.add(head);
  head.add(at(mesh(new THREE.CylinderGeometry(.07, .08, .08, 6), o.skin), 0, 0, 0));
  const skull = mesh(lowpoly(new THREE.IcosahedronGeometry(.3, 1), .03, 21), o.skin); skull.scale.set(1, .93, .92); skull.position.y = .27; head.add(skull);
  for (const s of [-1, 1]) head.add(at(mesh(new THREE.IcosahedronGeometry(.06, 0), o.skin), s * .29, .27, 0));
  head.add(at(mesh(new THREE.IcosahedronGeometry(.045, 0), o.skin), 0, .24, .29));                           // nose
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.42, .42), new THREE.MeshBasicMaterial({ map: faceTex('calm'), transparent: true })); face.position.set(0, .28, .272); head.add(face);
  // hair
  if (o.kind === 'hoodie') { for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, c = mesh(lowpoly(new THREE.ConeGeometry(.09, .2, 4), .02, 30 + i), o.hair); c.position.set(Math.cos(a) * .15, .5, Math.sin(a) * .13 - .03); c.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9); head.add(c); }
    head.add(at(mesh(lowpoly(new THREE.IcosahedronGeometry(.25, 1), .03, 44), o.hair), 0, .41, -.05)); head.children.at(-1).scale.set(1.08, .55, 1.0);
    const tuft = mesh(new THREE.ConeGeometry(.06, .22, 4), o.hair); tuft.position.set(.03, .62, .02); tuft.rotation.z = -.4; head.add(tuft); }
  else { const cap = mesh(lowpoly(new THREE.IcosahedronGeometry(.31, 1), .02, 50), o.hair); cap.scale.set(1.02, .7, 1.0); cap.position.set(0, .4, -.05); head.add(cap); if (o.bun) head.add(at(mesh(lowpoly(new THREE.IcosahedronGeometry(.13, 0), .02, 51), o.hair), 0, .66, -.12));
    for (const s of [-1, 1]) head.add(at(mesh(new THREE.BoxGeometry(.1, .3, .2), o.hair), s * .27, .25, -.08)); }
  root.userData = { body, torso, arms, legs, head, face, seed: Math.random() * 10 };
  root.setFace = e => { root.userData.faceKey = e; face.material.map = faceTex(e); };
  return root;
}
FACES.blink = ctex(256, 256, g => { g.strokeStyle = '#16121a'; g.lineWidth = 9; g.lineCap = 'round'; for (const x of [88, 168]) { g.beginPath(); g.arc(x, 112, 16, .15 * Math.PI, .85 * Math.PI); g.stroke(); } g.fillStyle = '#3a2216'; g.fillRect(64, 82, 48, 12); g.fillRect(144, 82, 48, 12); g.beginPath(); g.moveTo(110, 186); g.lineTo(146, 186); g.stroke(); });
const BLINKABLE = new Set(['calm', 'happy', 'smug', 'worried', 'tired', 'mad', 'determined']);
// Natural motion layer: two-joint limbs, poses ease toward their targets (no snapping), walk cycle with knee bend, arm swing,
// bounce and twist, plus breathing, weight shift, a slow head drift and blinks. Pass snap:true for deliberately sudden moves.
function pose(p, { armL = [0, 0, .12], armR = [0, 0, -.12], lean = 0, headTilt = 0, walk = 0, elbowL, elbowR, kneeL = 0, kneeR = 0, snap = false } = {}) {
  const u = p.userData, T = window.__T ?? 0, sd = u.seed || 0, walking = walk !== 0;
  const defL = armL[0] === 0 && armL[1] === 0 && Math.abs(armL[2] - .12) < 1e-6, defR = armR[0] === 0 && armR[1] === 0 && Math.abs(armR[2] + .12) < 1e-6;
  const sw = Math.sin(walk), tgt = {
    aL: [armL[0] + (walking && defL ? sw * .55 : 0), armL[1], armL[2]], aR: [armR[0] + (walking && defR ? -sw * .55 : 0), armR[1], armR[2]],
    eL: elbowL ?? (walking ? -.35 - Math.max(0, sw) * .4 : -.22), eR: elbowR ?? (walking ? -.35 - Math.max(0, -sw) * .4 : -.22),
    lL: walking ? sw * .55 : 0, lR: walking ? -sw * .55 : 0, kL: kneeL + (walking ? Math.max(0, -Math.cos(walk)) * .7 : 0), kR: kneeR + (walking ? Math.max(0, Math.cos(walk)) * .7 : 0),
    lean, tilt: headTilt };
  const dt = T - (u.lastT ?? -9); u.lastT = T; const k = snap || !(dt > 0 && dt < .3) || !u.cur ? 1 : 1 - Math.exp(-dt * 13);
  if (!u.cur || k === 1) u.cur = JSON.parse(JSON.stringify(tgt)); else { const c = u.cur; for (const key of Object.keys(tgt)) { if (Array.isArray(tgt[key])) tgt[key].forEach((v, i) => c[key][i] += (v - c[key][i]) * k); else c[key] += (tgt[key] - c[key]) * k; } }
  const c = u.cur; u.arms[0].rotation.set(...c.aL); u.arms[1].rotation.set(...c.aR); u.arms[0].userData.elbow.rotation.x = c.eL; u.arms[1].userData.elbow.rotation.x = c.eR;
  u.legs[0].rotation.x = c.lL; u.legs[1].rotation.x = c.lR; u.legs[0].userData.knee.rotation.x = c.kL; u.legs[1].userData.knee.rotation.x = c.kR;
  u.torso.rotation.x = c.lean; u.torso.rotation.y = walking ? Math.sin(walk) * .12 : Math.sin(T * .6 + sd) * .04; u.head.rotation.z = c.tilt + Math.sin(T * .9 + sd) * .03;
  u.head.rotation.y = Math.sin(T * .5 + sd * 2) * .07; u.head.rotation.x = Math.sin(T * 1.3 + sd) * .025;
  u.torso.scale.set(1, 1 + Math.sin(T * 2.4 + sd) * .012, 1);                                                                        // breathing
  u.body.position.y = walking ? Math.abs(Math.cos(walk)) * .045 : 0; u.body.rotation.z = walking ? Math.sin(walk) * .03 : Math.sin(T * .8 + sd) * .015;   // bounce / weight shift
  if (BLINKABLE.has(u.faceKey) && ((T * .29 + sd) % 1) < .035) u.face.material.map = faceTex('blink');
}


// ---------- SET: living room ----------
function livingRoom() { const sc = new THREE.Scene(); sc.background = new THREE.Color(0xbfe4d8);
  sc.add(new THREE.HemisphereLight(0xffffff, 0xd8c8b0, 1.6)); const k = new THREE.DirectionalLight(0xfff0dc, 2.0); k.position.set(2.5, 5, 4); k.castShadow = true; k.shadow.mapSize.set(2048, 2048); Object.assign(k.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); k.shadow.bias = -.0005; sc.add(k);
  const fl = ctex(512, 512, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#c8875a' : '#bd7c50'; g.fillRect(0, i * 64, w, 64); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, i * 64, w, 3); g.fillRect((i * 173) % w, i * 64, 3, 64); } }); fl.wrapS = fl.wrapT = THREE.RepeatWrapping; fl.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshLambertMaterial({ map: fl })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
  const wall = mesh(new THREE.BoxGeometry(12, 4, .2), 0x9fd4c4); wall.position.set(0, 2, -2.5); sc.add(wall); sc.add(at(mesh(new THREE.BoxGeometry(12, .2, .25), 0xf4f0e8), 0, .1, -2.38));
  const side = mesh(new THREE.BoxGeometry(.2, 4, 8), 0xb2dccf); side.position.set(-3.2, 2, 1.2); sc.add(side);
  // window
  sc.add(at(mesh(new THREE.BoxGeometry(1.3, 1.1, .1), 0xf4f0e8), 1.6, 2.0, -2.38)); const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .9), new THREE.MeshBasicMaterial({ color: 0x8fd0ff })); sky.position.set(1.6, 2.0, -2.32); sc.add(sky); sc.add(at(mesh(new THREE.BoxGeometry(.05, .9, .03), 0xf4f0e8), 1.6, 2.0, -2.3));
  // couch
  const couch = new THREE.Group(); couch.position.set(1.5, 0, -1.8); sc.add(couch); couch.add(at(mesh(lowpoly(new THREE.BoxGeometry(1.9, .45, .8, 3, 1, 2), .03, 60), 0xe86a5a), 0, .3, 0)); couch.add(at(mesh(lowpoly(new THREE.BoxGeometry(1.9, .55, .25, 3, 1, 1), .03, 61), 0xd85a4a), 0, .75, -.3)); for (const s of [-1, 1]) couch.add(at(mesh(new THREE.BoxGeometry(.25, .7, .8), 0xd85a4a), s * .95, .4, 0));
  // pedestal + vase
  const ped = new THREE.Group(); ped.position.set(-1.2, 0, -1.5); sc.add(ped); ped.add(at(mesh(new THREE.CylinderGeometry(.22, .26, .9, 6), 0xf4f0e8), 0, .45, 0));
  const vase = mesh(new THREE.LatheGeometry([V(0, 0, 0), V(.12, .02, 0), V(.2, .18, 0), V(.17, .38, 0), V(.08, .5, 0), V(.1, .6, 0)].map(v => new THREE.Vector2(v.x, v.y)), 7), 0x3a6ad8); vase.position.y = .9; ped.add(vase);
  const band = mesh(new THREE.CylinderGeometry(.205, .205, .05, 7), 0xf2c230); band.position.y = 1.1; ped.add(band);
  // picture frames + clock
  for (const [x, c] of [[-2.0, 0xf2c230], [-.5, 0xe86a5a]]) { sc.add(at(mesh(new THREE.BoxGeometry(.6, .45, .05), 0x5a3a24), x, 2.3, -2.38)); const p = new THREE.Mesh(new THREE.PlaneGeometry(.5, .35), new THREE.MeshBasicMaterial({ color: c })); p.position.set(x, 2.3, -2.35); sc.add(p); }
  sc.add(at(mesh(new THREE.BoxGeometry(2.2, .06, 1.3), 0x6a9ad8), .2, .01, -.2));
  window.__sc = sc; return { scene: sc, vase, ped };
}

// ===================== TIMING =====================
const FPS = 30;
const CI = await (await fetch('/build/cuts.json')).json(), WORDS = await (await fetch('/build/words.json')).json(), MOUTH = await (await fetch('/build/mouth.json')).json();
const F = t => (t - CI.cuts.reduce((s, [a, b]) => s + (t > a ? Math.min(t, b) - a : 0), 0)) / CI.speed + (CI.offset || 0);     // voice clock -> final clock
const DUR = CI.duration, NF = Math.ceil(DUR * FPS);
const lvl = t => { const i = Math.round(t * MOUTH.rate); return i >= 0 && i < MOUTH.level.length ? MOUTH.level[i] : 0; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const pop = x => x <= 0 ? 0 : Math.min(1, x / .07) * (1 + .3 * Math.exp(-x * 9) * Math.cos(x * 24));
const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const noise1 = t => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };

// captions: 1-3 words, break on punctuation / gaps
const CAP = []; { let cur = null;
  WORDS.forEach((w, i) => { const s = F(w.s), e = F(w.e), txt = w.w.replace(/\.\.\.|[.,]/g, '').toUpperCase();
    if (!cur || cur.n >= 3 || cur.brk || s - cur.e > .25) { cur = { s, e, text: txt, n: 1 }; CAP.push(cur); } else { cur.text += ' ' + txt; cur.e = e; cur.n++; }
    cur.brk = /[.,!?]$|\.\.\.$/.test(w.w); });
  CAP.forEach((c, i) => c.end = i + 1 < CAP.length ? CAP[i + 1].s : DUR); }
window.captionChunks = CAP;

// ===================== EXTRA FACES / PROPS =====================
const _ft = faceTex;
FACES.madopen = ctex(256, 256, (g) => { g.drawImage(_ft('mad').image, 0, 0); g.fillStyle = '#f0b48a'; g.fillRect(96, 176, 64, 24); g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(128, 190, 24, 16, 0, 0, 7); g.fill(); g.fillStyle = '#e86a6a'; g.beginPath(); g.ellipse(128, 198, 13, 6, 0, 0, 7); g.fill(); });
const MUD = { ...DALE, skin: 0xa0704a, hair: 0x6a4428, top: 0x8a6a3a, top2: 0x6a4a28, pants: 0x4a3a24, shoe: 0x7a4a2a, sock: 0x8a6a4a };
const vaseGeo = new THREE.LatheGeometry([[0, 0], [.12, .02], [.2, .18], [.17, .38], [.08, .5], [.1, .6]].map(([x, y]) => new THREE.Vector2(x, y)), 7);
function newVase(col = 0x3a6ad8) { const g = new THREE.Group(); g.add(mesh(vaseGeo, col)); const band = mesh(new THREE.CylinderGeometry(.205, .205, .05, 7), 0xf2c230); band.position.y = .2; g.add(band); return g; }
function shards(sc, n, cx, cz, col = 0x3a6ad8, seed = 1) { const a = []; for (let i = 0; i < n; i++) { const s = mesh(lowpoly(new THREE.TetrahedronGeometry(.06 + hash(i + seed) * .07, 0), .02, i + seed), i % 4 ? col : 0xf2c230); s.userData.v = V((hash(i * 3 + seed) - .5) * 3, 1 + hash(i * 5 + seed) * 2, (hash(i * 7 + seed) - .5) * 2.2); s.userData.home = V(cx + (hash(i * 11 + seed) - .5) * 1.4, .04, cz + (hash(i * 13 + seed) - .5) * 1.0); sc.add(s); a.push(s); } return a; }
function burst(a, x0, y0, z0, k) { a.forEach((s, i) => { const h = s.userData.home, kk = ss(0, 1, k); s.position.set(lerp(x0, h.x, kk), Math.max(.04, y0 + s.userData.v.y * k * .6 - 3 * k * k) * (1 - kk) + .04 * kk, lerp(z0, h.z, kk)); s.rotation.set(i + k * 9, i * 2 + k * 6, k * 4); }); }
function tv(sc, x, z, ry = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; sc.add(g); g.add(at(mesh(new THREE.BoxGeometry(1.3, .6, .5), 0x6a4a34), 0, .3, 0)); g.add(at(mesh(new THREE.BoxGeometry(1.2, .72, .08), 0x1c1c24), 0, 1.0, 0));
  const ok = ctex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4ab8ff'); gr.addColorStop(1, '#a8f0a0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(190, 40, 22, 0, 7); c.fill(); });
  const bad = ctex(256, 160, (c, w, h) => { c.fillStyle = '#111'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ddd'; c.lineWidth = 3; for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(100, 70); let x = 100, y = 70; for (let k = 0; k < 4; k++) { x += Math.cos(i * .52) * 30 + (hash(i * 9 + k) - .5) * 30; y += Math.sin(i * .52) * 24 + (hash(i * 5 + k) - .5) * 20; c.lineTo(x, y); } c.stroke(); } });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .62), new THREE.MeshBasicMaterial({ map: ok })); scr.position.set(0, 1.0, .045); g.add(scr); g.userData.crack = on => { scr.material.map = on ? bad : ok; }; return g; }
function phone() { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(.16, .3, .025), 0x1c1c24)); const s = new THREE.Mesh(new THREE.PlaneGeometry(.14, .27), new THREE.MeshBasicMaterial({ color: 0x8fd0ff })); s.position.z = .014; g.add(s); return g; }
function tube(col) { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.04, .05, .2, 6), col)); g.add(at(mesh(new THREE.ConeGeometry(.03, .08, 6), 0xf4f4f0), 0, .14, 0)); return g; }
function shovel() { const g = new THREE.Group(); g.add(at(mesh(new THREE.CylinderGeometry(.025, .025, 1.1, 5), 0x8a5a34), 0, .55, 0)); g.add(at(mesh(new THREE.BoxGeometry(.24, .3, .03), 0x9aa0ac), 0, -.1, 0)); g.add(at(mesh(new THREE.BoxGeometry(.2, .05, .05), 0x2a2a34), 0, 1.12, 0)); return g; }
function carMesh(col = 0xe8423a) { const g = new THREE.Group(); g.add(at(mesh(lowpoly(new THREE.BoxGeometry(1.8, .5, 3.4, 2, 1, 3), .04, 90), col), 0, .55, 0)); g.add(at(mesh(lowpoly(new THREE.BoxGeometry(1.6, .5, 1.8, 2, 1, 2), .04, 91), col), 0, 1.05, -.2));
  for (const z of [.71, -1.11]) { const wdw = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .38), new THREE.MeshLambertMaterial({ color: 0x9ad8ff })); wdw.position.set(0, 1.07, z); if (z < 0) wdw.rotation.y = Math.PI; g.add(wdw); }
  for (const [x, z] of [[-.9, 1.1], [.9, 1.1], [-.9, -1.1], [.9, -1.1]]) { const w = mesh(new THREE.CylinderGeometry(.32, .32, .25, 8), 0x1c1c24); w.rotation.z = Math.PI / 2; w.position.set(x, .32, z); g.add(w); }
  for (const s of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .05), new THREE.MeshBasicMaterial({ color: 0xfff2b0 })), s * .6, .6, 1.71)); return g; }

// ---------- outdoor yard with a hole (depth animates) ----------
function yard() { const sc = new THREE.Scene(); sc.background = new THREE.Color(0x8fd0ff); sc.fog = new THREE.Fog(0x8fd0ff, 18, 40);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x7ac86a, 1.5)); const k = new THREE.DirectionalLight(0xfff0dc, 2.1); k.position.set(3, 7, 4); k.castShadow = true; k.shadow.mapSize.set(2048, 2048); Object.assign(k.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, far: 30 }); k.shadow.bias = -.0005; sc.add(k);
  const G = 0x6cc85a, HO = .65;   // hole half-size
  for (const [x, z, w, d] of [[0, -6 - HO, 30, 12], [0, 6 + HO, 30, 12], [-7.5 - HO, 0, 15, 2 * HO], [7.5 + HO, 0, 15, 2 * HO]]) { const b = mesh(new THREE.BoxGeometry(w, .3, d), G); b.position.set(x, -.15, z); sc.add(b); }
  const D = 9; for (const [x, z, w, d] of [[0, -HO - .05, 2 * HO + .2, .1], [0, HO + .05, 2 * HO + .2, .1], [-HO - .05, 0, .1, 2 * HO], [HO + .05, 0, .1, 2 * HO]]) { for (let L = 0; L < 6; L++) { const b = mesh(new THREE.BoxGeometry(w, D / 6, d), [0x8a5a34, 0x7a4a2a, 0x6a3e24, 0x5a3420, 0x4a2a1a, 0x3a2216][L]); b.position.set(x, -.3 - (L + .5) * D / 6, z); b.receiveShadow = true; b.castShadow = false; sc.add(b); } }
  const bottom = mesh(new THREE.BoxGeometry(2 * HO, .1, 2 * HO), 0x5a3420); sc.add(bottom); const setDepth = d => bottom.position.y = -d - .05;
  const piles = [0, 1].map(i => { const p = mesh(lowpoly(new THREE.IcosahedronGeometry(.6, 1), .08, 70 + i), 0x8a5a34); p.position.set(i ? 1.6 : -1.7, -.1, i ? -.4 : .3); sc.add(p); return p; });
  // house + fence in the background
  sc.add(at(mesh(new THREE.BoxGeometry(6, 3, 3), 0xf4e4c8), -1, 1.5, -7)); const roof = mesh(new THREE.ConeGeometry(4.6, 1.6, 4), 0xc8504a); roof.rotation.y = Math.PI / 4; roof.position.set(-1, 3.8, -7); roof.scale.z = .6; sc.add(roof);
  for (let i = 0; i < 6; i++) { const wd = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), new THREE.MeshLambertMaterial({ color: 0x9ad8ff })); wd.position.set(-3 + (i % 3) * 2, 1.4, -5.49); if (i < 3) sc.add(wd); }
  for (let i = -12; i <= 12; i++) { sc.add(at(mesh(new THREE.BoxGeometry(.18, 1.1, .08), 0xf4f0e8), i * .55, .55, -4.5)); } sc.add(at(mesh(new THREE.BoxGeometry(14, .1, .06), 0xf4f0e8), 0, .85, -4.48)); sc.add(at(mesh(new THREE.BoxGeometry(14, .1, .06), 0xf4f0e8), 0, .35, -4.48));
  for (const [x, z, s] of [[4.5, -3, 1.2], [-5, -2.6, 1], [6, 2, 1.4]]) { sc.add(at(mesh(new THREE.CylinderGeometry(.12, .16, 1.4, 5), 0x7a4a2a), x, .7, z)); sc.add(at(mesh(lowpoly(new THREE.IcosahedronGeometry(.8 * s, 0), .1, x * 10), 0x4aa84a), x, 1.9, z)); }
  window.__sc = sc; return { scene: sc, setDepth, piles, HO }; }

// ===================== HUD =====================
function caption(t) { const c = CAP.find(c => t >= c.s - .02 && t < c.end); if (!c) return; const k = pop(t - c.s + .02), y = H * .66; og.save(); og.translate(W / 2, y); og.scale(.85 + .15 * k, .85 + .15 * k);
  og.font = '900 100px Nunito'; og.textAlign = 'center'; og.lineJoin = 'round'; let txt = c.text.replace(/FUCK/g, 'F***'), size = 100; while (og.measureText(txt).width > W * .86 && size > 60) { size -= 6; og.font = `900 ${size}px Nunito`; }
  og.lineWidth = 24; og.strokeStyle = '#000'; og.strokeText(txt, 0, 0); og.fillStyle = '#ffd23a'; og.fillText(txt, 0, 0); og.restore(); }
let TIMER = null;    // [start final-time, start secs, zero final-time]
function timerHud(t) { if (!TIMER) return; const [t0, s0, t1] = TIMER; if (t < t0) return; const left = Math.max(0, Math.round(s0 * (1 - clamp((t - t0) / (t1 - t0)) ** 1.15))); const k = pop(t - t0), x = W / 2, y = 230, red = left === 0 && Math.floor(t * 6) % 2;
  og.save(); og.translate(x, y); og.scale(k, k); og.fillStyle = red ? '#ffffff' : '#e8423a'; og.beginPath(); og.roundRect(-200, -72, 400, 128, 32); og.fill(); og.fillStyle = red ? '#e8423a' : '#fff'; og.textAlign = 'center'; og.font = '900 40px Nunito'; og.fillText('MOM HOME IN', 0, -24); og.font = '900 66px Nunito'; og.fillText(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 0, 38); og.restore(); }
function notif(t, t0, t1, who, msg) { if (t < t0 || t > t1) return; const k = ss(t0, t0 + .15, t) * (1 - ss(t1 - .12, t1, t)), y = 380 - (1 - k) * 260; og.save(); og.globalAlpha = k;
  og.fillStyle = 'rgba(255,255,255,.97)'; og.beginPath(); og.roundRect(90, y, W - 180, 150, 36); og.fill(); og.fillStyle = '#e8427a'; og.beginPath(); og.arc(170, y + 75, 42, 0, 7); og.fill(); og.fillStyle = '#fff'; og.font = '900 44px Nunito'; og.textAlign = 'center'; og.fillText('♥', 170, y + 90);
  og.textAlign = 'left'; og.fillStyle = '#888'; og.font = '900 34px Nunito'; og.fillText(who, 240, y + 60); og.fillStyle = '#16121a'; og.font = '900 46px Nunito'; og.fillText(msg, 240, y + 112); og.restore(); }
function bang(t, t0, txt, col = '#ffd23a', x = W / 2, y = H * .3, rot = -.08) { const d = t - t0; if (d < 0 || d > .7) return; const k = pop(d), a = 1 - ss(.5, .7, d); og.save(); og.globalAlpha = a; og.translate(x, y); og.rotate(rot); og.scale(k * 1.0, k * 1.0); og.font = '900 150px Nunito'; og.textAlign = 'center'; og.lineJoin = 'round'; og.lineWidth = 26; og.strokeStyle = '#16121a'; og.strokeText(txt, 0, 0); og.fillStyle = col; og.fillText(txt, 0, 0); og.restore(); }
function shopCard(t, t0, t1, stage) { if (t < t0 || t > t1) return; const k = pop(t - t0), cx = W * .66, cy = H * .36; og.save(); og.translate(cx, cy); og.scale(k * .82, k * .82);
  og.fillStyle = '#1c1c24'; og.beginPath(); og.roundRect(-230, -330, 460, 660, 54); og.fill(); og.fillStyle = '#f4f6fa'; og.beginPath(); og.roundRect(-205, -300, 410, 600, 34); og.fill();
  og.fillStyle = '#3a6ad8'; og.beginPath(); og.moveTo(-50, -150); og.lineTo(50, -150); og.lineTo(70, -40); og.lineTo(30, 30); og.lineTo(-30, 30); og.lineTo(-70, -40); og.closePath(); og.fill(); og.fillStyle = '#f2c230'; og.fillRect(-66, -70, 132, 16);
  og.textAlign = 'center'; og.fillStyle = '#16121a'; og.font = '900 44px Nunito'; og.fillText('FANCY VASE', 0, 100); og.fillStyle = '#2a8a3a'; og.font = '900 40px Nunito'; og.fillText('$49.99', 0, 150);
  if (stage(t) === 0) { og.fillStyle = '#f2b630'; og.beginPath(); og.roundRect(-150, 190, 300, 80, 40); og.fill(); og.fillStyle = '#16121a'; og.font = '900 40px Nunito'; og.fillText('BUY NOW', 0, 244); }
  else { og.fillStyle = '#e8423a'; og.font = '900 34px Nunito'; og.fillText('Arriving in', 0, 205); og.fillText('3-5 business days', 0, 250); } og.restore(); }

// ===================== SHOTS (voice clock) =====================
const SH = [];
function shot(o0, o1, build) { SH.push({ a: F(o0), b: o1 >= 900 ? DUR + 1 : F(o1), o0, build }); }
const cam = new THREE.PerspectiveCamera(42, W / H, .05, 80);
function camAt(px, py, pz, tx, ty, tz, fov = 42, t = 0, shake = .012) { cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(px + noise1(t * .7) * shake, py + noise1(t * .6 + 9) * shake, pz); cam.lookAt(tx + noise1(t * .5 + 3) * shake * .5, ty, tz); }
const idle = (p, t, extra = {}) => { pose(p, extra); p.userData.body.position.y = Math.sin(t * 2.2) * .008; p.userData.head.rotation.x = Math.sin(t * 1.3) * .03; };
const L = (o, o0) => F(o) - F(o0);   // event time relative to shot start

// ===================== "You Get Hiccups During the Biggest Test of Your Life" =====================
FACES.puff = ctex(256, 256, g => { g.strokeStyle = '#16121a'; g.lineWidth = 9; g.lineCap = 'round'; for (const x of [88, 168]) { g.beginPath(); g.moveTo(x - 18, 118); g.lineTo(x + 18, 112); g.stroke(); } g.fillStyle = '#3a2216'; g.save(); g.translate(88, 86); g.rotate(.3); g.fillRect(-24, -6, 48, 12); g.restore(); g.save(); g.translate(168, 86); g.rotate(-.3); g.fillRect(-24, -6, 48, 12); g.restore(); g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(128, 188, 14, 6, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,120,110,.6)'; g.beginPath(); g.arc(58, 160, 26, 0, 7); g.arc(198, 160, 26, 0, 7); g.fill(); });
FACES.smug = ctex(256, 256, g => { const eye = (x) => { g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(x, 120, 17, 12, 0, 0, 7); g.fill(); g.fillStyle = '#f0b48a'; g.fillRect(x - 20, 100, 40, 12); }; eye(88); eye(168); g.fillStyle = '#3a2216'; g.fillRect(64, 84, 48, 12); g.save(); g.translate(168, 78); g.rotate(-.25); g.fillRect(-24, -6, 48, 12); g.restore(); g.strokeStyle = '#16121a'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(104, 186); g.quadraticCurveTo(136, 200, 160, 176); g.stroke(); });
FACES.scream = ctex(256, 256, g => { g.drawImage(faceTex('shock').image, 0, 0); g.fillStyle = '#f0b48a'; g.fillRect(100, 160, 56, 60); g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(128, 194, 28, 30, 0, 0, 7); g.fill(); g.fillStyle = '#e86a6a'; g.beginPath(); g.ellipse(128, 210, 16, 9, 0, 0, 7); g.fill(); });
const TEACH = { skin: 0xe8b890, hair: 0x9a9aa4, top: 0x3a8a5a, top2: 0x2a6a44, pants: 0x3a3a4a, shoe: 0x2a2a34, sole: 0xe8e0d8, sock: 0x3a3a4a, kind: 'cardigan', bun: true };
const PRIN = { skin: 0xc98a64, hair: 0x1a1414, top: 0x2a3a6a, top2: 0x1a2a4a, pants: 0x2a2a3a, shoe: 0x16121a, sole: 0x3a3a3a, sock: 0x2a2a3a, kind: 'cardigan' };
const BUDDY = { ...DALE, hair: 0x1a1414, top: 0x3a6ad8, top2: 0x2a4aa8, pants: 0x2a2a3a, shoe: 0xf4f4f0 };
const KID = i => ({ ...DALE, skin: [0xf0b48a, 0xc98a64, 0x8a5a3a, 0xf4c8a0, 0xd8a070][i % 5], hair: [0x2a1a14, 0xd8a84a, 0x6a3a1a, 0x1a1414, 0xa8401a][(i * 3) % 5], top: [0xe8423a, 0x3aa86a, 0x8a5ac8, 0x3a8ad8, 0xf2b630, 0xff8ab8][i % 6], top2: 0x2a2a34, pants: [0x2a3a6a, 0x3a3a44, 0x5a4a3a][i % 3], shoe: [0xf4f4f0, 0x2a2a34, 0xe8423a][i % 3], kind: i % 3 === 1 ? 'cardigan' : 'hoodie', bun: i % 6 === 1 });
function sitP(p) { p.userData.legs.forEach(l => { l.rotation.x = -1.45; if (l.userData.knee) l.userData.knee.rotation.x = 1.45; }); p.userData.body.position.y = -.2; }
function tintSkin(p, from, to, k) { if (!p.userData.skinM) { p.userData.skinM = []; p.traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() === from) { o.material = o.material.clone(); p.userData.skinM.push(o.material); } }); } const c = new THREE.Color(from).lerp(new THREE.Color(to), k); p.userData.skinM.forEach(m => m.color.copy(c)); }
function chairDesk(sc, x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); sc.add(g); g.add(at(mesh(new THREE.BoxGeometry(.9, .06, .6), 0xd8b080), 0, .8, -.42)); for (const [a, b] of [[-.4, -.68], [.4, -.68], [-.4, -.16], [.4, -.16]]) g.add(at(mesh(new THREE.BoxGeometry(.05, .8, .05), 0x6a6a74), a, .4, b));
  g.add(at(mesh(new THREE.BoxGeometry(.5, .05, .45), 0x3a6ad8), 0, .45, .05)); g.add(at(mesh(new THREE.BoxGeometry(.5, .5, .05), 0x3a6ad8), 0, .72, .28)); for (const [a, b] of [[-.22, -.15], [.22, -.15], [-.22, .25], [.22, .25]]) g.add(at(mesh(new THREE.BoxGeometry(.04, .45, .04), 0x6a6a74), a, .22, b));
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(.3, .4), new THREE.MeshLambertMaterial({ map: PAPER })); paper.rotation.x = -Math.PI / 2; paper.position.set(0, .835, -.42); g.add(paper); g.userData.paper = paper; return g; }
const PAPER = ctex(128, 170, (g, w, h) => { g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = '900 16px Nunito'; g.textAlign = 'center'; g.fillText('FINAL EXAM', w / 2, 22); g.fillStyle = '#9a9aa4'; for (let i = 0; i < 9; i++) g.fillRect(14, 36 + i * 14, w - 28 - (i % 3) * 18, 4); g.strokeStyle = '#e8423a'; g.lineWidth = 3; g.beginPath(); g.arc(w - 22, h - 22, 14, 0, 7); g.stroke(); });
const APLUS = ctex(128, 170, (g, w, h) => { g.drawImage(PAPER.image, 0, 0); g.fillStyle = '#e8423a'; g.font = '900 54px Nunito'; g.textAlign = 'center'; g.fillText('A+', w / 2, h * .72); });
function classroom() { const sc = new THREE.Scene(); sc.background = new THREE.Color(0xf4ead0); sc.add(new THREE.HemisphereLight(0xffffff, 0xd8c8a8, 1.7)); const k = new THREE.DirectionalLight(0xfff0dc, 1.8); k.position.set(3, 6, 4); k.castShadow = true; k.shadow.mapSize.set(2048, 2048); Object.assign(k.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 }); k.shadow.bias = -.0005; sc.add(k);
  const fl = ctex(256, 256, (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#e8e0cc' : '#d8ccb0'; g.fillRect(x * 32, y * 32, 32, 32); } }); fl.wrapS = fl.wrapT = THREE.RepeatWrapping; fl.repeat.set(4, 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshLambertMaterial({ map: fl })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
  sc.add(at(mesh(new THREE.BoxGeometry(14, 3.6, .2), 0xf2d8a0), 0, 1.8, -4.5)); for (const s of [-1, 1]) sc.add(at(mesh(new THREE.BoxGeometry(.2, 3.6, 14), 0xf2d8a0), s * 4.2, 1.8, 0)); sc.add(at(mesh(new THREE.BoxGeometry(14, .9, .22), 0x8a5a34), 0, .45, -4.42));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.5), new THREE.MeshLambertMaterial({ map: ctex(512, 184, (g, w, h) => { g.fillStyle = '#2a4a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f4e8'; g.font = '900 44px Nunito'; g.textAlign = 'center'; g.fillText('FINAL EXAM', w / 2, 70); g.font = '900 34px Nunito'; g.fillText('NO TALKING. NO SOUNDS.', w / 2, 130); g.strokeStyle = '#8a6a3a'; g.lineWidth = 14; g.strokeRect(0, 0, w, h); }) })); board.position.set(0, 2.0, -4.38); sc.add(board);
  const clock = new THREE.Group(); clock.position.set(2.6, 2.6, -4.37); sc.add(clock); clock.add(new THREE.Mesh(new THREE.CircleGeometry(.32, 20), new THREE.MeshLambertMaterial({ color: 0xf4f4f0 }))); const ring = new THREE.Mesh(new THREE.RingGeometry(.3, .35, 20), new THREE.MeshLambertMaterial({ color: 0x2a2a34 })); clock.add(ring); const hand = new THREE.Mesh(new THREE.PlaneGeometry(.025, .26), new THREE.MeshBasicMaterial({ color: 0xe8423a })); hand.geometry.translate(0, .12, 0); hand.position.z = .01; clock.add(hand); clock.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.035, .18), new THREE.MeshBasicMaterial({ color: 0x16121a })), 0, .08, .008)); clock.userData.hand = hand;
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.2), new THREE.MeshBasicMaterial({ color: 0x9ad8ff })); w.position.set(s * 4.09, 2.0, -1.5); w.rotation.y = -s * Math.PI / 2; sc.add(w); }
  // ceiling tiles (the hero's tile pops out)
  const tiles = []; for (let x = -4; x < 4.2; x += .7) for (let z = -4.4; z < 4; z += .7) { const t = mesh(new THREE.BoxGeometry(.66, .06, .66), 0xf4f4ec); t.position.set(x + .35, 3.6, z + .35); sc.add(t); tiles.push(t); }
  const tdesk = new THREE.Group(); tdesk.position.set(-1.6, 0, -3.4); sc.add(tdesk); tdesk.add(at(mesh(new THREE.BoxGeometry(1.6, .8, .7), 0x8a5a34), 0, .4, 0)); tdesk.add(at(mesh(new THREE.BoxGeometry(.3, .25, .2), 0xe8423a), .5, .92, 0));
  const desks = [], kids = []; let n = 0; for (const z of [-1.7, -.3, 1.1, 2.5]) for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) { if (x === 0 && z === -1.7) { desks.push(null); continue; } const d = chairDesk(sc, x, z); desks.push(d); if (!(x === 0 && z === -.3)) { const kd = person(KID(n++)); kd.position.set(x, 0, z + .05); kd.rotation.y = Math.PI; sc.add(kd); kids.push(kd); } }
  window.__sc = sc; return { scene: sc, desks, kids, tiles, clock, hero: desks[7] }; }
const HX = 0, HZ = -.3;
function kidsIdle(C, t, turn = 0) { C.kids.forEach((kd, i) => { pose(kd, { armL: [-1.1, 0, .3], armR: [-1.2 + Math.sin(t * 9 + i) * .05 * (1 - turn), 0, -.3], lean: .25 * (1 - turn) }); sitP(kd); kd.userData.head.rotation.y = turn * (kd.position.x > 0 ? -1 : 1) * Math.min(1.3, Math.atan2(Math.abs(kd.position.x), Math.max(.3, HZ - kd.position.z + 1.5)) + .4) * (kd.position.z > HZ ? 0 : 1) + turn * (kd.position.z > HZ ? Math.PI * .85 * (kd.position.x >= 0 ? -1 : 1) : 0); kd.setFace(turn > .5 ? (i % 3 ? 'shock' : 'mad') : 'calm'); }); }
function heroAt(C, extra = {}, face = 'calm') { let h = C.heroP; if (!h) { h = C.heroP = person(DALE); h.position.set(HX, 0, HZ + .05); h.rotation.y = Math.PI; C.scene.add(h); } h.setFace(face); return h; }
// HUD bits for this format: shockwave rings around a world point, speech bubbles
const _v = new THREE.Vector3(); function scr(p) { _v.copy(p).project(cam); return [(_v.x + 1) / 2 * W, (1 - _v.y) / 2 * H]; }
const RINGS = []; function ring(t, t0, pos, big = 1) { const d = t - t0; if (d < 0 || d > .6) return; const [x, y] = scr(pos); og.save(); og.strokeStyle = '#ffffff'; og.lineWidth = 10; for (let i = 0; i < 3; i++) { const k = d / .6 - i * .15; if (k <= 0) continue; og.globalAlpha = Math.max(0, 1 - k); og.beginPath(); og.ellipse(x, y, (60 + k * 420) * big, (24 + k * 170) * big, 0, 0, 7); og.stroke(); } og.restore(); }
function bubble(t, t0, t1, txt, x, y, col = '#ffffff') { if (t < t0 || t > t1) return; const k = pop(t - t0); og.save(); og.translate(x, y); og.scale(k, k); og.font = '900 84px Nunito'; const w = og.measureText(txt).width + 80; if (w > W - 60) og.scale((W - 60) / w, (W - 60) / w); og.fillStyle = col; og.strokeStyle = '#16121a'; og.lineWidth = 10; og.beginPath(); og.roundRect(-w / 2, -70, w, 120, 50); og.fill(); og.stroke(); og.beginPath(); og.moveTo(-30, 46); og.lineTo(-60, 110); og.lineTo(10, 48); og.closePath(); og.fill(); og.stroke(); og.fillStyle = '#16121a'; og.textAlign = 'center'; og.fillText(txt, 0, 18); og.restore(); }
const HICS = [9.49, 15.23, 22.13, 27.34, 31.79];
let HERO_WP = null;   // hero chest in world space, for rings

function roomLP(wall = 0xd8e8f4, floor = 0xc8a07a, bg = 0xd8e8f4) { const sc = new THREE.Scene(); window.__sc = sc; sc.background = new THREE.Color(bg); sc.add(new THREE.HemisphereLight(0xffffff, 0xd8c8b0, 1.7)); const k = new THREE.DirectionalLight(0xfff0dc, 1.8); k.position.set(2.5, 5, 4); k.castShadow = true; k.shadow.mapSize.set(2048, 2048); Object.assign(k.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); k.shadow.bias = -.0005; sc.add(k);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshLambertMaterial({ color: floor })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl); sc.add(at(mesh(new THREE.BoxGeometry(14, 4, .2), wall), 0, 2, -2.6)); sc.add(at(mesh(new THREE.BoxGeometry(.2, 4, 14), wall), -3.2, 2, 0)); sc.add(at(mesh(new THREE.BoxGeometry(14, .16, .25), 0xf4f0e8), 0, .08, -2.45)); return sc; }
// ===================== "Green Light Road Rage" =====================
CAP.forEach(c => c.text = c.text.replace(/\bSHIT\b/g, 'SH**'));
FACES.evil = ctex(256, 256, g => { g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(88, 122, 18, 9, .15, 0, 7); g.ellipse(168, 122, 18, 9, -.15, 0, 7); g.fill(); g.fillStyle = '#ff2a2a'; g.beginPath(); g.arc(90, 122, 4, 0, 7); g.arc(166, 122, 4, 0, 7); g.fill(); g.fillStyle = '#2a1a10'; g.save(); g.translate(88, 96); g.rotate(.4); g.fillRect(-28, -7, 56, 14); g.restore(); g.save(); g.translate(168, 96); g.rotate(-.4); g.fillRect(-28, -7, 56, 14); g.restore(); g.strokeStyle = '#16121a'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(100, 188); g.quadraticCurveTo(136, 196, 160, 178); g.stroke(); });
FACES.annoyed = ctex(256, 256, g => { g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(88, 122, 17, 14, 0, 0, 7); g.ellipse(168, 122, 17, 14, 0, 0, 7); g.fill(); g.fillStyle = '#f0b48a'; g.fillRect(66, 100, 46, 12); g.fillRect(146, 100, 46, 12); g.fillStyle = '#3a2216'; g.save(); g.translate(88, 92); g.rotate(.3); g.fillRect(-24, -6, 48, 12); g.restore(); g.save(); g.translate(168, 92); g.rotate(-.3); g.fillRect(-24, -6, 48, 12); g.restore(); g.strokeStyle = '#16121a'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(106, 192); g.quadraticCurveTo(128, 182, 150, 192); g.stroke(); });
const HERO = { ...DALE, skin: 0xe8b890, hair: 0x3a2216, top: 0x3a6ad8, top2: 0x2a4aa8, pants: 0x3a3a44 };
const GUY = { skin: 0xc98a64, hair: 0x16121a, top: 0x3a3a44, top2: 0x2a2a34, pants: 0x2a2a34, shoe: 0x16121a, sole: 0x3a3a3a, sock: 0x2a2a34, kind: 'cardigan' };
const MOMR = { ...GIRLish() }; function GIRLish() { return { skin: 0xe8b890, hair: 0x5a3a1a, top: 0x9a5ac8, top2: 0x7a40a8, pants: 0x3a3a5a, shoe: 0x3a2a3a, sole: 0xe8e0d8, sock: 0x3a3a5a, kind: 'cardigan', bun: true }; }
const BOSS = { skin: 0xf0c8a0, hair: 0x9a9aa4, top: 0x2a2a3a, top2: 0x16121a, pants: 0x2a2a3a, shoe: 0x16121a, sole: 0x2a2a2a, sock: 0x2a2a3a, kind: 'cardigan' };
function adult(p, s = 1.08) { p.scale.setScalar(s); p.userData.head.scale.setScalar(.85); return p; }
// ---- car: open-top-ish sedan so the drivers read; hinged driver door; steering wheel ----
function carR(col) { const g = new THREE.Group(); g.add(at(mesh(lowpoly(new THREE.BoxGeometry(1.7, .5, 3.4, 2, 1, 3), .02, 1), col), 0, .55, 0)); g.add(at(mesh(new THREE.BoxGeometry(1.72, .08, 3.42), 0x16121a), 0, .32, 0));
  for (const [x, z] of [[-.85, 1.1], [.85, 1.1], [-.85, -1.1], [.85, -1.1]]) { const w = mesh(new THREE.CylinderGeometry(.32, .32, .24, 12), 0x16121a); w.rotation.z = Math.PI / 2; w.position.set(x, .32, z); g.add(w); }
  for (const [x, z] of [[-.78, .45], [.78, .45], [-.78, -.85], [.78, -.85]]) g.add(at(mesh(new THREE.BoxGeometry(.06, .55, .06), 0x2a2a34), x, 1.05, z)); g.add(at(mesh(lowpoly(new THREE.BoxGeometry(1.62, .06, 1.4), .01, 2), col), 0, 1.33, -.2));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .5), new THREE.MeshLambertMaterial({ color: 0xaed8ff, transparent: true, opacity: .35 })); glass.position.set(0, 1.05, .46); g.add(glass);
  for (const s of [-1, 1]) { const hl = new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .03), new THREE.MeshBasicMaterial({ color: 0xfff2c0 })); hl.position.set(s * .55, .65, 1.71); g.add(hl); const tl = new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .03), new THREE.MeshBasicMaterial({ color: 0xc81a1a })); tl.position.set(s * .55, .65, -1.71); g.add(tl); }
  const door = new THREE.Group(); door.position.set(-.86, .55, .3); g.add(door); door.add(at(mesh(new THREE.BoxGeometry(.05, .5, 1.0), col), 0, 0, -.5)); g.userData.door = door;
  const wheel = new THREE.Group(); wheel.position.set(-.35, 1.0, .25); wheel.rotation.x = -.9; g.add(wheel); wheel.add(mesh(new THREE.TorusGeometry(.17, .025, 6, 16), 0x16121a)); g.userData.wheel = wheel;
  const seat = mesh(new THREE.BoxGeometry(.5, .15, .5), 0x3a3a44); seat.position.set(-.35, .82, -.25); g.add(seat); g.add(at(mesh(new THREE.BoxGeometry(.5, .6, .1), 0x3a3a44), -.35, 1.1, -.5)); return g; }
function driver(car, p) { car.add(p); p.position.set(-.35, .45, -.25); sitP(p); return p; }
// ---- the street ----
function street(o = {}) { const sc = new THREE.Scene(); window.__sc = sc; sc.background = new THREE.Color(o.sky ?? 0x8fd0ff); sc.fog = new THREE.Fog(o.sky ?? 0x8fd0ff, 25, 60); sc.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.6)); const k = new THREE.DirectionalLight(0xfff0dc, 1.8); k.position.set(4, 8, 5); k.castShadow = true; k.shadow.mapSize.set(2048, 2048); Object.assign(k.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); sc.add(k);
  sc.add(at(mesh(new THREE.BoxGeometry(60, .1, 60), 0x5a5a64), 0, -.05, 0)); for (let z = -30; z < 30; z += 3) sc.add(at(mesh(new THREE.BoxGeometry(.15, .01, 1.5), 0xf2c230), 0, .005, z)); for (const x of [-4.2, 4.2]) sc.add(at(mesh(new THREE.BoxGeometry(2.4, .2, 60), 0xc8c8cc), x, .1, 0));
  for (let i = 0; i < 7; i++) sc.add(at(mesh(new THREE.BoxGeometry(.5, .01, 3.2), 0xf4f4f0), -3 + i * 1.0, .006, 6));                // crosswalk
  for (const x of [-7, 7]) for (let z = -24; z < 24; z += 6) { const b = mesh(new THREE.BoxGeometry(4, 3 + hash(x * z + 3) * 6, 5), [0xe8c8a0, 0xc8d8e8, 0xd8a890, 0xa8c8a8][Math.abs(Math.round(z / 6 + x)) % 4]); b.position.set(x * 1.05, b.geometry.parameters.height / 2, z); sc.add(b); }
  const tl = new THREE.Group(); tl.position.set(3.4, 0, 7.6); sc.add(tl); tl.add(at(mesh(new THREE.CylinderGeometry(.07, .07, 3.4, 8), 0x2a2a34), 0, 1.7, 0)); tl.add(at(mesh(new THREE.BoxGeometry(.35, .9, .3), 0x16121a), 0, 3.55, 0)); const lamps = [0xff2a2a, 0xffd23a, 0x3aff6a].map((c, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), new THREE.MeshBasicMaterial({ color: c })); m.position.set(0, 3.85 - i * .28, -.16); tl.add(m); return m; }); tl.rotation.y = Math.PI;
  const setLight = c => lamps.forEach((m, i) => m.material.color.setHex(i === c ? [0xff2a2a, 0xffd23a, 0x3aff6a][i] : 0x2a2a2a)); setLight(2);
  for (let i = 0; i < 6; i++) { const t = new THREE.Group(); t.position.set(i % 2 ? 3.6 : -3.6, 0, -18 + i * 6); sc.add(t); t.add(at(mesh(new THREE.CylinderGeometry(.1, .14, 1.6, 6), 0x7a4a2a), 0, .8, 0)); t.add(at(mesh(lowpoly(new THREE.IcosahedronGeometry(.8, 0), .1, i), 0x4aa84a), 0, 2.0, 0)); }
  return { sc, setLight }; }
// ---- ducks ----
function duck(baby = false) { const g = new THREE.Group(), s = baby ? .45 : 1, col = baby ? 0xffd84a : 0x8a6a4a; const b = mesh(lowpoly(new THREE.IcosahedronGeometry(.22 * s, 1), .01, 2), col); b.scale.set(1, .8, 1.3); b.position.y = .2 * s; g.add(b); const h = mesh(lowpoly(new THREE.IcosahedronGeometry(.12 * s, 1), .01, 3), baby ? col : 0x2a6a3a); h.position.set(0, .4 * s, .2 * s); g.add(h); const bk = mesh(new THREE.ConeGeometry(.04 * s, .12 * s, 4), 0xf28a2a); bk.rotation.x = Math.PI / 2; bk.position.set(0, .38 * s, .33 * s); g.add(bk);
  for (const x of [-.05, .05]) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(.018 * s + .005, 6, 4), new THREE.MeshBasicMaterial({ color: 0x16121a })), x * s * 1.6, .43 * s, .29 * s)); return g; }
function parade(sc, n = 11) { const m = duck(false); sc.add(m); const babies = [...Array(n)].map(() => { const d = duck(true); sc.add(d); return d; }); return { m, babies, at(t, x0, z, speed = .55) { [m, ...babies].forEach((d, i) => { const x = x0 + t * speed - i * .45; d.position.set(x, Math.abs(Math.sin(t * 9 + i)) * .03, z); d.rotation.set(0, Math.PI / 2, Math.sin(t * 9 + i) * .15); }); } }; }
let HWP = null;
function censorBar(t) { const B = window.__BLEEPS || []; if (!HWP) return; for (const [t0, t1] of B) { if (t < t0 || t > t1 + .15) continue; const [x, y] = scr(HWP); const k = pop(t - t0); og.save(); og.translate(x, y); og.scale(k, k); og.fillStyle = '#000'; og.fillRect(-440, -130, 880, 260); og.fillStyle = '#fff'; og.font = '900 124px Nunito'; og.textAlign = 'center'; og.fillText('CENSORED', 0, 44); og.restore(); } }
function hud(txt, t0, t1, t, y = H * .16) { if (t < t0 || t > t1) return; og.save(); og.font = '900 80px Nunito'; og.textAlign = 'center'; og.lineWidth = 14; og.strokeStyle = '#000'; og.strokeText(txt, W / 2, y); og.fillStyle = '#ffffff'; og.fillText(txt, W / 2, y); og.restore(); }
// common scene: our car behind the guy's car at the green light
function lightScene(o = {}) { const S = street(o), mine = carR(0xe8323a), his = carR(0x8a9ab0), h = adult(person(HERO)), g = adult(person(GUY)); S.sc.add(mine, his); mine.position.set(-1.4, 0, -2.6); his.position.set(-1.4, 0, 2.0); driver(mine, h); driver(his, g); h.rotation.y = 0; g.rotation.y = 0; return { ...S, mine, his, h, g }; }

// 0 "You're in your fucking car. The light's been green for ten seconds." - FIRST FRAME: his annoyed face at the wheel
shot(0, 3.85, () => { const L = lightScene(); return t => { L.h.setFace('annoyed'); pose(L.h, { armL: [-1.1, 0, .2], armR: [-1.1, 0, -.2], elbowL: -.6, elbowR: -.6 }); sitP(L.h); L.g.setFace('calm'); pose(L.g); sitP(L.g); L.h.updateMatrixWorld(true); const f = L.h.userData.head.localToWorld(V(0, .28, 0)); camAt(f.x - .25, f.y + .05, f.z + 1.15, f.x, f.y - .02, f.z, 40, t, .006); }; });
// 1 "And the guy in front of you... is just sitting there. Not moving. On a green fucking light." - over the hood: his car, the green light
shot(3.85, 9.75, () => { const L = lightScene(); return t => { L.h.setFace('annoyed'); pose(L.h, { armL: [-1.1, 0, .2], armR: [-1.1, 0, -.2], elbowL: -.6, elbowR: -.6 }); sitP(L.h); L.g.setFace('calm'); pose(L.g); sitP(L.g); camAt(lerp(-1.2, -1.5, t / 6), 1.75, lerp(-2.4, -1.6, t / 6), -.6, 1.7, 7.6, 46, t, .004); }; });
// 2 "So you, being a funkin' genius, lay on the horn. Loud as SH-[BEEP]." - fist slams the horn; CENSORED on the bleep
shot(9.75, 15.3, () => { const L = lightScene(); const TH = L.mine && (window.__F0 = 0), TP = F(12.24) - F(9.75); return t => { const slam = t > TP; L.h.setFace(t < TP ? 'smug' : 'scream'); pose(L.h, { armL: [-1.1, 0, .2], armR: slam ? [-1.25 + Math.sin(t * 30) * .05, 0, -.2] : [-1.6, 0, -.2], elbowL: -.6, elbowR: slam ? -.5 : -1.2, snap: slam && t < TP + .1 }); sitP(L.h); L.g.setFace('calm'); pose(L.g); sitP(L.g);
  L.h.updateMatrixWorld(true); HWP = L.h.userData.head.localToWorld(V(0, .3, .05)); const f = L.h.userData.head.localToWorld(V(0, .1, 0)); camAt(f.x + .9, f.y + .2, f.z + 1.2, f.x, f.y - .1, f.z, 44, t, slam && t < TP + .4 ? .03 : .006); }; });
// 3 "The guy slowly turns around... and stares right fucking at you. Dead in the eyes." - through his rear window: the slow, evil turn
shot(15.3, 21.3, () => { const L = lightScene(); const TT = L && F(15.68) - F(15.3), TS = F(17.07) - F(15.3); return t => { const turn = ss(TT, TS, t); L.g.setFace(turn < .7 ? 'calm' : 'evil'); pose(L.g); sitP(L.g); L.g.userData.head.rotation.y = Math.PI * .92 * turn; L.h.setFace(turn > .9 ? 'shock' : 'annoyed'); pose(L.h); sitP(L.h);
  L.g.updateMatrixWorld(true); const f = L.g.userData.head.localToWorld(V(0, .28, 0)); const k = ss(TS, 6, t); camAt(f.x + .05, f.y + .02, f.z - lerp(1.8, .9, k), f.x, f.y, f.z, lerp(40, 34, k), t, .003); }; });
// 4 "So you get out the car. You yank his door open." - out, three stomps, the door flies open
shot(21.3, 24.2, () => { const L = lightScene(); L.mine.remove(L.h); L.sc.add(L.h); const TY = F(22.91) - F(21.3); return t => { const k = clamp(t / TY); L.h.position.set(-2.5, 0, lerp(-2.4, 1.6, k)); L.h.rotation.y = k < 1 ? 0 : Math.PI / 2; L.h.setFace('mad'); pose(L.h, { walk: k < 1 ? t * 9 : 0, armL: k >= 1 ? [-1.4, 0, .4] : [0, 0, .12], elbowL: k >= 1 ? -.3 : undefined });
  L.his.userData.door.rotation.y = -ss(TY, TY + .3, t) * 1.4; L.g.setFace('evil'); pose(L.g); sitP(L.g); camAt(-4.6, 1.8, 3.6, -2.0, 1.0, .6, 50, t); }; });
// 5 "And you start swinging. Like a fucking windmill." - arms like a windmill; he doesn't even blink
shot(24.2, 27.95, () => { const L = lightScene(); L.mine.remove(L.h); L.sc.add(L.h); L.his.userData.door.rotation.y = -1.4; L.h.position.set(-2.45, 0, 1.75); L.h.rotation.y = Math.PI / 2; return t => { const a = t * 16; L.h.setFace('scream'); pose(L.h, { armL: [Math.sin(a) * 2.6, 0, .3], armR: [Math.sin(a + Math.PI) * 2.6, 0, -.3], elbowL: -.2, elbowR: -.2, lean: .2, snap: true }); L.h.position.y = Math.abs(Math.sin(a)) * .05; L.g.setFace('evil'); pose(L.g); sitP(L.g); L.g.userData.head.rotation.y = -Math.PI / 2;
  camAt(-1.0, 1.6, 4.4, -2.2, 1.1, 1.8, 46, t, .015); }; });
// 6 "You hit the steering wheel. You hit the airbag. The airbag hits you back." - POOF; he flies backward
shot(27.95, 32.75, () => { const L = lightScene(); L.mine.remove(L.h); L.sc.add(L.h); L.his.userData.door.rotation.y = -1.4; const bag = new THREE.Mesh(new THREE.SphereGeometry(.4, 14, 10), new THREE.MeshLambertMaterial({ color: 0xf4f4f0 })); L.his.add(bag); bag.position.set(-.35, 1.05, .1); const TA = F(29.62) - F(27.95), TB = F(31.25) - F(27.95);
  return t => { const fire = ss(TA, TA + .08, t); bag.scale.set(fire * 1.1 + .001, fire * 1.1 + .001, fire * .9 + .001); const fly = clamp((t - TB) / .5); L.h.position.set(-2.45 - fly * 2.0, Math.sin(fly * Math.PI) * .6, 1.75); L.h.rotation.set(0, Math.PI / 2, fly * 1.4);
    L.h.setFace(t < TA ? 'mad' : t < TB ? 'shock' : 'scream'); pose(L.h, { armL: t < TA ? [-1.5, 0, .3] : [0, 0, 2.6 * fly + .3], armR: t < TA ? [-1.6 + Math.sin(t * 20) * .3, 0, -.3] : [0, 0, -2.6 * fly - .3], snap: t > TB }); L.g.setFace(t > TA ? 'shock' : 'evil'); pose(L.g); sitP(L.g); L.g.userData.head.rotation.y = -Math.PI / 2;
    camAt(-1.2, 1.5, 4.6, -2.6, 1.0, 1.6, 50, t, t > TA && t < TA + .3 ? .04 : .006); }; });
// 7 "You're lying in the road. Then you look up... and see why he stopped." - flat on the asphalt, head lifts
shot(32.75, 37.45, () => { const L = lightScene(); L.mine.remove(L.h); L.sc.add(L.h); L.his.userData.door.rotation.y = -1.4; L.h.position.set(-4.4, .25, 1.75); L.h.rotation.set(-Math.PI / 2, 0, 0); const TL = F(34.69) - F(32.75); return t => { L.h.setFace(t < TL ? 'tired' : 'shock'); pose(L.h, { armL: [0, 0, 1.4], armR: [0, 0, -1.4] }); L.h.userData.head.rotation.x = -ss(TL, TL + .6, t) * .7;
  L.h.updateMatrixWorld(true); const f = L.h.userData.head.localToWorld(V(0, .3, 0)); camAt(f.x - .2, f.y + .9, f.z + .1, f.x, f.y, f.z, 46, t, .004); }; });
// 8 "A mama duck. And eleven baby ducks. Crossing the street. One at a time." - ground level: the parade
shot(37.45, 43.75, () => { const L = lightScene(), P = parade(L.sc); return t => { P.at(t, -1.2, 4.7, .45); const mx = P.m.position.x; camAt(mx - 1.0, .5, 7.3, mx - 1.7, .3, 4.7, 46, t, .004); L.g.setFace('calm'); pose(L.g); sitP(L.g); }; });
// 9 "Someone filmed the whole thing. Now you're on the news. 'Man Punches Airbag Over Ducks.'" - phones up... then the news desk
shot(43.75, 50.25, () => { const L = lightScene(); L.mine.remove(L.h); L.sc.add(L.h); L.h.position.set(-2.45, 0, 1.75); L.h.rotation.y = Math.PI / 2; L.his.userData.door.rotation.y = -1.4; const bys = [0, 1, 2, 3].map(i => { const p = adult(person(KID(i + 3)), .95); p.position.set(-4.4 + (i % 2) * .5, .2, -1 + i * 1.1); p.rotation.y = Math.PI / 2 + .4; L.sc.add(p); const ph = mesh(new THREE.BoxGeometry(.1, .18, .02), 0x16121a); L.sc.add(ph); p.userData.ph = ph; return p; });
  const TN = F(45.93) - F(43.75); const st = new THREE.Scene(); st.background = new THREE.Color(0x0a1a3a); st.add(new THREE.HemisphereLight(0xffffff, 0x3a4a6a, 1.6)); const desk = mesh(new THREE.BoxGeometry(2.4, .9, .7), 0x1a3a7a); desk.position.set(0, .45, -.2); st.add(desk); const anc = adult(person({ ...BOSS, hair: 0x2a1a14 })); anc.position.set(.3, 0, -.5); st.add(anc); const scr_ = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshBasicMaterial({ map: ctex(320, 200, (g, w, h) => { g.fillStyle = '#5a5a64'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f4f0'; g.beginPath(); g.arc(160, 100, 60, 0, 7); g.fill(); for (let i = 0; i < 5; i++) { g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(40 + i * 18, 170, 8, 0, 7); g.fill(); } g.fillStyle = '#fff'; g.font = '900 30px Nunito'; g.fillText('POOF', 120, 40); }) })); scr_.position.set(-.8, 1.7, -1.1); st.add(scr_);
  return t => { if (t < TN) { window.__sc = L.sc; bys.forEach((p, i) => { p.setFace('happy'); pose(p, { armR: [-1.7, 0, -.1], elbowR: -.4 }); p.updateMatrixWorld(true); p.userData.arms[1].userData.hand.getWorldPosition(p.userData.ph.position); p.userData.ph.position.y += .1; }); L.h.setFace('tired'); pose(L.h); camAt(-6.4, 1.7, 1.4, -3.2, 1.2, 1.2, 50, t); }
    else { anc.setFace(Math.sin(t * 12) > 0 ? 'madopen' : 'calm'); pose(anc, { armL: [-.8, 0, .4], armR: [-.8, 0, -.4] }); camAt(-.1, 1.5, 2.6, -.1, 1.4, -.6, 44, t, .003); } }; });
// 10 "Twelve million views. Your mom saw it. Your boss saw it. The ducks saw it." - three reaction cuts
shot(50.25, 56.75, () => { const room = roomLP(0xe8d8c0, 0xb88a5a), mom = adult(person(GIRLish())), boss = adult(person(BOSS)), ph = mesh(new THREE.BoxGeometry(.12, .22, .02), 0x16121a); room.add(mom, boss, ph); mom.position.set(-3, 0, -1); boss.position.set(3, 0, -1); const ducksSc = street().sc, P = parade(ducksSc, 5), bigPh = mesh(new THREE.BoxGeometry(.5, .03, .9), 0x16121a); ducksSc.add(bigPh); bigPh.position.set(0, .02, 3.5); const glow = new THREE.Mesh(new THREE.PlaneGeometry(.44, .82), new THREE.MeshBasicMaterial({ color: 0x9ad8ff })); glow.rotation.x = -Math.PI / 2; glow.position.set(0, .04, 3.5); ducksSc.add(glow);
  const TM = F(52.37) - F(50.25), TB = F(53.6) - F(50.25), TD = F(54.93) - F(50.25); const roomSc = window.__sc = room;
  return t => { if (t < TB) { window.__sc = room; mom.setFace(t < TM + .3 ? 'calm' : 'shock'); pose(mom, { armR: [-1.6, 0, -.2], elbowR: -.8 }); mom.updateMatrixWorld(true); mom.userData.arms[1].userData.hand.getWorldPosition(ph.position); ph.position.z += .05; camAt(-2.6, 1.6, .6, -3, 1.55, -1, 44, t); }
    else if (t < TD) { window.__sc = room; boss.setFace('mad'); pose(boss, { armR: [-2.3, 0, -.3], elbowR: -1.9 }); camAt(3.3, 1.6, .7, 3, 1.55, -1, 44, t); }
    else { window.__sc = ducksSc; [P.m, ...P.babies].forEach((d, i) => { const a = i / 6 * Math.PI * 2; d.position.set(Math.cos(a) * .7, 0, 3.5 + Math.sin(a) * .6); d.lookAt(0, 0, 3.5); }); camAt(0, 1.6, 5.2, 0, 0, 3.5, 44, t); } }; });
// 11 "The next day... you're at a green light. Ducks crossing. You wait." - calm and patient this time
shot(56.75, 61.85, () => { const L = lightScene(), P = parade(L.sc); L.his.visible = false; L.mine.position.z = 2.0; return t => { P.at(t, -.8, 4.6, .55); L.h.setFace('calm'); pose(L.h, { armL: [-1.1, 0, .2], armR: [-1.1, 0, -.2], elbowL: -.6, elbowR: -.6 }); sitP(L.h); camAt(-.6, 3.0, .9, -1.2, .2, 4.8, 52, t); }; });
// 12 "The car behind you honks."
shot(61.85, 63.95, () => { const L = lightScene(); L.his.visible = false; L.mine.position.z = 2.0; const back = carR(0x3aa86a); L.sc.add(back); back.position.set(-1.4, 0, -2.4); const b = adult(person(KID(4))); driver(back, b); return t => { b.setFace('mad'); pose(b, { armR: [-1.25, 0, -.2], elbowR: -.5 }); sitP(b); L.h.setFace('calm'); pose(L.h); sitP(L.h); back.updateMatrixWorld(true); HWP = back.localToWorld(V(-.35, 1.0, .5)); camAt(.8, 1.9, -6.0, -1.4, 1.0, -2.0, 46, t); }; });
// 13 "You slowly turn around... and stare right fucking at him." - the same slow evil turn, now it's you (mirrors shot 3)
shot(63.95, 999, () => { const L = lightScene(); L.his.visible = false; L.mine.position.z = 2.0; const back = carR(0x3aa86a); L.sc.add(back); back.position.set(-1.4, 0, -2.4); const TS = F(65.65) - F(63.95); return t => { const turn = ss(.2, TS, t); L.h.setFace(turn < .7 ? 'calm' : 'evil'); pose(L.h); sitP(L.h); L.h.userData.head.rotation.y = Math.PI * .92 * turn;
  L.h.updateMatrixWorld(true); const f = L.h.userData.head.localToWorld(V(0, .28, 0)); const k = ss(TS, 3.5, t); camAt(f.x + .05, f.y + .02, f.z - lerp(1.8, .9, k), f.x, f.y, f.z, lerp(40, 34, k), t, .003); }; });

// ===================== RENDER =====================
window.__BLEEPS = await (await fetch('/build/bleeps.json')).json();
const built = new Map();
function renderAt(t) { window.__T = t; let i = SH.findIndex((s, k) => t >= s.a && (k + 1 >= SH.length || t < SH[k + 1].a)); if (i < 0) i = 0; const s = SH[i];
  if (!built.has(i)) { for (const k of [...built.keys()]) if (k < i - 1) built.delete(k); const up = s.build(); built.set(i, { up, sc: window.__sc }); }
  HWP = null; const B = built.get(i); B.up(t - s.a); renderer.render(window.__sc || B.sc, cam); og.drawImage(renderer.domElement, 0, 0);
  if (HWP) { ring(t, F(12.24), HWP, 1.4); ring(t, F(62.59), HWP, 1.4); } censorBar(t);
  if (t < F(3.85)) { const s_ = Math.min(10, Math.floor(t / F(2.83) * 10)); hud(`0:${String(s_).padStart(2, '0')}`, 0, F(3.85), t); }
  bang(t, F(12.24), 'HOOOONK', '#ffd23a', W / 2, H * .2, -.05); bang(t, F(29.62), 'POOF', '#ffffff', W / 2, H * .2, .05); bang(t, F(31.25), 'BONK', '#ffd23a', W / 2, H * .22, -.05); bang(t, F(62.59), 'HONK', '#ffd23a', W / 2, H * .2, .05);
  if (t > F(45.93) && t < F(50.25)) { og.fillStyle = '#c8282a'; og.fillRect(0, H * .76, W, 90); og.fillStyle = '#fff'; og.font = '900 52px Nunito'; og.textAlign = 'left'; og.fillText('BREAKING', 40, H * .76 + 64); og.fillStyle = '#16121a'; og.fillRect(0, H * .76 + 90, W, 80); og.fillStyle = '#fff'; og.font = '900 40px Nunito'; og.fillText('MAN PUNCHES AIRBAG OVER DUCKS', 30, H * .76 + 146); }
  if (t > F(50.27) && t < F(56.75)) { const v = Math.min(12e6, Math.floor(12e6 * clamp((t - F(50.27)) / (F(51.33) - F(50.27)))) ); hud(v.toLocaleString('en-US') + ' views', F(50.27), F(56.75), t, H * .14); }
  caption(t); }
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .9); };
window.renderFrame = i => { renderAt(i / FPS); return out.toDataURL('image/jpeg', .92); };
window.frameCount = NF; window.ready = true;
