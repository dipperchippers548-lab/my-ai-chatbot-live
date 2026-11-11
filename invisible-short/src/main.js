// "Why Going Invisible Is Bad" - PS1-style low-poly short, rendered frame by frame.
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 39.6;
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

// ---------- shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
const look = (cam, px, py, pz, tx, ty, tz) => { cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz); };

// 1 & 14: hero on the street (opening, and the loop back)
function sHeroStreet(fade) {
  return () => {
    const { scene } = street(), cam = newCam(), h = makeHuman(HERO); scene.add(h.root);
    return { scene, cam, update(tl) {
      h.reset(); const k = fade ? ss(.72, 1.45, tl) : 0;
      h.skin(1 - k); h.face(fade && tl > .45 ? 'happy' : 'neutral');
      h.arms[0].rotation.z = -.08; h.arms[1].rotation.z = .08;
      if (fade) { const up = ss(.35, .7, tl); h.arms[0].rotation.x = h.arms[1].rotation.x = -2.6 * up; h.body.position.y = Math.abs(Math.sin(tl * 9)) * .05 * up; }
      else { const sh = Math.sin(clamp(tl / .9) * Math.PI); h.arms[0].rotation.z = -.08 - sh * .5; h.arms[1].rotation.z = .08 + sh * .5; h.head.rotation.z = sh * .12; }
      const z = fade ? lerp(4.6, 3.9, tl / 2) : 4.6; look(cam, 0, 1.45, z, 0, 1.12, 0);
    } };
  };
}
shot(0, 1.95, sHeroStreet(true));
// 2: close-up, eyes go black
shot(1.95, 4.05, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(HERO); scene.add(h.root);
  return { scene, cam, update(tl) {
    h.reset(); h.skin(.8);
    const blind = tl > .98; h.face(blind ? 'blind' : 'happy');
    const p = blind ? Math.exp(-(tl - .98) * 5) : 0;
    h.head.rotation.y = blind ? Math.sin((tl - .98) * 7) * .35 * (1 - p) : 0; h.head.rotation.z = Math.sin(tl * 23) * .05 * p;
    const z = (blind ? 1.75 : lerp(2.5, 2.3, tl)) - p * .2; look(cam, .12, 1.8, z, 0, 1.72, 0);
  } };
});
// 3a: "you see" - hero explains
shot(4.05, 5.05, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x3a1a8a, 0x8a2fd0, 0xff7ad0);
  const h = makeHuman(HERO); scene.add(h.root);
  return { scene, cam, update(tl, d, t) { u.value = t * 1.6; h.reset(); h.skin(1); h.face('neutral'); h.arms[1].rotation.x = -2.5 * ss(0, .25, tl); h.arms[1].rotation.z = .25; h.head.rotation.z = -.08; h.root.rotation.y = .25; look(cam, 0, 1.5, 2.6, 0, 1.38, 0); } };
});
// 3b / 4b: the eyeball catching light, then light passing through
function sEye(pass) {
  return () => {
    const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.4, 1.6);
    const u = pass ? swirl(scene, cam, 0x0a2a5a, 0x1a6aa8, 0x7ae0ff) : swirl(scene, cam, 0x3a1a8a, 0x8a2fd0, 0xff7ad0);
    const eyeT = ctex(64, 32, g => { g.fillStyle = '#f4efe6'; g.fillRect(0, 0, 64, 32); g.strokeStyle = 'rgba(200,40,40,.55)'; const r = rng(8); for (let i = 0; i < 16; i++) { g.beginPath(); let x = r() * 64, y = 32; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 7; y -= 3 + r() * 3; g.lineTo(x, y); } g.stroke(); } g.fillStyle = '#2f86c9'; g.fillRect(0, 0, 64, 8); g.fillStyle = '#1b5a8f'; for (let x = 0; x < 64; x += 3) g.fillRect(x, 3, 1, 5); g.fillStyle = '#050505'; g.fillRect(0, 0, 64, 4); });
    const em = mat({ map: eyeT, transparent: true, emissive: 0xffe060, emissiveIntensity: 0 });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), em); eye.rotation.z = Math.PI / 2; const eg = new THREE.Group(); eg.add(eye); eg.rotation.y = .7; eg.position.y = .7; scene.add(eg);
    const nm = mat({ color: pass ? 0x8b8b96 : 0xe58aa0 }); const nerve = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 3, 6), nm); nerve.rotation.z = Math.PI / 2; nerve.position.set(2.4, .7, 0); scene.add(nerve);
    const pulses = [0, 1, 2].map(() => { const p = box(.3, .5, .5, bmat({ color: 0x7af6ff })); scene.add(p); return p; });
    const beams = [...Array(7)].map((_, i) => { const b = box(.95, .09, .09, bmat({ color: 0xffec3a })); b.userData = { ph: i / 7, y: .7 + [0, .28, -.26, .14, -.12, .34, -.34][i], z: [.5, .1, -.2, .7, .3, -.1, .6][i] }; scene.add(b); return b; });
    return { scene, cam, update(tl, d, t) {
      u.value = t * 1.6; let flash = 0;
      for (const b of beams) {
        const k = (tl * .62 + b.userData.ph) % 1, x = -3.4 + k * (pass ? 7.6 : 2.55);
        b.position.set(x, b.userData.y, b.userData.z); b.visible = pass || x < -.95;
        if (!pass && k > .94) flash = Math.max(flash, (k - .94) / .06); if (!pass && k < .12) flash = Math.max(flash, 1 - k / .12);
      }
      em.opacity = pass ? .26 : 1; em.emissiveIntensity = pass ? 0 : flash * .22; eg.scale.setScalar(1 + (pass ? 0 : flash * .06));
      pulses.forEach((p, i) => { const k = (tl * .9 + i / 3) % 1; p.visible = !pass; p.position.set(1 + k * 3, .7, 0); });
      look(cam, 0, .5, lerp(7.6, 7.0, tl / d), 0, .15, 0);
    } };
  };
}
shot(5.05, 7.55, sEye(false));
// 4a: light passing straight through the ghost body
shot(7.55, 10.1, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x0a2a5a, 0x1a6aa8, 0x7ae0ff);
  const h = makeHuman(HERO); scene.add(h.root);
  const beams = [...Array(8)].map((_, i) => { const b = box(.6, .06, .06, bmat({ color: 0xffec3a })); b.userData = { ph: i / 8, y: 1.0 + (i * 37 % 8) / 8 * .95, z: ((i * 53) % 5) / 5 * .3 - .15 }; scene.add(b); return b; });
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.6; h.reset(); h.clothes(false); h.nude(true); h.skin(.46); h.face('worried'); h.root.rotation.y = .3;
    h.arms[0].rotation.z = -.5; h.arms[1].rotation.z = .5; h.head.rotation.y = Math.sin(tl * 3) * .5;
    for (const b of beams) { const k = (tl * .75 + b.userData.ph) % 1; b.position.set(-2.4 + k * 4.8, b.userData.y, b.userData.z); }
    look(cam, 0, 1.3, lerp(3.5, 3.2, tl / d), 0, 1.0, 0);
  } };
});
shot(10.1, 13.0, sEye(true));
// 5a: empty clothes walk into the lamp post
shot(13.0, 14.7, () => {
  const { scene, lamp } = street(), cam = newCam(), h = makeHuman(HERO); scene.add(h.root); lamp.position.set(1.62, 0, 0);
  const stars = [0, 1, 2].map(() => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.09), bmat({ color: 0xffe93a })); scene.add(s); return s; });
  return { scene, cam, update(tl) {
    h.reset(); h.skin(0); h.root.rotation.y = Math.PI / 2;
    const hit = 1.02, k = clamp(tl / hit), a = tl - hit;
    h.walk(tl * 11, .55); h.arms[0].rotation.x = -1.35 + Math.sin(tl * 9) * .3; h.arms[1].rotation.x = -1.35 - Math.sin(tl * 9) * .3;
    h.root.position.set(lerp(-1.7, 1.12, k), 0, 0); h.body.rotation.z = Math.sin(tl * 7) * .08;
    lamp.rotation.z = 0;
    if (a > 0) { const f = ss(0, .3, a); h.root.position.x = 1.12 - f * .55; h.body.rotation.x = -f * 1.25; h.body.position.y = -f * .1; h.legs[0].rotation.x = h.legs[1].rotation.x = -f * .5; h.arms[0].rotation.x = h.arms[1].rotation.x = -1.35 - f * 1.2; lamp.rotation.z = Math.sin(a * 60) * .05 * Math.exp(-a * 7); }
    stars.forEach((s, i) => { s.visible = a > .12; const an = a * 9 + i * 2.1; s.position.set(.75 + Math.cos(an) * .32, .78 + Math.sin(an * 1.3) * .06, Math.sin(an) * .32); });
    look(cam, .55, 1.25, 5.2, .55, 1.12, 0);
  } };
});
// 5b: total darkness
shot(14.7, 16.3, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x000000);
  const eyes = [-1, 1].map(s => { const g = new THREE.Group(); const w = new THREE.Mesh(new THREE.CircleGeometry(.22, 10), bmat({ color: 0xf6f6f0 })); w.scale.y = 1.25; const p = new THREE.Mesh(new THREE.CircleGeometry(.09, 8), bmat({ color: 0x000000 })); p.position.z = .01; g.add(w, p); g.position.set(s * .3, .45, 0); g.userData.p = p; scene.add(g); return g; });
  return { scene, cam, update(tl) {
    const bl = Math.max(Math.exp(-((tl - .55) ** 2) * 260), Math.exp(-((tl - 1.2) ** 2) * 260));
    const lx = tl < .55 ? -.09 : tl < 1.2 ? .09 : 0;
    for (const e of eyes) { e.scale.y = 1 - bl * .93; e.userData.p.position.x = lx; e.userData.p.position.y = -.03; }
    look(cam, 0, .2, 4, 0, .2, 0);
  } };
});
function makeHeap() {
  const g = new THREE.Group();
  const a = box(.72, .13, .6, [mat({ map: fabricTex(HERO.top, 'plain') }), mat({ map: fabricTex(HERO.top, 'plain') }), mat({ map: fabricTex(HERO.top, 'hoodie') }), mat({ map: fabricTex(HERO.top, 'plain') }), mat({ map: fabricTex(HERO.top, 'plain') }), mat({ map: fabricTex(HERO.top, 'plain') })], .05, .2, 0); a.rotation.set(.12, .5, -.1);
  const b = box(.56, .11, .8, mat({ map: fabricTex(HERO.pants, 'pants') }), -.08, .06, .1); b.rotation.y = -.5;
  const s1 = box(.26, .12, .4, mat({ color: 0xe6e6e6 }), .5, .06, .3); s1.rotation.y = .9; const s2 = box(.26, .12, .4, mat({ color: 0xe6e6e6 }), -.5, .06, -.2); s2.rotation.set(0, -.4, 1.57);
  g.add(a, b, s1, s2); return g;
}
function nudePose(h, tl) { h.clothes(false); h.nude(true); h.arms[0].rotation.set(-.35, 0, .55); h.arms[1].rotation.set(-.35, 0, -.55); h.legs[0].rotation.z = .1; h.legs[1].rotation.z = -.1; h.body.position.x = Math.sin(tl * 40) * .012; }
// 6: "Naked."
shot(16.3, 17.45, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(HERO), heap = makeHeap(); scene.add(h.root, heap);
  return { scene, cam, update(tl) {
    h.reset(); const drop = tl > .2;
    if (!drop) { h.skin(0); h.clothes(true); h.nude(false); h.body.rotation.z = Math.sin(tl * 20) * .05; heap.visible = false; }
    else { const a = tl - .2, f = clamp(a / .16); nudePose(h, tl); h.skin(.55); h.face('shocked'); heap.visible = true; heap.position.set(0, (1 - f * f) * .85, .32); heap.scale.set(1, lerp(3.2, 1, f) + Math.sin(clamp((a - .16) * 9) * Math.PI) * .25, 1); }
    const p = drop ? Math.exp(-(tl - .2) * 6) : 0; look(cam, 0, 1.35, 4.1 - p * .35, 0, 1.05, 0);
  } };
});
// 7: "Because clothes don't turn invisible."
shot(17.45, 20.05, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(HERO), heap = makeHeap(), pa = makeHuman(PED_A); scene.add(h.root, heap, pa.root);
  return { scene, cam, update(tl, d) {
    h.reset(); nudePose(h, tl); h.skin(.2); h.face('worried'); h.root.position.set(-.95, 0, -.4); h.root.rotation.y = .7;
    heap.position.set(.1, 0, .4);
    pa.reset(); pa.skin(1); const k = clamp(tl / 1.0); pa.root.position.set(lerp(3.4, 1.2, k), 0, .2); pa.root.rotation.y = -Math.PI / 2 + .95 * ss(.85, 1.2, tl);
    if (k < 1) pa.walk(tl * 9, .5); pa.face(tl > 1.15 ? 'confused' : 'neutral'); pa.head.rotation.x = .38 * ss(.95, 1.25, tl); pa.head.rotation.z = .16 * ss(1.2, 1.5, tl);
    look(cam, -.3, 1.35, lerp(4.5, 4.1, tl / d), .25, .95, .2);
  } };
});
// 8: "Luckily, nobody can see you."
shot(20.05, 22.75, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(HERO), pa = makeHuman(PED_A), pb = makeHuman(PED_B); scene.add(h.root, pa.root, pb.root);
  return { scene, cam, update(tl, d) {
    h.reset(); h.clothes(false); h.nude(true); h.skin(.3); h.face('happy');
    h.arms[0].rotation.set(0, 0, -2.3 + Math.sin(tl * 13) * .5); h.arms[1].rotation.set(0, 0, 2.3 + Math.sin(tl * 13 + 1) * .5);
    h.body.position.y = Math.abs(Math.sin(tl * 6.5)) * .28; h.legs[0].rotation.z = -.25 * Math.abs(Math.sin(tl * 6.5)); h.legs[1].rotation.z = .25 * Math.abs(Math.sin(tl * 6.5));
    pa.reset(); pa.skin(1); pa.face('neutral'); pa.walk(tl * 8.5, .5); pa.root.position.set(-1.1, 0, lerp(-5.5, 1.6, tl / d));
    pb.reset(); pb.skin(1); pb.face('neutral'); pb.walk(tl * 8.5 + 1, .5); pb.root.rotation.y = Math.PI; pb.root.position.set(1.15, 0, lerp(2.4, -4.5, tl / d));
    look(cam, 0, 1.6, 5.6, 0, 1.2, 0);
  } };
});
function sparkles(scene, n) { return [...Array(n)].map(() => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.05), bmat({ color: 0xfff7a0 })); scene.add(s); return s; }); }
// 9: "Except your lunch,"
shot(22.75, 24.35, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(HERO), bg = makeBurger(), sp = sparkles(scene, 5); scene.add(h.root, bg); bg.scale.setScalar(.36);
  return { scene, cam, update(tl, d) {
    h.reset(); h.clothes(false); h.nude(true); h.censor.visible = false; h.skin(.16); h.face('worried'); h.head.rotation.x = .45 * ss(.2, .5, tl);
    bg.position.set(0, 1.14 + Math.sin(tl * 5) * .015, 0); bg.rotation.set(.35, tl * 1.6, 0);
    sp.forEach((s, i) => { const an = i * 1.256 + tl * 1.5, tw = Math.max(0, Math.sin(tl * 9 + i * 2)); s.position.set(Math.cos(an) * .33, 1.16 + Math.sin(an * 2) * .14, .12 + Math.sin(an) * .1); s.scale.setScalar(.3 + tw * 1.3); });
    look(cam, .1, 1.38, lerp(2.6, 1.25, ss(0, .55, tl)), 0, 1.1, 0);
  } };
});
// 10a: the floating burger meets a pedestrian
shot(24.35, 26.0, () => {
  const { scene } = street(), cam = newCam(), h = makeHuman(HERO), bg = makeBurger(), pb = makeHuman(PED_B); scene.add(h.root, bg, pb.root); bg.scale.setScalar(.36);
  return { scene, cam, update(tl) {
    h.reset(); h.clothes(false); h.nude(true); h.censor.visible = false; h.skin(.1); h.root.rotation.y = Math.PI / 2; h.walk(tl * 8, .5);
    const x = lerp(-1.7, -.05, clamp(tl / 1.25)); h.root.position.set(x, 0, 0); bg.position.set(x + .02, 1.14 + Math.abs(Math.cos(tl * 8)) * .03, 0); bg.rotation.set(.2, tl * 2, 0);
    pb.reset(); pb.skin(1); const sc = tl > .5, run = Math.max(0, tl - 1.0);
    pb.face(sc ? 'scream' : 'neutral'); pb.root.rotation.y = -.55 + run * 3.4; pb.root.position.set(.8 + run * run * 5, 0, .3);
    if (sc) { pb.arms[0].rotation.z = -2.7 + Math.sin(tl * 30) * .15; pb.arms[1].rotation.z = 2.7 - Math.sin(tl * 30) * .15; pb.body.position.y = Math.abs(Math.sin(tl * 16)) * .07; pb.body.rotation.x = -.12; }
    if (run > 0) pb.walk(tl * 20, .9);
    look(cam, .1, 1.4, 3.7, .1, 1.12, 0);
  } };
});
// 10b: four hours while your stomach empties
shot(26.0, 29.7, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x0a4a3a, 0x1a9a6a, 0xe8ff7a);
  const bg = makeBurger(); scene.add(bg);
  const faceT = ctex(64, 64, g => { g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.save(); g.translate(32, 32); g.rotate(a); g.fillRect(-1.5, -29, 3, i % 3 ? 4 : 8); g.restore(); } g.strokeStyle = '#c22'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.stroke(); });
  const clock = new THREE.Group(); const rim = new THREE.Mesh(new THREE.CylinderGeometry(.82, .82, .16, 12), mat({ color: 0xc22222 })); rim.rotation.x = Math.PI / 2; clock.add(rim);
  const cf = new THREE.Mesh(new THREE.CircleGeometry(.75, 12), bmat({ map: faceT })); cf.position.z = .09; clock.add(cf);
  const hourH = new THREE.Group(), minH = new THREE.Group(); hourH.add(box(.09, .4, .03, bmat({ color: 0x111111 }), 0, .18, 0)); minH.add(box(.06, .62, .03, bmat({ color: 0x111111 }), 0, .29, 0)); hourH.position.z = .11; minH.position.z = .13; clock.add(hourH, minH);
  clock.position.set(0, 2.35, 0); scene.add(clock);
  const crumbs = [...Array(8)].map((_, i) => { const c = box(.09, .09, .09, mat({ color: [0xc98a3c, 0x4fb53a, 0xd8372c, 0xf4c21a][i % 4] })); scene.add(c); return c; });
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.6; const k = ss(.2, 2.0, tl), gone = tl > 2.08;
    hourH.rotation.z = -k * Math.PI * 2 / 3; minH.rotation.z = -k * Math.PI * 8; clock.rotation.z = Math.sin(tl * 3) * .05; clock.scale.setScalar(1 + (gone ? Math.exp(-(tl - 2.08) * 6) * .25 : 0));
    const s = gone ? 0 : (1 - Math.floor(k * 7) / 7 * .82) * (1 + Math.sin(tl * 26) * .04);
    bg.visible = !gone; bg.scale.setScalar(.95 * s); bg.position.set(0, .85, 0); bg.rotation.set(.38, tl * 1.4, Math.sin(tl * 9) * .06);
    crumbs.forEach((c, i) => { const a = tl - 2.08; c.visible = gone && a < .7; const an = i / 8 * 6.283; c.position.set(Math.cos(an) * a * 2.2, .85 + Math.sin(an) * a * 2.2 - a * a * 2.5, 0); c.rotation.set(a * 9, a * 7, 0); });
    look(cam, 0, 1.3, 6.0, 0, 1.2, 0);
  } };
});
// thermal camera world (used directly in shot 11 and on the guard's monitor in shot 12)
const thermal = (() => {
  const { scene } = street(true), cam = newCam(), h = makeHuman({ ...HERO, thermal: true }); scene.add(h.root);
  const wisps = [...Array(6)].map((_, i) => { const w = box(.05, .22, .02, bmat({ color: 0x8a8a8a })); scene.add(w); w.userData = i; return w; });
  return { scene, cam, update(tl, mode) {
    h.reset(); h.clothes(false); h.nude(true); h.skin(1);
    if (mode === 'walk') { const k = clamp(tl / 1.5); h.root.position.set(0, 0, lerp(-5, 0, k)); if (k < 1) { h.walk(tl * 8, .55); h.face('neutral'); } else { h.face('happy'); h.arms[0].rotation.z = -2.2 + Math.sin(tl * 12) * .4; h.arms[1].rotation.z = .1; } look(cam, 0, 1.45, 4.3, 0, 1.18, 0); }
    else { h.root.position.set(0, 0, 0); h.face('happy'); const b = Math.sin(tl * 9); h.body.rotation.z = b * .22; h.arms[0].rotation.z = -1.6 - b * .9; h.arms[1].rotation.z = 1.6 - b * .9; h.legs[0].rotation.z = -.2 - Math.max(0, b) * .5; h.legs[1].rotation.z = .2 - Math.min(0, b) * .5; h.body.position.y = Math.abs(b) * .1; look(cam, 0, 1.3, 4.0, 0, 1.1, 0); }
    wisps.forEach(w => { const i = w.userData, k = (tl * .8 + i / 6) % 1; w.position.set(h.root.position.x + ((i * 37) % 6 - 2.5) * .16, 1.9 + k * .9, h.root.position.z); w.material.color.setScalar(.5 * (1 - k)); });
  } };
})();
shot(29.7, 32.8, () => ({ scene: thermal.scene, cam: thermal.cam, update(tl) { thermal.update(tl, 'walk'); } }), { post: 'thermal' });
// 12: the guard watching the thermal feed
const RTW = 72, RTH = 128, rt = new THREE.WebGLRenderTarget(RTW, RTH), rtBuf = new Uint8Array(RTW * RTH * 4);
const monC = document.createElement('canvas'); monC.width = RTW; monC.height = RTH; const monG = monC.getContext('2d');
const monT = new THREE.CanvasTexture(monC); monT.magFilter = monT.minFilter = THREE.NearestFilter; monT.generateMipmaps = false; monT.colorSpace = THREE.SRGBColorSpace;
const PAL = [[0, 2, 0, 26], [.12, 34, 0, 96], [.3, 132, 0, 152], [.5, 232, 52, 58], [.72, 255, 162, 0], [.9, 255, 240, 84], [1, 255, 255, 255]];
function pal(v, o, d, i) { v = clamp(v); let k = 1; while (PAL[k][0] < v) k++; const a = PAL[k - 1], b = PAL[k], f = (v - a[0]) / (b[0] - a[0]); d[i] = a[1] + (b[1] - a[1]) * f; d[i + 1] = a[2] + (b[2] - a[2]) * f; d[i + 2] = a[3] + (b[3] - a[3]) * f; d[i + 3] = 255; }
function feed(tl) {
  thermal.update(tl, 'dance'); renderer.setRenderTarget(rt); renderer.render(thermal.scene, thermal.cam); renderer.readRenderTargetPixels(rt, 0, 0, RTW, RTH, rtBuf); renderer.setRenderTarget(null);
  const id = monG.createImageData(RTW, RTH), d = id.data;
  for (let y = 0; y < RTH; y++) for (let x = 0; x < RTW; x++) { const s = ((RTH - 1 - y) * RTW + x) * 4; let v = Math.pow((rtBuf[s] + rtBuf[s + 1] + rtBuf[s + 2]) / 765, 1 / 2.2); if (y % 3 === 0) v *= .82; pal(v, 0, d, (y * RTW + x) * 4); }
  monG.putImageData(id, 0, 0); monG.fillStyle = '#fff'; monG.font = 'bold 8px monospace'; monG.fillText('CAM 03', 3, 9); monG.fillStyle = '#f33'; monG.fillRect(RTW - 9, 3, 5, 5); monT.needsUpdate = true;
}
function room() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0c14); scene.add(new THREE.AmbientLight(0xffffff, .85));
  const glow = new THREE.PointLight(0xff8a3a, 14, 9); glow.position.set(0, 1.5, .3); scene.add(glow);
  const wallT = ctex(32, 32, g => { g.fillStyle = '#4a5466'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#3c4556'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 16, 32, 1); g.fillRect(0, 0, 1, 16); g.fillRect(16, 16, 1, 16); noise(g, 32, 32, 18, 12); }, [5, 3]);
  const wm = mat({ map: wallT });
  scene.add(box(9, 5, .2, wm, 0, 2.5, -1.6)); scene.add(box(9, 5, .2, wm, 0, 2.5, 4.4)); scene.add(box(9, .1, 7, mat({ color: 0x2a2d36 }), 0, -.05, 1.4));
  scene.add(box(2.6, .1, 1.1, mat({ color: 0x6b4a2e }), 0, .82, -.75)); scene.add(box(.1, .82, 1, mat({ color: 0x4a3320 }), -1.2, .41, -.75)); scene.add(box(.1, .82, 1, mat({ color: 0x4a3320 }), 1.2, .41, -.75));
  const cas = mat({ color: 0xc9c2ae }); scene.add(box(1.0, 1.5, .7, cas, 0, 1.62, -.95));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.3), bmat({ map: monT })); scr.position.set(0, 1.65, -.59); scene.add(scr);
  scene.add(box(.5, .05, .22, mat({ color: 0x9a9484 }), .75, .9, -.5)); scene.add(box(.14, .2, .14, mat({ color: 0xf2f2f2 }), -.8, .97, -.5));
  const door = box(1.1, 2.3, .06, mat({ color: 0x5a6a52 }), -1.8, 1.15, 4.28); scene.add(door); scene.add(box(.9, .6, .04, mat({ color: 0xd8c84a }), 1.5, 2.3, 4.28));
  const g = makeHuman(GUARD); g.root.position.set(0, -.3, 1.0); g.root.rotation.y = Math.PI; scene.add(g.root);
  scene.add(box(.7, .08, .7, mat({ color: 0x222222 }), 0, .5, 1.05)); scene.add(box(.7, .9, .08, mat({ color: 0x222222 }), 0, .95, 1.42));
  return { scene, g, glow };
}
shot(32.8, 34.6, () => {
  const { scene, g } = room(), cam = newCam();
  return { scene, cam, pre(tl) { feed(tl); }, update(tl, d) {
    g.reset(); g.skin(1); g.face('neutral'); g.legs[0].rotation.x = g.legs[1].rotation.x = -1.5; g.arms[1].rotation.x = -1.1; g.head.rotation.x = -.12; g.body.rotation.x = .12 * ss(.6, 1.0, tl);
    look(cam, .95, 1.75, lerp(3.3, 2.9, tl / d), -.1, 1.45, -.6);
  } };
});
shot(34.6, 36.4, () => {
  const { scene, g, glow } = room(), cam = newCam();
  return { scene, cam, pre(tl) { feed(tl + 1.8); }, update(tl) {
    g.reset(); g.skin(1); g.face('laugh'); g.legs[0].rotation.x = g.legs[1].rotation.x = -1.5; const b = Math.sin(tl * 22);
    g.body.position.y = b * .025; g.head.rotation.x = -.28 + b * .07; g.arms[0].rotation.x = -1.2; g.arms[0].rotation.z = .5; g.arms[1].rotation.x = -2.1 + b * .12;
    glow.intensity = 6; look(cam, .3, 1.5, -.95, .02, 1.48, 1.0);
  } };
});
// 13: "Sorry."
shot(36.4, 37.8, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x1a2238, 0x3a4a78, 0x8aa0d8);
  const h = makeHuman(HERO); scene.add(h.root);
  return { scene, cam, update(tl, d, t) { u.value = t * 1.0; h.reset(); h.skin(1); h.face('sad'); h.head.rotation.x = .1; h.head.rotation.z = .07; look(cam, .1, 1.82, lerp(1.6, 1.3, tl / d), 0, 1.76, 0); } };
});
shot(37.8, DUR + .1, sHeroStreet(false));

// ---------- captions ----------
let chunks = [];
function buildCaptions(words) {
  let cur = [];
  const flush = () => { if (cur.length) { chunks.push({ s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map(w => w.w.toLowerCase().replace(/[.,]/g, '')).join(' ') }); cur = []; } };
  for (const w of words) {
    const len = cur.reduce((a, c) => a + c.w.length + 1, 0);
    if (cur.length >= 4 || len + w.w.length > 19) flush();
    cur.push(w); if (/[.,?!]$/.test(w.w)) flush();
  }
  flush();
  chunks.forEach((c, i) => { const n = chunks[i + 1]; c.s -= .06; c.e = n ? n.s - .06 : c.e + .5; });
}
function drawCaption(t) {
  const c = chunks.find(c => t >= c.s && t < c.e); if (!c) return;
  og.font = '900 58px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  const x = out.width / 2, y = out.height * .672;
  og.strokeStyle = '#141000'; og.lineWidth = 12; og.strokeText(c.text, x + 2, y + 4); og.strokeText(c.text, x, y);
  og.fillStyle = '#ffec1f'; og.fillText(c.text, x, y);
}

// ---------- frame ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function renderAt(t) {
  const s = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1], tl = t - s.t0;
  if (s.pre) s.pre(tl);
  s.update(tl, s.t1 - s.t0, t); s.cam.updateMatrixWorld();
  renderer.render(s.scene, s.cam);
  lg.drawImage(renderer.domElement, 0, 0);
  const id = lg.getImageData(0, 0, W, H), d = id.data;
  for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) {
    if (s.post === 'thermal') pal(Math.pow((d[i] + d[i + 1] + d[i + 2]) / 765, .8) * (y % 2 ? 1 : .9), 0, d, i);
    const b = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - .5) * 9;
    d[i] = clamp(d[i] + b, 0, 255) & 0xF8; d[i + 1] = clamp(d[i + 1] + b, 0, 255) & 0xF8; d[i + 2] = clamp(d[i + 2] + b, 0, 255) & 0xF8;
  }
  lg.putImageData(id, 0, 0);
  if (s.post === 'thermal') {
    lg.fillStyle = '#fff'; lg.font = 'bold 10px monospace'; lg.textAlign = 'left'; lg.fillText('THERMAL', 10, 22); lg.fillText('~100 W', 10, 36);
    if (Math.floor(t * 2) % 2) { lg.fillStyle = '#f22'; lg.fillRect(W - 46, 14, 7, 7); } lg.fillStyle = '#fff'; lg.fillText('REC', W - 35, 22);
    lg.strokeStyle = 'rgba(255,255,255,.8)'; lg.lineWidth = 1; for (const [x, y, sx, sy] of [[8, 46, 1, 1], [W - 8, 46, -1, 1], [8, 300, 1, -1], [W - 8, 300, -1, -1]]) { lg.beginPath(); lg.moveTo(x + .5, y + sy * 14 + .5); lg.lineTo(x + .5, y + .5); lg.lineTo(x + sx * 14 + .5, y + .5); lg.stroke(); }
  }
  og.imageSmoothingEnabled = false; og.drawImage(lo, 0, 0, out.width, out.height);
  drawCaption(t);
}
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .93); };
const cutInfo = await (await fetch('/build/cuts.json')).json();
const toOriginal = tc => { let t = tc; for (const [a, b] of cutInfo.cuts) { if (t >= a) t += b - a; else break; } return Math.min(t, DUR - .001); };
window.renderFrame = i => window.renderTime(toOriginal((i + .5) / FPS));
window.frameCount = Math.round(cutInfo.duration * FPS);
const words = await (await fetch('/build/words.json')).json(); buildCaptions(words);
await document.fonts.load('900 58px Nunito');
window.captionChunks = chunks;
window.ready = true;
