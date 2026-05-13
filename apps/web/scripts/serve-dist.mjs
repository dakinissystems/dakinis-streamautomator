/**
 * Local production-style static server (Railway uses Railpack + Caddy in deploy).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distIndex = path.join(root, 'dist', 'index.html');
const serveMain = path.join(root, 'node_modules', 'serve', 'build', 'main.js');
const port = String(process.env.PORT || '5173').trim() || '5173';

if (!existsSync(distIndex)) {
  console.error('[streamautomator-web] dist/index.html missing — run npm run build first');
  process.exit(1);
}

console.log(`[streamautomator-web] serving dist on 0.0.0.0:${port}`);

const child = spawn(
  process.execPath,
  [serveMain, '-s', 'dist', '-l', `tcp://0.0.0.0:${port}`, '-n', '-L'],
  { stdio: 'inherit', cwd: root, env: { ...process.env, NO_UPDATE_CHECK: '1' } }
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
