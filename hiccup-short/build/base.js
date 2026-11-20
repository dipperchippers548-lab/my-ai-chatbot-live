// ===================== TIMING =====================
const FPS = 30;
const CI = await (await fetch('/build/cuts.json')).json(), WORDS = await (await fetch('/build/words.json')).json(), MOUTH = await (await fetch('/build/mouth.json')).json();
const F = t => (t - CI.cuts.reduce((s, [a, b]) => s + (t > a ? Math.min(t, b) - a : 0), 0)) / CI.speed;     // voice clock -> final clock
const DUR = CI.duration, NF = Math.ceil(DUR * FPS);
const lvl = t => { const i = Math.round(t * MOUTH.rate); return i >= 0 && i < MOUTH.level.length ? MOUTH.level[i] : 0; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const pop = x => x <= 0 ? 0 : Math.min(1, x / .07) * (1 + .3 * Math.exp(-x * 9) * Math.cos(x * 24));
const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const noise1 = t => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };

// captions: 1-3 words, break on punctuation / gaps
const CAP = []; { let cur = null;
  WORDS.forEach((w, i) => { const s = F(w.s), e = F(w.e), txt = w.w.replace(/\.\.\.|[.,]/g, '').toUpperCase();
    if (!cur || cur.n >= 3 || cur.brk || s - cur.e > .25) { cur = { s, e, text: txt, n: 1 }; CAP.push(cur); } else { cur.text += ' ' + txt; cur.e = e; cur.n++; }
    cur.brk = /[.,!?]$|\.\.\.$/.test(w.w); });
  CAP.forEach((c, i) => c.end = i + 1 < CAP.length ? CAP[i + 1].s : DUR); }
window.captionChunks = CAP;

// ===================== EXTRA FACES / PROPS =====================
const _ft = faceTex;
FACES.madopen = ctex(256, 256, (g) => { g.drawImage(_ft('mad').image, 0, 0); g.fillStyle = '#f0b48a'; g.fillRect(96, 176, 64, 24); g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(128, 190, 24, 16, 0, 0, 7); g.fill(); g.fillStyle = '#e86a6a'; g.beginPath(); g.ellipse(128, 198, 13, 6, 0, 0, 7); g.fill(); });
const MUD = { ...DALE, skin: 0xa0704a, hair: 0x6a4428, top: 0x8a6a3a, top2: 0x6a4a28, pants: 0x4a3a24, shoe: 0x7a4a2a, sock: 0x8a6a4a };
const vaseGeo = new THREE.LatheGeometry([[0, 0], [.12, .02], [.2, .18], [.17, .38], [.08, .5], [.1, .6]].map(([x, y]) => new THREE.Vector2(x, y)), 7);
function newVase(col = 0x3a6ad8) { const g = new THREE.Group(); g.add(mesh(vaseGeo, col)); const band = mesh(new THREE.CylinderGeometry(.205, .205, .05, 7), 0xf2c230); band.position.y = .2; g.add(band); return g; }
function shards(sc, n, cx, cz, col = 0x3a6ad8, seed = 1) { const a = []; for (let i = 0; i < n; i++) { const s = mesh(lowpoly(new THREE.TetrahedronGeometry(.06 + hash(i + seed) * .07, 0), .02, i + seed), i % 4 ? col : 0xf2c230); s.userData.v = V((hash(i * 3 + seed) - .5) * 3, 1 + hash(i * 5 + seed) * 2, (hash(i * 7 + seed) - .5) * 2.2); s.userData.home = V(cx + (hash(i * 11 + seed) - .5) * 1.4, .04, cz + (hash(i * 13 + seed) - .5) * 1.0); sc.add(s); a.push(s); } return a; }
function burst(a, x0, y0, z0, k) { a.forEach((s, i) => { const h = s.userData.home, kk = ss(0, 1, k); s.position.set(lerp(x0, h.x, kk), Math.max(.04, y0 + s.userData.v.y * k * .6 - 3 * k * k) * (1 - kk) + .04 * kk, lerp(z0, h.z, kk)); s.rotation.set(i + k * 9, i * 2 + k * 6, k * 4); }); }
function tv(sc, x, z, ry = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; sc.add(g); g.add(at(mesh(new THREE.BoxGeometry(1.3, .6, .5), 0x6a4a34), 0, .3, 0)); g.add(at(mesh(new THREE.BoxGeometry(1.2, .72, .08), 0x1c1c24), 0, 1.0, 0));
  const ok = ctex(256, 160, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4ab8ff'); gr.addColorStop(1, '#a8f0a0'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(190, 40, 22, 0, 7); c.fill(); });
  const bad = ctex(256, 160, (c, w, h) => { c.fillStyle = '#111'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ddd'; c.lineWidth = 3; for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(100, 70); let x = 100, y = 70; for (let k = 0; k < 4; k++) { x += Math.cos(i * .52) * 30 + (hash(i * 9 + k) - .5) * 30; y += Math.sin(i * .52) * 24 + (hash(i * 5 + k) - .5) * 20; c.lineTo(x, y); } c.stroke(); } });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .62), new THREE.MeshBasicMaterial({ map: ok })); scr.position.set(0, 1.0, .045); g.add(scr); g.userData.crack = on => { scr.material.map = on ? bad : ok; }; return g; }
function phone() { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(.16, .3, .025), 0x1c1c24)); const s = new THREE.Mesh(new THREE.PlaneGeometry(.14, .27), new THREE.MeshBasicMaterial({ color: 0x8fd0ff })); s.position.z = .014; g.add(s); return g; }
function tube(col) { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.04, .05, .2, 6), col)); g.add(at(mesh(new THREE.ConeGeometry(.03, .08, 6), 0xf4f4f0), 0, .14, 0)); return g; }
function shovel() { const g = new THREE.Group(); g.add(at(mesh(new THREE.CylinderGeometry(.025, .025, 1.1, 5), 0x8a5a34), 0, .55, 0)); g.add(at(mesh(new THREE.BoxGeometry(.24, .3, .03), 0x9aa0ac), 0, -.1, 0)); g.add(at(mesh(new THREE.BoxGeometry(.2, .05, .05), 0x2a2a34), 0, 1.12, 0)); return g; }
function carMesh(col = 0xe8423a) { const g = new THREE.Group(); g.add(at(mesh(lowpoly(new THREE.BoxGeometry(1.8, .5, 3.4, 2, 1, 3), .04, 90), col), 0, .55, 0)); g.add(at(mesh(lowpoly(new THREE.BoxGeometry(1.6, .5, 1.8, 2, 1, 2), .04, 91), col), 0, 1.05, -.2));
  for (const z of [.71, -1.11]) { const wdw = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .38), new THREE.MeshLambertMaterial({ color: 0x9ad8ff })); wdw.position.set(0, 1.07, z); if (z < 0) wdw.rotation.y = Math.PI; g.add(wdw); }
  for (const [x, z] of [[-.9, 1.1], [.9, 1.1], [-.9, -1.1], [.9, -1.1]]) { const w = mesh(new THREE.CylinderGeometry(.32, .32, .25, 8), 0x1c1c24); w.rotation.z = Math.PI / 2; w.position.set(x, .32, z); g.add(w); }
  for (const s of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .05), new THREE.MeshBasicMaterial({ color: 0xfff2b0 })), s * .6, .6, 1.71)); return g; }

// ---------- outdoor yard with a hole (depth animates) ----------
function yard() { const sc = new THREE.Scene(); sc.background = new THREE.Color(0x8fd0ff); sc.fog = new THREE.Fog(0x8fd0ff, 18, 40);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x7ac86a, 1.5)); const k = new THREE.DirectionalLight(0xfff0dc, 2.1); k.position.set(3, 7, 4); k.castShadow = true; k.shadow.mapSize.set(2048, 2048); Object.assign(k.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, far: 30 }); k.shadow.bias = -.0005; sc.add(k);
  const G = 0x6cc85a, HO = .65;   // hole half-size
  for (const [x, z, w, d] of [[0, -6 - HO, 30, 12], [0, 6 + HO, 30, 12], [-7.5 - HO, 0, 15, 2 * HO], [7.5 + HO, 0, 15, 2 * HO]]) { const b = mesh(new THREE.BoxGeometry(w, .3, d), G); b.position.set(x, -.15, z); sc.add(b); }
  const D = 9; for (const [x, z, w, d] of [[0, -HO - .05, 2 * HO + .2, .1], [0, HO + .05, 2 * HO + .2, .1], [-HO - .05, 0, .1, 2 * HO], [HO + .05, 0, .1, 2 * HO]]) { for (let L = 0; L < 6; L++) { const b = mesh(new THREE.BoxGeometry(w, D / 6, d), [0x8a5a34, 0x7a4a2a, 0x6a3e24, 0x5a3420, 0x4a2a1a, 0x3a2216][L]); b.position.set(x, -.3 - (L + .5) * D / 6, z); b.receiveShadow = true; b.castShadow = false; sc.add(b); } }
  const bottom = mesh(new THREE.BoxGeometry(2 * HO, .1, 2 * HO), 0x5a3420); sc.add(bottom); const setDepth = d => bottom.position.y = -d - .05;
  const piles = [0, 1].map(i => { const p = mesh(lowpoly(new THREE.IcosahedronGeometry(.6, 1), .08, 70 + i), 0x8a5a34); p.position.set(i ? 1.6 : -1.7, -.1, i ? -.4 : .3); sc.add(p); return p; });
  // house + fence in the background
  sc.add(at(mesh(new THREE.BoxGeometry(6, 3, 3), 0xf4e4c8), -1, 1.5, -7)); const roof = mesh(new THREE.ConeGeometry(4.6, 1.6, 4), 0xc8504a); roof.rotation.y = Math.PI / 4; roof.position.set(-1, 3.8, -7); roof.scale.z = .6; sc.add(roof);
  for (let i = 0; i < 6; i++) { const wd = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), new THREE.MeshLambertMaterial({ color: 0x9ad8ff })); wd.position.set(-3 + (i % 3) * 2, 1.4, -5.49); if (i < 3) sc.add(wd); }
  for (let i = -12; i <= 12; i++) { sc.add(at(mesh(new THREE.BoxGeometry(.18, 1.1, .08), 0xf4f0e8), i * .55, .55, -4.5)); } sc.add(at(mesh(new THREE.BoxGeometry(14, .1, .06), 0xf4f0e8), 0, .85, -4.48)); sc.add(at(mesh(new THREE.BoxGeometry(14, .1, .06), 0xf4f0e8), 0, .35, -4.48));
  for (const [x, z, s] of [[4.5, -3, 1.2], [-5, -2.6, 1], [6, 2, 1.4]]) { sc.add(at(mesh(new THREE.CylinderGeometry(.12, .16, 1.4, 5), 0x7a4a2a), x, .7, z)); sc.add(at(mesh(lowpoly(new THREE.IcosahedronGeometry(.8 * s, 0), .1, x * 10), 0x4aa84a), x, 1.9, z)); }
  window.__sc = sc; return { scene: sc, setDepth, piles, HO }; }

// ===================== HUD =====================
function caption(t) { const c = CAP.find(c => t >= c.s - .02 && t < c.end); if (!c) return; const k = pop(t - c.s + .02), y = H * .66; og.save(); og.translate(W / 2, y); og.scale(.85 + .15 * k, .85 + .15 * k);
  og.font = '900 100px Nunito'; og.textAlign = 'center'; og.lineJoin = 'round'; let txt = c.text.replace(/FUCK/g, 'F***'), size = 100; while (og.measureText(txt).width > W * .86 && size > 60) { size -= 6; og.font = `900 ${size}px Nunito`; }
  og.lineWidth = 24; og.strokeStyle = '#000'; og.strokeText(txt, 0, 0); og.fillStyle = '#ffd23a'; og.fillText(txt, 0, 0); og.restore(); }
let TIMER = null;    // [start final-time, start secs, zero final-time]
function timerHud(t) { if (!TIMER) return; const [t0, s0, t1] = TIMER; if (t < t0) return; const left = Math.max(0, Math.round(s0 * (1 - clamp((t - t0) / (t1 - t0)) ** 1.15))); const k = pop(t - t0), x = W / 2, y = 230, red = left === 0 && Math.floor(t * 6) % 2;
  og.save(); og.translate(x, y); og.scale(k, k); og.fillStyle = red ? '#ffffff' : '#e8423a'; og.beginPath(); og.roundRect(-200, -72, 400, 128, 32); og.fill(); og.fillStyle = red ? '#e8423a' : '#fff'; og.textAlign = 'center'; og.font = '900 40px Nunito'; og.fillText('MOM HOME IN', 0, -24); og.font = '900 66px Nunito'; og.fillText(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 0, 38); og.restore(); }
function notif(t, t0, t1, who, msg) { if (t < t0 || t > t1) return; const k = ss(t0, t0 + .15, t) * (1 - ss(t1 - .12, t1, t)), y = 380 - (1 - k) * 260; og.save(); og.globalAlpha = k;
  og.fillStyle = 'rgba(255,255,255,.97)'; og.beginPath(); og.roundRect(90, y, W - 180, 150, 36); og.fill(); og.fillStyle = '#e8427a'; og.beginPath(); og.arc(170, y + 75, 42, 0, 7); og.fill(); og.fillStyle = '#fff'; og.font = '900 44px Nunito'; og.textAlign = 'center'; og.fillText('♥', 170, y + 90);
  og.textAlign = 'left'; og.fillStyle = '#888'; og.font = '900 34px Nunito'; og.fillText(who, 240, y + 60); og.fillStyle = '#16121a'; og.font = '900 46px Nunito'; og.fillText(msg, 240, y + 112); og.restore(); }
function bang(t, t0, txt, col = '#ffd23a', x = W / 2, y = H * .3, rot = -.08) { const d = t - t0; if (d < 0 || d > .7) return; const k = pop(d), a = 1 - ss(.5, .7, d); og.save(); og.globalAlpha = a; og.translate(x, y); og.rotate(rot); og.scale(k * 1.0, k * 1.0); og.font = '900 150px Nunito'; og.textAlign = 'center'; og.lineJoin = 'round'; og.lineWidth = 26; og.strokeStyle = '#16121a'; og.strokeText(txt, 0, 0); og.fillStyle = col; og.fillText(txt, 0, 0); og.restore(); }
function shopCard(t, t0, t1, stage) { if (t < t0 || t > t1) return; const k = pop(t - t0), cx = W * .66, cy = H * .36; og.save(); og.translate(cx, cy); og.scale(k * .82, k * .82);
  og.fillStyle = '#1c1c24'; og.beginPath(); og.roundRect(-230, -330, 460, 660, 54); og.fill(); og.fillStyle = '#f4f6fa'; og.beginPath(); og.roundRect(-205, -300, 410, 600, 34); og.fill();
  og.fillStyle = '#3a6ad8'; og.beginPath(); og.moveTo(-50, -150); og.lineTo(50, -150); og.lineTo(70, -40); og.lineTo(30, 30); og.lineTo(-30, 30); og.lineTo(-70, -40); og.closePath(); og.fill(); og.fillStyle = '#f2c230'; og.fillRect(-66, -70, 132, 16);
  og.textAlign = 'center'; og.fillStyle = '#16121a'; og.font = '900 44px Nunito'; og.fillText('FANCY VASE', 0, 100); og.fillStyle = '#2a8a3a'; og.font = '900 40px Nunito'; og.fillText('$49.99', 0, 150);
  if (stage(t) === 0) { og.fillStyle = '#f2b630'; og.beginPath(); og.roundRect(-150, 190, 300, 80, 40); og.fill(); og.fillStyle = '#16121a'; og.font = '900 40px Nunito'; og.fillText('BUY NOW', 0, 244); }
  else { og.fillStyle = '#e8423a'; og.font = '900 34px Nunito'; og.fillText('Arriving in', 0, 205); og.fillText('3-5 business days', 0, 250); } og.restore(); }

// ===================== SHOTS (voice clock) =====================
const SH = [];
function shot(o0, o1, build) { SH.push({ a: F(o0), b: o1 >= 900 ? DUR + 1 : F(o1), o0, build }); }
const cam = new THREE.PerspectiveCamera(42, W / H, .05, 80);
function camAt(px, py, pz, tx, ty, tz, fov = 42, t = 0, shake = .012) { cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(px + noise1(t * .7) * shake, py + noise1(t * .6 + 9) * shake, pz); cam.lookAt(tx + noise1(t * .5 + 3) * shake * .5, ty, tz); }
const idle = (p, t, extra = {}) => { pose(p, extra); p.userData.body.position.y = Math.sin(t * 2.2) * .008; p.userData.head.rotation.x = Math.sin(t * 1.3) * .03; };
const L = (o, o0) => F(o) - F(o0);   // event time relative to shot start

