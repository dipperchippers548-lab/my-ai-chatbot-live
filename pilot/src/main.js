// "The Package" - low-poly night story short (Zack-style), rendered frame by frame.
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
// ================= "LOADED IN" - EPISODE 1 cold open =================
// real world (smooth, soft) -> glitch -> cube tunnel -> falls out of the sky, turning low-poly -> his lines (shape-aware lip sync) -> the cow -> his hands -> echo -> title
const IMP = 14.4, VO = IMP - .5;                       // impact; the voice clip starts so its first grunt lands on the impact
const ECHO = [30.15, 31.25, 32.35, 33.45], TITLE = 35.4, DUR = 40.6;
const ME = { skin: 0xe2a57f, hair: 0x4a2a16, top: 0x3fae5a, pants: 0x2a3a5a, iris: '#4a6a3a', hairH: .15, shoes: 0xf2f2f2, seed: .9 };
const mouth = await (await fetch('/build/mouth.json')).json();
const shapeAt = t => { const i = Math.round((t - VO) * mouth.rate); return i >= 0 && i < mouth.shape.length ? mouth.shape[i] : 'c'; };
EXPR.angry = { open: .85, browIn: -3, browOut: 2.2, mouth: 'frown' };
const SHAPES = ['c', 'o', 'open', 'grin', 'scream'];
for (const e of ['pain', 'confused', 'terror', 'shocked', 'angry', 'stare', 'worried']) for (const m of SHAPES) { const k = e + '_' + m; EXPR[k] = { ...EXPR[e], ...(m === 'c' ? {} : { mouth: m }) }; EXPR[k + '_b'] = { ...EXPR[k], open: .07, black: false }; }
const talk = (h, emo, t, amt = 1) => { const s = shapeAt(t); h.face(emo + '_' + s, t); if (s !== 'c') { h.head.rotation.x += Math.sin(t * 16) * .035 * amt; h.head.rotation.z += Math.sin(t * 11) * .02 * amt; } return s; };
const say = (a, b, t) => t >= VO + a && t < VO + b;

// ---------- the REAL world: smooth shading, rounder person ----------
const smooth = o => new THREE.MeshStandardMaterial({ roughness: .75, metalness: 0, ...o });
const cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m);
function makeReal(p, standing = false) {
  const root = new THREE.Group(), sk = smooth({ color: p.skin }), hood = smooth({ color: p.top }), jean = smooth({ color: p.pants }), hairM = smooth({ color: p.hair, roughness: .9 });
  const torso = new THREE.Group(); torso.position.y = .05; root.add(torso);
  const ch = cap(.2, .36, hood); ch.position.y = .3; ch.scale.z = .75; torso.add(ch);
  const head = new THREE.Group(); head.position.y = .78; torso.add(head);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 16), sk); hd.scale.set(.95, 1.12, 1.02); head.add(hd);
  const hr = new THREE.Mesh(new THREE.SphereGeometry(.137, 20, 12, 0, Math.PI * 2, 0, Math.PI * .55), hairM); hr.rotation.x = -.25; hr.position.y = .02; head.add(hr);
  const ns = cap(.055, .08, sk); ns.position.y = .68; torso.add(ns);
  const vr = new THREE.Group(); vr.position.set(0, .02, .1); head.add(vr);
  const vis = new THREE.Mesh(new THREE.BoxGeometry(.25, .13, .11, 2, 2, 2), smooth({ color: 0xf2f2f4, roughness: .35 })); vis.position.z = .05; vr.add(vis);
  const fc = new THREE.Mesh(new THREE.PlaneGeometry(.2, .08), new THREE.MeshBasicMaterial({ color: 0x1a1a22 })); fc.position.z = .106; vr.add(fc);
  const leds = [-.06, 0, .06].map(x => { const l = new THREE.Mesh(new THREE.CircleGeometry(.01, 8), new THREE.MeshBasicMaterial({ color: 0x4ad8ff })); l.position.set(x, -.03, .107); vr.add(l); return l; });
  const strap = new THREE.Mesh(new THREE.TorusGeometry(.15, .018, 6, 24), smooth({ color: 0x2a2a30 })); strap.scale.set(1, .5, 1.1); strap.rotation.x = Math.PI / 2; strap.position.set(0, 0, -.06); vr.add(strap);
  const arms = [], fore = [], legs = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * .24, .55, 0); torso.add(a); arms.push(a); const ua = cap(.065, .2, hood); ua.position.y = -.14; a.add(ua);
    const f = new THREE.Group(); f.position.y = -.3; a.add(f); fore.push(f); const fa = cap(.055, .2, hood); fa.position.y = -.13; f.add(fa);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 10), sk); hand.position.y = -.3; f.add(hand);
    const c = new THREE.Group(); c.position.set(0, -.32, .03); f.add(c); const grip = cap(.03, .1, smooth({ color: 0x1c1c22 })); grip.rotation.x = .5; c.add(grip); const ring = new THREE.Mesh(new THREE.TorusGeometry(.06, .012, 6, 18), smooth({ color: 0x2a2a30 })); ring.position.set(0, .07, .05); ring.rotation.x = 1.2; c.add(ring);
    const leg = new THREE.Group(); leg.position.set(s * .11, .02, 0); root.add(leg); legs.push(leg);
    if (standing) { const th = cap(.09, .32, jean); th.position.y = -.24; leg.add(th); const sh = cap(.075, .32, jean); sh.position.y = -.68; leg.add(sh); const shoe = new THREE.Mesh(new THREE.BoxGeometry(.11, .07, .24), smooth({ color: 0xf2f2f2 })); shoe.position.set(0, -.9, .05); leg.add(shoe); }
    else { const th = cap(.09, .3, jean); th.rotation.x = Math.PI / 2; th.position.set(0, 0, .2); leg.add(th); const sh = cap(.075, .32, jean); sh.position.set(0, -.24, .4); leg.add(sh); const shoe = new THREE.Mesh(new THREE.BoxGeometry(.11, .07, .24), smooth({ color: 0xf2f2f2 })); shoe.position.set(0, -.44, .46); leg.add(shoe); }
  }
  return { root, torso, head, arms, fore, legs, leds, vr };
}
function realRoom() {
  const scene = new THREE.Scene(), cam = newCam(42); scene.add(cam); scene.background = new THREE.Color(0x07070c);
  scene.add(new THREE.AmbientLight(0x4a4a6a, 1.6)); const key = new THREE.SpotLight(0x9ab8ff, 22, 7, .6, .7); key.position.set(1.4, 2.4, 2.0); key.target.position.set(0, 1.1, .2); scene.add(key, key.target);
  const mon = new THREE.PointLight(0x7ab0ff, 8, 6); mon.position.set(0, 1.25, 1.6); scene.add(mon);
  const rgb = new THREE.PointLight(0xb04aff, 10, 7); rgb.position.set(-1.4, 1.9, 2.4); scene.add(rgb);
  const back = new THREE.SpotLight(0xffc89a, 12, 8, .5, .8); back.position.set(1.8, 2.8, -1.8); back.target.position.set(0, .9, 0); back.castShadow = true; scene.add(back, back.target);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), smooth({ color: 0x2a2228 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), smooth({ color: 0x3a2a4a })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, .005, .3); scene.add(rug);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), smooth({ color: 0x1c1c26 })); wall.position.set(0, 2, 2.8); wall.rotation.y = Math.PI; scene.add(wall);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), smooth({ color: 0x18181f })); side.position.set(-2.2, 2, 0); side.rotation.y = Math.PI / 2; scene.add(side);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(3.4, .03, .02), new THREE.MeshBasicMaterial({ color: 0xc05aff })); strip.position.set(0, 2.2, 2.77); scene.add(strip);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.0), new THREE.MeshBasicMaterial({ color: 0x3a1a4a })); poster.position.set(1.5, 1.6, 2.78); poster.rotation.y = Math.PI; scene.add(poster);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(.3, .03, .9), smooth({ color: 0x2a2026 })); shelf.position.set(-2.05, 1.6, 1.2); scene.add(shelf); for (let i = 0; i < 4; i++) { const fig = new THREE.Mesh(new THREE.CapsuleGeometry(.04, .08, 4, 8), smooth({ color: [0xff4a8a, 0x4affd8, 0xffd84a, 0x7a5aff][i] })); fig.position.set(-2.05, 1.68, .9 + i * .2); scene.add(fig); }
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, .05, .7), smooth({ color: 0x18181c })); desk.position.set(0, .75, 2.1); scene.add(desk);
  for (const x of [-.85, .85]) { const lg = new THREE.Mesh(new THREE.BoxGeometry(.05, .75, .6), smooth({ color: 0x111114 })); lg.position.set(x, .37, 2.1); scene.add(lg); }
  const D = dynTex(96, 54), scr = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .56), new THREE.MeshBasicMaterial({ map: D.t })); scr.position.set(0, 1.18, 2.38); scr.rotation.y = Math.PI; scene.add(scr);
  const bez = new THREE.Mesh(new THREE.BoxGeometry(1.06, .62, .04), smooth({ color: 0x0c0c0e })); bez.position.set(0, 1.18, 2.41); scene.add(bez);
  const can = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .12, 14), smooth({ color: 0x3ad86a, metalness: .5, roughness: .3 })); can.position.set(.6, .84, 1.95); scene.add(can);
  const chair = new THREE.Group(); scene.add(chair); const blk = smooth({ color: 0x141418 }), red = smooth({ color: 0xc8202a });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.6, .12, .55), blk); seat.position.y = .5; chair.add(seat); const bk = new THREE.Mesh(new THREE.BoxGeometry(.58, .95, .12), blk); bk.position.set(0, 1.0, -.3); bk.rotation.x = -.12; chair.add(bk);
  for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(.06, .9, .125), red); st.position.set(s * .2, 1.0, -.295); st.rotation.x = -.12; chair.add(st); }
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .4, 10), smooth({ color: 0x555555, metalness: .7, roughness: .3 })); post.position.y = .25; chair.add(post);
  const P = makeReal(ME); P.root.position.set(0, .58, 0); scene.add(P.root);
  scene.traverse(o => { if (o.isMesh) { o.castShadow = o.material.isMeshStandardMaterial; o.receiveShadow = true; } });
  return { scene, cam, P, D, can, mon, setScreen(t, err) { const g = D.g; if (!err) { g.fillStyle = '#10204a'; g.fillRect(0, 0, 96, 54); for (let i = 0; i < 6; i++) { g.fillStyle = ['#ff4a8a', '#4affd8', '#ffd84a'][i % 3]; g.fillRect((i * 17 + t * 40) % 96, 10 + (i * 13) % 34, 8, 8); } } else { g.fillStyle = Math.sin(t * 30) > 0 ? '#b80000' : '#3a0000'; g.fillRect(0, 0, 96, 54); g.fillStyle = '#ffffff'; g.font = 'bold 14px monospace'; g.textAlign = 'center'; g.fillText('ERROR', 48, 32); } D.t.needsUpdate = true; } };
}
// the house from outside, at night: one window glowing purple
function realOutside() {
  const scene = new THREE.Scene(), cam = newCam(40); scene.add(cam);
  const sky = ctex(32, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#02030a'); gr.addColorStop(.7, '#0c1430'); gr.addColorStop(1, '#1e2448'); g.fillStyle = gr; g.fillRect(0, 0, 32, 128); const r = rng(3); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${.3 + r() * .7})`; g.fillRect(r() * 32 | 0, r() * 80 | 0, 1, 1); } });
  scene.background = sky; scene.fog = new THREE.Fog(0x0c1430, 14, 40);
  scene.add(new THREE.HemisphereLight(0x3a4a8a, 0x101018, 1.1)); const moon = new THREE.DirectionalLight(0x9ab0ff, 1.2); moon.position.set(-6, 10, 6); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(moon);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), smooth({ color: 0x14241a })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 5), smooth({ color: 0x1a1a1e })); road.rotation.x = -Math.PI / 2; road.position.set(0, .01, 7); scene.add(road);
  const hs = new THREE.Group(); scene.add(hs); const wall = smooth({ color: 0x6a7088 }), roof = smooth({ color: 0x2a2228 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(7, 3.2, 5), wall); body.position.y = 1.6; hs.add(body);
  const up = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 4.6), wall); up.position.set(-1.2, 4.5, 0); hs.add(up);
  const tri = new THREE.Shape(); tri.moveTo(-2.4, 0); tri.lineTo(2.4, 0); tri.lineTo(0, 1.4); tri.closePath(); const rf = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 5, bevelEnabled: false }), roof); rf.position.set(-1.2, 5.8, -2.5); hs.add(rf);
  const glowW = new THREE.MeshBasicMaterial({ color: 0xc86aff }), darkW = new THREE.MeshBasicMaterial({ color: 0x141826 }), warmW = new THREE.MeshBasicMaterial({ color: 0x8a6a3a });
  const win = (x, y, m, w = 1.1, h = 1.0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, 2.31); hs.add(p); const fr = new THREE.Mesh(new THREE.BoxGeometry(w + .12, h + .12, .05), smooth({ color: 0xd8d8e0 })); fr.position.set(x, y, 2.28); hs.add(fr); return p; };
  const myWin = win(-1.2, 4.5, glowW, 1.3, 1.1); win(-2.4, 1.7, darkW); win(1.0, 1.7, warmW); win(2.6, 1.7, darkW);
  const door = new THREE.Mesh(new THREE.BoxGeometry(.9, 2.0, .06), smooth({ color: 0x3a2228 })); door.position.set(-.3, 1.0, 2.52); hs.add(door);
  const pl = new THREE.PointLight(0xb04aff, 14, 9); pl.position.set(-1.2, 4.5, 3.4); scene.add(pl);
  const porch = new THREE.PointLight(0xffc070, 4, 5); porch.position.set(-.3, 2.3, 3.0); scene.add(porch);
  for (const [x, z, s] of [[-5.5, 3, 1.3], [5.2, 2.2, 1.0], [7.5, -1, 1.5]]) { const tr = new THREE.Group(); tr.position.set(x, 0, z); const tk = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 1.6, 10), smooth({ color: 0x2a1c14 })); tk.position.y = .8; tr.add(tk); const lf = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), smooth({ color: 0x1a3020 })); lf.position.y = 2.2; tr.add(lf); tr.scale.setScalar(s); scene.add(tr); }
  const sl = new THREE.Group(); sl.position.set(4, 0, 5.2); scene.add(sl); const pm = smooth({ color: 0x2a2c30 }); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 4, 10), pm); pole.position.y = 2; sl.add(pole); const bulb = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); bulb.position.set(-.3, 4, 0); sl.add(bulb); const sp = new THREE.PointLight(0xffd890, 10, 8); sp.position.set(3.7, 3.8, 5.2); scene.add(sp);
  const moonD = new THREE.Mesh(new THREE.CircleGeometry(.9, 24), new THREE.MeshBasicMaterial({ color: 0xf2eedc, fog: false })); moonD.position.set(-9, 11, -20); scene.add(moonD);
  scene.traverse(o => { if (o.isMesh) { o.castShadow = o.material.isMeshStandardMaterial; o.receiveShadow = true; } });
  return { scene, cam, myWin, pl };
}
function arcs(scene, n = 5) { return [...Array(n)].map(() => { const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: 0x9ae8ff }); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.006, .06, .006), m); b.position.y = k * .05; b.rotation.z = (k % 2 ? .7 : -.7); g.add(b); } scene.add(g); return g; }); }
function tunnel() { const scene = new THREE.Scene(), cam = newCam(70); scene.add(cam); scene.background = new THREE.Color(0x05020a); const r = rng(77);
  for (let i = 0; i < 260; i++) { const a = r() * Math.PI * 2, rad = 1.2 + r() * 1.6, c = new THREE.Mesh(new THREE.BoxGeometry(.25, .25, .25), new THREE.MeshBasicMaterial({ color: [0x4affd8, 0xff4a8a, 0xffd84a, 0x7a5aff, 0xffffff][i % 5] })); c.position.set(Math.cos(a) * rad, Math.sin(a) * rad, -i * .45); c.rotation.set(r() * 3, r() * 3, 0); scene.add(c); }
  return { scene, cam }; }

// ---------- the LOW-POLY world ----------
const skyOdd = ctex(64, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#3ad0ff'); gr.addColorStop(.55, '#8ae8ff'); gr.addColorStop(1, '#ffd8f0'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128); });
const checkT = wrap(ctex(16, 16, g => { g.fillStyle = '#6ad04a'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#5ab83e'; g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8); }));
function makeCow() {
  const g = new THREE.Group(), w = mat({ color: 0xf4f4f0 }), k = mat({ color: 0x1a1a1a }), pk = mat({ color: 0xf0a0b0 });
  g.add(box(1.3, .7, .7, w, 0, .95, 0)); for (const [x, y, z] of [[.2, 1.15, .36], [-.35, .9, .36], [.1, .8, -.36], [-.2, 1.2, -.36]]) g.add(box(.3, .25, .01, k, x, y, z));
  for (const [x, z] of [[-.45, -.22], [-.45, .22], [.45, -.22], [.45, .22]]) { g.add(box(.16, .56, .16, w, x, .34, z)); g.add(box(.17, .08, .17, k, x, .04, z)); }
  g.add(box(.2, .16, .25, pk, -.3, .55, 0));
  const tail = new THREE.Group(); tail.position.set(-.66, 1.15, 0); g.add(tail); tail.add(box(.04, .5, .04, w, 0, -.25, 0)); tail.add(box(.08, .12, .08, k, 0, -.52, 0));
  const hd = new THREE.Group(); hd.position.set(.78, 1.25, 0); g.add(hd); hd.add(box(.45, .42, .42, w));
  const jaw = box(.2, .08, .38, pk, .2, -.2, 0); hd.add(jaw); hd.add(box(.2, .14, .44, pk, .2, -.1, 0));
  for (const z of [-.12, .12]) { hd.add(box(.05, .05, .05, k, .15, -.08, z * .7)); hd.add(box(.06, .14, .06, mat({ color: 0xd8d0b0 }), -.05, .26, z * 1.4)); hd.add(box(.1, .06, .16, w, -.1, .14, z * 2.3)); }
  const eyes = [-.12, .12].map(z => { const e = box(.02, .08, .08, k, .23, .06, z); hd.add(e); return e; });
  g.userData = { hd, jaw, tail, eyes, anim(t, moo = 0) { jaw.position.y = -.2 - Math.abs(Math.sin(t * 5)) * .04 * (1 - moo) - moo * .06; tail.rotation.x = Math.sin(t * 2.3) * .5; const bl = ((t + .4) % 3.1) < .1; eyes.forEach(e => e.scale.y = bl ? .15 : 1); hd.rotation.z = moo * .3; } };
  return g;
}
function world() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyOdd; scene.fog = new THREE.Fog(0xbfefff, 25, 90);
  scene.add(new THREE.HemisphereLight(0xdff6ff, 0x6a8a4a, 1.8)); const sun = new THREE.DirectionalLight(0xfff4e0, 2.4); sun.position.set(8, 14, 6); sun.castShadow = true; Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0015; scene.add(sun, sun.target);
  const t = checkT.clone(); t.needsUpdate = true; t.repeat.set(400, 400); const gr = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), mat({ map: t })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  const tri = new THREE.Shape(); tri.moveTo(-1.3, 0); tri.lineTo(1.3, 0); tri.lineTo(0, 1.0); tri.closePath();
  const parts = [[new THREE.BoxGeometry(2.2, 1.6, 2).translate(0, .8, 0), mat({ color: 0xf2e2c0 })], [new THREE.ExtrudeGeometry(tri, { depth: 2.2, bevelEnabled: false }).translate(0, 1.6, -1.1), mat({ color: 0xd84a3a })],
    [new THREE.BoxGeometry(.45, .8, .02).translate(0, .4, 1.01), mat({ color: 0x6a3a22 })], [new THREE.BoxGeometry(.4, .4, .02).translate(-.65, 1.0, 1.01), bmat({ color: 0x8ad0ff })], [new THREE.BoxGeometry(.4, .4, .02).translate(.65, 1.0, 1.01), bmat({ color: 0x8ad0ff })]];
  const spots = []; for (let i = -22; i <= 22; i++) for (let j = 1; j <= 24; j++) for (const s of [-1, 1]) spots.push([i * 7, -s * (4 + (j - 1) * 7 + (j > 1 ? Math.floor((j - 1) / 2) * 3 : 0)), s > 0 ? 0 : Math.PI]);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  for (const [g, m] of parts) { const im = new THREE.InstancedMesh(g, m, spots.length); spots.forEach(([x, z, ry], k) => im.setMatrixAt(k, M4.compose(V(x, 0, z), Q.setFromAxisAngle(V(0, 1, 0), ry), one))); im.castShadow = im.receiveShadow = !m.isMeshBasicMaterial; scene.add(im); }
  const r = rng(4), clouds = []; for (let i = 0; i < 40; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + r() * 2.5, 0), bmat({ color: 0xffffff, fog: false })); c.scale.y = .45; c.position.set((r() - .5) * 140, 22 + r() * 110, (r() - .5) * 140); scene.add(c); clouds.push(c); }
  const crater = new THREE.Mesh(new THREE.CircleGeometry(.9, 12), bmat({ color: 0x3a6a2a, transparent: true, opacity: .55 })); crater.rotation.x = -Math.PI / 2; crater.position.set(0, .012, .2); crater.scale.set(1, 1.6, 1); scene.add(crater);
  const H = makeHuman(ME); scene.add(H.root);
  return { scene, cam, H, sun, crater, clouds };
}
// glitch strength over the timeline (post pass)
const glitchAt = t => Math.max(t > 7.6 && t < 8.6 ? ss(7.6, 8.6, t) * (Math.sin(t * 40) > -.3 ? 1 : .3) : 0, t > 8.6 && t < 9.4 ? 1 - ss(8.6, 9.4, t) : 0, 1 - Math.abs(t - 11.4) / .12, t > TITLE && t < TITLE + .5 ? 1 - ss(TITLE, TITLE + .5, t) : 0, 0);
const flashAt = t => t > 8.55 && t < 9.2 ? Math.exp(-(t - 8.55) * 7) : (t > 11.38 && t < 11.6 ? .6 * Math.exp(-(t - 11.38) * 14) : 0);

// ---------- shots ----------
const shots = [];
const shot = (t0, t1, build, o = {}) => { const s = { t0, t1, ...o, ...build() }; s.scene.traverse(x => { if (x.isMesh && !x.isInstancedMesh && !x.material.isMeshStandardMaterial) { const m = Array.isArray(x.material) ? x.material[0] : x.material; const basic = m.isMeshBasicMaterial; x.castShadow = !basic && !m.transparent; x.receiveShadow = !basic; } }); shots.push(s); };
function vrPlay(P, t, k = 1) {
  P.arms[0].rotation.x = -1.1 + Math.sin(t * 3.1) * .7 * k; P.arms[0].rotation.z = -.3 - Math.sin(t * 2.3) * .3 * k; P.fore[0].rotation.x = -.6 - Math.sin(t * 3.1 + 1) * .4 * k;
  P.arms[1].rotation.x = -1.3 + Math.sin(t * 2.7 + 2) * .8 * k; P.arms[1].rotation.z = .3 + Math.sin(t * 1.9) * .3 * k; P.fore[1].rotation.x = -.7 - Math.sin(t * 2.7 + 3) * .4 * k;
  P.head.rotation.y = Math.sin(t * 1.7) * .4 * k; P.head.rotation.x = Math.sin(t * 2.2) * .12 * k; P.torso.rotation.y = Math.sin(t * 1.4) * .15 * k; }
// 1 outside the house at night; slow push toward the glowing window
shot(0, 3.6, () => { const O = realOutside();
  return { scene: O.scene, cam: O.cam, real: true, stamp: '11:47 PM', update(f, fd, t) { O.pl.intensity = 14 + Math.sin(t * 9) * 3 + Math.sin(t * 23) * 2; const k = ss(0, fd, f); look(O.cam, lerp(3.5, .6, k), lerp(2.0, 3.6, k), lerp(16, 8.5, k), -1.2, lerp(3.0, 4.4, k), 2.3); handheld(O.cam, t, .002); } }; }, { dof: { b: 1.2, x: .5, y: .4, r: .5 } });
// 2 inside: him in VR, swinging the controllers
shot(3.6, 6.8, () => { const R = realRoom();
  return { scene: R.scene, cam: R.cam, real: true, update(f, fd, t) { R.setScreen(t, false); vrPlay(R.P, t); const k = ss(0, fd, f); look(R.cam, lerp(1.9, 1.5, k), 1.5, lerp(1.5, 1.2, k), -.05, 1.2, .2); handheld(R.cam, t, .004); } }; }, { dof: { b: 1.4, x: .5, y: .45, r: .45 } });
// 3 close on the headset: ERROR, red lights, sparks
shot(6.8, 8.6, () => { const R = realRoom(), ar = arcs(R.scene);
  return { scene: R.scene, cam: R.cam, real: true, update(f, fd, t) { const bad = t > 7.2, k = 1 - ss(7.1, 7.5, t); R.setScreen(t, bad); vrPlay(R.P, t, k); R.P.leds.forEach((l, i) => l.material.color.setHex(bad && Math.sin(t * 25 + i) > 0 ? 0xff2020 : (bad ? 0x300000 : 0x4ad8ff)));
    R.P.root.position.x = bad ? Math.sin(t * 70) * .006 : 0; R.mon.color.setHex(bad ? 0xff3030 : 0x7ab0ff);
    const v = wp(R.P.vr, 0, 0, .05); ar.forEach((a, i) => { a.visible = t > 7.6 && Math.sin(t * 50 + i * 7) > .2; a.position.set(v.x + Math.sin(i * 2.1 + t * 9) * .16, v.y + Math.cos(i * 1.7 + t * 7) * .1, v.z + .02); a.rotation.z = t * 20 + i; });
    look(R.cam, v.x + .55, v.y + .05, v.z + .65 - f * .12, v.x, v.y - .02, v.z); if (bad) shake(R.cam, t, .004); } }; }, { dof: { b: 1.8, x: .5, y: .45, r: .35 } });
// 4 the cube tunnel
shot(8.6, 9.8, () => { const T = tunnel();
  return { scene: T.scene, cam: T.cam, update(f, fd, t) { const z = -f * f * 70; look(T.cam, Math.sin(t * 9) * .1, Math.cos(t * 7) * .1, z, 0, 0, z - 10); T.cam.rotation.z = f * 3; } }; });
// 5 falling out of the sky, through the clouds; halfway down he glitches from "real" to blocky
const SWAP = 11.4;
shot(9.8, 12.6, () => { const W = world(), R = makeReal(ME, true); W.scene.add(R.root); R.root.traverse(o => { if (o.isMesh) o.castShadow = false; }); W.scene.fog.far = 500; W.scene.fog.near = 120;
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const y = 130 - f * 22, H = W.H, blocky = t >= SWAP; R.root.visible = !blocky; H.root.visible = blocky;
    const tumble = V(t * 2.1, t * 1.3, t * 1.7); R.root.position.set(0, y, 0); R.root.rotation.set(tumble.x, tumble.y, tumble.z); R.vr.visible = false;
    R.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (2.3 + Math.sin(t * 20 + i) * .5); }); R.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 17 + i * 3) * .6);
    H.reset(); H.root.position.set(0, y - .84, 0); H.root.rotation.set(tumble.x, tumble.y, tumble.z); H.arms.forEach((a, i) => a.rotation.z = (i ? 1 : -1) * (2.3 + Math.sin(t * 20 + i) * .5)); H.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 17 + i * 3) * .6); H.face('terror_scream', t);
    W.clouds.forEach((c, i) => { if (i < 14) { const q = ((t * 1.4 + i * .19) % 1); c.position.set(Math.sin(i * 2.3) * (6 + i % 4 * 3), y - 25 + q * 60, Math.cos(i * 1.7) * (6 + i % 3 * 3)); } });
    look(W.cam, 4.6, y + .8, 4.6, 0, y - .3, 0); shake(W.cam, t, .02); } }; });
// 6 from the ground, looking straight up: he comes screaming down at us
shot(12.6, IMP, () => { const W = world();
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); const k = f / fd, y = lerp(70, 0, k * k); H.root.position.set(0, y + .1, 0); H.root.rotation.set(Math.PI * .5 + Math.sin(t * 3) * .3, t * 2, 0);
    H.arms.forEach((a, i) => a.rotation.z = (i ? 1 : -1) * (2.3 + Math.sin(t * 22 + i) * .5)); H.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 19 + i * 3) * .6); H.face('terror_scream', t); W.crater.visible = false;
    look(W.cam, 2.0, .35, 1.8, 0, Math.max(3, y * .85), -.3); W.cam.fov = 70; W.cam.updateProjectionMatrix(); } }; });
// 7 IMPACT -> "OWWW": face-down in a dent, dust; he lifts his head
shot(IMP, VO + 2.75, () => { const W = world(), ds = [...Array(14)].map((_, i) => { const d = new THREE.Mesh(new THREE.IcosahedronGeometry(.1, 0), mat({ color: 0xd8f0c0 })); d.userData = i; W.scene.add(d); return d; });
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); H.root.position.set(0, .18, -.6); H.root.rotation.set(Math.PI / 2, 0, 0);
    H.arms.forEach((a, i) => { a.rotation.x = -2.9; a.rotation.z = (i ? 1 : -1) * .5; }); H.legs.forEach((l, i) => l.rotation.z = (i ? 1 : -1) * .2);
    const lift = ss(.9, 1.4, f); H.neck.rotation.x = -.9 * lift; talk(H, 'pain', t);
    ds.forEach(d => { const i = d.userData, an = i * .45, q = clamp(f * 1.6); d.visible = q < 1; d.position.set(Math.cos(an) * q * 1.6, .1 + q * 1.2 * (1 - q), .2 + Math.sin(an) * q * 1.6); d.scale.setScalar((1 - q) * 1.2); });
    const k = ss(.35, 1.0, f), fc = faceAt(H); look(W.cam, lerp(4.5, fc.x + .9, k), lerp(2.2, .45, k), lerp(4.5, fc.z + 1.0, k), lerp(0, fc.x, k), lerp(.3, fc.y, k), lerp(0, fc.z, k)); shake(W.cam, t, .06 * Math.exp(-f * 7)); } }; }, { dof: { b: 1.4, x: .5, y: .5, r: .4 } });
// 8 "What the freak" - he pops right up, angry, brushing himself off
shot(VO + 2.75, VO + 4.6, () => { const W = world();
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); const up = clamp(spring(f * 2.2), 0, 1.05);
    H.root.position.set(0, 0, 0); H.body.position.y = -.35 * (1 - up); H.legs.forEach(l => l.rotation.x = -1.2 * (1 - up)); H.shins.forEach(s => s.rotation.x = 1.6 * (1 - up)); H.torso.rotation.x = .3 * (1 - up);
    H.breathe(t); const br = f > .35 && f < .8; H.arms[1].rotation.x = br ? -.6 + Math.sin(t * 24) * .25 : -.15; H.fore[1].rotation.x = br ? -1.2 : -.2; H.arms[0].rotation.z = -.25; H.arms[1].rotation.z = .1;
    if (say(3.35, 4.35, t)) { H.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * .9; a.rotation.x = -.5; }); H.fore.forEach(fr => fr.rotation.x = -.9); }
    talk(H, say(3.35, 4.35, t) ? 'angry' : 'pain', t, 1.5); const fc = faceAt(H); look(W.cam, fc.x - .9, fc.y - .2, fc.z + 2.3 - f * .2, fc.x, fc.y - .45, fc.z); handheld(W.cam, t, .004); } }; }, { dof: { b: 1.4, x: .5, y: .45, r: .42 } });
// 9 "Where am I" - the camera circles him: the same house, forever
shot(VO + 4.6, VO + 6.4, () => { const W = world();
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); H.breathe(t); H.neck.rotation.y = Math.sin(f * 2.4) * .6; H.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * .35; a.rotation.x = -.2; }); H.fore.forEach(fr => fr.rotation.x = -.5);
    talk(H, 'confused', t); const an = lerp(.3, 2.4, ss(0, fd, f)), fc = faceAt(H); look(W.cam, Math.sin(an) * 3.4, 1.9, Math.cos(an) * 3.4, 0, 1.45, 0); handheld(W.cam, t, .003); } }; }, { dof: { b: 1.2, x: .5, y: .45, r: .45 } });
// 10 he turns slowly... the cow is RIGHT there
const COWP = V(-.2, 0, -1.55);
shot(VO + 6.4, VO + 7.35, () => { const W = world(), cow = makeCow(); W.scene.add(cow); cow.position.copy(COWP); cow.rotation.y = -Math.PI / 2;
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); H.breathe(t); const k = ss(.1, fd, f); H.root.rotation.y = lerp(0, Math.PI, k); H.neck.rotation.y = .3 * (1 - k); H.face('confused_c', t); cow.userData.anim(t);
    look(W.cam, .9, 1.75, 1.9, -.2, 1.35, -1.2); handheld(W.cam, t, .003); } }; }, { dof: { b: 1.0, x: .5, y: .4, r: .5 } });
// 11 "AHHH!" - he leaps back screaming; the cow keeps chewing
shot(VO + 7.35, VO + 8.3, () => { const W = world(), cow = makeCow(); W.scene.add(cow); cow.position.copy(COWP); cow.rotation.y = -Math.PI / 2;
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); H.root.rotation.y = Math.PI; const j = Math.sin(clamp(f / .6) * Math.PI) * .6; H.root.position.set(0, j, lerp(0, .9, ss(0, .6, f)));
    H.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (2.4 + Math.sin(t * 26 + i) * .3); }); H.legs.forEach((l, i) => l.rotation.x = j > .05 ? (i ? .5 : -.5) : 0); talk(H, 'terror', t, 2); cow.userData.anim(t);
    look(W.cam, 6.2, 1.5, .1, 0, 1.1, .1); shake(W.cam, t, .012); } }; }, { dof: null });
// 12 "Is that a cowww?" - pointing, baffled
shot(VO + 8.3, VO + 10.35, () => { const W = world(), cow = makeCow(); W.scene.add(cow); cow.position.copy(COWP); cow.rotation.y = -Math.PI / 2;
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); H.root.position.set(0, 0, .9); H.root.rotation.y = Math.PI; H.breathe(t); cow.userData.anim(t);
    const sh = wp(H.torso, .42, .63, 0), aim = wp(cow.userData.hd, 0, 0, 0).sub(sh).normalize(); ik(H, 1, sh.clone().add(aim.multiplyScalar(.74))); H.arms[0].rotation.z = -.3; H.neck.rotation.z = .12;
    talk(H, 'shocked', t); const fc = faceAt(H); look(W.cam, 5.8, 1.6, .1 + Math.sin(f * .7) * .1, 0, 1.25, .1); handheld(W.cam, t, .003); } }; }, { dof: { b: 1.0, x: .5, y: .45, r: .5 } });
// 13 the cow, deadpan: chews... "moo." ...he just stares
const MOO = VO + 11.2;
shot(VO + 10.35, VO + 12.95, () => { const W = world(), cow = makeCow(); W.scene.add(cow); cow.position.copy(COWP); cow.rotation.y = -Math.PI / 2;
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); H.root.position.set(0, 0, .9); H.root.rotation.y = Math.PI; H.breathe(t); const m = t > MOO && t < MOO + .9 ? 1 : 0; cow.userData.anim(t, m);
    if (t < MOO + 1.2) { const hd = wp(cow.userData.hd, 0, 0, 0); look(W.cam, hd.x - .3, hd.y + .02, hd.z + 1.3, hd.x, hd.y - .05, hd.z); H.face('stare_c'); }
    else { H.face('stare_c', t); const fc = faceAt(H); look(W.cam, fc.x - .25, fc.y, fc.z - 1.0, fc.x, fc.y - .05, fc.z); } handheld(W.cam, t, .002); } }; }, { dof: { b: 1.6, x: .5, y: .45, r: .35 } });
// 14 he lowers his hand... and notices it. Square.
shot(VO + 12.95, VO + 14.35, () => { const W = world(), cow = makeCow(); W.scene.add(cow); cow.position.copy(COWP); cow.rotation.y = -Math.PI / 2;
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); H.root.position.set(0, 0, .9); H.root.rotation.y = Math.PI; cow.userData.anim(t);
    const fc = faceAt(H), k = ss(.1, .9, f); ik(H, 1, V(fc.x - .1, fc.y - .25 + k * .1, fc.z - .35)); H.neck.rotation.x = .25 * k; H.face(f > .8 ? 'shocked_c' : 'stare_c', t);
    look(W.cam, fc.x + .75, fc.y + .05, fc.z - .55, fc.x - .05, fc.y - .12, fc.z - .25); handheld(W.cam, t, .002); } }; }, { dof: { b: 1.6, x: .45, y: .45, r: .4 } });
// 15 first person: "IS THAT MY HANDS"
shot(VO + 14.35, ECHO[0] - .05, () => { const W = world();
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { const H = W.H; H.reset(); H.root.rotation.y = Math.PI; H.head.visible = false; H.root.updateMatrixWorld(true);
    const eye = wp(H.neck, 0, .28, .12), rise = ss(0, .25, f), sh = .015 + .02 * (shapeAt(t) !== 'c');
    for (const i of [0, 1]) ik(H, i, eye.clone().add(V((i ? -1 : 1) * .13 + Math.sin(t * 40 + i) * sh, lerp(-.5, -.02, rise) + Math.cos(t * 37 + i) * sh, -.38)));
    W.cam.fov = 70; W.cam.updateProjectionMatrix(); look(W.cam, eye.x, eye.y, eye.z, eye.x, eye.y - .15, eye.z - 1); shake(W.cam, t, .01); } }; }, { dof: { b: 1.0, x: .5, y: .6, r: .5 } });
// 16 the echo: "my hands... my hands... hands..." - the camera snaps further out each time
const ECHO_D = [5, 16, 40, 95];
shot(ECHO[0] - .05, TITLE, () => { const W = world(), cow = makeCow(); W.scene.add(cow); cow.position.copy(COWP); cow.rotation.y = -Math.PI / 2;
  return { scene: W.scene, cam: W.cam, update(f, fd, t) { W.clouds.forEach(c => c.visible = c.position.y > 100); const H = W.H; H.reset(); H.root.position.set(0, 0, .9); H.root.rotation.y = Math.PI; cow.userData.anim(t);
    const fc0 = faceAt(H); for (const i of [0, 1]) ik(H, i, fc0.clone().add(V((i ? -1 : 1) * .2 + Math.sin(t * 30 + i) * .02, -.1, -.35))); H.face('terror_scream'); H.neck.rotation.x = -.2;
    W.scene.fog.far = 90 + 600 * ss(ECHO[0], ECHO[3], t); W.scene.fog.near = 25 + 200 * ss(ECHO[0], ECHO[3], t);
    let d = 2.4; ECHO.forEach((e, k) => { const prev = k ? ECHO_D[k - 1] : 2.4, s_ = spring((t - e) * 1.6); if (t > e) d = lerp(prev, ECHO_D[k], clamp(s_, 0, 1.08)); });
    const fc = faceAt(H), up = clamp((d - 2.4) / 40), tgt = vl(fc, V(0, 0, .9), up); look(W.cam, tgt.x + d * .4, tgt.y + d * lerp(.1, .95, up), tgt.z - d * lerp(.9, .3, up), tgt.x, tgt.y, tgt.z);
    const kick = ECHO.reduce((a, e) => a + (t > e ? Math.exp(-(t - e) * 9) : 0), 0); shake(W.cam, t, .02 * kick * (1 + d * .02)); } }; });
// 17 title card over the endless world
shot(TITLE, DUR + .1, () => { const W = world(); W.scene.fog.far = 690; W.scene.fog.near = 225; W.H.root.position.set(0, 0, .9); W.clouds.forEach(c => c.visible = c.position.y > 100);
  return { scene: W.scene, cam: W.cam, title: true, update(f, fd, t) { const an = f * .06; look(W.cam, Math.sin(an) * 40 + 38, 90 + f * 2, Math.cos(an) * 30 - 30, 0, 0, 0); } }; });
shots.forEach(S => { if (!S.cam.parent) S.scene.add(S.cam); });

// ---------- post: depth of field, glitch, flash, grain, vignette, time stamp, title ----------
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
function glitch(g, t) {
  if (g <= .02) return; tg.clearRect(0, 0, W, H); tg.drawImage(lo, 0, 0); const r = rng((t * 997) | 0);
  for (let i = 0; i < 14 * g; i++) { const y = r() * H | 0, h = 4 + r() * 40 * g | 0, dx = (r() - .5) * 60 * g | 0; lg.drawImage(tmp, 0, y, W, h, dx, y, W, h); }
  lg.globalCompositeOperation = 'lighter'; lg.globalAlpha = .45 * g; lg.drawImage(tmp, 6 * g, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 6 * g; i++) { lg.fillStyle = ['#ff2a8a', '#2affd8', '#ffffff', '#000000'][i % 4]; lg.fillRect(r() * W, r() * H, 8 + r() * 40, 3 + r() * 10); }
}
const grain = [0, 1, 2].map(i => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), id = g.createImageData(W, H), r = rng(90 + i); for (let k = 0; k < id.data.length; k += 4) { const v = r() * 255 | 0; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; } g.putImageData(id, 0, 0); return c; });
const vig = document.createElement('canvas'); vig.width = W; vig.height = H; { const g = vig.getContext('2d'), gr = g.createRadialGradient(W / 2, H * .46, W * .35, W / 2, H * .46, H * .62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function drawTitle(f) {   // "LOADED IN" slams in with an RGB split, then EPISODE 1 under it; fade to black at the end
  const X = out.width / 2, Y = out.height * .44, s = f < .25 ? 1 + 2.2 * (1 - f / .25) ** 2 : 1 + .03 * Math.exp(-(f - .25) * 10) * Math.cos((f - .25) * 40);
  og.save(); og.translate(X, Y); og.scale(s, s); og.textAlign = 'center'; og.textBaseline = 'middle'; og.font = '900 150px Nunito';
  const jit = f < .6 ? (Math.sin(f * 90) * 10 * (1 - f / .6)) : 0;
  og.globalAlpha = Math.min(1, f / .1); og.fillStyle = 'rgba(255,40,140,.85)'; og.fillText('LOADED', -6 + jit, -70); og.fillText('IN', -6 + jit, 70); og.fillStyle = 'rgba(40,255,220,.85)'; og.fillText('LOADED', 6 - jit, -70); og.fillText('IN', 6 - jit, 70);
  og.lineWidth = 14; og.strokeStyle = '#111'; og.strokeText('LOADED', 0, -70); og.strokeText('IN', 0, 70); og.fillStyle = '#ffffff'; og.fillText('LOADED', 0, -70); og.fillText('IN', 0, 70);
  og.restore(); if (f > .9) { og.save(); og.globalAlpha = Math.min(1, (f - .9) / .3); og.font = '800 54px Nunito'; og.textAlign = 'center'; og.fillStyle = '#ffffff'; og.shadowColor = 'rgba(0,0,0,.8)'; og.shadowBlur = 14; og.fillText('EPISODE 1', X, Y + 240); og.restore(); }
  const fade = ss(4.3, 5.1, f); if (fade > 0) { og.fillStyle = `rgba(0,0,0,${fade})`; og.fillRect(0, 0, out.width, out.height); }
}
let frameNo = 0;
function renderAt(t) {
  const s = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1], f = t - s.t0, fd = s.t1 - s.t0;
  s.update(f, fd, t); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam); dofDraw(s.dof);
  lg.globalCompositeOperation = 'overlay'; lg.globalAlpha = s.real ? .12 : .06; lg.drawImage(grain[frameNo++ % 3], 0, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over'; lg.drawImage(vig, 0, 0);
  if (!s.real) { const id = lg.getImageData(0, 0, W, H), d = id.data; for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) { const b = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - .5) * 6; d[i] = clamp(d[i] + b, 0, 255) & 0xFC; d[i + 1] = clamp(d[i + 1] + b, 0, 255) & 0xFC; d[i + 2] = clamp(d[i + 2] + b, 0, 255) & 0xFC; } lg.putImageData(id, 0, 0); }
  glitch(glitchAt(t), t); const fa = flashAt(t); if (fa > .01) { lg.fillStyle = `rgba(255,255,255,${fa})`; lg.fillRect(0, 0, W, H); }
  og.imageSmoothingEnabled = !!s.real; og.drawImage(lo, 0, 0, out.width, out.height);
  if (s.stamp) { og.save(); og.globalAlpha = Math.min(1, f / .4) * (1 - ss(s.t1 - s.t0 - .4, s.t1 - s.t0, f)); og.font = '800 46px Nunito'; og.fillStyle = '#ffffff'; og.shadowColor = 'rgba(0,0,0,.8)'; og.shadowBlur = 10; og.fillText(s.stamp, 60, out.height - 110); og.restore(); }
  if (s.title) drawTitle(f);
}
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .93); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(DUR * FPS);
await document.fonts.load('900 150px Nunito'); await document.fonts.load('800 54px Nunito');
window.captionChunks = []; window.ready = true;
