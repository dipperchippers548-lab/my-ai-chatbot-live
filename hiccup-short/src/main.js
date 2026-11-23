// "You Get Hiccups During the Biggest Test of Your Life" - low-poly flat-shaded short, rendered frame by frame.
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
    L.add(at(mesh(new THREE.CylinderGeometry(.055, .055, .26, 5), o.kind === 'cardigan' ? o.pants : o.skin), 0, -.38, 0));
    if (o.kind !== 'cardigan') L.add(at(mesh(new THREE.CylinderGeometry(.065, .065, .1, 6), o.sock), 0, -.47, 0));
    const sh = new THREE.Group(); sh.position.set(0, -.55, .05); L.add(sh); sh.add(at(mesh(lowpoly(new THREE.BoxGeometry(.19, .1, .32, 2, 1, 2), .03, 7 + s), o.shoe), 0, .03, 0)); sh.add(at(mesh(new THREE.BoxGeometry(.2, .04, .33), o.sole), 0, -.03, 0)); return L; });
  // torso: tapered, low-poly
  const torso = new THREE.Group(); torso.position.y = .62; body.add(torso);
  torso.add(at(mesh(lowpoly(new THREE.CylinderGeometry(.21, .27, .6, 7, 2), .035, 11), o.top), 0, .3, 0));
  if (o.kind === 'hoodie') { torso.add(at(mesh(new THREE.BoxGeometry(.26, .12, .05), o.top2), 0, .2, .245)); const hood = mesh(lowpoly(new THREE.TorusGeometry(.17, .06, 5, 9), .02, 5), o.top2); hood.rotation.x = Math.PI / 2 + .3; hood.position.set(0, .6, -.04); torso.add(hood);
    for (const s of [-1, 1]) torso.add(at(mesh(new THREE.CylinderGeometry(.01, .01, .16, 4), 0xf4f4f0), s * .05, .5, .2)); }
  else { torso.add(at(mesh(new THREE.BoxGeometry(.06, .55, .05), 0xf4ead8), 0, .3, .235)); }
  // arms (shoulder pivot, low-poly sleeve, mitten hand)
  const arms = [-1, 1].map(s => { const A = new THREE.Group(); A.position.set(s * .27, .52, 0); torso.add(A);
    A.add(at(mesh(lowpoly(new THREE.CylinderGeometry(.075, .065, .42, 6), .02, 13 + s), o.top), 0, -.2, 0));
    const hand = at(mesh(lowpoly(new THREE.IcosahedronGeometry(.075, 0), .015, 17 + s), o.skin), 0, -.45, 0); A.add(hand); A.rotation.z = s * .12; A.userData.hand = hand; return A; });
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
  root.userData = { body, torso, arms, legs, head, face };
  root.setFace = e => { face.material.map = faceTex(e); };
  return root;
}
function pose(p, { armL = [0, 0, .12], armR = [0, 0, -.12], lean = 0, headTilt = 0, walk = 0 } = {}) { const u = p.userData;
  u.arms[0].rotation.set(armL[0], armL[1], armL[2]); u.arms[1].rotation.set(armR[0], armR[1], armR[2]); u.torso.rotation.x = lean; u.head.rotation.z = headTilt;
  u.legs[0].rotation.x = Math.sin(walk) * .5; u.legs[1].rotation.x = -Math.sin(walk) * .5; }

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
const F = t => (t - CI.cuts.reduce((s, [a, b]) => s + (t > a ? Math.min(t, b) - a : 0), 0)) / CI.speed;     // voice clock -> final clock
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
function sitP(p) { p.userData.legs.forEach(l => l.rotation.x = -1.45); p.userData.body.position.y = -.2; }
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
function bubble(t, t0, t1, txt, x, y, col = '#ffffff') { if (t < t0 || t > t1) return; const k = pop(t - t0); og.save(); og.translate(x, y); og.scale(k, k); og.font = '900 84px Nunito'; const w = og.measureText(txt).width + 80; og.fillStyle = col; og.strokeStyle = '#16121a'; og.lineWidth = 10; og.beginPath(); og.roundRect(-w / 2, -70, w, 120, 50); og.fill(); og.stroke(); og.beginPath(); og.moveTo(-30, 46); og.lineTo(-60, 110); og.lineTo(10, 48); og.closePath(); og.fill(); og.stroke(); og.fillStyle = '#16121a'; og.textAlign = 'center'; og.fillText(txt, 0, 18); og.restore(); }
const HICS = [9.49, 15.23, 22.13, 27.34, 31.79];
let HERO_WP = null;   // hero chest in world space, for rings

// 1 "You get hiccups in the middle of the biggest fucking test of your life." - FIRST FRAME: the packed exam room, everyone scribbling; push in on him
shot(0, 2.9, () => { const C = classroom(); return t => { kidsIdle(C, t); const h = heroAt(C, {}, t < 1.2 ? 'calm' : 'worried'); pose(h, { armL: [-1.1, 0, .3], armR: [-1.2 + Math.sin(t * 9) * .05, 0, -.3], lean: .25 }); sitP(h); camAt(lerp(.6, .3, t / 2), lerp(3.2, 2.4, t / 2), lerp(4.6, 2.6, t / 2), 0, 1.0, -.3, 46, t); }; });
// 2 "...test of your life" - the paper: FINAL EXAM, sweat drop
shot(2.9, 4.6, () => { const C = classroom(); return t => { kidsIdle(C, t); const h = heroAt(C, {}, 'worried'); pose(h, { armL: [-1.1, 0, .3], armR: [-1.2, 0, -.3], lean: .25 }); sitP(h); C.hero.userData.paper.rotation.z = Math.PI; camAt(.08, 1.4, -1.55, 0, .98, -.55, 42, t, .003); }; });
// 3 "The teacher looks up and says," - low angle: she lowers her glasses-stare over the class
shot(4.6, 6.3, () => { const C = classroom(), tc = person(TEACH); tc.position.set(-1.6, 0, -3.9); C.scene.add(tc); return t => { kidsIdle(C, t); heroAt(C); tc.setFace(t < .4 ? 'calm' : 'mad'); pose(tc, { armL: [-.9, 0, .4], armR: [-.9, 0, -.4], lean: .15 - ss(0, .4, t) * .15 }); camAt(-1.0, 1.0, -2.5, -1.6, 1.75, -3.9, 44, t); }; });
// 4 "Not. One. Fucking. Sound." - a punch-in on every word
shot(6.3, 9.3, () => { const C = classroom(), tc = person(TEACH); tc.position.set(-1.6, 0, -3.9); C.scene.add(tc); const W4 = [6.41, 7.06, 7.8, 8.55].map(w => L(w, 6.3)); const t00 = F(6.3);
  return t => { kidsIdle(C, t); heroAt(C); const T = t + t00, talking = lvl(T) > .15; tc.setFace(talking ? 'madopen' : 'mad'); pose(tc, { armL: [-.9, 0, .4], armR: [-1.6, 0, -.1] }); const n = W4.filter(w => t >= w).length; const d = [2.6, 1.9, 1.35, .95, .95][n]; camAt(-1.6 + (n % 2 ? .12 : -.12), 1.72, -3.9 + d, -1.6, 1.68, -3.9, 40, t, .004); }; });
// 5 "Hic." - a tiny one
shot(9.3, 10.1, () => { const C = classroom(); return t => { kidsIdle(C, t); const h = heroAt(C, {}, t < .1 ? 'calm' : 'shock'); pose(h, { armL: [-1.1, 0, .3], armR: [-1.2, 0, -.3], lean: .25 - pop(t - .1) * .15 }); sitP(h); h.position.y = Math.max(0, Math.sin((t - .1) * 12)) * .04 * (t > .1 && t < .4); h.updateMatrixWorld(true); HERO_WP = h.userData.torso.localToWorld(V(0, .35, 0)); camAt(.1, 1.55, -1.6, 0, 1.3, -.3, 40, t, .004); }; });
// 6 "So you hold your breath." - cheeks puffed
shot(10.1, 11.85, () => { const C = classroom(); return t => { kidsIdle(C, t); const h = heroAt(C, {}, 'puff'); pose(h, { armL: [-.6, 0, .9], armR: [-.6, 0, -.9] }); sitP(h); h.userData.head.scale.set(1 + .06 * ss(0, .5, t), 1, 1); camAt(.25, 1.6, -1.8, 0, 1.4, -.3, 38, t, .004); }; });
// 7 "Ten seconds. Twenty." - the clock ticks... back on him
shot(11.85, 14.0, () => { const C = classroom(), TT = L(13.11, 11.85); return t => { kidsIdle(C, t); const h = heroAt(C, {}, 'puff'); pose(h, { armL: [-.6, 0, .9], armR: [-.6, 0, -.9] }); sitP(h); C.clock.userData.hand.rotation.z = -Math.floor(t * 4) * .26; tintSkin(h, DALE.skin, 0x8a5ac8, ss(TT, TT + 1, t) * .4);
    if (t < TT) camAt(2.6, 2.5, -3.2, 2.6, 2.6, -4.37, 36, t, .003); else camAt(.25, 1.6, -1.8, 0, 1.4, -.3, 38, t, .004); }; });
// 8 "You turn purple." - fully purple, vibrating
shot(14.0, 15.2, () => { const C = classroom(); return t => { kidsIdle(C, t); const h = heroAt(C, {}, 'puff'); pose(h, { armL: [-.6, 0, .9], armR: [-.6, 0, -.9] }); sitP(h); tintSkin(h, DALE.skin, 0x8a5ac8, .4 + ss(0, .6, t) * .6); h.position.x = HX + Math.sin(t * 60) * .01; h.userData.head.scale.set(1.08 + .04 * Math.sin(t * 20), 1, 1.05); camAt(.1, 1.55, -1.3, 0, 1.45, -.3, 36, t, .004); }; });
// 9 "HIC. Your desk jumps an inch off the floor." - side view: kid AND desk hop
shot(15.2, 17.9, () => { const C = classroom(), TD = L(16.37, 15.2); return t => { kidsIdle(C, t); const h = heroAt(C, {}, t < .05 ? 'puff' : 'shock'); pose(h, { armL: [-.4, 0, .9], armR: [-.4, 0, -.9] }); sitP(h); tintSkin(h, DALE.skin, 0x8a5ac8, Math.max(0, 1 - t * 2)); const j = Math.max(0, Math.sin(t * 7)) * .22 * Math.exp(-t * 1.2); h.position.y = j; C.hero.position.y = j * .8; C.hero.rotation.z = j * .2; h.updateMatrixWorld(true); HERO_WP = h.userData.torso.localToWorld(V(0, .35, 0));
    camAt(.62, .95, -1.9, 0, .8, -.3, 46, t); }; });
// 10 "So you drink water upside down." - he's literally upside down on his chair, bottle at his mouth
shot(17.9, 20.3, () => { const C = classroom(), bot = mesh(new THREE.CylinderGeometry(.06, .06, .26, 10), 0x8ad8ff); C.scene.add(bot); return t => { kidsIdle(C, t); const h = heroAt(C, {}, 'calm'); h.rotation.set(0, Math.PI, Math.PI); h.position.set(HX, 2.4, HZ + .1); pose(h, { armL: [-2.6, 0, .4], armR: [-.3, 0, -.3] }); h.updateMatrixWorld(true); h.userData.arms[0].userData.hand.getWorldPosition(bot.position); bot.rotation.z = Math.PI * .1; h.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 3 + i) * .2);
    camAt(.62, 1.1, -2.0, 0, 1.25, -.3, 46, t); }; });
// 11 "It goes up your fucking nose." - close: spray out of the nose
shot(20.3, 22.0, () => { const C = classroom(), sp = [...Array(10)].map(() => { const d = mesh(new THREE.IcosahedronGeometry(.03, 0), 0x8ad8ff); C.scene.add(d); return d; }), TN = L(20.93, 20.3); return t => { kidsIdle(C, t); const h = heroAt(C, {}, t < TN ? 'calm' : 'scream'); h.rotation.set(0, Math.PI, Math.PI); h.position.set(HX, 2.4, HZ + .1); pose(h, { armL: [-2.6, 0, .4], armR: [-.3, 0, -.3] }); h.updateMatrixWorld(true); const nose = h.userData.head.localToWorld(V(0, .24, .32));
    sp.forEach((d, i) => { const k = ((t - TN) * 1.6 + i / 10) % 1; d.visible = t > TN; d.position.set(nose.x + Math.cos(i * 2.4) * k * .5, nose.y - k * .3 + Math.sin(i) * .05, nose.z + k * .6); }); camAt(nose.x + .25, nose.y - .05, nose.z - 1.0, nose.x, nose.y + .05, nose.z, 40, t, .004); }; });
// 12 "HIC. The whole class turns around." - from the front: twenty heads whip round
shot(22.0, 24.5, () => { const C = classroom(), TT = L(23.56, 22.0); return t => { kidsIdle(C, t, ss(TT - .5, TT, t)); const h = heroAt(C, {}, t < .05 ? 'calm' : 'shock'); h.rotation.set(0, Math.PI, 0); h.position.set(HX, Math.max(0, Math.sin(t * 8)) * .3 * Math.exp(-t * 2), HZ + .05); pose(h, { armL: [-.4, 0, .9], armR: [-.4, 0, -.9] }); sitP(h); h.updateMatrixWorld(true); HERO_WP = h.userData.torso.localToWorld(V(0, .35, 0)); camAt(0, 2.4, -4.0, 0, 1.0, .4, 48, t); }; });
// 13 "So your buddy tries to scare them out of you. BOO." - buddy pops up behind him, arms up
shot(24.5, 27.2, () => { const C = classroom(), b = person(BUDDY); C.scene.add(b); const TB = L(26.8, 24.5); return t => { kidsIdle(C, t, 1); const h = heroAt(C, {}, t < TB ? 'worried' : 'shock'); pose(h, { armL: [-1.1, 0, .3], armR: [-1.2, 0, -.3], lean: .1 }); sitP(h); const up = ss(TB - .25, TB, t); b.position.set(HX + .3, -1.0 + up * 1.0, HZ + .75); b.rotation.y = Math.PI; b.setFace(t < TB ? 'smug' : 'madopen'); pose(b, { armL: [0, 0, .3 + up * 2.4], armR: [0, 0, -.3 - up * 2.4] }); camAt(.2, 1.4, -1.8, .15, 1.3, .1, 44, t); }; });
// 14 "HIC. You go straight through the fucking ceiling." - looking up: he rockets into the tiles; tiles burst
shot(27.2, 30.2, () => { const C = classroom(), T0 = L(27.34, 27.2), hole = C.tiles.filter(tl => Math.abs(tl.position.x - HX) < .7 && Math.abs(tl.position.z - HZ) < .7); hole.forEach((tl, i) => tl.userData.v = V((i % 2 ? 1 : -1) * (.5 + i * .2), 2 + i * .4, (i % 3 - 1) * .6)); const TC = L(28.65, 27.2);
  return t => { kidsIdle(C, t, 1); const h = heroAt(C, {}, 'scream'); h.rotation.set(0, Math.PI, 0); const fly = Math.max(0, t - T0); const y = Math.min(5, fly * fly * 3.2); h.position.set(HX, y, HZ + .05); pose(h, { armL: [0, 0, 2.9], armR: [0, 0, -2.9], walk: t * 30 }); h.updateMatrixWorld(true); HERO_WP = h.userData.torso.localToWorld(V(0, .35, 0));
    const hit = Math.max(0, fly - .95); hole.forEach(tl => { tl.position.y = 3.6 + (hit > 0 ? tl.userData.v.y * hit - 5 * hit * hit : 0); tl.position.x += hit > 0 ? tl.userData.v.x * .02 : 0; tl.rotation.x = hit * 6; }); C.hero.position.y = Math.max(0, Math.sin(fly * 10)) * .2 * Math.exp(-fly * 4);
    camAt(.7, .5, -2.1, 0, 2.3, -.3, 62, t); }; });
// 15 "The principal grabs your leg. HIC. Now he's coming with you." - on the roof: he bursts out; the principal hangs off his ankle; HIC - both shoot up
shot(30.2, 33.6, () => { const sc = new THREE.Scene(); sc.background = new THREE.Color(0x8fd0ff); sc.add(new THREE.HemisphereLight(0xffffff, 0x7ac86a, 1.5)); const k = new THREE.DirectionalLight(0xfff0dc, 2.0); k.position.set(3, 7, 4); sc.add(k); window.__sc = sc;
  const g = mesh(new THREE.BoxGeometry(40, .2, 40), 0x6cc85a); g.position.y = -6; sc.add(g); const school = mesh(new THREE.BoxGeometry(10, 6, 8), 0xd8845a); school.position.set(0, -3, 0); sc.add(school); sc.add(at(mesh(new THREE.BoxGeometry(10.4, .3, 8.4), 0x8a8a94), 0, .05, 0)); const holeM = mesh(new THREE.BoxGeometry(.8, .32, .8), 0x16121a); holeM.position.set(0, .06, 0); sc.add(holeM);
  for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1), new THREE.MeshBasicMaterial({ color: 0x9ad8ff })); w.position.set(-3.6 + i * 1.8, -2.5, 4.01); sc.add(w); }
  const h = person(DALE), p = person(PRIN); sc.add(h, p); const T2 = L(31.79, 30.2);
  return t => { const y = .6 + t * .6 + (t > T2 ? (t - T2) * (t - T2) * 5 : 0); h.position.set(0, y, 0); h.setFace('scream'); pose(h, { armL: [0, 0, 2.8], armR: [0, 0, -2.8], walk: t * 4 }); h.updateMatrixWorld(true); const ank = h.userData.legs[0].localToWorld(V(0, -.55, 0));
    p.position.set(ank.x, ank.y - 2.0, ank.z); p.setFace(t < T2 ? 'mad' : 'scream'); pose(p, { armL: [0, 0, 3.0], armR: [0, 0, -2.7], walk: t * 6 }); p.rotation.z = Math.sin(t * 3) * .15; HERO_WP = h.userData.torso.localToWorld(V(0, .35, 0));
    camAt(3.5, y - .5, 6.5, 0, y - .8, 0, 46, t); }; });
// 16 "The school shrinks. The clouds go by. Then the sky goes black." - looking down past their feet as the world drops away
shot(33.6, 37.9, () => { const sc = new THREE.Scene(); window.__sc = sc; sc.add(new THREE.HemisphereLight(0xffffff, 0x7ac86a, 1.5)); const k = new THREE.DirectionalLight(0xfff0dc, 2.0); k.position.set(3, 7, 4); sc.add(k); const top = new THREE.Color(0x8fd0ff), blk = new THREE.Color(0x05060f); sc.background = top.clone();
  const town = new THREE.Group(); sc.add(town); town.add(at(mesh(new THREE.BoxGeometry(80, .2, 80), 0x6cc85a), 0, 0, 0)); town.add(at(mesh(new THREE.BoxGeometry(10, 6, 8), 0xd8845a), 0, 3, 0)); for (let i = 0; i < 30; i++) town.add(at(mesh(new THREE.BoxGeometry(2 + hash(i) * 3, 1 + hash(i + 3) * 3, 2 + hash(i + 5) * 3), [0xf4e4c8, 0xc8504a, 0x9ab0c8, 0xd8a86a][i % 4]), (hash(i * 7) - .5) * 60, 1, (hash(i * 9) - .5) * 60));
  const clouds = [...Array(14)].map((_, i) => { const c = mesh(lowpoly(new THREE.IcosahedronGeometry(1.4 + hash(i) * 1.2, 1), .2, i), 0xffffff); c.scale.y = .5; sc.add(c); return c; });
  const h = person(DALE), p = person(PRIN); sc.add(h, p); const TC = L(35.04, 33.6), TB = L(36.41, 33.6);
  return t => { const alt = 12 + t * t * 14; town.position.y = -alt; town.scale.setScalar(Math.max(.05, 1 - t * .1)); clouds.forEach((c, i) => { const ph = (i / 14 + t * .5) % 1; c.position.set((hash(i * 3) - .5) * 12, 6 - ph * 22, (hash(i * 5) - .5) * 12 - 3); c.visible = t > TC - .8 && t < TB + .3; });
    sc.background.copy(top).lerp(blk, ss(TB, TB + 1.2, t)); h.position.set(0, 0, 0); h.setFace('shock'); pose(h, { armL: [0, 0, 2.8], armR: [0, 0, -2.8], walk: t * 3 }); h.updateMatrixWorld(true); const ank = h.userData.legs[0].localToWorld(V(0, -.55, 0)); p.position.set(ank.x, ank.y - 2.0, ank.z); p.setFace('scream'); pose(p, { armL: [0, 0, 3.0], armR: [0, 0, -2.7] });
    camAt(.6, -4.5, 2.4, 0, -.5, 0, 50, t); }; });
// 17-21 SPACE: "You're floating in fucking space... with the principal... and your test." ... "Nothing." ... "no sound" ... "Not. One. Fucking. Sound." ... "Fucking genius."
function space() { const sc = new THREE.Scene(); window.__sc = sc; sc.background = new THREE.Color(0x05060f); sc.add(new THREE.AmbientLight(0x8a9ac8, .8)); const k = new THREE.DirectionalLight(0xffffff, 2.4); k.position.set(5, 3, 4); sc.add(k);
  const sg = new THREE.BufferGeometry(), pts = []; for (let i = 0; i < 900; i++) { const v = V(hash(i) - .5, hash(i + 1e3) - .5, hash(i + 2e3) - .5).normalize().multiplyScalar(40); pts.push(v.x, v.y, v.z); } sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); sc.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: .12 })));
  const earth = mesh(lowpoly(new THREE.IcosahedronGeometry(9, 3), .15, 7), 0x2a6ad8); earth.position.set(0, -12, -6); sc.add(earth); for (let i = 0; i < 14; i++) { const c = mesh(lowpoly(new THREE.IcosahedronGeometry(2 + hash(i) * 2, 1), .3, i), 0x4aa84a); const d = V(hash(i * 3) - .5, hash(i * 5) * .8, hash(i * 7) - .5).normalize().multiplyScalar(8.1); c.position.copy(d); c.scale.y = .35; c.lookAt(0, 0, 0); earth.add(c); }
  const h = person(DALE), p = person(PRIN); sc.add(h, p); const paper = new THREE.Mesh(new THREE.PlaneGeometry(.45, .6), new THREE.MeshLambertMaterial({ map: PAPER, side: THREE.DoubleSide })); sc.add(paper); return { sc, earth, h, p, paper }; }
shot(37.9, 43.0, () => { const S = space(); return t => { S.earth.rotation.y = t * .05; S.h.position.set(-.5, 0, 0); S.h.rotation.set(Math.sin(t * .5) * .2, .3 + t * .1, .3); S.h.setFace('shock'); pose(S.h, { armL: [0, 0, 1.3], armR: [0, 0, -1.3] });
  S.p.position.set(1.0, -.6, -.6); S.p.rotation.set(.4, -.4 - t * .08, -.5 + t * .05); S.p.setFace('mad'); pose(S.p, { armL: [0, 0, 1.6], armR: [-.5, 0, -1.2] }); S.paper.position.set(lerp(2.5, .3, ss(0, 4, t)), .9, .8); S.paper.rotation.set(t * .4, t * .7, t * .2);
  camAt(0, .9, lerp(6, 4.4, t / 5), .1, .2, 0, 44, t, .02); }; });
shot(43.0, 45.1, () => { const S = space(), TN = L(44.32, 43.0); return t => { S.h.position.set(0, 0, 0); S.h.rotation.set(0, 0, .15); S.h.setFace(t < TN ? 'puff' : 'calm'); pose(S.h, { armL: [0, 0, 1.0], armR: [0, 0, -1.0] }); S.p.position.set(3, -2, -3); camAt(.2, 1.65, 1.5, 0, 1.5, 0, 38, t, .01); }; });
shot(45.1, 47.6, () => { const S = space(); return t => { S.earth.rotation.y = t * .05; S.h.position.set(-.5, 0, 0); S.h.rotation.set(.2, .5, .4 + t * .05); S.h.setFace('calm'); pose(S.h, { armL: [0, 0, 1.3], armR: [0, 0, -1.3] }); S.p.position.set(1.0, -.6, -.6); S.p.rotation.set(.4, -.6, -.4); S.p.setFace('madopen'); pose(S.p, { armL: [0, 0, 2.6], armR: [0, 0, -2.6] }); S.paper.position.set(.4, 1.1, .6); S.paper.rotation.set(t * .4, t * .7, t * .2);
  camAt(lerp(1.5, 2.5, t / 2.5), 2.5, lerp(9, 11, t / 2.5), 0, -1.5, -2, 46, t, .02); }; });
shot(47.6, 50.6, () => { const S = space(), W4 = [47.69, 48.4, 48.99, 49.69].map(w => L(w, 47.6)); return t => { S.h.position.set(0, 0, 0); S.h.rotation.set(0, 0, .12); S.h.setFace('smug'); pose(S.h, { armL: [0, 0, 1.0], armR: [0, 0, -1.0] }); S.p.position.set(.9, .1, -.9); S.p.rotation.set(0, -.5, -.2); S.p.setFace(Math.sin(t * 14) > 0 ? 'madopen' : 'mad'); pose(S.p, { armL: [0, 0, 2.5 + Math.sin(t * 9) * .3], armR: [0, 0, -2.5 - Math.sin(t * 9) * .3] });
  const n = W4.filter(w => t >= w).length; const d = [2.6, 2.6, 2.0, 1.5, 1.15][n]; camAt(.15 + (n % 2 ? .08 : -.08), 1.6, d, .15, 1.5, 0, 40, t, .006); }; });
shot(50.6, 999, () => { const S = space(); S.paper.material.map = APLUS; return t => { S.h.position.set(0, 0, 0); S.h.rotation.set(0, 0, .1); S.h.setFace('happy'); pose(S.h, { armL: [0, 0, .5], armR: [-1.4, 0, -.6] }); S.p.position.set(1.2, -.3, -1.0); S.p.setFace('tired'); pose(S.p, {}); S.paper.position.set(-.55, 1.35, .5); S.paper.rotation.set(0, .3, Math.sin(t) * .1); camAt(.1, 1.45, 2.4, -.1, 1.3, 0, 42, t, .006); }; });

// ===================== RENDER =====================
const built = new Map();
function renderAt(t) { let i = SH.findIndex((s, k) => t >= s.a && (k + 1 >= SH.length || t < SH[k + 1].a)); if (i < 0) i = 0; const s = SH[i];
  if (!built.has(i)) { for (const k of [...built.keys()]) if (k < i - 1) built.delete(k); const up = s.build(); built.set(i, { up, sc: window.__sc }); }
  HERO_WP = null; const B = built.get(i); B.up(t - s.a); renderer.render(B.sc, cam); og.drawImage(renderer.domElement, 0, 0);
  for (const [k, tw] of HICS.entries()) { if (HERO_WP) ring(t, F(tw), HERO_WP, [.5, .9, 1.2, 1.5, 1.8][k]); bubble(t, F(tw), F(tw) + .55, k ? 'HIC!' : 'hic', W * (k % 2 ? .68 : .32), H * .2, '#ffffff'); }
  bubble(t, F(26.8), F(27.3), 'BOO!', W * .6, H * .24, '#ffd23a'); bubble(t, F(44.32), F(45.0), '...', W * .64, H * .24); bubble(t, F(47.69), F(50.5), '!!!', W * .72, H * .3, '#ff8a8a');
  if (t > F(28.6) && t < F(28.6) + .5) bang(t, F(28.65), 'CRASH!', '#ffd23a', W / 2, H * .22, -.06);
  caption(t); }
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .9); };
window.renderFrame = i => { renderAt(i / FPS); return out.toDataURL('image/jpeg', .92); };
window.frameCount = NF; window.ready = true;
