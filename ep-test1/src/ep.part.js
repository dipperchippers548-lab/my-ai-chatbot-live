// ================= EPISODE TEST 1: "the headset" =================
// 0-4 real world (smooth, soft rendering) -> glitch + cube tunnel -> pops into the low-poly world -> his lines (lip-synced) -> the cow
const VO = 6.6, ECHO = [12.25, 13.35, 14.45, 15.55], COW = 16.9, DUR = 18.7;   // voice start; echo onsets of "MY HANDS"; the cow; total                 // voice starts at VO (s); total length
const ME = { skin: 0xe2a57f, hair: 0x4a2a16, top: 0x3fae5a, pants: 0x2a3a5a, iris: '#4a6a3a', hairH: .15, shoes: 0xf2f2f2, seed: .9 };
const mouth = await (await fetch('/build/mouth.json')).json();
const mouthAt = t => { const i = Math.round((t - VO) * mouth.rate); return i >= 0 && i < mouth.level.length ? mouth.level[i] : 0; };
// lip-sync faces: every emotion x 4 mouth openings (+ blinks)
const MOUTHS = [null, 'o', 'open', 'scream'];
for (const e of ['confused', 'shocked', 'terror', 'dizzy']) for (let l = 0; l < 4; l++) { const k = e + '_' + l; EXPR[k] = { ...EXPR[e], ...(l ? { mouth: MOUTHS[l] } : {}) }; EXPR[k + '_b'] = { ...EXPR[k], open: .07, black: false }; }
const talk = (h, emo, t, amt = 1) => { const l = mouthAt(t); h.face(emo + '_' + l, t); h.head.rotation.x += (l > 1 ? .04 : 0) * Math.sin(t * 17) * amt; return l; };

// ---------- the REAL world: smooth shading, rounder person, dark gamer room ----------
const smooth = o => new THREE.MeshStandardMaterial({ roughness: .75, metalness: 0, ...o });
function makeReal(p) {
  const root = new THREE.Group(), sk = smooth({ color: p.skin }), hood = smooth({ color: p.top }), jean = smooth({ color: p.pants }), hairM = smooth({ color: p.hair, roughness: .9 });
  const cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m);
  const torso = new THREE.Group(); torso.position.y = .05; root.add(torso);
  const ch = cap(.2, .36, hood); ch.position.y = .3; ch.scale.z = .75; torso.add(ch);
  const head = new THREE.Group(); head.position.y = .78; torso.add(head);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 16), sk); hd.scale.set(.95, 1.12, 1.02); head.add(hd);
  const hr = new THREE.Mesh(new THREE.SphereGeometry(.137, 20, 12, 0, Math.PI * 2, 0, Math.PI * .55), hairM); hr.rotation.x = -.25; hr.position.y = .02; head.add(hr);
  const ns = cap(.055, .08, sk); ns.position.y = .68; torso.add(ns);
  // VR headset: visor, foam, strap, lights
  const vr = new THREE.Group(); vr.position.set(0, .02, .1); head.add(vr);
  const vis = new THREE.Mesh(new THREE.BoxGeometry(.25, .13, .11, 2, 2, 2), smooth({ color: 0xf2f2f4, roughness: .35 })); vis.position.z = .05; vr.add(vis);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.2, .08), new THREE.MeshBasicMaterial({ color: 0x1a1a22 })); face.position.z = .106; vr.add(face);
  const leds = [-.06, 0, .06].map(x => { const l = new THREE.Mesh(new THREE.CircleGeometry(.01, 8), new THREE.MeshBasicMaterial({ color: 0x4ad8ff })); l.position.set(x, -.03, .107); vr.add(l); return l; });
  const strap = new THREE.Mesh(new THREE.TorusGeometry(.15, .018, 6, 24), smooth({ color: 0x2a2a30 })); strap.scale.set(1, .5, 1.1); strap.rotation.x = Math.PI / 2; strap.position.set(0, 0, -.06); vr.add(strap);
  const arms = [], fore = [], ctrls = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * .24, .55, 0); torso.add(a); arms.push(a); const ua = cap(.065, .2, hood); ua.position.y = -.14; a.add(ua);
    const f = new THREE.Group(); f.position.y = -.3; a.add(f); fore.push(f); const fa = cap(.055, .2, hood); fa.position.y = -.13; f.add(fa);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 10), sk); hand.position.y = -.3; f.add(hand);
    const c = new THREE.Group(); c.position.set(0, -.32, .03); f.add(c); const grip = cap(.03, .1, smooth({ color: 0x1c1c22 })); grip.rotation.x = .5; c.add(grip); const ring = new THREE.Mesh(new THREE.TorusGeometry(.06, .012, 6, 18), smooth({ color: 0x2a2a30 })); ring.position.set(0, .07, .05); ring.rotation.x = 1.2; c.add(ring); ctrls.push(c);
  }
  for (const s of [-1, 1]) { const th = cap(.09, .3, jean); th.rotation.x = Math.PI / 2; th.position.set(s * .11, .02, .2); root.add(th); const sh = cap(.075, .32, jean); sh.position.set(s * .11, -.22, .4); root.add(sh); const shoe = new THREE.Mesh(new THREE.BoxGeometry(.11, .07, .24), smooth({ color: 0xf2f2f2 })); shoe.position.set(s * .11, -.42, .46); root.add(shoe); }
  return { root, torso, head, arms, fore, leds, vr };
}
function realRoom() {
  const scene = new THREE.Scene(), cam = newCam(42); scene.add(cam); scene.background = new THREE.Color(0x07070c);
  scene.add(new THREE.AmbientLight(0x4a4a6a, 1.6)); const key = new THREE.SpotLight(0x9ab8ff, 22, 7, .6, .7); key.position.set(1.4, 2.4, 2.0); key.target.position.set(0, 1.1, .2); scene.add(key, key.target);
  const mon = new THREE.PointLight(0x7ab0ff, 8, 6); mon.position.set(0, 1.25, 1.6); scene.add(mon);
  const rgb = new THREE.PointLight(0xb04aff, 10, 7); rgb.position.set(-1.4, 1.9, 2.4); scene.add(rgb);
  const back = new THREE.SpotLight(0xffc89a, 12, 8, .5, .8); back.position.set(1.8, 2.8, -1.8); back.target.position.set(0, .9, 0); back.castShadow = true; scene.add(back, back.target);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), smooth({ color: 0x2a2228 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), smooth({ color: 0x1c1c26 })); wall.position.set(0, 2, 2.8); wall.rotation.y = Math.PI; scene.add(wall);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(3.4, .03, .02), new THREE.MeshBasicMaterial({ color: 0xc05aff })); strip.position.set(0, 2.2, 2.77); scene.add(strip);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.0), new THREE.MeshBasicMaterial({ color: 0x3a1a4a })); poster.position.set(1.5, 1.6, 2.78); poster.rotation.y = Math.PI; scene.add(poster);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, .05, .7), smooth({ color: 0x18181c })); desk.position.set(0, .75, 2.1); scene.add(desk);
  for (const x of [-.85, .85]) { const lg = new THREE.Mesh(new THREE.BoxGeometry(.05, .75, .6), smooth({ color: 0x111114 })); lg.position.set(x, .37, 2.1); scene.add(lg); }
  const D = dynTex(96, 54), scr = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .56), new THREE.MeshBasicMaterial({ map: D.t })); scr.position.set(0, 1.18, 2.38); scr.rotation.y = Math.PI; scene.add(scr);
  const bez = new THREE.Mesh(new THREE.BoxGeometry(1.06, .62, .04), smooth({ color: 0x0c0c0e })); bez.position.set(0, 1.18, 2.41); scene.add(bez);
  const can = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .12, 14), smooth({ color: 0x3ad86a, metalness: .5, roughness: .3 })); can.position.set(.6, .84, 1.95); scene.add(can);
  // gaming chair
  const chair = new THREE.Group(); scene.add(chair); const blk = smooth({ color: 0x141418 }), red = smooth({ color: 0xc8202a });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.6, .12, .55), blk); seat.position.y = .5; chair.add(seat); const bk = new THREE.Mesh(new THREE.BoxGeometry(.58, .95, .12), blk); bk.position.set(0, 1.0, -.3); bk.rotation.x = -.12; chair.add(bk);
  for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(.06, .9, .125), red); st.position.set(s * .2, 1.0, -.295); st.rotation.x = -.12; chair.add(st); }
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .4, 10), smooth({ color: 0x555555, metalness: .7, roughness: .3 })); post.position.y = .25; chair.add(post);
  const P = makeReal(ME); P.root.position.set(0, .58, 0); scene.add(P.root);
  scene.traverse(o => { if (o.isMesh) { o.castShadow = o.material.isMeshStandardMaterial; o.receiveShadow = true; } });
  return { scene, cam, P, D, can, mon, setScreen(t, err) { const g = D.g; if (!err) { g.fillStyle = '#10204a'; g.fillRect(0, 0, 96, 54); for (let i = 0; i < 6; i++) { g.fillStyle = ['#ff4a8a', '#4affd8', '#ffd84a'][i % 3]; g.fillRect((i * 17 + t * 40) % 96, 10 + (i * 13) % 34, 8, 8); } } else { g.fillStyle = Math.sin(t * 30) > 0 ? '#b80000' : '#3a0000'; g.fillRect(0, 0, 96, 54); g.fillStyle = '#ffffff'; g.font = 'bold 14px monospace'; g.textAlign = 'center'; g.fillText('ERROR', 48, 32); } D.t.needsUpdate = true; } };
}
function arcs(scene, n = 5) { return [...Array(n)].map(() => { const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: 0x9ae8ff }); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.006, .06, .006), m); b.position.y = k * .05; b.rotation.z = (k % 2 ? .7 : -.7); g.add(b); } scene.add(g); return g; }); }

// ---------- the cube tunnel ----------
function tunnel() { const scene = new THREE.Scene(), cam = newCam(70); scene.add(cam); scene.background = new THREE.Color(0x05020a); const r = rng(77), cs = [];
  for (let i = 0; i < 220; i++) { const a = r() * Math.PI * 2, rad = 1.2 + r() * 1.6, c = new THREE.Mesh(new THREE.BoxGeometry(.25, .25, .25), new THREE.MeshBasicMaterial({ color: [0x4affd8, 0xff4a8a, 0xffd84a, 0x7a5aff, 0xffffff][i % 5] })); c.position.set(Math.cos(a) * rad, Math.sin(a) * rad, -i * .45); c.rotation.set(r() * 3, r() * 3, 0); scene.add(c); cs.push(c); }
  return { scene, cam, cs }; }

// ---------- the LOW-POLY world: endless grid of the same house, checker grass, odd sky ----------
const skyOdd = ctex(64, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#3ad0ff'); gr.addColorStop(.55, '#8ae8ff'); gr.addColorStop(1, '#ffd8f0'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128); });
const checkT = wrap(ctex(16, 16, g => { g.fillStyle = '#6ad04a'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#5ab83e'; g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8); }));
function makeHouse() { const g = new THREE.Group(); g.add(box(2.2, 1.6, 2, mat({ color: 0xf2e2c0 }), 0, .8, 0)); const tri = new THREE.Shape(); tri.moveTo(-1.3, 0); tri.lineTo(1.3, 0); tri.lineTo(0, 1.0); tri.closePath(); const rf = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 2.2, bevelEnabled: false }), mat({ color: 0xd84a3a })); rf.position.set(0, 1.6, -1.1); g.add(rf); g.add(box(.45, .8, .02, mat({ color: 0x6a3a22 }), 0, .4, 1.01)); for (const x of [-.65, .65]) g.add(box(.4, .4, .02, bmat({ color: 0x8ad0ff }), x, 1.0, 1.01)); return g; }
function makeCow() { const g = new THREE.Group(), w = mat({ color: 0xf4f4f0 }), k = mat({ color: 0x1a1a1a }), pk = mat({ color: 0xf0a0b0 }); g.add(box(1.3, .7, .7, w, 0, .95, 0)); for (const [x, y, z] of [[.2, 1.15, .36], [-.35, .9, .36], [.1, .8, -.36]]) g.add(box(.3, .25, .01, k, x, y, z)); for (const [x, z] of [[-.45, -.22], [-.45, .22], [.45, -.22], [.45, .22]]) g.add(box(.16, .62, .16, w, x, .31, z));
  const hd = new THREE.Group(); hd.position.set(.78, 1.25, 0); g.add(hd); hd.add(box(.45, .42, .42, w)); hd.add(box(.2, .2, .44, pk, .2, -.12, 0)); for (const z of [-.12, .12]) { hd.add(box(.02, .07, .07, k, .23, .06, z)); hd.add(box(.06, .14, .06, mat({ color: 0xd8d0b0 }), -.05, .26, z * 1.4)); } g.userData = { hd }; return g; }
function world() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyOdd; scene.fog = new THREE.Fog(0xbfefff, 25, 90);
  scene.add(new THREE.HemisphereLight(0xdff6ff, 0x6a8a4a, 1.8)); const sun = new THREE.DirectionalLight(0xfff4e0, 2.4); sun.position.set(8, 14, 6); sun.castShadow = true; Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0015; scene.add(sun, sun.target);
  const t = checkT.clone(); t.needsUpdate = true; t.repeat.set(400, 400); const gr = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), mat({ map: t })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  // the same house, hundreds of times (instanced): body, roof, door, two windows
  const tri = new THREE.Shape(); tri.moveTo(-1.3, 0); tri.lineTo(1.3, 0); tri.lineTo(0, 1.0); tri.closePath();
  const parts = [[new THREE.BoxGeometry(2.2, 1.6, 2).translate(0, .8, 0), mat({ color: 0xf2e2c0 })], [new THREE.ExtrudeGeometry(tri, { depth: 2.2, bevelEnabled: false }).translate(0, 1.6, -1.1), mat({ color: 0xd84a3a })],
    [new THREE.BoxGeometry(.45, .8, .02).translate(0, .4, 1.01), mat({ color: 0x6a3a22 })], [new THREE.BoxGeometry(.4, .4, .02).translate(-.65, 1.0, 1.01), bmat({ color: 0x8ad0ff })], [new THREE.BoxGeometry(.4, .4, .02).translate(.65, 1.0, 1.01), bmat({ color: 0x8ad0ff })]];
  const spots = []; for (let i = -22; i <= 22; i++) for (let j = 1; j <= 24; j++) for (const s of [-1, 1]) spots.push([i * 7, -s * (4 + (j - 1) * 7 + (j > 1 ? Math.floor((j - 1) / 2) * 3 : 0)), s > 0 ? 0 : Math.PI]);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  for (const [g, m] of parts) { const im = new THREE.InstancedMesh(g, m, spots.length); spots.forEach(([x, z, ry], k) => im.setMatrixAt(k, M4.compose(V(x, 0, z), Q.setFromAxisAngle(V(0, 1, 0), ry), one))); im.castShadow = im.receiveShadow = !m.isMeshBasicMaterial; scene.add(im); }
  const r = rng(4); for (let i = 0; i < 10; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + r() * 2, 0), bmat({ color: 0xffffff, fog: false })); c.scale.y = .45; c.position.set((r() - .5) * 120, 22 + r() * 10, -40 - r() * 30); scene.add(c); }
  const H = makeHuman(ME); scene.add(H.root);
  return { scene, cam, H, sun };
}
// glitch strength over the whole timeline (used by the post pass)
const glitchAt = t => Math.max(t > 3.3 && t < 4.6 ? ss(3.3, 4.6, t) * (Math.sin(t * 40) > -.3 ? 1 : .3) : 0, t > 4.6 && t < 5.4 ? 1 - ss(4.6, 5.4, t) : 0, [5.25, 5.55, 5.85].reduce((a, k) => Math.max(a, 1 - Math.abs(t - k) / .06), 0));
const flashAt = t => Math.max(t > 4.55 ? Math.exp(-(t - 4.55) * 7) * (t < 5.2 ? 1 : 0) : 0, 0);

// ---------- shots (t0, t1 in seconds) ----------
const shots = [];
const shot = (t0, t1, build, o = {}) => { const s = { t0, t1, ...o, ...build() }; s.scene.traverse(x => { if (x.isMesh && !x.material.isMeshStandardMaterial) { const m = Array.isArray(x.material) ? x.material[0] : x.material; const basic = m.isMeshBasicMaterial; x.castShadow = !basic && !m.transparent; x.receiveShadow = !basic; } }); shots.push(s); };
function vrPlay(P, t, k = 1) { // swinging the controllers around like he's in a sword game
  P.arms[0].rotation.x = -1.1 + Math.sin(t * 3.1) * .7 * k; P.arms[0].rotation.z = -.3 - Math.sin(t * 2.3) * .3 * k; P.fore[0].rotation.x = -.6 - Math.sin(t * 3.1 + 1) * .4 * k;
  P.arms[1].rotation.x = -1.3 + Math.sin(t * 2.7 + 2) * .8 * k; P.arms[1].rotation.z = .3 + Math.sin(t * 1.9) * .3 * k; P.fore[1].rotation.x = -.7 - Math.sin(t * 2.7 + 3) * .4 * k;
  P.head.rotation.y = Math.sin(t * 1.7) * .4 * k; P.head.rotation.x = Math.sin(t * 2.2) * .12 * k; P.torso.rotation.y = Math.sin(t * 1.4) * .15 * k; }
// A: the room, from behind his chair: he's in VR, swinging
shot(0, 2.3, () => { const R = realRoom();
  return { scene: R.scene, cam: R.cam, real: true, update(f, fd, t) { R.setScreen(t, false); vrPlay(R.P, t); R.P.leds.forEach(l => l.material.color.setHex(0x4ad8ff));
    look(R.cam, lerp(1.9, 1.6, f / fd), 1.5, lerp(1.45, 1.25, f / fd), -.05, 1.2, .2); handheld(R.cam, t, .004); } }; }, { dof: { b: 1.4, x: .5, y: .5, r: .45 } });
// B: close on the headset: it starts to glitch - red lights, ERROR on the monitor, sparks, he freezes
shot(2.3, 4.0, () => { const R = realRoom(), ar = arcs(R.scene);
  return { scene: R.scene, cam: R.cam, real: true, update(f, fd, t) { const bad = t > 3.0, k = 1 - ss(2.9, 3.3, t); R.setScreen(t, bad); vrPlay(R.P, t, k); R.P.leds.forEach((l, i) => l.material.color.setHex(bad && Math.sin(t * 25 + i) > 0 ? 0xff2020 : (bad ? 0x300000 : 0x4ad8ff)));
    R.P.root.position.x = bad ? Math.sin(t * 70) * .006 : 0; R.mon.color.setHex(bad ? 0xff3030 : 0x7ab0ff);
    const v = wp(R.P.vr, 0, 0, .05); ar.forEach((a, i) => { a.visible = t > 3.4 && Math.sin(t * 50 + i * 7) > .2; a.position.set(v.x + Math.sin(i * 2.1 + t * 9) * .16, v.y + Math.cos(i * 1.7 + t * 7) * .1, v.z + .02); a.rotation.z = t * 20 + i; });
    look(R.cam, v.x + .55, v.y + .05, v.z + .65 - f * .12, v.x, v.y - .02, v.z); if (bad) shake(R.cam, t, .004); } }; }, { dof: { b: 1.8, x: .5, y: .45, r: .35 } });
// C: sucked through the cube tunnel
shot(4.0, 5.2, () => { const T = tunnel();
  return { scene: T.scene, cam: T.cam, update(f, fd, t) { const z = -f * f * 60; look(T.cam, Math.sin(t * 9) * .1, Math.cos(t * 7) * .1, z, 0, 0, z - 10); T.cam.rotation.z = f * 3; } }; });
// D: the low-poly world: he blinks in at the wrong spots, then drops face-first
const LAND = 6.3, POPS = [[5.25, -1.4, 2.6, Math.PI, 0], [5.55, 1.3, 1.8, 0, 1.57], [5.85, 0, 3.0, .4, .3]];
shot(5.2, VO, () => { const W = world(), ds = [...Array(10)].map((_, i) => { const d = new THREE.Mesh(new THREE.IcosahedronGeometry(.08, 0), mat({ color: 0xd8f0c0, transparent: true })); d.userData = i; W.scene.add(d); return d; });
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); let p = POPS.filter(q => t >= q[0]).pop();
    H.root.visible = !!p;
    if (p && p !== POPS[2]) { H.root.position.set(0, p[2], p[1]); H.root.rotation.set(0, 0, p[3] + p[4]); H.face('shocked'); H.arms.forEach((a, i) => a.rotation.z = (i ? 1 : -1) * 1.2); }
    if (p === POPS[2]) { const a = t - 5.85, k = clamp(a / (LAND - 5.85)); H.root.position.set(0, lerp(3.0, .2, k * k), lerp(0, -.6, k)); H.root.rotation.set(lerp(.3, Math.PI / 2, k), 0, 0); H.face(k < 1 ? 'scream' : 'dizzy'); H.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (1.2 + Math.sin(t * 30) * .4) * (1 - k); a.rotation.x = -k * 2.6; }); H.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 25 + i * 3) * .5 * (1 - k)); }
    ds.forEach(d => { const i = d.userData, an = i * .63, q = clamp((t - LAND) * 2); d.visible = t > LAND && q < 1; d.position.set(Math.cos(an) * q * 1.1, .1 + q * .5 * (1 - q) * 2, .4 + Math.sin(an) * q * 1.1); d.scale.setScalar(1 - q * .7); });
    look(W.cam, 7.5, 2.0, .6, 0, 1.3, 0); if (t > LAND) shake(W.cam, t, .04 * Math.exp(-(t - LAND) * 8)); handheld(W.cam, t, .003); } }; }, { dof: { b: 1.2, x: .5, y: .5, r: .45 } });
// E: "Umm... how did I get here??" - he pushes up and sits, looking around, lip-synced
const SCREAM = VO + 3.85, POV0 = VO + 3.3;
shot(VO, POV0, () => { const W = world();
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset();
    const up = ss(.0, .9, f); H.root.position.set(0, lerp(.2, 0, up), lerp(-.6, 0, up)); H.root.rotation.set(lerp(Math.PI / 2, 0, up), 0, 0);
    H.legs.forEach(l => l.rotation.x = -1.5 * up); H.shins.forEach(s => s.rotation.x = 1.4 * up); H.body.position.y = -.4 * up; H.legs[0].rotation.y = -.25 * up; H.legs[1].rotation.y = .25 * up;
    H.arms.forEach((a, i) => { a.rotation.x = lerp(-2.6, -.3, up); a.rotation.z = (i ? 1 : -1) * .35 * up; }); H.fore.forEach(fr => fr.rotation.x = -.4 * up);
    H.breathe(t, .6); H.neck.rotation.y = up > .9 ? Math.sin((f - .9) * 2.2) * .55 : 0; H.neck.rotation.z = Math.sin(f * 1.3) * .06; talk(H, f < 1.0 ? 'dizzy' : 'confused', t);
    const fc = faceAt(H); look(W.cam, fc.x + .5, fc.y + .1, fc.z + lerp(1.4, 1.75, f / fd), fc.x, fc.y - .15, fc.z); handheld(W.cam, t, .004); } }; }, { dof: { b: 1.6, x: .5, y: .42, r: .38 } });
// F: first person: he looks down and his square hands rise into view... then shake as he starts screaming
shot(POV0, SCREAM + .45, () => { const W = world();
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); H.sit(); H.body.position.y = -.4; H.legs.forEach(l => l.rotation.x = -1.5); H.shins.forEach(s => s.rotation.x = 1.4); H.head.visible = false; H.root.updateMatrixWorld(true);
    const eye = wp(H.neck, 0, .28, .12), rise = ss(.05, .5, f), sh = t > SCREAM ? .02 : 0;
    for (const i of [0, 1]) ik(H, i, eye.clone().add(V((i ? 1 : -1) * .13 + Math.sin(t * 40 + i) * sh, lerp(-.65, -.02, rise) + Math.cos(t * 37 + i) * sh, .38)));
    H.fore.forEach(fr => fr.rotation.z += 0); look(W.cam, eye.x, eye.y, eye.z, eye.x, eye.y - lerp(.35, .12, rise), eye.z + 1); W.cam.fov = 70; W.cam.updateProjectionMatrix(); if (t > SCREAM) shake(W.cam, t, .01); handheld(W.cam, t, .004); } }; }, { dof: { b: 1.0, x: .5, y: .6, r: .5 } });
// G: "AHH MY HANDS!" - he leaps up screaming, arms flailing... then on every echo the camera snaps further out: far, farther, way up
const ECHO_D = [5, 16, 40, 95];      // camera distance after each echo
shot(SCREAM + .45, COW, () => { const W = world();
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); const j = Math.max(0, Math.sin(Math.min(f / .7, 1) * Math.PI)) * 1.1;
    H.root.position.set(0, j, 0); H.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (2.2 + Math.sin(t * 22 + i * 2) * .5); a.rotation.x = Math.sin(t * 18 + i) * .4; }); H.fore.forEach((fr, i) => fr.rotation.x = -.5 + Math.sin(t * 25 + i) * .4);
    H.legs.forEach((l, i) => l.rotation.x = j > .05 ? Math.sin(t * 20 + i * 3) * .6 : 0); H.shins.forEach(s => s.rotation.x = j > .05 ? .6 : 0); H.neck.rotation.x = -.35; talk(H, 'terror', t, 2);
    W.scene.fog.far = 90 + 600 * ss(ECHO[0], ECHO[3], t); W.scene.fog.near = 25 + 200 * ss(ECHO[0], ECHO[3], t);
    let d = lerp(1.7, 2.6, ss(0, ECHO[0] - (SCREAM + .45), f)); ECHO.forEach((e, k) => { const prev = k ? ECHO_D[k - 1] : 2.6, s_ = spring((t - e) * 1.6); if (t > e) d = lerp(prev, ECHO_D[k], clamp(s_, 0, 1.08)); });
    const fc = faceAt(H), up = clamp((d - 2.6) / 40), tgt = vl(fc, V(0, 0, 0), up); look(W.cam, tgt.x + d * .35, tgt.y + d * lerp(.15, .95, up), tgt.z + d * lerp(.9, .32, up), tgt.x, tgt.y, tgt.z);
    const kick = ECHO.reduce((a, e) => a + (t > e ? Math.exp(-(t - e) * 9) : 0), 0); shake(W.cam, t, .02 * kick * (1 + d * .02)); if (f < .5) shake(W.cam, t, .01); } }; }, { dof: null });
// H: ...the cow.
shot(COW, DUR + .1, () => { const W = world(), cow = makeCow(); W.scene.add(cow); cow.position.set(2.6, 0, -1.5); cow.rotation.y = .9; W.H.root.position.set(-3, 0, -4); W.H.root.rotation.y = .5;
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); H.arms.forEach((a, i) => a.rotation.z = (i ? 1 : -1) * .3); H.face('shocked', t);
    const hd = cow.userData.hd, MOO = .75; hd.rotation.z = Math.sin(t * 3) * .04 + (f > MOO && f < MOO + .8 ? .25 : 0); hd.position.y = 1.25 + (f > MOO && f < MOO + .8 ? .03 * Math.sin(t * 30) : 0);
    const c = wp(hd, 0, 0, 0); look(W.cam, c.x + 1.8, c.y + .05, c.z + .7, c.x - .1, c.y - .1, c.z); handheld(W.cam, t, .002); } }; }, { dof: { b: 1.4, x: .5, y: .45, r: .4 } });
shots.forEach(S => { if (!S.cam.parent) S.scene.add(S.cam); });

// ---------- frame: depth of field, glitch, flash, grain, vignette; soft upscale for the real world, crisp pixels for the low-poly one ----------
const dofA = document.createElement('canvas'); dofA.width = W; dofA.height = H; const dg = dofA.getContext('2d');
function dofDraw(o) {
  if (!o) { lg.drawImage(renderer.domElement, 0, 0); return; }
  const { b = 1.6, x = .5, y = .45, r = .32 } = o;
  lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H); lg.filter = `blur(${b}px)`; lg.drawImage(renderer.domElement, -3, -3, W + 6, H + 6); lg.filter = 'none';
  dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, W, H); dg.drawImage(renderer.domElement, 0, 0);
  dg.globalCompositeOperation = 'destination-in'; const gr = dg.createRadialGradient(x * W, y * H, r * W * .5, x * W, y * H, r * W * 1.3); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, W, H);
  lg.drawImage(dofA, 0, 0);
}
const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d');
function glitch(g, t) {   // slices shoved sideways + an RGB split + a few solid blocks
  if (g <= .02) return; tg.clearRect(0, 0, W, H); tg.drawImage(lo, 0, 0); const r = rng((t * 997) | 0);
  for (let i = 0; i < 14 * g; i++) { const y = r() * H | 0, h = 4 + r() * 40 * g | 0, dx = (r() - .5) * 60 * g | 0; lg.drawImage(tmp, 0, y, W, h, dx, y, W, h); }
  lg.globalCompositeOperation = 'lighter'; lg.globalAlpha = .45 * g; lg.drawImage(tmp, 6 * g, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 6 * g; i++) { lg.fillStyle = ['#ff2a8a', '#2affd8', '#ffffff', '#000000'][i % 4]; lg.fillRect(r() * W, r() * H, 8 + r() * 40, 3 + r() * 10); }
}
const grain = [0, 1, 2].map(i => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), id = g.createImageData(W, H), r = rng(90 + i); for (let k = 0; k < id.data.length; k += 4) { const v = r() * 255 | 0; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; } g.putImageData(id, 0, 0); return c; });
const vig = document.createElement('canvas'); vig.width = W; vig.height = H; { const g = vig.getContext('2d'), gr = g.createRadialGradient(W / 2, H * .46, W * .35, W / 2, H * .46, H * .62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
let frameNo = 0;
function renderAt(t) {
  const s = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1], f = t - s.t0, fd = s.t1 - s.t0;
  s.update(f, fd, t); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam); dofDraw(s.dof);
  lg.globalCompositeOperation = 'overlay'; lg.globalAlpha = s.real ? .12 : .06; lg.drawImage(grain[frameNo++ % 3], 0, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over'; lg.drawImage(vig, 0, 0);
  if (!s.real) { const id = lg.getImageData(0, 0, W, H), d = id.data; for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) { const b = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - .5) * 6; d[i] = clamp(d[i] + b, 0, 255) & 0xFC; d[i + 1] = clamp(d[i + 1] + b, 0, 255) & 0xFC; d[i + 2] = clamp(d[i + 2] + b, 0, 255) & 0xFC; } lg.putImageData(id, 0, 0); }
  glitch(glitchAt(t), t); const fa = flashAt(t); if (fa > .01) { lg.fillStyle = `rgba(255,255,255,${fa})`; lg.fillRect(0, 0, W, H); }
  og.imageSmoothingEnabled = !!s.real; og.drawImage(lo, 0, 0, out.width, out.height);
}
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .93); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(DUR * FPS);
window.captionChunks = []; window.ready = true;
