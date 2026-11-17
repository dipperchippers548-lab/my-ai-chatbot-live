// ===================== STEVE: SHOTS =====================
// helpers for this episode
const talkIf = (tc, a, b) => tc >= tm(a) - .03 && tc <= tm(b) ? talkShape(tc) : null;
function walkTo(scene, o, x0, z0, x1, z1, k, t, ry, sp = 7) { const x = lerp(x0, x1, k), z = lerp(z0, z1, k), wd = stepPose(walkPhase(Math.hypot(x - x0, z - z0))), moving = k > 0 && k < 1; return place(scene, { ...o, ...(moving ? wd : {}), arms: moving ? wd.arms : o.arms }, x, moving ? wd.bob : 0, z, ry); }
const MX = HX.gary;   // Mark's new house (purple roof)
// 1 "When Mark moved to a tiny new town," - the moving truck pulls up; Mark hops out with a box
shot(0, 2.15, () => { const S = world('day'), cam = newCam(42), tr = makeTruck(); S.scene.add(tr); const bx = cardBox(.45); S.scene.add(bx);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, 0); const k = ss(0, 1.0, f); tr.position.set(lerp(MX - 14, MX - 1.2, k), Math.abs(Math.sin(t * 20)) * .02 * (1 - k), 2.3);
    if (f > 1.1) { const a = ss(1.1, fd, f); place(S.scene, { ...MARK, mouth: 'grin', eyes: 'happy', hands: [V(-.3, 1.0, .35), V(.3, 1.0, .35)] }, MX + .4, 0, lerp(1.4, .3, a), Math.PI); bx.visible = true; bx.position.set(MX + .4, 1.1, lerp(1.4, .3, a) - .35); } else bx.visible = false;
    look(cam, MX + 1.5 - f * .4, 2.4, 9 - f * .5, MX - .5, 1.0, 1.2); drift(cam, t); } }; });
// 1b "his neighbor came over to say hi." - the neighbor waddles over, waving
shot(2.15, 4.2, () => { const S = world('day'), cam = newCam(40), bx = cardBox(.45); S.scene.add(bx);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); place(S.scene, { ...MARK, mouth: 'smile', hands: [V(-.3, 1.0, .35), V(.3, 1.0, .35)] }, MX, 0, -1.2, -.5); bx.position.set(MX - .17, 1.1, -.9); bx.rotation.y = -.5;
    const k = ss(0, fd * .8, f), wave = Math.sin(t * 12) * .15; walkTo(S.scene, { ...NEIGH, tag: null, mouth: 'grin', arms: [[-.45, -.15, .05], [.45, .7 + wave, .1]] }, MX - 4, -1.0, MX - 1.2, -1.0, k, t, Math.PI / 2 - .35);
    look(cam, MX - 1.5, 1.7, 3.6, MX - 1.2, 1.2, -1.1); drift(cam, t); } }; }, { xf: true });
// 2 "Hi, I'm Steve." - close: he says it; the name tag pops on his chest
shot(4.2, 5.7, () => { const S = world('day'), cam = newCam(36);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); const tp = pop(f - at(4.2, 4.85)); const m = talkIf(t, 4.34, 5.4);
    const g = place(S.scene, { ...NEIGH, tagPop: tp, mouth: m || 'grin', eyes: 'open', arms: [[-.45, -.1, .05], [.3, .55, .5]] }, MX - 1.2, 0, -1.0, .5); g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, -.3, 0));
    look(cam, hp.x + 1.7, hp.y + .1, hp.z + 2.5, hp.x, hp.y - .45, hp.z); drift(cam, t); } }; });
// 3 "Then the mailman showed up." - the mailman waddles in with letters
shot(5.7, 7.3, () => { const S = world('day'), cam = newCam(40), lt = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.22, .14), flat(0xf6f2e8)); S.scene.add(m); return m; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); place(S.scene, { ...MARK, mouth: 'smile' }, MX, 0, -1.2, -.9); place(S.scene, { ...NEIGH, mouth: 'smile' }, MX - 1.2, 0, -1.0, .6);
    const k = ss(0, fd, f), g = walkTo(S.scene, { ...MAIL, mouth: 'grin', arms: [[-.45, -.15, .05], [.35, .3, .45]] }, MX + 5, .2, MX + 1.3, .2, k, t, -Math.PI / 2 - .4); g.updateMatrixWorld(true); const h = g.localToWorld(V(.3, 1.08, .55)); lt.forEach((m, i) => { m.position.copy(h).add(V(0, i * .03, i * .01)); m.rotation.set(-.3, -1.2, i * .2); });
    look(cam, MX + 1.4, 1.7, 5.0, MX + 1.2, 1.1, -.4); drift(cam, t); } }; }, { xf: true });
// 4 "His name was also Steve." - snap zoom on the mailman's tag; Mark baffled
shot(7.3, 9.1, () => { const S = world('day'), cam = newCam(36), Z = at(7.3, 8.44);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); place(S.scene, { ...MARK, eyes: f > Z ? 'wide' : 'open', mouth: f > Z ? 'o' : 'smile', browUp: f > Z ? .06 : 0 }, MX, 0, -1.2, .4);
    const g = place(S.scene, { ...MAIL, mouth: 'grin' }, MX + 1.3, 0, .2, -1.0); g.updateMatrixWorld(true); const tg = g.localToWorld(V(0, .75, .3)); const z = clamp(spring((f - Z) * 1.6), 0, 1.05);
    if (f < Z) look(cam, MX + .5, 1.6, 3.6, MX + .6, 1.2, -.4); else look(cam, tg.x - Math.sin(1.0) * lerp(3, 1.0, z), tg.y + .05, tg.z + Math.cos(1.0) * lerp(3, 1.0, z), tg.x, tg.y, tg.z); drift(cam, t, .002); } }; });
// 5 "The barber? Steve." - barbershop: spinning pole, snip-snip, snap on "Steve"
shot(9.1, 10.7, () => { const R = room(0xe8f6ff), cam = newCam(40), Z = at(9.1, 10.11), pole = new THREE.Group(); R.scene.add(pole); pole.position.set(1.7, 0, -2.6);
  const poleT = ctex(32, 64, g => { for (let i = -64; i < 128; i += 16) { g.fillStyle = '#e8323a'; g.beginPath(); g.moveTo(0, i); g.lineTo(32, i + 16); g.lineTo(32, i + 22); g.lineTo(0, i + 6); g.fill(); g.fillStyle = '#3a6ad8'; g.beginPath(); g.moveTo(0, i + 8); g.lineTo(32, i + 24); g.lineTo(32, i + 28); g.lineTo(0, i + 12); g.fill(); } }); poleT.wrapS = poleT.wrapT = THREE.RepeatWrapping; poleT.repeat.set(1, 2);
  pole.add(at3(inked(new THREE.CylinderGeometry(.14, .14, 1.0, 16), 0xffffff, .012, poleT), 0, 1.6, 0)); pole.add(at3(inked(new THREE.SphereGeometry(.16, 12, 8), 0xe8e8e8, .01), 0, 2.15, 0));
  R.scene.add(at3(box(1.6, 1.4, .05, 0xbfe8ff, .02), -.3, 1.9, -2.85)); const ch = new THREE.Group(); ch.position.set(-.3, 0, -1.4); R.scene.add(ch); ch.add(at3(box(.8, .15, .8, 0xe8323a), 0, .6, 0)); ch.add(at3(box(.8, .9, .15, 0xe8323a), 0, 1.1, -.4)); ch.add(at3(inked(new THREE.CylinderGeometry(.08, .2, .55, 12), 0xc8ccd8, .01), 0, .28, 0));
  const sc = new THREE.Group(); R.scene.add(sc); for (const s of [-1, 1]) { const p = new THREE.Group(); p.add(at3(box(.04, .015, .3, 0xc8ccd8, .006), 0, 0, .15)); p.userData.s = s; sc.add(p); }
  return { scene: R.scene, cam, update(f, fd, t) { poleT.offset.y = -t * .8; const g = place(R.scene, { ...BARBER, mouth: f > Z ? 'grin' : 'smile', eyes: f > Z ? 'happy' : 'open', hands: [V(-.4, 1.1, .3), V(.35, 1.35, .45)] }, .8, 0, -1.2, -.6); g.updateMatrixWorld(true); sc.position.copy(g.localToWorld(V(.35, 1.4, .5))); sc.children.forEach(p => p.rotation.y = p.userData.s * Math.abs(Math.sin(t * 14)) * .4);
    const z = clamp(spring((f - Z) * 1.6), 0, 1.05), hp = g.localToWorld(V(0, 1.35, 0)); look(cam, lerp(1.0, hp.x - .9, z), lerp(1.8, hp.y + .1, z), lerp(3.6, hp.z + 1.8, z), lerp(.4, hp.x, z), lerp(1.3, hp.y - .05, z), lerp(-1.5, hp.z, z)); drift(cam, t); } }; });
// 6 "The mayor? Steve." - podium, flags, top hat; snap on "Steve"
shot(10.7, 12.6, () => { const R = room(0xdce8ff), cam = newCam(40), Z = at(10.7, 11.75); const pd = new THREE.Group(); pd.position.set(0, 0, -1.4); R.scene.add(pd); pd.add(at3(box(1.1, 1.0, .6, 0x8a5a3a), 0, .5, 0)); pd.add(at3(inked(new THREE.CircleGeometry(.22, 5), 0xffd23a, .008), 0, .62, .31));
  for (const x of [-1.8, 1.8]) { R.scene.add(at3(inked(new THREE.CylinderGeometry(.03, .03, 2.6, 8), 0xc8a050, .008), x, 1.3, -2.5)); const fl = at3(box(.7, .45, .02, 0x3a6ad8, .01), x + .36, 2.3, -2.5); R.scene.add(fl); }
  const conf = [...Array(30)].map((_, i) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(.06, .1), new THREE.MeshBasicMaterial({ color: PAL[i % 10], side: THREE.DoubleSide })); c.userData = i; R.scene.add(c); return c; });
  return { scene: R.scene, cam, update(f, fd, t) { const g = place(R.scene, { ...MAYOR, mouth: f > Z ? 'grin' : 'smile', arms: f > Z ? [[-.45, .7, .1], [.45, .7, .1]] : [[-.4, -.05, .3], [.4, -.05, .3]] }, 0, .02, -1.9, 0);
    conf.forEach(c => { const i = c.userData, q = ((t * .5 + i / 30) % 1); c.visible = f > Z; c.position.set(Math.sin(i * 2.3) * 2.2, 3.6 - q * 3.6, -1.2 + Math.cos(i * 1.7) * 1.0); c.rotation.set(t * 4 + i, t * 3, i); });
    const z = clamp(spring((f - Z) * 1.6), 0, 1.05); look(cam, 0, lerp(1.6, 1.85, z), lerp(4.2, 2.2, z), 0, lerp(1.35, 1.55, z), -1.9); drift(cam, t); } }; });
// 7 "Even the mayor's dog, was named Steve." - floor level: a tiny noodle dog, tail wagging, tag on the collar
shot(12.6, 15.5, () => { const S = world('day'), cam = newCam(50), dog = makeDog(); S.scene.add(dog); dog.position.set(MX - 1, 0, -.5); dog.rotation.y = -1.2; const Z = at(12.6, 14.77);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, 0); dog.userData.tail.rotation.x = Math.sin(t * 22) * .6; dog.userData.hd.rotation.z = Math.sin(t * 3) * .1; dog.position.y = Math.abs(Math.sin(t * 6)) * .02;
    const z = clamp(spring((f - Z) * 1.6), 0, 1.05), tg = dog.localToWorld(V(.36, .32, 0)); look(cam, lerp(MX + .4, tg.x + .5, z), lerp(.35, .38, z), lerp(1.3, tg.z + .55, z), lerp(MX - 1, tg.x, z), lerp(.35, tg.y, z), lerp(-.5, tg.z, z)); drift(cam, t); } }; }, { xf: true });
// 8 "Every single person in the town was named Steve." - crane up over a crowd, every tag says STEVE
shot(15.5, 18.7, () => { const S = world('day'), cam = newCam(45), crowd = []; for (let i = 0; i < 16; i++) { const x = -6 + (i % 8) * 1.6 + (i > 7 ? .8 : 0), z = i > 7 ? .9 : -.6; crowd.push(staticNoodle(S.scene, crowdOpt(i, { arms: [[-.45, .65, .1], [.45, .65, .1]] }), x, z, 0)); }
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, 0); crowd.forEach((g, i) => { g.position.y = Math.abs(Math.sin(t * 6 + i)) * .12; g.rotation.y = Math.sin(t * 2 + i) * .15; });
    const k = ss(0, fd, f); look(cam, -.4, lerp(1.6, 7.5, k), lerp(4.2, 8.5, k), -.4, lerp(1.4, .6, k), 0); } }; }, { noCut: true });
// 9 "Nobody knew how it started." - Mark in the middle of the Steves, shrugging; ? marks
shot(18.7, 20.6, () => { const S = world('day'), cam = newCam(40), crowd = []; for (let i = 0; i < 7; i++) { const a = Math.PI / 2 + .95 + i * (Math.PI * 2 - 1.9) / 6; crowd.push(staticNoodle(S.scene, crowdOpt(i + 3, { mouth: 'smile' }), MX - 1 + Math.cos(a) * 2.2, -1 + Math.sin(a) * 1.6, -a + Math.PI / 2 * 0)); }
  const qs = [0, 1].map(() => { const s = sprite('?', '#ffe21f', .7); S.scene.add(s); return s; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); crowd.forEach((g, i) => g.lookAt(MX - 1, 0, -1)); const sh = Math.sin(clamp(f * 2.5) * Math.PI);
    place(S.scene, { ...MARK, mouth: 'wavy', brow: -.25, browUp: .03, arms: [[-.55, .1 + sh * .25, .1], [.55, .1 + sh * .25, .1]] }, MX - 1, 0, -1, 0); qs.forEach((s, i) => { s.position.set(MX - 1.3 + i * .6, 2.6 + Math.sin(t * 4 + i) * .05, -1); s.scale.setScalar(.7 * pop(f - .2 - i * .15)); });
    look(cam, MX - 1, 2.0, 3.6 - f * .3, MX - 1, 1.3, -1); drift(cam, t); } }; }, { xf: true });
// 10 "Some people said it was a tradition." - dream: old-timey founders with a STEVE banner (sepia)
shot(20.6, 22.5, () => { const S = world('day'), cam = newCam(42), bn = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .7), new THREE.MeshBasicMaterial({ map: textTex('STEVE DAY', '#ffe8b0', 70), color: 0xffffff, transparent: true })); bn.position.set(MX - 1, 2.6, -1.6); S.scene.add(bn); S.scene.add(at3(box(3.4, .78, .02, 0x8a3a2a, .012), MX - 1, 2.6, -1.62));
  const f3 = [0, 1, 2].map(i => staticNoodle(S.scene, crowdOpt(i, { hat: 'top', mustache: true, mouth: 'smile', arms: [[-.45, .7, .1], [.45, .7, .1]] }), MX - 2.2 + i * 1.2, -1.2, 0));
  return { scene: S.scene, cam, dream: '#d8a060', update(f, fd, t) { setSun(S, MX, -1); f3.forEach((g, i) => g.position.y = Math.abs(Math.sin(t * 5 + i)) * .08); look(cam, MX - 1, 1.8, 3.6 - f * .3, MX - 1, 1.6, -1.4); drift(cam, t); } }; }, { xf: true });
// 11 "Others said the first guy who moved there just really liked the name." - a pioneer hugging a STEVE sign, hearts
shot(22.5, 26.0, () => { const S = world('day'), cam = newCam(40), sg = new THREE.Group(); S.scene.add(sg); sg.position.set(MX - .4, 0, -1.4); sg.add(at3(box(.12, 1.4, .12, 0x8a5a3a, .01), 0, .7, 0)); sg.add(at3(box(1.4, .6, .08, 0xc8955a, .015), 0, 1.4, 0)); const st = sprite('STEVE', '#ffffff', 1.0, 80); st.position.set(0, 1.4, .06); sg.add(st);
  const hs = [0, 1, 2, 3].map(() => { const s = sprite('♥', '#ff4a7a', .5, 140); S.scene.add(s); return s; });
  return { scene: S.scene, cam, dream: '#ffd0a0', update(f, fd, t) { setSun(S, MX, -1); place(S.scene, { color: 0xc8a06a, hat: 'pioneer', mustache: true, eyes: 'happy', mouth: 'grin', blush: true, lean: .15, hands: [V(-.25, 1.25, .45), V(.4, 1.3, .4)] }, MX - 1.1, 0, -1.3, .9);
    hs.forEach((s, i) => { const q = (t * .6 + i / 4) % 1; s.position.set(MX - .9 + Math.sin(i * 2) * .5, 2.0 + q * 1.2, -1.2); s.scale.setScalar(.45 * (1 - q * .5)); s.material.opacity = 1 - q; });
    look(cam, MX - .7, 1.7, 3.2 - f * .2, MX - .8, 1.4, -1.4); drift(cam, t); } }; }, { xf: true });
// 12 "Mark thought it was a prank." - smirk, arms crossed, eyeing the camera
shot(26.0, 27.8, () => { const S = world('day'), cam = newCam(38);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); const g = place(S.scene, { ...MARK, mouth: 'smirk', eyes: 'half', brow: -.25, hands: [V(.15, .92, .32), V(-.15, .9, .34)], turn: Math.sin(f * 3) * .25 }, MX, 0, -1, 0); g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, -.2, 0));
    look(cam, hp.x + .2, hp.y + .1, hp.z + 2.4 - f * .3, hp.x, hp.y - .2, hp.z); drift(cam, t); } }; }, { xf: true });
// 13 "Until he went to the grocery store, yelled Steve!" - aisle; Mark cups his hands and yells
shot(27.8, 30.95, () => { const G = store(), cam = newCam(42), backs = []; for (let i = 0; i < 12; i++) backs.push(staticNoodle(G.scene, crowdOpt(i, { mouth: 'smile' }), -1.1 + (i % 3) * 1.1 + (i > 5 ? .3 : 0), -2 - Math.floor(i / 3) * 2.2, Math.PI));
  return { scene: G.scene, cam, update(f, fd, t) { const m = talkIf(t, 30.2, 30.9), yell = !!m; const g = place(G.scene, { ...MARK, mouth: yell ? 'scream' : 'smile', eyes: yell ? 'closed' : 'open', hands: yell ? [V(-.18, 1.55, .5), V(.18, 1.55, .5)] : [V(-.35, .9, .35), V(.35, .9, .35)] }, 0, 0, 1.6, Math.PI);
    if (!yell) look(cam, .6, 1.8, 4.4, 0, 1.2, -2); else { look(cam, .5, 1.7, -.3, 0, 1.6, 1.6); shake(cam, t, .02); } drift(cam, t); } }; });
// 14 "and forty people turned around." - every noodle in the store spins round to look; snap zoom
shot(30.95, 33.7, () => { const G = store(), cam = newCam(44), crowd = []; for (let i = 0; i < 40; i++) crowd.push(staticNoodle(G.scene, crowdOpt(i, { mouth: 'o', eyes: 'wide' }), -1.2 + (i % 4) * .8 + (Math.floor(i / 4) % 2) * .35, -1 - Math.floor(i / 4) * 1.3, Math.PI));
  return { scene: G.scene, cam, update(f, fd, t) { crowd.forEach((g, i) => { const k = clamp((f - .15 - (i % 7) * .04) / .18); g.rotation.y = Math.PI * (1 - k); g.position.y = k > 0 && k < 1 ? .1 : 0; });
    const z = clamp(spring((f - .2) * 1.3), 0, 1.05); look(cam, 0, lerp(1.7, 1.75, z), lerp(5.5, 2.6, z), 0, 1.3, -4); shake(cam, t, .015 * Math.exp(-f * 3)); } }; });
// 15 "Phone calls were a nightmare." - his phone: every contact is Steve; an incoming call from... Steve
shot(33.7, 35.9, () => { const S = world('day'), cam = newCam(36), ph = new THREE.Group(); S.scene.add(ph); ph.add(at3(box(.42, .78, .05, 0x2a2a30, .012), 0, 0, 0));
  const D = document.createElement('canvas'); D.width = 120; D.height = 220; const g2 = D.getContext('2d'), T = new THREE.CanvasTexture(D); T.colorSpace = THREE.SRGBColorSpace; const scr = new THREE.Mesh(new THREE.PlaneGeometry(.37, .68), new THREE.MeshBasicMaterial({ map: T })); scr.position.z = .03; ph.add(scr);
  const draw = (f) => { g2.fillStyle = '#f6f6fa'; g2.fillRect(0, 0, 120, 220); g2.fillStyle = '#16121a'; g2.font = '900 14px Nunito'; g2.fillText('Contacts', 8, 20); const names = ['Steve', 'Steve', 'Steve (barber)', 'Steve (mayor)', 'Steve (dog)', 'Steve', 'Steve??', 'Steve']; names.forEach((n, i) => { g2.fillStyle = i % 2 ? '#ffffff' : '#eef0f6'; g2.fillRect(0, 30 + i * 22, 120, 22); g2.fillStyle = '#16121a'; g2.font = '700 12px Nunito'; g2.fillText(n, 10, 45 + i * 22); });
    if (f > .9) { g2.fillStyle = 'rgba(40,180,90,.95)'; g2.fillRect(6, 150, 108, 62); g2.fillStyle = '#fff'; g2.font = '900 12px Nunito'; g2.fillText('Incoming call', 14, 170); g2.font = '900 20px Nunito'; g2.fillText('STEVE', 14, 196); } T.needsUpdate = true; };
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, -1); draw(f); const g = place(S.scene, { ...MARK, mouth: f > .9 ? 'frown' : 'wavy', eyes: f > .9 ? 'wide' : 'half', brow: .25, hands: [V(-.05, 1.25, .5), V(.15, 1.2, .5)] }, MX, 0, -1, 0); g.updateMatrixWorld(true); ph.position.copy(g.localToWorld(V(.05, 1.42, .55))); ph.rotation.set(-.15, 0, Math.sin(t * 40) * .03 * (f > .9));
    look(cam, MX + .35, 1.85, .75, MX + .05, 1.45, -.5); drift(cam, t, .002); } }; }, { xf: true });
// 16 "Birthday parties were chaos." - party hats, confetti, everyone bouncing, every tag STEVE
shot(35.9, 37.9, () => { const R = room(0xfff0f6), cam = newCam(46), crowd = []; for (let i = 0; i < 10; i++) crowd.push(staticNoodle(R.scene, crowdOpt(i, { hat: 'party', mouth: 'grin', eyes: 'happy', arms: [[-.45, .7, .1], [.45, .7, .1]] }), -2.4 + (i % 5) * 1.2, -.6 - Math.floor(i / 5) * 1.3, 0));
  const conf = [...Array(50)].map((_, i) => { const c = new THREE.Mesh(new THREE.PlaneGeometry(.07, .11), new THREE.MeshBasicMaterial({ color: PAL[i % 10], side: THREE.DoubleSide })); c.userData = i; R.scene.add(c); return c; });
  return { scene: R.scene, cam, update(f, fd, t) { crowd.forEach((g, i) => { g.position.y = Math.abs(Math.sin(t * 9 + i * 1.3)) * .35; g.rotation.y = Math.sin(t * 5 + i) * .4; }); conf.forEach(c => { const i = c.userData, q = ((t * .6 + i / 50) % 1); c.position.set(Math.sin(i * 2.3) * 3, 4 - q * 4, -1 + Math.cos(i * 1.7) * 1.5); c.rotation.set(t * 5 + i, t * 4, i); });
    look(cam, Math.sin(t * 1.3) * .3, 1.9, 4.6, 0, 1.2, -1.2); cam.rotation.z += Math.sin(t * 7) * .02; } }; }, { xf: true });
// 17 "Every cake just said, Happy Birthday, Steve." - close on a cake... then a row of identical ones
shot(37.9, 40.95, () => { const R = room(0xfff0f6), cam = newCam(40), Z = at(37.9, 39.6), cakes = []; R.scene.add(at3(box(9, .1, 1.4, 0xffffff, .015), 0, .9, 0)); for (let i = 0; i < 7; i++) { const c = makeCake(); c.position.set(-3.6 + i * 1.2, .95, 0); R.scene.add(c); cakes.push(c); }
  return { scene: R.scene, cam, update(f, fd, t) { cakes.forEach((c, i) => c.userData.flames.forEach(fl => fl.scale.y = 1.4 + Math.sin(t * 20 + i) * .3)); const z = clamp(spring((f - Z) * 1.3), 0, 1.05);
    look(cam, lerp(.4, 0, z), lerp(2.6, 2.4, z), lerp(1.2, 4.6, z), lerp(0, 0, z), lerp(1.1, 1.1, z), 0); drift(cam, t); } }; }, { noCut: true });
// 18 "Mark tried to stay himself." - Steves stream past him; he stands firm, sweating
shot(40.95, 42.9, () => { const S = world('day'), cam = newCam(40), dr = [0, 1, 2].map(() => { const d = inked(new THREE.SphereGeometry(.04, 8, 6), 0x9ad8ff, .006, null, true); S.scene.add(d); return d; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, MX, 0); for (let i = 0; i < 6; i++) { const x = ((t * 1.6 + i * 1.3) % 8) - 4; const w = stepPose(walkPhase(t * 1.6 + i * 1.3)); place(S.scene, { ...crowdOpt(i), ...w }, MX + x, w.bob, i % 2 ? -.2 : .9, Math.PI / 2); }
    const g = place(S.scene, { ...MARK, mouth: 'flat', eyes: 'open', brow: -.3, hands: [V(-.3, .75, .2), V(.3, .75, .2)] }, MX, 0, .35, 0); g.updateMatrixWorld(true); dr.forEach((d, i) => { const q = (t * 1.5 + i / 3) % 1; d.position.copy(g.userData.head.localToWorld(V(.3 - i * .15, .2 - q * .4, .3))); });
    look(cam, MX, 1.7, 4.2 - f * .4, MX, 1.4, .3); drift(cam, t); } }; }, { xf: true });
// 19 "He lasted six months." - a calendar shedding pages JAN -> JUN; Mark looking more and more tired
shot(42.9, 44.9, () => { const R = room(0xf6f0e0), cam = newCam(40), pages = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'].map((m, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.1), new THREE.MeshBasicMaterial({ map: ctex(90, 110, g => { g.fillStyle = '#fff'; g.fillRect(0, 0, 90, 110); g.fillStyle = '#e8323a'; g.fillRect(0, 0, 90, 28); g.fillStyle = '#fff'; g.font = '900 20px Nunito'; g.textAlign = 'center'; g.fillText(m, 45, 21); g.fillStyle = '#c8c8d0'; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) g.fillRect(6 + c * 13.5, 36 + r * 17, 10, 12); g.strokeStyle = '#16121a'; g.lineWidth = 3; g.strokeRect(0, 0, 90, 110); }), side: THREE.DoubleSide })); p.position.set(.9, 2.1, -2.85 + (6 - i) * .004); R.scene.add(p); return p; });
  return { scene: R.scene, cam, update(f, fd, t) { pages.forEach((p, i) => { const k = clamp((f - .15 - i * .28) / .3); p.visible = i < 5 ? k < 1 : true; if (i < 5) { p.rotation.x = -k * 1.5; p.position.y = 2.1 + k * .6; p.position.z = -2.85 + (6 - i) * .004 + k * .5; } });
    const tired = clamp(f / fd); place(R.scene, { ...MARK, eyes: tired > .6 ? 'half' : 'open', mouth: tired > .6 ? 'wavy' : 'flat', tilt: tired * .2, nod: tired * .2, arms: [[-.4, -.3, 0], [.4, -.3, 0]] }, -.25, 0, -1.4, .3);
    look(cam, .35, 1.7, 2.6, .3, 1.6, -2); drift(cam, t); } }; }, { xf: true });
// 20 "Then one day, a new family moved in next door." - a new moving truck, a family with boxes
shot(44.9, 48.0, () => { const S = world('day'), cam = newCam(42), tr = makeTruck(); S.scene.add(tr); const boxes = [0, 1].map(() => { const b = cardBox(.35); S.scene.add(b); return b; });
  return { scene: S.scene, cam, update(f, fd, t) { const FX = HX.orange; setSun(S, FX, 0); const k = ss(0, .9, f); tr.position.set(lerp(FX + 12, FX + .8, k), 0, 2.3); tr.rotation.y = Math.PI;
    if (f > 1.0) { const a = ss(1.0, fd, f); [[{ color: 0x5ac85a, mouth: 'grin' }, -.7], [{ color: 0xff8ab8, mouth: 'smile', curlers: false, glasses: true }, .4], [{ color: 0xffd23a, mouth: 'grin', eyes: 'happy', tuft: true }, 1.2]].forEach(([o, dx], i) => { const w = stepPose(walkPhase(1.8 * a) + i); const g = place(S.scene, { ...o, ...w, hands: i < 2 ? [V(-.3, 1.0, .35), V(.3, 1.0, .35)] : undefined }, FX + dx, w.bob, lerp(1.2, -.6, a), Math.PI); if (i === 2) g.scale.setScalar(.7); if (i < 2) { boxes[i].position.set(FX + dx, 1.1, lerp(1.2, -.6, a) - .35); boxes[i].visible = true; } }); } else boxes.forEach(b => b.visible = false);
    look(cam, FX + .3, 1.9, -3.9, FX + .3, 1.0, .5); drift(cam, t); } }; }, { xf: true });
// 21 "Mark walked over, smiled, and said," - Mark waddles over to them (tag hidden from camera)
shot(48.0, 50.6, () => { const S = world('day'), cam = newCam(40);
  return { scene: S.scene, cam, update(f, fd, t) { const FX = HX.orange; setSun(S, FX, 0); [[{ color: 0x5ac85a, mouth: 'smile' }, -.2], [{ color: 0xff8ab8, mouth: 'smile', glasses: true }, .7], [{ color: 0xffd23a, mouth: 'smile', tuft: true }, 1.4]].forEach(([o, dx], i) => { const g = place(S.scene, o, FX + dx, 0, -.6, -Math.PI / 2 + .3); if (i === 2) g.scale.setScalar(.7); });
    const k = ss(0, fd * .75, f), sm = f > at(48.0, 49.24); walkTo(S.scene, { ...MARK, tag: 'STEVE', mouth: sm ? 'grin' : 'smile', eyes: sm ? 'happy' : 'open' }, FX - 5, -.6, FX - 1.5, -.6, k, t, Math.PI / 2);
    look(cam, FX - 1.3, 1.8, 4.6, FX - 1.1, 1.1, -.6); drift(cam, t); } }; }, { xf: true });
// 22 "Hi. I'm Steve." - snap zoom: Mark's grin and his brand new STEVE tag; the family's faces drop
shot(50.6, 99, () => { const S = world('day'), cam = newCam(36), Z = at(50.6, 51.45);
  return { scene: S.scene, cam, update(f, fd, t) { const FX = HX.orange; setSun(S, FX, 0); const m = talkIf(t, 50.7, 52.1);
    [[{ color: 0x5ac85a }, -.2], [{ color: 0xff8ab8, glasses: true }, .7], [{ color: 0xffd23a, tuft: true }, 1.4]].forEach(([o, dx], i) => { const g = place(S.scene, { ...o, mouth: f > Z + .3 ? 'o' : 'smile', eyes: f > Z + .3 ? 'wide' : 'open' }, FX + dx, 0, -.6, -Math.PI / 2 + .3); if (i === 2) g.scale.setScalar(.7); });
    const g = place(S.scene, { ...MARK, tag: 'STEVE', tagPop: f > Z ? 1 + .25 * Math.exp(-(f - Z) * 8) : 1, mouth: m || 'grin', eyes: 'happy', blush: true, arms: [[-.45, -.1, .05], [.45, .55, .2]] }, FX - 1.5, 0, -.6, .45);
    g.updateMatrixWorld(true); const c = g.localToWorld(V(0, 1.1, 0)), z = clamp(spring((f - Z) * 1.4), 0, 1.05), dir = V(Math.sin(.2), 0, Math.cos(.2)), d = lerp(4.6, 2.4, z);
    if (f < Z + .9) look(cam, c.x + dir.x * d - .4, c.y + .25, c.z + dir.z * d, c.x, c.y + .1, c.z); else look(cam, FX - .5, 1.6, 2.6, FX + .6, 1.35, -.6); this.fade = ss(fd - .5, fd - .05, f); } }; }, { noCut: true });
