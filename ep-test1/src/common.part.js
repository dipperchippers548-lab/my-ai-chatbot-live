// ================= THE PACKAGE =================
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const newCam = (fov = 45) => new THREE.PerspectiveCamera(fov, W / H, .05, 120);
const look = (cam, px, py, pz, tx, ty, tz) => { cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz); };
const lookV = (cam, p, t) => { cam.position.copy(p); cam.lookAt(t); };
const vl = (a, b, k) => a.clone().lerp(b, k);
const pop = x => x <= 0 ? 0 : Math.min(1, x / .07) * (1 + .32 * Math.exp(-x * 7) * Math.cos(x * 21));
const spring = x => x <= 0 ? 0 : 1 - Math.exp(-x * 7) * Math.cos(x * 11);          // fast move that overshoots a little and settles
const shake = (cam, t, a) => { cam.position.x += Math.sin(t * 91) * a; cam.position.y += Math.cos(t * 73) * a; };
// slow organic hand-held drift (applied after lookAt)
const handheld = (cam, t, a = .006) => { cam.rotation.x += (Math.sin(t * 1.3) + .4 * Math.sin(t * 2.9 + 1)) * a; cam.rotation.y += (Math.sin(t * 1.1 + 2) + .4 * Math.sin(t * 2.3)) * a; cam.rotation.z += Math.sin(t * .9 + 4) * a * .5; };
const dynTex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return { g, t, c }; };
function flashQuad(cam, col = 0x000000) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 5), bmat({ color: col, transparent: true, opacity: 0, depthTest: false, fog: false })); m.renderOrder = 998; m.position.z = -.5; cam.add(m); return m; }
function rings(scene, n = 4, col = 0xffffff) { return [...Array(n)].map((_, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .05, 3, 20), bmat({ color: col, transparent: true, depthWrite: false, fog: false })); m.userData = i; scene.add(m); return m; }); }
const ringsAt = (rs, t, p, cam, size = .3, rate = 1.6, a = 1) => rs.forEach(m => { const q = (t * rate + m.userData / rs.length) % 1; m.position.copy(p); m.lookAt(cam.position); m.scale.setScalar(size * (.2 + q)); m.material.opacity = (1 - q) * .8 * a; m.visible = a > 0; });
const softT = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
const glowMat = (col, op = .5, soft = false) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, map: soft ? softT : null });

// ---------- faces: extra expressions + a blink frame for every expression ----------
Object.assign(EXPR, {
  creep: { open: .7, browIn: -2.8, browOut: 3, pupil: .4, mouth: 'grin' },
  stare: { open: 1.12, browIn: -1.5, browOut: 1.2, pupil: .42, mouth: 'neutral' },
  terror: { open: 1.65, browIn: 5, browOut: 3.5, pupil: .42, mouth: 'o' },
  listen: { open: .9, browIn: 2.8, browOut: 0, lx: -.7, ly: .2, mouth: 'skew' },
  glance: { open: 1.05, browIn: 1.5, browOut: .5, lx: -.9, mouth: 'neutral' },
  pain: { open: .3, browIn: 5, browOut: -1.5, mouth: 'scream' },
  dizzy: { open: .55, browIn: 3, browOut: -1, lx: .6, ly: .4, mouth: 'skew' },
  grin: { open: .95, browIn: 1, browOut: 2, mouth: 'grin' },
});
for (const k of Object.keys(EXPR)) EXPR[k + '_b'] = { ...EXPR[k], open: .07, black: false };
const faceCache = new Map();
function facesFor(p) { if (!faceCache.has(p)) { const f = {}; for (const e in EXPR) f[e] = faceTex(p, e); faceCache.set(p, f); } return faceCache.get(p); }
const sideCache = new Map(); const sideFor = p => { if (!sideCache.has(p)) sideCache.set(p, sideTex(p)); return sideCache.get(p); };

// ---------- character with elbows, knees, a waist, a neck, blinking and IK ----------
// upper arm .32 + forearm/hand .44 = .76; thigh .40 + shin/foot .44 = .84 (feet at y = 0)
function makeHuman(p) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const faces = facesFor(p), skinM = mat({ color: p.skin }), faceM = mat({ map: faces.neutral }), sideM = mat({ map: sideFor(p) }), hairM = mat({ color: p.hair });
  const topM = mat({ map: fabricTex(p.top, 'plain') }), topF = mat({ map: fabricTex(p.top, p.topStyle || 'hoodie') });
  const pantM = mat({ map: fabricTex(p.pants, 'pants') }), shoeM = mat({ color: p.shoes || 0xe6e6e6 });
  body.add(box(.6, .16, .35, pantM, 0, .83, 0));
  const torso = new THREE.Group(); torso.position.y = .84; body.add(torso);
  torso.add(box(.62, .72, .36, [topM, topM, topM, topM, topF, topM], 0, .33, 0));
  torso.add(box(.18, .14, .18, skinM, 0, .72, 0));
  const neck = new THREE.Group(); neck.position.y = .76; torso.add(neck);
  const head = new THREE.Group(); neck.add(head);
  const hg = new THREE.BoxGeometry(.44, .52, .44), pos = hg.attributes.position;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0) { pos.setX(i, pos.getX(i) * .74); pos.setZ(i, pos.getZ(i) * .82); }
  const skull = new THREE.Mesh(hg, [sideM, sideM, hairM, skinM, faceM, hairM]); skull.position.y = .28; head.add(skull);
  const hh = p.hairH || .1; head.add(box(.47, hh, .47, hairM, 0, .52 + hh / 2, -.01));
  const arms = [], fore = [], legs = [], shins = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * .42, .63, 0); torso.add(a); arms.push(a);
    a.add(box(.2, .36, .22, topM, 0, -.16, 0));
    const f = new THREE.Group(); f.position.y = -.32; a.add(f); fore.push(f);
    f.add(box(.19, .3, .21, topM, 0, -.13, 0)); f.add(box(.15, .17, .19, skinM, 0, -.355, 0)); f.add(box(.05, .12, .1, skinM, s * -.09, -.33, .06));
    const l = new THREE.Group(); l.position.set(s * .16, .84, 0); body.add(l); legs.push(l);
    l.add(box(.25, .42, .27, pantM, 0, -.2, 0));
    const sh = new THREE.Group(); sh.position.y = -.4; l.add(sh); shins.push(sh);
    sh.add(box(.24, .36, .26, pantM, 0, -.17, 0)); sh.add(box(.26, .1, .4, shoeM, 0, -.39, .06));
  }
  const all = [body, torso, neck, head, ...arms, ...fore, ...legs, ...shins];
  const Hm = {
    root, body, torso, neck, head, arms, fore, legs, shins, seed: p.seed || 0, faceM,
    face(e, t) { const blink = t !== undefined && ((t + Hm.seed) % 3.4) < .1; faceM.map = faces[blink ? e + '_b' : e]; },
    reset() { for (const o of all) { o.rotation.set(0, 0, 0); o.quaternion.identity(); } body.position.set(0, 0, 0); },
    breathe(t, a = 1) { torso.rotation.x += Math.sin(t * 1.8) * .02 * a; arms.forEach((ar, i) => { ar.rotation.z += (i ? 1 : -1) * (.06 + Math.sin(t * 1.8) * .015 * a); }); fore.forEach(f => f.rotation.x += -.12); head.rotation.x += Math.sin(t * 1.8 + .6) * .015 * a; },
    walk(ph, amp = .5) {
      const s = Math.sin(ph), c = Math.cos(ph);
      legs[0].rotation.x = s * amp; legs[1].rotation.x = -s * amp;
      shins[0].rotation.x = Math.max(0, -c) * amp * 1.6 + .06; shins[1].rotation.x = Math.max(0, c) * amp * 1.6 + .06;
      arms[0].rotation.x = -s * amp * .75; arms[1].rotation.x = s * amp * .75; fore[0].rotation.x = -.35 - Math.max(0, -s) * .3; fore[1].rotation.x = -.35 - Math.max(0, s) * .3;
      arms[0].rotation.z = -.06; arms[1].rotation.z = .06;
      body.position.y = -Math.abs(s) * .035; torso.rotation.y = s * .09; torso.rotation.x = .05; head.rotation.y = -s * .06; head.rotation.x = Math.abs(c) * .02;
    },
    sit() { legs.forEach(l => l.rotation.x = -1.5); shins.forEach(s => s.rotation.x = 1.45); body.position.y = -.38; },
  };
  return Hm;
}
// two-bone IK: put hand i (0 = left, 1 = right) on a world-space point; the elbow bends forward-down naturally
function ik(h, i, target) {
  h.root.updateMatrixWorld(true); const a = h.arms[i], par = a.parent;
  const d = par.worldToLocal(target.clone()).sub(a.position), l1 = .32, l2 = .45, L = clamp(d.length(), .15, .765);
  const inner = Math.acos(clamp((l1 * l1 + l2 * l2 - L * L) / (2 * l1 * l2), -1, 1)), al = Math.acos(clamp((l1 * l1 + L * L - l2 * l2) / (2 * l1 * L), -1, 1));
  a.quaternion.setFromUnitVectors(V(0, -1, 0), d.normalize()).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), al));
  h.fore[i].rotation.set(-(Math.PI - inner), 0, 0);
}
const handAt = (h, i = 1) => { h.root.updateMatrixWorld(true); return h.fore[i].localToWorld(V(0, -.44, .04)); };
const faceAt = h => { h.root.updateMatrixWorld(true); return h.head.localToWorld(V(0, .26, .23)); };
const earAt = (h, s = 1) => { h.root.updateMatrixWorld(true); return h.head.localToWorld(V(s * .24, .27, 0)); };
const wp = (o, x, y, z) => { o.updateMatrixWorld(true); return o.localToWorld(V(x, y, z)); };

const uvBox = (w, h, d, m, x, y, z, k = .8) => { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * k, uv.getY(i) * h * k); const me = new THREE.Mesh(g, m); me.position.set(x, y, z); return me; };
const wrap = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
