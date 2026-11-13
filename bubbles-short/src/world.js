// The backyard: sky dome, lawn, Lulu's house, picket fence, round trees, bushes, flowers, toys, distant houses.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ctex, rng, std, mesh, grp, lumpy } from './lib.js';

export const SKY_TOP = new THREE.Color('#2479de'), SKY_HOR = new THREE.Color('#b0defd');
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
    for (let b = 0; b < 4; b++) { g.fillStyle = b % 2 ? 'rgba(170,230,90,.10)' : 'rgba(40,110,30,.06)'; g.fillRect(0, b * h / 4, w, h / 4); }
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
    const shutTex = ctex(64, 128, (gg) => { gg.fillStyle = '#4e9fc4'; gg.fillRect(0, 0, 64, 128); gg.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 6; y < 128; y += 12) gg.fillRect(6, y, 52, 4); gg.strokeStyle = 'rgba(255,255,255,.25)'; gg.lineWidth = 3; gg.strokeRect(3, 3, 58, 122); });
    const shutM = std('#ffffff', { map: shutTex, roughness: .6 });
    const boxM = std('#ffffff', { roughness: .5 }), soil = std('#6b4430'), fl = ['#ff6b8a', '#ffd23f', '#ffffff', '#b07cff'].map(c => std(c, { roughness: .5 }));
    for (const wx of [-w * .3, w * .3]) for (const wy of [h * .3, h * .72]) {
      for (const s of [-1, 1]) mesh(rb(.42, 1.35, .06, .02), shutM, g, wx + s * .8, wy, d / 2 + .04);
      if (wy < h * .5) { mesh(rb(1.3, .26, .3, .04), boxM, g, wx, wy - .82, d / 2 + .2); mesh(new THREE.BoxGeometry(1.2, .04, .22), soil, g, wx, wy - .7, d / 2 + .2, false);
        for (let k = 0; k < 9; k++) { mesh(new THREE.SphereGeometry(.07, 12, 8), fl[k % 4], g, wx - .5 + k * .125, wy - .62 + (k % 2) * .04, d / 2 + .2 + ((k * 7) % 3 - 1) * .05, false); mesh(new THREE.SphereGeometry(.08, 10, 8), leafMats[k % 4], g, wx - .45 + k * .11, wy - .68, d / 2 + .14, false); } }
    }
    // roof fascia boards
    for (const s of [-1, 1]) { const f = mesh(rb(.18, Math.hypot(d / 2 + .5, 2.6) + .1, .1, .03), white, g, s * (w / 2 + .42), h + 1.3, 0); f.rotation.set(0, Math.PI / 2, 0); }
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
const leafTex = ctex(256, 256, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); const r = rng(21); for (let i = 0; i < 420; i++) { const x = r() * 256, y = r() * 256; g.fillStyle = `rgba(${r() > .5 ? '30,90,20' : '255,255,220'},${.12 + r() * .14})`; g.beginPath(); g.ellipse(x, y, 9 + r() * 7, 4 + r() * 3, r() * 3, 0, 7); g.fill(); } });
leafTex.wrapS = leafTex.wrapT = THREE.RepeatWrapping; leafTex.repeat.set(3, 2);
const canopyM = new THREE.MeshStandardMaterial({ vertexColors: true, map: leafTex, bumpMap: leafTex, bumpScale: 2.5, roughness: .82 });
function clump(r, seed, base) {
  const geo = lumpy(new THREE.SphereGeometry(r, 30, 22), r * .09, 2.4 / r, seed); const n = geo.attributes.normal, cols = new Float32Array(n.count * 3);
  const dark = new THREE.Color('#2f8a2c'), light = new THREE.Color('#9be05a'), c = new THREE.Color();
  for (let i = 0; i < n.count; i++) { const k = Math.pow(n.getY(i) * .5 + .5, 1.3); c.copy(dark).lerp(light, k).multiplyScalar(base); cols.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); return geo;
}
export function tree(parent, x, z, s = 1, seed = 1) {
  const g = grp(parent, x, 0, z); const r = rng(seed * 97 + 3);
  const bark = std('#8a5a3b', { roughness: .9 });
  const trunk = new THREE.CylinderGeometry(.15, .27, 2.5, 14); trunk.translate(0, 1.25, 0); mesh(trunk, bark, g);
  for (const s2 of [-1, 1]) { const b = new THREE.CylinderGeometry(.05, .09, .9, 8); b.translate(0, .45, 0); const m = mesh(b, bark, g, s2 * .05, 2.0, 0); m.rotation.z = s2 * -.7; }
  const pts = [[0, 3.2, 0, 1.1]]; for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + r(), el = (r() - .3) * 1.1; pts.push([Math.cos(a) * Math.cos(el) * 1.05, 3.15 + Math.sin(el) * .85, Math.sin(a) * Math.cos(el) * 1.0, .55 + r() * .35]); }
  pts.push([0, 4.15, 0, .75]);
  for (const [bx, by, bz, br] of pts) mesh(clump(br, r() * 50, .9 + r() * .2), canopyM, g, bx, by, bz);
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

function colored(geo, hex) { const c = new THREE.Color(hex), n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; }
function nonIdx(g) { return g.index ? g.toNonIndexed() : g; }
export function swingSet(parent, x, z, ry = 0) {
  const g = grp(parent, x, 0, z); g.rotation.y = ry; const red = std('#e8463f', { roughness: .45 }), yel = std('#ffc93c', { roughness: .5 }), rope = std('#e8e2d4', { roughness: .9 });
  const W2 = 1.35, H = 2.2;
  for (const s of [-1, 1]) for (const f of [-1, 1]) { const l = mesh(new THREE.CylinderGeometry(.045, .05, H * 1.08, 12), red, g, s * W2, H / 2, f * .42); l.rotation.x = f * -.36; }
  const top = mesh(new THREE.CylinderGeometry(.055, .055, W2 * 2 + .2, 14), red, g, 0, H, 0); top.rotation.z = Math.PI / 2;
  for (const sx of [-.55, .55]) { for (const rx of [-.2, .2]) mesh(new THREE.CylinderGeometry(.008, .008, 1.55, 6), rope, g, sx + rx, H - .78, 0, false); mesh(rb(.5, .05, .22, .02), yel, g, sx, H - 1.56, 0); }
  return g;
}
export function sandbox(parent, x, z) {
  const g = grp(parent, x, 0, z); const wood = std('#d9a066', { roughness: .8 });
  for (const [px, pz, w, d] of [[0, -.7, 1.6, .12], [0, .7, 1.6, .12], [-.74, 0, .12, 1.52], [.74, 0, .12, 1.52]]) mesh(rb(w, .2, d, .03), wood, g, px, .1, pz);
  const sandT = ctex(128, 128, (gg) => { gg.fillStyle = '#f3dba0'; gg.fillRect(0, 0, 128, 128); const r = rng(2); for (let i = 0; i < 900; i++) { gg.fillStyle = r() > .5 ? 'rgba(255,250,220,.5)' : 'rgba(190,150,90,.25)'; gg.fillRect(r() * 128, r() * 128, 2, 2); } });
  const sand = mesh(new THREE.PlaneGeometry(1.4, 1.3), std('#ffffff', { map: sandT, roughness: 1 }), g, 0, .14, 0, false); sand.rotation.x = -Math.PI / 2;
  const bucket = mesh(new THREE.CylinderGeometry(.12, .09, .18, 24, 1, true), std('#e8463f', { roughness: .35, side: THREE.DoubleSide }), g, .35, .23, .2);
  mesh(new THREE.TorusGeometry(.11, .008, 8, 20, Math.PI), std('#ffc93c'), g, .35, .3, .2);
  const sp = grp(g, -.3, .17, .1); sp.rotation.set(0, .6, .2); mesh(rb(.12, .02, .16, .01), std('#4f8fe0', { roughness: .4 }), sp, 0, 0, 0); mesh(new THREE.CylinderGeometry(.012, .012, .25, 8), std('#4f8fe0'), sp, 0, .02, -.18).rotation.x = Math.PI / 2;
  return g;
}
export function scatter(parent, seed) {
  const r = rng(seed * 55 + 9);
  // daisies in the lawn
  const petals = []; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const p = new THREE.SphereGeometry(.022, 8, 6); p.scale(1, .3, .55); p.rotateY(-a); p.translate(Math.cos(a) * .024, .03, Math.sin(a) * .024); petals.push(colored(nonIdx(p), '#ffffff')); }
  const ctr = new THREE.SphereGeometry(.014, 8, 6); ctr.translate(0, .034, 0); const stem = new THREE.CylinderGeometry(.003, .003, .03, 4); stem.translate(0, .015, 0);
  const daisy = mergeGeometries([...petals, colored(nonIdx(ctr), '#ffc928'), colored(nonIdx(stem), '#3c9a2e')]);
  const dm = new THREE.InstancedMesh(daisy, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6 }), 420); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 420; i++) { let px, pz; do { px = (r() - .5) * 17; pz = -6 + r() * 13; } while (Math.hypot(px, pz) < .9 || (Math.abs(px) < .6 && pz < -3)); const s = .8 + r() * .7; m4.compose(new THREE.Vector3(px, 0, pz), q.setFromEuler(e.set(0, r() * 6, 0)), new THREE.Vector3(s, s, s)); dm.setMatrixAt(i, m4); }
  dm.receiveShadow = true; parent.add(dm);
  // grass tufts along the fence, beds and tree bases
  const blades = []; for (let k = 0; k < 6; k++) { const c = new THREE.ConeGeometry(.012, .13 + (k % 3) * .04, 4); c.translate(0, .07, 0); c.rotateZ((k - 2.5) * .12); c.rotateY(k * 1.1); c.translate((k - 2.5) * .012, 0, ((k * 5) % 3 - 1) * .012); blades.push(colored(nonIdx(c), k % 2 ? '#4caa36' : '#6cc548')); }
  const tuft = mergeGeometries(blades); const tm = new THREE.InstancedMesh(tuft, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8 }), 600);
  for (let i = 0; i < 600; i++) {
    const zone = r(); let px, pz;
    if (zone < .45) { px = (r() < .5 ? -1 : 1) * (8.75 - r() * .3); pz = -6 + r() * 13; } else if (zone < .7) { px = (r() - .5) * 18; pz = -5.95 - r() * .2; }
    else if (zone < .85) { const a = r() * 6.28, d = .3 + r() * .6; px = -5.6 + Math.cos(a) * d; pz = -3.4 + Math.sin(a) * d; } else { px = (r() - .5) * 16; pz = -5 + r() * 11; if (Math.hypot(px, pz) < 1.2) px += 2.5; }
    const s = .9 + r() * .9; m4.compose(new THREE.Vector3(px, 0, pz), q.setFromEuler(e.set(0, r() * 6, 0)), new THREE.Vector3(s, s * (.8 + r() * .6), s)); tm.setMatrixAt(i, m4);
  }
  tm.castShadow = false; tm.receiveShadow = true; parent.add(tm);
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
  swingSet(W, -7.0, .6, Math.PI / 2); sandbox(W, 3.0, -2.2); scatter(W, 1);
  // toys: red ball, little garden table with the bubble bottle
  mesh(new THREE.SphereGeometry(.22, 32, 24), std('#ef4b4b', { roughness: .35 }), W, 2.7, .22, 1.6);
  const tg = grp(W, 1.55, 0, -.9);   // (garden table removed - read as an odd white disc in wide frames)
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
  const rim = new THREE.DirectionalLight('#fff0d6', 1.6); rim.position.set(2.5, 5, -7); scene.add(rim);
  return { sun, fill, rim };
}

// soft outdoor environment for reflections (sky gradient + lawn bounce)
export function envMap(renderer) {
  const es = new THREE.Scene(); es.add(skyDome());
  const g = new THREE.Mesh(new THREE.CircleGeometry(300, 32), new THREE.MeshBasicMaterial({ color: '#4f8f33' })); g.rotation.x = -Math.PI / 2; g.position.y = -2; es.add(g);
  const sunb = new THREE.Mesh(new THREE.SphereGeometry(20, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 7.5, 6.5) })); sunb.position.set(-120, 140, 130); es.add(sunb);
  const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(es, 0.02); pm.dispose(); return rt.texture;
}
