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
