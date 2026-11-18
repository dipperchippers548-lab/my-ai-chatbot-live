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


// ===================== BOXING: cast, sets, fast-changing faces =====================
const BEN = { color: 0x5aa8ff, tuft: true, shoe: 0x3a3a48 };
const BENNY = { ...BEN, robe: 0xe8323a, gloves: 0xe8323a, shoe: 0xf2f2f2 };
const CHAMP = { color: 0x8a5ad8, mustache: true, robe: 0x24222c, beltColor: 0xffd23a, beltW: .06, gloves: 0xffd23a, shoe: 0x16121a };
const WIFE = { color: 0xff6aa8, blush: true, shoe: 0xffffff };
const REF = { color: 0xffd0a8, pj: true, pjMap: 'burglar', limb: 0x24222c, hat: 'cap', hatColor: 0x24222c, shoe: 0x16121a };
const EX = { happy: { eyes: 'happy', mouth: 'grin' }, smile: { eyes: 'open', mouth: 'smile' }, sad: { eyes: 'half', mouth: 'frown', brow: -.4 }, shock: { eyes: 'wide', mouth: 'o', brow: -.25 },
  angry: { eyes: 'open', mouth: 'flat', brow: .45 }, smug: { eyes: 'half', mouth: 'smirk', brow: .2 }, dazed: { eyes: 'closed', mouth: 'wavy' }, scream: { eyes: 'wide', mouth: 'scream', brow: .35 },
  cry: { eyes: 'closed', mouth: 'wavy', brow: -.45, tears: true }, laugh: { eyes: 'happy', mouth: 'open' }, determined: { eyes: 'half', mouth: 'flat', brow: .5 }, deadpan: { eyes: 'half', mouth: 'flat' }, gross: { eyes: 'closed', mouth: 'wavy', brow: .3 } };
// expression timeline: [[localSeconds, 'name'], ...] - snaps to the new face with a quick squash-and-stretch pop
function fx(f, seq) { let cur = seq[0][1], tc = -9; for (const [a, n] of seq) if (f >= a) { cur = n; tc = a; } const p = f - tc; return { ...EX[cur], squash: p >= 0 && p < .3 ? -.12 * Math.exp(-p * 12) * Math.cos(p * 28) : 0 }; }
const sweepCam = (cam, f, fd, a, b) => { const k = ss(0, fd, f); look(cam, lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k), lerp(a[4], b[4], k), lerp(a[5], b[5], k)); };
const big = (g, s = 1.35) => { g.scale.multiplyScalar(s); return g; };
const lieDown = (g, y) => { g.rotation.x = -Math.PI / 2; g.position.y = y; return g; };
const GUARD = [[-.22, .75, .5], [.22, .8, .55]];
const RT = .64;   // top of the ring canvas
function textCard(w, h, draw, pw = 512) { return card(w, h, draw, pw); }
function ring(o = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0a16); scene.fog = new THREE.Fog(0x0c0a16, 12, 30);
  const hemi = new THREE.HemisphereLight(0x8a7ad8, 0x1a1626, .6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, .4); sun.position.set(3, 10, 6); scene.add(sun, sun.target);
  const spot = new THREE.SpotLight(0xfff2d8, 420, 30, .5, .55, 1.3); spot.position.set(0, 9, 0); spot.target.position.set(0, RT, 0); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); scene.add(spot, spot.target);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), toon(0x1a1626)); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  scene.add(at3(box(5.6, .6, 5.6, 0x24222c, .02), 0, .3, 0)); const mat_ = at3(box(5.3, .04, 5.3, o.canvas || 0x3a7ae8, .012), 0, .62, 0); scene.add(mat_);
  for (const [x, z, c] of [[-2.6, -2.6, 0xe8323a], [2.6, -2.6, 0x3a6ad8], [-2.6, 2.6, 0xf2f2f2], [2.6, 2.6, 0xf2f2f2]]) scene.add(at3(box(.18, 1.7, .18, c, .012), x, RT + .8, z));
  for (const h of [.42, .78, 1.14]) { for (const s of [-1, 1]) { scene.add(at3(box(5.2, .045, .045, 0xe8323a, .006), 0, RT + h, s * 2.6)); scene.add(at3(box(.045, .045, 5.2, 0xe8323a, .006), s * 2.6, RT + h, 0)); } }
  // the crowd: dark rows of noodle silhouettes all around, a few phone flashes
  const r = rng(o.seed || 3), N = 170, bodyG = new THREE.CapsuleGeometry(.24, .5, 4, 8), headG = new THREE.SphereGeometry(.3, 10, 8), m4 = new THREE.Matrix4();
  const bodies = new THREE.InstancedMesh(bodyG, toon(0xffffff), N), heads = new THREE.InstancedMesh(headG, toon(0xffffff), N); const seats = [];
  for (let i = 0; i < N; i++) { const row = i % 5, a = (i / N) * Math.PI * 2 + r() * .05, rad = 4.6 + row * .9, x = Math.cos(a) * rad, z = Math.sin(a) * rad, y = row * .35; seats.push([x, y, z]);
    const c = new THREE.Color(PAL[(r() * 10) | 0]).multiplyScalar(.35 + r() * .2); m4.makeTranslation(x, y + .55, z); bodies.setMatrixAt(i, m4); bodies.setColorAt(i, c); m4.makeTranslation(x, y + 1.25, z); heads.setMatrixAt(i, m4); heads.setColorAt(i, c); }
  scene.add(bodies, heads); for (let row = 0; row < 5; row++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(4.6 + row * .9 + .45, 4.6 + row * .9 + .45, row * .35 + .05, 48, 1, true), toon(0x15121e)); st.position.y = (row * .35) / 2; scene.add(st); }
  const flashes = [...Array(14)].map((_, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(.09, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); const s = seats[(i * 37) % N]; m.position.set(s[0] * .97, s[1] + 1.4, s[2] * .97); m.lookAt(0, 1.5, 0); scene.add(m); return m; });
  const rig = new THREE.Group(); rig.position.y = 6.5; scene.add(rig); rig.add(box(4, .15, 4, 0x24222c, .01)); for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) rig.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .5), flat(0xfff2c8)), x, -.1, z));
  const banner = textCard(7, 1.6, (g, w, h, yr = 2019) => { g.fillStyle = '#e8323a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23a'; g.fillRect(0, h * .82, w, h * .18); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `900 ${h * .42}px Nunito`; g.fillText('BENNY vs THE CHAMP', w / 2, h * .5); g.font = `900 ${h * .22}px Nunito`; g.fillStyle = '#16121a'; g.fillText('FIGHT NIGHT ' + yr, w / 2, h * .97); });
  banner.position.set(0, 5.2, -9.5); scene.add(banner);
  return { scene, spot, hemi, banner, mat: mat_, tick(t) { flashes.forEach((m, i) => m.visible = Math.sin(t * 7.3 + i * 4.1) > .93); } };
}
function room2(col, floorCol = 0xc8a07a) { const R = room(col); return R; }
function couch(col) { const g = new THREE.Group(); g.add(at3(box(1.7, .42, .8, col), 0, .21, 0)); g.add(at3(box(1.7, .6, .2, col), 0, .6, -.32)); for (const s of [-1, 1]) g.add(at3(box(.2, .55, .8, col), s * .8, .35, 0)); return g; }
function shoebox() { const g = new THREE.Group(); g.add(at3(box(.56, .24, .34, 0xc8955a, .012), 0, .12, 0)); const lid = new THREE.Group(); lid.position.set(0, .25, -.17); g.add(lid); lid.add(at3(box(.6, .06, .37, 0xb0804a, .012), 0, 0, .17));
  const cash = new THREE.Group(); g.add(cash); for (let i = 0; i < 6; i++) cash.add(at3(box(.15, .07, .08, 0x3a9a4a, .006), -.18 + (i % 3) * .18, .2 + Math.floor(i / 3) * .04, -.06 + Math.floor(i / 3) * .1));
  g.userData = { lid, cash }; return g; }
function bellProp() { const g = new THREE.Group(); g.add(at3(box(.7, .5, .5, 0x3a2a22), 0, .25, 0)); const b = inked(new THREE.SphereGeometry(.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xffc83a, .01); b.position.y = .5; g.add(b); const ham = new THREE.Group(); ham.position.set(.35, .6, 0); g.add(ham); ham.add(at3(box(.04, .4, .04, 0x5a3a22, .006), 0, .2, 0)); ham.add(at3(box(.12, .08, .08, 0x9a9aa8, .006), 0, .42, 0)); g.userData.ham = ham; return g; }
function meatSlab() { const g = new THREE.Group(); g.add(at3(box(.04, .8, .04, 0x9a9aa8, .004), 0, 2.6, 0)); g.add(at3(box(.45, .8, .25, 0xd84a5a, .012), 0, 1.85, 0)); g.add(at3(box(.3, .1, .26, 0xf2e0d8, .008), 0, 1.7, 0)); return g; }
const flipYear = (b, yr) => { if (b.userData.yr !== yr) { b.userData.draw(yr); b.userData.yr = yr; } };

// ===================== SHOTS (voiceover clock) =====================
// 1 "Seven years ago, Benny bet his entire life savings" - slow drift down onto the ring: Benny slaps a fat money bag on the apron, grinning

shot(0, 3.8, () => { const R = ring(), cam = newCam(44), bag = new THREE.Group(); bag.add(inked(new THREE.SphereGeometry(.38, 14, 12), 0xe8d8a0, .015)); const sg = sprite('$', '#2a8a3a', .55, 150); sg.position.set(0, .05, .38); bag.add(sg); R.scene.add(bag); bag.position.set(.9, RT + .36, 1.4); flipYear(R.banner, 2019);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const e = fx(f, [[0, 'happy'], [at(0, 2.32), 'determined'], [at(0, 3.25), 'happy']]); const g = place(R.scene, { ...BENNY, ...e, arms: [[-.4, .1, .2], [.5, .5 + Math.max(0, Math.sin(f * 7)) * .15, .4]] }, .3, RT, 1.2, .5);
    bag.scale.setScalar(1 + .08 * Math.exp(-Math.max(0, f - at(0, 1.87)) * 9) * (f > at(0, 1.87)));
    sweepCam(cam, f, fd, [3.2, 4.2, 7.2, 0, 1.2, 0], [2.0, 2.2, 4.2, .4, 1.4, 1.0]); } }; }, { xf: false });
// 2 "...that he could beat one guy in a boxing match." - THE CHAMP: low angle, cracking his neck, smug
shot(3.8, 6.85, () => { const R = ring(), cam = newCam(42);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const e = fx(f, [[0, 'smug'], [at(3.8, 5.1), 'angry'], [at(3.8, 5.61), 'smug']]); const crack = Math.sin(f * 5) > .6 ? .25 : -.1;
    const g = big(place(R.scene, { ...CHAMP, ...e, tilt: crack, arms: GUARD }, -.4, RT, -1.0, .3)); sweepCam(cam, f, fd, [.4, .9, 2.4, -.4, 2.0, -1.0], [.2, .75, 1.8, -.4, 2.3, -1.0]); } }; });
// 3 "He lost." - floor level: Benny face-down on the canvas, the champ's shoes in frame
shot(6.85, 7.85, () => { const R = ring(), cam = newCam(46);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const e = fx(f, [[0, 'shock'], [.25, 'dazed']]); const b = place(R.scene, { ...BENNY, ...e, arms: [[-.6, .4, .1], [.6, .4, .1]] }, 0, RT, 0, 0); b.rotation.x = Math.PI / 2; b.position.set(0, RT + .26, -.1);
    big(place(R.scene, { ...CHAMP, ...EX.smug, arms: GUARD }, 1.2, RT, -.9, -.6)); sweepCam(cam, f, fd, [-2.3, RT + .15, .9, 0, RT + .3, .6], [-2.1, RT + .15, .8, 0, RT + .3, .5]); } }; });
// 4 "In nine seconds." - straight down from the lights: Benny starfished, the ref counting
shot(7.85, 9.7, () => { const R = ring(), cam = newCam(40);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); lieDown(place(R.scene, { ...BENNY, ...EX.dazed, arms: [[-.8, .2, 0], [.8, .2, 0]], feet: [[0, .1], [0, .1]] }, 0, RT, 0, 0), RT + .26);
    place(R.scene, { ...REF, ...fx(f, [[0, 'shock'], [.6, 'deadpan']]), arms: [[-.4, -.1, .2], [.45, .5 + Math.sin(f * 12) * .2, .45]] }, 1.0, RT, -.5, -1.2);
    sweepCam(cam, f, fd, [.01, 5.0, -.6, 0, RT, -.9], [.01, 4.3, -.65, 0, RT, -.9]); cam.rotation.z += f * .08; } }; });
// 5 "So he bet again. And lost." - (dissolve) a year later, same ring: grin... BAM... dazed
shot(9.7, 12.5, () => { const R = ring({ seed: 4 }), cam = newCam(42), T = at(9.7, 11.3); flipYear(R.banner, 2020);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const down = ss(T, T + .25, f), e = fx(f, [[0, 'happy'], [at(9.7, 10.4), 'determined'], [T, 'shock'], [T + .2, 'dazed']]);
    const b = place(R.scene, { ...BENNY, ...e, arms: down > .5 ? [[-.6, .5, .1], [.6, .5, .1]] : GUARD }, 0, RT, .3, -.8); b.rotation.z = down * 1.45; b.position.x = down * .5; b.position.y = RT + down * .2;
    big(place(R.scene, { ...CHAMP, ...fx(f, [[0, 'smug'], [T - .1, 'angry'], [T + .3, 'smug']]), arms: f > T - .15 && f < T + .15 ? [[-.2, .7, .5], [-.1, .3, 1.1]] : GUARD }, -1.3, RT, .1, 1.2)); sweepCam(cam, f, fd, [-.3, 1.7, 5.0, -.5, 1.4, .2], [.2, 1.6, 4.4, -.5, 1.4, .2]); } }; }, { xf: true });
// 6 "And again." - (dissolve) straight down again, another year
shot(12.5, 13.85, () => { const R = ring({ seed: 5, canvas: 0x3ac8a8 }), cam = newCam(40);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); lieDown(place(R.scene, { ...BENNY, ...EX.dazed, arms: [[-.8, .3, 0], [.6, -.2, 0]], feet: [[0, .1], [.1, .2]] }, .3, RT, .2, .4), RT + .26); sweepCam(cam, f, fd, [.31, 4.8, -.4, .3, RT, -.7], [.31, 4.1, -.45, .3, RT, -.7]); cam.rotation.z -= f * .1; } }; }, { xf: true });
// 7 "Every year, same ring, same guy, same result." - the banner year flips 2021, 22, 23... Benny drops again and again below it
shot(13.85, 18.5, () => { const R = ring({ seed: 6 }), cam = newCam(46);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const yr = 2021 + Math.min(4, Math.floor(f / (fd / 5))); flipYear(R.banner, yr); const ph = (f % (fd / 5)) / (fd / 5), down = ss(.45, .6, ph);
    const b = place(R.scene, { ...BENNY, ...(down > .5 ? EX.dazed : fx(ph, [[0, 'happy'], [.25, 'determined']])), arms: GUARD }, .4, RT, .6, -.5); b.rotation.z = down * 1.45; b.position.y = RT + down * .22;
    big(place(R.scene, { ...CHAMP, ...EX.smug, arms: GUARD }, -1.0, RT, .2, 1.1)); sweepCam(cam, f, fd, [0, 1.6, 7.0, 0, 3.0, -4], [0, 2.4, 6.0, 0, 3.4, -4]); } }; }, { xf: true });
// 8 "Benny sold his car." - the street: he hands over the keys... it drives off
shot(18.5, 20.3, () => { const S = lights(world('day')), cam = newCam(44), c = car(0xe8323a, false); S.scene.add(c); const T = at(18.5, 19.5);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, 0); const k = Math.pow(clamp((f - T - .2) / 1.2), 2); c.position.set(-1 - k * 9, 0, 1.3); c.rotation.y = Math.PI; c.updateMatrixWorld(true); const dp = c.localToWorld(V(.25, .08, .28)); place(S.scene, { ...nb(5), sit: true, ...EX.happy, turn: -.8 }, dp.x, dp.y, dp.z, -Math.PI / 2);
    place(S.scene, { ...BEN, ...fx(f, [[0, 'smile'], [T, 'sad']]), arms: f < T ? [[-.4, -.1, .2], [.3, .35, .7]] : [[-.4, -.2, .1], [.4, -.2, .1]], nod: f > T ? .12 : 0 }, -.2, 0, -.2, .5); sweepCam(cam, f, fd, [1.6, 1.25, 3.4, -.5, 1.1, .1], [1.3, 1.2, 3.1, -.7, 1.1, .1]); } }; });
// 9 "Then his couch." - top-down on the apartment: POP, the couch is gone
shot(20.3, 21.6, () => { const R = room(0xffe8c8), cam = newCam(44), c1 = couch(0x3a8ad8), c2 = couch(0xe8742a); R.scene.add(c1, c2); c1.position.set(-1.1, 0, -1.2); c2.position.set(1.3, 0, -1.2); const T = at(20.3, 20.81);
  return { scene: R.scene, cam, update(f, fd, t) { const k = f > T ? Math.max(0, 1 - (f - T) / .12) : 1; c1.scale.setScalar(Math.max(.001, k)); place(R.scene, { ...BEN, ...fx(f, [[0, 'smile'], [T + .05, 'shock']]) }, 0, 0, .6, 0); sweepCam(cam, f, fd, [.01, 7.0, 1.5, 0, 0, -.4], [.01, 6.2, 1.2, 0, 0, -.4]); } }; });
// 10 "Then his other couch." - same angle: POP. He just stands there.
shot(21.6, 23.5, () => { const R = room(0xffe8c8), cam = newCam(44), c2 = couch(0xe8742a); R.scene.add(c2); c2.position.set(1.3, 0, -1.2); const T = at(21.6, 22.6);
  return { scene: R.scene, cam, update(f, fd, t) { const k = f > T ? Math.max(0, 1 - (f - T) / .12) : 1; c2.scale.setScalar(Math.max(.001, k)); place(R.scene, { ...BEN, ...fx(f, [[0, 'sad'], [T + .05, 'deadpan']]), still: true }, 0, 0, .6, 0); sweepCam(cam, f, fd, [.01, 6.2, 1.2, 0, 0, -.4], [.01, 5.4, 1.0, 0, 0, -.4]); } }; });
// 11 "His wife left." - she walks out the door with a suitcase; his face drops instantly
shot(23.5, 25.3, () => { const R = room(0xffe8c8), cam = newCam(42), door = at3(box(.9, 2.0, .1, 0x8a5a3a), 1.6, 1.0, -2.88), sc = cardBox(.5); R.scene.add(door, sc);
  return { scene: R.scene, cam, update(f, fd, t) { const k = clamp(f / (fd * .9)); const w = walkTo(R.scene, { ...WIFE, ...EX.angry, hands: [V(-.3, .9, .2), V(.35, .55, .1)] }, .6, .3, 1.6, -2.4, k, t, Math.atan2(1.0, -2.7)); w.updateMatrixWorld(true); sc.position.copy(w.localToWorld(V(.4, .35, .1)));
    place(R.scene, { ...BEN, ...fx(f, [[0, 'happy'], [.35, 'sad']]) }, -.9, 0, .4, .3); sweepCam(cam, f, fd, [-.3, 1.6, 4.0, .2, 1.1, -1.0], [-.1, 1.5, 3.6, .3, 1.1, -1.2]); } }; });
// 12 "His dog left." - the dog trots out after her, tail up
shot(25.3, 26.85, () => { const R = room(0xffe8c8), cam = newCam(40), door = at3(box(.9, 2.0, .1, 0x8a5a3a), 1.6, 1.0, -2.88), d = makeDog(), sc = cardBox(.2); R.scene.add(door, d, sc);
  return { scene: R.scene, cam, update(f, fd, t) { const k = clamp(f / fd); d.position.set(lerp(.3, 1.6, k), Math.abs(Math.sin(t * 14)) * .04, lerp(.4, -2.4, k)); d.rotation.y = Math.atan2(-2.8, 1.3) + Math.PI / 2; d.userData.tail.rotation.z = Math.sin(t * 20) * .5; d.updateMatrixWorld(true); sc.position.copy(d.localToWorld(V(.36, .25, .22)));
    sweepCam(cam, f, fd, [1.3, .35, 1.6, 1.0, .35, -1.0], [1.5, .3, 1.2, 1.2, .35, -1.4]); } }; });
// 13 "His goldfish... looked like it was thinking about it." - extreme close on the bowl: the fish slowly turns... and looks at the door
shot(26.85, 30.45, () => { const R = room(0xffe8c8), cam = newCam(36), fb = fishbowl(), tbl = at3(box(.8, .7, .6, 0x8a5a3a), 0, .35, 0); R.scene.add(tbl, fb); fb.position.set(0, .87, 0); const eye = new THREE.Mesh(new THREE.SphereGeometry(.012, 6, 6), flat(0x16121a)); fb.userData.fish.add(eye); eye.position.set(.035, .015, .03);
  return { scene: R.scene, cam, update(f, fd, t) { const k = ss(fd * .45, fd * .75, f); fb.userData.fish.rotation.y = lerp(-1.2, .9, k); fb.userData.fish.position.set(Math.sin(t * 1.3) * .03 * (1 - k), Math.sin(t * 2) * .01, 0); sweepCam(cam, f, fd, [.05, .95, .75, 0, .87, 0], [.03, .92, .55, 0, .87, 0]); } }; });
// 14 "This year, Benny trained like a madman." - the gym: headband on, he destroys the heavy bag
shot(30.45, 33.85, () => { const R = room(0xd8d8e0), cam = newCam(42), bag = new THREE.Group(); R.scene.add(bag); bag.position.set(.6, 2.6, -.4); bag.add(at3(box(.03, .6, .03, 0x9a9aa8, .004), 0, -.3, 0)); bag.add(at3(inked(new THREE.CylinderGeometry(.28, .28, 1.1, 14), 0xe8323a, .015), 0, -1.15, 0));
  return { scene: R.scene, cam, update(f, fd, t) { const hit = Math.max(0, Math.sin(t * 13)); bag.rotation.z = Math.sin(t * 13 - .8) * .12 + .05; const e = fx(f, [[0, 'determined'], [.8, 'scream'], [1.4, 'angry'], [2.2, 'scream'], [2.7, 'determined']]);
    place(R.scene, { ...BEN, ...e, headband: 0xe8323a, gloves: 0xe8323a, arms: [[-.25, .7, .45 + hit * .4 * (Math.sin(t * 6.5) > 0)], [.25, .7, .45 + hit * .4 * (Math.sin(t * 6.5) <= 0)]] }, -.2, 0, .2, 1.2); sweepCam(cam, f, fd, [2.2, .9, 2.8, -.1, 1.4, -.1], [1.9, .85, 2.5, -.1, 1.4, -.1]); cam.rotation.z += .08; } }; });
// 15 "Four AM runs." - dark street, low angle: he pounds past under the streetlight
shot(33.85, 35.5, () => { const S = lights(world('night')), cam = newCam(44);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -7, 0); const k = clamp(f / fd), sp = stepPose(t * 15); place(S.scene, { ...BEN, ...fx(f, [[0, 'determined'], [.9, 'scream']]), headband: 0xe8323a, ...sp, lean: .25 }, lerp(-4.5, -9.5, k), sp.bob, .1, -Math.PI / 2); sweepCam(cam, f, fd, [-6.3, .35, 3.2, -6.8, 1.1, -.2], [-7.4, .35, 3.0, -8.2, 1.1, -.2]); } }; });
// 16 "Raw eggs." - kitchen counter, a glass of raw eggs... down it goes. His face: instant regret
shot(35.5, 36.75, () => { const R = room(0xfff0d8), cam = newCam(38), gl = new THREE.Mesh(new THREE.CylinderGeometry(.07, .06, .2, 12), new THREE.MeshToonMaterial({ color: 0xfff2a0, gradientMap: ramp, transparent: true, opacity: .8 })); R.scene.add(gl, at3(box(2, .9, .6, 0xd8d0c8), 0, .45, -.6)); for (let i = 0; i < 4; i++) R.scene.add(at3(inked(new THREE.SphereGeometry(.06, 10, 8), 0xfff8e8, .006), -.5 + i * .14, .96, -.5));
  return { scene: R.scene, cam, update(f, fd, t) { const up = ss(0, .35, f), e = fx(f, [[0, 'determined'], [.45, 'gross'], [.8, 'scream']]); const b = place(R.scene, { ...BEN, ...e, headband: 0xe8323a, hands: [V(-.3, .9, .2), V(.12, lerp(1.0, 1.42, up), .35)] }, .2, 0, .2, 0); b.updateMatrixWorld(true); gl.position.copy(b.localToWorld(V(.12, lerp(1.06, 1.5, up), .38))); gl.rotation.z = up * 1.3;
    const fc = b.userData.head.localToWorld(V(0, -.2, 0)); look(cam, fc.x + .9, fc.y + .05, fc.z + 1.4, fc.x, fc.y - .1, fc.z); } }; });
// 17 "Punching frozen meat." - the meat locker, cold blue: punch, punch, punch
shot(36.75, 38.9, () => { const R = room(0xb8d8f0), cam = newCam(42), slabs = [-1.0, 0, 1.0].map((x, i) => { const m = meatSlab(); m.position.set(x, 0, -1.2 - (i % 2) * .4); R.scene.add(m); return m; });
  return { scene: R.scene, cam, update(f, fd, t) { slabs.forEach((m, i) => m.rotation.z = Math.sin(t * 9 + i) * (i === 1 ? .2 : .05)); const right = Math.sin(t * 8) > 0, e = fx(f, [[0, 'angry'], [.6, 'scream'], [1.2, 'angry'], [1.7, 'scream']]);
    place(R.scene, { ...BEN, ...e, headband: 0xe8323a, gloves: 0xe8323a, arms: right ? [[-.25, .7, .45], [.1, .6, 1.0]] : [[-.1, .6, 1.0], [.25, .7, .45]] }, 0, 0, -.25, Math.PI); sweepCam(cam, f, fd, [.9, .35, -2.8, 0, 1.4, -.6], [.7, .3, -2.5, 0, 1.4, -.6]); } }; });
// 18 "He steps into the ring," - low behind the ropes: Benny ducks through, the crowd roaring
shot(38.9, 40.7, () => { const R = ring({ seed: 7 }), cam = newCam(44); flipYear(R.banner, 2026);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const k = clamp(f / (fd * .8)); place(R.scene, { ...BENNY, ...fx(f, [[0, 'determined'], [.9, 'angry']]), headband: 0xe8323a, lean: .3 * (1 - k), arms: GUARD }, lerp(2.9, 1.6, k), RT, lerp(2.4, 1.5, k), -2.3); big(place(R.scene, { ...CHAMP, ...EX.smug, arms: GUARD }, -1.3, RT, -1.1, .8));
    sweepCam(cam, f, fd, [.9, .95, 4.2, 2.6, 1.4, 2.1], [.8, .9, 3.9, 1.6, 1.5, 1.4]); } }; });
// 19 "...looks the champ dead in the eye, and says," - extreme close on Benny's eyes, slow push
shot(40.7, 43.9, () => { const R = ring({ seed: 7 }), cam = newCam(30);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const b = place(R.scene, { ...BENNY, ...fx(f, [[0, 'determined'], [1.4, 'angry']]), headband: 0xe8323a, arms: GUARD, still: true }, .9, RT, .4, -1.9); b.updateMatrixWorld(true); const eye = b.userData.head.localToWorld(V(0, .06, .3)), fw = b.userData.head.localToWorld(V(0, .06, 1.3)).sub(eye);
    const d = lerp(1.7, 1.15, ss(0, fd, f)); look(cam, eye.x + fw.x * d, eye.y + .02, eye.z + fw.z * d, eye.x, eye.y, eye.z); } }; });
// 20 "You're going DOWN." - dutch angle, lip sync, nostrils flaring
shot(43.9, 46.3, () => { const R = ring({ seed: 7 }), cam = newCam(36);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const m = talkIf(t, 43.95, 45.6); const b = place(R.scene, { ...BENNY, ...EX.angry, mouth: m || 'flat', headband: 0xe8323a, arms: [[-.25, .8, .55], [.4, .9, .6]] }, .9, RT, .4, -1.9); faceCam(cam, b, 1.6, .35, .0, -.1); cam.rotation.z += .14; } }; });
// 21 "The champ just laughs." - smug... then he cracks up
shot(46.3, 48.3, () => { const R = ring({ seed: 7 }), cam = newCam(38);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const e = fx(f, [[0, 'smug'], [at(46.3, 47.42), 'laugh']]); const g = big(place(R.scene, { ...CHAMP, ...e, nod: e.mouth === 'open' ? Math.sin(t * 18) * .12 : 0, arms: GUARD }, -.9, RT, -.6, 1.1)); faceCam(cam, g, 2.4, -.4, -.2, -.1); } }; });
// 22 "Hahaha. Good luck, pal. You're gonna need it." - low dutch angle, lip sync, towering over
shot(48.3, 52.4, () => { const R = ring({ seed: 7 }), cam = newCam(40);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const m = talkIf(t, 48.35, 52.0); const e = fx(f, [[0, 'laugh'], [at(48.3, 49.38), 'smug']]); const g = big(place(R.scene, { ...CHAMP, ...e, mouth: m || e.mouth, arms: [[-.3, .6, .4], [.55, .9, .35]] }, -.9, RT, -.6, 1.1)); g.updateMatrixWorld(true);
    const hp = g.userData.head.localToWorld(V(0, -.2, 0)); sweepCam(cam, f, fd, [hp.x + 1.9, RT + .5, hp.z + 1.2, hp.x, hp.y - .2, hp.z], [hp.x + 1.7, RT + .45, hp.z + .9, hp.x, hp.y - .15, hp.z]); cam.rotation.z -= .15; } }; });
// 23 "The bell rings." - ringside bell, hammer: DING
shot(52.4, 54.0, () => { const R = ring({ seed: 8 }), cam = newCam(36), bl = bellProp(); R.scene.add(bl); bl.position.set(3.25, 0, 0); const T = at(52.4, 52.6);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); bl.userData.ham.rotation.z = f < T ? lerp(0, -.8, f / T) : -.8 + Math.min(1, (f - T) * 8) * 1.2 * Math.exp(-(f - T) * 5); bl.children[1].scale.setScalar(1 + .06 * Math.exp(-Math.max(0, f - T) * 12) * (f > T));
    sweepCam(cam, f, fd, [4.0, .85, .75, 3.25, .55, 0], [3.85, .8, .6, 3.25, .55, 0]); } }; });
// 24 "Benny swings..." - SLOW MOTION: the glove travels across the frame
shot(54.0, 56.3, () => { const R = ring({ seed: 8 }), cam = newCam(40);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const k = ss(.2, fd, f), slow = tm(54) + f * .25; NOW = slow;
    place(R.scene, { ...BENNY, ...fx(f, [[0, 'angry'], [.6, 'scream']]), headband: 0xe8323a, arms: [[-.25, .75, .45], [lerp(.4, -.05, k), lerp(.4, .75, k), lerp(-.2, 1.15, k)]], lean: k * .25 }, .7, RT, .2, -1.6);
    big(place(R.scene, { ...CHAMP, ...fx(f, [[0, 'smug'], [fd * .75, 'shock']]), arms: GUARD }, -.9, RT, -.4, 1.4)); sweepCam(cam, f, fd, [.2, 1.4, 2.8, -.2, 1.7, -.1], [-.2, 1.5, 2.5, -.3, 1.8, -.2]); } }; });
// 25 "...and the champ hits the floor." - floor level, slow motion: he topples straight at us
shot(56.3, 57.9, () => { const R = ring({ seed: 8 }), cam = newCam(44);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const k = ss(0, fd * .8, f); const g = big(place(R.scene, { ...CHAMP, ...EX.dazed, arms: [[-.6, .5, -.2], [.6, .5, -.2]], still: true }, 0, RT, -1.2, 0)); g.rotation.x = k * Math.PI / 2 * .98; g.position.z = -1.2;
    place(R.scene, { ...BENNY, ...fx(f, [[0, 'scream'], [fd * .7, 'shock']]), headband: 0xe8323a, arms: GUARD }, 1.2, RT, -2.4, -.4); sweepCam(cam, f, fd, [.2, RT + .12, 1.4, 0, RT + .5, -1.5], [.1, RT + .1, 1.3, 0, RT + .4, -1.5]); } }; });
// 26 "Out cold." - straight down: the champ starfished, Benny over him: shock -> joy -> shock
shot(57.9, 59.7, () => { const R = ring({ seed: 8 }), cam = newCam(40);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); const g = big(place(R.scene, { ...CHAMP, ...EX.dazed, arms: [[-.8, .3, 0], [.8, .3, 0]], feet: [[0, .1], [0, .1]] }, 0, RT, 0, 0)); lieDown(g, RT + .3);
    place(R.scene, { ...BENNY, ...fx(f, [[0, 'shock'], [.55, 'happy'], [1.0, 'shock'], [1.3, 'happy']]), headband: 0xe8323a, arms: f > .55 ? [[-.4, 1.0, .1], [.4, 1.0, .1]] : GUARD }, .9, RT, 1.1, -.6); sweepCam(cam, f, fd, [.01, 5.4, -.5, .2, RT, -.7], [.01, 4.7, -.55, .2, RT, -.7]); cam.rotation.z += f * .1; } }; });
// 27 "After the fight, the champ hands him a dusty old shoebox." - the locker room: ice pack, a dusty box held out
shot(59.7, 64.4, () => { const R = room(0x9ab8c8), cam = newCam(42), sb = shoebox(), ice = at3(inked(new THREE.SphereGeometry(.16, 10, 8), 0x8ad8ff, .01), 0, 0, 0); R.scene.add(sb, ice); for (let i = 0; i < 7; i++) R.scene.add(at3(box(.55, 2.1, .5, 0x5a7a9a, .015), -2.4 + i * .6, 1.05, -2.7)); R.scene.add(at3(box(2.4, .4, .5, 0x8a5a3a), 0, .2, -1.6));
  const puff = [...Array(8)].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 5), new THREE.MeshBasicMaterial({ color: 0xd8c8a8, transparent: true, opacity: .7 })); R.scene.add(m); return m; }); const T = at(59.7, 61.63);
  return { scene: R.scene, cam, update(f, fd, t) { const k = ss(T - .4, T + .3, f), hx = lerp(.1, .45, k);
    const c = big(place(R.scene, { ...CHAMP, ...fx(f, [[0, 'dazed'], [.7, 'smile']]), hands: [V(-.25, 1.55, .25), V(hx, 1.0, .45)] }, -.8, 0, -.5, .9), 1.2); c.updateMatrixWorld(true); ice.position.copy(c.userData.head.localToWorld(V(-.15, .4, .1))); sb.position.copy(c.localToWorld(V(hx, 1.0, .65))); sb.rotation.y = .9;
    puff.forEach((m, i) => { const q = ((f * .5 + i / 8) % 1); m.position.copy(sb.position).add(V(Math.sin(i * 2) * q * .4, .2 + q * .5, Math.cos(i * 2) * q * .3)); m.material.opacity = .6 * (1 - q) * (f > T - .2); });
    place(R.scene, { ...BEN, ...fx(f, [[0, 'happy'], [T, 'shock']]), headband: 0xe8323a }, .9, 0, .3, -1.9); sweepCam(cam, f, fd, [.2, 1.5, 3.6, 0, 1.1, -.2], [.1, 1.4, 3.1, 0, 1.1, -.2]); } }; });
// 28 "Inside is every dollar Benny ever lost." - straight down: the lid lifts... stacks and stacks of cash
shot(64.4, 68.8, () => { const R = room(0x9ab8c8), cam = newCam(40), sb = shoebox(), glow = new THREE.PointLight(0xfff2a0, 0, 2); R.scene.add(sb, glow, at3(box(1.4, .8, .9, 0x8a5a3a), 0, .4, 0)); sb.position.set(0, .8, 0); glow.position.set(0, 1.2, 0);
  return { scene: R.scene, cam, update(f, fd, t) { const k = ss(.2, 1.0, f); sb.userData.lid.rotation.x = -k * 2.0; glow.intensity = 0; sb.userData.cash.children.forEach((c, i) => c.scale.y = 1 + k * (1 + (i % 3) * .5)); sweepCam(cam, f, fd, [.01, 2.4, .35, 0, .9, 0], [.01, 1.8, .25, 0, .9, 0]); } }; });
// 29 "I kept it all, he says. Figured you'd need it when you finally got good." - the champ, warm smile (lip sync)
shot(68.8, 74.7, () => { const R = room(0x9ab8c8), cam = newCam(38); for (let i = 0; i < 7; i++) R.scene.add(at3(box(.55, 2.1, .5, 0x5a7a9a, .015), -2.4 + i * .6, 1.05, -2.7));
  return { scene: R.scene, cam, update(f, fd, t) { const m = talkIf(t, 68.85, 70.4) || talkIf(t, 71.05, 73.8); const c = big(place(R.scene, { ...CHAMP, ...fx(f, [[0, 'smile'], [at(68.8, 73.4), 'happy']]), mouth: m || (f > at(68.8, 73.4) ? 'grin' : 'smile') }, -.3, 0, -.6, .35), 1.2);
    faceCam(cam, c, 2.4 - f * .06, -.5, -.15, -.15); } }; });
// 30 "Benny cried." - full waterworks
shot(74.7, 76.2, () => { const R = room(0x9ab8c8), cam = newCam(38);
  return { scene: R.scene, cam, update(f, fd, t) { const b = place(R.scene, { ...BEN, ...EX.cry, headband: 0xe8323a, squash: Math.abs(Math.sin(t * 9)) * .04 }, .6, 0, .2, -.7); faceCam(cam, b, 1.7, .2, .05, -.12); } }; });
// 31 "Then he spent all of it... on a rematch." - the shoebox slaps down on the ring apron. The banner: 2027. The champ cracks his knuckles. DING DING.
shot(76.2, 999, () => { const R = ring({ seed: 9 }), cam = newCam(44), sb = shoebox(); R.scene.add(sb); sb.position.set(.9, RT + .02, 2.0); flipYear(R.banner, 2027); const T = at(76.2, 77.19);
  return { scene: R.scene, cam, update(f, fd, t) { R.tick(t); sb.visible = f > T; sb.scale.setScalar(1 + .15 * Math.exp(-Math.max(0, f - T) * 10)); place(R.scene, { ...BENNY, ...fx(f, [[0, 'cry'], [T, 'happy'], [T + 1.1, 'determined']]), headband: 0xe8323a, arms: GUARD }, .5, RT, 1.3, .3);
    const c = big(place(R.scene, { ...CHAMP, ...fx(f, [[0, 'smile'], [T + 1.1, 'smug']]), arms: GUARD }, -1.0, RT, -.8, .7)); sweepCam(cam, f, fd, [1.0, 1.4, 3.9, -.2, 1.6, 0], [.5, 2.6, 4.3, -.2, 1.9, -1]); this.fade = ss(fd - .5, fd - .05, f); } }; });
