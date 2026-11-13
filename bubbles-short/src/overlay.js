// 2D overlay: sing-along lyric captions (karaoke colouring per syllable) and the title / end cards.
import { clamp, ss } from './lib.js';
const LYRIC_FILL = '#ffffff', LYRIC_SUNG = '#ffe14d', LYRIC_INK = '#4b2a8a';

function lineSegments(TL) {
  if (TL._segs) return TL._segs;
  const segs = [];
  for (const l of TL.sung) {
    // map syllables to words of the printed text
    const words = l.text.split(' '); const syl = l.notes; let si = 0; const wt = [];
    for (const w of words) {
      const clean = w.replace(/[^A-Za-z']/g, '').toLowerCase(); let acc = '', start = null, end = null;
      while (si < syl.length && acc.length < clean.replace(/'/g, '').length) { const [s, m, t, d] = syl[si]; if (start === null) start = t; end = t + d; acc += s.toLowerCase().replace(/[^a-z]/g, ''); si++; }
      wt.push({ w, s: start ?? (wt.at(-1)?.e ?? syl[0][2]), e: end ?? (wt.at(-1)?.e ?? syl[0][2]) });
    }
    segs.push({ words: wt, s: syl[0][2], e: syl.at(-1)[2] + syl.at(-1)[3] });
  }
  // spoken lines: group consecutive spoken words by the bar they belong to
  for (const l of TL.spoken) segs.push({ words: l.text.split(' ').map(w => ({ w, s: l.s, e: l.e })), s: l.s, e: l.e, spoken: true, who: l.who });
  segs.sort((a, b) => a.s - b.s);
  // display window: from a beat before the line until the next line starts (max 0.9 s after it ends)
  for (let i = 0; i < segs.length; i++) { const nx = segs[i + 1]; segs[i].show0 = segs[i].s - .3; segs[i].show1 = Math.min(segs[i].e + .9, nx ? nx.s - .3 : 1e9); }
  TL._segs = segs; return segs;
}

function wrap(g, words, maxW) {
  const lines = [[]]; let w = 0; const sp = g.measureText(' ').width;
  for (const x of words) { const ww = g.measureText(x.w).width; if (lines.at(-1).length && w + sp + ww > maxW) { lines.push([]); w = 0; } lines.at(-1).push({ ...x, ww }); w += (lines.at(-1).length > 1 ? sp : 0) + ww; }
  return lines;
}

function drawLyrics(g, W, H, t, TL) {
  const k = Math.min(W, H) / 1080; const segs = lineSegments(TL);
  const seg = segs.find(s => t >= s.show0 && t < s.show1); if (!seg) return;
  const ap = ss(seg.show0, seg.show0 + .14, t), dp = 1 - ss(seg.show1 - .12, seg.show1, t); const a = Math.min(ap, dp); if (a <= 0) return;
  const fs = (seg.spoken ? 64 : 70) * k; g.save(); g.font = `900 ${fs}px Nunito`; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const lines = wrap(g, seg.words, W - 150 * k); const lh = fs * 1.15; const y0 = H * (W > H ? .875 : .772) - (lines.length - 1) * lh / 2;
  const sc = .86 + .14 * ss(0, 1, ap) + .03 * Math.sin(ap * Math.PI);
  g.globalAlpha = a; g.translate(W / 2, y0); g.scale(sc, sc); g.translate(-W / 2, -y0);
  const sp = g.measureText(' ').width;
  lines.forEach((ln, li) => {
    const tw = ln.reduce((s, x) => s + x.ww, 0) + sp * (ln.length - 1); let x = W / 2 - tw / 2; const y = y0 + li * lh;
    for (const wd of ln) {
      const sung = seg.spoken ? 1 : clamp((t - wd.s) / Math.max(.05, Math.min(.25, wd.e - wd.s)));
      const lift = seg.spoken ? 0 : Math.sin(clamp((t - wd.s) / .22) * Math.PI) * 9 * k;
      g.lineWidth = 15 * k; g.strokeStyle = LYRIC_INK; g.shadowColor = 'rgba(30,10,60,.35)'; g.shadowBlur = 10 * k; g.shadowOffsetY = 5 * k;
      g.strokeText(wd.w, x, y - lift); g.shadowColor = 'transparent';
      g.fillStyle = seg.spoken ? (seg.who === 'bobble' ? '#bfe9ff' : '#ffffff') : (sung >= 1 ? LYRIC_SUNG : LYRIC_FILL); g.fillText(wd.w, x, y - lift);
      if (!seg.spoken && sung > 0 && sung < 1) { g.save(); g.beginPath(); g.rect(x, y - fs, wd.ww * sung, fs * 2); g.clip(); g.fillStyle = LYRIC_SUNG; g.fillText(wd.w, x, y - lift); g.restore(); }
      x += wd.ww + sp;
    }
  });
  g.restore();
}

export function bubbleTitle(g, text, cx, cy, size, t, colors) {
  g.save(); g.font = `900 ${size}px Nunito`; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const chars = [...text]; const widths = chars.map(c => g.measureText(c).width); const tw = widths.reduce((a, b) => a + b, 0); let x = cx - tw / 2;
  chars.forEach((c, i) => {
    const d = clamp((t - i * .045) / .35); const s = d <= 0 ? 0 : 1 + .35 * Math.exp(-d * 6) * Math.sin(d * 14); if (s <= 0) { x += widths[i]; return; }
    const y = cy + Math.sin(t * 3 + i * .7) * size * .025;
    g.save(); g.translate(x + widths[i] / 2, y); g.scale(s, s); g.rotate(Math.sin(i * 1.7) * .06);
    g.lineWidth = size * .2; g.strokeStyle = '#ffffff'; g.strokeText(c, -widths[i] / 2, 0);
    g.lineWidth = size * .11; g.strokeStyle = colors[i % colors.length]; g.strokeText(c, -widths[i] / 2, 0);
    const gr = g.createLinearGradient(0, -size * .4, 0, size * .4); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#e3f6ff'); g.fillStyle = gr; g.fillText(c, -widths[i] / 2, 0);
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(-widths[i] * .18, -size * .2, size * .06, size * .035, -.5, 0, 7); g.fill();
    g.restore(); x += widths[i];
  });
  g.restore();
}

export function drawOverlay(g, W, H, t, TL, { titles = true, lyrics = true } = {}) {
  const k = Math.min(W, H) / 1080;
  if (titles) {
    const tIn = .25, tOut = TL.bars[1] - .05;
    if (t > tIn && t < tOut + .4) { g.save(); g.globalAlpha = 1 - ss(tOut, tOut + .4, t); bubbleTitle(g, 'The Bubble Song', W / 2, H * .17, 118 * k, t - tIn, ['#2f86e6', '#ff5fa2', '#22b8a8', '#ffb020', '#8a5cf6']); g.restore(); }
    const e0 = TL.bars[23] + .1;
    if (t > e0) { bubbleTitle(g, 'Lulu & Friends', W / 2, H * .16, 120 * k, t - e0, ['#ff5fa2', '#2f86e6', '#ffb020', '#22b8a8', '#8a5cf6']);
      g.save(); g.globalAlpha = ss(e0 + .5, e0 + .9, t); g.font = `800 ${50 * k}px Nunito`; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 12 * k; g.strokeStyle = '#2f5fb8'; g.strokeText('Sing it again!', W / 2, H * .235); g.fillStyle = '#fff'; g.fillText('Sing it again!', W / 2, H * .235); g.restore(); }
  }
  if (lyrics) drawLyrics(g, W, H, t, TL);
}
