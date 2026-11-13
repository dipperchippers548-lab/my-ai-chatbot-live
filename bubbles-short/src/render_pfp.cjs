// node src/render_pfp.cjs -> build/pfp_1600.png
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..'); const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage(); page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
  await page.goto(`http://127.0.0.1:${server.address().port}/src/pfp.html`); await page.waitForFunction('window.ready === true', null, { timeout: 180000 });
  fs.writeFileSync(path.join(root, 'build/pfp_1600.png'), Buffer.from((await page.evaluate('window.png')).split(',')[1], 'base64'));
  await browser.close(); server.close(); console.log('pfp done');
})();
