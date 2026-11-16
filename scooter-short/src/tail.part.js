// ---------- captions ----------
let chunks = [];
function buildCaptions(words) {
  let cur = [];
  const flush = () => { if (cur.length) { chunks.push({ s: cur[0].s, e: cur[cur.length - 1].e, text: cur.map(w => w.w.replace(/[.,?!]+$/, '')).join(' ') }); cur = []; } };
  for (const w of words) { const len = cur.reduce((a, c) => a + c.w.length + 1, 0); if (cur.length >= 3 || len + w.w.length > 16) flush(); cur.push(w); if (/[.,?!]$/.test(w.w)) flush(); }
  flush(); chunks.forEach((c, i) => { const n = chunks[i + 1]; c.s -= .05; c.e = n ? n.s - .05 : c.e + .5; });
}
function drawCaption(t) {
  const c = chunks.find(c => t >= c.s && t < c.e); if (!c) return;
  const k = 1 + .05 * Math.exp(-(t - c.s) * 20), x = out.width / 2, y = out.height * .765;
  og.save(); og.translate(x, y); og.scale(k, k); og.font = '800 54px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle';
  og.shadowColor = 'rgba(0,0,0,.85)'; og.shadowBlur = 16; og.shadowOffsetY = 3; og.fillStyle = '#ffffff'; og.fillText(c.text, 0, 0); og.shadowBlur = 4; og.fillText(c.text, 0, 0); og.restore();
}
// ---------- frame: fake depth of field, quick blur on cuts, ordered dither, grain, vignette ----------
const dofA = document.createElement('canvas'); dofA.width = W; dofA.height = H; const dg = dofA.getContext('2d');
function dofDraw(o) {
  if (!o) { lg.drawImage(renderer.domElement, 0, 0); return; }
  const { b = 1.6, x = .5, y = .45, r = .32 } = o;
  lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H); lg.filter = `blur(${b}px)`; lg.drawImage(renderer.domElement, -3, -3, W + 6, H + 6); lg.filter = 'none';
  dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, W, H); dg.drawImage(renderer.domElement, 0, 0);
  dg.globalCompositeOperation = 'destination-in'; const gr = dg.createRadialGradient(x * W, y * H, r * W * .5, x * W, y * H, r * W * 1.3); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, W, H);
  lg.drawImage(dofA, 0, 0);
}
function blurPass(b) { lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H); lg.filter = `blur(${b}px)`; lg.drawImage(renderer.domElement, -4, -4, W + 8, H + 8); lg.filter = 'none'; }
const CUTS_F = shots.slice(1).map(s => s.f0);
const grain = [0, 1, 2].map(i => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), id = g.createImageData(W, H), r = rng(90 + i); for (let k = 0; k < id.data.length; k += 4) { const v = r() * 255 | 0; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; } g.putImageData(id, 0, 0); return c; });
const vig = document.createElement('canvas'); vig.width = W; vig.height = H; { const g = vig.getContext('2d'), gr = g.createRadialGradient(W / 2, H * .46, W * .35, W / 2, H * .46, H * .62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
let frameNo = 0;
function renderAt(tc) {
  const s = shots.find(s => tc >= s.f0 && tc < s.f1) || shots[shots.length - 1], f = tc - s.f0, fd = s.f1 - s.f0;
  s.update(f, fd, tc); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam);
  const w = Math.max(0, ...CUTS_F.map(c => 1 - Math.abs(tc - c) / .07));
  if (w > .05) blurPass(3.5 * w); else dofDraw(s.dof);
  lg.globalCompositeOperation = 'overlay'; lg.globalAlpha = .07; lg.drawImage(grain[frameNo++ % 3], 0, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over'; lg.drawImage(vig, 0, 0);
  const id = lg.getImageData(0, 0, W, H), d = id.data;
  for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) { const b = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - .5) * 6; d[i] = clamp(d[i] + b, 0, 255) & 0xFC; d[i + 1] = clamp(d[i + 1] + b, 0, 255) & 0xFC; d[i + 2] = clamp(d[i + 2] + b, 0, 255) & 0xFC; }
  lg.putImageData(id, 0, 0); og.imageSmoothingEnabled = false; og.drawImage(lo, 0, 0, out.width, out.height); drawCaption(tc);
}
window.renderTime = tc => { renderAt(tc); return out.toDataURL('image/jpeg', .93); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(TOTAL * FPS);
const words = (await (await fetch('/build/words.json')).json()).map(w => ({ ...w, s: tm(w.s), e: tm(w.e) })); buildCaptions(words);
await document.fonts.load('800 54px Nunito');
window.captionChunks = chunks; window.shotTimes = shots.map(s => [+s.f0.toFixed(2), +s.f1.toFixed(2)]); window.ready = true;
