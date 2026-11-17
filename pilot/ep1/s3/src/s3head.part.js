// ================= "LOADED IN" - EPISODE 1, scene 3: "The Welcome" =================
// Tee (floating ringmaster, TV head) crashes Lamar's first minute: welcome, "I'm Tee!" song, "how many new players?"
const ME = { skin: 0xe2a57f, hair: 0x4a2a16, top: 0x3fae5a, pants: 0x2a3a5a, iris: '#4a6a3a', hairH: .15, shoes: 0xf2f2f2, seed: .9 };
const cutInfo = await (await fetch('/build/cuts.json')).json();
const tm = t => t - cutInfo.cuts.reduce((s, [a, b]) => s + (t > a ? Math.min(t, b) - a : 0), 0);   // voice clock -> final clock
const DUR = cutInfo.duration;
const mouth = await (await fetch('/build/mouth.json')).json();
const mIdx = t => Math.round(t * mouth.rate);
const shapeAt = t => { const i = mIdx(t); return i >= 0 && i < mouth.shape.length && mouth.spk[i] === 'L' ? mouth.shape[i] : 'c'; };
const teeLvl = t => { const i = mIdx(t); return i >= 0 && i < mouth.level.length && mouth.spk[i] === 'T' ? mouth.level[i] : 0; };
EXPR.angry = { open: .85, browIn: -3, browOut: 2.2, mouth: 'frown' };
const SHAPES = ['c', 'o', 'open', 'grin', 'scream'];
for (const e of ['pain', 'confused', 'terror', 'shocked', 'angry', 'stare', 'worried']) for (const m of SHAPES) { const k = e + '_' + m; EXPR[k] = { ...EXPR[e], ...(m === 'c' ? {} : { mouth: m }) }; EXPR[k + '_b'] = { ...EXPR[k], open: .07, black: false }; }
const talk = (h, emo, t, amt = 1) => { const s = shapeAt(t); h.face(emo + '_' + s, t); if (s !== 'c') { h.head.rotation.x += Math.sin(t * 16) * .035 * amt; h.head.rotation.z += Math.sin(t * 11) * .02 * amt; } return s; };
