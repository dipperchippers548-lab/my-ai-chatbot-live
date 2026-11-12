const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..'); const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
(async () => { await new Promise(r => server.listen(0, '127.0.0.1', r)); const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage(); page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exitCode = 1; }); page.on('console', m => console.log('[page]', m.text()));
  await page.goto(`http://127.0.0.1:${server.address().port}/src/index.html`); await page.waitForFunction('window.ready === true', null, { timeout: 120000 });
  for (let i = 0; i < 4; i++) { const u = await page.evaluate(i => window.renderTime(i), i); fs.writeFileSync(path.join(root, `out/test-${i + 1}.jpg`), Buffer.from(u.split(',')[1], 'base64')); }
  await browser.close(); server.close(); })();
