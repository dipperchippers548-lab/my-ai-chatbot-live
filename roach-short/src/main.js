// "He Woke Up With A Cockroach In His Ear" - PS1-style low-poly short (Zack-style camera), rendered frame by frame.
// (engine section shared with ../invisible-short)
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 55.39;
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
function dynSign(cam, y = 1.22) { const D = dynTex(96, 40), m = hud(cam, new THREE.Mesh(new THREE.PlaneGeometry(1.9, .8), bmat({ map: D.t })), y); return { m, draw(text, bg = '#ffe21f', fg = '#16120a', px = 17) { const g = D.g; g.fillStyle = '#16120a'; g.fillRect(0, 0, 96, 40); g.fillStyle = bg; g.fillRect(3, 3, 90, 34); g.fillStyle = fg; do { g.font = 'bold ' + px + 'px sans-serif'; px--; } while (g.measureText(text).width > 84 && px > 6); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 48, 21); D.t.needsUpdate = true; } }; }
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
function palms(h, skin) { const m = mat({ color: skin }); h.arms.forEach(a => a.add(box(.24, .26, .06, m, 0, -.74, .1))); return h; }


// ---------- roach short: look & helpers ----------
Object.assign(EXPR, {
  sleep: { open: .06, browIn: 0, browOut: 0, mouth: 'neutral' },
  pain: { open: .35, browIn: 5, browOut: -1.5, mouth: 'scream' },
  sly: { open: .68, browIn: -.5, browOut: 1.5, browL: 2.6, browR: -1, lx: .6, mouth: 'skew' },
});
// fake depth of field: a blurred copy of the frame with the sharp frame on top, faded out from the focus point
const dofA = document.createElement('canvas'); dofA.width = W; dofA.height = H; const dg = dofA.getContext('2d');
function dofDraw(o) {
  if (!o) { lg.drawImage(renderer.domElement, 0, 0); return; }
  const { b = 1.6, x = .5, y = .45, r = .32 } = o;
  lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H); lg.filter = `blur(${b}px)`; lg.drawImage(renderer.domElement, -3, -3, W + 6, H + 6); lg.filter = 'none';
  dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, W, H); dg.drawImage(renderer.domElement, 0, 0);
  dg.globalCompositeOperation = 'destination-in'; const gr = dg.createRadialGradient(x * W, y * H, r * W * .5, x * W, y * H, r * W * 1.3); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, W, H);
  lg.drawImage(dofA, 0, 0);
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const handAt = (h, i = 1) => { h.root.updateMatrixWorld(true); return h.arms[i].localToWorld(V(0, -.76, .1)); };
const earAt = h => { h.root.updateMatrixWorld(true); return h.head.localToWorld(V(.235, .27, 0)); };
function flashQuad(cam, col = 0xffffff) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 5), bmat({ color: col, transparent: true, opacity: 0, depthTest: false })); m.renderOrder = 998; m.position.z = -1; cam.add(m); return m; }
function rings(scene, n = 4, col = 0xffffff) { return [...Array(n)].map((_, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .06, 3, 18), bmat({ color: col, transparent: true, depthWrite: false })); m.userData = i; scene.add(m); return m; }); }
const ringsAt = (rs, t, p, cam, size = .3, rate = 1.6, a = 1) => rs.forEach(m => { const q = (t * rate + m.userData / rs.length) % 1; m.position.copy(p); m.lookAt(cam.position); m.scale.setScalar(size * (.2 + q)); m.material.opacity = (1 - q) * .8 * a; m.visible = a > 0; });
// the cockroach: shell, head, six walking legs in a tripod gait, long twitchy antennae. Faces +z, about .85 long at scale 1
function makeRoach(s = 1) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const shell = mat({ color: 0x7a3c16 }), dark = mat({ color: 0x2a140a }), lg_ = mat({ color: 0x4a2410 });
  const ab = new THREE.Mesh(new THREE.SphereGeometry(.5, 9, 5), shell); ab.scale.set(.44, .17, .62); ab.position.set(0, .1, -.1); body.add(ab);
  body.add(box(.014, .02, .55, dark, 0, .185, -.12));
  const pro = new THREE.Mesh(new THREE.SphereGeometry(.5, 8, 4), mat({ color: 0x9a5c2a })); pro.scale.set(.38, .13, .24); pro.position.set(0, .12, .23); body.add(pro);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.5, 6, 4), dark); hd.scale.set(.17, .11, .13); hd.position.set(0, .08, .37); body.add(hd);
  const ants = [-1, 1].map(k => { const a = new THREE.Group(); a.position.set(k * .04, .1, .42); a.add(box(.014, .014, .75, lg_, 0, 0, .37)); a.rotation.y = k * .35; a.rotation.x = -.3; body.add(a); return a; });
  const legs = []; for (const k of [-1, 1]) for (const [z, sw] of [[.2, .7], [.04, .05], [-.14, -.75]]) {
    const l = new THREE.Group(); l.position.set(k * .14, .07, z); l.add(box(.24, .026, .026, lg_, k * .12, 0, 0)); const tib = box(.026, .026, .3, lg_, k * .25, -.08, -.05); tib.rotation.x = .45; tib.rotation.y = k * .2; l.add(tib);
    l.userData = { base: -k * sw, k }; l.rotation.y = l.userData.base; l.rotation.z = -k * .25; body.add(l); legs.push(l);
  }
  g.scale.setScalar(s);
  g.userData = { body, walk(t, a = 1) { legs.forEach((l, i) => { const ph = ((i % 3) + (i >= 3 ? 1 : 0)) % 2 ? Math.PI : 0, u = l.userData; l.rotation.y = u.base + Math.sin(t + ph) * .38 * a; l.rotation.z = -u.k * (.25 - Math.max(0, Math.sin(t + ph + 1.57)) * .2 * a); }); ants.forEach((an, i) => { an.rotation.y = (i ? 1 : -1) * (.35 + Math.sin(t * .7 + i * 2) * .2); an.rotation.x = -.3 + Math.sin(t * .9 + i) * .15; }); body.position.y = Math.abs(Math.sin(t)) * .01 * a; } };
  return g;
}
// move a roach along a path of points (k in 0..1), facing where it walks
function roachPath(r, pts, k) { const n = pts.length - 1, f = clamp(k) * n, i = Math.min(n - 1, Math.floor(f)), q = f - i, a = pts[i], b = pts[i + 1]; r.position.lerpVectors(a, b, q); r.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); }
function makeSwab() { const g = new THREE.Group(); g.add(box(.025, .025, .5, bmat({ color: 0xf4f4f4 }))); for (const z of [-.25, .25]) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(.035, 0), bmat({ color: 0xffffff })); c.scale.set(1, 1, 1.6); c.position.z = z; g.add(c); } return g; }
function makeBottle() { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, .26, 8), mat({ color: 0xf4c86a, transparent: true, opacity: .85 }))); const cap = new THREE.Mesh(new THREE.CylinderGeometry(.025, .04, .08, 6), mat({ color: 0xf2f2f2 })); cap.position.y = .17; g.add(cap); g.add(box(.1, .09, .005, bmat({ color: 0x8ac8ff }), 0, 0, .08)); return g; }
const MAN = { skin: 0xe2a57f, hair: 0x3a2618, top: 0x9aa4b0, pants: 0x3a4a6a, topStyle: 'plain', stubble: true, hairH: .16, iris: '#4a6a8a', shoes: 0xd89a74 };
const DOC = { skin: 0xc98d68, hair: 0x2a2018, top: 0xf4f4f4, pants: 0x3a6a8a, topStyle: 'coat', glasses: true, hairH: .12, shoes: 0xf2f2f2, lip: '#8a4040' };
const floorT = ctex(32, 32, g => { g.fillStyle = '#7a5434'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#6a4628'; for (let x = 0; x < 32; x += 4) g.fillRect(x, 0, 1, 32); for (let x = 0; x < 32; x += 4) g.fillRect(x, (x * 7) % 32, 4, 1); noise(g, 32, 32, 12, 43); }, [8, 8]);
// the bedroom at night: moonlit window, bed, nightstand with a red alarm clock and an open bag of chips
function bedroom() {
  const scene = new THREE.Scene(), cam = newCam(50); scene.background = new THREE.Color(0x04060c); scene.fog = new THREE.Fog(0x04060c, 5, 12); scene.add(cam);
  scene.add(new THREE.AmbientLight(0x6070b0, 1.5)); const moon = new THREE.DirectionalLight(0xa8c4ff, 1.8); moon.position.set(-3, 4, 2); scene.add(moon);
  const glow = new THREE.PointLight(0xff3a2a, .7, 1.3); glow.position.set(1.0, .95, -.55); scene.add(glow);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat({ map: floorT })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const wm = mat({ color: 0x2c3658 }); scene.add(box(8, 3.2, .2, wm, 0, 1.6, -1.7)); scene.add(box(.2, 3.2, 8, wm, -2.4, 1.6, 1));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), bmat({ color: 0x5a7ac8 })); win.position.set(-1.3, 1.9, -1.59); scene.add(win); scene.add(box(1.2, .06, .05, mat({ color: 0xd8dce8 }), -1.3, 1.9, -1.57)); scene.add(box(.06, 1.4, .05, mat({ color: 0xd8dce8 }), -1.3, 1.9, -1.57));
  const moonD = new THREE.Mesh(new THREE.CircleGeometry(.14, 10), bmat({ color: 0xf4f6ff })); moonD.position.set(-1.05, 2.2, -1.585); scene.add(moonD);
  scene.add(box(1.5, .35, 2.6, mat({ color: 0x5a3a24 }), 0, .25, .1)); scene.add(box(1.4, .2, 2.5, mat({ color: 0xd8dce8 }), 0, .52, .1)); scene.add(box(1.6, 1.0, .12, mat({ color: 0x5a3a24 }), 0, .75, -1.2));
  scene.add(box(.8, .1, .42, mat({ color: 0xeef0f6 }), 0, .67, -.88)); const blanket = box(1.46, .16, 1.7, mat({ color: 0x3a5a9a }), 0, .76, .5); scene.add(blanket);
  const ns = mat({ color: 0x6a4428 }); scene.add(box(.5, .6, .5, ns, .98, .3, -.75));
  scene.add(box(.3, .17, .12, mat({ color: 0x111114 }), .92, .685, -.68)); const C = dynTex(32, 16), face = new THREE.Mesh(new THREE.PlaneGeometry(.26, .13), bmat({ map: C.t })); face.position.set(.92, .685, -.619); scene.add(face);
  const drawClock = (txt) => { const g = C.g; g.fillStyle = '#100404'; g.fillRect(0, 0, 32, 16); g.fillStyle = '#ff2a1a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 16, 9); C.t.needsUpdate = true; };
  const bag = new THREE.Group(); bag.add(box(.2, .26, .07, mat({ color: 0xe8721f }))); bag.add(box(.14, .08, .072, mat({ color: 0xffe21f }), 0, .02, .002)); bag.position.set(1.12, .73, -.86); bag.rotation.set(-.2, -.4, .2); scene.add(bag);
  const r = rng(6); for (let i = 0; i < 9; i++) scene.add(box(.025, .012, .025, mat({ color: 0xf2c25a }), 1.0 + r() * .2, .605, -.7 + r() * .25));
  const pivot = new THREE.Group(); pivot.position.set(0, .84, .16); scene.add(pivot); const M = makeHuman(MAN); M.root.position.set(0, -.84, 0); pivot.add(M.root);
  return { scene, cam, M, blanket, drawClock, bag,
    pose(k) { M.reset(); pivot.rotation.x = -Math.PI / 2 * (1 - k); M.legs[0].rotation.x = M.legs[1].rotation.x = -1.5 * k; blanket.visible = true; blanket.position.set(0, .76 + k * .05, .5 + k * .1); } };
}
const fleshT = ctex(32, 32, g => { g.fillStyle = '#c8605a'; g.fillRect(0, 0, 32, 32); const r = rng(5); for (let i = 0; i < 70; i++) { g.fillStyle = r() < .5 ? '#a84a48' : '#e08070'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 2, 1); } g.strokeStyle = 'rgba(120,20,30,.55)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(r() * 32, 0); g.bezierCurveTo(r() * 32, 10, r() * 32, 20, r() * 32, 32); g.stroke(); } }, [4, 2]);
const cutT = ctex(32, 32, g => { const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, '#f0b890'); gr.addColorStop(.12, '#f0b890'); gr.addColorStop(.14, '#f4e0a0'); gr.addColorStop(.3, '#e8c890'); gr.addColorStop(.32, '#b8484a'); gr.addColorStop(1, '#8a2a34'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); noise(g, 32, 32, 14, 8); });
// cutaway of the ear canal: opening at x = -2.2, eardrum at x = 2.2, cut open so we look in from +z
function canal() {
  const scene = new THREE.Scene(), cam = newCam(50); scene.background = new THREE.Color(0x12050a); scene.fog = new THREE.Fog(0x12050a, 4, 10); scene.add(cam);
  scene.add(new THREE.AmbientLight(0xffd8c8, 1.5)); const key = new THREE.PointLight(0xfff0e0, 10, 7); key.position.set(-1, 1.5, 2.5); scene.add(key);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.55, .46, 4.4, 16, 1, true, Math.PI / 2, Math.PI), mat({ map: fleshT, side: THREE.DoubleSide })); tube.rotation.z = Math.PI / 2; scene.add(tube);
  const cutM = mat({ map: cutT }); for (const s of [-1, 1]) { const b = box(6.4, 2.2, 2.4, [cutM, cutM, cutM, cutM, cutM, cutM], .6, s * 1.62, -1.2); if (s < 0) b.rotation.z = Math.PI; scene.add(b); }
  scene.add(box(2.4, 5.4, .3, mat({ color: 0x5a1a24 }), 3.6, 0, -1.2));
  const skin = mat({ color: 0xe2a57f }); scene.add(box(.4, 1.6, 2.6, skin, -2.6, 1.4, -1.2)); scene.add(box(.4, 1.6, 2.6, skin, -2.6, -1.4, -1.2)); const pinna = box(.5, 1.0, .3, skin, -3.0, 1.9, -.1); pinna.rotation.z = -.4; scene.add(pinna);
  const hairM = mat({ color: 0x3a2618 }), r = rng(3); for (let i = 0; i < 10; i++) { const h = box(.012, .25, .012, hairM, -2.1 + r() * .5, -.42 + (i % 2) * .84, -.1 - r() * .3); h.rotation.z = (i % 2 ? 1 : -1) * (.8 + r() * .4); scene.add(h); }
  for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.IcosahedronGeometry(.05 + r() * .05, 0), mat({ color: 0xd8a040 })); w.position.set(-1.6 + r() * 3, -.46 + r() * .05, -.15 - r() * .2); scene.add(w); }
  const drum = new THREE.Mesh(new THREE.CircleGeometry(.47, 16), mat({ color: 0xf0c0b0, transparent: true, opacity: .9, side: THREE.DoubleSide })); drum.rotation.y = -Math.PI / 2; drum.position.x = 2.2; scene.add(drum);
  const boneM = mat({ color: 0xf4ecd8 }); for (const [x, y, rz] of [[2.45, .1, .4], [2.65, .3, -.3], [2.85, .15, .9]]) { const b = box(.08, .35, .08, boneM, x, y, -.2); b.rotation.z = rz; scene.add(b); }
  const fluid = new THREE.Mesh(new THREE.PlaneGeometry(4.4, .9), bmat({ color: 0x6ac0ff, transparent: true, opacity: .5, depthWrite: false })); fluid.rotation.x = -Math.PI / 2; fluid.position.set(0, -.5, -.25); fluid.visible = false; scene.add(fluid);
  const R = makeRoach(1); scene.add(R);
  return { scene, cam, R, drum, fluid, key };
}
const floorY = x => -.5 + (x + 2.2) * .02 + .02;   // canal floor height (the tube tapers)
function hospital() {
  const scene = new THREE.Scene(), cam = newCam(50); scene.background = new THREE.Color(0xd0ece4); lights(scene, 2.2, 1.6); scene.add(cam);
  const tl_ = ctex(32, 32, g => { for (let y = 0; y < 32; y += 8) for (let x = 0; x < 32; x += 8) { g.fillStyle = (x + y) % 16 ? '#e8ece8' : '#c8d8d0'; g.fillRect(x, y, 8, 8); } noise(g, 32, 32, 8, 3); }, [8, 8]);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), mat({ map: tl_ })); fl.rotation.x = -Math.PI / 2; scene.add(fl); scene.add(box(12, 5, .2, mat({ color: 0xbfe0d4 }), 0, 2.5, -2)); scene.add(box(12, .4, .22, mat({ color: 0x7ab0a0 }), 0, .2, -1.98));
  scene.add(box(1.2, 1.6, .5, mat({ color: 0xf2f2f2 }), -2.0, .8, -1.6)); scene.add(box(.8, .8, .05, bmat({ color: 0x2a3a4a }), 1.6, 2.4, -1.88)); scene.add(box(.7, .05, .05, bmat({ color: 0x3fd060 }), 1.6, 2.4, -1.85));
  scene.add(box(.9, .5, .9, mat({ color: 0x3a6a8a }), 0, .25, 0)); scene.add(box(.9, .9, .15, mat({ color: 0x3a6a8a }), 0, .9, -.4));
  const M = makeHuman(MAN), D = makeHuman(DOC); scene.add(M.root, D.root); const mirror = new THREE.Mesh(new THREE.CircleGeometry(.1, 10), bmat({ color: 0xe8eef4 })); mirror.position.set(0, .5, .24); D.head.add(mirror);
  const tw = new THREE.Group(); for (const s of [-1, 1]) { const a = box(.012, .012, .3, bmat({ color: 0xc9ced6 }), s * .012, 0, .15); a.rotation.y = s * .05; tw.add(a); } scene.add(tw);
  const R = makeRoach(.11); scene.add(R);
  return { scene, cam, M, D, tw, R };
}
function bathroom() {
  const scene = new THREE.Scene(), cam = newCam(50); scene.background = new THREE.Color(0xdfe8ee); lights(scene, 2.1, 1.6); scene.add(cam);
  const wt = ctex(32, 32, g => { g.fillStyle = '#e8f0f4'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#b8c8d0'; for (let i = 0; i < 32; i += 8) { g.fillRect(i, 0, 1, 32); g.fillRect(0, i, 32, 1); } }, [10, 6]);
  scene.add(box(10, 5, .2, mat({ map: wt }), 0, 2.5, -1.2)); const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat({ color: 0x8a9aa8 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  scene.add(box(1.4, .9, .7, mat({ color: 0xf4f4f4 }), 0, .45, -.8)); scene.add(box(1.2, .06, .55, mat({ color: 0xb8c8d0 }), 0, .91, -.78)); scene.add(box(.06, .3, .06, mat({ color: 0xc9ced6 }), 0, 1.05, -1.0)); scene.add(box(.06, .06, .22, mat({ color: 0xc9ced6 }), 0, 1.18, -.9));
  scene.add(box(1.1, 1.2, .05, bmat({ color: 0x9ab8c8 }), 0, 2.1, -1.08)); scene.add(box(1.2, 1.3, .03, mat({ color: 0xf2f2f2 }), 0, 2.1, -1.1));
  const M = makeHuman(MAN); scene.add(M.root); return { scene, cam, M };
}
function drops(scene, n, col, sz = .025) { return [...Array(n)].map((_, i) => { const d = new THREE.Mesh(new THREE.IcosahedronGeometry(sz, 0), bmat({ color: col })); d.scale.y = 1.6; d.userData = i; scene.add(d); return d; }); }
const dropsAt = (ds, t, a, b, rate = 2, spread = .02) => ds.forEach(d => { const q = (t * rate + d.userData / ds.length) % 1; d.position.lerpVectors(a, b, q); d.position.x += Math.sin(d.userData * 7) * spread; d.position.y -= q * q * .05; });
function makeBulb(scene) { const g = new THREE.Group(); const gl = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 1), bmat({ color: 0xfff27a })); gl.position.y = .1; g.add(gl); g.add(box(.12, .1, .12, mat({ color: 0x9aa0aa }), 0, -.08, 0)); const halo = new THREE.Mesh(new THREE.CircleGeometry(.32, 14), bmat({ color: 0xfff6c0, transparent: true, opacity: .35, depthWrite: false })); halo.position.set(0, .1, -.05); g.add(halo); scene.add(g); return g; }
const slow = (cam, p, tgt, tl, push = .08) => { const k = 1 - tl * push; cam.position.copy(tgt).add(p.clone().multiplyScalar(Math.max(.4, k))); cam.lookAt(tgt); };

// ---------- roach short: shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
// 1: "This man woke up at 3 a.m. to a scratching sound."
shot(0, 4.54, () => {
  const B = bedroom();
  return { scene: B.scene, cam: B.cam, update(tl, d, t) {
    B.pose(0); B.M.face(tl > .62 ? 'worried' : 'sleep'); B.M.head.rotation.y = tl > 2.6 ? Math.sin(t * 1.2) * .08 : 0; B.drawClock('3:00');
    const k = ss(0, 4.5, tl); look(B.cam, lerp(2.4, 1.0, k), lerp(2.3, 1.35, k), lerp(2.4, .2, k), lerp(.3, .25, k), lerp(.7, .85, k), lerp(-.5, -.75, k));
  } };
});
// 2: "And it was coming from inside his head." - slow push into the ear
shot(4.54, 7.05, () => {
  const B = bedroom(), rs = rings(B.scene, 4, 0xfff2c0);
  return { scene: B.scene, cam: B.cam, dof: { b: 1.6, y: .48, r: .3 }, update(tl, d, t) {
    B.pose(0); B.M.face('worried'); B.M.head.rotation.y = Math.sin(t * 1.5) * .05; B.drawClock('3:00'); const e = earAt(B.M);
    slow(B.cam, V(.75, .28, .5), e, tl, .2); ringsAt(rs, t, e.clone().add(V(.02, 0, 0)), B.cam, .09, 1.8, .6);
  } };
});
// 3: "He sat up, and it got louder."
shot(7.05, 10.07, () => {
  const B = bedroom(), rs = rings(B.scene, 5, 0xfff2c0);
  return { scene: B.scene, cam: B.cam, update(tl, d, t) {
    const k = ss(.0, .55, tl); B.pose(k); B.M.face(tl > 1.4 ? 'pain' : 'worried'); B.drawClock('3:00');
    B.M.arms[1].rotation.z = 2.15 * ss(.4, .9, tl); B.M.arms[1].rotation.x = -.35 * ss(.4, .9, tl); B.M.head.rotation.z = -.2 * ss(.4, .9, tl);
    const loud = tl > 1.4, e = earAt(B.M); ringsAt(rs, t, e, B.cam, loud ? .3 : .15, loud ? 3 : 1.8);
    look(B.cam, 1.9 - tl * .15, 1.0 + tl * .05, 1.7 - tl * .2, .2, 1.45, -.2); if (loud) shake(B.cam, t, .012);
  } };
});
// 4: "Something was crawling in his ear." - fly into the ear, then the cutaway
shot(10.07, 12.83, () => {
  const B = bedroom(), Cn = canal(), fq = flashQuad(B.cam, 0x000000), fq2 = flashQuad(Cn.cam, 0x000000), IN = .75;
  return { scene: B.scene, cam: B.cam, update(tl, d, t) {
    if (tl < IN) { this.scene = B.scene; this.cam = B.cam; B.pose(1); B.M.face('pain'); B.M.arms[1].rotation.z = .3; B.drawClock('3:00'); const e = earAt(B.M), k = ss(0, IN, tl) ** 2;
      B.cam.position.copy(e).add(V(lerp(1.4, .05, k), lerp(.35, .0, k), lerp(.6, .0, k))); B.cam.lookAt(e); fq.material.opacity = ss(IN - .25, IN, tl); return; }
    this.scene = Cn.scene; this.cam = Cn.cam; const a = tl - IN; fq2.material.opacity = 1 - ss(0, .25, a);
    const x = lerp(-1.2, .6, ss(0, 2.0, a)); Cn.R.position.set(x, floorY(x) + .08, -.2); Cn.R.rotation.y = Math.PI / 2; Cn.R.userData.walk(t * 16);
    look(Cn.cam, lerp(-3.4, x - .6, ss(0, 1.2, a)), .45, lerp(1.4, 2.0, ss(0, 2, a)), x + .2, -.15, -.2);
  } };
}, { dof: tl => tl > .75 ? { b: 1.3, y: .52, r: .34 } : null });
// 5: "A cockroach had crawled in while he was asleep, looking for somewhere dark and warm." - flashback, macro on the pillow
shot(12.83, 18.54, () => {
  const B = bedroom(), R = makeRoach(.075); B.scene.add(R); const P1 = [V(.62, .73, -1.05), V(.45, .73, -1.0), V(.36, .75, -.93), V(.27, .83, -.88), V(.2, .84, -.87)];
  return { scene: B.scene, cam: B.cam, dof: { b: 1.7, y: .5, r: .26 }, update(tl, d, t) {
    B.pose(0); B.M.face('sleep'); B.drawClock('2:14'); const k = ss(.0, 4.2, tl); roachPath(R, P1, k); R.userData.walk(t * 13, k < 1 ? 1 : 0); R.visible = k < .985;
    R.rotation.x = k > .6 ? -.5 : 0; const p = R.position.clone();
    if (tl < 2.6) { B.cam.position.copy(p).add(V(.2, .05, .17)); B.cam.lookAt(p.x, p.y + .02, p.z); }
    else { const e = earAt(B.M); B.cam.position.copy(e).add(V(.42 - (tl - 2.6) * .05, .1, .1)); B.cam.lookAt(lerp(p.x, e.x, .5), e.y - .01, lerp(p.z, e.z, .5)); }
  } };
});
// 6: "Panicking, he grabbed a cotton swab."
shot(18.54, 22.0, () => {
  const B = bedroom(), sw = makeSwab(); B.scene.add(sw); const G = 1.45;
  return { scene: B.scene, cam: B.cam, update(tl, d, t) {
    B.pose(1); B.M.face('scream'); B.drawClock('3:01'); B.M.body.rotation.y = Math.sin(t * 9) * .05;
    const reach = ss(.6, G, tl), back = ss(G + .2, G + 1.2, tl); B.M.arms[1].rotation.z = lerp(0, 1.25, reach) + back * 1.1; B.M.arms[1].rotation.x = lerp(0, -.9, reach) + back * .2;
    if (tl < G) { sw.position.set(.85, .62, -.62); sw.rotation.set(0, .6, 0); } else { const h = handAt(B.M); sw.position.copy(h); sw.rotation.set(-.3, .9, 0); }
    look(B.cam, 2.1 - tl * .2, 1.7, 1.2 - tl * .1, .5, 1.1, -.4);
  } };
});
// 7: "Big mistake." - slow-mo swab toward the ear, then a snap zoom
shot(22.0, 23.36, () => {
  const B = bedroom(), sw = makeSwab(); B.scene.add(sw); const sign = hud(B.cam, makeSign('BIG MISTAKE', '#c8202a', '#ffffff'), .95), fq = flashQuad(B.cam, 0xff1a1a), S = .32;
  return { scene: B.scene, cam: B.cam, dof: { b: 1.6, y: .5, r: .28 }, update(tl, d, t) {
    B.pose(1); B.M.face(tl > S ? 'pain' : 'worried'); B.drawClock('3:01'); const e = earAt(B.M), k = ss(0, S, tl);
    sw.position.copy(e).add(V(lerp(.42, .2, k), 0, 0)); sw.rotation.set(0, Math.PI / 2, 0);
    const z = tl > S ? .42 * punch(tl - S, -.35) : .62 - k * .1; B.cam.position.copy(e).add(V(z * .9, .08, z * .5)); B.cam.lookAt(e.x + .08, e.y, e.z);
    sign.scale.setScalar(pop(tl - S) * .8); fq.material.opacity = tl > S ? .35 * Math.exp(-(tl - S) * 5) : 0; if (tl > S) shake(B.cam, t, .006 * Math.exp(-(tl - S) * 4));
  } };
});
// 8: "That just pushed it deeper, right up against his eardrum."
shot(23.36, 27.71, () => {
  const Cn = canal(), sw = new THREE.Group(); sw.add(box(.18, .18, 3, bmat({ color: 0xf4f4f4 }), 0, 0, 0)); const tip = new THREE.Mesh(new THREE.IcosahedronGeometry(.3, 1), mat({ color: 0xffffff })); tip.scale.set(1, 1, 1.5); tip.position.z = 1.5; sw.add(tip); sw.rotation.y = Math.PI / 2; Cn.scene.add(sw);
  return { scene: Cn.scene, cam: Cn.cam, dof: { b: 1.2, y: .5, r: .36 }, update(tl, d, t) {
    const k = ss(.2, 2.4, tl), sx = lerp(-4.2, .5, k); sw.position.set(sx - 1.5, -.05, -.2);
    const x = Math.min(1.78, Math.max(lerp(.4, 1.78, ss(.3, 2.2, tl)), sx + .55)); Cn.R.position.set(x, floorY(x) + .08 + (x > 1.6 ? (x - 1.6) * .6 : 0), -.2); Cn.R.rotation.set(0, Math.PI / 2, -(x > 1.6 ? .3 : 0)); Cn.R.userData.walk(t * 22);
    const press = ss(2.0, 2.6, tl); Cn.drum.position.x = 2.2 + press * .06 + Math.sin(t * 30) * .01 * press;
    look(Cn.cam, lerp(-.6, 1.2, ss(0, 3.3, tl)), .5, lerp(2.3, 1.5, ss(0, 4, tl)), lerp(-.1, 1.8, ss(0, 3.3, tl)), -.1, -.2);
  } };
});
// 9: "Every time it moved, it sounded like thunder."
shot(27.71, 31.83, () => {
  const Cn = canal(), B = bedroom(), rs = rings(Cn.scene, 4, 0xfff2c0), fq = flashQuad(B.cam), TH = 2.0;
  return { scene: Cn.scene, cam: Cn.cam, update(tl, d, t) {
    if (tl < TH) { this.scene = Cn.scene; this.cam = Cn.cam; Cn.R.position.set(1.8, floorY(1.8) + .2, -.2); Cn.R.rotation.set(0, Math.PI / 2, -.3); Cn.R.userData.walk(t * 26);
      Cn.drum.position.x = 2.22 + Math.abs(Math.sin(t * 24)) * .05; ringsAt(rs, t, V(2.1, 0, -.1), Cn.cam, .9, 2.2); look(Cn.cam, 1.15, .25, 1.25 - tl * .1, 1.95, 0, -.2); shake(Cn.cam, t, .01); return; }
    this.scene = B.scene; this.cam = B.cam; const a = tl - TH; B.pose(1); B.M.face('scream'); B.drawClock('3:02'); B.M.arms[0].rotation.z = -2.6; B.M.arms[1].rotation.z = 2.6; B.M.arms[0].rotation.x = B.M.arms[1].rotation.x = -.3;
    const fl = (a > .05 && a < .2) || (a > .55 && a < .65) || (a > 1.2 && a < 1.3); fq.material.opacity = fl ? .85 : 0; look(B.cam, .9, 1.45, 1.6 - a * .3, 0, 1.6, -.2); shake(B.cam, t, .04 * Math.exp(-a * 1.5));
  } };
}, { dof: tl => tl < 2.0 ? { b: 1.3, y: .5, r: .34 } : null });
// 10: "So he tried to rinse it out with water."
shot(31.83, 34.71, () => {
  const Bt = bathroom(), cup = new THREE.Mesh(new THREE.CylinderGeometry(.07, .06, .16, 8), mat({ color: 0x8ac8ff, transparent: true, opacity: .8 })); Bt.scene.add(cup); const ds = drops(Bt.scene, 14, 0x6ac0ff, .02);
  return { scene: Bt.scene, cam: Bt.cam, update(tl, d, t) {
    const M = Bt.M; M.reset(); M.root.position.set(0, 0, .1); M.face('pain'); M.body.rotation.z = .35; M.head.rotation.z = .25; M.arms[1].rotation.z = 2.9; M.arms[1].rotation.x = -.2;
    const e = earAt(M); cup.position.copy(e).add(V(.05, .3, .05)); cup.rotation.z = 1.9; dropsAt(ds, t, e.clone().add(V(-.02, .25, .05)), e.clone().add(V(-.1, -.1, .08)), 3);
    look(Bt.cam, 1.3 - tl * .1, 2.0, 1.6 - tl * .15, e.x - .15, e.y - .05, e.z);
  } };
}, { dof: { b: 1.2, y: .42, r: .34 } });
// 11: "But that only made it panic."
shot(34.71, 37.07, () => {
  const Cn = canal(); Cn.fluid.visible = true; const bub = drops(Cn.scene, 10, 0xbfe6ff, .05);
  return { scene: Cn.scene, cam: Cn.cam, update(tl, d, t) {
    Cn.fluid.position.y = -.5 + ss(0, 1.2, tl) * .25; const j = Math.sin(t * 40) * .04; Cn.R.position.set(1.6 + j, floorY(1.6) + .12 + Math.abs(Math.sin(t * 13)) * .05, -.2); Cn.R.rotation.set(Math.sin(t * 17) * .3, Math.PI / 2 + Math.sin(t * 11) * .5, Math.sin(t * 23) * .3); Cn.R.userData.walk(t * 40, 1.6);
    dropsAt(bub, t, V(-.5, -.45, -.15), V(1.4, .4, -.15), 1.2, .3); look(Cn.cam, .9, .4, 1.5 - tl * .15, 1.55, -.1, -.2); shake(Cn.cam, t, .008);
  } };
}, { dof: { b: 1.2, y: .5, r: .34 } });
// 12: "Then he remembered one trick."
shot(37.07, 39.56, () => {
  const Bt = bathroom(), bulb = makeBulb(Bt.scene), L = 1.2;
  return { scene: Bt.scene, cam: Bt.cam, update(tl, d, t) {
    const M = Bt.M; M.reset(); M.root.position.set(0, 0, .1); M.face(tl > L ? 'happy' : 'confused'); M.arms[1].rotation.x = -2.0; M.arms[1].rotation.z = -.6; M.head.rotation.z = tl > L ? 0 : .12;
    bulb.position.set(0, 2.55 + Math.sin(t * 3) * .03, .1); bulb.scale.setScalar(pop(tl - L) * 1.0); look(Bt.cam, .25, 2.0, 2.0 * punch(tl - L > 0 ? tl - L : 9, .12) - tl * .12, 0, 2.05, 0);
  } };
});
// 13: "He tilted his head and poured in a few drops of baby oil."
shot(39.56, 44.87, () => {
  const Bt = bathroom(), bot = makeBottle(); Bt.scene.add(bot); const ds = drops(Bt.scene, 4, 0xf4c040, .018), P = 2.0;
  return { scene: Bt.scene, cam: Bt.cam, dof: { b: 1.5, y: .45, r: .3 }, update(tl, d, t) {
    const M = Bt.M; M.reset(); M.root.position.set(0, 0, .1); M.face(tl > P ? 'neutral' : 'worried'); M.head.rotation.z = .85 * ss(0, .6, tl); M.body.rotation.z = .22 * ss(0, .6, tl); M.arms[1].rotation.z = 2.6; M.arms[1].rotation.x = -.4;
    const e = earAt(M), tipP = e.clone().add(V(.02, .38, .02)); bot.position.copy(tipP).add(V(.03, .12, 0)); bot.rotation.z = 2.5;
    const a = tl - P; ds.forEach(dr => { const q = ((a * .55 + dr.userData / 4) % 1); dr.visible = a > 0; dr.position.copy(tipP).lerp(e, q * q); dr.scale.set(1, 1.3 + q, 1); });
    if (tl < P) look(Bt.cam, .9, 2.0, 1.4 - tl * .12, 0, 1.75, 0); else { const z = .7 - a * .08; Bt.cam.position.copy(e).add(V(z * .55, .2, z * .8)); Bt.cam.lookAt(e.x, e.y + .15, e.z); }
  } };
});
// 14: "The cockroach stopped moving."
shot(44.87, 47.88, () => {
  const Cn = canal(); Cn.fluid.visible = true; Cn.fluid.material.color.setHex(0xf4c040); Cn.fluid.material.opacity = .55;
  return { scene: Cn.scene, cam: Cn.cam, dof: { b: 1.4, y: .5, r: .3 }, update(tl, d, t) {
    Cn.fluid.position.y = -.48 + ss(0, 2.0, tl) * .55; const s = 1 - ss(.2, 1.4, tl); Cn.R.position.set(1.55, floorY(1.55) + .1, -.2); Cn.R.rotation.set(0, Math.PI / 2, s * Math.sin(t * 9) * .1); Cn.R.userData.walk(t * (8 + 20 * s), s);
    Cn.key.intensity = 10 - ss(1, 3, tl) * 4; look(Cn.cam, 1.0, .3, 1.35 - tl * .12, 1.55, -.25, -.2);
  } };
});
// 15: "And at the hospital, a doctor pulled it out in one piece."
shot(47.88, 53.05, () => {
  const Hs = hospital(), PULL = 2.4, UP = 3.4;
  return { scene: Hs.scene, cam: Hs.cam, update(tl, d, t) {
    const M = Hs.M, D = Hs.D; M.reset(); M.root.position.set(0, .5 - .84 + .02, .05); M.legs[0].rotation.x = M.legs[1].rotation.x = -1.5; M.head.rotation.z = .3 * (1 - ss(UP, UP + .5, tl)); M.face(tl > UP ? 'happy' : 'worried'); M.arms[0].rotation.x = M.arms[1].rotation.x = -.5;
    D.reset(); D.root.position.set(.9, 0, .15); D.root.rotation.y = -Math.PI / 2; D.face(tl > UP ? 'happy' : 'neutral'); D.body.rotation.x = .12;
    const e = earAt(M), out = ss(PULL - .6, PULL, tl), up = ss(UP - .4, UP, tl); D.arms[1].rotation.x = -1.4 - up * .9; D.arms[0].rotation.x = -1.2 * (1 - up);
    const tip = e.clone().add(V(.02 + out * .15, up * .3, out * .3 + up * .25)); Hs.tw.position.copy(tip).add(V(.15, 0, 0)); Hs.tw.rotation.set(0, -Math.PI / 2, up * .6);
    Hs.R.position.copy(tip); Hs.R.rotation.set(Math.PI / 2 * up, Math.PI / 2, 0); Hs.R.visible = tl > PULL - .6; Hs.R.userData.walk(0, 0);
    if (tl < UP) look(Hs.cam, .3 - tl * .05, 1.75, 3.0 - tl * .2, .4, 1.4, 0); else { const z = .6 - (tl - UP) * .05; Hs.cam.position.copy(tip).add(V(-.12, .06, z)); Hs.cam.lookAt(tip); }
  } };
}, { dof: tl => tl > 3.4 ? { b: 1.6, y: .45, r: .3 } : null });
// 16 / loop: "And it all started when" - back in the bedroom, the open chips bag on the nightstand
shot(53.05, DUR + .1, () => {
  const B = bedroom(), R = makeRoach(.075); B.scene.add(R);
  return { scene: B.scene, cam: B.cam, dof: { b: 1.6, y: .5, r: .3 }, update(tl, d, t) {
    B.pose(0); B.M.face('sleep'); B.drawClock('2:13'); roachPath(R, [V(1.2, .61, -.62), V(1.1, .61, -.7), V(1.02, .61, -.78)], ss(0, 2, tl)); R.userData.walk(t * 12);
    const k = ss(0, 2.4, tl); look(B.cam, lerp(1.55, 1.9, k), lerp(.78, 1.3, k), lerp(-.2, .6, k), lerp(1.08, .7, k), lerp(.66, .75, k), lerp(-.75, -.7, k));
  } };
});
// every camera must be in its scene so HUD signs attached to it render
shots.forEach(S => { if (!S.cam.parent) S.scene.add(S.cam); });
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
  if (s.dof) dofDraw(typeof s.dof === "function" ? s.dof(tl) : s.dof); else lg.drawImage(renderer.domElement, 0, 0); const id = lg.getImageData(0, 0, W, H), d = id.data;
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
