// "How Ozzy Osbourne Bit A Bat" - PS1-style low-poly short, rendered frame by frame.
// (engine section shared with ../invisible-short)
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 55.416;
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

// ---------- Ozzy short: characters & props ----------
const OZZY = { skin: 0xecc0a0, hair: 0x15100e, top: 0x16141c, pants: 0x121016, topStyle: 'sequin', hairH: .12, iris: '#5a4a3a', lip: '#a85a50', shoes: 0x0c0c0c };
function longHair(h, c = OZZY.hair) { const m = mat({ color: c }); h.head.add(box(.52, .62, .14, m, 0, .2, -.22)); for (const s of [-1, 1]) h.head.add(box(.08, .58, .36, m, s * .245, .22, -.04)); h.head.add(box(.5, .1, .5, m, 0, .56, -.01)); return h; }
const ozzy = scene => { const h = longHair(palms(makeHuman(OZZY), OZZY.skin)); scene.add(h.root); return h; };
const SUIT = [{ skin: 0xe8b89a, hair: 0x8a8a8a, top: 0x2a2f3a, pants: 0x22252e, topStyle: 'suit', glasses: true, hairH: .05, shoes: 0x111111 },
  { skin: 0xc98d68, hair: 0x2a2018, top: 0x3a3428, pants: 0x2a2620, topStyle: 'suit', mustache: true, hairH: .07, shoes: 0x111111 },
  { skin: 0xf0c9a8, hair: 0x5a3a1a, top: 0x1f2a44, pants: 0x1a2030, topStyle: 'suit', hairH: .09, shoes: 0x111111 }];
const FAN = { skin: 0xe8b089, hair: 0x6a3a1a, top: 0x1a1a20, pants: 0x34558c, hairH: .26, iris: '#3a6a3a', shoes: 0xf2f2f2 };
// the bat: black body, big ears, flapping wings (also used as the "rubber toy" in another colour)
function makeBat(col = 0x1a161c, eye = 0xff3a3a) {
  const g = new THREE.Group(), m = mat({ color: col }), mw = mat({ color: shadeHex(col, 1.6), side: THREE.DoubleSide });
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 0), m); b.scale.set(.9, 1.15, .8); g.add(b);
  const hd = new THREE.Mesh(new THREE.IcosahedronGeometry(.11, 0), m); hd.position.y = .2; g.add(hd);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.045, .12, 4), m); e.position.set(s * .06, .33, 0); e.rotation.z = -s * .25; g.add(e); g.add(box(.03, .03, .02, bmat({ color: eye }), s * .04, .22, .1)); }
  const wings = [-1, 1].map(s => { const w = new THREE.Group(), sh = new THREE.Shape(); sh.moveTo(0, .06); sh.lineTo(.42, .16); sh.lineTo(.36, -.02); sh.lineTo(.26, .02); sh.lineTo(.18, -.06); sh.lineTo(.08, -.02); sh.lineTo(0, -.08); const me = new THREE.Mesh(new THREE.ShapeGeometry(sh), mw); me.scale.x = s; w.add(me); w.position.set(s * .1, .05, 0); g.add(w); return w; });
  g.userData = { flap(t, a = 1) { wings.forEach((w, i) => w.rotation.y = (i ? -1 : 1) * Math.sin(t) * .9 * a); }, fold(k) { wings.forEach((w, i) => { w.rotation.y = (i ? -1 : 1) * 1.3 * k; }); } };
  return g;
}
function makeDove() {
  const g = new THREE.Group(), m = mat({ color: 0xf6f6f2 }), mw = mat({ color: 0xe6e8ee, side: THREE.DoubleSide });
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.16, 0), m); b.scale.set(.8, .8, 1.4); g.add(b);
  const hd = new THREE.Mesh(new THREE.IcosahedronGeometry(.09, 0), m); hd.position.set(0, .12, .18); g.add(hd);
  const bk = new THREE.Mesh(new THREE.ConeGeometry(.03, .08, 4), mat({ color: 0xf0a030 })); bk.rotation.x = Math.PI / 2; bk.position.set(0, .11, .29); g.add(bk);
  for (const s of [-1, 1]) g.add(box(.025, .025, .02, bmat({ color: 0x111111 }), s * .05, .15, .24));
  const tail = box(.16, .03, .18, m, 0, .02, -.26); g.add(tail);
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); const me = box(.4, .02, .22, mw, s * .2, 0, 0); w.add(me); w.position.set(s * .08, .06, 0); g.add(w); return w; });
  g.userData = { flap(t, a = 1) { wings.forEach((w, i) => w.rotation.z = (i ? 1 : -1) * Math.sin(t) * .8 * a); } };
  return g;
}
function makeSyringe(s = 1) {
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .6, 8), bmat({ color: 0xcfeaff, transparent: true, opacity: .75 })); g.add(tube);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(.065, .065, .35, 8), bmat({ color: 0x5ad0ff })); liq.position.y = -.1; g.add(liq);
  g.add(box(.04, .3, .04, mat({ color: 0xdddddd }), 0, .42, 0)); g.add(box(.2, .03, .2, mat({ color: 0xdddddd }), 0, .58, 0)); g.add(box(.24, .03, .06, mat({ color: 0xdddddd }), 0, .3, 0));
  const nd = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .3, 4), bmat({ color: 0xe8e8e8 })); nd.position.y = -.45; g.add(nd);
  g.scale.setScalar(s); return g;
}
// hand position of an arm in world space (so props stay in the hand)
const handAt = (h, i = 1) => { h.root.updateMatrixWorld(true); return h.arms[i].localToWorld(new THREE.Vector3(0, -.76, .1)); };
function holdUp(h, k = 1, i = 1) { h.arms[i].rotation.x = -2.15 * k; h.arms[i].rotation.z = (i ? -.3 : .3) * k; }
function rock(h, t, amp = 1) { const b = Math.sin(t * 9); h.head.rotation.x = .25 + b * .35 * amp; h.body.rotation.x = .08 + b * .06 * amp; h.arms[0].rotation.x = -2.8; h.arms[0].rotation.z = .5 + Math.sin(t * 4.5) * .2; h.arms[1].rotation.x = -2.8; h.arms[1].rotation.z = -.5 - Math.sin(t * 4.5) * .2; h.body.position.y = Math.abs(b) * .05 * amp; }
// a crowd of simple block fans, waving and bouncing
function crowdOf(scene, rows, per, z0, dz, w, y0 = 0, seed = 5, up = 0) {
  const r = rng(seed), fans = [];
  for (let row = 0; row < rows; row++) for (let i = 0; i < per; i++) {
    const g = new THREE.Group(), c = [0x1a1a20, 0x6a2a8a, 0x2a2a30, 0x8a1f2a, 0x3a5a8a, 0x202024, 0x5a5a60][r() * 7 | 0], sk = mat({ color: [0xe2a57f, 0x8a5a3c, 0xf0c9a8, 0xc98d68][r() * 4 | 0] });
    g.add(box(.46, .7, .32, mat({ color: c }), 0, .85, 0)); g.add(box(.32, .5, .3, mat({ color: 0x2a3550 }), 0, .25, 0)); g.add(box(.3, .32, .3, sk, 0, 1.38, 0)); g.add(box(.32, .1, .32, mat({ color: [0x15110f, 0x6a3a1a, 0xd8b040, 0x2a2018][r() * 4 | 0] }), 0, 1.56, 0));
    const arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .3, 1.15, 0); a.add(box(.12, .55, .12, sk, 0, .27, 0)); g.add(a); return a; });
    g.position.set(-w / 2 + (i + r() * .6) * w / per, y0 + row * up, z0 + row * dz + r() * .3); g.rotation.y = (r() - .5) * .3; g.userData = { arms, ph: r() * 6, sp: 6 + r() * 4, y: y0 + row * up }; scene.add(g); fans.push(g);
  }
  return { fans, cheer(t, amp = 1) { fans.forEach(f => { const u = f.userData, s = Math.sin(t * u.sp + u.ph); f.position.y = u.y + Math.abs(s) * .14 * amp; u.arms[0].rotation.z = .35 + s * .35 * amp; u.arms[1].rotation.z = -.35 - Math.sin(t * u.sp + u.ph + 1) * .35 * amp; f.lookAt && 0; }); } };
}
const backdropT = ctex(64, 32, g => { g.fillStyle = '#1a0a2a'; g.fillRect(0, 0, 64, 32); const r = rng(8); for (let i = 0; i < 40; i++) { g.fillStyle = r() < .5 ? '#6a2a9a' : '#ffd8f0'; g.fillRect(r() * 64 | 0, r() * 32 | 0, 1, 1); } g.fillStyle = '#3a1050'; g.beginPath(); g.moveTo(32, 2); g.lineTo(62, 30); g.lineTo(2, 30); g.fill(); g.fillStyle = '#ff3a5a'; g.fillRect(31, 8, 2, 16); g.fillRect(27, 12, 10, 2); noise(g, 64, 32, 12, 3); });
const ampT = ctex(16, 16, g => { g.fillStyle = '#181818'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#3a3a3a'; for (let y = 1; y < 16; y += 2) for (let x = 1; x < 16; x += 2) g.fillRect(x, y, 1, 1); g.fillStyle = '#c9c9c9'; g.fillRect(5, 13, 6, 2); });
// the arena: stage (top at y = 1.2), amps, truss lights with sweeping beams, smoke, and a crowd in front
function arena(opts = {}) {
  const scene = new THREE.Scene(), cam = newCam(opts.fov || 55); scene.background = new THREE.Color(0x07060e); lights(scene, 1.3, 1.6); scene.add(cam);
  const key = new THREE.PointLight(0xffe0c0, 14, 9); key.position.set(0, 4.5, 3); scene.add(key); const pur = new THREE.PointLight(0xb040ff, 18, 12); pur.position.set(-3, 3, -1); scene.add(pur);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat({ color: 0x15131c })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  scene.add(box(10, 1.2, 5, mat({ color: 0x2a2630 }), 0, .6, -1)); scene.add(box(10.1, .08, 5.1, mat({ color: 0x3a3640 }), 0, 1.22, -1));
  const bd = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), bmat({ map: backdropT })); bd.position.set(0, 3.6, -3.4); scene.add(bd);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) scene.add(box(1.1, .9, .8, [mat({ color: 0x181818 }), mat({ color: 0x181818 }), mat({ color: 0x222222 }), mat({ color: 0x181818 }), mat({ map: ampT }), mat({ color: 0x181818 })], s * 3.6, 1.65 + k * .9, -2.2));
  const tm_ = mat({ color: 0x55585e }); scene.add(box(10, .15, .15, tm_, 0, 6, -.5)); for (const s of [-1, 1]) scene.add(box(.15, 6, .15, tm_, s * 4.9, 3, -.5));
  const cols = [0xff3a5a, 0x3a8aff, 0xb040ff, 0xffe21f, 0x3fd060, 0xff8a1f], beams = cols.map((c, i) => { const cn = new THREE.Mesh(new THREE.ConeGeometry(.75, 6, 10, 1, true), bmat({ color: c, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); cn.geometry.translate(0, -3, 0); cn.position.set(-4 + i * 1.6, 6, -.5); scene.add(cn); scene.add(box(.3, .25, .3, bmat({ color: c }), -4 + i * 1.6, 5.85, -.5)); return cn; });
  const smoke = [...Array(10)].map((_, i) => { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.7, 0), bmat({ color: 0x8a7aa8, transparent: true, opacity: .14, depthWrite: false })); p.userData = i; scene.add(p); return p; });
  const crowd = opts.crowd === false ? null : crowdOf(scene, opts.rows || 6, opts.per || 14, 2.6, 1.0, 13, 0, 5);
  return { scene, cam, crowd, beams, key, update(t, amp = 1) { beams.forEach((b, i) => { b.rotation.z = Math.sin(t * 1.3 + i * 1.1) * .45; b.rotation.x = .25 + Math.cos(t * 1.1 + i) * .25; }); smoke.forEach(p => { const i = p.userData; p.position.set(-4.5 + ((i * 1.1 + t * .25) % 9), 1.5 + (i % 3) * .25, -.5 + (i % 4) * .6); p.rotation.set(t * .2, i, 0); }); crowd && crowd.cheer(t, amp); } };
}
function flashQuad(cam, col = 0xffffff) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 5), bmat({ color: col, transparent: true, opacity: 0, depthTest: false })); m.renderOrder = 998; m.position.z = -1; cam.add(m); return m; }
function bubble(scene) { const g = new THREE.Group(), m = bmat({ color: 0xffffff }); const c = new THREE.Mesh(new THREE.CircleGeometry(.62, 14), m); g.add(c); const o = new THREE.Mesh(new THREE.CircleGeometry(.68, 14), bmat({ color: 0x16120a })); o.position.z = -.01; g.add(o); for (const [x, y, r] of [[-.35, -.72, .12], [-.5, -.95, .07]]) { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 8), m); d.position.set(x, y, 0); g.add(d); } scene.add(g); return g; }
function feathers(scene, n = 14) { const r = rng(n); return [...Array(n)].map(() => { const f = box(.1, .02, .05, bmat({ color: 0xffffff })); f.userData = { v: new THREE.Vector3((r() - .5) * 2.2, r() * 1.6 + .4, (r() - .5) * 2.2), sp: r() * 9 }; scene.add(f); return f; }); }
const feathersAt = (fs, a, x, y, z) => fs.forEach(f => { const u = f.userData, q = Math.max(0, a); f.visible = a > 0 && a < 1.6; f.position.set(x + u.v.x * q, y + u.v.y * q - q * q * .9, z + u.v.z * q); f.rotation.set(q * u.sp, q * 4, Math.sin(q * 6 + u.sp) * .8); });

// ---------- Ozzy short: shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
// 1 / last: the hook - Ozzy on stage, holding the bat up, crowd going wild
function sHook(hold) {
  return () => { const A = arena(), O = ozzy(A.scene), bat = makeBat(); A.scene.add(bat); const sign = hud(A.cam, makeSign('1982', '#ffe21f', '#16120a'));
    return { scene: A.scene, cam: A.cam, update(tl, d, t) {
      A.update(t, 1.2); O.reset(); O.root.position.set(0, 1.2, .6); O.face('laugh'); holdUp(O, 1); O.arms[0].rotation.x = -2.6; O.arms[0].rotation.z = .5; O.head.rotation.x = -.15 + Math.sin(t * 9) * .05;
      const p = handAt(O); bat.position.set(p.x, p.y + .2, p.z); bat.userData.fold(.9); bat.rotation.y = Math.sin(t * 2) * .3;
      sign.scale.setScalar(hold ? 0.001 : pop(tl - .15) * .85); const x = hold ? 0 : tl;
      look(A.cam, Math.sin(x * .9) * .5, 2.4, lerp(9, 6.6, ss(0, 2.2, x)), 0, 2.6, 0); if (!hold) shake(A.cam, t, .015);
    } }; };
}
shot(0, 2.21, sHook(false));
// 2: "Ozzy Osbourne bit the head off a real bat."
shot(2.21, 5.54, () => {
  const A = arena({ rows: 3 }), O = ozzy(A.scene), bat = makeBat(); A.scene.add(bat); const sign = hud(A.cam, makeSign('OZZY OSBOURNE', '#16120a', '#ffe21f')), f = flashQuad(A.cam);
  return { scene: A.scene, cam: A.cam, update(tl, d, t) {
    A.update(t); O.reset(); O.root.position.set(0, 1.2, .6); const lift = ss(1.6, 2.15, tl); holdUp(O, .55 + lift * .35); O.arms[1].rotation.z = .35 * (1 - lift); O.face(tl > 2.1 ? 'scream' : tl > 1.0 ? 'sly' : 'happy');
    const p = handAt(O), bit = tl > 2.2; bat.position.set(lerp(p.x, .02, lift * .6), lerp(p.y + .1, 1.2 + 1.82, lift * .7), lerp(p.z, .6 + .38, lift * .6)); bat.userData.fold(.9); bat.rotation.z = Math.sin(t * 3) * .15;
    sign.scale.setScalar(pop(tl - .05) * .85 * (1 - ss(1.9, 2.0, tl))); f.material.opacity = bit ? Math.exp(-(tl - 2.2) * 7) * .9 : 0;
    look(A.cam, -.55, 1.2 + 2.0, lerp(3.8, 2.7, ss(0, 2.2, tl)) * (bit ? punch(tl - 2.2, -.12) : 1), 0, 1.2 + 1.75, .6); if (bit) shake(A.cam, t, .05 * Math.exp(-(tl - 2.2) * 5));
  } };
});
// 3: "On stage."
shot(5.54, 7.08, () => {
  const A = arena(), O = ozzy(A.scene), sign = hud(A.cam, makeSign('ON STAGE', '#ff3a5a', '#ffffff')), sp = sparkles(A.scene, 10, 0xfff27a, .08);
  return { scene: A.scene, cam: A.cam, update(tl, d, t) { A.update(t, 1.3); O.reset(); O.root.position.set(0, 1.2, -.7); O.face('laugh'); O.arms[0].rotation.x = O.arms[1].rotation.x = -2.9; O.arms[0].rotation.z = .55; O.arms[1].rotation.z = -.55; O.body.position.y = Math.abs(Math.sin(t * 8)) * .08;
    sp.forEach((s, i) => { const an = i * .628 + t * 2; s.position.set(Math.cos(an) * 1.3, 2.4 + Math.sin(an) * 1.3, .4); s.scale.setScalar(.5 + Math.max(0, Math.sin(t * 12 + i * 2)) * 2); });
    sign.scale.setScalar(pop(tl - .05) * .85); look(A.cam, -1.0 + tl * .8, 1.3, 2.45 - tl * .1, 0, 2.3, -.7); } };
});
// 4: "In front of thousands of fans."
shot(7.08, 9.55, () => {
  const A = arena({ rows: 10, per: 18 }), O = ozzy(A.scene), sign = hud(A.cam, makeSign('THOUSANDS', '#ffe21f', '#16120a'), -1.05), more = crowdOf(A.scene, 8, 22, 12.6, 1.1, 22, 0, 9, .25);
  return { scene: A.scene, cam: A.cam, update(tl, d, t) { A.update(t, 1.4); more.cheer(t, 1.4); O.reset(); O.root.position.set(.4, 1.2, .9); O.root.rotation.y = .1; O.arms[1].rotation.x = -2.9; O.arms[1].rotation.z = -.3; O.face('happy');
    sign.scale.setScalar(pop(tl - .55) * .85); look(A.cam, -.9 + tl * .3, 3.6 + tl * .3, -1.4, 1.0, 1.0, 14); } };
});
// 5: "It was January 20th in Des Moines, Iowa." - the auditorium at night, snow
shot(9.55, 12.95, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x0c1236); lights(scene, 1.3, 1.0); scene.add(cam);
  const sn = ctex(32, 32, g => { g.fillStyle = '#dfe6f2'; g.fillRect(0, 0, 32, 32); noise(g, 32, 32, 14, 6); }, [20, 20]); const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat({ map: sn })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  scene.add(box(40, .03, 4, mat({ color: 0x3a3e4a }), 0, .02, 5));
  const bld = new THREE.Group(), wall = mat({ map: facadeTex(0xb8a888, 51) }); bld.add(box(16, 6, 8, wall, 0, 3, -4)); bld.add(box(14, 2.2, 7, mat({ color: 0xa89878 }), 0, 7.1, -4)); bld.add(box(16.4, .4, 8.4, mat({ color: 0xdcd2bc }), 0, 6.1, -4));
  for (let i = -3; i <= 3; i++) bld.add(box(1.4, 2.4, .2, bmat({ color: 0xffe0a0 }), i * 2, 1.2, -.02));
  const mq = makeSign('OZZY TONIGHT', '#ffffff', '#c8202a'); mq.position.set(0, 4.3, .2); mq.scale.setScalar(3.2); bld.add(mq); bld.add(box(6.4, 2.8, .3, mat({ color: 0x2a2a30 }), 0, 4.3, .02)); scene.add(bld);
  const bulbs = [...Array(20)].map((_, i) => { const b = box(.14, .14, .1, bmat({ color: 0xfff2b0 }), -3 + (i % 10) * .667, i < 10 ? 5.7 : 2.9, .2); bld.add(b); return b; });
  const r = rng(12), snow = [...Array(60)].map(() => { const s = box(.06, .06, .06, bmat({ color: 0xffffff })); s.userData = [r() * 16 - 8, r() * 10, r() * 10 - 2, r()]; scene.add(s); return s; });
  const fans = crowdOf(scene, 2, 9, 3.0, .8, 9, 0, 31), D = dynSign(cam, 1.25);
  return { scene, cam, update(tl, d, t) {
    snow.forEach(s => { const [x, y, z, a] = s.userData; s.position.set(x + Math.sin(t + a * 6) * .3, ((y - t * 1.4) % 10 + 10) % 10, z); }); bulbs.forEach((b, i) => b.material.color.setHex(((i + Math.floor(t * 6)) % 3) ? 0xfff2b0 : 0x806a30)); fans.cheer(t, .4);
    if (tl < 1.68) D.draw('JAN 20, 1982', '#ffe21f', '#16120a', 15); else D.draw('DES MOINES, IOWA', '#ffffff', '#16120a', 12);
    D.m.scale.setScalar(pop(tl - .35) * .85 * (tl > 1.68 ? pop(tl - 1.68) : 1)); look(cam, Math.sin(tl * .5) * 1.5, 2.2 + tl * .4, 15.5 - tl * 1.6, 0, 4.0, -2);
  } };
});
// 6: "Fans loved throwing stuff at Ozzy," - junk raining onto the stage
shot(12.95, 15.39, () => {
  const A = arena({ rows: 4 }), O = ozzy(A.scene), r = rng(44), junk = [...Array(12)].map((_, i) => { const c = [0xff3a5a, 0x3a8aff, 0xffe21f, 0x3fd060, 0xf2f2f2, 0xb04ad8][i % 6], m = i % 3 === 0 ? new THREE.Mesh(new THREE.IcosahedronGeometry(.13, 0), mat({ color: c })) : box(.26, .14, .2, mat({ color: c })); m.userData = { d: r() * 2.2, x: (r() - .5) * 3, z: r() * 1.2 }; A.scene.add(m); return m; });
  const sign = hud(A.cam, makeSign('INCOMING!', '#ff8a1f', '#16120a'));
  return { scene: A.scene, cam: A.cam, update(tl, d, t) {
    A.update(t, 1.4); O.reset(); O.root.position.set(Math.sin(t * 5) * .35, 1.2, .2); O.root.rotation.y = Math.sin(t * 5) * .3; O.face('laugh'); O.arms[0].rotation.x = -2.4; O.arms[0].rotation.z = .9; O.arms[1].rotation.x = -1.2;
    junk.forEach(j => { const u = j.userData, q = ((tl * .9 + u.d) % 1.6) / 1.6; j.position.set(u.x * (1 - q) + u.x * .4 * q, 1.4 + Math.sin(q * Math.PI) * 2.6, lerp(6, u.z - .5, q)); j.rotation.set(t * 7 + u.d, t * 5, 0); });
    sign.scale.setScalar(pop(tl - .2) * .85); look(A.cam, 1.6, 2.6, 6.8 * punch(tl, .1), 0, 2.4, 0);
  } };
});
// 7: "so when something small and black landed on stage," - low on the stage floor
shot(15.39, 18.67, () => {
  const A = arena({ rows: 3 }), O = ozzy(A.scene), bat = makeBat(); A.scene.add(bat); const sign = hud(A.cam, makeSign('???', '#16120a', '#ffffff')), L = 2.2;
  return { scene: A.scene, cam: A.cam, update(tl, d, t) {
    A.update(t, .8); O.reset(); O.root.position.set(.3, 1.2, -1.2); O.face(tl > L ? 'confused' : 'happy'); O.arms[1].rotation.x = -.4;
    const a = (tl - .6) / (L - .6), land = tl > L; bat.userData.fold(1); bat.rotation.set(land ? Math.PI / 2 - .2 : t * 9, land ? .5 : t * 4, 0);
    bat.position.set(lerp(-.6, .1, clamp(a)), land ? 1.33 + Math.abs(Math.sin((tl - L) * 12)) * .12 * Math.exp(-(tl - L) * 5) : 1.3 + Math.sin(clamp(a) * Math.PI) * 2.6 + (1 - clamp(a)) * 1, lerp(5, .9, clamp(a)));
    sign.scale.setScalar(pop(tl - L - .1) * .7); look(A.cam, -.4, 1.5, 2.6 - tl * .2, .1, 1.45, .8); if (land) shake(A.cam, t, .03 * Math.exp(-(tl - L) * 8));
  } };
});
// 8: "he picked it up."
shot(18.67, 20.18, () => {
  const A = arena({ rows: 3 }), O = ozzy(A.scene), bat = makeBat(); A.scene.add(bat);
  return { scene: A.scene, cam: A.cam, update(tl, d, t) {
    A.update(t, .8); O.reset(); O.root.position.set(0, 1.2, .3); const up = ss(.2, .9, tl); O.body.rotation.x = .9 * (1 - up); O.arms[1].rotation.x = lerp(-.6, -1.7, up); O.face('confused'); O.head.rotation.z = .2 * up;
    const p = handAt(O); bat.position.set(p.x, p.y + .05, p.z + .05); bat.userData.fold(1); bat.rotation.set(Math.PI / 2 * (1 - up), .5 * (1 - up), 0);
    look(A.cam, -.8, 2.5, 2.9, .1, 2.2 - up * .1, .4);
  } };
});
// 9: "He thought it was a rubber toy."
shot(20.18, 22.35, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = burst(scene, cam, 0x6a2a9a, 0x3a1a6a, 0xffb0f0), O = ozzy(scene), bat = makeBat(), toy = makeBat(0xb04ad8, 0xffe21f), bb = bubble(scene); scene.add(bat); bb.add(toy); toy.position.set(0, -.12, .02); toy.scale.setScalar(1.7);
  const sign = hud(cam, makeSign('RUBBER TOY?', '#ffe21f', '#16120a'));
  return { scene, cam, update(tl, d, t) { u.value = t * 1.2; O.reset(); O.root.position.set(-.35, 0, 0); O.root.rotation.y = .25; O.face('happy'); O.arms[1].rotation.x = -1.6; O.head.rotation.z = -.12;
    const p = handAt(O); bat.position.set(p.x, p.y + .05, p.z); bat.userData.fold(1); const sq = 1 - .25 * Math.max(0, Math.sin(t * 10));
    bb.position.set(.6, 2.75, .2); bb.scale.setScalar(pop(tl - .1) * .85); toy.scale.set(1.7 / sq, 1.7 * sq, 1.7); toy.rotation.y = Math.sin(t * 3) * .4;
    sign.scale.setScalar(pop(tl - .75) * .85); look(cam, .1, 2.1, 4.6 * punch(tl, .12), .1, 2.05, 0); } };
});
// 10: "So he did what any rock star would do."
shot(22.35, 25.27, () => {
  const A = arena(), O = ozzy(A.scene), bat = makeBat(); A.scene.add(bat); const sign = hud(A.cam, makeSign('ROCK STAR', '#16120a', '#ff3a5a')), sp = sparkles(A.scene, 10, 0xfff27a, .08);
  return { scene: A.scene, cam: A.cam, update(tl, d, t) { A.update(t, 1.5); O.reset(); O.root.position.set(0, 1.2, .4); rock(O, t); O.face('laugh');
    const p = handAt(O); bat.position.set(p.x, p.y + .15, p.z); bat.userData.fold(.9);
    sp.forEach((s, i) => { const an = i * .628 + t * 2.5; s.position.set(Math.cos(an) * 1.4, 2.6 + Math.sin(an) * 1.4, .6); s.scale.setScalar(.5 + Math.max(0, Math.sin(t * 12 + i * 2)) * 2); });
    sign.scale.setScalar(pop(tl - 1.03) * .85); look(A.cam, Math.sin(tl * 1.2) * 1.2, 2.3, 6.2 - tl * .6, 0, 2.6, .4); shake(A.cam, t, .012); } };
});
// 11: "He bit it." - flash cut on the bite, nothing gory shown
shot(25.27, 26.53, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = burst(scene, cam, 0xff3a5a, 0xa01a2a, 0xffe0a0), O = ozzy(scene), bat = makeBat(); scene.add(bat);
  const sign = hud(cam, makeSign('CHOMP!', '#ffffff', '#c8202a'), -.95), f = flashQuad(cam), B = .3;
  return { scene, cam, update(tl, d, t) { u.value = t * 2; O.reset(); const k = ss(0, B, tl); O.arms[1].rotation.x = lerp(-1.5, -2.0, k); O.arms[1].rotation.z = -.35 * k; O.face(tl > B ? 'laugh' : 'scream'); O.head.rotation.x = tl > B ? .25 : -.1;
    const p = handAt(O); bat.position.set(p.x * (1 - k) + .0 * k, lerp(p.y + .1, 1.78, k), lerp(p.z, .36, k)); bat.userData.fold(1); bat.visible = tl < B + .05;
    f.material.opacity = tl > B ? Math.exp(-(tl - B) * 6) : 0; sign.scale.setScalar(pop(tl - B) * 1.0); sign.rotation.z = -.1;
    look(cam, .1, 1.85, 1.7 * (tl > B ? punch(tl - B, -.2) : 1), 0, 1.82, 0); if (tl > B) shake(cam, t, .05 * Math.exp(-(tl - B) * 4)); } };
});
// 12: "Then he realized, rubber doesn't crunch."
shot(26.53, 29.8, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = swirl(scene, cam, 0x1a1a3a, 0x3a2a6a, 0x8a6aff), O = ozzy(scene), D = dynSign(cam, 1.25), drops = sweat(scene), C = 2.06;
  return { scene, cam, update(tl, d, t) { u.value = t * (tl > C ? 3 : 1); O.reset(); O.face(tl > C ? 'shocked' : tl > 1.3 ? 'worried' : 'confused'); O.head.rotation.z = tl > C ? 0 : .12; O.head.rotation.x = .05 + (tl < C ? Math.sin(t * 6) * .05 : 0);
    if (tl < C) D.draw('RUBBER = ?', '#ffffff', '#16120a', 17); else D.draw('CRUNCH', '#ffe21f', '#c8202a', 24); D.m.scale.setScalar((tl < C ? pop(tl - .4) : pop(tl - C) * 1.15) * .85); D.m.rotation.z = tl > C ? Math.sin(t * 40) * .04 : 0;
    sweatAt(drops, tl, 0, 2.0, .1, 2.4); drops.forEach(p => p.visible = tl > 1.3);
    look(cam, 0, 1.88, lerp(2.4, 1.6, ss(0, C, tl)) * (tl > C ? punch(tl - C, -.15) : 1), 0, 1.86, 0); if (tl > C) shake(cam, t, .03 * Math.exp(-(tl - C) * 3)); } };
});
// 13: "That bat was real."
shot(29.8, 31.63, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.8); const u = burst(scene, cam, 0xc8202a, 0x7a0a14, 0xffd0a0), O = ozzy(scene), bat = makeBat(); scene.add(bat); const sign = hud(cam, makeSign('IT WAS REAL', '#16120a', '#ffffff'));
  return { scene, cam, update(tl, d, t) { u.value = t * 1.6; O.reset(); O.root.position.set(-.45, 0, 0); O.root.rotation.y = .4; O.face('scream'); O.arms[0].rotation.x = O.arms[1].rotation.x = -.6; O.arms[0].rotation.z = .8; O.arms[1].rotation.z = -.8; O.body.position.y = Math.abs(Math.sin(t * 20)) * .02;
    bat.position.set(.65, 2.0 + Math.sin(t * 3) * .05, .3); bat.scale.setScalar(1.8 * pop(tl - .2)); bat.userData.fold(.5); bat.rotation.z = Math.sin(t * 2) * .2;
    sign.scale.setScalar(pop(tl - .55) * .85); look(cam, 0, 2.0, 4.0 * punch(tl, .15), 0, 1.9, 0); } };
});
// 14: "A 17 year old fan had brought it to the show."
shot(31.63, 35.15, () => {
  const A = arena({ rows: 5, per: 12 }), F = palms(makeHuman(FAN), FAN.skin); F.root.scale.setScalar(.95); A.scene.add(F.root); const bx = new THREE.Group(); bx.add(box(.5, .26, .34, mat({ color: 0x8a6238 }))); bx.add(box(.52, .06, .36, mat({ color: 0x6a4a28 }), 0, .15, 0)); A.scene.add(bx);
  const D = dynSign(A.cam, 1.25);
  return { scene: A.scene, cam: A.cam, update(tl, d, t) { A.update(t, .8); F.reset(); F.root.position.set(.2, 0, 5.4); F.root.rotation.y = Math.PI + .4; F.face(tl > 1.6 ? 'sly' : 'happy'); F.arms[0].rotation.x = F.arms[1].rotation.x = -.75; F.arms[0].rotation.z = -.3; F.arms[1].rotation.z = .3;
    const p = handAt(F, 0), q = handAt(F, 1); bx.position.set((p.x + q.x) / 2, (p.y + q.y) / 2 + .1, (p.z + q.z) / 2); bx.rotation.y = F.root.rotation.y; bx.scale.setScalar(.7);
    if (tl < 1.5) D.draw('17 YEARS OLD', '#ffe21f', '#16120a', 15); else D.draw('BROUGHT A BAT', '#ff3a5a', '#ffffff', 13); D.m.scale.setScalar(pop(tl - .1) * .85 * (tl > 1.5 ? pop(tl - 1.5) : 1));
    look(A.cam, -.8, 2.0, 3.1 + tl * .1, .25, 1.5, 5.4); } };
});
// 15: "After the concert, Ozzy was rushed" - ambulance through the night
shot(35.15, 37.25, () => {
  const S = street(), scene = S.scene, cam = newCam(); scene.add(cam); scene.background = new THREE.Color(0x0a0e28); scene.children.forEach(c => { if (c.isLight) c.intensity *= .35; });
  const amb = new THREE.Group(), wm = mat({ color: 0xf2f2f2 }); amb.add(box(1.6, 1.5, 3.2, wm, 0, 1.05, 0)); amb.add(box(1.6, 1.0, 1.0, wm, 0, .8, 2.05)); amb.add(box(1.62, .2, 4.25, mat({ color: 0xd8262a }), 0, 1.0, .5)); amb.add(box(1.4, .45, .05, bmat({ color: 0x4a6a8a }), 0, 1.1, 2.56));
  const lr = box(.4, .14, .2, bmat({ color: 0xff2a2a }), -.35, 1.88, .8), lb = box(.4, .14, .2, bmat({ color: 0x2a6aff }), .35, 1.88, .8); amb.add(lr, lb); for (const [x, z] of [[-.8, 1.6], [.8, 1.6], [-.8, -1.0], [.8, -1.0]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .2, 8), mat({ color: 0x111111 })); w.rotation.z = Math.PI / 2; w.position.set(x, .35, z); amb.add(w); }
  const pl = new THREE.PointLight(0xff2a2a, 12, 8); amb.add(pl); pl.position.set(0, 2.4, .8); scene.add(amb);
  const sign = hud(cam, makeSign('HOSPITAL!', '#ffffff', '#c8202a'));
  return { scene, cam, update(tl, d, t) { const z = 4 - tl * 9; amb.position.set(0, 0, z); amb.rotation.y = Math.PI; const on = Math.floor(t * 8) % 2; lr.material.color.setHex(on ? 0xff2a2a : 0x401010); lb.material.color.setHex(on ? 0x102040 : 0x2a6aff); pl.color.setHex(on ? 0xff2a2a : 0x2a6aff);
    sign.scale.setScalar(pop(tl - 1.3) * .85); look(cam, 3.6, 2.3, z - 6.5 + tl * 1.2, 0, 1.0, z); } };
});
// 16: "to the hospital for rabies shots."
shot(37.25, 40.9, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0xcfe8e0); lights(scene, 2.2, 1.6); scene.add(cam);
  const tileH = ctex(32, 32, g => { for (let y = 0; y < 32; y += 8) for (let x = 0; x < 32; x += 8) { g.fillStyle = (x + y) % 16 ? '#e8ece8' : '#c8d8d0'; g.fillRect(x, y, 8, 8); } noise(g, 32, 32, 8, 3); }, [8, 8]);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), mat({ map: tileH })); fl.rotation.x = -Math.PI / 2; scene.add(fl); scene.add(box(12, 5, .2, mat({ color: 0xbfe0d4 }), 0, 2.5, -2)); scene.add(box(12, .5, .22, mat({ color: 0x7ab0a0 }), 0, .25, -1.98));
  const bed = new THREE.Group(); bed.add(box(1.2, .5, 2.4, mat({ color: 0xd8dce4 }), 0, .45, 0)); bed.add(box(1.15, .2, 2.35, mat({ color: 0xffffff }), 0, .8, 0)); bed.add(box(1.2, .9, .08, mat({ color: 0x8a909c }), 0, .9, -1.2)); bed.add(box(.9, .14, .45, mat({ color: 0xf6f6f6 }), 0, .95, -.9)); scene.add(bed);
  const iv = new THREE.Group(); iv.add(box(.05, 2.2, .05, mat({ color: 0x9aa0aa }), 0, 1.1, 0)); iv.add(box(.3, .4, .1, bmat({ color: 0xbfe6ff }), 0, 2.0, 0)); iv.position.set(-.95, 0, -.8); scene.add(iv);
  const O = ozzy(scene), syr = makeSyringe(1.6); scene.add(syr); const sign = hud(cam, makeSign('RABIES SHOTS', '#ffe21f', '#16120a')), drops = sweat(scene), S0 = 1.31;
  return { scene, cam, update(tl, d, t) { O.reset(); O.root.position.set(0, .9, .35); O.root.rotation.x = -Math.PI / 2 + .35; O.root.position.z = 1.1; O.face(tl > S0 + .5 ? 'scream' : 'worried'); O.arms[1].rotation.z = -.25;
    const k = ss(S0, S0 + .6, tl), p = handAt(O); syr.position.set(lerp(1.8, p.x + .35, k), lerp(2.6, 1.55, k) + Math.sin(t * 5) * .03 * (1 - k), lerp(.8, .5, k)); syr.rotation.z = lerp(.4, .9, k);
    sweatAt(drops, tl, 0, 1.75, -.5, 2.6); sign.scale.setScalar(pop(tl - S0) * .85); look(cam, 1.7, 2.7, 1.9 * punch(tl, .08), 0, 1.3, -.2); if (tl > S0 + .5) shake(cam, t, .02 * Math.exp(-(tl - S0 - .5) * 3)); } };
});
// 17: "And he had to keep getting them on tour." - tour bus, shots keep coming
shot(40.9, 43.53, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.0, 1.8); scene.add(cam);
  scene.background = ctex(4, 64, g => { const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#2a1a5a'); gr.addColorStop(.6, '#d8507a'); gr.addColorStop(1, '#ffb060'); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); });
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat({ color: 0x4a6a3a })); gr.rotation.x = -Math.PI / 2; scene.add(gr); scene.add(box(4, .03, 200, mat({ color: 0x3a3a40 }), 0, .02, 0));
  const dashes = [...Array(20)].map((_, i) => { const m = box(.12, .04, 1.2, bmat({ color: 0xf2e9a0 }), 0, .04, 0); m.userData = i; scene.add(m); return m; });
  const posts = [...Array(12)].map((_, i) => { const g = new THREE.Group(); g.add(box(.12, 2.4, .12, mat({ color: 0x5a3a22 }), 0, 1.2, 0)); g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), mat({ color: 0x2f6a3a }))); g.children[1].position.y = 2.8; g.userData = i; scene.add(g); return g; });
  const bus = new THREE.Group(), bm = mat({ color: 0x1a1a24 }); bus.add(box(2.2, 2.3, 7, bm, 0, 1.55, 0)); bus.add(box(2.24, .5, 6.4, bmat({ color: 0x40507a }), 0, 2.1, -.2)); bus.add(box(2.25, .14, 7.05, mat({ color: 0xb04ad8 }), 0, 1.0, 0)); bus.add(box(1.9, .8, .05, bmat({ color: 0x5a6a9a }), 0, 2.0, 3.51));
  const wheels = []; for (const [x, z] of [[-1.05, 2.4], [1.05, 2.4], [-1.05, -2.3], [1.05, -2.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .2, 8), mat({ color: 0x111111 })); w.rotation.z = Math.PI / 2; w.position.set(x, .45, z); bus.add(w); wheels.push(w); } bus.position.x = -.9; scene.add(bus);
  const tour = makeSign('ON TOUR', '#ffe21f', '#16120a'); tour.position.set(1.12, 1.55, 0); tour.rotation.y = Math.PI / 2; tour.scale.setScalar(1.5); bus.add(tour);
  const syrs = [0, 1, 2, 3].map(i => { const s = makeSyringe(.8); s.rotation.z = .5; scene.add(s); return s; }), sign = hud(cam, makeSign('MORE SHOTS', '#ff3a5a', '#ffffff'));
  return { scene, cam, update(tl, d, t) { const sp = 14; dashes.forEach(m => { m.position.z = 30 - ((m.userData * 4 + t * sp) % 80); }); posts.forEach(g => { g.position.set(g.userData % 2 ? 4 : -5, 0, 30 - ((g.userData * 7 + t * sp) % 84)); }); wheels.forEach(w => w.rotation.x = -t * 20); bus.position.y = Math.abs(Math.sin(t * 9)) * .03;
    syrs.forEach((s, i) => { const k = pop(tl - .3 - i * .45); s.position.set(-2.1 + i * 1.0, 4.3 + Math.sin(t * 3 + i) * .1, 0); s.scale.setScalar(.8 * k); s.rotation.y = t * 2 + i; });
    sign.scale.setScalar(pop(tl - 1.5) * .85); look(cam, 5.5, 3.0, 8 - tl * .5, -.5, 2.4, -1); } };
});
// 18: "But here's the crazy part."
shot(43.53, 45.64, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = swirl(scene, cam, 0x3a1a8a, 0x8a2fd0, 0xff7ad0), O = ozzy(scene), sign = hud(cam, makeSign('CRAZY PART', '#ffe21f', '#16120a'));
  const qs = [...Array(5)].map((_, i) => { const q = makeSign(i % 2 ? '!' : '?', '#ffe21f', '#16120a'); q.scale.set(.3, .65, 1); q.userData = i; scene.add(q); return q; });
  return { scene, cam, update(tl, d, t) { u.value = t * 1.5; O.reset(); O.face('sly'); O.arms[1].rotation.x = -1.4; O.arms[1].rotation.z = .3; O.head.rotation.z = -.1;
    qs.forEach(q => { const i = q.userData, k = pop(tl - .2 - i * .1); q.position.set(-.9 + i * .45, 2.6 + (i % 2) * .35 + Math.sin(t * 3 + i) * .08, -.3); q.rotation.z = Math.sin(t * 4 + i) * .2; q.scale.set(.3 * k, .65 * k, 1); });
    sign.scale.setScalar(pop(tl - .5) * .85); look(cam, 0, 1.8, 4.0 * punch(tl, .15), 0, 1.75, 0); } };
});
// 19: "It wasn't even his first time."
shot(45.64, 48.02, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.9); const u = burst(scene, cam, 0xffd21f, 0xff9a1f, 0xfff6c0), O = ozzy(scene), D = dynSign(cam, 1.25), sp = sparkles(scene, 8, 0xffffff, .07);
  return { scene, cam, update(tl, d, t) { u.value = t * 1.3; O.reset(); O.face(tl > .9 ? 'laugh' : 'sly'); shrug(O, ss(.0, .3, tl)); if (tl > .9) O.body.position.y += Math.abs(Math.sin(t * 14)) * .04;
    D.draw(tl < .93 ? 'NOT EVEN...' : 'HIS 1ST TIME?', '#16120a', '#ffe21f', 14); D.m.scale.setScalar(pop(tl - .1) * .85 * (tl > .93 ? pop(tl - .93) : 1));
    sp.forEach((s, i) => { const an = i * .785 + t * 2; s.position.set(Math.cos(an) * 1.2, 1.8 + Math.sin(an) * 1.3, .5); s.scale.setScalar(.5 + Math.max(0, Math.sin(t * 10 + i * 2)) * 2); });
    look(cam, 0, 1.8, 4.2 * punch(tl, .15), 0, 1.7, 0); } };
});
// 20: "The year before, he bit the head off a dove in a meeting with record bosses."
shot(48.02, 53.12, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x7fb0e8); lights(scene, 2.1, 1.7); scene.add(cam);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat({ color: 0x6a2a2a })); carpet.rotation.x = -Math.PI / 2; scene.add(carpet);
  const winT = ctex(64, 32, g => { const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, '#5a9ae8'); gr.addColorStop(1, '#bfe0ff'); g.fillStyle = gr; g.fillRect(0, 0, 64, 32); const r = rng(3); for (let x = 0; x < 64; x += 5) { const h = 8 + r() * 18; g.fillStyle = ['#4a5a7a', '#5a6a8a', '#3a4a6a'][x % 3]; g.fillRect(x, 32 - h, 4, h); g.fillStyle = '#f2d680'; for (let y = 32 - h + 2; y < 31; y += 3) g.fillRect(x + 1, y, 1, 1); } });
  scene.add(box(12, 4.5, .2, mat({ color: 0xd8c8a8 }), 0, 2.25, -3)); const win = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.6), bmat({ map: winT })); win.position.set(0, 2.5, -2.88); scene.add(win);
  scene.add(box(1.5, .07, 4.6, mat({ color: 0x5a3418 }), 0, .78, .2)); for (const [x, z] of [[-.6, -1.9], [.6, -1.9], [-.6, 2.3], [.6, 2.3]]) scene.add(box(.08, .76, .08, mat({ color: 0x3a2210 }), x, .38, z));
  const gold = makeSign('RECORD CO.', '#e8b82a', '#16120a'); gold.position.set(0, 3.9, -2.85); gold.scale.setScalar(.9); scene.add(gold);
  const bosses = SUIT.concat([SUIT[0]]).map((p, i) => { const h = makeHuman(p); scene.add(h.root); return h; }), seats = [[-1.25, -.9, Math.PI / 2], [-1.25, .7, Math.PI / 2], [1.25, -.9, -Math.PI / 2], [1.25, .7, -Math.PI / 2]];
  const O = ozzy(scene), dove = makeDove(); scene.add(dove); const fs = feathers(scene, 18), f = flashQuad(cam), D = dynSign(cam, 1.25), L = 1.35, B = 1.6;
  return { scene, cam, update(tl, d, t) {
    bosses.forEach((h, i) => { const [x, z, ry] = seats[i]; h.reset(); h.root.position.set(x, -.21, z); h.root.rotation.y = ry; h.legs[0].rotation.x = h.legs[1].rotation.x = -1.5; h.arms[0].rotation.x = h.arms[1].rotation.x = -1.1; h.face(tl > B + .1 ? (i % 2 ? 'scream' : 'shocked') : 'neutral'); if (tl > B + .1) { h.body.rotation.x = -.25; h.arms[0].rotation.x = h.arms[1].rotation.x = -2.4; } });
    O.reset(); O.root.position.set(0, 0, 2.95); O.root.rotation.y = Math.PI; O.face(tl > B ? 'laugh' : 'sly'); const k = ss(L, B, tl); O.arms[1].rotation.x = lerp(-1.3, -2.0, k); O.arms[1].rotation.z = -.3 * k;
    const p = handAt(O), fly = clamp((tl - .2) / (L - .2)); if (tl < L) { dove.position.set(lerp(-3.5, p.x, fly), lerp(3.3, p.y + .1, fly) + Math.sin(fly * Math.PI) * .5, lerp(-1.5, p.z, fly)); dove.rotation.y = -Math.PI / 2 - .5 + fly * .5; dove.userData.flap(t * 22); } else { dove.position.set(lerp(p.x, 0, k), lerp(p.y + .1, 1.78, k), lerp(p.z, 2.95 - .36, k)); dove.rotation.y = Math.PI; dove.userData.flap(t * 30, .4); }
    dove.visible = tl < B + .03; feathersAt(fs, tl - B, 0, 1.8, 2.6); f.material.opacity = tl > B ? Math.exp(-(tl - B) * 6) * .85 : 0;
    if (tl < 1.4) D.draw('1981', '#ffe21f', '#16120a', 22); else if (tl < 3.3) D.draw('A DOVE?!', '#ffffff', '#c8202a', 20); else D.draw('RECORD BOSSES', '#e8b82a', '#16120a', 12);
    D.m.scale.setScalar(pop(tl - .05) * .85 * (tl > 3.3 ? pop(tl - 3.3) : tl > 1.4 ? pop(tl - 1.4) : 1));
    look(cam, 2.6 - tl * .12, 2.6, 5.4 - tl * .22, -.2, 1.5, 1.2); if (tl > B) shake(cam, t, .03 * Math.exp(-(tl - B) * 4));
  } };
});
shot(53.12, DUR + .1, sHook(true));
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
