// "He Was Struck By Lightning 7 Times" - semi-realistic 3D short: MPFB (MakeHuman) characters in Three.js, rendered frame by frame.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
const W = 540, H = 960, SCALE = 2, FPS = 30, DUR = 34.51;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const pmrem = new THREE.PMREMGenerator(renderer); const ENV = pmrem.fromScene(new RoomEnvironment(), .04).texture;
const out = document.getElementById('out'); out.width = W * SCALE; out.height = H * SCALE; const og = out.getContext('2d');
const sharp = document.createElement('canvas'); sharp.width = out.width; sharp.height = out.height; const sg = sharp.getContext('2d');
function ctex(w, h, draw, repeat) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); } return t; }
function grain(g, w, h, amt, seed) { const id = g.getImageData(0, 0, w, h), d = id.data, r = rng(seed); for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(id, 0, 0); }
const mat = (o) => new THREE.MeshStandardMaterial({ roughness: .85, metalness: 0, ...o });
const bmat = o => new THREE.MeshBasicMaterial(o);
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; return me; };
const cyl = (r1, r2, h, m, x = 0, y = 0, z = 0, seg = 16) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; return me; };
const newCam = (fov = 50) => new THREE.PerspectiveCamera(fov, W / H, .02, 500);
function skyTex(stops) { return ctex(8, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); stops.forEach(([k, c]) => gr.addColorStop(k, c)); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); }); }
function baseScene(o) {
  const scene = new THREE.Scene(), cam = newCam(o.fov || 50); scene.add(cam); scene.background = skyTex(o.sky); scene.fog = new THREE.Fog(o.fog, o.fogN || 15, o.fogF || 90); scene.environment = ENV; scene.environmentIntensity = o.envI ?? .35;
  const hemi = new THREE.HemisphereLight(o.hemiS || 0xc8d8ff, o.hemiG || 0x40382c, o.hemiI ?? 1.2); scene.add(hemi);
  const sun = new THREE.DirectionalLight(o.sunC || 0xfff0e0, o.sunI ?? 2.2); sun.position.set(...(o.sunP || [6, 10, 5])); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = sc.bottom = -8; sc.right = sc.top = 8; sc.far = 60; sun.shadow.bias = -.0008; scene.add(sun); scene.add(sun.target);
  const flash = new THREE.PointLight(0xcfe0ff, 0, 60, 1.2); scene.add(flash);
  return { scene, cam, sun, hemi, flash };
}
// ---------- characters: MPFB humans posed bone by bone ----------
const GL = new GLTFLoader(), GLB = {}; const EYE_TEX = await new THREE.TextureLoader().loadAsync('/assets/eye_brown.png'); EYE_TEX.flipY = false; EYE_TEX.colorSpace = THREE.SRGBColorSpace;
async function loadGLB(name, url) { GLB[name] = await GL.loadAsync(url); }
const POSES = {};
async function loadPoses(name, url) { const names = await (await fetch(url)).json(), clip = GLB[name].animations[0]; POSES[name] = {};
  names.forEach((n, i) => { const P = POSES[name][n] = {}; clip.tracks.forEach(tr => { const [bn, prop] = tr.name.split('.'); if (prop !== 'quaternion') return; const v = tr.createInterpolant().evaluate(i * 10 / 24); P[bn] = new THREE.Quaternion().fromArray(v).normalize(); }); }); }
function person(name, tint = {}) {
  const root = SkeletonUtils.clone(GLB[name].scene), B = {}, morph = [], meshes = [];
  root.traverse(o => { if (o.isBone) B[o.name] = o; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.material = o.material.clone(); meshes.push(o); if (o.morphTargetDictionary) morph.push(o);
    const m = o.material, nm = (o.name + ' ' + m.name).toLowerCase(); m.envMapIntensity = .5; for (const k in tint) if (nm.includes(k)) { m.color = new THREE.Color(tint[k]); if (m.map && tint[k + '_nomap']) m.map = null; } if (/eyebrow|eyelash|short0|hair/.test(nm)) { m.alphaTest = .5; m.transparent = false; m.depthWrite = true; m.side = THREE.DoubleSide; } if (nm.includes('low-poly')) { m.map = EYE_TEX; m.color = new THREE.Color(0xffffff); m.roughness = .15; o.userData.eye = true; } if (nm.includes('eyebrow')) o.userData.brow = true; if (nm.includes('hair') && !nm.includes('eyebrow')) o.userData.hair = true; } });
  const PS = POSES[name], q = new THREE.Quaternion();
  const P = { root, B, meshes,
    pose(a, b = a, k = 0, extra = {}) { const A = PS[a], Bp = PS[b]; for (const bn in A) { if (!B[bn]) continue; q.copy(A[bn]); if (k > 0 && Bp[bn]) q.slerp(Bp[bn], k); B[bn].quaternion.copy(q); } for (const bn in extra) { const [x, y, z] = extra[bn]; B[bn].quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z))); } },
    walk(ph) { const k = (Math.sin(ph) + 1) / 2; P.pose('walkA', 'walkB', k); root.children[0] && 0; },
    expr(e = {}) { morph.forEach(m => { const d = m.morphTargetDictionary; for (const k in d) if (k.startsWith('x_')) m.morphTargetInfluences[d[k]] = 0; for (const k in e) for (const side of ['', '-left', '-right']) { const nm = k.replace('*', side); const i = d['x_' + nm]; if (i != null) m.morphTargetInfluences[i] = e[k]; } }); },
    brows(v) { meshes.forEach(m => { if (m.userData.brow) m.visible = v; }); },
    hairOn(v) { meshes.forEach(m => { if (m.userData.hair) m.visible = v; }); },
    at(bn, off = [0, 0, 0]) { root.updateMatrixWorld(true); return B[bn].localToWorld(V(...off)); } };
  return P;
}
// expressions built from MakeHuman expression units
const EX = {
  calm: {},
  shock: { 'eyebrows-*-up': .9, 'eye-*-opened-up': .9, 'mouth-open': .55 },
  pain: { 'eyebrows-*-inner-up': 1, 'eye-*-closure': .6, 'mouth-open': .35, 'mouth-retraction': .6 },
  scream: { 'eyebrows-*-inner-up': 1, 'eye-*-opened-up': .7, 'mouth-open': 1 },
  smile: { 'mouth-corner-puller': .8, 'eyebrows-*-up': .2 },
  worried: { 'eyebrows-*-inner-up': .8, 'mouth-depression': .4 },
  angry: { 'eyebrows-*-down': .9, 'mouth-retraction': .4 },
  dazed: { 'eye-*-closure': .45, 'mouth-open': .25, 'eyebrows-*-inner-up': .4 },
};
// ---------- effects ----------
function bolt(scene, seed) {   // a jagged lightning bolt from the sky to a target, rebuilt per strike
  const g = new THREE.Group(), core = bmat({ color: 0xffffff, fog: false }), glow = bmat({ color: 0x9ab8ff, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  scene.add(g); g.visible = false;
  return { g, strike(from, to, seed2 = 1) {
    while (g.children.length) g.remove(g.children[0]); const r = rng(seed * 97 + seed2), n = 14; let p = from.clone();
    const seg = (a, b, w) => { const d = b.clone().sub(a), L = d.length(); for (const [m, s] of [[core, w], [glow, w * 5]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(s, s, L, 5), m); c.position.copy(a).add(b).multiplyScalar(.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); g.add(c); } };
    for (let i = 1; i <= n; i++) { const k = i / n, q = from.clone().lerp(to, k); if (i < n) q.add(V((r() - .5) * 2.2 * (1 - k * .6), 0, (r() - .5) * 1.2)); seg(p, q, .045); if (i % 4 === 2) { const br = q.clone().add(V((r() - .5) * 3, -2 - r() * 2, (r() - .5) * 1)); seg(q, br, .02); } p = q; }
  } };
}
function rain(scene, n = 500, area = 16) { const r = rng(5), geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 6); const base = []; for (let i = 0; i < n; i++) base.push([(r() - .5) * area, r() * 14, (r() - .5) * area, .5 + r() * .5]); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const ln = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xbfd0e8, transparent: true, opacity: .45 })); ln.frustumCulled = false; scene.add(ln);
  return { ln, update(t, c = V(0, 0, 0)) { for (let i = 0; i < n; i++) { const [x, y, z, s] = base[i], yy = ((y - t * 16 * s) % 14 + 14) % 14; pos.set([c.x + x, yy, c.z + z, c.x + x - .05, yy + .5, c.z + z], i * 6); } geo.attributes.position.needsUpdate = true; } }; }
function smoke(scene, n = 10, col = 0x9a9a9a) { return [...Array(n)].map((_, i) => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.08, 1), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: .5, depthWrite: false, roughness: 1 })); p.userData = i; scene.add(p); return p; }); }
const smokeAt = (ps, t, p, on = 1, rise = .7, spread = .12) => ps.forEach(s => { const i = s.userData, q = (t * .7 + i / ps.length) % 1; s.visible = on > 0; s.position.set(p.x + Math.sin(i * 2.3 + t) * spread * (1 + q * 2), p.y + q * rise, p.z + Math.cos(i * 1.7) * spread); s.scale.setScalar((.6 + q * 2.4) * on); s.material.opacity = .5 * (1 - q) * on; });
function fire(scene, n = 16) { const r = rng(n); return [...Array(n)].map((_, i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(.035, .14, 6), bmat({ color: [0xff4a1a, 0xff8a1f, 0xffd24a][i % 3], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); f.userData = { a: r(), x: r() - .5, z: r() - .5, sp: .8 + r() * .6 }; scene.add(f); return f; }); }
const fireAt = (fs, t, p, on = 1, rad = .1) => fs.forEach(f => { const u = f.userData, q = (t * 2.2 * u.sp + u.a) % 1; f.visible = on > .02; f.position.set(p.x + u.x * rad * 2, p.y + q * .25, p.z + u.z * rad * 2); f.scale.setScalar(on * (1 - q) * 1.4); f.material.opacity = .9 * (1 - q); });

// ---------- sets ----------
const grassT = ctex(128, 128, g => { g.fillStyle = '#4a6a34'; g.fillRect(0, 0, 128, 128); const r = rng(5); for (let i = 0; i < 1600; i++) { g.fillStyle = ['#3e5c2c', '#5a7a3e', '#6a8a48', '#46663a'][r() * 4 | 0]; g.fillRect(r() * 128 | 0, r() * 128 | 0, 1, 2 + (r() * 3 | 0)); } }, [30, 30]);
const dirtT = ctex(64, 64, g => { g.fillStyle = '#6a5038'; g.fillRect(0, 0, 64, 64); grain(g, 64, 64, 30, 6); }, [6, 6]);
const woodT = ctex(64, 64, g => { g.fillStyle = '#8a6440'; g.fillRect(0, 0, 64, 64); for (let x = 0; x < 64; x += 8) { g.fillStyle = x % 16 ? '#7a5636' : '#93694a'; g.fillRect(x, 0, 7, 64); g.fillStyle = '#4a3020'; g.fillRect(x + 7, 0, 1, 64); } grain(g, 64, 64, 14, 3); }, [2, 2]);
const sidingT = ctex(64, 64, g => { g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#bcb4a4'; for (let y = 0; y < 64; y += 6) g.fillRect(0, y, 64, 1); grain(g, 64, 64, 8, 4); }, [4, 2]);
const waterT = ctex(128, 128, g => { g.fillStyle = '#3a5a6a'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(200,225,240,.35)'; const r = rng(2); for (let i = 0; i < 70; i++) { const x = r() * 128, y = r() * 128; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 2, x + 12, y); g.stroke(); } }, [6, 12]);
const STORM = [[0, '#1a2030'], [.5, '#3a4458'], [1, '#6a7484']];
function pine(h = 5, col = 0x2a4a2a) { const g = new THREE.Group(); g.add(cyl(.12, .16, h * .3, mat({ color: 0x4a3420 }), 0, h * .15, 0, 6)); for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(h * (.32 - i * .06), h * .4, 8), mat({ color: col })); c.position.y = h * (.35 + i * .16); c.castShadow = true; g.add(c); } return g; }
function forest(scene, n, r0, r1, seed, center = V(0, 0, 0)) { const r = rng(seed); for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = r0 + r() * (r1 - r0), p = pine(3 + r() * 4, [0x2a4a2a, 0x24402a, 0x335533][i % 3]); p.position.set(center.x + Math.cos(a) * d, 0, center.z + Math.sin(a) * d); scene.add(p); } }
function mountains(scene, col = 0x4a5a6a) { const r = rng(9); for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(14 + r() * 12, 12 + r() * 14, 7), mat({ color: col, flatShading: true })); m.position.set(-70 + i * 18 + r() * 8, 0, -60 - r() * 30); scene.add(m); } }
function ground(scene, tex, size = 200, col = 0xffffff) { const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat({ map: tex, color: col })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g); return g; }
// fire lookout tower on a ridge: cabin floor at y = 6
function towerSet() {
  const S = baseScene({ sky: STORM, fog: 0x3a4458, fogN: 20, fogF: 110, sunI: .9, hemiI: .9, envI: .25 }); const { scene } = S;
  ground(scene, grassT); mountains(scene, 0x3a4656); forest(scene, 40, 9, 40, 3);
  const wd = mat({ map: woodT }), dk = mat({ color: 0x4a3420 }); for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) { const l = box(.22, 6, .22, dk, x, 3, z); l.rotation.z = x * -.03; l.rotation.x = z * .03; scene.add(l); }
  for (const y of [1.5, 3.5]) for (const s of [-1, 1]) { const b = box(3.3, .12, .12, dk, 0, y, s * 1.6); b.rotation.z = .5; scene.add(b); const c = box(.12, .12, 3.3, dk, s * 1.6, y, 0); c.rotation.x = .5; scene.add(c); }
  scene.add(box(4.2, .2, 4.2, wd, 0, 6, 0)); const cab = new THREE.Group(); cab.position.y = 6.1; scene.add(cab);
  for (const [x, z, w, d] of [[0, -1.6, 3.4, .1], [0, 1.6, 3.4, .1], [-1.7, 0, .1, 3.3], [1.7, 0, .1, 3.3]]) { cab.add(box(w, .9, d, wd, x, .45, z)); cab.add(box(w, .25, d, wd, x, 2.15, z)); }
  const glass = new THREE.MeshStandardMaterial({ color: 0x9ab0c8, transparent: true, opacity: .25, roughness: .1, metalness: .2 }); for (const [x, z, w, d] of [[0, -1.6, 3.4, .04], [0, 1.6, 3.4, .04], [-1.7, 0, .04, 3.3], [1.7, 0, .04, 3.3]]) cab.add(box(w, 1.15, d, glass, x, 1.45, z));
  for (const [x, z] of [[-1.7, -1.6], [1.7, -1.6], [-1.7, 1.6], [1.7, 1.6]]) cab.add(box(.12, 2.3, .12, dk, x, 1.15, z));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.0, 1.2, 4), mat({ color: 0x5a3a2a })); roof.rotation.y = Math.PI / 4; roof.position.y = 2.85; roof.castShadow = true; cab.add(roof); cab.add(cyl(.03, .03, 1.2, mat({ color: 0x888888, metalness: .8 }), 0, 3.9, 0, 6));
  cab.add(box(1.2, .9, .8, wd, .6, .45, -.6)); const map_ = new THREE.Mesh(new THREE.CircleGeometry(.35, 20), mat({ color: 0xe8dcc0 })); map_.rotation.x = -Math.PI / 2; map_.position.set(.6, .91, -.6); cab.add(map_);
  for (let i = 0; i < 10; i++) { const st = box(1, .08, .35, dk, 2.4, .3 + i * .58, -1.5 + i * .3); scene.add(st); }
  return { ...S, cab };
}
function makeTruck(col = 0x2f5a3a) {
  const g = new THREE.Group(), pm = mat({ color: col, roughness: .45, metalness: .3 }), dk = mat({ color: 0x18181a, roughness: .9 }), ch = mat({ color: 0xc8ccd2, roughness: .3, metalness: .8 }), gl = new THREE.MeshStandardMaterial({ color: 0x2a3440, roughness: .1, metalness: .4, transparent: true, opacity: .55 });
  g.add(box(1.9, .55, 4.6, pm, 0, .75, 0)); g.add(box(1.85, .06, 1.75, pm, 0, 1.97, -.2)); g.add(box(1.85, .95, .06, pm, 0, 1.5, -1.05)); for (const s of [-1, 1]) { g.add(box(.06, .4, 1.75, pm, s * .92, 1.22, -.2)); g.add(box(.06, .95, .08, pm, s * .92, 1.5, .64)); g.add(box(.05, .5, 1.6, gl, s * .92, 1.68, -.2)); } g.add(box(1.75, .55, .04, gl, 0, 1.7, .66)); g.add(box(1.7, .3, .5, dk, 0, 1.18, -.75)); g.add(box(1.7, .5, .12, dk, 0, 1.45, -1.0)); const wheel = new THREE.Mesh(new THREE.TorusGeometry(.17, .025, 6, 18), dk); wheel.position.set(.42, 1.45, .2); wheel.rotation.x = -1.0; g.add(wheel); g.add(box(1.8, .25, .3, dk, 0, 1.2, .45));
  g.add(box(1.95, .2, .25, ch, 0, .6, 2.35)); g.add(box(1.95, .2, .2, ch, 0, .6, -2.35)); 
  for (const s of [-1, 1]) { const hl = new THREE.Mesh(new THREE.CircleGeometry(.13, 12), bmat({ color: 0xfff6d8 })); hl.position.set(s * .65, .85, 2.31); g.add(hl); }
  const wheels = []; for (const [x, z] of [[-.95, 1.5], [.95, 1.5], [-.95, -1.5], [.95, -1.5]]) { const w = cyl(.42, .42, .3, dk, x, .42, z, 18); w.rotation.z = Math.PI / 2; g.add(w); wheels.push(w); }
  g.userData = { wheels }; return g;
}
function roadSet() {
  const S = baseScene({ sky: STORM, fog: 0x3a4458, fogN: 12, fogF: 90, sunI: .8, hemiI: 1.0 }); const { scene } = S;
  ground(scene, grassT); mountains(scene, 0x3a4656); const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 400), mat({ color: 0x2c2e32, roughness: .55, metalness: .1 })); road.rotation.x = -Math.PI / 2; road.position.y = .01; road.receiveShadow = true; scene.add(road);
  const dashes = [...Array(30)].map((_, i) => { const d = box(.15, .02, 2, bmat({ color: 0xe8d070 }), 0, .02, 0); d.userData = i; scene.add(d); return d; });
  const trees = [...Array(24)].map((_, i) => { const p = pine(4 + (i % 3)); p.userData = i; scene.add(p); return p; });
  const T = makeTruck(); scene.add(T); return { ...S, T, dashes, trees };
}
function houseSet() {
  const S = baseScene({ sky: [[0, '#4a5868'], [.6, '#8a96a4'], [1, '#b8c0c8']], fog: 0x8a96a4, fogN: 20, fogF: 100, sunI: 1.4, hemiI: 1.3, sunP: [-4, 8, 6] }); const { scene } = S;
  ground(scene, grassT); mountains(scene, 0x5a6878); forest(scene, 25, 16, 45, 7);
  const hs = new THREE.Group(); hs.position.set(0, 0, -6); scene.add(hs); const sid = mat({ map: sidingT }); hs.add(box(8, 3.2, 5, sid, 0, 1.6, 0)); const rf = new THREE.Mesh(new THREE.CylinderGeometry(.01, 3.4, 2, 4, 1), mat({ color: 0x4a3a34 })); rf.rotation.y = Math.PI / 4; rf.scale.set(1.75, 1, 1.05); rf.position.y = 4.2; rf.castShadow = true; hs.add(rf);
  hs.add(box(1.1, 2.1, .1, mat({ color: 0x6a2a24 }), 0, 1.05, 2.52)); for (const x of [-2.6, 2.6]) { hs.add(box(1.3, 1.1, .08, new THREE.MeshStandardMaterial({ color: 0x8aa0b4, roughness: .1, metalness: .3 }), x, 1.8, 2.52)); hs.add(box(1.5, .1, .12, mat({ color: 0xf2f2f2 }), x, 1.2, 2.55)); }
  hs.add(box(8.4, .15, 2, mat({ map: woodT }), 0, .3, 3.4)); for (const x of [-3.9, 3.9]) hs.add(box(.15, 2.6, .15, mat({ color: 0xf2f2f2 }), x, 1.6, 4.3));
  for (let x = -10; x <= 10; x += 1) scene.add(box(.08, .9, .08, mat({ color: 0xf2f2f2 }), x, .45, 6)); scene.add(box(20, .08, .06, mat({ color: 0xf2f2f2 }), 0, .75, 6));
  const tr = new THREE.Group(); tr.add(cyl(.25, .35, 3, mat({ color: 0x5a4030 }), 0, 1.5, 0, 8)); for (const [x, y, z, r] of [[0, 3.6, 0, 1.6], [.8, 3.2, .4, 1.1], [-.8, 3.3, -.3, 1.2]]) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat({ color: 0x3a6a2e, flatShading: true })); l.position.set(x, y, z); l.castShadow = true; tr.add(l); } tr.position.set(-5, 0, 1); scene.add(tr);
  return S;
}
function stationSet() {
  const S = baseScene({ sky: [[0, '#1a2030'], [1, '#2a3040']], fog: 0x1a1e28, fogN: 8, fogF: 30, sunI: .4, hemiI: .5, envI: .2 }); const { scene } = S;
  const lamp = new THREE.PointLight(0xffd8a0, 9, 9, 1.5); lamp.position.set(.8, 2.4, .4); lamp.castShadow = true; scene.add(lamp);
  const wd = mat({ map: woodT }); ground(scene, woodT, 12, 0xb08868); scene.add(box(8, 3.2, .2, wd, 0, 1.6, -2.2)); scene.add(box(.2, 3.2, 8, wd, -3, 1.6, 0)); scene.add(box(.2, 3.2, 8, wd, 3, 1.6, 0));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), bmat({ color: 0x2a3448 })); win.position.set(-1.2, 1.8, -2.09); scene.add(win); scene.add(box(1.8, .1, .12, mat({ color: 0xe8e2d4 }), -1.2, 1.2, -2.05)); scene.add(box(.08, 1.2, .1, mat({ color: 0xe8e2d4 }), -1.2, 1.8, -2.05));
  scene.add(box(1.6, .08, .8, mat({ color: 0x6a4a2a }), 1.2, .9, -1.4)); for (const [x, z] of [[.5, -1.7], [1.9, -1.7], [.5, -1.1], [1.9, -1.1]]) scene.add(box(.06, .9, .06, mat({ color: 0x4a3020 }), x, .45, z));
  scene.add(box(.5, .3, .35, mat({ color: 0x3a3a3e, metalness: .5, roughness: .4 }), 1.5, 1.09, -1.5)); for (let i = 0; i < 3; i++) scene.add(box(.04, .04, .02, bmat({ color: [0xff3a2a, 0x3aff6a, 0xffd21f][i] }), 1.38 + i * .08, 1.12, -1.32));
  const mp = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1), mat({ map: ctex(64, 48, g => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, 64, 48); g.strokeStyle = '#6a8a5a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(32, 24, 6 + i * 4, 4 + i * 3, .3, 0, 7); g.stroke(); } g.fillStyle = '#c82a2a'; g.fillRect(30, 20, 4, 4); }) })); mp.position.set(1.4, 1.9, -2.09); scene.add(mp);
  return { ...S, win, lamp };
}
function trailSet(river = false) {
  const S = baseScene({ sky: river ? [[0, '#2a3446'], [.6, '#56627a'], [1, '#8a92a0']] : STORM, fog: river ? 0x56627a : 0x3a4458, fogN: 14, fogF: 80, sunI: river ? 1.2 : .9, hemiI: 1.1, sunP: [-5, 9, 4] }); const { scene } = S;
  ground(scene, grassT); mountains(scene, 0x3a4656); forest(scene, 50, 7, 45, river ? 11 : 13);
  if (!river) { const path = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 80), mat({ map: dirtT })); path.rotation.x = -Math.PI / 2; path.position.y = .01; path.receiveShadow = true; scene.add(path); }
  let water = null; if (river) { water = new THREE.Mesh(new THREE.PlaneGeometry(7, 120), new THREE.MeshStandardMaterial({ map: waterT, roughness: .15, metalness: .3, color: 0xa8c0d0 })); water.rotation.x = -Math.PI / 2; water.rotation.z = .25; water.position.set(-4.6, .03, -10); scene.add(water);
    const r = rng(4); for (let i = 0; i < 16; i++) { const rk = new THREE.Mesh(new THREE.IcosahedronGeometry(.25 + r() * .5, 0), mat({ color: 0x7a7a80, flatShading: true })); rk.position.set(-1.6 + (r() - .5) * 1.6, .05, -14 + r() * 20); rk.scale.y = .55; rk.castShadow = true; scene.add(rk); } }
  return { ...S, water };
}
function makeBear() {
  const g = new THREE.Group(), fur = mat({ color: 0x3a2a1c, roughness: 1, flatShading: true }), sn = mat({ color: 0x8a6a4a, roughness: 1 });
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(.8, 1), fur); body.scale.set(.85, .75, 1.35); body.position.y = 1.0; body.castShadow = true; g.add(body);
  const hump = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 1), fur); hump.position.set(0, 1.45, .45); g.add(hump);
  const head = new THREE.Group(); head.position.set(0, 1.25, 1.25); g.add(head); const hd = new THREE.Mesh(new THREE.IcosahedronGeometry(.36, 1), fur); hd.castShadow = true; head.add(hd); const snout = new THREE.Mesh(new THREE.IcosahedronGeometry(.18, 1), sn); snout.scale.set(1, .8, 1.3); snout.position.set(0, -.07, .32); head.add(snout);
  head.add(box(.08, .06, .05, bmat({ color: 0x111111 }), 0, -.02, .53)); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), bmat({ color: 0x111111 })); e.position.set(s * .14, .08, .28); head.add(e); const ear = new THREE.Mesh(new THREE.IcosahedronGeometry(.1, 0), fur); ear.position.set(s * .24, .3, -.02); head.add(ear); }
  const legs = []; for (const [x, z] of [[-.42, .7], [.42, .7], [-.42, -.75], [.42, -.75]]) { const l = new THREE.Group(); l.position.set(x, .9, z); const m = cyl(.18, .16, .9, fur, 0, -.45, 0, 8); l.add(m); g.add(l); legs.push(l); }
  g.userData = { head, legs }; return g;
}
function makeRod() { const g = new THREE.Group(); g.add(cyl(.012, .02, 2.2, mat({ color: 0x2a2a2a, roughness: .4 }), 0, 1.1, 0, 6)); g.add(cyl(.04, .04, .1, mat({ color: 0x9a9aa0, metalness: .8, roughness: .3 }), .04, .25, 0, 10)); return g; }
function makeFish() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), mat({ color: 0x8a9aa8, roughness: .3, metalness: .4 })); b.scale.set(.5, 1, 2.2); g.add(b); const t = new THREE.Mesh(new THREE.ConeGeometry(.1, .14, 4), mat({ color: 0x7a8a98 })); t.rotation.x = Math.PI / 2; t.position.z = -.32; g.add(t); return g; }
function makeHat() { const g = new THREE.Group(), m = mat({ color: 0x8a6a3a, roughness: .9 }); g.add(cyl(.2, .2, .015, m, 0, 0, 0, 24)); const cr = cyl(.075, .1, .12, m, 0, .065, 0, 4); cr.rotation.y = Math.PI / 4; g.add(cr); g.add(cyl(.102, .102, .025, mat({ color: 0x3a2a1a }), 0, .02, 0, 16)); return g; }
await loadGLB('ranger', '/assets/ranger.glb'); await loadPoses('ranger', '/assets/ranger_poses.json');


const shots = [], STRIKES = [];
const shake = () => {}; 
const S0 = trailSet(true), R0 = person('ranger', { shirt: 0xb8a070 }); S0.scene.add(R0.root); S0.scene.add(S0.cam);
const EXS = ['calm', 'shock', 'pain', 'scream', 'smile', 'worried', 'angry', 'dazed'];
shots.push({ t0: 0, t1: 100, scene: S0.scene, cam: S0.cam, update(tl) { const e = 'calm'; const mode = Math.floor(tl); R0.meshes.forEach(m => m.visible = mode === 0 ? m.name === 'Human' : mode === 1 ? !/eyebrow|eyelash/.test(m.name) : mode === 2 ? !/teeth|tongue/.test(m.name) : true); R0.pose('stand'); R0.expr(EX[e]); const h = R0.at('head'); S0.cam.position.set(h.x + .1, h.y + .02, h.z + .6); S0.cam.lookAt(h.x, h.y, h.z); window._e = e; } });
// ---------- captions (Zack style: Open Sans ExtraBold 72px white, soft shadow, y = 1500, 1-4 word chunks, hard cuts) ----------
let chunks = [];
function buildCaptions(words) { let cur = []; const flush = () => { if (cur.length) { chunks.push({ s: cur[0].s - 1 / FPS, text: cur.map(w => w.w).join(' ').replace(/[.,?!]+$/, '') }); cur = []; } };
  for (const w of words) { const len = cur.reduce((a, c) => a + c.w.length + 1, 0); if (cur.length >= 4 || len + w.w.length > 18) flush(); cur.push(w); if (/[.,?!]$/.test(w.w)) flush(); } flush();
  chunks.forEach((c, i) => c.e = chunks[i + 1] ? chunks[i + 1].s : DUR - .9); }
function drawCaption(t) { const c = chunks.find(c => t >= c.s && t < c.e); if (!c) return; const k = out.width / 1080;
  og.save(); og.font = `800 ${72 * k}px 'Open Sans'`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.fillStyle = '#fff'; og.shadowColor = 'rgba(0,0,0,.65)'; og.shadowBlur = 6 * k; og.shadowOffsetY = 3 * k; og.fillText(c.text, out.width / 2, 1500 * k); og.shadowColor = 'rgba(0,0,0,.5)'; og.shadowBlur = 2 * k; og.shadowOffsetY = 0; og.fillText(c.text, out.width / 2, 1500 * k); og.restore(); }
// strike counter: a lightning bolt icon + number, shown briefly after each strike
function drawCounter(t) { const n = STRIKES.filter(s => t >= s).length; if (!n) return; const since = t - STRIKES[n - 1], show = n === 7 && t > 29.9 ? 1 : clamp(1 - (since - 1.2) / .25) * clamp(since / .08); if (show <= 0) return; const k = out.width / 1080, x = out.width / 2, y = 260 * k, s = 1 + .25 * Math.exp(-since * 10);
  og.save(); og.globalAlpha = show; og.translate(x, y); og.scale(s, s); og.fillStyle = 'rgba(10,14,24,.55)'; og.beginPath(); og.roundRect(-150 * k, -62 * k, 300 * k, 124 * k, 62 * k); og.fill(); og.fillStyle = '#ffd84a'; og.beginPath(); const P = [[-70, -40], [-95, 8], [-75, 8], [-90, 44], [-50, -6], [-70, -6], [-55, -40]]; P.forEach(([a, b], i) => i ? og.lineTo(a * k, b * k) : og.moveTo(a * k, b * k)); og.fill();
  og.font = `800 ${84 * k}px 'Open Sans'`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.fillStyle = '#fff'; og.fillText('× ' + n, 30 * k, 4 * k); og.restore(); }
// ---------- frame ----------
const WHIPS = [6.75, 12.45, 15.95, 20.05, 24.15, 29.95];
function renderAt(t) {
  const s = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1], tl = t - s.t0;
  s.update(tl, s.t1 - s.t0, t); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam);
  const dof = typeof s.dof === 'function' ? s.dof(tl) : s.dof, whip = Math.max(0, ...WHIPS.map(w => 1 - Math.abs(t - w) / .15));
  og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
  if (whip > .05) { og.filter = `blur(${whip * 14}px)`; og.drawImage(renderer.domElement, -20, -20, out.width + 40, out.height + 40); og.filter = 'none'; }
  else if (dof) { og.filter = `blur(${dof.b * SCALE}px)`; og.drawImage(renderer.domElement, -8, -8, out.width + 16, out.height + 16); og.filter = 'none';
    sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, sharp.width, sharp.height); sg.drawImage(renderer.domElement, 0, 0, sharp.width, sharp.height); sg.globalCompositeOperation = 'destination-in';
    const gr = sg.createRadialGradient(sharp.width * (dof.x || .5), sharp.height * (dof.y || .5), sharp.width * (dof.r || .35) * .55, sharp.width * (dof.x || .5), sharp.height * (dof.y || .5), sharp.width * (dof.r || .35) * 1.35); gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, sharp.width, sharp.height); og.drawImage(sharp, 0, 0); }
  else og.drawImage(renderer.domElement, 0, 0, out.width, out.height);
  const fl = Math.max(0, ...STRIKES.map(s0 => t >= s0 ? Math.exp(-(t - s0) * 14) : 0)); if (fl > .02) { og.fillStyle = `rgba(235,242,255,${fl * .75})`; og.fillRect(0, 0, out.width, out.height); }
  const vg = og.createRadialGradient(out.width / 2, out.height / 2, out.height * .35, out.width / 2, out.height / 2, out.height * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.3)'); og.fillStyle = vg; og.fillRect(0, 0, out.width, out.height);
  drawCounter(t); drawCaption(t);
}
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .92); };
const cutInfo = await (await fetch('/build/cuts.json')).json();
const toOriginal = tc => { let t = tc * (cutInfo.speed || 1); for (const [a, b] of cutInfo.cuts) { if (t >= a) t += b - a; else break; } return Math.min(t, DUR - .001); };
window.renderFrame = i => window.renderTime(toOriginal((i + .5) / FPS));
window.frameCount = Math.round(cutInfo.duration * FPS);
const words = await (await fetch('/build/words.json')).json(); buildCaptions(words);
await document.fonts.load("800 72px 'Open Sans'");
window.captionChunks = chunks; window.ready = true;
