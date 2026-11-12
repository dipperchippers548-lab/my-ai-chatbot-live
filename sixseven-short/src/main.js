// "How 6-7 Took Over The World" - PS1-style low-poly short, rendered frame by frame.
// (engine section shared with ../invisible-short)
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 64.92;
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
    } else if (style === 'jersey') {
      g.fillStyle = '#d8262a'; g.fillRect(0, 0, 2, 32); g.fillRect(30, 0, 2, 32); g.beginPath(); g.moveTo(9, 0); g.lineTo(16, 9); g.lineTo(23, 0); g.lineTo(20, 0); g.lineTo(16, 5); g.lineTo(12, 0); g.fill();
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
    add(a, box(.2, .62, .22, p.tank ? skinM : topM, 0, -.29, 0), p.tank ? skin : cloth); add(a, box(.17, .17, .19, p.glove && s > 0 ? gloveM : skinM, 0, -.68, 0), skin); add(a, box(.16, .6, .18, skinM, 0, -.3, 0), nude);
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
    tint(c, k) { skinM.color.copy(baseSkin).lerp(new THREE.Color(c), k); faceM.color.set(0xffffff).lerp(new THREE.Color(c), k); },
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

// ---------- 6-7 short: helpers ----------
Object.assign(EXPR, {
  cringe: { open: .62, browIn: 3.4, browOut: -1, ly: .7, mouth: 'skew', blush: true },
  embarrassed: { open: .7, browIn: 4.2, browOut: -1, ly: .9, mouth: 'frown', blush: true },
  sly: { open: .68, browIn: -.5, browOut: 1.5, browL: 2.6, browR: -1, lx: .6, mouth: 'skew' },
  angry: { open: .85, browIn: -3, browOut: 2.2, mouth: 'frown' },
});
const hud = (cam, sign, y = 1.22, z = -4) => { cam.add(sign); sign.position.set(0, y, z); sign.material.depthTest = false; sign.material.transparent = true; sign.renderOrder = 999; return sign; };
const dynTex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return { g, t, c }; };
function dynSign(cam, y = 1.22) { const D = dynTex(96, 40), m = hud(cam, new THREE.Mesh(new THREE.PlaneGeometry(1.9, .8), bmat({ map: D.t })), y); return { m, draw(text, bg = '#ffe21f', fg = '#16120a', px = 17) { const g = D.g; g.fillStyle = '#16120a'; g.fillRect(0, 0, 96, 40); g.fillStyle = bg; g.fillRect(3, 3, 90, 34); g.fillStyle = fg; g.font = 'bold ' + px + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 48, 21); D.t.needsUpdate = true; } }; }
// a full-screen transparent overlay on the camera, redrawn every frame (viewfinders, phone UI)
function overlay(cam) { const D = dynTex(135, 240), m = new THREE.Mesh(new THREE.PlaneGeometry(1.8355, 3.2635), bmat({ map: D.t, transparent: true, depthTest: false })); m.renderOrder = 997; m.position.z = -3.5; cam.add(m); return { m, g: D.g, done() { D.t.needsUpdate = true; } }; }
// chunky seven-segment digits, built from boxes
const SEG = { a: [0, .9, 1], b: [.42, .45, 0], c: [.42, -.45, 0], d: [0, -.9, 1], e: [-.42, -.45, 0], f: [-.42, .45, 0], g: [0, 0, 1] };
const DIGITS = { 6: 'afgedc', 7: 'abc', '-': 'g' };
function makeDigit(ch, color, depth = .32) {
  const g = new THREE.Group(), m = mat({ color }), edge = mat({ color: shadeHex(color, .55) });
  for (const k of DIGITS[ch]) { const [x, y, hz] = SEG[k]; const len = .9, th = .26; const b = box(hz ? len : th, hz ? th : len, depth, [edge, edge, m, edge, m, edge], x, y, 0); g.add(b); }
  return g;
}
function shadeHex(hex, f) { const c = new THREE.Color(hex); c.multiplyScalar(f); return c.getHex(); }
function makeSixSeven(c6 = 0xff3a5a, c7 = 0x3a8aff, dash = 0xffe21f) { const g = new THREE.Group(), a = makeDigit(6, c6), b = makeDigit('-', dash), c = makeDigit(7, c7); a.position.x = -1.3; b.scale.setScalar(.6); c.position.x = 1.3; g.add(a, b, c); g.userData = { a, b, c }; return g; }
// the 6-7 gesture: both palms forward, bouncing up and down out of step, like weighing two things
function sixSeven(h, t, amp = 1, rate = 9) { const s = Math.sin(t * rate); h.arms[0].rotation.x = -1.3 + s * .4 * amp; h.arms[1].rotation.x = -1.3 - s * .4 * amp; h.arms[0].rotation.z = -.2; h.arms[1].rotation.z = .2; h.body.position.y = Math.abs(s) * .045 * amp; h.head.rotation.z = s * .07 * amp; h.body.rotation.y = s * .07 * amp; }
function shrug(h, k = 1) { h.arms[0].rotation.z = -.6 * k; h.arms[1].rotation.z = .6 * k; h.arms[0].rotation.x = h.arms[1].rotation.x = -.35 * k; h.head.rotation.z = .12 * k; h.body.position.y = .04 * k; }
const gold = () => mat({ color: 0xe8b82a });
function shades(h) { const b = mat({ color: 0x0c0c10 }); h.head.add(box(.46, .1, .04, b, 0, .32, .235)); return h; }
function chain(h) { const g = gold(); h.body.add(box(.32, .045, .03, g, 0, 1.4, .2)); h.body.add(box(.1, .12, .03, g, 0, 1.33, .2)); return h; }
function beanie(h, c = 0x2a2a35) { const m = mat({ color: c }); h.head.add(box(.48, .2, .48, m, 0, .62, 0)); h.head.add(box(.5, .06, .5, mat({ color: shadeHex(c, .7) }), 0, .53, 0)); return h; }
function notes(scene, n) { const r = rng(n * 3 + 7), cols = [0xff3a5a, 0x3a8aff, 0xffe21f, 0x3fd060, 0xb04ad8]; return [...Array(n)].map((_, i) => { const g = new THREE.Group(), m = bmat({ color: cols[i % 5] }); const hd = box(.2, .15, .06, m); hd.rotation.z = .4; g.add(hd); g.add(box(.035, .45, .035, m, .085, .22, 0)); g.add(box(.14, .05, .035, m, .14, .42, 0)); g.userData = { a: r(), x: (r() - .5) * 3, z: (r() - .5) * 1.4, s: .8 + r() * .6 }; scene.add(g); return g; }); }
const notesAt = (ns, t, cx, cy, cz, rate = .55, rise = 3.2) => ns.forEach(g => { const u = g.userData, q = (t * rate + u.a) % 1; g.position.set(cx + u.x + Math.sin(q * 7 + u.a * 6) * .25, cy + q * rise, cz + u.z); g.rotation.z = Math.sin(t * 4 + u.a * 6) * .3; g.scale.setScalar(u.s * Math.min(1, q * 6) * (1 - q * .3)); });
function hearts(scene, n, color = 0xff3a5a) { return [...Array(n)].map((_, i) => { const g = new THREE.Group(), m = bmat({ color }); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.1, 0), m); b.position.set(s * .075, .05, 0); g.add(b); } const tip = new THREE.Mesh(new THREE.ConeGeometry(.17, .22, 4), m); tip.rotation.x = Math.PI; tip.position.y = -.1; g.add(tip); g.userData = i; scene.add(g); return g; }); }
function confetti(scene, n) { const r = rng(n * 11), cols = [0xff3a5a, 0x3a8aff, 0xffe21f, 0x3fd060, 0xff8a1f, 0xffffff]; return [...Array(n)].map((_, i) => { const c = box(.08, .12, .01, bmat({ color: cols[i % 6] })); c.userData = { a: r(), x: (r() - .5) * 6, z: (r() - .5) * 3, sp: .5 + r() * .5 }; scene.add(c); return c; }); }
const confettiAt = (cs, t, cy = 6, fall = 7) => cs.forEach(c => { const u = c.userData, q = (t * u.sp * .45 + u.a) % 1; c.position.set(u.x + Math.sin(t * 2 + u.a * 9) * .3, cy - q * fall, u.z); c.rotation.set(t * 5 + u.a * 9, t * 4, u.a * 6); });
const papersFly = (scene, n) => { const r = rng(n + 31); return [...Array(n)].map(() => { const p = box(.22, .28, .005, bmat({ color: 0xffffff })); p.userData = { a: r(), x: (r() - .5) * 4.5, z: (r() - .5) * 3 + 1.2, s: r() }; scene.add(p); return p; }); };
const papersAt = (ps, t) => ps.forEach(p => { const u = p.userData, q = (t * .8 + u.a) % 1; p.position.set(u.x + Math.sin(t * 3 + u.a * 7) * .4, .6 + Math.sin(q * Math.PI) * 2.6, u.z); p.rotation.set(t * 6 + u.a * 7, t * 5, u.s * 6); });

// ---------- 6-7 short: characters ----------
const KID = { skin: 0xe8b089, hair: 0x6a3a1a, top: 0xff8a1f, pants: 0x34558c, hairH: .22, iris: '#3a6a3a', shoes: 0xf2f2f2 };
const KIDS = [KID,
  { skin: 0x8a5a3c, hair: 0x15110f, top: 0x3a8aff, pants: 0x2a2a35, hairH: .14, iris: '#3a2416', lip: '#7a3f38', shoes: 0xf2f2f2 },
  { skin: 0xf0c9a8, hair: 0xd8b040, top: 0xe86a9a, pants: 0x444444, hairH: .3, lip: '#c0304a', iris: '#3a6aa8', shoes: 0xf2f2f2 },
  { skin: 0xc98d68, hair: 0x2a2018, top: 0x3fd060, pants: 0x2a3a5a, hairH: .18, iris: '#5a3a1a', shoes: 0x222222 },
  { skin: 0xe2a57f, hair: 0x8a2a1a, top: 0xb04ad8, pants: 0x34558c, hairH: .24, glasses: true, shoes: 0xf2f2f2 },
  { skin: 0x9a6a48, hair: 0x1a1410, top: 0xffe21f, pants: 0x2a2a35, hairH: .1, iris: '#3a2416', shoes: 0x222222 },
  { skin: 0xf0c9a8, hair: 0x5a3a1a, top: 0xd8262a, pants: 0x444444, hairH: .26, iris: '#3a6aa8', shoes: 0xf2f2f2 },
  { skin: 0xd9a07a, hair: 0x2a2018, top: 0x2fb8b0, pants: 0x34558c, hairH: .16, shoes: 0xf2f2f2 },
  { skin: 0xe8b89a, hair: 0xb07a3a, top: 0x8a6a4a, pants: 0x2a2a35, hairH: .2, glasses: true, shoes: 0x222222 }];
const TEACHER = { skin: 0xe8b89a, hair: 0x8a5a3a, top: 0x6a8a5a, pants: 0x5a4a3a, topStyle: 'coat', glasses: true, hairH: .18, lip: '#b04a4a', shoes: 0x3a2a1a };
const TEACHER2 = { skin: 0xc98d68, hair: 0x3a2a1a, top: 0x9a3a5a, pants: 0x3a3d4a, topStyle: 'suit', mustache: true, hairH: .06, shoes: 0x111111 };
const RAPPER = { skin: 0x8a5a3c, hair: 0x111111, top: 0x22222a, pants: 0x22222a, hairH: .06, iris: '#3a2416', lip: '#7a3f38', shoes: 0xf2f2f2 };
const PLAYER = { skin: 0x9a6a48, hair: 0x1a1410, top: 0xf2f2f2, pants: 0xf2f2f2, topStyle: 'jersey', tank: true, hairH: .1, iris: '#3a2416', shoes: 0xd8262a };
const PARENT = { skin: 0xe2a57f, hair: 0x5a4a3a, top: 0x4f6a8a, pants: 0x6a5a4a, topStyle: 'coat', hairH: .1, stubble: true, shoes: 0x3a2a1a };
function palms(h, skin) { const m = mat({ color: skin }); h.arms.forEach(a => a.add(box(.24, .26, .06, m, 0, -.74, .1))); return h; }
const kid = (scene, p = KID, s = .82) => { const h = palms(makeHuman(p), p.skin); h.root.scale.setScalar(s); scene.add(h.root); return h; };

// ---------- 6-7 short: sets ----------
const tileT = ctex(32, 32, g => { for (let y = 0; y < 32; y += 8) for (let x = 0; x < 32; x += 8) { g.fillStyle = (x + y) % 16 ? '#d8d2c2' : '#bdb5a2'; g.fillRect(x, y, 8, 8); } noise(g, 32, 32, 10, 41); }, [10, 10]);
const roomWallT = ctex(32, 32, g => { g.fillStyle = '#dfe3c0'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#7f9a6a'; g.fillRect(0, 22, 32, 10); g.fillStyle = '#5f7a4f'; g.fillRect(0, 21, 32, 1); noise(g, 32, 32, 8, 42); }, [6, 1]);
function classroom(opts = {}) {
  const scene = new THREE.Scene(), cam = newCam(opts.fov || 55); scene.background = new THREE.Color(0x9fd0f0); lights(scene, 2.0, 1.6); scene.add(cam);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat({ map: tileT })); fl.rotation.x = -Math.PI / 2; fl.position.z = .8; scene.add(fl);
  const wm = mat({ map: roomWallT }); scene.add(box(11, 4.4, .2, wm, 0, 2.2, -3.1)); scene.add(box(.2, 4.4, 9, wm, 4.6, 2.2, .9)); scene.add(box(11, 4.4, .2, wm, 0, 2.2, 5.4));
  scene.add(box(.2, 1.3, 9, wm, -4.6, .65, .9)); scene.add(box(.2, .9, 9, wm, -4.6, 3.95, .9)); for (const z of [-2.2, .9, 4.0]) scene.add(box(.22, 2.2, .3, mat({ color: 0xf2f2f2 }), -4.6, 2.4, z));
  const winM = bmat({ color: 0xbfe6ff }); for (const z of [-.65, 2.45]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.2), winM); w.rotation.y = Math.PI / 2; w.position.set(-4.48, 2.4, z); scene.add(w); }
  const B = dynTex(128, 48); scene.add(box(4.6, 1.9, .08, mat({ color: 0x8a6238 }), 0, 2.15, -2.98)); const brd = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.7), bmat({ map: B.t })); brd.position.set(0, 2.15, -2.93); scene.add(brd); scene.add(box(4.4, .06, .14, mat({ color: 0x8a6238 }), 0, 1.27, -2.88));
  const drawBoard = (txt, px = 30, col = '#f4f4ee') => { const g = B.g; g.fillStyle = '#2f5a3a'; g.fillRect(0, 0, 128, 48); g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 6; i++) g.fillRect(8 + i * 19, 6 + (i % 3) * 11, 14, 2); if (txt) { g.fillStyle = col; g.font = 'bold ' + px + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64, 25); } B.t.needsUpdate = true; };
  drawBoard(opts.board || 'MATH', 22);
  const clk = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .06, 12), bmat({ color: 0xffffff })); clk.rotation.x = Math.PI / 2; clk.position.set(3.0, 3.55, -2.98); scene.add(clk); scene.add(box(.04, .22, .02, bmat({ color: 0x111111 }), 3.0, 3.62, -2.94));
  for (const [x, c] of [[-3.3, 0xff8a1f], [-2.6, 0x3a8aff], [3.3, 0x3fd060]]) scene.add(box(.5, .66, .02, mat({ color: c }), x, 2.6, -2.98));
  const D = []; for (const z of [0, 1.45, 2.9]) for (const x of [-1.55, 0, 1.55]) D.push([x, z]);
  const wood = mat({ color: 0xc9935a }), metal = mat({ color: 0x8a909c }), seat = mat({ color: 0x3a6ad8 });
  D.forEach(([x, z]) => { scene.add(box(1.05, .07, .62, wood, x, .76, z)); for (const [dx, dz] of [[-.45, -.25], [.45, -.25], [-.45, .25], [.45, .25]]) scene.add(box(.05, .74, .05, metal, x + dx, .37, z + dz)); scene.add(box(.5, .06, .48, seat, x, .45, z + .58)); scene.add(box(.5, .46, .06, seat, x, .76, z + .84)); for (const dx of [-.2, .2]) scene.add(box(.04, .45, .04, metal, x + dx, .22, z + .58)); });
  const kids = KIDS.map(p => kid(scene, p)), teacher = palms(makeHuman(opts.teacher || TEACHER), (opts.teacher || TEACHER).skin); scene.add(teacher.root); teacher.root.position.set(0, 0, -2.25);
  const R = { scene, cam, kids, teacher, D, drawBoard, brd,
    sit(i, lean = 0) { const h = kids[i], [x, z] = D[i]; h.reset(); h.root.position.set(x, -.21, z + .52); h.root.rotation.y = Math.PI; h.legs[0].rotation.x = h.legs[1].rotation.x = -1.5; h.arms[0].rotation.x = h.arms[1].rotation.x = -1.05; h.body.rotation.x = lean; },
    stand(i, onDesk = false) { const h = kids[i], [x, z] = D[i]; h.reset(); h.root.position.set(x, onDesk ? .8 : 0, onDesk ? z : z + .58); h.root.rotation.y = Math.PI; },
    front(px = 0, py = 2.25, pz = -2.55, tx = 0, ty = 1.05, tz = 1.6) { look(cam, px, py, pz, tx, ty, tz); },
    back(px = .3, py = 1.9, pz = 5.0, tx = 0, ty = 1.6, tz = -2.6) { look(cam, px, py, pz, tx, ty, tz); } };
  return R;
}
function school() {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = skyTex; lights(scene, 2.0, 2.0); scene.add(cam);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat({ map: ctex(32, 32, g => { g.fillStyle = '#5aa63c'; g.fillRect(0, 0, 32, 32); const r = rng(4); for (let i = 0; i < 150; i++) { g.fillStyle = r() < .5 ? '#4a9230' : '#6fba4a'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 2); } }, [20, 20]) })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  scene.add(box(40, .03, 3, mat({ color: 0x55585e }), 0, .02, 4.5)); for (let x = -18; x < 18; x += 3) scene.add(box(1.4, .04, .15, mat({ color: 0xf2e9a0 }), x, .04, 4.5));
  const bld = new THREE.Group(), brick = mat({ map: FAC[0] }); bld.add(box(12, 4.6, 5, brick, 0, 2.3, -4)); bld.add(box(12.4, .4, 5.4, mat({ color: 0xd8d2c2 }), 0, 4.8, -4)); bld.add(box(2.4, 2.6, .2, mat({ color: 0x3a6ad8 }), 0, 1.3, -1.45)); bld.add(box(3.4, 1.3, .1, mat({ color: 0xd8d2c2 }), 0, 3.4, -1.42));
  const sign = makeSign('SCHOOL', '#ffffff', '#c8202a'); sign.position.set(0, 3.4, -1.36); sign.scale.setScalar(1.6); bld.add(sign); scene.add(bld);
  const bus = new THREE.Group(), y = mat({ color: 0xf2b81a }); bus.add(box(6.2, 2.0, 2.2, y, 0, 1.45, 0)); bus.add(box(1.4, 1.2, 2.2, y, 3.7, 1.05, 0)); bus.add(box(5.8, .55, .05, mat({ color: 0x1a2a4a }), -.1, 1.85, 1.12)); bus.add(box(6.3, .12, 2.25, mat({ color: 0x16161a }), 0, .9, 0));
  for (const [x, z] of [[-2, 1.05], [2.4, 1.05], [-2, -1.05], [2.4, -1.05]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .3, 8), mat({ color: 0x16161a })); w.rotation.x = Math.PI / 2; w.position.set(x, .5, z); bus.add(w); } bus.position.set(-3.5, 0, 3.2); scene.add(bus);
  for (const x of [-7.5, 7.5]) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, 2, 5), mat({ color: 0x5a3a22 })); tr.position.set(x, 1, -1.5); scene.add(tr); const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 0), mat({ color: 0x3f9a3c })); lf.position.set(x, 3.0, -1.5); scene.add(lf); }
  return { scene, cam, bld };
}
const woodT = ctex(32, 32, g => { g.fillStyle = '#d8a060'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#c48a4a'; for (let x = 0; x < 32; x += 4) g.fillRect(x, 0, 1, 32); for (let y = 0; y < 32; y += 16) for (let x = 0; x < 32; x += 4) g.fillRect(x, y + (x % 8 ? 0 : 8), 4, 1); noise(g, 32, 32, 10, 43); }, [12, 12]);
const ballT = ctex(32, 16, g => { g.fillStyle = '#e8721f'; g.fillRect(0, 0, 32, 16); g.fillStyle = '#1a0e08'; for (const x of [0, 8, 16, 24]) g.fillRect(x, 0, 1, 16); g.fillRect(0, 8, 32, 1); });
const makeBall = (r = .17) => new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat({ map: ballT }));
function court() {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x1a1d2a); lights(scene, 2.0, 1.8); scene.add(cam);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat({ map: woodT })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const line = bmat({ color: 0xffffff }); scene.add(box(4.2, .02, .06, line, 0, .015, -.4)); for (const s of [-1, 1]) scene.add(box(.06, .02, 3.2, line, s * 2.1, .015, -2.0));
  const key = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.2), mat({ color: 0x2f6ad8 })); key.rotation.x = -Math.PI / 2; key.position.set(0, .01, -2.0); scene.add(key);
  scene.add(box(.18, 3.4, .18, mat({ color: 0x5a5e6c }), 0, 1.7, -4.6)); scene.add(box(.14, .14, 1.0, mat({ color: 0x5a5e6c }), 0, 3.25, -4.1));
  const bbT = ctex(32, 20, g => { g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, 32, 20); g.strokeStyle = '#d8262a'; g.lineWidth = 2; g.strokeRect(1, 1, 30, 18); g.strokeRect(11, 8, 10, 8); });
  const bb = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), bmat({ map: bbT })); bb.position.set(0, 3.3, -3.58); scene.add(bb); scene.add(box(1.85, 1.15, .05, mat({ color: 0xc9ced6 }), 0, 3.3, -3.62));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.3, .03, 4, 12), mat({ color: 0xe8721f })); rim.rotation.x = Math.PI / 2; rim.position.set(0, 2.9, -3.22); scene.add(rim);
  const net = new THREE.Mesh(new THREE.CylinderGeometry(.3, .2, .4, 8, 1, true), mat({ color: 0xffffff, wireframe: true })); net.position.set(0, 2.68, -3.22); scene.add(net);
  const r = rng(77); for (let row = 0; row < 4; row++) { scene.add(box(18, .5, .9, mat({ color: 0x3a3d4a }), 0, .25 + row * .5, -7 - row * .9)); for (let i = 0; i < 26; i++) { const g = new THREE.Group(), c = [0xe84a5a, 0x3a8aff, 0xf2c21f, 0x3fd060, 0xb04ad8, 0xff8a1f][r() * 6 | 0]; g.add(box(.42, .55, .3, mat({ color: c }), 0, .28, 0)); g.add(box(.26, .28, .26, mat({ color: [0xe2a57f, 0x8a5a3c, 0xf0c9a8][r() * 3 | 0] }), 0, .7, 0)); g.position.set(-8.6 + i * .68 + r() * .2, .5 + row * .5, -7 - row * .9); scene.add(g); } }
  const lightsR = [-6, -2, 2, 6].map(x => { const l = box(1.4, .1, .5, bmat({ color: 0xfff6d0 }), x, 6.5, -2); scene.add(l); return l; });
  return { scene, cam, net };
}
function stands() {   // gym bleachers with a crowd, for the phone clip
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x1a1d2a); lights(scene, 2.0, 1.7); scene.add(cam);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat({ map: woodT })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const r = rng(91), fans = [];
  for (let row = 0; row < 5; row++) { scene.add(box(14, .5, .9, mat({ color: row % 2 ? 0x8a909c : 0x9aa0aa }), 0, .25 + row * .5, -.5 - row * .9)); for (let i = 0; i < 18; i++) { if (row === 0 && Math.abs(i - 8.5) < 2) continue; const g = new THREE.Group(), c = [0xe84a5a, 0x3a8aff, 0xf2c21f, 0x3fd060, 0xb04ad8, 0xff8a1f][r() * 6 | 0], sk = mat({ color: [0xe2a57f, 0x8a5a3c, 0xf0c9a8, 0xc98d68][r() * 4 | 0] }); g.add(box(.46, .6, .32, mat({ color: c }), 0, .3, 0)); g.add(box(.3, .32, .3, sk, 0, .78, 0)); const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .28, .55, 0); a.add(box(.12, .5, .12, sk, 0, .25, 0)); g.add(a); return a; }); g.position.set(-6.5 + i * .78 + r() * .15, .5 + row * .5, -.5 - row * .9); g.userData = { arms, ph: r() * 6, sp: 6 + r() * 4 }; scene.add(g); fans.push(g); } }
  const banner = makeSign('GO TEAM!', '#d8262a', '#ffffff'); banner.position.set(0, 4.6, -5.6); banner.scale.setScalar(2.2); scene.add(banner); scene.add(box(14, 6, .2, mat({ color: 0x3a4a6a }), 0, 3, -6.0));
  return { scene, cam, cheer(t, amp = 1) { fans.forEach(f => { const u = f.userData; f.position.y = .5 + Math.floor((-.5 - f.position.z) / .9 + .01) * .5 + Math.abs(Math.sin(t * u.sp + u.ph)) * .12 * amp; u.arms[0].rotation.z = .3 + Math.sin(t * u.sp + u.ph) * .4 * amp; u.arms[1].rotation.z = -.3 - Math.sin(t * u.sp + u.ph + 1) * .4 * amp; }); } };
}
function bookTex(draw) { const D = dynTex(64, 80); return { t: D.t, draw(...a) { draw(D.g, ...a); D.t.needsUpdate = true; } }; }
function makeBook(cover = 0x2f5ab0) {
  const g = new THREE.Group(), cv = mat({ color: cover }); const L = new THREE.Group(), R = new THREE.Group(); g.add(L, R);
  L.add(box(1.25, .05, 1.6, cv, -.63, -.03, 0)); R.add(box(1.25, .05, 1.6, cv, .63, -.03, 0));
  const lp = bookTex((c) => { c.fillStyle = '#f6f2e6'; c.fillRect(0, 0, 64, 80); c.fillStyle = '#9a948a'; for (let y = 10; y < 70; y += 5) c.fillRect(6, y, 50 - (y % 15), 1); }), rp = bookTex((c, fn) => fn && fn(c)); lp.draw();
  const lm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.55), bmat({ map: lp.t })); lm.rotation.x = -Math.PI / 2; lm.position.set(-.62, .005, 0); L.add(lm);
  const rm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.55), bmat({ map: rp.t })); rm.rotation.x = -Math.PI / 2; rm.position.set(.62, .005, 0); R.add(rm);
  L.rotation.z = .12; R.rotation.z = -.12; return { g, L, R, right: rp };
}

// ---------- 6-7 short: shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
// 1 / last: the hook - a whole class doing it
function sHook(hold) {
  return () => { const C = classroom({ board: '6 - 7', fov: 58 }), sign = hud(C.cam, makeSign('2025'));
    return { scene: C.scene, cam: C.cam, update(tl, d, t) {
      const x = hold ? 0 : tl; C.kids.forEach((h, i) => { C.stand(i); sixSeven(h, t + i * .37, 1, 9 + (i % 3)); h.face(i % 3 ? 'laugh' : 'happy'); });
      C.teacher.reset(); C.teacher.face('shocked'); C.teacher.root.visible = false; sign.scale.setScalar(hold ? .001 : pop(x - .2) * .8);
      look(C.cam, 2.3 + (hold ? 0 : Math.sin(x * 1.3) * .2), 2.25, -2.45 + (hold ? 0 : .5 * Math.exp(-x * 4)), -.35, 1.05, 1.5); if (!hold) shake(C.cam, t, .012);
    } }; };
}
shot(0, 2.18, sHook(false));
// 2: "two numbers took over American schools."
shot(2.18, 5.16, () => {
  const S = school(), six = makeDigit(6, 0xff3a5a, .5), sev = makeDigit(7, 0x3a8aff, .5), dust = [...Array(10)].map((_, i) => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.4, 0), mat({ color: 0xe8e0c8, transparent: true })); p.userData = i; S.scene.add(p); return p; });
  six.scale.setScalar(2.1); sev.scale.setScalar(2.1); S.scene.add(six, sev); const L6 = .5, L7 = .82;
  return { scene: S.scene, cam: S.cam, update(tl, d, t) {
    const drop = (L, x) => { const a = tl - L; return a < 0 ? 18 : a < .14 ? lerp(18, 7.0, (a / .14) ** 2) : 7.0 + Math.abs(Math.sin((a - .14) * 9)) * .5 * Math.exp(-(a - .14) * 5); };
    six.position.set(-2.4, drop(L6, -2.4), -4); sev.position.set(2.4, drop(L7, 2.4), -4); six.rotation.z = tl > L6 + .14 ? 0 : .3; sev.rotation.z = tl > L7 + .14 ? 0 : -.3;
    const hit = Math.max(tl > L6 + .14 ? Math.exp(-(tl - L6 - .14) * 7) : 0, tl > L7 + .14 ? Math.exp(-(tl - L7 - .14) * 7) : 0); S.bld.scale.set(1 + hit * .05, 1 - hit * .12, 1);
    dust.forEach(p => { const i = p.userData, a = tl - (i < 5 ? L6 : L7) - .14, q = clamp(a * 1.4); p.visible = a > 0 && q < 1; const an = i * 1.256; p.position.set((i < 5 ? -2.4 : 2.4) + Math.cos(an) * q * 2.2, 5.2 + q * .8, -4 + Math.sin(an) * q * 1.2 + 2.6); p.scale.setScalar(.6 + q * 2); p.material.opacity = .9 * (1 - q); });
    look(S.cam, Math.sin(tl * .6) * 1.0, 3.2, 17 * punch(tl, .08), 0, 4.4, -3); shake(S.cam, t, hit * .15);
  } };
});
// 3 / 4: "Six." "Seven."
function sDigit(ch, c, a, b, cc) {
  return () => { const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.9); const u = burst(scene, cam, a, b, cc), dg = makeDigit(ch, c, .5), sp = sparkles(scene, 8, 0xffffff, .07); dg.scale.setScalar(1.25); scene.add(dg);
    return { scene, cam, update(tl, d, t) { u.value = t * 1.6; dg.position.set(0, 1.75, 0); dg.scale.setScalar(1.25 * pop(tl)); dg.rotation.y = Math.sin(tl * 2.2) * .45; dg.rotation.z = Math.sin(tl * 3) * .05; sp.forEach((s, i) => { const an = i * .785 + t * 2; s.position.set(Math.cos(an) * 1.6, 1.75 + Math.sin(an) * 2.0, .6); s.scale.setScalar(.6 + Math.max(0, Math.sin(t * 10 + i * 2)) * 2.4); }); look(cam, 0, 1.75, 6.4 * punch(tl, .3), 0, 1.75, 0); shake(cam, t, .06 * Math.exp(-tl * 8)); } }; };
}
shot(5.16, 6.41, sDigit(6, 0xff3a5a, 0xffd21f, 0xff9a1f, 0xfff6c0));
shot(6.41, 7.63, sDigit(7, 0x3a8aff, 0x3fd060, 0x1f9a4a, 0xe0ffd0));
// 5: "And nobody knows what they mean."
shot(7.63, 10.07, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x3a1a8a, 0x8a2fd0, 0xff7ad0), T = makeHuman(TEACHER), P = makeHuman(PARENT); scene.add(T.root, P.root);
  const qs = [...Array(7)].map((_, i) => { const q = makeSign('?', '#ffe21f', '#16120a'); q.scale.set(.32, .7, 1); q.userData = i; scene.add(q); return q; });
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.4; [T, P].forEach((h, i) => { h.reset(); h.root.position.set(i ? .7 : -.7, 0, 0); h.root.rotation.y = i ? -.3 : .3; h.face('confused'); shrug(h, ss(.1, .4, tl) * (1 + Math.sin(t * 6 + i) * .08)); });
    qs.forEach(q => { const i = q.userData, k = pop(tl - .3 - i * .12); q.position.set(-1.08 + i * .36, 2.55 + (i % 2) * .45 + Math.sin(t * 3 + i) * .08, -.4); q.rotation.z = Math.sin(t * 4 + i) * .2; q.scale.set(.32 * k, .7 * k, 1); });
    look(cam, 0, 1.8, 4.8 * punch(tl, .15), 0, 1.75, 0);
  } };
});
// 6: "Most people trace it back to a rapper called Skrilla,"
shot(10.07, 13.47, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x0e0c16); lights(scene, 1.7, 1.6); scene.add(cam); const key = new THREE.PointLight(0xfff0d8, 9, 7); key.position.set(1.2, 2.6, 2.2); scene.add(key);
  const foamT = ctex(32, 32, g => { g.fillStyle = '#2a2a35'; g.fillRect(0, 0, 32, 32); for (let y = 0; y < 32; y += 8) for (let x = 0; x < 32; x += 8) { g.fillStyle = (x + y) % 16 ? '#3a3a48' : '#22222c'; g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x + 4, y); g.lineTo(x + 8, y + 8); g.fill(); } }, [6, 3]);
  scene.add(box(10, 5, .2, mat({ map: foamT }), 0, 2.5, -2)); const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), mat({ color: 0x2a2030 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const led = box(10, .08, .08, bmat({ color: 0xb04ad8 }), 0, 4.3, -1.88); scene.add(led); const glow = new THREE.PointLight(0xb04ad8, 10, 8); glow.position.set(0, 3.5, 0); scene.add(glow);
  const stand = new THREE.Group(), dk = mat({ color: 0x16161a }); stand.add(box(.05, 1.6, .05, dk, 0, .8, 0)); stand.add(box(.5, .04, .5, dk, 0, .02, 0)); const mic = new THREE.Mesh(new THREE.CylinderGeometry(.07, .05, .3, 8), mat({ color: 0x8a909c })); mic.position.set(0, 1.72, 0); stand.add(mic); const head = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), mat({ color: 0x5a5e6c })); head.position.set(0, 1.9, 0); stand.add(head);
  const pf = new THREE.Mesh(new THREE.CircleGeometry(.17, 12), mat({ color: 0x16161a, transparent: true, opacity: .55, side: THREE.DoubleSide })); pf.position.set(0, 1.86, .2); stand.add(pf); stand.position.set(-.38, 0, .55); stand.rotation.y = .5; scene.add(stand);
  const R = chain(beanie(makeHuman(RAPPER))); scene.add(R.root); const sign = hud(cam, makeSign('SKRILLA', '#16120a', '#ffe21f')), ns = notes(scene, 6);
  return { scene, cam, update(tl, d, t) {
    R.reset(); R.root.position.set(0, 0, 0); R.face('happy'); const b = Math.sin(t * 7.8); R.head.rotation.x = .1 + b * .12; R.body.position.y = Math.abs(b) * .03; R.arms[1].rotation.x = -1.4 + Math.max(0, b) * .3; R.arms[1].rotation.z = .3; R.arms[0].rotation.x = -.9;
    notesAt(ns, t, 0, 1.6, .5, .5, 2.4); sign.scale.setScalar(pop(tl - 2.42) * .85); look(cam, .75, 2.0, lerp(5.6, 3.0, ss(0, 3.0, tl)), .05, 1.72, 0);
  } };
});
// 7: "and his song, Doot Doot, six seven."
shot(13.47, 16.96, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = burst(scene, cam, 0x1f2f6a, 0x2a3a8a, 0x8aa0ff);
  const grooveT = ctex(64, 64, g => { g.fillStyle = '#121216'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#2a2a33'; for (let r = 8; r < 32; r += 2.5) { g.beginPath(); g.arc(32, 32, r, 0, 7); g.stroke(); } g.fillStyle = '#ffe21f'; g.beginPath(); g.arc(32, 32, 12, 0, 7); g.fill(); g.fillStyle = '#d8262a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('6 7', 32, 33); });
  const rec = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, .05, 24), [mat({ color: 0x121216 }), mat({ map: grooveT }), mat({ color: 0x121216 })]); rec.position.set(0, 1.7, 0); rec.rotation.x = Math.PI / 2 - .35; scene.add(rec);
  const arm = new THREE.Group(); arm.add(box(.08, .08, 1.8, mat({ color: 0xc9ced6 }), 0, 0, -.9)); arm.add(box(.14, .14, .3, mat({ color: 0x5a5e6c }), 0, 0, -1.85)); arm.position.set(1.75, 3.15, -.3); arm.rotation.set(-.55, -.3, 0); scene.add(arm);
  const ns = notes(scene, 9), six = makeDigit(6, 0xff3a5a), sev = makeDigit(7, 0x3a8aff); six.scale.setScalar(.6); sev.scale.setScalar(.6); scene.add(six, sev); const sign = hud(cam, makeSign('"DOOT DOOT (6 7)"', '#ffe21f', '#16120a'));
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.5; rec.rotation.y = -t * 4; notesAt(ns, t, 0, .3, .8, .6, 3.6); sign.scale.setScalar(pop(tl - .95) * .85);
    const a6 = tl - 1.85, a7 = tl - 2.2; six.position.set(-.72, .5, 1.6); sev.position.set(.72, .5, 1.6); six.scale.setScalar(.5 * pop(a6)); sev.scale.setScalar(.5 * pop(a7)); six.rotation.y = Math.sin(t * 3) * .3; sev.rotation.y = -Math.sin(t * 3) * .3;
    look(cam, 0, 1.8, 5.8 * punch(tl, .12), 0, 1.5, 0); if (a6 > 0) shake(cam, t, .04 * Math.exp(-Math.min(a6, Math.max(0, a7)) * 8));
  } };
});
// 8: "Then people put that song over clips of" - an edit being made on a phone
function makePhone(screenMap) { const g = new THREE.Group(); g.add(box(1.0, 1.9, .1, mat({ color: 0x16161a }))); const s = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.74), bmat({ map: screenMap })); s.position.z = .056; g.add(s); g.add(box(.25, .04, .02, mat({ color: 0x2a2a33 }), 0, .9, .06)); return g; }
shot(16.96, 19.0, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = burst(scene, cam, 0x8a2fd0, 0x5a1a9a, 0xffb0f0), S = dynTex(54, 104), ph = makePhone(S.t); ph.scale.setScalar(1.55); scene.add(ph);
  const hand = box(.5, .7, .3, mat({ color: KID.skin }), .3, -1.55, .1); ph.add(hand);
  return { scene, cam, update(tl, d, t) {
    const g = S.g, k = ss(.3, 1.2, tl); g.fillStyle = '#16161e'; g.fillRect(0, 0, 54, 104); g.fillStyle = '#2a3050'; g.fillRect(2, 4, 50, 52);
    g.fillStyle = '#d8a060'; g.fillRect(2, 44, 50, 12); g.fillStyle = '#e8721f'; g.beginPath(); g.arc(30 + Math.sin(t * 6) * 6, 30 - Math.abs(Math.sin(t * 6)) * 14, 3, 0, 7); g.fill(); g.fillStyle = '#9a6a48'; g.fillRect(20, 26, 6, 18); g.fillStyle = '#f2f2f2'; g.fillRect(19, 31, 8, 8);
    g.fillStyle = '#5a5e6c'; g.fillRect(2, 64, 50, 1); g.fillStyle = '#3a8aff'; g.fillRect(4, 68, 46, 10); g.fillStyle = '#ffffff'; g.font = 'bold 6px sans-serif'; g.fillText('CLIP', 7, 75);
    g.fillStyle = '#3fd060'; const ax = lerp(54, 4, k); g.fillRect(ax, 82, 46, 10); g.fillStyle = '#0f4a20'; for (let x = 0; x < 44; x += 2) { const hh = 2 + Math.abs(Math.sin(x * .9 + t * 8)) * 6; g.fillRect(ax + 1 + x, 87 - hh / 2, 1, hh); } g.fillStyle = '#ffffff'; g.fillText('6 7', ax + 3, 89);
    g.fillStyle = '#ff3a5a'; g.fillRect(4 + ((tl * 18) % 46), 64, 1, 30); S.t.needsUpdate = true;
    ph.position.set(0, 1.7, 0); ph.rotation.set(-.1, Math.sin(tl * 1.5) * .15, .05); look(cam, 0, 1.75, 4.4 * punch(tl, .15), 0, 1.7, 0);
  } };
});
// 9: "basketball star LaMelo Ball." - the edit itself, framed like a phone video
shot(19.0, 21.8, () => {
  const C = court(), P = makeHuman(PLAYER), ball = makeBall(), O = overlay(C.cam), sign = hud(C.cam, makeSign('LaMELO BALL', '#16120a', '#ffffff'), 1.0); P.root.scale.setScalar(1.08); C.scene.add(P.root, ball);
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    const J = 1.05, a = tl - J; P.reset(); P.face(a > .2 ? 'happy' : 'neutral'); P.root.rotation.y = Math.PI;
    if (a < 0) { const z = lerp(1.8, -1.6, tl / J); P.root.position.set(.15, 0, z); P.walk(tl * 14, .8); P.arms[1].rotation.x = -.4; ball.position.set(.5, .25 + Math.abs(Math.sin(tl * 14)) * .75, z - .1); }
    else { const up = Math.sin(clamp(a / .75) * Math.PI); P.root.position.set(.15, up * 1.05, lerp(-1.6, -2.6, clamp(a / .4))); P.arms[1].rotation.x = P.arms[0].rotation.x = -2.9; P.legs[0].rotation.x = -.6 * up; ball.position.set(0, a < .4 ? lerp(3.1, 3.2, a) : 3.0 - (a - .4) * 3.5, -3.22); C.net.scale.y = 1 + (a > .4 && a < .7 ? .3 : 0); }
    const g = O.g; g.clearRect(0, 0, 135, 240); g.fillStyle = '#000'; g.fillRect(0, 0, 135, 6); g.fillRect(0, 234, 135, 6); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(6, 196, 92, 14); g.fillStyle = '#fff'; g.font = 'bold 8px sans-serif'; g.fillText('♪ Doot Doot (6 7)', 10, 206);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(6, 226, 123, 2); g.fillStyle = '#ff3a5a'; g.fillRect(6, 226, 123 * (tl / d), 2); g.fillStyle = '#ff3a5a'; g.font = 'bold 14px sans-serif'; g.fillText('♥', 116, 150); g.fillStyle = '#fff'; g.font = 'bold 7px sans-serif'; g.fillText('2.1M', 113, 160); O.done();
    sign.scale.setScalar(pop(tl - 1.18) * .85); look(C.cam, 2.4, 1.9, 3.6, .1, 2.0 + (a > 0 ? .5 : 0), -1.8); if (a > .38 && a < .7) shake(C.cam, t, .05);
  } };
});
// 10: "Who happens to be six foot seven."
shot(21.8, 24.54, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = burst(scene, cam, 0x1f9a8a, 0x0f6a6a, 0xc0fff0), P = makeHuman(PLAYER), S6 = 1.08; P.root.scale.setScalar(S6); scene.add(P.root);
  const top = (1.6 + .52 + .1) * S6, per = top / 6.583, chartT = ctex(32, 128, g => { g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, 32, 128); g.fillStyle = '#16120a'; g.font = 'bold 7px sans-serif'; for (let i = 0; i <= 14; i++) { const ft = i * .5, y = 128 - ft * per / (3.0 / 128); if (y < 0) break; g.fillRect(0, y, i % 2 ? 6 : 12, 1); if (i % 2 === 0 && ft > 0) g.fillText(ft + "'", 14, y + 3); } });
  const H = 3.0, chart = new THREE.Mesh(new THREE.PlaneGeometry(.75, H), bmat({ map: chartT })); chart.position.set(-.75, H / 2, -.3); scene.add(chart); scene.add(box(.8, H + .1, .05, mat({ color: 0x8a6238 }), -.75, H / 2, -.33));
  const bar = box(1.5, .06, .4, mat({ color: 0xd8262a }), -.3, 3.2, 0); scene.add(bar); const sign = hud(cam, makeSign("6' 7\"", '#ffe21f', '#16120a'));
  return { scene, cam, update(tl, d, t) { u.value = t * 1.3; P.reset(); P.face('happy'); P.root.position.set(.15, 0, 0); P.arms[1].rotation.z = .2; const k = ss(.3, .9, tl); bar.position.y = lerp(3.4, top + .03, k) + (k >= 1 ? Math.abs(Math.sin((tl - .9) * 12)) * .04 * Math.exp(-(tl - .9) * 6) : 0); sign.scale.setScalar(pop(tl - .95) * .85); look(cam, .3, 1.75, 5.4 * punch(tl, .15), -.1, 1.55, 0); } };
});
// 11: "Then a kid at a basketball game yelled it into a camera,"
shot(24.54, 28.13, () => {
  const S = stands(), K = kid(S.scene, KID, .82), O = overlay(S.cam);
  return { scene: S.scene, cam: S.cam, update(tl, d, t) {
    S.cheer(t); const up = ss(1.15, 1.45, tl), lean = ss(1.9, 2.4, tl); K.reset(); K.root.position.set(0, lerp(-1.4, .5, up), lerp(-.5, .7, lean)); K.face(tl > 1.9 ? 'scream' : 'happy'); K.arms[0].rotation.z = -.4; K.arms[1].rotation.z = .4; K.body.rotation.x = lean * .25;
    if (tl > 1.9) { K.head.rotation.z = Math.sin(t * 18) * .06; } const g = O.g; g.clearRect(0, 0, 135, 240); g.strokeStyle = '#fff'; g.lineWidth = 2; for (const [x, y, sx, sy] of [[8, 24, 1, 1], [127, 24, -1, 1], [8, 216, 1, -1], [127, 216, -1, -1]]) { g.beginPath(); g.moveTo(x, y + sy * 14); g.lineTo(x, y); g.lineTo(x + sx * 14, y); g.stroke(); }
    if (Math.floor(t * 2) % 2) { g.fillStyle = '#f22'; g.beginPath(); g.arc(16, 14, 3, 0, 7); g.fill(); } g.fillStyle = '#fff'; g.font = 'bold 8px monospace'; g.fillText('REC', 22, 17); g.fillText('00:0' + Math.floor(tl) + ':' + String(Math.floor(tl * 30) % 30).padStart(2, '0'), 84, 17); O.done();
    look(S.cam, Math.sin(t * 1.7) * .05, 1.6 + Math.sin(t * 2.3) * .03, 3.4, 0, 1.4 - lean * .05, -1.0);
  } };
});
// 12: "and did this."
shot(28.13, 29.71, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = burst(scene, cam, 0xff8a1f, 0xe85a1f, 0xfff0b0), K = kid(scene, KID, .82), sp = sparkles(scene, 8, 0xffffff, .06);
  return { scene, cam, update(tl, d, t) { u.value = t * 2; K.reset(); K.face(Math.floor(tl * 4) % 2 ? 'laugh' : 'happy'); sixSeven(K, t, 1.45, 10); K.root.rotation.y = .85; sp.forEach((s, i) => { const an = i * .785 + t * 2.5; s.position.set(Math.cos(an) * 1.0, 1.4 + Math.sin(an) * .8, .4); s.scale.setScalar(.5 + Math.max(0, Math.sin(t * 12 + i * 2)) * 2.4); }); look(cam, .25, 1.75, 3.0 * punch(tl, .2), .2, 1.18, 0); } };
});
// 13: "Like he was weighing two things." - a balance scale with a 6 and a 7
shot(29.71, 32.06, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = swirl(scene, cam, 0x0a2a5a, 0x1a6aa8, 0x7ae0ff), G = gold();
  scene.add(box(1.4, .16, .7, G, 0, .08, 0)); scene.add(box(.12, 2.6, .12, G, 0, 1.4, 0)); const beam = new THREE.Group(); beam.position.set(0, 2.7, 0); beam.add(box(2.4, .1, .1, G)); scene.add(beam); scene.add(new THREE.Mesh(new THREE.OctahedronGeometry(.16), G).translateY(2.82));
  const pans = [-1, 1].map(s => { const p = new THREE.Group(); p.add(new THREE.Mesh(new THREE.CylinderGeometry(.48, .36, .1, 10), G)); for (const a of [0, 2.1, 4.2]) { const st = box(.02, 1.2, .02, mat({ color: 0xc9a02a }), Math.cos(a) * .2, .6, Math.sin(a) * .2); st.rotation.set(Math.sin(a) * .3, 0, -Math.cos(a) * .3); p.add(st); } const dg = makeDigit(s < 0 ? 6 : 7, s < 0 ? 0xff3a5a : 0x3a8aff); dg.scale.setScalar(.4); dg.position.y = .38; p.add(dg); scene.add(p); return p; });
  return { scene, cam, update(tl, d, t) { u.value = t; const a = Math.sin(t * 9) * .28; beam.rotation.z = a; pans.forEach((p, i) => { const s = i ? 1 : -1; p.position.set(s * 1.15 * Math.cos(a), 2.7 + s * 1.15 * Math.sin(a) - 1.2, 0); p.rotation.y = Math.sin(t * 1.5) * .25; }); look(cam, 0, 2.0, 5.6 * punch(tl, .15), 0, 1.75, 0); } };
});
// 14: "That clip blew up."
shot(32.06, 33.77, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = burst(scene, cam, 0xd8262a, 0x9a1a1a, 0xffd0a0), S = dynTex(54, 104), ph = makePhone(S.t), hs = hearts(scene, 14), V = dynSign(cam), sp = sparkles(scene, 10, 0xfff27a, .08); ph.scale.setScalar(1.45); scene.add(ph);
  const flames = [...Array(7)].map((_, i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(.35, 1.2, 4), bmat({ color: [0xff3a1a, 0xff8a1a, 0xffd21a][i % 3] })); f.userData = i; scene.add(f); return f; });
  return { scene, cam, update(tl, d, t) {
    u.value = t * 2.2; const g = S.g; g.fillStyle = '#ff8a1f'; g.fillRect(0, 0, 54, 104); g.fillStyle = '#e8b089'; g.fillRect(17, 22, 20, 22); g.fillStyle = '#6a3a1a'; g.fillRect(16, 18, 22, 7); g.fillStyle = '#111'; g.fillRect(21, 30, 3, 3); g.fillRect(30, 30, 3, 3); g.fillStyle = '#5a1010'; g.fillRect(23, 37, 8, 5); g.fillStyle = '#ff8a1f'; g.fillRect(12, 46, 30, 30); g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('6 7', 27, 92); g.textAlign = 'left'; S.t.needsUpdate = true;
    const views = Math.round(1000 * Math.pow(10000, ss(0, 1.15, tl))), txt = views >= 1e6 ? (views / 1e6).toFixed(views >= 1e7 ? 0 : 1) + 'M VIEWS' : views >= 1e3 ? Math.round(views / 1e3) + 'K VIEWS' : views + ' VIEWS'; V.draw(txt, views >= 1e7 ? '#ff3a2a' : '#ffffff', views >= 1e7 ? '#ffffff' : '#16120a', 15); V.m.scale.setScalar(.84 * (1 + (tl > 1.15 ? .3 * Math.exp(-(tl - 1.15) * 6) * Math.cos((tl - 1.15) * 20) : 0)));
    ph.position.set(0, 1.6, 0); ph.rotation.set(-.08, Math.sin(t * 2) * .2, Math.sin(t * 13) * .03 * ss(.5, 1, tl));
    hs.forEach(h => { const i = h.userData, q = (tl * .9 + i / 14) % 1; h.position.set(Math.sin(i * 2.4) * (1.0 + q * 1.4), 1.6 + Math.cos(i * 2.4) * (1.2 + q * 1.5), .6); h.scale.setScalar(1.2 * Math.min(1, q * 5) * (1 - q * .4)); h.rotation.z = Math.sin(t * 4 + i) * .3; });
    flames.forEach(f => { const i = f.userData, fl = .8 + .3 * Math.sin(t * 25 + i * 2); f.position.set(-1.5 + i * .5, .25, -.4); f.scale.set(1, fl * ss(.5, .9, tl), 1); });
    sp.forEach((s, i) => { const an = i * .628 + t * 3; s.position.set(Math.cos(an) * 1.4, 1.6 + Math.sin(an) * 1.8, .7); s.scale.setScalar(.5 + Math.max(0, Math.sin(t * 12 + i * 2)) * 2); });
    look(cam, 0, 1.7, 5.4 * punch(tl, .2), 0, 1.6, 0); shake(cam, t, .02 + .05 * ss(.5, 1.1, tl));
  } };
});
// 15: "Suddenly, every time a teacher said six,"
shot(33.77, 36.62, () => {
  const C = classroom({ board: '' });
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    const said = tl > 2.2; C.kids.forEach((h, i) => { C.sit(i, said ? .15 : 0); h.face(said ? 'sly' : 'neutral'); if (said) h.head.rotation.y = Math.sin(i * 1.7) * .25; });
    const T = C.teacher; T.reset(); T.face(said ? 'happy' : 'neutral'); T.root.position.set(-.9, 0, -2.35); T.root.rotation.y = said ? 0 : Math.PI - .3; T.arms[1].rotation.x = said ? -.4 : -2.4; T.arms[1].rotation.z = said ? 0 : .3;
    C.drawBoard(tl > 1.4 ? '6' : tl > .9 ? '' : '', 40); if (!said) T.arms[1].rotation.x += Math.sin(t * 20) * .1 * (tl > .9 && tl < 1.4 ? 1 : 0);
    C.back(.4, 2.1, lerp(4.9, 4.2, tl / d), -.2, 1.7, -2.6);
  } };
});
// 16: "the whole class yelled seven."
shot(36.62, 39.93, () => {
  const C = classroom({ board: '6', fov: 60 }), sign = hud(C.cam, makeSign('SEVEN!!!', '#ff3a2a', '#ffffff')); C.teacher.root.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    const Y = 1.15, a = tl - Y; C.drawBoard('6', 40);
    C.kids.forEach((h, i) => { if (a < 0) { C.sit(i, .15); h.face('sly'); } else { C.stand(i); const hop = Math.abs(Math.sin(a * 7 + i)) * .2 * Math.exp(-a * 1.2); h.root.position.y = hop; sixSeven(h, t + i * .4, 1.2, 10); h.face('scream'); } });
    const T = C.teacher; T.reset(); T.face(a > 0 ? 'shocked' : 'happy'); T.root.position.set(-.9, 0, -2.35); if (a > 0) { T.arms[0].rotation.z = -.8; T.arms[1].rotation.z = .8; T.body.rotation.x = -.15; }
    sign.scale.setScalar(a > 0 ? lerp(2.4, .85, clamp(a / .08)) * (1 + .08 * Math.exp(-a * 8) * Math.cos(a * 25)) : .001); sign.rotation.z = -.06;
    C.front(0, 2.3, a > 0 ? -2.6 + .5 * Math.exp(-a * 6) : -2.3, 0, 1.0, 1.6); if (a > 0) shake(C.cam, t, .1 * Math.exp(-a * 3) + .015);
  } };
});
// 17: "Page sixty-seven?"
const pageCam = (cam, B, d, side = .62) => { B.g.updateMatrixWorld(true); const c = new THREE.Vector3(side, 0, 0).applyMatrix4(B.g.matrixWorld), n = new THREE.Vector3(0, 1, 0).applyQuaternion(B.g.quaternion); look(cam, c.x, c.y + n.y * d, c.z + n.z * d, c.x, c.y, c.z); return { c, n }; };
shot(39.93, 41.8, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.1, 1.8); const u = swirl(scene, cam, 0x3a1a8a, 0x8a2fd0, 0xff7ad0), B = makeBook(0xd8262a); B.g.position.set(0, 1.0, 0); B.g.rotation.x = .9; scene.add(B.g);
  const flip = new THREE.Group(), fm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.55), bmat({ color: 0xf6f2e6, side: THREE.DoubleSide })); fm.rotation.x = -Math.PI / 2; fm.position.x = .62; flip.add(fm); B.g.add(flip);
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.6; const n = Math.min(67, Math.round(40 + ss(0, .45, tl) * 27)); B.right.draw((c) => { c.fillStyle = '#f6f2e6'; c.fillRect(0, 0, 64, 80); c.fillStyle = '#9a948a'; for (let y = 6; y < 30; y += 5) c.fillRect(6, y, 50 - (y % 15), 1); for (let y = 62; y < 76; y += 5) c.fillRect(6, y, 50 - (y % 15), 1); c.fillStyle = n === 67 ? '#d8262a' : '#16120a'; c.font = 'bold ' + (n === 67 ? 30 : 20) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), 32, 46); });
    flip.visible = tl < .5; flip.rotation.z = (tl * 18) % Math.PI; const k = ss(.45, .8, tl); pageCam(cam, B, lerp(3.2, 1.75, k), lerp(.2, .62, k)); if (tl > .45) shake(cam, t, .03 * Math.exp(-(tl - .45) * 6));
  } };
});
// 18: "Chaos."
shot(41.8, 43.09, () => {
  const C = classroom({ board: '6 7 6 7 6 7', fov: 62 }), ps = papersFly(C.scene, 16), red = new THREE.PointLight(0xff2a2a, 0, 14); red.position.set(0, 3.5, 1); C.scene.add(red);
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    C.kids.forEach((h, i) => { C.stand(i, i % 2 === 0); sixSeven(h, t + i * .5, 1.4, 11); h.face(i % 3 ? 'scream' : 'laugh'); h.root.position.y += Math.abs(Math.sin(t * 9 + i)) * .25; });
    const T = C.teacher; T.reset(); T.face('scream'); T.root.position.set(-1.4, 0, -2.1); T.arms[0].rotation.z = -2.6; T.arms[1].rotation.z = 2.6; T.body.position.y = Math.abs(Math.sin(t * 12)) * .1;
    papersAt(ps, t); red.intensity = Math.floor(t * 8) % 2 ? 20 : 0; C.front(Math.sin(t * 2) * .5, 2.6, -2.5, 0, 1.2, 1.4); C.cam.rotation.z += Math.sin(t * 5) * .05; shake(C.cam, t, .05);
  } };
});
// 19: "Some teachers banned it."
shot(43.09, 44.96, () => {
  const C = classroom({ board: '6 - 7', fov: 52 }), noT = ctex(64, 64, g => { g.clearRect(0, 0, 64, 64); g.strokeStyle = '#e8141e'; g.lineWidth = 7; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.stroke(); g.beginPath(); g.moveTo(14, 14); g.lineTo(50, 50); g.stroke(); });
  const no = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), bmat({ map: noT, transparent: true })); no.position.set(0, 2.15, -2.9); C.scene.add(no); const st = hud(C.cam, makeSign('BANNED', '#ff3a2a', '#ffffff'));
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    C.drawBoard('6 - 7', 34); const a = tl - .62, b = tl - 1.0; no.visible = a > 0; no.scale.setScalar(a > 0 ? lerp(2.2, 1, clamp(a / .08)) : 1);
    const T = C.teacher; T.reset(); T.face('angry'); T.root.position.set(1.15, 0, -1.75); T.root.rotation.y = -.45; T.arms[0].rotation.x = -1.6; T.arms[0].rotation.z = -.35; T.arms[1].rotation.x = -.5; T.head.rotation.y = .35;
    C.kids.forEach((h, i) => { C.sit(i); h.face('sad'); }); st.scale.setScalar(b > 0 ? lerp(2.4, .85, clamp(b / .08)) * (1 + .08 * Math.exp(-b * 8) * Math.cos(b * 25)) : .001); st.rotation.z = .07;
    look(C.cam, .4, 2.0, 1.15 * punch(tl, .08), .35, 1.95, -2.9); if (a > 0) shake(C.cam, t, .05 * Math.exp(-Math.min(a, Math.max(b, 0)) * 9));
  } };
});
// 20a: "Others started saying it themselves,"
shot(44.96, 47.1, () => {
  const C = classroom({ board: '6 - 7', teacher: TEACHER2, fov: 52 }), sp = sparkles(C.scene, 8, 0xfff27a, .06); shades(C.teacher);
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    const T = C.teacher; T.reset(); T.face('laugh'); T.root.position.set(0, 0, -2.3); sixSeven(T, t, 1.5, 8); T.body.rotation.z = Math.sin(t * 4) * .15; T.root.position.x = Math.sin(t * 2) * .3;
    C.kids.forEach((h, i) => { C.sit(i); h.face('shocked'); }); sp.forEach((s, i) => { const an = i * .785 + t * 2; s.position.set(T.root.position.x + Math.cos(an) * .9, 2.1 + Math.sin(an) * .7, -2.0); s.scale.setScalar(.5 + Math.max(0, Math.sin(t * 10 + i * 2)) * 2); });
    look(C.cam, .3, 1.65, .25, T.root.position.x * .5, 1.55, -2.3);
  } };
});
// 20b: "to make it uncool."
shot(47.1, 48.9, () => {
  const C = classroom({ board: '6 - 7', teacher: TEACHER2, fov: 60 }), sign = hud(C.cam, makeSign('UNCOOL', '#9aa0aa', '#16120a')); shades(C.teacher);
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    const T = C.teacher; T.reset(); T.root.visible = false;
    const s = ss(.2, .9, tl); C.kids.forEach((h, i) => { C.sit(i); h.face('cringe'); h.body.rotation.x = -.25 * s; h.root.position.y = -.21 - .08 * s; h.root.position.z += .1 * s; h.arms[0].rotation.x = h.arms[1].rotation.x = -1.05 + s * .5; if (i === 4) { h.arms[1].rotation.x = -2.6; h.arms[1].rotation.z = -.55; } });
    sign.scale.setScalar(pop(tl - .5) * .85); sign.rotation.z = -.05; C.front(0, 2.0, lerp(-1.75, -1.4, tl / d), 0, 1.0, 1.6);
  } };
});
// 21: "Then Dictionary dot com made it the word of the year."
shot(48.9, 52.54, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x14081a); lights(scene, 1.6, 1.6); scene.add(cam);
  const curT = ctex(32, 32, g => { g.fillStyle = '#9a1a2a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#7a1020'; for (let x = 0; x < 32; x += 6) g.fillRect(x, 0, 3, 32); noise(g, 32, 32, 10, 51); }, [6, 1]);
  scene.add(box(14, 7, .2, mat({ map: curT }), 0, 3.5, -2.5)); const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat({ color: 0x3a2a3a })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  scene.add(box(1.6, 1.1, 1.0, mat({ color: 0xd8d2c2 }), 0, .55, 0)); const B = makeBook(0x2f5ab0); B.g.position.set(0, 1.18, 0); B.g.rotation.x = .25; scene.add(B.g);
  B.right.draw(c => { c.fillStyle = '#f6f2e6'; c.fillRect(0, 0, 64, 80); c.fillStyle = '#16120a'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center'; c.fillText('6-7', 32, 22); c.fillStyle = '#9a948a'; for (let y = 34; y < 72; y += 6) c.fillRect(8, y, 46 - (y % 12), 1); });
  const ss67 = makeSixSeven(); ss67.scale.setScalar(.42); scene.add(ss67); const cup = new THREE.Group(), G = gold(); cup.add(box(.5, .12, .5, G, 0, .06, 0)); cup.add(box(.12, .35, .12, G, 0, .3, 0)); const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.34, .14, .45, 10), G); bowl.position.y = .7; cup.add(bowl); for (const s of [-1, 1]) cup.add(box(.08, .25, .08, G, s * .38, .72, 0)); cup.position.set(1.35, 1.1, .2); scene.add(cup);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 6, 10, 1, true), bmat({ color: 0xfff6c0, transparent: true, opacity: .15, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(0, 4, 0); scene.add(cone);
  const cf = confetti(scene, 40), sign = hud(cam, makeSign('WORD OF THE YEAR', '#ffe21f', '#16120a'));
  return { scene, cam, update(tl, d, t) {
    ss67.position.set(0, 2.55 + Math.sin(t * 2) * .08, .2); ss67.rotation.y = Math.sin(t * 1.4) * .35; ss67.scale.setScalar(.42 * pop(tl - .3)); cup.rotation.y = t * 1.2; cup.scale.setScalar(pop(tl - 1.7));
    const a = tl - 1.65; cf.forEach(c => c.visible = a > 0); confettiAt(cf, t, 6, 7); sign.scale.setScalar(pop(a) * .85); look(cam, 0, 2.15, lerp(6.8, 5.7, tl / d), 0, 1.95, 0);
  } };
});
// 22: "And admitted it has no definition."
shot(52.54, 55.14, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.1, 1.8); const u = swirl(scene, cam, 0x101a3a, 0x1f2f6a, 0x4a5ab0), B = makeBook(0x2f5ab0); B.g.position.set(0, 1.0, 0); B.g.rotation.x = 1.1; scene.add(B.g);
  const mg = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(.32, .05, 5, 14), mat({ color: 0x5a3a22 })); mg.add(ring); const lens = new THREE.Mesh(new THREE.CircleGeometry(.3, 14), mat({ color: 0xbfe6ff, transparent: true, opacity: .3 })); mg.add(lens); const hd = box(.08, .6, .08, mat({ color: 0x5a3a22 }), .25, -.5, 0); hd.rotation.z = .5; mg.add(hd); scene.add(mg);
  return { scene, cam, update(tl, d, t) {
    u.value = t; const q = tl > 1.1; B.right.draw(c => { c.fillStyle = '#f6f2e6'; c.fillRect(0, 0, 64, 80); c.fillStyle = '#16120a'; c.font = 'bold 15px sans-serif'; c.textAlign = 'center'; c.fillText('6-7', 32, 20); c.font = 'italic 7px sans-serif'; c.fillText('definition:', 32, 34); if (q) { c.fillStyle = '#d8262a'; c.font = 'bold 16px sans-serif'; c.fillText('???', 32, 56); } else if (Math.floor(t * 3) % 2) { c.fillStyle = '#16120a'; c.fillRect(30, 44, 2, 12); } });
    const P = pageCam(cam, B, 1.95 * punch(tl, .08)); mg.position.copy(P.c).addScaledVector(P.n, .22); mg.position.x += .1 + Math.sin(t * 1.8) * .15; mg.position.y -= .12 + Math.cos(t * 1.4) * .06; mg.quaternion.copy(B.g.quaternion); mg.rotateX(-Math.PI / 2); mg.scale.setScalar(.6); if (q) shake(cam, t, .03 * Math.exp(-(tl - 1.1) * 7));
  } };
});
// 23-25: "It's part inside joke, part signal, part performance."
shot(55.14, 56.84, () => {
  const C = classroom({ fov: 50 }), sign = hud(C.cam, makeSign('INSIDE JOKE', '#3fd060', '#16120a'));
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    C.kids.forEach((h, i) => { C.sit(i); h.face('neutral'); }); C.teacher.root.visible = false; const A = C.kids[0], Bk = C.kids[1];
    A.root.position.x = -.5; A.root.rotation.y = Math.PI - .75; A.face('sly'); A.arms[0].rotation.x = -2.55; A.arms[0].rotation.z = .55; A.body.rotation.z = .12; A.body.rotation.x = .12;
    Bk.root.position.x = .05; Bk.root.rotation.y = Math.PI + .3; Bk.face(tl > .6 ? 'laugh' : 'shocked'); if (tl > .6) { Bk.body.position.y = Math.abs(Math.sin(t * 14)) * .04; Bk.arms[0].rotation.x = -2.0; Bk.head.rotation.z = .1; }
    sign.scale.setScalar(pop(tl - .25) * .85); look(C.cam, -.05, 1.5, -1.55, -.22, 1.28, .55);
  } };
});
shot(56.84, 57.91, () => {
  const C = classroom({ fov: 58 }), sign = hud(C.cam, makeSign('SIGNAL', '#3a8aff', '#ffffff')), rings = [0, 1, 2, 3].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(.3, .035, 4, 14), bmat({ color: 0x7af6ff, transparent: true })); C.scene.add(r); return r; });
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    C.kids.forEach((h, i) => { C.sit(i); h.face('neutral'); }); C.teacher.root.visible = false;
    C.stand(8); const K = C.kids[8]; K.root.rotation.y = -2.25; sixSeven(K, t, 1.1, 9); K.face('sly');
    C.stand(0); const R = C.kids[0]; R.root.rotation.y = .9; R.face('sly'); if (tl > .4) sixSeven(R, t + 1, 1.1, 9);
    const A = new THREE.Vector3(1.4, 1.35, 2.95), Bp = new THREE.Vector3(-1.4, 1.35, .75); rings.forEach((r, i) => { const q = (tl * 1.4 + i / 4) % 1; r.position.lerpVectors(A, Bp, q); r.lookAt(Bp); r.scale.setScalar(.4 + q * 1.1); r.material.opacity = .9 * (1 - q * .6); });
    sign.scale.setScalar(pop(tl - .15) * .85); look(C.cam, -3.0, 2.35, -2.3, .6, 1.3, 2.1);
  } };
});
shot(57.91, 59.59, () => {
  const C = classroom({ fov: 58 }), sign = hud(C.cam, makeSign('PERFORMANCE', '#ff3a5a', '#ffffff')), sp = sparkles(C.scene, 10, 0xfff27a, .07), cone = new THREE.Mesh(new THREE.ConeGeometry(.9, 4, 10, 1, true), bmat({ color: 0xfff6c0, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide }));
  cone.position.set(0, 3.0, 1.45); C.scene.add(cone); C.teacher.root.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    C.kids.forEach((h, i) => { C.sit(i); h.face('laugh'); h.head.rotation.x = -.2; }); C.stand(4, true); const K = C.kids[4]; sixSeven(K, t, 1.4, 10); K.face('happy'); K.body.rotation.y += Math.sin(t * 3) * .3;
    sp.forEach((s, i) => { const an = i * .628 + t * 2; s.position.set(Math.cos(an) * .8, 2.2 + Math.sin(an) * .8, 1.45); s.scale.setScalar(.5 + Math.max(0, Math.sin(t * 12 + i * 2)) * 2.2); });
    sign.scale.setScalar(pop(tl - .15) * .85); C.front(.25, 2.3, -2.25, 0, 1.95, 1.45);
  } };
});
// 26: "So if you don't get it, that's kind of the point."
shot(59.59, 62.95, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = burst(scene, cam, 0xffd21f, 0xff9a1f, 0xfff6c0), P = palms(makeHuman(PARENT), PARENT.skin), K = kid(scene, KID, .82), q = makeSign('?', '#ffe21f', '#16120a'); scene.add(P.root, q);
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.3; const tr = tl > 1.55; P.reset(); P.root.position.set(-.65, 0, 0); P.root.rotation.y = .35; P.face(tr ? 'happy' : 'confused');
    if (tr) { P.arms[0].rotation.x = -1.3; P.arms[1].rotation.x = -.2; P.arms[1].rotation.z = .5; P.head.rotation.z = -.1; } else shrug(P, ss(0, .3, tl));
    K.reset(); K.root.position.set(.75, 0, .2); K.root.rotation.y = -.35; sixSeven(K, t, 1, 9); K.face(tr ? 'laugh' : 'happy'); if (tr) K.body.position.y += Math.abs(Math.sin(t * 14)) * .05;
    q.position.set(-.65, 2.65 + Math.sin(t * 3) * .06, 0); q.scale.set(.34 * pop(tl - .1), .72 * pop(tl - .1), 1); q.visible = !tr; look(cam, 0, 1.7, 4.6 * punch(tl, .15), 0, 1.55, 0);
  } };
});
shot(62.95, DUR + .1, sHook(true));

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
