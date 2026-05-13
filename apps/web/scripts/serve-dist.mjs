/**
 * Production static server for Railway/Render (reads PORT, binds 0.0.0.0).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const serveMain = path.join(root, 'node_modules', 'serve', 'build', 'main.js');
const port = String(process.env.PORT || '5173').trim() || '5173';

console.log(`[streamautomator-web] serving dist on 0.0.0.0:${port}`);

const child = spawnSync(
  process.execPath,
  [serveMain, '-s', 'dist', '--listen', `tcp://0.0.0.0:${port}`],
  { stdio: 'inherit', cwd: root, env: process.env }
);

process.exit(child.status ?? 1);
