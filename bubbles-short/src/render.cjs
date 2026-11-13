// node src/render.cjs test 0.5,3.2,...      -> build/test/tXX.XX.jpg  (scale via SCALE env, default 0.5)
// node src/render.cjs full [from] [to]      -> build/frames_<from>.mp4 (silent, base picture without lyrics)
// node src/render.cjs lyrics                -> build/lyrics/%05d.png (transparent lyric overlay)
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process');
const root = path.resolve(__dirname, '..'); const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r)); const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage(); page.on('console', m => console.log('[page]', m.text())); page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
  const mode = process.argv[2]; const scale = mode === 'test' ? (process.env.SCALE || '0.5') : '1';
  await page.goto(`http://127.0.0.1:${port}/src/index.html?scale=${scale}`); await page.waitForFunction('window.ready === true', null, { timeout: 180000 });
  const t0 = Date.now();
  if (mode === 'test') {
    const dir = path.join(root, 'build/test'); fs.mkdirSync(dir, { recursive: true });
    for (const t of process.argv[3].split(',').map(Number)) { const u = await page.evaluate(t => window.renderTime(t, true), t); fs.writeFileSync(path.join(dir, `t${t.toFixed(2).padStart(5, '0')}.jpg`), Buffer.from(u.split(',')[1], 'base64')); }
    console.log('stills done in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  } else if (mode === 'lyrics') {
    const dir = path.join(root, 'build/lyrics'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const n = await page.evaluate('window.frameCount');
    for (let i = 0; i < n; i++) { const u = await page.evaluate(i => window.renderLyrics(i), i); fs.writeFileSync(path.join(dir, String(i).padStart(5, '0') + '.png'), Buffer.from(u.split(',')[1], 'base64')); }
    console.log('lyrics frames', n);
  } else {
    const n = await page.evaluate('window.frameCount'); const from = +(process.argv[3] || 0), to = Math.min(n, +(process.argv[4] || n));
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-pix_fmt', 'yuv420p', path.join(root, `build/frames_${String(from).padStart(5, '0')}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = from; i < to; i++) { const u = await page.evaluate(i => window.renderFrame(i), i); if (!ff.stdin.write(Buffer.from(u.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); if ((i - from) % 60 === 0) console.log('frame', i, '/', to, ((Date.now() - t0) / 1000 / Math.max(1, i - from)).toFixed(2), 's/f'); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', from, to);
  }
  await browser.close(); server.close();
})();
