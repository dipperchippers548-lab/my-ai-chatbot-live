const EX = { happy: { eyes: 'happy', mouth: 'grin' }, smile: { eyes: 'open', mouth: 'smile' }, sad: { eyes: 'half', mouth: 'frown', brow: -.4 }, shock: { eyes: 'wide', mouth: 'o', brow: -.25 },
  angry: { eyes: 'open', mouth: 'flat', brow: .45 }, smug: { eyes: 'half', mouth: 'smirk', brow: .2 }, dazed: { eyes: 'closed', mouth: 'wavy' }, scream: { eyes: 'wide', mouth: 'scream', brow: .35 },
  cry: { eyes: 'closed', mouth: 'wavy', brow: -.45, tears: true }, laugh: { eyes: 'happy', mouth: 'open' }, determined: { eyes: 'half', mouth: 'flat', brow: .5 }, deadpan: { eyes: 'half', mouth: 'flat' }, gross: { eyes: 'closed', mouth: 'wavy', brow: .3 } };
// expression timeline: [[localSeconds, 'name'], ...] - snaps to the new face with a quick squash-and-stretch pop
function fx(f, seq) { let cur = seq[0][1], tc = -9; for (const [a, n] of seq) if (f >= a) { cur = n; tc = a; } const p = f - tc; return { ...EX[cur], squash: p >= 0 && p < .3 ? -.12 * Math.exp(-p * 12) * Math.cos(p * 28) : 0 }; }
// ===================== HQ LOOK: PBR sets, soft GI-ish light, ambient occlusion, bloom, filmic tone, 1.5x supersampling =====================
const SSAA = 1.5; renderer.setPixelRatio(SSAA); renderer.setSize(W, H, false); renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const pmrem = new THREE.PMREMGenerator(renderer); const ENV = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
const composer = new EffectComposer(renderer); composer.setPixelRatio(SSAA); composer.setSize(W, H);
const rpass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera()); composer.addPass(rpass);
const gtao = new GTAOPass(new THREE.Scene(), new THREE.PerspectiveCamera(), W * SSAA, H * SSAA); gtao.updateGtaoMaterial({ radius: .5, distanceExponent: 1.5, thickness: 1.5, scale: 1.2, samples: 16 }); gtao.blendIntensity = .9; composer.addPass(gtao);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .14, .5, .97); composer.addPass(new OutputPass());
function hqRender(scene, cam) { scene.traverse(o => { if (o.material && (o.material.isMeshToonMaterial || o.material.isMeshBasicMaterial) && !o.material.userData.keepTone) o.material.toneMapped = false; }); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = scene.userData.exposure || 1.0; rpass.scene = gtao.scene = scene; rpass.camera = gtao.camera = cam; composer.render(); }
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

// ---------- the test set: a prison cell, built two ways ----------
function cell(hq) {
  const sc = new THREE.Scene(); sc.background = new THREE.Color(hq ? 0xdfe8f0 : 0xfff0d8);
  if (hq) { sc.environment = ENV; sc.environmentIntensity = .55; sc.add(new THREE.HemisphereLight(0xeaf2ff, 0x8a5a50, 1.25));
    const sun = new THREE.DirectionalLight(0xfff0d8, 4.2); sun.position.set(-3.2, 5.2, -4.5); sun.target.position.set(.3, 0, -.2); sc.add(sun, sun.target); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .5, far: 20 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; sun.shadow.radius = 4;
    const fill = new THREE.DirectionalLight(0xcfe0ff, .9); fill.position.set(4, 3, 6); sc.add(fill); const bounce = new THREE.PointLight(0xffc8a0, 6, 6, 1.5); bounce.position.set(.4, .3, .6); sc.add(bounce); }
  else { sc.add(new THREE.HemisphereLight(0xffffff, 0xc8b8a8, 1.5)); const k = new THREE.DirectionalLight(0xfff2e0, 1.6); k.position.set(3, 6, 5); k.castShadow = true; k.shadow.mapSize.set(1024, 1024); sc.add(k); }
  const M = hq ? { floor: pbr(0xffffff, { map: floorTex('#6a2230'), roughness: .55, envMapIntensity: .45 }), wallU: pbr(0xffffff, { map: blockTex('#f2f2ee'), roughness: .85 }), wallL: pbr(0xffffff, { map: blockTex('#4f86c8'), roughness: .6 }), metal: pbr(0xc8d0dc, { metalness: .75, roughness: .35, envMapIntensity: 1.2 }), matt: pbr(0x2a5ab0, { roughness: .8 }), sheet: pbr(0xf4f4f0, { roughness: .9 }), trim: pbr(0x3aa86a, { roughness: .5 }) } : null;
  const B = (w, h, d, col, mk, x, y, z) => { const o = hq ? pm(new THREE.BoxGeometry(w, h, d), M[mk]) : box(w, h, d, col); o.position.set(x, y, z); sc.add(o); return o; };
  B(8, .1, 8, 0x8a3a44, 'floor', 0, -.05, 0);
  // back wall with a window slot (built from 4 pieces so sunlight pours through), side wall
  const WX = -.9, WY = 2.4, ww = .32, wh = 1.1;
  for (const [mk, y0, y1, col] of [['wallL', 0, 1.2, 0x4f86c8], ['wallU', 1.2, 4, 0xf2f2ee]]) { const hgt = y1 - y0;
    if (mk === 'wallL') B(8, hgt, .2, col, mk, 0, y0 + hgt / 2, -2.6);
    else { B(4 + WX - ww / 2, hgt, .2, col, mk, -4 + (4 + WX - ww / 2) / 2, y0 + hgt / 2, -2.6); B(4 - WX - ww / 2, hgt, .2, col, mk, 4 - (4 - WX - ww / 2) / 2, y0 + hgt / 2, -2.6); B(ww, WY - wh / 2 - y0, .2, col, mk, WX, y0 + (WY - wh / 2 - y0) / 2, -2.6); B(ww, y1 - WY - wh / 2, .2, col, mk, WX, WY + wh / 2 + (y1 - WY - wh / 2) / 2, -2.6); } }
  B(.2, 1.2, 8, 0x4f86c8, 'wallL', -2.6, .6, 0); B(.2, 2.8, 8, 0xf2f2ee, 'wallU', -2.6, 2.6, 0); B(8, .06, .22, 0x3aa86a, 'trim', 0, 1.2, -2.5); B(.22, .06, 8, 0x3aa86a, 'trim', -2.5, 1.2, 0);
  if (hq) { const skyM = new THREE.MeshBasicMaterial({ color: 0xffffff }); skyM.userData.keepTone = true; const sky = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), skyM); sky.position.set(WX, WY, -2.75); sc.add(sky); for (let i = 0; i < 2; i++) { const bar = pm(new THREE.CylinderGeometry(.015, .015, wh, 8), M.metal); bar.position.set(WX - .06 + i * .12, WY, -2.62); sc.add(bar); }
 }
  // bunk bed
  const bx = -1.9, bz = -1.2; for (const [x, z] of [[-.45, -1], [.45, -1], [-.45, 1], [.45, 1]]) { const p = hq ? pm(new THREE.BoxGeometry(.07, 2.1, .07), M.metal) : box(.07, 2.1, .07, 0xb0b8c4); p.position.set(bx + x, 1.05, bz + z); sc.add(p); }
  for (const y of [.45, 1.45]) { B(.95, .08, 2.05, 0xb0b8c4, 'metal', bx, y, bz); B(.88, .16, 1.95, 0x2a5ab0, 'matt', bx, y + .12, bz); B(.86, .04, 1.2, 0xf4f4f0, 'sheet', bx, y + .22, bz + .35); }
  // toilet/sink block + cup (props = proof)
  const sink = B(.5, .8, .45, 0xc8ccd4, 'metal', 1.9, .4, -2.25); const cup = hq ? pm(new THREE.CylinderGeometry(.06, .05, .14, 16), pbr(0xd8423a, { roughness: .4 })) : inked(new THREE.CylinderGeometry(.06, .05, .14, 12), 0xd8423a); cup.position.set(1.8, .87, -2.2); sc.add(cup);
  sc.userData.exposure = .92; return sc; }

// ===================== TEST SHOTS: OLD look vs HQ look, same angles =====================
const PRIS = { color: 0xfff4ea, robe: 0xf0822a, shoe: 0xe8423a, mouth: 'smile' };
const GUARD_ = { color: 0xfff4ea, hat: 'cap', hatColor: 0x2a3446, robe: 0x7a8494, badge: true, mustache: true, shades: true, shoe: 0x16121a };
const ANG = [[1.5, 1.3, 3.4, -.4, 1.0, -.6, 44], [-.2, .55, 1.9, -.5, 1.05, -1.0, 52], [2.2, 2.6, 2.4, -.8, .8, -1.0, 40]];
let k = 0; for (const hq of [false, true]) for (const a of ANG) { const t0 = k * 3, t1 = t0 + 3; k++;
  shot(t0, t1, () => { const sc = cell(hq), cam = newCam(a[6]);
    return { scene: sc, cam, hq, update(f, fd, tc) { place(sc, { ...PRIS, ...fx(f, [[0, 'smug']]) }, -.3, 0, -.6, .35); place(sc, { ...GUARD_, ...fx(f, [[0, 'deadpan']]) }, .55, 0, -1.7, -.45); look(cam, a[0], a[1], a[2], a[3], a[4], a[5]); } }; }); }
