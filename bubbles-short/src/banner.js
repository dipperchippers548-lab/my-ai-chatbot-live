// Channel banner (2560x1440): the cast in the backyard with bubbles, "Popalong" title in the centre safe strip.
// Safe areas: TV = full frame, desktop = 2560x423 centre strip, mobile/all devices = 1546x423 centre.
import * as THREE from 'three';
import { buildWorld, lights, envMap } from './world.js';
import { makeLulu, poseLulu, makeBiscuit, poseBiscuit, makeBobble, poseBobble } from './chars.js';
import { makeBubbles } from './bubbles.js';
import { makePost } from './post.js';
import { bubbleTitle } from './overlay.js';
import { rng } from './lib.js';
const W = 2560, H = 1440;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const out = document.getElementById('out'); out.width = W; out.height = H; const og = out.getContext('2d');
const scene = new THREE.Scene(); const world = buildWorld(scene); lights(scene); scene.environment = envMap(renderer);
const lulu = makeLulu(), biscuit = makeBiscuit(), bobble = makeBobble(); scene.add(lulu.root, biscuit.root, bobble.root);
lulu.root.position.set(-1.5, 0, 0); lulu.root.rotation.y = .28;
poseLulu(lulu, { mouth: .8, shape: 'ah', headTilt: .14, look: [-.12, .04], wide: .3, brows: .5, armL: [.05, .25, -.3], armR: [-.25, 2.35, -.35], curlR: 1.15 });
lulu.root.updateMatrixWorld(true);
{ const up = new THREE.Vector3(0, 1, 0), hq = new THREE.Quaternion(); const hand = lulu.arms[1].hand; hand.getWorldQuaternion(hq);   // wand points up out of her fist
  lulu.wand.quaternion.copy(hq.invert().multiply(new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(.1, 1, .3).normalize()))); }
biscuit.root.position.set(1.3, 0, 0); biscuit.root.rotation.y = -.45;
poseBiscuit(biscuit, { wag: 1.2, mouth: .45, headTilt: -.18, headUp: .1, look: [.15, .08], earFlop: .15 });
bobble.root.position.set(2.75, 2.15, -.6); bobble.root.scale.setScalar(1.0); bobble.root.lookAt(0, .9, 6);   // in the TV-only sky area
poseBobble(bobble, { wobble: .02, phase: 1, face: 1, mouth: .6, look: [-.12, -.12] });
scene.updateMatrixWorld(true);
// bubbles everywhere (kept clear of the title block in the middle)
const bubbles = makeBubbles(scene); const r = rng(42);
for (let i = 0; i < 46; i++) {
  let x, y, z; do { x = (r() - .5) * 7.4; y = .15 + r() * 2.9; z = -1.2 + r() * 2.4; } while (Math.abs(x) < 1.15 && y > .25 && y < 1.0);
  const rad = .035 + r() ** 2 * .11; bubbles.hero({ ts: 0, tp: 100, r: rad, seed: r(), path: () => [x, y, z] });
}
bubbles.update(1);
const cam = new THREE.PerspectiveCamera(38.2, W / H, .05, 600); cam.position.set(0, .62, 5.2); cam.lookAt(0, .55, 0);
const post = makePost(renderer, W, H);
await document.fonts.load('900 60px Nunito'); await document.fonts.load('800 60px Nunito');
post.render(scene, cam, { focus: 5.2, cInf: 9, exposure: 1.02 });
og.drawImage(renderer.domElement, 0, 0);
// title + tagline inside the 1546x423 all-devices safe area (x 507..2053, y 508..931)
bubbleTitle(og, 'Popalong', W / 2, 668, 200, 10, ['#ff5fa2', '#2f86e6', '#ffb020', '#22b8a8', '#8a5cf6']);
og.save(); og.font = '800 46px Nunito'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
const tag = 'Kids Songs & Nursery Rhymes  •  New songs every week!';
og.lineWidth = 13; og.strokeStyle = '#2f5fb8'; og.strokeText(tag, W / 2, 828); og.fillStyle = '#ffffff'; og.fillText(tag, W / 2, 828); og.restore();
window.jpg = out.toDataURL('image/jpeg', .93); window.ready = true;
