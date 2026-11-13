/**
 * Packs the web preview export into ONE self-contained HTML page (scripts inlined, images and
 * fonts embedded as data: URIs) so it can be shared as a single link, e.g. a Claude artifact.
 *
 *   npm run build:preview   ->   dist-preview/munchly-preview.html
 *
 * The page is a fragment (no <html>/<head>/<body>), because the host wraps it in its own skeleton.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run from the project folder (npm run build:preview does this).
const root = process.cwd();
const outDir = path.join(root, 'dist-preview');

execSync('npx expo export --platform web --output-dir dist-preview', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_PREVIEW_MODE: '1' },
});

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2' };
const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
if (scripts.length === 0) throw new Error('No scripts found in index.html');

let js = scripts.map((src) => fs.readFileSync(path.join(outDir, src), 'utf8')).join('\n;\n');

// Swap every "/assets/..." path for an embedded data: URI.
js = js.replace(/"(\/assets\/[^"]+)"/g, (whole, assetPath) => {
  const file = path.join(outDir, decodeURIComponent(assetPath));
  if (!fs.existsSync(file)) return whole;
  const mime = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  return `"data:${mime};base64,${fs.readFileSync(file).toString('base64')}"`;
});

// Keep the HTML parser from reading markup inside the inlined script.
js = js.replace(/<(\/?script|!--)/gi, '\\x3C$1');

const page = `<title>Munchly</title>
<style>
  :root { --bg: #FFF7EF; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #16110D; color-scheme: dark; } }
  :root[data-theme="dark"] { --bg: #16110D; color-scheme: dark; }
  html { box-sizing: border-box; }
  html, body { height: 100%; }
  body { overflow: hidden; background: var(--bg); }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<div id="root"></div>
<script>
  // The app's screens are addressed by path (/, /scan, ...). Start at the home screen wherever this page is hosted.
  try {
    if (!/^\\/(onboarding|scan|paywall|history|settings)?$/.test(location.pathname)) {
      history.replaceState(history.state, '', '/' + location.hash);
    }
  } catch (e) {}
</script>
<script>
${js}
</script>
`;

const outFile = path.join(outDir, 'munchly-preview.html');
fs.writeFileSync(outFile, page);
console.log(`Wrote ${path.relative(root, outFile)} (${(page.length / 1024 / 1024).toFixed(2)} MB)`);
