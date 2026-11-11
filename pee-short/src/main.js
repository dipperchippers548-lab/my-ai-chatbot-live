// "Why You Can't Hold Your Pee" - PS1-style low-poly short, rendered frame by frame.
// (engine section shared with ../invisible-short)
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 42.288;
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

// ---------- pee short: helpers and models ----------
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
const BLAD = { skin: 0xf08aa0, hair: 0xf08aa0, iris: '#5a3a7a', lip: '#b03050' };
const BRAIN = { skin: 0xf5a8c0, hair: 0xf5a8c0, iris: '#3a5a9a', lip: '#b03050' };
const faceSet = p => Object.fromEntries(Object.keys(EXPR).map(e => [e, faceTex(p, e)]));
const robotTex = mode => ctex(32, 32, g => { g.fillStyle = '#8a8f9c'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#5c606c'; g.fillRect(0, 0, 32, 2); g.fillRect(0, 30, 32, 2); g.fillRect(0, 0, 2, 32); g.fillRect(30, 0, 2, 32); g.fillStyle = '#2a2c34'; for (const [x, y] of [[4, 4], [26, 4], [4, 26], [26, 26]]) g.fillRect(x, y, 2, 2); g.fillRect(8, 22, 16, 3);
  g.fillStyle = '#14151a'; g.beginPath(); g.arc(16, 13, 7, 0, 7); g.fill();
  if (mode === 'x') { g.strokeStyle = '#ff3030'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(11, 8); g.lineTo(21, 18); g.moveTo(21, 8); g.lineTo(11, 18); g.stroke(); } else { g.fillStyle = mode === 'on' ? '#ff2020' : '#5a1010'; g.beginPath(); g.arc(16, 13, 4, 0, 7); g.fill(); if (mode === 'on') { g.fillStyle = '#ffb0b0'; g.fillRect(14, 10, 2, 2); } }
  noise(g, 32, 32, 14, 31); });
const ROBOT = { on: robotTex('on'), off: robotTex('off'), x: robotTex('x') }, HEROF = faceSet(HERO);
function makeBladder() {
  const g = new THREE.Group(), bag = new THREE.Group(); g.add(bag);
  const wallM = mat({ color: 0xf07a98, transparent: true, opacity: .55, depthWrite: false }), liqM = mat({ color: 0xffd92a, emissive: 0xffc400, emissiveIntensity: .35 });
  const liq = new THREE.Mesh(new THREE.SphereGeometry(.93, 10, 8), liqM); bag.add(liq);
  const wall = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), wallM); bag.add(wall);
  const F = faceSet(BLAD), faceM = bmat({ map: F.neutral }); const face = new THREE.Mesh(new THREE.CircleGeometry(.47, 10), faceM); face.position.set(0, .22, .9); bag.add(face);
  for (const s of [-1, 1]) { const u = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1.3, 5), mat({ color: 0xd9607e })); u.position.set(s * .75, 1.2, -.2); u.rotation.z = s * .45; g.add(u); }
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 1.7, 8), mat({ color: 0xf07a98, transparent: true, opacity: .6, depthWrite: false })); tube.position.y = -1.75; g.add(tube);
  const flow = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 1, 8), liqM); g.add(flow);
  const ring = (y, color) => { const r = new THREE.Mesh(new THREE.TorusGeometry(.3, .13, 6, 10), mat({ color })); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); return r; };
  const inner = ring(-1.4, 0x8a4fd8), outer = ring(-2.15, 0x3fc060);
  const plateI = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), bmat({ map: ROBOT.on })); plateI.position.set(.78, -1.4, .1); g.add(plateI);
  const plateO = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), bmat({ map: HEROF.happy })); plateO.position.set(-.78, -2.15, .1); g.add(plateO);
  const B = { g, bag, inner, outer, plateI, plateO, flow, IY: -1.4, OY: -2.15,
    face(e) { faceM.map = F[e]; }, robot(m) { plateI.material.map = ROBOT[m]; }, you(e) { plateO.material.map = HEROF[e]; },
    fill(f, w = 0) { const s = .78 + .42 * f; bag.scale.set(s * (1 + w), s * (1 - w), s * (1 + w)); const yc = -.93 * (1 - f), r = Math.sqrt(Math.max(.05, 1 - yc * yc)); const rr = r * (.74 + .22 * f); liq.scale.set(rr, Math.max(.03, f), rr); liq.position.y = yc; },
    flowTo(y0, y1) { flow.visible = y0 - y1 > .02; flow.scale.y = Math.max(.01, y0 - y1); flow.position.y = (y0 + y1) / 2; },
    reset() { g.position.set(0, 1.9, 0); g.rotation.set(0, 0, 0); inner.scale.setScalar(1); outer.scale.setScalar(1); plateI.position.set(.78, -1.4, .1); plateI.rotation.set(0, 0, 0); plateO.position.set(-.78, -2.15, .1); plateO.rotation.set(0, 0, 0); B.flowTo(0, 0); B.robot('on'); B.you('happy'); B.face('neutral'); B.fill(.15); } };
  B.reset(); return B;
}
function peeDance(h, tl, amt = 1) { h.legs[0].rotation.z = .22; h.legs[1].rotation.z = -.22; h.legs[0].rotation.x = -.14; h.arms[0].rotation.set(-.4, 0, .6); h.arms[1].rotation.set(-.4, 0, -.6); h.body.position.y = Math.abs(Math.sin(tl * 14)) * .07 * amt; h.body.rotation.z = Math.sin(tl * 14) * .07 * amt; h.body.rotation.x = .12; h.head.rotation.z = Math.sin(tl * 9) * .1; }
function makeBang(scene) { const g = new THREE.Group(), m = bmat({ color: 0xff2a2a }); g.add(box(.14, .42, .14, m, 0, .12, 0)); g.add(box(.14, .14, .14, m, 0, -.24, 0)); const o = bmat({ color: 0xffe21f }); g.add(box(.2, .48, .1, o, 0, .12, -.03)); g.add(box(.2, .2, .1, o, 0, -.24, -.03)); scene.add(g); return g; }
function sweat(scene) { return [...Array(6)].map((_, i) => { const p = box(.05, .09, .05, bmat({ color: 0x9adfff })); scene.add(p); p.userData = i; return p; }); }
const sweatAt = (drops, tl, x, y, z, rate = 2.4) => drops.forEach(p => { const i = p.userData, k = (tl * rate + i / 6) % 1, an = i * 1.05 + .3; p.position.set(x + Math.cos(an) * (.25 + k * .5), y + k * .5 - k * k * 1.1, z + .2); p.scale.setScalar(1 - k * .6); });

// ---------- pee short: shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
// 1 / 19: the pee dance
function sDance(loopHold) {
  return () => {
    const { scene } = street(), cam = newCam(), h = makeHuman(HERO), dr = sweat(scene); scene.add(h.root);
    return { scene, cam, update(tl, d, t) {
      h.reset(); h.skin(1); h.face('worried'); peeDance(h, loopHold ? tl + .0 : tl, 1.2); sweatAt(dr, tl, 0, 2.0, 0);
      const z = loopHold ? 3.7 * punch(0) : 3.7 * punch(tl); look(cam, loopHold ? 0 : Math.sin(tl * 1.6) * .5, 1.45, z, 0, 1.05, 0); if (!loopHold) shake(cam, t, .012);
    } };
  };
}
shot(0, 2.1, sDance(false));
// 2: "and it's not your fault."
shot(2.1, 3.9, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = burst(scene, cam, 0xffd21f, 0xff9a1f, 0xfff6c0);
  const h = makeHuman(HERO); scene.add(h.root); const halo = new THREE.Mesh(new THREE.TorusGeometry(.26, .04, 5, 10), bmat({ color: 0xfff27a })); halo.rotation.x = Math.PI / 2 - .25; scene.add(halo); const sp = sparkles(scene, 6);
  return { scene, cam, update(tl, d, t) {
    u.value = t; h.reset(); h.skin(1); h.face('happy'); const sh = Math.sin(clamp(tl / .7) * Math.PI); h.arms[0].rotation.z = -.2 - sh * .6; h.arms[1].rotation.z = .2 + sh * .6; h.head.rotation.z = Math.sin(tl * 3) * .08;
    halo.position.set(0, 2.52 + Math.sin(tl * 5) * .03, 0); halo.scale.setScalar(pop(tl - .1));
    sp.forEach((s, i) => { const an = i * 1.05 + tl * 2.2; s.position.set(Math.cos(an) * .75, 1.9 + Math.sin(an * 1.7) * .45, .2 + Math.sin(an) * .3); s.scale.setScalar(.4 + Math.max(0, Math.sin(tl * 10 + i * 2)) * 1.8); });
    look(cam, .1, 1.9, 2.3 * punch(tl), 0, 1.72, 0);
  } };
});
// 3: "You see,"
shot(3.9, 5.05, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x3a1a8a, 0x8a2fd0, 0xff7ad0); const h = makeHuman(HERO); scene.add(h.root);
  return { scene, cam, update(tl, d, t) { u.value = t * 2; h.reset(); h.skin(1); h.face('neutral'); h.arms[1].rotation.x = -2.5 * ss(0, .2, tl); h.arms[1].rotation.z = .25; h.head.rotation.z = -.08; h.root.rotation.y = .25; look(cam, 0, 1.5, 2.6 * punch(tl), 0, 1.38, 0); } };
});
function bladderScene(kind) {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.3, 1.7);
  const u = kind === 'alarm' ? burst(scene, cam, 0x8a0f1f, 0x3a0612, 0xff5a3a) : kind === 'dark' ? swirl(scene, cam, 0x12060a, 0x4a0f1f, 0xc02a3a) : kind === 'happy' ? burst(scene, cam, 0x2fb86a, 0x1f8a5a, 0xf2ff9a) : burst(scene, cam, 0x2a8ad8, 0x1f5ab8, 0xbfe9ff);
  const B = makeBladder(); scene.add(B.g); return { scene, cam, u, B };
}
// 4: "your bladder is a stretchy bag."
shot(5.05, 7.35, () => {
  const { scene, cam, u, B } = bladderScene();
  return { scene, cam, update(tl, d, t) {
    u.value = t; B.reset(); B.face('happy'); const st = clamp((tl - .95) / .55), w = .22 * Math.exp(-tl * 3) * Math.sin(tl * 19) + .05 * Math.sin(tl * 6) + Math.sin(st * Math.PI * 3) * .32 * (st > 0 && st < 1 ? 1 : 0);
    B.fill(.15, w); B.g.position.y = 1.9 + Math.max(0, 1 - tl / .28) * 5; B.g.rotation.z = Math.sin(tl * 4) * .06;
    look(cam, Math.sin(tl * 1.2) * .4, 1.8, 5.6 * punch(tl, .15), 0, 1.5, 0);
  } };
});
// 5: "At around two hundred milliliters,"
shot(7.35, 9.8, () => {
  const { scene, cam, u, B } = bladderScene(), sign = makeSign('200 ml'); scene.add(sign);
  const drops = [0, 1, 2, 3].map(() => { const p = box(.1, .16, .1, bmat({ color: 0xffd92a })); scene.add(p); return p; });
  return { scene, cam, update(tl, d, t) {
    u.value = t; B.reset(); const f = lerp(.15, .42, ss(0, 1.15, tl)); B.fill(f, .03 * Math.sin(tl * 9)); B.face('neutral');
    drops.forEach((p, i) => { const k = (tl * 2.6 + i / 4) % 1; p.visible = tl < 1.3; p.position.set((i % 2 ? .62 : -.62) * (1 - k * .5), 3.0 - k * 1.2, .1); });
    sign.position.set(.3, 3.5, .5); sign.rotation.z = -.08 + Math.sin(tl * 5) * .02; sign.scale.setScalar(pop(tl - .85) * .82);
    look(cam, -.25 + tl * .2, 1.9, 5.9 * punch(tl, .12), 0, 1.65, 0);
  } };
});
// 6: "about a cup,"
shot(9.8, 10.95, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.3, 1.7); const u = burst(scene, cam, 0xff7ad0, 0xd83fa0, 0xfff0fa);
  const cup = new THREE.Group(); const liq = new THREE.Mesh(new THREE.CylinderGeometry(.5, .43, .95, 10), mat({ color: 0xffd92a, emissive: 0xffc400, emissiveIntensity: .35 })); liq.position.y = -.1; cup.add(liq);
  const gl = new THREE.Mesh(new THREE.CylinderGeometry(.58, .48, 1.35, 10), mat({ color: 0xcfefff, transparent: true, opacity: .38, depthWrite: false })); cup.add(gl); scene.add(cup); const sp = sparkles(scene, 5, 0xffffff, .07);
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.5; const land = clamp(tl / .13), sq = tl > .13 ? Math.exp(-(tl - .13) * 9) * Math.cos((tl - .13) * 24) * .22 : 0;
    cup.position.set(0, 1.2 + (1 - land * land) * 4, 0); cup.scale.set(1.5 * (1 + sq), 1.5 * (1 - sq), 1.5 * (1 + sq)); cup.rotation.y = tl * 1.2; cup.rotation.z = .08;
    sp.forEach((s, i) => { const an = i * 1.256 + tl * 3; s.position.set(Math.cos(an) * 1.25, 1.4 + Math.sin(an * 2) * .9, .6); s.scale.setScalar(tl > .13 ? .5 + Math.max(0, Math.sin(tl * 12 + i * 2)) * 2 : 0); });
    look(cam, 0, 1.6, 6.0, 0, 1.0, 0); if (tl > .13) shake(cam, t, .05 * Math.exp(-(tl - .13) * 10));
  } };
});
// 7a: "stretch sensors in the wall"
shot(10.95, 12.5, () => {
  const { scene, cam, u, B } = bladderScene(), sens = sparkles(scene, 7, 0xffff5a, .13), pulses = sparkles(scene, 4, 0x7af6ff, .12);
  return { scene, cam, update(tl, d, t) {
    u.value = t; B.reset(); B.fill(.42, .04 * Math.sin(tl * 12)); B.face('worried');
    sens.forEach((s, i) => { const an = i / 7 * 6.283 + .4, on = Math.max(0, Math.sin(tl * 13 - i * 1.3)); s.position.set(Math.cos(an) * 1.0, 1.9 + Math.sin(an) * .98, .35); s.scale.setScalar(.5 + on * 1.4); s.rotation.z = tl * 5; });
    pulses.forEach((p, i) => { const k = (tl * 1.5 + i / 4) % 1; p.position.set(Math.sin(k * 9) * .12, 2.95 + k * 2.2, 0); });
    look(cam, .3, 2.0, 4.7 * punch(tl, .15), 0, 1.8, 0);
  } };
});
// 7b: "text your brain."
shot(12.5, 14.0, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.3, 1.7); const u = swirl(scene, cam, 0x0a2a5a, 0x1a6aa8, 0x7ae0ff);
  const br = new THREE.Group(); const bm = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat({ color: 0xf5a8c0 })); bm.scale.set(1.2, .95, 1); br.add(bm); br.add(box(.06, .9, 1.9, mat({ color: 0xd97a9a }), 0, .35, 0));
  const F = faceSet(BRAIN), fm = bmat({ map: F.neutral }); const face = new THREE.Mesh(new THREE.CircleGeometry(.52, 10), fm); face.position.set(0, -.08, .97); br.add(face); scene.add(br);
  const phone = new THREE.Group(); phone.add(box(.62, 1.05, .08, mat({ color: 0x16181f }))); const scr = new THREE.Mesh(new THREE.PlaneGeometry(.52, .9), bmat({ map: ctex(32, 56, g => { g.fillStyle = '#e9f1ff'; g.fillRect(0, 0, 32, 56); g.fillStyle = '#2fc060'; g.fillRect(3, 8, 22, 12); g.fillRect(3, 24, 26, 12); g.fillStyle = '#fff'; g.font = 'bold 8px sans-serif'; g.fillText('PEE', 6, 17); g.fillText('NOW!', 5, 33); g.fillStyle = '#b8c2d8'; g.fillRect(0, 0, 32, 5); }) })); scr.position.z = .045; phone.add(scr); scene.add(phone);
  const sign = makeSign('PEE. NOW!', '#2fc060', '#ffffff'); scene.add(sign);
  return { scene, cam, update(tl, d, t) {
    u.value = t * 2; const got = tl > .35; fm.map = F[got ? 'shocked' : 'neutral']; br.position.set(-.25, 2.0 + Math.abs(Math.sin(tl * 9)) * (got ? .18 : .04), 0); br.rotation.z = got ? Math.sin(tl * 30) * .05 : 0;
    phone.position.set(.78 + Math.sin(tl * 80) * .03, .6, .9); phone.rotation.set(-.1, -.35, .12 + Math.sin(tl * 80) * .05);
    sign.position.set(0, 3.55, .3); sign.scale.setScalar(pop(tl - .3) * .85); sign.rotation.z = .06;
    look(cam, 0, 1.9, 6.4 * punch(tl, .15), 0, 1.6, 0);
  } };
});
// 8: "That's the first urge."
shot(14.0, 15.85, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(HERO), bang = makeBang(scene); scene.add(h.root);
  return { scene, cam, update(tl, d, t) {
    h.reset(); h.skin(1); const hit = tl > .22; h.face(hit ? 'shocked' : 'neutral'); if (!hit) h.walk(tl * 10, .5); else { h.body.position.y = Math.exp(-(tl - .22) * 8) * .15; h.arms[0].rotation.z = -.5; h.arms[1].rotation.z = .5; h.legs[0].rotation.z = .12; h.legs[1].rotation.z = -.12; }
    bang.position.set(.5, 2.42, .1); bang.scale.setScalar(pop(tl - .22) * .8); bang.rotation.z = -.2 + Math.sin(tl * 20) * .08;
    const z = hit ? 3.0 * punch(tl - .22, .5) : 4.4; look(cam, .15, 1.85, z, .1, 1.82, 0); if (hit) shake(cam, t, .03 * Math.exp(-(tl - .22) * 8));
  } };
});
// 9: "And you can ignore it,"
shot(15.85, 17.35, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(HERO), bang = makeBang(scene); scene.add(h.root);
  return { scene, cam, update(tl) {
    h.reset(); h.skin(1); h.face('happy'); h.walk(tl * 9, .5); h.head.rotation.z = .12; h.head.rotation.y = -.3; const fl = ss(.25, .45, tl); h.arms[1].rotation.z = 2.4 * Math.sin(fl * Math.PI); h.root.rotation.y = -.35;
    const a = Math.max(0, tl - .38); bang.position.set(.5 + a * 5, 2.42 + a * 2.2 - a * a * 3, .1); bang.rotation.z = -a * 14; bang.scale.setScalar(.8);
    look(cam, 1.2, 1.6, 3.9 * punch(tl, .12), .1, 1.3, 0);
  } };
});
// 10: "because you control one muscle at the exit."
shot(17.35, 20.0, () => {
  const { scene, cam, u, B } = bladderScene(), sp = sparkles(scene, 4, 0xffffff, .07);
  return { scene, cam, update(tl, d, t) {
    u.value = t; B.reset(); B.fill(.42); B.you('happy'); const fx = Math.max(0, Math.sin(tl * 7)); B.outer.scale.setScalar(1 - fx * .22); B.plateO.scale.setScalar(1.25 + fx * .12); B.plateO.rotation.z = Math.sin(tl * 7) * .08;
    const oy = 1.9 + B.OY; sp.forEach((s, i) => { const an = i * 1.57 + tl * 2.5; s.position.set(Math.cos(an) * .75, oy + Math.sin(an) * .5, .5); s.scale.setScalar(fx * 2); });
    look(cam, -.25, oy + .25, 3.6 * punch(tl, .2), -.3, oy + .12, 0);
  } };
});
// 11: "But there's a second muscle you don't control."
shot(20.0, 22.9, () => {
  const { scene, cam, u, B } = bladderScene('dark');
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.2; B.reset(); B.fill(.42); const k = ss(0, .55, tl), y = 1.9 + lerp(B.OY, B.IY, k); B.robot(Math.floor(tl * 5) % 2 ? 'on' : 'off'); B.inner.rotation.z = tl * 1.5; B.plateI.scale.setScalar(1.25 + Math.sin(tl * 10) * .04);
    look(cam, .25 * k - .25 * (1 - k), y + .25, lerp(3.6, 3.1, ss(.5, 2.6, tl)), .3 * k - .3 * (1 - k), y + .1, 0); shake(cam, t, .008);
  } };
});
// 12: "At around five hundred milliliters,"
shot(22.9, 25.45, () => {
  const { scene, cam, u, B } = bladderScene('alarm'), sign = makeSign('500 ml', '#ff3a2a', '#ffffff'); scene.add(sign); const dr = sweat(scene);
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.6; B.reset(); const f = lerp(.42, .9, ss(0, 1.3, tl)); B.fill(f, .03 * Math.sin(tl * 16)); B.face('worried'); B.g.position.x = Math.sin(tl * 40) * .02 * f;
    sign.position.set(.3, 3.85, .5); sign.rotation.z = -.08; sign.scale.setScalar(pop(tl - .8) * .9); sweatAt(dr, tl, 0, 2.9, 1.0, 3);
    look(cam, -.25 + tl * .2, 2.0, 6.4 * punch(tl, .12), 0, 1.75, 0); shake(cam, t, .012);
  } };
});
// 13: "your bladder starts squeezing by itself"
shot(25.45, 27.9, () => {
  const { scene, cam, u, B } = bladderScene('alarm'), lines = [...Array(8)].map(() => { const l = box(.5, .07, .07, bmat({ color: 0xffffff })); scene.add(l); return l; });
  return { scene, cam, update(tl, d, t) {
    u.value = t * 2; B.reset(); const sq = Math.pow(Math.abs(Math.sin(tl * 6.5)), 3); B.fill(.9, -sq * .16); B.face('scream'); B.g.position.x = Math.sin(tl * 50) * .03;
    lines.forEach((l, i) => { const an = i / 8 * 6.283, r = 1.95 - sq * .45; l.position.set(Math.cos(an) * r, 1.9 + Math.sin(an) * r, .2); l.rotation.z = an; l.visible = sq > .25; });
    look(cam, 0, 2.0, 5.6 - sq * .5, 0, 1.8, 0); shake(cam, t, .02 + sq * .03);
  } };
});
// 14: "and forces that one open."
shot(27.9, 29.9, () => {
  const { scene, cam, u, B } = bladderScene('alarm'), star = new THREE.Mesh(new THREE.OctahedronGeometry(.4), bmat({ color: 0xfff27a })); scene.add(star);
  return { scene, cam, update(tl, d, t) {
    u.value = t * 2; B.reset(); B.fill(.9, -.05 * Math.abs(Math.sin(tl * 13))); B.face('scream'); const a = tl - .42, open = a > 0;
    B.inner.scale.setScalar(open ? 1 + .9 * pop(a) : 1 + Math.sin(tl * 60) * .04); B.robot(open ? 'x' : 'on'); if (open) { B.plateI.position.set(.78 + a * 4, B.IY + a * 2.5 - a * a * 4, .1); B.plateI.rotation.z = -a * 12; }
    B.plateI.scale.setScalar(1.25); B.flowTo(-1.0, open ? lerp(-1.0, B.OY + .1, clamp(a / .22)) : B.IY + .12);
    star.visible = open && a < .12; star.position.set(0, 1.9 + B.IY, .5); star.scale.setScalar(1 + a * 16);
    const y = 1.9 + lerp(B.IY, (B.IY + B.OY) / 2, ss(.5, 1.0, tl)); look(cam, .2, y + .25, 3.5 * punch(tl, .15), .1, y + .1, 0); shake(cam, t, open ? .05 * Math.exp(-a * 5) + .01 : .012);
  } };
});
// 15a: "So now one muscle is holding back"
shot(29.9, 31.4, () => {
  const { scene, cam, u, B } = bladderScene('alarm'), dr = sweat(scene);
  return { scene, cam, update(tl, d, t) {
    u.value = t * 2; B.reset(); B.fill(.9); B.inner.scale.setScalar(1.9); B.plateI.visible = false; B.you('scream'); B.flowTo(-1.0, B.OY + .1 - Math.abs(Math.sin(tl * 12)) * .06);
    B.outer.scale.setScalar(.82 + Math.sin(tl * 45) * .05); B.plateO.scale.setScalar(1.45); B.plateO.position.x = -.78 + Math.sin(tl * 60) * .03; const oy = 1.9 + B.OY; sweatAt(dr, tl, -.78, oy + .35, .2, 3.5);
    look(cam, -.3, oy + .3, 3.3 * punch(tl, .2), -.35, oy + .15, 0); shake(cam, t, .02);
  } };
});
// 15b: "everything."
shot(31.4, 33.1, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(HERO), dr = sweat(scene); scene.add(h.root);
  return { scene, cam, update(tl, d, t) { h.reset(); h.skin(1); h.face('scream'); peeDance(h, tl, 1.8); sweatAt(dr, tl, 0, 2.0, 0, 4); look(cam, 0, 1.7, lerp(3.4, 2.2, tl / d) * punch(tl, .15), 0, 1.5, 0); shake(cam, t, .02 + tl * .012); } };
});
// 16: "Which never lasts."
shot(33.1, 35.5, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(HERO); scene.add(h.root);
  const pud = new THREE.Mesh(new THREE.CircleGeometry(1, 12), bmat({ color: 0xffd92a })); pud.rotation.x = -Math.PI / 2; pud.position.y = .02; scene.add(pud);
  const stream = box(.05, .8, .05, bmat({ color: 0xffd92a }), 0, .42, .12); scene.add(stream);
  return { scene, cam, update(tl, d, t) {
    h.reset(); h.skin(1); const go = tl > .55, a = tl - .55; if (!go) { h.face('scream'); peeDance(h, tl, 2); } else { h.face(a > .35 ? 'laugh' : 'sad'); h.legs[0].rotation.z = .16; h.legs[1].rotation.z = -.16; h.arms[0].rotation.z = -.15; h.arms[1].rotation.z = .15; h.head.rotation.x = -.15 * ss(.3, .7, a); }
    pud.scale.setScalar(go ? .05 + 1.5 * ss(0, 1.3, a) : .001); stream.visible = go && a < 1.3;
    const k = go ? ss(0, .9, a) : 0; look(cam, .3 * k, lerp(1.6, 2.3, k), lerp(2.6, 4.6, k), 0, lerp(1.5, .75, k), 0); if (!go) shake(cam, t, .03);
  } };
});
// 17a: "Luckily,"
shot(35.5, 36.8, () => {
  const { scene, cam, u, B } = bladderScene('happy'), sp = sparkles(scene, 6);
  return { scene, cam, update(tl, d, t) {
    u.value = t; B.reset(); B.fill(.1, .1 * Math.sin(tl * 10)); B.face('laugh'); B.g.position.y = 1.9 + Math.abs(Math.sin(tl * 7)) * .3;
    sp.forEach((s, i) => { const an = i * 1.05 + tl * 2.5; s.position.set(Math.cos(an) * 1.5, 2.0 + Math.sin(an * 1.7) * .9, .5); s.scale.setScalar(.6 + Math.max(0, Math.sin(tl * 10 + i * 2)) * 2.4); });
    look(cam, 0, 1.9, 5.2 * punch(tl, .15), 0, 1.6, 0);
  } };
});
// 17b: "it almost never bursts."
shot(36.8, 38.9, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.3, 1.7); const u = burst(scene, cam, 0x2fb86a, 0x1f8a5a, 0xf2ff9a);
  const boom = new THREE.Group(); for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.45), bmat({ color: [0xffe21f, 0xff8a1f, 0xff3a2a][i % 3] })); const an = i / 10 * 6.283; s.position.set(Math.cos(an) * .7, Math.sin(an) * .7, (i % 3) * .05); s.scale.set(1, 2.3, .5); s.rotation.z = an - Math.PI / 2; boom.add(s); }
  boom.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.75, 0), bmat({ color: 0xfff27a }))); boom.position.set(0, 1.9, 0); scene.add(boom);
  const noT = ctex(64, 64, g => { g.clearRect(0, 0, 64, 64); g.strokeStyle = '#e8141e'; g.lineWidth = 8; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.stroke(); g.beginPath(); g.moveTo(14, 14); g.lineTo(50, 50); g.stroke(); });
  const no = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), bmat({ map: noT, transparent: true })); no.position.set(0, 1.9, 1.2); scene.add(no);
  return { scene, cam, update(tl, d, t) {
    u.value = t; boom.scale.setScalar(.9 * pop(tl - .05) * (1 + Math.sin(tl * 24) * .05)); boom.rotation.z = tl * .8; const a = tl - .62; no.visible = a > 0; no.scale.setScalar(a > 0 ? lerp(2.4, 1, clamp(a / .09)) * (1 + .1 * Math.exp(-a * 8) * Math.cos(a * 25)) : 1);
    look(cam, 0, 1.9, 6.4 * punch(tl, .15), 0, 1.6, 0); if (a > 0) shake(cam, t, .05 * Math.exp(-a * 9));
  } };
});
// 18: "Sorry."
shot(38.9, 40.2, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x1a2238, 0x3a4a78, 0x8aa0d8); const h = makeHuman(HERO); scene.add(h.root);
  return { scene, cam, update(tl, d, t) { u.value = t; h.reset(); h.skin(1); h.face('sad'); h.head.rotation.x = .1; h.head.rotation.z = .07; look(cam, .1, 1.82, lerp(1.6, 1.3, tl / d), 0, 1.76, 0); } };
});
shot(40.2, DUR + .1, sDance(true));

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
