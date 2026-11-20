const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..'); const types = { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
(async () => { await new Promise(r => server.listen(0, '127.0.0.1', r)); const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage(); p.on('pageerror', e => console.error(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/src/pfp.html`); await p.waitForFunction('window.ready === true');
  for (const [n, f, a, c] of [['pfp_deadpan', 'calm', '#7fd8ff', '#3a8ad8'], ['pfp_smile', 'happy', '#8ae86a', '#3aa84a'], ['pfp_shock', 'shock', '#ff8a7a', '#d8423a']]) { const u = await p.evaluate(([f, a, c]) => window.pfp(f, a, c), [f, a, c]); fs.writeFileSync(path.join(root, 'out', n + '.png'), Buffer.from(u.split(',')[1], 'base64')); }
  await b.close(); server.close(); })();
