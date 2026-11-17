// ---------- the LOW-POLY world ----------
const skyOdd = ctex(64, 128, g => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#3ad0ff'); gr.addColorStop(.55, '#8ae8ff'); gr.addColorStop(1, '#ffd8f0'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128); });
const checkT = wrap(ctex(16, 16, g => { g.fillStyle = '#6ad04a'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#5ab83e'; g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8); }));
function makeCow() {
  const g = new THREE.Group(), w = mat({ color: 0xf4f4f0 }), k = mat({ color: 0x1a1a1a }), pk = mat({ color: 0xf0a0b0 });
  g.add(box(1.3, .7, .7, w, 0, .95, 0)); for (const [x, y, z] of [[.2, 1.15, .36], [-.35, .9, .36], [.1, .8, -.36], [-.2, 1.2, -.36]]) g.add(box(.3, .25, .01, k, x, y, z));
  for (const [x, z] of [[-.45, -.22], [-.45, .22], [.45, -.22], [.45, .22]]) { g.add(box(.16, .56, .16, w, x, .34, z)); g.add(box(.17, .08, .17, k, x, .04, z)); }
  g.add(box(.2, .16, .25, pk, -.3, .55, 0));
  const tail = new THREE.Group(); tail.position.set(-.66, 1.15, 0); g.add(tail); tail.add(box(.04, .5, .04, w, 0, -.25, 0)); tail.add(box(.08, .12, .08, k, 0, -.52, 0));
  const hd = new THREE.Group(); hd.position.set(.78, 1.25, 0); g.add(hd); hd.add(box(.45, .42, .42, w));
  const jaw = box(.2, .08, .38, pk, .2, -.2, 0); hd.add(jaw); hd.add(box(.2, .14, .44, pk, .2, -.1, 0));
  for (const z of [-.12, .12]) { hd.add(box(.05, .05, .05, k, .15, -.08, z * .7)); hd.add(box(.06, .14, .06, mat({ color: 0xd8d0b0 }), -.05, .26, z * 1.4)); hd.add(box(.1, .06, .16, w, -.1, .14, z * 2.3)); }
  const eyes = [-.12, .12].map(z => { const e = box(.02, .08, .08, k, .23, .06, z); hd.add(e); return e; });
  g.userData = { hd, jaw, tail, eyes, anim(t, moo = 0) { jaw.position.y = -.2 - Math.abs(Math.sin(t * 5)) * .04 * (1 - moo) - moo * .06; tail.rotation.x = Math.sin(t * 2.3) * .5; const bl = ((t + .4) % 3.1) < .1; eyes.forEach(e => e.scale.y = bl ? .15 : 1); hd.rotation.z = moo * .3; } };
  return g;
}
function world() {
  const scene = new THREE.Scene(), cam = newCam(45); scene.add(cam); scene.background = skyOdd; scene.fog = new THREE.Fog(0xbfefff, 25, 90);
  scene.add(new THREE.HemisphereLight(0xdff6ff, 0x6a8a4a, 1.8)); const sun = new THREE.DirectionalLight(0xfff4e0, 2.4); sun.position.set(8, 14, 6); sun.castShadow = true; Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0015; scene.add(sun, sun.target);
  const t = checkT.clone(); t.needsUpdate = true; t.repeat.set(400, 400); const gr = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), mat({ map: t })); gr.rotation.x = -Math.PI / 2; scene.add(gr);
  const tri = new THREE.Shape(); tri.moveTo(-1.3, 0); tri.lineTo(1.3, 0); tri.lineTo(0, 1.0); tri.closePath();
  const parts = [[new THREE.BoxGeometry(2.2, 1.6, 2).translate(0, .8, 0), mat({ color: 0xf2e2c0 })], [new THREE.ExtrudeGeometry(tri, { depth: 2.2, bevelEnabled: false }).translate(0, 1.6, -1.1), mat({ color: 0xd84a3a })],
    [new THREE.BoxGeometry(.45, .8, .02).translate(0, .4, 1.01), mat({ color: 0x6a3a22 })], [new THREE.BoxGeometry(.4, .4, .02).translate(-.65, 1.0, 1.01), bmat({ color: 0x8ad0ff })], [new THREE.BoxGeometry(.4, .4, .02).translate(.65, 1.0, 1.01), bmat({ color: 0x8ad0ff })]];
  const spots = []; for (let i = -22; i <= 22; i++) for (let j = 1; j <= 24; j++) for (const s of [-1, 1]) spots.push([i * 7, -s * (4 + (j - 1) * 7 + (j > 1 ? Math.floor((j - 1) / 2) * 3 : 0)), s > 0 ? 0 : Math.PI]);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  for (const [g, m] of parts) { const im = new THREE.InstancedMesh(g, m, spots.length); spots.forEach(([x, z, ry], k) => im.setMatrixAt(k, M4.compose(V(x, 0, z), Q.setFromAxisAngle(V(0, 1, 0), ry), one))); im.castShadow = im.receiveShadow = !m.isMeshBasicMaterial; scene.add(im); }
  const r = rng(4), clouds = []; for (let i = 0; i < 40; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + r() * 2.5, 0), bmat({ color: 0xffffff, fog: false })); c.scale.y = .45; c.position.set((r() - .5) * 140, 22 + r() * 110, (r() - .5) * 140); scene.add(c); clouds.push(c); }
  const crater = new THREE.Mesh(new THREE.CircleGeometry(.9, 12), bmat({ color: 0x3a6a2a, transparent: true, opacity: .55 })); crater.rotation.x = -Math.PI / 2; crater.position.set(0, .012, .2); crater.scale.set(1, 1.6, 1); scene.add(crater);
  const H = makeHuman(ME); scene.add(H.root);
  return { scene, cam, H, sun, crater, clouds };
}