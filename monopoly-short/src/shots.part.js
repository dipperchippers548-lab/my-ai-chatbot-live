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

// ===================== HOW ONE MAN RIGGED THE MONOPOLY GAME =====================
const JERRY = { color: 0xffd0a8, mustache: true, hat: 'cap', hatColor: 0x24222c, robe: 0x2a2a3a, badge: true, shoe: 0x16121a };
const JERRYT = { ...JERRY, hat: 'tricorn' === 0 ? null : null, robe: 0x8a6a4a, badge: false, shades: true };
const AGENT = i => ({ color: [0xffd0a8, 0xc89070, 0xe8b890][i % 3], shades: true, robe: 0x16121e, shoe: 0x16121a, mouth: 'flat' });
const WIN_ = i => ({ ...crowdOpt(i + 3), tag: null, hat: [null, 'cap', 'party', null, 'cap'][i % 5], robe: [0x3a6ad8, null, 0xff8ab8, 0x5ac87a, null][i % 5] });
const GUARD2 = { color: 0xffd8b0, hat: 'mail', badge: true, robe: 0x2a3a6a, shoe: 0x16121a };
const pieceT = ctex(128, 80, g => { g.fillStyle = '#ffd23a'; g.fillRect(0, 0, 128, 80); g.fillStyle = '#e8323a'; g.fillRect(0, 0, 128, 18); g.fillStyle = '#ffffff'; g.font = '900 13px Nunito'; g.textAlign = 'center'; g.fillText('PRIZE GAME', 64, 14); g.fillStyle = '#16121a'; g.font = '900 15px Nunito'; g.fillText('WIN', 64, 38); g.font = '900 17px Nunito'; g.fillText('$1,000,000', 64, 60); g.strokeStyle = '#16121a'; g.lineWidth = 4; g.strokeRect(0, 0, 128, 80); });
function piece(s = 1) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.2 * s, .125 * s), new THREE.MeshBasicMaterial({ map: pieceT, side: THREE.DoubleSide })); return m; }
function check2(amount = '$1,000,000', w = 1.0) { return card(w, w * .45, (g, W2, H2) => { g.fillStyle = '#e8f6e0'; g.fillRect(0, 0, W2, H2); g.fillStyle = '#e8323a'; g.fillRect(0, 0, W2, H2 * .2); g.fillStyle = '#ffffff'; g.font = `900 ${H2 * .13}px Nunito`; g.textAlign = 'center'; g.fillText('GRAND PRIZE WINNER', W2 / 2, H2 * .15); g.fillStyle = '#16121a'; g.font = `900 ${H2 * .3}px Nunito`; g.fillText(amount, W2 / 2, H2 * .7); g.strokeStyle = '#16121a'; g.lineWidth = 8; g.strokeRect(0, 0, W2, H2); }, 256); }
function diner() { const R = room(0xffe0a0), sc = R.scene; sc.add(at3(box(5, 1.0, .8, 0xe8323a), 0, .5, -1.9)); sc.add(at3(box(5.1, .06, .9, 0xffffff, .01), 0, 1.03, -1.9));
  for (const [x, t] of [[-1.6, 'BURGERS'], [0, 'FRIES'], [1.6, 'SHAKES']]) { const c = card(1.3, .55, (g, w, h) => { g.fillStyle = '#16121e'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23a'; g.font = `900 ${h * .42}px Nunito`; g.textAlign = 'center'; g.fillText(t, w / 2, h * .62); g.strokeStyle = '#e8323a'; g.lineWidth = 10; g.strokeRect(0, 0, w, h); }, 256); c.position.set(x, 2.5, -2.88); sc.add(c); }
  return { scene: sc }; }
function office(col = 0x3a4a5a) { const R = room(col); tableP(R.scene, 0, -.6, 1.8, .9, 0x5a4a3a); return R; }
function press(sc, x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); sc.add(g); g.add(at3(box(2.6, 1.2, 1.2, 0x5a6a7a, .02), 0, .6, 0)); const rolls = [0, 1, 2].map(i => { const r = inked(new THREE.CylinderGeometry(.18, .18, 1.25, 14), 0x9aa0b0, .01); r.rotation.x = Math.PI / 2; r.position.set(-.8 + i * .8, 1.35, 0); g.add(r); return r; });
  const sh = [...Array(5)].map(() => { const p = new THREE.Mesh(new THREE.PlaneGeometry(.5, .35), new THREE.MeshBasicMaterial({ map: pieceT, side: THREE.DoubleSide })); p.rotation.x = -Math.PI / 2; g.add(p); return p; });
  g.userData.run = t => { rolls.forEach(r => r.rotation.y = t * 5); sh.forEach((p, i) => { const q = ((t * .5 + i / 5) % 1); p.position.set(-1.3 + q * 2.6 + 1.0, 1.55, 0); }); }; return g; }
function corkboard() { const g = new THREE.Group(); g.add(at3(box(3.2, 2.0, .08, 0xb88a5a, .02), 0, 0, 0)); const pts = [[-1.2, .6], [-1.2, -.5], [1.2, .6], [1.2, -.5], [0, .75], [0, -.65]], cards = [];
  pts.forEach(([x, y], i) => { const c = card(.42, .32, (gg, w, h) => { gg.fillStyle = '#fff'; gg.fillRect(0, 0, w, h); gg.fillStyle = ['#ff8ab8', '#5aa8ff', '#ffd23a', '#7ad85a', '#c8a0ff', '#ff8a6a'][i]; gg.beginPath(); gg.arc(w / 2, h * .45, h * .28, 0, 7); gg.fill(); gg.fillStyle = '#16121a'; gg.font = `900 ${h * .14}px Nunito`; gg.textAlign = 'center'; gg.fillText('WINNER', w / 2, h * .92); }, 128); c.position.set(x, y, .06); g.add(c); cards.push(c); });
  const mid = card(.62, .5, (gg, w, h) => { gg.fillStyle = '#fff'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#ffd0a8'; gg.beginPath(); gg.arc(w / 2, h * .58, h * .26, 0, 7); gg.fill(); gg.fillStyle = '#16121a'; gg.fillRect(w * .38, h * .66, w * .24, h * .05); gg.font = `900 ${h * .14}px Nunito`; gg.textAlign = 'center'; gg.fillText('UNCLE JERRY', w / 2, h * .14); gg.strokeStyle = '#e8323a'; gg.lineWidth = 8; gg.strokeRect(0, 0, w, h); }, 192); mid.position.set(0, 0, .09); g.add(mid);
  const strs = pts.map(([x, y]) => { const L = Math.hypot(x, y), m = new THREE.Mesh(new THREE.BoxGeometry(L, .015, .01), flat(0xe8323a)); m.position.set(x / 2, y / 2, .055); m.rotation.z = Math.atan2(y, x); g.add(m); return m; });
  g.userData = { strs, mid }; return g; }
function vault() { const R = room(0x5a5a64); const d = new THREE.Group(); d.position.set(0, 1.4, -2.85); R.scene.add(d); d.add(inked(new THREE.CylinderGeometry(1.2, 1.2, .2, 32), 0xa8acb8, .02)); d.children[0].rotation.x = Math.PI / 2; const wheel = new THREE.Group(); wheel.position.z = .15; d.add(wheel); for (let i = 0; i < 3; i++) { const sp = at3(box(.9, .06, .06, 0x5a5a64, .006), 0, 0, 0); sp.rotation.z = i * Math.PI / 3; wheel.add(sp); }
  const bags = [...Array(4)].map((_, i) => { const b = inked(new THREE.SphereGeometry(.22, 10, 8), 0xc8a87a, .01); b.position.set(-1.5 + i * .35, .22, -2.2); R.scene.add(b); const s = sprite('$', '#2a8a3a', .3, 150); s.position.set(-1.5 + i * .35, .25, -1.97); R.scene.add(s); return b; }); return { scene: R.scene, wheel, bags }; }

// ===================== SHOTS (voiceover clock) =====================
const ROW = [-1.9, -.95, 0, .95, 1.9], HERO_M = [0, 1.45, 3.6, 0, 1.2, -1.2];
function winnersRow(sc, f, t, wink) { const cks = sc.userData.cks || (sc.userData.cks = ROW.map((x, i) => { const c = check2(['$1,000,000', '$1,000,000', '$1,000,000', '$1,000,000', '$1,000,000'][i], .8); sc.add(c); return c; }));
  ROW.forEach((x, i) => { const g = place(sc, { ...WIN_(i), ...(wink ? { ...EX.smug, eyesL: 'closed' } : EX.happy), hands: [V(-.3, 1.0, .35), V(.3, 1.0, .35)] }, x, 0, -1.2 + (i % 2) * .15, 0); g.updateMatrixWorld(true); cks[i].position.copy(g.localToWorld(V(0, 1.05, .45))); }); }
// 1 "For twelve years, the biggest winners of McDonald's Monopoly all shared one secret... they were in on it." - five grinning winners with giant checks... on "in on it", they all WINK
shot(0, 6.8, () => { const D = diner(), cam = newCam(56), TW = at(0, 6.08), sp = sparkle(D.scene, 50);
  return { scene: D.scene, cam, update(f, fd, t) { winnersRow(D.scene, f, t, f > TW); sp.at(t, .2, V(0, 2.4, -1.0)); path(cam, f, [[0, ...HERO_M], [TW - .4, .3, 1.35, 2.7, 0, 1.25, -1.2], [fd, .15, 1.3, 2.4, 0, 1.3, -1.2]]); if (f > TW && f < TW + .15) shake(cam, t, .02); } }; });
// 2 "The million-dollar game pieces weren't being won. They were being handed out." - macro: a gold WIN $1,000,000 piece... a hand passes it to another hand, under the table
shot(6.8, 11.0, () => { const D = diner(), cam = newCam(46), pc = piece(1.6), tb = tableP(D.scene, 0, -.2, 1.4, .8, 0xf2f2f2); D.scene.add(pc); const TH = at(6.8, 10.08);
  return { scene: D.scene, cam, update(f, fd, t) { const k = ss(TH - .3, TH + .5, f); const a = place(D.scene, { ...JERRY, hat: null, ...EX.smug, hands: [V(-.3, .9, .3), V(.25, .7, .45)] }, -.55, 0, -.2, Math.PI / 2); const b = place(D.scene, { ...WIN_(2), ...fx(f, [[0, 'shock'], [TH + .3, 'happy']]), hands: [V(-.3, .9, .3), V(.25, .7, .45)] }, .55, 0, -.2, -Math.PI / 2);
    a.updateMatrixWorld(true); b.updateMatrixWorld(true); pc.position.copy(vl(a.localToWorld(V(.25, .74, .45)), b.localToWorld(V(-.25, .74, .45)), k)); pc.rotation.set(-1.2, 0, Math.sin(t * 3) * .1);
    path(cam, f, [[0, .2, 1.6, 2.6, 0, .9, -.2], [fd, .05, 1.3, 1.9, 0, .85, -.2]]); } }; });
// 3 "By one man. Jerry Jacobson. A former cop... and the head of security for the company that made the game pieces." - his office: SECURITY on the door, low hero angle; the old police photo on his desk
shot(11.0, 18.7, () => { const R = office(0x2a3a4a), cam = newCam(54), sign = card(1.4, .4, (g, w, h) => { g.fillStyle = '#16121e'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23a'; g.font = `900 ${h * .55}px Nunito`; g.textAlign = 'center'; g.fillText('SECURITY', w / 2, h * .72); }, 256), ph = card(.3, .38, (g, w, h) => { g.fillStyle = '#c8b090'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a3a6a'; g.fillRect(w * .2, h * .55, w * .6, h * .45); g.fillStyle = '#ffd0a8'; g.beginPath(); g.arc(w / 2, h * .45, w * .22, 0, 7); g.fill(); g.fillStyle = '#2a3a6a'; g.fillRect(w * .26, h * .18, w * .48, h * .12); g.strokeStyle = '#5a3a22'; g.lineWidth = 8; g.strokeRect(0, 0, w, h); }, 128);
  sign.position.set(-1.2, 2.5, -2.88); ph.position.set(.6, 1.0, -.5); ph.rotation.y = -.4; R.scene.add(sign, ph); const TJ = at(11, 12.5), TC = at(11, 14.43);
  return { scene: R.scene, cam, update(f, fd, t) { place(R.scene, { ...JERRY, ...fx(f, [[0, 'deadpan'], [TJ, 'smug'], [TC, 'smile'], [TC + 1.2, 'smug']]), arms: [[-.4, .2, .3], [.4, .2, .3]] }, -.2, 0, -1.3, .2);
    path(cam, f, [[0, -.2, .5, 1.6, -.2, 1.5, -1.3], [TC - .2, .2, .7, 1.1, -.1, 1.4, -1.3], [TC + .6, .9, 1.15, .1, .6, 1.0, -.5], [fd, -.4, 1.6, 2.6, -.6, 1.7, -1.8]]); } }; });
// 4 "His job was to protect the big winners. So on the way from the printer... he'd slip them into his pocket." - the print shop: sheets of gold pieces racing off the press... then the money shot: a gold piece sliding into his pocket
shot(18.7, 24.3, () => { const R = room(0x6a6a74), cam = newCam(54), pr = press(R.scene, 0, -1.6), pc = piece(1.2); R.scene.add(pc); const TS = at(18.7, 23.18);
  return { scene: R.scene, cam, update(f, fd, t) { pr.userData.run(t); const sl = ss(TS - .3, TS + .3, f); const g = place(R.scene, { ...JERRY, ...fx(f, [[0, 'determined'], [TS - .4, 'smug'], [TS + .4, 'happy']]), hands: [V(-.3, .9, .3), V(.24, lerp(1.05, .62, sl), lerp(.45, .24, sl))] }, .6, 0, -.3, -.4); g.updateMatrixWorld(true); pc.position.copy(g.localToWorld(V(.24, lerp(1.1, .66, sl), lerp(.48, .27, sl)))); pc.rotation.set(-.3, -.4, 1.4 * sl); pc.visible = sl < .98;
    const pk = g.localToWorld(V(.22, .66, .25)); path(cam, f, [[0, -1.8, 1.8, 2.0, 0, 1.3, -1.6], [TS - 1.2, .2, 1.3, 1.4, .4, 1.0, -.4], [fd, pk.x + .05, pk.y + .12, pk.z + .55, pk.x, pk.y, pk.z]]); } }; });
// 5 "Then he'd find a lucky stranger. Claim this million-dollar prize... and kick me back a cut." - a dim booth at night: shades on, he slides the piece across the table (lip sync)
shot(24.3, 30.2, () => { const R = room(0x2a2440), cam = newCam(50), tb = tableP(R.scene, 0, -.6, 1.4, .8, 0x5a3a22), pc = piece(1.2), lmp = new THREE.PointLight(0xffd8a0, 5, 4); lmp.position.set(0, 1.9, -.6); R.scene.add(pc, lmp); R.scene.children.filter(o => o.isHemisphereLight || o.isDirectionalLight).forEach(l => l.intensity *= .45); const TC = at(24.3, 26.97);
  return { scene: R.scene, cam, update(f, fd, t) { const m = talkIf(t, 26.95, 29.7); const j = place(R.scene, { ...JERRYT, ...fx(f, [[0, 'smug'], [TC, 'smile'], [at(24.3, 28.95), 'smug']]), mouth: m || undefined, lean: .2, hands: [V(-.3, .9, .3), V(.2, .82, .55)] }, -.5, 0, -.6, Math.PI / 2);
    place(R.scene, { ...WIN_(4), ...fx(f, [[0, 'deadpan'], [TC + .3, 'shock'], [at(24.3, 28.0), 'happy']]), hands: [V(-.3, .9, .3), V(.2, .85, .3)] }, .5, 0, -.6, -Math.PI / 2);
    const k = ss(TC, TC + .8, f); pc.position.set(lerp(-.25, .3, k), .83, -.6); pc.rotation.set(-Math.PI / 2, 0, .2); path(cam, f, [[0, .15, 1.45, 2.6, 0, 1.0, -.6], [fd, -.05, 1.3, 1.9, -.1, 1.0, -.6]]); cam.rotation.z += .06; } }; });
// 6 "For twelve years, it worked. Around twenty-four million dollars in prizes." - glide past winner after winner with giant checks and a shiny car; the counter racks up $24,000,000
shot(30.2, 35.6, () => { const S = studio(0x3a2a5a), cam = newCam(58), sg = bulbSign(S.scene, '$24,000,000', 3.4, .9, 0, 3.4, -3.2, '#5aff8a'), cr = car(0xe8323a, false), sp = sparkle(S.scene, 60), cks = []; cr.position.set(2.8, 0, -1.4); cr.rotation.y = -.6; S.scene.add(cr); for (let i = 0; i < 6; i++) { const c = check2('$1,000,000', .8); S.scene.add(c); cks.push(c); } const TM = at(30.2, 33.49);
  return { scene: S.scene, cam, update(f, fd, t) { sg.userData.flash(t); sg.scale.setScalar(Math.max(.001, pop(f - TM + .2))); sp.at(t, TM, V(0, 3.0, -2.6));
    for (let i = 0; i < 6; i++) { const g = place(S.scene, { ...WIN_(i + 1), ...fx(f + i * .3, [[0, 'happy'], [1.0, 'laugh'], [2.2, 'happy']]), hands: [V(-.3, 1.0, .35), V(.3, 1.0, .35)] }, -3.0 + i * 1.1, 0, -1.4 - (i % 2) * .4, .15); g.updateMatrixWorld(true); cks[i].position.copy(g.localToWorld(V(0, 1.05, .45))); }
    path(cam, f, [[0, -3.0, 1.3, 1.2, -2.6, 1.1, -1.6], [fd, 1.6, 1.7, 2.8, .3, 1.8, -2.0]]); } }; });
// 7 "Then, in 2000, a tip reached the FBI." - the bureau: a phone rings off the hook; an agent in shades picks up... and leans in
shot(35.6, 39.1, () => { const R = office(0x3a4050), cam = newCam(52), phone = at3(box(.25, .1, .18, 0x16121e, .006), .3, .87, -.5), cal = card(.5, .55, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8323a'; g.fillRect(0, 0, w, h * .25); g.fillStyle = '#16121a'; g.font = `900 ${h * .3}px Nunito`; g.textAlign = 'center'; g.fillText('2000', w / 2, h * .7); }, 128); cal.position.set(-1.0, 2.0, -2.88); R.scene.add(phone, cal); const TP = at(35.6, 37.3);
  return { scene: R.scene, cam, update(f, fd, t) { phone.position.y = .87 + (f < TP ? Math.abs(Math.sin(t * 40)) * .02 : 0); const up = ss(TP, TP + .3, f); const g = place(R.scene, { ...AGENT(0), ...fx(f, [[0, 'deadpan'], [TP + .4, 'determined'], [TP + 1.2, 'shock']]), hands: [V(-.3, .9, .3), V(.3, lerp(.9, 1.6, up), lerp(.4, .25, up))] }, .2, 0, -1.25, 0);
    path(cam, f, [[0, .9, 1.0, .6, .3, .9, -.5], [TP, .6, 1.3, 1.6, .2, 1.3, -1.0], [fd, .3, 1.4, 1.2, .2, 1.4, -1.2]]); } }; });
// 8 "Agents followed the winners, one by one..." - a sidewalk: a happy winner strolls with a big check; behind him, agents in shades peek over newspapers, CLICK CLICK
shot(39.1, 42.0, () => { const S = lights(world('day')), cam = newCam(58), ck = check2('$1,000,000', .8), ns = [0, 1].map(() => { const n = card(.45, .55, (g, w, h) => { g.fillStyle = '#f2ede0'; g.fillRect(0, 0, w, h); g.fillStyle = '#16121a'; g.font = `900 ${h * .12}px Nunito`; g.fillText('NEWS', 8, h * .15); for (let i = 0; i < 7; i++) g.fillRect(8, h * (.25 + i * .1), w * .8, 3); }, 128); S.scene.add(n); return n; }); S.scene.add(ck);
  return { scene: S.scene, cam, update(f, fd, t) { setSun(S, 0, 0); const k = clamp(f / fd); const w = walkTo(S.scene, { ...WIN_(2), ...EX.happy, hands: [V(-.3, 1.0, .35), V(.3, 1.0, .35)] }, -2.5, -.25, 1.5, -.25, k, t, Math.PI / 2); w.updateMatrixWorld(true); ck.position.copy(w.localToWorld(V(0, 1.05, .45))); ck.rotation.y = Math.PI / 2;
    [-4.0, -4.9].forEach((x, i) => { const a = place(S.scene, { ...AGENT(i + 1), ...fx(f + i * .4, [[0, 'determined'], [1.4, 'smug']]), hands: [V(-.18, 1.05, .45), V(.18, 1.05, .45)] }, x + k * 3.6, 0, -.2 - i * .3, Math.PI / 2); a.updateMatrixWorld(true); ns[i].position.copy(a.localToWorld(V(0, 1.1 + (Math.sin(t * 3 + i) > .6 ? -.25 : 0), .5))); ns[i].rotation.y = Math.PI / 2; });
    path(cam, f, [[0, -2.0, 1.4, 3.0, -2.5, 1.0, -.2], [fd, 1.0, 1.5, 3.2, -.5, 1.0, -.2]]); } }; });
// 9 "...and every trail led back to Uncle Jerry." - the corkboard: red string zips from every winner photo to the center... push into UNCLE JERRY
shot(42.0, 44.7, () => { const R = office(0x3a4050), cam = newCam(48), cb = corkboard(); cb.position.set(0, 1.6, -2.85); R.scene.add(cb); const TJ = at(42.0, 43.62);
  return { scene: R.scene, cam, update(f, fd, t) { cb.userData.strs.forEach((s, i) => s.scale.x = Math.max(.001, ss(i * .18, i * .18 + .35, f))); cb.userData.mid.scale.setScalar(1 + .12 * Math.exp(-Math.max(0, f - TJ) * 8) * (f > TJ));
    path(cam, f, [[0, .4, 1.5, -.2, 0, 1.6, -2.85], [TJ, 0, 1.6, -1.3, 0, 1.6, -2.85], [fd, 0, 1.6, -1.85, 0, 1.6, -2.85]]); } }; });
// 10 "The man guarding the game... was the one rigging it." - his security desk: agents burst in; smug... to shocked... CLICK, the cuffs
shot(44.7, 47.8, () => { const R = office(0x2a3a4a), cam = newCam(54), cuffs = new THREE.Group(); R.scene.add(cuffs); for (const s of [-1, 1]) cuffs.add(at3(inked(new THREE.TorusGeometry(.06, .015, 6, 14), 0xc8ccd8, .004), s * .06, 0, 0)); const TR = at(44.7, 46.92);
  return { scene: R.scene, cam, update(f, fd, t) { const k = ss(0, 1.2, f); const j = place(R.scene, { ...JERRY, ...fx(f, [[0, 'smug'], [.9, 'shock'], [TR, 'scream'], [TR + .4, 'sad']]), hands: f > TR ? [V(-.08, .8, .35), V(.08, .8, .35)] : undefined, arms: f < TR ? [[-.6, .8, .2], [.6, .8, .2]] : undefined }, 0, 0, -1.3, 0); j.updateMatrixWorld(true); cuffs.visible = f > TR; cuffs.position.copy(j.localToWorld(V(0, .8, .38)));
    [-1, 1].forEach((s, i) => walkTo(R.scene, { ...AGENT(i), ...EX.determined }, s * 3, .8, s * .75, -.9, k, t, -s * Math.PI / 2 + s * .4)); path(cam, f, [[0, 0, 1.3, 2.4, 0, 1.2, -1.2], [fd, .2, 1.25, 1.7, 0, 1.25, -1.2]]); if (f > TR && f < TR + .12) shake(cam, t, .03); } }; });
// 11a "Here's why it worked. One person had all the power, and nobody was checking on him." - alone in an empty hall, spinning a giant ring of every key
shot(47.8, 52.8, () => { const R = room(0x3a3a48), cam = newCam(54), ring_ = new THREE.Group(); R.scene.add(ring_); ring_.add(inked(new THREE.TorusGeometry(.18, .02, 6, 18), 0xc8a050, .004)); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, kk = at3(box(.04, .22, .02, 0xffc83a, .004), Math.cos(a) * .2, Math.sin(a) * .2 - .1, 0); kk.rotation.z = a; ring_.add(kk); }
  return { scene: R.scene, cam, update(f, fd, t) { const j = place(R.scene, { ...JERRY, ...fx(f, [[0, 'smug'], [2.0, 'happy'], [3.4, 'smug']]), arms: [[-.4, .2, .3], [.45, .7, .4]] }, 0, 0, -1.0, 0); j.updateMatrixWorld(true); ring_.position.copy(j.localToWorld(V(.3, 1.15, .45))); ring_.rotation.z = t * 6;
    path(cam, f, [[0, 0, 4.5, 5.0, 0, .6, -1.0], [fd, .4, 1.4, 1.6, .1, 1.2, -1.0]]); } }; });
// 11b "It's like a bank where the only guard is also the robber." - the vault: a lone guard... pulls on a robber mask and starts loading the money bags. Winks
shot(52.8, 56.1, () => { const V_ = vault(), cam = newCam(54), TM = at(52.8, 54.67);
  return { scene: V_.scene, cam, update(f, fd, t) { V_.wheel.rotation.z = t * .5; const masked = f > TM; place(V_.scene, { ...GUARD2, mask: masked, ...fx(f, [[0, 'deadpan'], [TM - .5, 'smug'], [TM + .7, 'happy']]), eyesL: masked && f > TM + .9 ? 'closed' : undefined, hands: masked ? [V(-.25, .7, .45), V(.25, .7, .45)] : undefined }, -.4, 0, -1.6, .3);
    V_.bags.forEach((b, i) => { b.position.y = .22 + (masked ? Math.max(0, Math.sin((f - TM) * 4 - i)) * .3 : 0); }); path(cam, f, [[0, .8, 1.3, 1.6, -.2, 1.2, -1.8], [fd, .4, 1.25, 1.1, -.3, 1.2, -1.8]]); } }; });
// 12 "And that's why, for twelve years, the biggest winners of McDonald's Monopoly all shared one secret-" - back to the winners with their checks: the exact opening frame (loops)
shot(56.1, 999, () => { const D = diner(), cam = newCam(56);
  return { scene: D.scene, cam, update(f, fd, t) { winnersRow(D.scene, f, t, false); path(cam, f, [[0, .4, 2.2, 5.0, 0, 1.0, -1.2], [fd, ...HERO_M]]); } }; }, { xf: true });
