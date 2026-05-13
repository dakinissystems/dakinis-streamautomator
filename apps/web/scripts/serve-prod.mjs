/**
 * Production static server: binds PORT, serves dist/, exposes GET /health.
 */
import http from 'node:http';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from 'serve-handler';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 8080);

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('[streamautomator-web] dist/index.html missing — run npm run build');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? '/';
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
    res.end('ok');
    return;
  }
  return handler(req, res, {
    public: dist,
    rewrites: [{ source: '**', destination: '/index.html' }],
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[streamautomator-web] serving dist on 0.0.0.0:${port} (/health ok)`);
});
