// Usage: node src/render.cjs test 0.5,3.2,...   -> build/test/*.jpg + contact sheet inputs
//        node src/render.cjs full               -> build/video.mp4 (silent)
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process');
const root = path.resolve(__dirname, '..'); const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r)); const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage(); page.on('console', m => console.log('[page]', m.text())); page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exitCode = 1; });
  await page.goto(`http://127.0.0.1:${port}/src/index.html`); await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
  const mode = process.argv[2];
  if (mode === 'test') {
    const dir = path.join(root, 'build/test'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    for (const t of process.argv[3].split(',').map(Number)) { const u = await page.evaluate(t => window.renderTime(t), t); fs.writeFileSync(path.join(dir, `t${t.toFixed(2).padStart(5, '0')}.jpg`), Buffer.from(u.split(',')[1], 'base64')); }
    console.log(JSON.stringify(await page.evaluate('window.captionChunks.map(c=>[+c.s.toFixed(2),+c.e.toFixed(2),c.text])')));
  } else {
    const n = await page.evaluate('window.frameCount');
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-color_range', 'tv', path.join(root, 'build/video.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < n; i++) { const u = await page.evaluate(i => window.renderFrame(i), i); if (!ff.stdin.write(Buffer.from(u.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); if (i % 150 === 0) console.log('frame', i, '/', n); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', n);
  }
  await browser.close(); server.close();
})();
