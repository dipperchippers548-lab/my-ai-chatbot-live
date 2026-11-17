// Noodle people - character style test: bendy tube bodies, round heads, short arms/legs, flat toon shading + a 2D ink outline.
import * as THREE from '/node_modules/three/build/three.module.js';
const W = 1080, H = 1920;
const out = document.getElementById('out'); out.width = W; out.height = H;
const renderer = new THREE.WebGLRenderer({ canvas: out, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---- toon look: 3-step shading ramp + an ink outline (inverted hull pushed out along the normals)
const ramp = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = c => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp });
const INK = 0x16121a;
function inkMat(w) { const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${w.toFixed(4)};`); }; return m; }
function inked(geo, color, w = .022) { const g = new THREE.Group(), m = new THREE.Mesh(geo, toon(color)); m.castShadow = true; m.receiveShadow = true; g.add(m); const o = new THREE.Mesh(geo, inkMat(w)); g.add(o); g.userData.mesh = m; return g; }
const flat = c => new THREE.MeshBasicMaterial({ color: c });

// ---- a face drawn with real geometry on the head: dot eyes with a glint, brows, a one-line mouth
function arcMouth(kind) {
  if (kind === 'o') { const g = new THREE.Group(); const o = new THREE.Mesh(new THREE.TorusGeometry(.055, .018, 8, 20), flat(INK)); g.add(o); const fill = new THREE.Mesh(new THREE.CircleGeometry(.05, 20), flat(0x5a1a24)); fill.position.z = -.002; g.add(fill); return g; }
  const pts = [], n = 16, wdt = kind === 'grin' ? .17 : .13, bend = { smile: .05, grin: .07, frown: -.04, flat: 0, wavy: 0 }[kind];
  for (let i = 0; i <= n; i++) { const u = i / n * 2 - 1; pts.push(V(u * wdt / 2, -bend * (1 - u * u) + (kind === 'wavy' ? Math.sin(u * 9) * .012 : 0), 0)); }
  const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .014, 6), flat(INK)));
  if (kind === 'grin') { const sh = new THREE.Shape(); sh.moveTo(-wdt / 2, 0); for (let i = 0; i <= n; i++) { const u = i / n * 2 - 1; sh.lineTo(u * wdt / 2, -bend * (1 - u * u)); } const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), flat(0xffffff)); m.position.z = -.003; g.add(m); }
  return g;
}
function face(head, r, o) {
  const f = new THREE.Group(); head.add(f);
  const eye = (x) => { const e = new THREE.Group(); const w = new THREE.Mesh(new THREE.SphereGeometry(.07 * (o.eyeS || 1), 16, 12), flat(INK)); w.scale.set(.8, 1.15, .4); e.add(w);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 6), flat(0xffffff)); gl.position.set(.02, .035, .03); e.add(gl); e.position.set(x, .06, r * .93); e.lookAt(e.position.clone().multiplyScalar(2)); f.add(e); return e; };
  const eL = eye(-.13), eR = eye(.13);
  for (const [x, s] of [[-.13, -1], [.13, 1]]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(.018, .08, 4, 8), flat(INK)); b.rotation.z = Math.PI / 2 + s * (o.brow || 0); b.position.set(x, .2 + (o.browUp || 0), r * .9); f.add(b); }
  const m = arcMouth(o.mouth || 'smile'); m.position.set(0, -.13, r * .965); m.rotation.x = -.18; f.add(m);
  if (o.blush) for (const x of [-.22, .22]) { const c = new THREE.Mesh(new THREE.CircleGeometry(.05, 16), new THREE.MeshBasicMaterial({ color: 0xff7a9a, transparent: true, opacity: .55 })); c.position.set(x, -.06, r * .86); c.lookAt(V(x * 3, -.1, r * 3)); f.add(c); }
  return { eL, eR };
}
// ---- the noodle: a bendy tube body (curve can bend/lean), round head on top, short noodle arms + legs with round hands/feet
function noodle(o) {
  const g = new THREE.Group(), col = o.color, R = .25, HR = .41;
  const lean = o.lean || 0, bend = o.bend || 0;
  const spine = new THREE.CatmullRomCurve3([V(0, .32, 0), V(bend * .3, .62, 0), V(bend * .55 + lean * .3, .92, 0), V(bend * .6 + lean * .55, 1.18, 0)]);
  g.add(inked(new THREE.TubeGeometry(spine, 40, R, 20), col));
  for (const y of [0, 1]) { const p = spine.getPoint(y); const cap = inked(new THREE.SphereGeometry(R, 20, 14), col); cap.position.copy(p); g.add(cap); }
  const top = spine.getPoint(1), head = new THREE.Group(); head.position.copy(top).add(V(0, HR * .85, 0)); head.rotation.z = -(bend + lean) * .35 + (o.tilt || 0); g.add(head);
  head.add(inked(new THREE.SphereGeometry(HR, 28, 20), col, .024));
  if (o.hat === 'cap') { const c = inked(new THREE.SphereGeometry(HR * 1.02, 24, 12, 0, Math.PI * 2, 0, Math.PI * .42), o.hatColor || 0xe8323a, .02); c.position.y = .02; head.add(c); const brim = inked(new THREE.CylinderGeometry(.24, .24, .03, 20), o.hatColor || 0xe8323a, .015); brim.position.set(0, .2, .26); brim.scale.z = .8; brim.rotation.x = .25; head.add(brim); }
  if (o.hair === 'tuft') for (let i = 0; i < 3; i++) { const t = inked(new THREE.ConeGeometry(.06, .2, 8), o.hairColor || col, .015); t.position.set(-.07 + i * .07, HR + .05, .05); t.rotation.z = (i - 1) * .4; head.add(t); }
  face(head, HR, o);
  const limb = (from, to, rr) => { const mid = from.clone().lerp(to, .5).add(V(0, .05, 0)); return inked(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([from, mid, to]), 16, rr, 10), col, .016); };
  const sh = spine.getPoint(.62);
  for (const s of [-1, 1]) {
    const a = o.arms ? o.arms[s < 0 ? 0 : 1] : [s * .5, -.18, .05]; const from = sh.clone().add(V(s * R * .85, 0, 0)), to = from.clone().add(V(...a).multiplyScalar(.62));
    g.add(limb(from, to, .055)); const hand = inked(new THREE.SphereGeometry(.085, 14, 10), col, .016); hand.position.copy(to); g.add(hand);
    const hip = V(s * .12, .22, 0), foot = V(s * .16, .06, .02); g.add(limb(hip, foot, .06)); const shoe = inked(new THREE.SphereGeometry(.1, 14, 10), o.shoe || 0x2a2a34, .016); shoe.scale.set(1, .6, 1.4); shoe.position.copy(foot).add(V(0, -.01, .06)); g.add(shoe);
  }
  return g;
}

// ---- a bright cartoon set: sky, grass, a path, round trees, a little house, clouds - all inked
const scene = new THREE.Scene(); const skyT = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#46b4ff'); gr.addColorStop(.7, '#a8e4ff'); gr.addColorStop(1, '#e8f8ff'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
scene.background = skyT;
scene.add(new THREE.HemisphereLight(0xffffff, 0x8ab86a, 1.3)); const sun = new THREE.DirectionalLight(0xfff6e0, 2.4); sun.position.set(4, 8, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); sun.shadow.bias = -.0008; scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 48), toon(0x7ad05a)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const path = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 30), toon(0xf2d8a0)); path.rotation.x = -Math.PI / 2; path.position.set(0, .005, -10); path.receiveShadow = true; scene.add(path);
function tree(x, z, s) { const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); const tr = inked(new THREE.CylinderGeometry(.12, .16, 1.0, 10), 0x9a6a3a); tr.position.y = .5; t.add(tr); for (const [dx, dy, r] of [[0, 1.4, .6], [-.35, 1.15, .42], [.38, 1.2, .45]]) { const b = inked(new THREE.SphereGeometry(r, 18, 14), 0x3fae4a, .03); b.position.set(dx, dy, 0); t.add(b); } scene.add(t); }
tree(-2.6, -2.5, 1.2); tree(2.9, -3.5, 1.4); tree(-4.5, -7, 1.6); tree(4.2, -9, 1.5); tree(-1.6, -12, 1.4);
const house = new THREE.Group(); house.position.set(-3.4, 0, -5.5); house.rotation.y = .5; scene.add(house); const hb = inked(new THREE.BoxGeometry(2, 1.6, 1.8), 0xffe8b8, .03); hb.position.y = .8; house.add(hb);
const roof = inked(new THREE.ConeGeometry(1.6, 1.1, 4), 0xff6a4a, .03); roof.position.y = 2.1; roof.rotation.y = Math.PI / 4; house.add(roof); const door = inked(new THREE.BoxGeometry(.5, .8, .05), 0x7a4a2a, .015); door.position.set(0, .4, .92); house.add(door);
for (const [x, y, z, s] of [[-2, 5.5, -9, 1], [2.5, 6.4, -12, 1.3], [0, 7.5, -16, 1.1]]) { const c = new THREE.Group(); c.position.set(x, y, z); c.scale.setScalar(s); for (const [dx, r] of [[-.5, .45], [0, .6], [.55, .45]]) { const b = inked(new THREE.SphereGeometry(r, 16, 12), 0xffffff, .03); b.position.x = dx; b.children[0].castShadow = false; c.add(b); } scene.add(c); }

// ---- the cast
const A = noodle({ color: 0xff8a2a, mouth: 'grin', brow: -.15, blush: true, hair: 'tuft', hairColor: 0xff8a2a, arms: [[-.45, .25, .1], [.5, .3, .1]], lean: -.1 });   // happy, arms up
A.position.set(-.98, 0, .3); A.rotation.y = .3; scene.add(A);
const B = noodle({ color: 0x38c8c0, mouth: 'o', eyeS: 1.25, browUp: .06, brow: .2, bend: .35, arms: [[-.4, .35, .2], [.45, .4, .2]], hat: 'cap', hatColor: 0xffd23a });   // shocked, bending back
B.position.set(0, 0, -.2); scene.add(B);
const C = noodle({ color: 0xff6aa8, mouth: 'frown', brow: .35, arms: [[-.35, -.05, .25], [.4, -.1, .3]], tilt: .15, shoe: 0xffffff });   // grumpy
C.position.set(1.0, 0, .35); C.rotation.y = -.35; scene.add(C);

const cam = new THREE.PerspectiveCamera(36, W / H, .1, 200); cam.position.set(0, 1.45, 8.6); cam.lookAt(0, 1.2, 0);
window.renderTime = () => { renderer.render(scene, cam); return out.toDataURL('image/jpeg', .94); };
window.captionChunks = []; window.ready = true;
