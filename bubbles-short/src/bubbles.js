// Deterministic bubble swarm: every bubble is a pure function of time (spawn, drift, pop) so any frame renders alone.
import * as THREE from 'three';
import { bubbleMaterial } from './chars.js';
import { rng, clamp } from './lib.js';
const MAX = 260, DROPS = 10, MAXD = 600;
export function makeBubbles(scene) {
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 36, 26), bubbleMaterial(true), MAX);
  im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3); im.frustumCulled = false; im.renderOrder = 6; scene.add(im);
  const dm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.5, 1.6), transparent: true, opacity: .85, depthWrite: false }), MAXD);
  dm.frustumCulled = false; dm.renderOrder = 7; scene.add(dm);
  const spawns = []; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  // emit n bubbles from a point between t0..t1 travelling roughly along dir
  function emit({ t0, t1, n, from, dir = [0, .3, 1], speed = 1.2, spread = .5, rmin = .03, rmax = .08, life = [3, 6], seed = 1, wind = [.12, 0, 0], buoy = .18 }) {
    const r = rng(seed * 7919 + 13);
    for (let i = 0; i < n; i++) {
      const ts = t0 + (t1 - t0) * (i + r() * .6) / n; const d = new THREE.Vector3(...dir).normalize();
      const v = d.clone().multiplyScalar(speed * (.6 + r() * .6)).add(new THREE.Vector3((r() - .5) * spread * 2, (r() - .5) * spread, (r() - .5) * spread * 1.4).multiplyScalar(speed));
      spawns.push({ ts, p0: new THREE.Vector3(...(typeof from === 'function' ? from(ts) : from)), v, r: rmin + (rmax - rmin) * r() ** 1.5, tp: ts + life[0] + (life[1] - life[0]) * r(), seed: r(), wind: new THREE.Vector3(...wind), buoy: buoy * (.6 + r() * .8) });
    }
  }
  // a scripted "hero" bubble: path(t) -> [x,y,z], pops at tp
  function hero({ ts, tp, path, r = .08, seed = .5 }) { spawns.push({ ts, tp, path, r, seed, hero: true }); }
  function posAt(b, t) {
    if (b.path) return p3.set(...b.path(t));
    const dt = t - b.ts, k = 1.8, e = (1 - Math.exp(-k * dt)) / k;
    return p3.set(b.p0.x + b.v.x * e + b.wind.x * dt + Math.sin(dt * 1.3 + b.seed * 9) * .06,
      b.p0.y + b.v.y * e + b.buoy * dt + Math.sin(dt * 1.7 + b.seed * 5) * .04,
      b.p0.z + b.v.z * e + b.wind.z * dt + Math.cos(dt * 1.1 + b.seed * 7) * .06);
  }
  function popAll(t, filter = () => true) { for (const b of spawns) if (b.ts < t && b.tp > t && filter(b)) b.tp = t + Math.random() * 0; }
  function update(t) {
    let n = 0, nd = 0;
    for (const b of spawns) {
      if (t < b.ts) continue;
      const age = t - b.ts;
      if (t < b.tp && n < MAX) {
        const p = posAt(b, t); const grow = clamp(age / .18); const wob = 1 + .06 * Math.sin(age * 9 + b.seed * 20) * Math.exp(-age * 1.5);
        s3.set(b.r * grow * wob, b.r * grow / wob, b.r * grow);
        m4.compose(p, q, s3); im.setMatrixAt(n, m4); im.instanceColor.setXYZ(n, b.seed, clamp((b.tp - t) / .05) * clamp(age / .05), 0); n++;
      } else if (t >= b.tp && t < b.tp + .32) {
        const pp = posAt(b, b.tp).clone(); const u = (t - b.tp) / .32; const rr = rng(Math.floor(b.seed * 1e6) + 1);
        for (let k = 0; k < DROPS && nd < MAXD; k++) {
          const a = rr() * Math.PI * 2, el = (rr() - .3) * 1.6; const dir = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
          const dist = b.r * (1 + u * 2.2 * (.6 + rr() * .6)); const p = pp.clone().addScaledVector(dir, dist); p.y -= u * u * .08;
          s3.setScalar(b.r * .09 * (1 - u) + .0015); m4.compose(p, q, s3); dm.setMatrixAt(nd++, m4);
        }
      }
    }
    im.count = n; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
    dm.count = nd; dm.instanceMatrix.needsUpdate = true;
  }
  return { emit, hero, update, spawns, posAt, popAll, mesh: im };
}
