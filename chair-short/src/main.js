// "He Flew A Lawn Chair Into Airline Traffic" - PS1-style low-poly short, rendered frame by frame.
// (engine section shared with ../invisible-short)
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 37.848;
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

// ---------- lawn chair short: models and sets ----------
const LARRY = { skin: 0xe2a57f, hair: 0x6a4a2a, top: 0x4f8fd0, pants: 0x34558c, topStyle: 'coat', mustache: true, cap: true, iris: '#5a7a9a', shoes: 0x8a6238, stubble: true };
const PILOT = { skin: 0xd9a07a, hair: 0x2a2018, top: 0xf2f2f2, pants: 0x1a2038, topStyle: 'uniform', cap: true, shoes: 0x111111, iris: '#5a3a1a' };
const PILOT2 = { ...PILOT, skin: 0x8a5a3c, hair: 0x111111, mustache: true };
const OFFICER = { skin: 0xe2b08a, hair: 0x5a5a5a, top: 0x2a3550, pants: 0x2a3550, topStyle: 'suit', hairH: .08, glasses: true, shoes: 0x111111 };
const skyHi = ctex(8, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#1238a8'); gr.addColorStop(.55, '#3f8ae8'); gr.addColorStop(1, '#bfe4ff'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); });
const cityT = ctex(64, 64, g => { g.fillStyle = '#7f8a78'; g.fillRect(0, 0, 64, 64); const r = rng(88); for (let y = 0; y < 64; y += 8) for (let x = 0; x < 64; x += 8) { g.fillStyle = ['#a8a090', '#8f9a86', '#b8b0a0', '#6f9a5a', '#9a8a80'][r() * 5 | 0]; g.fillRect(x + 1, y + 1, 6, 6); } g.fillStyle = '#55585e'; for (let k = 0; k < 64; k += 8) { g.fillRect(k, 0, 1, 64); g.fillRect(0, k, 64, 1); } noise(g, 64, 64, 14, 90); }, [14, 14]);
const webT = ctex(16, 16, g => { for (let y = 0; y < 16; y += 4) { g.fillStyle = (y / 4) % 2 ? '#f2f2f2' : '#2fa85a'; g.fillRect(0, y, 16, 4); } g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 1, 16); });
const BCOL = [0xff3a3a, 0xffd21f, 0x3a8aff, 0x3fd060, 0xff8a1f, 0xffffff, 0xff5ab0, 0x9a5aff].map(c => mat({ color: c }));
const POP_ORDER = [1, 3, 0, 6, 4, 9, 2, 11, 7, 12, 5, 8, 10, 15, 17, 20, 14, 19, 22, 16, 13, 18];
function makeGun() { const g = new THREE.Group(); g.add(box(.05, .95, .05, mat({ color: 0x2a2c34 }), 0, -.4, 0)); g.add(box(.07, .42, .17, mat({ color: 0x7a4a22 }), 0, .2, -.04)); g.add(box(.045, .26, .045, mat({ color: 0x16161a }), 0, -.15, .07)); return g; }
function makeRig() {
  const g = new THREE.Group(), metal = mat({ color: 0xc9ced6 }), web = mat({ map: webT }), chair = new THREE.Group(); g.add(chair);
  chair.add(box(.62, .06, .56, web, 0, .45, 0)); const back = box(.62, .72, .06, web, 0, .84, -.3); back.rotation.x = -.16; chair.add(back);
  for (const s of [-1, 1]) { chair.add(box(.06, .05, .58, metal, s * .33, .68, 0)); chair.add(box(.05, .68, .05, metal, s * .33, .34, .26)); chair.add(box(.05, .45, .05, metal, s * .33, .22, -.26)); chair.add(box(.2, .3, .2, mat({ color: 0x3a6ad8 }), s * .5, .32, 0)); }
  const r = rng(42), balloons = [], tiers = [5, 8, 10, 10, 9], rad = [.36, .7, .95, .92, .62]; let n = 0;
  tiers.forEach((cnt, t) => { for (let i = 0; i < cnt; i++) { const a = i / cnt * 6.283 + t * .5, R = rad[t] * (.8 + r() * .3); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.33, 1), BCOL[(n * 3 + t) % 8]); b.scale.y = 1.15; b.userData = { base: [Math.cos(a) * R, 2.0 + t * .52 + r() * .2, Math.sin(a) * R * .8], i: n }; g.add(b); balloons.push(b); n++; } });
  const lg_ = new THREE.BufferGeometry(); lg_.setAttribute('position', new THREE.BufferAttribute(new Float32Array(42 * 6), 3)); const lines = new THREE.LineSegments(lg_, new THREE.LineBasicMaterial({ color: 0xf2f2f2 })); lines.frustumCulled = false; g.add(lines);
  const larry = makeHuman(LARRY), gun = makeGun(); larry.root.position.set(0, -.36, .04); g.add(larry.root); larry.arms[1].add(gun); gun.position.set(0, -.68, .1);
  const R = { g, chair, balloons, larry, gun,
    sit() { larry.reset(); larry.skin(1); larry.legs[0].rotation.x = larry.legs[1].rotation.x = -1.5; larry.body.rotation.x = -.08; },
    set(t, count = 42, popped = 0, grow = null) {
      const dead = new Set(POP_ORDER.slice(0, popped)), p = lg_.attributes.position.array;
      balloons.forEach((b, i) => { const v = i < count && !dead.has(i), u = b.userData.base; b.visible = v; b.position.set(u[0] + Math.sin(t * 2 + i) * .04, u[1] + Math.sin(t * 2.6 + i * 2) * .03, u[2]); const s = grow ? grow(i) : 1; b.scale.set(s, s * 1.15, s);
        const cx = (i % 2 ? .33 : -.33), cz = (i % 4 < 2 ? .26 : -.26); p.set(v ? [cx, .7, cz, b.position.x, b.position.y - .36, b.position.z] : [0, 0, 0, 0, 0, 0], i * 6); });
      lg_.attributes.position.needsUpdate = true; g.rotation.z = Math.sin(t * 1.3) * .04; g.rotation.x = Math.sin(t * 1.1 + 1) * .03;
    },
    bpos(k) { const b = balloons[POP_ORDER[k]]; return b.getWorldPosition(new THREE.Vector3()); } };
  return R;
}
function makeClouds(scene, n, seed = 5) { const r = rng(seed), m = mat({ color: 0xffffff }); return [...Array(n)].map(() => { const g = new THREE.Group(); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), m); b.scale.set(1.5 + r(), .55 + r() * .3, 1); b.position.set((k - 1) * 1.3, r() * .3, r() * .5); g.add(b); } g.userData = { x: (r() - .5) * 20, y: r() * 26 - 13, z: -4 - r() * 12, s: .7 + r() * 1.3 }; scene.add(g); return g; }); }
const cloudsAt = (cl, off, drift = 0) => cl.forEach(c => { const u = c.userData; c.position.set(u.x + drift, ((u.y - off) % 26 + 26) % 26 - 13, u.z); c.scale.setScalar(u.s); });
function makePlane() {
  const g = new THREE.Group(), w = mat({ color: 0xf4f4f4 }), bl = mat({ color: 0x1f4fb0 }), rd = mat({ color: 0xd82a2a });
  const fu = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 9, 10), w); fu.rotation.z = Math.PI / 2; g.add(fu); const nose = new THREE.Mesh(new THREE.ConeGeometry(.9, 1.8, 10), w); nose.rotation.z = -Math.PI / 2; nose.position.x = 5.4; g.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.9, 2.4, 10), w); tail.rotation.z = Math.PI / 2; tail.position.x = -5.7; g.add(tail);
  g.add(box(8.6, .2, 1.84, bl, 0, .2, 0)); g.add(box(8.6, .12, 1.84, rd, 0, -.1, 0)); g.add(box(.9, .3, 1.5, mat({ color: 0x16203a }), 4.9, .45, 0));
  const wing = box(2.2, .16, 9.5, w, -.3, -.3, 0); g.add(wing); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, 1.4, 8), mat({ color: 0x8a9096 })); e.rotation.z = Math.PI / 2; e.position.set(.3, -.75, s * 2.6); g.add(e); }
  const fin = box(1.5, 2.0, .16, rd, -5.6, 1.5, 0); fin.rotation.z = -.35; g.add(fin); g.add(box(1.0, .12, 3.4, w, -5.9, .5, 0));
  return g;
}
function sky(nClouds = 14) { const scene = new THREE.Scene(), cam = newCam(); scene.background = skyHi; lights(scene, 2.1, 2.0); scene.add(cam); const clouds = makeClouds(scene, nClouds); const gnd = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat({ map: cityT })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -60; scene.add(gnd); return { scene, cam, clouds, gnd }; }
const hud = (cam, sign, y = 1.22, z = -4) => { cam.add(sign); sign.position.set(0, y, z); sign.material.depthTest = false; sign.renderOrder = 999; return sign; };
function yard() {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = skyTex; lights(scene); scene.add(cam);
  const grass = ctex(32, 32, g => { g.fillStyle = '#5aa63c'; g.fillRect(0, 0, 32, 32); const r = rng(4); for (let i = 0; i < 150; i++) { g.fillStyle = r() < .5 ? '#4a9230' : '#6fba4a'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 2); } noise(g, 32, 32, 18, 8); }, [14, 14]);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), mat({ map: grass })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  scene.add(box(8, 3.2, 5, mat({ map: FAC[1] }), -1.5, 1.6, -8)); for (const s of [-1, 1]) { const rf = box(4.6, .2, 5.4, mat({ color: 0x8a3a2a }), -1.5 + s * 1.9, 3.9, -8); rf.rotation.z = -s * .5; scene.add(rf); } scene.add(box(4, 1, 4.9, mat({ color: 0xd6c39a }), -1.5, 3.6, -8));
  const fm = mat({ color: 0x9a6a3a }); for (let x = -12; x <= 12; x += .6) scene.add(box(.5, 1.5, .08, fm, x, .75, -4.8));
  for (const [x, z] of [[5.5, -6.5], [-7, -6]]) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.14, .18, 2, 5), mat({ color: 0x5a3a22 })); tr.position.set(x, 1, z); scene.add(tr); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), mat({ color: 0x3f9a3c })); lf.position.set(x, 3, z); scene.add(lf); }
  return { scene, cam };
}

// ---------- lawn chair short: shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
// 1 / 17: the hook - a man in a lawn chair, in the sky
function sHook(hold) {
  return () => {
    const { scene, cam, clouds } = sky(), R = makeRig(), plane = makePlane(), sign = hud(cam, makeSign('1982')); scene.add(R.g, plane); R.gun.visible = false;
    return { scene, cam, update(tl, d, t) {
      const x = hold ? 0 : tl; R.sit(); R.set(t); R.larry.face('happy'); R.larry.arms[1].rotation.z = 2.4 + Math.sin(t * 9) * .3; R.g.position.y = Math.sin(t * 1.5) * .15;
      cloudsAt(clouds, 0, t * .4); plane.position.set(-16 + (hold ? 6 : x * 13), .2, -13); plane.scale.setScalar(1.2); plane.rotation.z = .04;
      sign.scale.setScalar(hold ? .001 : pop(x - .25) * .8); const k = ss(.05, .7, x); look(cam, Math.sin(x * 1.2) * .8, lerp(2.4, 1.5, k), lerp(10.5, 5.0, k), 0, lerp(2.4, 1.35, k), 0);
    } };
  };
}
shot(0, 1.95, sHook(false));
// 2: "a truck driver"
shot(1.95, 3.0, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(LARRY); scene.add(h.root, cam); const sign = hud(cam, makeSign('TRUCK DRIVER', '#ff8a1f', '#16120a'));
  const tr = new THREE.Group(), red = mat({ color: 0xd8372c }); tr.add(box(2.3, 2.6, 2.2, red, 0, 1.9, 0)); tr.add(box(2.3, 1.2, 1.3, red, 0, 1.2, 1.7)); tr.add(box(2.0, .9, .1, mat({ color: 0xbfe6ff }), 0, 2.5, 1.12)); tr.add(box(1.7, .8, .1, mat({ color: 0xc9ced6 }), 0, 1.15, 2.37)); tr.add(box(2.5, 3.4, 7, mat({ color: 0xf2f2f2 }), 0, 2.4, -4.8));
  for (const [x, z] of [[-1.2, 1.6], [1.2, 1.6], [-1.2, -.6], [1.2, -.6]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .35, 10), mat({ color: 0x1c1c1c })); w.rotation.z = Math.PI / 2; w.position.set(x, .55, z); tr.add(w); } for (const s of [-1, 1]) tr.add(box(.12, 1.6, .12, mat({ color: 0xc9ced6 }), s * 1.25, 3.6, -.9));
  tr.position.set(1.6, 0, -2.2); tr.rotation.y = -.45; scene.add(tr);
  return { scene, cam, update(tl, d, t) { h.reset(); h.skin(1); h.face('happy'); h.root.position.set(-.75, 0, 1.2); h.root.rotation.y = .2; h.arms[1].rotation.z = 2.3 * ss(0, .25, tl); h.body.position.y = Math.abs(Math.sin(tl * 9)) * .04; sign.scale.setScalar(pop(tl - .1) * .8); look(cam, -.6, 1.8, 5.6 * punch(tl, .2), .2, 1.75, 0); } };
});
// 3a: "flew a lawn chair"
shot(3.0, 4.2, () => {
  const { scene, cam, clouds } = sky(), R = makeRig(); scene.add(R.g); R.gun.visible = false;
  return { scene, cam, update(tl, d, t) { R.sit(); R.set(t); R.larry.face('happy'); R.larry.legs[0].rotation.x = -1.5 + Math.sin(t * 6) * .25; R.larry.legs[1].rotation.x = -1.5 - Math.sin(t * 6) * .25; R.g.position.y = lerp(-3.4, .6, tl / d); cloudsAt(clouds, tl * 5); look(cam, 1.1, -1.6, 4.6, 0, 1.6, 0); } };
});
// 3b: "into airline traffic."
shot(4.2, 5.85, () => {
  const { scene, cam, clouds } = sky(), R = makeRig(), plane = makePlane(); scene.add(R.g, plane); R.gun.visible = false;
  return { scene, cam, update(tl, d, t) {
    const a = tl - .45; R.sit(); R.set(t); R.larry.face(tl > .3 ? 'scream' : 'happy'); if (tl > .3) { R.larry.arms[0].rotation.z = -2.5; R.larry.arms[1].rotation.z = 2.5; }
    plane.position.set(22 - tl * 38, 1.0, -3.4); plane.rotation.y = Math.PI; plane.scale.setScalar(1.25);
    const wake = a > 0 ? Math.exp(-a * 2.2) : 0; R.g.rotation.z += Math.sin(a * 13) * .5 * wake; R.g.position.set(-wake * Math.sin(a * 7) * .5, Math.sin(t * 1.5) * .1 - wake * .3, 0); cloudsAt(clouds, 0, t * .4);
    look(cam, 0, 1.9, 7.4 * punch(tl, .15), 0, 2.0, 0); shake(cam, t, .1 * Math.exp(-Math.pow((tl - .55) * 5, 2)) + wake * .03);
  } };
});
// 4: "Larry Walters tied"
shot(5.85, 7.4, () => {
  const { scene, cam } = yard(), R = makeRig(), h = makeHuman(LARRY), sign = hud(cam, makeSign('LARRY WALTERS', '#3a8aff', '#ffffff')); scene.add(R.g, h.root); R.larry.root.visible = false;
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.33, 1), BCOL[0]); scene.add(b); const st = box(.02, 1.0, .02, bmat({ color: 0xf2f2f2 })); scene.add(st);
  return { scene, cam, update(tl, d, t) {
    R.set(t, 0); h.reset(); h.skin(1); h.face('happy'); h.root.position.set(-.95, 0, .3); h.root.rotation.y = .5; h.arms[1].rotation.z = 2.6; h.arms[0].rotation.x = -.9 + Math.sin(tl * 12) * .2; h.body.position.y = Math.abs(Math.sin(tl * 7)) * .04;
    b.position.set(-.55 + Math.sin(t * 2) * .08, 3.45, .5); st.position.set(-.57, 2.85, .5); sign.scale.setScalar(pop(tl - .15) * .8);
    look(cam, .2, 1.7, 5.4 * punch(tl, .18), -.2, 1.7, 0);
  } };
});
// 5: "more than 40 weather balloons to a garden chair."
shot(7.4, 10.6, () => {
  const { scene, cam } = yard(), R = makeRig(), fr = [PED_A, PED_B].map(p => { const f = makeHuman(p); scene.add(f.root); return f; }); scene.add(R.g); R.gun.visible = false;
  const cc = document.createElement('canvas'); cc.width = 96; cc.height = 40; const cg = cc.getContext('2d'), ct = new THREE.CanvasTexture(cc); ct.magFilter = ct.minFilter = THREE.NearestFilter; ct.generateMipmaps = false; ct.colorSpace = THREE.SRGBColorSpace;
  const sign = hud(cam, new THREE.Mesh(new THREE.PlaneGeometry(1.9, .8), bmat({ map: ct })));
  return { scene, cam, update(tl, d, t) {
    const f = ss(.15, 1.75, tl) * 42, k = Math.floor(f); R.sit(); R.set(t, k + 1, 0, i => i < k ? 1 : i === k ? pop((f - k) * .35) : 0); R.larry.face('happy'); R.larry.arms[0].rotation.z = -2.4; R.larry.arms[1].rotation.z = 2.4;
    R.g.position.y = Math.abs(Math.sin(t * 9)) * .06 * (k / 42);
    fr.forEach((p, i) => { p.reset(); p.skin(1); p.face(k > 30 ? 'worried' : 'neutral'); p.root.position.set(i ? 1.2 : -1.2, 0, -.05); p.root.rotation.y = i ? -1.2 : 1.2; p.arms[0].rotation.x = p.arms[1].rotation.x = -1.1; p.body.rotation.x = .2 + (k > 30 ? Math.sin(t * 30) * .02 : 0); });
    cg.fillStyle = '#16120a'; cg.fillRect(0, 0, 96, 40); cg.fillStyle = '#ffe21f'; cg.fillRect(3, 3, 90, 34); cg.fillStyle = '#16120a'; cg.font = 'bold 11px sans-serif'; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.fillText((k >= 40 ? '40+' : k) + ' BALLOONS', 48, 21); ct.needsUpdate = true;
    sign.scale.setScalar(.8 * (1 + (k >= 40 ? .2 * Math.exp(-(tl - 1.7) * 6) : 0))); const pb = ss(.1, 1.9, tl); look(cam, Math.sin(tl * .9) * .8, lerp(1.7, 2.6, pb), lerp(5.2, 9.2, pb), 0, lerp(1.6, 2.5, pb), 0);
  } };
});
// 6-8: what he packed
function sItem(build, a, b, c, spin = 1.6) {
  return () => { const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.3, 1.8); const u = burst(scene, cam, a, b, c), it = build(), sp = sparkles(scene, 6, 0xffffff, .07); scene.add(it);
    return { scene, cam, update(tl, d, t) { u.value = t * 1.4; const sq = Math.exp(-tl * 8) * Math.cos(tl * 22) * .25; it.position.set(0, 1.7 + Math.max(0, 1 - tl / .12) * 3, 0); it.scale.set(1 + sq, 1 - sq, 1 + sq); it.rotation.y = tl * spin; it.rotation.z = .25 + Math.sin(tl * 3) * .08;
      sp.forEach((s, i) => { const an = i * 1.05 + tl * 3; s.position.set(Math.cos(an) * 1.5, 1.7 + Math.sin(an * 1.7) * 1.1, .6); s.scale.setScalar(.5 + Math.max(0, Math.sin(tl * 11 + i * 2)) * 2.2); }); look(cam, 0, 1.9, 5.6 * punch(tl, .22), 0, 1.6, 0); if (tl < .4) shake(cam, t, .04 * Math.exp(-tl * 10)); } }; };
}
const mkSandwich = () => { const g = new THREE.Group(), br = mat({ color: 0xd8a85a }); g.add(box(1.5, .22, 1.5, br, 0, .42, 0)); g.add(box(1.5, .22, 1.5, br, 0, -.42, 0)); g.add(box(1.7, .08, 1.7, mat({ color: 0x4fb53a }), 0, .22, 0)); g.add(box(1.55, .14, 1.55, mat({ color: 0xf08aa0 }), 0, .05, 0)); const ch = box(1.5, .07, 1.5, mat({ color: 0xf4c21a }), 0, -.12, 0); ch.rotation.y = .5; g.add(ch); g.add(box(1.6, .12, 1.6, mat({ color: 0xd8372c }), 0, -.24, 0)); g.rotation.x = .5; const o = new THREE.Group(); o.add(g); return o; };
const mkRadio = () => { const g = new THREE.Group(); g.add(box(1.7, 1.1, .6, mat({ color: 0x2a2c34 }))); const sp = ctex(16, 16, c => { c.fillStyle = '#16161a'; c.fillRect(0, 0, 16, 16); c.fillStyle = '#5a5e6c'; for (let y = 1; y < 16; y += 3) c.fillRect(1, y, 14, 1); }); g.add(new THREE.Mesh(new THREE.PlaneGeometry(.8, .8), bmat({ map: sp })).translateX(-.35).translateZ(.31)); for (const y of [.25, -.2]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .12, 8), mat({ color: 0xc9ced6 })); k.rotation.x = Math.PI / 2; k.position.set(.5, y, .33); g.add(k); } g.add(box(.08, .08, .05, bmat({ color: 0xff2a2a }), .2, .38, .31)); const an = box(.04, 1.4, .04, mat({ color: 0xc9ced6 }), .65, 1.2, 0); an.rotation.z = -.2; g.add(an); return g; };
const mkGunItem = () => { const o = new THREE.Group(), g = makeGun(); g.scale.setScalar(2.2); g.rotation.z = Math.PI / 2; g.position.x = -.45; o.add(g); return o; };
shot(10.6, 12.35, sItem(mkSandwich, 0xffd21f, 0xff9a1f, 0xfff6c0));
shot(12.35, 13.3, sItem(mkRadio, 0x2a8ad8, 0x1f5ab8, 0xbfe9ff, 1.1));
shot(13.3, 14.75, sItem(mkGunItem, 0xff5a5a, 0xc8202a, 0xffe0d0, .5));
const aim = (R, rec = 0) => { R.larry.arms[1].rotation.x = -2.85 + rec * .3; R.larry.arms[1].rotation.z = .12; R.larry.head.rotation.x = -.45; };
// 9: "to pop balloons when he wanted to come down."
shot(14.75, 17.55, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = swirl(scene, cam, 0x3a1a8a, 0x8a2fd0, 0xff7ad0), R = makeRig(), star = new THREE.Mesh(new THREE.OctahedronGeometry(.3), bmat({ color: 0xfff27a })); scene.add(R.g, star);
  const arrow = new THREE.Group(), am = bmat({ color: 0x3fe06a }); arrow.add(box(.3, .9, .12, am, 0, .45, 0)); const tip = new THREE.Mesh(new THREE.ConeGeometry(.42, .55, 4), am); tip.rotation.x = Math.PI; tip.position.y = -.25; arrow.add(tip); scene.add(arrow);
  const T = [.4, .85, 1.3];
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.6; const n = T.filter(x => tl > x).length, last = n ? tl - T[n - 1] : 9; R.sit(); R.set(t, 42, n); R.larry.face('happy'); aim(R, Math.exp(-last * 14));
    R.g.position.y = 1.2 - T.reduce((s, x) => s + ss(x, x + .35, tl), 0) * .55; star.visible = n > 0 && last < .12; if (n) { star.position.copy(R.bpos(n - 1)); star.scale.setScalar(1 + last * 14); }
    arrow.position.set(1.75, 2.6 - ((tl * 1.6) % 1) * .8, .5); arrow.scale.setScalar(pop(tl - .3) * 1.2);
    look(cam, .5, 2.3, 7.6 * punch(tl, .15), .35, 2.3, 0);
  } };
});
// 10: "Then he took off."
shot(17.55, 19.2, () => {
  const { scene, cam } = yard(), R = makeRig(), fr = [PED_A, PED_B].map(p => { const f = makeHuman(p); scene.add(f.root); return f; }), dust = [0, 1, 2, 3, 4].map(() => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.25, 0), mat({ color: 0xe8e0c8, transparent: true })); scene.add(p); return p; }); scene.add(R.g);
  return { scene, cam, update(tl, d, t) {
    const a = Math.max(0, tl - .3), go = a > 0; R.sit(); R.set(t); R.larry.face(go ? 'scream' : 'happy'); if (go) { R.larry.arms[0].rotation.z = -2.6; } R.g.position.y = go ? a * a * 38 : Math.abs(Math.sin(t * 12)) * .08; if (go) R.g.rotation.z = Math.sin(a * 20) * .08;
    fr.forEach((p, i) => { p.reset(); p.skin(1); p.face(go ? 'shocked' : 'worried'); p.root.position.set(i ? 1.2 : -1.2, 0, -.05); p.root.rotation.y = i ? -1.2 : 1.2; if (!go) { p.arms[0].rotation.x = p.arms[1].rotation.x = -1.1; p.body.rotation.x = .2; } else { const fall = ss(0, .25, a); p.body.rotation.x = -fall * .5; p.head.rotation.x = -.6; p.arms[0].rotation.z = -1.8 * fall; p.arms[1].rotation.z = 1.8 * fall; } });
    dust.forEach((p, i) => { const q = clamp(a * 2.2); p.visible = go && q < 1; const an = i * 1.256; p.position.set(Math.cos(an) * q * 1.6, .2 + q * .4, Math.sin(an) * q * .8 + .3); p.scale.setScalar(.6 + q * 2); p.material.opacity = .9 * (1 - q); });
    const up = go ? ss(0, .3, a) - ss(.55, 1.0, a) : 0; look(cam, 0, 1.9, 6.8, 0, 2.0 + up * 4.5, 0); if (go) shake(cam, t, .05 * Math.exp(-a * 5));
  } };
});
// 11: "And shot up to around 16,000 feet."
shot(19.2, 22.6, () => {
  const { scene, cam, clouds, gnd } = sky(18), R = makeRig(), lines = [...Array(10)].map((_, i) => { const l = box(.05, 1.6, .05, bmat({ color: 0xffffff })); l.userData = i; scene.add(l); return l; }); scene.add(R.g); R.gun.visible = false;
  const cc = document.createElement('canvas'); cc.width = 96; cc.height = 40; const cg = cc.getContext('2d'), ct = new THREE.CanvasTexture(cc); ct.magFilter = ct.minFilter = THREE.NearestFilter; ct.generateMipmaps = false; ct.colorSpace = THREE.SRGBColorSpace; const sign = hud(cam, new THREE.Mesh(new THREE.PlaneGeometry(1.9, .8), bmat({ map: ct })));
  return { scene, cam, update(tl, d, t) {
    const k = ss(0, 1.75, tl), fast = 1 - ss(1.3, 2.2, tl), alt = Math.round(k * 160) * 100; R.sit(); R.set(t); R.larry.face(fast > .3 ? 'scream' : 'shocked'); R.larry.arms[0].rotation.set(-.9, 0, .3); R.larry.arms[1].rotation.set(-.9, 0, -.3); R.g.rotation.z += Math.sin(t * 17) * .05 * fast; R.g.position.y = Math.sin(t * 1.5) * .1;
    cloudsAt(clouds, k * 120 + tl * 1.5); gnd.position.y = -6 - k * 80; lines.forEach(l => { const i = l.userData, q = (tl * 3 + i / 10) % 1; l.visible = fast > .1; l.position.set(((i * 37) % 10 / 10 - .5) * 6, 6 - q * 10, -1 + (i % 3)); });
    cg.fillStyle = '#16120a'; cg.fillRect(0, 0, 96, 40); cg.fillStyle = k < 1 ? '#ffe21f' : '#ff3a2a'; cg.fillRect(3, 3, 90, 34); cg.fillStyle = k < 1 ? '#16120a' : '#ffffff'; cg.font = 'bold 17px sans-serif'; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.fillText(alt.toLocaleString('en-US') + ' FT', 48, 21); ct.needsUpdate = true;
    sign.scale.setScalar(.82 * (1 + (k >= 1 ? .3 * Math.exp(-(tl - 1.75) * 6) * Math.cos((tl - 1.75) * 20) : 0)));
    look(cam, Math.sin(tl * .8) * .6, lerp(.6, 1.9, k), 5.8, 0, 1.55, 0); shake(cam, t, .05 * fast);
  } };
});
// 12a: "Two airline pilots"
shot(22.6, 23.75, () => {
  const { scene, cam, clouds } = sky(), R = makeRig(), plane = makePlane(); scene.add(R.g, plane); R.gun.visible = false;
  return { scene, cam, update(tl, d, t) { R.sit(); R.set(t); R.larry.face('happy'); R.larry.arms[1].rotation.z = 2.4 + Math.sin(t * 9) * .3; R.g.position.set(2.6, 3.4, -9); R.g.scale.setScalar(.75); cloudsAt(clouds, 0, -tl * 4); plane.position.set(-3.5 + tl * 2.2, .6, 0); plane.rotation.y = -.25; plane.rotation.z = .03; look(cam, 1.5, 1.8, 11 * punch(tl, .15), .5, 1.7, 0); } };
});
function cockpit(posts = true) {
  const { scene, cam, clouds } = sky(8), grey = mat({ color: 0x6a7080 }), dk = mat({ color: 0x2a2e3a });
  scene.add(box(4.4, 1.0, .9, dk, 0, .75, -.2)); const pan = ctex(32, 16, g => { g.fillStyle = '#1a1d28'; g.fillRect(0, 0, 32, 16); const r = rng(7); for (let i = 0; i < 40; i++) { g.fillStyle = ['#3aff6a', '#ffd21f', '#ff3a3a', '#7ae0ff'][r() * 4 | 0]; g.fillRect(1 + r() * 30 | 0, 1 + r() * 14 | 0, 1, 1); } for (const x of [5, 16, 27]) { g.strokeStyle = '#c9ced6'; g.beginPath(); g.arc(x, 8, 3.5, 0, 7); g.stroke(); } });
  const pf = new THREE.Mesh(new THREE.PlaneGeometry(4.2, .9), bmat({ map: pan })); pf.position.set(0, .8, .26); scene.add(pf); const pb_ = new THREE.Mesh(new THREE.PlaneGeometry(4.2, .9), bmat({ map: pan })); pb_.position.set(0, .8, -.66); pb_.rotation.y = Math.PI; scene.add(pb_);
  if (posts) for (const x of [-.4, .4]) scene.add(box(.1, 2.4, .1, grey, x, 2.4, -.7)); scene.add(box(4.6, .3, .3, grey, 0, 3.55, -.7)); scene.add(box(4.6, .3, 4, grey, 0, 3.6, 1.4)); scene.add(box(4.6, 4, .2, grey, 0, 1.8, 3.2)); for (const s of [-1, 1]) scene.add(box(.2, 4, 4, grey, s * 2.3, 1.8, 1.3));
  const pilots = [PILOT, PILOT2].map((p, i) => { const h = makeHuman(p); h.root.position.set(i ? .43 : -.43, -.2, 1.5); h.root.rotation.y = Math.PI; scene.add(h.root); scene.add(box(.8, 1.5, .15, dk, i ? .43 : -.43, 1.2, 1.95)); return h; });
  const seat = () => pilots.forEach(h => { h.reset(); h.skin(1); h.legs[0].rotation.x = h.legs[1].rotation.x = -1.5; h.arms[0].rotation.x = h.arms[1].rotation.x = -1.0; });
  return { scene, cam, clouds, pilots, seat };
}
// 12b: "reported"
shot(23.75, 24.9, () => {
  const C = cockpit(false);
  return { scene: C.scene, cam: C.cam, update(tl, d, t) { C.seat(); const see = tl > .22; C.pilots.forEach((h, i) => { h.face(see ? (i ? 'scream' : 'shocked') : 'neutral'); if (see) { h.body.rotation.x = -.12; h.head.rotation.x = -.1; } }); cloudsAt(C.clouds, 0, tl * 3); look(C.cam, 0, 1.95, -1.5 - (see ? .5 * Math.exp(-(tl - .22) * 11) : -.3), 0, 1.75, 1.5); if (see) shake(C.cam, t, .03 * Math.exp(-(tl - .22) * 8)); } };
});
// 12c: "a man in a chair."
shot(24.9, 26.1, () => {
  const C = cockpit(), R = makeRig(), sign = hud(C.cam, makeSign('A MAN IN A CHAIR?!', '#ffffff', '#c8202a')); C.scene.add(R.g); R.gun.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) { C.seat(); C.pilots.forEach(h => { h.face('shocked'); h.head.rotation.y = .0; }); R.sit(); R.set(t); R.larry.face('happy'); R.larry.arms[1].rotation.z = 2.4 + Math.sin(t * 10) * .4; R.g.position.set(lerp(.75, -.6, tl / d), 1.15, -3.5); R.g.scale.setScalar(.5); cloudsAt(C.clouds, 0, tl * 3); sign.scale.setScalar(pop(tl - .15) * .82); look(C.cam, 0, 2.05, .95, 0, 2.15, -4); } };
});
// 13: "So he started shooting balloons."
shot(26.1, 28.5, () => {
  const { scene, cam, clouds } = sky(), R = makeRig(), star = new THREE.Mesh(new THREE.OctahedronGeometry(.3), bmat({ color: 0xfff27a })); scene.add(R.g, star); const T = [.72, 1.02, 1.32, 1.62, 1.9, 2.15];
  return { scene, cam, update(tl, d, t) {
    const n = T.filter(x => tl > x).length, last = n ? tl - T[n - 1] : 9; R.sit(); R.set(t, 42, n); R.larry.face(n ? 'happy' : 'worried'); aim(R, Math.exp(-last * 14));
    const drop = T.reduce((s, x) => s + ss(x, x + .25, tl), 0); R.g.position.y = -drop * .22; cloudsAt(clouds, -drop * 2.2, t * .4); star.visible = n > 0 && last < .1; if (n) { star.position.copy(R.bpos(n - 1)); star.scale.setScalar(1 + last * 16); }
    look(cam, .9, 1.2, 5.6 * punch(tl, .15), 0, 1.75, 0); if (n) shake(cam, t, .05 * Math.exp(-last * 12));
  } };
});
// 14a: "Then he dropped"
shot(28.5, 29.7, () => {
  const { scene, cam, clouds } = sky(), R = makeRig(), gun = makeGun(); scene.add(R.g, gun);
  return { scene, cam, update(tl, d, t) {
    const a = tl - .5, lost = a > 0; R.sit(); R.set(t, 42, 6); R.gun.visible = !lost; gun.visible = lost; R.larry.face(lost ? 'scream' : 'happy'); if (!lost) { aim(R); R.larry.arms[1].rotation.x += Math.sin(tl * 40) * .15 * ss(.2, .5, tl); } else { R.larry.arms[1].rotation.x = -.9; R.larry.arms[0].rotation.x = -1.2; R.larry.body.rotation.x = .12; R.larry.head.rotation.x = .2; gun.position.set(.6 + a * .6, 1.6 + a * 1.2 - a * a * 9, .5); gun.rotation.set(a * 9, 0, a * 7); }
    cloudsAt(clouds, 0, t * .4); look(cam, .7, 1.5, 4.6 * punch(tl, .15), .1, 1.3, 0); if (lost) shake(cam, t, .04 * Math.exp(-a * 8));
  } };
});
// 14b: "the gun."
shot(29.7, 30.5, () => {
  const { scene, cam, clouds, gnd } = sky(18), gun = makeGun(); scene.add(gun); gun.scale.setScalar(1.6);
  return { scene, cam, update(tl, d, t) { gun.position.set(0, 0, 0); gun.rotation.set(t * 11, t * 3, t * 8); cloudsAt(clouds, -tl * 28); gnd.position.y = -40 + tl * 14; look(cam, .4, 1.4 + Math.sin(t * 30) * .03, 3.4 * punch(tl, .25), 0, 0, 0); cam.rotation.z += .25; } };
});
// 15: "He still landed safely."
shot(30.5, 32.65, () => {
  const { scene } = street(), cam = newCam(), R = makeRig(), fr = [PED_A, PED_B].map(p => { const f = makeHuman(p); scene.add(f.root); return f; }); scene.add(R.g); R.gun.visible = false;
  return { scene, cam, update(tl, d, t) {
    const k = clamp(tl / .85), a = tl - .85, down = a > 0; R.sit(); R.set(t, 42, 20); R.larry.face(down ? 'laugh' : 'worried'); R.g.position.y = down ? Math.abs(Math.sin(a * 10)) * .35 * Math.exp(-a * 4) : (1 - k * k) * 7 + 0; if (down) { R.larry.arms[0].rotation.z = -2.5 + Math.sin(t * 12) * .2; R.larry.arms[1].rotation.z = 2.5 - Math.sin(t * 12) * .2; }
    fr.forEach((p, i) => { p.reset(); p.skin(1); p.face(down ? 'happy' : 'shocked'); p.root.position.set(i ? 1.9 : -1.9, 0, .8); p.root.rotation.y = i ? -.9 : .9; p.head.rotation.x = down ? 0 : -.5; if (down) { p.arms[0].rotation.z = -2.5; p.arms[1].rotation.z = 2.5; p.body.position.y = Math.abs(Math.sin(t * 9 + i)) * .15; } });
    const z = down ? lerp(7.5, 5.2, ss(0, .6, a)) : 7.5; look(cam, 0, 1.9, z, 0, down ? lerp(2.4, 1.5, ss(0, .6, a)) : 2.4, 0); if (down) shake(cam, t, .06 * Math.exp(-a * 9));
  } };
});
// 16: "And got fined $1,500 dollars."
shot(32.65, 35.55, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(LARRY), o = makeHuman(OFFICER); scene.add(h.root, o.root, cam); const sign = hud(cam, makeSign('$1,500 FINE', '#ff3a2a', '#ffffff'));
  const tk = box(.26, .34, .02, bmat({ color: 0xfff6c0 })); scene.add(tk);
  return { scene, cam, update(tl, d, t) {
    const a = tl - 1.05, hit = a > 0; h.reset(); h.skin(1); h.face(hit ? 'sad' : 'happy'); h.root.position.set(-.7, 0, 0); h.root.rotation.y = .6; if (!hit) { h.arms[0].rotation.z = -2.4; h.arms[1].rotation.z = 2.4; h.body.position.y = Math.abs(Math.sin(tl * 9)) * .1; } else { h.head.rotation.x = .25; h.arms[0].rotation.x = -1.1; }
    o.reset(); o.skin(1); o.face('neutral'); const k = ss(0, .8, tl); o.root.position.set(lerp(3.2, .7, k), 0, 0); o.root.rotation.y = -.6 - (1 - k) * .9; if (k < 1) o.walk(tl * 11, .6); o.arms[1].rotation.x = -1.2 * ss(.7, 1.0, tl);
    tk.position.set(lerp(.45, -.25, ss(.9, 1.15, tl)), 1.25, .45); tk.visible = tl > .8; tk.rotation.z = -.2;
    sign.scale.setScalar(hit ? lerp(2.2, .82, clamp(a / .08)) * (1 + .08 * Math.exp(-a * 8) * Math.cos(a * 25)) : .001); sign.rotation.z = -.07;
    look(cam, 0, 1.7, 4.7 * punch(tl, .15), 0, 1.6, 0); if (hit) shake(cam, t, .06 * Math.exp(-a * 9));
  } };
});
shot(35.55, DUR + .1, sHook(true));

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
