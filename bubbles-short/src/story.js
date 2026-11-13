// The whole short, as pure functions of song time t: shots/cameras, character staging + poses, gaze, blinks,
// lip-sync and every bubble. Bars come from build/timeline.json (112 BPM, bar = 2.143 s, bar 1 at 0.3 s).
import * as THREE from 'three';
import { poseLulu, poseBiscuit, poseBobble } from './chars.js';
import { clamp, lerp, ss, sss, rng } from './lib.js';

export function makeStory({ cam, world, lulu, biscuit, bobble, bubbles, TL }) {
  const BEAT = TL.beat, BAR = 4 * BEAT, PRE = TL.pre;
  const tb = (bar, beat = 0) => PRE + ((bar - 1) * 4 + beat) * BEAT;           // song time of bar/beat
  const beatPh = t => ((t - PRE) / BEAT) % 1, beatN = t => Math.floor((t - PRE) / BEAT);
  const ev = k => TL.events.filter(e => e.kind === k).map(e => e.t);
  const V = (...a) => new THREE.Vector3(...a);
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function blinkAt(t, seed) {
    let k = 0, tt = seed * .9 + .6, v = 0;
    while (tt < t + .2 && k < 60) { const d = t - tt; if (d > -.01 && d < .16) v = Math.max(v, d < .06 ? d / .06 : d < .09 ? 1 : 1 - (d - .09) / .07); tt += 2.1 + 1.9 * hash(seed * 13 + k++); }
    return clamp(v);
  }
  const mouthOf = (who, t) => { const arr = TL.mouth[who]; const f = t * TL.fps, i = Math.floor(f); if (i < 0 || i >= arr.length - 1) return 0; return lerp(arr[i], arr[i + 1], f - i); };
  const VOWEL = { bub: 'ah', bles: 'eh', ble: 'eh', round: 'ow', and: 'ah', float: 'oo', ing: 'ee', up: 'ah', down: 'ow', in: 'ee', the: 'eh', air: 'eh', ev: 'eh', ery: 'ee', where: 'eh',
    ti: 'ah', ny: 'ee', one: 'ah', two: 'oo', three: 'ee', a: 'ah', bove: 'ah', tree: 'ee', lu: 'oo', pops: 'ah', them: 'eh', pop: 'ah', big: 'ee', wob: 'ah', off: 'ah', ground: 'ow',
    then: 'eh', it: 'ee', goes: 'oo', bis: 'ee', cuit: 'ee', jumps: 'ah', to: 'oo', catch: 'ah', too: 'oo', on: 'ah', his: 'ee', nose: 'oo', choo: 'oo' };
  const SYL = TL.sung.flatMap(l => l.notes.map(([s, m, t0, d]) => ({ v: VOWEL[s.toLowerCase().replace(/[^a-z]/g, '')] || 'ah', t0, t1: t0 + d })));
  const vowelAt = t => { const s = SYL.find(x => t >= x.t0 - .04 && t < x.t1); return s ? s.v : 'ah'; };
  const pulse = (t, t0, a = .04, d = .25) => (t >= t0 && t < t0 + d) ? Math.sin((t - t0) / d * Math.PI) * a : 0;
  const near = (t, list, w) => list.some(x => Math.abs(t - x) < w);

  // ---------------- camera shots ----------------
  // each: [t0, t1, from {p,l,fov}, to {p,l,fov}, focusTarget, cInf]
  const B = tb;
  const SH = [
    [0, B(2), { p: [0, 4.6, 7.4], l: [0, 4.2, -8], fov: 42 }, { p: [.15, 1.0, 3.3], l: [0, .72, 0], fov: 38 }, 'lulu', 4, 'crane'],
    [B(2), B(3), { p: [.85, .82, 2.5], l: [.25, .62, .1], fov: 36 }, { p: [.7, .8, 2.15], l: [.25, .64, .1], fov: 36 }, 'lulu', 9],
    [B(3), B(4), { p: [-.55, .86, 1.75], l: [-.02, .67, 0], fov: 34 }, { p: [-.4, .84, 1.5], l: [0, .67, 0], fov: 34 }, 'lulu', 12],
    [B(4), B(5), { p: [.55, .32, 1.55], l: [-.25, 1.45, -1], fov: 46 }, { p: [.5, .3, 1.45], l: [-.35, 1.9, -1.2], fov: 46 }, 'lulu', 7],
    [B(5), B(6), { p: [2.6, 1.15, 3.1], l: [.3, .55, .1], fov: 38 }, { p: [-1.4, 1.1, 3.4], l: [.2, .55, .1], fov: 38 }, 'lulu', 3],
    [B(6), B(7), { p: [0, .95, 2.3], l: [0, .7, 0], fov: 38 }, { p: [0, 2.5, 4.9], l: [0, .7, 0], fov: 40 }, 'lulu', 2],
    [B(7), B(8), { p: [.22, .82, 1.75], l: [0, .7, 0], fov: 34 }, { p: [.2, .82, 1.55], l: [0, .71, 0], fov: 34 }, 'lulu', 11],
    [B(8), B(9), { p: [.9, .45, 1.7], l: [-.2, 1.0, 0], fov: 44 }, { p: [.9, .4, 1.75], l: [-2.6, 3.2, -3.4], fov: 46 }, 'tree', 3],
    [B(9), B(10), { p: [.75, .82, 2.05], l: [.05, .74, .15], fov: 35 }, { p: [.6, .8, 1.85], l: [.05, .76, .15], fov: 35 }, 'lulu', 10],
    [B(10), B(11), { p: [.95, .55, 2.9], l: [.38, .45, .3], fov: 40 }, { p: [.7, .62, 3.0], l: [.32, .5, .3], fov: 40 }, 'biscuit', 6],
    [B(11), B(12), { p: [.1, 1.0, 3.3], l: [.15, 1.0, .2], fov: 40 }, { p: [.05, 1.02, 3.0], l: [.1, 1.05, .2], fov: 40 }, 'lulu', 5],
    [B(12), B(13), { p: [.15, .5, 1.75], l: [-.45, 1.2, .3], fov: 40 }, { p: [.05, .45, 1.6], l: [-.5, 1.35, .3], fov: 40 }, 'bobble', 8],
    [B(13), B(14), { p: [-.42, 1.36, 2.65], l: [-.48, 1.16, .42], fov: 36 }, { p: [-.43, 1.35, 2.4], l: [-.48, 1.16, .42], fov: 36 }, 'bobble', 10],
    [B(14), B(15), { p: [.05, 1.0, 3.5], l: [-.22, .98, .25], fov: 42 }, { p: [.05, .98, 3.25], l: [-.2, .92, .25], fov: 42 }, 'lulu', 5],
    [B(15), B(16), { p: [1.35, .55, 2.45], l: [.55, .6, .35], fov: 38 }, { p: [1.25, .55, 2.3], l: [.55, .62, .35], fov: 38 }, 'biscuit', 7],
    [B(16), B(17), { p: [.46, .5, 1.6], l: [.57, .37, .55], fov: 32 }, { p: [.47, .49, 1.45], l: [.57, .37, .55], fov: 32 }, 'biscuit', 12],
    [B(17), B(18), { p: [.32, .8, 2.75], l: [.3, .52, .2], fov: 38 }, { p: [.3, .78, 2.55], l: [.3, .52, .2], fov: 38 }, 'lulu', 8],
    [B(18), B(18, 2), { p: [.5, .45, 1.45], l: [.57, .43, .5], fov: 34 }, { p: [.52, .45, 1.35], l: [.57, .43, .5], fov: 34 }, 'biscuit', 12],
    [B(18, 2), B(19), { p: [.52, .45, 1.35], l: [.57, .43, .5], fov: 34 }, { p: [-.4, 1.25, 4.3], l: [.2, .7, 0], fov: 40 }, 'lulu', 2, 'whip'],
    [B(19), B(20), { p: [-1.9, 1.1, 3.3], l: [.2, .6, 0], fov: 40 }, { p: [1.9, 1.1, 3.3], l: [.2, .6, 0], fov: 40 }, 'lulu', 3],
    [B(20), B(21), { p: [.35, .82, 1.6], l: [0, .67, 0], fov: 34 }, { p: [.3, .8, 1.42], l: [0, .67, 0], fov: 34 }, 'lulu', 12],
    [B(21), B(22), { p: [1.3, .42, 2.3], l: [-1.6, 1.45, -2.2], fov: 46 }, { p: [1.25, .36, 2.2], l: [-1.6, 1.95, -2.2], fov: 46 }, 'lulu', 2],
    [B(22), B(23), { p: [0, 1.2, 2.7], l: [.2, .6, 0], fov: 40 }, { p: [0, 3.3, 4.3], l: [.2, .5, 0], fov: 42 }, 'lulu', 2],
    [B(23), B(24), { p: [.2, .92, 2.55], l: [.25, .7, .1], fov: 38 }, { p: [.2, .9, 2.35], l: [.25, .7, .1], fov: 38 }, 'lulu', 6],
    [B(24), TL.dur + .1, { p: [.25, .98, 3.1], l: [.3, .72, .1], fov: 38 }, { p: [.25, .92, 2.65], l: [.3, .72, .1], fov: 38 }, 'lulu', 6],
  ];
  const shotAt = t => SH.find(s => t >= s[0] && t < s[1]) || SH.at(-1);
  const KICKS = [...ev('popbig'), ...ev('popall'), ...ev('land')];

  // ---------------- staging ----------------
  const LULU_POS = V(0, 0, 0);
  function biscuitPlace(t) {
    // returns [x, z, ry, mode]
    if (t < B(2, .1)) return [3.2, .6, -Math.PI / 2, 'hidden'];
    if (t < B(2, 1.3)) { const k = sss(B(2, .1), B(2, 1.3), t); return [lerp(3.2, .62, k), lerp(.6, .34, k), -Math.PI / 2 + k * 1.3, 'run']; }
    if (t >= B(10) && t < B(11)) { const k = (t - B(10)) / BAR; const a = k * Math.PI * 1.2; return [.62 + Math.sin(a) * .22, .34 + (1 - Math.cos(a)) * .22, -.3 + Math.cos(a) * 1.2, 'run']; }
    return [.62, .34, -.28, 'stand'];
  }

  // ---------------- Lulu choreography ----------------
  function luluPose(t) {
    const ph = beatPh(t), bn = beatN(t), bar = Math.floor((t - PRE) / BAR) + 1;
    const bounceDance = Math.sin(ph * Math.PI) ** 2;  // dip every beat
    const p = { look: 'cam', blink: blinkAt(t, 1), mouth: Math.min(1, mouthOf('lulu', t) * 1.15), aim: 'up', shape: vowelAt(t), curlL: .3, curlR: 1.15 };
    const singing = p.mouth > .05;
    const sway = Math.sin((t - PRE) / BEAT * Math.PI) * .06;
    const idle = () => { p.crouch = .04 * bounceDance; p.sway = sway * .4; p.armL = [.05, .22, -.3]; p.armR = [-.2, .22, -.5]; };
    idle();
    if (t < B(2)) {        // bar 1: wave hello
      const w = ss(.3, .6, t) * (1 - ss(B(2) - .3, B(2), t));
      p.armR = [lerp(-.2, -.25, w), lerp(.22, 2.45, w) + Math.sin(t * 13) * .22 * w, lerp(-.5, -.35, w)]; p.aim = 'up';
      p.headTilt = .12 * w; p.crouch = .03 * bounceDance;
    } else if (t < B(3)) { // bar 2: "Let's blow bubbles!" lifts the wand, then blows
      const lift = ss(B(2, .2), B(2, 1.2), t), blow = ss(B(2, 2.6), B(2, 2.95), t) * (1 - ss(B(3) - .1, B(3) + .15, t));
      p.armR = [lerp(-.2, -1.05, lift), lerp(.22, .15, lift), lerp(-.5, -1.25, lift)];
      if (blow > 0) { p.armR = [lerp(-1.05, -1.2, blow), lerp(.15, .05, blow), lerp(-1.25, -1.75, blow)]; p.aim = 'mouth'; p.shape = blow > .5 ? 'oo' : p.shape; p.mouth = blow > .5 ? .3 + .2 * Math.sin(t * 30) : p.mouth; p.look = 'ring'; }
      p.brows = lift * .5;
    } else if (t < B(7)) { // chorus 1: wave the wand in circles, dance
      const w = (t - B(3)) / BEAT * Math.PI * .5;
      p.armR = [-1.0 + .38 * Math.sin(w), .35 + .4 * Math.cos(w), -.55]; p.aim = 'up';
      p.armL = [.25 * Math.sin(ph * Math.PI * 2), .3 + .15 * bounceDance, -.6];
      p.crouch = .1 * bounceDance; p.sway = sway; p.headTilt = sway * 1.5;
      if (bar === 6) { p.turn = sss(B(6), B(6, 3.2), t) * Math.PI * 2; p.armL = [-.1, 1.35, -.2]; p.armR = [-.2, 1.35, -.2]; }
      if (bar === 4) { p.look = 'up'; }
    } else if (t < B(8)) { // "Tiny bubbles, one, two, three" - counts the bubbles in front of her
      p.look = 'hero'; p.armR = [-.2, .22, -.5]; p.aim = 'down';
      const cnt = [B(7, 2), B(7, 2.5), B(7, 3)].filter(x => t > x).length;
      p.armL = cnt ? [-1.35, .25 - cnt * .12, -.4] : [-.6, .25, -1.2]; p.brows = .4; p.pointL = cnt ? 1 : 0; p.curlL = cnt ? 1.1 : .3;
    } else if (t < B(9)) { // "floating up above the tree" - looks up, points
      p.look = 'hero'; p.headTurn = -.25 * ss(B(8), B(8, 2), t); p.nod = -.35 * ss(B(8), B(8, 2.5), t);
      p.armL = [-2.2, .45, -.15]; p.armR = [-.2, .22, -.5]; p.aim = 'down'; p.wide = .5; p.pointL = 1; p.curlL = 1.1;
    } else if (t < B(10)) { // "Lulu pops them, pop, pop, pop!" - pokes three bubbles
      const pops = [B(9, 2), B(9, 2.5), B(9, 3)];
      p.look = 'hero'; p.armR = [-.2, .22, -.5]; p.aim = 'down';
      const k = pops.reduce((a, x, i) => a + Math.max(0, 1 - Math.abs(t - x) / .14) * (i % 2 ? -1 : 1), 0);
      p.armL = [-1.45 - .35 * Math.abs(k), .3 + .25 * k, -.15]; p.crouch = .05 + .08 * bounceDance; p.pointL = 1; p.curlL = 1.1;
      p.jump = pops.reduce((a, x) => a + (t > x - .1 && t < x + .15 ? Math.sin((t - x + .1) / .25 * Math.PI) * .03 : 0), 0);
    } else if (t < B(11)) { // instrumental: giggles at Biscuit
      p.look = 'biscuit'; const g = ss(B(10, .9), B(10, 1.2), t) * (1 - ss(B(10, 3), B(10, 3.6), t));
      p.blink = Math.max(p.blink, .55 * g); p.headTilt = .18 * g + Math.sin(t * 22) * .03 * g; p.armL = [-1.1, .1, -1.6]; p.armR = [-.4, .1, -1.4]; p.aim = 'up';
      p.crouch = .06 * Math.abs(Math.sin(t * 11)) * g;
    } else if (t < B(13)) { // "One big bubble ... wobble wobble off the ground"
      const sw = (t - B(11)) / (2 * BAR); p.armR = [-1.1 - .25 * Math.sin(sw * Math.PI * 2), .5 + .25 * Math.sin(sw * Math.PI * 3), -.5]; p.aim = 'up';
      p.look = 'bobble'; p.wide = .7; p.brows = .7; p.armL = [-.3, .5, -.6];
      if (t > B(12)) { p.armR = [-.3, .3, -.6]; p.armL = [-.25, .35, -.6]; p.nod = -.25; }
    } else if (t < B(15)) { // Bobble talks, then POP
      p.look = 'bobble'; p.nod = -.25; p.brows = .5; p.armL = [-.3, .3, -.9]; p.armR = [-.3, .3, -.9]; p.aim = 'down';
      const pop = popT;
      if (t > pop) { const s = 1 - ss(pop + .8, pop + 1.6, t); p.wide = s; p.brows = s; p.shape = s > .4 ? 'oo' : p.shape; p.mouth = s > .4 ? .5 : p.mouth; p.armL = [-.6, 1.2 * s, -1.4 * s]; p.armR = [-.6, 1.2 * s, -1.4 * s]; p.jump = pulse(t, pop, .05, .3); }
    } else if (t < B(17)) { // watches Biscuit jump / sneeze
      p.look = 'biscuit'; p.headTurn = .3; p.armL = [-.2, .3, -.6]; p.armR = [-.2, .3, -.6]; p.aim = 'down';
      if (t > ev('sneeze')[0]) { p.blink = Math.max(p.blink, .55); p.headTilt = .15; }
    } else if (t < B(19)) { // "Bless you, Biscuit!" then cheers
      p.look = t < B(18) ? 'biscuit' : 'cam'; p.headTurn = t < B(18) ? .3 : 0; p.armL = [-.9, .2, -1.0]; p.armR = [-.3, .25, -.6]; p.aim = 'down';
      if (t > B(18)) { const u = ss(B(18), B(18, 1), t); p.armL = [-.2, 2.4 * u, -.3]; p.armR = [-.2, 2.4 * u, -.3]; p.aim = 'up'; p.crouch = .08 * bounceDance; }
    } else if (t < B(23)) { // final chorus: big dance
      const w = (t - B(19)) / BEAT * Math.PI * .5;
      p.armR = [-1.0 + .38 * Math.sin(w), .35 + .45 * Math.cos(w), -.55]; p.aim = 'up';
      p.armL = [.2 * Math.sin(ph * Math.PI * 2), .5 + .6 * bounceDance, -.5]; p.crouch = .12 * bounceDance; p.sway = sway * 1.3; p.headTilt = sway * 1.8;
      if (bar === 21) { p.look = 'sky'; p.armL = [-2.3, .5, -.1]; p.nod = -.3; p.pointL = 1; p.curlL = 1.1; }
      if (bar === 22) { p.turn = sss(B(22), B(22, 3), t) * Math.PI * 2; p.armL = [-.1, 1.4, -.2]; p.armR = [-.2, 1.4, -.2]; }
    } else if (t < B(24)) { // POP!
      const u = ss(B(23) - .1, B(23) + .1, t); p.armL = [-.2, 2.6 * u, -.2]; p.armR = [-.2, 2.6 * u, -.2]; p.aim = 'up';
      p.jump = Math.max(0, Math.sin(clamp((t - B(23) + .05) / .5) * Math.PI)) * .12; p.wide = .6; p.brows = .7;
    } else { // goodbye wave
      const w = ss(B(24), B(24, 1), t);
      p.armR = [-.25, lerp(.3, 2.45, w) + Math.sin(t * 12) * .22 * w, -.35]; p.aim = 'up'; p.armL = [-.1, .25, -.4]; p.headTilt = .12 * w;
      p.mouth = Math.max(p.mouth, .25 * w);
    }
    if (!singing && p.mouth < .2 && t > B(2, 3) && !p.shape) p.mouthW = 1;
    return p;
  }

  function biscuitPose(t) {
    const [x, z, ry, mode] = biscuitPlace(t);
    const p = { wag: t * 16, blink: blinkAt(t, 2), look: [0, .05], stride: 0, step: 0, mouth: 0 };
    if (mode === 'run') { p.stride = .55; p.step = t * 22; p.hop = Math.abs(Math.sin(t * 11)) * .03; p.earFlop = .35 + Math.sin(t * 22) * .2; }
    for (const b of ev('bark')) { const d = t - b; if (d > -.03 && d < .25) { p.mouth = Math.sin(clamp(d / .2) * Math.PI); p.headUp = .25 * p.mouth; p.hop = (p.hop || 0) + .025 * p.mouth; p.earFlop = .3 * p.mouth; } }
    if (t >= B(5) && t < B(7)) { const h = Math.max(0, Math.sin((t - PRE) / BEAT * Math.PI * 2)); p.hop = h * .08; p.headUp = .4; p.tuck = h * .4; p.look = [0, .5]; }
    const jt = ev('jump')[0], ld = ev('land')[0];
    if (t > jt && t < ld + .3) { const k = clamp((t - jt) / (ld - jt)); p.hop = Math.sin(k * Math.PI) * .42; p.tuck = Math.sin(k * Math.PI) * .6; p.headUp = .5 * Math.sin(k * Math.PI); p.earFlop = .5 * Math.sin(k * Math.PI); p.pitch = -.25 * Math.sin(k * Math.PI * 2); }
    const snapT = ev('snap')[0]; if (Math.abs(t - snapT) < .12) p.mouth = 1 - Math.abs(t - snapT) / .12;
    if (t > B(16) && t < B(17)) {            // bubble on the nose
      p.look = [0, -.35]; p.headUp = .15; const sn = ev('sneeze')[0];
      p.look = t < sn ? [-.12, -.42] : [0, 0];  // cross-eyed at the bubble
      if (t > sn - .3 && t < sn) { p.headUp = .15 + (t - sn + .3) * 1.2; p.mouth = .3; }
      if (t >= sn && t < sn + .35) { const k = (t - sn) / .35; p.headUp = -.35 * Math.sin(k * Math.PI); p.blink = 1; p.mouth = .7 * (1 - k); p.earFlop = .5 * Math.sin(k * Math.PI); }
      if (t > sn + .35) { p.wag = t * 24; p.headTilt = .25 * Math.sin((t - sn) * 9) * Math.exp(-(t - sn) * 1.5); }
    }
    if (t >= B(19) && t < B(23)) { const h = Math.max(0, Math.sin((t - PRE) / BEAT * Math.PI)); p.hop = h * .05; p.headUp = .2; p.earFlop = .2 * h; p.wag = t * 20; }
    if (t >= B(23) && t < B(23, 2)) { const k = clamp((t - B(23)) / .55); p.hop = Math.sin(k * Math.PI) * .25; p.tuck = Math.sin(k * Math.PI) * .5; p.headUp = .4; }
    return { x, z, ry, mode, p };
  }

  // Bobble: grows on the wand (bar 11), floats up wobbling (bar 12), talks (bar 13), POP (bar 14 beat 3)
  const popT = TL.events.find(e => e.kind === 'popbig' && e.bar === 14).t;
  function bobbleState(t, ringPos) {
    if (t < B(11, .2) || t >= popT) return null;
    const grow = sss(B(11, .2), B(12), t); const free = ss(B(12), B(13), t);
    const attach = ringPos ? ringPos.clone() : V(.3, 1, .3);
    const R = .46 * (.08 + .92 * grow);
    const dir = V(.35, .55, .5).normalize();
    const onWand = attach.clone().addScaledVector(dir, R * .98);
    const home = V(-.5, 1.32 + .04 * Math.sin(t * 2.2), .42);
    const pos = onWand.lerp(home, free);
    const wob = .03 + .08 * Math.max(...ev('wobble').map(x => t > x ? Math.exp(-(t - x) * 2.5) : 0)) + (t > B(14, 2) ? .05 * ss(B(14, 2), popT, t) : 0);
    return { pos, scale: R / .46, wobble: wob, phase: t * 9, face: ss(B(13) - .1, B(13, .8), t), mouth: Math.min(1, mouthOf('bobble', t) * 1.4), blink: Math.max(blinkAt(t, 5), near(t, ev('blink'), .08) ? 1 : 0) };
  }

  // ---------------- apply ----------------
  const tmp = V(), tmpQ = new THREE.Quaternion(), up = V(0, 1, 0);
  function lookAngles(head, target) { const p = head.worldToLocal(target.clone()); const yaw = Math.atan2(p.x, p.z), pitch = Math.atan2(p.y, Math.hypot(p.x, p.z)); return [clamp(yaw, -.55, .55), clamp(pitch, -.45, .45)]; }
  function aimWand(dirWorld) {
    const hand = lulu.arms[1].hand; hand.updateWorldMatrix(true, false); hand.getWorldQuaternion(tmpQ);
    const wq = new THREE.Quaternion().setFromUnitVectors(up, dirWorld.clone().normalize()); lulu.wand.quaternion.copy(tmpQ.invert().multiply(wq));
  }
  const ringWorld = () => { lulu.ring.updateWorldMatrix(true, false); return lulu.ring.getWorldPosition(V()); };
  const mouthWorld = () => lulu.head.localToWorld(V(0, -.085, .2));
  const heroTargets = { lulu: () => lulu.head.localToWorld(V(0, 0, 0)), biscuit: () => biscuit.head.localToWorld(V(0, 0, .05)), bobble: () => bobble.root.getWorldPosition(V()) };
  let heroFocus = null;

  function applyLulu(t, camPos) {
    const p = luluPose(t);
    lulu.root.position.copy(LULU_POS); lulu.root.rotation.y = 0;
    const g = p.look; p.look = [0, 0];
    poseLulu(lulu, p); lulu.root.updateMatrixWorld(true);
    // gaze
    let target = null;
    if (g === 'cam' && camPos) target = camPos;
    else if (g === 'biscuit') target = biscuit.head.localToWorld(V(0, 0, 0));
    else if (g === 'bobble') { const bs = bobbleState(t, V(.3, 1.0, .35)); target = bs ? bs.pos : V(-.5, 1.3, .42); }
    else if (g === 'up') target = V(-.3, 2.5, 1.2); else if (g === 'sky') target = V(-3, 2.6, -1.5);
    else if (g === 'hero') target = heroFocus || V(0, .8, .6);
    else if (g === 'ring') target = ringWorld();
    if (target) { const [yx, yy] = lookAngles(lulu.head, target); p.look = [yx, yy]; poseLulu(lulu, p); }
    // wand
    const hp = lulu.arms[1].hand.getWorldPosition(V());
    if (p.aim === 'mouth') aimWand(mouthWorld().add(V(0, 0, .05)).sub(hp));
    else if (p.aim === 'down') aimWand(V(.15, -1, .25));
    else aimWand(V(.05, 1, .35));
    lulu.film.visible = true; lulu.root.updateMatrixWorld(true);
    return p;
  }
  function applyBiscuit(t) {
    const { x, z, ry, mode, p } = biscuitPose(t);
    biscuit.root.visible = mode !== 'hidden'; biscuit.root.position.set(x, 0, z); biscuit.root.rotation.y = ry;
    poseBiscuit(biscuit, p); biscuit.root.updateMatrixWorld(true);
  }

  // ---------------- precompute bubbles (needs Lulu's ring path) ----------------
  const ringAt = (ts) => { applyLulu(ts, null); return ringWorld(); };
  const toCam = [0, .35, 1];
  bubbles.emit({ t0: B(2, 3), t1: B(3, .2), n: 28, from: ts => ringAt(ts).toArray(), dir: toCam, speed: 1.5, spread: .45, seed: 1, life: [2.5, 5] });
  bubbles.emit({ t0: B(3), t1: B(5), n: 70, from: ts => ringAt(ts).toArray(), dir: [.1, .6, .8], speed: .9, spread: .7, seed: 2, life: [3, 6.5] });
  bubbles.emit({ t0: B(5), t1: B(7), n: 70, from: ts => ringAt(ts).toArray(), dir: [-.1, .6, .8], speed: .9, spread: .8, seed: 3, life: [3, 6.5] });
  bubbles.emit({ t0: B(4), t1: B(7), n: 60, from: [0, 2.6, 3.5], dir: [0, -.2, -1], speed: .2, spread: 1.6, seed: 4, life: [3, 7], buoy: .05, rmin: .03, rmax: .06 });
  // bar 7-8: three tiny hero bubbles in front of her face, rising above the tree in bar 8
  const heroes = [[-.15, .95, .45], [.0, 1.03, .47], [.15, .95, .45]];
  heroes.forEach((h, i) => bubbles.hero({ ts: B(7) - .3, tp: B(9) - .05, r: .045 + i * .005, seed: .2 + i * .2,
    path: t => { const bounce = pulse(t, B(7, 2 + i * .5), .025, .3); const rise = sss(B(8), B(9), t); return [h[0] + Math.sin(t * 1.5 + i) * .015 + rise * (-1.2 - i * .4), h[1] + bounce + Math.sin(t * 2 + i * 2) * .01 + rise * (2.4 + i * .3), h[2] + rise * (-2.4 - i * .3)]; } }));
  // bar 9: three bubbles drift down and get poked
  [[-.14, .9, .32], [.1, .98, .3], [-.05, 1.04, .26]].forEach((h, i) => { const tp = B(9, 2 + i * .5); bubbles.hero({ ts: B(9) - .2, tp, r: .045, seed: .7 + i * .1, path: t => [h[0] + Math.sin(t * 2 + i) * .02, h[1] + .25 * (1 - ss(B(9) - .2, tp, t)), h[2]] }); });
  // bar 10: Biscuit snaps two
  [0, 1].forEach(i => { const tp = B(10, 2.5 + i * .5); bubbles.hero({ ts: B(10), tp, r: .05, seed: .3 + i * .3, path: t => { const bp = biscuitPlace(tp); return [bp[0] + .1 * Math.sin(i * 2), .55 + .2 * (1 - ss(B(10), tp, t)) - i * .05, bp[1] + .18]; } }); });
  bubbles.emit({ t0: B(9), t1: B(11), n: 30, from: [0, 2.2, 2.5], dir: [0, -.3, -1], speed: .15, spread: 1.4, seed: 5, buoy: .03, life: [3, 6] });
  // bar 14: Bobble bursts into little bubbles
  bubbles.emit({ t0: popT, t1: popT + .05, n: 36, from: [-.5, 1.32, .42], dir: [0, .4, .2], speed: 1.6, spread: 1.2, seed: 6, life: [1.5, 3.5], rmin: .03, rmax: .07 });
  // bar 15: one for Biscuit to catch; bar 16: one lands on his nose and pops at the sneeze
  bubbles.hero({ ts: B(15) - .3, tp: ev('snap')[0], r: .05, seed: .45, path: t => [.85 + .05 * Math.sin(t * 2), .95 - .1 * ss(B(15), ev('snap')[0], t), .62] });
  const sn = ev('sneeze')[0];
  bubbles.hero({ ts: B(16) - .2, tp: sn + .05, r: .032, seed: .62, path: t => { const nose = biscuit.head.localToWorld(V(0, -.004, .2)); const k = sss(B(16) - .2, B(16, 1), t); return [lerp(nose.x + .25, nose.x, k), lerp(nose.y + .45, nose.y + .028, k), lerp(nose.z + .1, nose.z + .01, k)]; } });
  // final chorus: lots of bubbles from the wand + a bubble breeze
  bubbles.emit({ t0: B(19), t1: B(23) - .2, n: 120, from: ts => ringAt(ts).toArray(), dir: [0, .6, .8], speed: 1.0, spread: .9, seed: 7, life: [3, 5.5] });
  bubbles.emit({ t0: B(18, 2), t1: B(23) - .3, n: 110, from: [-3, .8, 1], dir: [1, .3, .1], speed: .6, spread: .8, seed: 8, life: [4, 7], wind: [.5, 0, .05] });
  bubbles.emit({ t0: B(24), t1: TL.dur - 1, n: 18, from: ts => ringAt(ts).toArray(), dir: [.2, .7, .6], speed: .5, spread: .6, seed: 9, life: [3, 6] });
  // bar 23: every bubble alive pops on the big "POP!"
  const pa = ev('popall')[0]; const r9 = rng(77);
  for (const b of bubbles.spawns) if (b.ts < pa && b.tp > pa) b.tp = pa + r9() * .1;
  // rainbow
  const rainbowT = ev('rainbow')[0];

  // ---------------- per-frame ----------------
  return {
    update(t) {
      const s = shotAt(t); const [t0, t1, A, Bk, focusOn, cInf, kind] = s;
      let k = sss(t0, t1, t);
      if (kind === 'whip') k = ss(t0, t0 + .45, t);
      if (kind === 'crane') k = sss(t0, t0 + 1.5, t) * .85 + .15 * ss(t0 + 1.2, t1, t);
      const pos = V(...A.p).lerp(V(...Bk.p), k), look = V(...A.l).lerp(V(...Bk.l), k); const fov = lerp(A.fov, Bk.fov, k);
      // gentle hand-free drift so nothing is ever frozen
      pos.x += Math.sin(t * .7) * .012; pos.y += Math.sin(t * .9 + 1) * .008;
      for (const kt of KICKS) { const d = t - kt; if (d >= 0 && d < .25) { const a = .02 * (1 - d / .25) * (Math.floor(d * 30) % 2 ? 1 : -1); pos.x += a; pos.y += a * .6; } }
      cam.position.copy(pos); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(look);
      if (kind === 'whip') { const w = Math.exp(-(((t - t0 - .22) / .12) ** 2)); cam.rotateZ(w * .08); }

      applyBiscuit(t);
      // hero focus for Lulu's eyes (closest living hero bubble)
      heroFocus = null; let best = 1e9;
      for (const b of bubbles.spawns) if (b.hero && t >= b.ts && t < b.tp) { const p = bubbles.posAt(b, t); const d = p.distanceTo(V(0, .72, 0)); if (d < best) { best = d; heroFocus = p.clone(); } }
      const p = applyLulu(t, cam.position);
      // Bobble
      const bs = bobbleState(t, ringWorld());
      bobble.root.visible = !!bs;
      if (bs) {
        bobble.root.position.copy(bs.pos); bobble.root.scale.setScalar(bs.scale);
        bobble.root.lookAt(cam.position.x, bs.pos.y + (cam.position.y - bs.pos.y) * .5, cam.position.z);
        poseBobble(bobble, { wobble: bs.wobble, phase: bs.phase, face: bs.face, mouth: bs.mouth, blink: bs.blink, look: lookAngles(bobble.root, lulu.head.getWorldPosition(V())).map(x => x * .22), wide: t > B(14, 2) ? .5 : 0 });
      }
      bubbles.update(t);
      // look values
      const ft = { lulu: () => lulu.head.getWorldPosition(V()), biscuit: () => biscuit.head.getWorldPosition(V()), bobble: () => bobble.root.visible ? bobble.root.getWorldPosition(V()) : lulu.head.getWorldPosition(V()), tree: () => V(-2.6, 3, -3.4) }[focusOn]();
      const flash = Math.max(0, ...[popT, pa].map(x => t >= x && t < x + .25 ? .35 * (1 - (t - x) / .25) : 0));
      return { focus: Math.max(.3, ft.distanceTo(cam.position)), cInf, flash, rainbow: ss(rainbowT, rainbowT + 1.5, t) };
    }
  };
}
