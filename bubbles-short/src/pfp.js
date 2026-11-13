// Channel profile picture: Lulu's happy face with a few bubbles on a bright sky gradient (square, circle-safe).
import * as THREE from 'three';
import { lights, envMap } from './world.js';
import { makeLulu, poseLulu } from './chars.js';
import { makeBubbles } from './bubbles.js';
import { makePost } from './post.js';
import { ctex } from './lib.js';
const S = 1600;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(S, S, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const out = document.getElementById('out'); out.width = out.height = S; const og = out.getContext('2d');
const scene = new THREE.Scene(); lights(scene); scene.environment = envMap(renderer);
// backdrop: sky-blue radial gradient with soft bokeh dots
const bgTex = ctex(1024, 1024, (g, w, h) => {
  const gr = g.createRadialGradient(w * .5, h * .42, 40, w * .5, h * .5, w * .72); gr.addColorStop(0, '#9fe0ff'); gr.addColorStop(.5, '#3fb2f7'); gr.addColorStop(1, '#1873df');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const dots = [[150, 200, 60], [880, 180, 45], [820, 820, 70], [170, 860, 50], [520, 90, 30], [930, 520, 35]];
  for (const [x, y, r] of dots) { const d = g.createRadialGradient(x, y, 0, x, y, r); d.addColorStop(0, 'rgba(255,255,255,.35)'); d.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = d; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
});
const bg = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial({ map: bgTex, color: new THREE.Color(.8, .8, .8) })); bg.position.set(0, .7, -1.2); scene.add(bg);
const front = new THREE.DirectionalLight('#fff6ec', .9); front.position.set(.4, 1.2, 3); scene.add(front);
const lulu = makeLulu(); scene.add(lulu.root);
poseLulu(lulu, { mouth: .92, shape: 'ah', headTilt: .16, look: [0, .03], wide: .3, brows: .5, armL: [.05, .22, -.3], armR: [-.2, .22, -.5], wand: false });
lulu.root.updateMatrixWorld(true);
const bubbles = makeBubbles(scene);
for (const [x, y, z, r, sd] of [[-.25, .9, .15, .05, .2], [.27, .78, .18, .042, .5], [.2, .98, .08, .026, .8], [-.28, .62, .2, .03, .35], [.29, .58, .1, .022, .65]])
  bubbles.hero({ ts: 0, tp: 100, r, seed: sd, path: () => [x, y, z] });
bubbles.update(1);
const cam = new THREE.PerspectiveCamera(31, 1, .05, 50); cam.position.set(0, .72, 1.36); cam.lookAt(0, .69, 0);
const post = makePost(renderer, S, S);
post.render(scene, cam, { focus: 1.1, cInf: 0 });
og.drawImage(renderer.domElement, 0, 0);
window.png = out.toDataURL('image/png'); window.ready = true;
