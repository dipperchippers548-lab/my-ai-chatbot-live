
// ---------- captions: one word at a time, white with a thick black outline ----------
let words = [];
function drawCaption(t) {
  const i = words.findIndex((w, k) => t >= w.s - .03 && t < (words[k + 1] ? words[k + 1].s - .03 : w.e + .35)); if (i < 0) return; const w = words[i];
  const k = 1 + .08 * Math.exp(-(t - w.s) * 25), text = w.w.replace(/[.,?!]+$/, ''); og.save(); og.translate(out.width / 2, out.height * .7); og.scale(k, k);
  og.font = '900 84px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.strokeStyle = '#0d0a08'; og.lineWidth = 16; og.strokeText(text, 0, 3); og.fillStyle = '#ffffff'; og.fillText(text, 0, 0); og.restore();
}
// ---------- frame ----------
function renderAt(t) {
  const s = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1], tl = t - s.t0;
  s.update(tl, s.t1 - s.t0, t); (s.toons || []).forEach(c => { c.face(s.cam); c.draw(); }); s.cam.updateMatrixWorld(); renderer.render(s.scene, s.cam);
  const dof = typeof s.dof === 'function' ? s.dof(tl) : s.dof;
  og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high';
  if (dof) { og.filter = `blur(${dof.b * SCALE}px)`; og.drawImage(renderer.domElement, -8, -8, out.width + 16, out.height + 16); og.filter = 'none';
    sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, sharp.width, sharp.height); sg.drawImage(renderer.domElement, 0, 0, sharp.width, sharp.height); sg.globalCompositeOperation = 'destination-in';
    const gr = sg.createRadialGradient(sharp.width * (dof.x || .5), sharp.height * (dof.y || .5), sharp.width * (dof.r || .35) * .55, sharp.width * (dof.x || .5), sharp.height * (dof.y || .5), sharp.width * (dof.r || .35) * 1.35); gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, sharp.width, sharp.height); og.drawImage(sharp, 0, 0); }
  else og.drawImage(renderer.domElement, 0, 0, out.width, out.height);
  const vg = og.createRadialGradient(out.width / 2, out.height / 2, out.height * .35, out.width / 2, out.height / 2, out.height * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); og.fillStyle = vg; og.fillRect(0, 0, out.width, out.height);
  drawCaption(t);
}
window.renderTime = t => { renderAt(t); return out.toDataURL('image/jpeg', .92); };
const cutInfo = await (await fetch('/build/cuts.json')).json();
const toOriginal = tc => { let t = tc * (cutInfo.speed || 1); for (const [a, b] of cutInfo.cuts) { if (t >= a) t += b - a; else break; } return Math.min(t, DUR - .001); };
window.renderFrame = i => window.renderTime(toOriginal((i + .5) / FPS));
window.frameCount = Math.round(cutInfo.duration * FPS);
words = await (await fetch('/build/words.json')).json();
await document.fonts.load('900 84px Nunito');
window.captionChunks = words.map(w => ({ s: w.s, e: w.e, text: w.w })); window.ready = true;
