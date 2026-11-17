// ---------- captions: one word at a time, white with a thick black outline, pop-in ----------
const words = (await (await fetch('/build/words.json')).json()).map(w => ({ w: w.w.replace(/[.,?!]+$/, ''), s: tm(w.s), e: tm(w.e) }));
words.forEach((w, i) => { const n = words[i + 1]; w.s -= .04; w.e = n ? Math.max(w.e, n.s - .04) : w.e + .5; });
function drawCaption(tc) {
  const c = words.find(w => tc >= w.s && tc < w.e); if (!c) return; const k = 1 + .12 * Math.exp(-(tc - c.s) * 18);
  og.save(); og.translate(W / 2, H * .66); og.scale(k, k); og.font = '900 96px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  og.lineWidth = 20; og.strokeStyle = '#16121a'; og.strokeText(c.w.toUpperCase(), 0, 0); og.fillStyle = '#ffffff'; og.fillText(c.w.toUpperCase(), 0, 0); og.restore();
}
// ---------- frame: render, cross-fades between shots, dream frames, viewfinder, emotion flash, fades ----------
const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d');
function renderShot(s, tc) { for (const g of live) { if (g.parent) g.parent.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } live = []; const f = tc - s.f0; s.update(f, s.f1 - s.f0, tc); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam); }
function post(s, tc) {
  if (s.dream) { og.save(); og.globalCompositeOperation = 'soft-light'; og.globalAlpha = .55; og.fillStyle = s.dream; og.fillRect(0, 0, W, H); og.restore();
    og.save(); og.fillStyle = 'rgba(255,255,255,.92)'; const r = rng(7); for (let i = 0; i < 44; i++) { const side = i % 4, u = r(); const x = side < 2 ? (side ? W : 0) : u * W, y = side < 2 ? u * H : (side === 2 ? 0 : H); og.beginPath(); og.arc(x, y, 70 + r() * 70 + Math.sin(tc * 2 + i) * 6, 0, 7); og.fill(); } og.restore(); }
  if (s.viewfinder) { og.save(); og.strokeStyle = 'rgba(255,255,255,.9)'; og.lineWidth = 8; const m = 90, L = 110; for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { og.beginPath(); og.moveTo(x, y + dy * L); og.lineTo(x, y); og.lineTo(x + dx * L, y); og.stroke(); }
    if (Math.sin(tc * 6) > 0) { og.fillStyle = '#ff2020'; og.beginPath(); og.arc(m + 50, m + 70, 20, 0, 7); og.fill(); } og.font = '900 54px Nunito'; og.fillStyle = '#fff'; og.fillText('REC', m + 85, m + 88); og.textAlign = 'right'; og.fillText('03:00 AM', W - m - 30, m + 88);
    og.globalCompositeOperation = 'multiply'; og.fillStyle = 'rgba(160,200,255,.6)'; og.fillRect(0, 0, W, H); og.restore(); }
  if (s.flash) { og.save(); const gr = og.createRadialGradient(W / 2, H * .38, 50, W / 2, H * .38, 700); gr.addColorStop(0, s.flash + 'aa'); gr.addColorStop(1, s.flash + '00'); og.globalCompositeOperation = 'screen'; og.fillStyle = gr; og.fillRect(0, 0, W, H); og.restore(); }
  const vg = og.createRadialGradient(W / 2, H * .45, W * .45, W / 2, H * .45, H * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); og.fillStyle = vg; og.fillRect(0, 0, W, H);
  if (s.fade) { og.fillStyle = `rgba(0,0,0,${s.fade})`; og.fillRect(0, 0, W, H); }
}
const XF = .22;
function renderAt(tc) {
  const i = shots.findIndex(s => tc >= s.f0 && tc < s.f1), s = shots[i < 0 ? shots.length - 1 : i], nx = shots[i + 1];
  renderShot(s, tc); og.drawImage(renderer.domElement, 0, 0); post(s, tc);
  if (nx && nx.xf && tc > s.f1 - XF) { tg.drawImage(out, 0, 0); renderShot(nx, nx.f0 + .001); og.drawImage(renderer.domElement, 0, 0); post(nx, nx.f0); const a = (tc - (s.f1 - XF)) / XF; og.save(); og.globalAlpha = 1 - a; og.drawImage(tmp, 0, 0); og.restore(); }
  drawCaption(tc);
}
window.renderTime = tc => { renderAt(tc); return out.toDataURL('image/jpeg', .92); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(TOTAL * FPS);
await document.fonts.load('900 96px Nunito');
window.captionChunks = words.slice(0, 3); window.ready = true;
