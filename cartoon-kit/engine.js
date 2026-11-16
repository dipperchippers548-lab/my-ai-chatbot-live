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
const CW = 512, CH = 768, INK = '#141826';
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
function bean(g, cx, top, bot, wt, wb) {   // tall bean-shaped body, a little wider at the bottom
  g.beginPath(); g.moveTo(cx - wt, top + 30); g.bezierCurveTo(cx - wt, top - 10, cx + wt, top - 10, cx + wt, top + 30);
  g.bezierCurveTo(cx + wt + 6, top + (bot - top) * .45, cx + wb, bot - 70, cx + wb, bot - 40); g.bezierCurveTo(cx + wb, bot + 12, cx - wb, bot + 12, cx - wb, bot - 40);
  g.bezierCurveTo(cx - wb, bot - 70, cx - wt - 6, top + (bot - top) * .45, cx - wt, top + 30); g.closePath(); }
function drawToon(g, p, S) {
  g.clearRect(0, 0, CW, CH); const cx = CW / 2, lx = S.lightX, skin = p.skin || '#f6f3ec', hr = 122, bob = S.walk ? Math.abs(Math.sin(S.walk)) * -6 : 0, hy = 150 + bob;
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK;
  // long thin legs
  const hipY = 540 + bob, sw = Math.sin(S.walk) * .32; g.lineWidth = 9;
  for (const s of [-1, 1]) { const [fx, fy] = limb(g, cx + s * 24, hipY, s * sw * (s < 0 ? 1 : -1) + .03, 0, 214, s); g.fillStyle = p.shoes || '#1e1a22'; g.beginPath(); g.ellipse(fx + s * 12, fy + 3, 24, 10, 0, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); g.lineWidth = 9; }
  // tall bean body that tucks up under the head
  const top = 196 + bob, bot = 560 + bob, wt = 90, wb = 108;
  const bg = g.createLinearGradient(cx - wb, 0, cx + wb, 0); bg.addColorStop(lx > 0 ? 1 : 0, shade(p.body, 1.08)); bg.addColorStop(.55, css(p.body)); bg.addColorStop(lx > 0 ? 0 : 1, shade(p.body, .78));
  bean(g, cx, top, bot, wt, wb); g.fillStyle = bg; g.fill(); g.save(); bean(g, cx, top, bot, wt, wb); g.clip(); outfit(g, p, cx - wb, top, wb * 2, bot - top, cx); g.restore(); bean(g, cx, top, bot, wt, wb); g.lineWidth = 9; g.stroke();
  // thin arms + small round hands
  for (const [s, a] of [[-1, S.armL], [1, S.armR]]) { g.lineWidth = 9; const [hx, hy2] = limb(g, cx + s * (wt + 2), top + 120, a[0], a[1], 230, s); g.fillStyle = skin; g.beginPath(); g.arc(hx, hy2, 15, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); if (S.hold && s === 1) S.hold(g, hx, hy2); }
  // head: near-white, very soft shading, thick dark outline
  const hx = cx + S.lookX * 6, hg = g.createRadialGradient(hx + lx * 50, hy - 40, 20, hx, hy, hr); hg.addColorStop(0, shade(skin, 1.02)); hg.addColorStop(.75, skin); hg.addColorStop(1, shade(skin, .9));
  hair(g, p, hx, hy, hr, 'back');
  g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.fillStyle = hg; g.fill();
  g.save(); g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.clip(); g.fillStyle = 'rgba(60,50,70,.08)'; g.beginPath(); g.arc(hx, hy, hr + 2, 0, 7); g.arc(hx + lx * 22, hy - 14, hr * 1.02, 0, 7, true); g.fill('evenodd');
  if (S.expr === 'laugh' || S.expr === 'embarrassed') for (const s of [-1, 1]) { const bl = g.createRadialGradient(hx + s * 62, hy + 36, 0, hx + s * 62, hy + 36, 26); bl.addColorStop(0, 'rgba(240,120,110,.35)'); bl.addColorStop(1, 'rgba(240,120,110,0)'); g.fillStyle = bl; g.fillRect(hx - hr, hy - hr, hr * 2, hr * 2); }
  g.restore();
  g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.lineWidth = 10; g.stroke();
  faceDraw(g, p, S, hx + S.lookX * 16, hy + 14);
  hair(g, p, hx, hy, hr, 'front');
  if (p.earring) { const ex = hx + hr * .9, ey = hy + 40; g.strokeStyle = '#d8a520'; g.lineWidth = 7; g.beginPath(); g.arc(ex, ey + 14, 13, 0, 7); g.stroke(); g.strokeStyle = INK; }
  if (S.sweat > 0) { g.fillStyle = '#8ad8ff'; g.strokeStyle = INK; g.lineWidth = 4; const sx = hx - 92, sy = hy - 40 + (S.sweat * 30) % 30; g.beginPath(); g.moveTo(sx, sy - 18); g.quadraticCurveTo(sx + 13, sy + 2, sx, sy + 8); g.quadraticCurveTo(sx - 13, sy + 2, sx, sy - 18); g.fill(); g.stroke(); }
}
function faceDraw(g, p, S, x, y) {
  const e = S.expr, ex = 40, ey = y - 6; g.strokeStyle = INK; g.fillStyle = INK; g.lineCap = 'round';
  const brow = (s, tilt, dy = 0, w = 26) => { g.lineWidth = 10; g.beginPath(); g.moveTo(x + s * (ex - w / 2 - 2), ey - 34 + dy + tilt); g.lineTo(x + s * (ex + w / 2 + 2), ey - 34 + dy - tilt); g.stroke(); };
  if (e === 'happy' || e === 'laugh' || e === 'proud') for (const s of [-1, 1]) { g.lineWidth = 8; g.beginPath(); g.arc(x + s * ex, ey + 8, 12, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  else if (e === 'shocked' || e === 'scared') for (const s of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x + s * ex, ey, 18, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + s * ex + S.lookX * 4, ey + 1, e === 'scared' ? 5 : 8, 0, 7); g.fill(); }
  else for (const s of [-1, 1]) { const lid = e === 'sly' ? 5 : e === 'sad' ? 2 : 3.5; g.beginPath(); g.ellipse(x + s * ex + S.lookX * 4, ey + 2, 11, S.blink ? 1.5 : 7, 0, 0, 7); g.fill(); g.lineWidth = 5; g.beginPath(); g.moveTo(x + s * ex - 14, ey - lid); g.lineTo(x + s * ex + 14, ey - lid); g.stroke(); }
  if (p.glasses) { g.lineWidth = 5; for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * ex, ey, 24, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(x - 16, ey); g.lineTo(x + 16, ey); g.stroke(); }
  if (e === 'sad' || e === 'scared') { brow(-1, -6); brow(1, -6); } else if (e === 'shocked') { brow(-1, 2, -12); brow(1, 2, -12); } else if (e === 'sly') { brow(-1, 0, 0); brow(1, 7, -4); } else if (e === 'angry') { brow(-1, 8, 4); brow(1, 8, 4); }
  else if (e !== 'happy' && e !== 'laugh') { brow(-1, 1); brow(1, 1); }
  if (p.mustache) { g.fillStyle = p.hairC || INK; g.beginPath(); g.moveTo(x - 44, y + 38); g.quadraticCurveTo(x - 24, y + 12, x, y + 26); g.quadraticCurveTo(x + 24, y + 12, x + 44, y + 38); g.quadraticCurveTo(x + 22, y + 32, x, y + 36); g.quadraticCurveTo(x - 22, y + 32, x - 44, y + 38); g.fill(); }
  const my = y + 52; g.lineWidth = 7;
  if (e === 'happy' || e === 'laugh' || e === 'proud') { const w = e === 'laugh' ? 34 : 24, h = e === 'laugh' ? 32 : 18; g.beginPath(); g.moveTo(x - w, my - 6); g.quadraticCurveTo(x, my - 10, x + w, my - 6); g.quadraticCurveTo(x + w * .8, my + h, x, my + h); g.quadraticCurveTo(x - w * .8, my + h, x - w, my - 6); g.closePath(); g.fillStyle = '#4a1418'; g.fill(); g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(x - w, my - 10, w * 2, 9); g.fillStyle = '#e06068'; g.beginPath(); g.ellipse(x, my + h, w * .55, h * .45, 0, 0, 7); g.fill(); g.restore(); g.lineWidth = 6; g.stroke(); }
  else if (e === 'shocked') { g.fillStyle = '#4a1418'; g.beginPath(); g.ellipse(x, my + 4, 12, 16, 0, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); }
  else if (e === 'scared') { g.beginPath(); for (let i = 0; i <= 6; i++) { const xx = x - 24 + i * 8, yy = my + (i % 2 ? -4 : 4); i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
  else if (e === 'sad') { g.beginPath(); g.arc(x, my + 20, 18, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); }
  else if (e === 'sly') { g.beginPath(); g.moveTo(x - 18, my + 2); g.quadraticCurveTo(x + 4, my + 10, x + 22, my - 4); g.stroke(); }
  else { g.beginPath(); g.moveTo(x - 20, my); g.lineTo(x + 20, my); g.stroke(); }
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
  if (H === 'ranger') { g.fillStyle = p.hatC || '#8a6a3a'; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.ellipse(x, y - r * .62, r * 1.32, 22, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x - r * .62, y - r * .64); g.lineTo(x - r * .5, y - r * 1.22); g.quadraticCurveTo(x - r * .25, y - r * 1.05, x, y - r * 1.28); g.quadraticCurveTo(x + r * .25, y - r * 1.05, x + r * .5, y - r * 1.22); g.lineTo(x + r * .62, y - r * .64); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#3a2a1a'; g.fillRect(x - r * .6, y - r * .82, r * 1.2, 16); }
  if (H === 'mop') { g.fillStyle = p.hairC || '#3a2418'; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.arc(x, y, r + 4, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(x + r * .7, y - r * .42, x + r * .1, y - r * .5); g.quadraticCurveTo(x - r * .3, y - r * .3, x - r * .75, y - r * .46); g.quadraticCurveTo(x - r * .95, y - r * .3, x - r - 4, y - r * .1); g.closePath(); g.fill(); g.stroke(); }
  g.strokeStyle = INK; g.lineWidth = 8;
  if (p.beard) { g.fillStyle = p.hairC || '#2a1a12'; g.beginPath(); g.moveTo(x - r * .75, y + r * .35); g.quadraticCurveTo(x, y + r * 1.55, x + r * .75, y + r * .35); g.quadraticCurveTo(x, y + r * .95, x - r * .75, y + r * .35); g.fill(); g.stroke(); }
}
function outfit(g, p, x, y, w, h, cx) {
  const o = p.outfit, dk = shade(p.body, .72), st = (x0, y0, x1, y1) => { g.save(); g.setLineDash([6, 6]); g.strokeStyle = dk; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore(); };
  const pocket = (px, py) => { g.fillStyle = shade(p.body, .9); g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.roundRect(px, py, 44, 38, 6); g.fill(); g.stroke(); g.beginPath(); g.moveTo(px, py + 12); g.lineTo(px + 44, py + 12); g.stroke(); };
  if (o === 'uniform') { st(cx, y + 60, cx, y + h); pocket(cx - 70, y + 120); pocket(cx + 26, y + 120); g.fillStyle = '#c8a040'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 34, y + 84); g.lineTo(cx + 62, y + 84); g.lineTo(cx + 62, y + 104); g.quadraticCurveTo(cx + 48, y + 120, cx + 34, y + 104); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#16181e'; g.fillRect(x, y + h * .74, w, 20); g.fillStyle = '#e8c33a'; g.fillRect(cx - 14, y + h * .74 - 2, 28, 24); }
  if (o === 'tie') { st(cx - 30, y + 80, cx - 30, y + h); g.fillStyle = '#f2f2f2'; g.beginPath(); g.moveTo(cx - 30, y + 30); g.lineTo(cx, y + 70); g.lineTo(cx + 30, y + 30); g.fill(); g.fillStyle = p.tie || '#7a3a2a'; g.beginPath(); g.moveTo(cx - 9, y + 50); g.lineTo(cx + 9, y + 50); g.lineTo(cx + 7, y + 190); g.lineTo(cx, y + 204); g.lineTo(cx - 7, y + 190); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(); pocket(cx + 34, y + 110); }
  if (o === 'coat') { g.fillStyle = shade(p.body, .7); g.fillRect(cx - 4, y, 8, h); g.fillStyle = '#f4ece0'; g.beginPath(); g.moveTo(cx - 30, y + 20); g.lineTo(cx, y + 80); g.lineTo(cx + 30, y + 20); g.fill(); g.fillStyle = '#d8a520'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx + 20, y + 110 + i * 34, 7, 0, 7); g.fill(); } g.fillStyle = '#3a2418'; g.fillRect(x, y + h * .7, w, 20); g.fillStyle = '#d8a520'; g.fillRect(cx - 14, y + h * .7 - 2, 28, 24); }
  if (o === 'overalls') { g.fillStyle = p.shirt || '#f2f2f2'; g.fillRect(x, y, w, 120); g.fillStyle = p.bib || '#3a6ab0'; g.beginPath(); g.roundRect(cx - 52, y + 100, 104, h, 12); g.fill(); g.fillRect(x, y + 190, w, h); g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 44, y + 104); g.lineTo(cx - 64, y + 10); g.moveTo(cx + 44, y + 104); g.lineTo(cx + 64, y + 10); g.stroke(); pocket(cx - 22, y + 130); }
  if (o === 'stripes') { g.fillStyle = '#2a4a9a'; for (let yy = y + 40; yy < y + h; yy += 32) g.fillRect(x, yy, w, 13); }
  if (o === 'vest') { g.fillStyle = '#f2ece0'; g.fillRect(cx - 24, y, 48, h); g.fillStyle = shade(p.body, .85); g.fillRect(cx - 4, y + 60, 8, h); }
  if (o === 'suit') { g.fillStyle = '#f2f2f2'; g.beginPath(); g.moveTo(cx - 28, y + 20); g.lineTo(cx, y + 90); g.lineTo(cx + 28, y + 20); g.fill(); g.fillStyle = p.tie || '#c8202a'; g.beginPath(); g.moveTo(cx - 8, y + 34); g.lineTo(cx + 8, y + 34); g.lineTo(cx + 6, y + 110); g.lineTo(cx, y + 120); g.lineTo(cx - 6, y + 110); g.fill(); }
  if (o === 'robe') { g.fillStyle = '#f2f2f2'; g.fillRect(cx - 14, y + 20, 28, 18); }
  if (o === 'khaki') { pocket(cx - 70, y + 110); pocket(cx + 26, y + 110); g.fillStyle = '#5a3a1a'; g.fillRect(x, y + h * .66, w, 16); }
  if (o === 'apron') { g.fillStyle = '#e8e2d2'; g.beginPath(); g.roundRect(cx - 44, y + 90, 88, h, 16); g.fill(); }
}
