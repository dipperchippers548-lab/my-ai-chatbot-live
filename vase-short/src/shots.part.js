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
  og.font = '900 100px Nunito'; og.textAlign = 'center'; og.lineJoin = 'round'; let txt = c.text, size = 100; while (og.measureText(txt).width > W * .86 && size > 60) { size -= 6; og.font = `900 ${size}px Nunito`; }
  og.lineWidth = 24; og.strokeStyle = '#000'; og.strokeText(txt, 0, 0); og.fillStyle = /FUCK/.test(txt) ? '#ffe14a' : '#ffffff'; og.fillText(txt, 0, 0); og.restore(); }
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

// 1 "You broke your mom's favorite fucking vase. She's home in ten minutes." - FIRST FRAME: the vase mid-air, his hands reaching... SMASH
shot(0, 4.9, () => { const R = livingRoom(), d = person(DALE); R.scene.add(d); d.position.set(-.35, 0, -.9); d.rotation.y = -.35; R.vase.visible = false; const v = newVase(); R.scene.add(v); const sh = shards(R.scene, 14, -1.0, -1.15, 0x3a6ad8, 3); const T2 = L(2.99, 0);
  return (t) => { const fall = t < .06; v.visible = fall; v.position.set(-1.0, .5 - t * 4, -1.2); v.rotation.set(.5, 0, .9); burst(sh, -1.0, .2, -1.2, fall ? 0 : clamp((t - .06) / .45)); sh.forEach(s => s.visible = !fall);
    d.setFace(t < .5 ? 'shock' : t < T2 ? 'calm' : 'worried'); idle(d, t, { armL: [-1.0 + ss(.4, 1, t) * .9, 0, .5 - ss(.4, 1, t) * .4], armR: [-1.0 + ss(.4, 1, t) * .9, 0, -.3], lean: .15 - ss(.4, 1, t) * .15 });
    camAt(lerp(.3, .1, t / 4), 1.35, lerp(2.7, 2.2, t / 4), -.6, .85, -1.0, 44, t); }; });
// 2 "So you glue it back together. It falls the fuck apart." - at the coffee table with a glue bottle... the vase sags and falls apart
shot(4.9, 8.95, () => { const R = livingRoom(), d = person(DALE); R.scene.add(d); d.position.set(.15, 0, .55); d.rotation.y = Math.PI; R.vase.visible = false; const tb = new THREE.Group(); tb.position.set(.15, 0, -.1); R.scene.add(tb); tb.add(at(mesh(new THREE.BoxGeometry(1.3, .08, .7), 0x8a5a34), 0, .5, 0)); for (const [x, z] of [[-.55, -.25], [.55, -.25], [-.55, .25], [.55, .25]]) tb.add(at(mesh(new THREE.BoxGeometry(.06, .5, .06), 0x6a4024), x, .25, z));
  const v = newVase(); v.position.set(.15, .54, -.1); R.scene.add(v); const cracks = new THREE.Mesh(new THREE.CylinderGeometry(.21, .21, .42, 7, 1, true), new THREE.MeshBasicMaterial({ map: ctex(128, 64, (g, w, h) => { g.strokeStyle = '#f4f0e8'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); let x = hash(i) * w, y = 0; g.moveTo(x, y); while (y < h) { x += (hash(x + y) - .5) * 20; y += 10; g.lineTo(x, y); } g.stroke(); } }), transparent: true })); cracks.position.y = .2; v.add(cracks);
  const sh = shards(R.scene, 10, .15, -.1, 0x3a6ad8, 9); sh.forEach(s => s.userData.home.set(.15 + (s.userData.home.x - .15) * .5, .58, -.1 + (s.userData.home.z + .1) * .3)); const glue = tube(0xf4f4f0); R.scene.add(glue); const TF = L(7.37, 4.9);
  return (t) => { const fell = t > TF; v.visible = !fell; v.rotation.z = Math.sin(t * 9) * .02 * ss(TF - 1, TF, t); sh.forEach(s => s.visible = fell); if (fell) burst(sh, .15, .8, -.1, clamp((t - TF) / .35));
    d.setFace(fell ? 'tired' : 'calm'); idle(d, t, { armL: [-1.1, 0, .2], armR: [-1.2 + Math.sin(t * 8) * .08, 0, -.15], lean: .25 }); d.userData.arms[1].userData.hand.getWorldPosition(glue.position); glue.position.y += .05; glue.rotation.x = -1.2;
    camAt(.7, 1.55, -2.25, .15, .85, .35, 48, t); }; });   // looking at him across the table
// 3 "So you get superglue. Now the vase is fixed... and so is your fucking hand." - superglue tube... vase whole... he lets go: it stays on his hand
shot(8.95, 14.7, () => { const R = livingRoom(), d = person(DALE); R.scene.add(d); d.position.set(0, 0, -.4); d.rotation.y = 0; R.vase.visible = false; const v = newVase(); d.userData.arms[1].userData.hand.add(v); v.position.set(0, -.08, 0); v.rotation.x = Math.PI; const tb = tube(0xe8423a); R.scene.add(tb);
  const TF = L(11.6, 8.95), TH = L(12.97, 8.95);
  return (t) => { const shakeIt = t > TH ? Math.sin(t * 30) * .25 : 0; d.setFace(t < TF ? 'calm' : t < TH ? 'happy' : 'shock');
    const up = t < TF ? -1.3 : t < TH ? -1.5 : -1.4 + shakeIt; idle(d, t, { armL: t < TH ? [-1.2, 0, -.3] : [0, 0, .3], armR: [up, 0, .1], lean: 0 });
    d.userData.arms[0].userData.hand.getWorldPosition(tb.position); tb.visible = t < TF; tb.rotation.z = 2.2;
    v.rotation.set(Math.PI + .3, 0, 0); v.position.set(0, -.12, .02);
    const k = ss(TH - .3, TH + .2, t); camAt(lerp(.5, .35, k), lerp(1.4, 1.3, k), lerp(2.4, 1.4, k), lerp(0, .15, k), lerp(1.1, 1.15, k), -.4, 42, t); }; });
// 4 "So you try to shake it off... and the vase swings right into the fucking TV." - flailing arm... CRASH into the TV
shot(14.7, 20.2, () => { const R = livingRoom(), d = person(DALE); R.scene.add(d); d.position.set(-.4, 0, -.2); d.rotation.y = .2; R.vase.visible = false; const v = newVase(); d.userData.arms[1].userData.hand.add(v); v.rotation.x = Math.PI + .3; v.position.set(0, -.12, .02); const T = tv(R.scene, .95, -.9, -.5); const sh = shards(R.scene, 10, .8, -.6, 0x8a8a9a, 21);
  const TS = L(16.9, 14.7), TH = L(18.05, 14.7);
  return (t) => { const hit = t > TH; T.userData.crack(hit); sh.forEach(s => s.visible = hit); if (hit) burst(sh, .9, 1.0, -.8, clamp((t - TH) / .5));
    const sw = t < TS ? Math.sin(t * 22) * .9 : t < TH ? lerp(0, -2.2, ss(TS, TH, t)) : -2.2 + Math.sin((t - TH) * 30) * .2 * Math.exp(-(t - TH) * 5);
    d.setFace(t < TH ? 'worried' : 'shock'); idle(d, t, { armL: [0, 0, .5], armR: t < TS ? [-.6 + Math.sin(t * 17) * .5, 0, -.4 + sw] : [-.8, 0, sw * .8], lean: t < TS ? Math.sin(t * 11) * .08 : 0 });
    d.rotation.y = t < TS ? .2 + Math.sin(t * 9) * .2 : lerp(.2, -.5, ss(TS, TH, t)); d.position.y = t < TS ? Math.abs(Math.sin(t * 11)) * .06 : 0;
    camAt(-.1 + (hit ? Math.sin(t * 50) * .04 * Math.exp(-(t - TH) * 6) : 0), 1.3, 3.0, .25, .95, -.5, 44, t); }; });
// 5 "Now two things are fucked." - wide, still: smoking TV, him with a vase on his hand
shot(20.2, 22.6, () => { const R = livingRoom(), d = person(DALE); R.scene.add(d); d.position.set(-.2, 0, -.2); d.rotation.y = 0; R.vase.visible = false; const v = newVase(); d.userData.arms[1].userData.hand.add(v); v.rotation.x = Math.PI + .3; v.position.set(0, -.12, .02); const T = tv(R.scene, .95, -.9, -.5); T.userData.crack(true); const sh = shards(R.scene, 10, .8, -.6, 0x8a8a9a, 21); burst(sh, 0, 0, 0, 1);
  const smoke = [...Array(6)].map((_, i) => { const p = mesh(new THREE.IcosahedronGeometry(.12, 0), 0x9a9aa4); R.scene.add(p); return p; });
  return (t) => { smoke.forEach((p, i) => { const k = (t * .4 + i / 6) % 1; p.position.set(.9 + Math.sin(i * 3 + t) * .1, 1.4 + k * 1.2, -.9); p.scale.setScalar(.6 + k * 1.4); });
    d.setFace('tired'); idle(d, t, { armL: [0, 0, .12], armR: [0, 0, -.12] }); camAt(.2, 1.2, 3.9, .3, 1.0, -.5, 40, t, .005); }; });
// 6 "So you order a new vase online. Arriving in three to five business days. Fuck." - phone up... the shop card... the shipping date... dead stare
shot(22.6, 29.3, () => { const R = livingRoom(), d = person(DALE); R.scene.add(d); d.position.set(0, 0, -.3); R.vase.visible = false; const v = newVase(); d.userData.arms[1].userData.hand.add(v); v.rotation.x = Math.PI + .3; v.position.set(0, -.12, .02); const ph = phone(); d.userData.arms[0].userData.hand.add(ph); ph.position.set(.0, -.05, .08); ph.rotation.set(-1.2, 0, 0);
  const TA = L(25.06, 22.6), TF = L(27.89, 22.6);
  return (t) => { d.setFace(t < TA ? 'calm' : t < TF ? 'worried' : 'tired'); idle(d, t, { armL: [-1.5, 0, -.35], armR: [0, 0, -.15] }); const k = ss(TF - .1, TF + .1, t);
    camAt(lerp(-.2, .05, k), lerp(1.35, 1.5, k), lerp(2.6, 1.15, k), lerp(.45, 0, k), lerp(1.1, 1.45, k), -.3, 42, t); }; });
// 7 "So you decide to make one. Out of mud. From the fucking backyard." - backyard: slapping mud into a lumpy vase on a crate
shot(29.3, 34.7, () => { const Y = yard(), d = person(DALE); Y.setDepth(0); Y.piles.forEach(p => p.visible = false); Y.scene.add(d); d.position.set(-.8, 0, 1.2); d.rotation.y = .5; const v = newVase(); d.userData.arms[1].userData.hand.add(v); v.rotation.x = Math.PI + .3; v.position.set(0, -.12, .02);
  const crate = at(mesh(new THREE.BoxGeometry(.6, .5, .6), 0xb88a5a), -.1, .25, 1.4); Y.scene.add(crate); const lump = mesh(lowpoly(new THREE.IcosahedronGeometry(.2, 1), .08, 80), 0x7a4a2a); lump.position.set(-.1, .62, 1.4); Y.scene.add(lump); const TM = L(31.5, 29.3);
  return (t) => { const k = ss(TM - .2, TM + 1.5, t); lump.scale.set(1 + k * .3, .5 + k * 1.6 + Math.sin(t * 9) * .05 * k, 1 + k * .2); lump.position.y = .5 + (.12 + k * .3);
    d.setFace(t < TM ? 'calm' : 'happy'); idle(d, t, { armL: [-1.1 + Math.sin(t * 12) * .3 * (t > TM), 0, .1], armR: [-.4, 0, -.2], lean: .2 }); camAt(1.0, 1.5, 4.9, -.45, .85, 1.3, 44, t); }; });
// 8 "Not enough mud. So you grab a shovel... and dig. And dig. And fucking dig." - deeper every cut
shot(34.7, 41.55, () => { const Y = yard(), d = person(DALE), sv = shovel(); Y.scene.add(d, sv); const v = newVase(); d.userData.arms[1].userData.hand.add(v); v.rotation.x = Math.PI + .3; v.position.set(0, -.12, .02);
  const T1 = L(37.88, 34.7), T2 = L(39.07, 34.7), T3 = L(40.06, 34.7), TG = L(36.43, 34.7);
  return (t) => { const stage = t < T1 ? 0 : t < T2 ? 1 : t < T3 ? 2 : 3, depth = [0, .6, 1.3, 3.2][stage]; Y.setDepth(depth); Y.piles.forEach((p, i) => { p.visible = stage > 0; p.scale.setScalar([0, .5, .9, 1.5][stage]); });
    d.position.set(stage === 0 ? -1.3 : 0, -depth, stage === 0 ? .9 : 0); d.rotation.y = stage === 0 ? .4 : .3;
    const dig = stage ? Math.max(0, Math.sin((t - [0, T1, T2, T3][stage]) * 9)) : 0; d.setFace(stage < 3 ? (t < TG ? 'calm' : 'tired') : 'tired');
    idle(d, t, { armL: [-1.0 - dig * .5, 0, .2], armR: [-.6 - dig * .5, 0, -.2], lean: .25 + dig * .25 }); d.updateMatrixWorld(true); d.userData.arms[0].userData.hand.getWorldPosition(sv.position); sv.position.y -= .5; sv.rotation.set(.35 + dig * .5, d.rotation.y, 0); sv.visible = t > TG;
    if (stage === 0) camAt(.6, 1.2, 3.6, -.9, .9, .6, 44, t); else if (stage === 1) camAt(1.8, 1.9, 2.4, 0, .1, 0, 46, t); else if (stage === 2) camAt(.3, 3.0, 2.0, 0, -.6, 0, 46, t); else camAt(.05, 5.5, .6, 0, -3.0, 0, 40, t); }; });
// 9 "Then you hear the car pull in." - the driveway: Mom's car rolls in, headlights on, timer hits 0:00
shot(41.55, 43.5, () => { const Y = yard(), c = carMesh(0x8a5ac8); Y.scene.add(c); Y.setDepth(3.2); c.rotation.y = -Math.PI / 2 + .3; Y.piles.forEach(p => p.visible = false);
  return (t) => { const k = ss(0, .65, t); c.position.set(lerp(6.5, 2.6, k), Math.sin(t * 30) * .01 * (1 - k), -2.6); c.rotation.y = -Math.PI / 2 + .3 * k; camAt(-.4, 1.2, 3.0, 2.5, .8, -2.6, 46, t); }; });
// 10 "Your mom looks down the hole." - from the bottom of the hole: her head peeks over the rim against the sky
shot(43.5, 45.4, () => { const Y = yard(), m = person(MOM); Y.setDepth(3.2); Y.scene.add(m); m.position.set(0, 0, -.95); m.rotation.y = 0;
  return (t) => { const k = ss(0, .6, t); m.userData.torso.rotation.x = lerp(.2, 1.15, k); m.setFace('shock'); pose(m, { armL: [0, 0, .5], armR: [0, 0, -.5] }); m.userData.torso.rotation.x = lerp(.2, 1.15, k); camAt(0, -2.2, .25, 0, 1.0, -.2, 50, t, .006); }; });
// 11 "You're covered in mud, with a vase glued to your fucking hand." - straight down on him: muddy, vase on hand
shot(45.4, 49.75, () => { const Y = yard(), d = person(MUD); Y.setDepth(3.2); Y.scene.add(d); d.position.set(0, -3.2, 0); d.rotation.y = .2; const v = newVase(0x6a5a8a); d.userData.arms[1].userData.hand.add(v); v.rotation.x = Math.PI + .3; v.position.set(0, -.12, .02); const TV_ = L(47.06, 45.4);
  return (t) => { d.setFace('worried'); idle(d, t, { armL: [0, 0, .2], armR: t > TV_ ? [-2.6, 0, -.2] : [-.3, 0, -.2] }); d.userData.head.rotation.x = -.5; const k = t / 4; camAt(0, lerp(1.8, .3, k), .5, 0, -3, 0, 40, t, .006); }; });
// 12 "She says, You're grounded." - from below: Mom, furious, says it
shot(49.75, 52.3, () => { const Y = yard(), m = person(MOM); Y.setDepth(3.2); Y.scene.add(m); m.position.set(0, 0, -.95); const t0 = F(49.75); const fl = new THREE.PointLight(0xfff0e0, 6, 6, 1); fl.position.set(0, -1.5, .3); Y.scene.add(fl);
  return (t) => { const T = t + t0, talking = T > F(50.7) && T < F(51.6) && lvl(T) > .12; m.setFace(talking ? 'madopen' : 'mad'); pose(m, { armL: [0, 0, 1.0], armR: [0, 0, -1.0] }); m.userData.torso.rotation.x = 1.15 + Math.sin(t * 2) * .02; camAt(0, -2.2, .25, 0, 1.0, -.25, lerp(50, 38, ss(0, 2.4, t)), t, .006); }; });
// 13 "Well... you're already in the fucking ground. Fucking genius." - down the hole: he looks up, deadpan... genius
shot(52.3, 999, () => { const Y = yard(), d = person(MUD); Y.setDepth(3.2); Y.scene.add(d); d.position.set(0, -3.2, 0); d.rotation.y = .2; const v = newVase(0x6a5a8a); d.userData.arms[1].userData.hand.add(v); v.rotation.x = Math.PI + .3; v.position.set(0, -.12, .02); const TG = L(55.41, 52.3);
  return (t) => { d.setFace(t < TG ? 'tired' : 'happy'); idle(d, t, { armL: t > TG ? [-2.8, 0, .3] : [0, 0, .2], armR: [-.3, 0, -.2] }); d.userData.head.rotation.x = -.55; camAt(0, lerp(2.2, .9, ss(0, 4.5, t)), .45, 0, -3, 0, 40, t, .006); }; });

// ===================== RENDER =====================
TIMER = [F(2.99), 600, F(42.75)];
const built = new Map();
function renderAt(t) { let i = SH.findIndex((s, k) => t >= s.a && (k + 1 >= SH.length || t < SH[k + 1].a)); if (i < 0) i = 0; const s = SH[i];
  if (!built.has(i)) { for (const k of [...built.keys()]) if (k < i - 1) built.delete(k); const up = s.build(); built.set(i, { up, sc: window.__sc }); }
  const B = built.get(i); B.up(t - s.a); renderer.render(B.sc, cam); og.drawImage(renderer.domElement, 0, 0);
  // HUD
  if (t < F(43.4)) timerHud(t);
  notif(t, F(2.99), F(4.9), 'Mom', 'home in 10!');
  shopCard(t, F(22.9), F(27.85), t => t < F(25.0) ? 0 : 1);
  bang(t, F(0.05), 'CRASH!'); bang(t, F(18.05), 'CRASH!', '#ffd23a', W / 2, H * .3, .08); bang(t, F(37.88), 'CHUNK', '#c8874a', W / 2, H * .5); bang(t, F(39.07), 'CHUNK', '#c8874a', W / 2, H * .5, .08); bang(t, F(40.71), 'CHUNK!', '#c8874a', W / 2, H * .5); bang(t, F(50.92), 'GROUNDED.', '#e8423a', W / 2, H * .2, 0);
  caption(t); }
// scenes register themselves: wrap Scene creation so the shot's scene is the one rendered
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .9); };
window.renderFrame = i => { renderAt(i / FPS); return out.toDataURL('image/jpeg', .92); };
window.frameCount = NF; window.ready = true;
