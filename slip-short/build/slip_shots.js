// ===================== "You Slipped on a Wet Floor at Work" =====================
CAP.forEach(c => { c.text = c.text.replace(/\bASS+\b/g, 'A**').replace(/A{4,}H+/g, 'AHHHH').replace(/Y{4,}/g, 'YYY').replace(/E{4,}/g, 'EEE').replace(/S{4,}/g, 'SSS'); });
const GKID = { ...DALE, skin: SK, top: 0x3a8ad8, top2: 0x2a6ab8 };      // our funkin' genius kid, messy spiky hair and all
function nameTag(p) { const t = new THREE.Mesh(new THREE.PlaneGeometry(.14, .08), new THREE.MeshBasicMaterial({ map: ctex(140, 80, g => { g.fillStyle = '#e8323a'; g.fillRect(0, 0, 140, 24); g.fillStyle = '#fff'; g.fillRect(0, 24, 140, 56); g.fillStyle = '#fff'; g.font = '900 16px Nunito'; g.textAlign = 'center'; g.fillText('HELLO', 70, 18); g.fillStyle = '#16121a'; g.font = '900 26px Nunito'; g.fillText('genius', 70, 62); }) })); t.position.set(-.1, .4, .255); p.userData.torso.add(t); return p; }
const kid = () => nameTag(person(GKID));
// --- props ---
const billT = ctex(200, 92, (g, w, h) => { g.fillStyle = '#9ad08a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a6a3a'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#5a9a5a'; g.beginPath(); g.ellipse(w / 2, h / 2, 26, 32, 0, 0, 7); g.fill(); g.fillStyle = '#1a4a2a'; g.font = '900 30px Nunito'; g.fillText('100', 12, 36); g.textAlign = 'right'; g.fillText('100', w - 12, h - 12); });
function bill(s = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.3 * s, .14 * s), new THREE.MeshLambertMaterial({ map: billT, side: THREE.DoubleSide })); return m; }
function handPos(p, i = 1) { p.updateMatrixWorld(true); return p.userData.arms[i].userData.hand.getWorldPosition(V()); }
function holdBill(sc, p, i = 1) { const b = bill(); sc.add(b); return () => { b.position.copy(handPos(p, i)).add(V(0, .06, .06)); b.rotation.set(-.3, p.rotation.y, .1); }; }
const signT = ctex(180, 260, (g, w, h) => { g.fillStyle = '#ffd21a'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = '900 30px Nunito'; g.textAlign = 'center'; g.fillText('CAUTION', w / 2, 44); g.fillRect(14, 56, w - 28, 5);
  g.lineWidth = 9; g.lineCap = 'round'; g.strokeStyle = '#16121a'; g.beginPath(); g.arc(98, 92, 13, 0, 7); g.fill(); g.beginPath(); g.moveTo(92, 108); g.lineTo(70, 150); g.moveTo(84, 124); g.lineTo(120, 112); g.moveTo(84, 124); g.lineTo(52, 118); g.moveTo(70, 150); g.lineTo(104, 166); g.lineTo(124, 150); g.moveTo(70, 150); g.lineTo(46, 176); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.moveTo(30, 186); g.quadraticCurveTo(90, 176, 150, 186); g.stroke(); g.font = '900 28px Nunito'; g.fillText('WET', w / 2, 220); g.fillText('FLOOR', w / 2, 250); });
function wetSign() { const g = new THREE.Group(); for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.36, .55), new THREE.MeshLambertMaterial({ map: signT, side: THREE.DoubleSide })); p.position.set(0, .27, s * .08); p.rotation.x = s * .28; if (s < 0) p.rotation.y = Math.PI; p.castShadow = true; g.add(p); } g.add(at(mesh(new THREE.BoxGeometry(.38, .04, .06), 0xe8b81a), 0, .55, 0)); return g; }
function puddle(sc, x, z, r = .7) { const p = new THREE.Mesh(new THREE.CircleGeometry(r, 18), new THREE.MeshPhongMaterial({ color: 0x9ad8ff, transparent: true, opacity: .55, shininess: 120, specular: 0xffffff })); p.rotation.x = -Math.PI / 2; p.position.set(x, .006, z); p.scale.set(1.3, 1, 1); sc.add(p); return p; }
function capHat(p, col = 0xe8323a) { const g = new THREE.Group(); g.position.set(0, .48, -.02); p.userData.head.add(g); g.add(mesh(new THREE.SphereGeometry(.32, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), col)); g.add(at(mesh(new THREE.BoxGeometry(.32, .03, .26), col), 0, .02, .3)); return g; }
function shadesOn(p) { const g = new THREE.Group(); g.position.set(0, .32, .28); p.userData.head.add(g); for (const s of [-1, 1]) g.add(at(mesh(new THREE.BoxGeometry(.16, .08, .03), 0x16121a), s * .09, 0, 0)); g.add(at(mesh(new THREE.BoxGeometry(.05, .02, .02), 0x16121a), 0, .02, 0)); return g; }
function specsOn(p) { const g = new THREE.Group(); g.position.set(0, .3, .29); p.userData.head.add(g); for (const s of [-1, 1]) { const r = mesh(new THREE.TorusGeometry(.06, .012, 5, 12), 0xc8a050); r.position.x = s * .08; g.add(r); } return g; }
// --- the cast of people who feel bad for you ---
const CAST = {
  janitor: { o: { skin: 0xc98a64, hair: 0x2a1a14, top: 0x3a7a9a, top2: 0x2a6a8a, pants: 0x3a7a9a, shoe: 0x16121a, sole: 0x2a2a2a, sock: 0x3a7a9a, kind: 'cardigan' }, dress: p => { capHat(p, 0x2a5a7a); } },
  mailman: { o: { skin: 0xf0c8a0, hair: 0x8a5a2a, top: 0x5a7ac8, top2: 0x4a6ab8, pants: 0x2a3a6a, shoe: 0x16121a, sole: 0x2a2a2a, sock: 0x2a3a6a, kind: 'cardigan' }, dress: p => { capHat(p, 0x2a3a6a); p.userData.torso.add(at(mesh(new THREE.BoxGeometry(.3, .26, .12), 0x8a5a34), .2, .15, .2)); } },
  pizza: { o: { skin: 0xe8b890, hair: 0x16121a, top: 0xe8323a, top2: 0xc8282a, pants: 0x2a2a34, shoe: 0x16121a, sole: 0xf4f4f0, sock: 0xf4f4f0, kind: 'cardigan' }, dress: p => { capHat(p, 0xe8323a); } },
  grandma: { o: { ...MOM, skin: 0xf0c8a8, hair: 0xe0e0e8, top: 0xc87ab8, top2: 0xa85a98, pants: 0x6a5a7a }, dress: p => { specsOn(p); } },
  dude: { o: { skin: 0x8a5a3a, hair: 0x16121a, top: 0x3ab86a, top2: 0x2a985a, pants: 0x3a3a44, shoe: 0xf4f4f0, sole: 0xe8323a, sock: 0xf4f4f0, kind: 'cardigan' }, dress: p => { shadesOn(p); } },
  co1: { o: { skin: 0xd89a70, hair: 0x5a3a1a, top: 0xf2b630, top2: 0xd8962a, pants: 0x3a3a54, shoe: 0x16121a, sole: 0x2a2a2a, sock: 0x3a3a54, kind: 'cardigan', bun: true, lashes: true } },
  co2: { o: { skin: 0xf0c8a0, hair: 0x16121a, top: 0x8a5ac8, top2: 0x6a40a8, pants: 0x2a2a34, shoe: 0x16121a, sole: 0x2a2a2a, sock: 0x2a2a34, kind: 'cardigan' } },
  co3: { o: { skin: 0x8a5a3a, hair: 0x16121a, top: 0x3ab8a8, top2: 0x2a9888, pants: 0x4a4a54, shoe: 0x16121a, sole: 0x2a2a2a, sock: 0x4a4a54, kind: 'cardigan' }, dress: p => specsOn(p) } };
function npc(k) { const c = CAST[k], p = adult(person(c.o)); if (c.dress) c.dress(p); return p; }
// --- sets ---
function workBath() { const sc = roomLP(0xcfe8ec, 0xe8ecf0, 0xcfe8ec);
  for (let i = 0; i < 10; i++) for (let j = 0; j < 8; j++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(.49, .49), new THREE.MeshLambertMaterial({ color: (i + j) % 2 ? 0xf4f6f8 : 0xc8d0d8 })); t.rotation.x = -Math.PI / 2; t.position.set(-2.75 + i * .5, .003, -2.25 + j * .5); t.receiveShadow = true; sc.add(t); }
  for (let i = 0; i < 3; i++) { const x = -2.4 + i * .9; sc.add(at(mesh(new THREE.BoxGeometry(.05, 1.9, 1.3), 0x6a9ac8), x - .45, 1.05, -1.9)); const d = mesh(new THREE.BoxGeometry(.8, 1.7, .05), 0x7aaad8); d.position.set(x, 1.0, -1.25); sc.add(d); sc.add(at(mesh(new THREE.SphereGeometry(.03, 6, 4), 0xc8ccd8), x + .3, 1.0, -1.22)); }
  sc.add(at(mesh(new THREE.BoxGeometry(.05, 1.9, 1.3), 0x6a9ac8), .3, 1.05, -1.9));
  sc.add(at(mesh(new THREE.BoxGeometry(1.8, .12, .55), 0xe8e4dc), 1.55, .85, -2.25)); for (const x of [1.1, 2.0]) { sc.add(at(mesh(new THREE.CylinderGeometry(.18, .14, .1, 10), 0xf4f4f8), x, .92, -2.2)); sc.add(at(mesh(new THREE.CylinderGeometry(.02, .02, .2, 6), 0xc8ccd8), x, 1.0, -2.42)); }
  const mir = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .9), new THREE.MeshPhongMaterial({ color: 0xc8e0f0, shininess: 90 })); mir.position.set(1.55, 1.65, -2.49); sc.add(mir); sc.add(at(mesh(new THREE.BoxGeometry(.35, .3, .2), 0xd8dce4), 2.75, 1.4, -2.4));
  const door = mesh(new THREE.BoxGeometry(.95, 2.1, .06), 0x8a6a4a); door.position.set(-3.08, 1.05, .6); door.rotation.y = Math.PI / 2; sc.add(door); const sign = wetSign(); sign.position.set(.1, 0, -.4); sign.rotation.y = .4; sc.add(sign); puddle(sc, .1, -.2, .75);
  const clk = new THREE.Mesh(new THREE.CircleGeometry(.18, 20), new THREE.MeshLambertMaterial({ map: ctex(128, 128, g => { g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.lineWidth = 7; g.strokeStyle = '#16121a'; g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 104); g.moveTo(64, 64); g.lineTo(64, 20); g.stroke(); }) })); clk.position.set(-1.2, 2.55, -2.49); sc.add(clk);
  return { sc, sign }; }
function street() { const sc = new THREE.Scene(); window.__sc = sc; sc.background = new THREE.Color(0x8fd0ff); sc.fog = new THREE.Fog(0x8fd0ff, 16, 40); sc.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 1.6)); const k = new THREE.DirectionalLight(0xfff0dc, 1.8); k.position.set(3, 7, 5); k.castShadow = true; k.shadow.mapSize.set(2048, 2048); Object.assign(k.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); sc.add(k);
  sc.add(at(mesh(new THREE.BoxGeometry(40, .1, 40), 0x4a4a54), 0, -.05, 0)); sc.add(at(mesh(new THREE.BoxGeometry(40, .14, 4), 0xc8c8cc), 0, .02, -1.0)); for (let i = -8; i < 9; i++) sc.add(at(mesh(new THREE.BoxGeometry(.9, .01, .12), 0xf2c230), i * 2, .01, 2.3));
  const cols = [0xe8a07a, 0x7ab8e8, 0xf2d27a, 0xb88ad8, 0x8ad8a0, 0xe87a8a]; for (let i = 0; i < 8; i++) { const h = 3 + hash(i) * 4, b = mesh(new THREE.BoxGeometry(2.6, h, 2), cols[i % 6]); b.position.set(-9 + i * 2.7, h / 2, -4.2); sc.add(b); for (let r = 0; r < Math.floor(h / 1.1); r++) for (const dx of [-.6, .6]) sc.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.5, .6), new THREE.MeshLambertMaterial({ color: 0x9ad8ff })), -9 + i * 2.7 + dx, .9 + r * 1.1, -3.19)); }
  const bs = new THREE.Group(); bs.position.set(2.6, 0, -2.2); sc.add(bs); bs.add(at(mesh(new THREE.BoxGeometry(2.2, .08, 1), 0x3a6ad8), 0, 2.2, 0)); for (const x of [-1, 1]) bs.add(at(mesh(new THREE.BoxGeometry(.08, 2.2, .08), 0xc8ccd8), x, 1.1, .4)); bs.add(at(mesh(new THREE.BoxGeometry(1.6, .08, .4), 0x8a5a34), 0, .5, -.2));
  const bsign = new THREE.Mesh(new THREE.PlaneGeometry(.6, .3), new THREE.MeshBasicMaterial({ map: ctex(120, 60, g => { g.fillStyle = '#3a6ad8'; g.fillRect(0, 0, 120, 60); g.fillStyle = '#fff'; g.font = '900 34px Nunito'; g.textAlign = 'center'; g.fillText('BUS', 60, 44); }) })); bsign.position.set(-1.0, 2.55, .45); bs.add(bsign); bs.add(at(mesh(new THREE.BoxGeometry(.06, 2.6, .06), 0xc8ccd8), -1.0, 1.3, .5));
  for (const [x, z] of [[-4.5, -2.3], [6, -2.3]]) { sc.add(at(mesh(new THREE.CylinderGeometry(.1, .14, 1.4, 5), 0x7a4a2a), x, .7, z)); sc.add(at(mesh(lowpoly(new THREE.IcosahedronGeometry(.8, 0), .1, x * 10), 0x4aa84a), x, 1.9, z)); }
  return { sc }; }
// lying flat on your back (face up), legs kicking
function layDown(p, x, z, ry = 0, y = .26) { p.position.set(x, y, z); p.rotation.set(-Math.PI / 2, 0, 0); p.rotation.order = 'YXZ'; p.rotation.y = ry; }
const stars3 = sc => [...Array(5)].map(() => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(.06, 0), new THREE.MeshBasicMaterial({ color: 0xffd23a })); sc.add(s); return s; });
function lieCam(h, t, back = .75, up = 1.0, side = .25, fov = 46, sh = .01) { const hp = HP(h), a = V(hp.x - h.position.x, 0, hp.z - h.position.z).normalize(), r = V(-a.z, 0, a.x); camAt(hp.x + a.x * back + r.x * side, hp.y + up, hp.z + a.z * back + r.z * side, hp.x - a.x * .15, hp.y - .05, hp.z - a.z * .15, fov, t, sh); }
function lieCamF(h, t, d = 1.4, up = 1.5, side = .2, fov = 44, sh = .01) { const hp = HP(h), a = V(hp.x - h.position.x, 0, hp.z - h.position.z).normalize(), r = V(-a.z, 0, a.x); camAt(hp.x - a.x * d + r.x * side, hp.y + up, hp.z - a.z * d + r.z * side, hp.x - a.x * .2, hp.y, hp.z - a.z * .2, fov, t, sh); }
function spinStars(st, c, t) { st.forEach((s, i) => { const a = t * 4 + i / st.length * 6.28; s.position.set(c.x + Math.cos(a) * .35, c.y + .15 + Math.sin(t * 8 + i) * .03, c.z + Math.sin(a) * .35); s.rotation.y = t * 5; }); }

// 0 "AHHHHHH MYYYYY CHEEEEKS!" - FIRST FRAME: already flat on the wet floor, legs in the air, stars spinning; overhead camera twists
shot(0, 3.85, () => { const S = workBath(), h = kid(), st = stars3(S.sc); S.sc.add(h); layDown(h, .5, .3, .4);
  return t => { h.setFace('scream'); pose(h, { armL: [-.4, 0, 1.4], armR: [-.4, 0, -1.4], kneeL: .3, kneeR: .1 }); h.userData.legs.forEach((l, i) => l.rotation.x = -.5 + Math.sin(t * 14 + i * 2) * .3); spinStars(st, HP(h), t); lieCamF(h, t, lerp(1.2, 1.5, ss(0, 3.8, t)), lerp(1.4, 1.7, ss(0, 3.8, t)), Math.sin(t * .8) * .3, 48, .02); }; });
// 1 "It's 6 AM. You're at your fucking job." - dead-eyed at his desk, clock says 6:00
shot(3.85, 7.0, () => { const S = office(), h = kid(); S.sc.add(h); h.position.set(0, SEAT + .02, -1.5); S.mug.position.set(-.35, .78, -1.0); return t => { h.setFace('tired'); pose(h, { armL: [-1.0, 0, .2], armR: [-1.0, 0, -.2], elbowL: -1.2, elbowR: -1.2, headTilt: Math.sin(t * .9) * .15 }); sitP(h); camAt(.35, 1.5, .5, 0, 1.3, -1.5, 40, t); }; });
// 2 "You haven't had coffee. You haven't had breakfast. You haven't had a single good day since 2019."
shot(7.0, 13.85, () => { const S = office(), h = kid(); S.sc.add(h); h.position.set(0, SEAT + .02, -1.5); const TC = L(7.62, 7.0), TB = L(9.08, 7.0), TD = L(12.06, 7.0);
  return t => { S.mug.rotation.z = t > TC ? lerp(0, 2.2, ss(TC, TC + .3, t)) : 0; S.mug.position.y = .78 + (t > TC ? Math.sin(ss(TC, TC + .3, t) * Math.PI) * .1 : 0); h.setFace(t < TB ? 'tired' : t < TD ? 'worried' : 'tired'); pose(h, { armL: [-1.0, 0, .2], armR: t > TB && t < TD ? [-.6, 0, -.6] : [-1.0, 0, -.2], elbowL: -1.2, elbowR: -1.2 }); sitP(h);
    const k = ss(0, 6.8, t); camAt(lerp(.6, .2, k), 1.5, lerp(.9, .1, k), 0, 1.35, -1.5, 40, t); }; });
// 3 "You walk into the bathroom... and there it is." - he shuffles in through the door
shot(13.85, 16.95, () => { const S = workBath(), h = kid(); S.sc.add(h); return t => { const k = clamp(t / 2.0); h.position.set(lerp(-2.8, -1.5, k), 0, lerp(.6, .5, k)); h.rotation.y = k < 1 ? Math.PI / 2 : 1.2; h.setFace(k < 1 ? 'tired' : 'shock'); pose(h, { walk: k < 1 ? t * 6 : 0 }); camAt(-.5, 1.5, 2.5, -2.0, 1.0, .4, 46, t); }; });
// 4 "A little yellow sign. CAUTION. WET FLOOR." - dramatic low dolly into the sign glinting in its puddle
shot(16.95, 21.6, () => { const S = workBath(); return t => { const k = ss(0, 4.6, t); camAt(lerp(.9, .35, k), lerp(.35, .3, k), lerp(1.8, .45, k), .1, .28, -.4, lerp(46, 40, k), t, .006); }; });
// 5 "And you, being a funkin' genius, decide you're too smart for the sign." - taps his temple
shot(21.6, 26.85, () => { const S = workBath(), h = kid(); S.sc.add(h); h.position.set(-1.2, 0, .5); h.rotation.y = 1.0; const TS = L(24.28, 21.6);
  return t => { h.setFace(t < TS ? 'smug' : 'happy'); pose(h, { armR: t > TS ? [-2.4, 0, -.3] : [0, 0, -.12], elbowR: t > TS ? -1.8 : -.22 }); camAt(-.2, 1.5, 1.9, -1.0, 1.25, .2, 42, t); }; });
// 6 "You tiptoe around it. Like a fucking ninja." - tiptoe arc around the sign, ninja hands
shot(26.85, 30.6, () => { const S = workBath(), h = kid(); S.sc.add(h); const TN = L(28.52, 26.85);
  return t => { const k = clamp(t / 3.6), a = Math.PI * .95 + k * 1.3; h.position.set(.1 + Math.cos(a) * 1.0, .04 + Math.abs(Math.sin(t * 5)) * .03, -.4 + Math.sin(a) * .9); h.rotation.y = -a; h.setFace(t > TN ? 'mad' : 'smug');
    pose(h, { walk: t * 4, armL: t > TN ? [-1.4, 0, .9] : [-.6, 0, .9], armR: t > TN ? [-1.2, 0, -.2] : [-.6, 0, -.9], elbowL: -1.4, elbowR: -.4, kneeL: .4, kneeR: .4 }); camAt(.2, 2.4, 2.2, .1, .5, -.4, 48, t); }; });
// 7 "One step. Two steps. Three-" - close on the sneakers, squeaking on wet tile
shot(30.6, 34.72, () => { const S = workBath(), h = kid(); S.sc.add(h); h.position.set(.95, 0, -.1); h.rotation.y = -1.6; const ST = [31.0, 32.42, 33.43].map(x => L(x, 30.6));
  return t => { const n = ST.filter(x => t > x).length, step = ST.reduce((a, x) => a + ss(x, x + .25, t), 0); h.position.x = .95 - step * .22; h.setFace('worried'); pose(h, { walk: step * Math.PI, armL: [-.6, 0, .9], armR: [-.6, 0, -.9], kneeL: .3, kneeR: .3 }); camAt(h.position.x + .1, .3, .9, h.position.x - .1, .12, -.1, 40, t, .004); }; });
// 8 "Your feet go up. Your soul leaves your body." - slow-mo: horizontal in mid-air, a ghost of him floats up out
shot(34.72, 38.05, () => { const S = workBath(), h = kid(), soul = kid(); S.sc.add(h, soul); soul.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .45; o.material.color && o.material.color.lerp(new THREE.Color(0xffffff), .7); o.castShadow = false; } });
  const drops = [...Array(14)].map(() => { const d = mesh(new THREE.SphereGeometry(.035, 6, 5), 0x8ad0ff); S.sc.add(d); return d; }); const TS = L(36.08, 34.72);
  return t => { const k = ss(0, .6, t); h.position.set(.9, .3 + k * .9, -.2); h.rotation.set(-k * 1.45, 1.4, 0); h.rotation.order = 'YXZ'; h.setFace('shock'); pose(h, { armL: [-2.4, 0, .6], armR: [-2.4, 0, -.6], snap: true }); h.userData.legs.forEach(l => l.rotation.x = -.4);
    const q = Math.max(0, t - TS); soul.visible = q > 0; soul.position.set(.9, 1.2 + q * .9, -.2); soul.rotation.copy(h.rotation); soul.setFace('happy'); pose(soul, { armL: [-2.6, 0, .8], armR: [-2.6, 0, -.8], snap: true });
    drops.forEach((d, i) => { const a = hash(i) * 6.28, r = clamp(t * .8) * (.3 + hash(i + 2) * .7); d.position.set(.1 + Math.cos(a) * r, .05 + Math.sin(clamp(t * .8) * Math.PI) * (.3 + hash(i + 4) * .5), -.2 + Math.sin(a) * r); });
    camAt(.4, 1.5, 3.4, .2, 1.35 + q * .4, -.2, 52, t, .004); }; });
// 9 "You land straight on your ass." - BAM: the splash, camera shakes
shot(38.05, 40.6, () => { const S = workBath(), h = kid(), st = stars3(S.sc), drops = [...Array(24)].map(() => { const d = mesh(new THREE.SphereGeometry(.04, 6, 5), 0x8ad0ff); S.sc.add(d); return d; }); S.sc.add(h); const TL = L(39.52, 38.05);
  return t => { const f = ss(0, TL, t); h.position.set(.1, lerp(1.3, .05, f * f), -.2); h.rotation.set(0, 1.4, 0); h.setFace(t < TL ? 'shock' : 'scream'); pose(h, { armL: [-2.6, 0, .6], armR: [-2.6, 0, -.6], snap: true }); sitP(h); h.userData.legs.forEach(l => { l.rotation.x = -1.6; l.userData.knee.rotation.x = .1; }); h.userData.body.position.y = -.55;
    const q = Math.max(0, t - TL); drops.forEach((d, i) => { const a = hash(i) * 6.28, s = .6 + hash(i + 3) * 1.2; d.visible = q > 0 && q < 1; d.position.set(.1 + Math.cos(a) * q * s, Math.max(.02, q * 2.5 * (1 + hash(i)) - q * q * 6), -.2 + Math.sin(a) * q * s); }); if (q > 0) spinStars(st, HP(h), t); else st.forEach(s => s.visible = false);
    const sh = q > 0 ? .08 * Math.exp(-q * 4) : 0; camAt(1.6 + noise1(t * 40) * sh, .7 + noise1(t * 41) * sh, 1.6, .1, .55, -.2, 46, t, .004); }; });
// 10 "AHHHHHH! MY FUCKING ASS HURTS!" - face-up scream, camera spirals down onto him
shot(40.6, 43.85, () => { const S = workBath(), h = kid(), st = stars3(S.sc); S.sc.add(h); layDown(h, .1, .1, .9);
  return t => { h.setFace('scream'); pose(h, { armL: [-.3, 0, 1.5], armR: [-.3, 0, -1.5] }); h.userData.legs.forEach((l, i) => l.rotation.x = -.5 + Math.sin(t * 16 + i * 2) * .35); spinStars(st, HP(h), t); lieCamF(h, t, lerp(1.6, 1.2, ss(0, 3, t)), lerp(1.8, 1.4, ss(0, 3, t)), -.25, 46, .025); }; });
// 11 "So you limp to your boss. My ass hurts. He gives you a hundred dollars."
shot(43.85, 49.65, () => { const S = office(), h = kid(), b = dressBoss(person(BOSS)); S.sc.add(h, b); bossSit(S, b); const hb = holdBill(S.sc, b), TG = L(47.58, 43.85);
  return t => { const k = clamp(t / 1.6); h.position.set(lerp(-1.6, -.25, k), 0, lerp(.9, -.05, k)); h.rotation.y = k < 1 ? 2.2 : Math.PI + .3; tf(h, 'worried'); pose(h, { walk: k < 1 ? t * 5 : 0, lean: .25, armL: [.7, 0, .3], armR: [.7, 0, -.3], elbowL: -.6, elbowR: -.6, kneeL: k < 1 ? .3 + Math.sin(t * 5) * .2 : 0 });
    b.setFace(t < TG ? 'worried' : 'calm'); pose(b, { armR: t > TG ? [-1.4, 0, -.1] : [0, 0, -.12] }); sitP(b); hb(); camAt(1.4, 1.6, 1.4, -.1, 1.15, -.8, 46, t); }; });
// 12 "You tell your coworkers. My ass hurts. They give you a hundred dollars." - three sad faces, three bills
shot(49.65, 55.3, () => { const S = office(), h = kid(), cw = ['co1', 'co2', 'co3'].map(npc); S.sc.add(h, ...cw); const hbs = cw.map(p => holdBill(S.sc, p)), TG = L(53.38, 49.65);
  cw.forEach((p, i) => { p.position.set(-1.0 + i * .9, 0, -.0 + (i === 1 ? -.3 : 0)); p.rotation.y = 0; }); h.position.set(1.1, 0, .8); h.rotation.y = -2.1;
  return t => { tf(h, 'worried'); pose(h, { lean: .2, armL: [.7, 0, .3], armR: [.7, 0, -.3], elbowL: -.6, elbowR: -.6 }); cw.forEach((p, i) => { p.setFace(t < TG - .3 ? 'worried' : 'tired'); pose(p, { armR: t > TG + i * .12 ? [-1.4, 0, -.1] : [0, 0, -.12] }); hbs[i](); });
    camAt(.7, 1.6, 3.8, .25, 1.15, .1, 46, t); }; });
// 13a-e the janitor, the mailman, the pizza guy, grandma, a random dude at the bus stop - each one slaps a bill in his hand
const PARADE = [['janitor', 55.3, 56.6, 'bath'], ['mailman', 56.6, 57.65, 'street'], ['pizza', 57.65, 58.85, 'street'], ['grandma', 58.85, 60.1, 'street'], ['dude', 60.1, 62.75, 'street']];
PARADE.forEach(([who, a, b, set], n) => shot(a, b, () => { const S = set === 'bath' ? workBath() : street(), p = npc(who), h = kid(); S.sc.add(p, h); const hb = holdBill(S.sc, p);
  let mop = null; if (who === 'janitor') { mop = new THREE.Group(); mop.add(at(mesh(new THREE.CylinderGeometry(.02, .02, 1.3, 5), 0x8a5a34), 0, .65, 0)); mop.add(at(mesh(new THREE.CylinderGeometry(.14, .1, .14, 8), 0xe8e4d0), 0, .05, 0)); S.sc.add(mop); }
  let box = null; if (who === 'pizza') { box = mesh(new THREE.BoxGeometry(.45, .07, .45), 0xd8b87a); S.sc.add(box); }
  const px = set === 'bath' ? .9 : (who === 'dude' ? 2.4 : .7), pz = set === 'bath' ? .5 : (who === 'dude' ? -1.4 : .2); p.position.set(px, who === 'dude' ? 0 : 0, pz); p.rotation.y = -.8; h.position.set(px - 1.0, 0, pz + .4); h.rotation.y = .9;
  return t => { p.setFace(t < .35 ? 'worried' : 'calm'); pose(p, { armR: t > .3 ? [-1.4, 0, -.1] : [0, 0, -.12], armL: who === 'pizza' ? [-1.2, 0, .3] : [0, 0, .12], elbowL: who === 'pizza' ? -1.3 : undefined }); hb();
    if (mop) mop.position.copy(handPos(p, 0)).add(V(0, -.6, 0)); if (box) box.position.copy(handPos(p, 0)).add(V(.15, .05, .1));
    tf(h, 'worried'); pose(h, { lean: .2, armL: [.7, 0, .3], armR: [.7, 0, -.3], elbowL: -.6, elbowR: -.6 }); h.updateMatrixWorld(true);
    const mid = p.position.clone().add(h.position).multiplyScalar(.5); camAt(mid.x + (n % 2 ? -.9 : .9), 1.5, mid.z + 2.6, mid.x, 1.1, mid.z, 44, t); }; }));
// 14 "YOU TELL THE WHOLE FUCKING WORLD YOUR ASS HURTS!" - standing on top of the planet with a megaphone
shot(62.75, 66.85, () => { const sc = new THREE.Scene(); window.__sc = sc; sc.background = new THREE.Color(0x0e1230); sc.add(new THREE.HemisphereLight(0xffffff, 0x445588, 1.4)); const k = new THREE.DirectionalLight(0xfff0dc, 1.8); k.position.set(4, 6, 5); sc.add(k);
  const earth = new THREE.Group(); sc.add(earth); earth.add(mesh(lowpoly(new THREE.IcosahedronGeometry(3, 2), .08, 5), 0x3a7ad8)); for (let i = 0; i < 14; i++) { const c = mesh(lowpoly(new THREE.IcosahedronGeometry(.6 + hash(i) * .7, 1), .1, i), 0x4ab85a); const a = hash(i + 2) * 6.28, e = (hash(i + 4) - .5) * 2.6; c.position.set(Math.cos(a) * Math.cos(e) * 2.75, Math.sin(e) * 2.75, Math.sin(a) * Math.cos(e) * 2.75); c.scale.set(1, .35, 1); c.lookAt(0, 0, 0); c.rotateX(Math.PI / 2); earth.add(c); }
  for (let i = 0; i < 160; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.03, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffffff })); const a = hash(i) * 6.28, e = (hash(i + 9) - .3) * 2; s.position.set(Math.cos(a) * 20, Math.sin(e) * 12, Math.sin(a) * 20 - 6); sc.add(s); }
  const h = kid(), mega = new THREE.Group(); mega.add(mesh(new THREE.CylinderGeometry(.14, .05, .32, 10, 1, true), 0xf4f4f0)); mega.add(at(mesh(new THREE.CylinderGeometry(.03, .03, .14, 6), 0xe8323a), 0, -.18, 0)); sc.add(h, mega); h.position.set(0, 3.0, 0);
  return t => { earth.rotation.y = t * .25; h.setFace('scream'); pose(h, { armR: [-1.6, 0, -.1], elbowR: -.4, armL: [-2.6, 0, .7] }); const hp = handPos(h, 1); mega.position.copy(hp).add(V(0, .05, .2)); mega.rotation.set(Math.PI / 2, 0, 0);
    const a = t * .35; camAt(Math.sin(a) * 4.5, 4.2 - t * .2, Math.cos(a) * 4.5 + 1.2, 0, 3.6, 0, 50, t, .02); }; });
// 15 "And every single one of them feels so bad... they give you a hundred dollars." - a crowd, all sad, then it RAINS hundreds
shot(66.85, 73.95, () => { const S = street(), h = kid(), crowd = [...Array(10)].map((_, i) => npc(['janitor', 'mailman', 'pizza', 'grandma', 'dude', 'co1', 'co2', 'co3'][i % 8])), bills = [...Array(60)].map(() => { const b = bill(); S.sc.add(b); return b; }); S.sc.add(h, ...crowd); const TR = L(71.4, 66.85);
  crowd.forEach((p, i) => { const a = -1.2 + i / 9 * 2.4, r = 2.2 + (i % 2) * .7; p.position.set(Math.sin(a) * r, 0, -Math.cos(a) * r + .6); p.lookAt(0, 0, .6); }); h.position.set(0, 0, .6); h.rotation.y = 0;
  return t => { crowd.forEach((p, i) => { p.setFace(t < TR ? (i % 3 ? 'worried' : 'tired') : 'calm'); pose(p, { armR: t > TR ? [-2.4, 0, -.2] : [0, 0, -.12] }); });
    h.setFace(t < TR ? 'worried' : 'happy'); pose(h, { armL: t > TR ? [-2.7, 0, .6] : [.7, 0, .3], armR: t > TR ? [-2.7, 0, -.6] : [.7, 0, -.3], elbowL: -.4, elbowR: -.4 });
    bills.forEach((b, i) => { const q = t - TR - hash(i) * 1.2; b.visible = q > 0; const y = 3.5 - q * 1.4; b.position.set((hash(i + 2) - .5) * 3 + Math.sin(q * 3 + i) * .2, Math.max(.01, y), .6 + (hash(i + 5) - .5) * 2.4); b.rotation.set(y > .02 ? q * 4 + i : -Math.PI / 2, i, y > .02 ? q * 3 : 0); });
    const k = ss(0, 7, t); camAt(lerp(.4, 0, k), lerp(1.7, 3.2, k), lerp(3.6, 5.2, k), 0, 1.0, -.2, 46, t); }; });
// 16 "By Friday you have forty thousand dollars and a bruise shaped like Texas." - lounging on a mountain of cash
shot(73.95, 80.15, () => { const sc = roomLP(0xf4e4c8, 0xb88a5a, 0xf4e4c8), h = kid(); const pile = new THREE.Group(); sc.add(pile); for (let i = 0; i < 120; i++) { const r = Math.sqrt(hash(i)) * 1.2, a = hash(i + 3) * 6.28, y = (1.2 - r) * .55 + hash(i + 7) * .05; const b = mesh(new THREE.BoxGeometry(.3, .07, .14), i % 5 ? 0x8ac87a : 0x7ab86a); b.position.set(Math.cos(a) * r, y, Math.sin(a) * r - .4); b.rotation.y = hash(i + 9) * 3; pile.add(b); }
  sc.add(h); const st = [...Array(14)].map(() => { const b = bill(.8); sc.add(b); return b; });
  return t => { h.setFace('happy'); h.position.set(0, .5, -.4); h.rotation.set(-.9, 0, 0); h.rotation.order = 'YXZ'; pose(h, { armL: [-2.7, 0, .7], armR: [-2.7, 0, -.7], elbowL: -1.6, elbowR: -1.6 }); h.userData.legs.forEach(l => { l.rotation.x = -.6; l.userData.knee.rotation.x = .9; });
    st.forEach((b, i) => { const q = (t * .5 + hash(i)) % 1; b.position.set((hash(i + 1) - .5) * 2, 2.4 - q * 2, -.4 + (hash(i + 4) - .5) * 1.5); b.rotation.set(t * 2 + i, i, t); });
    const k = ss(0, 6, t); camAt(lerp(1.4, .9, k), lerp(1.6, 1.4, k), lerp(2.4, 1.9, k), 0, .8, -.4, 46, t); }; });
// 17 "So the next morning, you walk into the bathroom. You see the wet floor sign..." - he sees it... and smiles
shot(80.15, 85.95, () => { const S = workBath(), h = kid(); S.sc.add(h); const TS = L(83.55, 80.15);
  return t => { const k = clamp(t / 2.2); h.position.set(lerp(-2.8, -1.4, k), 0, lerp(.6, .5, k)); h.rotation.y = k < 1 ? Math.PI / 2 : 1.25; h.setFace(t < TS ? 'calm' : 'smug'); pose(h, { walk: k < 1 ? t * 6 : 0 });
    const z = ss(TS, TS + 2, t); camAt(lerp(-.2, -.9, z), lerp(1.5, 1.4, z), lerp(2.6, 1.6, z), lerp(-1.1, -1.4, z), lerp(1.0, 1.3, z), lerp(-.1, .5, z), 46, t); }; });
// 18 "...and you run straight at it." - full sprint, feet first, BAM
shot(85.95, 88.55, () => { const S = workBath(), h = kid(); S.sc.add(h); const TJ = L(87.75, 85.95);
  return t => { const k = clamp(t / TJ); h.position.set(lerp(-2.4, -.2, k), 0, lerp(.6, -.2, k)); h.rotation.y = 1.25; h.setFace('happy'); pose(h, { walk: t * 18, lean: .35, armL: [-1.0, 0, .3], armR: [1.0, 0, -.3] });
    if (t > TJ) { const q = t - TJ; h.position.x = -.2 + q * 1.2; h.position.y = Math.max(0, .5 * Math.sin(Math.min(q * 4, Math.PI))); h.rotation.order = 'YXZ'; h.rotation.x = -Math.min(1.4, q * 5); pose(h, { armL: [-2.6, 0, .6], armR: [-2.6, 0, -.6], snap: true }); h.setFace('scream'); }
    camAt(.6, .8, 2.4, -.4, .7, -.2, 48, t, t > TJ ? .03 : .01); }; });
// 19 "Genius." - flat on the wet floor, thumbs up, grinning
shot(88.55, 999, () => { const S = workBath(), h = kid(), st = stars3(S.sc); S.sc.add(h); layDown(h, .4, .1, 1.3);
  return t => { h.setFace('happy'); pose(h, { armL: [-.3, 0, 1.4], armR: [-3.0, 0, -.2], elbowR: -1.4 }); h.userData.legs.forEach(l => l.rotation.x = -.2); spinStars(st, HP(h), t); lieCamF(h, t, 1.4, 1.6, .3, 44, .004); }; });

// ===================== RENDER =====================
window.__BLEEPS = [];
const built = new Map();
function bruiseCard(t, t0, t1) { if (t < t0 || t > t1) return; const k = pop(t - t0); og.save(); og.translate(W * .5, H * .3); og.scale(k, k); og.rotate(-.04); og.fillStyle = '#fff'; og.strokeStyle = '#16121a'; og.lineWidth = 12; og.beginPath(); og.roundRect(-300, -220, 600, 420, 40); og.fill(); og.stroke();
  const P = [[.25, 0], [.45, 0], [.45, .3], [.7, .35], [.95, .38], [1, .6], [.95, .72], [.75, .85], [.62, 1], [.55, .95], [.45, .78], [.35, .7], [.25, .55], [.15, .6], [0, .45], [.25, .45]];
  og.fillStyle = '#8a4ab8'; og.beginPath(); P.forEach(([x, y], i) => { const X = -170 + x * 340, Y = -190 + y * 280; i ? og.lineTo(X, Y) : og.moveTo(X, Y); }); og.closePath(); og.fill(); og.fillStyle = '#5a2a88'; og.globalAlpha = .5; og.beginPath(); og.arc(10, -40, 60, 0, 7); og.fill(); og.globalAlpha = 1;
  og.fillStyle = '#16121a'; og.font = '900 54px Nunito'; og.textAlign = 'center'; og.fillText('THE BRUISE', 0, 160); og.restore(); }
function renderAt(t) { window.__T = t; let i = SH.findIndex((s, k) => t >= s.a && (k + 1 >= SH.length || t < SH[k + 1].a)); if (i < 0) i = 0; const s = SH[i];
  if (!built.has(i)) { for (const k of [...built.keys()]) if (k < i - 1) built.delete(k); const up = s.build(); built.set(i, { up, sc: window.__sc }); }
  const B = built.get(i); B.up(t - s.a); renderer.render(B.sc, cam); og.drawImage(renderer.domElement, 0, 0);
  bubble(t, F(4.05), F(6.9), '6:00 AM', W / 2, H * .17, '#ffd23a');
  bubble(t, F(7.62), F(8.95), 'no coffee', W / 2, H * .17, '#ffffff'); bubble(t, F(9.08), F(10.9), 'no breakfast', W / 2, H * .17, '#ffffff'); bubble(t, F(11.19), F(13.8), 'last good day: 2019', W / 2, H * .17, '#ffffff');
  bang(t, F(19.04), 'CAUTION', '#ffd21a', W / 2, H * .2, -.05); bang(t, F(20.04), 'WET FLOOR', '#ffd21a', W / 2, H * .2, .05);
  bang(t, F(29.48), 'NINJA', '#ffffff', W / 2, H * .2, -.06); bang(t, F(31.0), '1', '#ffffff', W / 2, H * .2, 0); bang(t, F(32.42), '2', '#ffffff', W / 2, H * .2, 0); bang(t, F(33.43), '3...', '#ff4a4a', W / 2, H * .2, 0);
  bang(t, F(39.52), 'BAM!', '#ff4a4a', W / 2, H * .24, -.08);
  for (const [w, x] of [[48.03, 0], [53.83, 0], [55.79, 0], [56.76, 0], [58.25, 0], [59.05, 0], [61.76, 0]]) bang(t, F(w), '+$100', '#3ab86a', W / 2, H * .2, -.04);
  bubble(t, F(75.03), F(77.0), '$40,000', W / 2, H * .17, '#3ab86a'); bruiseCard(t, F(77.2), F(80.1));
  bang(t, F(88.61), 'GENIUS', '#ffd23a', W / 2, H * .2, -.05);
  caption(t); }
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .9); };
window.renderFrame = i => { renderAt(i / FPS); return out.toDataURL('image/jpeg', .92); };
window.frameCount = NF; window.ready = true;
