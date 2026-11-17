// ---------- TEE: wooden TV head (face drawn live on the screen), antennae, tiny top hat, purple tux, floating gloves, a glowing signal tail ----------
function teeScreen() {
  const c = document.createElement('canvas'); c.width = 192; c.height = 144; const g = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
  const COL = '#b8fbff';
  const eye = (x, y, kind, t) => {
    g.strokeStyle = COL; g.fillStyle = COL; g.lineWidth = 8; g.lineCap = 'round';
    if (kind === 'happy') { g.beginPath(); g.arc(x, y + 8, 16, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    else if (kind === 'star') { g.save(); g.translate(x, y); g.rotate(t * 3); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, a = i / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.restore(); }
    else if (kind === 'sly') { g.beginPath(); g.ellipse(x, y + 4, 15, 10, 0, 0, Math.PI); g.fill(); g.beginPath(); g.moveTo(x - 20, y - 2); g.lineTo(x + 20, y + 2); g.stroke(); }
    else if (kind === 'flat') { g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x + 16, y); g.stroke(); }
    else { const s = kind === 'wide' ? 1.35 : 1; g.beginPath(); g.ellipse(x, y, 15 * s, 21 * s, 0, 0, 7); g.fill(); g.fillStyle = '#08202c'; g.beginPath(); g.ellipse(x + 3, y + 3, 6 * s, 8 * s, 0, 0, 7); g.fill(); }
  };
  let last = '';
  function draw(face = {}, lvl = 0, t = 0) {
    const key = JSON.stringify(face) + lvl + (face.glitch || face.eyes === 'star' ? t.toFixed(2) : '');
    if (key === last) return; last = key;
    const gr = g.createRadialGradient(96, 72, 10, 96, 72, 110); gr.addColorStop(0, face.red ? '#3a0a12' : '#0e3446'); gr.addColorStop(1, '#04121a'); g.fillStyle = gr; g.fillRect(0, 0, 192, 144);
    if (face.glitch) { const r = rng((t * 997) | 0); for (let i = 0; i < 260; i++) { const v = r() * 255 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * 192, r() * 144, 4 + r() * 10, 2 + r() * 3); } if (face.glitch > 1) { tex.needsUpdate = true; return; } }
    const L = face.eyesL || face.eyes || 'open', R = face.eyes || 'open';
    eye(62, 54, L, t); eye(130, 54, face.wink ? 'happy' : R, t);
    g.strokeStyle = COL; g.fillStyle = COL; g.lineWidth = 8; g.lineCap = 'round';
    if (lvl > 0) { const h = 10 + lvl * 13; g.beginPath(); g.ellipse(96, 100, 30 + lvl * 4, h / 2, 0, 0, 7); g.fill(); g.fillStyle = '#04121a'; g.beginPath(); g.ellipse(96, 102, 22 + lvl * 3, h / 2 - 6, 0, 0, 7); g.fill(); }
    else { const m = face.mouth || 'grin';
      if (m === 'grin') { g.beginPath(); g.arc(96, 78, 40, Math.PI * .15, Math.PI * .85); g.closePath(); g.fill(); g.fillStyle = '#04121a'; g.fillRect(62, 96, 68, 3); }
      else if (m === 'smile') { g.beginPath(); g.arc(96, 80, 34, Math.PI * .2, Math.PI * .8); g.stroke(); }
      else if (m === 'smirk') { g.beginPath(); g.moveTo(72, 104); g.quadraticCurveTo(110, 110, 124, 92); g.stroke(); }
      else if (m === 'tired') { g.beginPath(); g.moveTo(74, 108); g.quadraticCurveTo(96, 100, 118, 108); g.stroke(); }
      else { g.beginPath(); g.moveTo(72, 104); g.lineTo(120, 104); g.stroke(); } }
    g.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 0; y < 144; y += 4) g.fillRect(0, y, 192, 2);
    tex.needsUpdate = true;
  }
  return { tex, draw };
}
function makeTee() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const suitM = mat({ color: 0x6a2ab8 }), trimM = mat({ color: 0xffc83a }), shirtM = mat({ color: 0xf6f6f6 }), tieM = mat({ color: 0xe8323a }), caseM = mat({ color: 0xb07a48 }), darkM = mat({ color: 0x2a2230 }), gloveM = mat({ color: 0xffffff }), blk = mat({ color: 0x1a1620 });
  body.add(box(.66, .64, .42, suitM, 0, 0, 0)); body.add(box(.22, .52, .02, shirtM, 0, .02, .215));
  for (const s of [-1, 1]) { body.add(box(.05, .62, .02, trimM, s * .15, 0, .216)); body.add(box(.13, .1, .05, tieM, s * .07, .22, .235)); body.add(box(.07, .07, .03, trimM, s * .2, -.16, .22)); body.add(box(.16, .1, .44, trimM, s * .36, .27, 0)); }
  body.add(box(.06, .06, .06, tieM, 0, .22, .24));
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.31, .85, 8).rotateX(Math.PI), suitM); tail.position.y = -.74; body.add(tail);
  const sig = new THREE.Mesh(new THREE.ConeGeometry(.14, .55, 8).rotateX(Math.PI), glowMat(0x7af6ff, .55)); sig.position.y = -1.3; body.add(sig);
  const neck = new THREE.Group(); neck.position.y = .32; body.add(neck); neck.add(box(.2, .1, .2, darkM, 0, .02, 0));
  const head = new THREE.Group(); head.position.y = .07; neck.add(head);
  head.add(box(.98, .74, .64, caseM, 0, .37, 0)); head.add(box(.84, .62, .03, darkM, 0, .37, .32));
  const scr = teeScreen(); const screen = new THREE.Mesh(new THREE.PlaneGeometry(.74, .54), bmat({ map: scr.tex })); screen.position.set(0, .37, .338); head.add(screen);
  for (const y of [.52, .3]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .04, 8), trimM); k.rotation.z = Math.PI / 2; k.position.set(.5, y, .12); head.add(k); }
  for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * .12, .74, 0); a.rotation.z = -s * .45; head.add(a); a.add(box(.025, .5, .025, blk, 0, .25, 0)); a.add(box(.07, .07, .07, trimM, 0, .52, 0)); }
  const hat = new THREE.Group(); hat.position.set(-.26, .74, .02); hat.rotation.z = .22; head.add(hat); hat.add(box(.3, .03, .3, blk, 0, .015, 0)); hat.add(box(.19, .24, .19, blk, 0, .15, 0)); hat.add(box(.195, .05, .195, tieM, 0, .06, 0));
  const hands = [-1, 1].map(s => { const h = new THREE.Group(); h.add(box(.17, .19, .1, gloveM, 0, 0, 0)); h.add(box(.06, .1, .08, gloveM, -s * .1, .02, .02)); h.add(box(.19, .06, .12, trimM, 0, -.11, 0)); body.add(h); return h; });
  const T = { root, body, neck, head, hands, hat, sig, screen: scr,
    face(face, t, talkT = t) { scr.draw(face, face.glitch > 1 ? 0 : teeLvl(talkT), t); },
    pose(t, style = 'idle', k = 1) {   // hands in body space
      const b = Math.sin(t * 2.6) * .04, L = hands[0].position, R = hands[1].position;
      if (style === 'wide') { L.set(-.95, .5 + b, .1); R.set(.95, .5 - b, .1); }
      else if (style === 'jazz') { const j = Math.sin(t * 30) * .04; L.set(-.78, .62 + j, .3); R.set(.78, .62 - j, .3); hands.forEach(h => h.rotation.z = Math.sin(t * 30) * .3); return; }
      else if (style === 'present') { L.set(-.6, -.05 + b, .25); R.set(.9, .35 + Math.sin(t * 4) * .06, .35); }
      else if (style === 'chin') { L.set(-.55, -.1, .2); R.set(.18, .5, .45); }
      else if (style === 'bow') { L.set(-.5, -.25, .4); R.set(.3, .95, .2); }
      else { L.set(-.58, -.05 + b, .18); R.set(.58, -.05 - b, .18); }
      hands.forEach((h, i) => h.rotation.set(0, 0, (i ? -1 : 1) * .2));
    },
    hover(t, a = 1) { body.position.y = Math.sin(t * 2.2) * .07 * a; body.rotation.z = Math.sin(t * 1.6) * .05 * a; sig.scale.set(1 + Math.sin(t * 23) * .12, 1 + Math.sin(t * 17) * .2, 1); sig.material.opacity = .4 + Math.abs(Math.sin(t * 13)) * .3; },
    handTo(i, wpos) { root.updateMatrixWorld(true); hands[i].position.copy(body.worldToLocal(wpos.clone())); },
    headAt() { root.updateMatrixWorld(true); return head.localToWorld(V(0, .37, .34)); },
  };
  return T;
}
// ---------- show-business props ----------
function confetti(scene, n = 70, seed = 1) {
  const r = rng(seed), cols = [0xff3a8a, 0xffd23a, 0x3af0ff, 0x7aff5a, 0xff8a2a, 0xb07aff, 0xffffff];
  const ps = [...Array(n)].map((_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.06, .1), bmat({ color: cols[i % cols.length], side: THREE.DoubleSide })); m.userData = { vx: (r() - .5) * 5, vy: 3 + r() * 4, vz: (r() - .5) * 5, s: r() * 6, ph: r() * 7, x: (r() - .5) * 7, z: (r() - .5) * 6, sp: .6 + r() * .6 }; m.visible = false; scene.add(m); return m; });
  return {
    burst(t, t0, o) { ps.forEach(m => { const u = m.userData, d = t - t0; m.visible = d >= 0; if (!m.visible) return; const a = Math.min(d, .55), fall = Math.max(0, d - .55);
      m.position.set(o.x + u.vx * a * (1 - a * .6) + Math.sin(d * 3 + u.ph) * .15 * fall, Math.max(.02, o.y + u.vy * a * (1 - a * .9) - fall * .9 * u.sp), o.z + u.vz * a * (1 - a * .6) + Math.cos(d * 2.6 + u.ph) * .15 * fall); m.rotation.set(d * 5 + u.s, d * 7 + u.ph, d * 3); }); },
    rain(t, c, top = 6) { ps.forEach(m => { const u = m.userData, q = ((t * .18 * u.sp + u.s / 6) % 1); m.visible = true; m.position.set(c.x + u.x + Math.sin(t * 2 + u.ph) * .3, top - q * top, c.z + u.z + Math.cos(t * 1.7 + u.ph) * .3); m.rotation.set(t * 4 + u.s, t * 5 + u.ph, t * 2); }); },
  };
}
function beam(scene, col, r = 1.1, L = 10) { const g = new THREE.Group(); const geo = new THREE.ConeGeometry(r, L, 20, 1, true); geo.translate(0, -L / 2, 0); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); g.add(m); scene.add(g);
  const sl = new THREE.SpotLight(col, 0, 30, .32, .5, 1.2); scene.add(sl, sl.target);
  return { g, sl, aim(from, to, on = 1) { g.position.copy(from); g.quaternion.setFromUnitVectors(V(0, -1, 0), to.clone().sub(from).normalize()); g.visible = on > .01; m.material.opacity = .16 * on; sl.position.copy(from); sl.target.position.copy(to); sl.intensity = 260 * on; } }; }
function neon(scene, txt, col) { const c = document.createElement('canvas'); c.width = 512; c.height = 192; const g = c.getContext('2d'); g.font = '900 150px Nunito'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = 30; g.fillStyle = col; g.fillText(txt, 256, 100); g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.fillText(txt, 256, 100);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.25), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, fog: false })); scene.add(m); return m; }
function fireworks(scene, n = 3, seed = 2) { const r = rng(seed), cols = [0xff3a8a, 0xffd23a, 0x3af0ff, 0x7aff5a];
  const bursts = [...Array(n)].map((_, b) => ({ c: V((r() - .5) * 14, 7 + r() * 5, -6 - r() * 6), at: b * .35, sp: [...Array(26)].map((_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(.14, .14, .14), glowMat(cols[(b + i) % 4], .95)); m.userData = V(Math.cos(i * 2.4) * Math.sin(i * .9 + 1), Math.cos(i * .9 + 1), Math.sin(i * 2.4) * Math.sin(i * .9 + 1)).normalize(); m.visible = false; scene.add(m); return m; }) }));
  return { at(t, t0) { bursts.forEach(B => { const d = t - t0 - B.at; B.sp.forEach(m => { m.visible = d > 0 && d < 1.6; if (!m.visible) return; const k = 1 - Math.exp(-d * 3); m.position.copy(B.c).addScaledVector(m.userData, k * 3.2); m.position.y -= d * d * .6; m.material.opacity = .95 * (1 - d / 1.6); }); }); } }; }
// the field after dark: flat night sky, dim sun, colored spotlights on
function lightsDown(Wd, k) { if (k <= .001) return; const hemi = Wd.scene.children.find(o => o.isHemisphereLight);
  hemi.intensity = lerp(1.8, .28, k); Wd.sun.intensity = lerp(2.4, .15, k); Wd.scene.background = new THREE.Color(0x8ae8ff).lerp(new THREE.Color(0x140a26), k); Wd.scene.fog.color = new THREE.Color(0xbfefff).lerp(new THREE.Color(0x140a26), k); Wd.clouds.forEach(c => c.visible = k < .5); }
const LD = t => clamp((t - tm(38.6)) / (tm(42.75) - tm(38.6))) * (1 - clamp((t - tm(87.9)) / .5));   // the show lights: down for the song, back up after
const TEEC = V(0, .95, 1.45), TEEP = V(0, .92, 1.02);   // Tee's spot (talking / in your face); Lamar stands at the origin facing +z
// an open plaza around the action: no houses within R (the endless rows stay in the distance)
function clearing(scene, R = 13) { const M = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  scene.children.filter(o => o.isInstancedMesh).forEach(im => { for (let k = 0; k < im.count; k++) { im.getMatrixAt(k, M); M.decompose(p, q, sc); if (Math.hypot(p.x, p.z) < R) { M.compose(p, q, V(0, 0, 0)); im.setMatrixAt(k, M); } } im.instanceMatrix.needsUpdate = true; }); }
// camera in front of Tee's screen (d = distance, side = sideways, up = height offset, dy = aim offset)
function teeCam(cam, T, d = 1.6, side = 0, up = 0, dy = 0) { const h = T.headAt(), fw = T.head.localToWorld(V(0, .37, 1.34)).sub(h).normalize(), rt = V(-fw.z, 0, fw.x).normalize();
  look(cam, h.x + fw.x * d + rt.x * side, h.y + fw.y * d + up, h.z + fw.z * d + rt.z * side, h.x, h.y + dy, h.z); }
// shot on the voice clock
const S = (o0, o1, build, o = {}) => shot(tm(o0), o1 > 900 ? DUR : tm(o1), build, o);
function setup(o = {}) { const Wd = world(); clearing(Wd.scene); const T = makeTee(); Wd.scene.add(T.root); T.root.rotation.y = Math.PI; T.root.position.copy(TEEC); const cf = confetti(Wd.scene, o.conf ?? 70, o.seed || 1); Wd.H.root.position.set(0, 0, 0); return { Wd, T, H: Wd.H, cf, cam: Wd.cam, scene: Wd.scene }; }
const lam = (H, t) => { H.reset(); H.breathe(t); H.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * .1; }); };

// ===================== SHOTS (voice clock) =====================
// 1 still staring at his square hands... BANG: a spotlight slams on him, confetti cannon
const BANG = 3.7;
S(2.6, 4.15, () => { const X = setup();
  const b = beam(X.scene, 0xfff2c8, .9, 12);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const H = X.H; lam(H, t); const fc0 = faceAt(H); const on = t >= tm(BANG); for (const i of [0, 1]) ik(H, i, fc0.clone().add(V((i ? -1 : 1) * .2, -.25 + (on ? .1 : 0), .4))); H.face(on ? 'shocked_c' : 'stare_c', t); H.neck.rotation.x = on ? -.15 : .3;
    X.T.root.visible = false; b.aim(V(0, 11, 2), V(0, 0, 0), on ? 1 : 0); X.cf.burst(t, tm(BANG), V(0, 0, 1.2));
    look(X.cam, 1.4, 1.5, 3.4, 0, 1.25, 0); if (on) shake(X.cam, t, .04 * Math.exp(-(t - tm(BANG)) * 6)); } }; }, { dof: { b: 1.0, x: .5, y: .45, r: .5 } });
// 2 "WELL HELLO, HELLO, HELLOOO!" - Tee rockets down out of the sky and screeches to a stop an inch from his face
S(4.15, 7.25, () => { const X = setup({ seed: 3 }); const tr = [...Array(10)].map((_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .12), glowMat(0x7af6ff, .8)); X.scene.add(m); return m; });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const H = X.H, T = X.T; lam(H, t); const k = clamp(f / 1.05), e = 1 - Math.pow(1 - k, 3);
    const p = vl(V(5, 26, 16), TEEP, e); T.root.position.copy(p); T.root.rotation.set(-.6 * (1 - e), Math.PI, .4 * (1 - e)); T.hover(t, e); T.pose(t, k < 1 ? 'wide' : 'present'); T.face({ eyes: k < 1 ? 'wide' : 'happy' }, t);
    tr.forEach((m, i) => { const q = clamp(e - i * .03); m.position.copy(vl(V(5, 26, 16), TEEP, q)).add(V(0, .4, 0)); m.visible = k < 1 && q > 0; m.scale.setScalar(1 - i / 10); });
    H.face(k > .85 ? 'shocked_c' : 'confused_c', t); H.torso.rotation.x = k > .9 ? -.12 : 0; H.neck.rotation.x = -.35 * (1 - e) - .05;
    if (f < 1.0) look(X.cam, .55, .55, -1.3, p.x * .7, p.y + .6, p.z * .7); else look(X.cam, -1.1, 1.95, -.95, .1, 1.85, 1.0); shake(X.cam, t, .03 * Math.exp(-Math.max(0, f - 1.05) * 8) * (f > 1.05)); } }; }, { dof: null });
// 3 "Look what fell out of the sky today!" - over Lamar's shoulder: Tee all grin, presenting him to nobody
S(7.25, 10.25, () => { const X = setup({ seed: 4 });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const H = X.H, T = X.T; lam(H, t); H.face('shocked_c', t); T.root.position.copy(TEEC); T.hover(t); T.pose(t, f > .6 ? 'present' : 'wide'); T.face({ eyes: 'happy' }, t); T.body.rotation.y = Math.sin(t * 1.4) * .15;
    X.cf.rain(t, V(0, 0, 1)); const hp = T.headAt(); look(X.cam, -.5, 1.95, -.75, hp.x, hp.y - .1, hp.z); handheld(X.cam, t, .003); } }; }, { dof: { b: 1.4, x: .55, y: .4, r: .45 } });
// 4a "AHH! What- who-" - he scrambles backwards
S(10.25, 13.8, () => { const X = setup({ seed: 5 });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const H = X.H, T = X.T; lam(H, t); const k = ss(0, .7, f), hop = Math.sin(clamp(f / .5) * Math.PI) * .25;
    H.root.position.set(0, hop, -.9 * k); H.torso.rotation.x = -.25 * (1 - k * .5); H.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (1.6 + Math.sin(t * 24 + i) * .3); a.rotation.x = -.6; }); talk(H, 'terror', t, 1.6);
    T.root.position.copy(TEEC); T.hover(t); T.pose(t); T.face({ eyes: 'open', mouth: 'grin' }, t); const fc = faceAt(H); look(X.cam, fc.x + .9, fc.y + .05, fc.z + 1.9, fc.x, fc.y - .1, fc.z); handheld(X.cam, t, .004); } }; }, { dof: { b: 1.2, x: .5, y: .45, r: .45 } });
// 4b "...you have a TV for a HEAD!" - side two-shot, pointing
S(13.8, 16.85, () => { const X = setup({ seed: 6 });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const H = X.H, T = X.T; lam(H, t); H.root.position.set(0, 0, -.9); const tgt = T.headAt(); ik(H, 1, wp(H.torso, .42, .63, 0).add(tgt.clone().sub(wp(H.torso, .42, .63, 0)).normalize().multiplyScalar(.74))); H.arms[0].rotation.z = -.4; talk(H, 'shocked', t, 1.3);
    T.root.position.copy(TEEC); T.root.rotation.y = 2.5; T.hover(t); T.pose(t, 'chin'); T.face({ eyes: 'open', mouth: 'smile' }, t); look(X.cam, 3.6, 1.6, .3, 0, 1.45, .3); handheld(X.cam, t, .003); } }; }, { dof: null });
// 5a "And YOU have polygons for a face!" - boop, boop: Tee pokes his cheek
S(16.85, 19.1, () => { const X = setup({ seed: 7 });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const H = X.H, T = X.T; lam(H, t); H.root.position.set(0, 0, -.6); T.root.position.set(.05, .92, .55); T.root.rotation.y = Math.PI + .8; T.hover(t, .5); T.pose(t); T.face({ eyes: 'happy' }, t);
    const fc = faceAt(H), poke = Math.max(0, Math.sin(f * 9)) ** 3; T.handTo(1, fc.clone().add(V(.24, -.05, .14 + .1 * (1 - poke)))); H.head.rotation.z = -poke * .12; H.face(poke > .5 ? 'pain_c' : 'stare_c', t);
    look(X.cam, fc.x - 2.4, fc.y + .45, fc.z + .55, fc.x + .3, fc.y + .1, fc.z + .5); } }; }, { dof: { b: 1.2, x: .55, y: .45, r: .45 } });
// 5b "We're gonna get along GREAT." - Tee loops around him and lands beside him like old pals
S(19.1, 23.3, () => { const X = setup({ seed: 8 });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const H = X.H, T = X.T; lam(H, t); H.root.position.set(0, 0, -.6); const k = ss(0, fd * .8, f), a = k * Math.PI * 2.5;
    T.root.position.set(Math.sin(a) * lerp(1.2, .95, k), .95 + Math.sin(a * 2) * .2 * (1 - k), -.6 + Math.cos(a) * lerp(1.2, .3, k)); T.root.rotation.set(0, a + Math.PI, 0); if (k > .97) T.root.rotation.y = 0; T.hover(t); T.pose(t, k > .9 ? 'wide' : 'idle'); T.face({ eyes: 'happy' }, t);
    H.face('worried_c', t); H.neck.rotation.y = Math.sin(a) * .5; look(X.cam, .4, 1.55, 3.6, .3, 1.35, -.5); handheld(X.cam, t, .003); } }; }, { dof: null });
// 6 "Where am I? What is this place?" - camera circles him; Tee floats behind, grinning
S(23.3, 27.9, () => { const X = setup({ seed: 9 });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const H = X.H, T = X.T; lam(H, t); H.root.position.set(0, 0, -.6); H.neck.rotation.y = Math.sin(f * 2.2) * .6; H.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * .5; a.rotation.x = -.3; }); H.fore.forEach(fr => fr.rotation.x = -.6); talk(H, 'confused', t);
    T.root.position.set(.9, 1.15, -.9); T.root.rotation.y = -.6; T.hover(t); T.pose(t); T.face({ eyes: 'open', mouth: 'grin' }, t);
    const an = lerp(-.5, .9, ss(0, fd, f)), fc = faceAt(H); look(X.cam, Math.sin(an) * 3.2, 1.85, -.6 + Math.cos(an) * 3.2, fc.x * .5, 1.5, -.6); handheld(X.cam, t, .003); } }; }, { dof: { b: 1.0, x: .5, y: .45, r: .5 } });
// 7 "This, my brand new friend, is the greatest show that never ends!" - Tee rises, arms wide, and the camera cranes up over the endless world
S(27.9, 33.5, () => { const X = setup({ seed: 10 });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const H = X.H, T = X.T; lam(H, t); H.root.position.set(0, 0, -.6); H.neck.rotation.x = -.35 * ss(0, 2, f); H.face('stare_c', t); const k = ss(.3, fd, f);
    T.root.position.set(0, lerp(1.0, 4.2, k), lerp(1.4, 2.2, k)); T.hover(t); T.pose(t, 'wide'); T.face({ eyes: f > 2.5 ? 'star' : 'happy' }, t); T.body.rotation.y = Math.sin(t * 1.1) * .2;
    look(X.cam, lerp(.5, 2, k), lerp(1.4, 9, k), lerp(5.2, 13, k), 0, lerp(1.6, 3.4, k), lerp(1, 0, k)); } }; }, { dof: null });
// 8 "And I... am your HOST!" - low angle bow, hat tip; then the lights go DOWN
S(33.5, 40.6, () => { const X = setup({ seed: 11 }); const b = beam(X.scene, 0xffe8b0, 1.0, 12);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const H = X.H, T = X.T; lam(H, t); H.root.position.set(0, 0, -.6); H.face('stare_c', t); const dn = ss(.2, 1.4, f), bow = ss(tm(36.6) - tm(33.5), tm(37.2) - tm(33.5), f) * (1 - ss(tm(38.0) - tm(33.5), tm(38.5) - tm(33.5), f));
    T.root.position.set(0, lerp(3.2, 1.05, dn), 2.0); T.root.rotation.y = 0; T.hover(t); T.root.rotation.x = bow * .55; T.pose(t, bow > .3 ? 'bow' : 'present'); T.hat.position.y = .74 + bow * .25; T.face({ eyes: bow > .3 ? 'happy' : 'open', wink: bow < .3 && f > 1.5 }, t);
    const ld = LD(t); lightsDown(X.Wd, ld); b.aim(V(0, 11, 4), V(0, 1, 2), ld); look(X.cam, .6, .4, 5.4, 0, 1.75, 1.8); } }; }, { dof: null });

// ---------------- SONG: "I'm Tee!" ----------------
function stage(seed) { const X = setup({ seed, conf: 90 }); lightsDown(X.Wd, 1); X.beams = [beam(X.scene, 0xfff2c8, .9, 13), beam(X.scene, 0xff3a8a, 1.2, 14), beam(X.scene, 0x3af0ff, 1.2, 14)];
  X.signs = [['T', 0xff3a8a, -4.5], ['E', 0xffd23a, 0], ['E', 0x3af0ff, 4.5]].map(([c, col, x]) => { const n = neon(X.scene, c, css(col)); n.position.set(x, 4.2, -9); n.scale.setScalar(1.4); return n; }); X.fw = fireworks(X.scene, 4, seed); return X; }
function lightsShow(X, t, on = 1, sweep = 1) { const tp = X.T.root.position.clone();
  X.beams[0].aim(V(0, 12, 4.5), tp.clone().add(V(0, -.6, 0)), on); X.beams[1].aim(V(-6, 12, -2), V(Math.sin(t * 1.3) * 3 * sweep, 0, Math.cos(t * 1.1) * 2), on * .8); X.beams[2].aim(V(6, 12, -2), V(Math.sin(t * 1.5 + 2) * 3 * sweep, 0, Math.cos(t * .9 + 1) * 2), on * .8); }
const signsAt = (X, t, t0) => X.signs.forEach((n, i) => { const k = pop(t - t0 - i * .12); n.visible = k > .01; n.scale.setScalar(1.4 * k * (1 + .04 * Math.sin(t * 8 + i))); });
// 9 "Who's got the screen?" - blackout... a single spotlight SLAMS onto Tee
S(40.6, 45.3, () => { const X = stage(12);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); H.face('stare_c', t); const on = t >= tm(42.75) ? 1 : 0; T.root.position.set(0, 1.25, 2.2); T.root.rotation.y = 0; T.hover(t); T.pose(t, on ? 'present' : 'idle'); T.face(on ? { eyes: 'wide' } : { eyes: 'flat', mouth: 'flat' }, t);
    X.beams[0].aim(V(0, 12, 4.5), V(0, .6, 2.2), on); X.beams[1].aim(V(-6, 12, -2), V(0, 0, 0), 0); X.beams[2].aim(V(6, 12, -2), V(0, 0, 0), 0); X.signs.forEach(n => n.visible = false); X.cf.rain(t, V(0, 0, 0), -9);
    look(X.cam, 1.2, .45, 6.2, 0, 1.9, 2.2); if (on) shake(X.cam, t, .03 * Math.exp(-(t - tm(42.75)) * 6)); } }; }, { dof: null });
// 10 "Who's got the stage?" - wide: colored beams sweep on, giant neon T-E-E pops up behind him
S(45.3, 48.1, () => { const X = stage(13);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); H.face('stare_c', t); T.root.position.set(0, 1.4 + Math.sin(f * 2) * .2, 2.2); T.root.rotation.y = 0; T.hover(t); T.pose(t, 'wide'); T.face({ eyes: 'happy' }, t); T.body.rotation.y = Math.sin(t * 2) * .25;
    lightsShow(X, t, ss(0, .3, f)); signsAt(X, t, tm(45.5)); X.cf.rain(t, V(0, 0, 1)); look(X.cam, 3.5, 2.6, 10.5, 0, 2.6, -1); } }; }, { dof: null });
// 11 "Who's got a smile that never fades away?" - the screen fills the frame: the grin
S(48.1, 52.4, () => { const X = stage(14);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); T.root.position.set(0, 1.2, 2.2); T.hover(t, .4); T.pose(t, 'chin'); T.face({ eyes: f > 1.6 ? 'star' : 'happy' }, t); lightsShow(X, t, 1); signsAt(X, t, -9);
    teeCam(X.cam, T, lerp(1.25, .95, ss(0, fd, f)), .1, .05); } }; }, { dof: null });
// 12 "Who flies the sky and runs the show?" - he loops the loop around Lamar
S(52.4, 57.4, () => { const X = stage(15);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); const a = f * 1.7;
    T.root.position.set(Math.sin(a) * 2.4, 2.0 + Math.sin(a * 2) * .9, -.6 + Math.cos(a) * 2.4); T.root.rotation.set(Math.sin(a * 2) * .3, a + Math.PI / 2 + Math.PI, 0); T.hover(t); T.pose(t, 'wide'); T.face({ eyes: 'happy' }, t);
    H.neck.rotation.y = clamp(Math.sin(a) * 1.2, -.9, .9); H.face('stare_c', t); lightsShow(X, t, 1); signsAt(X, t, -9); X.cf.rain(t, V(0, 0, 0)); look(X.cam, 0, 1.4, 4.6, 0, 1.9, -.6); } }; }, { dof: null });
// 13 "It's me, it's TEE!" - pose, fireworks
S(57.4, 60.0, () => { const X = stage(16);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); T.root.position.set(0, 1.5, 2.2); T.root.rotation.y = 0; T.hover(t); T.pose(t, 'jazz'); T.face({ eyes: 'star' }, t); lightsShow(X, t, 1, 1.6); signsAt(X, t, -9); X.fw.at(t, tm(57.9)); X.cf.burst(t, tm(57.9), V(0, .2, 2.2));
    look(X.cam, -1.6, .7, 7.0, 0, 2.2, 1.0); shake(X.cam, t, .015); } }; }, { dof: null });
// 14a "Didn't you know? Here every day's a HOLIDAY!" - confetti cannons, he dances in the air
S(60.0, 63.6, () => { const X = stage(17);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); H.face('stare_c', t); T.root.position.set(Math.sin(t * 3) * .5, 1.5 + Math.abs(Math.sin(t * 6)) * .3, 2.2); T.root.rotation.y = Math.sin(t * 6) * .4; T.hover(t); T.pose(t, Math.sin(t * 6) > 0 ? 'wide' : 'jazz'); T.face({ eyes: 'happy' }, t);
    lightsShow(X, t, 1, 1.5); signsAt(X, t, -9); X.cf.burst(t, tm(61.6), V(0, 0, 3.5)); look(X.cam, 2.6, 1.4, 6.6, 0, 1.7, 1.2); } }; }, { dof: null });
// 14b "No bills, no school, no work..." - counting them off, right up close
S(63.6, 67.3, () => { const X = stage(18);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); T.root.position.set(0, 1.25, 2.6); T.hover(t, .5); T.pose(t); const cnt = Math.min(2, Math.floor(f / 1.0)); T.hands[1].position.set(.55 + cnt * .1, .35 + cnt * .1, .35); T.face({ eyes: 'open' }, t);
    lightsShow(X, t, 1); signsAt(X, t, -9); X.cf.rain(t, V(0, 0, 2)); teeCam(X.cam, T, 2.1, -.8, -.3, -.35); } }; }, { dof: { b: 1.4, x: .5, y: .45, r: .45 } });
// 15a "...just PLAY! Games every morning, fun every night" - big wide, beams everywhere, he twirls
S(67.3, 71.2, () => { const X = stage(19);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); H.face('stare_c', t); T.root.position.set(0, 2.2 + Math.sin(f * 1.5) * .4, 1.8); T.root.rotation.y = Math.PI + f * 4; T.hover(t); T.pose(t, 'wide'); T.face({ eyes: 'happy' }, t);
    lightsShow(X, t, 1, 2); signsAt(X, t, -9); X.cf.rain(t, V(0, 0, 0)); const a = f * .25; look(X.cam, Math.sin(a) * 9, 4.5, 9.5, 0, 1.8, -.5); } }; }, { dof: null });
// 15b "Why would you EVER want to say goodbye?" - he drifts down to Lamar, sweet as pie
S(71.2, 75.0, () => { const X = stage(20);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); H.face('worried_c', t); const k = ss(0, 2.2, f); T.root.position.copy(vl(V(0, 2.4, 2.0), V(.15, .95, .45), k)); T.hover(t, .5); T.pose(t, 'present'); T.face({ eyes: 'happy', mouth: 'smile' }, t);
    lightsShow(X, t, 1, .5); signsAt(X, t, -9); X.cf.rain(t, V(0, 0, 0)); look(X.cam, 2.3, 1.7, -1.5, 0, 1.6, .1); } }; }, { dof: { b: 1.0, x: .5, y: .45, r: .5 } });
// 16 "...Seriously. Why would you?" - the music drops out, everything goes red, he leans right into the lens
S(75.0, 78.3, () => { const X = stage(21); const red = beam(X.scene, 0xff2030, 1.0, 12);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); X.beams.forEach(b => b.aim(V(0, 12, 4), V(0, 0, 0), 0)); X.signs.forEach(n => n.visible = false); X.cf.rain(t, V(0, 0, 0), -9);
    T.root.position.set(0, 1.2, 2.4); T.root.rotation.x = .25; T.hover(t, .2); T.pose(t, 'chin'); const fl = Math.sin(t * 40) > .85 && f > 1.6 && f < 2.2; T.face(fl ? { glitch: 1, eyes: 'sly', mouth: 'flat', red: true } : { eyes: 'sly', mouth: 'smirk', red: true }, t); red.aim(V(0, 11, 3), V(0, .5, 2.4), 1);
    teeCam(X.cam, T, lerp(1.4, .9, ss(0, fd, f)), .05, -.05); } }; }, { dof: null });
// 17 "So welcome, welcome, take a bow" - party's back; he bows, and pushes Lamar's head down into a bow too
S(78.3, 83.6, () => { const X = stage(22);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); const bw = Math.max(0, Math.sin(clamp((f - 1.2) / 2.4) * Math.PI));
    T.root.position.set(.85, 1.2, -.3); T.root.rotation.set(bw * .5, -Math.PI / 2 - .3, 0); T.hover(t); T.pose(t); T.face({ eyes: 'happy' }, t); const fc = faceAt(H); T.handTo(0, fc.clone().add(V(0, .3, -.1)));
    H.torso.rotation.x = bw * .55; H.face(bw > .3 ? 'pain_c' : 'stare_c', t); lightsShow(X, t, 1); signsAt(X, t, tm(78.4)); X.cf.rain(t, V(0, 0, 0)); look(X.cam, 3.2, 1.5, 3.0, .3, 1.3, -.4); } }; }, { dof: null });
// 18 "You're one of us, you're LOADED now!" - big finish: fireworks, confetti, jazz hands, camera flies back
S(83.6, 88.6, () => { const X = stage(23);
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); H.face('stare_c', t); T.root.position.set(0, 1.9, 1.6); T.root.rotation.y = 0; T.hover(t); T.pose(t, 'jazz'); T.face({ eyes: 'star' }, t);
    lightsShow(X, t, 1, 2); signsAt(X, t, -9); X.fw.at(t, tm(85.3)); X.cf.burst(t, tm(86.2), V(0, .2, 2)); const k = ss(1.5, fd, f); look(X.cam, lerp(1, 4, k), lerp(1.2, 5.5, k), lerp(5.5, 16, k), 0, lerp(2, 2.6, k), 0); } }; }, { dof: null });
// 19 "...Did you just sing at me?" - lights back up. Deadpan. One last piece of confetti lands on his head
S(88.6, 93.5, () => { const X = setup({ seed: 24, conf: 1 });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); talk(H, 'stare', t); T.root.position.set(1.25, 1.05, .5); T.root.rotation.y = -1.25; T.hover(t); T.pose(t, 'jazz'); T.face({ eyes: 'happy' }, t); lightsDown(X.Wd, LD(t));
    const fc = faceAt(H), c = X.scene.children.find(o => o.isMesh && o.geometry.type === 'PlaneGeometry' && o.material.side === THREE.DoubleSide); if (c) { const k = clamp(f / 2.2); c.visible = true; c.position.copy(fc).add(V(Math.sin(f * 3) * .2 * (1 - k), .55 + 1.5 * (1 - k), -.15)); c.rotation.set(f * 3 * (1 - k), f * 2 * (1 - k), .3); }
    look(X.cam, fc.x - .3, fc.y + .1, fc.z + 1.5, fc.x, fc.y + .05, fc.z); } }; }, { dof: { b: 1.6, x: .5, y: .45, r: .4 } });
// 20 "Every new player gets a song! It's tradition!" - Tee, beaming
S(93.5, 97.2, () => { const X = setup({ seed: 25, conf: 0 });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); H.face('stare_c', t); T.root.position.set(1.25, 1.05, .5); T.root.rotation.y = -1.25; T.hover(t); T.pose(t, f > 1.6 ? 'wide' : 'present'); T.face({ eyes: 'happy' }, t);
    teeCam(X.cam, T, 2.0, .7, -.1, -.25); handheld(X.cam, t, .003); } }; }, { dof: { b: 1.2, x: .5, y: .45, r: .45 } });
// 21 "How many 'new players' are there?" - Lamar, suspicious
S(97.2, 101.3, () => { const X = setup({ seed: 26, conf: 0 });
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); H.root.position.set(0, 0, -.6); H.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * .2; }); talk(H, 'worried', t); T.root.position.set(1.25, 1.05, .5); T.root.rotation.y = -1.25; T.hover(t); T.pose(t); T.face({ eyes: 'happy' }, t);
    const fc = faceAt(H); look(X.cam, fc.x - .5, fc.y + .05, fc.z + 1.6, fc.x, fc.y - .1, fc.z); handheld(X.cam, t, .003); } }; }, { dof: { b: 1.4, x: .5, y: .45, r: .42 } });
// 22 - the screen flickers to static for a beat... "Oh, you'll meet the gang! Come, come!" - grabs his wrist and ROCKETS off, Lamar flapping behind
const GLT = 101.95, GO = 106.3;
S(101.3, 999, () => { const X = setup({ seed: 27, conf: 0 }); const cow = makeCow(); X.scene.add(cow); cow.position.set(-2.6, 0, -2.2); cow.rotation.y = .6;
  return { scene: X.scene, cam: X.cam, update(f, fd, t) { const T = X.T, H = X.H; lam(H, t); cow.userData.anim(t); const g = t > tm(GLT) && t < tm(GLT) + .35, gone = clamp((t - tm(GO)) / 1.1);
    const e = gone * gone; const tp = V(.1 + e * 9, 1.0 + e * 7, 1.0 - e * 30); T.root.position.copy(tp); T.root.rotation.set(-.4 * gone, Math.PI, 0); T.hover(t); T.pose(t, gone > 0 ? 'wide' : 'present'); T.face(g ? { glitch: 2 } : { eyes: 'happy' }, t);
    if (gone > 0) { H.root.position.copy(tp.clone().add(V(.1, -1.2 - Math.sin(t * 20) * .1, -.3))); H.root.rotation.set(-1.2, 0, Math.sin(t * 18) * .3); H.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 22 + i * 3) * .7); H.face('terror_scream', t); T.handTo(1, wp(H.fore[1], 0, -.44, .04)); H.arms[1].rotation.x = -2.9; }
    else { H.root.position.set(0, 0, -.6); H.face(g ? 'worried_c' : 'stare_c', t); }
    this.fade = ss(fd - .6, fd - .05, f); look(X.cam, -1.6, 1.4, 4.2, .4, 1.5, -.2); } }; }, { dof: null });
shots.forEach(S_ => { if (!S_.cam.parent) S_.scene.add(S_.cam); });

// glitch + flash for the post pass
const glitchAt = t => Math.max(t > tm(GLT) && t < tm(GLT) + .35 ? .7 : 0, t > tm(76.6) && t < tm(77.1) ? .35 : 0, 0);
const flashAt = t => Math.max(t > tm(BANG) && t < tm(BANG) + .4 ? .7 * Math.exp(-(t - tm(BANG)) * 9) : 0, t > tm(42.75) && t < tm(42.75) + .3 ? .5 * Math.exp(-(t - tm(42.75)) * 10) : 0);
