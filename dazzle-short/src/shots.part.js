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

const vl = (a, b, k) => a.clone().lerp(b, k);
// ===================== HOW ZEBRA STRIPES PROTECTED WARSHIPS: 1917 =====================
const WILK = { color: 0xffd8b0, hat: 'beret', hatColor: 0xc8323a, mustache: true, robe: 0x3a5a8a, shoe: 0x2a1a12 };
const ADM = [{ color: 0xffc8a0, hat: 'mail', badge: true, epaulets: true, mustache: true, robe: 0x1a2448, beltColor: 0xffc83a }, { color: 0xe8b890, hat: 'mail', badge: true, epaulets: true, beard: 0xd8d8d8, robe: 0x1a2448, beltColor: 0xffc83a }, { color: 0xffd8c0, hat: 'mail', badge: true, epaulets: true, glasses: true, robe: 0x1a2448, beltColor: 0xffc83a }];
const CAPT = { color: 0xd8d0c0, hat: 'cap', hatColor: 0xf2f2f2, beard: 0x8a6a4a, robe: 0x2a2a30 };
const SAILOR = (i) => ({ color: PAL[(i * 3 + 2) % 10], hat: 'cap', hatColor: 0xffffff, robe: 0x1a2448 });
// ---- dazzle paint: bold black / white / blue slashes, zigzags and swirls (seeded so every ship differs) ----
function dazzleT(seed = 1, stage = 3) { return ctex(512, 256, g => { const r = rng(seed); g.fillStyle = '#e8ecf2'; g.fillRect(0, 0, 512, 256); const cols = ['#16121e', '#2a4a8a', '#6a8ac8', '#16121e'];
  if (stage >= 1) for (let i = 0; i < 9; i++) { g.fillStyle = cols[i % 4]; const x = i * 64 - 40 + r() * 20, w = 22 + r() * 28; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w + 120, 256); g.lineTo(x + 120, 256); g.fill(); }
  if (stage >= 2) { g.fillStyle = '#16121e'; g.beginPath(); g.moveTo(0, 150); for (let x = 0; x <= 512; x += 32) g.lineTo(x, (x / 32) % 2 ? 110 : 170); g.lineTo(512, 200); for (let x = 512; x >= 0; x -= 32) g.lineTo(x, ((x / 32) % 2 ? 140 : 200)); g.fill(); }
  if (stage >= 3) { g.strokeStyle = '#e8ecf2'; g.lineWidth = 18; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(90 + i * 160, 70 + r() * 40, 40 + r() * 20, 0, 4.2); g.stroke(); } } }); }
const GRAY = 0x8a929e;
function makeShip(paint = null, o = {}) {   // a little low-poly 1917 warship, bow toward +x; `paint` = dazzle texture or null for battleship gray
  const g = new THREE.Group(), m = c => toon(paint ? 0xffffff : c, paint || null), part = (geo, c, x, y, z) => { const me = new THREE.Mesh(geo, m(c)); me.position.set(x, y, z); me.castShadow = true; g.add(me); g.add(at3(new THREE.Mesh(geo, inkMat(.02)), x, y, z)); return me; };
  part(new THREE.BoxGeometry(5.2, .7, 1.0), GRAY, 0, .35, 0); const bowS = new THREE.Shape(); bowS.moveTo(0, -.5); bowS.lineTo(1.3, 0); bowS.lineTo(0, .5); bowS.closePath(); const bowG = new THREE.ExtrudeGeometry(bowS, { depth: .7, bevelEnabled: false }); bowG.rotateX(-Math.PI / 2); bowG.translate(2.6, 0, 0); part(bowG, GRAY, 0, 0, 0);
  g.add(at3(new THREE.Mesh(new THREE.BoxGeometry(6.6, .06, 1.02), flat(0x5a3a3a)), .5, .03, 0));
  part(new THREE.BoxGeometry(1.6, .5, .7), GRAY, .3, .95, 0); part(new THREE.BoxGeometry(.8, .45, .6), GRAY, .6, 1.42, 0);
  for (const x of [-.5, -1.1]) { const f = part(new THREE.CylinderGeometry(.16, .18, .9, 12), GRAY, x, 1.4, 0); f.rotation.z = .12; }
  g.add(at3(box(.05, 1.6, .05, 0x3a3a44, .006), 1.0, 1.9, 0)); g.add(at3(box(.05, 1.1, .05, 0x3a3a44, .006), -2.0, 1.25, 0));
  for (const x of [1.9, -2.0]) { part(new THREE.CylinderGeometry(.28, .3, .22, 12), GRAY, x, .82, 0); g.add(at3(box(.7, .07, .07, 0x3a3a44, .006), x + (x > 0 ? .4 : -.4), .86, 0)); }
  return g; }
// ---- the sea: a big plane with drifting wave streaks, a stormy sky ----
const waveT = ctex(64, 64, g => { g.fillStyle = '#3a5a78'; g.fillRect(0, 0, 64, 64); const r = rng(5); for (let i = 0; i < 26; i++) { g.fillStyle = r() < .5 ? '#5a7a98' : '#2e4a66'; g.fillRect(r() * 64, r() * 64, 6 + r() * 12, 1.5); } }, [24, 24]);
function sea(mode = 'day') { const scene = new THREE.Scene(), dark = mode === 'storm';
  scene.background = ctex(8, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, dark ? '#3a4458' : '#6a8ab0'); gr.addColorStop(.7, dark ? '#7a8496' : '#b8c8d8'); gr.addColorStop(1, dark ? '#a8aab4' : '#e8eef4'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); });
  scene.fog = new THREE.Fog(dark ? 0x8a8c98 : 0xc8d4e0, 14, 70); scene.add(new THREE.HemisphereLight(0xdce8ff, 0x3a5a78, 1.3)); const sun = new THREE.DirectionalLight(0xfff2e0, 1.6); sun.position.set(6, 12, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 }); scene.add(sun, sun.target);
  const wt = waveT.clone(); wt.needsUpdate = true; wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(30, 30); const w = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), toon(0xffffff, wt)); w.rotation.x = -Math.PI / 2; w.receiveShadow = true; scene.add(w);
  return { scene, sun, tick(t) { wt.offset.set(t * .01, t * .02); } }; }
const bob = (s, t, ph = 0) => { s.position.y = Math.sin(t * 1.3 + ph) * .05 - .15; s.rotation.x = Math.sin(t * 1.1 + ph) * .025; s.rotation.z = Math.sin(t * .9 + ph) * .015; };
function wake(scene, n = 14) { const ps = [...Array(n)].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), flat(0xf2f6fa)); m.scale.y = .3; scene.add(m); return m; }); return { at(p, dir, t) { ps.forEach((m, i) => { const q = ((t * .8 + i / n) % 1); m.position.set(p.x - dir.x * (1 + q * 6) + Math.sin(i * 3) * q * .6, .02, p.z - dir.z * (1 + q * 6) + Math.cos(i * 2) * q * .6); m.scale.set(1 + q * 2, .3, 1 + q * 2); }); } }; }
function torpedo(scene) { const g = new THREE.Group(); g.add(inked(new THREE.CapsuleGeometry(.07, .5, 4, 8), 0x5a5a64, .006)); g.children[0].rotation.z = Math.PI / 2; scene.add(g); const tr = [...Array(16)].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 5), flat(0xffffff)); m.scale.y = .4; scene.add(m); return m; });
  return { g, run(a, b, k, show = true) { g.visible = show && k > 0 && k < 1; const p = vl(a, b, clamp(k)); g.position.copy(p); g.position.y = -.05; g.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x); tr.forEach((m, i) => { const q = clamp(k - i * .03); m.visible = show && k > 0 && q > 0; m.position.copy(vl(a, b, q)); m.position.y = .02; }); } }; }
function blast(scene) { const fl = new THREE.Mesh(new THREE.SphereGeometry(.6, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffa83a, transparent: true })); scene.add(fl); const sm = [...Array(10)].map(() => { const m = inked(new THREE.SphereGeometry(.4, 8, 6), 0x3a3a40, .01, null, true); scene.add(m); return m; });
  return { at(p, f) { fl.visible = f > 0 && f < .6; fl.position.copy(p); fl.scale.setScalar(1 + f * 5); fl.material.opacity = 1 - f / .6; sm.forEach((m, i) => { m.visible = f > .1; m.position.set(p.x + Math.sin(i * 2.1) * .5, p.y + f * (1 + i * .25), p.z + Math.cos(i * 1.7) * .4); m.scale.setScalar(.5 + f * .6); }); } }; }
function dock() { const S = sea('day'); S.scene.add(at3(box(16, .4, 4, 0x8a6a4a, .02), 0, .2, 3.4)); for (let i = 0; i < 10; i++) S.scene.add(at3(box(.15, 1.5, .15, 0x6a4a2a, .008), -7 + i * 1.6, -.4, 1.5)); return S; }
function scaffold(sc, x0, x1, z, h = 2.4) { for (let x = x0; x <= x1 + .01; x += 1.2) sc.add(at3(box(.06, h, .06, 0x8a6a3a, .006), x, h / 2, z)); for (const y of [.9, 1.8]) sc.add(at3(box(x1 - x0 + .2, .06, .4, 0x9a7a4a, .006), (x0 + x1) / 2, y, z)); }
function admiralty() { const R = room(0x3a4a6a); const tb = tableP(R.scene, 0, -.4, 2.2, 1.2, 0x5a3a22); const map = card(2.0, 1.0, (g, w, h) => { g.fillStyle = '#c8d8e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#9ab89a'; g.beginPath(); g.ellipse(w * .3, h * .4, w * .12, h * .3, .4, 0, 7); g.fill(); g.strokeStyle = '#5a6a7a'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } }, 256); map.rotation.x = -Math.PI / 2; map.position.set(0, .83, -.4); R.scene.add(map);
  for (const [x, c] of [[-1.6, '#8a6a4a'], [1.6, '#6a5a7a']]) { const p = card(.7, .9, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd8b0'; g.beginPath(); g.arc(w / 2, h * .4, w * .22, 0, 7); g.fill(); g.strokeStyle = '#ffc83a'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); }, 128); p.position.set(x, 2.0, -2.88); R.scene.add(p); } return R; }
function subInside() { const R = room(0x3a2a2a); R.scene.children.filter(o => o.isHemisphereLight || o.isDirectionalLight).forEach(l => l.intensity *= .3); const red = new THREE.PointLight(0xff3a2a, 9, 8); red.position.set(0, 2.4, 0); R.scene.add(red);
  for (let i = 0; i < 6; i++) { const pp = at3(inked(new THREE.CylinderGeometry(.06, .06, 6, 8), 0x5a5a64, .006), -2.4 + i * .3, 2.6, -1.0); pp.rotation.x = Math.PI / 2; R.scene.add(pp); }
  for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(.12, 14), flat(0xf2e8c8)); d.position.set(-2.2 + i * .35, 1.6, -2.88); R.scene.add(d); }
  const per = new THREE.Group(); per.position.set(0, 0, -.4); R.scene.add(per); per.add(at3(inked(new THREE.CylinderGeometry(.11, .11, 3.2, 12), 0x6a6a74, .01), 0, 1.6, 0)); const eye = new THREE.Group(); per.add(eye); eye.add(at3(box(.34, .2, .3, 0x5a5a64, .01), 0, 0, .1)); for (const s of [-1, 1]) eye.add(at3(box(.06, .06, .3, 0x3a3a44, .006), s * .22, -.05, .1));
  return { scene: R.scene, per, eye, red }; }
const qmark = (sc) => { const s = sprite('?', '#ffd23a', .9, 150); sc.add(s); return s; };

// ===================== SHOTS (voiceover clock) =====================
const OPEN = [[0, 9, 2.0, 9, 0, 1.0, 0], [5.6, 4.5, 1.5, 5.5, .2, .9, 0]];
// 1 "In 1917, a painter convinced the British Navy to paint their warships... like zebras." - a gray warship on a gray sea; on "zebras", the stripes snap on
shot(0, 6.4, () => { const S = sea('storm'), cam = newCam(55), plain = makeShip(), dz = makeShip(dazzleT(1)), wk = wake(S.scene); S.scene.add(plain, dz); const TZ = at(0, 5.31);
  return { scene: S.scene, cam, update(f, fd, t) { S.tick(t); [plain, dz].forEach(s => { bob(s, t); s.position.x = -1.5 + f * .35; }); plain.visible = f < TZ; dz.visible = f >= TZ; dz.scale.setScalar(f >= TZ ? 1 + .08 * Math.exp(-(f - TZ) * 10) : 1); wk.at(plain.position, V(1, 0, 0), t);
    path(cam, f, [[0, ...OPEN[0].slice(1)], [fd, 4.5, 1.6, 5.8, .3 + f * .35 - 2, .9, 0]]); } }; });
// 2 "Giant black and white stripes. Zigzags. Swirls. On battleships." - the dock: painters on scaffolding, the hull filling with stripes... zigzags... swirls
shot(6.4, 12.3, () => { const S = dock(), cam = newCam(56), T = [at(6.4, 6.55), at(6.4, 8.81), at(6.4, 9.78)], ships = [0, 1, 2, 3].map(st => { const s = makeShip(st ? dazzleT(2, st) : null); s.position.set(0, -.2, -.4); s.scale.setScalar(1.25); S.scene.add(s); return s; }); scaffold(S.scene, -3.2, 3.2, .45);
  const brushes = [];
  return { scene: S.scene, cam, update(f, fd, t) { S.tick(t); const st = f < T[0] ? 0 : f < T[1] ? 1 : f < T[2] ? 2 : 3; ships.forEach((s, i) => s.visible = i === st);
    for (let i = 0; i < 4; i++) place(S.scene, { ...SAILOR(i), hat: i === 1 ? 'beret' : 'cap', hatColor: i === 1 ? 0xc8323a : 0xffffff, ...fx(f + i * .3, [[0, 'determined'], [1.2, 'happy'], [2.4, 'smile']]), hands: [V(-.2, .9, .2), V(.15, 1.15 + Math.sin(t * 8 + i) * .2, .45)] }, -2.6 + i * 1.7, i % 2 ? .95 : 0, .9, Math.PI);
    path(cam, f, [[0, -3.6, 1.8, 4.6, -2.2, 1.0, -.2], [fd, 3.6, 2.0, 4.8, 2.2, 1.0, -.2]]); } }; });
// 3a "The admirals laughed." - the admiralty: three admirals howling over the map table
shot(12.3, 14.0, () => { const R = admiralty(), cam = newCam(58); const dsk = makeShip(dazzleT(3)); dsk.scale.setScalar(.12); dsk.position.set(.2, .84, -.4); R.scene.add(dsk);
  return { scene: R.scene, cam, update(f, fd, t) { ADM.forEach((o, i) => place(R.scene, { ...o, ...fx(f + i * .2, [[0, 'shock'], [.25, 'laugh'], [1.0, 'happy']]), nod: Math.sin(t * 14 + i) * .1, arms: [[-.45, .5 + Math.max(0, Math.sin(t * 12 + i)) * .3, .35], [.45, .4, .35]] }, -1.0 + i * 1.0, 0, -1.25, 0));
    path(cam, f, [[0, 0, 1.6, 2.6, 0, 1.1, -1.0], [fd, .3, 1.5, 2.2, 0, 1.1, -1.0]]); } }; });
// 3b "Son, the point is to HIDE the ship. Not turn it into a circus tent." - the senior admiral (lip sync), dutch angle, jabbing at the striped model
shot(14.0, 19.7, () => { const R = admiralty(), cam = newCam(50); const dsk = makeShip(dazzleT(3)); dsk.scale.setScalar(.12); dsk.position.set(.2, .84, -.4); R.scene.add(dsk);
  return { scene: R.scene, cam, update(f, fd, t) { const m = talkIf(t, 14.05, 19.2); const g = place(R.scene, { ...ADM[0], ...fx(f, [[0, 'smug'], [at(14, 15.75), 'angry'], [at(14, 18.16), 'laugh']]), mouth: m || undefined, arms: [[-.4, .3, .3], [.3, .4 + Math.sin(t * 6) * .1, .7]] }, -.3, 0, -1.2, .4);
    place(R.scene, { ...ADM[1], ...EX.laugh }, 1.0, 0, -1.5, -.4); faceCam(cam, g, 1.6, -.4, .0, -.15); cam.rotation.z += .16; } }; });
// 4 "The painter, Norman Wilkinson, just said, I'm not trying to hide it." - low angle on the painter in his beret, deadpan, brush in hand (lip sync)
shot(19.7, 24.8, () => { const S = dock(), cam = newCam(52), dz = makeShip(dazzleT(1)), br = new THREE.Group(); dz.position.set(-.5, -.2, -1.4); dz.scale.setScalar(1.25); S.scene.add(dz, br); br.add(at3(box(.03, .35, .03, 0x8a5a3a, .004), 0, 0, 0)); br.add(at3(box(.06, .1, .05, 0x16121e, .004), 0, .2, 0));
  return { scene: S.scene, cam, update(f, fd, t) { S.tick(t); const m = talkIf(t, 22.8, 24.15); const g = place(S.scene, { ...WILK, ...fx(f, [[0, 'smile'], [at(19.7, 21.73), 'deadpan'], [at(19.7, 23.59), 'smug']]), mouth: m || undefined, hands: [V(-.3, .9, .2), V(.3, 1.1, .4)] }, .6, .4, 2.6, .35); g.updateMatrixWorld(true); br.position.copy(g.localToWorld(V(.3, 1.25, .45)));
    path(cam, f, [[0, .2, .75, 4.4, .6, 1.6, 2.6], [fd, .3, .7, 4.1, .6, 1.65, 2.6]]); } }; });
// 5 "Back then, German submarines were sinking ships almost every day." - low over the waves: a periscope wake... far off, a gray ship erupts. Then another.
shot(24.8, 30.0, () => { const S = sea('storm'), cam = newCam(54), sh = [makeShip(), makeShip()], bl = [blast(S.scene), blast(S.scene)], per = at3(inked(new THREE.CylinderGeometry(.05, .05, .7, 8), 0x3a3a44, .006), 0, .3, 0), pw = wake(S.scene, 10); S.scene.add(per); sh[0].position.set(-6, -.15, -16); sh[1].position.set(7, -.15, -22); sh.forEach(s => S.scene.add(s)); const TB = [at(24.8, 27.1), at(24.8, 28.5)];
  return { scene: S.scene, cam, update(f, fd, t) { S.tick(t); sh.forEach((s, i) => { bob(s, t, i); const sink = clamp((f - TB[i] - .3) / 2); s.position.y = -.15 - sink * .8; s.rotation.z = sink * .3; bl[i].at(V(s.position.x, .8, s.position.z), f - TB[i]); }); per.position.set(-1 + f * .5, .3, -2); pw.at(per.position, V(1, 0, 0), t);
    path(cam, f, [[0, -2.5, .4, 2.0, 0, .6, -14], [fd, -1.5, .45, 1.6, 1, .7, -16]]); } }; });
// 6 "To hit one, a sub captain had to peek through a tiny periscope," - red-lit control room: the scope rises, he snaps the handles down and peers in
shot(30.0, 34.4, () => { const U = subInside(), cam = newCam(56), T = at(30.0, 32.4);
  return { scene: U.scene, cam, update(f, fd, t) { U.red.intensity = 8 + Math.sin(t * 3) * 1.5; const up = ss(T - .5, T, f); U.per.position.y = lerp(-.6, 0, up); U.eye.position.y = 1.45 + lerp(-.6, 0, up) * 0;
    const g = place(U.scene, { ...CAPT, ...fx(f, [[0, 'determined'], [T + .3, 'smug']]), lean: up * .2, hands: [V(-.24, 1.32, .38), V(.24, 1.32, .38)] }, 0, 0, .1, Math.PI); U.eye.position.set(0, 1.45, 0);
    path(cam, f, [[0, 1.6, 1.3, 1.6, 0, 1.3, -.3], [fd, .9, 1.4, .9, 0, 1.4, -.3]]); } }; });
// 7 "...guess the ship's speed and which way it was heading, and fire the torpedo where the ship was going to be." - SCOPE POV: a plain gray ship; the crosshair leads it... FIRE... the track runs out... BOOM
shot(34.4, 41.4, () => { const S = sea('storm'), cam = newCam(26), s = makeShip(), tp = torpedo(S.scene), bl = blast(S.scene); S.scene.add(s); const TF = at(34.4, 37.85), TH = TF + 2.4;
  return { scene: S.scene, cam, scope: true, update(f, fd, t) { S.tick(t); const x = -6 + f * 1.1; s.position.set(x, -.15, -18); bob(s, t); s.visible = f < TH + .9; const lead = Math.min(f, TF) * .35; const aimX = x + 1.0 + lead * 3;
    tp.run(V(aimX - 4, 0, -4), V(-6 + TH * 1.1 + 1, 0, -18), (f - TF) / (TH - TF)); bl.at(V(s.position.x + 1, .7, -18), f - TH); look(cam, 0, 1.0, 0, Math.min(aimX, -6 + TF * 1.1 + 3.5), .6, -18); } }; });
// 8a "But the stripes broke up the ship's shape." - SCOPE POV again: a dazzle ship... the crosshair can't settle
shot(41.4, 44.4, () => { const S = sea('storm'), cam = newCam(24), s = makeShip(dazzleT(4)); S.scene.add(s);
  return { scene: S.scene, cam, scope: true, update(f, fd, t) { S.tick(t); s.position.set(-1 + f * .5, -.15, -18); s.rotation.y = .5 + Math.sin(f * .7) * .2; bob(s, t); look(cam, 0, 1.0, 0, s.position.x + Math.sin(f * 4) * 1.6 + Math.sin(f * 7.3) * .6, .6, -18); } }; });
// 8b "Which end is the front? Is it turning? How fast is it going?" - the captain, face snapping between confusion on every question
shot(44.4, 49.4, () => { const U = subInside(), cam = newCam(50), qs = [qmark(U.scene), qmark(U.scene), qmark(U.scene)], TQ = [at(44.4, 45.42), at(44.4, 46.67), at(44.4, 48.5)];
  return { scene: U.scene, cam, update(f, fd, t) { U.red.intensity = 8 + Math.sin(t * 3) * 1.5; const g = place(U.scene, { ...CAPT, ...fx(f, [[0, 'determined'], [TQ[0], 'shock'], [TQ[0] + .4, 'sad'], [TQ[1], 'shock'], [TQ[1] + .4, 'angry'], [TQ[2], 'scream']]), tilt: Math.sin(f * 3) * .15, arms: [[-.5, .5, .2], [.5, .5, .2]] }, 0, 0, .1, 0);
    g.updateMatrixWorld(true); qs.forEach((q, i) => { q.position.copy(g.userData.head.localToWorld(V(-.5 + i * .5, .6 + (i % 2) * .15, 0))); q.scale.setScalar(Math.max(.001, .5 * pop(f - TQ[i]))); }); faceCam(cam, g, 1.8, 0, .1, -.05); } }; });
// 9 "Guess even a little wrong... and the torpedo sails right past." - straight down on the sea: the striped ship steams on, the torpedo track slides behind its stern; sailors wave it goodbye
shot(49.4, 53.8, () => { const S = sea('day'), cam = newCam(50), s = makeShip(dazzleT(5)), tp = torpedo(S.scene), wk = wake(S.scene); S.scene.add(s); const TP = at(49.4, 51.4);
  return { scene: S.scene, cam, update(f, fd, t) { S.tick(t); s.position.set(-2 + f * .9, -.15, 0); bob(s, t); wk.at(s.position, V(1, 0, 0), t); tp.run(V(-2.2, 0, 7), V(-2.4, 0, -7), (f - TP + 1.2) / 2.4);
    for (let i = 0; i < 3; i++) { const g = place(S.scene, { ...SAILOR(i), ...fx(f, [[0, 'shock'], [TP + .6, 'happy']]), arms: [[-.5, .3, .1], [.5, .9 + Math.sin(t * 9 + i) * .2, .1]] }, s.position.x - 1.6 + i * .5, .7 + s.position.y, .25, Math.PI); }
    path(cam, f, [[0, -.5, 10, .9, -.5, 0, -.2], [fd, 1.5, 9, .8, 1.0, 0, -.2]]); } }; });
// 10 "It's like trying to tell which way a spinning barber pole is moving." - a barber pole spins; up or down? the barber shrugs
shot(53.8, 58.0, () => { const R = room(0xf2e8d8), cam = newCam(48), bp = new THREE.Group(), bt = ctex(64, 128, g => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 128); for (let i = -2; i < 6; i++) { g.fillStyle = i % 2 ? '#e8323a' : '#2a5ab8'; g.beginPath(); g.moveTo(0, i * 32); g.lineTo(64, i * 32 + 40); g.lineTo(64, i * 32 + 56); g.lineTo(0, i * 32 + 16); g.fill(); } }); bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.set(1, 2);
  R.scene.add(bp); bp.position.set(-.6, 0, -1.2); const pole = inked(new THREE.CylinderGeometry(.16, .16, 1.2, 20), 0xffffff, .01, bt); pole.position.y = 1.4; bp.add(pole); for (const y of [.75, 2.05]) bp.add(at3(inked(new THREE.SphereGeometry(.2, 14, 10), 0xc8ccd8, .01), 0, y, 0));
  return { scene: R.scene, cam, update(f, fd, t) { bt.offset.y = -t * .6; place(R.scene, { ...BARBER, tag: null, ...fx(f, [[0, 'smile'], [1.5, 'shock'], [2.4, 'sad'], [3.2, 'happy']]), arms: f > 2.4 && f < 3.4 ? [[-.6, .5, .2], [.6, .5, .2]] : undefined, turn: Math.sin(f * 2) * .5 }, .6, 0, -1.0, -.4);
    path(cam, f, [[0, -.3, 1.4, 1.2, -.5, 1.4, -1.2], [fd, -.1, 1.3, .7, -.6, 1.4, -1.2]]); } }; });
// 11 "Soon, over two thousand ships were covered in stripes. They called it dazzle camouflage." - crane up over a whole fleet, every ship a different dazzle
shot(58.0, 64.9, () => { const S = sea('day'), cam = newCam(56), fleet = []; for (let i = 0; i < 12; i++) { const s = makeShip(dazzleT(10 + i)); s.position.set((i % 4) * 7 - 10, -.15, -Math.floor(i / 4) * 5 - 2); S.scene.add(s); fleet.push(s); }
  return { scene: S.scene, cam, update(f, fd, t) { S.tick(t); fleet.forEach((s, i) => { bob(s, t, i); s.position.x += .008; }); path(cam, f, [[0, -6, 1.5, 4.5, -3, 1.0, -3], [fd, 2, 15, 14, 0, 0, -9]]); } }; });
// 12 "And the admirals who laughed? They ended up painting their own ships too..." - the dock: three grumpy admirals on scaffolding with brushes; the painter, arms folded, supervising
shot(64.9, 69.8, () => { const S = dock(), cam = newCam(56), st = makeShip(dazzleT(6, 1)); st.position.set(0, -.2, -.4); st.scale.setScalar(1.25); S.scene.add(st); scaffold(S.scene, -2.4, 2.4, .45);
  return { scene: S.scene, cam, update(f, fd, t) { S.tick(t); ADM.forEach((o, i) => place(S.scene, { ...o, ...fx(f + i * .4, [[0, 'sad'], [1.2, 'angry'], [2.6, 'sad']]), hands: [V(-.2, .9, .2), V(.15, 1.15 + Math.sin(t * 7 + i) * .2, .45)] }, -1.8 + i * 1.8, i === 1 ? .95 : 0, .9, Math.PI));
    place(S.scene, { ...WILK, ...fx(f, [[0, 'smug'], [2.0, 'happy']]), hands: [V(-.15, .95, .3), V(.15, .95, .3)] }, 2.8, .4, 3.0, .5); path(cam, f, [[0, 3.8, 1.4, 6.0, .8, 1.0, 0], [fd, 2.6, 1.8, 5.4, .2, 1.0, 0]]); } }; });
// 13 "...because in 1917, a painter convinced the British Navy-" - back on the gray sea, the gray ship again: the exact opening frame (loops)
shot(69.8, 999, () => { const S = sea('storm'), cam = newCam(55), plain = makeShip(), wk = wake(S.scene); S.scene.add(plain);
  return { scene: S.scene, cam, update(f, fd, t) { S.tick(t); bob(plain, t); plain.position.x = -1.5 - (fd - f) * .35 * 0 + (f - fd) * .35 + 0; wk.at(plain.position, V(1, 0, 0), t); const k = ss(0, fd, f); look(cam, lerp(12, OPEN[0][1], k), lerp(3.2, OPEN[0][2], k), lerp(12, OPEN[0][3], k), lerp(2, OPEN[0][4], k), 1.0, 0); } }; }, { xf: true });
