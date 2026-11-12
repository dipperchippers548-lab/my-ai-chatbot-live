// "The Pilot Who Got Sucked Out Of The Window" - PS1-style low-poly short, rendered frame by frame.
// (engine section shared with ../invisible-short)
import * as THREE from '/node_modules/three/build/three.module.js';

const W = 270, H = 480, SCALE = 4, FPS = 30, DUR = 55.224;
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

// ---------- pilot short: models and sets ----------
Object.assign(EXPR, {
  determined: { open: .78, browIn: -2.6, browOut: 1.6, mouth: 'frown' },
  frozen: { open: 1.45, browIn: 2, browOut: 2, pupil: .45, mouth: 'neutral' },
  weak: { open: .42, browIn: 2.5, browOut: 0, mouth: 'neutral' },
});
const CAPT = { skin: 0xe2ab86, hair: 0x7a6a58, top: 0xf4f4f4, pants: 0x1a2038, topStyle: 'uniform', iris: '#4a6a8a', shoes: 0x111111, hairH: .1 };
const CAPT_HAT = { ...CAPT, cap: true };
const FO = { skin: 0xe8b89a, hair: 0x2a2018, top: 0xf4f4f4, pants: 0x1a2038, topStyle: 'uniform', iris: '#5a3a1a', shoes: 0x111111, hairH: .12 };
const ATT1 = { skin: 0xe6b592, hair: 0xb07a3a, top: 0x7fb0e6, pants: 0x1a2038, topStyle: 'suit', iris: '#3a6a4a', shoes: 0x111111, hairH: .14 };
const ATT2 = { skin: 0x8a5a3c, hair: 0x15110f, top: 0x7fb0e6, pants: 0x1a2038, topStyle: 'suit', iris: '#3a2416', shoes: 0x111111, hairH: .1, lip: '#7a3f38' };
const ATT3 = { skin: 0xf0c9a8, hair: 0x8a2a1a, top: 0x7fb0e6, pants: 0x1a2038, topStyle: 'suit', mustache: true, shoes: 0x111111, hairH: .12 };
const MEDIC = { skin: 0xd9a07a, hair: 0x2a2018, top: 0xd8e21f, pants: 0x2f6a4a, topStyle: 'coat', shoes: 0x111111, hairH: .1 };
const MEDIC2 = { ...MEDIC, skin: 0xf0c9a8, hair: 0xd8b040, hairH: .28, lip: '#c0304a' };
const DOC = { skin: 0xe8b89a, hair: 0x6a4a2a, top: 0xf2f2f2, pants: 0x5a8a9a, topStyle: 'coat', hairH: .12, glasses: true, shoes: 0xf0f0f0 };
const ICE = 0x9fd0ff, BLUE = 0x4f86e0;
const hud = (cam, sign, y = 1.22, z = -4) => { cam.add(sign); sign.position.set(0, y, z); sign.material.depthTest = false; sign.material.transparent = true; sign.renderOrder = 999; return sign; };
const hudFlash = cam => { const f = new THREE.Mesh(new THREE.PlaneGeometry(6, 9), bmat({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false })); f.renderOrder = 998; cam.add(f); f.position.z = -3.5; return f; };
const dynTex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return { g, t }; };
function dynSign(cam, y = 1.22) { const D = dynTex(96, 40), m = hud(cam, new THREE.Mesh(new THREE.PlaneGeometry(1.9, .8), bmat({ map: D.t })), y); return { m, draw(text, bg = '#ffe21f', fg = '#16120a', px = 17) { const g = D.g; g.fillStyle = '#16120a'; g.fillRect(0, 0, 96, 40); g.fillStyle = bg; g.fillRect(3, 3, 90, 34); g.fillStyle = fg; g.font = 'bold ' + px + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 48, 21); D.t.needsUpdate = true; } }; }
const skyHi = ctex(8, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#1238a8'); gr.addColorStop(.55, '#3f8ae8'); gr.addColorStop(1, '#bfe4ff'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); });
const fieldT = ctex(64, 64, g => { const r = rng(88); for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { g.fillStyle = ['#6fa05a', '#8fb06a', '#5a9048', '#a8b070', '#7f9a60'][r() * 5 | 0]; g.fillRect(x, y, 16, 16); } g.fillStyle = '#5a6a52'; for (let k = 0; k < 64; k += 16) { g.fillRect(k, 0, 1, 64); g.fillRect(0, k, 64, 1); } noise(g, 64, 64, 12, 90); }, [10, 10]);
const grassT = ctex(32, 32, g => { g.fillStyle = '#5aa63c'; g.fillRect(0, 0, 32, 32); const r = rng(4); for (let i = 0; i < 150; i++) { g.fillStyle = r() < .5 ? '#4a9230' : '#6fba4a'; g.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 2); } noise(g, 32, 32, 18, 8); }, [40, 40]);
function epaulettes(h) { for (const s of [-1, 1]) { h.body.add(box(.2, .035, .24, mat({ color: 0x10182e }), s * .34, 1.545, 0)); for (let i = 0; i < 3; i++) h.body.add(box(.2, .04, .03, mat({ color: 0xe8c33a }), s * .34, 1.55, -.08 + i * .07)); } return h; }
function headset(h, hairH = .12) { const b = mat({ color: 0x16161a }); h.head.add(box(.52, .05, .1, b, 0, .55 + hairH, 0)); for (const s of [-1, 1]) h.head.add(box(.07, .22, .17, b, s * .26, .32, 0)); h.head.add(box(.03, .03, .24, b, .25, .16, .13)); h.head.add(box(.06, .05, .05, b, .2, .13, .26)); return h; }
// streaming clouds, wind streaks, snow
function makeStream(scene, n, seed = 5, xmin = 4.5) { const r = rng(seed), m = mat({ color: 0xffffff }); return [...Array(n)].map(() => { const g = new THREE.Group(); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), m); b.scale.set(1.6 + r(), .55 + r() * .3, 1.2 + r()); b.position.set((k - 1) * 1.3, r() * .3, r() * .6); g.add(b); } g.userData = { x: (r() < .5 ? -1 : 1) * (xmin + r() * 22), y: r() * 22 - 14, z: r() * 80, s: .8 + r() * 1.6 }; scene.add(g); return g; }); }
const streamAt = (cl, off, yoff = 0) => cl.forEach(c => { const u = c.userData; c.position.set(u.x, ((u.y - yoff) % 22 + 22) % 22 - 14, 25 - ((u.z + off) % 80 + 80) % 80); c.scale.setScalar(u.s); });
function makeLines(scene, n, len = 2.2, color = 0xffffff) { const r = rng(n * 5); return [...Array(n)].map((_, i) => { const l = box(.035, .035, len, bmat({ color })); l.userData = { a: r(), x: (r() - .5) * 2, y: (r() - .5) * 2 }; scene.add(l); return l; }); }
const linesAt = (ls, t, cx, cy, cz, spread = 2.4, rate = 2.6, on = true) => ls.forEach(l => { const u = l.userData, q = (t * rate + u.a) % 1; l.visible = on; l.position.set(cx + u.x * spread, cy + u.y * spread * .8, cz + 7 - q * 14); });
// the jet (flies toward +z; the captain's window is on the aircraft's left, +x)
const NOSE = [1.6, 1.6, 2.0];
function onNose(x, z) { const y = NOSE[1] * Math.sqrt(Math.max(.0001, 1 - (x / NOSE[0]) ** 2 - (z / NOSE[2]) ** 2)); return { p: new THREE.Vector3(x, y, z), n: new THREE.Vector3(x / NOSE[0] ** 2, y / NOSE[1] ** 2, z / NOSE[2] ** 2).normalize() }; }
function makeJet() {
  const g = new THREE.Group(), white = mat({ color: 0xe9ecf2 }), blue = mat({ color: 0x1b2f6b }), red = mat({ color: 0xd8242a }), grey = mat({ color: 0x8a9096 }), glass = bmat({ color: 0x1a2a4a });
  const fu = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 16, 12, 1, true), white); fu.rotation.x = Math.PI / 2; fu.position.z = -8; g.add(fu);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI), white); nose.scale.set(...NOSE); g.add(nose);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 12), white); tail.rotation.x = -Math.PI / 2; tail.position.z = -17.7; g.add(tail);
  for (const s of [-1, 1]) {
    g.add(box(.05, .34, 16.6, blue, s * 1.575, -.25, -8)); g.add(box(.05, .13, 16.6, red, s * 1.5, -.56, -8)); g.add(box(.05, .16, 12.5, glass, s * 1.585, .28, -8.3));
    const w = box(6.8, .2, 2.5, white, s * 4.3, -.75, -9.0); w.rotation.y = s * .32; g.add(w);
    const e = new THREE.Mesh(new THREE.CylinderGeometry(.55, .5, 2.8, 8), grey); e.rotation.x = Math.PI / 2; e.position.set(s * 2.1, .4, -13.4); g.add(e); g.add(box(.7, .14, 1.4, white, s * 1.65, .4, -13.4));
  }
  const fin = box(.22, 3.2, 2.6, blue, 0, 3.0, -15.8); fin.rotation.x = -.3; g.add(fin); g.add(box(5.4, .16, 1.5, white, 0, 4.55, -16.6));
  const gC = bmat({ color: 0x1a2a4a });
  const pane = (x, z, w, h, m) => { const { p, n } = onNose(x, z), o = new THREE.Group(); o.position.copy(p).addScaledVector(n, .012); o.lookAt(p.clone().add(n)); o.add(new THREE.Mesh(new THREE.PlaneGeometry(w + .1, h + .1), bmat({ color: 0xa8aeb8 }))); const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); gl.position.z = .006; o.add(gl); g.add(o); return o; };
  const capPane = pane(.46, 1.4, .8, .6, gC); pane(-.46, 1.4, .8, .6, glass); pane(1.08, .95, .62, .5, glass); pane(-1.08, .95, .62, .5, glass);
  const gear = new THREE.Group(), tire = mat({ color: 0x16161a }); for (const [x, z] of [[0, -.6], [-1.5, -9.3], [1.5, -9.3]]) { gear.add(box(.12, 1.0, .12, grey, x, -2.0, z)); for (const k of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .16, 8), tire); w.rotation.z = Math.PI / 2; w.position.set(x + k * .16, -2.5, z); gear.add(w); } } gear.visible = false; g.add(gear);
  const { p, n } = onNose(.46, 1.4), W = new THREE.Group(), cap = epaulettes(makeHuman(CAPT)); W.position.copy(p).addScaledVector(n, .17); W.rotation.x = -.862; cap.root.position.y = -.84; W.add(cap.root); cap.legs.forEach(l => l.visible = false); g.add(W);
  const J = { g, W, cap, gear, GY: 2.86,
    pose(t, out = 1, face = 'scream', flail = 1) {
      W.visible = out > 0; gC.color.setHex(out > 0 ? 0x05060a : 0x1a2a4a); cap.reset(); cap.face(face);
      cap.arms[0].rotation.z = -2.3 + Math.sin(t * 17) * .45 * flail; cap.arms[1].rotation.z = 2.3 + Math.sin(t * 15 + 1) * .45 * flail; cap.arms[0].rotation.x = Math.sin(t * 11) * .3 * flail; cap.arms[1].rotation.x = Math.sin(t * 12 + 2) * .3 * flail;
      cap.head.rotation.z = Math.sin(t * 9) * .08 * flail; W.rotation.z = Math.sin(t * 13) * .04 * flail;
    },
    facePoint(dist) { g.updateMatrixWorld(true); return cap.head.localToWorld(new THREE.Vector3(0, .28, dist)); } };
  return J;
}
function ext() {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = skyHi; lights(scene, 2.1, 2.0); scene.add(cam);
  const J = makeJet(); scene.add(J.g); const clouds = makeStream(scene, 16), lines = makeLines(scene, 12);
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), mat({ map: fieldT })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -48; scene.add(gnd);
  return { scene, cam, J, clouds, lines, gnd, fly(t, out = 1, face = 'scream', flail = 1, speed = 26) { streamAt(clouds, t * speed); linesAt(lines, t, .3, 1.7, 0); J.g.position.y = Math.sin(t * 1.7) * .06; J.g.rotation.z = Math.sin(t * 1.3) * .015; J.pose(t, out, face, flail); } };
}
// the cockpit interior (same directions: forward is +z, captain's seat at +x)
const CXS = .72, HOLE = [CXS + .03, 1.81, 1.5], HOLD = [.45, .35, .25];
const panelT = ctex(64, 16, g => { g.fillStyle = '#1a1d28'; g.fillRect(0, 0, 64, 16); const r = rng(7); for (let i = 0; i < 22; i++) { g.fillStyle = ['#3aff6a', '#ffd21f', '#ff3a3a', '#7ae0ff'][r() * 4 | 0]; g.fillRect(1 + r() * 62 | 0, 1 + r() * 14 | 0, 1, 1); } for (const x of [6, 17, 28, 39, 50, 59]) { g.strokeStyle = '#c9ced6'; g.beginPath(); g.arc(x, 8, 3.5, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 2, 6); g.stroke(); } });
function cabin(opts = {}) {
  const scene = new THREE.Scene(), cam = newCam(opts.fov || 60); scene.background = skyHi; lights(scene, opts.dim ? 1.2 : 2.0, opts.dim ? .9 : 1.6); scene.add(cam);
  const wall = mat({ color: 0x9096a6 }), dark = mat({ color: 0x2a2e3a }), seatM = mat({ color: 0x3a4a7a }), glassM = mat({ color: 0xbfe6ff, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide }), lever = mat({ color: 0xc9ced6 });
  const add = m => { scene.add(m); return m; };
  add(box(3.2, .1, 3.9, mat({ color: 0x3a3d4a }), 0, -.05, -.45)); add(box(3.2, .1, 3.9, wall, 0, 2.65, -.45));
  for (const s of [-1, 1]) {
    add(box(.1, 1.32, 3.9, wall, s * 1.55, .66, -.45)); add(box(.1, .4, 3.9, wall, s * 1.55, 2.4, -.45)); add(box(.1, .88, 2.5, wall, s * 1.55, 1.76, -1.15)); add(box(.1, .88, .12, wall, s * 1.55, 1.76, 1.46));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .88), glassM); sg.rotation.y = Math.PI / 2; sg.position.set(s * 1.55, 1.76, .75); add(sg);
    add(box(1.0, 2.6, .1, wall, s * 1.05, 1.3, -2.4));
    add(box(.66, .45, .66, seatM, s * CXS, .225, -.35)); add(box(.66, 1.15, .14, seatM, s * CXS, 1.0, -.72)); add(box(.4, .3, .14, seatM, s * CXS, 1.72, -.72));
    add(box(.07, .75, .07, dark, s * CXS, .55, .62)); add(box(.46, .07, .07, dark, s * CXS, .98, .58)); for (const k of [-1, 1]) add(box(.07, .2, .07, dark, s * CXS + k * .2, 1.05, .58));
    add(box(.1, 2.6, 2.4, mat({ color: 0x4a5270 }), s * .62, 1.3, -3.65));
  }
  add(box(1.1, .5, .1, wall, 0, 2.35, -2.4)); add(box(1.4, 2.6, .1, mat({ color: 0x2a3050 }), 0, 1.3, -4.9)); add(box(1.4, .1, 2.4, mat({ color: 0x3a3d4a }), 0, -.05, -3.65)); add(box(1.4, .1, 2.4, wall, 0, 2.65, -3.65));
  const door = new THREE.Group(); door.position.set(-.54, 0, -2.4); door.add(box(1.08, 2.1, .07, mat({ color: 0x6a7288 }), .54, 1.05, 0)); door.add(box(.08, .08, .1, mat({ color: 0xd8a83a }), .95, 1.05, .06)); add(door);
  add(box(3.0, 1.25, .55, dark, 0, .625, 1.22)); const pan = new THREE.Mesh(new THREE.PlaneGeometry(2.9, .75), bmat({ map: panelT })); pan.rotation.y = Math.PI; pan.position.set(0, .82, .94); add(pan);
  add(box(3.0, .07, .8, dark, 0, 1.285, 1.1)); add(box(.42, .5, .7, dark, 0, .25, .55)); add(box(.06, .22, .06, lever, -.08, .6, .5)); add(box(.06, .22, .06, lever, .08, .6, .5));
  add(box(3.1, .35, .14, wall, 0, 2.475, 1.5)); add(box(.12, 1.0, .12, wall, 0, 1.81, 1.5));
  const paneC = add(new THREE.Mesh(new THREE.PlaneGeometry(1.36, .98), glassM)); paneC.position.set(.75, 1.81, 1.5);
  const paneF = add(new THREE.Mesh(new THREE.PlaneGeometry(1.36, .98), glassM)); paneF.position.set(-.75, 1.81, 1.5);
  const clouds = makeStream(scene, 12, 7, 5);
  return { scene, cam, paneC, paneF, door, clouds };
}
const sit = (h, s) => { h.reset(); h.root.position.set(s * CXS, -.35, -.33); h.root.rotation.set(0, 0, 0); h.legs[0].rotation.x = h.legs[1].rotation.x = -1.5; h.arms[0].rotation.x = h.arms[1].rotation.x = -1.1; };
function makeFO(scene) { const h = headset(epaulettes(makeHuman(FO))); scene.add(h.root); return { h, pose(t, face = 'determined', work = 0) { sit(h, -1); h.face(face); h.arms[0].rotation.x = -1.15 + Math.sin(t * 9) * .08 * work; h.arms[1].rotation.x = -1.15 - Math.sin(t * 9) * .08 * work; h.body.rotation.z = Math.sin(t * 7) * .03 * work; h.head.rotation.z = Math.sin(t * 13) * .03 * work; } }; }
// the captain inside: k = 0 in his seat, k = 1 halfway out of the windscreen with only his legs inside
function makeCapIn(scene, p = CAPT) {
  const W = new THREE.Group(), h = epaulettes(makeHuman(p)); h.root.position.y = -.84; W.add(h.root); scene.add(W);
  return { W, h, set(k, t = 0, kick = 1) { h.reset(); W.position.set(CXS + .03 * k, lerp(.49, 1.95, k), lerp(-.33, 1.55, k)); W.rotation.x = lerp(0, .6435, k); const lg = lerp(-1.5, .08, k); h.legs[0].rotation.x = lg + Math.sin(t * 14) * .4 * k * kick; h.legs[1].rotation.x = lg - Math.sin(t * 14) * .4 * k * kick; h.arms[0].rotation.x = h.arms[1].rotation.x = lerp(-1.1, -2.8, k); } };
}
function makePapers(scene, n) { const r = rng(n + 9); return [...Array(n)].map(() => { const p = box(.16, .2, .005, bmat({ color: 0xffffff })); p.userData = { a: r(), x: (r() - .5) * 2.4, y: .6 + r() * 1.6, z: -2.2 + r() * 2.2, rx: r() * 6, ry: r() * 6 }; p.visible = false; scene.add(p); return p; }); }
const papersAt = (ps, t, rate = 1.6, on = true) => ps.forEach(p => { const u = p.userData, q = (t * rate + u.a) % 1; p.visible = on; p.position.set(lerp(u.x, HOLE[0], q * q), lerp(u.y, HOLE[1], q), lerp(u.z, HOLE[2] + .3, q)); p.rotation.set(u.rx + t * 9, u.ry + t * 7, 0); p.scale.setScalar(1 - q * .6); });
// crew holding on: idx 0 holds the legs, the others hold the person in front
const CHAIN = [[.45, .35, .25], [.2, -.5, .3], [.05, -1.3, .15]];
function holdPose(h, slot, t, face = 'determined', strain = 1) { const c = CHAIN[slot]; h.reset(); h.face(face); h.root.position.set(c[0], 0, c[1]); h.root.rotation.y = c[2]; const ax = slot ? -1.3 : -1.95; h.arms[0].rotation.x = h.arms[1].rotation.x = ax + Math.sin(t * 21 + slot) * .04 * strain; h.body.rotation.x = -.1 * strain + Math.sin(t * 23 + slot) * .015 * strain; h.head.rotation.x = slot ? 0 : -.3; }
function airport() {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = skyTex; lights(scene, 2.0, 2.0); scene.add(cam);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), mat({ map: grassT })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  scene.add(box(16, .04, 360, mat({ color: 0x55585e }), 0, .02, 0)); for (let z = -170; z < 170; z += 9) scene.add(box(.4, .05, 4.5, mat({ color: 0xf2f2f2 }), 0, .045, z)); for (const s of [-1, 1]) scene.add(box(.3, .05, 360, mat({ color: 0xf2f2f2 }), s * 7.4, .045, 0));
  scene.add(box(34, 6, 10, mat({ map: FAC[2] }), 30, 3, 20)); scene.add(box(2.6, 15, 2.6, mat({ color: 0xc9ced6 }), 22, 7.5, -12)); scene.add(box(4.6, 2.6, 4.6, mat({ color: 0x1a2a4a }), 22, 16, -12)); scene.add(box(5, .4, 5, mat({ color: 0xc9ced6 }), 22, 17.5, -12)); scene.add(box(20, 8, 14, mat({ color: 0x9aa0a8 }), 34, 4, -40));
  const J = makeJet(); J.gear.visible = true; scene.add(J.g);
  const trucks = [0, 1].map(i => { const g = new THREE.Group(), red = mat({ color: 0xd82a1e }); g.add(box(1.5, 1.3, 3.4, red, 0, 1.15, 0)); g.add(box(1.5, 1.0, 1.1, red, 0, 1.0, 2.2)); g.add(box(1.3, .5, .06, mat({ color: 0xbfe6ff }), 0, 1.2, 2.77)); g.add(box(.3, 2.6, .2, mat({ color: 0xc9ced6 }), 0, 2.0, -.2)); const lb = box(.9, .18, .3, bmat({ color: 0x4f8aff }), 0, 1.9, 2.2); g.add(lb); for (const [x, z] of [[-.75, 1.9], [.75, 1.9], [-.75, -1.0], [.75, -1.0]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .3, 8), mat({ color: 0x16161a })); w.rotation.z = Math.PI / 2; w.position.set(x, .4, z); g.add(w); } g.userData = { lb }; scene.add(g); return g; });
  return { scene, cam, J, trucks, lights(t) { trucks.forEach((g, i) => g.userData.lb.material.color.setHex(Math.floor(t * 6 + i) % 2 ? 0x4f8aff : 0xff3a3a)); } };
}

// ---------- pilot short: shots ----------
const shots = [];
const shot = (t0, t1, build, extra = {}) => shots.push({ t0, t1, ...build(), ...extra });
const behind = (C, k = 0) => look(C.cam, CXS - .25, 2.12, -1.05 + k * .2, CXS + .03, 1.83, 1.5);
const capClose = (C, z = 1.36) => look(C.cam, CXS + .12, 1.68, z, CXS, 1.5, -.33);
// 1 / last: the hook - a captain on the outside of his own aircraft
function sHook(hold) {
  return () => { const E = ext(), sign = hud(E.cam, makeSign('1990'));
    return { scene: E.scene, cam: E.cam, update(tl, d, t) { const x = hold ? 0 : tl; E.fly(t, 1); sign.scale.setScalar(hold ? .001 : pop(x - .25) * .8); const k = ss(0, .75, x); look(E.cam, lerp(6.5, 2.9, k), lerp(3.6, 2.9, k), lerp(9.5, 5.0, k), .4, lerp(.9, 1.5, k), lerp(-.5, .9, k)); if (!hold) shake(E.cam, t, .02); } }; };
}
shot(0, 1.6, sHook(false));
// 2a: "a pilot was" - a calm captain with his coffee
shot(1.6, 2.75, () => {
  const C = cabin({ fov: 56 }), cap = makeCapIn(C.scene), cup = box(.13, .15, .13, mat({ color: 0xffffff })); cap.h.arms[1].add(cup); cup.position.set(0, -.76, .1); cup.add(box(.1, .02, .1, mat({ color: 0x5a3a22 }), 0, .075, 0));
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    const go = tl > .98; cap.set(0, t, 0); cap.h.face(go ? 'shocked' : 'happy'); cap.h.arms[1].rotation.x = go ? -2.4 : -2.0 + Math.sin(tl * 5) * .06; cap.h.arms[1].rotation.z = -.25; cap.h.head.rotation.x = go ? 0 : -.06; cap.h.head.rotation.z = go ? 0 : .06; cup.visible = !go; streamAt(C.clouds, t * 26);
    capClose(C, Math.min(1.44, 1.3 * punch(tl, .1)) - (go ? .22 : 0)); if (go) shake(C.cam, t, .05);
  } };
});
// 2b: "sucked out" - seen from behind the seats
shot(2.75, 3.5, () => {
  const C = cabin({ fov: 46 }), cap = makeCapIn(C.scene), fo = makeFO(C.scene), ps = makePapers(C.scene, 12); C.paneC.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) { cap.set(ss(.02, .32, tl), t); cap.h.face('scream'); fo.pose(t, 'scream', 1); papersAt(ps, t); streamAt(C.clouds, t * 26); behind(C); shake(C.cam, t, .09); } };
});
// 2c: "of his own cockpit window."
shot(3.5, 5.05, () => { const E = ext(); return { scene: E.scene, cam: E.cam, update(tl, d, t) { E.fly(t, 1); look(E.cam, 2.6, 3.1, 4.2 * punch(tl, .25), .5, 1.75, .75); shake(E.cam, t, .035); } }; });
// 3: "And he survived."
shot(5.05, 6.65, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = burst(scene, cam, 0xffd21f, 0xff9a1f, 0xfff6c0), h = epaulettes(makeHuman(CAPT)), st = hud(cam, makeSign('SURVIVED', '#ffffff', '#1f9a4a')), sp = sparkles(scene, 6); scene.add(h.root);
  h.arms[0].add(box(.25, .5, .27, mat({ color: 0xf4f4ee }), 0, -.5, 0));
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.3; h.reset(); h.face('happy'); h.arms[0].rotation.x = -1.2; h.arms[0].rotation.z = .5; h.arms[1].rotation.z = 2.5 + Math.sin(tl * 10) * .15; h.body.position.y = Math.abs(Math.sin(tl * 8)) * .04; const a = tl - .62;
    st.scale.setScalar(a > 0 ? lerp(2.6, .9, clamp(a / .08)) * (1 + .08 * Math.exp(-a * 8) * Math.cos(a * 25)) : .001); st.rotation.z = -.08;
    sp.forEach((s, i) => { const an = i * 1.05 + t * 2.2; s.position.set(Math.cos(an) * .8, 1.9 + Math.sin(an * 1.7) * .5, .3); s.scale.setScalar(.5 + Math.max(0, Math.sin(t * 10 + i * 2)) * 2); });
    look(cam, .1, 1.85, 3.0 * punch(tl, .22), 0, 1.68, 0); if (a > 0) shake(cam, t, .05 * Math.exp(-a * 9));
  } };
});
// 4a: "A British Airways flight had just" - take-off
shot(6.65, 8.6, () => {
  const A = airport(); A.J.pose(0, 0); A.trucks.forEach((g, i) => g.position.set(-12 - i * 3, 0, -60));
  return { scene: A.scene, cam: A.cam, update(tl, d, t) { const p = tl / d, z = lerp(-34, 15, p * (.55 + .45 * p)), up = ss(.5, 1, p); A.J.pose(t, 0); A.J.g.position.set(0, A.J.GY + up * up * 10, z); A.J.g.rotation.x = -.24 * ss(.42, .7, p); look(A.cam, -4.6, 1.0, 23, 0, A.J.g.position.y + .4, z + 2); shake(A.cam, t, .02 + p * .03); } };
});
// 4b: "climbed to 17,000 feet."
shot(8.6, 11.3, () => {
  const E = ext(), S = dynSign(E.cam);
  return { scene: E.scene, cam: E.cam, update(tl, d, t) {
    const k = ss(0, 1.5, tl); E.fly(t, 0); streamAt(E.clouds, t * 26, (1 - k) * -40 + t * 3); E.J.g.rotation.x = -.2 * (1 - ss(1.2, 2.2, tl)); E.gnd.position.y = -14 - k * 34;
    S.draw((Math.round(k * 170) * 100).toLocaleString('en-US') + ' FT', k < 1 ? '#ffe21f' : '#3a8aff', k < 1 ? '#16120a' : '#ffffff'); S.m.scale.setScalar(.82 * (1 + (k >= 1 ? .3 * Math.exp(-(tl - 1.5) * 6) * Math.cos((tl - 1.5) * 20) : 0)));
    look(E.cam, -6.2 + tl * .4, -2.9, 8.6, 0, .7, -3);
  } };
});
// 5: "Then the windscreen blew out."
shot(11.3, 13.45, () => {
  const C = cabin({ fov: 46 }), cap = makeCapIn(C.scene), fo = makeFO(C.scene), ps = makePapers(C.scene, 14), flash = hudFlash(C.cam), BANG = 1.2;
  const crackT = ctex(64, 48, g => { g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; const r = rng(31); for (let i = 0; i < 10; i++) { let x = 34, y = 24; g.beginPath(); g.moveTo(x, y); const a = i / 10 * 6.283 + r(); for (let k = 0; k < 5; k++) { x += Math.cos(a + (r() - .5) * 1.2) * 7; y += Math.sin(a + (r() - .5) * 1.2) * 6; g.lineTo(x, y); } g.stroke(); } });
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(1.36, .98), bmat({ map: crackT, transparent: true, side: THREE.DoubleSide })); C.scene.add(crack);
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    const a = tl - BANG, bang = a > 0, warn = tl > .5; cap.set(bang ? ss(0, 1.2, a) * .16 : 0, t, 0); cap.h.face(bang ? 'scream' : warn ? 'worried' : 'neutral'); fo.pose(t, bang ? 'scream' : warn ? 'worried' : 'neutral', bang ? 1 : 0);
    const f = bang ? a : 0; C.paneC.position.set(.75, 1.81 + f * 1.5, 1.5 + f * 15); C.paneC.rotation.set(f * 8, f * 5, 0); crack.visible = warn; crack.position.copy(C.paneC.position); crack.position.z -= .012; crack.rotation.copy(C.paneC.rotation); crack.scale.setScalar(bang ? 1 : .25 + clamp((tl - .5) / .65) * .75);
    flash.material.opacity = bang ? Math.exp(-a * 8) * .95 : 0; papersAt(ps, t, 1.6, bang); streamAt(C.clouds, t * 26); behind(C); shake(C.cam, t, bang ? .15 * Math.exp(-a * 3) + .04 : warn ? .012 : 0);
  } };
});
// 6: "The captain, Tim Lancaster,"
shot(13.45, 15.8, () => {
  const C = cabin({ fov: 56 }), cap = makeCapIn(C.scene), ps = makePapers(C.scene, 6), sign = hud(C.cam, makeSign('CAPT. TIM LANCASTER', '#16120a', '#ffe21f')); C.paneC.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    cap.set(.03 + tl * .03, t * .25, 0); cap.h.face('shocked'); cap.h.arms[0].rotation.x = -1.7 - tl * .25; cap.h.arms[1].rotation.x = -1.5 - tl * .3; cap.h.arms[0].rotation.z = -.4; cap.h.arms[1].rotation.z = .4; cap.h.head.rotation.x = -.15;
    papersAt(ps, t * .22, 1.6, true); streamAt(C.clouds, t * 6); sign.scale.setScalar(pop(tl - .45) * .85); capClose(C, lerp(1.42, 1.22, tl / d));
  } };
});
// 7a: "shot halfway"
shot(15.8, 16.9, () => {
  const C = cabin({ fov: 46 }), cap = makeCapIn(C.scene), fo = makeFO(C.scene), ps = makePapers(C.scene, 12); C.paneC.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) { cap.set(.1 + .9 * ss(.1, .4, tl), t); cap.h.face('scream'); fo.pose(t, 'scream', 1); papersAt(ps, t); streamAt(C.clouds, t * 26); behind(C, .6); shake(C.cam, t, .1); } };
});
// 7b: "through the hole."
shot(16.9, 17.9, () => {
  const E = ext(), r = rng(3), shards = [...Array(12)].map(() => { const s = box(.14, .14, .02, bmat({ color: 0xcfefff })); s.userData = [r() - .3, r() * .9 + .3, r() * 1.2 + .3, r() * 6]; E.scene.add(s); return s; });
  return { scene: E.scene, cam: E.cam, update(tl, d, t) {
    E.fly(t, 1); E.J.W.scale.setScalar(Math.max(.05, pop(tl))); shards.forEach(s => { const u = s.userData; s.position.set(.5 + u[0] * tl * 5, 1.2 + u[1] * tl * 5 - tl * tl * 3, 1.5 + u[2] * tl * 6); s.rotation.set(u[3] + tl * 12, tl * 9, 0); s.visible = tl < .8; });
    look(E.cam, 3.2, 3.0, 5.4 * punch(tl, .3), .45, 1.6, .8); shake(E.cam, t, .1 * Math.exp(-tl * 4) + .02);
  } };
});
// 8: "Only his legs were still inside."
shot(17.9, 20.55, () => {
  const C = cabin({ fov: 55 }), cap = makeCapIn(C.scene), ps = makePapers(C.scene, 12); C.paneC.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) { cap.set(1, t); papersAt(ps, t); streamAt(C.clouds, t * 26); look(C.cam, .05, 1.5, lerp(-.55, -.3, tl / d), CXS, 1.72, 1.35); shake(C.cam, t, .025); } };
});
// 9a: "So a flight attendant"
shot(20.55, 21.65, () => {
  const C = cabin(), a1 = makeHuman(ATT1), ps = makePapers(C.scene, 8); C.scene.add(a1.root); C.paneC.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) { C.door.rotation.y = 1.6 * ss(.05, .22, tl); a1.reset(); a1.face('shocked'); a1.root.position.set(0, 0, lerp(-4.5, -1.0, ss(.12, 1.0, tl))); a1.walk(tl * 17, .9); a1.body.rotation.x = .2; papersAt(ps, t); look(C.cam, .05, 1.75, .5, 0, 1.5, -2.4); shake(C.cam, t, .03); } };
});
const sideView = (C, k = 0) => look(C.cam, -1.2 + k * .35, 1.8, .8 + k * .15, .6, 1.92, .95 + k * .2);
// 9b: "grabbed him,"
shot(21.65, 22.9, () => {
  const C = cabin({ fov: 84 }), cap = makeCapIn(C.scene), a1 = makeHuman(ATT1), ps = makePapers(C.scene, 10); C.scene.add(a1.root); C.paneC.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    const k = ss(0, .36, tl), got = tl > .4; cap.set(1, t, got ? .5 : 1); holdPose(a1, 0, t, got ? 'determined' : 'shocked', got ? 1 : 0); a1.root.position.set(lerp(-.1, CHAIN[0][0], k), 0, lerp(-1.3, CHAIN[0][1], k)); if (!got) { a1.walk(tl * 17, .8); a1.arms[0].rotation.x = a1.arms[1].rotation.x = -1.95 * k; }
    papersAt(ps, t); streamAt(C.clouds, t * 26); sideView(C, 0); shake(C.cam, t, .03 + (got ? .06 * Math.exp(-(tl - .4) * 7) : 0));
  } };
});
// 10: "and held on."
shot(22.9, 24.2, () => {
  const C = cabin({ fov: 72 }), cap = makeCapIn(C.scene), a1 = makeHuman(ATT1), ps = makePapers(C.scene, 10); C.scene.add(a1.root); C.paneC.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) { cap.set(1, t, .5); holdPose(a1, 0, t); papersAt(ps, t); streamAt(C.clouds, t * 26); sideView(C, .4 + tl * .12); shake(C.cam, t, .03); } };
});
// 11: "For about 20 minutes,"
shot(24.2, 26.05, () => {
  const E = ext(), S = dynSign(E.cam);
  return { scene: E.scene, cam: E.cam, update(tl, d, t) {
    const k = ss(.1, 1.0, tl), m = Math.round(k * 20); E.fly(t * 2.2, 1); S.draw(String(m).padStart(2, '0') + ':00', k < 1 ? '#16120a' : '#ff3a2a', k < 1 ? '#3aff6a' : '#ffffff', 20); S.m.scale.setScalar(.82 * (1 + (k >= 1 ? .3 * Math.exp(-(tl - 1.0) * 6) * Math.cos((tl - 1.0) * 20) : 0)));
    look(E.cam, lerp(7.5, 5.5, tl / d), 3.4, lerp(10.5, 8.0, tl / d), .3, 1.0, -.5); shake(E.cam, t, .02);
  } };
});
// 12: "the crew took turns holding him,"
shot(26.05, 28.15, () => {
  const C = cabin(), fo = makeFO(C.scene), crew = [ATT1, ATT2, ATT3].map(p => { const h = makeHuman(p); C.scene.add(h.root); return h; }), ps = makePapers(C.scene, 8); C.paneC.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    const sw = ss(.75, 1.25, tl); fo.pose(t, 'determined', 1); crew.forEach((h, i) => holdPose(h, i, t));
    const P = (a, b, k, side) => [lerp(CHAIN[a][0], CHAIN[b][0], k) + Math.sin(k * Math.PI) * side, lerp(CHAIN[a][1], CHAIN[b][1], k)];
    const p0 = P(0, 1, sw, -.3), p1 = P(1, 0, sw, .25); crew[0].root.position.set(p0[0], 0, p0[1]); crew[1].root.position.set(p1[0], 0, p1[1]);
    if (sw > .5) { crew[0].arms[0].rotation.x = crew[0].arms[1].rotation.x = -1.3; crew[1].arms[0].rotation.x = crew[1].arms[1].rotation.x = -1.95; crew[1].head.rotation.x = -.3; crew[0].head.rotation.x = 0; }
    papersAt(ps, t); streamAt(C.clouds, t * 26); look(C.cam, -1.1, 2.15, 1.25, .2, 1.35, -.45); shake(C.cam, t, .02);
  } };
});
// 13: "in freezing wind."
shot(28.15, 29.75, () => {
  const E = ext(), snow = makeLines(E.scene, 40, .5), sign = hud(E.cam, makeSign('FREEZING', '#bfe9ff', '#1b2f6b'));
  return { scene: E.scene, cam: E.cam, update(tl, d, t) { E.fly(t, 1, 'frozen', .35); E.J.cap.tint(ICE, .45); linesAt(snow, t, .5, 2.0, 1, 3.2, 3.4); sign.scale.setScalar(pop(tl - .4) * .85); look(E.cam, 2.4, 3.0, 4.0 * punch(tl, .2), .5, 1.75, .75); shake(E.cam, t, .03); } };
});
// 14: "His face turned blue."
shot(29.75, 31.8, () => {
  const E = ext(), snow = makeLines(E.scene, 30, .4);
  return { scene: E.scene, cam: E.cam, update(tl, d, t) {
    E.fly(t, 1, 'frozen', .08); E.J.g.position.y = 0; E.J.g.rotation.z = 0; E.J.W.rotation.z = 0; E.J.cap.tint(BLUE, lerp(.3, .95, ss(.1, 1.3, tl)));
    const c = E.J.facePoint(lerp(1.9, 1.45, tl / d)), f = E.J.facePoint(.2); linesAt(snow, t, f.x, f.y, f.z, 1.6, 3.4); look(E.cam, c.x + .25, c.y, c.z, f.x, f.y, f.z);
  } };
});
// 15: "They thought he was dead."   16: "But they refused to let go."
function sFaces(mode) {
  return () => { const C = cabin({ fov: 62, dim: mode === 'sad' }), cap = makeCapIn(C.scene), crew = [ATT2, ATT1].map(p => { const h = makeHuman(p); C.scene.add(h.root); return h; }), ps = makePapers(C.scene, 8); C.paneC.visible = false;
    return { scene: C.scene, cam: C.cam, update(tl, d, t) {
      const sad = mode === 'sad', hit = !sad && tl > .62; cap.set(1, t, sad ? 0 : .4); crew.forEach((h, i) => { holdPose(h, i, t, sad ? 'sad' : 'determined', sad ? .3 : 1.4); if (sad) h.head.rotation.x = i ? -.1 : -.38; if (!i) { h.arms[0].rotation.x = h.arms[1].rotation.x = -.95 + Math.sin(t * 21) * .04; h.arms[0].rotation.z = -.25; h.arms[1].rotation.z = .25; } });
      papersAt(ps, t, sad ? .5 : 1.6); streamAt(C.clouds, t * 26); const z = sad ? lerp(1.4, 1.28, tl / d) : 1.38 - (hit ? .2 * (1 - Math.exp(-(tl - .62) * 10)) : 0);
      look(C.cam, -.2, 1.95, z, .36, 1.8, .05); shake(C.cam, t, sad ? .006 : .02 + (hit ? .05 * Math.exp(-(tl - .62) * 6) : 0));
    } }; };
}
shot(31.8, 33.7, sFaces('sad'));
shot(33.7, 36.2, sFaces('refuse'));
// 17a: "Meanwhile,"
shot(36.2, 37.75, () => {
  const C = cabin({ fov: 56 }), fo = makeFO(C.scene), ps = makePapers(C.scene, 10); C.paneC.visible = false;
  return { scene: C.scene, cam: C.cam, update(tl, d, t) { fo.pose(t, 'determined', 1); papersAt(ps, t); streamAt(C.clouds, t * 26); look(C.cam, -CXS - .12, 1.68, Math.min(1.44, 1.3 * punch(tl, .1)), -CXS, 1.5, -.33); shake(C.cam, t, .025); } };
});
// 17b: "the co-pilot landed the plane"
shot(37.75, 39.3, () => {
  const A = airport(); A.trucks.forEach((g, i) => g.position.set(-10.5, 0, 6 + i * 6));
  return { scene: A.scene, cam: A.cam, update(tl, d, t) { const p = tl / d; A.J.pose(t, 1, 'frozen', .3); A.J.cap.tint(BLUE, .8); A.J.g.position.set(0, lerp(11, 4.6, p), lerp(-40, -12, p)); A.J.g.rotation.x = -.07; A.lights(t); look(A.cam, -5.5, 1.8, 13, 0, A.J.g.position.y + .2, A.J.g.position.z + 4); shake(A.cam, t, .015); } };
});
// 17c: "by himself."
shot(39.3, 40.55, () => {
  const A = airport(), smoke = [...Array(8)].map((_, i) => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.5, 0), mat({ color: 0xe8e8e8, transparent: true })); s.userData = i; A.scene.add(s); return s; });
  return { scene: A.scene, cam: A.cam, update(tl, d, t) {
    const TD = .28, a = tl - TD, z = lerp(-12, 13, tl / d), y = a < 0 ? lerp(4.6, A.J.GY, tl / TD) : A.J.GY + Math.abs(Math.sin(a * 9)) * .5 * Math.exp(-a * 5);
    A.J.pose(t, 1, 'frozen', .3); A.J.cap.tint(BLUE, .8); A.J.g.position.set(0, y, z); A.J.g.rotation.x = -.07 * (1 - ss(0, .5, a)); A.lights(t); A.trucks.forEach((g, i) => g.position.set(-10.5, 0, 6 + i * 6 + Math.max(0, a) * 9));
    smoke.forEach(s => { const i = s.userData, q = clamp(a * 1.6 - i * .03); s.visible = a > 0 && q < 1; s.position.set((i % 2 ? 1.5 : -1.5) + (i % 3 - 1) * .4, .4 + q * 1.4, lerp(-12, 13, TD / d) - 9.3 - q * 2 + (i % 4) * .5); s.scale.setScalar(.6 + q * 2.6); s.material.opacity = .9 * (1 - q); });
    look(A.cam, -6.0, 1.3, 20, 0, y, z + 3); shake(A.cam, t, a > 0 ? .12 * Math.exp(-a * 6) + .01 : .01);
  } };
});
// 18: "And the captain was alive."
shot(40.55, 42.6, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = skyTex; lights(scene, 2.1, 1.9); scene.add(cam);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat({ color: 0x6a6d74 })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  scene.add(box(1.0, .12, 2.5, mat({ color: 0xf2f2f2 }), 0, .55, 0)); scene.add(box(1.08, .06, 2.6, mat({ color: 0xd8242a }), 0, .46, 0)); for (const [x, z] of [[-.45, 1.1], [.45, 1.1], [-.45, -1.1], [.45, -1.1]]) scene.add(box(.06, .46, .06, mat({ color: 0x8a9096 }), x, .23, z)); scene.add(box(.6, .12, .45, mat({ color: 0xffffff }), 0, .67, -.95));
  const W = new THREE.Group(), cap = epaulettes(makeHuman(CAPT)); W.add(cap.root); W.position.set(0, .82, 1.02); W.rotation.x = -Math.PI / 2; scene.add(W); const blanket = box(.95, .16, 1.25, mat({ color: 0x3fa0d8 }), 0, .78, .45); scene.add(blanket);
  const meds = [MEDIC, MEDIC2].map((p, i) => { const h = makeHuman(p); h.root.position.set(i ? 1.05 : -1.05, 0, -.15); h.root.rotation.y = i ? -Math.PI / 2 : Math.PI / 2; scene.add(h.root); return h; }), st = hud(cam, makeSign('ALIVE', '#ffffff', '#1f9a4a'), 1.3), sp = sparkles(scene, 6);
  return { scene, cam, update(tl, d, t) {
    const a = tl - 1.12, ok = tl > .75; cap.reset(); cap.face(ok ? 'happy' : 'weak'); cap.tint(BLUE, lerp(.75, .12, ss(.2, 1.5, tl))); cap.arms[1].rotation.x = ok ? -1.5 * ss(.75, 1.0, tl) : 0; cap.arms[1].rotation.z = .25;
    meds.forEach((h, i) => { h.reset(); h.face(ok ? 'happy' : 'worried'); h.head.rotation.x = .45; h.arms[0].rotation.x = h.arms[1].rotation.x = ok ? 0 : -.9; if (ok) { h.arms[0].rotation.z = -2.5; h.arms[1].rotation.z = 2.5; h.body.position.y = Math.abs(Math.sin(t * 9 + i)) * .12; } });
    st.scale.setScalar(a > 0 ? lerp(2.6, .9, clamp(a / .08)) * (1 + .08 * Math.exp(-a * 8) * Math.cos(a * 25)) : .001); st.rotation.z = -.07;
    sp.forEach((s, i) => { const an = i * 1.05 + t * 2; s.position.set(Math.cos(an) * .9, 1.3, -.5 + Math.sin(an) * .8); s.scale.setScalar(ok ? .6 + Math.max(0, Math.sin(t * 10 + i * 2)) * 2 : 0); });
    look(cam, 0, lerp(5.2, 4.4, tl / d) * punch(tl, .15), 1.5, 0, .8, -.25); if (a > 0) shake(cam, t, .05 * Math.exp(-a * 9));
  } };
});
// 19: "He had frostbite and broken bones,"
shot(42.6, 45.35, () => {
  const scene = new THREE.Scene(), cam = newCam(); scene.background = new THREE.Color(0x9fc8c8); lights(scene, 2.1, 1.5); scene.add(cam);
  const wt = ctex(32, 32, g => { g.fillStyle = '#b8dcd8'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#9fc8c4'; g.fillRect(0, 22, 32, 10); g.fillStyle = '#e9f4f2'; g.fillRect(0, 21, 32, 1); noise(g, 32, 32, 10, 61); }, [6, 1]);
  scene.add(box(12, 6, .2, mat({ map: wt }), 0, 3, -1.2)); const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), mat({ color: 0xd8d8d0 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  scene.add(box(1.5, .9, 2.7, mat({ color: 0xf2f2f2 }), 0, .45, .5)); scene.add(box(1.5, 1.3, .14, mat({ color: 0xc9c9c9 }), 0, 1.5, -.75)); scene.add(box(1.0, .5, .2, mat({ color: 0xffffff }), 0, 1.5, -.6)); scene.add(box(1.42, .34, 1.5, mat({ color: 0x4f8fd0 }), 0, 1.03, 1.0));
  const xr = ctex(48, 64, g => { g.fillStyle = '#0a1420'; g.fillRect(0, 0, 48, 64); g.strokeStyle = '#cfe8ff'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(18, 8); g.lineTo(22, 30); g.stroke(); g.beginPath(); g.moveTo(27, 34); g.lineTo(30, 56); g.stroke(); g.lineWidth = 7; g.beginPath(); g.moveTo(16, 7); g.lineTo(20, 7); g.moveTo(28, 57); g.lineTo(32, 57); g.stroke(); g.strokeStyle = '#ff3a3a'; g.lineWidth = 1.5; g.beginPath(); g.arc(24, 32, 9, 0, 7); g.stroke(); });
  scene.add(box(1.0, 1.3, .08, mat({ color: 0x3a3d4a }), -1.25, 2.3, -1.08)); const xp = new THREE.Mesh(new THREE.PlaneGeometry(.88, 1.17), bmat({ map: xr })); xp.position.set(-1.25, 2.3, -1.03); scene.add(xp);
  const h = makeHuman({ ...CAPT, top: 0x9fd0e8, topStyle: 'plain' }); scene.add(h.root); const white = mat({ color: 0xf4f4ee });
  for (const a of h.arms) a.add(box(.24, .26, .26, white, 0, -.68, 0)); h.arms[0].add(box(.26, .5, .28, white, 0, -.3, 0)); h.body.add(box(.08, .7, .5, white, -.2, 1.32, .2));
  const s1 = hud(cam, makeSign('FROSTBITE', '#bfe9ff', '#1b2f6b')), s2 = hud(cam, makeSign('BROKEN BONES', '#ffffff', '#d8242a')), doc = makeHuman(DOC); scene.add(doc.root);
  return { scene, cam, update(tl, d, t) {
    const T2 = 1.5, two = tl > T2; h.reset(); h.face(two ? 'sad' : 'worried'); h.root.position.set(0, .12, 0); h.legs[0].rotation.x = h.legs[1].rotation.x = -1.5; h.arms[0].rotation.x = -1.25; h.arms[0].rotation.z = .55; h.arms[1].rotation.x = two ? -.4 : -1.5 + Math.sin(tl * 8) * .1; h.head.rotation.x = .08;
    doc.reset(); doc.face('worried'); doc.root.position.set(1.1, 0, .9); doc.root.rotation.y = -.9; doc.arms[1].rotation.x = two ? -2.2 : -1.0; doc.arms[1].rotation.z = two ? .5 : 0;
    s1.scale.setScalar(two ? .001 : pop(tl - .55) * .85); s2.scale.setScalar(two ? pop(tl - T2) * .85 : .001); xp.material.color.setScalar(two ? 1 : .45);
    look(cam, two ? -.25 : .3, 1.9, 4.9 * punch(tl, .15) * (two ? punch(tl - T2, .15) : 1), two ? -.3 : .1, 1.78, 0);
  } };
});
// 20a: "and was back at work"
shot(45.35, 46.7, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene); const u = burst(scene, cam, 0x1f9a8a, 0x0f6a6a, 0xc0fff0), D = dynTex(64, 64);
  const cal = new THREE.Group(); cal.add(box(2.4, 2.4, .12, mat({ color: 0xd8d2c2 }), 0, 0, -.07)); cal.add(new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), bmat({ map: D.t }))); cal.position.set(0, 1.9, 0); scene.add(cal);
  const pages = [...Array(7)].map(() => { const p = box(.95, 1.05, .01, bmat({ color: 0xf6f2e6 })); scene.add(p); return p; });
  return { scene, cam, update(tl, d, t) {
    u.value = t * 1.4; const n = clamp(Math.floor(1 + tl / .85 * 4.99), 1, 5), g = D.g; g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#c8202a'; g.fillRect(0, 0, 64, 17); g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MONTH', 32, 9); g.fillStyle = '#1a1a1a'; g.font = 'bold 42px sans-serif'; g.fillText(String(n), 32, 43); D.t.needsUpdate = true;
    cal.scale.setScalar(1 + (n === 5 ? Math.exp(-(tl - .85) * 5) * .2 : 0)); cal.rotation.z = Math.sin(tl * 4) * .04;
    pages.forEach((p, i) => { const k = (tl * 2.8 + i / 7) % 1; p.visible = tl < .95; p.position.set((i % 2 ? 1 : -1) * (.3 + k * 1.6), 1.9 - k * k * 2.6, .2 + i * .02); p.rotation.set(k * 3, k * 2, (i % 2 ? -1 : 1) * k * 2.5); });
    look(cam, 0, 1.6, 6.0 * punch(tl, .18), 0, 1.55, 0);
  } };
});
// 20b: "in under five months."
shot(46.7, 48.25, () => {
  const C = cabin({ fov: 66 }), cap = makeCapIn(C.scene, CAPT_HAT), fo = makeFO(C.scene), sign = hud(C.cam, makeSign('BACK AT WORK', '#1f9a4a', '#ffffff')), sp = sparkles(C.scene, 6, 0xffffff, .06);
  return { scene: C.scene, cam: C.cam, update(tl, d, t) {
    cap.set(0, t, 0); cap.h.face('happy'); cap.h.arms[1].rotation.x = -1.1; cap.h.arms[0].rotation.x = 0; cap.h.arms[0].rotation.z = -2.6 + Math.sin(tl * 10) * .2; cap.h.head.rotation.z = .08; fo.pose(t, 'happy'); streamAt(C.clouds, t * 26);
    sp.forEach((s, i) => { const an = i * 1.05 + t * 2; s.position.set(CXS + Math.cos(an) * .55, 2.25 + Math.sin(an) * .12, -.25 + Math.sin(an) * .3); s.scale.setScalar(.5 + Math.max(0, Math.sin(t * 10 + i * 2)) * 2.4); });
    sign.scale.setScalar(pop(tl - .3) * .85); look(C.cam, -1.25, 1.85, 1.2, .05 + .08 * Math.exp(-tl * 9), 1.5, -.33);
  } };
});
// the windscreen frame and its screws
const threadT = ctex(8, 16, g => { g.fillStyle = '#b8bec8'; g.fillRect(0, 0, 8, 16); g.fillStyle = '#6a7080'; for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 8, 2); });
function makeScrew(r, len) { const g = new THREE.Group(), m = mat({ color: 0xd0d5dd }); const sh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat({ map: threadT })); sh.position.y = -len / 2; g.add(sh); const hd = new THREE.Mesh(new THREE.CylinderGeometry(r * 2.1, r * 2.1, r * .9, 10), m); hd.position.y = r * .45; g.add(hd); g.add(box(r * 3, .03, r * .4, mat({ color: 0x3a3d4a }), 0, r * .92, 0)); return g; }
function makeFrame() {
  const g = new THREE.Group(), metal = mat({ color: 0x8a909c }); g.add(box(2.7, .22, .12, metal, 0, .95, 0)); g.add(box(2.7, .22, .12, metal, 0, -.95, 0)); g.add(box(.22, 2.1, .12, metal, -1.35, 0, 0)); g.add(box(.22, 2.1, .12, metal, 1.35, 0, 0));
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.7), mat({ color: 0x9fd8ff, transparent: true, opacity: .35, side: THREE.DoubleSide })); g.add(gl);
  const pts = []; for (let i = 0; i < 26; i++) { pts.push([-1.25 + i * .1, .95]); pts.push([-1.25 + i * .1, -.95]); } for (let i = 0; i < 16; i++) { pts.push([-1.35, -.75 + i * .1]); pts.push([1.35, -.75 + i * .1]); }
  const sm = bmat({ color: 0xe8edf5 }), screws = pts.map(([x, y]) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .03, 6), sm); s.rotation.x = Math.PI / 2; s.position.set(x, y, .075); g.add(s); return s; });
  return { g, screws };
}
// 21: "The cause?"
shot(48.25, 49.65, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.0, 1.8); const u = swirl(scene, cam, 0x1a2f6a, 0x2f55b0, 0x7aa0ff), F = makeFrame(), q = hud(cam, makeSign('THE CAUSE?', '#ffe21f', '#16120a')); F.g.position.y = 1.7; scene.add(F.g);
  return { scene, cam, update(tl, d, t) { u.value = t * .8; F.g.rotation.y = Math.sin(tl * 2) * .35; F.g.rotation.x = -.1; q.scale.setScalar(pop(tl - .15) * .85); look(cam, 0, 1.8, lerp(6.4, 5.4, tl / d) * punch(tl, .2), 0, 1.75, 0); } };
});
// 22a: "84 screws"
shot(49.65, 51.0, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.0, 1.8); const u = swirl(scene, cam, 0x1a2f6a, 0x2f55b0, 0x7aa0ff), F = makeFrame(), S = dynSign(cam); F.g.position.y = 1.7; scene.add(F.g);
  return { scene, cam, update(tl, d, t) {
    u.value = t * .8; const n = Math.round(ss(.05, .85, tl) * 84); F.screws.forEach((s, i) => { const on = i < n; s.visible = on; s.scale.setScalar(on && i > n - 6 ? 2.2 : 1); });
    S.draw(n + ' SCREWS', n < 84 ? '#ffe21f' : '#ff3a2a', n < 84 ? '#16120a' : '#ffffff', 14); S.m.scale.setScalar(.84 * (1 + (n >= 84 ? .3 * Math.exp(-(tl - .85) * 6) * Math.cos((tl - .85) * 20) : 0)));
    const k = clamp(n / 52), back = ss(.72, 1.15, tl), cx = lerp(-1.2, 1.2, k) * (1 - back), cy = lerp(2.65, 1.75, back); look(cam, cx, cy, lerp(1.7, 5.3, back), cx, cy, 0);
  } };
});
// 22b: "that were slightly too small."
shot(51.0, 52.95, () => {
  const scene = new THREE.Scene(), cam = newCam(); lights(scene, 2.2, 1.9); const u = burst(scene, cam, 0x3a1a1a, 0x5a1f1f, 0xff8a6a), ok = makeScrew(.2, 1.3), bad = makeScrew(.145, 1.3), sign = hud(cam, makeSign('TOO SMALL', '#ff3a2a', '#ffffff'));
  const block = x => { const g = new THREE.Group(), m = mat({ color: 0x6a7080 }); g.add(box(.36, 1.1, .5, m, -.39, -.55, 0)); g.add(box(.36, 1.1, .5, m, .39, -.55, 0)); g.add(box(1.14, .22, .5, m, 0, -1.2, 0)); g.position.set(x, 1.9, 0); scene.add(g); return g; };
  block(-.62); block(.62); scene.add(ok, bad);
  const la = makeSign('NEEDED', '#1f9a4a', '#ffffff'), lb = makeSign('USED', '#16120a', '#ffe21f'); la.position.set(-.62, .42, .3); la.scale.setScalar(.46); lb.position.set(.62, .42, .3); lb.scale.setScalar(.46); scene.add(la, lb);
  return { scene, cam, update(tl, d, t) {
    u.value = t; const dn = ss(.05, .35, tl); ok.position.set(-.62, 1.9 + (1 - dn) * 1.4, 0); const loose = tl > .8, a = tl - .8;
    bad.position.set(.62 + (loose ? Math.sin(a * 30) * .06 : 0), 1.9 + (1 - dn) * 1.4 + (loose ? Math.max(0, a - .45) * 2.2 : 0), 0); bad.rotation.z = loose ? Math.sin(a * 24) * .18 : 0; ok.rotation.y = tl * 2; bad.rotation.y = tl * 3;
    sign.scale.setScalar(loose ? lerp(2.4, .85, clamp(a / .08)) * (1 + .08 * Math.exp(-a * 8) * Math.cos(a * 25)) : .001); sign.rotation.z = .06;
    look(cam, 0, 1.75, 4.6 * punch(tl, .18), 0, 1.45, 0); if (loose) shake(cam, t, .05 * Math.exp(-a * 9));
  } };
});
shot(52.95, DUR + .1, sHook(true));

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
