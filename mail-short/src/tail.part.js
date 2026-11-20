// ---------- captions: one word at a time, white with a thick black outline, pop-in ----------
const words0 = (await (await fetch('/build/words.json')).json()).map(w => ({ w: w.w, s: tm(w.s), e: tm(w.e) }));
// Ricks-style captions: lowercase, 1-2 words (tiny words ride with the next one), punctuation kept, smaller, low on screen
const words = []; for (let i = 0; i < words0.length; i++) { const w = words0[i], n = words0[i + 1];
  if (n && w.w.replace(/[^a-z']/gi, '').length <= 3 && !/[.,?!]$/.test(w.w) && n.s - w.e < .25) { words.push({ w: w.w + ' ' + n.w, raw: n.w, s: w.s, e: n.e }); i++; } else words.push({ w: w.w, raw: w.w, s: w.s, e: w.e }); }
words.forEach((w, i) => { const n = words[i + 1]; w.s -= .04; w.e = n ? Math.max(w.e, n.s - .04) : w.e + .5; });
function drawCaption(tc) {
  const c = words.find(w => tc >= w.s && tc < w.e); if (!c) return; const k = 1 + .08 * Math.exp(-(tc - c.s) * 18);
  og.save(); og.translate(W / 2, H * .7); og.scale(k, k); og.font = '900 68px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  const txt = c.w.toLowerCase().replace(/\.\.\./g, ''); og.lineWidth = 15; og.strokeStyle = '#16121a'; og.strokeText(txt, 0, 0); og.fillStyle = '#ffffff'; og.fillText(txt, 0, 0); og.restore();
}
// ---------- frame: render, cross-fades between shots, dream frames, viewfinder, emotion flash, fades ----------
const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d');
const scopeC = document.createElement('canvas'); scopeC.width = W; scopeC.height = H; { const b = scopeC.getContext('2d'); b.fillStyle = '#000'; b.fillRect(0, 0, W, H); b.globalCompositeOperation = 'destination-out'; b.beginPath(); b.arc(W / 2, H * .46, W * .44, 0, 7); b.fill(); }
const bino = document.createElement('canvas'); bino.width = W; bino.height = H; { const b = bino.getContext('2d'); b.fillStyle = '#000'; b.fillRect(0, 0, W, H); b.globalCompositeOperation = 'destination-out'; const r = W * .4; for (const x of [W / 2 - r * .62, W / 2 + r * .62]) { b.beginPath(); b.arc(x, H * .46, r, 0, 7); b.fill(); } }
// ---- camera energy layer, applied on top of every shot ----
const KEY = /1964|^box|broke|watch|crate|cash|nailed|cargo|wrong|paris|sixty|perth|walked|nobody|home|why|boxes|opened|bouncer|deliveries/i;
const kicks = () => words.filter((w, i) => KEY.test(w.w) || /[?!]$/.test(w.raw || '') || (i > 0 && /[?]$/.test(words[i - 1].raw || ''))).map(w => w.s + .04);
let KICKS = null;
function renderShot(s, tc) {
  for (const g of live) { if (g.parent) g.parent.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } live = [];
  NOW = tc; const f = tc - s.f0, fd = s.f1 - s.f0; s.update(f, fd, tc);
  statics.forEach(g => { if (g.parent !== s.scene) return; const b = Math.sin(tc * 4.4 + g.userData.seed), s0 = g.userData.s0; g.scale.set(s0 * (1 + .03 * b), s0 * (1 - .04 * b), s0 * (1 + .03 * b)); });
  const cam = s.cam, fov0 = cam.fov; KICKS = KICKS || kicks();
  let fov = fov0 * (1.06 - .06 * (f / Math.max(fd, .1)));   // slow, steady push through every shot                                   // punchy push-in at the top of every shot
  const kz = KICKS.reduce((a, k) => a + (tc >= k ? Math.exp(-(tc - k) * 9) * (1 - Math.exp(-(tc - k) * 60)) : 0), 0); fov *= 1 - .03 * Math.min(1.3, kz);   // kick-zooms on key words
  if (s.punch && fd > 2.4) { const mid = words.find(w => w.s > s.f0 + fd * .45 && w.s < s.f0 + fd * .78); if (mid && tc >= mid.s) { fov *= .74; cam.rotation.z += .02; } }   // punch-in cut: a second, tighter angle
  cam.rotation.x += (Math.sin(tc * 2.3) * .6 + Math.sin(tc * 5.3 + 1) * .35) * .007; cam.rotation.y += (Math.sin(tc * 1.9 + 2) * .6 + Math.sin(tc * 4.9) * .35) * .007;   // hand-held
  const wo = s.f1 - tc, wi = tc - s.f0;    // whip pan out / in
  cam.fov = fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); (s.hq ? hqRender(s.scene, cam) : (renderer.toneMapping = THREE.NoToneMapping, renderer.render(s.scene, cam))); cam.fov = fov0; cam.updateProjectionMatrix();
}
// motion-blur smear across hard cuts (whip pans)
function whipBlur(tc) { return; let w = 0; for (const s of shots) { if (s.f0 > 0 && !s.xf) w = Math.max(w, 1 - Math.abs(tc - s.f0) / .1); } if (w <= .02) return; tg.drawImage(out, 0, 0); og.save(); og.globalAlpha = .22; for (let k = -4; k <= 4; k++) og.drawImage(tmp, k * 26 * w, 0); og.restore(); }
function post(s, tc) {
  if (s.dream) { og.save(); og.globalCompositeOperation = 'soft-light'; og.globalAlpha = .55; og.fillStyle = s.dream; og.fillRect(0, 0, W, H); og.restore();
    og.save(); og.fillStyle = 'rgba(255,255,255,.92)'; const r = rng(7); for (let i = 0; i < 44; i++) { const side = i % 4, u = r(); const x = side < 2 ? (side ? W : 0) : u * W, y = side < 2 ? u * H : (side === 2 ? 0 : H); og.beginPath(); og.arc(x, y, 70 + r() * 70 + Math.sin(tc * 2 + i) * 6, 0, 7); og.fill(); } og.restore(); }
  if (s.viewfinder) { og.save(); og.strokeStyle = 'rgba(255,255,255,.9)'; og.lineWidth = 8; const m = 90, L = 110; for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { og.beginPath(); og.moveTo(x, y + dy * L); og.lineTo(x, y); og.lineTo(x + dx * L, y); og.stroke(); }
    if (Math.sin(tc * 6) > 0) { og.fillStyle = '#ff2020'; og.beginPath(); og.arc(m + 50, m + 70, 20, 0, 7); og.fill(); } og.font = '900 54px Nunito'; og.fillStyle = '#fff'; og.fillText('REC', m + 85, m + 88); og.textAlign = 'right'; og.fillText(typeof s.viewfinder === 'string' ? s.viewfinder : '03:00 AM', W - m - 30, m + 88);
    og.globalCompositeOperation = 'multiply'; og.fillStyle = 'rgba(160,200,255,.6)'; og.fillRect(0, 0, W, H); og.restore(); }
  if (s.flash) { og.save(); const gr = og.createRadialGradient(W / 2, H * .38, 50, W / 2, H * .38, 700); gr.addColorStop(0, s.flash + 'aa'); gr.addColorStop(1, s.flash + '00'); og.globalCompositeOperation = 'screen'; og.fillStyle = gr; og.fillRect(0, 0, W, H); og.restore(); }
  if (s.doorcam) { og.save(); og.globalCompositeOperation = 'multiply'; og.fillStyle = 'rgb(175,200,235)'; og.fillRect(0, 0, W, H); og.restore();
    const fe = og.createRadialGradient(W / 2, H / 2, W * .38, W / 2, H / 2, H * .6); fe.addColorStop(0, 'rgba(0,0,0,0)'); fe.addColorStop(1, 'rgba(0,0,0,.97)'); og.fillStyle = fe; og.fillRect(0, 0, W, H);
    og.save(); og.font = '900 52px Nunito'; og.fillStyle = '#fff'; og.textAlign = 'left'; og.fillText(s.camLabel || 'FRONT DOOR', 90, 190); og.textAlign = 'right'; og.fillText(s.doorcam, W - 90, 190); if (Math.sin(tc * 6) > 0) { og.fillStyle = '#ff2020'; og.beginPath(); og.arc(110, 262, 17, 0, 7); og.fill(); } og.fillStyle = '#fff'; og.textAlign = 'left'; og.fillText('LIVE', 142, 280); og.restore();
    if (s.circle) { const [cx, cy, rr, k] = s.circle; og.save(); og.strokeStyle = '#ff2a2a'; og.lineWidth = 16; og.lineCap = 'round'; og.beginPath(); og.ellipse(cx, cy, rr, rr * 1.12, -.25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2.15 * k); og.stroke(); og.restore(); } }
  if (s.binoc) og.drawImage(bino, 0, 0);
  if (s.scope) { og.drawImage(scopeC, 0, 0); og.save(); og.strokeStyle = 'rgba(20,20,20,.85)'; og.lineWidth = 4; const cx = W / 2, cy = H * .46, r = W * .44; og.beginPath(); og.moveTo(cx - r, cy); og.lineTo(cx + r, cy); og.moveTo(cx, cy - r); og.lineTo(cx, cy + r); og.stroke(); for (let i = -4; i <= 4; i++) { if (!i) continue; og.beginPath(); og.moveTo(cx + i * r / 5, cy - 14); og.lineTo(cx + i * r / 5, cy + 14); og.stroke(); } og.restore(); }
  if (s.sepia) { og.save(); og.globalCompositeOperation = 'color'; og.globalAlpha = .6; og.fillStyle = '#c8955a'; og.fillRect(0, 0, W, H); og.globalCompositeOperation = 'soft-light'; og.globalAlpha = .45; og.fillStyle = '#ffd08a'; og.fillRect(0, 0, W, H); og.restore(); }
  if (!s.hq) { const vg = og.createRadialGradient(W / 2, H * .45, W * .45, W / 2, H * .45, H * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); og.fillStyle = vg; og.fillRect(0, 0, W, H); }
  if (s.fade) { og.fillStyle = `rgba(0,0,0,${s.fade})`; og.fillRect(0, 0, W, H); }
}
const XF = .22;
function renderAt(tc) {
  const i = shots.findIndex(s => tc >= s.f0 && tc < s.f1), s = shots[i < 0 ? shots.length - 1 : i], nx = shots[i + 1];
  renderShot(s, tc); og.drawImage(renderer.domElement, 0, 0, W, H); post(s, tc);
  if (nx && nx.xf && tc > s.f1 - XF) { tg.drawImage(out, 0, 0); renderShot(nx, nx.f0 + .001); og.drawImage(renderer.domElement, 0, 0, W, H); post(nx, nx.f0); const a = (tc - (s.f1 - XF)) / XF; og.save(); og.globalAlpha = 1 - a; og.drawImage(tmp, 0, 0); og.restore(); }
  whipBlur(tc); drawCaption(tc);
}
window.renderTime = tc => { renderAt(tc); return out.toDataURL('image/jpeg', .92); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(TOTAL * FPS);
await document.fonts.load('900 96px Nunito');
window.captionChunks = words.slice(0, 3); window.ready = true;
