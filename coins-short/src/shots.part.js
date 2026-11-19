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

function studio(bg) { const scene = new THREE.Scene(); scene.background = new THREE.Color(bg); scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b0a0, 1.6)); const k = new THREE.DirectionalLight(0xffffff, 1.6); k.position.set(2, 5, 5); k.castShadow = true; scene.add(k); const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), toon(new THREE.Color(bg).multiplyScalar(.85).getHex())); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl); return { scene }; }
function beam(scene, col, r = 1.1, L = 10) { const g = new THREE.Group(); const geo = new THREE.ConeGeometry(r, L, 20, 1, true); geo.translate(0, -L / 2, 0); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); g.add(m); scene.add(g);
  return { g, aim(from, to, on = 1) { g.position.copy(from); g.quaternion.setFromUnitVectors(V(0, -1, 0), to.clone().sub(from).normalize()); g.visible = on > .01; m.material.opacity = .16 * on; } }; }
// ===================== WHY COINS HAVE RIDGES: 1690s London =====================
const CLIP = { color: 0xd8b088, hat: 'tricorn', hatColor: 0x3a2a1a, beard: 0x4a3a2a, robe: 0x3a5a3a, shoe: 0x2a1a12, eyes: 'half', mouth: 'smirk' };
const NEWT = { color: 0xffd8b0, wig: true, robe: 0x2a2a48, cravat: true, shoe: 0x16121a };
const GANG = [{ color: 0x9a9ab0, hat: 'tricorn', hatColor: 0x24222c, patch: true, robe: 0x5a3a2a }, { color: 0xd8a070, hat: 'cap', hatColor: 0x6a4a2a, beard: true, robe: 0x3a3a48 }, { color: 0xa0c8a0, hat: 'tricorn', hatColor: 0x5a2a2a, mustache: true, robe: 0x4a2a3a }];
const KING = { color: 0xffc8a0, hat: 'crown', robe: 0xa82a3a, beltColor: 0xffc83a, mustache: true, wig: 0x8a5a3a, shoe: 0x16121a };
const BAKER = { color: 0xffe0b0, hat: 'sleep', hatColor: 0xffffff, robe: 0xffffff, blush: true };
const SHOP = { color: 0xd8b8f0, glasses: true, mustache: true, robe: 0x7a5a3a };
const KIDM = { color: 0x5aa8ff, hat: 'cap', hatColor: 0xe8323a, shoe: 0xffffff };
// ---- coins: real 2D outlines, extruded. 'plain', 'clipped' (a chord cut off), 'ridged' (teeth all round), 'ridgedCut' (teeth shaved off one side) ----
const coinFaceT = (txt = 'GVLIELMVS III') => ctex(256, 256, g => { g.fillStyle = '#d8dce8'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#9aa0b0'; g.beginPath(); g.arc(128, 118, 54, 0, 7); g.fill(); g.beginPath(); g.moveTo(178, 112); g.lineTo(198, 128); g.lineTo(176, 134); g.fill(); g.fillRect(96, 160, 64, 40);
  g.font = '900 22px Nunito'; g.fillStyle = '#6a7080'; g.textAlign = 'center'; for (let i = 0; i < txt.length; i++) { const a = -Math.PI * .85 + i / (txt.length - 1) * Math.PI * .7 * 2.4 / 2.4 * 1.0; g.save(); g.translate(128 + Math.cos(a - .1) * 100, 128 + Math.sin(a - .1) * 100); g.rotate(a + Math.PI / 2); g.fillText(txt[i], 0, 0); g.restore(); } });
const COINT = { old: coinFaceT(), new: coinFaceT('LIBERTY 25'), };
function coinShape(kind, r) { const sh = new THREE.Shape(), ridged = kind.startsWith('ridged'), cut = kind === 'clipped' || kind === 'ridgedCut', N = 240, mid = -.4, half = .75, d = r * .84;
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2; let rr = r * (ridged ? (i % 2 ? 1.0 : .965) : 1); let x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    const da = Math.atan2(Math.sin(a - mid), Math.cos(a - mid)); if (cut && Math.abs(da) < half) { const k = d / Math.cos(da); if (k < rr) { x = Math.cos(a) * k; y = Math.sin(a) * k; } } i ? sh.lineTo(x, y) : sh.moveTo(x, y); } return sh; }
function makeCoin(kind = 'plain', r = .3, th = .05, face = 'old') { const g = new THREE.Group(); const geo = new THREE.ExtrudeGeometry(coinShape(kind, r), { depth: th, bevelEnabled: false, curveSegments: 4 }); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, 0);
  g.add(inked(geo, 0xd8dce8, .006)); const top = new THREE.Mesh(new THREE.CircleGeometry(r * .86, 32), new THREE.MeshToonMaterial({ map: COINT[face], gradientMap: ramp })); top.rotation.x = -Math.PI / 2; top.position.y = th + .001; g.add(top); return g; }
function shears() { const g = new THREE.Group(), b = []; for (const s of [-1, 1]) { const h = new THREE.Group(); g.add(h); h.add(at3(box(.04, .015, .34, 0xc8ccd8, .004), 0, 0, .17)); const ring = inked(new THREE.TorusGeometry(.05, .012, 6, 12), 0x24222c, .003); ring.rotation.x = Math.PI / 2; ring.position.set(s * .05, 0, -.08); h.add(ring); b.push(h); } g.userData.open = k => { b[0].rotation.y = k * .35; b[1].rotation.y = -k * .35; }; return g; }
function candle(sc, x, y, z, I = 3) { const g = new THREE.Group(); g.position.set(x, y, z); sc.add(g); g.add(at3(inked(new THREE.CylinderGeometry(.04, .04, .18, 10), 0xfff4d8, .006), 0, .09, 0)); const fl = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), flat(0xffd23a)); fl.scale.y = 1.8; fl.position.y = .22; g.add(fl); const L = new THREE.PointLight(0xffb060, I, 5); L.position.y = .35; g.add(L); g.userData = { fl, L }; return g; }
const flick = (c, t) => { c.userData.L.intensity *= 1; c.userData.fl.scale.y = 1.8 + Math.sin(t * 23) * .3; };
function darkRoom(col, hemi = .45) { const R = room(col); R.scene.children.filter(o => o.isHemisphereLight || o.isDirectionalLight).forEach(l => l.intensity *= hemi); return R; }
const tableP = (sc, x, z, w = 1.6, d = .9, col = 0x7a4a2a) => { const t = new THREE.Group(); t.position.set(x, 0, z); sc.add(t); t.add(at3(box(w, .08, d, col), 0, .78, 0)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) t.add(at3(box(.07, .76, .07, 0x5a3a22, .006), a * (w / 2 - .08), .38, b * (d / 2 - .08))); return t; };
const mugP = () => { const g = new THREE.Group(); g.add(inked(new THREE.CylinderGeometry(.07, .065, .16, 10), 0x9a6a3a, .008)); g.add(at3(new THREE.Mesh(new THREE.CylinderGeometry(.062, .062, .01, 10), flat(0xfff2d8)), 0, .075, 0)); return g; };
function coinPile(sc, x, y, z, n = 14, seed = 2) { const r = rng(seed), cs = []; for (let i = 0; i < n; i++) { const c = makeCoin('plain', .07, .015); c.position.set(x + (r() - .5) * .3, y + Math.floor(i / 5) * .016, z + (r() - .5) * .2); c.rotation.y = r() * 6; sc.add(c); cs.push(c); } return cs; }
// ---- 1690s London street: cobbles, overhanging timber-frame houses both sides, lanterns ----
const cobT = ctex(64, 64, g => { g.fillStyle = '#6a6470'; g.fillRect(0, 0, 64, 64); const r = rng(8); for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 * 6; x < 64; x += 12) { g.fillStyle = r() < .5 ? '#827a88' : '#746c7c'; g.beginPath(); g.ellipse(x + 5, y + 4, 5, 3.2, 0, 0, 7); g.fill(); } }, [30, 30]);
function tudor() { const g = new THREE.Group(), cr = 0xf2e2c0, bm = 0x3a2a22;
  g.add(at3(box(2.8, 2.3, 2.6, cr, .02), 0, 1.15, 0)); g.add(at3(box(3.0, 1.7, 2.9, cr, .02), 0, 3.15, .15));
  const tri = new THREE.Shape(); tri.moveTo(-1.6, 0); tri.lineTo(1.6, 0); tri.lineTo(0, 1.5); tri.closePath(); const rf = inked(new THREE.ExtrudeGeometry(tri, { depth: 3.1, bevelEnabled: false }), 0x4a3a44, .02); rf.children.forEach(m => m.geometry.translate(0, 4.0, -1.4)); g.add(rf);
  for (const x of [-1.35, -.45, .45, 1.35]) { g.add(at3(box(.12, 2.3, .05, bm, .006), x, 1.15, 1.31)); g.add(at3(box(.12, 1.7, .05, bm, .006), x * 1.07, 3.15, 1.61)); }
  g.add(at3(box(2.82, .14, .06, bm, .006), 0, 2.28, 1.32)); g.add(at3(box(3.02, .14, .06, bm, .006), 0, 3.95, 1.62));
  const wins = []; for (const [x, y, zz] of [[-.9, 1.4, 1.33], [.9, 1.4, 1.33], [-.9, 3.2, 1.63], [.9, 3.2, 1.63]]) { const w = at3(new THREE.Mesh(new THREE.BoxGeometry(.6, .55, .04), flat(0xffc870)), x, y, zz); g.add(w); wins.push(w); }
  g.add(at3(box(.7, 1.4, .06, 0x5a3a22, .01), 0, .7, 1.33)); g.userData.wins = wins; return g; }
function london(mode = 'dusk', o = {}) {
  const scene = new THREE.Scene(), night = mode === 'night', day = mode === 'day';
  scene.background = ctex(8, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, day ? '#8ac8ff' : night ? '#0a0c24' : '#2a2060'); gr.addColorStop(.6, day ? '#d8eeff' : night ? '#24204a' : '#c86a7a'); gr.addColorStop(1, day ? '#fff2d8' : night ? '#3a2a4a' : '#ffb070'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); });
  scene.fog = new THREE.Fog(day ? 0xd8e8f8 : night ? 0x1a1a34 : 0x8a5a7a, 10, 38);
  scene.add(new THREE.HemisphereLight(day ? 0xffffff : 0x8a8ad8, 0x3a2a3a, day ? 1.4 : .6)); const sun = new THREE.DirectionalLight(day ? 0xfff2e0 : 0xffb080, day ? 2.0 : .7); sun.position.set(5, 10, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 }); scene.add(sun, sun.target);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), toon(0xffffff, cobT)); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; scene.add(gr);
  const houses = []; for (const s of [-1, 1]) for (let z = 5; z > -40; z -= 3.3) { const h = tudor(); h.position.set(s * 3.5, 0, z); h.rotation.y = -s * Math.PI / 2; scene.add(h); houses.push(h); if (day) h.userData.wins.forEach(w => w.material = flat(0x8aa8c8)); }
  const lamps = []; for (const s of [-1, 1]) for (let z = 3; z > -30; z -= 7) { const p = new THREE.Group(); p.position.set(s * 1.95, 0, z + (s > 0 ? 3.5 : 0)); scene.add(p); p.add(at3(box(.08, 2.4, .08, 0x24222c, .008), 0, 1.2, 0)); p.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.22, .3, .22), flat(day ? 0xc8c8c8 : 0xffd87a)), 0, 2.5, 0)); if (!day && Math.abs(z) < 12) { const L = new THREE.PointLight(0xffb060, 9, 7); L.position.set(0, 2.4, 0); p.add(L); } lamps.push(p); }
  return { scene, sun, houses }; }
// ---- interiors ----
function workshop() { const R = darkRoom(0x4a3428, .4), sc = R.scene; const tb = tableP(sc, 0, -.6); const cdl = candle(sc, -.5, .82, -.75, 3.5);
  const fur = new THREE.Group(); fur.position.set(1.9, 0, -2.2); sc.add(fur); fur.add(at3(box(1.0, 1.1, .9, 0x8a3a2a, .02), 0, .55, 0)); fur.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.45, .3, .02), flat(0xff8a2a)), 0, .5, .46)); const crc = at3(inked(new THREE.CylinderGeometry(.2, .14, .25, 12), 0x4a4a52, .01), 0, 1.22, 0); fur.add(crc); const melt = at3(new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .02, 12), flat(0xffd890)), 0, 1.34, 0); fur.add(melt);
  const fl = new THREE.PointLight(0xff7a2a, 6, 5); fl.position.set(1.9, 1.0, -1.5); sc.add(fl); return { scene: sc, tb, cdl, fur, melt, fl }; }
function tavern() { const R = darkRoom(0x6a4428, .55), sc = R.scene; tableP(sc, -.3, -.8, 1.8, 1.0); tableP(sc, 1.9, .4, 1.2, .8); for (const [x, z] of [[-2.6, -2.4], [-2.0, -2.5], [2.6, -2.4]]) { const b = inked(new THREE.CylinderGeometry(.35, .35, .9, 14), 0x8a5a3a, .015); b.position.set(x, .45, z); sc.add(b); }
  const fire = new THREE.PointLight(0xff8a3a, 7, 7); fire.position.set(-2.5, 1.0, -1.6); sc.add(fire); sc.add(at3(box(1.2, 1.0, .5, 0x6a5a5a, .02), -2.5, .5, -2.7)); sc.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.7, .5, .02), flat(0xff9a3a)), -2.5, .45, -2.44));
  const mugs = [[-.7, -.7], [-.2, -.95], [.25, -.65]].map(([x, z]) => { const m = mugP(); m.position.set(x, .9, z); sc.add(m); return m; }); candle(sc, .55, .82, -.5, 2.5); return { scene: sc, fire, mugs }; }

// ===================== SHOTS (voiceover clock) =====================
// 1 "In the 1690s, a man in London..." - dusk over the rooftops, crane down to the cobbles: a smug man strolls toward us, jingling a fat purse
shot(0, 2.85, () => { const L = london('dusk'), cam = newCam(62), purse = inked(new THREE.SphereGeometry(.14, 10, 8), 0x8a6a3a, .01); L.scene.add(purse);
  return { scene: L.scene, cam, update(f, fd, t) { setSun(L, 0, -4); const k = clamp(f / fd); const g = walkTo(L.scene, { ...CLIP, ...fx(f, [[0, 'smug'], [1.6, 'happy']]), arms: [[-.4, -.1, .1], [.35, .1 + Math.abs(Math.sin(t * 7)) * .15, .35]] }, .2, -6, .2, -3.6, k, t, 0); g.updateMatrixWorld(true); purse.position.copy(g.localToWorld(V(.35, .82 + Math.abs(Math.sin(t * 7)) * .1, .4)));
    path(cam, f, [[0, 0, 7.5, 3.0, 0, 3.0, -12], [fd, .5, 1.5, -.6, .2, 1.1, -3.8]]); } }; });
// 2 "...got rich... by shaving coins. Back then, coins were made of real silver." - candlelit workshop, one take: ECU the shears biting a coin -> pull back to him grinning over his piles -> push into a shining coin face
shot(2.85, 8.6, () => { const W = workshop(), cam = newCam(56), sh = shears(), cn = makeCoin('plain', .12, .02), sliver = new THREE.Mesh(new THREE.TorusGeometry(.11, .008, 4, 12, .6), flat(0xe8ecf4)); W.scene.add(sh, cn, sliver); coinPile(W.scene, .5, .82, -.45, 16); coinPile(W.scene, .2, .82, -.9, 10, 5); const big = makeCoin('plain', .2, .03); big.position.set(-.1, .83, -.35); W.scene.add(big);
  cn.position.set(-.05, 1.05, -.2); cn.rotation.set(Math.PI / 2, 0, 0); const TS = at(2.85, 4.09);
  return { scene: W.scene, cam, update(f, fd, t) { flick(W.cdl, t); W.fl.intensity = 5 + Math.sin(t * 9) * 1.2; const snipK = Math.max(0, Math.sin(t * 9)); sh.userData.open(snipK); sh.position.set(.08, 1.08, -.2); sh.rotation.set(0, -.6, 0);
    sliver.visible = f > TS; const q = clamp((f - TS) * 1.2); sliver.position.set(.12, 1.05 - q * .25, -.2 + q * .05); sliver.rotation.set(q * 6, q * 3, 0);
    place(W.scene, { ...CLIP, ...fx(f, [[0, 'determined'], [TS + .2, 'smug'], [at(2.85, 5.66), 'happy'], [at(2.85, 7.38), 'smug']]), hat: null, hands: [V(-.1, 1.05, .45), V(.15, 1.05, .45)] }, 0, 0, -1.4, 0);
    path(cam, f, [[0, .25, 1.12, .3, .02, 1.05, -.2], [TS + .8, 1.4, 1.6, 1.6, 0, 1.0, -.8], [at(2.85, 6.4), .9, 1.4, 1.2, 0, 1.0, -.7], [fd, -.1, 1.25, -.05, -.1, .85, -.35]]); } }; });
// 3 "So he'd clip a tiny sliver off the edge," - straight down: snip... a curl of silver drops onto a little heap of shavings
shot(8.6, 11.25, () => { const W = workshop(), cam = newCam(50), sh = shears(), cn = makeCoin('plain', .2, .03), cut = makeCoin('clipped', .2, .03); W.scene.add(sh, cn, cut); cn.position.set(0, .83, -.5); cut.position.copy(cn.position); const T = at(8.6, 9.98);
  const heap = [...Array(14)].map((_, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(.05, .006, 4, 10, 2), flat(0xe8ecf4)); m.position.set(.45 + Math.cos(i * 2.4) * .06, .83 + (i % 3) * .01, -.4 + Math.sin(i * 2.4) * .05); m.rotation.set(Math.PI / 2, 0, i); W.scene.add(m); return m; });
  const cur = new THREE.Mesh(new THREE.TorusGeometry(.12, .009, 4, 14, 1.2), flat(0xf2f4fa)); W.scene.add(cur);
  return { scene: W.scene, cam, update(f, fd, t) { flick(W.cdl, t); cn.visible = f < T; cut.visible = f >= T; sh.userData.open(f < T ? Math.max(0, Math.sin(f * 6)) * .8 : 0); sh.position.set(.12, .9, -.62); sh.rotation.set(0, -.4, 0);
    const q = clamp((f - T) / .8); cur.visible = f >= T; cur.position.set(lerp(.18, .45, q), .86 - q * .02, lerp(-.65, -.42, q)); cur.rotation.set(Math.PI / 2, 0, q * 4);
    path(cam, f, [[0, .05, 1.9, -.35, .05, .83, -.5], [fd, .12, 1.55, -.38, .12, .83, -.5]]); } }; });
// 4 "...spend the coin like normal," - (dissolve) a sunny market stall: coin for a loaf, a wink to us; the baker none the wiser
shot(11.25, 13.0, () => { const L = london('day'), cam = newCam(56), cn = makeCoin('clipped', .07, .014), loaf = inked(new THREE.CapsuleGeometry(.09, .22, 4, 8), 0xc8843a, .01); L.scene.add(cn, loaf); loaf.rotation.z = Math.PI / 2;
  const st = new THREE.Group(); st.position.set(-1.0, 0, -4.5); L.scene.add(st); st.add(at3(box(1.8, .6, .7, 0x8a5a3a), 0, .3, 0)); st.add(at3(box(2.0, .08, .9, 0xe8323a, .01), 0, 2.0, .1)); for (let i = 0; i < 5; i++) st.add(at3(inked(new THREE.CapsuleGeometry(.06, .16, 4, 8), 0xc8843a, .008), -.6 + i * .3, .66, 0)); for (const x of [-.9, .9]) st.add(at3(box(.06, 1.1, .06, 0x5a3a22, .006), x, 1.45, .45));
  return { scene: L.scene, cam, update(f, fd, t) { setSun(L, -1, -4); const k = ss(.1, .9, f); place(L.scene, { ...BAKER, ...fx(f, [[0, 'smile'], [.9, 'happy']]), hands: [V(-.3, .9, .2), V(.2, lerp(.9, 1.1, k), .45)] }, -1.0, 0, -5.1, 0);
    const c = place(L.scene, { ...CLIP, ...fx(f, [[0, 'smile'], [1.0, 'smug']]), hands: [V(-.3, .85, .2), V(.2, lerp(.95, 1.1, 1 - k), .5)], eyesL: f > 1.0 ? 'closed' : undefined }, -.8, 0, -3.5, Math.PI + .2); c.updateMatrixWorld(true); cn.position.copy(c.localToWorld(V(.2, 1.12, .55))); cn.visible = k < .6; loaf.position.set(-1.0 + .3, 1.15, -4.7 + k * .5);
    path(cam, f, [[0, .9, 1.7, -1.4, -.95, 1.15, -4.6], [fd, .7, 1.6, -1.7, -.95, 1.15, -4.6]]); } }; }, { xf: true });
// 5 "...and melt the shavings down." - (dissolve) the furnace: silver curls tip into a glowing crucible
shot(13.0, 15.15, () => { const W = workshop(), cam = newCam(52), sc_ = [...Array(12)].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(.05, .006, 4, 10, 2), flat(0xe8ecf4)); W.scene.add(m); return m; });
  return { scene: W.scene, cam, update(f, fd, t) { W.fl.intensity = 7 + Math.sin(t * 11) * 2; W.melt.material.color.setHSL(.1, 1, .6 + Math.sin(t * 8) * .08); sc_.forEach((m, i) => { const q = clamp((f - .2 - i * .06) / .5); m.visible = q > 0 && q < 1; m.position.set(1.9 + Math.sin(i) * .05, 1.75 - q * .4, -2.2 + Math.cos(i) * .05); m.rotation.set(q * 5, i, q * 3); });
    path(cam, f, [[0, 1.3, 1.9, -1.2, 1.9, 1.3, -2.2], [fd, 1.6, 1.7, -1.5, 1.9, 1.32, -2.2]]); } }; }, { xf: true });
// 6 "One coin, nobody notices." - a shopkeeper squints at the clipped coin... shrugs, drops it in the till
shot(15.15, 17.6, () => { const R = room(0xe8d8b8), cam = newCam(56), cn = makeCoin('clipped', .07, .014); R.scene.add(cn); R.scene.add(at3(box(2.4, 1.0, .7, 0x8a5a3a), 0, .5, -.6)); const T = at(15.15, 16.24);
  return { scene: R.scene, cam, update(f, fd, t) { const up = 1 - ss(T + .5, T + .9, f); const s = place(R.scene, { ...SHOP, ...fx(f, [[0, 'deadpan'], [.4, 'determined'], [T, 'smile'], [T + .5, 'happy']]), hands: [V(-.3, .9, .2), V(.12, lerp(.9, 1.35, up), .45)], tilt: f > T && f < T + .6 ? .2 : 0, arms: [[-.6, .4, .2], [.6, .4, .2]] }, 0, 0, -1.3, 0);
    s.updateMatrixWorld(true); if (up > .05) cn.position.copy(s.localToWorld(V(.12, 1.42, .5))); else cn.position.set(.3, 1.02, -.5); cn.rotation.set(Math.PI / 2 * up, 0, 0);
    path(cam, f, [[0, .4, 1.5, 1.2, 0, 1.3, -1.0], [fd, .25, 1.45, .9, 0, 1.25, -1.0]]); } }; });
// 7 "But thousands of people were doing it." - the whole street: in every doorway, someone snipping. Crane up and up
shot(17.6, 20.4, () => { const L = london('dusk'), cam = newCam(60), sn = [];
  for (let i = 0; i < 14; i++) { const s = i % 2 ? 1 : -1, z = 2 - Math.floor(i / 2) * 3.3, n = staticNoodle(L.scene, { ...crowdOpt(i), tag: null, hat: ['tricorn', 'cap', null, 'tricorn'][i % 4], hatColor: [0x24222c, 0x6a4a2a, 0, 0x5a2a2a][i % 4], robe: PAL[(i + 4) % 10], hands: [V(-.1, 1.0, .4), V(.12, 1.0, .4)] }, s * 2.0, z, -s * Math.PI / 2, .8); const shr = shears(); shr.scale.setScalar(.6); shr.position.set(s * 1.65, .85, z); shr.rotation.y = -s * Math.PI / 2; L.scene.add(shr); sn.push(shr); }
  return { scene: L.scene, cam, update(f, fd, t) { setSun(L, 0, -6); sn.forEach((s, i) => s.userData.open(Math.max(0, Math.sin(t * 9 + i)))); path(cam, f, [[0, 0, 1.4, 4.0, 0, 1.0, -2], [fd, 0, 7.5, 6.0, 0, .5, -12]]); } }; });
// 8 "England's money was literally shrinking." - the royal treasury: the coins in the chest shrink... and shrink; the treasurer's face falls
shot(20.4, 23.2, () => { const R = darkRoom(0x3a3050, .6), cam = newCam(54), ch = new THREE.Group(); R.scene.add(ch); ch.add(at3(box(1.2, .6, .7, 0x6a3a22), 0, .3, 0)); ch.add(at3(box(1.24, .06, .74, 0xffc83a, .006), 0, .6, 0)); const cs = coinPile(R.scene, 0, .62, 0, 30, 3); const big = makeCoin('plain', .16, .03); R.scene.add(big); const L2 = new THREE.PointLight(0xffd8a0, 5, 5); L2.position.set(0, 2, 1); R.scene.add(L2);
  return { scene: R.scene, cam, update(f, fd, t) { const k = 1 - ss(0, fd, f) * .55; cs.forEach(c => c.scale.setScalar(k)); big.scale.setScalar(k);
    const tr = place(R.scene, { ...SHOP, robe: 0x3a3a6a, ...fx(f, [[0, 'smile'], [.7, 'shock'], [1.4, 'sad'], [2.1, 'scream']]), hands: [V(-.3, .9, .2), V(.15, 1.35, .45)] }, .2, 0, -.9, 0); tr.updateMatrixWorld(true); big.position.copy(tr.localToWorld(V(.15, 1.45, .55))); big.rotation.set(Math.PI / 2, 0, 0);
    path(cam, f, [[0, .9, 1.4, 1.6, .1, 1.0, -.4], [fd, .6, 1.5, 1.2, .1, 1.2, -.6]]); } }; });
// 9 "So the government called in the smartest man in the country." - the king, red-faced on his throne, jabbing a finger; a messenger sprints off with a scroll
shot(23.2, 26.8, () => { const R = room(0xa83a3a), cam = newCam(58), th = new THREE.Group(), scroll = inked(new THREE.CylinderGeometry(.05, .05, .35, 8), 0xfff2d8, .006); R.scene.add(th, scroll); th.position.set(0, 0, -2.0); th.add(at3(box(1.1, .5, .8, 0xffc83a), 0, .25, 0)); th.add(at3(box(1.1, 1.8, .2, 0xffc83a), 0, 1.1, -.35)); th.add(at3(box(.9, .5, .7, 0xc8323a), 0, .55, 0));
  return { scene: R.scene, cam, update(f, fd, t) { place(R.scene, { ...KING, ...fx(f, [[0, 'angry'], [.8, 'scream'], [1.6, 'angry'], [2.4, 'determined']]), sit: true, arms: [[-.4, .2, .2], [.35, .55 + Math.sin(t * 10) * .12, .75]] }, 0, .05, -1.95, 0);
    const k = clamp((f - .6) / (fd - .6)); const m = walkTo(R.scene, { ...BAKER, hat: null, robe: 0x3a6ad8, ...EX.shock, lean: .35, hands: [V(-.25, .9, .3), V(.25, 1.0, .35)] }, .9, -1.2, 3.0, 2.5, k, t, Math.atan2(2.1, 3.7)); m.updateMatrixWorld(true); scroll.position.copy(m.localToWorld(V(.25, 1.0, .45))); scroll.rotation.z = Math.PI / 2;
    path(cam, f, [[0, -.6, .7, 2.0, 0, 1.4, -1.9], [fd, -1.2, .7, 2.4, .6, 1.2, -.5]]); } }; });
// 10 "Isaac Newton." - his study by moonlight: papers, a telescope, an apple... he turns to camera. Low angle. Light shaft.
shot(26.8, 28.1, () => { const R = darkRoom(0x2a3a5a, .55), cam = newCam(54); tableP(R.scene, .5, -.9, 1.4, .8); const ap = inked(new THREE.SphereGeometry(.07, 10, 8), 0xe8323a, .006); ap.position.set(.9, .89, -.8); R.scene.add(ap); for (let i = 0; i < 5; i++) { const p = at3(new THREE.Mesh(new THREE.PlaneGeometry(.25, .32), flat(0xfff6e0)), .2 + i * .12, .83, -.9 + (i % 2) * .1); p.rotation.set(-Math.PI / 2, 0, i * .4); R.scene.add(p); }
  const tel = new THREE.Group(); tel.position.set(-1.4, 0, -1.8); R.scene.add(tel); tel.add(at3(box(.05, 1.3, .05, 0x5a3a22, .006), 0, .65, 0)); const tube = inked(new THREE.CylinderGeometry(.07, .1, 1.0, 12), 0xc8a050, .01); tube.position.set(0, 1.4, 0); tube.rotation.z = -.7; tel.add(tube);
  const sh_ = beam(R.scene, 0xb8d0ff, .7, 5); const c_ = candle(R.scene, .1, .82, -1.0, 2.5);
  return { scene: R.scene, cam, update(f, fd, t) { flick(c_, t); sh_.aim(V(-1.5, 3.8, -1.0), V(.2, 0, -.4), .8); const k = ss(0, .6, f); place(R.scene, { ...NEWT, ...fx(f, [[0, 'deadpan'], [.5, 'determined']]), arms: [[-.4, .1, .2], [.4, .2, .3]] }, .2, 0, -.4, lerp(-1.6, 0, k));
    path(cam, f, [[0, .6, .45, 1.6, .2, 1.4, -.4], [fd, .4, .4, 1.3, .2, 1.5, -.4]]); } }; });
// 11 "The coin gangs laughed." - the tavern: three crooks howling, slapping the table, mugs jumping
shot(28.1, 30.8, () => { const T = tavern(), cam = newCam(58);
  return { scene: T.scene, cam, update(f, fd, t) { T.fire.intensity = 6 + Math.sin(t * 9) * 1.5; T.mugs.forEach((m, i) => m.position.y = .9 + Math.max(0, Math.sin(t * 14 + i)) * .05);
    GANG.forEach((o, i) => place(T.scene, { ...o, ...fx(f, [[0, 'smug'], [.3 + i * .1, 'laugh'], [1.4, 'happy'], [1.9, 'laugh']]), nod: Math.sin(t * 16 + i) * .1, arms: [[-.45, .5 + Math.max(0, Math.sin(t * 12 + i)) * .3, .35], [.45, .45, .35]] }, -.9 + i * .6, 0, -1.45 + (i === 1 ? -.1 : 0), 0));
    path(cam, f, [[0, -.3, 1.4, 1.5, -.3, 1.2, -1.2], [fd, .2, 1.35, 1.2, -.3, 1.25, -1.3]]); } }; });
// 12 "What's a science guy gonna do? Calculate us?" - the leader, dutch angle, lip sync, doing fake math in the air
shot(30.8, 34.7, () => { const T = tavern(), cam = newCam(50);
  return { scene: T.scene, cam, update(f, fd, t) { T.fire.intensity = 6 + Math.sin(t * 9) * 1.5; const m = talkIf(t, 30.85, 34.45); const g = place(T.scene, { ...GANG[0], ...fx(f, [[0, 'smug'], [at(30.8, 33.33), 'happy'], [at(30.8, 34.28), 'laugh']]), mouth: m || undefined, arms: [[-.4, .3, .3], [.45 + Math.sin(t * 7) * .15, .9 + Math.cos(t * 9) * .1, .4]] }, -.6, 0, -1.45, .2);
    GANG.slice(1).forEach((o, i) => place(T.scene, { ...o, ...EX.laugh }, .1 + i * .6, 0, -1.6, -.2)); faceCam(cam, g, 1.5, .35, .0, -.1); cam.rotation.z -= .18; } }; });
// 13 "Newton put on disguises," - at the mirror: beard + tricorn... eye patch + cap... huge mustache... (snap, snap, snap)
shot(34.7, 38.1, () => { const R = darkRoom(0x2a3a5a, .7), cam = newCam(52), mir = new THREE.Group(); R.scene.add(mir); mir.position.set(0, 0, -2.6); mir.add(at3(box(1.2, 1.8, .1, 0xc8a050, .012), 0, 1.3, 0)); mir.add(at3(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.6), flat(0x8aa8c8)), 0, 1.3, .06)); candle(R.scene, -.8, 0, -2.2, 2.5);
  const DS = [{ wig: true }, { wig: false, hat: 'tricorn', beard: true }, { wig: false, hat: 'cap', hatColor: 0x6a4a2a, patch: true }, { wig: false, mustache: true, hat: 'top' }, { wig: false, hat: 'pioneer', beard: 0xc8c8c8, patch: true }];
  return { scene: R.scene, cam, update(f, fd, t) { const i = Math.min(DS.length - 1, Math.floor(f / (fd / DS.length))), lf = f % (fd / DS.length); const g = place(R.scene, { ...NEWT, ...DS[i], ...EX[['deadpan', 'smug', 'determined', 'happy', 'shock'][i]], squash: lf < .2 ? -.12 * Math.exp(-lf * 12) : 0 }, 0, 0, -1.3, Math.PI);
    path(cam, f, [[0, .25, 1.25, -2.45, 0, 1.15, -1.3], [fd, .15, 1.2, -2.3, 0, 1.15, -1.3]]); } }; });
// 14 "...went undercover in taverns, and listened." - glide past the bragging gang to the next table: a "stranger" in a tricorn, leaning way too far in, hand cupped to his ear
shot(38.1, 40.4, () => { const T = tavern(), cam = newCam(56);
  return { scene: T.scene, cam, update(f, fd, t) { T.fire.intensity = 6 + Math.sin(t * 9) * 1.5; GANG.forEach((o, i) => place(T.scene, { ...o, ...fx(f + i * .3, [[0, 'laugh'], [.8, 'smug'], [1.5, 'happy']]), arms: [[-.45, .4, .35], [.45, .6 + Math.sin(t * 8 + i) * .2, .35]] }, -.9 + i * .6, 0, -1.45, 0));
    place(T.scene, { ...NEWT, ...DS_U, ...fx(f, [[0, 'deadpan'], [1.1, 'determined']]), lean: .35, bend: -.35, hands: [V(-.3, .9, .2), V(-.3, 1.55, .05)] }, 1.9, 0, -.05, -1.9);
    path(cam, f, [[0, -.4, 1.4, 1.2, -.4, 1.2, -1.3], [fd, 2.6, 1.4, 1.6, 1.6, 1.25, -.2]]); } }; });
const DS_U = { wig: false, hat: 'tricorn', beard: true };
// 15 "Then came the real fix: new coins with ridges" - the Royal Mint: a giant screw press, workers heave the bar round... THUNK. A ridged coin pops out
shot(40.4, 43.3, () => { const R = room(0x6a6a78), cam = newCam(56), pr = new THREE.Group(); R.scene.add(pr); pr.position.set(0, 0, -1.4); for (const x of [-.6, .6]) pr.add(at3(box(.25, 2.2, .3, 0x3a3a44), x, 1.1, 0)); pr.add(at3(box(1.5, .3, .35, 0x3a3a44), 0, 2.25, 0)); const scr = new THREE.Group(); scr.position.y = 1.6; pr.add(scr); scr.add(inked(new THREE.CylinderGeometry(.09, .09, 1.2, 10), 0x9a9aa8, .008)); const bar = new THREE.Group(); bar.position.y = .55; scr.add(bar); bar.add(at3(box(2.4, .07, .07, 0x5a3a22, .006), 0, 0, 0)); for (const x of [-1.2, 1.2]) bar.add(at3(inked(new THREE.SphereGeometry(.13, 10, 8), 0x3a3a44, .008), x, 0, 0)); pr.add(at3(box(.6, .5, .5, 0x3a3a44), 0, .25, 0));
  const nc = makeCoin('ridged', .12, .025); R.scene.add(nc); const T = at(40.4, 42.81);
  return { scene: R.scene, cam, update(f, fd, t) { const k = ss(0, T, f); scr.rotation.y = k * 6; scr.position.y = 1.6 - k * .45; const pop = f > T; nc.visible = pop; nc.position.set(0, .52 + (pop ? Math.sin(clamp((f - T) * 3) * Math.PI) * .5 : 0), -1.2); nc.rotation.set(f * 3, 0, 0);
    for (const s of [-1, 1]) place(R.scene, { ...crowdOpt(s > 0 ? 2 : 5), tag: null, robe: 0x5a4a3a, ...fx(f, [[0, 'determined'], [T, 'happy']]), lean: .3, hands: [V(-.15, 1.75, .45), V(.15, 1.75, .45)] }, s * 1.5, 0, -1.4 + s * .2, -s * Math.PI / 2);
    path(cam, f, [[0, -.8, .8, 2.4, 0, 1.4, -1.4], [T, .4, 1.0, 1.6, 0, .9, -1.3], [fd, .2, .8, .3, 0, .55, -1.2]]); if (f > T && f < T + .2) shake(cam, t, .04); } }; });
// 16 "...stamped all around the edge." - macro: a ridged coin rolls slowly on its edge in the dark, rim light raking the ridges
shot(43.3, 46.0, () => { const S = studio(0x16121e), cam = newCam(40), cn = makeCoin('ridged', .35, .07); S.scene.add(cn); S.scene.children.forEach(o => { if (o.isHemisphereLight) o.intensity = .5; if (o.isDirectionalLight) o.intensity = .6; }); const rim = new THREE.PointLight(0xfff2d8, 3, 4); rim.position.set(.8, .8, -.4); S.scene.add(rim);
  return { scene: S.scene, cam, update(f, fd, t) { cn.position.set(0, .36, 0); cn.rotation.set(Math.PI / 2, f * .9, 0); path(cam, f, [[0, .9, .45, .6, 0, .36, 0], [fd, .55, .38, .45, 0, .36, 0]]); } }; }, { xf: true });
// 17 "Shave off even a sliver, and the ridges vanish." - snip... and there's a smooth bald patch where the ridges were. Push in on it
shot(46.0, 49.8, () => { const S = studio(0x16121e), cam = newCam(42), a = makeCoin('ridged', .35, .07), b = makeCoin('ridgedCut', .35, .07), sh = shears(); S.scene.add(a, b, sh); sh.scale.setScalar(1.6); S.scene.children.forEach(o => { if (o.isHemisphereLight) o.intensity = .5; if (o.isDirectionalLight) o.intensity = .6; }); const rim = new THREE.PointLight(0xfff2d8, 3, 4); rim.position.set(.6, 1.0, .6); S.scene.add(rim); const T = at(46.0, 47.18);
  const gl = new THREE.Mesh(new THREE.TorusGeometry(.12, .012, 6, 20), flat(0xff3a3a)); S.scene.add(gl);
  return { scene: S.scene, cam, update(f, fd, t) { a.visible = f < T; b.visible = f >= T; for (const c of [a, b]) { c.position.set(0, .02, 0); c.rotation.y = .3; } sh.position.set(.42, .1, -.2); sh.rotation.set(0, -1.0, 0); sh.userData.open(f < T ? Math.max(0, Math.sin(f * 7)) : .9); sh.visible = f < T + .4;
    gl.visible = f > at(46.0, 48.22); gl.position.set(Math.cos(-.4 - .3) * .3 * 1, .1, -Math.sin(-.4 - .3) * .3); gl.rotation.x = -Math.PI / 2; gl.scale.setScalar(pop(f - at(46.0, 48.22)));
    path(cam, f, [[0, .1, 1.0, .9, 0, 0, 0], [T + .4, .3, .7, .6, .1, 0, .05], [fd, .45, .35, .45, .22, .05, .18]]); } }; });
// 18 "One look, and you know it's been cut." - the shopkeeper's magnifying glass... his eyes go from the coin to the crook. The crook sweats.
shot(49.8, 52.4, () => { const R = room(0xe8d8b8), cam = newCam(52), mag = new THREE.Group(), cn = makeCoin('ridgedCut', .07, .014); R.scene.add(mag, cn); mag.add(inked(new THREE.TorusGeometry(.09, .015, 6, 16), 0x5a3a22, .004)); mag.add(new THREE.Mesh(new THREE.CircleGeometry(.085, 16), new THREE.MeshBasicMaterial({ color: 0xc8f0ff, transparent: true, opacity: .35 }))); mag.add(at3(box(.03, .18, .03, 0x5a3a22, .004), 0, -.17, 0)); R.scene.add(at3(box(2.4, 1.0, .7, 0x8a5a3a), 0, .5, -.6)); const T = at(49.8, 51.01);
  return { scene: R.scene, cam, update(f, fd, t) { const s = place(R.scene, { ...SHOP, ...fx(f, [[0, 'determined'], [T, 'angry']]), turn: f > T ? .5 : 0, hands: [V(-.12, 1.3, .45), V(.15, 1.32, .5)] }, -.4, 0, -1.3, .3); s.updateMatrixWorld(true); cn.position.copy(s.localToWorld(V(-.12, 1.32, .5))); cn.rotation.set(Math.PI / 2, 0, 0); mag.position.copy(s.localToWorld(V(.12, 1.42, .52))); mag.rotation.y = .3;
    const c = place(R.scene, { ...CLIP, ...fx(f, [[0, 'smile'], [T + .1, 'shock'], [T + .6, 'scream']]), tears: f > T + .4 }, 1.0, 0, .3, -2.2);
    path(cam, f, [[0, -.6, 1.4, .5, -.4, 1.35, -1.0], [fd, .2, 1.45, 1.6, .3, 1.3, -.4]]); } }; });
// 19 "That's why your quarter still has ridges today." - snap to TODAY: a bright kitchen, a kid flips a quarter... it lands; macro on the ridged edge
shot(52.4, 55.8, () => { const R = room(0xeaf4ff), cam = newCam(54), q = makeCoin('ridged', .1, .02, 'new'); R.scene.add(q); tableP(R.scene, 0, -.6, 1.4, .8, 0xf2f2f2); const T = at(52.4, 53.99);
  return { scene: R.scene, cam, update(f, fd, t) { const up = clamp(f / 1.1), y = .84 + Math.sin(up * Math.PI) * .7; q.position.set(.1, f < 1.1 ? y : .84, -.5); q.rotation.set(f < 1.1 ? f * 20 : 0, 0, 0);
    place(R.scene, { ...KIDM, ...fx(f, [[0, 'happy'], [1.1, 'shock'], [1.6, 'smile']]), arms: [[-.4, .2, .3], [.35, .5, .6]] }, 0, 0, -1.4, 0);
    path(cam, f, [[0, .6, 1.5, 1.2, .1, 1.2, -.5], [1.2, .5, 1.3, .9, .1, .9, -.5], [fd, .3, .9, -.25, .1, .85, -.5]]); } }; });
// 20 "And the gangs who laughed at Newton? They ended up in prison." - behind the bars, three very sorry crooks; Newton outside, adjusting his wig
shot(55.8, 60.1, () => { const R = darkRoom(0x5a5a64, .6), cam = newCam(56); for (let i = 0; i < 14; i++) R.scene.add(at3(inked(new THREE.CylinderGeometry(.035, .035, 2.6, 8), 0x3a3a44, .006), -2.2 + i * .34, 1.3, -.4)); R.scene.add(at3(box(5, .12, .12, 0x3a3a44, .006), 0, 2.4, -.4)); const L_ = new THREE.PointLight(0xffd8a0, 4, 5); L_.position.set(1.4, 2.2, .6); R.scene.add(L_); const T = at(55.8, 59.29);
  return { scene: R.scene, cam, update(f, fd, t) { GANG.forEach((o, i) => place(R.scene, { ...o, ...fx(f, [[0, 'sad'], [T, 'cry']]), hands: [V(-.25, 1.25, .35), V(.25, 1.25, .35)] }, -1.3 + i * .75, 0, -1.0, 0));
    place(R.scene, { ...NEWT, ...fx(f, [[0, 'smug'], [T, 'happy']]), hands: [V(-.3, .9, .2), V(.3, 1.85, .05)] }, 1.6, 0, .6, -.8); path(cam, f, [[0, -.4, 1.4, 2.6, -.4, 1.3, -1.0], [fd, .6, 1.5, 3.0, .2, 1.3, -.4]]); } }; });
// 21 "All except one... a man in London who got rich-" - foggy night street: the first crook slips away with his purse, glances back at us, smirks... crane up to the rooftops (loops to the start)
shot(60.1, 999, () => { const L = london('dusk'), cam = newCam(62), purse = inked(new THREE.SphereGeometry(.14, 10, 8), 0x8a6a3a, .01); L.scene.add(purse);
  return { scene: L.scene, cam, update(f, fd, t) { setSun(L, 0, -4); const k = clamp(f / fd); const look_ = f > at(60.1, 61.05) && f < at(60.1, 62.6); const g = walkTo(L.scene, { ...CLIP, ...fx(f, [[0, 'smug'], [at(60.1, 61.05), 'happy']]), turn: look_ ? 2.6 : 0, arms: [[-.4, -.1, .1], [.35, .1, .35]] }, .2, -3.4, .2, -7.5, k, t, Math.PI); g.updateMatrixWorld(true); purse.position.copy(g.localToWorld(V(.35, .82, .4)));
    path(cam, f, [[0, .4, 1.5, -.6, .2, 1.1, -3.8], [fd, 0, 7.5, 3.0, 0, 3.0, -12]]); } }; });
