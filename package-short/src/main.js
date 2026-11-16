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

const HERO = { skin: 0xe2a57f, hair: 0x3a2618, top: 0x55657a, pants: 0x2a2f3a, iris: '#4a6a8a', stubble: true, hairH: .15, shoes: 0xdedede, seed: .7 };
const STR = { skin: 0xd6d0c4, hair: 0x0c0c0c, top: 0x18181d, pants: 0x121216, topStyle: 'coat', iris: '#0c0c0c', lip: '#5a3434', hairH: .06, shoes: 0x0a0a0a, seed: 2.1 };

// ---------- textures ----------
const uvBox = (w, h, d, m, x, y, z, k = .8) => { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * k, uv.getY(i) * h * k); const me = new THREE.Mesh(g, m); me.position.set(x, y, z); return me; };
const wrap = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const wallT = wrap(ctex(32, 32, g => { g.fillStyle = '#5d6e60'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#516254'; for (let x = 0; x < 32; x += 8) g.fillRect(x, 0, 3, 32); g.fillStyle = 'rgba(230,236,200,.16)'; for (let y = 4; y < 32; y += 8) for (let x = 5; x < 32; x += 8) { g.fillRect(x, y, 1, 2); g.fillRect(x - 1, y + 1, 3, 1); } noise(g, 32, 32, 10, 61); }));
const sidingT = wrap(ctex(32, 32, g => { g.fillStyle = '#c8c2b0'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#a8a290'; for (let y = 0; y < 32; y += 5) g.fillRect(0, y, 32, 1); noise(g, 32, 32, 12, 62); }));
const floorT = wrap(ctex(32, 32, g => { g.fillStyle = '#7a5434'; g.fillRect(0, 0, 32, 32); const r = rng(43); for (let y = 0; y < 32; y += 4) { g.fillStyle = `rgb(${110 + r() * 25 | 0},${74 + r() * 18 | 0},${44 + r() * 12 | 0})`; g.fillRect(0, y, 32, 4); g.fillStyle = '#4a321e'; g.fillRect(0, y, 32, 1); g.fillRect((r() * 32) | 0, y, 1, 4); } noise(g, 32, 32, 10, 44); }));
const doorT = ctex(32, 64, g => { g.fillStyle = '#6a2a22'; g.fillRect(0, 0, 32, 64); g.strokeStyle = '#4a1a14'; g.lineWidth = 2; for (const [x, y, w, h] of [[5, 5, 9, 22], [18, 5, 9, 22], [5, 33, 9, 26], [18, 33, 9, 26]]) g.strokeRect(x, y, w, h); g.fillStyle = 'rgba(255,220,200,.08)'; g.fillRect(5, 5, 9, 2); noise(g, 32, 64, 12, 63); });
const closetT = ctex(32, 64, g => { g.fillStyle = '#d8d2c2'; g.fillRect(0, 0, 32, 64); g.fillStyle = '#b8b2a2'; for (let y = 6; y < 60; y += 4) g.fillRect(5, y, 22, 2); g.strokeStyle = '#a8a292'; g.strokeRect(4.5, 4.5, 23, 55); noise(g, 32, 64, 10, 64); });
const cardT = ctex(32, 32, g => { g.fillStyle = '#b98a52'; g.fillRect(0, 0, 32, 32); g.fillStyle = 'rgba(120,80,40,.25)'; for (let x = 0; x < 32; x += 3) g.fillRect(x, 0, 1, 32); noise(g, 32, 32, 14, 65); });
const labelT = ctex(96, 64, g => {
  g.fillStyle = '#b98a52'; g.fillRect(0, 0, 96, 64); g.fillStyle = 'rgba(120,80,40,.25)'; for (let x = 0; x < 96; x += 3) g.fillRect(x, 0, 1, 64);
  g.fillStyle = '#f2efe6'; g.fillRect(8, 22, 58, 32); g.strokeStyle = '#7a6a5a'; g.lineWidth = 1; g.strokeRect(8.5, 22.5, 57, 31);
  g.fillStyle = '#1a1a1a'; g.font = 'bold 9px sans-serif'; g.fillText('TO:', 12, 33); g.save(); g.translate(30, 46); g.rotate(-.06); g.font = 'bold 20px sans-serif'; g.fillText('TOM', 0, 0); g.restore();
  g.fillStyle = '#3a2a1a'; g.font = 'bold 7px sans-serif'; g.fillText('FROM:', 8, 13); g.fillRect(32, 13, 26, 1);
  g.setLineDash([3, 2]); g.strokeStyle = '#3a2a1a'; g.strokeRect(70.5, 6.5, 19, 21); g.setLineDash([]);
  noise(g, 96, 64, 10, 66);
});
const matT = ctex(64, 32, g => { g.fillStyle = '#8a6a3a'; g.fillRect(0, 0, 64, 32); const r = rng(5); for (let i = 0; i < 300; i++) { g.fillStyle = r() < .5 ? '#7a5a2e' : '#9a7a48'; g.fillRect(r() * 64 | 0, r() * 32 | 0, 2, 1); } g.fillStyle = '#3a2814'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('WELCOME', 32, 20); });
const curtT = wrap(ctex(16, 32, g => { g.fillStyle = '#6a1e24'; g.fillRect(0, 0, 16, 32); g.fillStyle = '#521418'; for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 2, 32); noise(g, 16, 32, 10, 67); }));
const rugT = ctex(32, 32, g => { g.fillStyle = '#3a4a6a'; g.fillRect(0, 0, 32, 32); g.strokeStyle = '#c8a86a'; g.lineWidth = 2; g.strokeRect(3, 3, 26, 26); g.strokeStyle = '#8a3a3a'; g.strokeRect(8, 8, 16, 16); noise(g, 32, 32, 12, 68); });
const grassT = wrap(ctex(32, 32, g => { g.fillStyle = '#2a4026'; g.fillRect(0, 0, 32, 32); const r = rng(9); for (let i = 0; i < 160; i++) { g.fillStyle = r() < .5 ? '#22361e' : '#34502e'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 2); } }));
const roadT = wrap(ctex(32, 32, g => { g.fillStyle = '#2c2e33'; g.fillRect(0, 0, 32, 32); noise(g, 32, 32, 20, 69); }));
const walkT = wrap(ctex(32, 32, g => { g.fillStyle = '#8a8a86'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#6a6a66'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32); noise(g, 32, 32, 16, 70); }));
const skyT = ctex(64, 128, g => {
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#03050c'); gr.addColorStop(.55, '#0e1630'); gr.addColorStop(1, '#2a2f52'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
  const r = rng(12); for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,240,${.3 + r() * .7})`; g.fillRect(r() * 64 | 0, r() * 80 | 0, 1, 1); }
});
const tvT = dynTex(32, 24);

// ---------- props ----------
function makePkg() {
  const g = new THREE.Group(), cb = mat({ map: cardT }), lab = mat({ map: labelT }), w = .46, h = .3, d = .36;
  const inM = mat({ color: 0x8a6036 }), t = .012;
  g.add(box(w, t, d, cb, 0, t / 2, 0)); g.add(box(w, h, t, [cb, cb, cb, cb, lab, inM], 0, h / 2, d / 2 - t / 2)); g.add(box(w, h, t, [cb, cb, cb, cb, inM, cb], 0, h / 2, -d / 2 + t / 2));
  for (const s of [-1, 1]) g.add(box(t, h, d - 2 * t, s > 0 ? [cb, inM, cb, cb, cb, cb] : [inM, cb, cb, cb, cb, cb], s * (w / 2 - t / 2), h / 2, 0));
  const tapeM = mat({ color: 0xd8bc84 });
  const flaps = [-1, 1].map(s => { const f = new THREE.Group(); f.position.set(0, h, s * d / 2); f.add(box(w - .004, .012, d / 2, cb, 0, .006, -s * d / 4)); f.add(box(w + .006, .016, .05, tapeM, 0, .008, -s * (d / 2 - .025))); g.add(f); return f; });
  g.userData = { flaps, open(k) { flaps.forEach((f, i) => f.rotation.x = (i ? 1 : -1) * k * 2.2); }, w, h, d };
  return g;
}
function shreds(parent, n, w, d, y) { const r = rng(n), cols = [0xe8dcc0, 0xd8c8a0, 0xf2ecdc]; return [...Array(n)].map((_, i) => { const s = box(.012, .006, .09 + r() * .05, bmat({ color: cols[i % 3] }), (r() - .5) * w, y + r() * .05, (r() - .5) * d); s.rotation.set(r() * 3, r() * 3, r() * 3); s.userData = { y: s.position.y, a: r() * 6 }; parent.add(s); return s; }); }
function makePhone() {
  const g = new THREE.Group(), bd = mat({ color: 0x2c2e33 }), keyM = mat({ color: 0x55595f });
  g.add(box(.1, .27, .05, bd, 0, 0, 0)); g.add(box(.014, .09, .014, bd, .03, .17, 0)); g.add(box(.02, .02, .02, mat({ color: 0x15161a }), .03, .22, 0));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) g.add(box(.018, .012, .006, keyM, -.026 + c * .026, -.03 - r * .022, .026));
  g.add(box(.05, .004, .004, mat({ color: 0x111111 }), 0, .115, .026));
  const S = dynTex(48, 30), scr = new THREE.Mesh(new THREE.PlaneGeometry(.07, .044), bmat({ map: S.t })); scr.position.set(0, .06, .0255); g.add(scr);
  g.userData = { S, draw(on, t = 0) {
    const c = S.g; c.fillStyle = on ? '#a8e88a' : '#1e2a1c'; c.fillRect(0, 0, 48, 30);
    if (on) { c.fillStyle = '#1a3a14'; c.font = 'bold 8px monospace'; c.textAlign = 'center'; c.fillText('UNKNOWN', 24, 12); if (Math.sin(t * 14) > 0) { c.fillRect(20, 16, 8, 6); c.fillRect(19, 21, 10, 2); c.fillRect(23, 23, 2, 2); } }
    S.t.needsUpdate = true; } };
  g.userData.draw(false); return g;
}
function hat(h) { const m = mat({ color: 0x141418 }); h.head.add(box(.72, .03, .68, m, 0, .555, .02)); h.head.add(box(.48, .2, .46, m, 0, .67, 0)); h.head.add(box(.49, .05, .47, mat({ color: 0x2a2a30 }), 0, .6, 0)); return h; }
function coat(h) { const m = mat({ map: fabricTex(0x18181d, 'coat') }); h.body.add(box(.66, .55, .4, m, 0, .58, 0)); h.torso.add(box(.66, .2, .42, mat({ color: 0x18181d }), 0, .62, 0)); return h; }
function makeTree(s = 1) { const g = new THREE.Group(), m = mat({ color: 0x15281a }); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, .8, 5), mat({ color: 0x2a1c12 })); tr.position.y = .4; g.add(tr); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(.9 - i * .22, 1.1, 6), m); c.position.y = 1.0 + i * .6; g.add(c); } g.scale.setScalar(s); return g; }
function makeHouse(col, lit) {
  const g = new THREE.Group(), sm = mat({ map: sidingT, color: col }), rm = mat({ color: 0x2a2226 });
  g.add(uvBox(4, 2.8, 3.5, sm, 0, 1.4, 0, 1)); const tri = new THREE.Shape(); tri.moveTo(-2.25, 0); tri.lineTo(2.25, 0); tri.lineTo(0, 1.4); tri.closePath(); const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 3.8, bevelEnabled: false }), rm); roof.position.set(0, 2.8, -1.9); g.add(roof);
  lit.forEach(([x, y, on]) => { g.add(box(.6, .7, .02, bmat({ color: on ? 0xffc870 : 0x141a28, fog: false }), x, y, 1.76)); });
  g.add(box(.7, 1.4, .02, bmat({ color: 0x1a1210 }), .9, .7, 1.76)); return g;
}
function leaves(scene, n) { const r = rng(n + 3); return [...Array(n)].map(() => { const l = box(.07, .005, .05, mat({ color: r() < .5 ? 0x6a4a1e : 0x8a5a24 })); l.userData = { a: r(), x: (r() - .5) * 5, z: -4 - r() * 6, y: .1 + r() * 2 }; scene.add(l); return l; }); }
const leavesAt = (ls, t) => ls.forEach(l => { const u = l.userData, q = (t * .25 + u.a) % 1; l.position.set(u.x + (q - .5) * 6, u.y + Math.sin(t * 3 + u.a * 9) * .3, u.z + Math.sin(t + u.a * 5)); l.rotation.set(t * 4 + u.a * 9, t * 3, u.a * 6); });

// ---------- the set: living room + porch + street + the house across ----------
// room: x -4..4, z -3 (back wall: front door + window) .. 3.5 (TV wall); closet on the right wall (x = 4)
function house() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam);
  scene.background = skyT; scene.fog = new THREE.Fog(0x0b1020, 12, 36);
  const S = { scene, cam };
  // light
  scene.add(new THREE.AmbientLight(0x5a68a0, 1.7));
  const moon = new THREE.DirectionalLight(0x9ab0ff, 1.9); moon.position.set(5, 11, -16); moon.target.position.set(0, 0, -4); scene.add(moon, moon.target);
  moon.castShadow = true; Object.assign(moon.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 }); moon.shadow.mapSize.set(2048, 2048); moon.shadow.bias = -.0015; moon.shadow.normalBias = .02;
  const lampS = new THREE.SpotLight(0xffb468, 26, 9, 1.15, .7, 1.6); lampS.position.set(1.85, 1.72, .2); lampS.target.position.set(1.4, 0, .9); scene.add(lampS, lampS.target);
  lampS.castShadow = true; lampS.shadow.mapSize.set(512, 512); lampS.shadow.bias = -.002;
  const lampP = new THREE.PointLight(0xffa860, 7, 8); lampP.position.set(1.85, 1.9, .2); scene.add(lampP);
  const tvL = new THREE.PointLight(0x7a9cff, 5, 6); tvL.position.set(.3, 1.0, 2.9); scene.add(tvL);
  const porchL = new THREE.PointLight(0xffc070, 12, 6); porchL.position.set(-3.55, 2.25, -3.45); scene.add(porchL);
  S.lampS = lampS; S.lampP = lampP; S.tvL = tvL;
  // floor, ceiling, walls
  const wallIn = mat({ map: wallT }), wallOut = mat({ map: sidingT }), trim = mat({ color: 0xe8e2d4 }), dark = mat({ color: 0x14161c });
  scene.add(uvBox(8.3, .1, 6.8, mat({ map: floorT }), 0, -.05, .25, .9));
  scene.add(box(8.3, .12, 6.8, mat({ color: 0x2a2a30 }), 0, 3.26, .25));
  const backSeg = (x0, x1, y0, y1) => scene.add(uvBox(x1 - x0, y1 - y0, .15, [trim, trim, trim, trim, wallIn, wallOut], (x0 + x1) / 2, (y0 + y1) / 2, -3.07));
  backSeg(-4.15, -3.1, 0, 3.2); backSeg(-3.1, -2.1, 2.1, 3.2); backSeg(-2.1, -.7, 0, 3.2); backSeg(-.7, .7, 0, 1); backSeg(-.7, .7, 2.3, 3.2); backSeg(.7, 4.15, 0, 3.2);
  const side = (x, z0, z1, y0, y1, inner) => { const m = uvBox(z1 - z0, y1 - y0, .15, inner > 0 ? [trim, trim, trim, trim, wallIn, wallOut] : [trim, trim, trim, trim, wallOut, wallIn], x, (y0 + y1) / 2, (z0 + z1) / 2); m.rotation.y = Math.PI / 2; scene.add(m); };
  side(-4.07, -3, 3.6, 0, 3.2, 1);
  side(4.07, -3, -1.5, 0, 3.2, -1); side(4.07, -.5, 3.6, 0, 3.2, -1); side(4.07, -1.5, -.5, 2.1, 3.2, -1);
  scene.add(uvBox(8.3, 3.2, .15, [trim, trim, trim, trim, wallOut, wallIn], 0, 1.6, 3.57));
  for (const [x, z, w, d] of [[0, -2.98, 8, .04], [0, 3.48, 8, .04], [-3.98, .25, .04, 6.4], [3.98, .25, .04, 6.4]]) scene.add(box(w, .14, d, trim, x, .07, z));
  // front door (hinge at x = -3.1, opens into the room)
  const door = new THREE.Group(); door.position.set(-3.1, 0, -3.07); scene.add(door);
  door.add(box(1.0, 2.1, .08, [mat({ color: 0x5a221c }), mat({ color: 0x5a221c }), mat({ color: 0x5a221c }), mat({ color: 0x5a221c }), mat({ map: doorT }), mat({ map: doorT })], .5, 1.05, 0));
  const brass = mat({ color: 0xd8b04a }); door.add(box(.06, .06, .06, brass, .88, 1.0, .07)); door.add(box(.06, .06, .06, brass, .88, 1.0, -.07)); door.add(box(.03, .03, .02, mat({ color: 0x111111 }), .5, 1.55, .05));
  for (const [x, y, w, h] of [[-3.15, 1.05, .1, 2.2], [-2.05, 1.05, .1, 2.2], [-2.6, 2.17, 1.2, .1]]) scene.add(box(w, h, .2, trim, x, y, -3.07));
  const gapM = bmat({ color: 0xffc878, transparent: true, opacity: 0, fog: false }); const gap = new THREE.Mesh(new THREE.PlaneGeometry(.96, .03), gapM); gap.position.set(-2.6, .015, -3.02); scene.add(gap);
  S.door = door; S.doorGap = gapM;
  S.knob = () => wp(door, .88, 1.0, .1);
  // window + curtains
  for (const [x, y, w, h] of [[0, .97, 1.55, .08], [0, 2.33, 1.55, .08], [-.74, 1.65, .08, 1.45], [.74, 1.65, .08, 1.45], [0, 1.65, .05, 1.3], [0, 1.65, 1.4, .05]]) scene.add(box(w, h, .12, trim, x, y, -3.07));
  scene.add(box(1.7, .06, .3, trim, 0, .97, -2.9));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.3), new THREE.MeshBasicMaterial({ color: 0x8aa8d8, transparent: true, opacity: .1, depthWrite: false })); glass.position.set(0, 1.65, -3.06); scene.add(glass);
  scene.add(box(2.6, .04, .04, mat({ color: 0x2a2a2a }), 0, 2.6, -2.86));
  const curtM = mat({ map: curtT }); const curts = [-1, 1].map(s => { const c = uvBox(.82, 2.2, .06, curtM, s * .42, 1.52, -2.86, 1.5); scene.add(c); return c; });
  const leak = new THREE.Mesh(new THREE.PlaneGeometry(.05, 1.9), glowMat(0x8aa8ff, .55)); leak.position.set(0, 1.55, -2.82); scene.add(leak);
  S.curtain = k => { curts[0].position.x = -.42 - k * .78; curts[1].position.x = .42 + k * .78; curts.forEach(c => c.scale.x = 1 - k * .25); leak.visible = k < .05; };
  S.curts = curts;
  // closet door (right wall, hinge at z = -.5, opens into the room); dark inside, with something in it
  const closet = new THREE.Group(); closet.position.set(4.03, 0, -.5); scene.add(closet);
  closet.add(box(.06, 2.1, 1.0, [mat({ map: closetT }), mat({ map: closetT }), mat({ color: 0xd8d2c2 }), mat({ color: 0xd8d2c2 }), mat({ color: 0xd8d2c2 }), mat({ color: 0xd8d2c2 })], 0, 1.05, -.5));
  closet.add(box(.08, .06, .06, brass, -.06, 1.0, -.9));
  for (const [y, z, w, h] of [[1.05, -1.55, .1, 2.2], [1.05, -.45, .1, 2.2], [2.17, -1.0, 1.2, .1]]) scene.add(box(.2, h, w === .1 ? .1 : 1.2, trim, 4.03, y, z));
  scene.add(box(1.0, 2.2, 1.2, mat({ color: 0x050506, side: THREE.BackSide }), 4.6, 1.1, -1.0));
  for (let i = 0; i < 4; i++) scene.add(box(.04, .9, .32, mat({ color: [0x15151a, 0x1a1414, 0x14181a, 0x101012][i] }), 4.75, 1.45, -1.4 + i * .25));
  const eyes = new THREE.Group(); eyes.position.set(4.3, 1.72, -1.33); scene.add(eyes);
  for (const z of [-.045, .045]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.028, 6, 4), bmat({ color: 0xfff4c0, fog: false })); e.position.z = z; eyes.add(e); const gl = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), glowMat(0xffd88a, .8, true)); gl.rotation.y = -Math.PI / 2; gl.position.set(-.01, 0, z); eyes.add(gl); }
  eyes.visible = false; S.closet = closet; S.eyes = eyes;
  // furniture
  const couchM = mat({ color: 0x4a3a5a }), couchD = mat({ color: 0x3a2c48 });
  const couch = new THREE.Group(); couch.position.set(.3, 0, .55); scene.add(couch);
  couch.add(box(2.3, .36, .9, couchD, 0, .18, .05)); couch.add(box(2.1, .14, .78, couchM, 0, .41, .1)); couch.add(box(2.3, .85, .26, couchM, 0, .5, -.38)); for (const s of [-1, 1]) couch.add(box(.24, .62, .9, couchD, s * 1.15, .31, .05));
  { const pil = box(.5, .4, .14, mat({ color: 0xc8a050 }), -.75, .62, -.22); pil.rotation.z = .2; couch.add(pil); }
  const lamp = new THREE.Group(); lamp.position.set(1.85, 0, .2); scene.add(lamp);
  lamp.add(box(.3, .04, .3, mat({ color: 0x222222 }), 0, .02, 0)); lamp.add(box(.04, 1.6, .04, mat({ color: 0x222222 }), 0, .8, 0));
  const shade_ = new THREE.Mesh(new THREE.CylinderGeometry(.18, .3, .32, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd8a0, side: THREE.DoubleSide })); shade_.position.y = 1.78; lamp.add(shade_); S.shade = shade_;
  const table = new THREE.Group(); table.position.set(.3, 0, 1.75); scene.add(table);
  table.add(box(1.3, .06, .7, mat({ color: 0x5a3a22 }), 0, .42, 0)); for (const [x, z] of [[-.58, -.28], [.58, -.28], [-.58, .28], [.58, .28]]) table.add(box(.06, .4, .06, mat({ color: 0x4a2e1a }), x, .2, z));
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(.05, .045, .1, 8), mat({ color: 0xe8e2d4 })); mug.position.set(.42, .5, .1); table.add(mug);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), mat({ map: rugT })); rug.rotation.x = -Math.PI / 2; rug.position.set(.3, .005, 1.5); scene.add(rug);
  scene.add(box(1.6, .5, .45, mat({ color: 0x2a2228 }), .3, .25, 3.2)); scene.add(box(1.3, .78, .08, mat({ color: 0x0c0c0e }), .3, .9, 3.2));
  const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .68), bmat({ map: tvT.t, fog: false })); tvScr.position.set(.3, .9, 3.155); tvScr.rotation.y = Math.PI; scene.add(tvScr); S.tvScr = tvScr;
  const shelf = new THREE.Group(); shelf.position.set(-3.75, 0, 1.2); scene.add(shelf); shelf.add(box(.4, 2.0, 1.2, mat({ color: 0x4a3222 }), 0, 1.0, 0)); const rb = rng(31); for (let s = 0; s < 4; s++) for (let i = 0; i < 6; i++) shelf.add(box(.28, .3, .1, mat({ color: [0x8a2a2a, 0x2a5a8a, 0xc8a050, 0x3a6a3a, 0xd8d2c2][(s * 6 + i) % 5] }), .05, .25 + s * .48, -.45 + i * .17 + rb() * .02));
  for (const [x, y, c] of [[-1.4, 1.9, 0x3a6a8a], [2.4, 1.85, 0x8a6a3a]]) { scene.add(box(.6, .45, .04, mat({ color: 0x2a1c12 }), x, y, -2.97)); scene.add(box(.5, .35, .02, mat({ color: c }), x, y, -2.95)); }
  const plant = new THREE.Group(); plant.position.set(-3.5, 0, -2.5); scene.add(plant); { const pot = new THREE.Mesh(new THREE.CylinderGeometry(.2, .15, .4, 7), mat({ color: 0x8a4a2a })); pot.position.y = .2; plant.add(pot); } for (let i = 0; i < 5; i++) { const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(.22, 0), mat({ color: 0x2a5a2a })); lf.position.set(Math.cos(i * 1.3) * .15, .55 + i * .1, Math.sin(i * 1.3) * .15); plant.add(lf); }
  // outside: porch, mat, lawn, street, lamp, houses
  const porch = uvBox(2.6, .1, 1.7, mat({ map: walkT }), -2.6, .05, -3.95, 1); scene.add(porch);
  const dm = new THREE.Mesh(new THREE.BoxGeometry(.95, .025, .55), mat({ map: matT })); dm.position.set(-2.6, .11, -3.6); scene.add(dm);
  scene.add(box(.18, .25, .12, mat({ color: 0x1a1a1a }), -3.55, 2.25, -3.2)); scene.add(box(.1, .14, .06, bmat({ color: 0xffe0a0 }), -3.55, 2.22, -3.27));
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), mat({ map: grassT })); lawn.material.map.repeat.set(20, 3); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0, -6); scene.add(lawn);
  scene.add(uvBox(1.0, .04, 4, mat({ map: walkT }), -2.6, .02, -6.3, 1));
  scene.add(uvBox(40, .08, 1.2, mat({ map: walkT }), 0, .04, -9.6, 1));
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 4.6), mat({ map: roadT })); road.material.map.repeat.set(20, 2); road.rotation.x = -Math.PI / 2; road.position.set(0, .001, -12.5); scene.add(road);
  for (let x = -20; x < 20; x += 2) scene.add(box(1, .01, .1, bmat({ color: 0xc8a83a }), x, .01, -12.5));
  scene.add(uvBox(40, .08, 1.4, mat({ map: walkT }), 0, .04, -15.5, 1));
  const lawn2 = new THREE.Mesh(new THREE.PlaneGeometry(60, 12), mat({ map: grassT })); lawn2.rotation.x = -Math.PI / 2; lawn2.position.set(0, 0, -22); scene.add(lawn2);
  const mbox = new THREE.Group(); mbox.position.set(-1.4, 0, -8.6); scene.add(mbox); mbox.add(box(.06, 1.0, .06, mat({ color: 0x3a2a1a }), 0, .5, 0)); mbox.add(box(.24, .22, .42, mat({ color: 0x2a3a5a }), 0, 1.1, 0));
  // street lamp across the road, the man under it
  const sl = new THREE.Group(); sl.position.set(1.7, 0, -16.0); scene.add(sl); const pm = mat({ color: 0x1e2024 });
  sl.add(box(.12, 4.3, .12, pm, 0, 2.15, 0)); sl.add(box(1.0, .08, .08, pm, -.5, 4.25, 0)); sl.add(box(.36, .12, .26, pm, -.95, 4.18, 0));
  const bulbM = bmat({ color: 0xfff0b0, fog: false }); sl.add(box(.28, .03, .2, bulbM, -.95, 4.1, 0));
  const spot = new THREE.SpotLight(0xffd890, 70, 9, .55, .55, 1.3); spot.position.set(.75, 4.08, -16.0); spot.target.position.set(.6, 0, -15.7); scene.add(spot, spot.target); spot.castShadow = true; spot.shadow.mapSize.set(512, 512); spot.shadow.bias = -.002;
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(.12, 2.1, 4.0, 14, 1, true), glowMat(0xffd890, .09)); cone.position.set(.72, 2.05, -15.9); scene.add(cone);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.0, 16), glowMat(0xffd890, .14)); pool.rotation.x = -Math.PI / 2; pool.position.set(.65, .09, -15.8); scene.add(pool);
  S.streetLamp = on => { spot.intensity = on ? 70 : 0; cone.visible = pool.visible = on; bulbM.color.setHex(on ? 0xfff0b0 : 0x3a3a30); };
  for (const x of [-11, 13]) { const l2 = new THREE.Group(); l2.position.set(x, 0, -16); l2.add(box(.1, 4.1, .1, pm, 0, 2.05, 0)); l2.add(box(.3, .1, .2, bmat({ color: 0xffe8a0, fog: false }), -.3, 4.1, 0)); scene.add(l2); const p2 = new THREE.PointLight(0xffd890, 12, 7); p2.position.set(x - .3, 3.8, -16); scene.add(p2); }
  [[-6.5, 0x6a7a8a, [[-1, 1.3, 1], [1, 1.3, 0], [-1, 2.2, 0]]], [0, 0x8a6a5a, [[-1, 1.3, 0], [1, 2.2, 0]]], [6.5, 0x5a6a5a, [[-1, 1.3, 1], [1, 1.3, 1]]]].forEach(([x, c, w]) => { const hs = makeHouse(c, w); hs.position.set(x, 0, -21); scene.add(hs); });
  for (const [x, z, s] of [[-3.8, -18.5, 1.2], [3.6, -18.8, 1.4], [-9.5, -18, 1.1], [9.6, -18.2, 1.3], [-5.5, -7, 1.3], [4.5, -6.5, 1.5]]) { const tr = makeTree(s); tr.position.set(x, 0, z); scene.add(tr); }
  const moonD = new THREE.Mesh(new THREE.CircleGeometry(1.3, 16), bmat({ color: 0xf2eedc, fog: false })); moonD.position.set(9, 14, -48); scene.add(moonD); const mg = new THREE.Mesh(new THREE.CircleGeometry(3.2, 16), glowMat(0x8aa0d8, .5, true)); mg.position.set(9, 14, -48.1); scene.add(mg);
  // people + boxes
  const hero = makeHuman(HERO); scene.add(hero.root); S.hero = hero;
  const str = coat(hat(makeHuman(STR))); str.root.position.set(.6, 0, -15.6); scene.add(str.root); S.str = str;
  const strBox = makePkg(); scene.add(strBox); S.strBox = strBox; str.root.visible = strBox.visible = false;
  const pkg = makePkg(); pkg.position.set(-2.6, .123, -3.62); scene.add(pkg); S.pkg = pkg;
  return S;
}
// TV picture: flickering blue light, redrawn per frame
function tvFlicker(S, t, a = 1) { const v = .55 + .25 * Math.sin(t * 7.3) + .2 * Math.sin(t * 17.1 + 1) * Math.sin(t * 2.1); S.tvL.intensity = 5 * v * a; const g = tvT.g; g.fillStyle = `rgb(${40 + 60 * v | 0},${70 + 80 * v | 0},${140 + 100 * v | 0})`; g.fillRect(0, 0, 32, 24); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, (t * 40 % 24) | 0, 32, 2); tvT.t.needsUpdate = true; }
// the stranger holding his box in front of his chest (hands on its sides)
function strangerHold(S, t, k = 1) { const h = S.str; h.reset(); h.breathe(t, .6); const c = wp(h.torso, 0, .15, .42); S.strBox.position.set(c.x, c.y - .15, c.z); S.strBox.rotation.set(0, 0, 0); ik(h, 0, V(c.x - .25, c.y, c.z)); ik(h, 1, V(c.x + .25, c.y, c.z)); }

// ---------- timing: shots are cut on the original voiceover clock; animation runs on the final (edited) clock ----------
const cutInfo = await (await fetch('/build/cuts.json')).json();
const tm = t => (t - cutInfo.cuts.reduce((s, [a, b]) => s + (t > a ? Math.min(t, b) - a : 0), 0)) / cutInfo.speed;
const toOriginal = tc => { let t = tc * cutInfo.speed; for (const [a, b] of cutInfo.cuts) { if (t >= a) t += b - a; else break; } return t; };
const TOTAL = cutInfo.duration;
const shots = [];
const shot = (t0, t1, build, dof = null) => { const s = { t0, t1, f0: tm(t0), f1: t1 > 90 ? TOTAL : tm(t1), dof, ...build(t0) }; s.scene.traverse(o => { if (o.isMesh) { const m = Array.isArray(o.material) ? o.material[0] : o.material; const basic = m.isMeshBasicMaterial || m.isShaderMaterial; o.castShadow = !basic && !m.transparent; o.receiveShadow = !basic; } }); shots.push(s); };
const at = (t0, o) => tm(o) - tm(t0);   // when (in final seconds, from the shot start) an original-clock moment happens

// 1a "He heard a knock" - on the couch, TV light; his head snaps round at the knock
shot(0, 3.55, t0 => { const S = house(), K = at(t0, 2.92);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); h.root.position.set(.3, 0, .62); h.root.rotation.y = 0; h.sit(); h.breathe(t);
    h.fore.forEach(fr => fr.rotation.x = -.9); h.arms.forEach(a => a.rotation.x = -.35);
    const k = spring((f - K) * 1.2); h.neck.rotation.y = .3 - 1.35 * k; h.head.rotation.y = -.25 * k; h.torso.rotation.y = -.28 * clamp(k); h.head.rotation.x = .08 * (1 - clamp(k));
    h.face(f > K ? 'glance' : 'neutral', t); tvFlicker(S, t); S.curtain(0);
    const fc = faceAt(h); look(S.cam, fc.x - .75, fc.y + .05, fc.z + 1.15 - f * .12, fc.x - .1, fc.y - .12, fc.z); handheld(S.cam, t, .004);
    if (f > K) { S.cam.fov = 45 - 6 * spring((f - K) * 1.5); S.cam.updateProjectionMatrix(); }
  } }; }, { b: 2, x: .5, y: .44, r: .3 });
// 1b "on the door." - the front door from inside, rattling under the knocks; porch light under the gap
shot(3.55, 5.3, t0 => { const S = house();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.hero.root.visible = false; S.doorGap.opacity = .9; S.curtain(0); tvFlicker(S, t, .6);
    const kn = [.05, .24, .43].reduce((a, k) => a + (f > k ? Math.exp(-(f - k) * 30) : 0), 0); S.door.position.z = -3.07 + kn * .018; S.door.rotation.y = -kn * .006;
    look(S.cam, -2.25, 1.15, -.9 - f * .25, -2.6, 1.1, -3.07); shake(S.cam, t, kn * .012); handheld(S.cam, t, .003);
  } }; }, { b: 1.6, x: .5, y: .5, r: .36 });
// 2 "He walked over and opened it," - walk to the door (bent knees, swinging arms), reach, pull it open
shot(5.3, 8.2, t0 => { const S = house(), P0 = V(-.7, 0, -.1), P1 = V(-1.8, 0, -2.42), WK = 1.15, OP = 1.42;
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(0); tvFlicker(S, t, .7);
    const k = clamp(f / WK), e = ss(0, 1, k * .92 + .08 * k * k); h.root.position.copy(vl(P0, P1, e)); h.root.rotation.y = lerp(Math.atan2(P1.x - P0.x, P1.z - P0.z), -Math.PI, ss(.75, 1, k));
    if (f < WK) h.walk(e * 9.5, .5 * (1 - ss(.85, 1, k))); else { h.breathe(t); }
    const op = ss(OP, fd - .05, f); S.door.rotation.y = -1.15 * op; S.doorGap.opacity = .9 * (1 - op);
    if (f > WK - .15) { const kn = S.knob(), rest = handAt(h, 1); const r = ss(WK - .15, OP, f); ik(h, 1, r < 1 ? vl(rest, kn, r) : kn); h.torso.rotation.x = .08 * r; h.neck.rotation.x = .1; }
    h.face(f > OP ? 'worried' : 'neutral', t);
    const sw = ss(WK - .35, WK + .25, f), c = vl(V(-.75, 1.5, -2.75), V(1.0, 1.85, .4), sw), tg = vl(wp(h.torso, 0, .45, 0), V(-2.3, 1.15, -3.0), sw);
    lookV(S.cam, c, tg); handheld(S.cam, t, .004);
  } }; }, { b: 1.6, x: .5, y: .46, r: .36 });
// 3 "but nobody was there." - over his shoulder, out the open door: empty porch, empty street, wind
shot(8.2, 11.0, t0 => { const S = house(), lv = leaves(S.scene, 14);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(0); S.door.rotation.y = -1.5; S.doorGap.opacity = 0; S.str.root.visible = S.strBox.visible = false; S.pkg.visible = false; S.streetLamp(true);
    h.root.position.set(-2.0, 0, -2.5); h.root.rotation.y = Math.PI; h.breathe(t); h.neck.rotation.y = Math.sin(f * 2.4) * .5 * ss(.1, .5, f); h.head.rotation.x = -.05; h.face('worried', t);
    leavesAt(lv, t); look(S.cam, -2.75, 1.72, -1.35 - f * .2, -2.6, 1.15, -10); handheld(S.cam, t, .004);
  } }; }, { b: 1.6, x: .42, y: .4, r: .4 });
// 4 "Just a small box on the doormat," - tilt down from the street to the box
shot(11.0, 13.0, t0 => { const S = house(), lv = leaves(S.scene, 8);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.hero.root.visible = false; S.door.rotation.y = -1.5; S.doorGap.opacity = 0; S.str.root.visible = S.strBox.visible = false; S.curtain(0); leavesAt(lv, t);
    const k = ss(.0, .85, f); look(S.cam, -2.6, 1.3 - f * .1, -2.65 - f * .1, -2.6, lerp(1.0, .2, k), lerp(-8, -3.62, k)); handheld(S.cam, t, .003);
  } }; }, { b: 1.8, x: .5, y: .55, r: .3 });
// 5 "with his name on it." - close on the label: TO: TOM
shot(13.0, 14.5, t0 => { const S = house();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.hero.root.visible = false; S.door.rotation.y = -1.5; S.str.root.visible = S.strBox.visible = false;
    const lab = wp(S.pkg, -.04, .14, .18); look(S.cam, lab.x + .2 - f * .06, lab.y + .12, lab.z + .55 - f * .1, lab.x, lab.y, lab.z); handheld(S.cam, t, .003);
  } }; }, { b: 2.2, x: .5, y: .5, r: .3 });
// 6 "No stamp. No return address." - red marks pop over the empty stamp square and the blank FROM line
shot(14.5, 17.15, t0 => { const S = house(), A = at(t0, 14.8), B = at(t0, 15.45), red = bmat({ color: 0xe8202a, fog: false });
  const xs = [V(.15, .22, .19), V(-.07, .24, .19)].map((p, i) => { const g = new THREE.Group(); for (const s of [-1, 1]) { const b = box(i ? .2 : .085, .014, .004, red); b.rotation.z = s * (i ? .2 : .78); g.add(b); } g.position.copy(p); S.pkg.add(g); return g; });
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.hero.root.visible = false; S.door.rotation.y = -1.5; S.str.root.visible = S.strBox.visible = false;
    xs[0].scale.setScalar(pop(f - A)); xs[1].scale.setScalar(pop(f - B));
    const p = wp(S.pkg, lerp(.14, -.06, ss(B - .25, B + .05, f)), .22, .18); look(S.cam, p.x + .05, p.y + .06, p.z + .58, p.x, p.y, p.z); handheld(S.cam, t, .003);
  } }; }, { b: 2.2, x: .5, y: .5, r: .32 });
// 7 "He brought it inside and shook it." - box up by his ear, shaking it
shot(17.15, 19.05, t0 => { const S = house();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(0); tvFlicker(S, t, .8); S.pkg.visible = true; S.door.rotation.y = 0;
    h.root.position.set(-.2, 0, -.6); h.root.rotation.y = .25; h.breathe(t);
    const sk = ss(.35, .55, f), shakeX = Math.sin(t * 34) * .045 * sk; h.neck.rotation.z = -.25 * sk; h.neck.rotation.y = .2 * sk;
    const ear = earAt(h, 1), c = ear.clone().add(V(.24 + shakeX, -.12, .1)); S.pkg.position.set(c.x, c.y - .15, c.z); S.pkg.rotation.set(0, .25, Math.sin(t * 34) * .08 * sk);
    ik(h, 1, V(c.x + .2, c.y - .02, c.z)); ik(h, 0, V(c.x - .23, c.y - .04, c.z));
    h.face(sk > .5 ? 'listen' : 'neutral', t);
    const fc = faceAt(h); look(S.cam, fc.x - .4, fc.y - .02, fc.z + 1.45 - f * .15, fc.x + .18, fc.y - .1, fc.z); handheld(S.cam, t, .004);
  } }; }, { b: 1.8, x: .55, y: .45, r: .34 });
// 8 "Something was ticking." - tight on ear + box; a ring pulses out of the box on every tick
shot(19.05, 21.1, t0 => { const S = house(), rg = rings(S.scene, 3, 0xffffff);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(0); tvFlicker(S, t, .8); S.door.rotation.y = 0;
    h.root.position.set(-.2, 0, -.6); h.root.rotation.y = .25; h.breathe(t, .4); h.neck.rotation.z = -.25; h.neck.rotation.y = .2;
    const ear = earAt(h, 1), c = ear.clone().add(V(.24, -.12, .1)), tick = Math.exp(-((f * 2) % 1) * 9); S.pkg.position.set(c.x, c.y - .15, c.z); S.pkg.rotation.set(0, .25, 0); S.pkg.scale.setScalar(1 + tick * .025);
    ik(h, 1, V(c.x + .2, c.y - .02, c.z)); ik(h, 0, V(c.x - .23, c.y - .04, c.z)); h.face(f > .5 ? 'stare' : 'listen', t);
    ringsAt(rg, f, c, S.cam, .35, 2, .9); const mid = ear.clone().lerp(c, .55); look(S.cam, mid.x - .35, mid.y + .02, mid.z + 1.0 - f * .16, mid.x, mid.y - .02, mid.z); handheld(S.cam, t, .003);
  } }; }, { b: 2, x: .5, y: .48, r: .36 });
// 9 "He slowly opened the box," - from above: on the coffee table, his hands lift the flaps
shot(21.1, 23.5, t0 => { const S = house();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(0); tvFlicker(S, t, .8); S.door.rotation.y = 0;
    h.root.position.set(.3, 0, .85); h.sit(); h.torso.rotation.x = .5; h.neck.rotation.x = .35; h.face('worried', t);
    S.pkg.position.set(.3, .45, 1.68); S.pkg.rotation.set(0, Math.PI, 0); const op = ss(.12, fd - .05, f); S.pkg.userData.open(op);
    const fl = S.pkg.userData.flaps; ik(h, 0, wp(fl[1], .1, .02, -.17)); ik(h, 1, wp(fl[0], -.1, .02, .17));
    look(S.cam, 1.05 + Math.sin(f * .8) * .05, 2.0 - f * .15, 2.3, .3, .55, 1.62); handheld(S.cam, t, .003);
  } }; }, { b: 1.8, x: .5, y: .5, r: .36 });
// 10 "and inside was an old phone." - push into the box: an old brick phone in shredded paper
shot(23.5, 25.7, t0 => { const S = house(), ph = makePhone(); S.scene.add(ph); const sh = shreds(S.pkg, 70, .4, .3, .03); const fill = new THREE.PointLight(0xffd0a0, 2.5, 2); S.scene.add(fill);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(0); tvFlicker(S, t, .8); h.root.position.set(.3, 0, .85); h.sit(); h.torso.rotation.x = .5;
    S.pkg.position.set(.3, .45, 1.68); S.pkg.rotation.set(0, Math.PI, 0); S.pkg.userData.open(1);
    ph.position.set(.3, .45 + .09, 1.68); ph.rotation.set(-Math.PI / 2, 0, .3); fill.position.set(.3, 1.2, 1.9);
    look(S.cam, .42, lerp(1.5, 1.08, ss(0, fd, f)), lerp(2.15, 1.95, ss(0, fd, f)), .3, .5, 1.68); handheld(S.cam, t, .003);
  } }; }, { b: 1.8, x: .5, y: .5, r: .3 });
// 11 "Then it started ringing." - the screen lights up, it buzzes in the paper; then his face, lit green
shot(25.7, 27.8, t0 => { const S = house(), ph = makePhone(); S.scene.add(ph); const sh = shreds(S.pkg, 70, .4, .3, .03), rg = rings(S.scene, 3, 0xa8f08a), R = at(t0, 25.95), SW = 1.0, gl = new THREE.PointLight(0x9cff7a, 0, 2.5); S.scene.add(gl);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(0); tvFlicker(S, t, .5); h.root.position.set(.3, 0, .85); h.sit(); h.torso.rotation.x = .45; h.neck.rotation.x = .3;
    S.pkg.position.set(.3, .45, 1.68); S.pkg.rotation.set(0, Math.PI, 0); S.pkg.userData.open(1);
    const on = f > R, buzz = on ? Math.sin(t * 60) * .008 * (Math.sin(t * 9) > -.2 ? 1 : 0) : 0;
    ph.position.set(.3 + buzz, .54, 1.68 + buzz * .5); ph.rotation.set(-Math.PI / 2, 0, .3 + buzz * 3); ph.userData.draw(on, t); gl.position.set(.3, .75, 1.68); gl.intensity = on ? 4 + Math.sin(t * 14) * 1.5 : 0;
    sh.forEach(s => s.position.y = s.userData.y + (on ? Math.abs(Math.sin(t * 50 + s.userData.a * 9)) * .006 : 0));
    if (f < SW) { ringsAt(rg, f, V(.3, .6, 1.68), S.cam, .25, 2.2, on ? 1 : 0); look(S.cam, .4, 1.05, 2.0, .3, .52, 1.68); handheld(S.cam, t, .003); h.face('worried', t); }
    else { rg.forEach(r => r.visible = false); h.face('shocked', t); const fc = faceAt(h); look(S.cam, fc.x - .55, fc.y - .3, fc.z + .45, fc.x, fc.y - .05, fc.z); shake(S.cam, t, .004); }
  } }; }, { b: 1.8, x: .5, y: .5, r: .32 });
// 12 "He picked it up, and a voice whispered," - phone to his ear, listening
shot(27.8, 30.2, t0 => { const S = house(), ph = makePhone(); S.scene.add(ph); shreds(S.pkg, 50, .4, .3, .03); const gl = new THREE.PointLight(0x9cff7a, 3, 1.6), WH = at(t0, 29.35); S.scene.add(gl);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(0); tvFlicker(S, t, .7); h.root.position.set(.3, 0, .85); h.sit();
    const k = ss(0, .55, f); h.torso.rotation.x = lerp(.45, .08, k); h.neck.rotation.x = lerp(.3, 0, k); h.breathe(t, .5);
    S.pkg.position.set(.3, .45, 1.68); S.pkg.rotation.set(0, Math.PI, 0); S.pkg.userData.open(1);
    const ear = earAt(h, 1).add(V(.04, -.06, .02)), p = vl(V(.3, .54, 1.68), ear, k); p.y += Math.sin(k * Math.PI) * .25; ph.position.copy(p); ph.rotation.set(lerp(-Math.PI / 2, 0, k), lerp(0, -.3, k), lerp(.3, -.2, k)); ph.userData.draw(f < .5, t); gl.position.copy(p).add(V(0, 0, .2)); gl.intensity = f < .5 ? 3 : 0;
    ik(h, 1, p.clone().add(V(.04, -.08, 0))); h.neck.rotation.z = -.12 * k; h.face(f > WH ? 'stare' : f > .55 ? 'listen' : 'worried', t);
    const fc = faceAt(h); look(S.cam, fc.x - .35, fc.y + .02, fc.z + 1.15 - f * .25, fc.x + .05, fc.y - .06, fc.z); handheld(S.cam, t, .004);
  } }; }, { b: 1.8, x: .5, y: .45, r: .32 });
// 13 "look out your window." - from behind him: his head turns slowly to the curtained window; moonlight leaks between the curtains
shot(30.2, 32.5, t0 => { const S = house(), ph = makePhone(); S.scene.add(ph);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(Math.sin(t * .8) * .01 + .01); tvFlicker(S, t, .9); h.root.position.set(.3, 0, .85); h.sit(); h.torso.rotation.x = .08; h.breathe(t, .5);
    S.pkg.position.set(.3, .45, 1.68); S.pkg.rotation.set(0, Math.PI, 0); S.pkg.userData.open(1);
    const ear = earAt(h, 1).add(V(.04, -.06, .02)); ph.position.copy(ear); ph.rotation.set(0, -.3, -.2); ik(h, 1, ear.clone().add(V(.04, -.08, 0)));
    const k = ss(.25, fd - .2, f); h.neck.rotation.y = 1.2 * k; h.torso.rotation.y = .35 * k; h.face('glance', t);
    look(S.cam, lerp(1.1, .75, ss(0, fd, f)), 1.42, lerp(2.7, 1.8, ss(0, fd, f)), lerp(.4, 0, k), 1.45, -3); handheld(S.cam, t, .004);
  } }; }, { b: 1.8, x: .5, y: .42, r: .4 });
// 14 "He looked outside," - from outside the glass: the curtains part, his face in the window
shot(32.5, 33.7, t0 => { const S = house();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); tvFlicker(S, t, .9); S.str.root.visible = S.strBox.visible = false; S.pkg.visible = false;
    h.root.position.set(.02, 0, -2.42); h.root.rotation.y = Math.PI; h.breathe(t); const k = ss(.05, .55, f); S.curtain(k); h.face('worried', t);
    ik(h, 0, V(lerp(.42, 1.0, k), 1.55, -2.84)); ik(h, 1, V(lerp(-.42, -1.0, k), 1.6, -2.84));
    look(S.cam, .3, 1.82, -4.3 + f * .25, .02, 1.85, -2.6); handheld(S.cam, t, .003);
  } }; }, { b: 1.4, x: .5, y: .38, r: .4 });
// 15 "and saw a man across the street," - his view: the street lamp flickers on, and someone is standing under it
shot(33.7, 36.0, t0 => { const S = house();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.hero.root.visible = false; S.curtain(1); S.pkg.visible = false; strangerHold(S, t);
    const on = f > .55 || [[.1, .18], [.3, .36], [.42, .47]].some(([a, b]) => f > a && f < b); S.streetLamp(on); S.str.root.visible = S.strBox.visible = on; S.str.face('stare', t);
    S.cam.fov = lerp(42, 24, ss(.5, fd, f)); S.cam.updateProjectionMatrix(); look(S.cam, .38, 1.98, -2.62, .6, 1.3, -15.6); handheld(S.cam, t, .003);
  } }; }, null);
// 16 "holding the exact same box." - closer: the man, still, the box in his hands, TO: TOM
shot(36.0, 38.85, t0 => { const S = house();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.hero.root.visible = false; S.str.root.visible = S.strBox.visible = true; S.pkg.visible = false; S.streetLamp(true); strangerHold(S, t); S.str.face('stare', t); S.str.neck.rotation.z = .08;
    const b = wp(S.strBox, 0, .15, .18), k = ss(0, fd, f); S.cam.fov = 32; S.cam.updateProjectionMatrix(); look(S.cam, .6, 1.45, lerp(-11.6, -13.3, k), .6, lerp(1.5, b.y, ss(.3, fd, f)), -15.6); handheld(S.cam, t, .003);
  } }; }, { b: 1.6, x: .5, y: .48, r: .36 });
// 17 "The man smiled," - tight on his face under the hat; the smile grows
shot(38.85, 40.1, t0 => { const S = house(), SM = at(t0, 39.3);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.hero.root.visible = false; S.str.root.visible = S.strBox.visible = true; S.pkg.visible = false; S.streetLamp(true); strangerHold(S, t); S.str.face(f > SM ? 'creep' : 'stare'); S.str.neck.rotation.z = .08 + ss(SM, SM + .6, f) * .1;
    const fc = faceAt(S.str); S.cam.fov = 38; S.cam.updateProjectionMatrix(); look(S.cam, fc.x + .05, fc.y - .02, fc.z + .95 - f * .2, fc.x, fc.y - .01, fc.z); handheld(S.cam, t, .002);
  } }; }, { b: 2, x: .5, y: .45, r: .34 });
// 18 "and pointed at him." - he raises his arm straight at the window; dolly-zoom on the street
shot(40.1, 42.5, t0 => { const S = house();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.hero.root.visible = false; S.str.root.visible = S.strBox.visible = true; S.pkg.visible = false; S.curtain(1); S.streetLamp(true); strangerHold(S, t); const h = S.str; h.face('creep');
    const c = wp(h.torso, 0, .15, .42); S.strBox.position.set(c.x - .08, c.y - .2, c.z); ik(h, 0, V(c.x - .3, c.y - .05, c.z));
    const k = spring((f - .1) * 1.4), sh = wp(h.torso, .42, .63, 0), aim = V(.02, 1.75, -2.75).sub(sh).normalize(); ik(h, 1, vl(sh.clone().add(V(.1, -.7, .1)), sh.clone().add(aim.multiplyScalar(.76)), clamp(k, 0, 1.05)));
    const d = ss(.15, fd, f), cz = lerp(-4.2, -9.5, d), dist0 = 15.6 - 4.2, dist = 15.6 + cz; S.cam.fov = 2 * Math.atan(Math.tan(9 * Math.PI / 180) * dist0 / dist) * 180 / Math.PI; S.cam.updateProjectionMatrix();
    look(S.cam, -1.5, 1.75, cz, .6, 1.55, -15.6);
  } }; }, null);
// 19 "Then he heard another knock." - inside, at the window: he freezes, then the knock lands
shot(42.5, 44.55, t0 => { const S = house(), K = at(t0, 43.65);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(1); tvFlicker(S, t, .9); S.pkg.visible = false; S.str.root.visible = S.strBox.visible = false;
    h.root.position.set(.05, 0, -2.15); h.root.rotation.y = Math.PI; h.breathe(t, .5); const j = spring((f - K) * 1.3); h.body.position.y = -.03 * clamp(j); h.neck.rotation.x = -.08 * clamp(j); h.arms.forEach((a, i) => { a.rotation.x = -.25 * clamp(j); a.rotation.z = (i ? 1 : -1) * .25 * clamp(j); }); h.fore.forEach(fr => fr.rotation.x = -.6 * clamp(j));
    h.face(f > K ? 'terror' : 'worried', t);
    const fc = faceAt(h); S.cam.fov = 40 - 8 * clamp(j); S.cam.updateProjectionMatrix(); look(S.cam, fc.x - .35, fc.y - .02, fc.z - .95, fc.x, fc.y - .05, fc.z); if (f > K) shake(S.cam, t, .01 * Math.exp(-(f - K) * 4)); handheld(S.cam, t, .003);
  } }; }, { b: 1.8, x: .5, y: .45, r: .32 });
// 20 "But this time," - from behind: his head turns first, then his body, toward the closet
shot(44.55, 45.9, t0 => { const S = house();
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    const h = S.hero; h.reset(); S.curtain(1); tvFlicker(S, t, .9); S.pkg.visible = false;
    const k1 = ss(.05, fd * .8, f), k2 = ss(.35, fd, f); h.root.position.set(.05, 0, -2.15); h.root.rotation.y = Math.PI - .9 * k2; h.neck.rotation.y = .55 * k1; h.face('terror', t); h.breathe(t, 1.5);
    const fc = faceAt(h); look(S.cam, -1.5, 1.85, -.2, lerp(fc.x, 2.5, ss(.45, fd, f)), lerp(fc.y - .1, 1.5, ss(.45, fd, f)), lerp(fc.z, -1.2, ss(.45, fd, f))); handheld(S.cam, t, .004);
  } }; }, { b: 1.6, x: .5, y: .42, r: .36 });
// 21 "it came from inside his closet." - push in on the closet: three knocks shake it, the lamp dies, it opens a crack... eyes
shot(45.9, 99, t0 => { const S = house(), CL = at(t0, 47.5), fq = flashQuad(S.cam, 0x000000);
  return { scene: S.scene, cam: S.cam, update(f, fd, t) {
    S.hero.root.visible = false; S.curtain(1); S.pkg.visible = false;
    const kn = [CL + .02, CL + .24, CL + .46].reduce((a, k) => a + (f > k ? Math.exp(-(f - k) * 26) : 0), 0);
    S.closet.position.x = 4.03 - kn * .02; const op = ss(CL + .9, CL + 1.75, f); S.closet.rotation.y = kn * .01 + op * .5; S.eyes.visible = f > CL + 1.25;
    const dim = f > CL + .7 ? (f < CL + .85 ? (Math.sin(t * 60) > 0 ? 1 : 0) : 0) : 1; S.lampS.intensity = 26 * dim; S.lampP.intensity = 7 * dim; S.shade.material.color.setHex(dim ? 0xffd8a0 : 0x3a3020); tvFlicker(S, t, dim ? .9 : .35);
    const k = ss(0, fd, f); look(S.cam, lerp(.4, 2.3, k), lerp(1.62, 1.66, k), lerp(-2.6, -2.09, k), lerp(4.0, 4.3, k), lerp(1.4, 1.6, k), lerp(-1.1, -1.33, k)); shake(S.cam, t, kn * .02); handheld(S.cam, t, .004);
    fq.material.opacity = ss(fd - .35, fd - .02, f);
  } }; }, { b: 1.6, x: .52, y: .45, r: .36 });

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
