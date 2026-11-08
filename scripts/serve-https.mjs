// Serves dist/ over HTTPS on the LAN so phones get camera access (getUserMedia needs a secure context).
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import selfsigned from 'selfsigned';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const certDir = path.join(root, '.cert');
const PORT = 8443;

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm',
  '.task': 'application/octet-stream', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
};

const ips = Object.values(os.networkInterfaces()).flat()
  .filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);

// Cached cert is reused only if it was made for the same LAN IPs.
async function getCert() {
  const keyF = path.join(certDir, 'key.pem'), certF = path.join(certDir, 'cert.pem'), ipsF = path.join(certDir, 'ips.json');
  try {
    if (JSON.stringify(JSON.parse(fs.readFileSync(ipsF, 'utf8'))) === JSON.stringify(ips)) {
      return { key: fs.readFileSync(keyF), cert: fs.readFileSync(certF) };
    }
  } catch {}
  const now = new Date();
  const pems = await selfsigned.generate([{ name: 'commonName', value: 'iara.local' }], {
    algorithm: 'sha256',
    notBeforeDate: now,
    notAfterDate: new Date(now.getTime() + 365 * 864e5),
    extensions: [
      { name: 'basicConstraints', cA: false },
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
      { name: 'extKeyUsage', serverAuth: true },
      { name: 'subjectAltName', altNames: [
        { type: 2, value: 'localhost' }, { type: 2, value: 'iara.local' },
        { type: 7, ip: '127.0.0.1' }, ...ips.map((ip) => ({ type: 7, ip })),
      ] },
    ],
  });
  fs.mkdirSync(certDir, { recursive: true });
  fs.writeFileSync(keyF, pems.private);
  fs.writeFileSync(certF, pems.cert);
  fs.writeFileSync(ipsF, JSON.stringify(ips));
  return { key: pems.private, cert: pems.cert };
}

function resolveFile(url) {
  let p;
  try { p = decodeURIComponent(url.split('?')[0].split('#')[0]); } catch { return null; }
  const file = path.resolve(dist, '.' + path.posix.normalize('/' + p));
  if (file !== dist && !file.startsWith(dist + path.sep)) return null;
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  return path.join(dist, 'index.html'); // SPA fallback
}

const server = https.createServer(await getCert(), (req, res) => {
  const file = resolveFile(req.url);
  if (!file || !fs.existsSync(file)) { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`IARA servit din ${dist}`);
  console.log(`  https://localhost:${PORT}`);
  ips.forEach((ip) => console.log(`  https://${ip}:${PORT}`));
});
