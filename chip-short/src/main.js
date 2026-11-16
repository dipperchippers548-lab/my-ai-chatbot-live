// "What The One Chip Challenge Does To Your Body" - PS1-style low-poly short (Zack-style), rendered frame by frame.
// (engine section shared with ../invisible-short)
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 53.80;
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
// ---------- stitches short: props ----------
const SKIN = 0xe2a57f;
const palmT = ctex(32, 32, g => { g.fillStyle = '#e8ae88'; g.fillRect(0, 0, 32, 32); g.strokeStyle = 'rgba(150,80,60,.55)'; g.lineWidth = 1; for (const [a, b, c, d] of [[2, 10, 30, 6], [4, 17, 28, 14], [6, 30, 14, 4]]) { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(16, (b + d) / 2 + 3, c, d); g.stroke(); } noise(g, 32, 32, 10, 13); });
// a big close-up hand lying palm up: fingers toward -z, wrist toward +z, palm surface at y = .3
function makeHand(col = SKIN) {
  const g = new THREE.Group(), m = mat({ color: col }), top = mat({ map: palmT });
  g.add(box(1.1, .3, 1.2, [m, m, top, m, m, m], 0, .15, 0)); g.add(box(.95, .28, 1.8, m, 0, .14, 1.45));
  for (let i = 0; i < 4; i++) { const len = i === 0 ? .58 : i === 3 ? .62 : .74, f = new THREE.Group(); f.position.set(-.39 + i * .26, .16, -.6); f.add(box(.22, .22, len, m, 0, 0, -len / 2)); f.add(box(.23, .02, .02, mat({ color: shadeHex(col, .8) }), 0, .11, -len * .45)); f.rotation.x = .12; g.add(f); }
  const th = box(.28, .25, .62, m, .72, .14, -.05); th.rotation.y = -.55; g.add(th);
  const cut = new THREE.Group(); cut.position.set(-.02, .302, .05); cut.rotation.y = .12; g.add(cut);
  const slit = box(.78, .006, .05, bmat({ color: 0x5a0a10 }), 0, 0, 0); cut.add(slit); const lips = [-1, 1].map(s => { const l = box(.8, .01, .03, mat({ color: 0xd85a5a }), 0, .002, s * .035); cut.add(l); return l; });
  const scar = box(.8, .012, .045, mat({ color: 0xf2c4b4 }), 0, .006, 0); scar.visible = false; cut.add(scar);
  const stitches = [...Array(5)].map((_, i) => { const s = new THREE.Group(); s.position.x = -.3 + i * .15; s.add(box(.014, .014, .2, mat({ color: 0x1a2a6a }), 0, .012, 0)); s.add(box(.04, .03, .04, mat({ color: 0x1a2a6a }), .0, .022, -.1)); for (const k of [-1, 1]) { const tl = box(.008, .008, .07, mat({ color: 0x1a2a6a }), k * .025, .03, -.12); tl.rotation.y = k * .6; s.add(tl); } s.visible = false; cut.add(s); return s; });
  g.userData = { cut, slit, lips, scar, stitches, gap(k) { slit.scale.z = Math.max(.05, k); lips.forEach((l, i) => l.position.z = (i ? 1 : -1) * (.01 + .025 * k)); slit.visible = k > .02; } };
  return g;
}
// a gloved (or bare) hand + sleeve coming into frame, holding a tool. Tool tip at the group origin, pointing -y
function makeGlove(col = 0x5a9ae8, sleeve = 0x8ab8d8) {
  const g = new THREE.Group(), m = mat({ color: col }), arm = new THREE.Group(); g.add(arm);
  arm.add(box(.34, .14, .4, m, 0, .5, .22)); for (let i = 0; i < 3; i++) arm.add(box(.08, .08, .3, m, -.1 + i * .1, .46, -.08)); arm.add(box(.09, .09, .26, m, .2, .48, .1)); arm.add(box(.36, .36, 1.8, mat({ color: sleeve }), 0, .55, 1.3));
  return g;
}
const steel = () => mat({ color: 0xd0d6e0 });
function makeTool(kind) {
  const t = new THREE.Group(), s = steel();
  if (kind === 'holder') { for (const k of [-1, 1]) { const b = box(.025, .025, .7, s, k * .015, .3, .3); b.rotation.x = -.85; t.add(b); } const n = new THREE.Mesh(new THREE.TorusGeometry(.07, .008, 3, 10, Math.PI * 1.1), s); n.rotation.y = Math.PI / 2; t.add(n); }
  if (kind === 'scissors') { for (const k of [-1, 1]) { const b = box(.03, .02, .5, s, 0, .25, .2); b.rotation.set(-.9, k * .15, 0); t.add(b); const r = new THREE.Mesh(new THREE.TorusGeometry(.06, .012, 3, 8), s); r.position.set(k * .09, .55, .45); t.add(r); } }
  if (kind === 'forceps') { for (const k of [-1, 1]) { const b = box(.02, .02, .6, s, k * .02, .25, .2); b.rotation.set(-.9, k * .04, 0); t.add(b); } }
  if (kind === 'syringe') { const tube = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .4, 8), bmat({ color: 0xcfeaff, transparent: true, opacity: .8 })); tube.position.y = .32; t.add(tube); const liq = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .25, 8), bmat({ color: 0x8ad8ff })); liq.position.y = .26; t.add(liq); const nd = box(.008, .14, .008, s, 0, .06, 0); t.add(nd); t.add(box(.14, .02, .14, mat({ color: 0xe0e0e0 }), 0, .6, 0)); }
  if (kind === 'knife') { const bl = box(.05, .12, .9, s, 0, .06, -.45); t.add(bl); t.add(box(.07, .12, .45, mat({ color: 0x1a1a1e }), 0, .06, .22)); }
  return t;
}
const drapeT = ctex(32, 32, g => { g.fillStyle = '#2a8a9a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#237a88'; for (let i = 0; i < 32; i += 4) g.fillRect(0, i, 32, 1); noise(g, 32, 32, 10, 21); }, [6, 6]);
const counterT = ctex(32, 32, g => { g.fillStyle = '#d8b07a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#c49a64'; for (let i = 0; i < 32; i += 3) g.fillRect(0, i, 32, 1); noise(g, 32, 32, 12, 22); }, [3, 3]);
const tileK = ctex(32, 32, g => { g.fillStyle = '#eef2f0'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#b8c4c0'; for (let i = 0; i < 32; i += 8) { g.fillRect(i, 0, 1, 32); g.fillRect(0, i, 32, 1); } }, [8, 4]);
// the hand on a surface: 'er' = surgical drape under a bright lamp, 'kitchen' = cutting board with an avocado
function handSet(kind = 'er') {
  const scene = new THREE.Scene(), cam = newCam(48); scene.add(cam); const H = makeHand(); scene.add(H);
  if (kind === 'er') {
    scene.background = new THREE.Color(0x0a1820); scene.fog = new THREE.Fog(0x0a1820, 4, 9); scene.add(new THREE.AmbientLight(0xd8eeff, 1.5)); const lamp = new THREE.PointLight(0xffffff, 30, 7); lamp.position.set(.3, 3, .6); scene.add(lamp);
    const dr = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat({ map: drapeT })); dr.rotation.x = -Math.PI / 2; scene.add(dr);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(.7, 16), bmat({ color: 0xfffbe8 })); disc.position.set(.6, 4.2, -1.4); disc.lookAt(0, 0, 0); scene.add(disc);
    scene.add(box(.9, .05, .5, steel(), 1.9, .03, -.4)); for (let i = 0; i < 4; i++) scene.add(box(.04, .03, .4, steel(), 1.65 + i * .15, .07, -.4));
  } else {
    scene.background = new THREE.Color(0xcfe0e8); scene.add(new THREE.AmbientLight(0xffffff, 1.7)); const sun = new THREE.DirectionalLight(0xfff2d8, 2.2); sun.position.set(2, 4, 3); scene.add(sun);
    const ct = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat({ color: 0x4a5058 })); ct.rotation.x = -Math.PI / 2; ct.position.y = -.02; scene.add(ct);
    scene.add(box(3.2, .12, 2.6, mat({ map: counterT }), 0, -.06, 0)); scene.add(box(10, 5, .2, mat({ map: tileK }), 0, 2.5, -3));
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), bmat({ color: 0xbfe6ff })); win.position.set(-1.5, 2.2, -2.88); scene.add(win);
    for (const [x, z, c] of [[1.9, -1.4, 0xd8262a], [2.3, -1.0, 0xffe21f]]) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(.25, 0), mat({ color: c })); f.position.set(x, .25, z); scene.add(f); }
  }
  return { scene, cam, H };
}
function makeAvocado() { const g = new THREE.Group(); const sk = new THREE.Mesh(new THREE.SphereGeometry(.42, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat({ color: 0x2a4a1a, side: THREE.DoubleSide })); sk.scale.set(1, .7, 1.35); sk.rotation.x = Math.PI; g.add(sk); const fl = new THREE.Mesh(new THREE.CircleGeometry(.4, 12), mat({ color: 0xd8e07a })); fl.rotation.x = -Math.PI / 2; fl.scale.set(1, 1.3, 1); fl.position.y = .005; g.add(fl); const pit = new THREE.Mesh(new THREE.SphereGeometry(.17, 8, 6), mat({ color: 0x7a4a24 })); pit.position.y = .02; pit.scale.y = .8; g.add(pit); return g; }
// skin layers cut open: epidermis, dermis (with vessels), fat, muscle. Two halves with a gap between them; skin surface at y = 0
const layersT = ctex(32, 64, g => {
  const L = [[0, 3, '#e8b48e'], [3, 4, '#c8846a'], [4, 24, '#ec9a96'], [24, 50, '#f4d47e'], [50, 64, '#a8343a']]; L.forEach(([a, b, c]) => { g.fillStyle = c; g.fillRect(0, a, 32, b - a); });
  const r = rng(9); g.strokeStyle = '#c84a52'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(r() * 32, 6 + r() * 16); g.bezierCurveTo(r() * 32, 8 + r() * 14, r() * 32, 8 + r() * 14, r() * 32, 6 + r() * 16); g.stroke(); }
  g.strokeStyle = 'rgba(200,150,60,.6)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(r() * 32, 27 + r() * 21, 2 + r() * 2.5, 0, 7); g.stroke(); }
  g.fillStyle = 'rgba(80,10,20,.35)'; for (let y = 51; y < 64; y += 3) g.fillRect(0, y, 32, 1); g.fillStyle = '#5a3020'; g.fillRect(9, 0, 1, 12); g.fillRect(22, 0, 1, 10);
  noise(g, 32, 64, 12, 10);
});
const skinTopT = ctex(32, 32, g => { g.fillStyle = '#e8b08a'; g.fillRect(0, 0, 32, 32); const r = rng(4); g.fillStyle = 'rgba(150,80,60,.35)'; for (let i = 0; i < 40; i++) g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 1); g.fillStyle = '#4a2a18'; for (let i = 0; i < 6; i++) g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 3); });
function section() {
  const scene = new THREE.Scene(), cam = newCam(50); scene.background = new THREE.Color(0x0b0f1a); scene.add(cam);
  scene.add(new THREE.AmbientLight(0xffffff, 1.7)); const key = new THREE.DirectionalLight(0xfff0e0, 1.6); key.position.set(2, 3, 4); scene.add(key); const rim = new THREE.PointLight(0x6a8aff, 8, 8); rim.position.set(-2.5, 1.5, -1); scene.add(rim);
  const lay = mat({ map: layersT }), topM = mat({ map: skinTopT }), back = mat({ color: 0x8a3a3a }), halves = [-1, 1].map(s => { const b = box(1.9, 2.2, 1.6, [lay, lay, topM, back, lay, back], 0, -1.1, 0); scene.add(b); return b; });
  const glow = new THREE.Mesh(new THREE.CircleGeometry(3.2, 20), bmat({ color: 0x18203a })); glow.position.set(0, -.8, -2.5); scene.add(glow);
  const ZF = .82;   // the cut face we look at
  const S = { scene, cam, halves, ZF, g: .4,
    gap(g) { S.g = g; halves[0].position.x = -(g / 2 + .95); halves[1].position.x = g / 2 + .95; } };
  S.gap(.4); return S;
}
// an arc of thread/needle on the cut face: circle centre (cx, cy), radius r, from angle a0 to a1 (radians, CCW)
function arcMesh(scene, r, tube, col) { const m = new THREE.Mesh(new THREE.BufferGeometry(), mat({ color: col })); m.userData = { r, tube, key: '' }; scene.add(m); return m; }
function setArc(m, cx, cy, z, a0, a1) { const len = Math.max(.001, a1 - a0), k = len.toFixed(3); if (m.userData.key !== k) { m.geometry.dispose(); m.geometry = new THREE.TorusGeometry(m.userData.r, m.userData.tube, 4, 28, len); m.userData.key = k; } m.position.set(cx, cy, z); m.rotation.set(0, 0, a0); m.visible = a1 - a0 > .01; }
const ease = (a, b, x) => ss(a, b, x);
const bob = (cam, t, a = .02) => { cam.position.x += Math.sin(t * .9) * a; cam.position.y += Math.sin(t * 1.3) * a * .6; };

function camKeys(cam, keys, t) {   // smooth moves between camera keys [time, [pos], [target]]
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [a, pa, ta] = keys[i], [b, pb, tb] = keys[i + 1], k = ss(a, b, t), P = pa.map((v, j) => lerp(v, pb[j], k)), T = ta.map((v, j) => lerp(v, tb[j], k));
  cam.position.set(...P); cam.lookAt(...T);
}
const WHIPS = [2.4, 5.95, 8.4, 14.6, 21.35, 25.2, 27.7, 31.6, 37.0, 40.7, 42.9, 44.9, 47.2];
const whipAmt = t => Math.max(0, ...WHIPS.map(w => 1 - Math.abs(t - w) / .2));
function blurPass(b) { lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H); lg.filter = `blur(${b}px)`; lg.drawImage(renderer.domElement, -4, -4, W + 8, H + 8); lg.filter = 'none'; }
const dofW = (o, t0) => tl => { const w = whipAmt(t0 + tl); return w > .05 ? { full: 3.5 * w } : o; };
const _dofDraw = dofDraw; dofDraw = o => o && o.full ? blurPass(o.full) : _dofDraw(o);
function longHair(h, c) { const m = mat({ color: c }); h.head.add(box(.52, .62, .14, m, 0, .2, -.22)); for (const s of [-1, 1]) h.head.add(box(.08, .58, .36, m, s * .245, .22, -.04)); h.head.add(box(.5, .1, .5, m, 0, .56, -.01)); return h; }
function drops(scene, n, col, sz = .025) { return [...Array(n)].map((_, i) => { const d = new THREE.Mesh(new THREE.IcosahedronGeometry(sz, 0), bmat({ color: col })); d.scale.y = 1.6; d.userData = i; scene.add(d); return d; }); }

// ---------- chip short: props ----------
const SHOT = WHIPS; const B_ = [0, ...WHIPS, DUR + .1];
function makeChipBox() { const g = new THREE.Group(), blk = mat({ color: 0x141418 }); const b = box(.7, .12, 1.0, blk); g.add(b); const lid = new THREE.Group(); lid.position.set(0, .06, -.5); lid.add(box(.7, .04, 1.0, mat({ color: 0x1c1c22 }), 0, 0, .5)); lid.add(box(.5, .01, .2, bmat({ color: 0xc8202a }), 0, .022, .5)); g.add(lid); g.userData = { lid }; return g; }
function makeChip() { const s = new THREE.Shape(); s.moveTo(0, .2); s.lineTo(.17, -.1); s.lineTo(-.17, -.1); s.closePath(); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .02, bevelEnabled: false }), mat({ color: 0x1a1214 })); const r = rng(8); const dots = [...Array(6)].map(() => box(.02, .02, .022, bmat({ color: 0xc8202a }), (r() - .5) * .18, (r() - .3) * .15, .012)); dots.forEach(d => m.add(d)); return m; }
const roomWall = ctex(32, 32, g => { g.fillStyle = '#d8cbb4'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#cbbda4'; for (let x = 0; x < 32; x += 8) g.fillRect(x, 0, 2, 32); noise(g, 32, 32, 8, 3); }, [6, 2]);
// the man at a kitchen table; table top at y = .95, face at about (0, 1.9, .22)
function diner() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.background = new THREE.Color(0xd8cbb4); scene.add(cam); lights(scene, 1.9, 1.6);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat({ color: 0x8a6a4a })); fl.rotation.x = -Math.PI / 2; scene.add(fl); scene.add(box(12, 5, .2, mat({ map: roomWall }), 0, 2.5, -2.2));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), bmat({ color: 0xbfe6ff })); win.position.set(-1.6, 2.4, -2.09); scene.add(win); scene.add(box(1.8, .08, .1, mat({ color: 0xf2f2f2 }), -1.6, 1.66, -2.05));
  scene.add(box(2.4, .08, 1.3, mat({ map: counterT }), 0, .95, .6)); for (const [x, z] of [[-1.1, .05], [1.1, .05], [-1.1, 1.15], [1.1, 1.15]]) scene.add(box(.08, .95, .08, mat({ color: 0x6a4428 }), x, .47, z));
  const M = makeHuman(MAN); scene.add(M.root); M.root.position.set(0, 0, -.2); const bx = makeChipBox(); bx.position.set(.45, 1.05, .55); bx.rotation.y = -.3; scene.add(bx); const chip = makeChip(); scene.add(chip);
  return { scene, cam, M, bx, chip };
}
const mouthAt = h => { h.root.updateMatrixWorld(true); return h.head.localToWorld(V(0, .1, .25)); };
const faceAt = h => { h.root.updateMatrixWorld(true); return h.head.localToWorld(V(0, .26, .22)); };
function flames(scene, n = 14) { const r = rng(n); return [...Array(n)].map((_, i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(.06, .22, 5), bmat({ color: [0xff3a1a, 0xff8a1f, 0xffd21f][i % 3], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); f.userData = { a: r(), x: (r() - .5), sp: .8 + r() * .6 }; scene.add(f); return f; }); }
const flamesAt = (fs, t, p, a = 1, spread = .25, rise = .6) => fs.forEach(f => { const u = f.userData, q = (t * 1.6 * u.sp + u.a) % 1; f.visible = a > .02; f.position.set(p.x + u.x * spread * (1 + q), p.y + q * rise, p.z + .05 + q * .1); f.scale.setScalar(a * (1 - q) * 1.6); f.material.opacity = .9 * (1 - q); });
function makePepper(kind) {
  const g = new THREE.Group();
  if (kind === 'reaper') { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.5, 1), mat({ color: 0xc81a1a })); const p = b.geometry.attributes.position, r = rng(4); for (let i = 0; i < p.count; i++) { const k = 1 + (r() - .5) * .22; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 1.1, p.getZ(i) * k); } b.geometry.computeVertexNormals(); g.add(b); const tail = new THREE.Mesh(new THREE.ConeGeometry(.12, .45, 5), mat({ color: 0xb81414 })); tail.position.set(.1, -.65, 0); tail.rotation.z = .5; g.add(tail); }
  else { const b = new THREE.Mesh(new THREE.ConeGeometry(.32, 1.4, 7), mat({ color: 0xe8401a })); b.rotation.z = Math.PI; const p = b.geometry.attributes.position, r = rng(9); for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 + (r() - .5) * .3)); b.geometry.computeVertexNormals(); g.add(b); }
  const st = new THREE.Mesh(new THREE.CylinderGeometry(.05, .08, .3, 5), mat({ color: 0x3a8a2a })); st.position.y = kind === 'reaper' ? .6 : .78; g.add(st); const cap = new THREE.Mesh(new THREE.ConeGeometry(.2, .12, 6), mat({ color: 0x3a8a2a })); cap.position.y = kind === 'reaper' ? .5 : .68; g.add(cap); return g;
}
function makeMolecule(s = 1, col = 0xff4a1a) { const g = new THREE.Group(), m = mat({ color: col }), w = mat({ color: 0xf2f2f2 }); const pts = [[0, 0, 0], [.3, .15, 0], [.6, 0, .05], [.9, .15, 0], [-.3, .15, 0], [-.55, -.05, .1], [.3, .45, 0]]; pts.forEach(([x, y, z], i) => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(i % 3 === 2 ? .08 : .11, 0), i % 3 === 2 ? w : m); b.position.set(x, y, z); g.add(b); if (i) { const [px, py, pz] = pts[i === 6 ? 1 : i === 4 ? 0 : i - 1], dx = x - px, dy = y - py, len = Math.hypot(dx, dy); const st = box(.03, len, .03, mat({ color: 0x888888 }), (x + px) / 2, (y + py) / 2, (z + pz) / 2); st.rotation.z = -Math.atan2(dx, dy); g.add(st); } }); g.scale.setScalar(s); return g; }
const tongueT = ctex(32, 32, g => { g.fillStyle = '#e8828a'; g.fillRect(0, 0, 32, 32); const r = rng(3); for (let i = 0; i < 90; i++) { g.fillStyle = r() < .5 ? '#f09aa2' : '#d8727a'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 1); } }, [3, 3]);
// tongue surface macro: bumpy pink, with heat sensors (little cups) that can glow; a nerve runs down from each
function tongue() {
  const scene = new THREE.Scene(), cam = newCam(50); scene.background = new THREE.Color(0x2a0a12); scene.fog = new THREE.Fog(0x2a0a12, 4, 10); scene.add(cam); scene.add(new THREE.AmbientLight(0xffe0e0, 1.6)); const key = new THREE.PointLight(0xfff0e0, 14, 8); key.position.set(1, 3, 2); scene.add(key);
  const tm_ = mat({ map: tongueT }); scene.add(box(8, 1, 6, tm_, 0, -.5, 0)); const r = rng(6);
  for (let i = 0; i < 70; i++) { const b = new THREE.Mesh(new THREE.ConeGeometry(.06 + r() * .04, .12 + r() * .1, 5), mat({ color: r() < .5 ? 0xf09aa2 : 0xe07880 })); b.position.set((r() - .5) * 6, .06, (r() - .5) * 4); scene.add(b); }
  const sens = [...Array(6)].map((_, i) => { const g = new THREE.Group(); const cup = new THREE.Mesh(new THREE.CylinderGeometry(.2, .12, .14, 10, 1, true), mat({ color: 0xb04a6a, side: THREE.DoubleSide })); g.add(cup); const core = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .02, 10), bmat({ color: 0x5a8aff })); core.position.y = -.03; g.add(core); g.position.set(-1.25 + (i % 3) * 1.25, .06, -.5 + Math.floor(i / 3) * 1.1); g.userData = { core }; scene.add(g); return g; });
  const glowS = (k, col = 0xff2a1a) => sens.forEach(s => s.userData.core.material.color.setHex(k > .5 ? col : 0x5a8aff));
  return { scene, cam, sens, glowS };
}
function makeBrain() { const g = new THREE.Group(), m = mat({ color: 0xe89aa8 }), r = rng(11); for (let i = 0; i < 26; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.32 + r() * .12, 0), m); const a = r() * Math.PI * 2, e = r() * 1.2 - .3; b.position.set(Math.cos(a) * .7 * Math.cos(e), .3 + Math.sin(e) * .45, Math.sin(a) * .55 * Math.cos(e)); g.add(b); } g.add(box(.02, .6, 1.3, mat({ color: 0xa85a6a }), 0, .65, 0)); const stem = new THREE.Mesh(new THREE.CylinderGeometry(.12, .08, .6, 6), m); stem.position.set(0, -.3, -.1); g.add(stem); g.userData = { m }; return g; }
function makeHeart() { const g = new THREE.Group(), m = mat({ color: 0xc81a2a }); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.42, 1), m); b.position.set(s * .25, .15, 0); g.add(b); } const c = new THREE.Mesh(new THREE.ConeGeometry(.6, .9, 8), m); c.rotation.z = Math.PI; c.position.y = -.35; g.add(c); for (const [x, h] of [[-.15, .5], [.15, .4]]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(.09, .1, h, 6), mat({ color: 0x3a5ad8 })); a.position.set(x, .6, -.05); g.add(a); } const ao = new THREE.Mesh(new THREE.TorusGeometry(.18, .08, 4, 8, Math.PI), m); ao.position.set(.05, .6, 0); g.add(ao); return g; }
function makeStomach() { const g = new THREE.Group(), m = mat({ color: 0xe8828a }); const b = new THREE.Mesh(new THREE.SphereGeometry(.8, 12, 8), m); b.scale.set(1.3, .9, .8); g.add(b); const es = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 2.4, 8), m); es.position.set(-.5, 1.7, 0); es.rotation.z = .15; g.add(es); const out = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .8, 8), m); out.position.set(1.05, -.5, 0); out.rotation.z = -.9; g.add(out); g.userData = { b, m }; return g; }
function darkStage(col = 0x0b0f1a) { const scene = new THREE.Scene(), cam = newCam(50); scene.background = new THREE.Color(col); scene.add(cam); scene.add(new THREE.AmbientLight(0xffffff, 1.6)); const k = new THREE.DirectionalLight(0xfff0e0, 1.6); k.position.set(2, 3, 4); scene.add(k); const rim = new THREE.PointLight(0x6a8aff, 8, 8); rim.position.set(-2.5, 1.5, -1); scene.add(rim); return { scene, cam }; }
const fall = (ds, t, p, rate = 1.5, len = .5, spread = .02) => ds.forEach(d => { const q = (t * rate + d.userData / ds.length) % 1; d.position.set(p.x + Math.sin(d.userData * 5) * spread, p.y - q * len, p.z + .02); });

// ---------- chip short: shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra, dof: dofW(extra.dof || null, t0) });
// 1: "He eats one tiny chip."
shot(0, 2.4, () => {
  const D = diner(); const BITE = 1.84;
  return { scene: D.scene, cam: D.cam, update(tl, d, t) {
    const M = D.M; M.reset(); M.face(tl > BITE ? 'shocked' : 'sly'); D.bx.userData.lid.rotation.x = -1.2; const k = ss(.1, BITE - .1, tl); M.arms[1].rotation.x = lerp(-.6, -2.0, k); M.arms[1].rotation.z = -.35 * k;
    const h = handAt(M), m = mouthAt(M); D.chip.position.copy(h).lerp(m, ss(BITE - .3, BITE, tl) * .9); D.chip.rotation.set(-.4, 0, .2); D.chip.visible = tl < BITE + .05; D.chip.scale.setScalar(.8);
    const f = faceAt(M); look(D.cam, f.x - 1.15 + tl * .1, f.y - .05, f.z + lerp(1.3, 1.0, ss(0, 2.3, tl)), f.x, f.y - .25, f.z);
  } };
}, { dof: { b: 1.4, y: .45, r: .34 } });
// 2: "And within seconds, his mouth is on fire."
shot(2.4, 5.95, () => {
  const D = diner(), fl = flames(D.scene, 16), sp = sparkles(D.scene, 0);
  return { scene: D.scene, cam: D.cam, update(tl, d, t) {
    const M = D.M; M.reset(); const heat = ss(.8, 2.0, tl); M.face(heat > .5 ? 'scream' : 'worried'); M.tint(0xff2a1a, heat * .45); M.body.position.y = heat * Math.abs(Math.sin(t * 18)) * .02;
    flamesAt(fl, t, mouthAt(M), ss(1.9, 2.3, tl), .2, .5); const f = faceAt(M); look(D.cam, f.x + .2, f.y - .1, f.z + lerp(1.2, .75, ss(0, 3.5, tl)), f.x, f.y - .12, f.z); if (heat > .9) shake(D.cam, t, .006);
  } };
}, { dof: { b: 1.4, y: .45, r: .32 } });
// 3: "But nothing is actually burning." - inside the mouth: the fire fades, the tongue is fine
shot(5.95, 8.4, () => {
  const T = tongue(), fl = flames(T.scene, 30);
  return { scene: T.scene, cam: T.cam, update(tl, d, t) {
    const a = 1 - ss(.6, 1.4, tl); T.glowS(1); fl.forEach((f, i) => { const u = f.userData, q = (t * 1.4 * u.sp + u.a) % 1; f.visible = a > .02; f.position.set(u.x * 5, .1 + q * 1.2, -1.5 + (i % 5) * .8); f.scale.setScalar(a * (1 - q) * 4); });
    look(T.cam, .3, 1.8 - tl * .2, 3.2 - tl * .3, 0, 0, 0);
  } };
}, { dof: { b: 1.2, y: .5, r: .38 } });
// 4: "The chip is coated in Carolina Reaper and Naga Viper peppers, packed with a chemical called capsaicin."
shot(8.4, 14.6, () => {
  const scene = new THREE.Scene(), cam = newCam(50); lights(scene, 2.0, 1.9); const u = burst(scene, cam, 0x3a0a0a, 0x5a1010, 0xff8a3a), rp = makePepper('reaper'), nv = makePepper('naga'), mol = makeMolecule(1.1); scene.add(rp, nv, mol);
  const D = dynSign(cam, 1.25), sp = sparkles(scene, 10, 0xffd04a, .06);
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.2; const R = 1.07, N = 2.44, C = 5.15, mk = ss(C - .3, C + .2, tl);
    rp.position.set(lerp(-.65, -1.6, mk), 1.9 + Math.sin(t * 2) * .06, 0); rp.rotation.y = t * .9; rp.scale.setScalar(pop(tl - R) * (1 - mk * .4));
    nv.position.set(lerp(.7, 1.6, mk), 1.85 + Math.sin(t * 2 + 1) * .06, 0); nv.rotation.set(0, -t * .8, .4); nv.scale.setScalar(pop(tl - N) * (1 - mk * .4));
    mol.position.set(-.15, 1.75, .6); mol.rotation.set(t * .7, t * 1.1, 0); mol.scale.setScalar(1.1 * pop(tl - C)); mol.visible = tl > C;
    sp.forEach((s, i) => { const an = i * .628 + t * 2; s.visible = tl > C; s.position.set(Math.cos(an) * 1.1, 1.75 + Math.sin(an) * 1.0, .6); s.scale.setScalar(.5 + Math.max(0, Math.sin(t * 12 + i)) * 2); });
    if (tl < N) D.draw('CAROLINA REAPER', '#c8202a', '#ffffff', 12); else if (tl < C) D.draw('NAGA VIPER', '#ff6a1a', '#ffffff', 16); else D.draw('CAPSAICIN', '#ffe21f', '#16120a', 17);
    D.m.scale.setScalar(.85 * (tl < N ? pop(tl - R) : tl < C ? pop(tl - N) : pop(tl - C))); look(cam, Math.sin(tl * .4) * .4, 1.9, 5.2 - tl * .25, 0, 1.85, 0);
  } };
});
// 5: "Capsaicin grabs onto the heat sensors in his tongue, and tricks his brain into thinking his mouth is burning."
shot(14.6, 21.35, () => {
  const T = tongue(), mols = T.sens.map(() => { const m = makeMolecule(.35); T.scene.add(m); return m; }), pulses = [...Array(6)].map(() => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.08, 0), bmat({ color: 0xffd04a })); T.scene.add(p); return p; });
  const Bs = darkStage(0x140810), brain = makeBrain(); Bs.scene.add(brain); const fl = flames(Bs.scene, 24), nerve = box(.06, 4, .06, bmat({ color: 0xffd04a }), 0, -2.4, 0); Bs.scene.add(nerve); const bp_ = [...Array(5)].map(() => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.1, 0), bmat({ color: 0xffffff })); Bs.scene.add(p); return p; });
  const sign = hud(Bs.cam, makeSign('FAKE FIRE', '#ff3a1a', '#ffffff')), SW = 3.25;
  return { scene: T.scene, cam: T.cam, update(tl, d, t) {
    if (tl < SW) { this.scene = T.scene; this.cam = T.cam; const g = .95;   // "grabs" at 15.55
      mols.forEach((m, i) => { const s = T.sens[i], k = ss(.3 + i * .08, g + i * .08, tl); m.position.set(s.position.x + (1 - k) * (i % 2 ? .6 : -.6), .1 + (1 - k) * 1.6, s.position.z); m.rotation.set(t * (1 - k) * 2 + i, i, 0); });
      T.glowS(tl > 1.3 ? 1 : 0); T.sens.forEach(s => s.scale.setScalar(1 + (tl > 1.3 ? Math.sin(t * 20) * .08 : 0)));
      pulses.forEach((p, i) => { const s = T.sens[i], q = ((tl - 1.6) * 1.5) % 1; p.visible = tl > 1.6; p.position.set(s.position.x, .05 - q * 1.2, s.position.z + .2); });
      look(T.cam, .2, 1.9 - tl * .15, 2.9 - tl * .25, 0, 0, .1); return; }
    this.scene = Bs.scene; this.cam = Bs.cam; const a = tl - SW, burn = ss(1.4, 2.0, a);
    bp_.forEach((p, i) => { const q = (a * 1.6 + i / 5) % 1; p.position.set(0, -4.4 + q * 3.6, .1); p.visible = burn < 1; });
    brain.userData.m.color.setHex(burn > .5 ? 0xff5a4a : 0xe89aa8); brain.rotation.y = .4 + a * .2; brain.position.set(0, .3, 0); brain.scale.setScalar(1 + burn * Math.abs(Math.sin(t * 8)) * .05);
    flamesAt(fl, t, V(0, .9, 0), burn, 1.2, 1.4); sign.scale.setScalar(pop(a - 1.8) * .85); look(Bs.cam, 1.6 - a * .2, 1.0, 5.0 - a * .3, 0, .3, 0);
  } };
}, { dof: { b: 1.2, y: .5, r: .38 } });
// 6: "So his body panics. He starts sweating, to cool down."
shot(21.35, 25.2, () => {
  const D = diner(), dr = sweat(D.scene), dr2 = sweat(D.scene), al = flashQuad(D.cam, 0xff0000);
  return { scene: D.scene, cam: D.cam, update(tl, d, t) {
    const M = D.M; M.reset(); M.face('scream'); M.tint(0xff2a1a, .4); M.arms[0].rotation.z = -2.5; M.arms[1].rotation.z = 2.5; M.body.position.y = Math.abs(Math.sin(t * 16)) * .03;
    al.material.opacity = tl < 1.0 ? (Math.sin(t * 18) > 0 ? .18 : 0) : 0; const f = faceAt(M); sweatAt(dr, t, f.x - .15, f.y + .1, f.z, 3); sweatAt(dr2, t + .3, f.x + .15, f.y + .1, f.z, 3);
    look(D.cam, f.x - .5 + tl * .1, f.y, f.z + 1.3 - tl * .12, f.x, f.y - .15, f.z); shake(D.cam, t, .006);
  } };
}, { dof: { b: 1.3, y: .45, r: .34 } });
// 7: "His eyes water. His nose runs."
shot(25.2, 27.7, () => {
  const D = diner(), tL = drops(D.scene, 6, 0x9adfff, .011), tR = drops(D.scene, 6, 0x9adfff, .011), nz = drops(D.scene, 4, 0xd8f0c8, .012);
  return { scene: D.scene, cam: D.cam, update(tl, d, t) {
    const M = D.M; M.reset(); M.face('sad'); M.tint(0xff2a1a, .35); M.head.rotation.x = .05; M.root.updateMatrixWorld(true);
    fall(tL, t, M.head.localToWorld(V(-.12, .25, .23)), 1.4, .35); fall(tR, t, M.head.localToWorld(V(.12, .25, .23)), 1.4, .35); nz.forEach(n => n.visible = tl > 1.0); fall(nz, t, M.head.localToWorld(V(0, .14, .25)), .9, .25);
    const f = faceAt(M); look(D.cam, f.x + .15, f.y - .05, f.z + .75 - tl * .08, f.x, f.y - .08, f.z);
  } };
}, { dof: { b: 1.5, y: .45, r: .3 } });
// 8: "He grabs water, but water just spreads it around."
shot(27.7, 31.6, () => {
  const D = diner(), gl = new THREE.Group(); gl.add(new THREE.Mesh(new THREE.CylinderGeometry(.11, .09, .3, 10), bmat({ color: 0xcfeaf0, transparent: true, opacity: .45 }))); const w = new THREE.Mesh(new THREE.CylinderGeometry(.1, .085, .22, 10), bmat({ color: 0x6ac0ff, transparent: true, opacity: .7 })); w.position.y = -.03; gl.add(w); D.scene.add(gl);
  const T = tongue(), wave = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), bmat({ color: 0x6ac0ff, transparent: true, opacity: .3, depthWrite: false })); wave.rotation.x = -Math.PI / 2; T.scene.add(wave); const mols = [...Array(14)].map((_, i) => { const m = makeMolecule(.25); m.userData = i; T.scene.add(m); return m; }), SW = 1.75;
  return { scene: D.scene, cam: D.cam, update(tl, d, t) {
    if (tl < SW) { this.scene = D.scene; this.cam = D.cam; const M = D.M; M.reset(); M.face('scream'); M.tint(0xff2a1a, .4); const k = ss(.1, .9, tl); M.arms[1].rotation.x = lerp(-.4, -2.1, k); M.arms[1].rotation.z = -.3 * k; const h = handAt(M); gl.position.copy(h).add(V(0, .12, .05)); gl.rotation.x = -k * 1.2;
      const f = faceAt(M); look(D.cam, f.x - 1.15, f.y - .05, f.z + 1.3 - tl * .15, f.x, f.y - .3, f.z); return; }
    this.scene = T.scene; this.cam = T.cam; const a = tl - SW, s = ss(0, 1.8, a); T.glowS(1); wave.position.y = .1 + Math.sin(t * 3) * .03; wave.material.opacity = .3;
    mols.forEach(m => { const i = m.userData, an = i * .45, r0 = .3 + (i % 3) * .1; m.position.set(Math.cos(an) * lerp(r0, r0 + 2.2, s), .15, Math.sin(an) * lerp(r0, r0 + 1.6, s)); m.rotation.set(t + i, i, 0); });
    look(T.cam, 0, 3.2 - a * .2, 2.6, 0, 0, 0);
  } };
}, { dof: tl => tl < 1.75 ? { b: 1.3, y: .45, r: .34 } : { b: 1.2, y: .5, r: .4 } });
// 9: "Milk works better, because a protein in it pulls the capsaicin away."
shot(31.6, 37.0, () => {
  const D = diner(), carton = new THREE.Group(); carton.add(box(.22, .4, .22, mat({ color: 0xf6f6f6 }))); carton.add(box(.225, .1, .225, mat({ color: 0x3a6ad8 }), 0, .1, 0)); const roof = box(.22, .12, .16, mat({ color: 0xf6f6f6 }), 0, .26, 0); roof.rotation.x = .7; carton.add(roof); D.scene.add(carton);
  const T = tongue(), mols = T.sens.map(() => { const m = makeMolecule(.35); T.scene.add(m); return m; }), prot = T.sens.map(() => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.28, 0), mat({ color: 0xf8f6ec })); T.scene.add(p); return p; }), SW = 1.55;
  const sign = hud(T.cam, makeSign('MILK PROTEIN', '#ffffff', '#3a6ad8'));
  return { scene: D.scene, cam: D.cam, update(tl, d, t) {
    if (tl < SW) { this.scene = D.scene; this.cam = D.cam; const M = D.M; M.reset(); M.face('happy'); M.tint(0xff2a1a, .3); M.arms[1].rotation.x = -2.1; M.arms[1].rotation.z = -.3; const h = handAt(M); carton.position.copy(h).add(V(0, .15, .05)); carton.rotation.x = -1.4 * ss(.3, .9, tl);
      const f = faceAt(M); look(D.cam, f.x - .6, f.y - .1, f.z + 1.3, f.x, f.y - .25, f.z); return; }
    this.scene = T.scene; this.cam = T.cam; const a = tl - SW, grab = ss(.4, 1.4, a), away = ss(1.6, 3.0, a);
    T.sens.forEach((s, i) => { const m = mols[i], p = prot[i]; p.position.set(s.position.x + (1 - grab) * 1.5, .25 + (1 - grab) * 1.2 + away * 2.2, s.position.z); p.rotation.set(t * .5 + i, t * .3, 0); m.position.set(s.position.x + .05, .12 + away * 2.2, s.position.z + .05); m.rotation.set(i, t * 2, 0); });
    T.glowS(away > .3 ? 0 : 1); sign.scale.setScalar(pop(a - .6) * .85); look(T.cam, .4, 2.3 - a * .1, 3.0 - a * .15, 0, .3, 0);
  } };
}, { dof: { b: 1.2, y: .5, r: .4 } });
// 10: "Then it hits his stomach. Cramps."
shot(37.0, 40.7, () => {
  const S = darkStage(0x140810), st = makeStomach(); S.scene.add(st); const bits = [...Array(8)].map(() => { const c = makeChip(); c.scale.setScalar(.5); S.scene.add(c); return c; }), fl = flames(S.scene, 16), CR = 1.75;
  return { scene: S.scene, cam: S.cam, update(tl, d, t) {
    bits.forEach((b, i) => { const q = clamp(tl * .9 - i * .07); b.position.set(-.6 + q * .5 + Math.sin(i) * .1, 2.8 - q * 2.8, .1); b.rotation.set(t * 3 + i, t * 2, 0); b.visible = q < 1; });
    const hot = ss(1.0, CR, tl); st.userData.m.color.setHex(hot > .5 ? 0xff4a3a : 0xe8828a); const cr = tl > CR ? Math.abs(Math.sin((tl - CR) * 12)) * .15 : 0; st.userData.b.scale.set(1.3 - cr, .9 + cr * .5, .8);
    flamesAt(fl, t, V(0, .3, .3), hot, 1.0, .8); look(S.cam, .5, .8, 4.4 - tl * .3, 0, .5, 0); if (tl > CR) shake(S.cam, t, .02);
  } };
});
// 11: "Nausea."
shot(40.7, 42.9, () => {
  const D = diner();
  return { scene: D.scene, cam: D.cam, update(tl, d, t) {
    const M = D.M; M.reset(); M.face('sad'); M.tint(0x7ac83a, .45 * ss(0, .5, tl)); M.head.rotation.z = Math.sin(t * 2.4) * .15; M.body.rotation.z = Math.sin(t * 2.4) * .05; M.arms[1].rotation.x = -.6; M.arms[1].rotation.z = .5;
    const f = faceAt(M); look(D.cam, f.x + Math.sin(t * 2) * .2, f.y + .05, f.z + 1.4, f.x, f.y - .3, f.z); D.cam.rotation.z += Math.sin(t * 2.4) * .08;
  } };
}, { dof: { b: 1.4, y: .45, r: .32 } });
// 12: "His heart starts racing."
shot(42.9, 44.9, () => {
  const S = darkStage(0x100608), ht = makeHeart(); S.scene.add(ht); const E = dynTex(128, 40), ekg = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .6), bmat({ map: E.t, transparent: true })); hud(S.cam, ekg, -1.0);
  return { scene: S.scene, cam: S.cam, update(tl, d, t) {
    const rate = 3 + tl * 2.2, ph = (t * rate) % 1, beat = Math.exp(-ph * 9); ht.scale.setScalar(1 + beat * .14); ht.position.y = .9; ht.rotation.y = Math.sin(t * .8) * .3;
    const g = E.g; g.fillStyle = '#000'; g.fillRect(0, 0, 128, 40); g.strokeStyle = '#3fff6a'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x < 128; x++) { const p = ((x / 128) * 4 - t * rate * .5) % 1, q = p < 0 ? p + 1 : p; const y = 22 - (q > .4 && q < .45 ? 16 : q > .45 && q < .5 ? -8 : 0); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); E.t.needsUpdate = true; ekg.scale.setScalar(pop(tl - .1));
    look(S.cam, .3, 1.0, 3.2 - tl * .3, 0, .85, 0); shake(S.cam, t, .01 * beat);
  } };
});
// 13: "For most people, it passes."
shot(44.9, 47.2, () => {
  const D = diner(), sp = sparkles(D.scene, 6, 0xffffff, .03);
  return { scene: D.scene, cam: D.cam, update(tl, d, t) {
    const M = D.M; M.reset(); const k = ss(.3, 1.6, tl); M.tint(0xff2a1a, .25 * (1 - k)); M.face(k > .6 ? 'happy' : 'worried'); M.body.rotation.x = -.05 * k; M.arms[0].rotation.x = M.arms[1].rotation.x = -.3;
    const f = faceAt(M); sp.forEach((s, i) => { const an = i * 1.05 + t; s.visible = k > .6; s.position.set(f.x + Math.cos(an) * .4, f.y + .3 + Math.sin(an) * .15, f.z); s.scale.setScalar(.6 + Math.max(0, Math.sin(t * 8 + i)) * 1.4); });
    look(D.cam, f.x, f.y - .2, f.z + 1.9 + tl * .15, f.x, f.y - .45, f.z);
  } };
}, { dof: { b: 1.2, y: .45, r: .38 } });
// 14: "But in 2023, a 14 year old died after doing the challenge, and the chip was pulled from shelves for good." - an empty store shelf, quiet
shot(47.2, DUR + .1, () => {
  const scene = new THREE.Scene(), cam = newCam(45); scene.background = new THREE.Color(0x1a1c22); scene.add(cam); scene.add(new THREE.AmbientLight(0xdfe6ff, 1.3)); const top = new THREE.PointLight(0xf2f6ff, 10, 7); top.position.set(0, 3.2, 1.6); scene.add(top);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat({ color: 0x6a6e76 })); fl.rotation.x = -Math.PI / 2; scene.add(fl); const sm = mat({ color: 0xd8dce4 }); scene.add(box(4, 3, .2, sm, 0, 1.5, -.5)); for (const y of [.5, 1.2, 1.9, 2.6]) scene.add(box(4, .06, .6, sm, 0, y, -.15)); for (const s of [-1, 1]) scene.add(box(.08, 3, .6, sm, s * 2, 1.5, -.15));
  const boxes = []; for (const y of [1.2, 1.9]) for (let i = 0; i < 9; i++) { const b = makeChipBox(); b.scale.setScalar(.38); b.rotation.x = -Math.PI / 2 + .1; b.position.set(-1.7 + i * .42, y + .2, -.2); scene.add(b); boxes.push(b); }
  const D = dynSign(cam, 1.25), fq = flashQuad(cam, 0x000000);
  return { scene, cam, update(tl, d, t) {
    boxes.forEach((b, i) => { const at = 3.2 + ((i * 7) % 18) * .17; b.visible = tl < at; });
    D.draw('2023', '#16120a', '#ffffff', 22); D.m.scale.setScalar(pop(tl - .3) * .85 * (1 - ss(2.6, 3.0, tl)));
    fq.material.opacity = ss(d - 1.2, d - .1, tl) * .85; look(cam, Math.sin(tl * .2) * .4, 1.6, 4.6 - tl * .25, 0, 1.55, -.2);
  } };
});
shots.forEach(S => { if (!S.cam.parent) S.scene.add(S.cam); });
// ---------- captions ----------
let chunks = [];
// captions in the tutorial style: white, sentence case, 1-3 words, soft shadow
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
await document.fonts.load('800 54px Nunito');
window.captionChunks = chunks; window.ready = true;
