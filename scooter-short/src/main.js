// "Why You Should Never Ride An Electric Scooter Too Fast" - low-poly Zack-style short, rendered frame by frame.
// Engine shared with ../chip-short; this one adds jointed limbs + IK, blinks, real shadows and night lighting.
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 360, H = 640, SCALE = 3, FPS = 30;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const css = h => '#' + h.toString(16).padStart(6, '0');
const shade = (hex, f) => { const c = new THREE.Color(hex); c.multiplyScalar(f); c.r = clamp(c.r); c.g = clamp(c.g); c.b = clamp(c.b); return '#' + c.getHexString(); };
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
const lo = document.createElement('canvas'); lo.width = W; lo.height = H;
const lg = lo.getContext('2d', { willReadFrequently: true });
const out = document.getElementById('out'); out.width = W * SCALE; out.height = H * SCALE;
const og = out.getContext('2d');

// ---------- textures ----------
function ctex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function noise(g, w, h, amt, seed) {
  const id = g.getImageData(0, 0, w, h), d = id.data, r = rng(seed);
  for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
}
function snap(m) {
  m.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n gl_Position.xy = floor(gl_Position.xy / gl_Position.w * vec2(180., 320.) + .5) / vec2(180., 320.) * gl_Position.w;');
  };
  return m;
}
const mat = o => snap(new THREE.MeshLambertMaterial({ flatShading: true, ...o }));
const bmat = o => snap(new THREE.MeshBasicMaterial(o));
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); return me; };

const EXPR = {
  neutral: { open: 1, browIn: 0, browOut: 0, mouth: 'neutral' },
  happy: { open: 1, browIn: 1.5, browOut: 1.5, mouth: 'grin' },
  shocked: { open: 1.55, browIn: 4, browOut: 3, pupil: .6, mouth: 'open' },
  blind: { open: 1.55, browIn: 4, browOut: 3, mouth: 'open', black: true },
  worried: { open: 1.25, browIn: 4, browOut: 0, mouth: 'frown' },
  sad: { open: .8, browIn: 4.5, browOut: -1, ly: .8, mouth: 'frown', tear: true },
  confused: { open: 1, browIn: 0, browOut: 0, browL: 3, browR: -1.5, mouth: 'skew' },
  scream: { open: 1.7, browIn: 5, browOut: 4, pupil: .5, mouth: 'scream' },
  laugh: { open: .22, browIn: 2, browOut: 3, mouth: 'grin' },
};
function faceTex(p, expr) {
  const E = { lx: 0, ly: 0, pupil: 1, ...EXPR[expr] };
  return ctex(64, 64, g => {
    let gr = g.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, shade(p.skin, 1.22)); gr.addColorStop(.5, css(p.skin)); gr.addColorStop(1, shade(p.skin, .72));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    gr = g.createLinearGradient(0, 0, 64, 0);
    gr.addColorStop(0, 'rgba(40,10,5,.42)'); gr.addColorStop(.22, 'rgba(40,10,5,0)'); gr.addColorStop(.78, 'rgba(40,10,5,0)'); gr.addColorStop(1, 'rgba(40,10,5,.42)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    for (const cx of [15, 49]) { gr = g.createRadialGradient(cx, 41, 0, cx, 41, 9); gr.addColorStop(0, 'rgba(210,70,60,' + (E.blush ? .9 : .3) + ')'); gr.addColorStop(1, 'rgba(210,70,60,0)'); g.fillStyle = gr; g.fillRect(0, 28, 64, 26); }
    g.strokeStyle = 'rgba(60,25,15,.28)'; g.lineWidth = 1;
    for (const y of [12, 15.5]) { g.beginPath(); g.moveTo(16, y); g.quadraticCurveTo(32, y - 1.5 - E.browIn * .3, 48, y); g.stroke(); }
    g.fillStyle = css(p.hair); g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 0); g.lineTo(64, 12);
    for (let x = 60; x >= 0; x -= 6) g.lineTo(x, 5 + ((x / 6) % 2) * 2.5 + (x < 10 || x > 52 ? 6 : 0));
    g.closePath(); g.fill();
    for (const s of [-1, 1]) {
      const cx = 32 + s * 12, cy = 27, ry = Math.max(3.4 * E.open, .7);
      gr = g.createRadialGradient(cx, cy, 2, cx, cy, 11); gr.addColorStop(0, 'rgba(70,25,20,.42)'); gr.addColorStop(1, 'rgba(70,25,20,0)');
      g.fillStyle = gr; g.fillRect(cx - 11, cy - 11, 22, 22);
      g.save(); g.beginPath(); g.ellipse(cx, cy, 6.5, ry, 0, 0, 7); g.clip();
      g.fillStyle = E.black ? '#050505' : '#f3eee6'; g.fillRect(cx - 8, cy - 8, 16, 16);
      if (!E.black) {
        const ix = cx + E.lx * 2, iy = cy + E.ly * 1.5;
        g.fillStyle = p.iris || '#4a7fb0'; g.beginPath(); g.arc(ix, iy, 3.1, 0, 7); g.fill();
        g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(ix, iy, 1.5 * E.pupil, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.fillRect(ix - 1.6, iy - 1.6, 1.2, 1.2);
      }
      g.restore();
      g.strokeStyle = 'rgba(30,12,8,.95)'; g.lineWidth = 1.3; g.beginPath(); g.ellipse(cx, cy, 6.5, ry, 0, Math.PI, 2 * Math.PI); g.stroke();
      g.strokeStyle = 'rgba(30,12,8,.45)'; g.lineWidth = .8; g.beginPath(); g.ellipse(cx, cy, 6.5, ry, 0, 0, Math.PI); g.stroke();
      g.strokeStyle = 'rgba(70,30,25,.35)'; g.beginPath(); g.arc(cx, cy + 2, 7.5, .5, 2.6); g.stroke();
      const off = (s < 0 ? E.browL : E.browR) || 0, bi = E.browIn + off, bo = E.browOut + off;
      g.strokeStyle = shade(p.hair, .55); g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - s * 6.5, 20 - bi); g.quadraticCurveTo(cx, 18 - (bi + bo) / 2, cx + s * 7.5, 20.5 - bo); g.stroke();
      if (p.glasses) { g.strokeStyle = '#141414'; g.lineWidth = 1.6; g.strokeRect(cx - 8.5, cy - 6.5, 17, 13); g.beginPath(); g.moveTo(27.5, cy - 2); g.lineTo(36.5, cy - 2); g.stroke(); }
    }
    g.lineCap = 'butt';
    g.strokeStyle = 'rgba(70,30,20,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(29.5, 27); g.quadraticCurveTo(27.5, 36, 27, 41); g.quadraticCurveTo(32, 44.5, 37, 41); g.stroke();
    gr = g.createRadialGradient(32, 38, 0, 32, 38, 5); gr.addColorStop(0, 'rgba(255,235,220,.5)'); gr.addColorStop(1, 'rgba(255,235,220,0)'); g.fillStyle = gr; g.fillRect(26, 32, 12, 12);
    g.fillStyle = 'rgba(30,10,8,.8)'; g.fillRect(29, 41, 2, 1.5); g.fillRect(34, 41, 2, 1.5);
    g.strokeStyle = 'rgba(70,30,20,.32)'; g.lineWidth = 1; g.beginPath(); g.moveTo(24, 42); g.quadraticCurveTo(20, 47, 21, 53); g.moveTo(40, 42); g.quadraticCurveTo(44, 47, 43, 53); g.stroke();
    if (p.stubble) { const r = rng(7); g.fillStyle = 'rgba(40,25,20,.22)'; for (let i = 0; i < 420; i++) { const x = r() * 64, y = 43 + r() * 21; if (Math.abs(x - 32) < 8 && y < 47) continue; g.fillRect(x | 0, y | 0, 1, 1); } }
    if (p.mustache) { g.fillStyle = shade(p.hair, .8); g.beginPath(); g.moveTo(22, 47.5); g.quadraticCurveTo(32, 41.5, 42, 47.5); g.quadraticCurveTo(32, 46, 22, 47.5); g.fill(); g.fillRect(23, 45, 18, 2.4); }
    const lip = p.lip || '#a8504a', my = 52, m = E.mouth;
    if (m === 'neutral' || m === 'frown' || m === 'skew') {
      const c = m === 'frown' ? -4 : 0, sk = m === 'skew' ? 2.2 : 0;
      for (const [col, lw] of [[lip, 3.2], ['#2a0d0c', 1.2]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(23, my - c * .45 - sk); g.quadraticCurveTo(32, my + c, 41, my - c * .45 + sk); g.stroke(); }
    } else if (m === 'grin') {
      const path = () => { g.beginPath(); g.moveTo(20, 48.5); g.lineTo(44, 48.5); g.quadraticCurveTo(32, 64, 20, 48.5); g.closePath(); };
      g.strokeStyle = lip; g.lineWidth = 2.5; path(); g.stroke(); g.fillStyle = '#1c0606'; path(); g.fill();
      g.save(); path(); g.clip(); g.fillStyle = '#f1ece0'; g.fillRect(18, 48, 28, 3.6); g.fillStyle = '#c4514f'; g.beginPath(); g.ellipse(32, 58, 6, 3.5, 0, 0, 7); g.fill(); g.restore();
    } else {
      const rx = { open: 6, scream: 9, o: 3.5 }[m], ry = { open: 6, scream: 9, o: 4 }[m], cy = my + (m === 'scream' ? 1.5 : 0);
      g.fillStyle = lip; g.beginPath(); g.ellipse(32, cy, rx + 1.5, ry + 1.5, 0, 0, 7); g.fill();
      g.fillStyle = '#1c0606'; g.beginPath(); g.ellipse(32, cy, rx, ry, 0, 0, 7); g.fill();
      g.save(); g.beginPath(); g.ellipse(32, cy, rx, ry, 0, 0, 7); g.clip();
      g.fillStyle = '#f1ece0'; g.fillRect(32 - rx, cy - ry, rx * 2, 2.8);
      g.fillStyle = '#c4514f'; g.beginPath(); g.ellipse(32, cy + ry, rx * .7, ry * .55, 0, 0, 7); g.fill(); g.restore();
    }
    if (E.tear) { g.fillStyle = 'rgba(150,215,255,.95)'; g.beginPath(); g.ellipse(17, 36, 1.8, 3.2, 0, 0, 7); g.fill(); g.fillRect(16.5, 31, 1.2, 4); }
    noise(g, 64, 64, 16, 11 + expr.length);
  });
}
const sideTex = p => ctex(32, 32, g => {
  g.fillStyle = css(p.skin); g.fillRect(0, 0, 32, 32);
  g.fillStyle = css(p.hair); g.fillRect(0, 0, 32, 11); g.fillRect(0, 0, 9, 22); g.fillRect(23, 0, 9, 22);
  g.fillStyle = shade(p.skin, .75); g.beginPath(); g.ellipse(16, 17, 3.5, 5, 0, 0, 7); g.fill();
  g.fillStyle = shade(p.skin, 1.1); g.beginPath(); g.ellipse(16, 17, 2, 3.4, 0, 0, 7); g.fill();
  noise(g, 32, 32, 14, 3);
});
const texCache = {};
function fabricTex(hex, style) {
  const k = hex + style; if (texCache[k]) return texCache[k];
  return texCache[k] = ctex(32, 32, g => {
    const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, shade(hex, 1.15)); gr.addColorStop(1, shade(hex, .75));
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    if (style === 'hoodie') {
      g.strokeStyle = shade(hex, .5); g.lineWidth = 1; g.strokeRect(8.5, 19.5, 15, 8);
      g.beginPath(); g.moveTo(16, 0); g.lineTo(16, 19); g.stroke();
      g.strokeStyle = '#f2f2f2'; g.beginPath(); g.moveTo(13, 0); g.lineTo(12, 9); g.moveTo(19, 0); g.lineTo(20, 9); g.stroke();
      g.fillStyle = shade(hex, .55); g.beginPath(); g.moveTo(8, 0); g.lineTo(16, 6); g.lineTo(24, 0); g.fill();
    } else if (style === 'uniform') {
      g.fillStyle = '#e8c33a'; g.fillRect(20, 6, 5, 5); g.fillStyle = '#10182e'; g.fillRect(15, 0, 2, 32);
      g.fillStyle = '#c9c9c9'; for (let y = 5; y < 30; y += 7) g.fillRect(15, y, 2, 2);
      g.fillStyle = '#10182e'; g.fillRect(6, 7, 7, 1);
    } else if (style === 'coat') {
      g.fillStyle = shade(hex, .6); g.fillRect(15, 0, 2, 32); g.fillStyle = '#3a3a3a'; for (let y = 4; y < 30; y += 6) g.fillRect(18, y, 2, 2);
    } else if (style === 'sequin') {
      const r = rng(71); for (let i = 0; i < 70; i++) { g.fillStyle = ['#ffffff', '#9fd0ff', '#ffe9a0'][i % 3]; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 1); }
      g.fillStyle = '#f2f2f2'; g.beginPath(); g.moveTo(10, 0); g.lineTo(16, 13); g.lineTo(22, 0); g.fill(); g.fillStyle = '#e8c33a'; g.fillRect(4, 3, 3, 26); g.fillRect(25, 3, 3, 26);
    } else if (style === 'suit') {
      g.fillStyle = '#f2f2f2'; g.beginPath(); g.moveTo(9, 0); g.lineTo(16, 16); g.lineTo(23, 0); g.fill(); g.fillStyle = '#c8202a'; g.fillRect(15, 2, 2, 14); g.fillStyle = shade(hex, .55); g.fillRect(15.5, 16, 1, 16);
    } else if (style === 'crew') {
      g.fillStyle = '#f2f2f2'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillText('CREW', 16, 16);
    } else if (style === 'jersey') {
      g.fillStyle = '#d8262a'; g.fillRect(0, 0, 2, 32); g.fillRect(30, 0, 2, 32); g.beginPath(); g.moveTo(9, 0); g.lineTo(16, 9); g.lineTo(23, 0); g.lineTo(20, 0); g.lineTo(16, 5); g.lineTo(12, 0); g.fill();
    } else if (style === 'pants') {
      g.strokeStyle = shade(hex, .6); g.beginPath(); g.moveTo(16, 0); g.lineTo(16, 32); g.stroke();
    }
    noise(g, 32, 32, 22, 5);
  });
}
const mosaicTex = ctex(6, 4, g => { const r = rng(4); for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) { const v = 150 + r() * 90 | 0; g.fillStyle = `rgb(${v},${v * .78 | 0},${v * .66 | 0})`; g.fillRect(x, y, 1, 1); } });

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
// ---------- timing: shots are cut on the original voiceover clock; animation runs on the final (edited) clock ----------
const cutInfo = await (await fetch('/build/cuts.json')).json();
const tm = t => (t - cutInfo.cuts.reduce((s, [a, b]) => s + (t > a ? Math.min(t, b) - a : 0), 0)) / cutInfo.speed;
const toOriginal = tc => { let t = tc * cutInfo.speed; for (const [a, b] of cutInfo.cuts) { if (t >= a) t += b - a; else break; } return t; };
const TOTAL = cutInfo.duration;
const shots = [];
const shot = (t0, t1, build, dof = null) => { const s = { t0, t1, f0: tm(t0), f1: t1 > 90 ? TOTAL : tm(t1), dof, ...build(t0) }; s.scene.traverse(o => { if (o.isMesh) { const m = Array.isArray(o.material) ? o.material[0] : o.material; const basic = m.isMeshBasicMaterial || m.isShaderMaterial; o.castShadow = !basic && !m.transparent; o.receiveShadow = !basic; } }); shots.push(s); };
const at = (t0, o) => tm(o) - tm(t0);   // when (in final seconds, from the shot start) an original-clock moment happens
// ================= ELECTRIC SCOOTER =================
const RIDER = { skin: 0xc98d68, hair: 0x2a1c12, top: 0xe8642a, pants: 0x2a3a5a, iris: '#5a3a1a', hairH: .16, shoes: 0xf2f2f2, seed: .4 };
const PEOPLE = [RIDER,
  { skin: 0xe8b89a, hair: 0xc8a050, top: 0x3a8ad8, pants: 0x2a2a30, iris: '#4a7ab0', hairH: .1, shoes: 0x222222, seed: 1.3 },
  { skin: 0x8a5a3c, hair: 0x1a1410, top: 0x3fae5a, pants: 0x3a3a4a, iris: '#3a2416', hairH: .22, shoes: 0xe8e8e8, lip: '#7a3838', seed: 2.2 },
  { skin: 0xe2a57f, hair: 0x5a3a1a, top: 0xd83a5a, pants: 0x4a3a2a, iris: '#4a6a3a', hairH: .12, shoes: 0x3a2a1a, stubble: true, seed: 3.1 }];
const LANE_Z = 1.6, X0 = 20, XR = 8, V_RIDE = 9;   // crack at X0, rock at XR, riding speed (units/s)

// ---------- textures ----------
const skyDay = ctex(64, 128, g => {
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#2f6fd8'); gr.addColorStop(.6, '#7fb8f0'); gr.addColorStop(1, '#d8ecff'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
  const r = rng(21); g.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < 9; i++) { const x = r() * 64, y = 8 + r() * 60; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + (r() - .5) * 16, y + (r() - .5) * 4, 4 + r() * 5, 2 + r() * 2, 0, 0, 7); g.fill(); } }
});
const asphaltT = wrap(ctex(32, 32, g => { g.fillStyle = '#4a4c52'; g.fillRect(0, 0, 32, 32); noise(g, 32, 32, 26, 71); }));
const laneT = wrap(ctex(32, 32, g => { g.fillStyle = '#3f8a5a'; g.fillRect(0, 0, 32, 32); noise(g, 32, 32, 18, 72); }));
const walkT = wrap(ctex(32, 32, g => { g.fillStyle = '#b8b4ac'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#9a968e'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32); noise(g, 32, 32, 16, 73); }));
const grassT = wrap(ctex(32, 32, g => { g.fillStyle = '#5aa04a'; g.fillRect(0, 0, 32, 32); const r = rng(9); for (let i = 0; i < 160; i++) { g.fillStyle = r() < .5 ? '#4a8a3c' : '#6ab45a'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 2); } }));
function facadeT(wall, seed) { return wrap(ctex(32, 32, g => { g.fillStyle = css(wall); g.fillRect(0, 0, 32, 32); const r = rng(seed); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const x = 3 + i * 16, y = 4 + j * 16; g.fillStyle = '#e9e2d0'; g.fillRect(x - 1, y - 1, 12, 11); g.fillStyle = r() < .25 ? '#f2d680' : ['#5a7a9a', '#4a6a8a', '#6a8aaa'][r() * 3 | 0]; g.fillRect(x, y, 10, 9); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, 10, 2); } noise(g, 32, 32, 14, seed); })); }
const FACS = [facadeT(0xc7785a, 31), facadeT(0xe0cfa0, 32), facadeT(0x8da3b8, 33), facadeT(0xd8a0a0, 34), facadeT(0xa8c8a0, 35)];
const tileT = wrap(ctex(32, 32, g => { g.fillStyle = '#e8eef0'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#c8d4d8'; for (let i = 0; i < 32; i += 8) { g.fillRect(i, 0, 1, 32); g.fillRect(0, i, 32, 1); } }));
function label(text, bg = '#ffe21f', fg = '#16120a', w = 1.9, h = .8) {
  const D = dynTex(96, 40), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), bmat({ map: D.t, transparent: true, fog: false }));
  m.userData.draw = (tx, b = bg, f = fg) => { const g = D.g; g.clearRect(0, 0, 96, 40); g.fillStyle = '#16120a'; g.fillRect(0, 0, 96, 40); g.fillStyle = b; g.fillRect(3, 3, 90, 34); g.fillStyle = f; let px = 24; do { g.font = 'bold ' + px + 'px sans-serif'; px--; } while (g.measureText(tx).width > 84 && px > 6); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(tx, 48, 21); D.t.needsUpdate = true; };
  m.userData.draw(text); return m;
}
const hudOn = (cam, m, y = 1.15, z = -4) => { cam.add(m); m.position.set(0, y, z); m.material.depthTest = false; m.renderOrder = 999; return m; };
function arrow(col = 0xe8202a, len = 1.2) { const g = new THREE.Group(), m = bmat({ color: col, fog: false, depthTest: false }); const sh = box(len, .12, .04, m, len / 2, 0, 0); sh.renderOrder = 990; g.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(.2, .35, 3), m); hd.rotation.z = -Math.PI / 2; hd.position.x = len + .15; hd.renderOrder = 990; g.add(hd); return g; }
function speedLines(scene, n = 26) { const r = rng(n); return [...Array(n)].map(() => { const l = box(1.2, .015, .015, bmat({ color: 0xffffff, transparent: true, opacity: .55, fog: false })); l.userData = { a: r(), y: .2 + r() * 2.2, z: (r() - .5) * 2.4 }; scene.add(l); return l; }); }
const speedLinesAt = (ls, t, cx, cz, a = 1, rate = 1.6) => ls.forEach(l => { const u = l.userData, q = (t * rate + u.a) % 1; l.position.set(cx + 4 - q * 8, u.y, cz + u.z); l.visible = a > .05; l.material.opacity = .55 * a * Math.sin(q * Math.PI); });
function dust(scene, n = 10) { return [...Array(n)].map((_, i) => { const d = new THREE.Mesh(new THREE.IcosahedronGeometry(.06, 0), mat({ color: 0xc8b8a0, transparent: true })); d.userData = i; scene.add(d); return d; }); }
const dustAt = (ds, p, k) => ds.forEach(d => { const i = d.userData, an = i * 2.4; d.position.set(p.x + Math.cos(an) * k * .5, p.y + .05 + k * .35 * (1 - k) * (1 + (i % 3) * .3), p.z + Math.sin(an) * k * .5); d.scale.setScalar(k > 0 && k < 1 ? (1 - k) * 1.5 + .3 : 0); });
function starsRing(scene, n = 5) { return [...Array(n)].map(() => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.07), bmat({ color: 0xffe21f, fog: false })); scene.add(s); return s; }); }

// ---------- the scooter: origin at the deck centre on the ground, facing +x; pitches about its front wheel ----------
function makeScooter(accent = 0x2fbf71) {
  const g = new THREE.Group(), piv = new THREE.Group(), body = new THREE.Group(); piv.position.x = .55; body.position.x = -.55; g.add(piv); piv.add(body);
  const dark = mat({ color: 0x1c1e22 }), grey = mat({ color: 0x6a6e76 }), acc = mat({ color: accent }), rub = mat({ color: 0x111111 });
  body.add(box(.95, .06, .2, dark, 0, .16, 0)); body.add(box(.86, .012, .16, mat({ color: 0x2a2c30 }), 0, .196, 0)); body.add(box(.95, .02, .21, acc, 0, .13, 0));
  const stem = box(.06, 1.0, .06, grey, .54, .66, 0); stem.rotation.z = -.085; body.add(stem);
  body.add(box(.06, .06, .58, grey, .585, 1.14, 0)); for (const s of [-1, 1]) body.add(box(.07, .075, .13, rub, .585, 1.14, s * .25));
  body.add(box(.1, .04, .1, dark, .56, 1.18, 0)); const D = dynTex(48, 32), scr = new THREE.Mesh(new THREE.PlaneGeometry(.1, .07), bmat({ map: D.t })); scr.rotation.x = -Math.PI / 2; scr.rotation.z = -Math.PI / 2; scr.position.set(.56, 1.203, 0); body.add(scr);
  body.add(box(.05, .05, .07, bmat({ color: 0xfff6d0 }), .6, .95, 0)); body.add(box(.03, .04, .12, bmat({ color: 0xe02020 }), -.5, .22, 0)); body.add(box(.22, .02, .1, dark, -.42, .25, 0));
  const fork = box(.04, .22, .12, grey, .55, .16, 0); body.add(fork);
  const wheels = [.55, -.45].map(x => { const w = new THREE.Group(); w.position.set(x, .1, 0); const tire = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .055, 14), rub); tire.rotation.x = Math.PI / 2; w.add(tire); const hub = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .06, 8), grey); hub.rotation.x = Math.PI / 2; w.add(hub); w.add(box(.11, .02, .062, acc)); body.add(w); return w; });
  g.userData = { piv, body, wheels, spin(a) { wheels.forEach(w => w.rotation.z = -a); },
    speed(v, t = 0) { const c = D.g; c.fillStyle = '#0a0e12'; c.fillRect(0, 0, 48, 32); c.fillStyle = v > 35 ? '#ff4a3a' : v > 25 ? '#ffd23a' : '#7affb0'; c.font = 'bold 20px monospace'; c.textAlign = 'center'; c.fillText(String(Math.round(v)), 24, 21); c.font = 'bold 7px monospace'; c.fillText('km/h', 24, 29); c.fillRect(4, 3, 40 * Math.min(1, v / 45), 3); D.t.needsUpdate = true; },
    grip: s => wp(body, .585, 1.14, s * .25) };
  g.userData.speed(18); return g;
}
function makeHelmet(col = 0x2f8ad8) { const g = new THREE.Group(), m = mat({ color: col }); const dome = new THREE.Mesh(new THREE.SphereGeometry(.31, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m); dome.scale.set(1, .85, 1.08); g.add(dome); g.add(box(.5, .04, .1, mat({ color: 0x1a1a1e }), 0, .02, .3)); for (const s of [-1, 1]) g.add(box(.04, .22, .04, mat({ color: 0x1a1a1e }), s * .24, -.12, .05)); g.add(box(.08, .03, .3, mat({ color: 0xffffff }), 0, .26, -.02)); return g; }
function bandage(h) { const b = box(.5, .2, .5, mat({ color: 0xf6f4ee }), 0, .44, 0); b.rotation.z = .08; h.head.add(b); h.head.add(box(.12, .12, .03, mat({ color: 0xf6f4ee }), .1, .3, .23)); return h; }

// ---------- the rider on the scooter, and the crash (c = slow-motion crash clock; impact at c = 0) ----------
// F (world pitch about z, at the hips) -> F2 (faces +x) -> rider root (feet), so pitching rotates around the hips
function rig(scene, p = RIDER) { const h = makeHuman(p), F = new THREE.Group(), F2 = new THREE.Group(); F2.rotation.y = Math.PI / 2; h.root.position.y = -.84; F.add(F2); F2.add(h.root); scene.add(F); h.F = F; return h; }
function mountPose(h, sc, t, lean = .12) {
  h.reset(); h.F.children[0].rotation.y = Math.PI / 2; sc.updateMatrixWorld(true); const deck = wp(sc.userData.body, .02, .2, 0); h.F.position.set(deck.x, deck.y + .82, deck.z); h.F.rotation.set(0, 0, 0);
  h.legs[0].rotation.x = -.22; h.legs[1].rotation.x = .26; h.shins.forEach(s => s.rotation.x = .16); h.legs[0].rotation.z = .1; h.legs[1].rotation.z = -.1;
  h.torso.rotation.x = lean; h.breathe(t, .4); ik(h, 0, sc.userData.grip(1)); ik(h, 1, sc.userData.grip(-1));
}
const HT = .6, HC = .72;   // hands touch the ground, head hits the ground
function hipAt(c) { const x = X0 - .53 + 2.6 * (c < HT ? c : HT + (c - HT) * .4), y = 1.02 + 1.5 * c - 3.2 * c * c; if (c <= HC) return V(x, y, LANE_Z); const k = ss(HC, .95, c), yc = 1.02 + 1.5 * HC - 3.2 * HC * HC; return V(x + .12 * k, lerp(yc, .2, k), LANE_Z); }
const pitchAt = c => c <= HC ? -1.75 * ss(0, HC, c) : lerp(-1.75, -1.55, ss(HC, .95, c));
function crash(S, c, t) {
  const sc = S.sc, h = S.R, u = sc.userData;
  if (c < 0) { sc.position.set(X0 - .55 + V_RIDE * .35 * c, 0, LANE_Z); sc.rotation.set(0, 0, 0); u.piv.rotation.z = 0; u.spin(sc.position.x / .1); mountPose(h, sc, t, .16); h.face('neutral', t); return; }
  sc.position.set(X0 - .55, 0, LANE_Z); u.piv.rotation.z = -.5 * Math.sin(Math.PI * clamp(c / .26)); sc.rotation.x = -1.35 * ss(.3, .75, c); u.spin((X0 - .55) / .1);
  h.reset(); const hp = hipAt(c); h.F.position.copy(hp); h.F.rotation.set(0, 0, pitchAt(c));
  const air = ss(.02, .3, c); h.legs[0].rotation.x = -.22 + .55 * air; h.legs[1].rotation.x = .26 + .3 * air; h.shins.forEach(s => s.rotation.x = .16 + .7 * air); h.torso.rotation.x = .16 * (1 - air);
  if (c > HC) { const k = ss(HC, .95, c); h.legs.forEach(l => l.rotation.x = lerp(l.rotation.x, .1, k)); h.shins.forEach(s => s.rotation.x = lerp(s.rotation.x, .2, k)); h.neck.rotation.x = -.5 * k; }
  // hands: on the grips, then reaching out, then planted on the ground
  if (c < .14) { ik(h, 0, u.grip(1)); ik(h, 1, u.grip(-1)); }
  else { const g0 = [1, -1].map(s => V(hipAt(HT).x + .78, .05, LANE_Z + s * .26));
    [0, 1].forEach(i => { const reach = wp(h.torso, (i ? 1 : -1) * .3, 1.25, .25); const k = ss(.18, HT, c); ik(h, i, c >= HT ? g0[i] : vl(reach, g0[i], k * k)); }); }
  h.face(c < .02 ? 'shocked' : c < HC ? 'scream' : c < .8 ? 'pain' : 'dizzy', t);
}
function street(o = {}) {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyDay; scene.fog = new THREE.Fog(0xcfe4f6, 30, 70);
  const S = { scene, cam };
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x5a6a4a, 1.6));
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.6); scene.add(sun, sun.target); sun.castShadow = true; Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 40 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0015; sun.shadow.normalBias = .02;
  S.focus = x => { sun.target.position.set(x, 0, LANE_Z); sun.position.set(x + 6, 14, LANE_Z + 8); };
  const ground = (w, d, m, x, y, z, rx = 1) => { const g = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); g.rotation.x = -Math.PI / 2; g.position.set(x, y, z); m.map && m.map.repeat && 0; scene.add(g); return g; };
  const tex = (t, rx, ry) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return c; };
  ground(140, 6, mat({ map: tex(asphaltT, 70, 3) }), 20, 0, -2);
  ground(140, 1.2, mat({ map: tex(laneT, 70, 1) }), 20, .004, LANE_Z);
  for (let x = -50; x < 90; x += 3) scene.add(box(1.4, .01, .1, bmat({ color: 0xf2f2f2 }), x, .008, -1.5));
  scene.add(box(140, .02, .08, bmat({ color: 0xf2f2f2 }), 20, .008, LANE_Z - .65));
  for (let x = -40; x < 80; x += 12) { const sym = box(.5, .01, .3, bmat({ color: 0xf2f2f2 }), x, .009, LANE_Z); scene.add(sym); }
  for (const z of [3.0, -5.6]) { scene.add(uvBox(140, .16, 1.6, mat({ map: walkT }), 20, .08, z, 1)); scene.add(box(140, .17, .12, mat({ color: 0xd8d4cc }), 20, .085, z + (z > 0 ? -.8 : .8))); }
  ground(140, 8, mat({ map: tex(grassT, 70, 4) }), 20, -.01, 7.6);
  // buildings behind, trees + lamps on the far sidewalk
  const r = rng(5); for (let x = -45; x < 95;) { const w = 5 + r() * 3, h = 6 + r() * 7, b = uvBox(w, h, 5, mat({ map: FACS[(r() * 5) | 0] }), x + w / 2, h / 2, -9.2, .25); scene.add(b); scene.add(box(w + .1, .3, 5.1, mat({ color: 0x5a5250 }), x + w / 2, h + .15, -9.2)); x += w + .2; }
  for (let x = -40; x < 90; x += 9) { const tr = new THREE.Group(); tr.position.set(x, 0, -5.4); const tk = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, 1.8, 5), mat({ color: 0x6a4a2a })); tk.position.y = .9; tr.add(tk); for (let k = 0; k < 3; k++) { const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(.9 - k * .15, 0), mat({ color: [0x3f9a3c, 0x4aa844, 0x358a34][k] })); lf.position.set((k - 1) * .35, 2.3 + k * .35, 0); tr.add(lf); } scene.add(tr); }
  for (let x = -36; x < 90; x += 14) { const lp = new THREE.Group(); lp.position.set(x, 0, -4.9); lp.add(box(.08, 3.6, .08, mat({ color: 0x2e3338 }), 0, 1.8, 0)); lp.add(box(.5, .08, .08, mat({ color: 0x2e3338 }), 0, 3.56, .2)); scene.add(lp); }
  // a parked car for scale
  const car = new THREE.Group(); car.position.set(26, 0, -3.6); scene.add(car); car.add(box(3.6, .7, 1.6, mat({ color: 0xd83a3a }), 0, .55, 0)); car.add(box(2.0, .6, 1.4, mat({ color: 0xc83232 }), -.2, 1.15, 0)); car.add(box(1.9, .45, 1.42, mat({ color: 0x9ac8e8 }), -.2, 1.15, 0)); for (const [x, z] of [[-1.2, .8], [1.2, .8], [-1.2, -.8], [1.2, -.8]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .2, 10), mat({ color: 0x111111 })); w.rotation.x = Math.PI / 2; w.position.set(x, .3, z); car.add(w); }
  // the crack (at X0) and the rock (at XR)
  const crk = new THREE.Shape(); crk.moveTo(0, -.7); [[.05, -.45], [-.04, -.2], [.06, 0], [-.03, .25], [.05, .5], [0, .72], [.08, .5], [.02, .25], [.12, 0], [.03, -.2], [.12, -.45], [.06, -.72]].forEach(([x, y]) => crk.lineTo(x, y)); crk.closePath();
  const cm = new THREE.Mesh(new THREE.ShapeGeometry(crk), bmat({ color: 0x0c0c0e })); cm.rotation.x = -Math.PI / 2; cm.position.set(X0 + .02, .012, LANE_Z); scene.add(cm);
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(.075, 0), mat({ color: 0x8a8680 })); rock.scale.set(1.2, .8, 1); rock.position.set(XR, .055, LANE_Z + .02); scene.add(rock);
  for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.02, 0), mat({ color: 0x7a7670 })); p.position.set(XR + .15 + i * .07, .015, LANE_Z - .1 + (i % 3) * .08); scene.add(p); }
  const sc = makeScooter(); scene.add(sc); sc.position.set(0, 0, LANE_Z); S.sc = sc;
  S.R = rig(scene); S.focus(0);
  return S;
}
// riding along at speed: x = x0 + v*f
function ride(S, x, t, v = 30, lean = .12) { const sc = S.sc; sc.position.set(x, 0, LANE_Z); sc.rotation.set(0, 0, 0); sc.userData.piv.rotation.z = 0; sc.userData.spin(x / .1); sc.userData.speed(v, t); mountPose(S.R, sc, t, lean); S.R.F.position.y += Math.sin(t * 22) * .006; S.focus(x); }

// ---------- studio, x-ray, hospital ----------
function studio(bg = 0x1a2a4a) { const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = new THREE.Color(bg); scene.add(new THREE.AmbientLight(0xffffff, 1.6)); const k = new THREE.DirectionalLight(0xffffff, 2.2); k.position.set(3, 5, 4); scene.add(k); const rim = new THREE.PointLight(0x6aa8ff, 10, 10); rim.position.set(-3, 2, -2); scene.add(rim); return { scene, cam, key: k }; }
const BONE = 0xe8f2ff;
function makeBrain(s = 1) { const g = new THREE.Group(), m = bmat({ color: 0xff8ab0, fog: false }), r = rng(11); for (let i = 0; i < 22; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.32 + r() * .1, 0), m); const a = r() * Math.PI * 2, e = r() * 1.1 - .3; b.position.set(Math.cos(a) * .55 * Math.cos(e), .25 + Math.sin(e) * .35, Math.sin(a) * .45 * Math.cos(e)); g.add(b); } g.add(box(.02, .5, 1.1, bmat({ color: 0xc85a80 }), 0, .55, 0)); g.scale.setScalar(s); return g; }
function ghost(h, col = 0x8ac8ff, op = .22) { h.root.traverse(o => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { m.transparent = true; m.opacity = op; m.depthWrite = false; m.color && m.color.set(col); }); } }); }
function hospital() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = new THREE.Color(0xdfe8ea);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa8aa, 1.7)); const k = new THREE.DirectionalLight(0xffffff, 1.6); k.position.set(2, 6, 5); k.castShadow = true; Object.assign(k.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); k.shadow.mapSize.set(1024, 1024); scene.add(k);
  scene.add(uvBox(20, .1, 10, mat({ map: tileT }), 0, -.05, 0, .8)); scene.add(uvBox(20, 4, .2, mat({ color: 0xcfe0e4 }), 0, 2, -3.2, 1)); scene.add(box(20, .25, .05, mat({ color: 0x4aa8b8 }), 0, 1.1, -3.08));
  const pats = [];
  for (let i = 0; i < 3; i++) {
    const x = -3.2 + i * 3.2, bed = new THREE.Group(); bed.position.set(x, 0, -1.4); scene.add(bed);
    bed.add(box(1.0, .5, 2.1, mat({ color: 0xe8e8e8 }), 0, .45, 0)); bed.add(box(1.02, .12, 2.12, mat({ color: 0x8ab8d8 }), 0, .74, .1)); bed.add(box(1.0, .8, .08, mat({ color: 0xb8c4c8 }), 0, .75, -1.05)); bed.add(box(.5, .12, .35, mat({ color: 0xffffff }), 0, .83, -.8));
    const h = makeHuman(PEOPLE[(i + 1) % 4]); bandage(h); h.root.rotation.x = -Math.PI / 2; h.root.position.set(x, .98, -.42); scene.add(h.root); pats.push(h);
    const sc = makeScooter([0x2fbf71, 0x3a8ad8, 0xe8642a][i]); sc.position.set(x + .85, 0, -.2); sc.rotation.set(0, Math.PI / 2, .08); scene.add(sc);
    const mon = new THREE.Group(); mon.position.set(x - .75, 0, -2.6); scene.add(mon); mon.add(box(.06, 1.5, .06, mat({ color: 0x8a9094 }), 0, .75, 0)); mon.add(box(.45, .35, .1, mat({ color: 0x2a2c30 }), 0, 1.55, 0)); mon.add(box(.38, .26, .01, bmat({ color: 0x0c2a14 }), 0, 1.55, .056));
  }
  return { scene, cam, pats };
}

// ================= SHOTS =================
// 1 "If you ride an electric scooter" - cruising down a sunny street, camera tracking alongside
shot(0, 4.92, t0 => { const S = street();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const x = -14 + f * 5; ride(S, x, t, 18 + f * 2); S.R.face('happy', t); S.R.neck.rotation.y = .25 * Math.sin(f * .8);
    const k = ss(0, fd, f); look(S.cam, x + lerp(3.2, 1.2, k), lerp(1.0, 1.5, k), LANE_Z + lerp(3.4, 2.6, k), x + .2, 1.1, LANE_Z); handheld(S.cam, t, .003);
  } }; }, { b: 1.6, x: .5, y: .45, r: .4 });
// 2 "and you go too fast," - the handlebar display climbs into the red; the street streaks past
shot(4.92, 6.33, t0 => { const S = street(), sl = speedLines(S.scene);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const v = lerp(20, 45, ss(.05, fd - .1, f)), x = 6 + f * 8; ride(S, x, t, v, .22); S.R.face('grin', t);
    speedLinesAt(sl, t, x, LANE_Z, ss(.3, 1, f)); const d = wp(S.sc.userData.body, .56, 1.2, 0); look(S.cam, d.x - .32, d.y + .3, d.z + .1, d.x + .04, d.y, d.z); shake(S.cam, t, .004 * v / 45);
  } }; }, { b: 1.4, x: .5, y: .5, r: .3 });
// 3 "you could fall and hurt yourself." - a wobble, a tip-over onto the grass verge, a scraped knee and a plaster
shot(6.33, 8.8, t0 => { const S = street(), SW = .85, pl = box(.12, .1, .02, mat({ color: 0xe8b890 })); S.R.shins[0].add(pl); pl.position.set(0, -.05, .14);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const sc = S.sc, h = S.R;
    if (f < SW) { const x = 30 + f * 3; ride(S, x, t, 22, .1); const wob = Math.sin(f * 18) * .12 * f, tip = ss(.45, SW, f); sc.rotation.x = wob + tip * 1.1; h.F.rotation.x = wob + tip * 1.25; h.F.position.z += tip * .5; h.face(tip > .2 ? 'scream' : 'worried', t); pl.visible = false;
      look(S.cam, x + 2.4, 1.2, LANE_Z + 3.2, x, .8, LANE_Z + .3); handheld(S.cam, t, .005); }
    else { const a = f - SW; sc.position.set(31.6, 0, LANE_Z + .6); sc.rotation.set(1.45, .3, 0); h.reset(); h.F.rotation.set(0, 0, 0); h.F.position.set(31.6, .62, LANE_Z + 1.4); h.F.children[0].rotation.y = -.3; h.sit(); h.body.position.y = -.38; h.legs[0].rotation.x = -1.2; h.shins[0].rotation.x = .8; h.torso.rotation.x = .25;
      ik(h, 1, wp(h.shins[0], 0, -.05, .2)); h.face(a < .5 ? 'pain' : 'sad', t); pl.visible = a > .55; pl.scale.setScalar(pop(a - .55));
      const kn = wp(h.shins[0], 0, 0, 0); look(S.cam, kn.x + .9, 1.25, kn.z + 2.8, kn.x - .2, .6, kn.z - .4); handheld(S.cam, t, .004); }
  } }; }, { b: 1.6, x: .5, y: .5, r: .36 });
// 4 "But it's way worse than that." - time slows to a crawl, the colour drains, a red pulse
shot(8.8, 10.95, t0 => { const S = street(), red = flashQuad(S.cam, 0xc81010), sl = speedLines(S.scene);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const slow = 1 - .9 * ss(.1, .7, f), x = 12 + f * 2.5 * slow; ride(S, x, t * slow, 38, .2); S.R.face('neutral', t);
    speedLinesAt(sl, t * slow, x, LANE_Z, 1); red.material.opacity = .1 + .1 * Math.max(0, Math.sin(f * 7));
    const k = ss(0, fd, f), fc = faceAt(S.R); look(S.cam, fc.x + lerp(2.6, 1.0, k), fc.y - .1, fc.z + lerp(1.8, .6, k), fc.x, fc.y - .25, fc.z); handheld(S.cam, t, .003);
  } }; }, { b: 1.6, x: .5, y: .42, r: .34 });
// 5 "Scooter wheels are tiny." - a scooter wheel next to a bike wheel
shot(10.95, 12.7, t0 => { const S = studio(0x2a3a5a), sc = makeScooter(); S.scene.add(sc); sc.position.set(-.3, 0, 0);
  const bw = new THREE.Group(); S.scene.add(bw); bw.position.set(.75, .36, -.3); const rim = new THREE.Mesh(new THREE.TorusGeometry(.34, .025, 4, 24), mat({ color: 0x1a1a1a })); bw.add(rim); for (let i = 0; i < 8; i++) { const sp = box(.008, .66, .008, mat({ color: 0xaaaaaa })); sp.rotation.z = i * Math.PI / 8; bw.add(sp); }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 24), mat({ color: 0x3a4a6a })); floor.rotation.x = -Math.PI / 2; S.scene.add(floor);
  const la = label('8.5 IN', '#ffe21f', '#16120a', .36, .15), lb = label('26 IN', '#ffffff', '#16120a', .36, .15); S.scene.add(la, lb);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    sc.userData.spin(t * 4); bw.rotation.z = -t * 1.3; bw.scale.setScalar(pop(f - .5)); la.position.set(.25, .38, .1); la.scale.setScalar(pop(f - .2)); lb.position.set(.75, .88, -.2); lb.scale.setScalar(pop(f - .65));
    look(S.cam, .35 + Math.sin(f * .6) * .3, .5, 2.7 - f * .2, .35, .4, 0); la.lookAt(S.cam.position); lb.lookAt(S.cam.position);
  } }; }, { b: 1.2, x: .5, y: .5, r: .45 });
// 6 "So when the front wheel hits a small crack," - ground level, slow motion, the wheel rolls toward the crack
shot(12.7, 14.95, t0 => { const S = street();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    crash(S, lerp(-1.1, -.2, f / fd), t); S.focus(X0); look(S.cam, X0 + .55, .13, LANE_Z + .22, X0 - 2, .25, LANE_Z); handheld(S.cam, t, .002);
  } }; }, { b: 1.8, x: .5, y: .55, r: .3 });
// 7 "or a rock," - another street, a rock in the lane
shot(14.95, 16.6, t0 => { const S = street();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const sc = S.sc, x = XR - .55 - .9 + f * .5; sc.position.set(x, 0, LANE_Z); sc.userData.spin(x / .1); mountPose(S.R, sc, t); S.focus(XR);
    look(S.cam, XR + .5, .13, LANE_Z - .22, XR - 1.6, .25, LANE_Z); handheld(S.cam, t, .002);
  } }; }, { b: 1.8, x: .5, y: .55, r: .3 });
// 8 "it stops almost instantly." - the front wheel jams in the crack; the back kicks up; impact flash
shot(16.6, 19.4, t0 => { const S = street(), I = at(t0, 16.85), fl = flashQuad(S.cam, 0xffffff), ds = dust(S.scene);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const c = f < I ? (f - I) * .35 : (f - I) * .028; crash(S, c, t); S.focus(X0); fl.material.opacity = f > I ? .7 * Math.exp(-(f - I) * 10) : 0; dustAt(ds, V(X0, 0, LANE_Z), clamp((f - I) * 1.2, -1, 1));
    look(S.cam, X0 + 2.0, .7, LANE_Z + 2.8, X0 - .4, .6, LANE_Z); if (f > I) shake(S.cam, t, .02 * Math.exp(-(f - I) * 5)); handheld(S.cam, t, .002);
  } }; }, { b: 1.6, x: .5, y: .55, r: .36 });
// 9 "But your body doesn't." - side view: the scooter has stopped, he hasn't (red momentum arrow)
shot(19.4, 21.2, t0 => { const S = street(), ar = arrow(); S.scene.add(ar);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const c = .045 + f * .03; crash(S, c, t); S.focus(X0); const hp = hipAt(c); ar.position.set(hp.x - .2, hp.y + .78, LANE_Z + .3); ar.scale.setScalar(pop(f - .25) * .8);
    look(S.cam, hp.x + .3, 1.2, LANE_Z + 3.8, hp.x + .3, 1.1, LANE_Z); handheld(S.cam, t, .003);
  } }; }, { b: 1.4, x: .5, y: .45, r: .42 });
// 10 "You keep flying forward at the same speed," - tracking him in slow-mo; the speed tag still reads 40
shot(21.2, 24.2, t0 => { const S = street(), sl = speedLines(S.scene), tag = label('40 KM/H', '#ff4a3a', '#ffffff', 1.0, .42); S.scene.add(tag);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const c = .1 + f * .03; crash(S, c, t); S.focus(X0); const hp = hipAt(c); speedLinesAt(sl, t * .4, hp.x, LANE_Z, 1); tag.position.set(hp.x + .2, hp.y + 1.25, LANE_Z); tag.scale.setScalar(pop(f - at(t0, 23.3)) * .9); tag.lookAt(S.cam.position);
    look(S.cam, hp.x + 1.6, 1.3, LANE_Z + 2.5, hp.x + .2, hp.y + .1, LANE_Z); handheld(S.cam, t, .003);
  } }; }, { b: 1.4, x: .5, y: .45, r: .4 });
// 11 "and you get launched over the handlebars." - from the front, low: he comes over the bars at us, the camera orbits
shot(24.2, 26.8, t0 => { const S = street();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const c = .19 + (f / fd) * .15; crash(S, c, t); S.focus(X0); const hp = hipAt(c), an = lerp(.35, 1.35, ss(0, fd, f));
    look(S.cam, hp.x + Math.cos(an) * 3.3, .8, LANE_Z + Math.sin(an) * 3.3, hp.x + .2, hp.y + .3, LANE_Z); handheld(S.cam, t, .003);
  } }; }, { b: 1.4, x: .5, y: .45, r: .4 });
// 12 "Your brain tells your hands to catch you," - x-ray: the brain lights up, signals race down the arms, the arms reach out
shot(26.8, 29.4, t0 => { const S = street(), br = makeBrain(.32); S.R.head.add(br); br.position.set(0, .22, .02); ghost(S.R, 0x9ad8ff, .42); S.sc.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .25; o.material.color.set(0x8ac8ff); } });
  S.scene.background = new THREE.Color(0x07101e); S.scene.fog = new THREE.Fog(0x07101e, 3, 9); const dim = flashQuad(S.cam, 0x07101e); dim.material.opacity = 0; dim.position.z = -60; dim.scale.setScalar(40);
  const pulses = [...Array(8)].map((_, i) => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.035, 0), bmat({ color: 0xffe25a, fog: false })); p.userData = i; S.scene.add(p); return p; });
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const c = .34 + (f / fd) * .16; crash(S, c, t); S.focus(X0); const h = S.R; br.scale.setScalar(.32 * (1 + .08 * Math.sin(t * 20)));
    pulses.forEach(p => { const i = p.userData, arm = i % 2, q = ((f * 1.6) + i / 8) % 1; const pts = [wp(h.head, 0, .3, 0), wp(h.torso, 0, .7, 0), wp(h.arms[arm], 0, 0, 0), wp(h.fore[arm], 0, 0, 0), handAt(h, arm)]; const s = q * 4, k = Math.min(3, Math.floor(s)); p.position.copy(vl(pts[k], pts[k + 1], s - k)); p.visible = f > .2; });
    const hp = hipAt(c); look(S.cam, hp.x + .55, hp.y + .35, LANE_Z + 2.7, hp.x + .55, hp.y + .2, LANE_Z);
  } }; }, { b: 1.2, x: .5, y: .45, r: .45 });
// 13 "so you land on your wrists," - low and close: the hands hit the asphalt, dust kicks up
shot(29.4, 31.0, t0 => { const S = street(), L = at(t0, 29.95), ds = dust(S.scene), ds2 = dust(S.scene);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const c = f < L ? lerp(.52, HT, f / L) : HT + (f - L) * .02; crash(S, c, t); S.focus(X0); const hx = hipAt(HT).x + .78;
    dustAt(ds, V(hx, 0, LANE_Z + .26), clamp((f - L) * 1.5, -1, 1)); dustAt(ds2, V(hx, 0, LANE_Z - .26), clamp((f - L) * 1.5, -1, 1));
    look(S.cam, hx + 1.6, .6, LANE_Z + 2.2, hx - .3, .35, LANE_Z); if (f > L) shake(S.cam, t, .012 * Math.exp(-(f - L) * 6)); handheld(S.cam, t, .002);
  } }; }, { b: 1.6, x: .5, y: .5, r: .36 });
// 14 "and they can snap." - x-ray of the forearm on the ground: a crack runs through the bone
shot(31.0, 32.35, t0 => { const S = studio(0x06101c), SN = at(t0, 31.45), fl = flashQuad(S.cam, 0xffffff);
  const arm = new THREE.Group(); S.scene.add(arm); const bm = bmat({ color: BONE, fog: false }); arm.rotation.z = .35;
  const skin = new THREE.Mesh(new THREE.CylinderGeometry(.32, .26, 2.6, 10), new THREE.MeshBasicMaterial({ color: 0x5a9ad8, transparent: true, opacity: .18, depthWrite: false })); skin.rotation.z = Math.PI / 2; skin.position.x = -1.2; arm.add(skin);
  const radius = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 2.3, 8), bm); radius.rotation.z = Math.PI / 2; radius.position.set(-1.15, .09, .05); arm.add(radius);
  const ulna = new THREE.Mesh(new THREE.CylinderGeometry(.07, .06, 2.3, 8), bm); ulna.rotation.z = Math.PI / 2; ulna.position.set(-1.15, -.1, -.05); arm.add(ulna);
  const r = rng(3); for (let i = 0; i < 8; i++) arm.add(box(.11, .1, .1, bm, .12 + (i % 4) * .12 * 0 + (i >= 4 ? .14 : 0), -.15 + (i % 4) * .1, (r() - .5) * .1));
  for (let i = 0; i < 4; i++) { arm.add(box(.55, .06, .06, bm, .62, -.17 + i * .11, 0)); arm.add(box(.4, .05, .05, bm, 1.12, -.17 + i * .11, 0)); }
  const crack = new THREE.Group(); crack.position.set(-.3, .09, .14); arm.add(crack); [[0, .1, .6], [.02, -.02, -.5], [-.01, -.1, .7]].forEach(([x, y, rz]) => { const b = box(.012, .1, .02, bmat({ color: 0xff2020, fog: false })); b.position.set(x, y, 0); b.rotation.z = rz; crack.add(b); });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), glowMat(0xff2020, .8, true)); glow.position.set(-.3, .09, .2); arm.add(glow);
  const gnd = box(6, .05, 3, new THREE.MeshBasicMaterial({ color: 0x0e1a2a }), 0, -.45, 0); S.scene.add(gnd);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const sn = f > SN; crack.visible = sn; crack.scale.setScalar(pop(f - SN)); glow.visible = sn; glow.material.opacity = sn ? .4 + .4 * Math.exp(-(f - SN) * 4) : 0; radius.position.y = .09 - (sn ? .015 : 0);
    fl.material.opacity = sn ? .6 * Math.exp(-(f - SN) * 12) : 0; look(S.cam, -.1, .55, 3.4 - f * .3, -.1, .05, 0); if (sn) shake(S.cam, t, .02 * Math.exp(-(f - SN) * 6));
  } }; }, null);
// 15 "But your head is still moving forward." - the arms buckle; his head keeps going (red arrow)
shot(32.35, 34.7, t0 => { const S = street(), ar = arrow(0xe8202a, .7); S.scene.add(ar);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const c = lerp(.6, .685, f / fd); crash(S, c, t); S.focus(X0); const fc = faceAt(S.R); ar.position.set(fc.x + .2, fc.y + .25, LANE_Z + .35); ar.rotation.z = -.6; ar.scale.setScalar(pop(f - .3) * .7);
    look(S.cam, fc.x + .1, .8, LANE_Z + 3.0, fc.x - .1, .5, LANE_Z); handheld(S.cam, t, .003);
  } }; }, { b: 1.4, x: .5, y: .55, r: .4 });
// 16 "So it slams into the ground next." - impact: white flash, the camera jolts, stars
shot(34.7, 37.0, t0 => { const S = street(), I = at(t0, 35.1), fl = flashQuad(S.cam, 0xffffff), st = starsRing(S.scene), ds = dust(S.scene, 12);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const c = f < I ? lerp(.685, HC, f / I) : HC + (f - I) * .12; crash(S, c, t); S.focus(X0); const fc = faceAt(S.R), on = f > I;
    fl.material.opacity = on ? .85 * Math.exp(-(f - I) * 7) : 0; dustAt(ds, V(fc.x, 0, LANE_Z), clamp((f - I) * 1.1, -1, 1));
    st.forEach((s, i) => { const an = t * 4 + i * 1.257; s.visible = f > I + .35; s.position.set(fc.x + Math.cos(an) * .3, fc.y + .35 + Math.sin(an * 2) * .03, fc.z + Math.sin(an) * .3); s.rotation.y = t * 6; });
    look(S.cam, fc.x + 1.3, .6, LANE_Z + 1.9, fc.x - .2, .3, LANE_Z); if (on) shake(S.cam, t, .03 * Math.exp(-(f - I) * 4)); handheld(S.cam, t, .003);
  } }; }, { b: 1.6, x: .5, y: .55, r: .36 });
// 17 "That's why head injuries" - x-ray skull: the brain lurches forward and hits the inside of the skull
shot(37.0, 39.35, t0 => { const S = studio(0x06101c);
  const sk = new THREE.Group(); S.scene.add(sk); sk.position.y = 1; const skm = new THREE.MeshBasicMaterial({ color: BONE, transparent: true, opacity: .45, depthWrite: false });
  const cr = new THREE.Mesh(new THREE.SphereGeometry(.75, 14, 10), skm); cr.scale.set(1.15, 1, .95); sk.add(cr); const jaw = box(.7, .3, .6, skm, .35, -.75, 0); sk.add(jaw); const face = box(.4, .7, .7, skm, .7, -.3, 0); sk.add(face);
  for (const z of [-.2, .2]) { const so = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), bmat({ color: 0x0a1424 })); so.position.set(.82, -.05, z); sk.add(so); }
  const br = makeBrain(1); br.position.set(0, -.25, 0); br.scale.set(.72, .66, .66); sk.add(br); const hit = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat(0xff2020, .9, true)); hit.position.set(.75, .15, .5); sk.add(hit);
  const tag = label('HEAD INJURIES', '#ff3a3a', '#ffffff', 1.6, .55); hudOn(S.cam, tag, 1.15);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const q = (f * 1.1) % 1.4, lurch = q < .25 ? ss(0, .25, q) : 1 - ss(.25, .7, q); br.position.x = .12 * lurch; hit.material.opacity = .9 * Math.max(0, lurch - .5) * 2; hit.scale.setScalar(.6 + lurch * .5);
    sk.rotation.y = -.5 + Math.sin(f * .7) * .15; tag.scale.setScalar(pop(f - .25) * .85); look(S.cam, 0, 1.0, 4.4 - f * .25, 0, .8, 0);
  } }; }, null);
// 18 "are one of the most common scooter injuries," - an ER ward: bandaged heads, a scooter by every bed
shot(39.35, 41.8, t0 => { const S = hospital();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.pats.forEach((h, i) => { h.reset(); h.face(i === 1 ? 'dizzy' : 'sad', t + i); h.neck.rotation.y = Math.sin(t * .8 + i) * .1; });
    const k = ss(0, fd, f); look(S.cam, lerp(-4.2, 3.5, k), 2.2, 2.8, lerp(-3.2, 3.2, k) * .9, .8, -1.6); handheld(S.cam, t, .003);
  } }; }, { b: 1.4, x: .5, y: .45, r: .45 });
// 19 "and most of the people who got hurt weren't wearing a helmet." - a line of riders, no helmets... then one drops onto him
shot(41.8, 99, t0 => { const S = street(), HM = at(t0, 44.55), row = [], hel = makeHelmet(); S.scene.add(hel); const sp = [...Array(8)].map(() => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.05), bmat({ color: 0xfff07a, fog: false })); S.scene.add(s); return s; });
  S.sc.visible = false; S.R.F.visible = false;
  for (let i = 0; i < 4; i++) { const h = makeHuman(PEOPLE[i]); if (i) bandage(h); h.root.position.set(40 + i * 1.4, 0, 3.2); h.root.rotation.y = .15; S.scene.add(h.root); const sc = makeScooter([0x2fbf71, 0x3a8ad8, 0xe8642a, 0xd83a5a][i]); sc.position.set(40 + i * 1.4 + .5, .16, 2.5); sc.rotation.y = Math.PI / 2 + .2; S.scene.add(sc); row.push(h); }
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.focus(42); row.forEach((h, i) => { h.reset(); h.breathe(t + i); ik(h, 1, wp(h.root, .35, 1.0, .35)); h.face(i ? (i === 2 ? 'dizzy' : 'sad') : (f > HM + .15 ? 'happy' : 'worried'), t + i * .7); });
    const me = row[0], hd = wp(me.head, 0, .4, 0), drop = clamp((f - (HM - .35)) / .35); hel.position.set(hd.x, hd.y + (1 - drop * drop) * 2.2, hd.z); hel.rotation.set(0, .15, (1 - drop) * .6); hel.visible = f > HM - .35; if (drop >= 1) { hel.scale.setScalar(1 + .15 * Math.exp(-(f - HM) * 8) * Math.cos((f - HM) * 25)); }
    sp.forEach((s, i) => { const an = i * .785 + t * 2, k = clamp((f - HM) * 1.5); s.visible = f > HM && k < 1; s.position.set(hd.x + Math.cos(an) * (.3 + k * .4), hd.y + Math.sin(an) * (.3 + k * .4), hd.z + .2); });
    const k = ss(0, HM - .2, f), m2 = ss(HM - .2, HM + .3, f), cx = lerp(lerp(46, 42.6, k), 40.1, m2); look(S.cam, cx, lerp(1.7, 1.75, m2), lerp(9, 6.2, m2), lerp(lerp(44.2, 42.1, k), 40, m2), lerp(1.2, 1.7, m2), 3.2); handheld(S.cam, t, .003);
  } }; }, { b: 1.4, x: .5, y: .42, r: .42 });
shots.forEach(S => { if (!S.cam.parent) S.scene.add(S.cam); });
// ---------- captions ----------
let chunks = [];
function buildCaptions(words) {
  let cur = [];
  const flush = () => { if (cur.length) { chunks.push({ s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map(w => w.w.replace(/[.,?!]+$/, '')).join(' ') }); cur = []; } };
  for (const w of words) { const len = cur.reduce((a, c) => a + c.w.length + 1, 0); if (cur.length >= 3 || len + w.w.length > 16) flush(); cur.push(w); if (/[.,?!]$/.test(w.w)) flush(); }
  flush(); chunks.forEach((c, i) => { const n = chunks[i + 1]; c.s -= .05; c.e = n ? n.s - .05 : c.e + .5; });
}
function drawCaption(t) {
  const c = chunks.find(c => t >= c.s && t < c.e); if (!c) return;
  const k = 1 + .05 * Math.exp(-(t - c.s) * 20), x = out.width / 2, y = out.height * .765;
  og.save(); og.translate(x, y); og.scale(k, k); og.font = '800 54px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle';
  og.shadowColor = 'rgba(0,0,0,.85)'; og.shadowBlur = 16; og.shadowOffsetY = 3; og.fillStyle = '#ffffff'; og.fillText(c.text, 0, 0); og.shadowBlur = 4; og.fillText(c.text, 0, 0); og.restore();
}
// ---------- frame: fake depth of field, quick blur on cuts, ordered dither, grain, vignette ----------
const dofA = document.createElement('canvas'); dofA.width = W; dofA.height = H; const dg = dofA.getContext('2d');
function dofDraw(o) {
  if (!o) { lg.drawImage(renderer.domElement, 0, 0); return; }
  const { b = 1.6, x = .5, y = .45, r = .32 } = o;
  lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H); lg.filter = `blur(${b}px)`; lg.drawImage(renderer.domElement, -3, -3, W + 6, H + 6); lg.filter = 'none';
  dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, W, H); dg.drawImage(renderer.domElement, 0, 0);
  dg.globalCompositeOperation = 'destination-in'; const gr = dg.createRadialGradient(x * W, y * H, r * W * .5, x * W, y * H, r * W * 1.3); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, W, H);
  lg.drawImage(dofA, 0, 0);
}
function blurPass(b) { lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H); lg.filter = `blur(${b}px)`; lg.drawImage(renderer.domElement, -4, -4, W + 8, H + 8); lg.filter = 'none'; }
const CUTS_F = shots.slice(1).map(s => s.f0);
const grain = [0, 1, 2].map(i => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), id = g.createImageData(W, H), r = rng(90 + i); for (let k = 0; k < id.data.length; k += 4) { const v = r() * 255 | 0; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; } g.putImageData(id, 0, 0); return c; });
const vig = document.createElement('canvas'); vig.width = W; vig.height = H; { const g = vig.getContext('2d'), gr = g.createRadialGradient(W / 2, H * .46, W * .35, W / 2, H * .46, H * .62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
let frameNo = 0;
function renderAt(tc) {
  const s = shots.find(s => tc >= s.f0 && tc < s.f1) || shots[shots.length - 1], f = tc - s.f0, fd = s.f1 - s.f0;
  s.update(f, fd, tc); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam);
  const w = Math.max(0, ...CUTS_F.map(c => 1 - Math.abs(tc - c) / .07));
  if (w > .05) blurPass(3.5 * w); else dofDraw(s.dof);
  lg.globalCompositeOperation = 'overlay'; lg.globalAlpha = .07; lg.drawImage(grain[frameNo++ % 3], 0, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over'; lg.drawImage(vig, 0, 0);
  const id = lg.getImageData(0, 0, W, H), d = id.data;
  for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) { const b = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - .5) * 6; d[i] = clamp(d[i] + b, 0, 255) & 0xFC; d[i + 1] = clamp(d[i + 1] + b, 0, 255) & 0xFC; d[i + 2] = clamp(d[i + 2] + b, 0, 255) & 0xFC; }
  lg.putImageData(id, 0, 0); og.imageSmoothingEnabled = false; og.drawImage(lo, 0, 0, out.width, out.height); drawCaption(tc);
}
window.renderTime = tc => { renderAt(tc); return out.toDataURL('image/jpeg', .93); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(TOTAL * FPS);
const words = (await (await fetch('/build/words.json')).json()).map(w => ({ ...w, s: tm(w.s), e: tm(w.e) })); buildCaptions(words);
await document.fonts.load('800 54px Nunito');
window.captionChunks = chunks; window.shotTimes = shots.map(s => [+s.f0.toFixed(2), +s.f1.toFixed(2)]); window.ready = true;
