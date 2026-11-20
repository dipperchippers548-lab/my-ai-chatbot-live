// "You Broke Your Mom's Favorite Vase" - low-poly flat-shaded character test.
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
  return { scene: sc, vase, ped };
}

// ---------- CAPTION + HUD ----------
function caption(txt) { og.font = '900 104px Nunito'; og.textAlign = 'center'; og.lineJoin = 'round'; const y = H * .64; og.lineWidth = 22; og.strokeStyle = '#000'; og.strokeText(txt, W / 2, y); og.fillStyle = '#ffffff'; og.fillText(txt, W / 2, y); }
function timer(sec) { const x = W / 2, y = 250; og.fillStyle = '#e8423a'; og.beginPath(); og.roundRect(x - 210, y - 70, 420, 120, 30); og.fill(); og.fillStyle = '#fff'; og.font = '900 46px Nunito'; og.textAlign = 'center'; og.fillText('MOM HOME IN', x, y - 20); og.font = '900 64px Nunito'; og.fillText(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, x, y + 38); }

// ---------- TEST SHOTS ----------
const shots = [
  () => { const R = livingRoom(), d = person(DALE); d.position.set(-.5, 0, -.6); d.rotation.y = .25; R.scene.add(d); d.setFace('calm'); pose(d); const cam = new THREE.PerspectiveCamera(42, W / H, .1, 50); cam.position.set(.2, 1.5, 3.4); cam.lookAt(-.5, 1.05, -.6); return { R, cam, hud: () => { timer(600); caption('YOU BROKE'); } }; },
  () => { const R = livingRoom(), d = person(DALE); d.position.set(-.8, 0, -1.0); d.rotation.y = .35; R.scene.add(d); d.setFace('shock'); pose(d, { armL: [-1.2, 0, .4], armR: [-1.2, 0, -.4], lean: .1 }); R.vase.visible = false; for (let i = 0; i < 7; i++) { const s = mesh(lowpoly(new THREE.TetrahedronGeometry(.08 + (i % 3) * .03, 0), .02, i), 0x3a6ad8); s.position.set(-1.0 + Math.cos(i * 2.1) * .4, .05, -1.2 + Math.sin(i * 2.1) * .35); s.rotation.set(i, i * 2, 0); R.scene.add(s); }
    const cam = new THREE.PerspectiveCamera(40, W / H, .1, 50); cam.position.set(-.3, 1.4, 1.9); cam.lookAt(-.9, 1.0, -1.0); return { R, cam, hud: () => { timer(588); caption('FAVORITE'); } }; },
  () => { const R = livingRoom(), d = person(DALE), m = person(MOM); d.position.set(-.55, 0, -.3); d.rotation.y = .5; m.position.set(.55, 0, -.4); m.rotation.y = -.5; m.scale.setScalar(1.12); R.scene.add(d, m); d.setFace('worried'); m.setFace('mad'); pose(d, { armL: [.2, 0, .5], armR: [-.4, 0, -.2] }); pose(m, { armL: [0, 0, .9], armR: [0, 0, -.9] });
    const cam = new THREE.PerspectiveCamera(44, W / H, .1, 50); cam.position.set(0, 1.45, 3.4); cam.lookAt(0, 1.05, -.35); return { R, cam, hud: () => caption("YOU'RE GROUNDED") }; },
  () => { const R = livingRoom(), d = person(DALE); d.position.set(0, 0, 0); R.scene.add(d); d.setFace('happy'); pose(d, { armL: [0, 0, 2.6], armR: [0, 0, -2.6] }); const cam = new THREE.PerspectiveCamera(40, W / H, .1, 50); cam.position.set(1.2, 1.2, 2.6); cam.lookAt(0, 1.0, 0); return { R, cam, hud: () => caption('GENIUS') }; },
];
window.renderTime = i => { const s = shots[Math.round(i)](); renderer.render(s.R.scene, s.cam); og.drawImage(renderer.domElement, 0, 0); s.hud(); return out.toDataURL('image/jpeg', .9); };
window.captionChunks = []; window.frameCount = 0; window.ready = true;
