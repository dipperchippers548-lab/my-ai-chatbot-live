// ===================== LOTTERY: cast, props, SHOTS =====================
const talkIf = (tc, a, b) => tc >= tm(a) - .03 && tc <= tm(b) ? talkShape(tc) : null;
function walkTo(scene, o, x0, z0, x1, z1, k, t, ry) { const x = lerp(x0, x1, k), z = lerp(z0, z1, k), wd = stepPose(walkPhase(Math.hypot(x - x0, z - z0))), moving = k > 0 && k < 1; return place(scene, { ...o, ...(moving ? wd : {}), arms: moving ? wd.arms : o.arms }, x, moving ? wd.bob : 0, z, ry); }
function studio(bg) { const scene = new THREE.Scene(); scene.background = new THREE.Color(bg); scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b0a0, 1.6)); const k = new THREE.DirectionalLight(0xffffff, 1.6); k.position.set(2, 5, 5); k.castShadow = true; scene.add(k); const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), toon(new THREE.Color(bg).multiplyScalar(.85).getHex())); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl); return { scene }; }
function card(w, h, draw, pw = 256) { const ph = Math.round(pw * h / w); const D = document.createElement('canvas'); D.width = pw; D.height = ph; const g = D.getContext('2d'); const T = new THREE.CanvasTexture(D); T.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: T, side: THREE.DoubleSide }));
  m.userData.draw = (...a) => { g.clearRect(0, 0, pw, ph); draw(g, pw, ph, ...a); T.needsUpdate = true; }; m.userData.draw(); return m; }
const PAL2 = PAL.filter(c => c !== 0xffa94a);
const plain = (i, extra = {}) => ({ ...crowdOpt(i), color: PAL2[i % PAL2.length], hat: ['cap', null, 'party', null][i % 4], tag: null, ...extra });
const EARL = { color: 0xffa94a, hat: 'cap', hatColor: 0x3a3a48, eyes: 'half', mouth: 'flat', shoe: 0x5a4a3a };
const KEV = { color: 0x38c8c0, hat: 'cap', hatColor: 0xe8323a, tag: 'KEVIN', shoe: 0x16121a };
const NUMS = ['07', '14', '21', '28', '35', '42'];
const ticketDraw = (g, w, h) => { g.fillStyle = '#fff8e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8323a'; g.fillRect(0, 0, w, h * .26); g.fillStyle = '#fff'; g.font = `900 ${h * .18}px Nunito`; g.textAlign = 'center'; g.fillText('LOTTO', w / 2, h * .2);
  NUMS.forEach((n, i) => { const x = w * (.12 + i * .152), y = h * .62; g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(x, y, h * .13, 0, 7); g.fill(); g.strokeStyle = '#16121a'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#16121a'; g.font = `900 ${h * .14}px Nunito`; g.fillText(n, x, y + h * .05); }); g.fillStyle = '#16121a'; for (let i = 0; i < 30; i++) g.fillRect(w * .1 + i * w * .027, h * .86, i % 3 ? 2 : 4, h * .1); g.lineWidth = 6; g.strokeRect(0, 0, w, h); };
// the store: shelves (from store()), a counter at the front with a register, a scanner screen, a lottery sign
function shop() { const G = store(); const s = G.scene; const C = { scene: s };
  s.add(at3(box(3.2, 1.0, .8, 0xc8955a), 0, .5, 2.4)); s.add(at3(box(3.3, .06, .9, 0xe8e2d4, .012), 0, 1.02, 2.4));
  s.add(at3(box(.6, .35, .45, 0x2a2a30), -1.0, 1.22, 2.45)); s.add(at3(box(.5, .05, .3, 0x9ad8ff, .008), -1.0, 1.42, 2.35));
  const scr = card(.6, .4, (g, w, h, mode = 'idle', t = 0) => { const col = { idle: '#1a2a3a', no: '#c8202a', jackpot: Math.sin(t * 20) > 0 ? '#ffd23a' : '#ffae1a', typing: '#1a2a3a', broken: Math.sin(t * 40) > 0 ? '#1a2a3a' : '#3a4a5a' }[mode]; g.fillStyle = col; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; if (mode === 'no') { g.font = `900 ${h * .2}px Nunito`; g.fillText('NOT A', w / 2, h * .45); g.fillText('WINNER', w / 2, h * .7); }
    if (mode === 'jackpot') { g.fillStyle = '#16121a'; g.font = `900 ${h * .24}px Nunito`; g.fillText('JACKPOT!', w / 2, h * .42); g.font = `900 ${h * .16}px Nunito`; g.fillText('$40,000,000', w / 2, h * .72); }
    if (mode === 'typing') { g.font = `900 ${h * .16}px Nunito`; g.fillText(NUMS.slice(0, Math.floor(t)).join(' '), w / 2, h * .58); }
    if (mode === 'broken') { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * .2, h * .2); g.lineTo(w * .5, h * .55); g.lineTo(w * .35, h * .8); g.stroke(); }
    g.strokeStyle = '#16121a'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); }, 200);
  const term = new THREE.Group(); term.position.set(.8, 1.05, 2.2); s.add(term); term.add(at3(box(.7, .5, .12, 0x2a2a30), 0, .32, 0)); scr.position.set(0, .34, .07); term.add(scr); term.rotation.y = Math.PI;
  const sign = card(1.4, .5, (g, w, h) => { g.fillStyle = '#ffd23a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8323a'; g.font = `900 ${h * .55}px Nunito`; g.textAlign = 'center'; g.fillText('LOTTO', w / 2, h * .72); g.lineWidth = 8; g.strokeRect(0, 0, w, h); }, 256); sign.position.set(.8, 2.4, 2.1); sign.rotation.y = Math.PI; s.add(sign);
  C.scr = scr; C.term = term; return C; }
// outside: the shop front on the street, with a curb
function shopFront(S) { const g = new THREE.Group(); g.position.set(HX.gary - 1, 0, -6.2); S.scene.add(g); g.add(at3(box(6, 3, 2.8, 0xf2e2c0, .03), 0, 1.5, 0)); g.add(at3(box(6.2, .2, 3.0, 0xe8323a, .02), 0, 3.05, 0));
  const sg = card(3.2, .7, (c, w, h) => { c.fillStyle = '#e8323a'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = `900 ${h * .6}px Nunito`; c.textAlign = 'center'; c.fillText('MINI MART', w / 2, h * .74); }, 320); sg.position.set(0, 2.55, 1.42); g.add(sg);
  g.add(at3(box(1.1, 2.0, .06, 0x9ad8ff, .015), 0, 1.0, 1.41)); for (const x of [-2, 2]) g.add(at3(box(1.4, 1.2, .06, 0x9ad8ff, .015), x, 1.4, 1.41)); return g; }
function makeHotdog() { const g = new THREE.Group(); const bun = inked(new THREE.CapsuleGeometry(.07, .26, 4, 10), 0xe8b060, .01); bun.rotation.z = Math.PI / 2; g.add(bun); const dog = inked(new THREE.CapsuleGeometry(.045, .34, 4, 10), 0xc84a3a, .008); dog.rotation.z = Math.PI / 2; dog.position.y = .05; g.add(dog); const mu = new THREE.Mesh(new THREE.BoxGeometry(.28, .012, .02), flat(0xffd23a)); mu.position.y = .1; g.add(mu); return g; }

// 1 "Every Friday, Earl bought one lottery ticket." - at the counter; Kevin hands over a ticket
shot(0, 3.1, () => { const C = shop(), cam = newCam(44), tk = card(.36, .2, ticketDraw); C.scene.add(tk);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('idle'); const k = ss(.6, 1.6, f); const kev = place(C.scene, { ...KEV, mouth: 'smile', hands: [V(-.3, .9, .3), V(.2, 1.1, .6 + k * .2)] }, .2, 0, 3.4, Math.PI); kev.updateMatrixWorld(true); tk.position.copy(kev.localToWorld(V(.2, 1.1, .7 + k * .2))); tk.rotation.set(-1.2, Math.PI, 0);
    place(C.scene, { ...EARL, mouth: 'smile', hands: [V(-.3, .9, .3), V(.3, 1.0 + k * .1, .45)] }, -.1, 0, 1.4, 0); look(cam, -1.5, 2.0, -.5, .05, 1.4, 2.4); } }; }, { noCut: true });
// 2a "Same store. Same numbers." - the ticket, close: 07 14 21 28 35 42
shot(3.1, 5.2, () => { const S = studio(0xffe8b0), cam = newCam(40), tk = card(1.6, .9, ticketDraw, 400); S.scene.add(tk); tk.position.set(0, 1.4, 0);
  return { scene: S.scene, cam, update(f, fd, t) { tk.rotation.set(-.15, Math.sin(t * .8) * .25, Math.sin(t * .6) * .05); look(cam, 0, 1.5, 2.6 - f * .3, 0, 1.4, 0); } }; }, { xf: true, noCut: true });
// 2b "For twenty years." - same counter, same Earl... now with gray hair; a year counter flies up to 20
shot(5.2, 6.9, () => { const C = shop(), cam = newCam(42), yr = card(1.4, .5, (g, w, h, n = 1) => { g.fillStyle = '#16121a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffe21f'; g.font = `900 ${h * .6}px Nunito`; g.textAlign = 'center'; g.fillText('YEAR ' + n, w / 2, h * .72); }, 300); C.scene.add(yr);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('idle'); const n = Math.min(20, 1 + Math.floor(f / (fd * .8) * 19)); yr.userData.draw(n); yr.position.set(-.1, 2.45, 1.5); yr.rotation.y = 0;
    place(C.scene, { ...EARL, hairColor: 0xcfcfcf, tuft: n > 10, eyes: 'half', mouth: 'flat', glasses: n > 14, hands: [V(-.3, .9, .3), V(.3, 1.0, .45)] }, -.1, 0, 1.4, 0); place(C.scene, { ...KEV, mouth: 'smile' }, .2, 0, 3.4, Math.PI); look(cam, -1.1, 2.0, 4.0, -.1, 1.75, 1.4); } }; }, { noCut: true });
// 3 "This Friday, he checked the winning numbers on his phone, and every single one matched." - couch, phone; the numbers tick green one by one
shot(6.9, 12.2, () => { const R = room(0xdfe6ff), cam = newCam(42), SW = at(6.9, 9.6), M = at(6.9, 11.4); const c = new THREE.Group(); c.position.set(0, 0, -1.8); R.scene.add(c); c.add(at3(box(2.2, .45, .9, 0x8a5ad8), 0, .3, 0)); c.add(at3(box(2.2, .7, .25, 0x8a5ad8), 0, .75, -.35));
  const ph = card(.5, .9, (g, w, h, n = 0, all = false) => { g.fillStyle = all ? '#1a5a2a' : '#0e1220'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `900 ${w * .1}px Nunito`; g.textAlign = 'center'; g.fillText('WINNING NUMBERS', w / 2, h * .1);
    NUMS.forEach((num, i) => { const y = h * (.2 + i * .12); g.fillStyle = i < n ? '#2ad85a' : '#2a3a5a'; g.fillRect(w * .1, y, w * .8, h * .1); g.fillStyle = '#fff'; g.font = `900 ${w * .14}px Nunito`; g.fillText(num + (i < n ? '  ✓' : ''), w / 2, y + h * .075); });
    if (all) { g.fillStyle = '#ffe21f'; g.font = `900 ${w * .12}px Nunito`; g.fillText('ALL 6 MATCH!', w / 2, h * .95); } g.strokeStyle = '#16121a'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); }, 220); R.scene.add(ph);
  return { scene: R.scene, cam, update(f, fd, t) { const n = f < SW ? 0 : Math.min(6, 1 + Math.floor((f - SW) / ((M - SW) / 6))); ph.userData.draw(n, f > M);
    const g = place(R.scene, { ...EARL, sit: true, eyes: f > M ? 'wide' : 'half', mouth: f > M ? 'o' : 'flat', hands: [V(-.1, 1.15, .45), V(.12, 1.15, .45)] }, 0, .05, -1.75, 0); g.updateMatrixWorld(true); ph.position.copy(g.localToWorld(V(0, 1.3, .55))); ph.rotation.set(-.25, 0, 0); ph.scale.setScalar(f < SW ? .5 : 1);
    if (f < SW) look(cam, .9, 1.6, .9, 0, 1.4, -1.6); else look(cam, .05, 1.42, -.45, 0, 1.3, -1.2); } }; }, { noCut: true });
// 4 "His hands started shaking." - trembling hands, the ticket rattling, sweat
shot(12.2, 13.6, () => { const R = room(0xdfe6ff), cam = newCam(40), tk = card(.4, .22, ticketDraw); R.scene.add(tk); const dr = [0, 1].map(() => { const d = inked(new THREE.SphereGeometry(.04, 8, 6), 0x9ad8ff, .006, null, true); R.scene.add(d); return d; });
  return { scene: R.scene, cam, update(f, fd, t) { const s = Math.sin(t * 60) * .02; const g = place(R.scene, { ...EARL, eyes: 'wide', mouth: 'wavy', browUp: .06, brow: .3, hands: [V(-.12 + s, 1.2, .45), V(.12 - s, 1.2 + s, .45)] }, 0, 0, -1.4, 0); g.updateMatrixWorld(true); tk.position.copy(g.localToWorld(V(s, 1.3, .5))); tk.rotation.z = s * 4;
    dr.forEach((d, i) => { const q = (t * 1.5 + i / 2) % 1; d.position.copy(g.userData.head.localToWorld(V(.3 - i * .6, .2 - q * .5, .3))); }); const hp = g.userData.head.localToWorld(V(0, -.3, 0)); look(cam, hp.x + .2, hp.y + .1, hp.z + 1.8, hp.x, hp.y - .1, hp.z); } }; }, { xf: true });
// 5a "He ran into the store," - outside: he sprints through the MINI MART door
shot(13.6, 15.0, () => { const S = world('day'), cam = newCam(42); shopFront(S);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.gary - 1, -2); const k = clamp(f / fd); walkTo(S.scene, { ...EARL, eyes: 'wide', mouth: 'o', lean: .35 }, HX.gary - 4, 1.6, HX.gary - 1, -4.6, k, t, Math.atan2(3, -6.2)); look(cam, HX.gary + 1.8, 1.8, 3.8, HX.gary - 1.5, 1.0, -2.0); } }; }, { noCut: true });
// 5b "slammed the ticket on the counter," - SLAM: low angle on the counter, everything jumps
shot(15.0, 16.6, () => { const C = shop(), cam = newCam(48), tk = card(.36, .2, ticketDraw); C.scene.add(tk); const SL = at(15.0, 15.09);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('idle'); const hit = f > SL ? Math.exp(-(f - SL) * 9) : 0; const g = place(C.scene, { ...EARL, eyes: 'wide', mouth: 'grin', lean: .25, hands: [V(-.3, .9, .3), V(.15, f < SL ? 1.5 : 1.05, .65)] }, -.1, 0, 1.55, 0); g.updateMatrixWorld(true); tk.position.set(-.05, 1.06 + hit * .05, 2.2); tk.rotation.set(-Math.PI / 2, 0, .2);
    C.term.position.y = 1.05 + hit * .06; look(cam, -.55, 1.95, 3.2, -.05, 1.25, 1.85); cam.position.y += Math.sin(t * 80) * .03 * hit; } }; });
// 5c "and said, I think I just won." - Earl beaming at Kevin (lip sync)
shot(16.6, 18.85, () => { const C = shop(), cam = newCam(40);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('idle'); const m = talkIf(t, 17.25, 18.4); const g = place(C.scene, { ...EARL, eyes: 'happy', mouth: m || 'grin', blush: true, hands: [V(-.3, 1.0, .5), V(.3, 1.0, .5)] }, -.1, 0, 1.55, 0); g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, -.2, 0));
    look(cam, hp.x + .9, hp.y + .05, hp.z + 1.9, hp.x, hp.y - .15, hp.z); } }; });
// 6 "The cashier scanned it. Beep. He looked up and said," - the scanner close: BEEP -> NOT A WINNER
shot(18.85, 21.9, () => { const C = shop(), cam = newCam(40), B = at(18.85, 20.3);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw(f > B ? 'no' : 'idle', t); place(C.scene, { ...KEV, mouth: 'flat', eyes: f > B + .8 ? 'open' : 'half', nod: f > B + .8 ? 0 : .3, hands: [V(-.3, .9, .3), V(.3, 1.1, .5)] }, .2, 0, 3.4, Math.PI);
    if (f < B + .8) look(cam, .8, 1.5, 1.3, .8, 1.38, 2.2); else look(cam, .1, 1.9, 1.7, .2, 1.8, 3.3); } }; });
// 7 "Sorry, man. Not a winner. Better luck next time." - Kevin, sympathetic (lip sync)
shot(21.9, 25.2, () => { const C = shop(), cam = newCam(40);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('no', t); const m = talkIf(t, 21.9, 24.8); const g = place(C.scene, { ...KEV, eyes: 'open', mouth: m || 'frown', brow: .25, arms: [[-.45, -.1, .1], [.45, .1, .3]] }, .2, 0, 3.4, Math.PI); g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, -.25, 0));
    look(cam, hp.x - .5, hp.y + .15, hp.z - 3.2, hp.x, hp.y + .05, hp.z); } }; });
// 8 "Earl stared at the ticket for a long time." - slow push, total silence on his face
shot(25.2, 28.1, () => { const C = shop(), cam = newCam(38), tk = card(.36, .2, ticketDraw); C.scene.add(tk);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('no', t); const g = place(C.scene, { ...EARL, eyes: 'open', mouth: 'flat', nod: .35, still: true, hands: [V(-.12, 1.1, .45), V(.12, 1.1, .45)] }, -.1, 0, 1.55, 0); g.updateMatrixWorld(true); tk.position.copy(g.localToWorld(V(0, 1.18, .5))); tk.rotation.set(-.6, 0, 0);
    const hp = g.userData.head.localToWorld(V(0, -.2, 0)), k = ss(0, fd, f); look(cam, hp.x + .3, hp.y + .05, hp.z + lerp(2.4, 1.4, k), hp.x, hp.y - .2, hp.z); } }; }, { noCut: true });
// 9 "Then he sighed, and said, Ah... I guess I'll see better days." - a big slump; then he says it (lip sync)
shot(28.1, 32.5, () => { const C = shop(), cam = newCam(40), S0 = at(28.1, 28.45);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('no', t); const sl = ss(S0, S0 + .6, f) * (1 - ss(S0 + 1.2, S0 + 1.8, f) * .6); const m = talkIf(t, 30.0, 32.2);
    const g = place(C.scene, { ...EARL, eyes: 'half', mouth: m || 'frown', lean: -.1, nod: .2 * sl, arms: [[-.45, -.35 - sl * .1, 0], [.45, -.35 - sl * .1, 0]], squash: sl * .06 }, -.1, 0, 1.55, 0); g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, -.2, 0));
    look(cam, hp.x - .6, hp.y + .1, hp.z + 2.2, hp.x, hp.y - .15, hp.z); } }; });
// 10 "And he walked away." - wide: he trudges to the door, the bell rings, he's gone
shot(32.5, 33.95, () => { const C = shop(), cam = newCam(46);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('no', t); const k = clamp(f / (fd + .5)); walkTo(C.scene, { ...EARL, eyes: 'half', mouth: 'frown', nod: .25 }, -.1, 1.4, -.1, -2.2, k, t, Math.PI); place(C.scene, { ...KEV, mouth: 'frown' }, .2, 0, 3.4, Math.PI); look(cam, 1.2, 2.2, 4.4, -.1, 1.1, -.5); } }; }, { noCut: true });
// 11 "A few minutes later, the cashier noticed something." - Kevin alone; squints at the terminal; ?
shot(33.95, 36.85, () => { const C = shop(), cam = newCam(42), q = sprite('?', '#ffe21f', .6); C.scene.add(q);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('no', t); const g = place(C.scene, { ...KEV, eyes: 'half', mouth: 'skew', brow: -.3, turn: -.5, tilt: .15 }, .2, 0, 3.3, Math.PI); g.updateMatrixWorld(true); q.position.copy(g.userData.head.localToWorld(V(.1, .75, 0))); q.scale.setScalar(.6 * pop(f - 1.2));
    look(cam, -1.3, 1.95, .8, .3, 1.6, 3.2); } }; }, { xf: true });
// 12 "The scanner had been broken all week." - sparks, a crack across the screen, a puff of smoke
shot(36.85, 39.3, () => { const C = shop(), cam = newCam(40), sp = [...Array(10)].map((_, i) => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.02), flat(0xffe27a)); s.userData = i; C.scene.add(s); return s; }), sm = [0, 1, 2].map(() => { const s = inked(new THREE.SphereGeometry(.1, 10, 8), 0x8a8a96, .008, null, true); C.scene.add(s); return s; });
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('broken', t); sp.forEach(s => { const i = s.userData, q = ((t * 2 + i / 10) % 1); s.position.set(.8 + Math.cos(i * 2) * q * .4, 1.65 + q * .3 - q * q * .5, 2.1 + Math.sin(i * 2) * q * .3); s.visible = Math.sin(t * 15 + i) > -.2; });
    sm.forEach((s, i) => { const q = ((t * .4 + i / 3) % 1); s.position.set(.8 + Math.sin(i) * .1, 1.7 + q * .8, 2.2); s.scale.setScalar(.5 + q * 1.5); }); look(cam, .8, 1.5, 1.05, .8, 1.4, 2.2); } }; });
// 13 "It had told everyone, not a winner." - three customers in a row, each gets the red screen, each sadder
shot(39.3, 41.95, () => { const C = shop(), cam = newCam(44);
  return { scene: C.scene, cam, update(f, fd, t) { const i = Math.min(2, Math.floor(f / (fd / 3))), lf = f - i * fd / 3; C.scr.userData.draw(lf > .3 ? 'no' : 'idle', t); place(C.scene, plain(i + 1, { eyes: lf > .35 ? 'half' : 'happy', mouth: lf > .35 ? 'frown' : 'grin', nod: lf > .35 ? .3 : 0 }), -.1, 0, 1.55, 0);
    place(C.scene, { ...KEV, mouth: 'flat' }, .2, 0, 3.4, Math.PI); look(cam, -1.7 + i * .25, 1.85, 3.0, -.05, 1.45, 1.6); } }; }, { xf: true, noCut: true });
// 14 "He typed in Earl's numbers by hand." - the keypad, the numbers appear one by one
shot(41.95, 44.25, () => { const C = shop(), cam = newCam(40);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('typing', f / fd * 7); place(C.scene, { ...KEV, eyes: 'open', mouth: 'skew', nod: .2, hands: [V(-.15, 1.15 + Math.abs(Math.sin(t * 14)) * .05, .5), V(.15, 1.15 + Math.abs(Math.cos(t * 14)) * .05, .5)] }, .5, 0, 3.0, Math.PI); look(cam, .8, 1.55, 1.35, .8, 1.4, 2.2); } }; }, { xf: true, noCut: true });
// 15 "Jackpot. Forty million dollars." - gold screen, flashing lights, coins, Kevin's jaw on the floor
shot(44.25, 47.35, () => { const C = shop(), cam = newCam(44), J = at(44.25, 44.33), coins = [...Array(24)].map((_, i) => { const c = inked(new THREE.CylinderGeometry(.06, .06, .015, 12), 0xffd23a, .006, null, true); c.userData = i; C.scene.add(c); return c; }); const fl = new THREE.PointLight(0xffd23a, 0, 6); fl.position.set(.8, 2, 2.0); C.scene.add(fl);
  return { scene: C.scene, cam, update(f, fd, t) { C.scr.userData.draw('jackpot', t); fl.intensity = Math.sin(t * 20) > 0 ? 25 : 5; coins.forEach(c => { const i = c.userData, q = ((t * .8 + i / 24) % 1); c.position.set(Math.sin(i * 2.1) * 1.6, 3.2 - q * 3.2, 2.6 + Math.cos(i * 1.3) * .8); c.rotation.set(t * 6 + i, t * 4, 0); });
    const g = place(C.scene, { ...KEV, eyes: 'wide', mouth: 'scream', browUp: .08, arms: [[-.5, .8, .1], [.5, .8, .1]] }, .2, Math.abs(Math.sin(t * 8)) * .15, 3.4, Math.PI); g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, -.4, 0)); const z = clamp(spring((f - J) * 1.4), 0, 1.05);
    look(cam, hp.x - .3, hp.y + .1, hp.z - lerp(3.4, 1.8, z), hp.x, hp.y - .1, hp.z); } }; }, { noCut: true });
// 16 "He sprinted outside, and found Earl sitting on the curb, eating a hot dog." - out the door... and there he is
shot(47.35, 51.5, () => { const S = world('day'), cam = newCam(42), hd = makeHotdog(); S.scene.add(hd); shopFront(S); const SW = at(47.35, 48.64);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.gary - 1, 0);
    if (f < SW) { const k = clamp(f / SW); walkTo(S.scene, { ...KEV, eyes: 'wide', mouth: 'o', lean: .35 }, HX.gary - 1, -4.6, HX.gary - 1, -1.2, k, t, 0); look(cam, HX.gary + 2.5, 1.7, 1.6, HX.gary - 1, 1.1, -3.0); hd.visible = false; }
    else { hd.visible = true; const bite = Math.sin(t * 2) > .6; const g = place(S.scene, { ...EARL, sit: true, eyes: 'half', mouth: bite ? 'o' : 'flat', hands: [V(-.1, 1.25 + (bite ? .1 : 0), .4), V(.1, 1.25 + (bite ? .1 : 0), .4)] }, HX.gary - 1, -.3, .15, 0); g.updateMatrixWorld(true); hd.position.copy(g.localToWorld(V(0, 1.3 + (bite ? .1 : 0), .5))); hd.rotation.y = 0;
      look(cam, HX.gary - .3, 1.2, 2.6, HX.gary - 1, .9, .1); } } }; }, { noCut: true });
// 17 "Earl... you're gonna want to sit down." - Kevin, panting, hands on knees (lip sync)
shot(51.5, 53.9, () => { const S = world('day'), cam = newCam(40), hd = makeHotdog(); S.scene.add(hd); shopFront(S);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.gary - 1, 0); const m = talkIf(t, 51.55, 53.5); const g = place(S.scene, { ...KEV, eyes: 'wide', mouth: m || 'o', lean: .3, hands: [V(-.18, .55, .35), V(.18, .55, .35)], squash: Math.abs(Math.sin(t * 6)) * .04 }, HX.gary + .25, 0, .45, -1.3);
    const e = place(S.scene, { ...EARL, sit: true, eyes: 'half', mouth: 'flat', hands: [V(-.1, 1.25, .4), V(.1, 1.25, .4)] }, HX.gary - 1, -.3, .15, .6); e.updateMatrixWorld(true); hd.position.copy(e.localToWorld(V(0, 1.3, .5))); hd.rotation.y = .6;
    look(cam, HX.gary - .35, 1.55, 3.6, HX.gary - .35, 1.15, .3); } }; });
// 18 "Earl looked at him and said, I am sitting down." - deadpan, hot dog in hand (lip sync) - rimshot - fade
shot(53.9, 99, () => { const S = world('day'), cam = newCam(38), hd = makeHotdog(); S.scene.add(hd); shopFront(S);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HX.gary - 1, 0); const m = talkIf(t, 55.6, 56.7); const e = place(S.scene, { ...EARL, sit: true, eyes: 'half', mouth: m || 'flat', turn: .5, hands: [V(-.1, 1.25, .4), V(.1, 1.25, .4)] }, HX.gary - 1, -.3, .15, .6); e.updateMatrixWorld(true); hd.position.copy(e.localToWorld(V(0, 1.3, .5))); hd.rotation.y = .6;
    const hp = e.userData.head.localToWorld(V(0, -.2, 0)); look(cam, hp.x + .9, hp.y + .1, hp.z + 1.7 - f * .1, hp.x, hp.y - .1, hp.z); this.fade = ss(fd - .5, fd - .05, f); } }; }, { noCut: true });
