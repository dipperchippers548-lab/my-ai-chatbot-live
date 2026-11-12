// "The Man Who Sold The Eiffel Tower. Twice." - PS1-style low-poly short, rendered frame by frame.
// (engine section shared with ../invisible-short)
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 39.192;
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
  if (p.bowler) { const bm = mk({ color: 0x1a1a1e }); head.add(box(.68, .04, .68, bm, 0, .53, 0)); head.add(box(.46, .22, .46, bm, 0, .65, 0)); }
  if (p.tophat) { const bm = mk({ color: 0x15151a }); head.add(box(.72, .04, .72, bm, 0, .53, 0)); head.add(box(.44, .44, .44, bm, 0, .76, 0)); head.add(box(.45, .08, .45, mk({ color: 0x8a1f2a }), 0, .6, 0)); }
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

// ---------- Eiffel short: models and sets ----------
Object.assign(EXPR, {
  sly: { open: .68, browIn: -.5, browOut: 1.5, browL: 2.6, browR: -1, lx: .6, mouth: 'skew' },
  shh: { open: .9, browIn: 1.5, browOut: 1, lx: .7, mouth: 'o' },
  embarrassed: { open: .7, browIn: 4.2, browOut: -1, ly: .9, mouth: 'frown', blush: true },
});
const LUSTIG = { skin: 0xe6b592, hair: 0x1a1410, top: 0x23232e, pants: 0x23232e, topStyle: 'suit', mustache: true, tophat: true, iris: '#3a5a3a', shoes: 0x0a0a0a, hairH: .04 };
const DEALERS = [
  { skin: 0xe8b89a, hair: 0x6a4a2a, top: 0x8a6238, pants: 0x4a3a2a, topStyle: 'coat', bowler: true, mustache: true, shoes: 0x2a1a10 },
  { skin: 0xd9a07a, hair: 0x2a2018, top: 0x5a6a52, pants: 0x3a3d4a, topStyle: 'coat', bowler: true, glasses: true, shoes: 0x1a1a1a },
  { skin: 0xf0c9a8, hair: 0xb9b9b9, top: 0x6a5a7a, pants: 0x2a2a35, topStyle: 'coat', bowler: true, stubble: true, shoes: 0x1a1a1a },
  { skin: 0xc98d68, hair: 0x1a1410, top: 0xa8843a, pants: 0x4a3a2a, topStyle: 'coat', bowler: true, shoes: 0x2a1a10 },
  { skin: 0xe2a57f, hair: 0x8a4a20, top: 0x3a5a7a, pants: 0x2a2a35, topStyle: 'coat', bowler: true, mustache: true, glasses: true, shoes: 0x1a1a1a },
];
const COP = { skin: 0xd9a07a, hair: 0x2a2018, top: 0x1f2c4f, pants: 0x1a2038, topStyle: 'uniform', cap: true, mustache: true, shoes: 0x111111 };
const hud = (cam, sign, y = 1.22, z = -4) => { cam.add(sign); sign.position.set(0, y, z); sign.material.depthTest = false; sign.renderOrder = 999; return sign; };
const dynTex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return { g, t }; };
const IRON = '#7a5638';
function latticeTex(arch) {
  return ctex(64, 32, g => {
    g.strokeStyle = IRON; g.lineWidth = 2.2;
    for (let f = 0; f < 4; f++) { const x0 = f * 16; g.strokeRect(x0 + 1, 1, 14, 30); for (let y = 0; y < 32; y += 8) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + 16, y + 8); g.moveTo(x0 + 16, y); g.lineTo(x0, y + 8); g.moveTo(x0, y); g.lineTo(x0 + 16, y); g.stroke(); } }
    if (arch) for (let f = 0; f < 4; f++) { const cx = f * 16 + 8; g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(cx, 32, 5.5, 15, 0, 0, 7); g.fill(); g.restore(); g.beginPath(); g.ellipse(cx, 32, 5.5, 15, 0, Math.PI, 2 * Math.PI); g.stroke(); }
  });
}
const LAT = latticeTex(false), LATA = latticeTex(true);
function makeTower() {
  const g = new THREE.Group(), solid = mat({ color: 0x7a5638 }), tiers = [];
  const fr = (rt, rb, h, y, tex) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 4, 1, true), mat({ map: tex, alphaTest: .5, side: THREE.DoubleSide })); m.rotation.y = Math.PI / 4; const t = new THREE.Group(); t.add(m); t.position.y = y + h / 2; t.userData = { y: y + h / 2 }; g.add(t); tiers.push(t); return t; };
  const t1 = fr(1.45, 3.1, 2.4, 0, LATA); t1.add(box(2.3, .2, 2.3, solid, 0, 1.25, 0));
  const t2 = fr(.78, 1.35, 2.0, 2.5, LAT); t2.add(box(1.3, .16, 1.3, solid, 0, 1.05, 0));
  const t3 = fr(.16, .72, 4.6, 4.6, LAT); t3.add(box(.34, .32, .34, solid, 0, 2.4, 0)); t3.add(box(.05, .9, .05, solid, 0, 3.0, 0));
  return { g, tiers };
}
const duskT = ctex(64, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#4a6ad0'); gr.addColorStop(.45, '#f0a070'); gr.addColorStop(.75, '#ffd08a'); gr.addColorStop(1, '#ffe9b8'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128); const r = rng(33); g.fillStyle = 'rgba(255,225,215,.85)'; for (let i = 0; i < 8; i++) { const x = r() * 64, y = 10 + r() * 60; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + (r() - .5) * 16, y + (r() - .5) * 4, 4 + r() * 5, 1.5 + r() * 2, 0, 0, 7); g.fill(); } } noise(g, 64, 128, 8, 2); });
function paris(towerZ = -16, towerS = 1.55) {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = duskT; lights(scene, 2.0, 2.0); scene.add(cam);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 80), mat({ map: paveTex })); gr.rotation.x = -Math.PI / 2; gr.position.z = -10; scene.add(gr);
  const r = rng(12);
  for (const s of [-1, 1]) { let z = 8; for (let i = 0; i < 7; i++) { const d = 5 + r() * 2, h = 6.5 + r() * 1.5; scene.add(box(6, h, d, mat({ map: FAC[i % 2 ? 1 : 3] }), s * 9.2, h / 2, z - d / 2)); scene.add(box(6.2, .9, d, mat({ color: 0x4a5566 }), s * 9.2, h + .45, z - d / 2)); z -= d + .1; }
    for (let z = 2; z > -22; z -= 4.5) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, 1.6, 5), mat({ color: 0x5a3a22 })); tr.position.set(s * 5.2, .8, z); scene.add(tr); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(.95, 0), mat({ color: 0x4f9a3c })); lf.position.set(s * 5.2, 2.3, z); scene.add(lf); } }
  const T = makeTower(); T.g.position.set(0, 0, towerZ); T.g.scale.setScalar(towerS); scene.add(T.g);
  return { scene, cam, T };
}
function hotelRoom(dealerIdx = [0, 1, 2]) {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x2a1a14); lights(scene, 1.9, 1.5); scene.add(cam);
  const wallT = ctex(32, 32, g => { g.fillStyle = '#7a3a3a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#8f4a45'; for (let y = 0; y < 32; y += 8) for (let x = (y / 8 % 2) * 4; x < 32; x += 8) { g.beginPath(); g.moveTo(x + 2, y); g.lineTo(x + 4, y + 4); g.lineTo(x + 2, y + 8); g.lineTo(x, y + 4); g.fill(); } g.fillStyle = '#5a3a22'; g.fillRect(0, 24, 32, 8); g.fillStyle = '#d8a83a'; g.fillRect(0, 23, 32, 1); noise(g, 32, 32, 12, 44); }, [5, 1]);
  scene.add(box(14, 6, .2, mat({ map: wallT }), 0, 3, -2.4)); const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), mat({ color: 0x9a2a30 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const ch = new THREE.Group(); ch.add(box(.05, 1.0, .05, mat({ color: 0xd8a83a }), 0, .5, 0)); for (let i = 0; i < 6; i++) { const o = new THREE.Mesh(new THREE.OctahedronGeometry(.16), bmat({ color: 0xfff0b0 })); const a = i / 6 * 6.283; o.position.set(Math.cos(a) * .55, -.1, Math.sin(a) * .55); ch.add(o); } ch.add(new THREE.Mesh(new THREE.OctahedronGeometry(.24), bmat({ color: 0xffe08a }))); ch.position.set(0, 4.6, -.5); scene.add(ch);
  const chart = dynTex(64, 64), easel = new THREE.Group(); easel.add(box(1.6, 1.6, .06, mat({ color: 0x7a5232 }), 0, 1.9, 0)); const board = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.45), bmat({ map: chart.t })); board.position.set(0, 1.9, .04); easel.add(board); for (const x of [-.6, .6]) { const l = box(.07, 2.0, .07, mat({ color: 0x5a3a22 }), x, .95, -.15); l.rotation.z = -x * .15; easel.add(l); } easel.position.set(1.15, 0, -1.2); easel.rotation.y = -.3; scene.add(easel);
  const drawChart = k => { const g = chart.g; g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, 64, 64); g.fillStyle = IRON; g.beginPath(); g.moveTo(15, 6); g.lineTo(26, 58); g.lineTo(21, 58); g.quadraticCurveTo(15, 40, 9, 58); g.lineTo(4, 58); g.closePath(); g.fill(); g.fillStyle = '#d8202a'; for (let i = 0; i < 4; i++) { const h = (8 + i * 11) * clamp(k * 1.4 - i * .12); g.fillRect(32 + i * 8, 58 - h, 6, h); } g.strokeStyle = '#d8202a'; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 50); g.lineTo(32 + 28 * clamp(k), 50 - 38 * clamp(k)); g.stroke(); g.fillStyle = '#16161a'; g.font = 'bold 8px sans-serif'; g.fillText('COST', 36, 10); g.fillRect(2, 59, 60, 1); chart.t.needsUpdate = true; };
  const L = makeHuman(LUSTIG); scene.add(L.root); const ds = dealerIdx.map(i => { const d = makeHuman(DEALERS[i]); scene.add(d.root); return d; });
  const pitch = (tl, t) => { L.reset(); L.root.position.set(.15, 0, -.7); L.root.rotation.y = .35; L.arms[1].rotation.z = 1.9 + Math.sin(t * 8) * .12; L.head.rotation.y = -.4; ds.forEach((d, i) => { d.reset(); d.root.position.set(-2.0 + i * .75, 0, .5 + (i % 2) * .5); d.root.rotation.y = .9; d.head.rotation.x = Math.max(0, Math.sin(t * 5 + i * 1.7)) * .18; }); ch.rotation.y = t * .4; };
  return { scene, cam, L, ds, drawChart, pitch, easel, ch };
}
function bills(scene, n) { const r = rng(n * 3 + 2); return [...Array(n)].map(() => { const b = box(.22, .012, .11, mat({ color: r() < .5 ? 0x3fae5a : 0x58c070 })); b.userData = { a: r(), b: r(), c: r() }; scene.add(b); return b; }); }
const cashStack = () => { const g = new THREE.Group(); g.add(box(.42, .22, .24, mat({ color: 0x3fae5a }))); g.add(box(.43, .23, .07, mat({ color: 0xf6f2e6 }))); return g; };

// ---------- Eiffel short: shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
// 1 / last: the tower, 1925, and a man with a "for sale" sign
function sHook(hold) {
  return () => {
    const { scene, cam, T } = paris(), L = makeHuman(LUSTIG), sign = hud(cam, makeSign('1925')), fs = makeSign('FOR SALE', '#ffffff', '#c8202a'); scene.add(L.root, fs); scene.add(box(.06, 2.5, .06, mat({ color: 0x7a5232 }), -.2, 1.25, 1.35)); const sp = sparkles(scene, 6);
    return { scene, cam, update(tl, d, t) {
      const x = hold ? 0 : tl; L.reset(); L.face('sly'); L.root.position.set(.72, 0, 1.6); L.root.rotation.y = -.1; L.arms[0].rotation.z = -.9; L.arms[1].rotation.z = 2.7; L.head.rotation.z = Math.sin(t * 3) * .05; L.body.position.y = Math.abs(Math.sin(t * 5)) * .03;
      fs.position.set(-.2, 2.75, 1.4); fs.scale.setScalar(.6); fs.rotation.z = Math.sin(t * 4) * .05; sign.scale.setScalar(hold ? .001 : pop(x - .25) * .8);
      sp.forEach((s, i) => { const an = i * 1.05 + t * 1.5; s.position.set(Math.cos(an) * 3.5, 9 + Math.sin(an * 1.7) * 5, -15); s.scale.setScalar(2 + Math.max(0, Math.sin(t * 8 + i * 2)) * 6); });
      const k = ss(0, .6, x); look(cam, .5, 1.4, lerp(8.5, 6.6, k), .1, lerp(5.2, 4.6, k), -6);
    } };
  };
}
shot(0, 1.95, sHook(false));
// 2a: "a con man"
shot(1.95, 3.0, () => {
  const { scene, cam } = paris(), L = makeHuman(LUSTIG); scene.add(L.root);
  return { scene, cam, update(tl, d, t) { L.reset(); L.face('sly'); L.root.position.set(0, 0, 1.6); L.arms[1].rotation.z = 2.75; L.arms[1].rotation.x = -.3; L.head.rotation.z = .12 * ss(0, .3, tl); L.head.rotation.x = .12 * Math.sin(clamp(tl / .6) * Math.PI); look(cam, .15, 1.95, 4.2 * punch(tl, .25), 0, 1.9, 1.6); } };
});
// 2b: "sold the Eiffel Tower."
shot(3.0, 4.6, () => {
  const { scene, cam, T } = paris(-12, 1.5), sold = hud(cam, makeSign('SOLD', '#ffffff', '#d8141e'), .15), sp = sparkles(scene, 8);
  return { scene, cam, update(tl, d, t) {
    const a = tl - .12, hit = a > 0; sold.scale.setScalar(hit ? lerp(3.0, .95, clamp(a / .09)) * (1 + .08 * Math.exp(-a * 8) * Math.cos(a * 26)) : .001); sold.rotation.z = -.2;
    sp.forEach((s, i) => { const an = i * .785 + t * 2; s.position.set(Math.cos(an) * 4.5, 7 + Math.sin(an * 1.3) * 5, -11); s.scale.setScalar(hit ? 3 + Math.max(0, Math.sin(t * 10 + i * 2)) * 7 : 0); });
    look(cam, Math.sin(tl * 1.2) * .6, 1.0, 3.2 * punch(tl, .2), 0, 6.6, -12); if (hit) shake(cam, t, .08 * Math.exp(-a * 9));
  } };
});
// 3: "And it wasn't his."
shot(4.6, 6.35, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = burst(scene, cam, 0x8a2fd0, 0x5a1a9a, 0xffb0f0), L = makeHuman(LUSTIG), sign = hud(cam, makeSign('NOT HIS', '#ffffff', '#d8141e')); scene.add(L.root);
  return { scene, cam, update(tl, d, t) { u.value = t * 1.3; L.reset(); const sh = Math.sin(clamp(tl / .9) * Math.PI); L.face(tl > .5 ? 'laugh' : 'sly'); L.arms[0].rotation.z = -.2 - sh * .9; L.arms[1].rotation.z = .2 + sh * .9; L.body.position.y = tl > .5 ? Math.abs(Math.sin(tl * 14)) * .04 : 0; L.head.rotation.z = sh * .1; sign.scale.setScalar(pop(tl - .55) * .85); sign.rotation.z = .06; look(cam, .1, 1.85, 3.0 * punch(tl, .2), 0, 1.7, 0); } };
});
// 4a: "Victor Lustig"
shot(6.35, 7.5, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = burst(scene, cam, 0x1f9a8a, 0x0f6a6a, 0xc0fff0), L = makeHuman(LUSTIG), sign = hud(cam, makeSign('VICTOR LUSTIG', '#16120a', '#ffe21f')); scene.add(L.root);
  return { scene, cam, update(tl, d, t) { u.value = t * 1.3; L.reset(); L.face('sly'); L.arms[0].rotation.x = -1.9; L.arms[0].rotation.z = .5; L.head.rotation.z = -.08; L.root.rotation.y = -.25; sign.scale.setScalar(pop(tl - .12) * .85); look(cam, .1, 1.95, 2.6 * punch(tl, .25), 0, 1.86, 0); } };
});
// 4b: "faked government papers,"
shot(7.5, 9.15, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x2a1a14); lights(scene, 2.0, 1.8);
  scene.add(box(5, .12, 3, mat({ color: 0x6b4a2e }), 0, .9, 0)); scene.add(box(.5, .5, .4, mat({ color: 0x1f6a4a, emissive: 0x2a9a6a, emissiveIntensity: .5 }), -1.3, 1.6, -.9)); scene.add(box(.08, .7, .08, mat({ color: 0xd8a83a }), -1.3, 1.25, -.9));
  const doc = seal => ctex(48, 64, g => { g.fillStyle = '#f6f0dc'; g.fillRect(0, 0, 48, 64); g.fillStyle = '#16161a'; g.font = 'bold 7px sans-serif'; g.textAlign = 'center'; g.fillText('OFFICIAL', 24, 10); g.fillRect(6, 13, 36, 1); g.fillStyle = '#8a8478'; for (let y = 19; y < 44; y += 4) g.fillRect(6, y, 30 + (y % 8), 1); g.fillStyle = '#16161a'; g.fillRect(6, 56, 16, 1); if (seal) { g.fillStyle = '#c8202a'; g.beginPath(); g.arc(34, 52, 8, 0, 7); g.fill(); g.fillStyle = '#f6f0dc'; g.beginPath(); g.arc(34, 52, 5, 0, 7); g.fill(); g.fillStyle = '#c8202a'; g.fillRect(31, 51, 6, 2); g.fillRect(33, 49, 2, 6); } });
  const D0 = doc(false), D1 = doc(true), pm = bmat({ map: D0 }), paper = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.4), pm); scene.add(paper);
  const stamp = new THREE.Group(); stamp.add(box(.3, .12, .3, mat({ color: 0x3a2a1a }), 0, .06, 0)); stamp.add(box(.12, .34, .12, mat({ color: 0x8a1f2a }), 0, .29, 0)); const hand = box(.2, .2, .22, mat({ color: LUSTIG.skin }), 0, .5, 0); stamp.add(hand); stamp.add(box(.22, .5, .24, mat({ color: LUSTIG.top }), 0, .85, .02)); scene.add(stamp); const sp = sparkles(scene, 5, 0xffffff, .05);
  return { scene, cam, update(tl, d, t) {
    const H = .42, a = tl - H, done = a > 0, lift = ss(.75, 1.1, tl); pm.map = done ? D1 : D0;
    paper.position.set(0, lerp(.97, 1.75, lift), lerp(.1, .9, lift)); paper.rotation.set(lerp(-Math.PI / 2, -.25, lift), 0, lerp(.08, -.05, lift)); paper.scale.setScalar(1 + lift * .25);
    const dn = tl < H ? ss(.18, H, tl) : 1 - ss(0, .2, a); stamp.position.set(.28, .97 + (1 - dn) * .9 + lift * 2.5, .42); stamp.rotation.z = (1 - dn) * .3;
    sp.forEach((s, i) => { const an = i * 1.256 + t * 3; s.position.set(Math.cos(an) * .8, 1.85 + Math.sin(an) * .75, 1.0); s.scale.setScalar(lift > .9 ? .6 + Math.max(0, Math.sin(t * 12 + i * 2)) * 2 : 0); });
    look(cam, 0, lerp(2.5, 2.1, lift), lerp(1.9, 2.9, lift), 0, lerp(.95, 1.7, lift), lerp(.1, .5, lift)); if (done) shake(cam, t, .05 * Math.exp(-a * 10));
  } };
});
// 5: "and invited scrap metal dealers"
shot(9.15, 11.45, () => {
  const { scene, cam } = paris(-30, 1.2), ds = DEALERS.map(p => { const d = makeHuman(p); scene.add(d.root); return d; });
  const r = rng(8); for (const sx of [-3.4, 3.2]) for (let i = 0; i < 22; i++) { const b = box(.3 + r() * .7, .12 + r() * .5, .3 + r() * .6, mat({ color: [0x8a8f96, 0x6a5a4a, 0x9a6a3a, 0x5c606c][i % 4] }), sx + (r() - .5) * 2.4, .15 + r() * 1.4 * (1 - Math.abs(r() - .5)), -2.2 + (r() - .5) * 1.6); b.rotation.set(r() * 3, r() * 3, r() * 3); scene.add(b); }
  const letters = ds.map(() => { const l = box(.32, .22, .02, bmat({ color: 0xfff6dc })); l.add(box(.08, .08, .025, bmat({ color: 0xc8202a }))); scene.add(l); return l; });
  return { scene, cam, update(tl, d, t) {
    ds.forEach((h, i) => { const x = (i - 2) * .92, z = .3 - Math.abs(i - 2) * .25, got = tl > .35 + i * .16; h.reset(); h.root.position.set(x, 0, z); h.root.rotation.y = (2 - i) * .12; h.face(got ? (i % 2 ? 'happy' : 'shocked') : 'neutral'); h.arms[1].rotation.x = got ? -1.5 : 0; h.body.position.y = got ? Math.abs(Math.sin((tl - i * .16) * 9)) * .06 : 0;
      const q = clamp((tl - .1 - i * .16) / .25); letters[i].position.set(lerp(x - 3, x + .32, q), lerp(4.5, 1.25, q * q), lerp(2, z + .55, q)); letters[i].rotation.z = (1 - q) * 6; });
    look(cam, lerp(-.9, .9, tl / d), 1.9, 6.0 * punch(tl, .15), 0, 1.3, 0);
  } };
});
// 6: "to a fancy hotel."
shot(11.45, 13.2, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = duskT; lights(scene, 2.1, 1.9); scene.add(cam);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat({ map: paveTex })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  scene.add(box(12, 12, 4, mat({ map: FAC[1] }), 0, 6, -5)); scene.add(box(12.4, 1.2, 4.4, mat({ color: 0x4a5566 }), 0, 12.6, -5)); scene.add(box(2.2, 3.2, .2, mat({ color: 0x3a2a1a }), 0, 1.6, -2.95)); scene.add(box(1.8, 2.8, .1, mat({ color: 0xffd98a, emissive: 0xffc86a, emissiveIntensity: .7 }), 0, 1.5, -2.88));
  const aw = box(3.4, .18, 2.2, mat({ color: 0xc0202a }), 0, 3.5, -2.0); aw.rotation.x = .25; scene.add(aw); for (const x of [-1.55, 1.55]) scene.add(box(.08, 3.3, .08, mat({ color: 0xd8a83a }), x, 1.65, -1.1));
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 9), mat({ color: 0xc0202a })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, .02, 1.5); scene.add(carpet);
  for (const x of [-2.3, 2.3]) { scene.add(box(.5, .5, .5, mat({ color: 0x8a6238 }), x, .25, -2.2)); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(.6, 0), mat({ color: 0x3f9a3c })); lf.position.set(x, 1.1, -2.2); scene.add(lf); }
  const sign = makeSign('GRAND HOTEL', '#1a1410', '#ffd24a'); sign.position.set(0, 4.75, -2.85); sign.scale.setScalar(1.7); scene.add(sign); const sp = sparkles(scene, 8, 0xfff7a0, .08);
  return { scene, cam, update(tl, d, t) { sp.forEach((s, i) => { const an = i * .785 + t; s.position.set(Math.cos(an) * 2.6, 4.2 + Math.sin(an * 1.6) * 2.2, -2.2); s.scale.setScalar(.6 + Math.max(0, Math.sin(t * 9 + i * 2)) * 2.4); }); sign.scale.setScalar(1.7 * pop(tl - .05)); look(cam, 0, 1.5, 8.2 * punch(tl, .22), 0, lerp(2.6, 3.6, ss(0, 1, tl)), -3); } };
});
// 7a: "He told them the tower"
shot(13.2, 14.6, () => { const R = hotelRoom(); return { scene: R.scene, cam: R.cam, update(tl, d, t) { R.drawChart(.25); R.pitch(tl, t); R.L.face('sly'); R.ds.forEach(x => x.face('neutral')); look(R.cam, -.4, 1.9, 5.6 * punch(tl, .15), -.1, 1.6, -.4); } }; });
// 7b: "cost too much to maintain,"
shot(14.6, 16.65, () => {
  const R = hotelRoom(), coins = [...Array(7)].map((_, i) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .02, 6), bmat({ color: 0xffd23a })); c.userData = i; R.scene.add(c); return c; });
  return { scene: R.scene, cam: R.cam, update(tl, d, t) {
    R.drawChart(ss(.05, 1.2, tl)); R.pitch(tl, t); R.L.face('worried'); R.ds.forEach(x => x.face('shocked'));
    coins.forEach(c => { const i = c.userData, q = (tl * 1.3 + i / 7) % 1; c.position.set(.75 + q * 1.3, 2.3 + q * 1.6 - q * q * 2.4, -.9 + (i % 3) * .08); c.rotation.set(q * 12, 0, q * 9); });
    look(R.cam, .55, 2.0, lerp(1.6, 1.25, tl / d) * punch(tl, .2), 1.1, 1.9, -1.2);
  } };
});
// 8: "so the city was selling it for scrap."
shot(16.65, 19.1, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.9); const u = swirl(scene, cam, 0x0a2a5a, 0x1a6aa8, 0x7ae0ff), T = makeTower(), tag = hud(cam, makeSign('FOR SCRAP', '#ffe21f', '#16120a')); T.g.scale.setScalar(.62); scene.add(T.g);
  const r = rng(19), pile = [...Array(26)].map((_, i) => { const b = box(.25 + r() * .6, .1 + r() * .3, .25 + r() * .5, mat({ color: [0x7a5638, 0x6a4a30, 0x8a8f96, 0x5c606c][i % 4] })); b.userData = { x: (r() - .5) * 3.4, y: .12 + r() * 1.0 * (1 - Math.abs(r() - .5) * 1.2), z: (r() - .5) * 1.4, d: r() * .6, rot: [r() * 3, r() * 3, r() * 3] }; scene.add(b); return b; });
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.5; T.tiers.forEach((tr, i) => { const a = Math.max(0, tl - .45 - (2 - i) * .16), f = clamp(a / .55); tr.position.set((i - 1) * f * 2.2, tr.userData.y * (1 - f * f), 0); tr.rotation.z = f * (i - 1.2) * 1.6; tr.scale.setScalar(1 - f * .98); });
    pile.forEach(b => { const u_ = b.userData, k = pop(tl - .95 - u_.d * .5); b.position.set(u_.x, u_.y, u_.z); b.rotation.set(...u_.rot); b.scale.setScalar(k); });
    tag.scale.setScalar(pop(tl - 1.55) * .85); tag.rotation.z = -.07; look(cam, Math.sin(tl * .9) * .7, lerp(3.0, 2.0, ss(.5, 1.4, tl)), lerp(9.6, 6.2, ss(.5, 1.4, tl)) * punch(tl, .15), 0, lerp(3.0, 1.1, ss(.5, 1.4, tl)), 0); if (tl > .9 && tl < 1.6) shake(cam, t, .03);
  } };
});
// 9: "In secret."
shot(19.1, 20.55, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 1.5, 1.6); const u = swirl(scene, cam, 0x08060c, 0x24142e, 0x4a2a5a), L = makeHuman(LUSTIG), st = hud(cam, makeSign('TOP SECRET', '#16120a', '#ff3a2a')); scene.add(L.root);
  return { scene, cam, update(tl, d, t) { u.value = t * .8; L.reset(); L.face(Math.floor(tl * 3) % 2 ? 'shh' : 'shh'); L.arms[1].rotation.x = -2.55; L.arms[1].rotation.z = -.42; L.head.rotation.y = Math.sin(tl * 5) * .25; L.body.rotation.x = .1; const a = tl - .5; st.scale.setScalar(a > 0 ? lerp(2.4, .85, clamp(a / .08)) : .001); st.rotation.z = .1; look(cam, .1, 1.9, lerp(2.6, 2.2, tl / d) * punch(tl, .2), 0, 1.85, 0); if (a > 0) shake(cam, t, .04 * Math.exp(-a * 9)); } };
});
// 10: "One dealer paid him."
shot(20.55, 22.4, () => {
  const R = hotelRoom([0]), cash = cashStack(), bl = bills(R.scene, 10), sp = sparkles(R.scene, 5); R.scene.add(cash); R.easel.visible = false;
  return { scene: R.scene, cam: R.cam, update(tl, d, t) {
    const k = ss(.45, .9, tl), L = R.L, D = R.ds[0]; R.ch.rotation.y = t * .4; L.reset(); L.root.position.set(.7, 0, 0); L.root.rotation.y = -.9; L.face(k >= 1 ? 'laugh' : 'sly'); L.arms[0].rotation.x = L.arms[1].rotation.x = -1.3; if (k >= 1) L.body.position.y = Math.abs(Math.sin(tl * 12)) * .05;
    D.reset(); D.root.position.set(-.7, 0, 0); D.root.rotation.y = .9; D.face('happy'); D.arms[0].rotation.x = D.arms[1].rotation.x = -1.3 * (1 - k * .4);
    cash.position.set(lerp(-.28, .28, k), 1.2 + Math.sin(k * Math.PI) * .2, .5); cash.rotation.y = .3;
    bl.forEach(b => { const { a, b: bb, c } = b.userData, q = ((tl - .9) * 1.1 + a) % 1; b.visible = k >= 1; b.position.set(.5 + (bb - .5) * 1.6, 1.4 + q * 1.8 - q * q * 1.2, .4 + (c - .5) * .6); b.rotation.set(q * 8 + a * 6, q * 6, a * 6); });
    sp.forEach((s, i) => { const an = i * 1.256 + t * 3; s.position.set(Math.cos(an) * .5, 1.25 + Math.sin(an) * .4, .7); s.scale.setScalar(k >= 1 ? .6 + Math.max(0, Math.sin(t * 12 + i * 2)) * 2 : 0); });
    look(R.cam, 0, 1.7, 4.4 * punch(tl, .15) * (k >= 1 ? punch(tl - .9, .12) : 1), 0, 1.5, 0);
  } };
});
// 11: "Lustig took the cash and ran."
shot(22.4, 24.75, () => {
  const { scene, cam } = paris(-14, 1.3), L = makeHuman(LUSTIG), bl = bills(scene, 14), lines = [...Array(8)].map((_, i) => { const l = box(1.6, .04, .04, bmat({ color: 0xffffff })); l.userData = i; scene.add(l); return l; }); scene.add(L.root);
  const sack = new THREE.Mesh(new THREE.IcosahedronGeometry(.36, 0), mat({ color: 0xc9a86a })); sack.scale.set(1, 1.2, 1); L.arms[0].add(sack); sack.position.set(0, -.95, .12); sack.scale.set(.9, 1.05, .9); sack.add(box(.14, .1, .14, mat({ color: 0x7a5232 }), 0, .36, 0)); sack.add(box(.2, .2, .02, bmat({ color: 0x3fae5a }), 0, 0, .34)); bl.forEach(b => b.scale.setScalar(1.9));
  return { scene, cam, update(tl, d, t) {
    const x = lerp(-4.6, 4.2, tl / d); L.reset(); L.face('laugh'); L.root.position.set(x, 0, 3.4); L.root.rotation.y = Math.PI / 2 - .55; L.walk(tl * 19, 1.0); L.body.rotation.x = .16; L.arms[0].rotation.x = -.5; L.arms[0].rotation.z = -.25;
    bl.forEach(b => { const { a, b: bb, c } = b.userData, q = (tl * 1.4 + a) % 1; b.position.set(x - .4 - q * 3.2, 1.9 + (bb - .5) * .8 + q * .7 - q * q * 1.6, 3.1 + (c - .5) * .8); b.rotation.set(q * 9 + a * 6, q * 7, a * 6); });
    lines.forEach(l => { const i = l.userData, q = (tl * 3 + i / 8) % 1; l.position.set(x + 2.5 - q * 6, .5 + (i * 37 % 8) / 8 * 2.4, 4.0); });
    look(cam, x + 1.3, 1.25, 8.0, x + .2, 1.35, 3.4);
  } };
});
// 12a: "The dealer was too embarrassed"
shot(24.75, 26.1, () => {
  const { scene, cam } = paris(-9, 1.3), D = makeHuman(DEALERS[0]), deed = makeSign('DEED', '#f6f0dc', '#16161a'), no = hud(cam, makeSign('NOT FOR SALE', '#d8141e', '#ffffff')); scene.add(D.root, deed);
  return { scene, cam, update(tl, d, t) { const hit = tl > .4; D.reset(); D.root.position.set(0, 0, 1.6); D.face(!hit ? 'happy' : tl < .8 ? 'shocked' : 'embarrassed'); D.arms[0].rotation.x = D.arms[1].rotation.x = -1.3; D.head.rotation.x = tl > .8 ? .3 : 0; D.body.position.y = hit ? 0 : Math.abs(Math.sin(tl * 12)) * .05; deed.position.set(0, 1.1 - (tl > .8 ? (tl - .8) * .5 : 0), 2.15); deed.scale.setScalar(.36); deed.rotation.z = tl > .8 ? -.4 : 0; no.scale.setScalar(pop(tl - .4) * .85); look(cam, .1, 1.9, 4.6 * punch(tl, .18), 0, 1.75, 1.6); if (hit) shake(cam, t, .03 * Math.exp(-(tl - .4) * 8)); } };
});
// 12b: "to tell the police."
shot(26.1, 28.05, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = duskT; lights(scene, 2.0, 1.9);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat({ map: paveTex })); gr.rotation.x = -Math.PI / 2; scene.add(gr); scene.add(box(12, 8, 4, mat({ map: FAC[2] }), 0, 4, -4)); scene.add(box(1.6, 2.6, .2, mat({ color: 0x1f2c4f }), .6, 1.3, -1.95));
  const ps = makeSign('POLICE', '#1f4fb0', '#ffffff'); ps.position.set(.6, 3.3, -1.9); ps.scale.setScalar(1.0); scene.add(ps); const lamp = box(.3, .4, .3, bmat({ color: 0x4f8aff }), -.6, 3.3, -1.7); scene.add(lamp);
  const D = makeHuman(DEALERS[0]), C = makeHuman(COP); scene.add(D.root, C.root);
  return { scene, cam, update(tl, d, t) {
    const back = tl > .85, a = tl - .85; D.reset(); D.face('embarrassed'); const x = back ? lerp(-.2, -3.2, ss(0, 1.1, a)) : lerp(-2.6, -.2, ss(0, .6, tl)); D.root.position.set(x, 0, .4); D.root.rotation.y = back ? -Math.PI / 2 - .2 : Math.PI / 2 - .5; if (back || tl < .6) D.walk(tl * (back ? 7 : 10), back ? .25 : .5); D.head.rotation.x = .3; if (back) { D.arms[0].rotation.x = -2.6; D.arms[1].rotation.x = -2.6; D.arms[0].rotation.z = .5; D.arms[1].rotation.z = -.5; }
    C.reset(); C.root.position.set(.6, 0, -1.2); C.face(back ? 'confused' : 'neutral'); C.arms[1].rotation.z = back ? 0 : 2.4 + Math.sin(tl * 10) * .3; if (back) { const sh = Math.sin(clamp(a / .7) * Math.PI); C.arms[0].rotation.z = -sh * .8; C.arms[1].rotation.z = sh * .8; }
    lamp.material.color.setHex(Math.floor(t * 4) % 2 ? 0x4f8aff : 0x2a4aa0); look(cam, -.3, 1.8, 5.6 * punch(tl, .15), -.2, 1.6, 0);
  } };
});
// 13: "So Lustig came back,"
shot(28.05, 29.95, () => {
  const { scene, cam } = paris(), L = makeHuman(LUSTIG), sign = hud(cam, makeSign('ROUND 2', '#ff3a2a', '#ffffff')); scene.add(L.root);
  return { scene, cam, update(tl, d, t) { L.reset(); L.face('sly'); const up = pop(tl - .1); L.root.position.set(0, -2.2 + up * 2.2, 1.8); L.arms[1].rotation.z = 2.75; L.arms[1].rotation.x = -.3; L.head.rotation.z = .1; sign.scale.setScalar(pop(tl - .65) * .85); sign.rotation.z = -.06; look(cam, .1, 1.9, 4.6 * punch(tl, .2), 0, 2.3, 1.8); } };
});
// 14: "and tried it again."
shot(29.95, 31.6, () => { const R = hotelRoom([3, 4, 2]); return { scene: R.scene, cam: R.cam, update(tl, d, t) { R.drawChart(ss(0, .8, tl)); R.pitch(tl * 1.6, t * 1.6); R.L.face('sly'); R.ds.forEach((x, i) => x.face(i === 1 ? 'confused' : 'shocked')); look(R.cam, .5, 1.9, 5.6 * punch(tl, .18), .1, 1.6, -.4); } }; });
// 15a: "This time,"
shot(31.6, 32.8, () => {
  const R = hotelRoom([4]), q = hud(R.cam, makeSign('?', '#ffe21f', '#16120a'), 1.2); R.easel.visible = false; R.L.root.visible = false;
  return { scene: R.scene, cam: R.cam, update(tl, d, t) { const D = R.ds[0]; D.reset(); D.root.position.set(0, 0, 0); D.face('confused'); D.arms[1].rotation.x = -2.3; D.arms[1].rotation.z = -.35; D.head.rotation.z = .12 + Math.sin(tl * 4) * .05; q.scale.set(pop(tl - .3) * .32, pop(tl - .3) * .8, 1); q.rotation.z = Math.sin(t * 6) * .1; look(R.cam, .1, 1.9, lerp(2.9, 2.4, tl / d) * punch(tl, .2), 0, 1.85, 0); } };
});
// 15b: "someone called"
shot(32.8, 33.7, () => {
  const R = hotelRoom([4]); R.easel.visible = false; R.L.root.visible = false; const ph = new THREE.Group(), bk = mat({ color: 0x16161a }); ph.add(box(.07, .34, .07, bk)); ph.add(box(.14, .1, .14, bk, 0, .2, .02)); ph.add(box(.12, .1, .12, bk, 0, -.2, .02)); ph.add(box(.2, .06, .2, bk, 0, -.34, 0)); const horn = new THREE.Mesh(new THREE.ConeGeometry(.12, .18, 6), bk); horn.rotation.x = -Math.PI / 2; horn.position.set(0, .2, -.14); ph.add(horn); R.scene.add(ph); ph.position.set(.3, 1.6, .62); ph.scale.setScalar(1.15);
  return { scene: R.scene, cam: R.cam, update(tl, d, t) { const D = R.ds[0]; D.reset(); D.face('scream'); D.arms[1].rotation.x = -1.45; D.arms[0].rotation.z = -1.6 + Math.sin(tl * 22) * .3; ph.rotation.z = Math.sin(tl * 40) * .06; D.head.rotation.z = -.1; D.body.position.y = Math.abs(Math.sin(tl * 16)) * .03; look(R.cam, -.2, 1.9, 2.5 * punch(tl, .25), 0, 1.82, 0); shake(R.cam, t, .012); } };
});
// 15c: "the cops."
shot(33.7, 34.6, () => {
  const R = hotelRoom([4]), cops = [0, 1].map(() => { const c = makeHuman(COP); R.scene.add(c.root); return c; }), sg = hud(R.cam, makeSign('POLICE!', '#1f4fb0', '#ffffff')), fl = new THREE.PointLight(0xff2a2a, 0, 12); fl.position.set(-2, 2.5, 2); R.scene.add(fl);
  return { scene: R.scene, cam: R.cam, update(tl, d, t) {
    R.drawChart(1); R.pitch(tl, t); R.L.face('scream'); R.L.arms[0].rotation.z = -2.5; R.L.arms[1].rotation.z = 2.5; R.L.body.position.y = Math.abs(Math.sin(tl * 14)) * .12; R.ds[0].root.position.set(-3.2, 0, -1.2); R.ds[0].face('happy');
    cops.forEach((c, i) => { c.reset(); c.face('scream'); const k = ss(0, .7, tl); c.root.position.set(lerp(-5.5, -1.3 - i * .9, k), 0, .6 + i * .7); c.root.rotation.y = Math.PI / 2 - .2; c.walk(tl * 18 + i, .9); c.arms[1].rotation.x = -1.6; c.body.rotation.x = .2; });
    fl.intensity = 18; fl.color.setHex(Math.floor(t * 8) % 2 ? 0xff2a2a : 0x2a5aff); sg.scale.setScalar(pop(tl - .1) * .85); look(R.cam, -.6, 1.9, 5.8 * punch(tl, .2), -.5, 1.6, 0); shake(R.cam, t, .025);
  } };
});
// 16: "And he escaped to America."
shot(34.6, 36.9, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = duskT; lights(scene, 2.1, 2.0); scene.add(cam);
  const seaT = ctex(32, 32, g => { g.fillStyle = '#2a6ac0'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#4f8fe0'; for (let y = 2; y < 32; y += 6) for (let x = (y % 12 ? 0 : 6); x < 32; x += 12) g.fillRect(x, y, 6, 1); g.fillStyle = '#e8f4ff'; for (let y = 5; y < 32; y += 12) for (let x = 3; x < 32; x += 16) g.fillRect(x, y, 2, 1); noise(g, 32, 32, 12, 70); }, [20, 20]);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mat({ map: seaT })); sea.rotation.x = -Math.PI / 2; scene.add(sea);
  const st = new THREE.Group(), stone = mat({ color: 0xb8ad98 }), cu = mat({ color: 0x5fb39a }); st.add(box(2.6, .6, 2.6, stone, 0, .3, 0)); st.add(box(1.7, 2.4, 1.7, stone, 0, 1.8, 0)); const bd = new THREE.Mesh(new THREE.CylinderGeometry(.36, .8, 3.0, 6), cu); bd.position.y = 4.5; st.add(bd); st.add(box(.44, .48, .44, cu, 0, 6.25, 0)); for (let i = 0; i < 5; i++) { const sp_ = new THREE.Mesh(new THREE.ConeGeometry(.06, .4, 4), cu); const a = (i - 2) * .45; sp_.position.set(Math.sin(a) * .28, 6.6 + Math.cos(a) * .12, .05); sp_.rotation.z = -a; st.add(sp_); }
  const arm = box(.2, 1.7, .2, cu, .52, 6.4, 0); arm.rotation.z = -.22; st.add(arm); st.add(box(.24, .3, .24, mat({ color: 0xd8a83a }), .72, 7.35, 0)); const flame = new THREE.Mesh(new THREE.OctahedronGeometry(.2), bmat({ color: 0xffd23a })); flame.position.set(.72, 7.7, 0); st.add(flame); st.add(box(.5, .7, .14, cu, -.45, 4.9, .3)); st.position.set(3.2, 0, -9); scene.add(st);
  const r = rng(61); for (let i = 0; i < 14; i++) { const h = 2 + r() * 5; scene.add(box(1 + r(), h, 1, mat({ color: [0x6a7088, 0x8a8fa6, 0x5a6078][i % 3] }), -9 + i * 1.5 + r(), h / 2, -24)); }
  const ship = new THREE.Group(); ship.add(box(5.2, .9, 1.5, mat({ color: 0x16161a }), 0, .55, 0)); ship.add(box(5.2, .25, 1.52, mat({ color: 0xa8201e }), 0, .12, 0)); const bow = box(1.1, .9, 1.06, mat({ color: 0x16161a }), 2.9, .55, 0); bow.rotation.y = Math.PI / 4; ship.add(bow); ship.add(box(3.6, .6, 1.2, mat({ color: 0xf2f2f2 }), -.2, 1.3, 0)); ship.add(box(2.6, .4, 1.0, mat({ color: 0xf2f2f2 }), -.3, 1.8, 0));
  for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(.24, .26, 1.1, 8), mat({ color: 0xe8862a })); f.position.set(-1.2 + i * .95, 2.5, 0); ship.add(f); const ft = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .25, 8), mat({ color: 0x16161a })); ft.position.set(-1.2 + i * .95, 3.1, 0); ship.add(ft); }
  const L = makeHuman(LUSTIG); L.root.scale.setScalar(.62); L.root.position.set(1.7, 1.0, .1); ship.add(L.root); scene.add(ship);
  const smoke = [...Array(9)].map((_, i) => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.3, 0), mat({ color: 0xd8d8d8, transparent: true })); s.userData = i; scene.add(s); return s; }), sign = hud(cam, makeSign('AMERICA', '#1f4fb0', '#ffffff'));
  return { scene, cam, update(tl, d, t) {
    const x = lerp(-4.2, -.6, tl / d); ship.position.set(x, Math.sin(t * 3) * .08, 0); ship.rotation.z = Math.sin(t * 2.2) * .025; seaT.offset.x = t * .25; L.reset(); L.face('laugh'); L.root.rotation.y = .4; L.arms[1].rotation.z = 2.5 + Math.sin(t * 10) * .35;
    smoke.forEach(s => { const i = s.userData, q = (tl * .9 + i / 9) % 1; s.position.set(x - 1.2 + (i % 3) * .95 - q * 2.6, 3.4 + q * 1.8, 0); s.scale.setScalar(.6 + q * 2); s.material.opacity = .85 * (1 - q); });
    flame.scale.setScalar(1 + Math.sin(t * 20) * .2); sign.scale.setScalar(pop(tl - .75) * .85); look(cam, .2, 2.3, 10.6 * punch(tl, .15), .9, 3.1, -3);
  } };
});
shot(36.9, DUR + .1, sHook(true));

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
