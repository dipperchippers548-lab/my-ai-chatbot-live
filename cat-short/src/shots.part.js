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

// ===================== BISCUIT: the cat, the family, the sets =====================
const DAD = { color: 0x38c8c0, mustache: true, shoe: 0x5a4a3a };
const MOM = { color: 0xffd23a, blush: true, shoe: 0xffffff };
const KIDO = { color: 0xff8a6a, tuft: true, shoe: 0x3a3a48 };
const VET = { color: 0xffb04a, glasses: true, robe: 0xffffff, shoe: 0x16121a };
const LADY = { color: 0xc8a0ff, glasses: true, curlers: true, robe: 0xff8ab8, shoe: 0xffffff };
// a camera that glides through several framings in one take: keys = [[t, px,py,pz, tx,ty,tz], ...]
function path(cam, f, keys) { let i = 0; while (i < keys.length - 2 && f > keys[i + 1][0]) i++; const a = keys[i], b = keys[i + 1], k = ss(a[0], b[0], f);
  look(cam, ...[1, 2, 3, 4, 5, 6].map(j => lerp(a[j], b[j], k))); }
// ---- Biscuit: an orange tabby whose belly grows with `fat` (0 = normal, 2.5 = beanbag) ----
function makeCat(fat = 0, o = {}) {
  const g = new THREE.Group(), C = 0xf0a040, D = 0xc8742a, Wt = 0xfff4e8, sx = 1 + fat, sy = 1 + fat * .75, sz = 1 + fat * .45;
  const body = inked(new THREE.SphereGeometry(.3, 20, 16), C, .016); body.scale.set(.95 * sx, .78 * sy, 1.3 * sz); body.position.y = .3 + .22 * fat * .6; g.add(body);
  const belly = inked(new THREE.SphereGeometry(.22, 16, 12), Wt, .012); belly.scale.set(.9 * sx, .7 * sy, 1.1 * sz); belly.position.set(0, body.position.y - .07 * sy, .08 * sz); g.add(belly);
  for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.TorusGeometry(.29 * sx, .022, 6, 20, Math.PI), flat(D)); st.position.set(0, body.position.y, (-.15 + i * .14) * sz); st.scale.set(1, .78 * sy / sx, 1); g.add(st); }
  const legs = []; for (const [x, z] of [[-.14, .24], [.14, .24], [-.14, -.24], [.14, -.24]]) { const l = new THREE.Group(); l.position.set(x * sx, .16, z * sz); g.add(l); l.add(at3(inked(new THREE.CapsuleGeometry(.055, .1, 4, 8), C, .01), 0, -.06, 0)); l.add(at3(inked(new THREE.SphereGeometry(.065, 10, 8), Wt, .008), 0, -.14, .02)); legs.push(l); }
  const head = new THREE.Group(); head.position.set(0, .52 + fat * .2, .36 * sz + .05); g.add(head);
  const sk = inked(new THREE.SphereGeometry(.22, 18, 14), C, .014); sk.scale.set(1.15 + fat * .12, 1, 1); head.add(sk);
  head.add(at3(inked(new THREE.SphereGeometry(.1, 12, 10), Wt, .008), 0, -.06, .16)); head.children[head.children.length - 1].scale.set(1.4, .8, .7);
  head.add(at3(new THREE.Mesh(new THREE.SphereGeometry(.028, 8, 6), flat(0xff7a9a)), 0, -.01, .225));
  for (const s of [-1, 1]) { const e = inked(new THREE.ConeGeometry(.085, .16, 4), C, .01); e.position.set(s * .14, .18, -.02); e.rotation.z = -s * .35; head.add(e); const ei = new THREE.Mesh(new THREE.ConeGeometry(.045, .09, 4), flat(0xff9ab0)); ei.position.set(s * .14, .17, .02); ei.rotation.z = -s * .35; head.add(ei);
    for (const a of [-.15, .05]) { const w = new THREE.Mesh(new THREE.BoxGeometry(.16, .006, .006), flat(INK)); w.position.set(s * .17, -.04 + a * .2, .17); w.rotation.z = s * a; head.add(w); } }
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.025, .07, .01), flat(D)); b.position.set(-.04 + i * .04, .17, .19); b.rotation.x = -.6; head.add(b); }
  const eyes = [-1, 1].map(s => { const e = new THREE.Group(); e.position.set(s * .085, .04, .19); head.add(e); const b = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), flat(INK)); b.scale.set(.85, 1.2, .5); e.add(b); const gl = new THREE.Mesh(new THREE.SphereGeometry(.014, 6, 6), flat(0xffffff)); gl.position.set(.012, .02, .02); e.add(gl); return e; });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), flat(0x6a1a2a)); mouth.position.set(0, -.085, .2); mouth.scale.set(1.2, .2, .4); head.add(mouth);
  const tail = new THREE.Group(); tail.position.set(0, body.position.y + .1, -.36 * sz); g.add(tail); tail.add(curveTube([V(0, 0, 0), V(0, .25, -.18), V(0, .45, -.08)], .045, C, .01));
  let cam = null; if (o.collar) { const c = inked(new THREE.TorusGeometry(.13, .025, 6, 18), 0xe8323a, .006); c.rotation.x = Math.PI / 2 - .3; c.position.set(0, -.16, .05); head.add(c); if (o.cam) { cam = at3(box(.07, .05, .05, 0x24222c, .006), 0, -.2, .17); head.add(cam); cam.add(at3(new THREE.Mesh(new THREE.SphereGeometry(.012, 6, 6), flat(0xff2020)), .02, .02, .028)); } }
  g.userData = { head, tail, legs, eyes, mouth, body,
    face(kind = 'open', m = 'flat') { const s = { open: [1, 1], half: [1, .45], closed: [1, .1], wide: [1.25, 1.4], happy: [1.1, .2] }[kind] || [1, 1]; eyes.forEach(e => e.scale.set(s[0], s[1], 1)); mouth.scale.set(m === 'open' ? 1.4 : 1.2, m === 'open' ? 1.6 : .2, .4); },
    anim(t, walk = 0) { tail.rotation.x = Math.sin(t * 2.2) * .25; tail.rotation.z = Math.sin(t * 1.7) * .3; legs.forEach((l, i) => l.rotation.x = walk * Math.sin(t * 12 + (i === 0 || i === 3 ? 0 : Math.PI)) * .6); g.position.y = walk * Math.abs(Math.sin(t * 12)) * .02; const bl = ((t + .7) % 3.3) < .1; if (bl) eyes.forEach(e => e.scale.y = .1); } };
  return g;
}
const catFace = (c, f, seq) => { let cur = seq[0][1], tc = -9; for (const [a, n] of seq) if (f >= a) { cur = n; tc = a; } const [eyesK, m] = cur.split(':'); c.userData.face(eyesK, m || 'flat'); const p = f - tc; const sq = p >= 0 && p < .3 ? .1 * Math.exp(-p * 12) * Math.cos(p * 28) : 0; c.userData.head.scale.set(1 + sq, 1 - sq, 1 + sq); };
// ---- the house kitchen: back wall with a cat door, fridge, counter, table ----
function kitchen(night = false) { const R = room(night ? 0x2a3060 : 0xfff0d8); const sc = R.scene; if (night) { sc.children.filter(o => o.isHemisphereLight || o.isDirectionalLight).forEach(l => l.intensity *= .35); const moon = new THREE.PointLight(0x8aa8ff, 8, 10); moon.position.set(1.5, 2.5, 1); sc.add(moon); }
  const cd = new THREE.Group(); cd.position.set(-.6, 0, -2.88); sc.add(cd); cd.add(at3(box(.56, .52, .1, 0x5a4a3a, .012), 0, .29, 0)); const flap = new THREE.Group(); flap.position.set(0, .5, .06); cd.add(flap); flap.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.42, .4, .02), toon(0x9ad8ff)), 0, -.2, 0));
  const fridge = new THREE.Group(); fridge.position.set(1.7, 0, -2.4); sc.add(fridge); fridge.add(at3(box(.9, 2.0, .7, 0xf2f6ff), 0, 1.0, 0)); fridge.add(at3(box(.05, .5, .06, 0x9a9aa8, .006), -.32, 1.3, .38));
  sc.add(at3(box(1.6, .9, .6, 0xd8c8b0), -2.0, .45, -2.5)); const tbl = new THREE.Group(); tbl.position.set(.2, 0, -.6); sc.add(tbl); tbl.add(at3(box(1.6, .08, .9, 0x9a6a3a), 0, .78, 0)); for (const [x, z] of [[-.7, -.35], [.7, -.35], [-.7, .35], [.7, .35]]) tbl.add(at3(box(.07, .76, .07, 0x7a4a2a, .006), x, .38, z));
  return { scene: sc, flap, fridge, tbl }; }
const bowl = (r = .16, col = 0x3a8ad8) => { const g = new THREE.Group(); g.add(inked(new THREE.CylinderGeometry(r, r * .8, r * .55, 16), col, .01)); g.children[0].position.y = r * .27; return g; };
function labelCard(txt, w = .5, h = .22, bg = '#ffffff', fg = '#e8323a') { return card(w, h, (g, W2, H2) => { g.fillStyle = bg; g.fillRect(0, 0, W2, H2); g.fillStyle = fg; g.textAlign = 'center'; g.font = `900 ${H2 * .55}px Nunito`; g.fillText(txt, W2 / 2, H2 * .72); g.strokeStyle = '#16121a'; g.lineWidth = 6; g.strokeRect(0, 0, W2, H2); }, 256); }

// ===================== SHOTS (voiceover clock) =====================
// 1 "A cat named Biscuit came home every single night... a little fatter." - moonlit kitchen, floor level: the flap swings, he waddles in, belly bounces
shot(0, 4.45, () => { const K = kitchen(true), cam = newCam(70), c = makeCat(.35); K.scene.add(c);
  return { scene: K.scene, cam, update(f, fd, t) { const k = ss(.5, 3.2, f); c.position.set(-.6, 0, lerp(-3.3, -1.9, k)); c.userData.anim(t, k > 0 && k < 1 ? 1 : 0); K.flap.rotation.x = f > .4 && f < 1.4 ? -Math.sin((f - .4) / 1 * Math.PI) * 1.1 : Math.sin(t * 6) * .05 * (f < 2);
    const F_ = at(0, 3.77); c.userData.body.scale.y = .78 * 1.26 * (1 + .12 * Math.exp(-Math.max(0, f - F_) * 8) * Math.cos((f - F_) * 30) * (f > F_)); catFace(c, f, [[0, 'open'], [at(0, 2.4), 'happy'], [F_, 'half'], [F_ + .4, 'happy']]);
    path(cam, f, [[0, -.5, .18, -1.6, -.6, .3, -2.9], [2.0, -.2, .22, -.7, -.6, .35, -2.0], [fd, .2, .6, -.6, -.6, .45, -1.9]]); } }; });
// 2 "At first, nobody noticed, because who weighs their cat?" - morning breakfast, the family busy... glide down past Biscuit to a dusty scale with a cobweb
shot(4.45, 7.7, () => { const K = kitchen(), cam = newCam(66), c = makeCat(.6), b = bowl(); K.scene.add(c, b); c.position.set(-1.2, 0, .6); c.rotation.y = .6; b.position.set(-.9, 0, .95);
  const scale = new THREE.Group(); scale.position.set(1.7, 0, 1.6); K.scene.add(scale); scale.add(at3(box(.4, .06, .4, 0xe8e8f0, .008), 0, .03, 0)); const dial = labelCard('0', .14, .08); dial.rotation.x = -Math.PI / 2; dial.position.set(0, .065, .1); scale.add(dial);
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(.004, .004, .35), flat(0xf2f2f2)); w.position.set(.2, .1 + i * .03, .05); w.rotation.y = .5 + i * .3; scale.add(w); }
  return { scene: K.scene, cam, update(f, fd, t) { c.userData.anim(t); c.userData.head.rotation.x = .5; catFace(c, f, [[0, 'happy:open'], [1.2, 'closed:open']]);
    place(K.scene, { ...DAD, ...fx(f, [[0, 'smile'], [1.0, 'happy']]), hands: [V(-.25, .95, .4), V(.3, 1.1 + Math.sin(t * 5) * .05, .35)] }, -.3, 0, -1.2, 0); place(K.scene, { ...MOM, ...fx(f, [[0, 'happy'], [1.4, 'smile']]), arms: [[-.4, .4, .3], [.5, .5, .4]] }, .9, 0, -1.2, -.2); place(K.scene, { ...KIDO, ...EX.laugh }, .25, 0, .1, Math.PI).scale.multiplyScalar(.75);
    path(cam, f, [[0, 0, 2.0, 2.4, .1, 1.0, -1.0], [1.4, -1.6, .9, 2.0, -1.1, .3, .6], [fd, 2.0, .5, 2.35, 1.7, .05, 1.6]]); } }; }, { xf: true });
// 3 "By the end of the month, Biscuit couldn't fit through the cat door." - floor level: fat Biscuit wedged in the flap, legs paddling; the family stares
shot(7.7, 11.3, () => { const K = kitchen(), cam = newCam(68), c = makeCat(1.1); K.scene.add(c); c.position.set(-.6, 0, -3.0);
  return { scene: K.scene, cam, update(f, fd, t) { const strain = Math.sin(t * 9); c.position.z = -3.05 + Math.max(0, strain) * .03; c.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 16 + i) * .7); K.flap.rotation.x = -1.3; c.userData.tail.visible = false; catFace(c, f, [[0, 'wide:open'], [1.0, 'closed:open'], [1.8, 'wide:open'], [2.6, 'half']]);
    place(K.scene, { ...DAD, ...fx(f, [[0, 'shock'], [1.6, 'sad']]), arms: [[-.5, .2, .3], [.5, .2, .3]] }, .2, 0, -1.0, -2.6); place(K.scene, { ...MOM, ...fx(f, [[0, 'shock'], [1.2, 'scream'], [2.2, 'shock']]), hands: [V(-.15, 1.45, .3), V(.15, 1.45, .3)] }, -1.4, 0, -1.3, 2.5);
    path(cam, f, [[0, -.6, .2, -1.2, -.6, .45, -3.0], [fd, -.55, .25, -1.85, -.6, .5, -3.0]]); } }; });
// 4 "So the family put him on a diet. Half a scoop. No treats. Biscuit got fatter." - straight down on the bowl, half a scoop... over to the taped-shut treat jar... back to Biscuit: POP, bigger
shot(11.3, 16.85, () => { const K = kitchen(), cam = newCam(64), c = makeCat(1.1), b = bowl(.18), sc = new THREE.Group(), jar = new THREE.Group(); K.scene.add(c, b, sc, jar); b.position.set(.3, 0, .5); c.position.set(-.5, 0, .9); c.rotation.y = 2.0;
  const kib = [...Array(8)].map((_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 5), toon(0x8a5a2a)); m.position.set(.3 + Math.cos(i * 2.3) * .06, .07, .5 + Math.sin(i * 2.3) * .06); K.scene.add(m); return m; });
  sc.add(at3(box(.12, .1, .2, 0xe8e8f0, .008), 0, 0, 0)); jar.position.set(-2.0, .9, -2.4); jar.add(at3(inked(new THREE.CylinderGeometry(.14, .14, .3, 14), 0xfff2a0, .01), 0, .15, 0)); const lb = labelCard('TREATS', .26, .1); lb.position.set(0, .16, .145); jar.add(lb); const no = labelCard('NO!!', .3, .14, '#ffd23a', '#16121a'); no.position.set(0, .45, .15); no.rotation.z = .2; jar.add(no);
  for (const r of [-.6, .6]) { const tp = at3(box(.36, .04, .02, 0xc8c8d0, .004), 0, .25, .14); tp.rotation.z = r; jar.add(tp); }
  const TP = at(11.3, 13.14), TF = at(11.3, 16.13);
  return { scene: K.scene, cam, update(f, fd, t) { const pour = ss(TP - .4, TP + .1, f); sc.position.set(.3, .4 - pour * .15, .5); sc.rotation.z = -pour * 1.2; kib.forEach((m, i) => m.visible = f > TP - .1 + i * .02);
    const pop = f > TF ? 1 + .2 * Math.min(1, (f - TF) * 8) + .06 * Math.exp(-(f - TF) * 8) * Math.cos((f - TF) * 30) : 1; c.scale.setScalar(pop); c.userData.anim(t); catFace(c, f, [[0, 'wide'], [TP + .2, 'half'], [at(11.3, 14.13), 'wide:open'], [TF, 'half'], [TF + .5, 'happy']]);
    path(cam, f, [[0, .32, 1.6, .55, .3, 0, .5], [TP + .3, .3, 1.3, .52, .3, 0, .5], [at(11.3, 14.0), -1.4, 1.2, -1.4, -2.0, 1.0, -2.4], [at(11.3, 15.0), -1.2, 1.1, -1.2, -2.0, 1.0, -2.4], [fd, .4, .5, 2.3, -.5, .45, .9]]); } }; });
// 5a "They took him to the vet. The vet looked at Biscuit, then at the dad," - the clinic: huge Biscuit on the steel table; the vet's head turns... and turns
shot(16.85, 21.5, () => { const R = room(0xd8f0f0), cam = newCam(64), c = makeCat(1.4), tb = new THREE.Group(); R.scene.add(tb, c); tb.add(at3(box(1.3, .08, .8, 0xc8ccd8, .01), 0, .9, 0)); tb.add(at3(box(.1, .86, .1, 0x9a9aa8, .006), 0, .45, 0)); c.position.set(0, .94, 0); c.rotation.y = .3;
  const poster = labelCard('VET', .9, .4, '#ffffff', '#3a8ad8'); poster.position.set(-1.2, 2.0, -2.88); R.scene.add(poster); const T1 = at(16.85, 18.88), T2 = at(16.85, 19.88);
  return { scene: R.scene, cam, update(f, fd, t) { c.userData.anim(t); catFace(c, f, [[0, 'happy'], [T1, 'half'], [T2, 'happy']]);
    const turn = f < T1 ? 0 : f < T2 ? -.6 : .7; place(R.scene, { ...VET, ...fx(f, [[0, 'smile'], [T1, 'shock'], [T1 + .5, 'deadpan'], [T2, 'smug']]), turn, arms: [[-.4, .1, .3], [.4, .3, .4]] }, -.9, 0, -.4, .9);
    place(R.scene, { ...DAD, ...fx(f, [[0, 'smile'], [T2, 'shock'], [T2 + .6, 'sad']]), arms: [[-.4, -.1, .2], [.45, .2, .3]] }, 1.0, 0, -.5, -.8);
    path(cam, f, [[0, 0, 1.9, 3.6, 0, 1.2, 0], [T1 + .2, -.5, 1.7, 2.2, -.5, 1.4, -.2], [fd, .6, 1.7, 2.2, .5, 1.4, -.3]]); } }; }, { xf: true });
// 5b "and said, Sir... are you feeding him cheeseburgers?" - dutch angle on the vet (lip sync), the dad sweating behind
shot(21.5, 24.35, () => { const R = room(0xd8f0f0), cam = newCam(58);
  return { scene: R.scene, cam, update(f, fd, t) { const m = talkIf(t, 21.6, 24.2); const v = place(R.scene, { ...VET, ...fx(f, [[0, 'deadpan'], [at(21.5, 22.64), 'smug']]), mouth: m || 'flat', arms: [[-.4, .1, .3], [.3, .6, .5]] }, -.3, 0, -.4, .45);
    place(R.scene, { ...DAD, ...fx(f, [[0, 'sad'], [at(21.5, 23.26), 'shock']]), tears: f > at(21.5, 23.26), arms: [[-.4, -.1, .2], [.4, -.1, .2]] }, 1.1, 0, -1.4, -.5); faceCam(cam, v, 1.5, -.3, .0, -.2); cam.rotation.z += .2; } }; });
// 6a "They hid every crumb of food in the house," - the fridge in chains, a padlock, the family on guard
shot(24.35, 27.0, () => { const K = kitchen(), cam = newCam(66), c = makeCat(1.7); K.scene.add(c); c.position.set(-.9, 0, .7); c.rotation.y = .9;
  const links = [...Array(18)].map((_, i) => { const l = inked(new THREE.TorusGeometry(.05, .014, 6, 10), 0x9a9aa8, .004); l.position.set(1.7 + (i - 9) * .05, 1.0 + Math.sin(i * .35) * .05, -2.03); l.rotation.y = i % 2 ? Math.PI / 2 : 0; K.scene.add(l); return l; });
  const lock = at3(box(.14, .16, .06, 0xffc83a, .008), 1.7, .92, -1.99); K.scene.add(lock);
  return { scene: K.scene, cam, update(f, fd, t) { links.forEach((l, i) => l.visible = f > .2 + i * .03); lock.visible = f > .8; lock.scale.setScalar(1 + .3 * Math.exp(-Math.max(0, f - .8) * 10)); c.userData.anim(t); catFace(c, f, [[0, 'wide'], [1.0, 'half']]);
    place(K.scene, { ...DAD, ...fx(f, [[0, 'angry'], [1.3, 'smug']]), arms: [[-.5, .5, .1], [.5, .5, .1]] }, .8, 0, -1.3, .2); place(K.scene, { ...MOM, ...fx(f, [[0, 'determined'], [1.0, 'angry']]), hands: [V(-.3, .8, .2), V(.25, 1.85, .2)] }, -1.8, 0, -2.0, .4);
    path(cam, f, [[0, 1.6, 1.3, -1.0, 1.7, 1.0, -2.2], [fd, -.2, 1.5, 2.8, .2, .9, -1.0]]); } }; });
// 6b "but Biscuit kept growing, until he was basically a beanbag with legs." - straight down on the couch: he swells... and swells... tiny legs wiggle
shot(27.0, 31.9, () => { const R = room(0xffe8c8), cam = newCam(60), ch = couch(0x3a8ad8); R.scene.add(ch); ch.position.set(0, 0, -.4); let cat = null, fatNow = -1;
  return { scene: R.scene, cam, update(f, fd, t) { const fat = Math.round(lerp(1.7, 3.0, ss(0, at(27, 30.35), f)) * 10) / 10; if (fat !== fatNow) { if (cat) R.scene.remove(cat); cat = makeCat(fat); cat.position.set(0, .42, -.3); cat.rotation.y = .4; R.scene.add(cat); fatNow = fat; }
    cat.userData.anim(t); cat.userData.legs.forEach((l, i) => l.rotation.x = f > at(27, 31.16) ? Math.sin(t * 22 + i) * .8 : 0); catFace(cat, f, [[0, 'happy'], [1.6, 'half'], [at(27, 30.35), 'wide:open'], [at(27, 31.3), 'happy']]);
    path(cam, f, [[0, .01, 4.0, .5, 0, .4, -.3], [fd, .01, 2.9, .4, 0, .4, -.3]]); } }; }, { xf: true });
// 7 "So the dad clipped a tiny camera onto Biscuit's collar." - close: big hands, tiny camera, CLICK, the red light blinks on; Biscuit unimpressed
shot(31.9, 35.95, () => { const K = kitchen(), cam = newCam(56), c = makeCat(2.2, { collar: true, cam: true }); K.scene.add(c); c.position.set(0, 0, 0); const TC = at(31.9, 32.81);
  return { scene: K.scene, cam, update(f, fd, t) { c.userData.anim(t); catFace(c, f, [[0, 'half'], [TC, 'wide'], [TC + .4, 'half']]); c.updateMatrixWorld(true); const cp = c.userData.head.localToWorld(V(0, -.2, .2));
    const d = place(K.scene, { ...DAD, ...fx(f, [[0, 'determined'], [TC, 'smug'], [TC + 1.2, 'happy']]), hands: [V(-.12, .75 + Math.sin(f * 6) * .02, .5), V(.12, .75, .5)], lean: .35 }, -.75, 0, .75, Math.PI / 2); 
    path(cam, f, [[0, .9, cp.y + .3, cp.z + .8, cp.x - .2, cp.y, cp.z], [fd, .65, cp.y + .2, cp.z + .6, cp.x - .15, cp.y + .02, cp.z]]); } }; });
// 8 "That night, Biscuit squeezed under the fence, waddled two houses down, and scratched on a door." - COLLAR CAM: under the fence, across the lawns, up to a door... paw scratching
shot(35.95, 42.3, () => { const S = lights(world('night')), cam = newCam(96), paw = at3(inked(new THREE.SphereGeometry(.07, 10, 8), 0xf0a040, .008), 0, 0, 0); S.scene.add(paw);
  for (let i = 0; i < 26; i++) S.scene.add(at3(box(.1, 1.0, .04, 0xe8e2d4, .008), -.9, .78, -5.6 + i * .2));
  S.scene.add(at3(box(.06, .06, 5.4, 0xe8e2d4, .006), -.92, 1.0, -3.0)); S.scene.add(at3(box(.06, .06, 5.4, 0xe8e2d4, .006), -.92, .55, -3.0));
  const P = [[0, 1.2, .14, -2.4], [at(35.95, 37.3), -.3, .14, -2.4], [at(35.95, 38.1), -1.5, .12, -2.5], [at(35.95, 40.0), -3.0, .16, -3.5], [at(35.95, 40.8), -3.95, .16, -4.45]];
  return { scene: S.scene, cam, camLabel: 'COLLAR CAM', doorcam: '02:14 AM', update(f, fd, t) { setSun(S, -2, -3); let i = 0; while (i < P.length - 2 && f > P[i + 1][0]) i++; const a = P[i], b = P[i + 1], k = clamp((f - a[0]) / (b[0] - a[0]));
    const x = lerp(a[1], b[1], k), z = lerp(a[3], b[3], k), y = lerp(a[2], b[2], k) + Math.abs(Math.sin(t * 9)) * .03 * (f < P[4][0]), dir = f < P[4][0] ? Math.atan2(b[3] - a[3], b[1] - a[1]) : -Math.PI / 2;
    look(cam, x, y, z, x + Math.cos(dir) * 2, y + .05 + (f > P[4][0] ? .25 : 0), z + Math.sin(dir) * 2); cam.rotation.z += Math.sin(t * 9) * .04 * (f < P[4][0]);
    const sc_ = f > at(35.95, 40.9); paw.visible = sc_; if (sc_) { paw.position.set(x + Math.sin(t * 18) * .06, y + .05 + Math.abs(Math.sin(t * 18)) * .08, z - .25); } } }; }, { xf: true });
// 9 "A lady opened it and said, There you are, Mr. Whiskers! and set down a giant bowl of salmon." - warm light spills out; she beams (lip sync); a GIANT bowl; Biscuit dives in
shot(42.3, 49.0, () => { const S = lights(world('night')), cam = newCam(62), hx = HX.dave, c = makeCat(1.6, { collar: true, cam: true }), bw = bowl(.32, 0xff8ab8), dr = new THREE.Group(); S.scene.add(c, bw, dr);
  S.daveHouse.userData.door.scale.setScalar(.001); dr.position.set(hx - .35, 0, -4.87); dr.add(at3(box(.7, 1.2, .08, 0x7a4a2a, .015), .35, .6, 0)); const glow = at3(new THREE.Mesh(new THREE.BoxGeometry(.7, 1.2, .02), flat(0xffd87a)), hx, .6, -4.92); S.scene.add(glow); const warm = new THREE.PointLight(0xffc870, 0, 5); warm.position.set(hx, 1.0, -4.3); S.scene.add(warm);
  const fish = [...Array(7)].map((_, i) => { const m = inked(new THREE.BoxGeometry(.12, .06, .08), 0xff8a6a, .006); m.rotation.y = i; S.scene.add(m); return m; }); c.position.set(hx + .55, 0, -4.2); c.rotation.y = Math.PI + .6;
  const TO = at(42.3, 42.94), TB = at(42.3, 46.67);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, hx, -3); const op = ss(TO - .1, TO + .5, f); dr.rotation.y = -op * 1.7; warm.intensity = op * 6; const m = talkIf(t, 44.25, 45.95);
    const bend = ss(TB - .6, TB, f); const L = place(S.scene, { ...LADY, ...fx(f, [[0, 'shock'], [TO + .4, 'happy'], [at(42.3, 44.29), 'laugh'], [TB, 'smile']]), mouth: m || undefined, lean: bend * .5, hands: bend > .1 ? [V(-.2, lerp(1.0, .55, bend), lerp(.3, .55, bend)), V(.2, lerp(1.0, .55, bend), lerp(.3, .55, bend))] : undefined, arms: [[-.6, .6, .3], [.6, .6, .3]] }, hx, 0, lerp(-5.2, -4.55, op), 0);
    bw.visible = bend > .05; bw.position.set(hx - .05, bend < 1 ? lerp(.8, 0, bend) : 0, -4.3); fish.forEach((m, i) => { m.visible = bw.visible; m.position.set(bw.position.x + Math.cos(i * 2.3) * .14, bw.position.y + .2 + (i % 3) * .04, bw.position.z + Math.sin(i * 2.3) * .14); });
    const dive = f > TB + .4; c.position.x = dive ? hx + .4 : hx + 1.05; c.userData.head.rotation.x = dive ? .7 + Math.sin(t * 14) * .1 : -.3; c.userData.anim(t); catFace(c, f, [[0, 'wide'], [TO + .5, 'happy'], [TB, 'wide:open'], [TB + .4, 'happy:open']]);
    path(cam, f, [[0, hx + .5, .5, -2.9, hx, .9, -4.9], [TO + .7, hx - .7, 1.45, -2.7, hx, 1.45, -4.6], [TB - .6, hx - .6, 1.5, -2.2, hx, 1.1, -4.4], [fd, hx + .35, 1.75, -1.7, hx + .2, .5, -4.3]]); } }; });
// 10 "Turns out, for six years, Biscuit had two families, two names, and two dinners." - dusk, crane up over the two houses: BISCUIT here, MR. WHISKERS there, a bowl at each door
shot(49.0, 55.9, () => { const S = lights(world('morning')), cam = newCam(56), c = makeCat(2.2, { collar: true }); S.scene.add(c);
  const n1 = sprite('BISCUIT', '#ffd23a', 1.6, 46), n2 = sprite('MR. WHISKERS', '#ff8ab8', 1.9, 34); n1.position.set(HX.gary, 4.6, -5.2); n2.position.set(HX.dave, 4.6, -5.2); S.scene.add(n1, n2); const b1 = bowl(.22), b2 = bowl(.22, 0xff8ab8); b1.position.set(HX.gary + .4, 0, -4.4); b2.position.set(HX.dave + .4, 0, -4.4); S.scene.add(b1, b2);
  const T1 = at(49, 52.3), T2 = at(49, 53.47), T3 = at(49, 54.74);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, -1, -3); const q = (Math.sin(f * .9 - 1.6) + 1) / 2, x = lerp(HX.gary - .2, HX.dave + .2, q); c.position.set(x, 0, -2.2); c.rotation.y = Math.cos(f * .9 - 1.6) > 0 ? -Math.PI / 2 : Math.PI / 2; c.userData.anim(t, 1); catFace(c, f, [[0, 'happy'], [T3, 'happy:open']]);
    const fam = f > T1; if (fam) { place(S.scene, { ...DAD, ...EX.happy, arms: [[-.5, .2, .1], [.5, .9 + Math.sin(t * 6) * .2, .1]] }, HX.gary + 1, 0, -3.6, 0); place(S.scene, { ...MOM, ...EX.happy }, HX.gary - .6, 0, -3.7, 0); place(S.scene, { ...LADY, ...EX.laugh, arms: [[-.5, .9 + Math.sin(t * 6 + 1) * .2, .1], [.5, .2, .1]] }, HX.dave - .8, 0, -3.6, 0); }
    [n1, n2].forEach(n => n.scale.setScalar((n === n1 ? 1.6 : 1.9) * pop(f - T2))); [b1, b2].forEach(b => b.scale.setScalar(Math.max(.001, pop(f - T3))));
    path(cam, f, [[0, -1, .9, 1.4, -1, .6, -2.2], [T1, -1, 3.5, 5.5, -1, .8, -3.4], [fd, -1, 6.5, 9.0, -1, 1.2, -4.0]]); } }; }, { xf: true });
// 11 "Now both families split the vet bill. Biscuit still eats twice." - one bill, torn in half between them... and Biscuit between two bowls: munch, munch
shot(55.9, 999, () => { const R = room(0xd8f0f0), cam = newCam(60), c = makeCat(1.8), b1 = bowl(.2), b2 = bowl(.2, 0xff8ab8); R.scene.add(c, b1, b2); c.position.set(0, 0, .3); b1.position.set(-.75, 0, .7); b2.position.set(.75, 0, .7);
  const half = s => card(.45, .6, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = `900 ${h * .1}px Nunito`; g.textAlign = s < 0 ? 'right' : 'left'; g.fillText(s < 0 ? 'VET B' : 'ILL', s < 0 ? w : 0, h * .18); g.font = `900 ${h * .16}px Nunito`; g.fillText(s < 0 ? '$40' : '0.00', s < 0 ? w : 0, h * .5); g.strokeStyle = '#16121a'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); }, 128);
  const h1 = half(-1), h2 = half(1); R.scene.add(h1, h2); const TE = at(55.9, 58.95);
  return { scene: R.scene, cam, update(f, fd, t) { const tear = ss(at(55.9, 57.09), at(55.9, 57.6), f); h1.position.set(-.24 - tear * .25, 1.55, -.7); h2.position.set(.24 + tear * .25, 1.55, -.7); h1.rotation.z = tear * .25; h2.rotation.z = -tear * .25;
    place(R.scene, { ...DAD, ...fx(f, [[0, 'sad'], [1.2, 'smile']]), hands: [V(-.2, .9, .3), V(.3, 1.55 - 0, .45)] }, -1.0, 0, -.9, .5); place(R.scene, { ...LADY, ...fx(f, [[0, 'smile'], [1.0, 'happy']]), hands: [V(-.3, 1.55, .45), V(.2, .9, .3)] }, 1.0, 0, -.9, -.5);
    const side = f > TE ? (Math.sin((f - TE) * 7) > 0 ? -1 : 1) : 0; c.rotation.y = 0; c.userData.head.rotation.y = side * .9; c.userData.head.rotation.x = side ? .35 + Math.sin(t * 16) * .1 : 0; c.userData.anim(t); catFace(c, f, [[0, 'happy'], [TE, 'happy:open']]);
    path(cam, f, [[0, 0, 1.6, 2.6, 0, 1.4, -.7], [TE - .2, 0, 1.0, 2.0, 0, .5, .4], [fd, 0, 1.5, 3.3, 0, .5, .4]]); this.fade = ss(fd - .5, fd - .05, f); } }; });
