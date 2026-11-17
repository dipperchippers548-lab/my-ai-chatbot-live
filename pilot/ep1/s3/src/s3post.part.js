// ---------- post: depth of field, glitch, flash, grain, vignette, time stamp, title ----------
const dofA = document.createElement('canvas'); dofA.width = W; dofA.height = H; const dg = dofA.getContext('2d');
function dofDraw(o) {
  if (!o) { lg.drawImage(renderer.domElement, 0, 0); return; }
  const { b = 1.6, x = .5, y = .45, r = .32 } = o;
  lg.fillStyle = '#000'; lg.fillRect(0, 0, W, H); lg.filter = `blur(${b}px)`; lg.drawImage(renderer.domElement, -3, -3, W + 6, H + 6); lg.filter = 'none';
  dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, W, H); dg.drawImage(renderer.domElement, 0, 0);
  dg.globalCompositeOperation = 'destination-in'; const gr = dg.createRadialGradient(x * W, y * H, r * W * .5, x * W, y * H, r * W * 1.3); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, W, H);
  lg.drawImage(dofA, 0, 0);
}
const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d');
function glitch(g, t) {
  if (g <= .02) return; tg.clearRect(0, 0, W, H); tg.drawImage(lo, 0, 0); const r = rng((t * 997) | 0);
  for (let i = 0; i < 14 * g; i++) { const y = r() * H | 0, h = 4 + r() * 40 * g | 0, dx = (r() - .5) * 60 * g | 0; lg.drawImage(tmp, 0, y, W, h, dx, y, W, h); }
  lg.globalCompositeOperation = 'lighter'; lg.globalAlpha = .45 * g; lg.drawImage(tmp, 6 * g, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 6 * g; i++) { lg.fillStyle = ['#ff2a8a', '#2affd8', '#ffffff', '#000000'][i % 4]; lg.fillRect(r() * W, r() * H, 8 + r() * 40, 3 + r() * 10); }
}
const grain = [0, 1, 2].map(i => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), id = g.createImageData(W, H), r = rng(90 + i); for (let k = 0; k < id.data.length; k += 4) { const v = r() * 255 | 0; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; } g.putImageData(id, 0, 0); return c; });
const vig = document.createElement('canvas'); vig.width = W; vig.height = H; { const g = vig.getContext('2d'), gr = g.createRadialGradient(W / 2, H * .46, H * .45, W / 2, H * .46, W * .62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function drawTitle(f) {   // "LOADED IN" slams in with an RGB split, then EPISODE 1 under it; fade to black at the end
  const X = out.width / 2, Y = out.height * .44, s = f < .25 ? 1 + 2.2 * (1 - f / .25) ** 2 : 1 + .03 * Math.exp(-(f - .25) * 10) * Math.cos((f - .25) * 40);
  og.save(); og.translate(X, Y); og.scale(s, s); og.textAlign = 'center'; og.textBaseline = 'middle'; og.font = '900 150px Nunito';
  const jit = f < .6 ? (Math.sin(f * 90) * 10 * (1 - f / .6)) : 0;
  og.globalAlpha = Math.min(1, f / .1); og.fillStyle = 'rgba(255,40,140,.85)'; og.fillText('LOADED', -6 + jit, -70); og.fillText('IN', -6 + jit, 70); og.fillStyle = 'rgba(40,255,220,.85)'; og.fillText('LOADED', 6 - jit, -70); og.fillText('IN', 6 - jit, 70);
  og.lineWidth = 14; og.strokeStyle = '#111'; og.strokeText('LOADED', 0, -70); og.strokeText('IN', 0, 70); og.fillStyle = '#ffffff'; og.fillText('LOADED', 0, -70); og.fillText('IN', 0, 70);
  og.restore(); if (f > .9) { og.save(); og.globalAlpha = Math.min(1, (f - .9) / .3); og.font = '800 54px Nunito'; og.textAlign = 'center'; og.fillStyle = '#ffffff'; og.shadowColor = 'rgba(0,0,0,.8)'; og.shadowBlur = 14; og.fillText('EPISODE 1', X, Y + 240); og.restore(); }
  const fade = ss(4.3, 5.1, f); if (fade > 0) { og.fillStyle = `rgba(0,0,0,${fade})`; og.fillRect(0, 0, out.width, out.height); }
}
let frameNo = 0;
function renderAt(t) {
  const s = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1], f = t - s.t0, fd = s.t1 - s.t0;
  s.update(f, fd, t); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam); dofDraw(s.dof);
  lg.globalCompositeOperation = 'overlay'; lg.globalAlpha = s.real ? .12 : .06; lg.drawImage(grain[frameNo++ % 3], 0, 0); lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-over'; lg.drawImage(vig, 0, 0);
  if (!s.real) { const id = lg.getImageData(0, 0, W, H), d = id.data; for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) { const b = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - .5) * 6; d[i] = clamp(d[i] + b, 0, 255) & 0xFC; d[i + 1] = clamp(d[i + 1] + b, 0, 255) & 0xFC; d[i + 2] = clamp(d[i + 2] + b, 0, 255) & 0xFC; } lg.putImageData(id, 0, 0); }
  glitch(glitchAt(t), t); const fa = flashAt(t); if (fa > .01) { lg.fillStyle = `rgba(255,255,255,${fa})`; lg.fillRect(0, 0, W, H); }
  og.imageSmoothingEnabled = !!s.real; og.drawImage(lo, 0, 0, out.width, out.height);
  if (s.stamp) { og.save(); og.globalAlpha = Math.min(1, f / .4) * (1 - ss(s.t1 - s.t0 - .4, s.t1 - s.t0, f)); og.font = '800 46px Nunito'; og.fillStyle = '#ffffff'; og.shadowColor = 'rgba(0,0,0,.8)'; og.shadowBlur = 10; og.fillText(s.stamp, 60, out.height - 110); og.restore(); }
  if (s.fade) { og.fillStyle = `rgba(0,0,0,${s.fade})`; og.fillRect(0, 0, out.width, out.height); }
}
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .93); };
window.renderFrame = i => window.renderTime((i + .5) / FPS);
window.frameCount = Math.round(DUR * FPS);
await document.fonts.load('900 150px Nunito');
window.captionChunks = []; window.ready = true;
