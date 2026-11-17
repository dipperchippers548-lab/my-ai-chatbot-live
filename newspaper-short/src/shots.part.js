// ===================== NEWSPAPER: cast, props, SHOTS =====================
const talkIf = (tc, a, b) => tc >= tm(a) - .03 && tc <= tm(b) ? talkShape(tc) : null;
function walkTo(scene, o, x0, z0, x1, z1, k, t, ry) { const x = lerp(x0, x1, k), z = lerp(z0, z1, k), wd = stepPose(walkPhase(Math.hypot(x - x0, z - z0))), moving = k > 0 && k < 1; return place(scene, { ...o, ...(moving ? wd : {}), arms: moving ? wd.arms : o.arms }, x, moving ? wd.bob : 0, z, ry); }
function card(w, h, draw, pw = 256) { const ph = Math.round(pw * h / w); const D = document.createElement('canvas'); D.width = pw; D.height = ph; const g = D.getContext('2d'); const T = new THREE.CanvasTexture(D); T.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: T, side: THREE.DoubleSide }));
  m.userData.draw = (...a) => { g.clearRect(0, 0, pw, ph); draw(g, pw, ph, ...a); T.needsUpdate = true; }; m.userData.draw(); return m; }
// camera in front of a noodle's face (d = distance, side = sideways offset)
function faceCam(cam, g, d = 1.8, side = 0, up = .1, dy = -.15) { g.updateMatrixWorld(true); const hp = g.userData.head.localToWorld(V(0, -.2, 0)), a = g.rotation.y, fw = V(Math.sin(a), 0, Math.cos(a)), rt = V(Math.cos(a), 0, -Math.sin(a));
  look(cam, hp.x + fw.x * d + rt.x * side, hp.y + up, hp.z + fw.z * d + rt.z * side, hp.x, hp.y + dy, hp.z); return hp; }
function lights(S) { S.hemi = S.scene.children.find(o => o.isHemisphereLight); return S; }
function dayNight(S, night) { S.scene.background = night ? SKY.night : SKY.day; S.hemi.intensity = night ? .7 : 1.3; S.hemi.color.set(night ? 0x5a6ab8 : 0xffffff); S.sun.intensity = night ? .8 : 2.4; S.sun.color.set(night ? 0x8aa8ff : 0xfff6e0); S.scene.fog.color.set(night ? 0x1a2058 : 0xc8ecff); }
function darkWindows(house) { for (const i of [3, 4]) house.children[i].children[0].material.color.set(0x2a3050); }

// ---------- cast ----------
const HS = { lees: HX.patel, millers: HX.dave, parkers: HX.gary, walt: HX.orange };
const WALT = { color: 0xc4ccdc, glasses: true, mustache: true, robe: 0x9a2a3a, shoe: 0x7a5a4a, eyes: 'half', mouth: 'flat' };
const COSTUME = { ...WALT, robe: null, raincoat: true, mask: true };
const COP = { color: 0xffd0a8, hat: 'mail', badge: true, shoe: 0x16121a, eyes: 'half', mouth: 'flat' };
const KID = { color: 0x7ad85a, hat: 'cap', hatColor: 0xe8323a, shoe: 0xffffff };
const BURG = { color: 0x9a9ab0, pj: true, pjMap: 'burglar', limb: 0x24222c, hat: 'beanie', shoe: 0x16121a, eyes: 'half', mouth: 'smirk' };
const MILLER = [{ color: 0xff8a6a, hat: 'cap', hatColor: 0x3a8ad8, glasses: true }, { color: 0xffd23a, blush: true }, { color: 0x6ae0c8, tuft: true }];
const NBC = [0xff6aa8, 0x38c8c0, 0xffd23a, 0x5aa8ff, 0xa87ae8, 0x7ad85a, 0xff8a6a, 0xffb04a];
const nb = (i, extra = {}) => ({ color: NBC[i % NBC.length], hat: [null, 'cap', null, null, 'cap'][i % 5], hatColor: NBC[(i + 3) % NBC.length], glasses: i % 4 === 1, mustache: i % 5 === 2, tuft: i % 3 === 0, curlers: i % 6 === 4, robe: [null, 0x3a6ad8, null, 0xff8ab8, null, 0x7a4ac8][i % 6], shoe: 0x3a3a48, mouth: 'smile', ...extra });

// ---------- props ----------
function paper() { const g = new THREE.Group(); const c = inked(new THREE.CylinderGeometry(.055, .055, .34, 12), 0xece6d6, .01); c.rotation.z = Math.PI / 2; g.add(c); const band = inked(new THREE.TorusGeometry(.058, .012, 6, 14), 0xe8323a, .004); band.rotation.y = Math.PI / 2; g.add(band); return g; }
function paperPile(n, seed = 1) { const g = new THREE.Group(), r = rng(seed), items = [], s0 = Math.max(3, Math.round(Math.sqrt(n * 1.3))); let L = 0, k = 0;
  const rowN = l => Math.max(1, s0 - Math.ceil(l / 2));
  for (let i = 0; i < n; i++) { if (k >= rowN(L)) { L++; k = 0; } const cnt = rowN(L); const p = paper(); p.position.set((r() - .5) * .08, .055 + L * .095, (k - (cnt - 1) / 2) * .112 + (L % 2) * .02); p.rotation.y = (r() - .5) * .35; g.add(p); items.push(p); k++; }
  g.userData.setN = m => items.forEach((p, i) => p.visible = i < m); g.userData.top = m => .1 + Math.floor(Math.max(0, m - 1) / s0) * .095; return g; }
function wagon() { const g = new THREE.Group(); g.add(at3(box(.8, .22, .48, 0xe8323a, .015), 0, .3, 0));
  for (const [x, z] of [[-.28, -.26], [-.28, .26], [.28, -.26], [.28, .26]]) { const w = inked(new THREE.CylinderGeometry(.1, .1, .05, 12), 0x16161a, .01); w.rotation.x = Math.PI / 2; w.position.set(x, .1, z); g.add(w); }
  g.add(curveTube([V(.4, .3, 0), V(.68, .42, 0), V(.85, .6, 0)], .02, 0x2a2a30, .008));
  const load = new THREE.Group(); load.position.y = .44; g.add(load); const items = [], r = rng(3);
  for (let i = 0; i < 16; i++) { const p = paper(); const layer = Math.floor(i / 6); p.position.set((r() - .5) * .3, layer * .085, ((i % 6) - 2.5) * .07); p.rotation.y = (r() - .5) * .5; p.scale.setScalar(.9); load.add(p); items.push(p); }
  g.userData.fill = n => items.forEach((p, i) => p.visible = i < n); g.userData.fill(0); return g; }   // handle points +x
function secCam() { const g = new THREE.Group(); g.add(at3(box(.08, .08, .12, 0xf2f2f2, .008), 0, 0, .02)); const b = inked(new THREE.CylinderGeometry(.06, .07, .22, 12), 0xf6f6f6, .01); b.rotation.x = Math.PI / 2; b.position.z = .14; g.add(b);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.045, 14), flat(0x16121a)); lens.position.z = .252; g.add(lens); const led = new THREE.Mesh(new THREE.SphereGeometry(.016, 6, 6), flat(0xff2020)); led.position.set(.04, .045, .22); g.add(led); g.userData.led = led; return g; }
function car(col, police) { const g = new THREE.Group(); g.add(at3(box(2.4, .45, 1.15, col), 0, .5, 0));
  if (police) { g.add(at3(box(2.42, .2, 1.17, 0x1a1a2a, .012), 0, .36, 0)); g.add(at3(box(1.3, .42, 1.05, col), -.1, .93, 0)); g.add(at3(box(1.22, .3, 1.07, 0x9ad8ff, .01), -.1, .95, 0));
    const red = at3(box(.26, .12, .3, 0xff2a2a, .01), -.25, 1.2, 0), blue = at3(box(.26, .12, .3, 0x2a5aff, .01), .05, 1.2, 0); g.add(red, blue); g.userData.red = red; g.userData.blue = blue; const s = sprite('POLICE', '#2a3a8a', 1.1, 60); s.position.set(0, .52, .64); g.add(s); }
  else { const ws = at3(box(.06, .35, 1.0, 0x9ad8ff, .01), .55, .9, 0); ws.rotation.z = -.35; g.add(ws); for (const [x, z, w, h, cc] of [[-1.0, -.25, .3, .3, 0xe8323a], [-1.0, .2, .28, .38, 0xffd23a]]) g.add(at3(box(w, h, .32, cc, .01), x, .72 + h / 2, z)); }
  for (const [x, z] of [[-.8, .58], [-.8, -.58], [.8, .58], [.8, -.58]]) { const w = inked(new THREE.CylinderGeometry(.24, .24, .18, 14), 0x16161a, .012); w.rotation.x = Math.PI / 2; w.position.set(x, .24, z); g.add(w); } return g; }   // faces +x
function mug() { const g = new THREE.Group(); g.add(inked(new THREE.CylinderGeometry(.06, .055, .12, 12), 0xffffff, .008)); const h = inked(new THREE.TorusGeometry(.035, .012, 6, 10), 0xffffff, .005); h.position.x = .07; g.add(h); return g; }
function binos() { const g = new THREE.Group(); for (const x of [-.07, .07]) { const c = inked(new THREE.CylinderGeometry(.05, .055, .16, 10), 0x24222c, .01); c.rotation.x = Math.PI / 2; c.position.x = x; g.add(c); } return g; }
function tv() { const g = new THREE.Group(); g.add(box(.7, .45, .08, 0x24222c, .012)); const s = new THREE.Mesh(new THREE.PlaneGeometry(.62, .37), flat(0x3a5a7a)); s.position.z = .045; g.add(s); return g; }
function lamp() { const g = new THREE.Group(); g.add(at3(inked(new THREE.CylinderGeometry(.03, .03, .7, 8), 0xc8a050, .008), 0, .35, 0)); g.add(at3(inked(new THREE.CylinderGeometry(.12, .2, .22, 14, 1, true), 0xffe8a0, .01), 0, .75, 0)); g.add(at3(inked(new THREE.CylinderGeometry(.12, .12, .04, 12), 0xc8a050, .008), 0, 0, 0)); return g; }
function fishbowl() { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.SphereGeometry(.17, 18, 14), new THREE.MeshToonMaterial({ color: 0x8ad8ff, gradientMap: ramp, transparent: true, opacity: .55 }))); g.add(new THREE.Mesh(new THREE.SphereGeometry(.17, 18, 14), inkMat(.006)));
  const fish = inked(new THREE.SphereGeometry(.045, 10, 8), 0xff8a2a, .006); fish.scale.set(1.5, 1, .8); g.add(fish); g.userData.fish = fish; return g; }
function rocker() { const g = new THREE.Group(), c = 0x9a6a3a; g.add(at3(box(.62, .07, .55, c, .012), 0, .45, 0)); g.add(at3(box(.62, .75, .07, c, .012), 0, .84, -.25));
  for (const x of [-.28, .28]) { g.add(at3(box(.05, .42, .05, c, .008), x, .23, .2)); g.add(at3(box(.05, .42, .05, c, .008), x, .23, -.2)); g.add(curveTube([V(x, .03, -.42), V(x, -.02, 0), V(x, .03, .42)], .025, 0x7a4a2a, .008)); } return g; }
function armchair() { const g = new THREE.Group(), c = 0x3a8a7a; g.add(at3(box(.95, .45, .8, c), 0, .22, 0)); g.add(at3(box(.95, .85, .2, c), 0, .68, -.35)); for (const x of [-.48, .48]) g.add(at3(box(.18, .35, .8, c), x, .58, 0)); return g; }
const stackT = ctex(32, 64, g => { g.fillStyle = '#efe9da'; g.fillRect(0, 0, 32, 64); for (let y = 0; y < 64; y += 4) { g.fillStyle = y % 8 ? '#cfc6b2' : '#b0a690'; g.fillRect(0, y, 32, 1); } });
function stack(h) { const t = stackT.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, h * 2.5); t.needsUpdate = true; return inked(new THREE.BoxGeometry(.42, h, .32), 0xffffff, .012, t); }
function shards(scene) { const ps = [...Array(10)].map((_, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(.06 + (i % 3) * .025, 3), new THREE.MeshBasicMaterial({ color: 0xd8f4ff, side: THREE.DoubleSide })); m.visible = false; scene.add(m); return m; });
  return { update(u, p) { ps.forEach((m, i) => { m.visible = u > 0 && u < 1.0; if (!m.visible) return; const a = i * 2.4, sp = 1.4 + (i % 4) * .45; m.position.set(p.x + Math.cos(a) * sp * u * .7, p.y + Math.sin(a) * .25 + sp * u * .8 - 4.9 * u * u, p.z + .1 + sp * u); m.rotation.set(u * 9 + i, u * 7, i); }); } }; }
// a newspaper flying from a to b along an arc (u: 0..1)
function flyPaper(p, a, b, u, hgt = 1.8) { p.visible = true; p.position.lerpVectors(a, b, u); p.position.y += Math.sin(u * Math.PI) * hgt; p.rotation.set(u * 11, u * 2, 0); }
const porchP = hx => V(hx + .3, .06, -4.35);

// ===================== SHOTS (voiceover clock) =====================
// 1 "Every morning at 5 AM, an old man..." - dark street, a little old man in a bathrobe tiptoeing with a red wagon
shot(0, 2.62, () => { const S = lights(world('night')), cam = newCam(42), wg = wagon(); S.scene.add(wg); wg.userData.fill(3);
  for (const hx of [HS.parkers, HS.millers]) S.scene.add(at3(paper(), hx + .3, .06, -4.35));
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 3, -1); const k = clamp(f / fd), x = lerp(5.4, 3.2, k);
    walkTo(S.scene, { ...WALT, eyes: 'half', mouth: 'smirk', lean: .18, arms: [[-.5, -.15, .15], [.4, -.35, -.3]] }, 5.4, -.15, 3.2, -.15, k, t, -Math.PI / 2);
    wg.position.set(x + 1.15, 0, -.15); wg.rotation.y = Math.PI; look(cam, 1.5, .75, 3.0, 4.2, 1.0, -.6); } }; }, { noCut: true });
// 2 "...named Walt." - close-up: the eyebrows, the smirk
shot(2.62, 3.5, () => { const S = lights(world('night')), cam = newCam(36), wg = wagon(); S.scene.add(wg); wg.userData.fill(3);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 3, -1); const g = place(S.scene, { ...WALT, eyes: 'half', mouth: 'smirk', browUp: Math.abs(Math.sin(t * 10)) * .05, lean: .1 }, 3, 0, -.15, -Math.PI / 2 + .55); wg.position.set(4.2, 0, -.3); wg.rotation.y = Math.PI; faceCam(cam, g, 2.1, .25, .05, -.12); } }; });
// 3 "...steals every newspaper on his street." - he rockets down the street, papers fly off every porch into the wagon
shot(3.5, 5.5, () => { const S = lights(world('night')), cam = newCam(46), wg = wagon(); S.scene.add(wg); const ps = [HS.lees, HS.millers, HS.parkers].map(hx => { const p = paper(); S.scene.add(p); return [p, hx]; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -2, -2); const k = clamp(f / fd), x = lerp(-11.5, 4.6, k), wx = x - 1.15; const sp = stepPose(t * 24);
    place(S.scene, { ...WALT, ...sp, eyes: 'wide', mouth: 'grin', lean: .35 }, x, sp.bob, -.15, Math.PI / 2); wg.position.set(wx, 0, -.15); wg.rotation.y = 0;
    let n = 3; ps.forEach(([p, hx]) => { const u = clamp((x - (hx - .9)) / 1.8); if (u <= 0) { p.visible = true; p.position.copy(porchP(hx)); p.rotation.set(0, 0, 0); } else if (u < 1) flyPaper(p, porchP(hx), V(wx, .55, -.15), u, 2.0); else { p.visible = false; n += 2; } });
    wg.userData.fill(n); look(cam, 7.4, 2.9, 1.7, -4, .5, -2.6); } }; }, { noCut: true });
// 4 "Every single one." - ground level: papers rain into the wagon on every word
shot(5.5, 6.8, () => { const S = lights(world('night')), cam = newCam(40), wg = wagon(); S.scene.add(wg); wg.position.set(-1, 0, -.15); const fl = [paper(), paper(), paper()]; fl.forEach(p => S.scene.add(p)); const T = [5.61, 6.04, 6.43].map(w => at(5.5, w));
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -1, 0); let n = 8, last = -9;
    fl.forEach((p, i) => { const u = clamp((f - T[i] + .22) / .22); if (u >= 1) { n += 2; last = T[i]; p.visible = false; return; } if (u <= 0) { p.visible = false; return; } flyPaper(p, V(-2.2, 1.6, .5), V(-1, .6, -.15), u, .5); });
    wg.userData.fill(Math.min(16, n)); const b = Math.exp(-(f - last) * 14); wg.scale.set(1 + .08 * b, 1 - .1 * b, 1 + .08 * b);
    look(cam, -.05, .42, 1.15, -1.05, .45, -.2); } }; }, { noCut: true });
// 5 "And nobody knows it's him." - morning: a neighbour stares at the empty sidewalk... Walt waves from his rocking chair
shot(6.8, 8.85, () => { const S = lights(world('morning')), cam = newCam(40), q = sprite('?', '#ffd23a', .55), rk = rocker(), mg = mug(); S.scene.add(q, rk, mg); rk.position.set(HS.walt + .2, 0, -4.2); rk.rotation.y = -.35;
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 6, -2); const g = place(S.scene, { ...nb(1), eyes: 'open', mouth: 'flat', nod: .35, arms: [[-.6, .1, .2], [.6, .1, .2]] }, 4.5, 0, -1.2, .5); g.updateMatrixWorld(true); q.position.copy(g.userData.head.localToWorld(V(0, .6, 0))); q.scale.setScalar(Math.max(.001, .6 * pop(f - .45)));
    const w = place(S.scene, { ...WALT, sit: true, eyes: 'happy', mouth: 'smile', hands: [V(-.32, 1.0 + Math.max(0, Math.sin(t * 7)) * .38, .3), V(.25, .95, .35)] }, HS.walt + .2, -.03, -4.15, -.35); w.updateMatrixWorld(true); mg.position.copy(w.localToWorld(V(.25, 1.0, .42)));
    look(cam, 3.7, 1.4, 2.2, 5.95, 1.0, -2.3); } }; });
// 6 "The neighbors buy cameras." - cameras pop onto the house front, one after another
shot(8.85, 10.6, () => { const S = lights(world('day')), cam = newCam(56); const hx = HS.parkers; const cams = [[-.55, 1.55, 0], [.85, 2.0, 0], [-.9, .95, 0], [.5, .9, 0], [0, 2.05, 0], [-.2, 1.3, 0]].map(([dx, y]) => { const c = secCam(); c.position.set(hx + dx, y, -4.86); S.scene.add(c); return c; }); const T0 = at(8.85, 9.45);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, hx, -3); cams.forEach((c, i) => { c.scale.setScalar(Math.max(.001, pop(f - T0 - i * .1))); c.rotation.set(.2, Math.sin(t * 2.4 + i * 1.3) * .5, 0); c.userData.led.visible = Math.sin(t * 9 + i) > 0; });
    look(cam, hx + .35, 1.45, -1.6, hx, 1.4, -4.9); } }; });
// 7 "Walt wears a raincoat and a Halloween mask." - on his porch at night: raincoat - POP - mask - POP
shot(10.6, 13.15, () => { const S = lights(world('night')), cam = newCam(40); const TR = at(10.6, 11.22), TM = at(10.6, 12.48);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -3); const rc = f >= TR, mk = f >= TM; const sq = mk ? .1 * Math.exp(-(f - TM) * 9) : rc ? .1 * Math.exp(-(f - TR) * 9) : 0;
    place(S.scene, { ...WALT, robe: rc ? null : WALT.robe, raincoat: rc, mask: mk, eyes: rc ? 'happy' : 'half', mouth: 'smirk', squash: -sq, arms: mk ? [[-.5, .25, .2], [.5, .25, .2]] : undefined }, HS.walt, 0, -4.35, 0);
    look(cam, HS.walt + .6, 1.4, -1.35, HS.walt, 1.1, -4.35); } }; }, { noCut: true });
// 8 "They call the police." - squad car slides in, lights going
shot(13.15, 14.45, () => { const S = lights(world('day')), cam = newCam(44), pc = car(0xf6f6f6, true); S.scene.add(pc); const pl = new THREE.PointLight(0xff2a2a, 14, 7); S.scene.add(pl);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 2, 0); const k = 1 - Math.pow(1 - clamp(f / (fd * .75)), 3); pc.position.set(lerp(10, 2.6, k), 0, 1.3); pc.rotation.y = Math.PI; const on = Math.sin(t * 14) > 0; pc.userData.red.visible = on; pc.userData.blue.visible = !on; pl.color.set(on ? 0xff2a2a : 0x2a5aff); pl.position.copy(pc.position).add(V(0, 1.8, -.6));
    look(cam, -.3, .75, 5.5, 3.0, .9, 1.0); } }; }, { noCut: true });
// 9 "The officer says," - low hero angle, a neighbour pointing at the porch
shot(14.45, 15.65, () => { const S = lights(world('day')), cam = newCam(46), pc = car(0xf6f6f6, true); S.scene.add(pc); pc.position.set(2.6, 0, 1.3); pc.rotation.y = Math.PI;
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 2, -1); const on = Math.sin(t * 14) > 0; pc.userData.red.visible = on; pc.userData.blue.visible = !on;
    place(S.scene, { ...COP }, 2.2, 0, -.6, .3); place(S.scene, { ...nb(3), eyes: 'wide', mouth: 'open', hands: [V(-.3, .9, .2), V(.45, 1.45, -.45)] }, 1.25, 0, -.8, .9);
    look(cam, 3.45, .4, .45, 2.0, 1.65, -.7); } }; }, { noCut: true });
// 10 "Sir... it's a newspaper. Just read it online." - deadpan (lip sync), holds up his phone on "online"
shot(15.65, 19.45, () => { const S = lights(world('day')), cam = newCam(38), ph = card(.16, .28, (g, w, h) => { g.fillStyle = '#16121a'; g.fillRect(0, 0, w, h); g.fillStyle = '#4ab8ff'; g.fillRect(w * .1, h * .07, w * .8, h * .86); g.fillStyle = '#fff'; g.font = `900 ${w * .22}px Nunito`; g.textAlign = 'center'; g.fillText('NEWS', w / 2, h * .28); for (let i = 0; i < 5; i++) g.fillRect(w * .2, h * (.4 + i * .1), w * .6, h * .035); }, 120); S.scene.add(ph); const TP = at(15.65, 18.4);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 2, -1); const m = talkIf(t, 15.7, 19.2), up = ss(TP, TP + .25, f);
    const hand = V(.3, lerp(.85, 1.42, up), lerp(.3, .5, up)); const g = place(S.scene, { ...COP, mouth: m || 'flat', eyes: 'half', hands: [V(-.3, .85, .28), hand] }, 2.2, 0, -.6, .3); g.updateMatrixWorld(true);
    ph.visible = up > .02; ph.position.copy(g.localToWorld(hand.clone().add(V(0, .14, .04)))); ph.rotation.set(0, .3, 0); faceCam(cam, g, 2.35, -.35, .05, -.18); } }; });
// 11 "For twenty years, nobody catches him." - time-lapse: day, night, day, night... and a blur with a wagon every night
shot(19.45, 22.25, () => { const S = lights(world('day')), cam = newCam(48), wg = wagon(); S.scene.add(wg); wg.userData.fill(12);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, -2); const ph = (f * 2.4) % 1, night = ph > .5; dayNight(S, night);
    if (night) { const x = lerp(-9, 9, (ph - .5) * 2), sp = stepPose(t * 30); place(S.scene, { ...WALT, ...sp, lean: .35, eyes: 'wide', mouth: 'grin' }, x, sp.bob, -.15, Math.PI / 2); wg.visible = true; wg.position.set(x - 1.15, 0, -.15); } else wg.visible = false;
    look(cam, 0, 7.5, 7.5, 0, 0, -2.3); } }; }, { noCut: true });
// 12 "Until a kid checks his doorbell camera," - a kid on his bed, face lit by the tablet
shot(22.25, 24.35, () => { const R = bedroom(), cam = newCam(40), tb = card(.42, .3, (g, w, h) => { g.fillStyle = '#24222c'; g.fillRect(0, 0, w, h); g.fillStyle = '#4ab8ff'; g.fillRect(w * .06, h * .08, w * .88, h * .84); }, 64), gl = new THREE.PointLight(0x6ab8ff, 1.0, 2.5); R.scene.add(tb, gl); const TC = at(22.25, 23.07);
  return { scene: R.scene, cam, update(f, fd, t) { const nar = f > TC; const g = place(R.scene, { ...KID, sit: true, eyes: nar ? 'half' : 'open', mouth: nar ? 'flat' : 'o', nod: .22, hands: [V(-.18, .95, .42), V(.18, .95, .42)] }, -1.2, .3, -.05, 0); g.scale.multiplyScalar(.82); g.updateMatrixWorld(true);
    tb.position.copy(g.localToWorld(V(0, 1.02, .52))); tb.rotation.set(-.55, 0, 0); gl.position.copy(g.localToWorld(V(0, 1.35, .45)));
    const hp = g.userData.head.localToWorld(V(0, -.2, 0)); look(cam, hp.x + .45, hp.y + .1, hp.z + 1.55, hp.x, hp.y - .2, hp.z); } }; });
// 13 "...and sees Walt lift the mask to sneeze." - doorbell-cam POV: mask up... ah... CHOO - freeze, zoom, red circle
shot(24.35, 26.95, () => { const S = lights(world('night')), cam = newCam(80), p = paper(); S.scene.add(p); const hx = HS.parkers, TL = at(24.35, 25.14), TS = at(24.35, 26.0), TF = TS + .25;
  return { scene: S.scene, cam, doorcam: '05:02 AM', update(f, fd, t) { setSun(S, hx, -3); const ff = Math.min(f, TF); NOW = tm(24.35) + ff;
    const pre = ff > TS - .32 && ff < TS ? (ff - TS + .32) / .32 : 0, hit = ff >= TS, z = ss(TF, TF + .25, f);
    const g = place(S.scene, { ...COSTUME, maskUp: ss(TL, TL + .3, ff), lean: .4 * (1 - ss(0, .35, ff)), eyes: hit || pre > 0 ? 'closed' : 'half', mouth: hit ? 'scream' : pre > 0 ? 'o' : 'flat', nod: hit ? .38 : -pre * .5, hands: [V(-.3, .85, .25), V(.28, .95, .3)] }, hx + .15, 0, -3.05, Math.PI);
    g.updateMatrixWorld(true); p.position.copy(g.localToWorld(V(-.33, .86, .3))); p.rotation.set(0, Math.PI / 2, 0);
    const hp = g.userData.head.localToWorld(V(0, 0, 0)); cam.fov = lerp(80, 42, z); look(cam, hx, 1.3, -4.75, hp.x, hp.y - .25 * (1 - z), hp.z);
    this.circle = f > TF + .1 ? [W / 2, H / 2, 290, clamp((f - TF - .1) / .3)] : null; } }; }, { noCut: true });
// 14 "The whole street storms Walt's porch," - from Walt's door: the mob marches up the path
shot(26.95, 28.65, () => { const S = lights(world('day')), cam = newCam(48);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2); const k = clamp(f / fd);
    for (let i = 0; i < 7; i++) { const row = Math.floor(i / 3), col = i % 3 - 1 + (row % 2) * .5, x = HS.walt + col * .75, z0 = .9 + row * .85 + (i % 2) * .15;
      walkTo(S.scene, { ...nb(i), eyes: 'open', mouth: i % 2 ? 'scream' : 'frown', brow: .35, arms: [[-.5, .55, .1], [.55, .75, .15]] }, x, z0, x, z0 - 3.1, k, t, Math.PI); }
    look(cam, HS.walt + .2, .55, -4.45, HS.walt, 1.25, -1.0); } }; }, { noCut: true });
// 15 "...screaming." - right in his face, fists shaking, camera shaking
shot(28.65, 30.3, () => { const S = lights(world('day')), cam = newCam(46);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2);
    [[-.6, -3.0, 0], [.08, -2.8, 1], [.65, -3.05, 2], [-.3, -2.15, 3], [.4, -2.05, 4]].forEach(([dx, z, i]) => place(S.scene, { ...nb(i), eyes: 'wide', mouth: 'scream', brow: .35, arms: [[-.5, .6 + Math.sin(t * 16 + i) * .25, .2], [.5, .6 + Math.cos(t * 15 + i) * .25, .2]] }, HS.walt + dx, Math.abs(Math.sin(t * 9 + i)) * .08, z, Math.PI + dx * .3));
    look(cam, HS.walt + .1, 1.55, -4.55, HS.walt, 1.35, -2.6); shake(cam, t, .025); } }; }, { noCut: true });
// 16 "Walt doesn't argue." - calm as anything, coffee in hand
shot(30.3, 31.35, () => { const S = lights(world('day')), cam = newCam(42), mg = mug(); S.scene.add(mg);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2); const w = place(S.scene, { ...WALT, eyes: 'half', mouth: 'flat', hands: [V(-.25, .85, .2), V(.2, 1.05, .38)] }, HS.walt, 0, -4.4, 0); w.updateMatrixWorld(true); mg.position.copy(w.localToWorld(V(.2, 1.1, .42)));
    [[-.95, -2.5, 0], [.9, -2.6, 2]].forEach(([dx, z, i]) => place(S.scene, { ...nb(i), mouth: 'scream', arms: [[-.5, .6 + Math.sin(t * 16 + i) * .2, .2], [.5, .6, .2]] }, HS.walt + dx, 0, z, Math.PI));
    look(cam, HS.walt - .2, 1.55, -1.3, HS.walt, 1.25, -4.4); } }; });
// 17 "He just says, Okay. I'll stop." - (lip sync) a little shrug
shot(31.35, 34.15, () => { const S = lights(world('day')), cam = newCam(38), mg = mug(); S.scene.add(mg); const TO = at(31.35, 32.41);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2); const m = talkIf(t, 32.35, 33.65), sh = ss(TO - .1, TO + .15, f) * (1 - ss(TO + 1.0, TO + 1.3, f));
    const w = place(S.scene, { ...WALT, eyes: 'half', mouth: m || 'flat', tilt: sh * .15, hands: [V(-.42 - sh * .15, .9 + sh * .32, .25), V(.2, 1.05, .38)] }, HS.walt, 0, -4.4, 0); w.updateMatrixWorld(true); mg.position.copy(w.localToWorld(V(.2, 1.1, .42)));
    faceCam(cam, w, 1.9, .3, .05, -.15); } }; });
// 18 "And he does." - next dawn: the paper just... lies there
shot(34.15, 35.4, () => { const S = lights(world('morning')), cam = newCam(40); S.scene.add(at3(paper(), HS.parkers + .3, .06, -4.3));
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.parkers, -3); look(cam, HS.parkers + .65, .24, -3.45, HS.parkers + .2, .32, -4.8); } }; }, { xf: true, noCut: true });
// 19 "The next week, the Millers go on vacation." - convertible, suitcases, waving... gone
shot(35.4, 37.9, () => { const S = lights(world('day')), cam = newCam(44), c = car(0x38b8e8, false); S.scene.add(c); const TG = at(35.4, 36.85);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.millers, 0); const k = Math.pow(clamp((f - TG) / 1.3), 2); c.position.set(HS.millers - k * 10, 0, 1.3); c.rotation.y = Math.PI; c.updateMatrixWorld(true);
    MILLER.forEach((o, i) => { const lp = [V(.25, .08, .28), V(.25, .08, -.28), V(-.45, .08, 0)][i], wp = c.localToWorld(lp.clone()); place(S.scene, { ...o, sit: true, eyes: 'happy', mouth: 'grin', turn: -.9, arms: [[-.5, .3, .1], [.5, .75 + Math.sin(t * 12 + i) * .25, .1]] }, wp.x, wp.y, wp.z, -Math.PI / 2); });
    look(cam, HS.millers - 2.6, 1.9, -2.7, HS.millers + .1, 1.0, 1.3); } }; }, { noCut: true });
// 20 "Their newspapers pile up on the porch." - day, night, day... thump, thump, thump
shot(37.9, 40.35, () => { const S = lights(world('day')), cam = newCam(42), pile = paperPile(9, 2); pile.position.set(HS.millers + .3, 0, -4.3); S.scene.add(pile); darkWindows(S.daveHouse); const T0 = at(37.9, 38.15);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.millers, -3); const n = 1 + clamp(Math.floor((f - T0) / .22) + 1, 0, 6) + (f > T0 + 1.6 ? 2 : 0); pile.userData.setN(n); dayNight(S, (f * 3.2) % 1 > .5);
    look(cam, HS.millers + 1.05, .38, -2.9, HS.millers + .25, .3, -4.5); } }; }, { noCut: true });
// 21 "And their house gets robbed." - CRASH, and out walks a burglar with their TV
shot(40.35, 42.1, () => { const S = lights(world('night')), cam = newCam(44), pile = paperPile(9, 2), tvp = tv(); pile.position.set(HS.millers + .3, 0, -4.3); pile.userData.setN(9); S.scene.add(pile, tvp); darkWindows(S.daveHouse); const sh = shards(S.scene), TB = at(40.35, 41.3);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.millers, -3); const k = clamp(f / fd), hd = V(0, 1.0, .38);
    const g = walkTo(S.scene, { ...BURG, eyes: 'half', mouth: 'grin', lean: .12, hands: [V(-.28, 1.0, .33), V(.28, 1.0, .33)] }, HS.millers - .35, -4.5, HS.millers - .15, -2.7, k, t, .1); g.updateMatrixWorld(true); tvp.position.copy(g.localToWorld(hd.clone().add(V(0, .05, .1)))); tvp.rotation.y = .1;
    sh.update(f - TB, V(HS.millers - 1, 1.35, -4.86)); look(cam, HS.millers + .95, 1.25, -1.2, HS.millers - .25, 1.0, -3.9); } }; }, { noCut: true });
// 22 "Then the Parkers." - CRASH - burglar with a lamp
shot(42.1, 43.15, () => { const S = lights(world('night')), cam = newCam(42), pile = paperPile(8, 3), lp = lamp(); pile.position.set(HS.parkers + .3, 0, -4.3); pile.userData.setN(8); S.scene.add(pile, lp); darkWindows(S.garyHouse); const sh = shards(S.scene), TB = at(42.1, 42.5);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.parkers, -3); const k = clamp(f / fd);
    const g = walkTo(S.scene, { ...BURG, eyes: 'half', mouth: 'smirk', hands: [V(-.2, 1.1, .3), V(.2, .85, .3)] }, HS.parkers + .1, -4.5, HS.parkers + 1.1, -3.3, k, t, .75); g.updateMatrixWorld(true); lp.position.copy(g.localToWorld(V(0, .5, .38)));
    sh.update(f - TB, V(HS.parkers + 1, 1.35, -4.86)); look(cam, HS.parkers + 2.7, .5, -2.3, HS.parkers + .6, 1.1, -4.3); } }; }, { noCut: true });
// 23 "Then the Lees." - CRASH - burglar tiptoeing off with the goldfish
shot(43.15, 44.4, () => { const S = lights(world('night')), cam = newCam(44), pile = paperPile(10, 4), fb = fishbowl(); pile.position.set(HS.lees + .3, 0, -4.3); pile.userData.setN(10); S.scene.add(pile, fb); darkWindows(S.patelHouse); const sh = shards(S.scene), TB = at(43.15, 43.55);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.lees, -3); const k = clamp(f / fd);
    const g = walkTo(S.scene, { ...BURG, eyes: 'wide', mouth: 'grin', hands: [V(-.18, 1.05, .36), V(.18, 1.05, .36)] }, HS.lees - .2, -4.4, HS.lees - .65, -2.75, k, t, -.25); g.updateMatrixWorld(true); fb.position.copy(g.localToWorld(V(0, 1.15, .45))); fb.userData.fish.position.x = Math.sin(t * 5) * .06;
    sh.update(f - TB, V(HS.lees - 1, 1.35, -4.86)); look(cam, HS.lees + .7, 3.3, -1.1, HS.lees - .35, .65, -3.9); } }; }, { noCut: true });
// 24 "Turns out, burglars look for one thing." - a burglar behind a hedge raises his binoculars
shot(44.4, 45.7, () => { const S = lights(world('night')), cam = newCam(40), bn = binos(), bush = hedge(1.5); bush.position.set(5, .35, .5); S.scene.add(bn, bush); const TU = at(44.4, 45.17);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 5, 0); const u = ss(TU - .3, TU, f);
    const g = place(S.scene, { ...BURG, eyes: 'half', mouth: 'smirk', hands: [V(-.13, lerp(.85, 1.58, u), lerp(.3, .44, u)), V(.13, lerp(.85, 1.58, u), lerp(.3, .44, u))] }, 5, 0, 1.0, Math.PI); g.updateMatrixWorld(true); bn.position.copy(g.localToWorld(V(0, lerp(.9, 1.6, u), lerp(.36, .52, u)))); bn.rotation.y = Math.PI;
    look(cam, 5.45, 1.15, -1.9, 5, 1.25, 1.0); } }; });
// 25 "A pile of newspapers." - binocular POV: clean porch, clean porch... PILE - zoom
shot(45.7, 48.8, () => { const S = lights(world('night')), cam = newCam(30), pile = paperPile(9, 2); pile.position.set(HS.millers + .3, 0, -4.3); pile.userData.setN(9); S.scene.add(pile); darkWindows(S.daveHouse); const TP = at(45.7, 47.21);
  return { scene: S.scene, cam, binoc: true, update(f, fd, t) { setSun(S, 2, -3); const k = ss(0, TP, f), x = lerp(HS.walt + .3, HS.millers + .3, k) + Math.sin(f * 6) * .2 * (1 - k);
    cam.fov = lerp(30, 12, ss(TP, TP + .35, f)); look(cam, 5, 1.45, 1.0, x, lerp(1.0, .3, k), -4.3); } }; }, { noCut: true });
// 26 "It means nobody's home." - dark windows, a pile on the porch, slow push in
shot(48.8, 50.4, () => { const S = lights(world('night')), cam = newCam(42), pile = paperPile(9, 2); pile.position.set(HS.millers + .3, 0, -4.3); pile.userData.setN(9); S.scene.add(pile); darkWindows(S.daveHouse);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.millers, -3); const k = ss(0, fd, f); look(cam, HS.millers + .4, lerp(1.7, .8, k), lerp(.8, -2.5, k), HS.millers + .2, lerp(1.4, .55, k), -4.6); } }; }, { noCut: true });
// 27 "For twenty years, Walt took every paper on the street," - flashback (warm, sepia): Walt and his wagon at dawn
shot(50.4, 53.65, () => { const S = lights(world('morning')), cam = newCam(42), wg = wagon(); S.scene.add(wg); const ps = [HS.millers, HS.parkers].map(hx => { const p = paper(); S.scene.add(p); return [p, hx]; });
  return { scene: S.scene, cam, sepia: true, update(f, fd, t) { setSun(S, 0, -2); const k = clamp(f / fd), x = lerp(-6, 1.8, k), wx = x - 1.15;
    walkTo(S.scene, { ...WALT, eyes: 'half', mouth: 'smile' }, -6, -.15, 1.8, -.15, k, t, Math.PI / 2); wg.position.set(wx, 0, -.15); wg.rotation.y = 0;
    let n = 4; ps.forEach(([p, hx]) => { const u = clamp((x - (hx - .6)) / 1.2); if (u <= 0) { p.visible = true; p.position.copy(porchP(hx)); p.rotation.set(0, 0, 0); } else if (u < 1) flyPaper(p, porchP(hx), V(wx, .55, -.15), u, 1.8); else { p.visible = false; n += 1; } }); wg.userData.fill(n);
    look(cam, x + 1.6, 1.3, 2.6, x - .2, .8, -1.2); } }; }, { xf: true, noCut: true });
// 28 "...so no house ever looked empty." - (flashback) the burglar checks: clean porch, clean porch... shrug
shot(53.65, 55.85, () => { const S = lights(world('morning')), cam = newCam(40), bn = binos(), bush = hedge(1.5), q = sprite('?', '#ffd23a', .5); bush.position.set(5, .35, .5); S.scene.add(bn, bush, q); const TS = at(53.65, 54.6);
  return { scene: S.scene, cam, sepia: true, update(f, fd, t) { setSun(S, 5, 0); const s = ss(TS, TS + .25, f);
    const g = place(S.scene, { ...BURG, eyes: s > .5 ? 'open' : 'half', mouth: s > .5 ? 'frown' : 'flat', tilt: s * .2, hands: [V(-.45 - s * .12, lerp(1.0, 1.3, s), .3), V(.45 + s * .12, lerp(1.0, 1.3, s), .3)] }, 5, 0, 1.0, Math.PI); g.updateMatrixWorld(true);
    bn.position.copy(g.localToWorld(V(-.5 - s * .12, lerp(1.03, 1.33, s), .32))); q.position.copy(g.userData.head.localToWorld(V(0, .62, 0))); q.scale.setScalar(Math.max(.001, .5 * pop(f - TS)));
    look(cam, 5.35, 1.35, -1.1, 5, 1.25, 1.0); } }; });
// 29 "Not one break-in. Ever." - Walt's living room: towers of 20 years of newspapers, Walt sipping his tea
shot(55.85, 58.1, () => { const R = room(0xffe8c8), cam = newCam(46), mg = mug(), ch = armchair(); R.scene.add(mg, ch); ch.position.set(0, 0, -.6); const r = rng(9);
  for (let i = 0; i < 30; i++) { const side = i % 3, h = 1.2 + r() * 2.0, s = stack(h); if (side === 2) s.position.set(-2.4 + (i / 30) * 4.8 + r() * .2, h / 2, -2.6); else s.position.set((side ? 1 : -1) * (1.25 + r() * .9), h / 2, -2.2 + r() * 2.6); s.rotation.y = (r() - .5) * .25; R.scene.add(s); }
  return { scene: R.scene, cam, update(f, fd, t) { const sp = Math.sin(t * 2.5) > .6; const w = place(R.scene, { ...WALT, sit: true, eyes: sp ? 'closed' : 'happy', mouth: 'smile', hands: [V(-.3, .9, .25), V(.2, sp ? 1.28 : 1.0, .38)] }, 0, -.05, -.6, 0); w.updateMatrixWorld(true); mg.position.copy(w.localToWorld(V(.2, sp ? 1.3 : 1.03, .44)));
    look(cam, .3, 1.55, 2.7 - f * .3, 0, 1.25, -1.0); } }; });
// 30 "Now every morning, the whole street walks their newspaper over to Walt's porch." - a happy line, the pile grows
shot(58.1, 62.3, () => { const S = lights(world('day')), cam = newCam(44), pile = paperPile(30, 5), rk = rocker(), fly = paper(); pile.position.set(HS.walt + .6, 0, -4.15); S.scene.add(pile, rk, fly); rk.position.set(HS.walt - .55, 0, -4.35); const held = [...Array(5)].map(() => { const p = paper(); S.scene.add(p); return p; });
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2); const per = .6, ph = (f % per) / per, cnt = Math.floor(f / per); pile.userData.setN(Math.min(30, 8 + cnt));
    for (let i = 0; i < 6; i++) { const z = -3.35 + i * .62, front = i === 0, ar = front ? Math.sin(ph * Math.PI) : 0;
      const g = place(S.scene, { ...nb(i + 2), eyes: 'happy', mouth: 'smile', hands: [V(-.3, .85, .2), V(.3, lerp(.95, 1.5, ar), lerp(.35, .5, ar))] }, HS.walt + .6 + (i % 2) * .08, 0, z, Math.PI); if (!front) { g.updateMatrixWorld(true); held[i - 1].position.copy(g.localToWorld(V(.3, .97, .42))); } }
    flyPaper(fly, V(HS.walt + .6, 1.45, -3.0), V(HS.walt + .6, pile.userData.top(8 + cnt) + .1, -4.15), ph, .5);
    place(S.scene, { ...WALT, sit: true, eyes: 'happy', mouth: 'smile', hands: [V(-.32, 1.0 + Math.max(0, Math.sin(t * 6)) * .32, .3), V(.25, .95, .35)] }, HS.walt - .55, -.03, -4.3, .3);
    look(cam, HS.walt - 2.9, 2.4, .3, HS.walt + .2, .95, -3.6); } }; }, { noCut: true });
// 31 "He still doesn't read them." - rocking chair, a mountain of papers, he glances at today's... tosses it on the pile. sip.
shot(62.3, 99, () => { const S = lights(world('day')), cam = newCam(38), pile = paperPile(42, 6), rk = rocker(), np = paper(), mg = mug(); pile.position.set(HS.walt + .75, 0, -4.25); S.scene.add(pile, rk, np, mg); rk.position.set(HS.walt - .2, 0, -4.35); const TA = at(62.3, 62.5), TT = at(62.3, 63.45);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, HS.walt, -2); const rock = Math.sin(t * 2.2) * .05; rk.rotation.x = rock; const a = ss(TA, TA + .3, f), k = ss(TT, TT + .4, f);
    const hand = V(lerp(.22, .5, k), lerp(.95, 1.25, a) + Math.sin(k * Math.PI) * .2, .38); const w = place(S.scene, { ...WALT, sit: true, eyes: 'half', mouth: 'flat', turn: k > .05 && k < .95 ? .45 : 0, nod: a * (1 - k) * .2, hands: [V(-.3, .95, .3), hand] }, HS.walt - .2, -.03, -4.3, 0); w.rotation.x = rock; w.updateMatrixWorld(true);
    const hw = w.localToWorld(hand.clone().add(V(0, .03, .04))); if (k <= 0) { np.visible = true; np.position.copy(hw); np.rotation.set(0, .3, 0); } else if (k < 1) flyPaper(np, hw, V(HS.walt + .75, 1.25, -4.25), k, .4); else { np.position.set(HS.walt + .75, 1.2, -4.2); np.rotation.set(0, .5, 0); }
    mg.position.copy(w.localToWorld(V(-.3, .98, .4)));
    const hp = w.userData.head.localToWorld(V(0, -.2, 0)); look(cam, hp.x - .45, hp.y + .1, hp.z + 2.4 - f * .12, hp.x + .25, hp.y - .25, hp.z); this.fade = ss(fd - .5, fd - .05, f); } }; }, { noCut: true });
