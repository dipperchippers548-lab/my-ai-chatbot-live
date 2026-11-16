
// ---------- sets ----------
const woodT = ctex(64, 64, g => { g.fillStyle = '#a8703c'; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 8) { g.fillStyle = y % 16 ? '#9a6434' : '#b07a44'; g.fillRect(0, y, 64, 7); g.fillStyle = '#6a4220'; g.fillRect(0, y + 7, 64, 1); } g.fillStyle = 'rgba(60,30,10,.35)'; for (let i = 0; i < 12; i++) g.fillRect((i * 23) % 64, (i * 13) % 64, 1, 7); grain(g, 64, 64, 14, 3); }, [3, 6]);
const sailT = ctex(64, 64, g => { g.fillStyle = '#f4ece0'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#c8302a'; for (let x = 0; x < 64; x += 16) g.fillRect(x, 0, 8, 64); grain(g, 64, 64, 10, 4); });
const seaT = ctex(64, 64, g => { g.fillStyle = '#2a6a9a'; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(255,220,180,.35)'; for (let i = 0; i < 14; i++) { const y = (i * 11) % 64, x = (i * 23) % 64; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - 2, x + 8, y); g.stroke(); } }, [20, 20]);
// pirate ship deck at sunset; deck top at y = 0, sea at y = -2
function shipDeck(opts = {}) {
  const scene = new THREE.Scene(), cam = newCam(opts.fov || 42); scene.add(cam);
  scene.background = skyTex(opts.night ? [[0, '#141a3a'], [.6, '#3a3a6a'], [1, '#8a6a8a']] : [[0, '#3a4a8a'], [.45, '#e8806a'], [.75, '#f8c070'], [1, '#ffe2a0']]);
  scene.fog = new THREE.Fog(opts.night ? 0x3a3a6a : 0xf0a070, 14, 60);
  scene.add(new THREE.HemisphereLight(opts.night ? 0x8090d0 : 0xffd0a0, 0x40507a, 1.6)); const sun = new THREE.DirectionalLight(opts.night ? 0xa0b0ff : 0xffc080, opts.night ? 1.2 : 2.4); sun.position.set(6, 5, -8); scene.add(sun);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat({ map: seaT, color: opts.night ? 0x5a6aa0 : 0xffffff })); sea.rotation.x = -Math.PI / 2; sea.position.y = -2; scene.add(sea);
  const sunD = new THREE.Mesh(new THREE.CircleGeometry(4, 24), bmat({ color: opts.night ? 0xf0f4ff : 0xfff0c0, fog: false })); sunD.position.set(14, 4, -80); scene.add(sunD);
  for (const [x, z, s] of [[-30, -70, 6], [40, -90, 9]]) { const isl = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat({ color: 0x5a7a5a })); isl.scale.y = .35; isl.position.set(x, -2, z); scene.add(isl); }
  const deck = new THREE.Group(); scene.add(deck); const wd = mat({ map: woodT }), dark = mat({ color: 0x5a3418 });
  deck.add(box(6, .3, 14, wd, 0, -.15, -3)); for (const s of [-1, 1]) { deck.add(box(.2, .9, 14, dark, s * 3, .3, -3)); deck.add(box(.3, .12, 14, mat({ color: 0x7a4a24 }), s * 3, .8, -3)); for (let z = 3; z > -10; z -= 1.2) deck.add(box(.1, .7, .1, dark, s * 3, .35, z)); }
  deck.add(box(6.2, 2.2, 1.0, mat({ color: 0x6a3a1a }), 0, -1.2, 4)); const mast = cyl(.22, .26, 14, mat({ color: 0x6a4220 }), 0, 7, -5); deck.add(mast);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(5, 5, 8, 8), mat({ map: sailT, side: THREE.DoubleSide })); const sp = sail.geometry.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, Math.cos(sp.getX(i) * .5) * .8); sail.geometry.computeVertexNormals(); sail.position.set(0, 7.5, -4.6); deck.add(sail); deck.add(box(5.6, .14, .14, dark, 0, 10.1, -4.7)); deck.add(box(5.6, .14, .14, dark, 0, 5, -4.7));
  for (const [x, z] of [[-2.4, -1], [2.4, -1], [-2.4, -3.2], [2.4, -3.2]]) { const cn = cyl(.18, .22, 1.3, mat({ color: 0x2a2a2e }), x, .45, z); cn.rotation.z = Math.PI / 2 * Math.sign(x); deck.add(cn); deck.add(box(.6, .35, .7, mat({ color: 0x7a4a24 }), x * .92, .17, z)); }
  for (const [x, z] of [[1.9, 1.8], [-2.0, .9], [2.1, -6.5]]) { const b = cyl(.32, .32, .8, mat({ color: 0x8a5a2a }), x, .4, z, 12); deck.add(b); deck.add(cyl(.33, .33, .06, mat({ color: 0x3a3a3a }), x, .62, z, 12)); deck.add(cyl(.33, .33, .06, mat({ color: 0x3a3a3a }), x, .18, z, 12)); }
  const ropeM = mat({ color: 0xc8a870 }); for (const s of [-1, 1]) { const r = box(.03, 12, .03, ropeM, s * 1.7, 5.5, -1.5); r.rotation.z = s * .25; deck.add(r); }
  return { scene, cam, sea, deck };
}
const sandT = ctex(64, 64, g => { g.fillStyle = '#e8d098'; g.fillRect(0, 0, 64, 64); grain(g, 64, 64, 26, 7); }, [20, 20]);
const grassT = ctex(64, 64, g => { g.fillStyle = '#5a9a4a'; g.fillRect(0, 0, 64, 64); const r = rng(5); for (let i = 0; i < 300; i++) { g.fillStyle = r() < .5 ? '#4a8a3a' : '#6aaa58'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 1, 3); } }, [16, 16]);
function lightsOn(scene, sky, ground, sunC, sunI, sunP) { scene.add(new THREE.HemisphereLight(sky, ground, 1.6)); const s = new THREE.DirectionalLight(sunC, sunI); s.position.set(...sunP); scene.add(s); }
function underwater() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyTex([[0, '#3a8ac8'], [.4, '#1a4a8a'], [1, '#081830']]); scene.fog = new THREE.Fog(0x123a6a, 3, 22);
  lightsOn(scene, 0x8ad0ff, 0x0a1a3a, 0xbfe6ff, 1.4, [2, 8, 3]);
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat({ map: sandT, color: 0x8aa0c0 })); bed.rotation.x = -Math.PI / 2; bed.position.y = -9; scene.add(bed);
  const r = rng(3); for (let i = 0; i < 9; i++) { const k = cyl(.05, .08, 2 + r() * 3, mat({ color: 0x3a8a5a }), (r() - .5) * 14, -8, -4 - r() * 8, 5); scene.add(k); }
  const rays = [...Array(6)].map((_, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 20), bmat({ color: 0xbfe6ff, transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); p.position.set(-5 + i * 2, 2, -6 - i); p.rotation.z = .25; scene.add(p); return p; });
  const bub = [...Array(16)].map((_, i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), bmat({ color: 0xdff4ff, transparent: true, opacity: .7 })); b.userData = i; scene.add(b); return b; });
  return { scene, cam, rays, bub };
}
function makeBundle() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.32, 1.4, 6, 12), mat({ color: 0xece4d4 })); b.rotation.z = Math.PI / 2; g.add(b); for (const x of [-.6, 0, .6]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.33, .025, 6, 16), mat({ color: 0x8a6a3a })); r.rotation.y = Math.PI / 2; r.position.x = x; g.add(r); } return g; }
function makePalm(h = 4) { const g = new THREE.Group(); for (let i = 0; i < 6; i++) { const s = cyl(.16 - i * .012, .18 - i * .012, h / 6, mat({ color: 0x8a6a3a }), Math.sin(i * .3) * .3 * i * .2, h / 12 + i * h / 6, 0, 7); s.rotation.z = -.06 * i; g.add(s); } for (let i = 0; i < 7; i++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(.3, 2.4, 4), mat({ color: 0x3a8a3a })); lf.position.set(.3, h, 0); lf.rotation.set(0, i * .9, 1.9); lf.translateY(1.1); g.add(lf); } return g; }
function beach() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyTex([[0, '#4a90e0'], [.6, '#9ad0f4'], [1, '#e8f4ff']]); scene.fog = new THREE.Fog(0xd8ecf8, 18, 80);
  lightsOn(scene, 0xe0f0ff, 0xc8a870, 0xfff0d8, 2.2, [5, 8, 4]);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), mat({ map: sandT })); sand.rotation.x = -Math.PI / 2; sand.position.z = 10; scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), mat({ map: seaT, color: 0x9ad8e8 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, .02, -110); scene.add(sea);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(120, .6), bmat({ color: 0xffffff, transparent: true, opacity: .8 })); foam.rotation.x = -Math.PI / 2; foam.position.set(0, .03, -10); scene.add(foam);
  for (const [x, z, h] of [[-5, -2, 4.5], [-7, 2, 3.8], [6, -4, 5], [8, 1, 4]]) { const p = makePalm(h); p.position.set(x, 0, z); p.rotation.y = x; scene.add(p); }
  for (const [x, z] of [[2, 2], [-3, 4], [4, 5]]) { const rk = new THREE.Mesh(new THREE.IcosahedronGeometry(.4, 0), mat({ color: 0x8a8a90 })); rk.scale.y = .5; rk.position.set(x, .1, z); scene.add(rk); }
  const hat = new THREE.Group(); const hm = mat({ color: 0x1e1a22 }); const brim = cyl(.55, .6, .05, hm, 0, .03, 0, 3); brim.rotation.y = .3; hat.add(brim); hat.add(cyl(.28, .32, .3, hm, 0, .2, 0, 12)); hat.position.set(.3, 0, -.6); hat.rotation.z = .3; scene.add(hat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.12, .035, 8, 20), mat({ color: 0xffc830, emissive: 0x6a4a00 })); ring.position.set(-.1, .04, -.2); ring.rotation.x = -Math.PI / 2 + .3; scene.add(ring);
  return { scene, cam, foam, ring, hat };
}
function graveyard() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyTex([[0, '#4a5a9a'], [.55, '#d89aa0'], [1, '#f8d0a0']]); scene.fog = new THREE.Fog(0xd8a0a0, 14, 60);
  lightsOn(scene, 0xffd8c0, 0x4a5a7a, 0xffc890, 2.0, [-6, 5, -6]);
  const hill = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mat({ map: grassT })); hill.rotation.x = -Math.PI / 2; scene.add(hill);
  const ch = new THREE.Group(); ch.add(box(4, 3, 3, mat({ color: 0xd8d0c0 }), 0, 1.5, 0)); const roof = new THREE.Mesh(new THREE.CylinderGeometry(0, 2.6, 1.6, 4), mat({ color: 0x6a3a2a })); roof.position.y = 3.8; roof.rotation.y = Math.PI / 4; roof.scale.z = .8; ch.add(roof); ch.add(box(.9, 3, .9, mat({ color: 0xd8d0c0 }), 1.4, 3.8, 0)); const sp = new THREE.Mesh(new THREE.ConeGeometry(.65, 1.6, 4), mat({ color: 0x6a3a2a })); sp.position.set(1.4, 6.1, 0); ch.add(sp); ch.add(box(.8, 1.4, .1, mat({ color: 0x5a3418 }), -.6, .7, 1.52)); ch.position.set(-3.5, 0, -9); scene.add(ch);
  const wd = mat({ color: 0x7a5a3a }); const cross = (x, z, s = 1) => { const c = new THREE.Group(); c.add(box(.12 * s, 1.1 * s, .1 * s, wd, 0, .55 * s, 0)); c.add(box(.6 * s, .1 * s, .1 * s, wd, 0, .8 * s, 0)); c.position.set(x, 0, z); scene.add(c); return c; };
  const r = rng(8); for (let i = 0; i < 8; i++) cross(-4 + (i % 4) * 2.4 + r() * .4, -3 - Math.floor(i / 4) * 2.2, .9); const main = cross(.3, -.4, 1.1);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(.7, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat({ color: 0x6a4a2a })); mound.scale.set(.8, .35, 1.6); mound.position.set(.3, 0, .8); scene.add(mound);
  for (let x = -7; x < 7; x += .8) { scene.add(box(.08, .7, .08, wd, x, .35, 3)); } scene.add(box(14, .06, .06, wd, 0, .55, 3));
  for (const [x, c] of [[.0, 0xff6a8a], [.6, 0xffe21f]]) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(.08, 0), mat({ color: c })); f.position.set(x, .3, .4); scene.add(f); }
  return { scene, cam };
}
const booksT = ctex(64, 64, g => { g.fillStyle = '#4a2a18'; g.fillRect(0, 0, 64, 64); const r = rng(9); for (let row = 0; row < 4; row++) { let x = 1; while (x < 62) { const w = 2 + (r() * 3 | 0), h = 10 + (r() * 4 | 0); g.fillStyle = ['#8a2a2a', '#2a4a8a', '#3a6a3a', '#c8a040', '#6a3a6a', '#d8c8a0'][r() * 6 | 0]; g.fillRect(x, row * 16 + 15 - h, w, h); x += w + 1; } g.fillStyle = '#2a160c'; g.fillRect(0, row * 16 + 15, 64, 1); } }, [3, 2]);
function library() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = new THREE.Color(0x2a1a14); scene.fog = new THREE.Fog(0x2a1a14, 8, 20);
  lightsOn(scene, 0xffd8a0, 0x2a1a10, 0xffd8a0, 1.0, [2, 6, 4]); const lamp = new THREE.PointLight(0xffc870, 14, 7); lamp.position.set(.9, 2.3, .4); scene.add(lamp);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), mat({ map: woodT, color: 0xb08060 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  scene.add(box(10, 5, .4, mat({ map: booksT }), 0, 2.5, -2.5)); for (const s of [-1, 1]) scene.add(box(.4, 5, 6, mat({ map: booksT }), s * 4.5, 2.5, 0));
  scene.add(box(2.4, .1, 1.1, mat({ color: 0x6a3a1a }), .3, 1.0, .2)); for (const [x, z] of [[-.8, -.25], [1.4, -.25], [-.8, .65], [1.4, .65]]) scene.add(box(.08, 1.0, .08, mat({ color: 0x4a2a10 }), x, .5, z));
  const book = new THREE.Group(); for (const s of [-1, 1]) { const pg = box(.42, .03, .55, mat({ color: 0xf2e8d0 }), s * .22, 1.08, .2); pg.rotation.z = -s * .08; book.add(pg); } scene.add(book); book.position.x = .3;
  for (let i = 0; i < 4; i++) scene.add(box(.4, .08, .55, mat({ color: [0x8a2a2a, 0x2a4a8a, 0x3a6a3a, 0xc8a040][i] }), 1.15, 1.09 + i * .08, .1));
  scene.add(cyl(.05, .08, .5, mat({ color: 0x3a3a3a }), .9, 1.3, -.1)); const shade_ = new THREE.Mesh(new THREE.ConeGeometry(.22, .2, 12, 1, true), mat({ color: 0x2a6a3a, side: THREE.DoubleSide })); shade_.position.set(.9, 1.6, -.1); scene.add(shade_);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), bmat({ color: 0xfff0c0 })); glow.position.set(.9, 1.52, -.1); scene.add(glow);
  return { scene, cam };
}
function digsite() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyTex([[0, '#3a6ac8'], [.6, '#f0a868'], [1, '#ffd890']]); scene.fog = new THREE.Fog(0xf0b878, 12, 50);
  lightsOn(scene, 0xffe0b0, 0x8a6a4a, 0xffc070, 2.3, [6, 4, 2]);
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mat({ map: sandT, color: 0xd8a868 })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  const pit = box(2.6, .02, 2.0, mat({ color: 0x6a4a2a }), 0, .01, 0); scene.add(pit); for (const [x, z, w, d] of [[0, -1.05, 2.8, .2], [0, 1.05, 2.8, .2], [-1.35, 0, .2, 2.2], [1.35, 0, .2, 2.2]]) scene.add(box(w, .25, d, mat({ color: 0xb88a58 }), x, .12, z));
  const st = mat({ color: 0x8a6a3a }), rp = mat({ color: 0xf2f2f2 }); for (const [x, z] of [[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]]) scene.add(box(.06, .5, .06, st, x, .25, z)); for (const z of [-1.2, 1.2]) scene.add(box(3, .02, .02, rp, 0, .4, z)); for (const x of [-1.5, 1.5]) scene.add(box(.02, .02, 2.4, rp, x, .4, 0)); scene.add(box(.02, .02, 2.4, rp, 0, .4, 0)); scene.add(box(3, .02, .02, rp, 0, .4, 0));
  const gold = mat({ color: 0xffc830, emissive: 0x5a3a00 }), r = rng(4), items = []; for (let i = 0; i < 9; i++) { const it = i % 3 ? new THREE.Mesh(new THREE.TorusGeometry(.09, .03, 8, 16), gold) : cyl(.1, .1, .03, gold, 0, 0, 0, 14); it.position.set((r() - .5) * 2, .05, (r() - .5) * 1.6); it.rotation.set(-Math.PI / 2 + (r() - .5), r(), 0); scene.add(it); items.push(it); }
  for (const [x, z] of [[-4, -6], [5, -9], [-8, -14]]) { const tent = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2, 4), mat({ color: 0xe8dcc0 })); tent.position.set(x, 1, z); scene.add(tent); }
  return { scene, cam, items };
}
