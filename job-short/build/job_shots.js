// ===================== "Why Some People Fumble During a Job Interview" =====================
const SK = 0xf0b48a;
const HERO = { skin: SK, hair: 0xd8632a, top: 0x2a3a6a, top2: 0x22305a, pants: 0x2a3a6a, shoe: 0x16121a, sole: 0x2a2a2a, sock: 0x2a3a6a, kind: 'cardigan' };
const BOSS = { skin: SK, hair: SK, top: 0x7a7a86, top2: 0x6a6a76, pants: 0x4a4a54, shoe: 0x16121a, sole: 0x2a2a2a, sock: 0x4a4a54, kind: 'cardigan' };
function adult(p, s = 1.06) { p.scale.setScalar(s); p.userData.head.scale.setScalar(.85); return p; }
// faces: talking versions (open mouth) for lip sync
const openMouth = (base, col = '#f0b48a') => ctex(256, 256, g => { g.drawImage(faceTex(base).image || base.image, 0, 0); g.fillStyle = col; g.fillRect(92, 166, 72, 40); g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(128, 186, 22, 15, 0, 0, 7); g.fill(); g.fillStyle = '#e86a6a'; g.beginPath(); g.ellipse(128, 194, 13, 6, 0, 0, 7); g.fill(); });
FACES.smugtalk = ctex(256, 256, g => { g.drawImage(FACES.smug.image, 0, 0); g.fillStyle = '#f0b48a'; g.fillRect(92, 166, 72, 40); g.fillStyle = '#16121a'; g.beginPath(); g.ellipse(128, 186, 22, 15, 0, 0, 7); g.fill(); });
FACES.tiredtalk = openMouth('tired'); FACES.calmtalk = openMouth('calm'); FACES.happytalk = ctex(256, 256, g => { g.drawImage(faceTex('happy').image, 0, 0); });
const talking = () => lvl(window.__T) >= 2;
const tf = (p, base) => p.setFace(talking() && FACES[base + 'talk'] ? base + 'talk' : base);
// --- wardrobe ---
// our funkin' genius kid's spiky orange hair, combed down a bit for the interview
const HAIR = 0xd8632a;
function cleanSpikes(p) { const hd = p.userData.head; [...hd.children].forEach(c => { if (c.isMesh && c.material.color && c.material.color.getHex() === HAIR) hd.remove(c); });
  const base = mesh(lowpoly(new THREE.IcosahedronGeometry(.25, 1), .02, 44), HAIR); base.scale.set(1.1, .55, 1.02); base.position.set(0, .42, -.05); hd.add(base);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, c = mesh(lowpoly(new THREE.ConeGeometry(.08, .15, 4), .01, 30 + i), HAIR); c.position.set(Math.cos(a) * .15, .5, Math.sin(a) * .13 - .05); c.rotation.set(Math.sin(a) * .5 - .5, 0, -Math.cos(a) * .5); hd.add(c); }
  const tuft = mesh(new THREE.ConeGeometry(.055, .16, 4), HAIR); tuft.position.set(-.06, .6, .08); tuft.rotation.set(.5, 0, .9); hd.add(tuft);   // neat little front flick, combed to the side
  return p; }
function dressHero(p) { cleanSpikes(p); const T = p.userData.torso; const tie = new THREE.Group(); tie.position.set(0, .38, -.255); T.add(tie); tie.add(at(mesh(new THREE.BoxGeometry(.09, .07, .04), 0xe8323a), 0, .12, 0)); tie.add(at(mesh(new THREE.ConeGeometry(.07, .32, 4), 0xe8323a), 0, -.07, 0)); tie.children[1].rotation.x = Math.PI;
  const belly = mesh(lowpoly(new THREE.IcosahedronGeometry(.13, 1), .01, 3), SK); belly.scale.set(1, .55, .45); belly.position.set(0, .06, .22); T.add(belly);
  for (const s of [-1, 1]) T.add(at(mesh(new THREE.BoxGeometry(.012, .3, .012), 0xf4ead8), s * .12, .3, .23));
  const btn = mesh(new THREE.CylinderGeometry(.03, .03, .012, 8), 0xd8b060); btn.rotation.x = Math.PI / 2; btn.position.set(0, .2, .25); T.add(btn); p.userData.btn = btn; p.userData.tie = tie; return p; }
function dressBoss(p) { const H_ = p.userData.head, T = p.userData.torso; const g = new THREE.Group(); g.position.set(0, .3, .29); H_.add(g); for (const s of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(.065, .014, 5, 12), 0x16121a); r.position.x = s * .08; g.add(r); } g.add(at(mesh(new THREE.BoxGeometry(.05, .014, .014), 0x16121a), 0, 0, 0));
    for (const s of [-1, 1]) H_.add(at(mesh(lowpoly(new THREE.IcosahedronGeometry(.08, 0), .02, 8 + s), 0x9a9a9a), s * .27, .33, -.04));
  T.add(at(mesh(new THREE.BoxGeometry(.08, .06, .03), 0x2a5ad8), 0, .52, .245)); const tie = mesh(new THREE.ConeGeometry(.06, .34, 4), 0x2a5ad8); tie.rotation.x = Math.PI; tie.position.set(0, .3, .25); T.add(tie); return adult(p); }
// --- office set ---
function card3(w, h, draw, pw = 256) { const ph = Math.round(pw * h / w), c = document.createElement('canvas'); c.width = pw; c.height = ph; const g = c.getContext('2d'); const T = new THREE.CanvasTexture(c); T.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: T }));
  m.userData.draw = (...a) => { g.clearRect(0, 0, pw, ph); draw(g, pw, ph, ...a); T.needsUpdate = true; }; m.userData.draw(0); return m; }
function officeChair() { const g = new THREE.Group(); g.add(at(mesh(new THREE.CylinderGeometry(.04, .04, .32, 6), 0x2a2a2a), 0, .2, 0)); for (let i = 0; i < 5; i++) { const l = mesh(new THREE.BoxGeometry(.04, .03, .32), 0x2a2a2a); l.rotation.y = i * 1.256; l.position.y = .03; g.add(l); }
  g.add(at(mesh(lowpoly(new THREE.BoxGeometry(.56, .12, .52, 2, 1, 2), .02, 6), 0x16161e), 0, .42, 0)); g.add(at(mesh(lowpoly(new THREE.BoxGeometry(.56, .7, .1, 2, 2, 1), .02, 7), 0x16161e), 0, .85, -.26)); return g; }
function woodChair() { const g = new THREE.Group(); g.add(at(mesh(new THREE.BoxGeometry(.5, .06, .46), 0xb87a4a), 0, .44, 0)); for (const [x, z] of [[-.21, -.19], [.21, -.19], [-.21, .19], [.21, .19]]) g.add(at(mesh(new THREE.BoxGeometry(.05, .44, .05), 0x9a6238), x, .22, z));
  g.add(at(mesh(new THREE.BoxGeometry(.5, .5, .05), 0xb87a4a), 0, .72, .21)); return g; }
function office() { const sc = roomLP(0xcfdcea, 0x7a8a9a, 0xcfdcea); sc.children.find(o => o.isHemisphereLight).intensity = 1.5;
  // carpet tiles
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(.98, .98), new THREE.MeshLambertMaterial({ color: (i + j) % 2 ? 0x6a7a8a : 0x748494 })); t.rotation.x = -Math.PI / 2; t.position.set(-2.5 + i, .004, -2 + j); t.receiveShadow = true; sc.add(t); }
  const desk = new THREE.Group(); desk.position.set(0, 0, -.75); sc.add(desk); desk.add(at(mesh(lowpoly(new THREE.BoxGeometry(1.8, .08, .82, 3, 1, 2), .01, 2), 0x8a5a34), 0, .74, 0)); desk.add(at(mesh(new THREE.BoxGeometry(1.76, .62, .05), 0x7a4a2a), 0, .4, .37)); for (const s of [-1, 1]) desk.add(at(mesh(new THREE.BoxGeometry(.05, .7, .78), 0x7a4a2a), s * .86, .35, 0));
  const lap = new THREE.Group(); lap.position.set(.42, .78, -.85); sc.add(lap); lap.add(mesh(new THREE.BoxGeometry(.42, .02, .3), 0x9aa0ac)); const scrn = mesh(new THREE.BoxGeometry(.42, .28, .015), 0x9aa0ac); scrn.position.set(0, .14, .15); scrn.rotation.x = -.25; lap.add(scrn); const disp = new THREE.Mesh(new THREE.PlaneGeometry(.38, .24), new THREE.MeshBasicMaterial({ color: 0x8fd0ff })); disp.position.set(0, .14, .14); disp.rotation.set(-.25, Math.PI, 0); lap.add(disp);
  const mug = new THREE.Group(); mug.position.set(-.55, .78, -.62); sc.add(mug); mug.add(at(mesh(new THREE.CylinderGeometry(.06, .055, .13, 10), 0xf4f4f0), 0, .065, 0)); const hdl = mesh(new THREE.TorusGeometry(.035, .012, 5, 10), 0xf4f4f0); hdl.position.set(.07, .07, 0); mug.add(hdl); mug.add(at(new THREE.Mesh(new THREE.CircleGeometry(.052, 10), new THREE.MeshLambertMaterial({ color: 0x4a2a14 })), 0, .12, 0)); mug.children[2].rotation.x = -Math.PI / 2;
  const plate = card3(.4, .1, (g, w, h, s) => { g.fillStyle = s ? '#d8b060' : '#2a2a30'; g.fillRect(0, 0, w, h); g.fillStyle = s ? '#16121a' : '#e8c870'; g.font = `900 ${h * .55}px Nunito`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s ? 'THE BOSS' : 'HIRING MGR', w / 2, h * .55); }); plate.position.set(0, .84, -.36); plate.rotation.x = -.3; sc.add(plate); sc.add(at(mesh(new THREE.BoxGeometry(.42, .02, .08), 0x2a2a30), 0, .79, -.38));
  const pad = card3(.26, .34, (g, w, h, k) => { g.fillStyle = '#fff8c0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9ac0e0'; g.lineWidth = 2; for (let y = 40; y < h; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = '#e8323a'; g.fillRect(28, 0, 3, h);
    if (k > 0) { g.save(); g.beginPath(); g.rect(0, 0, w * Math.min(1, k * 1.3), h); g.clip(); g.fillStyle = '#16121a'; g.font = '900 150px Nunito'; g.textAlign = 'center'; g.fillText('NO', w / 2, h * .62); g.restore(); } if (k > .85) { g.strokeStyle = '#e8323a'; g.lineWidth = 9; g.beginPath(); g.arc(w / 2, h * .5, w * .44, 0, 7); g.stroke(); } }, 256);
  pad.rotation.x = -Math.PI / 2; pad.rotation.z = .2; pad.position.set(-.1, .785, -.95); sc.add(pad);
  const pen = mesh(new THREE.CylinderGeometry(.008, .008, .16, 6), 0x2a5ad8); pen.rotation.z = Math.PI / 2; pen.position.set(.08, .8, -.95); sc.add(pen);
  const bc = officeChair(); bc.position.set(0, 0, -1.5); sc.add(bc); const hc = woodChair(); hc.position.set(0, 0, .3); sc.add(hc);
  // back wall: door, window with skyline, poster, clock; side: filing cabinet, plant, water cooler
  const doorPiv = new THREE.Group(); doorPiv.position.set(-2.4, 0, -2.45); sc.add(doorPiv); const door = mesh(new THREE.BoxGeometry(.95, 2.1, .06), 0x8a5a34); door.position.set(.475, 1.05, 0); doorPiv.add(door); doorPiv.add(at(mesh(new THREE.SphereGeometry(.04, 6, 4), 0xd8b060), .85, 1.0, .05));
  sc.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.95, 2.1), new THREE.MeshBasicMaterial({ color: 0x2a2a34 })), -1.925, 1.05, -2.48));
  sc.add(at(mesh(new THREE.BoxGeometry(1.6, 1.2, .08), 0xf4f0e8), 1.3, 1.85, -2.47)); const city = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.05), new THREE.MeshBasicMaterial({ map: ctex(256, 192, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6ab8ff'); gr.addColorStop(1, '#c8e8ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { const bw = 20 + hash(i) * 20, bh = 60 + hash(i + 2) * 100, x = i * 28; g.fillStyle = ['#7a8aa8', '#8a9ab8', '#6a7a98'][i % 3]; g.fillRect(x, h - bh, bw, bh); g.fillStyle = '#d8e8ff'; for (let y = h - bh + 8; y < h - 6; y += 14) for (let xx = x + 4; xx < x + bw - 4; xx += 8) g.fillRect(xx, y, 4, 6); } }) })); city.position.set(1.3, 1.85, -2.42); sc.add(city); sc.add(at(mesh(new THREE.BoxGeometry(.06, 1.1, .1), 0xf4f0e8), 1.3, 1.85, -2.4));
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(.6, .8), new THREE.MeshLambertMaterial({ map: ctex(150, 200, (g, w, h) => { g.fillStyle = '#2a3a6a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c230'; g.beginPath(); g.arc(w / 2, 80, 34, 0, 7); g.fill(); g.fillStyle = '#16121a'; g.beginPath(); g.arc(w / 2 - 12, 74, 5, 0, 7); g.arc(w / 2 + 12, 74, 5, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 20px Nunito'; g.textAlign = 'center'; g.fillText('HANG IN', w / 2, 150); g.fillText('THERE', w / 2, 175); }) })); poster.position.set(-.6, 1.9, -2.48); sc.add(poster);
  const clk = new THREE.Mesh(new THREE.CircleGeometry(.2, 20), new THREE.MeshLambertMaterial({ map: ctex(128, 128, (g, w) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.lineWidth = 7; g.strokeStyle = '#16121a'; g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 24); g.moveTo(64, 64); g.lineTo(92, 64); g.stroke(); }) })); clk.position.set(.25, 2.75, -2.48); sc.add(clk);
  const cab = mesh(new THREE.BoxGeometry(.5, 1.2, .55), 0x8a92a0); cab.position.set(-3.0 + .35, .6, -1.6); sc.add(cab); for (let i = 0; i < 3; i++) sc.add(at(mesh(new THREE.BoxGeometry(.14, .03, .03), 0xd8d8e0), -2.65 + .26, .3 + i * .38, -1.6));
  sc.add(at(mesh(new THREE.CylinderGeometry(.2, .16, .4, 8), 0xc8603a), 2.4, .2, -2.0)); for (let i = 0; i < 8; i++) { const lf = mesh(new THREE.ConeGeometry(.08, .7, 4), 0x3a9a4a); lf.position.set(2.4, .65, -2.0); lf.rotation.set(Math.cos(i) * .6, i, Math.sin(i * 1.7) * .6); sc.add(lf); }
  for (let i = 0; i < 3; i++) sc.add(at(mesh(new THREE.BoxGeometry(.32, .04, .24), [0xf4f4f0, 0xe8e8d8, 0xf4f4f0][i]), -.55, .79 + i * .04, -1.0));
  return { sc, mug, lap, plate, pad, pen, bc, hc, doorPiv, disp }; }
const SEAT = .07;   // y offset for someone sitting on these chairs
const bossSit = (S, b) => { b.position.set(0, SEAT + .02, -1.5); b.rotation.y = 0; };
const heroSit = (S, h) => { h.position.set(0, SEAT, .3); h.rotation.y = Math.PI; };
function sweat(sc, n = 10) { return [...Array(n)].map(() => { const d = mesh(new THREE.SphereGeometry(.03, 6, 5), 0x7ac8ff); d.scale.y = 1.4; sc.add(d); return d; }); }
function sweatUp(ds, h, t, k = 1) { h.updateMatrixWorld(true); ds.forEach((d, i) => { const q = (t * (1.2 + k) + hash(i)) % 1, side = i % 2 ? 1 : -1; const p = h.userData.head.localToWorld(V(side * (.22 + q * .15), .5 - q * .1, .05)); d.position.set(p.x, p.y - q * q * 1.2, p.z); d.visible = i < 3 + k * 7; }); }
const HP = p => { p.updateMatrixWorld(true); return p.userData.head.localToWorld(V(0, .3, .2)); };

// 0 "You walk into your first fucking job interview." - FIRST FRAME: door flies open, our guy struts in, sweating already
shot(0, 3.06, () => { const S = office(), h = dressHero(person(HERO)), b = dressBoss(person(BOSS)), ds = sweat(S.sc); S.sc.add(h, b); bossSit(S, b);
  return t => { const op = ss(0, .35, t); S.doorPiv.rotation.y = op * 1.6; const k = clamp((t - .2) / 1.5); h.position.set(lerp(-1.95, -.5, k), 0, lerp(-2.1, .9, k)); h.rotation.y = k < 1 ? Math.atan2(1.45, 3.0) : .2; h.setFace(k < 1 ? 'smug' : 'worried'); pose(h, { walk: k < 1 ? t * 9 : 0 }); sweatUp(ds, h, t, .3);
    b.setFace('tired'); pose(b); sitP(b); camAt(.8, 1.6, 2.0, -.7, 1.15, -.5, 50, t); }; });
// 1 "Your suit is two sizes too small, your tie is on backwards, and you're sweating like a fucking sinner in church." - orbit him
shot(3.06, 10.6, () => { const S = office(), h = dressHero(person(HERO)), ds = sweat(S.sc, 12); S.sc.add(h); h.position.set(-.4, 0, .9); h.rotation.y = .2; const TB = L(4.62, 3.06), TT = L(5.5, 3.06), TS = L(7.41, 3.06);
  return t => { h.setFace(t < TS ? 'worried' : 'shock'); pose(h, { armL: [0, 0, .35], armR: [0, 0, -.35] }); h.userData.torso.scale.x = 1.12; const bt = h.userData.btn, q = t - TB; if (q > 0) { bt.position.set(q * .6, .2 + q * 1.4 - q * q * 3, .25 + q * 1.5); bt.rotation.y = q * 20; }
    const orb = ss(TT - .1, TT + .9, t) * (1 - ss(TS - .3, TS + .4, t)); sweatUp(ds, h, t, t > TS ? 1 : .2); const a = .2 + orb * 2.7, r = 2.7;
    camAt(-.4 + Math.sin(a) * r, 1.5, .9 + Math.cos(a) * r, -.4, 1.35, .9, 42, t); }; });
// 2 "So... tell me about yourself." - the interviewer, bored out of his mind
shot(10.6, 13.17, () => { const S = office(), b = dressBoss(person(BOSS)); S.sc.add(b); bossSit(S, b); return t => { tf(b, 'tired'); pose(b, { armL: [-.7, 0, .3], armR: [-.7, 0, -.3], elbowL: -1.2, elbowR: -1.2 }); sitP(b); camAt(.35, 1.55, .7, 0, 1.42, -1.5, 40, t); }; });
// 3 "And you, being a funkin' genius, decide honesty is the best fucking policy." - push in on the smug genius
shot(13.17, 19.15, () => { const S = office(), h = dressHero(person(HERO)), ds = sweat(S.sc); S.sc.add(h); heroSit(S, h); return t => { h.setFace(t < L(15.7, 13.17) ? 'happy' : 'smug'); pose(h); sitP(h); sweatUp(ds, h, t, .2); const k = ss(0, 6, t); camAt(lerp(.6, .25, k), lerp(1.65, 1.55, k), lerp(-2.3, -1.6, k), 0, 1.3, .3, 42, t); }; });
// 4 "Well, I got fired from my last three jobs. One for sleeping. One for stealing. And one for sleeping while I was stealing."
shot(19.15, 28.4, () => { const S = office(), h = dressHero(person(HERO)), b = dressBoss(person(BOSS)); S.sc.add(h, b); heroSit(S, h); bossSit(S, b); return t => { tf(h, 'smug'); pose(h, { armR: [-1.3, 0, -.3], elbowR: -.8 }); sitP(h); b.setFace(t < L(24.0, 19.15) ? 'tired' : 'shock'); pose(b); sitP(b); camAt(-1.0, 1.75, -2.2, 0, 1.2, .3, 44, t); }; });
// 5a "He writes something down." - the notepad: N... O. Circled.
shot(28.4, 30.05, () => { const S = office(); return t => { const k = clamp((t - .1) / .8); S.pad.userData.draw(k); S.pen.position.set(-.18 + k * .18 + Math.sin(t * 30) * .01, .81, -.95 + Math.cos(t * 25) * .01); camAt(-.1, 1.35, -.62, -.1, .78, -.95, 40, t, .004); }; });
// 5b "You think that's a good sign." - thumbs up
shot(30.05, 32.42, () => { const S = office(), h = dressHero(person(HERO)); S.sc.add(h); heroSit(S, h); return t => { h.setFace('happy'); pose(h, { armR: [-1.6, 0, -.5], elbowR: -1.4 }); sitP(h); camAt(.3, 1.6, -1.7, 0, 1.3, .3, 40, t); }; });
// 6a "What's your biggest weakness?"
shot(32.42, 34.45, () => { const S = office(), b = dressBoss(person(BOSS)); S.sc.add(b); bossSit(S, b); return t => { tf(b, 'tired'); pose(b); sitP(b); camAt(-.35, 1.55, .7, 0, 1.42, -1.5, 40, t); }; });
// 6b "Waking up. And Mondays. And Tuesdays. Honestly? Work." - counting on his fingers, each one pops up
shot(34.45, 40.42, () => { const S = office(), h = dressHero(person(HERO)), b = dressBoss(person(BOSS)); S.sc.add(h, b); heroSit(S, h); bossSit(S, b); const TW = L(39.67, 34.45);
  return t => { tf(h, t < TW ? 'calm' : 'smug'); const c = Math.floor(t * 1.2) % 2; pose(h, { armL: [-1.2, 0, .3], armR: [-1.2 - c * .2, 0, -.3], elbowL: -1.0, elbowR: -1.2 }); sitP(h); b.setFace(t < TW ? 'tired' : 'mad'); pose(b); sitP(b); camAt(1.3, 1.5, -1.3, -.1, 1.1, .2, 46, t); }; });
// 7a "Why do you want to work here?"
shot(40.42, 42.25, () => { const S = office(), b = dressBoss(person(BOSS)); S.sc.add(b); bossSit(S, b); return t => { tf(b, 'tired'); pose(b, { armR: [-1.0, 0, -.2], elbowR: -1.3 }); sitP(b); camAt(.4, 1.55, .6, 0, 1.42, -1.5, 38, t); }; });
// 7b "I don't. My mom said if I don't get a job, she's turning my room into a fucking gym." - mom's text pops up
shot(42.25, 48.0, () => { const S = office(), h = dressHero(person(HERO)); S.sc.add(h); heroSit(S, h); return t => { tf(h, t < L(44.0, 42.25) ? 'calm' : 'worried'); pose(h, { armL: [0, 0, .5], armR: [0, 0, -.5] }); sitP(h); camAt(-.3, 1.6, -1.8, 0, 1.3, .3, 42, t); }; });
// 8a "Where do you see yourself in five years?"
shot(48.0, 50.58, () => { const S = office(), b = dressBoss(person(BOSS)); S.sc.add(b); bossSit(S, b); return t => { tf(b, 'tired'); pose(b); sitP(b); camAt(-.3, 1.55, .5, 0, 1.42, -1.5, 36, t); }; });
// 8b "In your chair, bro. I'm taking your fucking job." - he leans back and points at the boss's chair
shot(50.58, 54.9, () => { const S = office(), h = dressHero(person(HERO)), b = dressBoss(person(BOSS)); S.sc.add(h, b); heroSit(S, h); bossSit(S, b); const TJ = L(52.35, 50.58);
  return t => { tf(h, 'smug'); pose(h, { armR: [-1.5, 0, -.1], elbowR: -.05, lean: -.15 }); sitP(h); b.setFace(t < TJ ? 'tired' : 'shock'); pose(b); sitP(b); const k = ss(TJ, TJ + 1.6, t); camAt(lerp(-1.4, -.5, k), lerp(1.8, 1.6, k), lerp(-2.4, -1.9, k), 0, 1.3, .3, 44, t); }; });
// 9 "He puts down his pen. Takes a deep breath. Looks you dead in the eyes..." - slow, slow push to his eyes
shot(54.9, 60.5, () => { const S = office(), b = dressBoss(person(BOSS)); S.sc.add(b); bossSit(S, b); const TB = L(56.76, 54.9), TL = L(58.52, 54.9);
  return t => { b.setFace(t < TL ? 'calm' : 'mad'); pose(b, { armR: t < .8 ? [-.9, 0, -.2] : [0, 0, -.12] }); sitP(b); const br = ss(TB, TB + .8, t) * (1 - ss(TL - .4, TL, t)); b.userData.torso.scale.set(1 + br * .15, 1 + br * .08, 1 + br * .15);
    const k = ss(0, TL + 1.5, t); camAt(lerp(.5, 0, k), lerp(1.55, 1.5, k), lerp(.9, -.6, k), 0, 1.48, -1.5, lerp(40, 30, k), t, .003); }; });
// 10 "FUCK NO! YOU ARE NOT GETTING THIS JOB!" - full scream, papers blast, our guy gets blown back
shot(60.5, 64.3, () => { const S = office(), b = dressBoss(person(BOSS)), h = dressHero(person(HERO)), papers = [...Array(14)].map(() => { const p = new THREE.Mesh(new THREE.PlaneGeometry(.12, .16), new THREE.MeshLambertMaterial({ color: 0xf8f8f0, side: THREE.DoubleSide })); S.sc.add(p); return p; }); S.sc.add(b, h); bossSit(S, b); heroSit(S, h);
  return t => { b.setFace('scream'); pose(b, { armL: [-1.3, 0, 1.3], armR: [-1.3, 0, -1.3], elbowL: -.3, elbowR: -.3, lean: .25, snap: t < .05 }); sitP(b); b.position.y = SEAT + .02 + Math.abs(Math.sin(t * 22)) * .04;
    h.setFace('shock'); pose(h, { lean: -.4, armL: [-2.5, 0, .4], armR: [-2.5, 0, -.4], snap: t < .05 }); sitP(h); S.hc.rotation.x = Math.min(.35, t * 2); h.position.z = .3 + Math.min(.12, t * .8);
    papers.forEach((p, i) => { const q = (t * .9 + hash(i)) % 1; p.position.set((hash(i + 1) - .5) * 1.6 + q * (hash(i + 2) - .5), .85 + q * 1.0, -.9 + q * 1.4); p.rotation.set(t * 6 + i, t * 4 + i * 2, i); });
    const sh = .05 * Math.exp(-t * 1.2); camAt(.5 + noise1(t * 30) * sh, 1.6 + noise1(t * 31 + 5) * sh, .6, 0, 1.4, -1.5, 46, t, .02); }; });
// 11a "And then he sprints out of his own fucking office!" - cartoon sprint, dust puffs, door SLAM
shot(64.3, 67.0, () => { const S = office(), b = dressBoss(person(BOSS)), h = dressHero(person(HERO)), puffs = [...Array(8)].map(() => { const p = mesh(new THREE.IcosahedronGeometry(.14, 0), 0xe8e8e8); S.sc.add(p); return p; }); S.sc.add(b, h); heroSit(S, h); const T0 = L(64.71, 64.3), TS = L(66.4, 64.3);
  return t => { const k = clamp((t - T0) / (TS - T0 - .1)); const P = [V(0, 0, -1.5), V(-1.2, 0, -1.9), V(-1.9, 0, -2.6)], seg = k < .5 ? 0 : 1, u = (k % .5) * 2; const pos = k >= 1 ? P[2] : P[seg].clone().lerp(P[seg + 1], u);
    b.position.copy(pos); b.rotation.y = k <= 0 ? 0 : Math.atan2(P[seg + 1].x - P[seg].x, P[seg + 1].z - P[seg].z); b.visible = k < 1; b.setFace('scream'); pose(b, { walk: k > 0 ? t * 26 : 0, lean: k > 0 ? .3 : 0 }); if (k <= 0) sitP(b);
    S.doorPiv.rotation.y = k > 0 && t < TS ? 1.6 : lerp(1.6, 0, ss(TS - .08, TS, t)); puffs.forEach((p, i) => { const age = (t - T0 - i * .08); p.visible = age > 0 && age < .8 && k < 1; const q = clamp(i / 8); const pp = P[q < .5 ? 0 : 1].clone().lerp(P[q < .5 ? 1 : 2], (q % .5) * 2); p.position.set(pp.x, .15 + age * .3, pp.z); p.scale.setScalar(.5 + age * 1.5); });
    h.setFace('shock'); pose(h); sitP(h); h.userData.head.rotation.y = -.6 * k; camAt(1.6, 1.9, .9, -.9, 1.0, -1.7, 50, t, t > TS ? .03 : .01); }; });
// 11b "Leaves his coffee!" - steaming mug, alone
shot(67.0, 68.18, () => { const S = office(), st = [...Array(4)].map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .6 })); S.sc.add(s); return s; });
  return t => { st.forEach((s, i) => { const q = (t * .8 + i / 4) % 1; s.position.set(-.55 + Math.sin(q * 6 + i) * .03, .92 + q * .3, -.62); s.scale.setScalar(1 + q * 2); s.material.opacity = .5 * (1 - q); }); S.mug.rotation.z = Math.sin(t * 20) * .03 * Math.exp(-t * 3); camAt(-.3, 1.2, .1, -.55, .88, -.62, 36, t, .004); }; });
// 11c "Leaves his laptop!" - spreadsheet still open
shot(68.18, 69.45, () => { const S = office(); S.disp.material = new THREE.MeshBasicMaterial({ map: ctex(256, 160, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8d0d8'; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = '#2a8a3a'; g.fillRect(0, 0, w, 16); g.fillStyle = '#16121a'; g.font = '900 15px Nunito'; g.fillText('CANDIDATES.xls', 6, 12); g.fillStyle = '#e8323a'; g.font = '900 22px Nunito'; g.fillText('NOT THIS GUY', 50, 90); }) });
  return t => { camAt(.45, 1.12, -1.35, .42, .9, -.75, 38, t, .004); }; });
// 11d "Leaves YOU!" - alone in the office, crickets
shot(69.45, 71.4, () => { const S = office(), h = dressHero(person(HERO)); S.sc.add(h); heroSit(S, h); return t => { h.setFace('worried'); pose(h); sitP(h); h.userData.head.rotation.y = Math.sin(t * 2.5) * .5; camAt(1.8, 2.4, -2.0, 0, .8, .1, 50, t, .004); }; });
// 12 "So you sit in his chair. Feet up on the desk. Congratulations... you're the boss now." - feet up, nameplate flips, confetti
shot(71.4, 999, () => { const S = office(), h = dressHero(person(HERO)), conf = [...Array(40)].map((_, i) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(.05, .03), new THREE.MeshBasicMaterial({ color: [0xe8323a, 0xf2c230, 0x3a6ad8, 0x3ab86a, 0xe86ad8][i % 5], side: THREE.DoubleSide })); S.sc.add(c); return c; }); S.sc.add(h); const TF = L(73.24, 71.4), TC = L(75.17, 71.4), TB = L(77.22, 71.4);
  return t => { const sitk = clamp(t / .8); h.position.set(0, SEAT + .02, lerp(-.95, -1.5, sitk)); h.rotation.y = lerp(Math.PI, 0, sitk); h.setFace(t < TC ? 'smug' : 'happy'); pose(h, { armL: [-2.7, 0, .7], armR: [-2.7, 0, -.7], elbowL: -1.6, elbowR: -1.6, lean: -ss(TF, TF + .4, t) * .35 });
    const fu = ss(TF, TF + .4, t); h.userData.legs.forEach(l => { l.rotation.x = lerp(-1.45, -1.9, fu); l.userData.knee.rotation.x = lerp(1.45, .05, fu); }); h.userData.body.position.y = -.2 + fu * .12; S.bc.rotation.x = -fu * .15;
    S.plate.userData.draw(t > TB - .1 ? 1 : 0); conf.forEach((c, i) => { const q = t - TC - hash(i) * .3; c.visible = q > 0; c.position.set((hash(i + 3) - .5) * 2.4 + Math.sin(q * 3 + i) * .1, 2.6 - q * .9 - hash(i + 5) * .4, -1.0 + (hash(i + 7) - .5) * 1.4); c.rotation.set(q * 6 + i, q * 4, i); });
    const k = ss(0, 4, t); S.lap.visible = false; camAt(lerp(2.6, 3.0, k), lerp(1.7, 1.85, k), lerp(-1.0, -.8, k), 0, .95, -1.3, 46, t); }; });

// ===================== RENDER =====================
window.__BLEEPS = [];
const built = new Map();
function renderAt(t) { window.__T = t; let i = SH.findIndex((s, k) => t >= s.a && (k + 1 >= SH.length || t < SH[k + 1].a)); if (i < 0) i = 0; const s = SH[i];
  if (!built.has(i)) { for (const k of [...built.keys()]) if (k < i - 1) built.delete(k); const up = s.build(); built.set(i, { up, sc: window.__sc }); }
  const B = built.get(i); B.up(t - s.a); renderer.render(B.sc, cam); og.drawImage(renderer.domElement, 0, 0);
  bubble(t, F(0.05), F(3.0), 'first job interview', W / 2, H * .17, '#ffd23a'); bang(t, F(4.62), 'POP!', '#ffffff', W * .66, H * .3, .1); bang(t, F(6.26), 'BACKWARDS', '#ff8a3a', W / 2, H * .22, -.06);
  bubble(t, F(22.59), F(23.5), 'FIRED: sleeping', W / 2, H * .17, '#ff8a8a'); bubble(t, F(24.04), F(25.0), 'FIRED: stealing', W / 2, H * .17, '#ff8a8a'); bubble(t, F(26.4), F(28.3), 'FIRED: BOTH', W / 2, H * .17, '#ff4a4a');
  bubble(t, F(31.0), F(32.4), 'good sign?', W * .6, H * .17, '#ffffff');
  bang(t, F(34.49), 'WAKING UP', '#ffd23a', W / 2, H * .18, -.05); bang(t, F(35.63), 'MONDAYS', '#ffd23a', W / 2, H * .18, .05); bang(t, F(36.71), 'TUESDAYS', '#ffd23a', W / 2, H * .18, -.05); bang(t, F(39.67), 'WORK', '#ff4a4a', W / 2, H * .18, .06);
  notif(t, F(43.3), F(47.9), 'MOM', 'get a job or ur room is a gym');
  bang(t, F(53.06), 'YOUR JOB', '#ff4a4a', W / 2, H * .2, -.05);
  bang(t, F(60.55), 'F*** NO!', '#ff3030', W / 2, H * .24, -.06); bang(t, F(61.85), 'NOT HIRED', '#ffffff', W / 2, H * .2, .04); bang(t, F(66.4), 'SLAM!', '#ffd23a', W / 2, H * .2, -.05);
  bang(t, F(75.17), 'CONGRATS', '#ffd23a', W / 2, H * .18, -.04); bubble(t, F(77.22), F(78.5) + 2, "I'M THE BOSS", W * .5, H * .17, '#ffd23a');
  caption(t); }
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .9); };
window.renderFrame = i => { renderAt(i / FPS); return out.toDataURL('image/jpeg', .92); };
window.frameCount = NF; window.ready = true;
