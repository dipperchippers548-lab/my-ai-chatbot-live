// The Bubble Song - original CoComelon-style 3D nursery-rhyme short (Lulu, Biscuit, Bobble).
import * as THREE from 'three';
import { buildWorld, lights, envMap } from './world.js';
import { makeLulu, makeBiscuit, makeBobble } from './chars.js';
import { makeBubbles } from './bubbles.js';
import { makePost } from './post.js';
import { makeStory } from './story.js';
import { drawOverlay } from './overlay.js';

const QS = new URLSearchParams(location.search); const SCALE = +(QS.get('scale') || 1);
const W = Math.round(1080 * SCALE), H = Math.round(1920 * SCALE);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.NoToneMapping;
const out = document.getElementById('out'); out.width = W; out.height = H; const og = out.getContext('2d');
const lyr = document.createElement('canvas'); lyr.width = W; lyr.height = H; const lg = lyr.getContext('2d');

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(35, W / H, .05, 600);
const world = buildWorld(scene); const L = lights(scene);
scene.environment = envMap(renderer);
const lulu = makeLulu(), biscuit = makeBiscuit(), bobble = makeBobble();
scene.add(lulu.root, biscuit.root, bobble.root);
const TL = await (await fetch('/build/timeline.json')).json();
const bubbles = makeBubbles(scene, TL);
const post = makePost(renderer, W, H);
const story = makeStory({ THREE, scene, cam, world, L, lulu, biscuit, bobble, bubbles, TL });
await document.fonts.load('900 60px Nunito'); await document.fonts.load('800 60px Nunito');

function render(t, lyrics = false) {
  const look = story.update(t);
  world.sky.material.uniforms.rainbow.value = look.rainbow || 0;
  post.render(scene, cam, { focus: look.focus, cInf: look.cInf * H / 1920, exposure: look.exposure ?? 1, flash: look.flash || 0 });
  og.drawImage(renderer.domElement, 0, 0);
  drawOverlay(og, W, H, t, TL, { titles: true, lyrics });
  return out.toDataURL('image/jpeg', .94);
}
window.renderTime = (t, lyrics = true) => render(t, lyrics);
window.renderFrame = i => render(i / TL.fps, false);
window.renderLyrics = i => { lg.clearRect(0, 0, W, H); drawOverlay(lg, W, H, i / TL.fps, TL, { titles: false, lyrics: true }); return lyr.toDataURL('image/png'); };
window.frameCount = Math.ceil(TL.dur * TL.fps);
window.ready = true;
