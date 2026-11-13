// The backyard: sky dome, lawn, Lulu's house, picket fence, round trees, bushes, flowers, toys, distant houses.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ctex, rng, std, mesh, grp, lumpy } from './lib.js';

export const SKY_TOP = new THREE.Color('#2f86e6'), SKY_HOR = new THREE.Color('#bfe4ff');
const rb = (w, h, d, r = .04, s = 3) => new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));

export function skyDome() {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: SKY_TOP }, hor: { value: SKY_HOR }, rainbow: { value: 0 } },
    vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, hor; uniform float rainbow; varying vec3 vd;
      vec3 hue(float h){ return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); }
      void main(){ float h = clamp(vd.y, 0., 1.); vec3 c = mix(hor, top, pow(h, .55));
        // soft sun glow on the left
        vec3 sd = normalize(vec3(-.55,.62,.55)); c += vec3(1.,.95,.8) * pow(max(dot(vd, sd),0.), 18.) * .35;
        // rainbow arc (fades in near the end)
        vec3 rc = normalize(vec3(-.54,-.06,-.84)); float a = acos(clamp(dot(vd, rc), -1., 1.));
        float band = (a - .46) / .1; if (band > 0. && band < 1. && vd.y > -.02) c = mix(c, hue(band*.8) * 1.15, rainbow * .8 * pow(sin(band*3.1416), .7) * smoothstep(-.02,.1,vd.y));
        gl_FragColor = vec4(c, 1.); }`
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), m); s.renderOrder = -10; return s;
}

export function cloud(parent, x, y, z, s, seed) {
  const g = grp(parent, x, y, z); const r = rng(seed);
  const mat = std('#ffffff', { roughness: 1, emissive: '#dfeaff', emissiveIntensity: .55 });
  const parts = [[-1.3, 0, 0, 1.0], [0, .45, 0, 1.45], [1.35, .05, 0, 1.1], [.45, -.25, .5, 1.0], [-.5, -.2, .4, .95], [2.2, -.25, 0, .7], [-2.1, -.3, 0, .65]];
  for (const [px, py, pz, pr] of parts) { const m = mesh(lumpy(new THREE.SphereGeometry(pr, 28, 20), .06, 1.6, r() * 10), mat, g, px, py, pz, false); m.receiveShadow = false; }
  g.scale.set(s, s * .72, s * .6); return g;
}

function lawnTex() {
  return ctex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#72c23b'; g.fillRect(0, 0, w, h); const r = rng(5);
    for (let i = 0; i < 2600; i++) { const x = r() * w, y = r() * h, s = 10 + r() * 60; const l = r(); g.fillStyle = l > .5 ? `rgba(160,220,80,${.05 + r() * .07})` : `rgba(40,120,30,${.04 + r() * .06})`; g.beginPath(); g.ellipse(x, y, s, s * .7, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 9000; i++) { const x = r() * w, y = r() * h; g.strokeStyle = r() > .5 ? 'rgba(190,240,110,.25)' : 'rgba(40,110,30,.22)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 4, y - 5 - r() * 6); g.stroke(); }
  });
}

function sidingTex(base, line) {
  return ctex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { g.fillStyle = line; g.fillRect(0, y + 28, w, 4); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, y, w, 3); } });
}
function roofTex(base) {
  return ctex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rng(3); for (let row = 0; row < 8; row++) { const y = row * 32; g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(0, y + 29, w, 3); for (let x = (row % 2) * 24; x < w; x += 48) { g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(x, y, 2, 30); g.fillStyle = `rgba(255,255,255,${r() * .08})`; g.fillRect(x + 2, y, 46, 29); } } });
}

function windowUnit(parent, x, y, z, w, h, ry = 0) {
  const g = grp(parent, x, y, z); g.rotation.y = ry;
  const white = std('#fbfaf6', { roughness: .45 }), glass = std('#9fd3f2', { roughness: .08, metalness: .1, envMapIntensity: 1.6 });
  mesh(rb(w + .12, h + .12, .08, .03), white, g, 0, 0, 0);
  mesh(new THREE.BoxGeometry(w, h, .02), glass, g, 0, 0, .035, false);
  mesh(rb(.04, h, .05, .015), white, g, 0, 0, .05); mesh(rb(w, .04, .05, .015), white, g, 0, 0, .05);
  mesh(rb(w + .26, .07, .16, .03), white, g, 0, -h / 2 - .08, .05);
  return g;
}

export function house(parent, o) {
  const { x = 0, z = 0, ry = 0, w = 7, d = 6, h = 5.4, wall = '#f6c8a2', line = '#e3ab84', roof = '#5f86c4', door = '#e24f48', detail = true } = o;
  const g = grp(parent, x, 0, z); g.rotation.y = ry;
  const wt = sidingTex(wall, line); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(w / 1.5, h / 1.5);
  const wallM = std('#ffffff', { map: wt, roughness: .8 }), white = std('#fbfaf6', { roughness: .45 });
  mesh(new THREE.BoxGeometry(w, h, d), wallM, g, 0, h / 2, 0);
  mesh(rb(w + .2, .25, d + .2, .05), white, g, 0, .12, 0);                       // plinth
  for (const sx of [-1, 1]) mesh(rb(.18, h, .18, .04), white, g, sx * w / 2, h / 2, d / 2);  // corner boards
  // gable roof
  const rt = roofTex(roof); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(w / 1.4, 2.4);
  const roofM = std('#ffffff', { map: rt, roughness: .75 });
  const rh = 2.6, half = d / 2 + .5, slope = Math.hypot(half, rh);
  for (const s of [-1, 1]) { const p = mesh(rb(w + .8, .22, slope + .1, .05), roofM, g, 0, h + rh / 2, s * half / 2); p.rotation.x = s * Math.atan2(rh, half); }
  const gable = new THREE.Shape(); gable.moveTo(-d / 2, 0); gable.lineTo(d / 2, 0); gable.lineTo(0, rh); gable.closePath();
  for (const s of [-1, 1]) { const gm = mesh(new THREE.ShapeGeometry(gable), wallM, g, s * w / 2, h, 0); gm.rotation.y = s * Math.PI / 2; }
  const ch = mesh(rb(.7, 2.2, .7, .04), std('#c96a52', { roughness: .85 }), g, w * .28, h + rh * .7, -d * .12); mesh(rb(.85, .15, .85, .03), white, ch, 0, 1.12, 0);
  if (detail) {
    for (const wx of [-w * .3, w * .3]) { windowUnit(g, wx, h * .72, d / 2 + .02, 1.1, 1.25); windowUnit(g, wx, h * .3, d / 2 + .02, 1.1, 1.25); }
    windowUnit(g, 0, h * .72, d / 2 + .02, .9, 1.0);
    // door with round window, frame, step and little porch roof
    const dg = grp(g, 0, 0, d / 2 + .03);
    mesh(rb(1.25, 2.35, .1, .03), white, dg, 0, 1.2, 0); mesh(rb(1.0, 2.15, .08, .04), std(door, { roughness: .45 }), dg, 0, 1.12, .04);
    mesh(new THREE.CircleGeometry(.2, 32), std('#a8d8f5', { roughness: .1 }), dg, 0, 1.65, .085, false);
    mesh(new THREE.SphereGeometry(.05, 16, 12), std('#f2c94c', { metalness: .6, roughness: .3 }), dg, .35, 1.05, .11);
    mesh(rb(1.8, .2, .8, .05), std('#e9e4da'), dg, 0, .1, .35); mesh(rb(1.5, .2, .5, .05), std('#e9e4da'), dg, 0, .28, .2);
    const pr = mesh(rb(1.9, .12, 1.0, .04), roofM, dg, 0, 2.6, .4); pr.rotation.x = .25;
  } else {
    const glass = std('#9fc6e6', { roughness: .2 });
    for (const wx of [-w * .28, w * .28]) for (const wy of [h * .3, h * .72]) { mesh(rb(1.1, 1.2, .05, .02), white, g, wx, wy, d / 2 + .02); mesh(new THREE.PlaneGeometry(.9, 1.0), glass, g, wx, wy, d / 2 + .05, false); }
  }
  return g;
}

export function fence(parent, pts, color = '#fbfaf6') {
  const m = std(color, { roughness: .5 }); const g = grp(parent);
  const picket = rb(.11, .95, .045, .02);
  for (let k = 0; k < pts.length - 1; k++) {
    const a = new THREE.Vector3(...pts[k]), b = new THREE.Vector3(...pts[k + 1]); const L = a.distanceTo(b), n = Math.floor(L / .2);
    const ang = Math.atan2(b.x - a.x, b.z - a.z) - Math.PI / 2;
    for (let i = 0; i <= n; i++) { const p = a.clone().lerp(b, i / n); const pk = mesh(picket, m, g, p.x, .48, p.z); pk.rotation.y = ang; const tip = mesh(new THREE.ConeGeometry(.078, .1, 4), m, g, p.x, 1.0, p.z); tip.rotation.y = ang + Math.PI / 4; }
    for (const y of [.3, .72]) { const r = mesh(rb(L, .07, .04, .015), m, g, (a.x + b.x) / 2, y, (a.z + b.z) / 2); r.rotation.y = ang; r.translateZ(-.04); }
  }
  return g;
}

const leafMats = ['#4fae3a', '#5cb941', '#45a033', '#62c04a'].map(c => std(c, { roughness: .85 }));
export function tree(parent, x, z, s = 1, seed = 1) {
  const g = grp(parent, x, 0, z); const r = rng(seed * 97 + 3);
  const trunk = new THREE.CylinderGeometry(.16, .26, 2.4, 14); trunk.translate(0, 1.2, 0); mesh(trunk, std('#8a5a3b', { roughness: .9 }), g);
  const blobs = [[0, 3.1, 0, 1.25], [-.8, 2.7, .2, .95], [.85, 2.75, -.1, 1.0], [.1, 3.9, .1, .95], [-.3, 2.9, .75, .85], [.4, 2.8, -.7, .85], [-.5, 3.6, -.4, .8]];
  for (const [bx, by, bz, br] of blobs) mesh(lumpy(new THREE.SphereGeometry(br, 30, 22), .1, 2.2, r() * 50), leafMats[Math.floor(r() * 4)], g, bx, by, bz);
  g.scale.setScalar(s); return g;
}
export function bush(parent, x, z, s = 1, seed = 1, flowers = null) {
  const g = grp(parent, x, 0, z); const r = rng(seed * 31 + 7);
  for (let i = 0; i < 4; i++) mesh(lumpy(new THREE.SphereGeometry(.45 + r() * .2, 24, 18), .05, 3, r() * 20), leafMats[i % 4], g, (r() - .5) * .9, .35 + r() * .15, (r() - .5) * .5);
  if (flowers) { const fm = std(flowers, { roughness: .5 }); for (let i = 0; i < 9; i++) { const a = r() * 6.28, rr = .3 + r() * .3; mesh(new THREE.SphereGeometry(.07, 12, 8), fm, g, Math.cos(a) * rr, .55 + r() * .35, Math.sin(a) * rr * .7 + .1); } }
  g.scale.setScalar(s); return g;
}
export function flowerBed(parent, x, z, w, d, seed = 2) {
  const g = grp(parent, x, 0, z); const r = rng(seed * 13 + 1);
  mesh(rb(w, .16, d, .06), std('#7b4f35', { roughness: 1 }), g, 0, .04, 0);
  const cols = ['#ff6b8a', '#ffd23f', '#ffffff', '#b07cff', '#ff8a3d'];
  const stem = std('#3f9a34'); const center = std('#ffcc33');
  for (let i = 0; i < Math.floor(w * d * 14); i++) {
    const fx = (r() - .5) * (w - .15), fz = (r() - .5) * (d - .15), hgt = .18 + r() * .2;
    mesh(new THREE.CylinderGeometry(.012, .012, hgt, 5), stem, g, fx, .1 + hgt / 2, fz, false);
    const fg = grp(g, fx, .12 + hgt, fz); const pm = std(cols[Math.floor(r() * cols.length)], { roughness: .55 });
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; const p = mesh(new THREE.SphereGeometry(.035, 10, 8), pm, fg, Math.cos(a) * .04, 0, Math.sin(a) * .04, false); p.scale.y = .5; }
    mesh(new THREE.SphereGeometry(.025, 10, 8), center, fg, 0, .01, 0, false);
  }
  return g;
}

export function buildWorld(scene) {
  const W = grp(scene);
  const sky = skyDome(); W.add(sky);
  const lt = lawnTex(); lt.wrapS = lt.wrapT = THREE.RepeatWrapping; lt.repeat.set(24, 24);
  const ground = mesh(new THREE.CircleGeometry(160, 64), std('#ffffff', { map: lt, roughness: .95 }), W, 0, 0, 0, false); ground.rotation.x = -Math.PI / 2;
  // stepping-stone path from the door
  const stoneM = std('#cfc6b6', { roughness: .95 }); const r = rng(9);
  for (let i = 0; i < 5; i++) { const s = mesh(new THREE.CylinderGeometry(.21 + r() * .05, .23, .05, 20), stoneM, W, .1 + Math.sin(i * 1.3) * .22, .015, -5.6 + i * .95, false); s.scale.z = .75; }
  house(W, { x: 0, z: -9.2 });
  fence(W, [[-9, 0, -6.2], [-4.2, 0, -6.2]]); fence(W, [[4.2, 0, -6.2], [9, 0, -6.2]]);
  fence(W, [[-9, 0, -6.2], [-9, 0, 7]]); fence(W, [[9, 0, -6.2], [9, 0, 7]]);
  tree(W, -5.6, -3.4, 1.15, 1); tree(W, 6.4, -4.4, 1.0, 2); tree(W, -12, -14, 1.3, 3); tree(W, 13, -12, 1.4, 4); tree(W, -16, 2, 1.2, 5); tree(W, 15, 4, 1.25, 6);
  bush(W, -3.6, -6.6, 1.1, 1, '#ff6b8a'); bush(W, 3.6, -6.6, 1.1, 2, '#ffd23f'); bush(W, -8.2, 2, 1, 3); bush(W, 8.2, 1, 1, 4, '#ffffff'); bush(W, 7.6, -2.6, .9, 5);
  flowerBed(W, -2.5, -7.3, 2.6, .7, 1); flowerBed(W, 2.5, -7.3, 2.6, .7, 2); flowerBed(W, -7.6, -1.0, .8, 3.0, 3);
  // neighbours behind the back fence
  house(W, { x: -15, z: -22, w: 8, h: 5, wall: '#cfe6f5', line: '#a9cbe2', roof: '#d26a4f', detail: false });
  house(W, { x: 16, z: -24, w: 7, h: 5.4, wall: '#f8e7a6', line: '#e2cd84', roof: '#7a6aa8', detail: false });
  house(W, { x: -26, z: 10, ry: Math.PI / 2, w: 8, h: 5, wall: '#d7f0cf', line: '#b5d7aa', roof: '#c8584a', detail: false });
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 32 + r() * 40; tree(W, Math.cos(a) * d, Math.sin(a) * d - 8, 1.2 + r() * .9, 10 + i); }
  // toys: red ball, little garden table with the bubble bottle
  mesh(new THREE.SphereGeometry(.22, 32, 24), std('#ef4b4b', { roughness: .35 }), W, 2.7, .22, 1.6);
  const tg = grp(W, 1.55, 0, -.9);
  mesh(new THREE.CylinderGeometry(.42, .42, .05, 32), std('#fbfaf6', { roughness: .4 }), tg, 0, .55, 0);
  mesh(new THREE.CylinderGeometry(.04, .05, .55, 12), std('#fbfaf6'), tg, 0, .27, 0);
  const clouds = grp(W);
  cloud(clouds, -14, 16, -60, 3.2, 1); cloud(clouds, 10, 19, -70, 3.6, 2); cloud(clouds, 30, 13, -45, 2.6, 3); cloud(clouds, -34, 12, -40, 2.8, 4); cloud(clouds, 0, 24, -95, 4.2, 5); cloud(clouds, -20, 20, 40, 3, 6); cloud(clouds, 25, 18, 35, 3, 7);
  return { root: W, clouds, table: tg, sky };
}

export function lights(scene) {
  scene.add(new THREE.HemisphereLight('#d6ebff', '#c2b48c', 1.25));
  const sun = new THREE.DirectionalLight('#fff1d8', 3.1); sun.position.set(-6, 9, 6.5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); const c = sun.shadow.camera; c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 1; c.far = 40; sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; sun.shadow.radius = 3;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight('#d8e8ff', .7); fill.position.set(6, 3, 8); scene.add(fill);
  return { sun, fill };
}

// soft outdoor environment for reflections (sky gradient + lawn bounce)
export function envMap(renderer) {
  const es = new THREE.Scene(); es.add(skyDome());
  const g = new THREE.Mesh(new THREE.CircleGeometry(300, 32), new THREE.MeshBasicMaterial({ color: '#4f8f33' })); g.rotation.x = -Math.PI / 2; g.position.y = -2; es.add(g);
  const sunb = new THREE.Mesh(new THREE.SphereGeometry(20, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 7.5, 6.5) })); sunb.position.set(-120, 140, 130); es.add(sunb);
  const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(es, 0.02); pm.dispose(); return rt.texture;
}
