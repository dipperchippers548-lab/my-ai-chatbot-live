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
// ===================== HE WON THE LOTTERY 14 TIMES =====================
const MANDEL = { color: 0xffd8b0, glasses: true, mustache: true, robe: 0x6a3a8a, shoe: 0x2a1a12 };
const ANCHOR = { color: 0xffc8a0, robe: 0x2a3a6a, shoe: 0x16121a };
const ANCHOR2 = { color: 0xe8a878, blush: true, robe: 0xc83a5a, shoe: 0x16121a };
const OFFICIAL = { color: 0xd8d0c0, glasses: true, mustache: true, robe: 0x3a3a48, shoe: 0x16121a };
const VENDOR = { color: 0xffb04a, hat: 'cap', hatColor: 0xe8323a, shoe: 0x3a3a48 };
const TEAMO = i => ({ ...crowdOpt(i), tag: null, hat: [null, 'cap', null, null][i % 4], robe: [0x3a6ad8, null, 0x5ac87a, null, 0xe8742a][i % 5] });
// ---- lottery props ----
const slipT = ctex(64, 40, g => { g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 64, 40); g.fillStyle = '#e8323a'; g.fillRect(0, 0, 64, 9); g.fillStyle = '#c8b8d8'; for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) g.fillRect(4 + x * 7.5, 13 + y * 6.5, 4, 3.5); });
function ticketPile(n = 1400, R = 2.4, Hh = 1.8, seed = 4) { const geo = new THREE.BoxGeometry(.2, .008, .125), im = new THREE.InstancedMesh(geo, toon(0xffffff, slipT), n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), r = rng(seed);
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * R, y = Math.max(0, (1 - rr / R) * Hh * (.75 + r() * .3)); e.set((r() - .5) * .9, r() * 6, (r() - .5) * .9); q.setFromEuler(e); m4.compose(V(Math.cos(a) * rr, y, Math.sin(a) * rr), q, V(1, 1, 1)); im.setMatrixAt(i, m4); }
  im.castShadow = im.receiveShadow = true; return im; }
function bigCheck(amount = '$1,300,000', w = .9) { return card(w, w * .45, (g, W2, H2) => { g.fillStyle = '#e8f6e0'; g.fillRect(0, 0, W2, H2); g.fillStyle = '#2a8a3a'; g.fillRect(0, 0, W2, H2 * .18); g.fillStyle = '#16121a'; g.font = `900 ${H2 * .13}px Nunito`; g.textAlign = 'left'; g.fillText('PAY TO: S. MANDEL', W2 * .05, H2 * .42); g.font = `900 ${H2 * .24}px Nunito`; g.fillText(amount, W2 * .05, H2 * .78); g.strokeStyle = '#16121a'; g.lineWidth = 8; g.strokeRect(0, 0, W2, H2); }, 256); }
function ballMachine(sc, x, y, z, r = 1.0, n = 26) { const g = new THREE.Group(); g.position.set(x, y, z); sc.add(g); g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), new THREE.MeshBasicMaterial({ color: 0xc8f0ff, transparent: true, opacity: .18, depthWrite: false }))); g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), inkMat(.01)));
  g.add(at3(box(.5, r * .9, .5, 0xc83a3a), 0, -r - r * .4, 0)); const balls = [...Array(n)].map((_, i) => { const b = inked(new THREE.SphereGeometry(.11, 10, 8), [0xffffff, 0xffd23a, 0xff6a8a, 0x5ab8ff][i % 4], .006); g.add(b); return b; }); g.userData.tumble = t => balls.forEach((b, i) => { const a = t * (3 + i % 5) + i * 2.3, c = t * (2.4 + i % 3) + i; b.position.set(Math.sin(a) * Math.cos(c) * r * .75, Math.cos(a * 1.3) * r * .75, Math.sin(c) * Math.sin(a * .7) * r * .75); }); return g; }
function bulbSign(sc, txt, w, h, x, y, z, col = '#ffd23a') { const g = new THREE.Group(); g.position.set(x, y, z); sc.add(g); const c = card(w, h, (gg, W2, H2) => { gg.fillStyle = '#16121e'; gg.fillRect(0, 0, W2, H2); gg.fillStyle = col; gg.font = `900 ${H2 * .5}px Nunito`; gg.textAlign = 'center'; gg.fillText(txt, W2 / 2, H2 * .68); }, 512); g.add(c);
  const bulbs = []; for (let i = 0; i < 28; i++) { const u = i / 28, per = 2 * (w + h), d = u * per; let bx, by; if (d < w) { bx = -w / 2 + d; by = h / 2; } else if (d < w + h) { bx = w / 2; by = h / 2 - (d - w); } else if (d < 2 * w + h) { bx = w / 2 - (d - w - h); by = -h / 2; } else { bx = -w / 2; by = -h / 2 + (d - 2 * w - h); } const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 5), flat(0xffe8a0)); b.position.set(bx, by, .03); g.add(b); bulbs.push(b); }
  g.userData.flash = t => bulbs.forEach((b, i) => b.material.color.set((i + Math.floor(t * 8)) % 2 ? 0xffe8a0 : 0x6a5a30)); return g; }
function counterCard(w = 2.2, h = .6) { return card(w, h, (g, W2, H2, n = 0) => { g.fillStyle = '#0e1a14'; g.fillRect(0, 0, W2, H2); g.fillStyle = '#5aff8a'; g.font = `900 ${H2 * .62}px Nunito`; g.textAlign = 'center'; g.fillText(Math.floor(n).toLocaleString('en-US'), W2 / 2, H2 * .74); g.strokeStyle = '#3a3a44'; g.lineWidth = 10; g.strokeRect(0, 0, W2, H2); }, 512); }
function chalk(w = 2.6, h = 1.4) { return card(w, h, (g, W2, H2, lines = []) => { g.fillStyle = '#2a4a3a'; g.fillRect(0, 0, W2, H2); g.strokeStyle = '#8a6a3a'; g.lineWidth = 14; g.strokeRect(0, 0, W2, H2); g.fillStyle = '#f2f2e8'; g.textAlign = 'center'; lines.forEach(([txt, y, s, c]) => { g.fillStyle = c || '#f2f2e8'; g.font = `900 ${H2 * (s || .16)}px Nunito`; g.fillText(txt, W2 / 2, H2 * y); }); }, 512); }
function warehouse(dark = false) { const R = room(0x8a8c98), sc = R.scene; sc.children.filter(o => o.isHemisphereLight || o.isDirectionalLight).forEach(l => l.intensity *= dark ? .45 : .8);
  for (let i = 0; i < 4; i++) { sc.add(at3(new THREE.Mesh(new THREE.BoxGeometry(1.6, .05, .14), flat(0xf2fff8)), -3 + i * 2, 4.2, -1)); const L = new THREE.PointLight(0xe8fff0, dark ? 3 : 6, 8); L.position.set(-3 + i * 2, 3.9, -1); sc.add(L); }
  for (const x of [-4.5, 4.5]) for (let j = 0; j < 3; j++) { sc.add(at3(box(.5, 2.2, 1.6, 0x6a5a4a, .02), x, 1.1, -2.2 + j * 1.8)); for (let k = 0; k < 3; k++) sc.add(at3(box(.4, .35, .4, 0xc8955a, .01), x, .3 + k * .7, -2.2 + j * 1.8)); }
  return { scene: sc }; }
function wallClock() { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CircleGeometry(.4, 32), flat(0xfffaf0))); g.add(at3(new THREE.Mesh(new THREE.TorusGeometry(.4, .03, 6, 32), flat(0x16121a)), 0, 0, .01)); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.02, .06, .01), flat(0x16121a)), Math.sin(a) * .33, Math.cos(a) * .33, .01)); }
  const hh = new THREE.Group(), mh = new THREE.Group(); hh.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.035, .2, .01), flat(0x16121a)), 0, .1, .02)); mh.add(at3(new THREE.Mesh(new THREE.BoxGeometry(.02, .3, .01), flat(0xe8323a)), 0, .15, .03)); g.add(hh, mh); g.userData.set = h => { hh.rotation.z = -h / 12 * Math.PI * 2; mh.rotation.z = -h * Math.PI * 2; }; return g; }
const sparkle = (sc, n = 40) => { const ps = [...Array(n)].map((_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.06, .1), flat([0xffd23a, 0xff6a8a, 0x5ab8ff, 0xffffff][i % 4])); m.material.side = THREE.DoubleSide; sc.add(m); m.visible = false; return m; }); return { at(t, t0, c) { ps.forEach((m, i) => { const d = t - t0; m.visible = d > 0; if (!m.visible) return; const a = i * 2.4; m.position.set(c.x + Math.cos(a) * d * 1.5, c.y + 1.5 * Math.min(d, .5) * 2 - Math.max(0, d - .5) * .8 + (i % 5) * .05, c.z + Math.sin(a) * d * 1.2); m.rotation.set(d * 5 + i, d * 4, i); }); } }; };

// ===================== HQ LOOK: PBR sets, soft GI-ish light, ambient occlusion, bloom, filmic tone, 1.5x supersampling =====================
const SSAA = 1.0; renderer.setPixelRatio(SSAA); renderer.setSize(W, H, false); renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const pmrem = new THREE.PMREMGenerator(renderer); const ENV = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
const composer = new EffectComposer(renderer); composer.setPixelRatio(SSAA); composer.setSize(W, H);
const rpass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera()); composer.addPass(rpass);
const gtao = new GTAOPass(new THREE.Scene(), new THREE.PerspectiveCamera(), W * SSAA, H * SSAA); gtao.updateGtaoMaterial({ radius: .5, distanceExponent: 1.5, thickness: 1.5, scale: 1.2, samples: 8 }); gtao.blendIntensity = .9;
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .14, .5, .97); composer.addPass(new OutputPass());
function hqRender(scene, cam) { scene.traverse(o => { if (o.isMesh && o.material && o.material.isMeshToonMaterial) o.receiveShadow = false; }); scene.traverse(o => { if (o.material && (o.material.isMeshToonMaterial || o.material.isMeshBasicMaterial) && !o.material.userData.keepTone) o.material.toneMapped = false; }); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = scene.userData.exposure || 1.0; rpass.scene = gtao.scene = scene; rpass.camera = gtao.camera = cam; composer.render(); }
// PBR material helpers with painted canvas textures
const pbr = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, metalness: 0, envMapIntensity: .6, ...o });
function texC(w, h, draw, rx = 1, ry = 1) { const t = ctex(w, h, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; }
const pm = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; };
const blockTex = (top, bot) => texC(512, 512, (g, w, h) => { g.fillStyle = top; g.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const x = c * 128 + (r % 2) * 64, y = r * 64; g.fillStyle = `rgba(0,0,0,${.02 + Math.random() * .03})`; g.fillRect(x + 3, y + 3, 122, 58); g.strokeStyle = 'rgba(0,0,0,.13)'; g.lineWidth = 4; g.strokeRect(x, y, 128, 64); g.strokeRect(x - 128, y, 128, 64); }
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(80,60,40,${Math.random() * .05})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 30, 0, 7); g.fill(); } }, 3, 2);
const floorTex = col => texC(512, 512, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .05})`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 3 + Math.random() * 40, 2 + Math.random() * 10, Math.random() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 30; i++) { g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (Math.random() - .5) * 60; y += (Math.random() - .5) * 60; g.lineTo(x, y); } g.stroke(); } }, 4, 4);
// fake volumetric light shaft: additive gradient planes along a direction
function shaft(sc, from, to, w = .7, a = .22, col = 0xfff2d8) { const len = from.distanceTo(to); const tex = ctex(64, 256, (g, ww, hh) => { const gr = g.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, ww, hh); const gx = g.createLinearGradient(0, 0, ww, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, ww, hh); });
  const grp = new THREE.Group(); for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w * (1 - i * .2), len), new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, opacity: a * (1 - i * .25), blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); p.material.userData.keepTone = true; p.rotation.y = i * Math.PI / 3; p.position.y = -len / 2; grp.add(p); }
  grp.position.copy(from); grp.lookAt(to); grp.rotateX(-Math.PI / 2); sc.add(grp); return grp; }

// the ink outline shells wrap each noodle, so ambient occlusion would see the body as "buried" and darken it: hide them while AO is computed
{ const orig = gtao.render.bind(gtao); gtao.render = (...a) => { const hid = []; gtao.scene.traverse(o => { if (o.isMesh && o.visible && o.material && o.material.side === THREE.BackSide && o.material.isMeshBasicMaterial) { o.visible = false; hid.push(o); } }); orig(...a); hid.forEach(o => o.visible = true); }; }
// ===================== "How a Man Mailed Himself Across the World" =====================
const GRIME = ctex(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${90 + Math.random() * 40},${80 + Math.random() * 30},70,${Math.random() * .07})`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 3 + Math.random() * 26, 2 + Math.random() * 12, Math.random() * 3, 0, 7); g.fill(); } }); GRIME.wrapS = GRIME.wrapT = THREE.RepeatWrapping;
// Ricks look: sets lose their ink outlines and become lit, textured PBR; characters (added later, each frame) keep the toon + ink look
function upgradeSet(sc) { sc.traverse(o => { if (!o.isMesh || o.userData.keep) return; const m = o.material; if (!m) return;
  if (m.isMeshBasicMaterial && m.side === THREE.BackSide && m.color && m.color.getHex() === INK) { o.visible = false; return; }
  if (m.isMeshToonMaterial) { o.material = new THREE.MeshStandardMaterial({ color: m.color, map: m.map || GRIME, roughness: o.userData.rough ?? .72, metalness: o.userData.metal ?? 0, envMapIntensity: .7 }); } });
  sc.environment = ENV; const eI = sc.userData.envI ?? .55; sc.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = eI; }); return sc; }
const H_ = (t0, t1, build, o = {}) => shot(t0, t1, t => { const r = build(t); upgradeSet(r.scene); return { ...r, hq: true }; }, o);
const skyTex = (a, b, c) => ctex(8, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, a); gr.addColorStop(.6, b); gr.addColorStop(1, c); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); });
function sunLight(sc, col, I, x, y, z, size = 8) { const s = new THREE.DirectionalLight(col, I); s.position.set(x, y, z); s.castShadow = true; s.shadow.mapSize.set(2048, 2048); Object.assign(s.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: .5, far: 60 }); s.shadow.bias = -.0015; s.shadow.normalBias = .08; sc.add(s, s.target); return s; }
const KEEP = o => { o.traverse(c => c.userData.keep = true); return o; };
const plank = (w, h, d, c = 0xc8955a) => box(w, h, d, c, .012);
const woodT = ctex(256, 256, (g, w, h) => { g.fillStyle = '#d8a86a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(110,70,30,${.1 + Math.random() * .15})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 8, w * .6, y - 8, w, y + 3); g.stroke(); } for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(60,30,10,.35)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 8, 4, 0, 0, 7); g.fill(); } });
function woodBox(w, h, d) { const m = inked(new THREE.BoxGeometry(w, h, d), 0xffffff, .012, woodT); return m; }
function glide(cam, f, fd, pts) { if (!pts._c) pts._c = [new THREE.CatmullRomCurve3(pts.map(p => V(p[0], p[1], p[2]))), new THREE.CatmullRomCurve3(pts.map(p => V(p[3], p[4], p[5])))]; const u = clamp(f / Math.max(fd, .01)); cam.position.copy(pts._c[0].getPointAt(u)); cam.lookAt(pts._c[1].getPointAt(u)); }
// ===================== "How Two Miners Fooled Tiffany's" =====================
const mesh = (g, c) => inked(g, c, .012);
function lowpoly(g, amt = .03, seed = 1) { const p = g.attributes.position, map = new Map(); let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280 - .5; for (let i = 0; i < p.count; i++) { const k = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3); if (!map.has(k)) map.set(k, [r() * amt, r() * amt, r() * amt]); const d = map.get(k); p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]); } g.computeVertexNormals(); return g; }
const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const MINER = { color: 0xffe2c8, hat: 'cowboy', hatColor: 0x8a5a2a, beard: 0x8a5a3a, robe: 0xc8423a, shoe: 0x3a2416 };
const PARTNER = { color: 0xf0c8a0, hat: 'cowboy', hatColor: 0x5a4a3a, robe: 0x3a6a8a, mustache: true, shoe: 0x3a2416 };
// ---- diamonds + sparkle glints ----
const DIA_M = new THREE.MeshStandardMaterial({ color: 0xeaf6ff, metalness: .15, roughness: .04, emissive: 0x5a7aa8, emissiveIntensity: .45, envMapIntensity: 2.2, flatShading: true });
const glintT = ctex(64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(220,240,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(31, 6, 2, 52); g.fillRect(6, 31, 52, 2); });
function diamond(s = 1) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.OctahedronGeometry(.028 * s, 0), DIA_M); m.scale.y = 1.25; m.castShadow = true; g.add(m); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); gl.scale.setScalar(.07 * s); gl.material.userData.keepTone = true; g.add(gl); g.userData.glint = gl; return KEEP(g); }
const twinkle = (d, t, i) => { const k = Math.max(0, Math.sin(t * 7 + i * 2.3)); d.userData.glint.material.opacity = .25 + .75 * k * k; d.userData.glint.scale.setScalar(.03 + .07 * k); };
// ---- dust motes drifting in the low sun ----
function motes(sc, n = 140, box = [6, 3, 6], c = V(0, 1.2, 0)) { const geo = new THREE.BufferGeometry(), p = []; for (let i = 0; i < n; i++) p.push(c.x + (hash(i) - .5) * box[0], c.y + (hash(i + 7) - .5) * box[1], c.z + (hash(i + 13) - .5) * box[2]); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); const m = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe8b0, size: .025, transparent: true, opacity: .7, depthWrite: false })); m.material.userData.keepTone = true; m.userData.keep = true; sc.add(m); return m; }
// ---- the empty field at golden hour ----
const DIRT = ctex(512, 512, (g, w, h) => { g.fillStyle = '#8a5a32'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const v = Math.random(); g.fillStyle = v < .5 ? `rgba(90,58,28,${Math.random() * .25})` : `rgba(230,190,130,${Math.random() * .2})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 4, 1 + Math.random() * 4); } for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(80,50,25,.25)'; g.lineWidth = 2; g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - .5) * 50; y += (Math.random() - .5) * 50; g.lineTo(x, y); } g.stroke(); } }, [10, 10]);
function field() { const sc = new THREE.Scene(); window.__sc = sc; sc.background = skyTex('#1a2a5a', '#c8603a', '#ffb060'); sc.fog = new THREE.Fog(0xc87a4a, 14, 60); sc.add(new THREE.HemisphereLight(0xffc89a, 0x3a2418, .55)); const sun = sunLight(sc, 0xffa850, 5.5, -9, 3, -7, 16); sun.target.position.set(0, 0, 2);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(160, 160, 60, 60), new THREE.MeshStandardMaterial({ map: DIRT, roughness: .95 })); const pa = gr.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), d = Math.hypot(x, y); pa.setZ(i, d > 12 ? Math.sin(x * .08) * Math.cos(y * .06) * Math.min(3, (d - 12) * .15) : (hash(i) - .5) * .04); } gr.geometry.computeVertexNormals(); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; gr.userData.keep = true; sc.add(gr);
  for (let i = 0; i < 70; i++) { const r = mesh(lowpoly(new THREE.IcosahedronGeometry(.08 + hash(i) * .25, 0), .04, i), [0x8a7a6a, 0x9a8a78, 0x6a5a4a][i % 3]); const a = hash(i + 3) * 6.28, d = 1.5 + hash(i + 5) * 14; r.position.set(Math.cos(a) * d, .03, Math.sin(a) * d); r.rotation.set(i, i * 2, 0); r.scale.y = .6; sc.add(r); }
  for (let i = 0; i < 90; i++) { const tuft = mesh(new THREE.ConeGeometry(.05, .22 + hash(i) * .2, 4), [0x9a9a4a, 0xb8a85a, 0x7a8a3a][i % 3]); const a = hash(i + 11) * 6.28, d = 2 + hash(i + 17) * 16; tuft.position.set(Math.cos(a) * d, .1, Math.sin(a) * d); sc.add(tuft); }
  for (let i = 0; i < 6; i++) { const m = mesh(lowpoly(new THREE.CylinderGeometry(3 + hash(i) * 3, 5 + hash(i) * 3, 5 + hash(i + 2) * 6, 7, 2), .5, i), [0xc8784a, 0xb8683a, 0xd8885a][i % 3]); m.position.set(-30 + i * 12, 2.5, -42 - hash(i + 4) * 10); sc.add(m); }
  const tent = new THREE.Group(); tent.position.set(4.5, 0, -4); tent.rotation.y = -.5; sc.add(tent); const tc = mesh(new THREE.ConeGeometry(1.3, 1.8, 4), 0xe8dcc0); tc.rotation.y = Math.PI / 4; tc.position.y = .9; tent.add(tc);
  const wag = new THREE.Group(); wag.position.set(-4.2, 0, -3.2); wag.rotation.y = .6; sc.add(wag); wag.add(at3(box(1.2, .5, 2.2, 0x7a5030), 0, .75, 0)); for (const [x, z] of [[-.65, .8], [.65, .8], [-.65, -.8], [.65, -.8]]) { const w = inked(new THREE.TorusGeometry(.38, .05, 6, 14), 0x5a3a20); w.rotation.y = Math.PI / 2; w.position.set(x, .4, z); wag.add(w); }
  const tools = new THREE.Group(); tools.position.set(1.5, 0, -1.2); sc.add(tools); const sh = new THREE.Group(); sh.add(at3(box(.04, 1.1, .04, 0x8a5a34), 0, .55, 0)); sh.add(at3(box(.24, .3, .03, 0x9aa0ac), 0, -.05, 0)); sh.rotation.z = .25; sh.position.set(0, .12, 0); tools.add(sh); tools.add(at3(inked(new THREE.CylinderGeometry(.16, .12, .3, 12), 0x7a7a84), .5, .15, .2)); const lan = new THREE.PointLight(0xffb060, 0, 3); tools.add(lan);
  sc.userData.envI = .35; sc.userData.exposure = 1.0; return { sc, sun }; }
const HAND = V(.32, 1.18, .42);   // the raised scattering hand (noodle-local)

// 1a "He..." - golden hour, low angle, fist raised against the sun; slow push
H_(0, .55, t0 => { const S = field(), cam = newCam(36); motes(S.sc, 160, [3, 2.5, 3], V(0, 1.4, 0));
  return { scene: S.sc, cam, update(f, fd, tc) { place(S.sc, { ...MINER, ...fx(f, [[0, 'smug']]), hands: [V(-.3, .9, .3), HAND] }, 0, 0, 0, .3); glide(cam, f, fd, [[1.6, .35, 4.6, 0, 1.15, 0], [1.4, .4, 4.1, 0, 1.2, 0]]); } }; });
// 1b "...scattered" - snap punch-in: the fist opens, diamonds spill out glinting
H_(.55, 1.0, t0 => { const S = field(), cam = newCam(34), ds = [...Array(12)].map(() => { const d = diamond(1.2); S.sc.add(d); return d; });
  return { scene: S.sc, cam, update(f, fd, tc) { const g = place(S.sc, { ...MINER, ...fx(f, [[0, 'determined']]), hands: [V(-.3, .9, .3), HAND] }, 0, 0, 0, .3); g.updateMatrixWorld(true); const hp = g.localToWorld(HAND.clone());
    ds.forEach((d, i) => { const k = Math.max(0, f * 2.2 - i * .06); d.position.set(hp.x + Math.cos(i * 2.4) * .06 * k, hp.y - .05 - k * k * .5, hp.z + Math.sin(i * 2.4) * .06 * k); d.rotation.set(k * 6 + i, k * 4, 0); twinkle(d, tc, i); });
    glide(cam, f, fd, [[hp.x + .55, hp.y - .1, hp.z + .95, hp.x, hp.y - .25, hp.z], [hp.x + .5, hp.y - .12, hp.z + .85, hp.x, hp.y - .3, hp.z]]); } }; });
// 1c "...diamonds across" - DIAMOND CAM: we fall with one diamond, spinning, past his boots, down to the dirt
H_(1.0, 1.85, t0 => { const S = field(), cam = newCam(44), hero = diamond(1.4), others = [...Array(16)].map(() => { const d = diamond(1.1); S.sc.add(d); return d; }); S.sc.add(hero); motes(S.sc, 120, [2, 2, 2], V(.3, .8, .4));
  return { scene: S.sc, cam, update(f, fd, tc) { const g = place(S.sc, { ...MINER, ...fx(f, [[0, 'smug']]), hands: [V(-.3, .9, .3), HAND] }, 0, 0, 0, .3); g.updateMatrixWorld(true); const hp = g.localToWorld(HAND.clone()); const k = clamp(f / fd);
    const y = lerp(hp.y - .15, .06, k * k * (3 - 2 * k)); hero.position.set(hp.x + k * .25, y, hp.z + k * .35); hero.rotation.set(f * 9, f * 7, 0); twinkle(hero, tc, 0);
    others.forEach((d, i) => { const kk = clamp(k * 1.1 - (i % 5) * .05); d.position.set(hp.x + Math.cos(i * 1.9) * (.1 + kk * .5), lerp(hp.y - .2, .05, kk), hp.z + Math.sin(i * 1.9) * (.1 + kk * .4) + .2); d.rotation.set(f * 5 + i, f * 3, i); twinkle(d, tc, i); });
    cam.position.set(hero.position.x + .45, hero.position.y + .2, hero.position.z + .75); cam.lookAt(hero.position.x, hero.position.y - .12, hero.position.z); cam.rotation.z += k * .35; } }; });
// 1d "...an empty field" - impact at ground level: dust puff, diamonds bounce and settle, glinting in the low sun
H_(1.85, 2.6, t0 => { const S = field(), cam = newCam(40), ds = [...Array(26)].map((_, i) => { const d = diamond(1.1); S.sc.add(d); return d; }), puff = [...Array(10)].map(() => { const p = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd8b080, transparent: true, opacity: .6, roughness: 1 })); S.sc.add(p); return p; });
  return { scene: S.sc, cam, update(f, fd, tc) { place(S.sc, { ...MINER, ...fx(f, [[0, 'smug']]), hands: [V(-.3, .9, .3), HAND] }, 0, 0, 0, .3);
    ds.forEach((d, i) => { const land = (i % 6) * .05, bk = Math.max(0, f - land); d.position.set(.15 + (hash(i) - .5) * 1.4, .05 + Math.abs(Math.sin(bk * 9)) * .12 * Math.exp(-bk * 5), .5 + (hash(i + 5) - .5) * 1.0); d.rotation.set(i, i * 2, 0); twinkle(d, tc, i); });
    puff.forEach((p, i) => { const k = clamp(f / .6); p.position.set(.35 + Math.cos(i * .63) * k * .4, .04 + k * .1, .7 + Math.sin(i * .63) * k * .3); p.scale.setScalar(.3 + k * 1.3); p.material.opacity = .55 * (1 - k); });
    glide(cam, f, fd, [[1.4, .16, 2.4, .1, .25, .2], [1.1, .14, 2.1, 0, .3, .1]]); } }; });
// 1e "...by hand." - crane up and back: the whole empty field, him sweeping his arm, a trail of glints; the partner holds the bag
H_(2.6, 4.5, t0 => { const S = field(), cam = newCam(48), ds = [...Array(60)].map(() => { const d = diamond(1.0); S.sc.add(d); return d; }); motes(S.sc, 200, [10, 3, 10], V(0, 1.5, 0));
  return { scene: S.sc, cam, update(f, fd, tc) { const sweep = Math.sin(f * 3) * .6; place(S.sc, { ...MINER, ...fx(f, [[0, 'happy']]), hands: [V(-.3, .9, .3), V(.42 + sweep * .2, 1.05, .35 + sweep * .3)] }, 0, 0, 0, .3 + sweep * .2); place(S.sc, { ...PARTNER, ...fx(f, [[0, 'shock']]), bag: true, hands: [V(-.25, .85, .35), V(.25, .85, .35)] }, -1.1, 0, -.4, .6);
    ds.forEach((d, i) => { const a = hash(i) * 6.28, r = .4 + hash(i + 3) * 4.5; d.position.set(Math.cos(a) * r, .05, Math.sin(a) * r + .5); twinkle(d, tc, i); });
    glide(cam, f, fd, [[1.0, .9, 2.4, 0, .8, 0], [2.4, 3.2, 5.2, -.3, .5, -.2], [3.0, 5.0, 7.5, -.4, .3, -.6]]); } }; }, { xf: true });
// 2 "His partner held the bag. We're throwing away diamonds... in the dirt?" - two-shot, the partner gawks into the bag
H_(4.5, 9.8, t0 => { const S = field(), cam = newCam(42), ds = [...Array(30)].map(() => { const d = diamond(1.0); S.sc.add(d); return d; }); motes(S.sc, 160, [4, 2.5, 4], V(0, 1.4, 0));
  return { scene: S.sc, cam, update(f, fd, tc) { const m = talkIf(tc, 6.6, 9.0); place(S.sc, { ...PARTNER, ...fx(f, [[0, 'shock'], [at(t0, 6.69), 'sad']]), ...(m ? { mouth: m } : {}), bag: true, hands: [V(-.25, .85, .35), V(.25, .85, .35)] }, -.45, 0, 0, .5); place(S.sc, { ...MINER, ...fx(f, [[0, 'smug']]), hands: [V(-.3, .9, .3), V(.32, 1.0, .4)] }, .55, 0, -.1, -.5);
    ds.forEach((d, i) => { const a = hash(i) * 6.28, r = .5 + hash(i + 3) * 2.5; d.position.set(Math.cos(a) * r, .05, Math.sin(a) * r + .6); twinkle(d, tc, i); });
    glide(cam, f, fd, [[-1.6, 1.1, 4.0, -.1, .95, 0], [.2, 1.05, 3.5, .05, .95, -.05], [1.4, 1.1, 3.4, .2, 1.0, -.05]]); } }; }, { xf: true });
// 3 "You see, it's called salting." - push in on the miner: smug... wink
H_(9.8, 12.6, t0 => { const S = field(), cam = newCam(38); motes(S.sc, 140, [2, 2, 2], V(.5, 1.4, 0));
  return { scene: S.sc, cam, update(f, fd, tc) { const m = talkIf(tc, 9.8, 11.9); place(S.sc, { ...MINER, ...fx(f, [[0, 'smug'], [at(t0, 11.28), 'happy']]), ...(m ? { mouth: m } : {}), eyesL: f > at(t0, 11.28) ? 'closed' : undefined, arms: [[-.5, .3, .1], [.5, .55, .3]] }, .4, 0, 0, -.25);
    glide(cam, f, fd, [[-.4, 1.1, 3.0, .35, 1.25, 0], [-.1, 1.2, 2.2, .38, 1.35, 0]]); } }; });
// ===================== part 2: 1872 -> broke -> cheap gems -> bury -> bank -> rich men =====================
const RICH = { color: 0xfff0e0, hat: 'top', hatColor: 0x1a1a22, mustache: true, robe: 0x1e1e2a, cravat: true, shoe: 0x111111 };
const TELLER = { color: 0xf8dcc0, glasses: true, robe: 0x3a5a3a, shoe: 0x2a1a10 };
const wpt = (g, v) => { g.updateMatrixWorld(true); return g.localToWorld(v.clone()); };
// hand-drawn overlay text that writes itself on (Ricks' chalky "10 FT" notes)
function scrawl(g, txt, x, y, k, size = 120, rot = -.06, under = true) { if (k <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.font = `800 italic ${size}px Nunito`; g.textAlign = 'left'; g.textBaseline = 'middle'; const w = g.measureText(txt).width;
  g.beginPath(); g.rect(-10, -size, (w + 20) * Math.min(1, k * 1.4), size * 2); g.clip(); g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = 'rgba(20,14,10,.85)'; g.strokeText(txt, 0, 0); g.fillStyle = '#fff'; g.fillText(txt, 0, 0);
  if (under) { g.lineCap = 'round'; g.lineWidth = 7; g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(-6, size * .55); g.quadraticCurveTo(w * .5, size * .62, w + 10, size * .48); g.stroke(); } g.restore(); }
function lantern(sc, x, y, z, I = 5, dist = 7) { const g = new THREE.Group(); g.position.set(x, y, z); sc.add(g); g.add(at3(inked(new THREE.CylinderGeometry(.07, .08, .03, 10), 0x2a2a2a, .006), 0, 0, 0)); const gl = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .14, 10), new THREE.MeshBasicMaterial({ color: 0xffc870 })); gl.position.y = .09; gl.userData.keep = true; g.add(gl);
  g.add(at3(inked(new THREE.ConeGeometry(.08, .06, 10), 0x2a2a2a, .006), 0, .19, 0)); const L = new THREE.PointLight(0xffa040, I, dist, 1.6); L.position.set(x, y + .12, z); sc.add(L); g.userData.light = L; return g; }
function stars(sc, n = 400) { const geo = new THREE.BufferGeometry(), p = []; for (let i = 0; i < n; i++) { const a = hash(i) * 6.28, e = .15 + hash(i + 3) * 1.2; p.push(Math.cos(a) * Math.cos(e) * 90, Math.sin(e) * 90, Math.sin(a) * Math.cos(e) * 90); } geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); const m = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: .5, sizeAttenuation: true, fog: false })); m.userData.keep = true; sc.add(m); }
function nightField() { const S = field(), sc = S.sc; sc.background = skyTex('#03050f', '#0a1230', '#1c2650'); sc.fog.color.set(0x0c1228); sc.fog.near = 8; sc.fog.far = 40; S.sun.color.set(0x6a80d0); S.sun.intensity = 1.1; S.sun.position.set(6, 9, -4);
  sc.children.find(o => o.isHemisphereLight).intensity = .22; stars(sc); const moon = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: 0xf4f0d8, fog: false })); moon.position.set(14, 22, -60); moon.lookAt(0, 0, 0); moon.userData.keep = true; sc.add(moon); sc.userData.envI = .15; sc.userData.exposure = 1.15; return S; }
function shovel() { const g = new THREE.Group(); g.add(at3(box(.035, 1.0, .035, 0x8a5a34, .01), 0, .5, 0)); g.add(at3(box(.2, .26, .03, 0x9aa0ac, .01), 0, -.1, 0)); g.add(at3(box(.14, .04, .04, 0x6a4a2a, .01), 0, 1.0, 0)); return g; }
function hole(sc, x, z, r = .35) { const h = new THREE.Mesh(new THREE.CircleGeometry(r, 18), new THREE.MeshStandardMaterial({ color: 0x1e1208, roughness: 1 })); h.rotation.x = -Math.PI / 2; h.position.set(x, .012, z); sc.add(h); const md = mesh(lowpoly(new THREE.SphereGeometry(r * .9, 10, 6, 0, 6.3, 0, 1.4), .05, 3), 0x7a4a26); md.scale.y = .45; md.position.set(x + r * 1.6, 0, z - r * .4); sc.add(md); return h; }
function topHat(c = 0x1a1a22) { const g = new THREE.Group(); g.add(at3(inked(new THREE.CylinderGeometry(.16, .16, .3, 16), c, .012), 0, .15, 0)); g.add(at3(inked(new THREE.CylinderGeometry(.26, .26, .025, 18), c, .012), 0, 0, 0)); g.add(at3(inked(new THREE.CylinderGeometry(.162, .162, .05, 16), 0x7a1a1a, .004), 0, .05, 0)); return g; }
const marbleT = texC(512, 512, (g, w, h) => { for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.fillStyle = (r + c) % 2 ? '#e8e0d0' : '#2a2420'; g.fillRect(c * 128, r * 128, 128, 128); } for (let i = 0; i < 50; i++) { g.strokeStyle = `rgba(140,120,100,${Math.random() * .25})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - .5) * 90; y += (Math.random() - .5) * 90; g.lineTo(x, y); } g.stroke(); } }, 10, 10);
function cash(n = 1) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const b = inked(new THREE.BoxGeometry(.22, .06, .1), 0x8ac87a, .008); b.position.set((hash(i) - .5) * .05, .03 + i * .062, (hash(i + 2) - .5) * .03); b.rotation.y = (hash(i + 5) - .5) * .3; g.add(b); const band = mesh(new THREE.BoxGeometry(.05, .065, .105), 0xf0e8c8); band.position.copy(b.position); band.rotation.y = b.rotation.y; g.add(band); } return g; }
function bankerLamp(sc, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); sc.add(g); g.add(at3(box(.14, .02, .1, 0xc8a050, .006), 0, .01, 0)); g.add(at3(box(.015, .16, .015, 0xc8a050, .004), 0, .09, 0)); const sh = inked(new THREE.CylinderGeometry(.03, .09, .07, 12, 1, false, 0, Math.PI), 0x1a7a4a, .006); sh.rotation.x = Math.PI / 2; sh.rotation.z = Math.PI / 2; sh.position.set(0, .17, 0); g.add(sh);
  const L = new THREE.PointLight(0xffc070, 1.6, 2.2, 1.5); L.position.set(x, y + .12, z + .02); sc.add(L); return g; }
function bankHall() { const sc = new THREE.Scene(); window.__sc = sc; sc.background = new THREE.Color(0x120c08); sc.fog = new THREE.Fog(0x1a120a, 8, 22); sc.add(new THREE.HemisphereLight(0xffd8a8, 0x2a1a10, .35));
  const key = new THREE.SpotLight(0xffd8a0, 30, 14, .62, .55, 1.4); key.position.set(-1.2, 4.2, 2.4); key.target.position.set(0, .8, -.6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0015; key.shadow.normalBias = .06; sc.add(key, key.target);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: marbleT, roughness: .25, metalness: .05 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; fl.userData.keep = true; sc.add(fl);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshStandardMaterial({ color: 0x2f4a3a, roughness: .8 })); wall.position.set(0, 3, -2.6); wall.receiveShadow = true; wall.userData.keep = true; sc.add(wall);
  const wains = new THREE.Mesh(new THREE.BoxGeometry(14, 1.3, .08), new THREE.MeshStandardMaterial({ map: woodT, color: 0x8a5a34, roughness: .6 })); wains.position.set(0, .65, -2.55); wains.receiveShadow = true; wains.userData.keep = true; sc.add(wains);
  for (const x of [-3.2, 3.2, -6, 6]) { const c = inked(new THREE.CylinderGeometry(.28, .32, 5.6, 16), 0xe8dcc8, .015); c.position.set(x, 2.8, -2.1); sc.add(c); sc.add(at3(box(.8, .2, .8, 0xd8ccb8, .012), x, .1, -2.1)); sc.add(at3(box(.8, .2, .8, 0xd8ccb8, .012), x, 5.5, -2.1)); }
  // the teller counter with brass bars + windows
  const ctr = woodBox(5.6, .78, .7); ctr.position.set(0, .39, -.9); sc.add(ctr); sc.add(at3(box(5.8, .05, .8, 0x4a2a16, .012), 0, .8, -.9));
  for (let i = 0; i < 29; i++) { const x = -2.8 + i * .2; if (Math.abs(x) < .5 || Math.abs(x - 2) < .35 || Math.abs(x + 2) < .35) continue; const b = mesh(new THREE.CylinderGeometry(.012, .012, .7, 6), 0xd8b060); b.position.set(x, 1.17, -1.05); b.userData.metal = .9; b.userData.rough = .3; sc.add(b); }
  sc.add(at3(box(5.6, .05, .05, 0xd8b060, .008), 0, 1.52, -1.05));
  const sign = card(1.1, .22, (g, w, h) => { g.fillStyle = '#16121a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8b060'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#e8c870'; g.font = `900 ${h * .5}px Nunito`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TELLER', w / 2, h * .54); }); sign.position.set(0, 1.68, -1.05); sc.add(KEEP(sign));
  bankerLamp(sc, -1.3, .83, -.85); bankerLamp(sc, 1.3, .83, -.85);
  for (const [x, n] of [[-2.2, 3], [-1.9, 2], [2.1, 4]]) { const c = cash(n); c.position.set(x, .83, -.95); sc.add(c); }
  const ledger = box(.3, .05, .22, 0x6a1a1a, .008); ledger.position.set(-.7, .85, -.9); ledger.rotation.y = .2; sc.add(ledger);
  // vault door glowing in the back
  const v = new THREE.Group(); v.position.set(2.2, 2.0, -2.5); sc.add(v); const vd = inked(new THREE.CylinderGeometry(1.0, 1.0, .2, 32), 0x9aa0a8, .02); vd.rotation.x = Math.PI / 2; vd.userData.metal = .8; vd.userData.rough = .35; v.add(vd); for (let i = 0; i < 6; i++) { const sp = box(.05, .9, .05, 0xd8b060, .006); sp.rotation.z = i * Math.PI / 3; sp.position.z = .15; v.add(sp); } v.add(at3(inked(new THREE.CylinderGeometry(.14, .14, .1, 16), 0xd8b060, .008), 0, 0, .14)); v.children[v.children.length - 1].rotation.x = Math.PI / 2;
  const clk = wallClock(); clk.position.set(-2.0, 3.0, -2.5); clk.scale.setScalar(.8); sc.add(KEEP(clk));
  const cand = new THREE.Group(); cand.position.set(0, 4.2, .2); sc.add(cand); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); b.position.set(Math.cos(a) * .5, 0, Math.sin(a) * .5); b.userData.keep = true; cand.add(b); } cand.add(at3(inked(new THREE.TorusGeometry(.5, .03, 6, 24), 0xd8b060, .008), 0, 0, 0)); cand.children[cand.children.length - 1].rotation.x = Math.PI / 2;
  const cl = new THREE.PointLight(0xffc880, 6, 9, 1.4); cl.position.set(0, 3.9, .2); sc.add(cl);
  for (const x of [-4.4, 4.4]) { const pot = inked(new THREE.CylinderGeometry(.25, .2, .45, 12), 0x8a4a2a, .012); pot.position.set(x, .22, -1.6); sc.add(pot); for (let i = 0; i < 7; i++) { const lf = mesh(new THREE.ConeGeometry(.09, .9, 4), 0x3a7a3a); lf.position.set(x, .8, -1.6); lf.rotation.set(Math.cos(i) * .7, i, Math.sin(i * 1.7) * .7); sc.add(lf); } }
  sc.userData.envI = .45; sc.userData.exposure = 1.05; return { sc, key }; }
function bankFront() { const sc = new THREE.Scene(); window.__sc = sc; sc.background = skyTex('#3a5a90', '#c89a7a', '#f2b878'); sc.fog = new THREE.Fog(0xd8d0c0, 16, 60); sc.add(new THREE.HemisphereLight(0xdce8ff, 0x5a4a3a, .75)); const sun = sunLight(sc, 0xffb870, 4.6, -10, 4.5, 3, 12);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: blockTex('#8a8276', '#6a6258'), roughness: .9 })); gr.material.map.repeat.set(20, 20); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; gr.userData.keep = true; sc.add(gr);
  const fac = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 1), new THREE.MeshStandardMaterial({ map: blockTex('#c8a884', '#a88a68'), roughness: .8 })); fac.position.set(0, 3.5, -4); fac.castShadow = fac.receiveShadow = true; fac.userData.keep = true; sc.add(fac);
  for (let i = 0; i < 3; i++) sc.add(at3(box(6.4 - i * .5, .2, 1.2 + (2 - i) * .5, 0xd8ccb8, .015), 0, .1 + i * .2, -2.6 - i * .1));
  for (const x of [-2.4, -.85, .85, 2.4]) { const c = inked(new THREE.CylinderGeometry(.24, .28, 3.6, 16), 0xf0e6d4, .018); c.position.set(x, 2.4, -2.9); sc.add(c); }
  sc.add(at3(box(6.2, .5, 1.0, 0xe8dcc8, .018), 0, 4.45, -2.9)); sc.add(at3(box(6.6, .25, 1.2, 0xd8ccb8, .018), 0, 4.82, -2.9)); sc.add(at3(box(5.4, .5, .9, 0xe8dcc8, .018), 0, 5.2, -3.0));
  const sign = card(4.6, .42, (g, w, h) => { g.fillStyle = '#2a2420'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8c870'; g.font = `900 ${h * .52}px Nunito`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BANK OF SAN FRANCISCO', w / 2, h * .55); }, 512); sign.position.set(0, 4.45, -2.39); sc.add(KEEP(sign));
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.4), new THREE.MeshBasicMaterial({ color: 0xffb060 })); door.position.set(0, 1.8, -3.48); door.userData.keep = true; sc.add(door); sc.add(at3(box(1.5, .12, .2, 0x4a2a16, .01), 0, 3.05, -3.45));
  for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) { const wdw = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.3), new THREE.MeshBasicMaterial({ color: 0xffc880 })); wdw.position.set(sx * (3.9 + i * 1.3), 2.2, -3.48); wdw.userData.keep = true; sc.add(wdw); }
  // red-white-blue bunting under the sign (Ricks' mine has it)
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CircleGeometry(.36, 16, Math.PI, Math.PI), new THREE.MeshStandardMaterial({ map: ctex(64, 32, g => { ['#c83a3a', '#f4f0e8', '#2a4a9a'].forEach((c, k) => { g.fillStyle = c; g.fillRect(0, k * 11, 64, 11); }); }), side: THREE.DoubleSide })); b.position.set(-2.9 + i * 1.16, 4.1, -2.35); sc.add(b); }
  for (const x of [-4.2, 4.2]) { sc.add(at3(box(.08, 3.2, .08, 0x1a1a1a, .01), x, 1.6, -.8)); const gl = new THREE.Mesh(new THREE.BoxGeometry(.24, .32, .24), new THREE.MeshBasicMaterial({ color: 0xffd890 })); gl.position.set(x, 3.3, -.8); gl.userData.keep = true; sc.add(gl); sc.add(at3(box(.32, .06, .32, 0x1a1a1a, .008), x, 3.5, -.8)); }
  for (const [x, z] of [[-5, -1.8], [-4.4, -1.5], [5.2, -2]]) sc.add(at3(inked(new THREE.CylinderGeometry(.22, .22, .55, 12), 0x7a5030, .012), x, .27, z));
  sc.add(at3(woodBox(.6, .5, .5), 4.6, .25, -1.3));
  for (const x of [-14, 14]) { const b = new THREE.Mesh(new THREE.BoxGeometry(8, 9 + (x > 0 ? 2 : 0), 6), new THREE.MeshStandardMaterial({ map: blockTex(x > 0 ? '#b8786a' : '#a89a80', '#887060'), roughness: .9 })); b.position.set(x, 4.5, -5); b.userData.keep = true; b.castShadow = b.receiveShadow = true; sc.add(b); }
  sc.userData.envI = .3; sc.userData.exposure = .85; return { sc, sun }; }

// 4 "It's 1872." - low lateral track past the rocks to the two miners by their wagon; 1872 scrawls on
H_(12.6, 15.1, t0 => { const S = field(), cam = newCam(40); motes(S.sc, 140, [5, 2.5, 5], V(-2.5, 1.2, -1.5));
  return { scene: S.sc, cam, draw(g, f) { scrawl(g, '1872', 120, 330, (f - at(t0, 13.0)) / .45, 150); }, update(f, fd, tc) {
    place(S.sc, { ...MINER, ...fx(f, [[0, 'deadpan']]), hands: [V(-.3, .7, .2), V(.3, .7, .2)] }, -3.2, 0, -2.2, .6); place(S.sc, { ...PARTNER, ...fx(f, [[0, 'sad']]), hands: [V(-.3, .7, .2), V(.3, .7, .2)] }, -2.1, 0, -1.7, .4);
    glide(cam, f, fd, [[1.4, .5, 3.0, -2.6, .9, -1.9], [.2, .6, 2.4, -2.6, .95, -1.9]]); } }; });
// 5a "Two broke miners." - two-shot, pockets pulled out, a moth flutters out
H_(15.1, 17.4, t0 => { const S = field(), cam = newCam(38), moth = new THREE.Group(); [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.CircleGeometry(.05, 8), new THREE.MeshStandardMaterial({ color: 0xd8c8a8, side: THREE.DoubleSide })); w.position.x = s * .045; moth.add(w); }); S.sc.add(moth);
  const flaps = [...Array(4)].map(() => { const p = mesh(new THREE.BoxGeometry(.11, .13, .03), 0xf4ecd8); S.sc.add(p); return p; });
  return { scene: S.sc, cam, update(f, fd, tc) { const pk = [V(-.28, .62, .18), V(.28, .62, .18)];
    const a = place(S.sc, { ...MINER, ...fx(f, [[0, 'sad']]), hands: pk }, .42, 0, 0, -.15), b = place(S.sc, { ...PARTNER, ...fx(f, [[0, 'sad'], [at(t0, 15.58), 'cry']]), hands: pk }, -.42, 0, .05, .15);
    [a, a, b, b].forEach((g, i) => { flaps[i].position.copy(wpt(g, pk[i % 2]).add(V(0, -.05, .02))); flaps[i].rotation.z = (i % 2 ? -1 : 1) * .2; });
    const p0 = wpt(b, pk[1]), k = Math.max(0, f - .5); moth.position.set(p0.x + k * .5 + Math.sin(k * 9) * .08, p0.y + k * .55, p0.z + .1 + Math.cos(k * 7) * .06); moth.children.forEach((w, i) => w.rotation.y = (i ? 1 : -1) * Math.abs(Math.sin(tc * 40)) * 1.2); moth.lookAt(cam.position);
    glide(cam, f, fd, [[0, 1.05, 3.6, 0, 1.0, 0], [0, 1.1, 3.0, 0, 1.05, 0]]); } }; });
// 5b "Their field has nothing in it but rocks." - camera skims the dirt, a tumbleweed rolls through
H_(17.4, 19.7, t0 => { const S = field(), cam = newCam(46), tw = mesh(lowpoly(new THREE.IcosahedronGeometry(.32, 1), .08, 4), 0xa8844a); tw.material = tw.children ? tw.material : tw.material; S.sc.add(tw);
  for (let i = 0; i < 18; i++) { const r = mesh(lowpoly(new THREE.IcosahedronGeometry(.06 + hash(i + 40) * .12, 0), .03, i + 40), [0x8a7a6a, 0x6a5a4a][i % 2]); r.position.set(-2 + hash(i + 2) * 4, .03, -1 + hash(i + 9) * 3); r.scale.y = .6; S.sc.add(r); }
  return { scene: S.sc, cam, update(f, fd, tc) { tw.position.set(-3 + f * 2.4, .32 + Math.abs(Math.sin(f * 5)) * .12, -.8); tw.rotation.z = -f * 7;
    place(S.sc, { ...MINER, ...fx(f, [[0, 'deadpan'], [at(t0, 18.48), 'sad']]), hands: [V(-.3, .75, .2), V(.3, .75, .2)] }, .9, 0, -3.2, -.3);
    glide(cam, f, fd, [[-1.4, .18, 2.4, .3, .25, -1.5], [.6, .22, 2.0, .7, .45, -2.4]]); } }; });
// 6 "So they spend their last dollars on cheap gems..." - macro on a lantern-lit crate: coins slide in, a pouch spills gems
H_(19.7, 22.2, t0 => { const sc = new THREE.Scene(); window.__sc = sc; sc.background = new THREE.Color(0x0e0905); sc.add(new THREE.HemisphereLight(0xffc890, 0x1a0e06, .25)); lantern(sc, -.55, .02, -.35, 4, 4);
  const top = woodBox(1.3, .1, .9); top.children[0].material.color.set(0x9a6a40); top.position.y = -.05; sc.add(top); const coins = [0, 1, 2].map(i => { const c = makeCoin('plain', .07, .015); sc.add(c); return c; });
  const pouch = new THREE.Group(); pouch.position.set(.18, 0, 0); sc.add(pouch); const pb = mesh(new THREE.SphereGeometry(.13, 14, 10), 0xb8905a); pb.scale.set(1, .8, 1); pb.position.y = .1; pouch.add(pb); pouch.add(at3(mesh(new THREE.CylinderGeometry(.04, .07, .08, 10), 0xa8804a), 0, .22, 0));
  const GEMC = [0xff4a6a, 0x4ad88a, 0x6aa8ff, 0xffd84a]; const gems = [...Array(16)].map((_, i) => { const d = diamond(1.3); if (i % 3) { const m = d.children[0]; m.material = DIA_M.clone(); m.material.color.set(GEMC[i % 4]); m.material.emissive.set(GEMC[i % 4]); m.material.emissiveIntensity = .25; } sc.add(d); return d; });
  sc.userData.envI = .5; sc.userData.exposure = 1.1;
  return { scene: sc, cam: newCam(34), update(f, fd, tc) { const cam = this.cam;
    coins.forEach((c, i) => { const k = clamp((f - .1 - i * .15) / .35); c.position.set(lerp(-.9, -.18 + i * .07, 1 - (1 - k) ** 3), .002 + i * .016 * (k >= 1 ? 1 : 0), .2 - i * .03); });
    const tip = clamp((f - at(t0, 21.6)) / .3); pouch.rotation.z = -tip * 1.3;
    gems.forEach((d, i) => { const k = clamp((f - at(t0, 21.7) - i * .02) / .45); const a = hash(i) * 2.2 - .6, r = .1 + hash(i + 4) * .38; d.visible = k > 0; d.position.set(.3 + Math.cos(a) * r * k, .03 + Math.sin(k * Math.PI) * .12, Math.sin(a) * r * k * .8); d.rotation.y = tc * 2 + i; twinkle(d, tc, i); });
    glide(cam, f, fd, [[-.35, 1.35, 1.6, .05, 0, 0], [0, 1.0, 1.25, .12, .02, 0]]); } }; });
// 7 "...and bury them." - night, lantern on the dirt, one digs, one drops the gems in
H_(22.2, 25.4, t0 => { const S = nightField(), cam = newCam(40); lantern(S.sc, .55, 0, .55, 7, 6); const hl = hole(S.sc, 0, .25), sh = shovel(); S.sc.add(sh); const ds = [...Array(6)].map(() => { const d = diamond(1.2); S.sc.add(d); return d; }); const clods = [...Array(8)].map((_, i) => { const c = mesh(lowpoly(new THREE.IcosahedronGeometry(.04, 0), .02, i), 0x6a3a1a); S.sc.add(c); return c; });
  return { scene: S.sc, cam, update(f, fd, tc) { const dig = (Math.sin(f * 7) + 1) / 2;
    const a = place(S.sc, { ...MINER, ...fx(f, [[0, 'determined']]), bend: .25 + dig * .15, hands: [V(-.15, .7 + dig * .2, .35), V(.15, .85 + dig * .2, .38)] }, -.55, 0, .1, .9);
    const hp = wpt(a, V(0, .78 + dig * .2, .36)); sh.position.copy(hp).add(V(.25, -.55, 0)); sh.rotation.z = .8 - dig * .4; sh.rotation.y = .9;
    clods.forEach((c, i) => { const k = ((f * 1.1 + i / 8) % 1); c.position.set(lerp(-.1, .7, k), .05 + Math.sin(k * Math.PI) * .5, .25 + (hash(i) - .5) * .3); });
    const b = place(S.sc, { ...PARTNER, ...fx(f, [[0, 'smug']]), bag: true, hands: [V(-.2, .85, .35), V(.3, .95, .4)] }, .55, 0, -.5, -.7);
    const hp2 = wpt(b, V(.3, .95, .4)); ds.forEach((d, i) => { const k = ((f * .9 + i / 6) % 1); d.position.set(lerp(hp2.x, .05, k), lerp(hp2.y, .02, k * k), lerp(hp2.z, .25, k)); twinkle(d, tc, i); });
    glide(cam, f, fd, [[2.2, .7, 3.6, 0, .6, 0], [1.2, .55, 3.0, 0, .6, 0]]); } }; });
// 8a "Then they walk into a bank in San Francisco" - crane down off the sign to the miners climbing the steps
H_(25.4, 28.4, t0 => { const S = bankFront(), cam = newCam(46); motes(S.sc, 100, [6, 3, 4], V(0, 1.5, 0));
  return { scene: S.sc, cam, update(f, fd, tc) { const k = clamp(f / fd * 1.1);
    walkTo(S.sc, { ...MINER, ...fx(f, [[0, 'smug']]), bag: true }, -.5, 2.2, -.4, -1.9, k, tc, Math.PI); walkTo(S.sc, { ...PARTNER, ...fx(f, [[0, 'happy']]) }, .5, 2.6, .45, -1.7, k * .97, tc, Math.PI);
    for (const [x, z, ry, s] of [[-3.6, -1.0, .5, 1], [3.4, -.6, -.8, 2], [-5, .5, .9, 3]]) place(S.sc, { ...RICH, robe: [0x1e1e2a, 0x3a2a4a, 0x2a3a2a][s - 1], ...fx(f, [[0, s === 2 ? 'smug' : 'deadpan']]), hands: [V(-.25, .75, .2), V(.25, .75, .2)] }, x, 0, z, ry);
    glide(cam, f, fd, [[0, 5.0, 6.5, 0, 4.2, -2.4], [0, 2.4, 6.0, 0, 1.8, -2], [0, 1.2, 5.2, 0, 1.1, -1.5]]); } }; });
// 8b "...with a bag of diamonds." - the bag slams on the counter, gems spill across the marble
H_(28.4, 30.6, t0 => { const S = bankHall(), cam = newCam(38), bag = new THREE.Group(); const bb = mesh(new THREE.SphereGeometry(.17, 14, 10), 0x8a5a3a); bb.scale.y = .8; bb.position.y = .13; bag.add(bb); bag.add(at3(mesh(new THREE.CylinderGeometry(.05, .08, .1, 10), 0x7a4a2a), 0, .27, 0)); S.sc.add(bag);
  const ds = [...Array(22)].map(() => { const d = diamond(1.3); S.sc.add(d); return d; });
  return { scene: S.sc, cam, update(f, fd, tc) { const sl = at(t0, 28.76), k = clamp((f - sl + .25) / .25); bag.position.set(0, .82 + (1 - k * k) * .6, -.75); bag.scale.set(1 + (k >= 1 ? Math.exp(-(f - sl) * 12) * .3 : 0), 1 - (k >= 1 ? Math.exp(-(f - sl) * 12) * .3 : 0), 1); bag.rotation.z = k >= 1 ? .5 : 0;
    ds.forEach((d, i) => { const q = clamp((f - sl - .05 - i * .015) / .5); d.visible = q > 0; const a = hash(i) * 3.4 - 1.7 + Math.PI / 2, r = .1 + hash(i + 5) * .6; d.position.set(.12 + Math.sin(a) * r * q, .84 + Math.sin(q * Math.PI) * .1, -.75 + Math.cos(a) * r * q * .35); d.rotation.y = tc * 2 + i; twinkle(d, tc, i); });
    place(S.sc, { ...TELLER, ...fx(f, [[0, 'deadpan'], [sl, 'shock']]), hands: [V(-.25, .85, .3), V(.25, .85, .3)] }, 0, 0, -1.6, 0);
    glide(cam, f, fd, [[1.0, 1.4, 1.5, 0, .95, -1.0], [.6, 1.25, 1.0, 0, .95, -1.0]]); } }; });
// 9 "And the richest men in America lose their minds." - three top hats lined up; on "minds" the hats blast off
H_(30.6, 34.9, t0 => { const S = bankHall(), cam = newCam(40), hats = [0, 1, 2].map(() => { const h = topHat(); S.sc.add(h); return h; }), money = [...Array(14)].map(() => { const b = mesh(new THREE.BoxGeometry(.16, .004, .08), 0x8ac87a); S.sc.add(b); return b; });
  return { scene: S.sc, cam, update(f, fd, tc) { const pop = at(t0, 33.48);
    [[-.85, .3, 0x1e1e2a], [0, 0, 0x3a2a4a], [.85, -.3, 0x2a3a2a]].forEach(([x, ry, robe], i) => { const p = f - pop - i * .05;
      const g = place(S.sc, { ...RICH, robe, hat: p > 0 ? null : 'top', ...fx(f, [[0, i === 1 ? 'smug' : 'smile'], [at(t0, 32.64), 'shock'], [pop + i * .05, 'scream']]), hands: p > 0 ? [V(-.45, 1.35, .2), V(.45, 1.35, .2)] : [V(-.25, .75, .25), V(.25, .75, .25)] }, x, 0, .1 + Math.abs(x) * -.15, ry);
      const hp = wpt(g, V(0, 1.6, 0)); hats[i].visible = p > 0; if (p > 0) { hats[i].position.set(hp.x + p * (i - 1) * .6, hp.y + p * 3.2 - p * p * 3, hp.z); hats[i].rotation.set(p * 6, 0, p * (i - 1) * 4); } });
    money.forEach((b, i) => { const p = f - pop; b.visible = p > 0; b.position.set((hash(i) - .5) * 2.6 + Math.sin(tc * 3 + i) * .1, 2.4 - ((p * .7 + hash(i + 3) * 2) % 2.3), .4 + (hash(i + 7) - .5)); b.rotation.set(tc * 2 + i, i, tc * 3); });
    glide(cam, f, fd, [[0, 1.05, 3.6, 0, 1.1, 0], [0, 1.1, 2.9, 0, 1.15, 0]]); } }; });
