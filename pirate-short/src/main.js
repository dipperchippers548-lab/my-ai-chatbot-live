// "Why Pirates Wore Earrings" - 2D cartoon characters in a warm 3D world, rendered frame by frame.
import * as THREE from '/node_modules/three/build/three.module.js';
const W = 540, H = 960, SCALE = 2, FPS = 30, DUR = 34.62;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const css = h => '#' + new THREE.Color(h).getHexString();
const shade = (h, f) => { const c = new THREE.Color(h); c.r = Math.min(1, c.r * f); c.g = Math.min(1, c.g * f); c.b = Math.min(1, c.b * f); return '#' + c.getHexString(); };
const pop = x => x <= 0 ? 0 : Math.min(1, x / .08) * (1 + .3 * Math.exp(-x * 7) * Math.cos(x * 20));
const punch = (tl, k = .2) => 1 + k * Math.exp(-tl * 10);
const look = (cam, px, py, pz, tx, ty, tz) => { cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz); };
const shake = (cam, t, a) => { cam.position.x += Math.sin(t * 91) * a; cam.position.y += Math.cos(t * 73) * a; };

// ---------- renderer: clean, smooth, antialiased (no PS1 effects) ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
const out = document.getElementById('out'); out.width = W * SCALE; out.height = H * SCALE; const og = out.getContext('2d');
const sharp = document.createElement('canvas'); sharp.width = W * SCALE; sharp.height = H * SCALE; const sg = sharp.getContext('2d');
function ctex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function grain(g, w, h, amt, seed) { const id = g.getImageData(0, 0, w, h), d = id.data, r = rng(seed); for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(id, 0, 0); }
const mat = o => new THREE.MeshLambertMaterial(o);
const bmat = o => new THREE.MeshBasicMaterial(o);
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); return me; };
const cyl = (r1, r2, h, m, x = 0, y = 0, z = 0, seg = 16) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); me.position.set(x, y, z); return me; };
const newCam = (fov = 45) => new THREE.PerspectiveCamera(fov, W / H, .05, 400);
function skyTex(stops) { return ctex(8, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); stops.forEach(([k, c]) => gr.addColorStop(k, c)); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); }); }

// ---------- cartoon characters: flat 2D cut-outs (big shaded round head, stick limbs, bean body) standing in 3D ----------
const CW = 512, CH = 768, INK = '#17110d';
const EXPRS = ['neutral', 'happy', 'shocked', 'sly', 'sad', 'scared', 'laugh', 'proud'];
function makeToon(p) {
  const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(2.2 * CW / CH, 2.2); geo.translate(0, 1.1, 0);
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .25 }); const mesh = new THREE.Mesh(geo, m);
  const root = new THREE.Group(); root.add(mesh);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(.38, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .28, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .01; sh.scale.y = .45; root.add(sh);
  const S = { expr: 'neutral', armL: [.25, .1], armR: [.25, .1], walk: 0, lookX: 0, lightX: .6, sparkle: 0, blink: 0, hold: null, sweat: 0, flip: 1 };
  const T = { root, mesh, m, S, p,
    set(o) { Object.assign(S, o); return T; },
    face(cam) { root.updateMatrixWorld(); const wp = root.getWorldPosition(V(0, 0, 0)); mesh.rotation.y = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z) - root.rotation.y; },
    draw() { drawToon(g, p, S); tex.needsUpdate = true; } };
  return T;
}
function roundPath(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function limb(g, x0, y0, a1, a2, len, side) {   // shoulder/hip angles: 0 = straight down, positive = outward
  const x1 = x0 + Math.sin(a1) * side * len * .5, y1 = y0 + Math.cos(a1) * len * .5, x2 = x1 + Math.sin(a1 + a2) * side * len * .5, y2 = y1 + Math.cos(a1 + a2) * len * .5;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke(); return [x2, y2];
}
function drawToon(g, p, S) {
  g.clearRect(0, 0, CW, CH); const cx = CW / 2, lx = S.lightX, skin = p.skin || '#f7efe1', hr = 112, hy = 150 + (S.walk ? Math.abs(Math.sin(S.walk)) * -6 : 0);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK;
  // legs
  const hipY = 470, sw = Math.sin(S.walk) * .35; g.lineWidth = 10;
  for (const s of [-1, 1]) { const [fx, fy] = limb(g, cx + s * 22, hipY, s * sw * (s < 0 ? 1 : -1) + .04, 0, 280, s); g.fillStyle = p.shoes || '#2a1e18'; g.beginPath(); g.ellipse(fx + s * 10, fy + 4, 22, 11, 0, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); g.lineWidth = 10; }
  // body: a shaded bean
  const bw = 132, bh = 200, bx = cx - bw / 2, by = 285;
  const bg = g.createLinearGradient(bx - lx * 40, 0, bx + bw - lx * 40, 0); bg.addColorStop(lx > 0 ? 1 : 0, shade(p.body, 1.12)); bg.addColorStop(.5, css(p.body)); bg.addColorStop(lx > 0 ? 0 : 1, shade(p.body, .72));
  roundPath(g, bx, by, bw, bh, 58); g.fillStyle = bg; g.fill(); g.save(); roundPath(g, bx, by, bw, bh, 58); g.clip(); outfit(g, p, bx, by, bw, bh, cx); g.restore(); roundPath(g, bx, by, bw, bh, 58); g.lineWidth = 8; g.stroke();
  // arms (stick) + round hands
  for (const [s, a] of [[-1, S.armL], [1, S.armR]]) { g.lineWidth = 10; const [hx, hy2] = limb(g, cx + s * 56, by + 40, a[0], a[1], 210, s); g.fillStyle = skin; g.beginPath(); g.arc(hx, hy2, 16, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); if (S.hold && s === 1) S.hold(g, hx, hy2); }
  // head: shaded like a lit ball
  const hx = cx + S.lookX * 6, hg = g.createRadialGradient(hx + lx * 40, hy - 45, 10, hx, hy, hr * 1.05); hg.addColorStop(0, shade(skin, 1.06)); hg.addColorStop(.62, skin); hg.addColorStop(1, shade(skin, .8));
  g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.fillStyle = hg; g.fill();
  g.save(); g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.clip();
  g.fillStyle = 'rgba(110,70,50,.2)'; g.beginPath(); g.arc(hx, hy, hr + 2, 0, 7); g.arc(hx + lx * 34, hy - 22, hr * 1.04, 0, 7, true); g.fill('evenodd');   // shadow crescent on the far side
  for (const s of [-1, 1]) { const bl = g.createRadialGradient(hx + s * 58, hy + 34, 0, hx + s * 58, hy + 34, 30); bl.addColorStop(0, `rgba(240,110,100,${.32 + (S.expr === 'laugh' || S.expr === 'happy' ? .12 : 0)})`); bl.addColorStop(1, 'rgba(240,110,100,0)'); g.fillStyle = bl; g.fillRect(hx - hr, hy - hr, hr * 2, hr * 2); }
  const hl = g.createRadialGradient(hx + lx * 46 - 10, hy - 66, 0, hx + lx * 46 - 10, hy - 66, 34); hl.addColorStop(0, 'rgba(255,255,255,.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
  g.restore();
  hair(g, p, hx, hy, hr, 'back');
  g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.lineWidth = 9; g.stroke();
  faceDraw(g, p, S, hx + S.lookX * 14, hy + 8);
  hair(g, p, hx, hy, hr, 'front');
  if (p.earring) { const ex = hx + hr * .9, ey = hy + 40; g.strokeStyle = '#d8a520'; g.lineWidth = 7; g.beginPath(); g.arc(ex, ey + 14, 13, 0, 7); g.stroke(); g.strokeStyle = '#fff2a0'; g.lineWidth = 3; g.beginPath(); g.arc(ex, ey + 14, 13, -2.4, -1.4); g.stroke(); g.strokeStyle = INK;
    if (S.sparkle > 0) { g.fillStyle = `rgba(255,250,210,${S.sparkle})`; const r = 30 * S.sparkle; g.beginPath(); g.moveTo(ex + 18, ey - r); g.lineTo(ex + 23, ey + 9); g.lineTo(ex + 18 + r, ey + 14); g.lineTo(ex + 23, ey + 19); g.lineTo(ex + 18, ey + 14 + r); g.lineTo(ex + 13, ey + 19); g.lineTo(ex + 18 - r, ey + 14); g.lineTo(ex + 13, ey + 9); g.closePath(); g.fill(); } }
  if (S.sweat > 0) { g.fillStyle = '#8ad8ff'; g.strokeStyle = INK; g.lineWidth = 4; const sx = hx - 88, sy = hy - 40 + (S.sweat * 30) % 30; g.beginPath(); g.moveTo(sx, sy - 18); g.quadraticCurveTo(sx + 13, sy + 2, sx, sy + 8); g.quadraticCurveTo(sx - 13, sy + 2, sx, sy - 18); g.fill(); g.stroke(); }
}
function faceDraw(g, p, S, x, y) {
  const e = S.expr, ex = 34, ey = y - 8; g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 7;
  const brow = (s, a, dy = 0) => { g.beginPath(); g.moveTo(x + s * (ex - 18), ey - 34 + dy + a * s * 0); g.lineTo(x + s * (ex + 16), ey - 34 + dy - a); g.stroke(); };
  if (e === 'happy' || e === 'laugh' || e === 'proud') for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * ex, ey + 6, 13, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  else if (e === 'shocked' || e === 'scared') for (const s of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x + s * ex, ey, 19, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + s * ex + S.lookX * 4, ey + 1, e === 'scared' ? 5 : 8, 0, 7); g.fill(); }
  else if (e === 'sly') for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * ex + 3, ey + 2, 8, 0, 7); g.fill(); g.lineWidth = 6; g.beginPath(); g.moveTo(x + s * ex - 14, ey - 5); g.lineTo(x + s * ex + 14, ey - 5); g.stroke(); }
  else for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * ex + S.lookX * 4, ey, 8, S.blink ? 1.5 : 10, 0, 0, 7); g.fill(); }
  if (p.glasses) { g.lineWidth = 5; for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * ex, ey, 24, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(x - 10, ey); g.lineTo(x + 10, ey); g.stroke(); }
  g.lineWidth = 7;
  if (e === 'sad' || e === 'scared') { brow(-1, -12); brow(1, -12); } else if (e === 'shocked') { brow(-1, 4, -10); brow(1, 4, -10); } else if (e === 'sly') { brow(-1, 2, -2); brow(1, 12, -6); } else if (e === 'proud') { brow(-1, 6); brow(1, 6); }
  else if (e !== 'happy' && e !== 'laugh') { brow(-1, 2); brow(1, 2); }
  if (p.mustache) { g.fillStyle = p.hairC || INK; g.beginPath(); g.moveTo(x - 46, y + 34); g.quadraticCurveTo(x - 26, y + 6, x, y + 22); g.quadraticCurveTo(x + 26, y + 6, x + 46, y + 34); g.quadraticCurveTo(x + 24, y + 28, x, y + 32); g.quadraticCurveTo(x - 24, y + 28, x - 46, y + 34); g.fill(); }
  const my = y + 46; g.lineWidth = 7;
  if (e === 'happy' || e === 'laugh' || e === 'proud') { const w = e === 'laugh' ? 42 : 34, h = e === 'laugh' ? 40 : 26; g.beginPath(); g.moveTo(x - w, my - 6); g.quadraticCurveTo(x, my - 12, x + w, my - 6); g.quadraticCurveTo(x + w * .8, my + h, x, my + h); g.quadraticCurveTo(x - w * .8, my + h, x - w, my - 6); g.closePath(); g.fillStyle = '#5a1418'; g.fill(); g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(x - w, my - 12, w * 2, 13); g.fillStyle = '#e8606a'; g.beginPath(); g.ellipse(x, my + h, w * .55, h * .45, 0, 0, 7); g.fill(); g.restore(); g.stroke(); }
  else if (e === 'shocked') { g.fillStyle = '#5a1418'; g.beginPath(); g.ellipse(x, my + 6, 15, 20, 0, 0, 7); g.fill(); g.stroke(); }
  else if (e === 'scared') { g.beginPath(); for (let i = 0; i <= 6; i++) { const xx = x - 30 + i * 10, yy = my + (i % 2 ? -5 : 5); i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
  else if (e === 'sad') { g.beginPath(); g.arc(x, my + 22, 24, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
  else if (e === 'sly') { g.beginPath(); g.moveTo(x - 22, my + 2); g.quadraticCurveTo(x + 6, my + 12, x + 28, my - 6); g.stroke(); }
  else { g.beginPath(); g.moveTo(x - 16, my + 2); g.quadraticCurveTo(x, my + 8, x + 16, my + 2); g.stroke(); }
}
function hair(g, p, x, y, r, layer) {
  g.strokeStyle = INK; g.lineWidth = 8; const hc = p.hairC || '#3a2418';
  if (layer === 'back') { if (p.hair === 'long') { g.fillStyle = hc; g.beginPath(); g.ellipse(x, y + 30, r * 1.08, r * 1.0, 0, 0, 7); g.fill(); g.stroke(); } return; }
  const H = p.hat;
  if (p.hair === 'short' && !H) { g.fillStyle = hc; g.beginPath(); g.arc(x, y, r + 2, Math.PI * 1.08, Math.PI * 1.92); g.quadraticCurveTo(x + 40, y - r * .55, x, y - r * .62); g.quadraticCurveTo(x - 50, y - r * .5, x - r * .99, y - r * .26); g.closePath(); g.fill(); g.stroke(); }
  if (H === 'tricorn') { g.fillStyle = '#1e1a22'; g.beginPath(); g.moveTo(x - r * 1.35, y - r * .55); g.quadraticCurveTo(x, y - r * .2, x + r * 1.35, y - r * .55); g.quadraticCurveTo(x + r * .7, y - r * 1.55, x, y - r * 1.25); g.quadraticCurveTo(x - r * .7, y - r * 1.55, x - r * 1.35, y - r * .55); g.fill(); g.stroke(); g.strokeStyle = '#d8a520'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - r * 1.2, y - r * .58); g.quadraticCurveTo(x, y - r * .28, x + r * 1.2, y - r * .58); g.stroke(); g.fillStyle = '#f2f2f2'; g.beginPath(); g.arc(x, y - r * .82, 14, 0, 7); g.fill(); g.fillStyle = INK; g.fillRect(x - 6, y - r * .82 - 2, 4, 4); g.fillRect(x + 2, y - r * .82 - 2, 4, 4); }
  if (H === 'bandana') { g.fillStyle = p.hatC || '#c8202a'; g.beginPath(); g.arc(x, y, r + 3, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(x, y - r * .45, x - r - 3, y - 4); g.fill(); g.stroke(); g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x - 60 + i * 30, y - r * .7 + Math.abs(i - 2) * 8, 6, 0, 7); g.fill(); } g.fillStyle = p.hatC || '#c8202a'; g.beginPath(); g.moveTo(x + r * .85, y - 30); g.lineTo(x + r * 1.3, y - 10); g.lineTo(x + r * 1.2, y + 20); g.closePath(); g.fill(); g.stroke(); }
  if (H === 'pith') { g.fillStyle = '#d8c08a'; g.beginPath(); g.ellipse(x, y - r * .55, r * 1.3, 22, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(x, y - r * .55, r * .78, Math.PI, 0); g.fill(); g.stroke(); g.strokeStyle = '#8a6a3a'; g.beginPath(); g.moveTo(x - r * .76, y - r * .66); g.lineTo(x + r * .76, y - r * .66); g.stroke(); }
  if (H === 'flatcap') { g.fillStyle = p.hatC || '#5a5a62'; g.beginPath(); g.moveTo(x - r * 1.02, y - r * .3); g.quadraticCurveTo(x - r * .9, y - r * 1.12, x + r * .2, y - r * 1.05); g.quadraticCurveTo(x + r * 1.3, y - r * .9, x + r * 1.35, y - r * .35); g.quadraticCurveTo(x, y - r * .5, x - r * 1.02, y - r * .3); g.fill(); g.stroke(); }
  if (H === 'bald') { }
  g.strokeStyle = INK; g.lineWidth = 8;
  if (p.beard) { g.fillStyle = p.hairC || '#2a1a12'; g.beginPath(); g.moveTo(x - r * .75, y + r * .35); g.quadraticCurveTo(x, y + r * 1.55, x + r * .75, y + r * .35); g.quadraticCurveTo(x, y + r * .95, x - r * .75, y + r * .35); g.fill(); g.stroke(); }
}
function outfit(g, p, x, y, w, h, cx) {
  const o = p.outfit;
  if (o === 'coat') { g.fillStyle = shade(p.body, .7); g.fillRect(cx - 4, y, 8, h); g.fillStyle = '#f4ece0'; g.beginPath(); g.moveTo(cx - 26, y); g.lineTo(cx, y + 50); g.lineTo(cx + 26, y); g.fill(); g.fillStyle = '#d8a520'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx + 18, y + 70 + i * 28, 6, 0, 7); g.fill(); } g.fillStyle = '#3a2418'; g.fillRect(x, y + h * .62, w, 18); g.fillStyle = '#d8a520'; g.fillRect(cx - 12, y + h * .62 - 2, 24, 22); }
  if (o === 'stripes') { g.fillStyle = '#2a4a9a'; for (let yy = y + 20; yy < y + h; yy += 30) g.fillRect(x, yy, w, 13); }
  if (o === 'vest') { g.fillStyle = '#f2ece0'; g.fillRect(cx - 22, y, 44, h); g.fillStyle = shade(p.body, .85); g.fillRect(cx - 4, y + 40, 8, h); }
  if (o === 'suit') { g.fillStyle = '#f2f2f2'; g.beginPath(); g.moveTo(cx - 24, y); g.lineTo(cx, y + 60); g.lineTo(cx + 24, y); g.fill(); g.fillStyle = p.tie || '#c8202a'; g.beginPath(); g.moveTo(cx - 8, y + 8); g.lineTo(cx + 8, y + 8); g.lineTo(cx + 6, y + 70); g.lineTo(cx, y + 80); g.lineTo(cx - 6, y + 70); g.fill(); }
  if (o === 'robe') { g.fillStyle = '#f2f2f2'; g.fillRect(cx - 14, y, 28, 16); }
  if (o === 'khaki') { g.fillStyle = shade(p.body, .8); g.fillRect(x + 20, y + 50, 34, 28); g.fillRect(x + w - 54, y + 50, 34, 28); g.fillStyle = '#5a3a1a'; g.fillRect(x, y + h * .6, w, 14); }
  if (o === 'apron') { g.fillStyle = '#e8e2d2'; roundPath(g, cx - 40, y + 50, 80, h, 16); g.fill(); }
}

// ---------- sets ----------
const woodT = ctex(64, 64, g => { g.fillStyle = '#a8703c'; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 8) { g.fillStyle = y % 16 ? '#9a6434' : '#b07a44'; g.fillRect(0, y, 64, 7); g.fillStyle = '#6a4220'; g.fillRect(0, y + 7, 64, 1); } g.fillStyle = 'rgba(60,30,10,.35)'; for (let i = 0; i < 12; i++) g.fillRect((i * 23) % 64, (i * 13) % 64, 1, 7); grain(g, 64, 64, 14, 3); }, [3, 6]);
const sailT = ctex(64, 64, g => { g.fillStyle = '#f4ece0'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#c8302a'; for (let x = 0; x < 64; x += 16) g.fillRect(x, 0, 8, 64); grain(g, 64, 64, 10, 4); });
const seaT = ctex(64, 64, g => { g.fillStyle = '#2a6a9a'; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(255,220,180,.35)'; for (let i = 0; i < 14; i++) { const y = (i * 11) % 64, x = (i * 23) % 64; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - 2, x + 8, y); g.stroke(); } }, [20, 20]);
// pirate ship deck at sunset; deck top at y = 0, sea at y = -2
function shipDeck(opts = {}) {
  const scene = new THREE.Scene(), cam = newCam(opts.fov || 42); scene.add(cam);
  scene.background = skyTex(opts.night ? [[0, '#141a3a'], [.6, '#3a3a6a'], [1, '#8a6a8a']] : [[0, '#3a4a8a'], [.45, '#e8806a'], [.75, '#f8c070'], [1, '#ffe2a0']]);
  scene.fog = new THREE.Fog(opts.night ? 0x3a3a6a : 0xf0a070, 14, 60);
  scene.add(new THREE.HemisphereLight(opts.night ? 0x8090d0 : 0xffd0a0, 0x40507a, 1.6)); const sun = new THREE.DirectionalLight(opts.night ? 0xa0b0ff : 0xffc080, opts.night ? 1.2 : 2.4); sun.position.set(6, 5, -8); scene.add(sun);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat({ map: seaT, color: opts.night ? 0x5a6aa0 : 0xffffff })); sea.rotation.x = -Math.PI / 2; sea.position.y = -2; scene.add(sea);
  const sunD = new THREE.Mesh(new THREE.CircleGeometry(4, 24), bmat({ color: opts.night ? 0xf0f4ff : 0xfff0c0, fog: false })); sunD.position.set(14, 4, -80); scene.add(sunD);
  for (const [x, z, s] of [[-30, -70, 6], [40, -90, 9]]) { const isl = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat({ color: 0x5a7a5a })); isl.scale.y = .35; isl.position.set(x, -2, z); scene.add(isl); }
  const deck = new THREE.Group(); scene.add(deck); const wd = mat({ map: woodT }), dark = mat({ color: 0x5a3418 });
  deck.add(box(6, .3, 14, wd, 0, -.15, -3)); for (const s of [-1, 1]) { deck.add(box(.2, .9, 14, dark, s * 3, .3, -3)); deck.add(box(.3, .12, 14, mat({ color: 0x7a4a24 }), s * 3, .8, -3)); for (let z = 3; z > -10; z -= 1.2) deck.add(box(.1, .7, .1, dark, s * 3, .35, z)); }
  deck.add(box(6.2, 2.2, 1.0, mat({ color: 0x6a3a1a }), 0, -1.2, 4)); const mast = cyl(.22, .26, 14, mat({ color: 0x6a4220 }), 0, 7, -5); deck.add(mast);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(5, 5, 8, 8), mat({ map: sailT, side: THREE.DoubleSide })); const sp = sail.geometry.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, Math.cos(sp.getX(i) * .5) * .8); sail.geometry.computeVertexNormals(); sail.position.set(0, 7.5, -4.6); deck.add(sail); deck.add(box(5.6, .14, .14, dark, 0, 10.1, -4.7)); deck.add(box(5.6, .14, .14, dark, 0, 5, -4.7));
  for (const [x, z] of [[-2.4, -1], [2.4, -1], [-2.4, -3.2], [2.4, -3.2]]) { const cn = cyl(.18, .22, 1.3, mat({ color: 0x2a2a2e }), x, .45, z); cn.rotation.z = Math.PI / 2 * Math.sign(x); deck.add(cn); deck.add(box(.6, .35, .7, mat({ color: 0x7a4a24 }), x * .92, .17, z)); }
  for (const [x, z] of [[1.9, 1.8], [-2.0, .9], [2.1, -6.5]]) { const b = cyl(.32, .32, .8, mat({ color: 0x8a5a2a }), x, .4, z, 12); deck.add(b); deck.add(cyl(.33, .33, .06, mat({ color: 0x3a3a3a }), x, .62, z, 12)); deck.add(cyl(.33, .33, .06, mat({ color: 0x3a3a3a }), x, .18, z, 12)); }
  const ropeM = mat({ color: 0xc8a870 }); for (const s of [-1, 1]) { const r = box(.03, 12, .03, ropeM, s * 1.7, 5.5, -1.5); r.rotation.z = s * .25; deck.add(r); }
  return { scene, cam, sea, deck };
}
const sandT = ctex(64, 64, g => { g.fillStyle = '#e8d098'; g.fillRect(0, 0, 64, 64); grain(g, 64, 64, 26, 7); }, [20, 20]);
const grassT = ctex(64, 64, g => { g.fillStyle = '#5a9a4a'; g.fillRect(0, 0, 64, 64); const r = rng(5); for (let i = 0; i < 300; i++) { g.fillStyle = r() < .5 ? '#4a8a3a' : '#6aaa58'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 1, 3); } }, [16, 16]);
function lightsOn(scene, sky, ground, sunC, sunI, sunP) { scene.add(new THREE.HemisphereLight(sky, ground, 1.6)); const s = new THREE.DirectionalLight(sunC, sunI); s.position.set(...sunP); scene.add(s); }
function underwater() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyTex([[0, '#3a8ac8'], [.4, '#1a4a8a'], [1, '#081830']]); scene.fog = new THREE.Fog(0x123a6a, 3, 22);
  lightsOn(scene, 0x8ad0ff, 0x0a1a3a, 0xbfe6ff, 1.4, [2, 8, 3]);
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat({ map: sandT, color: 0x8aa0c0 })); bed.rotation.x = -Math.PI / 2; bed.position.y = -9; scene.add(bed);
  const r = rng(3); for (let i = 0; i < 9; i++) { const k = cyl(.05, .08, 2 + r() * 3, mat({ color: 0x3a8a5a }), (r() - .5) * 14, -8, -4 - r() * 8, 5); scene.add(k); }
  const rays = [...Array(6)].map((_, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 20), bmat({ color: 0xbfe6ff, transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); p.position.set(-5 + i * 2, 2, -6 - i); p.rotation.z = .25; scene.add(p); return p; });
  const bub = [...Array(16)].map((_, i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), bmat({ color: 0xdff4ff, transparent: true, opacity: .7 })); b.userData = i; scene.add(b); return b; });
  return { scene, cam, rays, bub };
}
function makeBundle() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.32, 1.4, 6, 12), mat({ color: 0xece4d4 })); b.rotation.z = Math.PI / 2; g.add(b); for (const x of [-.6, 0, .6]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.33, .025, 6, 16), mat({ color: 0x8a6a3a })); r.rotation.y = Math.PI / 2; r.position.x = x; g.add(r); } return g; }
function makePalm(h = 4) { const g = new THREE.Group(); for (let i = 0; i < 6; i++) { const s = cyl(.16 - i * .012, .18 - i * .012, h / 6, mat({ color: 0x8a6a3a }), Math.sin(i * .3) * .3 * i * .2, h / 12 + i * h / 6, 0, 7); s.rotation.z = -.06 * i; g.add(s); } for (let i = 0; i < 7; i++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(.3, 2.4, 4), mat({ color: 0x3a8a3a })); lf.position.set(.3, h, 0); lf.rotation.set(0, i * .9, 1.9); lf.translateY(1.1); g.add(lf); } return g; }
function beach() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyTex([[0, '#4a90e0'], [.6, '#9ad0f4'], [1, '#e8f4ff']]); scene.fog = new THREE.Fog(0xd8ecf8, 18, 80);
  lightsOn(scene, 0xe0f0ff, 0xc8a870, 0xfff0d8, 2.2, [5, 8, 4]);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), mat({ map: sandT })); sand.rotation.x = -Math.PI / 2; sand.position.z = 10; scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), mat({ map: seaT, color: 0x9ad8e8 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, .02, -110); scene.add(sea);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(120, .6), bmat({ color: 0xffffff, transparent: true, opacity: .8 })); foam.rotation.x = -Math.PI / 2; foam.position.set(0, .03, -10); scene.add(foam);
  for (const [x, z, h] of [[-5, -2, 4.5], [-7, 2, 3.8], [6, -4, 5], [8, 1, 4]]) { const p = makePalm(h); p.position.set(x, 0, z); p.rotation.y = x; scene.add(p); }
  for (const [x, z] of [[2, 2], [-3, 4], [4, 5]]) { const rk = new THREE.Mesh(new THREE.IcosahedronGeometry(.4, 0), mat({ color: 0x8a8a90 })); rk.scale.y = .5; rk.position.set(x, .1, z); scene.add(rk); }
  const hat = new THREE.Group(); const hm = mat({ color: 0x1e1a22 }); const brim = cyl(.55, .6, .05, hm, 0, .03, 0, 3); brim.rotation.y = .3; hat.add(brim); hat.add(cyl(.28, .32, .3, hm, 0, .2, 0, 12)); hat.position.set(.3, 0, -.6); hat.rotation.z = .3; scene.add(hat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.12, .035, 8, 20), mat({ color: 0xffc830, emissive: 0x6a4a00 })); ring.position.set(-.1, .04, -.2); ring.rotation.x = -Math.PI / 2 + .3; scene.add(ring);
  return { scene, cam, foam, ring, hat };
}
function graveyard() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyTex([[0, '#4a5a9a'], [.55, '#d89aa0'], [1, '#f8d0a0']]); scene.fog = new THREE.Fog(0xd8a0a0, 14, 60);
  lightsOn(scene, 0xffd8c0, 0x4a5a7a, 0xffc890, 2.0, [-6, 5, -6]);
  const hill = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mat({ map: grassT })); hill.rotation.x = -Math.PI / 2; scene.add(hill);
  const ch = new THREE.Group(); ch.add(box(4, 3, 3, mat({ color: 0xd8d0c0 }), 0, 1.5, 0)); const roof = new THREE.Mesh(new THREE.CylinderGeometry(0, 2.6, 1.6, 4), mat({ color: 0x6a3a2a })); roof.position.y = 3.8; roof.rotation.y = Math.PI / 4; roof.scale.z = .8; ch.add(roof); ch.add(box(.9, 3, .9, mat({ color: 0xd8d0c0 }), 1.4, 3.8, 0)); const sp = new THREE.Mesh(new THREE.ConeGeometry(.65, 1.6, 4), mat({ color: 0x6a3a2a })); sp.position.set(1.4, 6.1, 0); ch.add(sp); ch.add(box(.8, 1.4, .1, mat({ color: 0x5a3418 }), -.6, .7, 1.52)); ch.position.set(-3.5, 0, -9); scene.add(ch);
  const wd = mat({ color: 0x7a5a3a }); const cross = (x, z, s = 1) => { const c = new THREE.Group(); c.add(box(.12 * s, 1.1 * s, .1 * s, wd, 0, .55 * s, 0)); c.add(box(.6 * s, .1 * s, .1 * s, wd, 0, .8 * s, 0)); c.position.set(x, 0, z); scene.add(c); return c; };
  const r = rng(8); for (let i = 0; i < 8; i++) cross(-4 + (i % 4) * 2.4 + r() * .4, -3 - Math.floor(i / 4) * 2.2, .9); const main = cross(.3, -.4, 1.1);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(.7, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat({ color: 0x6a4a2a })); mound.scale.set(.8, .35, 1.6); mound.position.set(.3, 0, .8); scene.add(mound);
  for (let x = -7; x < 7; x += .8) { scene.add(box(.08, .7, .08, wd, x, .35, 3)); } scene.add(box(14, .06, .06, wd, 0, .55, 3));
  for (const [x, c] of [[.0, 0xff6a8a], [.6, 0xffe21f]]) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(.08, 0), mat({ color: c })); f.position.set(x, .3, .4); scene.add(f); }
  return { scene, cam };
}
const booksT = ctex(64, 64, g => { g.fillStyle = '#4a2a18'; g.fillRect(0, 0, 64, 64); const r = rng(9); for (let row = 0; row < 4; row++) { let x = 1; while (x < 62) { const w = 2 + (r() * 3 | 0), h = 10 + (r() * 4 | 0); g.fillStyle = ['#8a2a2a', '#2a4a8a', '#3a6a3a', '#c8a040', '#6a3a6a', '#d8c8a0'][r() * 6 | 0]; g.fillRect(x, row * 16 + 15 - h, w, h); x += w + 1; } g.fillStyle = '#2a160c'; g.fillRect(0, row * 16 + 15, 64, 1); } }, [3, 2]);
function library() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = new THREE.Color(0x2a1a14); scene.fog = new THREE.Fog(0x2a1a14, 8, 20);
  lightsOn(scene, 0xffd8a0, 0x2a1a10, 0xffd8a0, 1.0, [2, 6, 4]); const lamp = new THREE.PointLight(0xffc870, 14, 7); lamp.position.set(.9, 2.3, .4); scene.add(lamp);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), mat({ map: woodT, color: 0xb08060 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  scene.add(box(10, 5, .4, mat({ map: booksT }), 0, 2.5, -2.5)); for (const s of [-1, 1]) scene.add(box(.4, 5, 6, mat({ map: booksT }), s * 4.5, 2.5, 0));
  scene.add(box(2.4, .1, 1.1, mat({ color: 0x6a3a1a }), .3, 1.0, .2)); for (const [x, z] of [[-.8, -.25], [1.4, -.25], [-.8, .65], [1.4, .65]]) scene.add(box(.08, 1.0, .08, mat({ color: 0x4a2a10 }), x, .5, z));
  const book = new THREE.Group(); for (const s of [-1, 1]) { const pg = box(.42, .03, .55, mat({ color: 0xf2e8d0 }), s * .22, 1.08, .2); pg.rotation.z = -s * .08; book.add(pg); } scene.add(book); book.position.x = .3;
  for (let i = 0; i < 4; i++) scene.add(box(.4, .08, .55, mat({ color: [0x8a2a2a, 0x2a4a8a, 0x3a6a3a, 0xc8a040][i] }), 1.15, 1.09 + i * .08, .1));
  scene.add(cyl(.05, .08, .5, mat({ color: 0x3a3a3a }), .9, 1.3, -.1)); const shade_ = new THREE.Mesh(new THREE.ConeGeometry(.22, .2, 12, 1, true), mat({ color: 0x2a6a3a, side: THREE.DoubleSide })); shade_.position.set(.9, 1.6, -.1); scene.add(shade_);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), bmat({ color: 0xfff0c0 })); glow.position.set(.9, 1.52, -.1); scene.add(glow);
  return { scene, cam };
}
function digsite() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyTex([[0, '#3a6ac8'], [.6, '#f0a868'], [1, '#ffd890']]); scene.fog = new THREE.Fog(0xf0b878, 12, 50);
  lightsOn(scene, 0xffe0b0, 0x8a6a4a, 0xffc070, 2.3, [6, 4, 2]);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mat({ map: sandT, color: 0xd8a868 })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  const pit = box(2.6, .02, 2.0, mat({ color: 0x6a4a2a }), 0, .01, 0); scene.add(pit); for (const [x, z, w, d] of [[0, -1.05, 2.8, .2], [0, 1.05, 2.8, .2], [-1.35, 0, .2, 2.2], [1.35, 0, .2, 2.2]]) scene.add(box(w, .25, d, mat({ color: 0xb88a58 }), x, .12, z));
  const st = mat({ color: 0x8a6a3a }), rp = mat({ color: 0xf2f2f2 }); for (const [x, z] of [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]]) scene.add(box(.06, .5, .06, st, x, .25, z)); for (const z of [-1.2, 1.2]) scene.add(box(3, .02, .02, rp, 0, .4, z)); for (const x of [-1.5, 1.5]) scene.add(box(.02, .02, 2.4, rp, x, .4, 0)); scene.add(box(.02, .02, 2.4, rp, 0, .4, 0)); scene.add(box(3, .02, .02, rp, 0, .4, 0));
  const gold = mat({ color: 0xffc830, emissive: 0x5a3a00 }), r = rng(4), items = []; for (let i = 0; i < 9; i++) { const it = i % 3 ? new THREE.Mesh(new THREE.TorusGeometry(.09, .03, 8, 16), gold) : cyl(.1, .1, .03, gold, 0, 0, 0, 14); it.position.set((r() - .5) * 2, .05, (r() - .5) * 1.6); it.rotation.set(-Math.PI / 2 + (r() - .5), r(), 0); scene.add(it); items.push(it); }
  for (const [x, z] of [[-4, -6], [5, -9], [-8, -14]]) { const tent = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2, 4), mat({ color: 0xe8dcc0 })); tent.position.set(x, 1, z); scene.add(tent); }
  return { scene, cam, items };
}

// ---------- characters (original) ----------
const CAPTAIN = { skin: '#f6ecdc', body: 0xb0242a, outfit: 'coat', hat: 'tricorn', mustache: true, hairC: '#2a1a12', earring: true };
const SAILOR = { skin: '#f4e8d6', body: 0xf2ece0, outfit: 'stripes', hat: 'bandana', hatC: '#c8202a', earring: true };
const MATE = { skin: '#efdcc4', body: 0x7a5a3a, outfit: 'vest', hair: 'short', hairC: '#5a3a1a', mustache: true };
const VILLAGER = { skin: '#f2e2cc', body: 0x5a8a5a, outfit: 'vest', hat: 'flatcap', hatC: '#6a5a4a' };
const PRIEST = { skin: '#f4e6d4', body: 0x1e1e26, outfit: 'robe', hair: 'short', hairC: '#9a9a9a' };
const HISTORIAN = { skin: '#f2e4d2', body: 0x4a3a5a, outfit: 'suit', tie: '#3a6ad8', hair: 'short', hairC: '#c8c8c8', glasses: true };
const ARCH = { skin: '#efdac4', body: 0xc8a868, outfit: 'khaki', hat: 'pith' };
function toon(scene, p, tint) { const t = makeToon(p); scene.add(t.root); if (tint) t.m.color.setHex(tint); return t; }
const holdRing = (g, x, y) => { g.strokeStyle = '#d8a520'; g.lineWidth = 9; g.beginPath(); g.arc(x, y - 30, 18, 0, 7); g.stroke(); g.strokeStyle = '#fff2a0'; g.lineWidth = 4; g.beginPath(); g.arc(x, y - 30, 18, -2.4, -1.2); g.stroke(); g.strokeStyle = INK; };
const holdBrush = (g, x, y) => { g.strokeStyle = '#8a5a2a'; g.lineWidth = 9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30, y - 50); g.stroke(); g.fillStyle = '#e8d0a0'; g.beginPath(); g.ellipse(x + 36, y - 62, 10, 16, .5, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(); };
function coins(scene, n) { const gold = mat({ color: 0xffc830, emissive: 0x5a3a00 }); return [...Array(n)].map((_, i) => { const c = cyl(.12, .12, .03, gold, 0, 0, 0, 16); c.userData = i; scene.add(c); return c; }); }
function sparks(scene, n, col = 0xfff4c0) { return [...Array(n)].map((_, i) => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.05), bmat({ color: col })); s.userData = i; scene.add(s); return s; }); }
const sparksAt = (sp, t, p, rad = .5, on = true) => sp.forEach(s => { const i = s.userData, an = i * 2.4 + t * 1.5; s.visible = on; s.position.set(p.x + Math.cos(an) * rad, p.y + Math.sin(an * 1.3) * rad * .8, p.z + .1); s.scale.setScalar(.3 + Math.max(0, Math.sin(t * 9 + i * 2)) * .9); });
const SUNSET = 0xffe4cc;

// ---------- shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
// 1 / loop: "Pirates didn't wear gold earrings to look cool."
function sCaptain(loop) {
  return () => { const S = shipDeck(), C = toon(S.scene, CAPTAIN, SUNSET), A = toon(S.scene, SAILOR, SUNSET), B = toon(S.scene, MATE, SUNSET);
    return { scene: S.scene, cam: S.cam, toons: [C, A, B], update(tl, d, t) {
      const cool = !loop && tl > 1.85; C.root.position.set(0, 0, 0); C.set({ expr: cool ? 'proud' : 'sly', armL: [.3, .2], armR: cool ? [2.5, .9] : [.35, .2], sparkle: cool ? Math.max(0, Math.sin((tl - 1.85) * 6)) : .3 + .3 * Math.sin(t * 4) });
      A.root.position.set(-1.5, 0, -2.2); A.set({ expr: cool ? 'shocked' : 'happy', armL: [.3, .2], armR: [.3, .2] }); B.root.position.set(1.6, 0, -2.6); B.set({ expr: cool ? 'shocked' : 'neutral', armL: [.2, .1], armR: [.2, .1] });
      const k = ss(0, 2.7, loop ? 0 : tl); look(S.cam, lerp(1.3, .45, k), lerp(1.9, 2.0, k), lerp(5.6, 3.0, k), .2, 1.55, -.5); S.sea.position.y = -2 + Math.sin(t) * .05;
    } }; };
}
shot(0, 2.7, sCaptain(false), { dof: { b: 1.2, y: .4, r: .4 } });
// 2: "Back then, if a sailor died at sea, he was sewn into a sheet and dropped overboard."
shot(2.7, 7.72, () => {
  const S = shipDeck({ night: true }), bun = makeBundle(); S.scene.add(bun); const plank = box(.6, .08, 2.4, mat({ color: 0x8a5a2a })); S.scene.add(plank);
  const A = toon(S.scene, SAILOR, 0xb8c4ff), B = toon(S.scene, MATE, 0xb8c4ff), C = toon(S.scene, CAPTAIN, 0xb8c4ff), spl = sparks(S.scene, 12, 0xdff4ff), DROP = 4.0;
  return { scene: S.scene, cam: S.cam, toons: [A, B, C], update(tl, d, t) {
    plank.position.set(3.4, .82, -.8); plank.rotation.set(0, Math.PI / 2, 0); const a = tl - DROP, tip = ss(DROP - .4, DROP, tl);
    plank.rotation.z = -tip * .35; bun.rotation.set(0, 0, 0);
    if (a < 0) bun.position.set(lerp(2.4, 3.3, tip), 1.2 - tip * .1, -.8); else bun.position.set(3.3 + a * 1.4, 1.1 - a * a * 6, -.8); bun.rotation.z = a > 0 ? -a * 2 : 0; bun.visible = bun.position.y > -2.2;
    [A, B, C].forEach((h, i) => { h.root.position.set(.9 - i * 1.1, 0, -.4 - i * .6); h.set({ expr: 'sad', armL: [.15, .1], armR: [.15, .1], lightX: .8 }); });
    spl.forEach(s => { const q = a - .55; s.visible = q > 0 && q < .8; const an = s.userData * .52; s.position.set(5.2 + Math.cos(an) * q * 1.5, -2 + q * 2.5 - q * q * 4, -.8 + Math.sin(an) * q); s.scale.setScalar(1.5); });
    if (tl < 3.0) look(S.cam, -.8 + tl * .2, 2.3, 5.4 - tl * .2, 1.6, 1.0, -.8); else look(S.cam, 1.6, 2.6, 3.4, 4.2, -.4, -.8);
  } };
});
// 3: "No grave. No funeral." - sinking in the deep
shot(7.72, 10.2, () => {
  const U = underwater(), bun = makeBundle(); U.scene.add(bun);
  return { scene: U.scene, cam: U.cam, update(tl, d, t) {
    bun.position.set(0, 1.5 - tl * 1.2, 0); bun.rotation.set(.2, t * .2, Math.sin(t * .6) * .2); U.rays.forEach((r, i) => r.material.opacity = .08 + .05 * Math.sin(t * 1.3 + i));
    U.bub.forEach(b => { const i = b.userData, q = (t * .5 + i / 16) % 1; b.position.set(bun.position.x + Math.sin(i * 3) * .4, bun.position.y + q * 3, bun.position.z + Math.cos(i * 2) * .3); b.scale.setScalar(1 - q * .5); });
    look(U.cam, 1.6, bun.position.y + .9, 4.2, 0, bun.position.y - .4, 0);
  } };
}, { dof: { b: 1.4, y: .5, r: .38 } });
// 4: "So some started wearing a gold earring. Not as jewelry. As payment."
shot(10.2, 14.66, () => {
  const S = shipDeck(), C = toon(S.scene, CAPTAIN, SUNSET), cs = coins(S.scene, 8), sp = sparks(S.scene, 8);
  return { scene: S.scene, cam: S.cam, toons: [C], update(tl, d, t) {
    const PUT = 1.2, NOT = 2.53, PAY = 3.66; C.root.position.set(0, 0, 0);
    if (tl < PUT + .4) C.set({ expr: 'happy', armR: [2.6, 1.6], hold: tl < PUT ? holdRing : null, sparkle: tl > PUT ? 1 : 0 }); else if (tl < PAY) C.set({ expr: 'sly', armR: [.3, .2], hold: null, sparkle: .4 + .4 * Math.sin(t * 5), lookX: Math.sin((tl - NOT) * 14) * (tl > NOT && tl < NOT + .7 ? 1 : 0) }); else C.set({ expr: 'proud', armR: [.3, .2], sparkle: 1, lookX: 0 });
    C.set({ armL: [.3, .2] }); cs.forEach(c => { const i = c.userData, k = pop(tl - PAY - i * .06); c.visible = tl > PAY; c.position.set(-.9 + (i % 4) * .6, 2.9 + Math.floor(i / 4) * .45 + Math.sin(t * 3 + i) * .05, .3); c.rotation.set(Math.PI / 2, 0, t * 2 + i); c.scale.setScalar(k); });
    sparksAt(sp, t, V(.55, 1.95, .2), .25, tl > PUT); look(S.cam, .5, 2.0, lerp(2.6, 2.1, ss(0, 4.4, tl)) * (tl > PAY ? punch(tl - PAY, .08) : 1), .15, 1.9, 0);
  } };
}, { dof: { b: 1.3, y: .45, r: .38 } });
// 5: "If his body ever washed up on a beach, whoever found it could take the gold, and use it to pay for a proper burial."
shot(14.66, 21.76, () => {
  const Bc = beach(), V1 = toon(Bc.scene, VILLAGER), sp = sparks(Bc.scene, 8), Gy = graveyard(), V2 = toon(Gy.scene, VILLAGER, 0xffe0d0), P = toon(Gy.scene, PRIEST, 0xffe0d0), cs = coins(Gy.scene, 1), FIND = 2.74, TAKE = 4.02, SW = 4.85;
  return { scene: Bc.scene, cam: Bc.cam, toons: [V1], update(tl, d, t) {
    if (tl < SW) { this.scene = Bc.scene; this.cam = Bc.cam; this.toons = [V1]; Bc.foam.position.z = -10 + Math.sin(t * .8) * .6;
      const walk = tl < FIND; V1.root.position.set(lerp(-4, -.9, ss(0, FIND, tl)), 0, .2); V1.set({ walk: walk ? t * 9 : 0, expr: tl > FIND ? (tl > TAKE ? 'happy' : 'shocked') : 'neutral', armL: [.2, .1], armR: tl > TAKE ? [2.4, .8] : [.25, .15], hold: tl > TAKE ? holdRing : null, lookX: tl > FIND && tl < TAKE ? .8 : 0 });
      Bc.ring.visible = tl < TAKE; sparksAt(sp, t, V(-.1, .25, -.2), .3, tl > 1.4 && tl < TAKE);
      const vx = V1.root.position.x; if (tl < FIND) look(Bc.cam, vx + 1.2, 1.7, 4.4, vx + .5, 1.1, -.2); else look(Bc.cam, .4, 1.5 + (tl > TAKE ? .3 : 0), 3.4, -.4, tl > TAKE ? 1.4 : .8, -.2); return; }
    this.scene = Gy.scene; this.cam = Gy.cam; this.toons = [V2, P]; const a = tl - SW;
    V2.root.position.set(-.9, 0, 1.1); V2.set({ expr: 'sad', armL: [.2, .1], armR: [1.2, .5] }); P.root.position.set(1.4, 0, .9); P.set({ expr: 'neutral', armL: [1.0, 1.2], armR: [1.0, 1.2] });
    cs.forEach(c => { c.visible = a > .5; c.position.set(.4, 1.3 + Math.sin(t * 2) * .05, 1.3); c.rotation.set(Math.PI / 2, 0, t * 2); });
    look(Gy.cam, lerp(-.8, .2, ss(0, 2.4, a)), 2.3, 6.6 - a * .3, .25, 1.0, .5);
  } };
}, { dof: { b: 1.2, y: .5, r: .42 } });
// 6: "Historians aren't sure how common this really was."
shot(21.76, 25.25, () => {
  const L = library(), Hs = toon(L.scene, HISTORIAN, 0xffe8c8), qs = [...Array(3)].map((_, i) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(.35, .5), bmat({ map: ctex(64, 96, g => { g.font = 'bold 84px sans-serif'; g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = '#17110d'; g.strokeText('?', 32, 80); g.fillStyle = '#ffe21f'; g.fillText('?', 32, 80); }), transparent: true })); q.userData = i; L.scene.add(q); return q; });
  return { scene: L.scene, cam: L.cam, toons: [Hs], update(tl, d, t) {
    Hs.root.position.set(-.5, 0, .6); Hs.set({ expr: tl > 1.3 ? 'sad' : 'neutral', armL: [.3, .2], armR: tl > 1.3 ? [2.7, 1.4] : [1.0, 1.0], lookX: -.3 });
    qs.forEach(q => { const i = q.userData, k = pop(tl - 1.0 - i * .3); q.position.set(-1.0 + i * .5, 2.75 + (i % 2) * .25 + Math.sin(t * 3 + i) * .05, .6); q.rotation.z = Math.sin(t * 4 + i) * .2; q.scale.setScalar(k); q.visible = k > 0; });
    look(L.cam, .6 - tl * .1, 1.9, 3.8 - tl * .2, -.2, 1.6, .3);
  } };
}, { dof: { b: 1.2, y: .45, r: .42 } });
// 7: "But archaeologists have found plenty of sailors' jewelry made to be spent."
shot(25.25, 29.95, () => {
  const Dg = digsite(), Ar = toon(Dg.scene, ARCH, 0xffe4c8), sp = sparks(Dg.scene, 12);
  return { scene: Dg.scene, cam: Dg.cam, toons: [Ar], update(tl, d, t) {
    Ar.root.position.set(.35, 0, 1.55); Ar.set({ expr: tl > 2.9 ? 'happy' : 'neutral', armL: [.3, .2], armR: [1.4 + Math.sin(t * 8) * .3 * (tl < 2.9 ? 1 : 0), .4], hold: holdBrush, lookX: -.6 });
    Dg.items.forEach((it, i) => { it.position.y = .05 + (tl > 2.9 ? pop(tl - 2.9 - i * .05) * .12 : 0); }); sparksAt(sp, t, V(0, .3, 0), .9, tl > 2.0);
    const k = ss(0, 4.6, tl); look(Dg.cam, lerp(-1.4, -.6, k), lerp(3.2, 2.4, k), lerp(4.6, 3.8, k), .2, .7, .4);
  } };
}, { dof: { b: 1.2, y: .55, r: .42 } });
// 8: "Because for a pirate, that tiny ring was a funeral, already paid for."
shot(29.95, DUR + .1, () => {
  const S = shipDeck(), C = toon(S.scene, CAPTAIN, SUNSET), sp = sparks(S.scene, 8);
  return { scene: S.scene, cam: S.cam, toons: [C], update(tl, d, t) {
    C.root.position.set(0, 0, 2.6); C.set({ expr: tl > 3.6 ? 'happy' : 'proud', armL: [.3, .2], armR: [.3, .2], sparkle: .5 + .5 * Math.sin(t * 4), lookX: .3 });
    const k = ss(.8, 4.6, tl); look(S.cam, lerp(.9, 3.4, k), lerp(2.1, 4.6, k), lerp(4.0, 10.5, k), lerp(.4, 0, k), lerp(2.05, 1.2, k), lerp(2.6, -1, k)); sparksAt(sp, t, V(.5, 2.0, 2.8), .2, tl < 2.5);
  } };
}, { dof: tl => tl < 1.5 ? { b: 1.2, y: .45, r: .38 } : null });
shots.forEach(S => { if (!S.cam.parent) S.scene.add(S.cam); });

// ---------- captions: one word at a time, white with a thick black outline ----------
let words = [];
function drawCaption(t) {
  const i = words.findIndex((w, k) => t >= w.s - .03 && t < (words[k + 1] ? words[k + 1].s - .03 : w.e + .35)); if (i < 0) return; const w = words[i];
  const k = 1 + .08 * Math.exp(-(t - w.s) * 25), text = w.w.replace(/[.,?!]+$/, ''); og.save(); og.translate(out.width / 2, out.height * .7); og.scale(k, k);
  og.font = '900 84px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.strokeStyle = '#0d0a08'; og.lineWidth = 16; og.strokeText(text, 0, 3); og.fillStyle = '#ffffff'; og.fillText(text, 0, 0); og.restore();
}
// ---------- frame ----------
function renderAt(t) {
  const s = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1], tl = t - s.t0;
  s.update(tl, s.t1 - s.t0, t); (s.toons || []).forEach(c => { c.face(s.cam); c.draw(); }); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam);
  const dof = typeof s.dof === 'function' ? s.dof(tl) : s.dof;
  og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
  if (dof) { og.filter = `blur(${dof.b * SCALE}px)`; og.drawImage(renderer.domElement, -8, -8, out.width + 16, out.height + 16); og.filter = 'none';
    sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, sharp.width, sharp.height); sg.drawImage(renderer.domElement, 0, 0, sharp.width, sharp.height); sg.globalCompositeOperation = 'destination-in';
    const gr = sg.createRadialGradient(sharp.width * (dof.x || .5), sharp.height * (dof.y || .5), sharp.width * (dof.r || .35) * .55, sharp.width * (dof.x || .5), sharp.height * (dof.y || .5), sharp.width * (dof.r || .35) * 1.35); gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, sharp.width, sharp.height); og.drawImage(sharp, 0, 0); }
  else og.drawImage(renderer.domElement, 0, 0, out.width, out.height);
  const vg = og.createRadialGradient(out.width / 2, out.height / 2, out.height * .35, out.width / 2, out.height / 2, out.height * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); og.fillStyle = vg; og.fillRect(0, 0, out.width, out.height);
  drawCaption(t);
}
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .92); };
const cutInfo = await (await fetch('/build/cuts.json')).json();
const toOriginal = tc => { let t = tc * (cutInfo.speed || 1); for (const [a, b] of cutInfo.cuts) { if (t >= a) t += b - a; else break; } return Math.min(t, DUR - .001); };
window.renderFrame = i => window.renderTime(toOriginal((i + .5) / FPS));
window.frameCount = Math.round(cutInfo.duration * FPS);
words = await (await fetch('/build/words.json')).json();
await document.fonts.load('900 84px Nunito');
window.captionChunks = words.map(w => ({ s: w.s, e: w.e, text: w.w })); window.ready = true;
