// ---------- timing: shots are cut on the original voiceover clock; animation runs on the final (edited) clock ----------
const cutInfo = await (await fetch('/build/cuts.json')).json();
const tm = t => (t - cutInfo.cuts.reduce((s, [a, b]) => s + (t > a ? Math.min(t, b) - a : 0), 0)) / cutInfo.speed;
const toOriginal = tc => { let t = tc * cutInfo.speed; for (const [a, b] of cutInfo.cuts) { if (t >= a) t += b - a; else break; } return t; };
const TOTAL = cutInfo.duration;
const shots = [];
const shot = (t0, t1, build, dof = null) => { const s = { t0, t1, f0: tm(t0), f1: t1 > 90 ? TOTAL : tm(t1), dof, ...build(t0) }; s.scene.traverse(o => { if (o.isMesh) { const m = Array.isArray(o.material) ? o.material[0] : o.material; const basic = m.isMeshBasicMaterial || m.isShaderMaterial; o.castShadow = !basic && !m.transparent; o.receiveShadow = !basic; } }); shots.push(s); };
const at = (t0, o) => tm(o) - tm(t0);   // when (in final seconds, from the shot start) an original-clock moment happens
