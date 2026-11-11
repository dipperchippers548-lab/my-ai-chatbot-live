// "How Michael Jackson Burned His Scalp" - PS1-style low-poly short, rendered frame by frame.
// (engine section shared with ../invisible-short)
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 37.488;
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
    } else if (style === 'sequin') {
      const r = rng(71); for (let i = 0; i < 70; i++) { g.fillStyle = ['#ffffff', '#9fd0ff', '#ffe9a0'][i % 3]; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 1); }
      g.fillStyle = '#f2f2f2'; g.beginPath(); g.moveTo(10, 0); g.lineTo(16, 13); g.lineTo(22, 0); g.fill(); g.fillStyle = '#e8c33a'; g.fillRect(4, 3, 3, 26); g.fillRect(25, 3, 3, 26);
    } else if (style === 'suit') {
      g.fillStyle = '#f2f2f2'; g.beginPath(); g.moveTo(9, 0); g.lineTo(16, 16); g.lineTo(23, 0); g.fill(); g.fillStyle = '#c8202a'; g.fillRect(15, 2, 2, 14); g.fillStyle = shade(hex, .55); g.fillRect(15.5, 16, 1, 16);
    } else if (style === 'crew') {
      g.fillStyle = '#f2f2f2'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.fillText('CREW', 16, 16);
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
  if (p.curl) head.add(box(.05, .15, .04, hairM, .09, .43, .235));
  const band = box(.5, .42, .5, mk({ color: 0xf4f4ee }), 0, .57, 0); band.visible = false; head.add(band);
  const gloveM = mk({ color: 0xffffff });
  const arms = [], legs = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * .42, 1.47, 0); body.add(a); arms.push(a);
    add(a, box(.2, .62, .22, topM, 0, -.29, 0), cloth); add(a, box(.17, .17, .19, p.glove && s > 0 ? gloveM : skinM, 0, -.68, 0), skin); add(a, box(.16, .6, .18, skinM, 0, -.3, 0), nude);
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
    bandage(v) { band.visible = v; },
    reset() { band.visible = false; for (const o of [body, head, ...arms, ...legs]) o.rotation.set(0, 0, 0); body.position.set(0, 0, 0); body.scale.set(1, 1, 1); },
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

// ---------- shared helpers (from ../pee-short) ----------
const punch = (tl, k = .22) => 1 + k * Math.exp(-tl * 11);
const pop = x => x <= 0 ? 0 : Math.min(1, x / .07) * (1 + .32 * Math.exp(-x * 7) * Math.cos(x * 21));
const shake = (cam, t, a) => { cam.position.x += Math.sin(t * 91) * a; cam.position.y += Math.cos(t * 73) * a; };
const look = (cam, px, py, pz, tx, ty, tz) => { cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz); };
function burst(scene, cam, a, b, c) {   // rotating sunburst backdrop
  const u = { t: { value: 0 }, a: { value: new THREE.Color(a) }, b: { value: new THREE.Color(b) }, c: { value: new THREE.Color(c) } };
  const m = new THREE.ShaderMaterial({ uniforms: u, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying vec2 vUv; uniform float t; uniform vec3 a, b, c; void main(){ vec2 p = vUv - vec2(.5, .53); float an = atan(p.y, p.x) + t * .5; float s = step(.5, fract(an * 9. / 6.2832)); float r = length(p); vec3 col = mix(a, b, s); col = mix(c, col, smoothstep(.0, .09, r + sin(t * 4.) * .008)); gl_FragColor = vec4(col * (1.15 - r * 1.3), 1.); }' });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); pl.renderOrder = -10; pl.position.z = -100; pl.scale.set(140, 140, 1); cam.add(pl); scene.add(cam); return u.t;
}
function sparkles(scene, n, color = 0xfff7a0, size = .05) { return [...Array(n)].map(() => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(size), bmat({ color })); scene.add(s); return s; }); }
function makeSign(text, bg = '#ffe21f', fg = '#16120a') {
  const t = ctex(96, 40, g => { g.fillStyle = fg; g.fillRect(0, 0, 96, 40); g.fillStyle = bg; g.fillRect(3, 3, 90, 34); g.fillStyle = fg; let fs = 24; do { g.font = 'bold ' + fs + 'px sans-serif'; fs--; } while (g.measureText(text).width > 82); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 48, 21); });
  return new THREE.Mesh(new THREE.PlaneGeometry(1.9, .8), bmat({ map: t }));
}
function sweat(scene) { return [...Array(6)].map((_, i) => { const p = box(.05, .09, .05, bmat({ color: 0x9adfff })); scene.add(p); p.userData = i; return p; }); }
const sweatAt = (drops, tl, x, y, z, rate = 2.4) => drops.forEach(p => { const i = p.userData, k = (tl * rate + i / 6) % 1, an = i * 1.05 + .3; p.position.set(x + Math.cos(an) * (.25 + k * .5), y + k * .5 - k * k * 1.1, z + .2); p.scale.setScalar(1 - k * .6); });

// ---------- MJ short: models and sets ----------
const MJ = { skin: 0x9a6a48, hair: 0x0e0c0c, top: 0x16161e, pants: 0x0e0e12, shoes: 0x0a0a0a, hairH: .22, iris: '#3a2416', lip: '#7a3f38', topStyle: 'sequin', glove: true, curl: true };
const CREW = { skin: 0xd9a07a, hair: 0x3a2a1a, top: 0x1c1c1c, pants: 0x2a3a5a, topStyle: 'crew', cap: true, stubble: true, shoes: 0x222222 };
const CREW2 = { ...CREW, skin: 0x8a5a3c, hair: 0x111111, stubble: false }, CREW3 = { ...CREW, skin: 0xe8b89a, hair: 0xb04a20 };
const SUIT = { skin: 0xe2b08a, hair: 0x5a5a5a, top: 0x2a3550, pants: 0x2a3550, topStyle: 'suit', hairH: .08, glasses: true, shoes: 0x111111 };
const DOC = { skin: 0xe8b89a, hair: 0x6a4a2a, top: 0xf2f2f2, pants: 0x5a8a9a, topStyle: 'coat', hairH: .12, glasses: true, shoes: 0xf0f0f0 };
const FAN_C = { skin: 0xf0c9a8, hair: 0xd8b040, top: 0xe86a9a, pants: 0x444444, hairH: .3, lip: '#c0304a', topStyle: 'coat', iris: '#3a6aa8' };
function makeFlame() {
  const g = new THREE.Group(), parts = [0xff3a1a, 0xff8a1a, 0xffd21a, 0xfff27a, 0xff5a1a, 0xffb01a].map((c, i) => { const m = new THREE.Mesh(new THREE.ConeGeometry(.12, .4, 4), bmat({ color: c })); m.userData = i; g.add(m); return m; });
  g.set = (size, t) => { g.visible = size > .01; parts.forEach(p => { const i = p.userData, f = .75 + .35 * Math.sin(t * 23 + i * 2.1); p.position.set(((i * 37) % 5 - 2) * .075 * size, (.14 + .05 * Math.sin(t * 17 + i)) * size * 1.6, ((i * 53) % 3 - 1) * .07 * size); p.scale.set(size * (1 + .2 * Math.sin(t * 31 + i)), size * f * 1.5, size); p.rotation.y = t * 3 + i; }); };
  g.position.y = .8; g.set(0, 0); return g;
}
function makeMJ() { const h = makeHuman(MJ), fl = makeFlame(); h.head.add(fl); h.flame = fl; return h; }
function makeSparks(scene, n, size = .07) { const r = rng(n * 7 + 1); return [...Array(n)].map((_, i) => { const s = box(size, size, size, bmat({ color: [0xfff27a, 0xffffff, 0xffb01a][i % 3] })); s.userData = { a: r(), b: r(), c: r() }; s.visible = false; scene.add(s); return s; }); }
function fountain(parts, t, ox, oy, oz, power = 1, spread = 1) { parts.forEach(p => { const { a, b, c } = p.userData, u = (t * 1.5 + a) % 1; p.visible = power > .02; p.position.set(ox + (b - .5) * 2.2 * spread * u, oy + (5 + a * 3) * power * u - 6 * u * u, oz + (c - .5) * 1.2 * spread * u); p.scale.setScalar(1.3 - u); }); }
function dance(h, t) { const b = Math.sin(t * 10); h.body.position.y = Math.abs(b) * .08; h.body.rotation.y = Math.sin(t * 5) * .7; h.body.rotation.z = Math.sin(t * 5 + 1) * .1; h.arms[1].rotation.z = 2.3 + Math.sin(t * 10) * .4; h.arms[0].rotation.x = -.6 + Math.sin(t * 10) * .6; h.arms[0].rotation.z = -.4; h.legs[0].rotation.x = Math.max(0, Math.sin(t * 5)) * -.9; h.legs[1].rotation.x = Math.max(0, -Math.sin(t * 5)) * -.9; h.head.rotation.y = Math.sin(t * 5 + .5) * .4; h.head.rotation.z = Math.sin(t * 10) * .08; }
function pose(h) { h.arms[1].rotation.z = 2.75; h.arms[0].rotation.z = -.55; h.arms[0].rotation.x = .2; h.legs[0].rotation.z = -.14; h.legs[1].rotation.x = -.5; h.body.rotation.z = -.06; h.head.rotation.x = -.2; }
const FANB = [0xe84a5a, 0x3a8ae8, 0xf2c21f, 0x3fc060, 0xb04ad8, 0xff8a2a].map(c => mat({ color: c })), FANS = [0xe2a57f, 0x8a5a3c, 0xf0c9a8].map(c => mat({ color: c }));
function makeCrowd(scene, rows, cols, z0) {
  const r = rng(51), fans = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const g = new THREE.Group(), sk = FANS[r() * 3 | 0]; g.add(box(.5, .75, .3, FANB[r() * 6 | 0], 0, 1.0, 0)); g.add(box(.3, .34, .3, sk, 0, 1.56, 0));
    const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .3, 1.3, 0); a.add(box(.12, .6, .12, sk, 0, .3, 0)); g.add(a); return a; });
    g.position.set((col - (cols - 1) / 2) * .82 + (row % 2) * .4, 0, z0 + row * .75); g.userData = { ph: r() * 6.28, arms, sp: 7 + r() * 3 }; scene.add(g); fans.push(g);
  }
  return fans;
}
const cheer = (fans, t, amp = 1) => fans.forEach(f => { const u = f.userData; f.position.y = Math.abs(Math.sin(t * u.sp + u.ph)) * .2 * amp; u.arms[0].rotation.z = .35 + Math.sin(t * u.sp + u.ph) * .3; u.arms[1].rotation.z = -.35 - Math.sin(t * u.sp + u.ph + 1) * .3; });
const bulbT = ctex(32, 32, g => { g.fillStyle = '#0c1030'; g.fillRect(0, 0, 32, 32); for (let y = 2; y < 32; y += 4) for (let x = 2; x < 32; x += 4) { g.fillStyle = (x + y) % 8 ? '#ffd86a' : '#ff5ab0'; g.fillRect(x, y, 2, 2); } }, [3, 2]);
const stageT = ctex(32, 32, g => { g.fillStyle = '#2a2c3e'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#3a3d55'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32); noise(g, 32, 32, 14, 40); }, [8, 4]);
const STG = .6, MJZ = .6;
function stage(withCrowd = true) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x070818); lights(scene, 1.7, 1.7);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), mat({ color: 0x14141c })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  scene.add(box(11, STG, 5, mat({ map: stageT }), 0, STG / 2, -.2));
  for (let i = 0; i < 6; i++) scene.add(box(3.2, .3, .5, mat({ color: i % 2 ? 0x4a4f78 : 0x363a5c }), 0, STG + .15 + i * .3, -1.5 - i * .5)); scene.add(box(3.2, 2.1, 1.3, mat({ color: 0x363a5c }), 0, STG + 1.05, -4.9));
  const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), bmat({ map: bulbT })); back.position.set(0, 5, -5.7); scene.add(back);
  for (const s of [-1, 1]) scene.add(box(.5, 8, .5, mat({ color: 0x3a3d55 }), s * 5.4, 4, -1)); scene.add(box(11.3, .4, .5, mat({ color: 0x3a3d55 }), 0, 8, -1));
  const cones = [0xff4fa8, 0x4fc8ff, 0xffe21f, 0x7aff7a].map((c, i) => { const p = new THREE.Group(); p.position.set(-3.6 + i * 2.4, 8, -1); const m = new THREE.Mesh(new THREE.ConeGeometry(1.5, 8, 8, 1, true), bmat({ color: c, transparent: true, opacity: .17, depthWrite: false, side: THREE.DoubleSide })); m.position.y = -4; p.add(m); scene.add(p); return p; });
  const pots = [[-1.9, -1.0], [1.9, -1.0], [-2.7, -2.2], [2.7, -2.2]]; pots.forEach(([x, z]) => scene.add(box(.3, .25, .3, mat({ color: 0x777777 }), x, STG + .12, z)));
  const fans = withCrowd ? makeCrowd(scene, 4, 10, 3.6) : [];
  const S = { scene, back, pots, fans, live(t, amp = 1) { cones.forEach((c, i) => { c.rotation.z = Math.sin(t * 1.7 + i * 1.3) * .35; c.rotation.x = Math.sin(t * 1.1 + i) * .12; }); cheer(fans, t, amp); back.material.color.setScalar(.5 + .12 * Math.sin(t * 9)); } };
  return S;
}
const onStage = h => { h.reset(); h.skin(1); h.root.position.set(0, STG, MJZ); h.root.rotation.y = 0; };

// ---------- MJ short: shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
// 1 / 17: the stage, 1984
function sOpen(hold) {
  return () => {
    const S = stage(), cam = newCam(), h = makeMJ(), sign = makeSign('1984'), sp = [0, 1].map(i => makeSparks(S.scene, 10)); S.scene.add(h.root, sign);
    return { scene: S.scene, cam, update(tl, d, t) {
      const x = hold ? 0 : tl; S.live(t); onStage(h); h.face('happy'); pose(h); h.body.position.y = Math.abs(Math.sin(t * 10)) * .03;
      sign.position.set(0, 5.2, 0); sign.scale.setScalar(hold ? 0 : pop(x - .2) * 2.0); sign.rotation.z = Math.sin(t * 4) * .04;
      sp.forEach((p, i) => fountain(p, t + i * .4, S.pots[i][0], STG + .25, S.pots[i][1], .45, .5));
      look(cam, hold ? 0 : Math.sin(x * 1.3) * .5, 3.7, 9.4 * punch(x, .2), 0, 2.2, -1);
    } };
  };
}
shot(0, 1.9, sOpen(false));
// 2: "Michael Jackson's hair caught fire,"
shot(1.9, 4.3, () => {
  const S = stage(false), cam = newCam(), h = makeMJ(), sp = makeSparks(S.scene, 14); S.scene.add(h.root);
  return { scene: S.scene, cam, update(tl, d, t) {
    S.live(t); onStage(h); const a = tl - 1.14, lit = a > 0; h.face(lit && a > .5 ? 'happy' : 'happy'); dance(h, tl); h.flame.set(lit ? pop(a) * .9 : 0, t);
    fountain(sp, lit ? a * .66 : 0, 0, STG + 2.5, MJZ, lit && a < .6 ? .5 : 0, 1.2);
    const k = lit ? ss(0, .18, a) : 0; look(cam, .3, lerp(2.2, 2.9, k), lerp(5.0, 3.1, k) * punch(tl, .15), 0, lerp(2.0, 2.75, k), MJZ); if (lit) shake(cam, t, .04 * Math.exp(-a * 6));
  } };
});
// 3: "and he kept dancing."
shot(4.3, 6.0, () => {
  const S = stage(false), cam = newCam(), h = makeMJ(); S.scene.add(h.root);
  return { scene: S.scene, cam, update(tl, d, t) { S.live(t, 1.3); onStage(h); h.face('happy'); dance(h, tl + 1); h.root.rotation.y = Math.sin(tl * 3) * .5; h.flame.set(1, t); look(cam, Math.sin(tl * 1.4) * 1.4, 1.5, 5.4 * punch(tl, .18), 0, 2.0, MJZ); } };
});
// 4: "He was filming a Pepsi commercial"
shot(6.0, 8.1, () => {
  const S = stage(false), cam = newCam(), h = makeMJ(); S.scene.add(h.root);
  const fc = new THREE.Group(), dk = mat({ color: 0x6a7088 }); fc.add(box(.9, .7, 1.3, dk, 0, 1.75, 0)); const lens = new THREE.Mesh(new THREE.CylinderGeometry(.22, .28, .6, 8), mat({ color: 0x2c2e38 })); lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.75, -.9); fc.add(lens);
  const reels = [-.35, .4].map(z => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .14, 10), dk); r.rotation.z = Math.PI / 2; r.position.set(0, 2.5, z); fc.add(r); return r; });
  for (const [x, z] of [[-.5, .5], [.5, .5], [0, -.6]]) { const l = box(.07, 1.6, .07, mat({ color: 0x555555 }), x * .8, .7, z * .8); l.rotation.set(-z * .5, 0, x * .5); fc.add(l); } fc.position.set(1.0, .45, 5.4); fc.rotation.y = .12; S.scene.add(fc);
  const clapT = ctex(64, 48, g => { g.fillStyle = '#16161a'; g.fillRect(0, 0, 64, 48); g.fillStyle = '#f2f2f2'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.fillText('COLA AD', 32, 20); g.font = 'bold 9px sans-serif'; g.fillText('SCENE 1', 32, 36); g.strokeStyle = '#f2f2f2'; g.strokeRect(2.5, 2.5, 59, 43); });
  const stripeT2 = ctex(32, 4, g => { for (let x = 0; x < 32; x += 4) { g.fillStyle = (x / 4) % 2 ? '#f2f2f2' : '#16161a'; g.fillRect(x, 0, 4, 4); } });
  const clap = new THREE.Group(); const cb = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), bmat({ map: clapT })); clap.add(cb); const arm = new THREE.Group(); arm.position.set(-.75, .62, 0); const ab = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .2), bmat({ map: stripeT2 })); ab.position.x = .75; arm.add(ab); clap.add(arm); S.scene.add(clap);
  return { scene: S.scene, cam, update(tl, d, t) {
    S.live(t); onStage(h); h.face('happy'); dance(h, tl); reels.forEach(r => r.rotation.x = t * 4);
    arm.rotation.z = tl < .32 ? .6 : 0; const out_ = ss(.6, .95, tl); clap.position.set(-.55 - out_ * 4, 2.75, 4.4); clap.rotation.z = .08 + out_ * .6; clap.scale.setScalar(1.0 + (tl > .32 ? Math.exp(-(tl - .32) * 12) * .12 : 0));
    look(cam, 0, 2.2, 9.6 * punch(tl, .12), 0, 1.9, 0);
  } };
});
// 5: "in front of 3,000 fans."
function fansScene() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x070818); lights(scene, 1.8, 1.5);
  const dotT = ctex(64, 32, g => { g.fillStyle = '#0a0b20'; g.fillRect(0, 0, 64, 32); const r = rng(9); for (let i = 0; i < 420; i++) { g.fillStyle = ['#e84a5a', '#3a8ae8', '#f2c21f', '#e2a57f', '#b04ad8', '#8a5a3c'][r() * 6 | 0]; g.fillRect(r() * 64 | 0, 6 + r() * 26 | 0, 1, 1); } });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), bmat({ map: dotT })); wall.position.set(0, 5.5, 13); wall.rotation.y = Math.PI; scene.add(wall);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), mat({ color: 0x14141c })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const fans = makeCrowd(scene, 7, 11, 4.4); const front = [PED_A, FAN_C, PED_B].map((p, i) => { const h = makeHuman(p); h.root.position.set((i - 1) * .95, 0, 3.4); h.root.rotation.y = Math.PI; scene.add(h.root); return h; });
  const glow = new THREE.PointLight(0xff8a3a, 0, 9); glow.position.set(0, 2.4, 1.6); scene.add(glow);
  return { scene, fans, front, glow };
}
shot(8.1, 10.4, () => {
  const F = fansScene(), cam = newCam(), sign = makeSign('3,000 FANS', '#ff4fa8', '#ffffff'); F.scene.add(sign);
  return { scene: F.scene, cam, update(tl, d, t) {
    cheer(F.fans, t, 1.2); F.front.forEach((h, i) => { h.reset(); h.skin(1); h.face(['happy', 'laugh', 'happy'][i]); h.arms[0].rotation.z = -2.5 + Math.sin(t * 9 + i) * .3; h.arms[1].rotation.z = 2.5 - Math.sin(t * 9 + i + 1) * .3; h.body.position.y = Math.abs(Math.sin(t * 8 + i * 1.3)) * .15; });
    sign.position.set(0, 3.35, 5.5); sign.rotation.y = Math.PI; sign.scale.setScalar(pop(tl - .5) * 1.25);
    look(cam, lerp(-1.1, 1.1, tl / d), 2.3, -.5 - .4 * Math.exp(-tl * 11), 0, 2.2, 5);
  } };
});
// 6: "The plan was simple."
shot(10.4, 12.3, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = burst(scene, cam, 0x2a8ad8, 0x1f5ab8, 0xbfe9ff);
  const planT = ctex(96, 64, g => { g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, 96, 64); g.fillStyle = '#16161a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('THE PLAN', 48, 12); g.strokeStyle = '#16161a'; g.lineWidth = 1.5; g.strokeRect(5.5, 18.5, 38, 40); g.strokeRect(52.5, 18.5, 38, 40);
    const man = x => { g.beginPath(); g.arc(x, 30, 4, 0, 7); g.moveTo(x, 34); g.lineTo(x, 46); g.moveTo(x, 37); g.lineTo(x - 7, 31); g.moveTo(x, 37); g.lineTo(x + 6, 42); g.moveTo(x, 46); g.lineTo(x - 5, 55); g.moveTo(x, 46); g.lineTo(x + 6, 54); g.stroke(); }; man(24); man(71);
    g.strokeStyle = '#ff5a1a'; for (const bx of [58, 85]) for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(bx, 54); g.lineTo(bx + k * 3, 30 + Math.abs(k) * 4); g.stroke(); } g.fillStyle = '#c8202a'; g.fillText('1', 11, 28); g.fillText('2', 58, 28); });
  const board = new THREE.Group(); board.add(box(3.1, 2.15, .1, mat({ color: 0x7a5232 }), 0, 0, -.06)); board.add(new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.95), bmat({ map: planT }))); scene.add(board);
  const c = makeHuman(CREW); scene.add(c.root);
  return { scene, cam, update(tl, d, t) {
    u.value = t; board.position.set(.2, 2.6, 0); board.rotation.z = Math.sin(t * 3) * .02; board.scale.setScalar(pop(tl - .05) * .8);
    c.reset(); c.skin(1); c.face('happy'); c.root.position.set(-.85, 0, 1.2); c.root.rotation.y = .5; c.arms[1].rotation.z = 2.2 + Math.sin(tl * 9) * .15; c.head.rotation.y = -.4; c.body.position.y = Math.abs(Math.sin(tl * 6)) * .04;
    look(cam, 0, 1.9, 5.4 * punch(tl, .15), .1, 1.85, 0);
  } };
});
// 7: "He dances,"
shot(12.3, 13.6, () => {
  const S = stage(false), cam = newCam(), h = makeMJ(), sp = sparkles(S.scene, 5, 0xffffff, .06); S.scene.add(h.root);
  return { scene: S.scene, cam, update(tl, d, t) {
    S.live(t); onStage(h); h.face('happy'); dance(h, tl * 1.2); h.root.rotation.y = ss(.1, .7, tl) * 6.283;
    sp.forEach((s, i) => { const an = i * 1.256 + tl * 6; s.position.set(.7 + Math.cos(an) * .3, STG + 2.5 + Math.sin(an) * .3, MJZ + .3); s.scale.setScalar(.5 + Math.max(0, Math.sin(tl * 14 + i * 2)) * 2.5); });
    look(cam, -.2, 1.9, 4.4 * punch(tl, .2), 0, 2.0, MJZ);
  } };
});
// 8: "and fireworks go off behind him."
shot(13.6, 16.0, () => {
  const S = stage(), cam = newCam(), h = makeMJ(), sp = S.pots.map(() => makeSparks(S.scene, 26, .22)); S.scene.add(h.root); const fl = new THREE.PointLight(0xfff0b0, 0, 14); fl.position.set(0, 3, -1); S.scene.add(fl);
  return { scene: S.scene, cam, update(tl, d, t) {
    S.live(t, 1.4); onStage(h); h.face('happy'); pose(h); const on = ss(.3, .5, tl);
    sp.forEach((p, i) => fountain(p, tl + i * .23, S.pots[i][0], STG + .25, S.pots[i][1], on * (1.55 + .12 * Math.sin(tl * 9 + i)), 1.3)); fl.intensity = on * (26 + 14 * Math.sin(t * 40)); S.back.material.color.setScalar(.8 + on * .5);
    look(cam, 0, 3.7, 8.8 * punch(tl, .15), 0, 2.5, -1); shake(cam, t, on * .015);
  } };
});
function closeScene() { const scene = new THREE.Scene(), cam = newCam(); lights(scene, 1.8, 1.6); const u = swirl(scene, cam, 0x3a0a14, 0x8a1828, 0xff5a3a); const h = makeMJ(); scene.add(h.root); return { scene, cam, u, h }; }
// 9: "But this time,"
shot(16.0, 17.5, () => {
  const { scene, cam, u, h } = closeScene(), sp = makeSparks(scene, 7, .08);
  return { scene, cam, update(tl, d, t) {
    u.value = t * .8; h.reset(); h.skin(1); h.face('happy'); pose(h); h.root.rotation.y = -.5; const k = tl / d;
    sp.forEach((p, i) => { const { a, b, c } = p.userData, q = clamp(k * 1.05 - a * .25); p.visible = true; p.position.set(lerp(-2.0 + b, .1 * (b - .5), q), 3.1 - q * .75 + Math.sin(q * Math.PI) * (.5 + a * .4), lerp(-1.2 + c, 0, q)); p.scale.setScalar(1.6 + Math.sin(t * 30 + i) * .6); });
    look(cam, 1.2, 2.3, lerp(3.4, 2.7, k), -.25, 2.15, 0);
  } };
});
// 10: "the sparks landed in his hair."
shot(17.5, 19.7, () => {
  const { scene, cam, u, h } = closeScene(), sp = makeSparks(scene, 6, .07), smoke = [0, 1, 2].map(() => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.1, 0), mat({ color: 0x9a9a9a, transparent: true })); scene.add(s); return s; });
  return { scene, cam, update(tl, d, t) {
    u.value = t * .8; h.reset(); h.skin(1); h.face('happy'); h.head.rotation.y = Math.sin(tl * 4) * .2; const land = .72;
    sp.forEach((p, i) => { const { a, b, c } = p.userData, q = clamp((tl - a * .3) / (land - .25)); p.visible = q < 1; p.position.set(lerp(-1.2 + b, (b - .5) * .3, q), lerp(3.2, 2.42, q * q), lerp(-.6 + c * .5, (c - .5) * .3, q)); p.scale.setScalar(1.5); });
    h.flame.set(tl > land ? Math.min(.8, .12 + ss(land, land + 1.1, tl) * .7) * (1 + .1 * Math.sin(t * 20)) : 0, t);
    smoke.forEach((s, i) => { const q = ((tl - land) * .8 + i / 3) % 1; s.visible = tl > land; s.position.set(Math.sin(q * 5 + i) * .15, 2.6 + q * .7, 0); s.scale.setScalar(.6 + q * 1.6); s.material.opacity = .7 * (1 - q); });
    look(cam, .5, 2.6, lerp(2.2, 1.85, tl / d) * punch(tl, .15), 0, 2.2, 0); if (tl > land) shake(cam, t, .02 * Math.exp(-(tl - land) * 5));
  } };
});
// 11: "And at first,"
shot(19.7, 20.95, () => {
  const S = stage(false), cam = newCam(), h = makeMJ(); S.scene.add(h.root);
  return { scene: S.scene, cam, update(tl, d, t) { S.live(t); onStage(h); h.face(Math.floor(tl * 6) % 2 ? 'happy' : 'laugh'); h.head.rotation.z = Math.sin(tl * 10) * .12; h.arms[1].rotation.z = 2.4; h.arms[0].rotation.x = -1.2; h.flame.set(.75, t); look(cam, .2, STG + 2.0, 2.3 * punch(tl, .2), 0, STG + 1.98, MJZ); } };
});
// 12a: "he had no"
shot(20.95, 21.7, () => {
  const S = stage(false), cam = newCam(), h = makeMJ(); S.scene.add(h.root);
  return { scene: S.scene, cam, update(tl, d, t) { S.live(t); onStage(h); h.face('happy'); dance(h, tl + 2); h.flame.set(1.25, t); look(cam, -1.2, 1.4, 5.0 * punch(tl, .2), 0, 2.1, MJZ); } };
});
// 12b: "idea."
shot(21.7, 22.5, () => {
  const F = fansScene(), cam = newCam();
  return { scene: F.scene, cam, update(tl, d, t) {
    cheer(F.fans, t, .2); F.glow.intensity = 16 + 8 * Math.sin(t * 30);
    F.front.forEach((h, i) => { h.reset(); h.skin(1); h.face(['shocked', 'scream', 'shocked'][i]); h.head.rotation.x = -.15; if (i === 0) h.arms[0].rotation.x = -2.0; if (i === 1) { h.arms[0].rotation.z = -2.6; h.arms[1].rotation.z = 2.6; } if (i === 2) h.arms[1].rotation.x = -2.0; });
    look(cam, 0, 1.95, .7 * punch(tl, -.6), 0, 1.7, 3.4);
  } };
});
// 13a: "Then the crew rushed in"
function crewScene() { const S = stage(false), cam = newCam(), h = makeMJ(), crew = [CREW, CREW2, CREW3].map(p => { const c = makeHuman(p); S.scene.add(c.root); return c; }); S.scene.add(h.root); return { S, cam, h, crew }; }
shot(22.5, 24.05, () => {
  const { S, cam, h, crew } = crewScene();
  return { scene: S.scene, cam, update(tl, d, t) {
    S.live(t, .3); onStage(h); const hit = clamp((tl - 1.0) / .25); h.face(hit > 0 ? 'shocked' : 'happy'); if (hit <= 0) dance(h, tl + 1); else { h.body.rotation.x = hit * .7; h.arms[0].rotation.z = -1.2; h.arms[1].rotation.z = 1.2; } h.flame.set(1.3, t);
    crew.forEach((c, i) => { c.reset(); c.skin(1); c.face('scream'); const k = ss(0, 1.05, tl), sx = [-6.5, 6.5, 0][i], sz = [MJZ, MJZ, 2.0][i], ex = [-.65, .65, 0][i], ez = [MJZ, MJZ, MJZ + .75][i];
      c.root.position.set(lerp(sx, ex, k), i === 2 ? lerp(0, STG, ss(.5, .8, tl)) : STG, lerp(sz, ez, k)); c.root.rotation.y = [Math.PI / 2, -Math.PI / 2, Math.PI][i]; if (k < 1) c.walk(tl * 16, .9); c.arms[0].rotation.x = c.arms[1].rotation.x = -1.4; c.body.rotation.x = .25; });
    look(cam, 0, 2.5, 6.4 * punch(tl, .15), 0, 2.0, MJZ); shake(cam, t, .015 + hit * .03);
  } };
});
// 13b: "and put it out."
shot(24.05, 25.3, () => {
  const { S, cam, h, crew } = crewScene(), foam = makeSparks(S.scene, 16, .1), smoke = [0, 1, 2, 3].map(() => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 0), mat({ color: 0xb0b0b0, transparent: true })); S.scene.add(s); return s; }); foam.forEach(f => f.material.color.setHex(0xffffff));
  const coat = box(.75, .12, .7, mat({ color: 0x1c1c1c })); S.scene.add(coat);
  return { scene: S.scene, cam, update(tl, d, t) {
    S.live(t, .15); onStage(h); h.face('shocked'); h.body.rotation.x = .85; h.body.position.y = -.25; h.arms[0].rotation.z = -1.0; h.arms[1].rotation.z = 1.0; h.flame.set(Math.max(0, 1.2 - tl * 3.6), t);
    crew.forEach((c, i) => { c.reset(); c.skin(1); c.face('worried'); c.root.position.set([-.7, .7, 0][i], STG, [MJZ + .2, MJZ + .2, MJZ + 1.0][i]); c.root.rotation.y = [Math.PI / 2, -Math.PI / 2, Math.PI][i]; c.body.rotation.x = .5; const pat = Math.sin(tl * 22 + i * 2); c.arms[0].rotation.x = -1.5 + pat * .35; c.arms[1].rotation.x = -1.5 - pat * .35; });
    coat.position.set(0, STG + 1.55 + Math.max(0, .35 - tl) * 3, MJZ + .55); coat.rotation.x = .5;
    foam.forEach(p => { const { a, b, c } = p.userData, u = (tl * 2.2 + a) % 1; p.visible = tl < .9; p.position.set(-.7 + u * .8, STG + 1.6 + (b - .5) * .5 * u, MJZ + .5 + (c - .5) * .5 * u); p.scale.setScalar(.6 + u); });
    smoke.forEach((s, i) => { const q = (tl * .9 + i / 4) % 1; s.visible = tl > .25; s.position.set(Math.sin(q * 5 + i * 2) * .3, STG + 1.9 + q * 2.2, MJZ + .4); s.scale.setScalar(.8 + q * 2.4); s.material.opacity = .75 * (1 - q); });
    look(cam, .3, 2.2, 4.5 * punch(tl, .15), 0, 1.9, MJZ);
  } };
});
// 14: the hospital
function hospital() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fc8c8); lights(scene, 2.1, 1.5);
  const wt = ctex(32, 32, g => { g.fillStyle = '#b8dcd8'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#9fc8c4'; g.fillRect(0, 22, 32, 10); g.fillStyle = '#e9f4f2'; g.fillRect(0, 21, 32, 1); noise(g, 32, 32, 10, 61); }, [6, 1]);
  scene.add(box(12, 6, .2, mat({ map: wt }), 0, 3, -1.2)); const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), mat({ color: 0xd8d8d0 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  scene.add(box(1.5, .9, 2.7, mat({ color: 0xf2f2f2 }), 0, .45, .5)); scene.add(box(1.5, 1.3, .14, mat({ color: 0xc9c9c9 }), 0, 1.5, -.75)); scene.add(box(1.0, .5, .2, mat({ color: 0xffffff }), 0, 1.5, -.6)); scene.add(box(1.42, .34, 1.5, mat({ color: 0x4f8fd0 }), 0, 1.03, 1.0));
  scene.add(box(.06, 2.4, .06, mat({ color: 0xaaaaaa }), -1.25, 1.2, -.3)); scene.add(box(.26, .4, .1, mat({ color: 0xd8f0ff, transparent: true, opacity: .8 }), -1.25, 2.3, -.3));
  const monT = ctex(32, 24, g => { g.fillStyle = '#06140a'; g.fillRect(0, 0, 32, 24); g.strokeStyle = '#3aff6a'; g.beginPath(); g.moveTo(0, 14); g.lineTo(8, 14); g.lineTo(11, 5); g.lineTo(14, 20); g.lineTo(17, 14); g.lineTo(32, 14); g.stroke(); });
  scene.add(box(.7, .55, .4, mat({ color: 0xd0d0c8 }), 1.35, 1.6, -.7)); const mon = new THREE.Mesh(new THREE.PlaneGeometry(.56, .42), bmat({ map: monT })); mon.position.set(1.35, 1.6, -.49); scene.add(mon); scene.add(box(.5, 1.3, .4, mat({ color: 0xb8b8b0 }), 1.35, .65, -.7));
  const h = makeMJ(); scene.add(h.root); const sit = () => { h.reset(); h.skin(1); h.bandage(true); h.root.position.set(0, .12, 0); h.legs[0].rotation.x = h.legs[1].rotation.x = -1.5; };
  return { scene, h, sit };
}
shot(25.3, 27.2, () => {
  const { scene, h, sit } = hospital(), cam = newCam(), sign = makeSign('2nd + 3rd DEGREE', '#ffffff', '#c8202a'); scene.add(sign); const doc = makeHuman(DOC); scene.add(doc.root);
  return { scene, cam, update(tl, d, t) {
    sit(); h.face('sad'); h.head.rotation.x = .1; h.arms[1].rotation.z = .3; doc.reset(); doc.skin(1); doc.face('worried'); doc.root.position.set(1.05, 0, .9); doc.root.rotation.y = -.9; doc.arms[0].rotation.x = -1.2; doc.head.rotation.x = .15;
    sign.position.set(-.1, 3.25, -1.0); sign.scale.setScalar(pop(tl - .6) * 1.25); sign.rotation.z = -.04;
    look(cam, .25, 1.9, 4.9 * punch(tl, .15), .1, 1.75, 0);
  } };
});
shot(27.2, 28.9, () => {
  const { scene, h, sit } = hospital(), cam = newCam();
  return { scene, cam, update(tl, d, t) { sit(); const brave = tl > .85; h.face(brave ? 'happy' : 'sad'); h.head.rotation.z = brave ? .06 : -.05; h.arms[1].rotation.z = brave ? 2.5 + Math.sin(tl * 9) * .25 : .3; look(cam, .25, 2.05, lerp(2.5, 2.2, tl / d) * punch(tl, .15), 0, 2.0, 0); } };
});
// 15: "Pepsi paid him 1.5 million dollars."
shot(28.9, 32.4, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = burst(scene, cam, 0x2fb86a, 0x1f8a5a, 0xf2ff9a);
  const ex = makeHuman(SUIT); scene.add(ex.root); const dr = sweat(scene);
  const check = makeSign('$1,500,000', '#f6fff0', '#0f6a2a'); scene.add(check); const bc = box(.6, .42, .16, mat({ color: 0x5a3a22 })); ex.arms[0].add(bc); bc.position.set(0, -.95, 0);
  const cash = [...Array(16)].map((_, i) => { const c = box(.34, .04, .18, mat({ color: i % 3 ? 0x3fae5a : 0x2f8a46 })); c.userData = i; scene.add(c); return c; });
  return { scene, cam, update(tl, d, t) {
    u.value = t; ex.reset(); ex.skin(1); const paid = tl > 1.25, a = tl - 1.25; ex.face(paid ? 'happy' : 'worried'); const k = ss(0, .8, tl); ex.root.position.set(lerp(-2.2, 0, k), 0, 0); ex.root.rotation.y = lerp(1.2, 0, k); if (k < 1) ex.walk(tl * 12, .6);
    if (paid) { ex.arms[0].rotation.x = -1.2; ex.arms[1].rotation.x = -1.2; ex.body.position.y = Math.abs(Math.sin(tl * 8)) * .04; } sweatAt(dr, tl, ex.root.position.x, 2.0, 0, paid ? 0 : 3); dr.forEach(p => p.visible = !paid);
    bc.visible = !paid; check.visible = paid; check.position.set(0, 1.28, .75); check.rotation.z = Math.sin(t * 4) * .03; check.scale.setScalar(paid ? pop(a) * .74 : .001);
    cash.forEach(c => { const i = c.userData, q = (a * .75 + i / 16) % 1; c.visible = paid; c.position.set(((i * 37) % 16 / 16 - .5) * 3.4 + Math.sin(q * 6 + i) * .2, 4.6 - q * 5, ((i * 53) % 7 / 7 - .5) * 1.6 + .3); c.rotation.set(q * 7 + i, q * 5, i); });
    look(cam, 0, 1.7, 3.9 * punch(tl, .15) * (paid ? punch(a, .18) : 1), 0, 1.5, 0);
  } };
});
// 16: "And he gave all of it to a burn center."
shot(32.4, 35.2, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = skyTex; lights(scene);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat({ map: paveTex })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  scene.add(box(9, 6, 4, mat({ map: FAC[1] }), 0, 3, -4.5)); scene.add(box(1.6, 2.3, .1, mat({ color: 0x6fb6d8 }), 0, 1.15, -2.46)); scene.add(box(.9, .28, .08, mat({ color: 0xe8141e }), 2.9, 4.9, -2.45)); scene.add(box(.28, .9, .08, mat({ color: 0xe8141e }), 2.9, 4.9, -2.45));
  const sign = makeSign('BURN CENTER', '#ffffff', '#c8202a'); sign.position.set(0, 3.35, -2.44); sign.scale.setScalar(2.0); scene.add(sign);
  const h = makeMJ(), doc = makeHuman(DOC), check = makeSign('$1,500,000', '#f6fff0', '#0f6a2a'); scene.add(h.root, doc.root, check);
  const hearts = [...Array(6)].map((_, i) => { const g = new THREE.Group(), m = bmat({ color: 0xff3a5a }); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.1, 0), m); b.position.set(s * .075, .05, 0); g.add(b); } const tip = new THREE.Mesh(new THREE.ConeGeometry(.17, .22, 4), m); tip.rotation.x = Math.PI; tip.position.y = -.1; g.add(tip); g.userData = i; scene.add(g); return g; });
  return { scene, cam, update(tl, d, t) {
    h.reset(); h.skin(1); h.bandage(true); h.face('happy'); h.root.position.set(-.72, 0, 0); h.root.rotation.y = .75; const give = ss(.45, .95, tl); h.arms[1].rotation.x = -1.3; h.arms[0].rotation.x = -1.3 * (1 - give);
    doc.reset(); doc.skin(1); doc.root.position.set(.72, 0, 0); doc.root.rotation.y = -.75; doc.face(give < 1 ? 'shocked' : 'laugh'); doc.arms[0].rotation.x = doc.arms[1].rotation.x = -1.3 * ss(.3, .8, tl); if (give >= 1) doc.body.position.y = Math.abs(Math.sin(tl * 9)) * .1;
    check.position.set(lerp(-.3, .3, give), 1.2 + Math.sin(give * Math.PI) * .25, .55); check.scale.setScalar(.6); check.rotation.z = (give - .5) * -.16;
    hearts.forEach(g => { const i = g.userData, q = ((tl - .95) * .6 + i / 6) % 1; g.visible = tl > .95; g.position.set(((i * 37) % 6 / 6 - .5) * 2.4, 1.9 + q * 2.0, .4); g.scale.setScalar((.8 + (i % 3) * .35) * (1 - q * .5)); g.rotation.z = Math.sin(t * 3 + i) * .3; });
    look(cam, 0, 1.7, 5.3 * punch(tl, .15), 0, 1.8, 0);
  } };
});
shot(35.2, DUR + .1, sOpen(true));

// ---------- captions ----------
let chunks = [];
function buildCaptions(words) {
  let cur = [];
  const flush = () => { if (cur.length) { chunks.push({ s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map(w => w.w.toLowerCase().replace(/[.,]+$/, '')).join(' ') }); cur = []; } };
  for (const w of words) { const len = cur.reduce((a, c) => a + c.w.length + 1, 0); if (cur.length >= 4 || len + w.w.length > 19) flush(); cur.push(w); if (/[.,?!]$/.test(w.w)) flush(); }
  flush(); chunks.forEach((c, i) => { const n = chunks[i + 1]; c.s -= .06; c.e = n ? n.s - .06 : c.e + .5; });
}
function drawCaption(t) {
  const c = chunks.find(c => t >= c.s && t < c.e); if (!c) return;
  const k = 1 + .16 * Math.exp(-(t - c.s) * 22), x = out.width / 2, y = out.height * .672;   // small pop-in on every caption
  og.save(); og.translate(x, y); og.scale(k, k); og.font = '900 58px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  og.strokeStyle = '#141000'; og.lineWidth = 12; og.strokeText(c.text, 2, 4); og.strokeText(c.text, 0, 0); og.fillStyle = '#ffec1f'; og.fillText(c.text, 0, 0); og.restore();
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
