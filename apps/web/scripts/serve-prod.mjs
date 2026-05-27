/**
 * Production static server for Railway (no devDependencies at runtime).
 */
import http from 'node:http';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from 'serve-handler';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 8080);
const host = '0.0.0.0';

console.log(
  `[streamautomator-web] PORT=${process.env.PORT ?? '(unset)'} → listening on ${port} (static dist/)`
);

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('[streamautomator-web] dist/index.html missing — run npm run build');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  return handler(req, res, {
    public: dist,
    rewrites: [{ source: '**', destination: '/index.html' }],
  });
});

server.listen(port, host, () => {
  console.log(`[streamautomator-web] listening on http://${host}:${port}`);
});
