// "The Chicken That Lived Without A Head" - PS1-style low-poly short, rendered frame by frame.
// (engine section shared with ../invisible-short)
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 35.352;
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
      '#include <project_vertex>\n gl_Position.xy = floor(gl_Position.xy / gl_Position.w * vec2(135., 240.) + .5) / vec2(135., 240.) * gl_Position.w;');
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
    for (const cx of [15, 49]) { gr = g.createRadialGradient(cx, 41, 0, cx, 41, 9); gr.addColorStop(0, 'rgba(210,70,60,.3)'); gr.addColorStop(1, 'rgba(210,70,60,0)'); g.fillStyle = gr; g.fillRect(0, 28, 64, 26); }
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
    } else if (style === 'overalls') {
      g.fillStyle = '#34558c'; g.fillRect(8, 11, 16, 21); g.fillRect(8, 0, 3, 12); g.fillRect(21, 0, 3, 12); g.fillStyle = '#e8c33a'; g.fillRect(9, 11, 2, 2); g.fillRect(21, 11, 2, 2); g.strokeStyle = '#24406e'; g.strokeRect(12.5, 16.5, 7, 6);
    } else if (style === 'pants') {
      g.strokeStyle = shade(hex, .6); g.beginPath(); g.moveTo(16, 0); g.lineTo(16, 32); g.stroke();
    }
    noise(g, 32, 32, 22, 5);
  });
}
const mosaicTex = ctex(6, 4, g => { const r = rng(4); for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) { const v = 150 + r() * 90 | 0; g.fillStyle = `rgb(${v},${v * .78 | 0},${v * .66 | 0})`; g.fillRect(x, y, 1, 1); } });

// ---------- character ----------
function makeHuman(p) {
  const T = p.thermal, mk = T ? bmat : mat;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const baseSkin = new THREE.Color(T ? 0xdcdcdc : p.skin), ghostC = new THREE.Color(0xa8dcff);
  const skinM = mk({ color: baseSkin.clone(), transparent: true });
  const faces = {}; for (const e in EXPR) faces[e] = faceTex(T ? { ...p, skin: 0xe8e8e8, hair: 0xa0a0a0, lip: '#cfcfcf', iris: '#777' } : p, e);
  const faceM = mk({ map: faces.neutral, transparent: true });
  const sideM = mk({ map: sideTex(T ? { skin: 0xe0e0e0, hair: 0xa0a0a0 } : p), transparent: true });
  const hairM = mk({ color: T ? 0xa0a0a0 : p.hair, transparent: true });
  const skinAll = [skinM, faceM, sideM, hairM];
  const topM = mk({ map: fabricTex(p.top, 'plain') }), topF = mk({ map: fabricTex(p.top, p.topStyle || 'hoodie') });
  const pantM = mk({ map: fabricTex(p.pants, 'pants') }), shoeM = mk({ color: p.shoes || 0xe6e6e6 });
  const cloth = [], nude = [], skin = [];
  const add = (parent, mesh, list) => { parent.add(mesh); list.push(mesh); return mesh; };
  add(body, box(.62, .72, .36, [topM, topM, topM, topM, topF, topM], 0, 1.17, 0), cloth);
  add(body, box(.6, .16, .35, pantM, 0, .83, 0), cloth);
  add(body, box(.54, .78, .3, skinM, 0, 1.14, 0), nude);
  add(body, box(.18, .12, .18, skinM, 0, 1.56, 0), skin);
  const head = new THREE.Group(); head.position.set(0, 1.6, 0); body.add(head);
  const hg = new THREE.BoxGeometry(.44, .52, .44), pos = hg.attributes.position;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0) { pos.setX(i, pos.getX(i) * .74); pos.setZ(i, pos.getZ(i) * .82); }
  add(head, new THREE.Mesh(hg, [sideM, sideM, hairM, skinM, faceM, hairM]), skin).position.y = .28;
  const hh = p.hairH || .1; add(head, box(.47, hh, .47, hairM, 0, .52 + hh / 2, -.01), skin);
  if (p.cap) { const cm = mk({ color: 0x18223f }); head.add(box(.5, .14, .5, cm, 0, .6, 0)); head.add(box(.46, .04, .26, cm, 0, .54, .34)); head.add(box(.12, .08, .02, mk({ color: 0xe8c33a }), 0, .61, .26)); }
  if (p.straw) { const sm = mk({ color: 0xd9b45a }); head.add(box(.8, .04, .8, sm, 0, .56, 0)); head.add(box(.46, .17, .46, sm, 0, .66, 0)); head.add(box(.47, .05, .47, mk({ color: 0x7a2a1a }), 0, .6, 0)); }
  const arms = [], legs = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * .42, 1.47, 0); body.add(a); arms.push(a);
    add(a, box(.2, .62, .22, topM, 0, -.29, 0), cloth); add(a, box(.17, .17, .19, skinM, 0, -.68, 0), skin); add(a, box(.16, .6, .18, skinM, 0, -.3, 0), nude);
    const l = new THREE.Group(); l.position.set(s * .16, .84, 0); body.add(l); legs.push(l);
    add(l, box(.25, .76, .27, pantM, 0, -.38, 0), cloth); add(l, box(.26, .12, .4, shoeM, 0, -.78, .06), cloth); add(l, box(.2, .84, .22, skinM, 0, -.42, 0), nude);
  }
  const censor = new THREE.Mesh(new THREE.PlaneGeometry(.4, .26), bmat({ map: mosaicTex, color: T ? 0x333333 : 0xffffff })); censor.position.set(0, .8, .2); body.add(censor);
  const Hm = {
    root, body, head, arms, legs, censor,
    face(e) { faceM.map = faces[e]; },
    skin(a) { for (const m of skinAll) m.opacity = a; skin.forEach(m => m.visible = a > .004); if (!T) { skinM.color.copy(baseSkin).lerp(ghostC, (1 - a) * .8); faceM.color.set(0xffffff).lerp(ghostC, (1 - a) * .6); } },
    clothes(v) { cloth.forEach(m => m.visible = v); },
    nude(v) { nude.forEach(m => m.visible = v); censor.visible = v; },
    walk(ph, amp = .6) { legs[0].rotation.x = Math.sin(ph) * amp; legs[1].rotation.x = -Math.sin(ph) * amp; arms[0].rotation.x = -Math.sin(ph) * amp * .8; arms[1].rotation.x = Math.sin(ph) * amp * .8; body.position.y = Math.abs(Math.cos(ph)) * .03; },
    reset() { for (const o of [body, head, ...arms, ...legs]) o.rotation.set(0, 0, 0); body.position.set(0, 0, 0); body.scale.set(1, 1, 1); },
  };
  Hm.nude(false); return Hm;
}
const HERO = { skin: 0xe2a57f, hair: 0x8a4a20, top: 0x2f9a72, pants: 0x3a3d4a, iris: '#3d7a4a', stubble: true, hairH: .14 };
const PED_A = { skin: 0x8a5a3c, hair: 0x1a1410, top: 0x7a3fa0, pants: 0x2a4a7a, hairH: .24, lip: '#7a3838', iris: '#3a2416', topStyle: 'coat' };
const PED_B = { skin: 0xe8b89a, hair: 0xb9b9b9, top: 0xe2b81e, pants: 0x5a4a3a, glasses: true, hairH: .06, topStyle: 'coat', shoes: 0x222222 };
const GUARD = { skin: 0xc98d68, hair: 0x2a2018, top: 0x1f2c4f, pants: 0x1a2038, mustache: true, cap: true, topStyle: 'uniform', shoes: 0x111111, iris: '#5a3a1a' };

// ---------- sets ----------
const skyTex = ctex(64, 128, g => {
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#2f6fd8'); gr.addColorStop(.6, '#7fb8f0'); gr.addColorStop(1, '#d8ecff'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
  const r = rng(21); g.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < 9; i++) { const x = r() * 64, y = 8 + r() * 60; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + (r() - .5) * 16, y + (r() - .5) * 4, 4 + r() * 5, 2 + r() * 2, 0, 0, 7); g.fill(); } }
  noise(g, 64, 128, 8, 2);
});
function facadeTex(wall, seed) {
  return ctex(64, 64, g => {
    g.fillStyle = css(wall); g.fillRect(0, 0, 64, 64);
    g.fillStyle = shade(wall, .8); for (let y = 0; y < 64; y += 4) for (let x = (y / 4 % 2) * 4; x < 64; x += 8) g.fillRect(x, y, 1, 4);
    for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 64, 1);
    const r = rng(seed);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) {
      const x = 5 + i * 20, y = 8 + j * 32;
      g.fillStyle = '#e9e2d0'; g.fillRect(x - 1, y - 1, 16, 22);
      g.fillStyle = r() < .3 ? '#f2d680' : ['#27384d', '#3b5068', '#1c2836'][r() * 3 | 0]; g.fillRect(x, y, 14, 20);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x, y, 14, 4);
      g.fillStyle = '#e9e2d0'; g.fillRect(x + 6.5, y, 1, 20); g.fillRect(x, y + 9.5, 14, 1);
    }
    noise(g, 64, 64, 22, seed);
  }, [2, 3]);
}
const paveTex = ctex(32, 32, g => { g.fillStyle = '#9d9a94'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#7d7a75'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32); g.fillRect(16, 16, 16, 1); g.fillRect(16, 0, 1, 16); noise(g, 32, 32, 26, 9); }, [10, 30]);
const FAC = [facadeTex(0xa5523c, 31), facadeTex(0xd6c39a, 32), facadeTex(0x8d98a3, 33), facadeTex(0xc7785a, 34)];
function lights(scene, amb = 2.0, dir = 2.2) {
  scene.add(new THREE.AmbientLight(0xffffff, amb));
  const d = new THREE.DirectionalLight(0xffffff, dir); d.position.set(3, 6, 5); scene.add(d);
}
const newCam = (fov = 50) => new THREE.PerspectiveCamera(fov, W / H, .1, 300);
function street(thermal) {
  const scene = new THREE.Scene(), mk = thermal ? bmat : mat, dim = thermal ? 0x2a2a2a : 0xffffff;
  scene.background = thermal ? new THREE.Color(0x030303) : skyTex;
  if (!thermal) lights(scene);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 60), mk({ map: paveTex, color: thermal ? 0x1c1c1c : 0xffffff })); ground.rotation.x = -Math.PI / 2; ground.position.z = -8; scene.add(ground);
  const r = rng(77);
  for (const s of [-1, 1]) {
    let z = 8;
    for (let i = 0; i < 6; i++) {
      const h = 7 + r() * 5, d = 5 + r() * 2;
      const b = box(6, h, d, mk({ map: FAC[(i + (s > 0 ? 2 : 0)) % 4], color: thermal ? (i % 2 ? 0x202020 : 0x2c2c2c) : 0xffffff }), s * 7.4, h / 2, z - d / 2); scene.add(b);
      if (i % 2 === 0) scene.add(box(.9, .12, d * .7, mk({ color: thermal ? 0x181818 : [0xd23c3c, 0x2f7fd0, 0x3cab5a][i / 2 | 0] }), s * 4.1, 2.5, z - d / 2));
      z -= d + .15;
    }
  }
  scene.add(box(22, 12, 4, mk({ map: FAC[2], color: dim }), 0, 6, -30));
  const lamp = new THREE.Group(); const lm = mk({ color: thermal ? 0x1a1a1a : 0x2e3338 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 3.4, 6), lm); pole.position.y = 1.7; lamp.add(pole);
  lamp.add(box(.7, .06, .06, lm, -.32, 3.38, 0)); lamp.add(box(.3, .12, .18, mk({ color: thermal ? 0x555555 : 0xfff2b0 }), -.62, 3.32, 0));
  lamp.position.set(2.6, 0, -1.5); scene.add(lamp);
  for (const [x, z] of [[-3.2, -4], [3.3, -9], [-3.3, -14]]) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, 1.6, 5), mk({ color: thermal ? 0x141414 : 0x5a3a22 })); tr.position.set(x, .8, z); scene.add(tr);
    const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(.95, 0), mk({ color: thermal ? 0x101010 : 0x3f9a3c })); lf.position.set(x, 2.3, z); scene.add(lf);
  }
  return { scene, lamp };
}
function swirl(scene, cam, a, b, c) {
  const u = { t: { value: 0 }, a: { value: new THREE.Color(a) }, b: { value: new THREE.Color(b) }, c: { value: new THREE.Color(c) } };
  const m = new THREE.ShaderMaterial({ uniforms: u, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec2 vUv; uniform float t; uniform vec3 a, b, c; void main(){ vec2 p = vUv * vec2(4., 7.); float v = sin(p.x * 1.3 + t) + sin(p.y * 1.1 - t * .7) + sin((p.x + p.y) * .9 + t * .5) + sin(length(p - vec2(2., 3.5)) * 2.2 - t * 1.3); float s = floor((v * .125 + .5) * 7.) / 7.; vec3 col = mix(a, b, s); col = mix(col, c, smoothstep(.62, 1., s)); gl_FragColor = vec4(col, 1.); }' });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); pl.renderOrder = -10; pl.position.z = -100; pl.scale.set(140, 140, 1);
  cam.add(pl); scene.add(cam); return u.t;
}
function makeBurger() {
  const g = new THREE.Group(), cyl = (r1, r2, h, c, y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 8), mat({ color: c })); m.position.y = y; g.add(m); return m; };
  const bunT = ctex(32, 16, c => { c.fillStyle = '#c98a3c'; c.fillRect(0, 0, 32, 16); c.fillStyle = '#f6e7b8'; const r = rng(5); for (let i = 0; i < 26; i++) c.fillRect(r() * 32 | 0, r() * 9 | 0, 2, 1); noise(c, 32, 16, 20, 6); });
  cyl(.5, .44, .16, 0xc98a3c, -.2); cyl(.54, .54, .14, 0x4a2412, -.05); cyl(.57, .6, .05, 0x4fb53a, .1); cyl(.47, .47, .06, 0xd8372c, .05);
  const ch = box(.82, .04, .82, mat({ color: 0xf4c21a }), 0, .035, 0); ch.rotation.y = .6; g.add(ch);
  const top = new THREE.Mesh(new THREE.SphereGeometry(.53, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2), mat({ map: bunT })); top.scale.y = .62; top.position.y = .13; g.add(top);
  return g;
}

// ---------- chicken short: models ----------
const FARMER = { skin: 0xd9a07a, hair: 0x9a9a92, top: 0xb8382e, pants: 0x34558c, topStyle: 'overalls', straw: true, stubble: true, iris: '#5a7a9a', hairH: .05, shoes: 0x4a3018 };
const PED_C = { skin: 0xf0c9a8, hair: 0xd8b040, top: 0xe86a9a, pants: 0x444444, hairH: .3, lip: '#c0304a', topStyle: 'coat', iris: '#3a6aa8' };
const featherT = ctex(16, 16, g => { g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#d6d0be'; for (let y = 2; y < 16; y += 4) for (let x = (y % 8 ? 0 : 2); x < 16; x += 4) g.fillRect(x, y, 2, 1); noise(g, 16, 16, 14, 3); });
const chickEyeT = ctex(16, 16, g => { g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#e8a21c'; g.fillRect(6, 4, 6, 6); g.fillStyle = '#0a0a0a'; g.fillRect(8, 6, 3, 3); g.fillStyle = '#fff'; g.fillRect(8, 6, 1, 1); noise(g, 16, 16, 10, 5); });
function chickenHead() {
  const g = new THREE.Group(), wm = mat({ map: featherT }), em = mat({ map: chickEyeT }), ym = mat({ color: 0xe8a21c }), rm = mat({ color: 0xc8202a });
  g.add(box(.17, .17, .2, [em, em, wm, wm, wm, wm], 0, .085, 0)); g.add(box(.07, .05, .1, ym, 0, .07, .14)); g.add(box(.04, .09, .16, rm, 0, .2, 0)); g.add(box(.05, .08, .04, rm, 0, -.03, .1));
  return g;
}
function makeChicken() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const wm = mat({ map: featherT }), ym = mat({ color: 0xe8a21c });
  body.add(box(.34, .3, .5, wm, 0, .43, 0)); const tail = box(.2, .28, .08, wm, 0, .64, -.27); tail.rotation.x = -.5; body.add(tail);
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * .18, .55, -.02); w.add(box(.05, .2, .32, wm, s * .02, -.1, 0)); body.add(w); return w; });
  const neck = new THREE.Group(); neck.position.set(0, .54, .2); body.add(neck); neck.add(box(.14, .26, .14, wm, 0, .11, 0));
  const stump = new THREE.Group(); stump.add(box(.15, .03, .15, mat({ color: 0xa01824 }), 0, .25, 0)); stump.add(box(.07, .032, .07, mat({ color: 0x2a0508 }), 0, .252, 0)); neck.add(stump);
  const head = chickenHead(); head.position.set(0, .24, .02); neck.add(head);
  const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * .09, .29, 0); l.add(box(.035, .29, .035, ym, 0, -.145, 0)); l.add(box(.1, .02, .14, ym, 0, -.28, .04)); body.add(l); return l; });
  const C = { root, body, neck, head, legs, wings,
    headless(v) { head.visible = !v; stump.visible = v; },
    walk(ph, amp = .55) { legs[0].rotation.x = Math.sin(ph) * amp; legs[1].rotation.x = -Math.sin(ph) * amp; body.position.y = Math.abs(Math.cos(ph)) * .025; neck.rotation.x = .25 + Math.sin(ph * 2) * .14; },
    flap(a) { wings[0].rotation.z = -a; wings[1].rotation.z = a; },
    reset() { for (const o of [body, neck, ...legs, ...wings]) o.rotation.set(0, 0, 0); body.position.set(0, 0, 0); neck.rotation.x = .25; root.rotation.set(0, 0, 0); root.scale.setScalar(.85); } };
  C.reset(); C.headless(false); return C;
}
function makeAxe() { const g = new THREE.Group(); g.add(box(.05, .85, .05, mat({ color: 0x7a5232 }), 0, -.42, 0)); g.add(box(.03, .22, .28, mat({ color: 0xb9c2c8 }), 0, -.78, .13)); g.rotation.x = -.5; return g; }
function makeDropper() { const g = new THREE.Group(); g.add(box(.05, .3, .05, mat({ color: 0xbfe6ff, transparent: true, opacity: .8 }), 0, -.15, 0)); g.add(box(.02, .08, .02, mat({ color: 0xe6f6ff }), 0, -.33, 0)); g.add(box(.1, .13, .1, mat({ color: 0xc8202a }), 0, .06, 0)); return g; }
const grassTex = ctex(32, 32, g => { g.fillStyle = '#5aa63c'; g.fillRect(0, 0, 32, 32); const r = rng(4); for (let i = 0; i < 150; i++) { g.fillStyle = r() < .5 ? '#4a9230' : '#6fba4a'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 2); } noise(g, 32, 32, 18, 8); }, [16, 24]);
const barnTex = ctex(64, 64, g => { g.fillStyle = '#a8281e'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#8a1f17'; for (let x = 0; x < 64; x += 6) g.fillRect(x, 0, 1, 64); g.strokeStyle = '#f1ead8'; g.lineWidth = 3; g.strokeRect(20, 26, 24, 38); g.beginPath(); g.moveTo(20, 26); g.lineTo(44, 64); g.moveTo(44, 26); g.lineTo(20, 64); g.stroke(); g.strokeRect(1.5, 1.5, 61, 61); g.fillStyle = '#2a1a14'; g.fillRect(27, 6, 10, 10); g.strokeRect(27, 6, 10, 10); noise(g, 64, 64, 20, 14); });
const STUMP = [.6, 0, .9];
function scenery(scene) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat({ map: grassTex })); ground.rotation.x = -Math.PI / 2; ground.position.z = -8; scene.add(ground);
  for (const [x, s] of [[-11, 1], [2, 1.4], [14, 1.1]]) { const h = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat({ color: 0x3f8a3a })); h.scale.set(9 * s, 3 * s, 5); h.position.set(x, -.3, -27); scene.add(h); }
  for (const [x, z] of [[-4.6, -8], [7.5, -10], [-8, -13]]) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 1.8, 5), mat({ color: 0x5a3a22 })); tr.position.set(x, .9, z); scene.add(tr); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), mat({ color: 0x3f9a3c })); lf.position.set(x, 2.7, z); scene.add(lf); }
}
function farm() {
  const scene = new THREE.Scene(); scene.background = skyTex; lights(scene); scenery(scene);
  const bm = mat({ map: barnTex }); scene.add(box(5, 3.4, 4, bm, 3.3, 1.7, -7.5)); scene.add(box(3, 1, 3.9, mat({ color: 0xa8281e }), 3.3, 3.8, -7.5));
  for (const s of [-1, 1]) { const r = box(3.3, .2, 4.5, mat({ color: 0x3a302c }), 3.3 + s * 1.28, 4.1, -7.5); r.rotation.z = -s * .62; scene.add(r); }
  const fm = mat({ color: 0xe9e2d0 }); for (let x = -12; x <= 12; x += 1.6) scene.add(box(.12, .95, .12, fm, x, .47, -4.6)); scene.add(box(25, .09, .06, fm, 0, .78, -4.6)); scene.add(box(25, .09, .06, fm, 0, .42, -4.6));
  for (const [x, z] of [[-3.6, -3], [-2.5, -3.3]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .9, 8), mat({ color: 0xd8b84a })); b.rotation.z = Math.PI / 2; b.position.set(x, .5, z); scene.add(b); }
  const st = new THREE.Mesh(new THREE.CylinderGeometry(.34, .4, .45, 8), mat({ color: 0x7a5232 })); st.position.set(STUMP[0], .225, STUMP[2]); scene.add(st);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .02, 8), mat({ color: 0xc9a06a })); top.position.set(STUMP[0], .455, STUMP[2]); scene.add(top);
  return scene;
}
function cast(scene) { const f = makeHuman(FARMER), c = makeChicken(); scene.add(f.root, c.root); return { f, c }; }
const onStump = c => c.root.position.set(STUMP[0], .46, STUMP[2]);
const farmerAt = (f, x = -.75) => { f.reset(); f.skin(1); f.root.position.set(x, 0, .9); f.root.rotation.y = Math.PI / 2; };

// ---------- chicken short: shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
const look = (cam, px, py, pz, tx, ty, tz) => { cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz); };
// A / O: the farm, 1945
function sFarmOpen(push) {
  return () => {
    const scene = farm(), cam = newCam(), { f, c } = cast(scene), axe = makeAxe(); f.arms[0].add(axe); axe.position.y = -.68;
    return { scene, cam, update(tl, d) {
      farmerAt(f); f.face('happy'); f.arms[0].rotation.x = -.25 + Math.sin(tl * 3) * .06; f.head.rotation.y = -.5;
      c.reset(); onStump(c); c.root.rotation.y = .4; c.neck.rotation.x = .25 + Math.max(0, Math.sin(tl * 7)) * .5; c.flap(Math.max(0, Math.sin(tl * 3.5 - 1)) * .5);
      look(cam, 0, 1.6, push ? lerp(6.2, 5.2, tl / d) : 6.2, 0, 1.05, .5);
    } };
  };
}
shot(0, 2.0, sFarmOpen(true));
// B: the chop
const HIT = .93, headPath = a => { const k = Math.min(a, .67), x = STUMP[0] + k * .3, z = STUMP[2] + .05 + k * 1.25; const y = a < .67 ? 1.1 + 3.2 * a - 7 * a * a : .1 + .35 * Math.abs(Math.sin((a - .67) * 7)) * Math.exp(-(a - .67) * 3); return [x, Math.max(.1, y), z]; };
shot(2.0, 4.7, () => {
  const scene = farm(), cam = newCam(), { f, c } = cast(scene), axe = makeAxe(); f.arms[0].add(axe); axe.position.y = -.68;
  const head = chickenHead(); head.scale.setScalar(.85); scene.add(head);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(.3), bmat({ color: 0xfff27a })); scene.add(star);
  return { scene, cam, update(tl) {
    const a = tl - HIT, done = a >= 0; farmerAt(f); f.face(done && a > .25 ? 'happy' : 'neutral');
    const th = done ? lerp(-1.1, -.9, ss(.3, .8, a)) : tl < .85 ? -2.9 * ss(.1, .55, tl) : lerp(-2.9, -1.1, (tl - .85) / .08);
    f.arms[0].rotation.x = th; f.body.rotation.x = done ? .12 : -.1 * ss(.1, .55, tl); f.head.rotation.y = -.35;
    c.reset(); onStump(c); c.headless(done); c.root.rotation.y = .4; c.neck.rotation.x = done ? .25 + Math.sin(a * 30) * .1 * Math.exp(-a * 3) : .25 + Math.sin(tl * 14) * .08;
    head.visible = done; if (done) { const p = headPath(a); head.position.set(p[0], p[1], p[2]); const sp = Math.min(a, 1.1); head.rotation.set(sp * 11, sp * 3, 0); }
    star.visible = done && a < .12; star.position.set(STUMP[0], 1.15, STUMP[2] + .15); star.scale.setScalar(1 + a * 14); star.rotation.z = a * 20;
    const sh = done ? Math.exp(-a * 9) * .06 : 0; look(cam, .35 + Math.sin(tl * 90) * sh, 1.3 + Math.cos(tl * 70) * sh, 4.2 + ss(.1, .5, a) * .5, .25, 1.0 - ss(.1, .5, a) * .3, .9);
  } };
});
// C: the chicken just walks away
shot(4.7, 7.1, () => {
  const scene = farm(), cam = newCam(), { f, c } = cast(scene), axe = makeAxe(); f.arms[0].add(axe); axe.position.y = -.68;
  const head = chickenHead(); head.scale.setScalar(.85); head.position.set(...headPath(2)); head.rotation.set(1.4, .8, 0); scene.add(head);
  return { scene, cam, update(tl) {
    farmerAt(f); f.face(tl > .3 ? 'shocked' : 'happy'); f.arms[0].rotation.x = lerp(-.9, -.1, ss(.3, .6, tl)); const w = Math.max(0, tl - .65);
    f.head.rotation.y = -.2 - ss(.6, 1.6, tl) * .0; f.root.rotation.y = Math.PI / 2 - ss(.9, 1.8, tl) * .5; f.body.rotation.x = -.1 * ss(.3, .5, tl);
    c.reset(); c.headless(true); const hop = clamp((tl - .35) / .3);
    if (tl < .35) { onStump(c); c.root.rotation.y = .4 + ss(0, .3, tl) * 1.17; }
    else { c.root.rotation.y = 1.57; c.root.position.set(STUMP[0] + hop * .55 + w * 1.15, hop < 1 ? .46 * (1 - hop) + Math.sin(hop * Math.PI) * .3 : 0, STUMP[2]); if (hop >= 1) c.walk(w * 13); c.flap(hop < 1 ? .9 : .1); }
    look(cam, .3, 1.35, 5.6, .3, .9, .9);
  } };
});
// D1: "you see"
shot(7.1, 8.3, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x7a2a10, 0xd0661a, 0xffd86a);
  const f = makeHuman(FARMER); scene.add(f.root);
  return { scene, cam, update(tl, d, t) { u.value = t * 1.6; f.reset(); f.skin(1); f.face('neutral'); f.arms[1].rotation.x = -2.5 * ss(0, .25, tl); f.arms[1].rotation.z = .25; f.head.rotation.z = -.08; f.root.rotation.y = .25; look(cam, 0, 1.55, 2.7, 0, 1.38, 0); } };
});
// D2 / E: brain-stem diagram
function diagram(scene) {
  const g = new THREE.Group(), top = new THREE.Group(); g.add(top);
  const shellM = mat({ color: 0xf4f1e8, transparent: true, opacity: .42, depthWrite: false }), topMs = [shellM];
  const tm_ = o => { const m = mat({ ...o, transparent: true }); topMs.push(m); return m; };
  g.add(box(.9, 1.7, .9, mat({ color: 0xf4f1e8, transparent: true, opacity: .42, depthWrite: false }), -.25, -1.3, 0));
  g.add(box(.9, .5, 1.1, mat({ color: 0xf4f1e8, transparent: true, opacity: .42, depthWrite: false }), -.4, -.3, 0));
  top.add(box(1.7, 1.3, 1.2, shellM, 0, .5, 0)); top.add(box(.6, .3, .5, tm_({ color: 0xe8a21c }), 1.1, .3, 0)); top.add(box(1.0, .35, .25, tm_({ color: 0xc8202a }), 0, 1.3, 0)); top.add(box(.3, .5, .3, tm_({ color: 0xc8202a }), .8, -.35, 0)); top.add(box(.22, .22, .06, tm_({ color: 0x0a0a0a }), .4, .7, .61));
  const brain = new THREE.Mesh(new THREE.IcosahedronGeometry(.42, 0), tm_({ color: 0xf08aa8 })); brain.position.set(0, .55, 0); top.add(brain);
  const stemM = mat({ color: 0x39e06a, emissive: 0x39e06a, emissiveIntensity: 0 }); const stem = box(.28, 1.0, .28, stemM, -.36, -.42, 0); stem.rotation.z = .22; g.add(stem);
  const cut = box(2.7, .05, 1.5, bmat({ color: 0xff2a2a }), .05, -.08, 0); cut.rotation.z = -.35; g.add(cut);
  g.rotation.y = -.4; g.position.y = .7; scene.add(g);
  return { g, top, topMs, stemM, cut, set(k) { top.position.set(k * 1.5, k * 1.2, 0); top.rotation.z = k * .35; topMs.forEach((m, i) => m.opacity = (i ? 1 : .42) * (1 - ss(.55, 1, k))); top.visible = k < 1; } };
}
shot(8.3, 10.95, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = swirl(scene, cam, 0x3a1a8a, 0x8a2fd0, 0xff7ad0), D = diagram(scene);
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.6; D.cut.visible = tl > .3 && tl < 1.25; D.cut.scale.x = ss(.3, .5, tl); D.cut.material.color.setHex(Math.floor(tl * 14) % 2 ? 0xff2a2a : 0xffffff);
    D.set(ss(.8, 1.6, tl)); D.stemM.emissiveIntensity = tl > 1.0 ? .35 + .35 * Math.sin(tl * 12) : 0; D.g.rotation.y = -.4 + Math.sin(tl * .8) * .08;
    look(cam, 0, .7, lerp(8.0, 7.2, tl / d), 0, .3, 0);
  } };
});
shot(10.95, 13.85, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = swirl(scene, cam, 0x3a1a8a, 0x8a2fd0, 0xff7ad0), D = diagram(scene);
  const heart = new THREE.Group(), hm = mat({ color: 0xe0202e }); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.3, 0), hm); b.position.set(s * .22, .16, 0); heart.add(b); }
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.5, .62, 4), hm); tip.rotation.x = Math.PI; tip.position.y = -.28; heart.add(tip); heart.position.set(1.15, -.1, .3); D.g.add(heart);
  const wire = box(1.3, .06, .06, bmat({ color: 0x39e06a }), .4, -.25, .15); wire.rotation.z = .12; D.g.add(wire);
  const puffs = [0, 1, 2, 3].map(() => { const p = box(.22, .22, .22, bmat({ color: 0x9aeaff, transparent: true })); D.g.add(p); return p; });
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.6; D.set(1); D.cut.visible = false; D.stemM.emissiveIntensity = .35 + .35 * Math.sin(tl * 12);
    const ph = (tl * 2) % 1, beat = Math.exp(-ph * 9) + .7 * Math.exp(-Math.pow((ph - .28) * 9, 2)); heart.scale.setScalar(1 + beat * .22); wire.material.color.setHex(beat > .5 ? 0xffffff : 0x39e06a);
    puffs.forEach((p, i) => { const k = (tl * .7 + i / 4) % 1; p.position.set(-1.25 - Math.sin(k * 3) * .15, -.2 + k * 1.5, .2); p.material.opacity = 1 - k; p.scale.setScalar(.6 + k * 1.2); });
    look(cam, .25, .6, lerp(6.2, 5.6, tl / d), .25, .05, 0);
  } };
});
const signTex = (text, bg, fg, w = 64, h = 32, font = 'bold 20px sans-serif') => ctex(w, h, g => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 1); noise(g, w, h, 12, 6); });
// F: "So Mike kept living."
shot(13.85, 15.75, () => {
  const scene = farm(), cam = newCam(), { f, c } = cast(scene), sp = sparkles(scene, 6);
  scene.add(box(.07, 1.0, .07, mat({ color: 0x7a5232 }), 1.45, .5, .7)); const board = new THREE.Mesh(new THREE.PlaneGeometry(.8, .4), bmat({ map: signTex('MIKE', '#c9a06a', '#3a1c0c') })); board.position.set(1.45, 1.0, .74); board.rotation.z = -.06; scene.add(board);
  return { scene, cam, update(tl, d) {
    farmerAt(f, -.9); f.root.position.z = .1; f.root.rotation.y = .5; f.face('happy'); f.arms[0].rotation.z = -2.5 + Math.sin(tl * 12) * .2; f.arms[1].rotation.z = 2.5 - Math.sin(tl * 12) * .2; f.body.position.y = Math.abs(Math.sin(tl * 7)) * .12;
    c.reset(); onStump(c); c.headless(true); c.root.rotation.y = .5 + Math.sin(tl * 2.5) * .5; c.flap(.5 + Math.sin(tl * 18) * .5); c.root.position.y = .46 + Math.abs(Math.sin(tl * 6)) * .08;
    sp.forEach((s, i) => { const an = i * 1.05 + tl * 2; s.position.set(STUMP[0] + Math.cos(an) * .55, 1.0 + Math.sin(an * 2 + i) * .35, STUMP[2] + Math.sin(an) * .4); s.scale.setScalar(.6 + Math.max(0, Math.sin(tl * 9 + i * 2)) * 1.6); });
    look(cam, 1.05, .85, lerp(4.2, 3.9, tl / d), .9, 1.05, .9);
  } };
});
function sparkles(scene, n) { return [...Array(n)].map(() => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.05), bmat({ color: 0xfff7a0 })); scene.add(s); return s; }); }
// G: "For eighteen months."
shot(15.75, 17.5, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x0a4a3a, 0x1a9a6a, 0xe8ff7a);
  const cc = document.createElement('canvas'); cc.width = cc.height = 64; const cg = cc.getContext('2d'); const ct = new THREE.CanvasTexture(cc); ct.magFilter = ct.minFilter = THREE.NearestFilter; ct.generateMipmaps = false; ct.colorSpace = THREE.SRGBColorSpace;
  const cal = new THREE.Group(); cal.add(box(2.3, 2.3, .12, mat({ color: 0xd8d2c2 }), 0, 0, -.07)); const pg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), bmat({ map: ct })); cal.add(pg); cal.position.set(0, 1.9, 0); scene.add(cal);
  const pages = [...Array(7)].map(() => { const p = box(.9, 1.0, .01, bmat({ color: 0xf6f2e6 })); scene.add(p); return p; });
  const c = makeChicken(); scene.add(c.root);
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.6; const n = clamp(Math.floor(1 + tl / .78 * 17), 1, 18);
    cg.fillStyle = '#f6f2e6'; cg.fillRect(0, 0, 64, 64); cg.fillStyle = '#c8202a'; cg.fillRect(0, 0, 64, 17); cg.fillStyle = '#fff'; cg.font = 'bold 12px sans-serif'; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.fillText('MONTH', 32, 9);
    cg.fillStyle = '#1a1a1a'; cg.font = 'bold 40px sans-serif'; cg.fillText(String(n), 32, 43); ct.needsUpdate = true;
    const pop = n === 18 ? Math.exp(-(tl - .78) * 5) * .2 : 0; cal.scale.setScalar(1 + pop); cal.rotation.z = Math.sin(tl * 4) * .04;
    pages.forEach((p, i) => { const k = ((tl * 2.6 + i / 7) % 1); p.visible = tl < .9; p.position.set((i % 2 ? 1 : -1) * (.3 + k * 1.6), 1.9 - k * k * 2.6, .2 + i * .02); p.rotation.set(k * 3, k * 2, (i % 2 ? -1 : 1) * k * 2.5); });
    c.reset(); c.headless(true); c.root.scale.setScalar(1.25); c.root.position.set(0, -.75, .3); c.root.rotation.y = .6 + Math.sin(tl * 3) * .3; c.walk(tl * 10, .35);
    look(cam, 0, 1.2, 6.0, 0, 1.05, 0);
  } };
});
// H: the eyedropper
function sFeed(close) {
  return () => {
    const scene = farm(), cam = newCam(), { f, c } = cast(scene), dr = makeDropper(); f.arms[0].add(dr); dr.position.y = -.72;
    const drops = [0, 1, 2].map(() => { const p = box(.035, .06, .035, bmat({ color: 0xcdefff })); scene.add(p); return p; });
    return { scene, cam, update(tl, d) {
      farmerAt(f, -.2); f.face('neutral'); const th = -1.75; f.arms[0].rotation.x = th + Math.sin(tl * 5) * .015; dr.rotation.x = -th; f.head.rotation.x = .42; f.body.rotation.x = .1;
      c.reset(); onStump(c); c.headless(true); c.root.rotation.y = 0; c.neck.rotation.x = 0; c.flap(Math.max(0, Math.sin(tl * 6)) * .3); c.legs[0].rotation.x = Math.sin(tl * 6) * .1;
      const tipY = 1.47 + .68 * -Math.cos(th) - .72 * 0 - .37, nx = STUMP[0], nz = STUMP[2] + .17, top = .46 + (.54 + .25) * .85;
      drops.forEach((p, i) => { const k = (tl * 1.9 + i / 3) % 1; p.position.set(nx, lerp(tipY, top, k * k), nz); p.visible = k < .97; });
      if (close) look(cam, nx + .45, 1.28, nz + 1.0, nx, 1.24, nz); else look(cam, .45, 1.35, lerp(3.6, 3.3, tl / d), .3, 1.22, .9);
    } };
  };
}
shot(17.5, 20.15, sFeed(false));
shot(20.15, 21.8, sFeed(true));
// I: on tour
shot(21.8, 23.8, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = skyTex; lights(scene); scenery(scene);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 3.2), mat({ color: 0x55575c })); road.rotation.x = -Math.PI / 2; road.position.set(0, .01, 0); scene.add(road);
  for (let x = -30; x < 30; x += 2.4) scene.add(box(1.1, .02, .14, mat({ color: 0xf0e9c0 }), x, .02, 0));
  for (let x = -12; x <= 12; x += 4) { scene.add(box(.14, 2.6, .14, mat({ color: 0x6a4a2e }), x, 1.3, -2.6)); scene.add(box(.9, .08, .08, mat({ color: 0x6a4a2e }), x, 2.4, -2.6)); }
  const tr = new THREE.Group(), red = mat({ color: 0xc0392b }), wood = mat({ color: 0x8a6238 });
  tr.add(box(1.0, .95, 1.3, red, .95, 1.1, 0)); tr.add(box(.75, .5, 1.3, red, 1.8, .85, 0)); tr.add(box(.5, .4, 1.32, mat({ color: 0xbfe6ff }), 1.05, 1.28, 0)); tr.add(box(2.2, .16, 1.35, wood, -.65, .66, 0));
  tr.add(box(2.2, .34, .06, wood, -.65, .9, .66)); tr.add(box(2.2, .34, .06, wood, -.65, .9, -.66)); tr.add(box(.06, .34, 1.35, wood, -1.74, .9, 0));
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .5), bmat({ map: signTex('MIKE ON TOUR', '#f6e9b8', '#b0201a', 96, 28, 'bold 13px sans-serif') })); banner.position.set(-.65, .82, .7); tr.add(banner);
  const wheels = [[1.5, .6], [1.5, -.6], [-1.0, .6], [-1.0, -.6]].map(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .2, 8), mat({ color: 0x1c1c1c })); w.rotation.x = Math.PI / 2; w.position.set(x, .34, z); tr.add(w); return w; });
  const c = makeChicken(); tr.add(c.root); scene.add(tr);
  const dust = [0, 1, 2, 3].map(() => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.2, 0), mat({ color: 0xd8cfb8, transparent: true })); scene.add(p); return p; });
  return { scene, cam, update(tl, d) {
    const x = lerp(-3.4, 2.6, tl / d); tr.position.set(x, Math.abs(Math.sin(tl * 17)) * .05, 0); tr.rotation.z = Math.sin(tl * 17) * .012; wheels.forEach(w => w.rotation.y = -tl * 9);
    c.reset(); c.headless(true); c.root.position.set(-.7, .74, 0); c.root.rotation.y = 1.57; c.flap(.4 + Math.sin(tl * 20) * .4); c.root.position.y = .74 + Math.abs(Math.sin(tl * 17 + 1)) * .09;
    dust.forEach((p, i) => { const k = (tl * 2.2 + i / 4) % 1; p.position.set(x - 2 - k * 1.6, .25 + k * .6, .5 - i * .3); p.scale.setScalar(.6 + k * 1.8); p.material.opacity = .8 * (1 - k); });
    look(cam, x * .6, 1.6, 7.8, x * .8, .6, 0);
  } };
});
// J/K: the sideshow tent
const stripeT = ctex(32, 32, g => { for (let x = 0; x < 32; x += 8) { g.fillStyle = (x / 8) % 2 ? '#f1e6cc' : '#c0392b'; g.fillRect(x, 0, 8, 32); } noise(g, 32, 32, 16, 17); }, [6, 1]);
const woodT = ctex(32, 32, g => { g.fillStyle = '#8a6238'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#6e4c2a'; for (let y = 0; y < 32; y += 8) g.fillRect(0, y, 32, 1); noise(g, 32, 32, 22, 19); }, [6, 6]);
function tent() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x3a1414); lights(scene, 1.9, 1.6);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), mat({ map: woodT })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), mat({ map: stripeT })); back.position.set(0, 3.5, -3.2); scene.add(back);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), mat({ map: stripeT })); front.position.set(0, 3.5, 5.5); front.rotation.y = Math.PI; scene.add(front);
  scene.add(box(4.2, .5, 2, mat({ color: 0x5a3a22 }), 0, .25, -1.8)); scene.add(box(.55, .6, .55, mat({ color: 0xd8b84a }), 0, .8, -1.6));
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(3.6, .75), bmat({ map: signTex('THE HEADLESS CHICKEN', '#f6e9b8', '#b0201a', 160, 32, 'bold 13px sans-serif') })); ban.position.set(0, 2.75, -3.1); scene.add(ban);
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(.24, .18, .36, 8), mat({ color: 0x8a9096 })); bucket.position.set(1.5, .68, -1.1); scene.add(bucket);
  const c = makeChicken(); scene.add(c.root);
  const crowd = [PED_A, PED_C, PED_B].map((p, i) => { const h = makeHuman(p); h.root.position.set((i - 1) * 1.25, 0, 1.5 + (i === 1 ? .7 : 0)); h.root.rotation.y = Math.PI; scene.add(h.root); return h; });
  const mike = tl => { c.reset(); c.headless(true); c.root.position.set(0, 1.1, -1.6); c.root.rotation.y = tl * 1.6; c.walk(tl * 9, .4); c.flap(Math.max(0, Math.sin(tl * 5)) * .7); };
  return { scene, c, crowd, mike };
}
shot(23.8, 25.4, () => {
  const { scene, crowd, mike } = tent(), cam = newCam(); crowd[1].root.visible = false;
  const coins = [0, 1, 2].map(() => { const k = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .02, 6), bmat({ color: 0xffd23a })); scene.add(k); return k; });
  return { scene, cam, update(tl, d) {
    mike(tl); crowd.forEach((h, i) => { h.reset(); h.skin(1); h.face('neutral'); h.body.position.y = Math.abs(Math.sin(tl * 5 + i)) * .03; h.arms[i === 2 ? 0 : 1].rotation.x = -1.3 - (i === 0 ? .5 * Math.sin(tl * 8) : 0); });
    coins.forEach((k, i) => { const a = clamp((tl - .2 - i * .38) / .45); k.visible = a > 0 && a < 1; const sx = (i - 1) * 1.25; k.position.set(lerp(sx, 1.5, a), 1.2 + Math.sin(a * Math.PI) * 1.3 - a * .4, lerp(1.2, -1.1, a)); k.rotation.set(a * 14, 0, a * 9); });
    look(cam, 0, 3.1, lerp(5.6, 5.2, tl / d), 0, 1.25, -1.6);
  } };
});
shot(25.4, 26.95, () => {
  const { scene, crowd, c } = tent(), cam = newCam(); c.root.visible = false;
  return { scene, cam, update(tl, d) {
    crowd.forEach((h, i) => { h.reset(); h.skin(1); h.root.position.set((i - 1) * .62, 0, i === 1 ? 2.0 : 1.5); h.face(['shocked', 'scream', 'confused'][i]); h.head.rotation.x = .12; h.head.rotation.z = [-.12, 0, .15][i] * ss(.1, .5, tl); h.body.rotation.x = .1 * ss(0, .4, tl); if (i === 1) { h.arms[0].rotation.z = -2.6; h.arms[1].rotation.z = 2.6; } });
    look(cam, 0, 1.8, lerp(-2.1, -1.7, tl / d), 0, 1.62, 1.6);
  } };
});
shot(26.95, 28.45, () => {
  const { scene, crowd, c } = tent(), cam = newCam(); c.root.visible = false; crowd[0].root.visible = crowd[1].root.visible = false;
  return { scene, cam, update(tl) {
    const h = crowd[2]; h.reset(); h.skin(1); h.face('happy'); h.root.position.set(0, 0, 1.5); h.head.rotation.x = Math.max(0, Math.sin(tl * 9)) * .3; h.arms[0].rotation.z = -.6 - Math.sin(clamp(tl / .8) * Math.PI) * .4; h.arms[1].rotation.z = .6 + Math.sin(clamp(tl / .8) * Math.PI) * .4;
    look(cam, .1, 1.85, -.35, 0, 1.75, 1.5);
  } };
});
// L: the motel, at night
const nightT = ctex(64, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#05061a'); gr.addColorStop(1, '#1a2450'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128); const r = rng(3); g.fillStyle = '#fff'; for (let i = 0; i < 70; i++) g.fillRect(r() * 64 | 0, r() * 80 | 0, 1, 1); g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(48, 22, 6, 0, 7); g.fill(); });
const motelT = ctex(64, 32, g => { g.fillStyle = '#b9ad8e'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#7a705a'; g.fillRect(0, 0, 64, 4); for (let i = 0; i < 4; i++) { const x = 2 + i * 16; g.fillStyle = '#1f6a6a'; g.fillRect(x, 12, 6, 20); g.fillStyle = i === 1 ? '#ffd86a' : '#2a2f45'; g.fillRect(x + 8, 13, 6, 8); g.fillStyle = '#e9e2d0'; g.fillRect(x + 4.5, 21, 1, 1); } noise(g, 64, 32, 16, 23); });
shot(28.45, 30.45, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = nightT; lights(scene, .95, .7);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat({ color: 0x2a2c34 })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  scene.add(box(10, 2.8, 3, bmat({ map: motelT, color: 0xd8d8ee }), 0, 1.4, -3)); scene.add(box(10.4, .2, 3.6, mat({ color: 0x4a2a2a }), 0, 2.9, -2.8));
  scene.add(box(.16, 4.2, .16, mat({ color: 0x3a3a44 }), -2.3, 2.1, 1.2));
  const neonT = ctex(64, 24, g => { g.fillStyle = '#16081a'; g.fillRect(0, 0, 64, 24); g.strokeStyle = '#ff4fa8'; g.strokeRect(1.5, 1.5, 61, 21); g.fillStyle = '#ff4fa8'; g.font = 'bold 16px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MOTEL', 32, 13); });
  const nm = bmat({ map: neonT }); const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .9), nm); sign.position.set(-2.3, 4.0, 1.3); scene.add(sign);
  const glow = new THREE.PointLight(0xff4fa8, 9, 10); glow.position.set(-2.3, 3.6, 2.2); scene.add(glow);
  const red = mat({ color: 0xc0392b }); scene.add(box(1.0, .95, 1.3, red, 2.9, 1.1, .6)); scene.add(box(.75, .5, 1.3, red, 3.75, .85, .6)); scene.add(box(2.2, .5, 1.35, mat({ color: 0x8a6238 }), 1.3, .8, .6));
  for (const x of [3.4, .9]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .2, 8), mat({ color: 0x1c1c1c })); w.rotation.x = Math.PI / 2; w.position.set(x, .34, 1.25); scene.add(w); }
  return { scene, cam, update(tl, d) { const on = !(Math.floor(tl * 11) % 7 === 0); nm.color.setScalar(on ? 1 : .25); glow.intensity = on ? 9 : 2; look(cam, -.8, 2.0, lerp(13.5, 12.3, tl / d), -.9, 2.1, 0); } };
});
// M: "Mike choked."
shot(30.45, 31.5, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x1a1410); lights(scene, 1.5, 1.2);
  const wall = ctex(32, 32, g => { g.fillStyle = '#8a7a5a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#7a6a4c'; for (let x = 0; x < 32; x += 8) g.fillRect(x, 0, 3, 32); noise(g, 32, 32, 16, 29); }, [6, 2]);
  scene.add(box(10, 5, .2, mat({ map: wall }), 0, 2.5, -2)); const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), mat({ color: 0x6a3a3a })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  scene.add(box(2.2, .55, 1.6, mat({ color: 0x3f6a9a }), -1.9, .3, -1.1)); scene.add(box(.7, .2, .5, mat({ color: 0xf2f2f2 }), -2.5, .66, -1.5)); scene.add(box(.5, .7, .5, mat({ color: 0x5a3a22 }), 1.9, .35, -1.5)); scene.add(box(.3, .4, .3, mat({ color: 0xffe9a0, emissive: 0xffd86a, emissiveIntensity: .8 }), 1.9, .9, -1.5));
  const f = makeHuman(FARMER), c = makeChicken(); scene.add(f.root, c.root);
  return { scene, cam, update(tl) {
    f.reset(); f.skin(1); f.root.position.set(-.85, 0, -.6); f.root.rotation.y = .5; f.face(tl > .3 ? 'shocked' : 'neutral'); const up = ss(.3, .45, tl); f.arms[0].rotation.z = -2.4 * up; f.arms[1].rotation.z = 2.4 * up;
    c.reset(); c.headless(true); const k = ss(.28, .52, tl); c.root.position.set(.3, k * .12, .3); c.root.rotation.set(0, .6, -k * 1.5); c.root.position.x = .3 + (tl < .28 ? Math.sin(tl * 60) * .03 : 0);
    c.flap(tl < .28 ? .5 + Math.sin(tl * 50) * .5 : .2); c.legs[0].rotation.x = k * (.5 + Math.sin(tl * 40) * .3 * Math.exp(-(tl - .5) * 4)); c.legs[1].rotation.x = -k * .3;
    look(cam, .1, 1.0, 3.9, 0, .5, 0);
  } };
});
// N: "Sorry."
shot(31.5, 32.85, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x1a2238, 0x3a4a78, 0x8aa0d8);
  const f = makeHuman(FARMER); scene.add(f.root);
  return { scene, cam, update(tl, d, t) { u.value = t; f.reset(); f.skin(1); f.face('sad'); f.head.rotation.x = .06; f.head.rotation.z = .07; look(cam, .1, 1.78, lerp(1.75, 1.45, tl / d), 0, 1.78, 0); } };
});
shot(32.85, DUR + .1, sFarmOpen(false));

// ---------- captions ----------
let chunks = [];
function buildCaptions(words) {
  let cur = [];
  const flush = () => { if (cur.length) { chunks.push({ s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map(w => w.w.toLowerCase().replace(/[.,]/g, '')).join(' ') }); cur = []; } };
  for (const w of words) { const len = cur.reduce((a, c) => a + c.w.length + 1, 0); if (cur.length >= 4 || len + w.w.length > 19) flush(); cur.push(w); if (/[.,?!]$/.test(w.w)) flush(); }
  flush(); chunks.forEach((c, i) => { const n = chunks[i + 1]; c.s -= .06; c.e = n ? n.s - .06 : c.e + .5; });
}
function drawCaption(t) {
  const c = chunks.find(c => t >= c.s && t < c.e); if (!c) return;
  og.font = '900 58px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  const x = out.width / 2, y = out.height * .672;
  og.strokeStyle = '#141000'; og.lineWidth = 12; og.strokeText(c.text, x + 2, y + 4); og.strokeText(c.text, x, y); og.fillStyle = '#ffec1f'; og.fillText(c.text, x, y);
}
// ---------- frame ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function renderAt(t) {
  const s = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1], tl = t - s.t0;
  s.update(tl, s.t1 - s.t0, t); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam);
  lg.drawImage(renderer.domElement, 0, 0); const id = lg.getImageData(0, 0, W, H), d = id.data;
  for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) { const b = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - .5) * 9; d[i] = clamp(d[i] + b, 0, 255) & 0xF8; d[i + 1] = clamp(d[i + 1] + b, 0, 255) & 0xF8; d[i + 2] = clamp(d[i + 2] + b, 0, 255) & 0xF8; }
  lg.putImageData(id, 0, 0); og.imageSmoothingEnabled = false; og.drawImage(lo, 0, 0, out.width, out.height); drawCaption(t);
}
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .93); };
const cutInfo = await (await fetch('/build/cuts.json')).json();
const toOriginal = tc => { let t = tc * (cutInfo.speed || 1); for (const [a, b] of cutInfo.cuts) { if (t >= a) t += b - a; else break; } return Math.min(t, DUR - .001); };
window.renderFrame = i => window.renderTime(toOriginal((i + .5) / FPS));
window.frameCount = Math.round(cutInfo.duration * FPS);
const words = await (await fetch('/build/words.json')).json(); buildCaptions(words);
await document.fonts.load('900 58px Nunito');
window.captionChunks = chunks; window.ready = true;
