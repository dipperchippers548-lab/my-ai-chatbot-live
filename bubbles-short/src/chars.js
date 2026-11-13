// Original cast, built from smooth primitives: Lulu (toddler), Biscuit (puppy), Bobble (a giant bubble with a face).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ctex, std, phys, mesh, grp, lumpy, clamp, lerp, rng } from './lib.js';

// ---------- shared face parts ----------
function eyeTex(iris, ring, irisR = .6) {
  // sphere UV: +z faces u=.25, v=.5 ; 81.5 px per radian on a 512x256 map
  return ctex(512, 256, (g) => {
    g.fillStyle = '#fbfbfb'; g.fillRect(0, 0, 512, 256);
    const cx = 128, cy = 128, R = irisR * 81.5;
    const gr = g.createRadialGradient(cx, cy - R * .25, R * .1, cx, cy, R);
    gr.addColorStop(0, ring); gr.addColorStop(.72, iris); gr.addColorStop(1, '#0d0705');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    // iris fibres
    g.strokeStyle = 'rgba(255,220,180,.10)'; g.lineWidth = 2; for (let a = 0; a < 6.28; a += .16) { g.beginPath(); g.moveTo(cx + Math.cos(a) * R * .52, cy + Math.sin(a) * R * .52); g.lineTo(cx + Math.cos(a) * R * .92, cy + Math.sin(a) * R * .92); g.stroke(); }
    g.fillStyle = '#0a0604'; g.beginPath(); g.arc(cx, cy, R * .46, 0, 7); g.fill();
    // soft shadow of the upper lid on the eyeball
    const sh = g.createLinearGradient(0, cy - 115, 0, cy - 30); sh.addColorStop(0, 'rgba(120,90,80,.35)'); sh.addColorStop(1, 'rgba(120,90,80,0)'); g.fillStyle = sh; g.fillRect(0, 0, 512, cy - 30);
  });
}
const glint = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.6, 1.6), toneMapped: false });
const lashM = std('#24130c', { roughness: .5 });
export function makeEye(parent, r, pos, tex, skinMat, lidOpen = -.88, noLid = false, lashes = 0, side = 1) {
  const g = grp(parent, ...pos);
  const ball = mesh(new THREE.SphereGeometry(r, 40, 28), phys('#ffffff', { map: tex, roughness: .2, clearcoat: .6, clearcoatRoughness: .1, envMapIntensity: .25, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: .22 }), g, 0, 0, 0, false);
  const lid = mesh(new THREE.SphereGeometry(r * 1.07, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), skinMat, g, 0, 0, 0, false);
  lid.material = skinMat; lid.rotation.x = lidOpen; lid.visible = !noLid;
  if (lashes && !noLid) {
    // dark lash line along the lid edge (+ two little flicks at the outer corner)
    const line = new THREE.Mesh(new THREE.TorusGeometry(r * 1.075, r * .075, 8, 32, Math.PI * 1.04), lashM); line.rotation.set(Math.PI / 2, 0, -Math.PI * .02); lid.add(line);
    if (lashes > 1) for (let k = 0; k < 2; k++) {
      const a = (side > 0 ? .12 : Math.PI - .12) + side * k * -.32; const f = mesh(new THREE.CapsuleGeometry(r * .045, r * .3, 4, 8), lashM, lid, Math.cos(a) * r * 1.12, 0, Math.sin(a) * r * 1.12, false);
      f.rotation.set(0, 0, side * (1.1 + k * .25)); f.position.y = r * .06; f.rotation.y = -a + Math.PI / 2;
    }
  }
  // catchlights stay fixed to the head, not the eyeball
  const g1 = mesh(new THREE.SphereGeometry(r * .15, 14, 10), glint, g, -r * .24, r * .24, r * .98, false);
  const g2 = mesh(new THREE.SphereGeometry(r * .075, 12, 8), glint, g, r * .22, -r * .2, r * .99, false);
  return { g, ball, lid, open: lidOpen, noLid, glints: [g1, g2] };
}
export function setEye(e, blink, lookX = 0, lookY = 0, wide = 0) {
  e.ball.rotation.set(-lookY, lookX, 0);
  if (e.noLid) { e.g.scale.y = 1 - .92 * clamp(blink); return; }
  e.lid.rotation.x = lerp(e.open - wide * .25, 1.62, clamp(blink));
  const shut = clamp(blink) > .55; e.glints.forEach(x => x.visible = !shut);
}
// curved decal that hugs a deformed sphere surface
function decal(parent, R, deform, center, w, h, mat, lift = .0015) {
  const geo = new THREE.PlaneGeometry(w, h, 16, 16), p = geo.attributes.position;
  const c = new THREE.Vector3(...center).normalize(), up0 = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up0, c).normalize(), up = new THREE.Vector3().crossVectors(c, right).normalize();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const d = c.clone().addScaledVector(right, Math.tan(x / R)).addScaledVector(up, Math.tan(y / R)).normalize();
    const v = deform(d.clone().multiplyScalar(R)); v.addScaledVector(d, lift); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; parent.add(m); return m;
}
const blushTex = ctex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,120,130,.6)'); gr.addColorStop(1, 'rgba(255,120,130,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const blushMat = new THREE.MeshStandardMaterial({ map: blushTex, transparent: true, depthWrite: false, roughness: .6, polygonOffset: true, polygonOffsetFactor: -2 });

// a ball covered in little curls (stylised curly hair)
function curlyBall(R, n, rr, seed, polarMax = Math.PI) {
  const base = new THREE.SphereGeometry(R, 48, 32, 0, Math.PI * 2, 0, polarMax);
  const parts = [base]; const r = rng(seed * 101 + 7); const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i + .5) / n * 2, rad = Math.sqrt(1 - y * y), th = ga * i + (r() - .5) * .3; const p = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad);
    if (Math.acos(p.y) > polarMax - .05) continue;
    const s = new THREE.SphereGeometry(rr * (.75 + r() * .5), 16, 12); const d = R * (.955 + r() * .02); s.translate(p.x * d, p.y * d, p.z * d); parts.push(s);
  }
  return mergeGeometries(parts.map(p => p.toNonIndexed()));   // keep each part's smooth normals
}

// painted mouth (redrawn only when its shape changes). shapes: smile (closed), ah, eh, ee, oo, ow
function mouthPainter(o = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const line = o.line || '#5a2418', inside = o.inside || '#6e1d26', tongue = o.tongue || '#f27d8e'; let key = '';
  function draw(open, shape = 'ah', width = 1) {
    if (shape === 'smile') shape = 'ah';
    const k = shape + Math.round(open * 20) + Math.round(width * 10); if (k === key) return; key = k;
    g.clearRect(0, 0, 256, 256); g.lineCap = g.lineJoin = 'round';
    const cx = 128, cy = 112;
    if ((shape === 'oo' || shape === 'ow') && open > .08) {
      const r = (shape === 'ow' ? 20 : 15) + open * (shape === 'ow' ? 20 : 12); g.fillStyle = inside; g.beginPath(); g.ellipse(cx, cy + 10, r * .82, r, 0, 0, 7); g.fill();
      g.save(); g.clip(); g.fillStyle = tongue; g.beginPath(); g.ellipse(cx, cy + 10 + r * .75, r * .6, r * .45, 0, 0, 7); g.fill(); g.restore();
      g.lineWidth = 7; g.strokeStyle = line; g.beginPath(); g.ellipse(cx, cy + 10, r * .82, r, 0, 0, 7); g.stroke();
    } else if (open < .08) {
      const w = 46 * width; g.strokeStyle = line; g.lineWidth = 9; g.beginPath(); g.moveTo(cx - w, cy - 4); g.quadraticCurveTo(cx, cy + 30, cx + w, cy - 4); g.stroke();
      g.lineWidth = 5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * (w + 2), cy - 10); g.quadraticCurveTo(cx + s * (w + 8), cy - 4, cx + s * (w + 4), cy + 2); g.stroke(); }
    } else {
      const ws = shape === 'ee' ? 1.24 : shape === 'eh' ? 1.12 : 1, hs = shape === 'ee' ? .5 : shape === 'eh' ? .78 : 1;
      const w = (50 + open * 8) * width * ws, h = (14 + open * 72) * hs;
      g.beginPath(); g.moveTo(cx - w, cy - 8); g.quadraticCurveTo(cx, cy + 10, cx + w, cy - 8); g.bezierCurveTo(cx + w * .9, cy + h * .9, cx - w * .9, cy + h * .9, cx - w, cy - 8); g.closePath();
      g.fillStyle = inside; g.fill(); g.save(); g.clip();
      g.fillStyle = tongue; g.beginPath(); g.ellipse(cx, cy + h * .78 + 6, w * .55, h * .38 + 6, 0, 0, 7); g.fill();
      if (o.teeth !== false) { g.fillStyle = '#fffaf2'; g.beginPath(); g.ellipse(cx, cy - 6, w * (shape === 'ee' ? .7 : .55), shape === 'ee' ? 13 : 11, 0, 0, 7); g.fill(); }
      g.restore(); g.lineWidth = 6; g.strokeStyle = line;
      g.beginPath(); g.moveTo(cx - w, cy - 8); g.quadraticCurveTo(cx, cy + 10, cx + w, cy - 8); g.bezierCurveTo(cx + w * .9, cy + h * .9, cx - w * .9, cy + h * .9, cx - w, cy - 8); g.closePath(); g.stroke();
    }
    tex.needsUpdate = true;
  }
  draw(0); return { tex, draw };
}

// chubby toddler hand: palm + 4 fingers on knuckle pivots + thumb. side s = -1 left / +1 right
function makeHand(parent, skin, s) {
  const hand = grp(parent, 0, -.095, 0);
  const palm = mesh(new THREE.SphereGeometry(.033, 22, 16), skin, hand, 0, -.016, 0); palm.scale.set(1.08, 1.0, .74);
  const fingers = [];
  for (let f = 0; f < 4; f++) {
    const k = grp(hand, (f - 1.5) * .0155, -.038, .002); const len = [.018, .022, .021, .016][f];
    mesh(new THREE.CapsuleGeometry(.0088, len, 6, 10), skin, k, 0, -len / 2 - .004, 0);
    k.rotation.z = (f - 1.5) * -.07; fingers.push(k);
  }
  const tk = grp(hand, -s * .027, -.016, .012); // thumb on the inner side
  mesh(new THREE.CapsuleGeometry(.0105, .016, 6, 10), skin, tk, 0, -.012, 0); tk.rotation.set(-.5, 0, s * .75);
  return { hand, fingers, thumb: tk };
}
function poseHand(h, curl = .25, point = 0) {
  h.fingers.forEach((f, i) => { const c = (i === 0 ? lerp(curl, 0, point) : curl); f.rotation.x = -c * 1.5; });
  h.thumb.rotation.x = -.5 - curl * .6;
}

// ---------- Lulu ----------
const SKIN = '#c4875a';
export function makeLulu() {
  const root = grp(null); const J = { root };
  const skin = phys(SKIN, { roughness: .48, sheen: .7, sheenColor: new THREE.Color('#ffb48a'), sheenRoughness: .45, emissive: '#6a2c10', emissiveIntensity: .14 });
  const stripes = ctex(256, 256, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#21b3ad'; for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 256, 30); g.fillStyle = 'rgba(0,0,0,.04)'; for (let x = 0; x < 256; x += 4) g.fillRect(x, 0, 1, 256); });
  stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping; stripes.repeat.set(1, 2.2);
  const shirt = std('#ffffff', { map: stripes, roughness: .8 });
  const sleeveTex = stripes.clone(); sleeveTex.repeat.set(1, 1.2); sleeveTex.needsUpdate = true; const sleeve = std('#ffffff', { map: sleeveTex, roughness: .8 });
  const teal = std('#21b3ad', { roughness: .7 });
  const denimTex = ctex(256, 256, (g) => { g.fillStyle = '#ffc93c'; g.fillRect(0, 0, 256, 256); const r = rng(4); for (let i = 0; i < 1400; i++) { g.fillStyle = r() > .5 ? 'rgba(255,240,170,.18)' : 'rgba(200,130,20,.12)'; g.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1); } });
  denimTex.wrapS = denimTex.wrapT = THREE.RepeatWrapping; denimTex.repeat.set(3, 3);
  const yellow = std('#ffffff', { map: denimTex, roughness: .7 }), red = phys('#e8423f', { roughness: .35, clearcoat: .4 }), white = std('#ffffff', { roughness: .5 });
  const hairM = phys('#2e1a12', { roughness: .55, sheen: .6, sheenColor: new THREE.Color('#8a5a40'), sheenRoughness: .4 }), tie = phys('#55c4f2', { roughness: .15, clearcoat: 1 });

  const hips = J.hips = grp(root, 0, .232, 0);
  const torso = J.torso = grp(hips, 0, 0, 0);
  const prof = [[0, -.03], [.114, -.02], [.136, .04], [.142, .105], [.133, .165], [.117, .212], [.087, .243], [.052, .262], [0, .268]].map(([r, y]) => new THREE.Vector2(r, y));
  mesh(new THREE.LatheGeometry(prof, 44), shirt, torso);
  const oprof = [[0, -.045], [.12, -.036], [.143, .03], [.148, .1], [.146, .125]].map(([r, y]) => new THREE.Vector2(r, y));
  mesh(new THREE.LatheGeometry(oprof, 44), yellow, torso);
  mesh(new THREE.TorusGeometry(.146, .006, 8, 44), std('#e8aa22', { roughness: .7 }), torso, 0, .125, 0).rotation.x = Math.PI / 2;   // waist seam
  const bibTex = ctex(256, 192, (g) => {
    g.fillStyle = '#ffc93c'; g.fillRect(0, 0, 256, 192); g.setLineDash([9, 7]); g.lineWidth = 4; g.strokeStyle = '#d99a1c';
    g.beginPath(); g.roundRect(12, 12, 232, 168, 18); g.stroke();
    g.fillStyle = '#ffd25a'; g.beginPath(); g.roundRect(58, 78, 140, 98, 20); g.fill(); g.beginPath(); g.roundRect(58, 78, 140, 98, 20); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#7fd3f7'; g.beginPath(); g.arc(128, 128, 34, 0, 7); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(116, 116, 9, 6, -.6, 0, 7); g.fill(); g.beginPath(); g.arc(150, 96, 9, 0, 7); g.fillStyle = '#b8ecff'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
  });
  const bib = mesh(new RoundedBoxGeometry(.155, .115, .03, 3, .012), std('#ffffff', { map: bibTex, roughness: .7 }), torso, 0, .157, .12); bib.rotation.x = -.12;
  for (const s of [-1, 1]) {
    const st = mesh(new RoundedBoxGeometry(.028, .1, .014, 2, .006), yellow, torso, s * .056, .228, .095); st.rotation.x = -.75; st.rotation.z = s * -.12;
    mesh(new THREE.CylinderGeometry(.013, .013, .008, 16), std('#d9a62a', { metalness: .5, roughness: .3 }), torso, s * .056, .205, .138).rotation.x = Math.PI / 2 - .12;
  }
  mesh(new THREE.TorusGeometry(.05, .009, 10, 30), teal, torso, 0, .258, 0).rotation.x = Math.PI / 2;   // collar
  mesh(new THREE.CylinderGeometry(.042, .046, .04, 20), skin, torso, 0, .27, 0);
  // head (a touch bigger than v1)
  const R = .175;
  const deform = (v) => { const n = v.clone().normalize(); const cheek = Math.exp(-(((n.y + .38) / .3) ** 2)) * clamp((n.z + .2) / .8); const f = 1 + .085 * cheek; const chin = n.y < -.6 ? 1 - .1 * (-n.y - .6) / .4 : 1; return new THREE.Vector3(v.x * f * chin, v.y * .965, v.z * f * .975 * chin); };
  const neck = J.neck = grp(torso, 0, .28, 0); const head = J.head = grp(neck, 0, .152, .008); head.scale.setScalar(1.07);
  const hg = new THREE.SphereGeometry(R, 72, 54); { const p = hg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const d = deform(v); p.setXYZ(i, d.x, d.y, d.z); } hg.computeVertexNormals(); }
  mesh(hg, skin, head);
  for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(.036, 20, 16), skin, head, s * .168, -.015, -.01); e.scale.set(.55, 1, .8); const inner = mesh(new THREE.TorusGeometry(.016, .005, 8, 16, 4), std('#a96a44', { roughness: .6 }), head, s * .186, -.015, -.004, false); inner.rotation.set(0, s * Math.PI / 2, .8); }
  const capG = curlyBall(R * 1.045, 300, .0135, 3, 1.42); const capm = mesh(capG, hairM, head); capm.rotation.x = -.62;
  for (const s of [-1, 1]) {
    const puff = mesh(curlyBall(.094, 170, .021, s + 5), hairM, head, s * .142, .138, -.048); puff.scale.set(1, .95, .95);
    mesh(new THREE.TorusGeometry(.035, .014, 12, 24), tie, head, s * .102, .088, -.02).rotation.set(.4, s * .9, s * .6);
    mesh(new THREE.SphereGeometry(.023, 16, 12), tie, head, s * .085, .072, .0);
  }
  const curl = mesh(new THREE.TorusGeometry(.018, .009, 10, 20, 4.4), hairM, head, -.03, .16, .09); curl.rotation.set(-.5, .3, 1.2);
  const etex = eyeTex('#3a1d0e', '#8a4a1f', .66);
  J.eyes = [-1, 1].map(s => makeEye(head, .052, [s * .071, .012, .128], etex, skin, -.9, false, 2, s));
  const browM = std('#2e1a12', { roughness: .6 });
  J.brows = [-1, 1].map(s => { const b = grp(head, s * .073, .088, .158); const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.028, -.004, 0), new THREE.Vector3(0, .01, .006), new THREE.Vector3(.028, -.004, 0)); mesh(new THREE.TubeGeometry(curve, 12, .0068, 8), browM, b, 0, 0, 0, false); b.rotation.z = s * -.12; return b; });
  const nose = mesh(new THREE.SphereGeometry(.0145, 20, 14), skin, head, 0, -.042, .174); nose.scale.set(1.35, .8, .85);
  const mp = J.mouthP = mouthPainter();
  decal(head, R, deform, [0, -.56, .83], .15, .15, new THREE.MeshStandardMaterial({ map: mp.tex, transparent: true, roughness: .5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
  for (const s of [-1, 1]) decal(head, R, deform, [s * .55, -.24, .8], .08, .065, blushMat);
  // arms
  J.arms = [-1, 1].map(s => {
    const sh = grp(torso, s * .118, .205, 0); mesh(new THREE.CapsuleGeometry(.04, .052, 8, 20), sleeve, sh, 0, -.048, 0);
    mesh(new THREE.TorusGeometry(.037, .0065, 8, 24), teal, sh, 0, -.083, 0).rotation.x = Math.PI / 2;      // sleeve cuff
    const el = grp(sh, 0, -.1, 0); mesh(new THREE.CapsuleGeometry(.032, .058, 8, 16), skin, el, 0, -.045, 0);
    const H = makeHand(el, skin, s);
    return { sh, el, hand: H.hand, H, s };
  });
  // legs (a little shorter than v1)
  J.legs = [-1, 1].map(s => {
    const hp = grp(hips, s * .063, 0, 0); mesh(new THREE.CapsuleGeometry(.051, .04, 8, 18), yellow, hp, 0, -.045, 0);
    const kn = grp(hp, 0, -.095, 0); mesh(new THREE.CapsuleGeometry(.045, .03, 8, 18), yellow, kn, 0, -.03, 0);
    mesh(new THREE.TorusGeometry(.046, .01, 10, 26), yellow, kn, 0, -.058, 0).rotation.x = Math.PI / 2;    // rolled hem
    mesh(new THREE.CylinderGeometry(.039, .039, .03, 18), white, kn, 0, -.074, 0);
    mesh(new THREE.TorusGeometry(.04, .006, 8, 24), white, kn, 0, -.062, 0).rotation.x = Math.PI / 2;      // sock frill
    const ft = grp(kn, 0, -.09, 0); const shoe = mesh(new THREE.SphereGeometry(.06, 28, 18), red, ft, 0, -.012, .028); shoe.scale.set(.92, .72, 1.45);
    const toe = mesh(new THREE.SphereGeometry(.06, 24, 16, 0, Math.PI * 2, Math.PI * .45, Math.PI * .55), white, ft, 0, -.013, .045); toe.scale.set(.86, .7, 1.1); toe.rotation.x = -Math.PI / 2 + .25;
    const strap = mesh(new RoundedBoxGeometry(.1, .016, .045, 2, .007), white, ft, 0, .016, .018); strap.rotation.x = -.35;
    const sole = mesh(new THREE.CylinderGeometry(.056, .058, .018, 24), white, ft, 0, -.045, .028); sole.scale.z = 1.5;
    return { hp, kn, ft, s };
  });
  // bubble wand (held in the right fist) - ring position exported for emitters
  const wand = J.wand = grp(J.arms[1].hand, 0, -.045, .012);
  mesh(new THREE.CylinderGeometry(.007, .007, .26, 10), phys('#ff6fae', { roughness: .25, clearcoat: 1 }), wand, 0, .11, 0);
  const ring = mesh(new THREE.TorusGeometry(.04, .008, 10, 28), phys('#ff6fae', { roughness: .25, clearcoat: 1 }), wand, 0, .27, 0);
  const film = mesh(new THREE.CircleGeometry(.04, 24), new THREE.MeshPhysicalMaterial({ color: '#d8f2ff', transparent: true, opacity: .28, roughness: .05, iridescence: 1, side: THREE.DoubleSide, depthWrite: false }), wand, 0, .27, 0, false);
  J.ring = ring; J.film = film;
  root.traverse(o => { if (o.isMesh) { o.castShadow = o.castShadow !== false; } });
  return J;
}

// pose Lulu: p = {lean, turn, sway, headTilt, headTurn, nod, armL/armR:[shX,shZ,el,shY,handX], crouch, jump, look:[x,y], blink, wide, mouth, shape, brows, curlL, curlR, pointL}
export function poseLulu(J, p) {
  J.hips.position.y = .232 - (p.crouch || 0) * .06 + (p.jump || 0);
  J.hips.rotation.set(0, p.turn || 0, p.sway || 0);
  J.torso.rotation.set(p.lean || 0, p.twist || 0, (p.sway || 0) * -.6);
  J.neck.rotation.set((p.nod || 0) * .5, (p.headTurn || 0) * .5, (p.headTilt || 0) * .5);
  J.head.rotation.set((p.nod || 0) * .5, (p.headTurn || 0) * .5, (p.headTilt || 0) * .5);
  const arm = (a, v) => { a.sh.rotation.set(v[0], v[3] || 0, a.s * v[1]); a.el.rotation.set(v[2], 0, 0); a.hand.rotation.set(v[4] || 0, 0, 0); };
  arm(J.arms[0], p.armL || [0, .25, -.2]); arm(J.arms[1], p.armR || [0, .25, -.2]);
  poseHand(J.arms[0].H, p.curlL ?? .3, p.pointL || 0); poseHand(J.arms[1].H, p.curlR ?? 1.15, 0);
  const crouch = p.crouch || 0;
  const leg = (l, v) => { l.hp.rotation.set(-(v[0] || 0) - crouch * .9, 0, l.s * (v[2] || .02)); l.kn.rotation.set((v[1] || 0) + crouch * 1.6, 0, 0); l.ft.rotation.set(-(v[1] || 0) * .5 - crouch * .7 + (v[0] || 0) * .3, 0, 0); };
  leg(J.legs[0], p.legL || [0, 0]); leg(J.legs[1], p.legR || [0, 0]);
  const lk = p.look || [0, 0];
  for (const e of J.eyes) setEye(e, p.blink || 0, lk[0], lk[1], p.wide || 0);
  J.brows.forEach((br) => { br.position.y = .088 + (p.brows || 0) * .014; });
  J.mouthP.draw(p.mouth || 0, p.shape || 'ah', p.mouthW || 1);
  J.wand.visible = p.wand !== false;
}

// ---------- Biscuit ----------
export function makeBiscuit() {
  const root = grp(null); const J = { root };
  const furTex = ctex(256, 256, (g) => { g.fillStyle = '#f3dcb8'; g.fillRect(0, 0, 256, 256); const r = rng(8); for (let i = 0; i < 2500; i++) { g.strokeStyle = r() > .5 ? 'rgba(255,248,232,.22)' : 'rgba(205,165,115,.08)'; g.lineWidth = 1.5; const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 3, y + 4 + r() * 4); g.stroke(); } });
  furTex.wrapS = furTex.wrapT = THREE.RepeatWrapping; furTex.repeat.set(2, 2);
  const fur = phys('#ffffff', { map: furTex, roughness: .8, sheen: 1, sheenColor: new THREE.Color('#fff2dd'), sheenRoughness: .6 });
  const muzzleM = phys('#fff4e6', { roughness: .8, sheen: 1, sheenColor: new THREE.Color('#ffffff') });
  const earM = phys('#c47a3f', { roughness: .75, sheen: 1, sheenColor: new THREE.Color('#ffd0a0') });
  const body = J.body = grp(root, 0, .2, 0);
  const torso = mesh(new THREE.CapsuleGeometry(.12, .15, 10, 28), fur, body, 0, 0, -.01); torso.rotation.x = Math.PI / 2;
  const chest = mesh(new THREE.SphereGeometry(.118, 28, 20), muzzleM, body, 0, -.005, .1); chest.scale.set(.95, 1, .9);
  J.legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const l = grp(body, sx * .075, -.05, sz * .105); mesh(new THREE.CapsuleGeometry(.043, .07, 8, 16), fur, l, 0, -.06, 0);
    const paw = mesh(new THREE.SphereGeometry(.048, 20, 14), muzzleM, l, 0, -.12, .014); paw.scale.set(1, .68, 1.22);
    for (let k = -1; k <= 1; k++) { const tl = mesh(new THREE.CapsuleGeometry(.0028, .018, 3, 6), std('#d8bfa0'), l, k * .016, -.125, .068, false); tl.rotation.x = Math.PI / 2; }
    return l;
  });
  const tail = J.tail = grp(body, 0, .06, -.17); mesh(new THREE.CapsuleGeometry(.026, .09, 6, 12), fur, tail, 0, .06, 0); tail.rotation.x = -.6;
  mesh(new THREE.SphereGeometry(.034, 14, 10), muzzleM, tail, 0, .12, 0);
  const neck = J.neck = grp(body, 0, .1, .13);
  mesh(new THREE.TorusGeometry(.078, .017, 12, 30), phys('#e2383f', { roughness: .35, clearcoat: .6 }), neck, 0, -.02, -.01).rotation.x = Math.PI / 2 - .35;
  mesh(new THREE.SphereGeometry(.022, 16, 12), std('#f4c542', { metalness: .7, roughness: .25 }), neck, 0, -.07, .07);
  const head = J.head = grp(neck, 0, .11, .03);
  const R = .14; const deform = v => new THREE.Vector3(v.x * 1.06, v.y * .95, v.z);
  const hg = new THREE.SphereGeometry(R, 56, 40); { const p = hg.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const d = deform(v); p.setXYZ(i, d.x, d.y, d.z); } hg.computeVertexNormals(); }
  mesh(hg, fur, head);
  const patchTex = ctex(128, 128, (g) => { g.fillStyle = '#c47a3f'; g.beginPath(); g.ellipse(64, 64, 58, 50, .3, 0, 7); g.fill(); });
  decal(head, R, deform, [.42, .2, .88], .1, .09, new THREE.MeshStandardMaterial({ map: patchTex, transparent: true, roughness: .8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  const muz = mesh(new THREE.SphereGeometry(.07, 32, 24), muzzleM, head, 0, -.045, .1); muz.scale.set(1.18, .82, 1);
  const nose = mesh(new THREE.SphereGeometry(.026, 20, 14), phys('#2a1a16', { roughness: .2, clearcoat: 1 }), head, 0, -.018, .168); nose.scale.set(1.4, .92, .9);
  // smiling mouth line on the muzzle
  const mouthTex = ctex(128, 64, (g) => { g.strokeStyle = '#6b4a3a'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(64, 6); g.lineTo(64, 24); g.moveTo(26, 22); g.quadraticCurveTo(44, 44, 64, 24); g.quadraticCurveTo(84, 44, 102, 22); g.stroke(); });
  const mm = mesh(new THREE.PlaneGeometry(.06, .03), new THREE.MeshStandardMaterial({ map: mouthTex, transparent: true, depthWrite: false, roughness: .7, polygonOffset: true, polygonOffsetFactor: -3 }), head, 0, -.055, .158, false); mm.rotation.x = -.35;
  J.jaw = grp(head, 0, -.075, .08); mesh(new THREE.SphereGeometry(.05, 24, 16), std('#7a2a2e', { roughness: .6 }), head, 0, -.075, .1).scale.set(1, .6, .8);
  const jawM = mesh(new THREE.SphereGeometry(.05, 24, 16), muzzleM, J.jaw, 0, -.012, .025); jawM.scale.set(1.05, .55, .95);
  const tng = mesh(new THREE.SphereGeometry(.03, 16, 12), std('#f27d8e', { roughness: .5 }), J.jaw, 0, .006, .05); tng.scale.set(1, .4, 1.2);
  const etex = eyeTex('#1e0f08', '#5a3218', .8);
  J.eyes = [-1, 1].map(s => makeEye(head, .041, [s * .062, .035, .1], etex, fur, -.75));
  for (const s of [-1, 1]) { const b = mesh(new THREE.SphereGeometry(.013, 12, 8), earM, head, s * .055, .1, .1, false); b.scale.set(1.4, .6, .6); }
  J.ears = [-1, 1].map(s => {
    const e = grp(head, s * .11, .078, -.015); const m = mesh(new THREE.SphereGeometry(.082, 24, 18), earM, e, s * .02, -.07, 0); m.scale.set(.42, 1, .72);
    const inner = mesh(new THREE.SphereGeometry(.06, 20, 14), std('#e9a882', { roughness: .8 }), e, s * .012, -.075, .012); inner.scale.set(.25, .9, .55);
    e.rotation.z = s * .25; return e;
  });
  for (const s of [-1, 1]) decal(head, R, deform, [s * .5, -.12, .85], .05, .04, blushMat);
  J.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return J;
}
export function poseBiscuit(J, p) {
  J.body.position.y = .2 + (p.hop || 0); J.body.rotation.set(p.pitch || 0, 0, p.roll || 0);
  J.neck.rotation.set(-(p.headUp || 0), p.headTurn || 0, p.headTilt || 0);
  J.tail.rotation.set(-.6 - (p.tailUp || 0), 0, Math.sin(p.wag || 0) * .7);
  J.ears.forEach((e, i) => { const s = i ? 1 : -1; e.rotation.z = s * (.25 + (p.earFlop || 0)); e.rotation.x = p.earBack || 0; });
  J.jaw.rotation.x = (p.mouth || 0) * .55;
  const st = p.step || 0; J.legs.forEach((l, i) => { l.rotation.x = Math.sin(st + (i === 0 || i === 3 ? 0 : Math.PI)) * (p.stride || 0) + (p.tuck || 0) * (i < 2 ? -1 : 1); });
  const lk = p.look || [0, 0]; for (const e of J.eyes) setEye(e, p.blink || 0, lk[0], lk[1], p.wide || 0);
}

// ---------- bubble material (shared by Bobble and the bubble swarm) ----------
export function bubbleMaterial(instanced = false) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { sunDir: { value: new THREE.Vector3(-.5, .62, .6).normalize() }, fillDir: { value: new THREE.Vector3(.6, .3, .74).normalize() }, opacity: { value: 1 }, sharp: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vSeed; varying float vFade;
      void main(){
        #ifdef USE_INSTANCING
          mat4 m = modelMatrix * instanceMatrix;
        #else
          mat4 m = modelMatrix;
        #endif
        vec4 wp = m * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(m) * normal); vV = normalize(cameraPosition - wp.xyz);
        #ifdef USE_INSTANCING_COLOR
          vSeed = instanceColor.r * 37.; vFade = instanceColor.g;
        #else
          vSeed = 3.; vFade = 1.;
        #endif
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform vec3 sunDir, fillDir; uniform float opacity, sharp; varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vSeed; varying float vFade;
      void main(){
        vec3 N = normalize(vN), V = normalize(vV); if (dot(N, V) < 0.) N = -N;
        float ndv = clamp(dot(N, V), 0., 1.); float fr = pow(1. - ndv, 2.4);
        float th = (1. - ndv) * 1.4 + .35 * sin(N.y * 5. + N.x * 3. + vSeed) + .2 * sin(N.x * 9. - vSeed * 1.3);
        vec3 film = .55 + .45 * cos(6.2831 * (th + vec3(0., .33, .67)));
        vec3 R = reflect(-V, N); vec3 env = mix(vec3(.35,.6,.25), mix(vec3(.75,.88,1.), vec3(.35,.6,1.), clamp(R.y,0.,1.)), smoothstep(-.15, .25, R.y));
        float s1 = pow(max(dot(R, sunDir), 0.), 220. * sharp) * 6.; float s2 = pow(max(dot(R, fillDir), 0.), 60. * sharp) * 1.2 / sqrt(sharp);
        float win = smoothstep(1. - .07 / sharp, 1. - .03 / sharp, dot(R, normalize(vec3(-.3, .5, .81)))) * .9;
        vec3 col = env * film * (fr * 1.25 + .05) + vec3(s1 + s2 + win);
        float a = clamp(.035 + fr * .6 + s1 * .4 + win * .3, 0., 1.);
        float nearFade = smoothstep(.3, .7, distance(cameraPosition, vW));   // no lens-hugging blobs
        gl_FragColor = vec4(col * opacity * vFade * nearFade, a * opacity * vFade * nearFade); }`
  });
}

// ---------- Bobble ----------
export function makeBobble() {
  const root = grp(null); const J = { root };
  const R = .46; const body = J.body = grp(root, 0, 0, 0);
  J.shell = mesh(new THREE.SphereGeometry(R, 64, 48), bubbleMaterial(), body, 0, 0, 0, false); J.shell.renderOrder = 5; J.shell.material.uniforms.sharp.value = 7;
  const face = J.face = grp(body, 0, 0, 0);
  const lidM = new THREE.MeshPhysicalMaterial({ color: '#cdeeff', roughness: .1, transparent: true, opacity: .9, iridescence: 1 });
  const etex = eyeTex('#1b2f5e', '#5a8fd8', .74);
  J.eyes = [-1, 1].map(s => makeEye(face, .052, [s * .095, .06, R * .82], etex, lidM, -.5, true));
  const mp = J.mouthP = mouthPainter({ line: '#2a4f86', inside: '#2d4f8a', tongue: '#ff8fb0', teeth: false });
  const mouth = decal(face, R * .97, v => v, [0, -.2, .97], .24, .24, new THREE.MeshBasicMaterial({ map: mp.tex, transparent: true, depthWrite: false }), 0);
  mouth.renderOrder = 4;
  for (const s of [-1, 1]) { const b = decal(face, R * .97, v => v, [s * .48, -.1, .87], .1, .08, new THREE.MeshBasicMaterial({ map: blushTex, transparent: true, depthWrite: false }), 0); b.renderOrder = 4; }
  return J;
}
export function poseBobble(J, p) {
  const w = p.wobble || 0, ph = p.phase || 0;
  J.body.scale.set(1 + w * Math.sin(ph), 1 - w * Math.sin(ph), 1 + w * Math.cos(ph * .7) * .5);
  J.face.visible = (p.face ?? 1) > 0.01; J.face.scale.setScalar(.6 + .4 * (p.face ?? 1));
  for (const e of J.eyes) setEye(e, p.blink || 0, (p.look || [0, 0])[0], (p.look || [0, 0])[1], p.wide || 0);
  J.mouthP.draw(p.mouth || 0, p.shape || 'ah', .8);
  J.shell.material.uniforms.opacity.value = p.opacity ?? 1;
}
