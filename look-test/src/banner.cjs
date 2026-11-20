const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..'); const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
(async () => { await new Promise(r => server.listen(0, '127.0.0.1', r)); const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage(); p.on('pageerror', e => console.error(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/src/banner.html`); await p.waitForFunction('window.ready === true', null, { timeout: 120000 });
  fs.writeFileSync(path.join(root, 'out', 'channel_banner.png'), Buffer.from((await p.evaluate('window.png()')).split(',')[1], 'base64')); await b.close(); server.close(); })();
