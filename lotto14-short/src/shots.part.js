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

// ===================== SHOTS (voiceover clock) =====================
const HERO = [.15, 2.25, 1.45, 0, 2.1, -.6];   // the opening (and closing) frame: close on him, smug, atop the mountain
// 1 "A man won the lottery fourteen times... and none of it was luck." - ON TOP of a mountain of tickets, smug; pull back: fourteen giant winner's checks on the wall; he flicks a lucky horseshoe away
shot(0, 4.5, () => { const W = warehouse(), cam = newCam(58), pile = ticketPile(); W.scene.add(pile); pile.position.set(0, 0, -.6); const T14 = at(0, 1.47), TL = at(0, 4.01), hs = new THREE.Group(); W.scene.add(hs); hs.add(inked(new THREE.TorusGeometry(.12, .03, 6, 14, Math.PI * 1.4), 0x9aa0b0, .006));
  const checks = [...Array(14)].map((_, i) => { const c = bigCheck('$' + (1 + i % 5) + ',' + ['200', '400', '750', '100', '900'][i % 5] + ',000', .8); c.position.set(-3.2 + (i % 7) * 1.07, 3.1 - Math.floor(i / 7) * .55, -2.88); W.scene.add(c); return c; });
  return { scene: W.scene, cam, update(f, fd, t) { checks.forEach((c, i) => c.scale.setScalar(Math.max(.001, pop(f - T14 - i * .05)))); const toss = clamp((f - TL) / .8);
    const g = place(W.scene, { ...MANDEL, sit: true, ...fx(f, [[0, 'smug'], [T14, 'happy'], [TL - .3, 'smug']]), hands: [V(-.3, .95, .3), V(.25, 1.05 + (toss > 0 ? .3 : 0), .4)] }, 0, 1.25, -.5, 0); g.updateMatrixWorld(true); const hp0 = g.localToWorld(V(.25, 1.1, .45)); hs.position.copy(toss > 0 ? vl(hp0, V(2.5, 0, 1.0), toss).add(V(0, Math.sin(toss * Math.PI) * 1.2, 0)) : hp0); hs.rotation.z = toss * 12;
    path(cam, f, [[0, ...HERO], [T14 + .3, .6, 2.8, 4.5, 0, 2.1, -1.0], [fd, .9, 2.4, 5.0, .1, 1.9, -1.0]]); } }; });
// 2 "His name was Stefan Mandel, and he noticed something nobody else did." - his study at night, the lottery page and a calculator... the lightbulb moment
shot(4.5, 9.3, () => { const R = room(0x3a3a5a), cam = newCam(54), tb = tableP(R.scene, 0, -.6, 1.6, .9), lamp = new THREE.PointLight(0xffd8a0, 5, 4), bulb = sprite('💡', '#ffd23a', .6, 140), paper = card(.5, .35, (g, w, h) => { g.fillStyle = '#f2ede0'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = `900 ${h * .16}px Nunito`; g.fillText('LOTTO JACKPOT', 8, h * .22); for (let i = 0; i < 6; i++) g.fillRect(8, h * (.32 + i * .1), w * .8, 3); }, 256); R.scene.add(lamp, bulb, paper); lamp.position.set(.4, 1.6, -.4); paper.rotation.x = -Math.PI / 2; paper.position.set(-.1, .83, -.5); const TN = at(4.5, 7.02);
  return { scene: R.scene, cam, update(f, fd, t) { const g = place(R.scene, { ...MANDEL, ...fx(f, [[0, 'deadpan'], [1.2, 'determined'], [TN, 'shock'], [TN + .35, 'happy']]), nod: f < TN ? .25 : -.05, hands: [V(-.25, .95, .35), V(.25, .95, .35)] }, 0, 0, -1.2, 0); g.updateMatrixWorld(true); bulb.position.copy(g.userData.head.localToWorld(V(0, .65, 0))); bulb.scale.setScalar(Math.max(.001, .6 * pop(f - TN)));
    path(cam, f, [[0, .9, 1.9, .4, 0, .9, -.6], [TN - .2, .45, 1.45, .7, 0, 1.25, -1.0], [fd, .3, 1.35, .5, 0, 1.3, -1.1]]); } }; }, { xf: true });
// 3 "Sometimes a jackpot gets so big, it's worth more than every possible ticket put together." - a giant balance: a swelling jackpot bag versus a heap of every ticket... the bag wins, CLUNK
shot(9.3, 15.7, () => { const S = studio(0x2a4a3a), cam = newCam(54), bal = new THREE.Group(), beam_ = new THREE.Group(), bag = inked(new THREE.SphereGeometry(.4, 14, 12), 0x8a6a3a, .012), dl = sprite('$', '#5ac85a', .7, 150), heap = ticketPile(300, .6, .5, 7), pans = [new THREE.Group(), new THREE.Group()]; S.scene.add(bal); bal.add(at3(box(.15, 1.8, .15, 0xc8a050, .01), 0, .9, 0)); bal.add(at3(box(.8, .1, .5, 0x8a6a3a, .01), 0, .05, 0)); beam_.position.y = 1.8; bal.add(beam_); beam_.add(at3(box(2.6, .08, .08, 0xc8a050, .008), 0, 0, 0));
  pans.forEach((p, i) => { p.position.set(i ? 1.25 : -1.25, 0, 0); beam_.add(p); p.add(at3(box(.04, .7, .04, 0x5a5a64, .004), 0, -.35, 0)); p.add(at3(inked(new THREE.CylinderGeometry(.55, .45, .08, 16), 0xc8a050, .01), 0, -.72, 0)); }); pans[0].add(bag); bag.position.y = -.35; pans[0].add(dl); dl.position.set(0, -.3, .42); pans[1].add(heap); heap.position.y = -.68;
  const TB = at(9.3, 11.29), TW = at(9.3, 12.68);
  return { scene: S.scene, cam, update(f, fd, t) { const grow = 1 + ss(TB - .6, TB + .3, f) * .8; bag.scale.setScalar(grow); const tilt = -lerp(.0, .32, ss(TW - .1, TW + .3, f)) + .12 * (1 - ss(TW - .1, TW + .3, f)) * 0; beam_.rotation.z = -tilt; pans.forEach(p => p.rotation.z = tilt);
    path(cam, f, [[0, 2.0, 1.7, 4.6, 0, 1.2, 0], [TW, 0, 1.5, 4.8, 0, 1.2, 0], [fd, -1.2, 1.2, 3.6, -.6, 1.0, 0]]); } }; }, { xf: true });
// 4 "So in 1992, he went after the Virginia lottery." - the draw stage, bulbs chasing round the LOTTO sign, the ball machine churning; he stands below it, looking up
shot(15.7, 20.0, () => { const S = studio(0x1a1430), cam = newCam(58), bm = ballMachine(S.scene, 0, 2.0, -2.0, 1.0), sg = bulbSign(S.scene, 'LOTTO 1992', 3.2, .9, 0, 3.6, -2.4); const sp = beam(S.scene, 0xfff2d8, .9, 6);
  return { scene: S.scene, cam, update(f, fd, t) { bm.userData.tumble(t); sg.userData.flash(t); sp.aim(V(0, 6, 1), V(0, 2, -2), 1); place(S.scene, { ...MANDEL, ...fx(f, [[0, 'determined'], [1.6, 'smug']]), nod: -.25 }, .2, 0, 1.0, Math.PI);
    path(cam, f, [[0, 1.2, .5, 3.4, 0, 2.2, -2], [fd, .5, .6, 2.6, 0, 2.6, -2]]); } }; });
// 5 "Seven million possible number combinations. One dollar each." - into the machine: balls flying; a counter racing to 7,059,052; a $1 ticket pops
shot(20.0, 24.6, () => { const S = studio(0x1a1430), cam = newCam(56), bm = ballMachine(S.scene, 0, 1.4, -1.0, 1.0, 34), ct = counterCard(2.4, .6), tk = card(.9, .55, (g, w, h) => { g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8323a'; g.fillRect(0, 0, w, h * .25); g.fillStyle = '#16121a'; g.font = `900 ${h * .42}px Nunito`; g.textAlign = 'center'; g.fillText('$1', w / 2, h * .82); g.strokeStyle = '#16121a'; g.lineWidth = 8; g.strokeRect(0, 0, w, h); }, 256); S.scene.add(ct, tk); ct.position.set(0, 2.9, -.6); tk.position.set(1.0, 1.6, .2); tk.rotation.y = -.3; const TD = at(20, 23.71);
  return { scene: S.scene, cam, update(f, fd, t) { bm.userData.tumble(t); ct.userData.draw(7059052 * ss(0, at(20, 22.6), f)); tk.scale.setScalar(Math.max(.001, pop(f - TD)));
    path(cam, f, [[0, 0, 1.4, 1.5, 0, 1.4, -1.0], [at(20, 22.3), .2, 2.3, 2.6, 0, 2.5, -.6], [fd, .6, 1.9, 2.8, .6, 1.8, -.1]]); } }; });
// 6 "And a jackpot of twenty-seven million." - low angle: the jackpot board blazes on, bulbs chasing: $27,000,000
shot(24.6, 27.6, () => { const S = studio(0x1a1430), cam = newCam(56), sg = bulbSign(S.scene, '$27,000,000', 3.6, 1.0, 0, 2.6, -2.0, '#5aff8a'), fl = new THREE.PointLight(0x5aff8a, 0, 6), sp = sparkle(S.scene, 50); fl.position.set(0, 2.6, -1); S.scene.add(fl); const T = at(24.6, 25.92);
  return { scene: S.scene, cam, update(f, fd, t) { sg.userData.flash(t); sg.visible = true; sg.scale.setScalar(f < T ? .001 : Math.max(.001, pop(f - T))); fl.intensity = f > T ? 10 + Math.sin(t * 20) * 4 : 0; sp.at(t, T, V(0, 2.6, -1.6));
    path(cam, f, [[0, .4, .4, 2.6, 0, 2.6, -2], [fd, .1, .3, 2.0, 0, 2.7, -2]]); } }; });
// 7 "People laughed. Nobody can buy seven million tickets." - TV news: the anchors crack up; the lead anchor (lip sync) waves it away, dutch angle
shot(27.6, 31.9, () => { const R = room(0x2a3a6a), cam = newCam(54), dk = at3(box(2.6, .9, .7, 0xe8e8f2), 0, .45, -.6), nw = bulbSign(R.scene, 'NEWS', 1.6, .5, 0, 2.6, -2.85, '#ffffff'); R.scene.add(dk);
  return { scene: R.scene, cam, update(f, fd, t) { const m = talkIf(t, 29.0, 31.5); const a = place(R.scene, { ...ANCHOR, ...fx(f, [[0, 'laugh'], [at(27.6, 29.0), 'smug'], [at(27.6, 31.2), 'laugh']]), mouth: m || undefined, arms: [[-.4, .3, .3], [.45, .6 + Math.sin(t * 8) * .15, .4]] }, -.5, 0, -1.2, .2);
    place(R.scene, { ...ANCHOR2, ...fx(f, [[0, 'laugh'], [1.2, 'happy'], [2.4, 'laugh']]), nod: Math.sin(t * 14) * .08 }, .6, 0, -1.25, -.2); if (f < at(27.6, 29.0)) path(cam, f, [[0, 0, 1.5, 2.0, 0, 1.3, -1.2], [fd, 0, 1.5, 1.9, 0, 1.3, -1.2]]); else { faceCam(cam, a, 1.6, .3, 0, -.15); cam.rotation.z += .15; } } }; });
// 8 "So he rented a warehouse, hired a team, and started filling out tickets." - the roller door clatters up... a long table of helpers scribbling; the camera glides the length of it
shot(31.9, 37.2, () => { const W = warehouse(), cam = newCam(58), door = at3(box(3.2, 3.2, .1, 0x9a9aa8, .01), 0, 1.6, 2.6), tb = tableP(W.scene, 0, -.6, 5.4, .9, 0xc8c8d0); W.scene.add(door); const TD = at(31.9, 32.41);
  const slips = [...Array(12)].map((_, i) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(.2, .125), toon(0xffffff, slipT)); s.rotation.x = -Math.PI / 2; s.position.set(-2.4 + i * .44, .83, -.4); W.scene.add(s); return s; });
  return { scene: W.scene, cam, update(f, fd, t) { door.position.y = 1.6 + ss(TD - .4, TD + .5, f) * 3.2;
    for (let i = 0; i < 6; i++) place(W.scene, { ...TEAMO(i), ...fx(f + i * .2, [[0, 'determined'], [2.0, 'smile'], [3.5, 'determined']]), nod: .3, hands: [V(-.2, .9, .4), V(.15 + Math.sin(t * 14 + i) * .04, .88, .45 + Math.cos(t * 11 + i) * .03)] }, -2.2 + i * .88, 0, -1.25, 0);
    place(W.scene, { ...MANDEL, ...fx(f, [[0, 'smug'], [2.5, 'happy']]), arms: [[-.4, .2, .3], [.4, .5, .5]] }, 2.9, 0, .3, -1.2);
    path(cam, f, [[0, 0, 1.6, 5.2, 0, 1.6, 2.6], [TD + .6, -2.6, 1.4, 1.4, -1.6, 1.0, -1.0], [fd, 2.4, 1.4, 1.4, 1.4, 1.0, -1.0]]); } }; });
// 9 "Millions of them. Day and night." - straight down on the tables: day, night, day, night... and the piles grow and grow
shot(37.2, 40.1, () => { const W = warehouse(), cam = newCam(56), tb = tableP(W.scene, 0, -.6, 5.4, .9, 0xc8c8d0), piles = [-1.8, -.6, .6, 1.8].map((x, i) => { const p = ticketPile(260, .55, .7, 20 + i); p.position.set(x, .82, -.6); W.scene.add(p); return p; }), hemi = W.scene.children.find(o => o.isHemisphereLight);
  return { scene: W.scene, cam, update(f, fd, t) { const night = (f * 2.6) % 1 > .5; hemi.intensity = night ? .35 : 1.2; W.scene.background = new THREE.Color(night ? 0x2a2a3a : 0x8a8c98); piles.forEach(p => p.scale.setScalar(.3 + ss(0, fd, f) * 1.1));
    for (let i = 0; i < 6; i++) place(W.scene, { ...TEAMO(i), ...(night ? EX.dazed : EX.determined), hands: [V(-.2, .9, .4), V(.15, .88, .45)] }, -2.2 + i * .88, 0, -1.25, 0); path(cam, f, [[0, .01, 6.0, -.4, 0, .8, -.6], [fd, .01, 4.8, -.4, 0, .8, -.6]]); cam.rotation.z += f * .05; } }; });
// 10 "They ran out of time before they got every combination... but it didn't matter." - the clock hands blur round... and stop. His face falls... then the smirk
shot(40.1, 44.9, () => { const W = warehouse(true), cam = newCam(52), ck = wallClock(); ck.position.set(0, 2.6, -2.88); ck.scale.setScalar(1.6); W.scene.add(ck); const TM = at(40.1, 44.06);
  return { scene: W.scene, cam, update(f, fd, t) { const run = ss(0, TM - .6, f); ck.userData.set(9 + run * 14.9 * 1); const g = place(W.scene, { ...MANDEL, ...fx(f, [[0, 'determined'], [1.2, 'shock'], [2.2, 'sad'], [TM, 'smug']]), turn: f < TM ? .6 : 0, hands: [V(-.25, .9, .25), V(.25, .9, .25)] }, .4, 0, -1.2, -.2);
    path(cam, f, [[0, 0, 2.6, .8, 0, 2.6, -2.9], [TM - .8, .2, 2.3, 1.2, 0, 2.1, -2.5], [fd, .8, 1.5, 1.2, .4, 1.25, -1.2]]); } }; });
// 11 "The winning numbers were in the pile." - on the warehouse TV, the balls drop... he dives into the mountain and pulls out ONE ticket - it glows gold. Confetti
shot(44.9, 47.5, () => { const W = warehouse(), cam = newCam(56), pile = ticketPile(), tk = card(.4, .25, (g, w, h) => { g.fillStyle = '#ffd23a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8323a'; g.fillRect(0, 0, w, h * .25); g.fillStyle = '#16121a'; g.font = `900 ${h * .3}px Nunito`; g.textAlign = 'center'; g.fillText('WINNER', w / 2, h * .75); g.strokeStyle = '#16121a'; g.lineWidth = 6; g.strokeRect(0, 0, w, h); }, 256), glow = new THREE.PointLight(0xffd23a, 0, 3), sp = sparkle(W.scene, 60); pile.position.set(0, 0, -.6); W.scene.add(pile, tk, glow); const TP = at(44.9, 46.24);
  return { scene: W.scene, cam, update(f, fd, t) { const up = ss(TP - .3, TP, f); const g = place(W.scene, { ...MANDEL, ...fx(f, [[0, 'determined'], [TP, 'happy'], [TP + .3, 'laugh']]), hands: [V(-.3, .9, .3), V(.2, lerp(.6, 1.6, up), .4)] }, 0, 1.25, -.5, 0); g.updateMatrixWorld(true); tk.position.copy(g.localToWorld(V(.2, lerp(.6, 1.6, up) + .15, .45))); glow.position.copy(tk.position); glow.intensity = up * 6; sp.at(t, TP, tk.position);
    path(cam, f, [[0, .9, 2.6, 2.6, 0, 2.0, -.5], [fd, .3, 2.6, 1.7, 0, 2.4, -.5]]); if (f > TP && f < TP + .15) shake(cam, t, .04); } }; });
// 12 "Here's the math. Spend about seven million, win twenty-seven million." - the chalkboard: two bars rise side by side, tiny red 7... towering green 27
shot(47.5, 52.5, () => { const R = room(0x3a3a4a), cam = newCam(54), cb = chalk(2.8, 1.5); cb.position.set(0, 1.9, -2.85); R.scene.add(cb); const b7 = at3(box(.6, 1, .6, 0xe8323a, .012), -.8, 0, -1.6), b27 = at3(box(.6, 1, .6, 0x5ac85a, .012), .8, 0, -1.6); R.scene.add(b7, b27); const TS = at(47.5, 48.7), TW = at(47.5, 50.6);
  return { scene: R.scene, cam, update(f, fd, t) { cb.userData.draw([['THE MATH', .2, .14], ['SPEND  $7,000,000', .48, .15, '#ff8a8a'], ['WIN  $27,000,000', .72, .17, '#8aff9a']].filter((_, i) => f > [0, TS, TW][i])); const h7 = ss(TS, TS + .6, f) * .7, h27 = ss(TW, TW + .8, f) * 2.7; b7.scale.y = Math.max(.001, h7); b7.position.y = h7 / 2; b27.scale.y = Math.max(.001, h27); b27.position.y = h27 / 2;
    place(R.scene, { ...MANDEL, ...fx(f, [[0, 'smug'], [TW, 'happy'], [TW + 1, 'smug']]), arms: [[-.4, .2, .3], [.5, .9, .3]] }, -1.9, 0, -1.0, .6); path(cam, f, [[0, 0, 1.6, 2.4, 0, 1.4, -1.6], [fd, .4, 1.3, 2.1, .2, 1.2, -1.6]]); } }; });
// 13 "It's like buying every raffle ticket when the prize is worth more than all the tickets." - a fair booth: he buys the ENTIRE roll; the ticket ribbon unspools across the ground toward a shiny prize car
shot(52.5, 58.3, () => { const S = studio(0x8ac8ff), cam = newCam(58), bo = new THREE.Group(), roll = inked(new THREE.CylinderGeometry(.18, .18, .2, 14), 0xe8323a, .008), rib = new THREE.Mesh(new THREE.PlaneGeometry(.18, 1), toon(0xff8a8a)), prize = car(0xffd23a, false), bow = inked(new THREE.TorusGeometry(.25, .07, 8, 16), 0xe8323a, .01);
  S.scene.add(bo, roll, rib, prize, bow); bo.position.set(-1.0, 0, -1.4); bo.add(at3(box(1.6, .9, .6, 0xffffff), 0, .45, 0)); bo.add(at3(box(1.8, .08, .9, 0xe8323a, .01), 0, 2.0, .1)); for (const x of [-.8, .8]) bo.add(at3(box(.06, 1.1, .06, 0x5a3a22, .006), x, 1.45, .45)); const rs = bulbSign(S.scene, 'RAFFLE', 1.4, .35, -1.0, 2.35, -1.25, '#e8323a');
  prize.position.set(2.0, 0, -1.6); prize.rotation.y = -.5; bow.position.set(2.0, 1.3, -1.6); rib.rotation.x = -Math.PI / 2; roll.rotation.z = Math.PI / 2;
  return { scene: S.scene, cam, update(f, fd, t) { rs.userData.flash(t); const k = ss(.6, fd * .8, f), L = .1 + k * 3.2; rib.scale.y = L; rib.position.set(-.6 + L / 2 * .75, .02, -.6 + L / 2 * .3); rib.rotation.z = -1.2;
    place(S.scene, { ...VENDOR, ...fx(f, [[0, 'smile'], [1.2, 'shock'], [2.6, 'scream']]), arms: [[-.5, .5, .2], [.5, .5, .2]] }, -1.0, 0, -2.0, 0); const m = place(S.scene, { ...MANDEL, ...fx(f, [[0, 'smug'], [2.0, 'happy']]), hands: [V(-.15, .95, .45), V(.15, .95, .45)] }, -.6, 0, -.4, Math.PI - .4); m.updateMatrixWorld(true); roll.position.copy(m.localToWorld(V(0, .98, .55))); roll.rotation.x = t * 8;
    path(cam, f, [[0, -.6, 1.4, 2.4, -.8, 1.1, -1.0], [fd, 1.2, 1.8, 3.4, .6, .8, -1.2]]); } }; });
// 14 "Right after that, lotteries changed the rules." - low angle: a furious official SLAMS a stamp on the rulebook: NEW RULES
shot(58.3, 61.6, () => { const R = room(0x5a4a3a), cam = newCam(54), tb = tableP(R.scene, 0, -.6, 1.6, .9, 0x5a3a22), doc = card(.5, .62, (g, w, h, st = 0) => { g.fillStyle = '#fff6e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = `900 ${h * .09}px Nunito`; g.textAlign = 'center'; g.fillText('LOTTERY RULES', w / 2, h * .13); for (let i = 0; i < 7; i++) g.fillRect(w * .1, h * (.22 + i * .08), w * .8, 3); if (st) { g.save(); g.translate(w / 2, h * .6); g.rotate(-.25); g.strokeStyle = '#e8323a'; g.lineWidth = 8; g.strokeRect(-w * .42, -h * .1, w * .84, h * .2); g.fillStyle = '#e8323a'; g.font = `900 ${h * .11}px Nunito`; g.fillText('NEW RULES', 0, h * .04); g.restore(); } }, 256), stp = new THREE.Group();
  R.scene.add(doc, stp); doc.rotation.x = -Math.PI / 2; doc.position.set(.1, .83, -.4); stp.add(at3(inked(new THREE.CylinderGeometry(.04, .05, .25, 10), 0x5a3a22, .006), 0, .2, 0)); stp.add(at3(box(.18, .06, .12, 0x3a3a44, .006), 0, .05, 0)); const TS = at(58.3, 60.23);
  return { scene: R.scene, cam, update(f, fd, t) { const hit = f > TS; doc.userData.draw(hit ? 1 : 0); const yy = f < TS ? lerp(1.4, .84, ss(TS - .5, TS, f)) : .84 + ss(TS + .2, TS + .6, f) * .4; stp.position.set(.1, yy, -.4);
    place(R.scene, { ...OFFICIAL, ...fx(f, [[0, 'angry'], [TS, 'scream'], [TS + .5, 'smug']]), hands: [V(-.3, .9, .3), V(.1, yy + .3 - 0, .55)] }, .1, 0, -1.3, 0); path(cam, f, [[0, .9, .9, 1.3, .1, 1.0, -.6], [fd, .5, .95, .9, .1, .9, -.5]]); if (f > TS && f < TS + .15) shake(cam, t, .05); } }; });
// 15 "Because a man won the lottery fourteen times-" - back to the mountain: the camera glides in and lands on the exact opening frame (loops)
shot(61.6, 999, () => { const W = warehouse(), cam = newCam(58), pile = ticketPile(); W.scene.add(pile); pile.position.set(0, 0, -.6);
  const checks = [...Array(14)].map((_, i) => { const c = bigCheck('$' + (1 + i % 5) + ',' + ['200', '400', '750', '100', '900'][i % 5] + ',000', .8); c.position.set(-3.2 + (i % 7) * 1.07, 3.1 - Math.floor(i / 7) * .55, -2.88); W.scene.add(c); return c; });
  return { scene: W.scene, cam, update(f, fd, t) { place(W.scene, { ...MANDEL, sit: true, ...fx(f, [[0, 'happy'], [fd - .8, 'smug']]), hands: [V(-.3, .95, .3), V(.25, 1.05, .4)] }, 0, 1.25, -.5, 0); path(cam, f, [[0, .9, 2.4, 5.0, .1, 1.9, -1.0], [fd, ...HERO]]); } }; });
