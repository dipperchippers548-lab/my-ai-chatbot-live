// "Why Some People Fumble During a Job Interview" - low-poly flat-shaded short, rendered frame by frame.
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
// ===================== "Why Some People Fumble During a Job Interview" =====================
const SK = 0xf0b48a;
const HERO = { skin: SK, hair: 0x3a2416, top: 0x2a3a6a, top2: 0x22305a, pants: 0x2a3a6a, shoe: 0x16121a, sole: 0x2a2a2a, sock: 0x2a3a6a, kind: 'cardigan' };
const BOSS = { skin: SK, hair: SK, top: 0x7a7a86, top2: 0x6a6a76, pants: 0x4a4a54, shoe: 0x16121a, sole: 0x2a2a2a, sock: 0x4a4a54, kind: 'cardigan' };
function adult(p, s = 1.06) { p.scale.setScalar(s); p.userData.head.scale.setScalar(.85); return p; }
// faces: talking versions (open mouth) for lip sync
const openMouth = (base, col = '#f0b48a') => ctex(256, 256, g => { g.drawImage(faceTex(base).image || base.image, 0, 0); g.fillStyle = col; g.fillRect(92, 166, 72, 40); g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(128, 186, 22, 15, 0, 0, 7); g.fill(); g.fillStyle = '#e86a6a'; g.beginPath(); g.ellipse(128, 194, 13, 6, 0, 0, 7); g.fill(); });
FACES.smugtalk = ctex(256, 256, g => { g.drawImage(FACES.smug.image, 0, 0); g.fillStyle = '#f0b48a'; g.fillRect(92, 166, 72, 40); g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(128, 186, 22, 15, 0, 0, 7); g.fill(); });
FACES.tiredtalk = openMouth('tired'); FACES.calmtalk = openMouth('calm'); FACES.happytalk = ctex(256, 256, g => { g.drawImage(faceTex('happy').image, 0, 0); });
const talking = () => lvl(window.__T) >= 2;
const tf = (p, base) => p.setFace(talking() && FACES[base + 'talk'] ? base + 'talk' : base);
// --- wardrobe ---
function dressHero(p) { const T = p.userData.torso; const tie = new THREE.Group(); tie.position.set(0, .38, -.255); T.add(tie); tie.add(at(mesh(new THREE.BoxGeometry(.09, .07, .04), 0xe8323a), 0, .12, 0)); tie.add(at(mesh(new THREE.ConeGeometry(.07, .32, 4), 0xe8323a), 0, -.07, 0)); tie.children[1].rotation.x = Math.PI;
  const belly = mesh(lowpoly(new THREE.IcosahedronGeometry(.13, 1), .01, 3), SK); belly.scale.set(1, .55, .45); belly.position.set(0, .06, .22); T.add(belly);
  for (const s of [-1, 1]) T.add(at(mesh(new THREE.BoxGeometry(.012, .3, .012), 0xf4ead8), s * .12, .3, .23));
  const btn = mesh(new THREE.CylinderGeometry(.03, .03, .012, 8), 0xd8b060); btn.rotation.x = Math.PI / 2; btn.position.set(0, .2, .25); T.add(btn); p.userData.btn = btn; p.userData.tie = tie; return p; }
function dressBoss(p) { const H_ = p.userData.head, T = p.userData.torso; const g = new THREE.Group(); g.position.set(0, .3, .29); H_.add(g); for (const s of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(.065, .014, 5, 12), 0x16121a); r.position.x = s * .08; g.add(r); } g.add(at(mesh(new THREE.BoxGeometry(.05, .014, .014), 0x16121a), 0, 0, 0));
    for (const s of [-1, 1]) H_.add(at(mesh(lowpoly(new THREE.IcosahedronGeometry(.08, 0), .02, 8 + s), 0x9a9a9a), s * .27, .33, -.04));
  T.add(at(mesh(new THREE.BoxGeometry(.08, .06, .03), 0x2a5ad8), 0, .52, .245)); const tie = mesh(new THREE.ConeGeometry(.06, .34, 4), 0x2a5ad8); tie.rotation.x = Math.PI; tie.position.set(0, .3, .25); T.add(tie); return adult(p); }
// --- office set ---
function card3(w, h, draw, pw = 256) { const ph = Math.round(pw * h / w), c = document.createElement('canvas'); c.width = pw; c.height = ph; const g = c.getContext('2d'); const T = new THREE.CanvasTexture(c); T.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: T }));
  m.userData.draw = (...a) => { g.clearRect(0, 0, pw, ph); draw(g, pw, ph, ...a); T.needsUpdate = true; }; m.userData.draw(0); return m; }
function officeChair() { const g = new THREE.Group(); g.add(at(mesh(new THREE.CylinderGeometry(.04, .04, .32, 6), 0x2a2a2a), 0, .2, 0)); for (let i = 0; i < 5; i++) { const l = mesh(new THREE.BoxGeometry(.04, .03, .32), 0x2a2a2a); l.rotation.y = i * 1.256; l.position.y = .03; g.add(l); }
  g.add(at(mesh(lowpoly(new THREE.BoxGeometry(.56, .12, .52, 2, 1, 2), .02, 6), 0x16161e), 0, .42, 0)); g.add(at(mesh(lowpoly(new THREE.BoxGeometry(.56, .7, .1, 2, 2, 1), .02, 7), 0x16161e), 0, .85, -.26)); return g; }
function woodChair() { const g = new THREE.Group(); g.add(at(mesh(new THREE.BoxGeometry(.5, .06, .46), 0xb87a4a), 0, .44, 0)); for (const [x, z] of [[-.21, -.19], [.21, -.19], [-.21, .19], [.21, .19]]) g.add(at(mesh(new THREE.BoxGeometry(.05, .44, .05), 0x9a6238), x, .22, z));
  g.add(at(mesh(new THREE.BoxGeometry(.5, .5, .05), 0xb87a4a), 0, .72, .21)); return g; }
function office() { const sc = roomLP(0xcfdcea, 0x7a8a9a, 0xcfdcea); sc.children.find(o => o.isHemisphereLight).intensity = 1.5;
  // carpet tiles
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(.98, .98), new THREE.MeshLambertMaterial({ color: (i + j) % 2 ? 0x6a7a8a : 0x748494 })); t.rotation.x = -Math.PI / 2; t.position.set(-2.5 + i, .004, -2 + j); t.receiveShadow = true; sc.add(t); }
  const desk = new THREE.Group(); desk.position.set(0, 0, -.75); sc.add(desk); desk.add(at(mesh(lowpoly(new THREE.BoxGeometry(1.8, .08, .82, 3, 1, 2), .01, 2), 0x8a5a34), 0, .74, 0)); desk.add(at(mesh(new THREE.BoxGeometry(1.76, .62, .05), 0x7a4a2a), 0, .4, .37)); for (const s of [-1, 1]) desk.add(at(mesh(new THREE.BoxGeometry(.05, .7, .78), 0x7a4a2a), s * .86, .35, 0));
  const lap = new THREE.Group(); lap.position.set(.42, .78, -.85); sc.add(lap); lap.add(mesh(new THREE.BoxGeometry(.42, .02, .3), 0x9aa0ac)); const scrn = mesh(new THREE.BoxGeometry(.42, .28, .015), 0x9aa0ac); scrn.position.set(0, .14, .15); scrn.rotation.x = -.25; lap.add(scrn); const disp = new THREE.Mesh(new THREE.PlaneGeometry(.38, .24), new THREE.MeshBasicMaterial({ color: 0x8fd0ff })); disp.position.set(0, .14, .14); disp.rotation.set(-.25, Math.PI, 0); lap.add(disp);
  const mug = new THREE.Group(); mug.position.set(-.55, .78, -.62); sc.add(mug); mug.add(at(mesh(new THREE.CylinderGeometry(.06, .055, .13, 10), 0xf4f4f0), 0, .065, 0)); const hdl = mesh(new THREE.TorusGeometry(.035, .012, 5, 10), 0xf4f4f0); hdl.position.set(.07, .07, 0); mug.add(hdl); mug.add(at(new THREE.Mesh(new THREE.CircleGeometry(.052, 10), new THREE.MeshLambertMaterial({ color: 0x4a2a14 })), 0, .12, 0)); mug.children[2].rotation.x = -Math.PI / 2;
  const plate = card3(.4, .1, (g, w, h, s) => { g.fillStyle = s ? '#d8b060' : '#2a2a30'; g.fillRect(0, 0, w, h); g.fillStyle = s ? '#16121a' : '#e8c870'; g.font = `900 ${h * .55}px Nunito`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s ? 'THE BOSS' : 'HIRING MGR', w / 2, h * .55); }); plate.position.set(0, .84, -.36); plate.rotation.x = -.3; sc.add(plate); sc.add(at(mesh(new THREE.BoxGeometry(.42, .02, .08), 0x2a2a30), 0, .79, -.38));
  const pad = card3(.26, .34, (g, w, h, k) => { g.fillStyle = '#fff8c0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9ac0e0'; g.lineWidth = 2; for (let y = 40; y < h; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = '#e8323a'; g.fillRect(28, 0, 3, h);
    if (k > 0) { g.save(); g.beginPath(); g.rect(0, 0, w * Math.min(1, k * 1.3), h); g.clip(); g.fillStyle = '#16121a'; g.font = '900 150px Nunito'; g.textAlign = 'center'; g.fillText('NO', w / 2, h * .62); g.restore(); } if (k > .85) { g.strokeStyle = '#e8323a'; g.lineWidth = 9; g.beginPath(); g.arc(w / 2, h * .5, w * .44, 0, 7); g.stroke(); } }, 256);
  pad.rotation.x = -Math.PI / 2; pad.rotation.z = .2; pad.position.set(-.1, .785, -.95); sc.add(pad);
  const pen = mesh(new THREE.CylinderGeometry(.008, .008, .16, 6), 0x2a5ad8); pen.rotation.z = Math.PI / 2; pen.position.set(.08, .8, -.95); sc.add(pen);
  const bc = officeChair(); bc.position.set(0, 0, -1.5); sc.add(bc); const hc = woodChair(); hc.position.set(0, 0, .3); sc.add(hc);
  // back wall: door, window with skyline, poster, clock; side: filing cabinet, plant, water cooler
  const doorPiv = new THREE.Group(); doorPiv.position.set(-2.4, 0, -2.45); sc.add(doorPiv); const door = mesh(new THREE.BoxGeometry(.95, 2.1, .06), 0x8a5a34); door.position.set(.475, 1.05, 0); doorPiv.add(door); doorPiv.add(at(mesh(new THREE.SphereGeometry(.04, 6, 4), 0xd8b060), .85, 1.0, .05));
  sc.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.95, 2.1), new THREE.MeshBasicMaterial({ color: 0x2a2a34 })), -1.925, 1.05, -2.48));
  sc.add(at(mesh(new THREE.BoxGeometry(1.6, 1.2, .08), 0xf4f0e8), 1.3, 1.85, -2.47)); const city = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.05), new THREE.MeshBasicMaterial({ map: ctex(256, 192, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6ab8ff'); gr.addColorStop(1, '#c8e8ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { const bw = 20 + hash(i) * 20, bh = 60 + hash(i + 2) * 100, x = i * 28; g.fillStyle = ['#7a8aa8', '#8a9ab8', '#6a7a98'][i % 3]; g.fillRect(x, h - bh, bw, bh); g.fillStyle = '#d8e8ff'; for (let y = h - bh + 8; y < h - 6; y += 14) for (let xx = x + 4; xx < x + bw - 4; xx += 8) g.fillRect(xx, y, 4, 6); } }) })); city.position.set(1.3, 1.85, -2.42); sc.add(city); sc.add(at(mesh(new THREE.BoxGeometry(.06, 1.1, .1), 0xf4f0e8), 1.3, 1.85, -2.4));
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(.6, .8), new THREE.MeshLambertMaterial({ map: ctex(150, 200, (g, w, h) => { g.fillStyle = '#2a3a6a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c230'; g.beginPath(); g.arc(w / 2, 80, 34, 0, 7); g.fill(); g.fillStyle = '#16121a'; g.beginPath(); g.arc(w / 2 - 12, 74, 5, 0, 7); g.arc(w / 2 + 12, 74, 5, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 20px Nunito'; g.textAlign = 'center'; g.fillText('HANG IN', w / 2, 150); g.fillText('THERE', w / 2, 175); }) })); poster.position.set(-.6, 1.9, -2.48); sc.add(poster);
  const clk = new THREE.Mesh(new THREE.CircleGeometry(.2, 20), new THREE.MeshLambertMaterial({ map: ctex(128, 128, (g, w) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.lineWidth = 7; g.strokeStyle = '#16121a'; g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 24); g.moveTo(64, 64); g.lineTo(92, 64); g.stroke(); }) })); clk.position.set(.25, 2.75, -2.48); sc.add(clk);
  const cab = mesh(new THREE.BoxGeometry(.5, 1.2, .55), 0x8a92a0); cab.position.set(-3.0 + .35, .6, -1.6); sc.add(cab); for (let i = 0; i < 3; i++) sc.add(at(mesh(new THREE.BoxGeometry(.14, .03, .03), 0xd8d8e0), -2.65 + .26, .3 + i * .38, -1.6));
  sc.add(at(mesh(new THREE.CylinderGeometry(.2, .16, .4, 8), 0xc8603a), 2.4, .2, -2.0)); for (let i = 0; i < 8; i++) { const lf = mesh(new THREE.ConeGeometry(.08, .7, 4), 0x3a9a4a); lf.position.set(2.4, .65, -2.0); lf.rotation.set(Math.cos(i) * .6, i, Math.sin(i * 1.7) * .6); sc.add(lf); }
  for (let i = 0; i < 3; i++) sc.add(at(mesh(new THREE.BoxGeometry(.32, .04, .24), [0xf4f4f0, 0xe8e8d8, 0xf4f4f0][i]), -.55, .79 + i * .04, -1.0));
  return { sc, mug, lap, plate, pad, pen, bc, hc, doorPiv, disp }; }
const SEAT = .07;   // y offset for someone sitting on these chairs
const bossSit = (S, b) => { b.position.set(0, SEAT + .02, -1.5); b.rotation.y = 0; };
const heroSit = (S, h) => { h.position.set(0, SEAT, .3); h.rotation.y = Math.PI; };
function sweat(sc, n = 10) { return [...Array(n)].map(() => { const d = mesh(new THREE.SphereGeometry(.03, 6, 5), 0x7ac8ff); d.scale.y = 1.4; sc.add(d); return d; }); }
function sweatUp(ds, h, t, k = 1) { h.updateMatrixWorld(true); ds.forEach((d, i) => { const q = (t * (1.2 + k) + hash(i)) % 1, side = i % 2 ? 1 : -1; const p = h.userData.head.localToWorld(V(side * (.22 + q * .15), .5 - q * .1, .05)); d.position.set(p.x, p.y - q * q * 1.2, p.z); d.visible = i < 3 + k * 7; }); }
const HP = p => { p.updateMatrixWorld(true); return p.userData.head.localToWorld(V(0, .3, .2)); };

// 0 "You walk into your first fucking job interview." - FIRST FRAME: door flies open, our guy struts in, sweating already
shot(0, 3.06, () => { const S = office(), h = dressHero(person(HERO)), b = dressBoss(person(BOSS)), ds = sweat(S.sc); S.sc.add(h, b); bossSit(S, b);
  return t => { const op = ss(0, .35, t); S.doorPiv.rotation.y = op * 1.6; const k = clamp((t - .2) / 1.5); h.position.set(lerp(-1.95, -.5, k), 0, lerp(-2.1, .9, k)); h.rotation.y = k < 1 ? Math.atan2(1.45, 3.0) : .2; h.setFace(k < 1 ? 'smug' : 'worried'); pose(h, { walk: k < 1 ? t * 9 : 0 }); sweatUp(ds, h, t, .3);
    b.setFace('tired'); pose(b); sitP(b); camAt(.8, 1.6, 2.0, -.7, 1.15, -.5, 50, t); }; });
// 1 "Your suit is two sizes too small, your tie is on backwards, and you're sweating like a fucking sinner in church." - orbit him
shot(3.06, 10.6, () => { const S = office(), h = dressHero(person(HERO)), ds = sweat(S.sc, 12); S.sc.add(h); h.position.set(-.4, 0, .9); h.rotation.y = .2; const TB = L(4.62, 3.06), TT = L(5.5, 3.06), TS = L(7.41, 3.06);
  return t => { h.setFace(t < TS ? 'worried' : 'shock'); pose(h, { armL: [0, 0, .35], armR: [0, 0, -.35] }); h.userData.torso.scale.x = 1.12; const bt = h.userData.btn, q = t - TB; if (q > 0) { bt.position.set(q * .6, .2 + q * 1.4 - q * q * 3, .25 + q * 1.5); bt.rotation.y = q * 20; }
    const orb = ss(TT - .1, TT + .9, t) * (1 - ss(TS - .3, TS + .4, t)); sweatUp(ds, h, t, t > TS ? 1 : .2); const a = .2 + orb * 2.7, r = 2.7;
    camAt(-.4 + Math.sin(a) * r, 1.5, .9 + Math.cos(a) * r, -.4, 1.35, .9, 42, t); }; });
// 2 "So... tell me about yourself." - the interviewer, bored out of his mind
shot(10.6, 13.17, () => { const S = office(), b = dressBoss(person(BOSS)); S.sc.add(b); bossSit(S, b); return t => { tf(b, 'tired'); pose(b, { armL: [-.7, 0, .3], armR: [-.7, 0, -.3], elbowL: -1.2, elbowR: -1.2 }); sitP(b); camAt(.35, 1.55, .7, 0, 1.42, -1.5, 40, t); }; });
// 3 "And you, being a funkin' genius, decide honesty is the best fucking policy." - push in on the smug genius
shot(13.17, 19.15, () => { const S = office(), h = dressHero(person(HERO)), ds = sweat(S.sc); S.sc.add(h); heroSit(S, h); return t => { h.setFace(t < L(15.7, 13.17) ? 'happy' : 'smug'); pose(h); sitP(h); sweatUp(ds, h, t, .2); const k = ss(0, 6, t); camAt(lerp(.6, .25, k), lerp(1.65, 1.55, k), lerp(-2.3, -1.6, k), 0, 1.3, .3, 42, t); }; });
// 4 "Well, I got fired from my last three jobs. One for sleeping. One for stealing. And one for sleeping while I was stealing."
shot(19.15, 28.4, () => { const S = office(), h = dressHero(person(HERO)), b = dressBoss(person(BOSS)); S.sc.add(h, b); heroSit(S, h); bossSit(S, b); return t => { tf(h, 'smug'); pose(h, { armR: [-1.3, 0, -.3], elbowR: -.8 }); sitP(h); b.setFace(t < L(24.0, 19.15) ? 'tired' : 'shock'); pose(b); sitP(b); camAt(-1.0, 1.75, -2.2, 0, 1.2, .3, 44, t); }; });
// 5a "He writes something down." - the notepad: N... O. Circled.
shot(28.4, 30.05, () => { const S = office(); return t => { const k = clamp((t - .1) / .8); S.pad.userData.draw(k); S.pen.position.set(-.18 + k * .18 + Math.sin(t * 30) * .01, .81, -.95 + Math.cos(t * 25) * .01); camAt(-.1, 1.35, -.62, -.1, .78, -.95, 40, t, .004); }; });
// 5b "You think that's a good sign." - thumbs up
shot(30.05, 32.42, () => { const S = office(), h = dressHero(person(HERO)); S.sc.add(h); heroSit(S, h); return t => { h.setFace('happy'); pose(h, { armR: [-1.6, 0, -.5], elbowR: -1.4 }); sitP(h); camAt(.3, 1.6, -1.7, 0, 1.3, .3, 40, t); }; });
// 6a "What's your biggest weakness?"
shot(32.42, 34.45, () => { const S = office(), b = dressBoss(person(BOSS)); S.sc.add(b); bossSit(S, b); return t => { tf(b, 'tired'); pose(b); sitP(b); camAt(-.35, 1.55, .7, 0, 1.42, -1.5, 40, t); }; });
// 6b "Waking up. And Mondays. And Tuesdays. Honestly? Work." - counting on his fingers, each one pops up
shot(34.45, 40.42, () => { const S = office(), h = dressHero(person(HERO)), b = dressBoss(person(BOSS)); S.sc.add(h, b); heroSit(S, h); bossSit(S, b); const TW = L(39.67, 34.45);
  return t => { tf(h, t < TW ? 'calm' : 'smug'); const c = Math.floor(t * 1.2) % 2; pose(h, { armL: [-1.2, 0, .3], armR: [-1.2 - c * .2, 0, -.3], elbowL: -1.0, elbowR: -1.2 }); sitP(h); b.setFace(t < TW ? 'tired' : 'mad'); pose(b); sitP(b); camAt(1.3, 1.5, -1.3, -.1, 1.1, .2, 46, t); }; });
// 7a "Why do you want to work here?"
shot(40.42, 42.25, () => { const S = office(), b = dressBoss(person(BOSS)); S.sc.add(b); bossSit(S, b); return t => { tf(b, 'tired'); pose(b, { armR: [-1.0, 0, -.2], elbowR: -1.3 }); sitP(b); camAt(.4, 1.55, .6, 0, 1.42, -1.5, 38, t); }; });
// 7b "I don't. My mom said if I don't get a job, she's turning my room into a fucking gym." - mom's text pops up
shot(42.25, 48.0, () => { const S = office(), h = dressHero(person(HERO)); S.sc.add(h); heroSit(S, h); return t => { tf(h, t < L(44.0, 42.25) ? 'calm' : 'worried'); pose(h, { armL: [0, 0, .5], armR: [0, 0, -.5] }); sitP(h); camAt(-.3, 1.6, -1.8, 0, 1.3, .3, 42, t); }; });
// 8a "Where do you see yourself in five years?"
shot(48.0, 50.58, () => { const S = office(), b = dressBoss(person(BOSS)); S.sc.add(b); bossSit(S, b); return t => { tf(b, 'tired'); pose(b); sitP(b); camAt(-.3, 1.55, .5, 0, 1.42, -1.5, 36, t); }; });
// 8b "In your chair, bro. I'm taking your fucking job." - he leans back and points at the boss's chair
shot(50.58, 54.9, () => { const S = office(), h = dressHero(person(HERO)), b = dressBoss(person(BOSS)); S.sc.add(h, b); heroSit(S, h); bossSit(S, b); const TJ = L(52.35, 50.58);
  return t => { tf(h, 'smug'); pose(h, { armR: [-1.5, 0, -.1], elbowR: -.05, lean: -.15 }); sitP(h); b.setFace(t < TJ ? 'tired' : 'shock'); pose(b); sitP(b); const k = ss(TJ, TJ + 1.6, t); camAt(lerp(-1.4, -.5, k), lerp(1.8, 1.6, k), lerp(-2.4, -1.9, k), 0, 1.3, .3, 44, t); }; });
// 9 "He puts down his pen. Takes a deep breath. Looks you dead in the eyes..." - slow, slow push to his eyes
shot(54.9, 60.5, () => { const S = office(), b = dressBoss(person(BOSS)); S.sc.add(b); bossSit(S, b); const TB = L(56.76, 54.9), TL = L(58.52, 54.9);
  return t => { b.setFace(t < TL ? 'calm' : 'mad'); pose(b, { armR: t < .8 ? [-.9, 0, -.2] : [0, 0, -.12] }); sitP(b); const br = ss(TB, TB + .8, t) * (1 - ss(TL - .4, TL, t)); b.userData.torso.scale.set(1 + br * .15, 1 + br * .08, 1 + br * .15);
    const k = ss(0, TL + 1.5, t); camAt(lerp(.5, 0, k), lerp(1.55, 1.5, k), lerp(.9, -.6, k), 0, 1.48, -1.5, lerp(40, 30, k), t, .003); }; });
// 10 "FUCK NO! YOU ARE NOT GETTING THIS JOB!" - full scream, papers blast, our guy gets blown back
shot(60.5, 64.3, () => { const S = office(), b = dressBoss(person(BOSS)), h = dressHero(person(HERO)), papers = [...Array(14)].map(() => { const p = new THREE.Mesh(new THREE.PlaneGeometry(.12, .16), new THREE.MeshLambertMaterial({ color: 0xf8f8f0, side: THREE.DoubleSide })); S.sc.add(p); return p; }); S.sc.add(b, h); bossSit(S, b); heroSit(S, h);
  return t => { b.setFace('scream'); pose(b, { armL: [-2.2, 0, .6], armR: [-2.2, 0, -.6], lean: .25, snap: t < .05 }); sitP(b); b.position.y = SEAT + .02 + Math.abs(Math.sin(t * 22)) * .04;
    h.setFace('shock'); pose(h, { lean: -.4, armL: [-2.5, 0, .4], armR: [-2.5, 0, -.4], snap: t < .05 }); sitP(h); S.hc.rotation.x = Math.min(.35, t * 2); h.position.z = .3 + Math.min(.12, t * .8);
    papers.forEach((p, i) => { const q = (t * .9 + hash(i)) % 1; p.position.set((hash(i + 1) - .5) * 1.6 + q * (hash(i + 2) - .5), .85 + q * 1.0, -.9 + q * 1.4); p.rotation.set(t * 6 + i, t * 4 + i * 2, i); });
    const sh = .05 * Math.exp(-t * 1.2); camAt(.5 + noise1(t * 30) * sh, 1.6 + noise1(t * 31 + 5) * sh, .6, 0, 1.4, -1.5, 46, t, .02); }; });
// 11a "And then he sprints out of his own fucking office!" - cartoon sprint, dust puffs, door SLAM
shot(64.3, 67.0, () => { const S = office(), b = dressBoss(person(BOSS)), h = dressHero(person(HERO)), puffs = [...Array(8)].map(() => { const p = mesh(new THREE.IcosahedronGeometry(.14, 0), 0xe8e8e8); S.sc.add(p); return p; }); S.sc.add(b, h); heroSit(S, h); const T0 = L(64.71, 64.3), TS = L(66.4, 64.3);
  return t => { const k = clamp((t - T0) / (TS - T0 - .1)); const P = [V(0, 0, -1.5), V(-1.2, 0, -1.9), V(-1.9, 0, -2.6)], seg = k < .5 ? 0 : 1, u = (k % .5) * 2; const pos = k >= 1 ? P[2] : P[seg].clone().lerp(P[seg + 1], u);
    b.position.copy(pos); b.rotation.y = k <= 0 ? 0 : Math.atan2(P[seg + 1].x - P[seg].x, P[seg + 1].z - P[seg].z); b.visible = k < 1; b.setFace('scream'); pose(b, { walk: k > 0 ? t * 26 : 0, lean: k > 0 ? .3 : 0 }); if (k <= 0) sitP(b);
    S.doorPiv.rotation.y = k > 0 && t < TS ? 1.6 : lerp(1.6, 0, ss(TS - .08, TS, t)); puffs.forEach((p, i) => { const age = (t - T0 - i * .08); p.visible = age > 0 && age < .8 && k < 1; const q = clamp(i / 8); const pp = P[q < .5 ? 0 : 1].clone().lerp(P[q < .5 ? 1 : 2], (q % .5) * 2); p.position.set(pp.x, .15 + age * .3, pp.z); p.scale.setScalar(.5 + age * 1.5); });
    h.setFace('shock'); pose(h); sitP(h); h.userData.head.rotation.y = -.6 * k; camAt(1.6, 1.9, .9, -.9, 1.0, -1.7, 50, t, t > TS ? .03 : .01); }; });
// 11b "Leaves his coffee!" - steaming mug, alone
shot(67.0, 68.18, () => { const S = office(), st = [...Array(4)].map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .6 })); S.sc.add(s); return s; });
  return t => { st.forEach((s, i) => { const q = (t * .8 + i / 4) % 1; s.position.set(-.55 + Math.sin(q * 6 + i) * .03, .92 + q * .3, -.62); s.scale.setScalar(1 + q * 2); s.material.opacity = .5 * (1 - q); }); S.mug.rotation.z = Math.sin(t * 20) * .03 * Math.exp(-t * 3); camAt(-.3, 1.2, .1, -.55, .88, -.62, 36, t, .004); }; });
// 11c "Leaves his laptop!" - spreadsheet still open
shot(68.18, 69.45, () => { const S = office(); S.disp.material = new THREE.MeshBasicMaterial({ map: ctex(256, 160, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8d0d8'; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = '#2a8a3a'; g.fillRect(0, 0, w, 16); g.fillStyle = '#16121a'; g.font = '900 15px Nunito'; g.fillText('CANDIDATES.xls', 6, 12); g.fillStyle = '#e8323a'; g.font = '900 22px Nunito'; g.fillText('NOT THIS GUY', 50, 90); }) });
  return t => { camAt(.45, 1.12, -1.35, .42, .9, -.75, 38, t, .004); }; });
// 11d "Leaves YOU!" - alone in the office, crickets
shot(69.45, 71.4, () => { const S = office(), h = dressHero(person(HERO)); S.sc.add(h); heroSit(S, h); return t => { h.setFace('worried'); pose(h); sitP(h); h.userData.head.rotation.y = Math.sin(t * 2.5) * .5; camAt(1.8, 2.4, -2.0, 0, .8, .1, 50, t, .004); }; });
// 12 "So you sit in his chair. Feet up on the desk. Congratulations... you're the boss now." - feet up, nameplate flips, confetti
shot(71.4, 999, () => { const S = office(), h = dressHero(person(HERO)), conf = [...Array(40)].map((_, i) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(.05, .03), new THREE.MeshBasicMaterial({ color: [0xe8323a, 0xf2c230, 0x3a6ad8, 0x3ab86a, 0xe86ad8][i % 5], side: THREE.DoubleSide })); S.sc.add(c); return c; }); S.sc.add(h); const TF = L(73.24, 71.4), TC = L(75.17, 71.4), TB = L(77.22, 71.4);
  return t => { const sitk = clamp(t / .8); h.position.set(0, SEAT + .02, lerp(-.95, -1.5, sitk)); h.rotation.y = lerp(Math.PI, 0, sitk); h.setFace(t < TC ? 'smug' : 'happy'); pose(h, { armL: [-2.7, 0, .7], armR: [-2.7, 0, -.7], elbowL: -1.6, elbowR: -1.6, lean: -ss(TF, TF + .4, t) * .35 });
    const fu = ss(TF, TF + .4, t); h.userData.legs.forEach(l => { l.rotation.x = lerp(-1.45, -1.9, fu); l.userData.knee.rotation.x = lerp(1.45, .05, fu); }); h.userData.body.position.y = -.2 + fu * .12; S.bc.rotation.x = -fu * .15;
    S.plate.userData.draw(t > TB - .1 ? 1 : 0); conf.forEach((c, i) => { const q = t - TC - hash(i) * .3; c.visible = q > 0; c.position.set((hash(i + 3) - .5) * 2.4 + Math.sin(q * 3 + i) * .1, 2.6 - q * .9 - hash(i + 5) * .4, -1.0 + (hash(i + 7) - .5) * 1.4); c.rotation.set(q * 6 + i, q * 4, i); });
    const k = ss(0, 4, t); S.lap.visible = false; camAt(lerp(2.6, 3.0, k), lerp(1.7, 1.85, k), lerp(-1.0, -.8, k), 0, .95, -1.3, 46, t); }; });

// ===================== RENDER =====================
window.__BLEEPS = [];
const built = new Map();
function renderAt(t) { window.__T = t; let i = SH.findIndex((s, k) => t >= s.a && (k + 1 >= SH.length || t < SH[k + 1].a)); if (i < 0) i = 0; const s = SH[i];
  if (!built.has(i)) { for (const k of [...built.keys()]) if (k < i - 1) built.delete(k); const up = s.build(); built.set(i, { up, sc: window.__sc }); }
  const B = built.get(i); B.up(t - s.a); renderer.render(B.sc, cam); og.drawImage(renderer.domElement, 0, 0);
  bubble(t, F(0.05), F(3.0), 'first job interview', W / 2, H * .17, '#ffd23a'); bang(t, F(4.62), 'POP!', '#ffffff', W * .66, H * .3, .1); bang(t, F(6.26), 'BACKWARDS', '#ff8a3a', W / 2, H * .22, -.06);
  bubble(t, F(22.59), F(23.5), 'FIRED: sleeping', W / 2, H * .17, '#ff8a8a'); bubble(t, F(24.04), F(25.0), 'FIRED: stealing', W / 2, H * .17, '#ff8a8a'); bubble(t, F(26.4), F(28.3), 'FIRED: BOTH', W / 2, H * .17, '#ff4a4a');
  bubble(t, F(31.0), F(32.4), 'good sign?', W * .6, H * .17, '#ffffff');
  bang(t, F(34.49), 'WAKING UP', '#ffd23a', W / 2, H * .18, -.05); bang(t, F(35.63), 'MONDAYS', '#ffd23a', W / 2, H * .18, .05); bang(t, F(36.71), 'TUESDAYS', '#ffd23a', W / 2, H * .18, -.05); bang(t, F(39.67), 'WORK', '#ff4a4a', W / 2, H * .18, .06);
  notif(t, F(43.3), F(47.9), 'MOM', 'get a job or ur room is a gym');
  bang(t, F(53.06), 'YOUR JOB', '#ff4a4a', W / 2, H * .2, -.05);
  bang(t, F(60.55), 'F*** NO!', '#ff3030', W / 2, H * .24, -.06); bang(t, F(61.85), 'NOT HIRED', '#ffffff', W / 2, H * .2, .04); bang(t, F(66.4), 'SLAM!', '#ffd23a', W / 2, H * .2, -.05);
  bang(t, F(75.17), 'CONGRATS', '#ffd23a', W / 2, H * .18, -.04); bubble(t, F(77.22), F(78.5) + 2, "I'M THE BOSS", W * .5, H * .17, '#ffd23a');
  caption(t); }
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .9); };
window.renderFrame = i => { renderAt(i / FPS); return out.toDataURL('image/jpeg', .92); };
window.frameCount = NF; window.ready = true;
