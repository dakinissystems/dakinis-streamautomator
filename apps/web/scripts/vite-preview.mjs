/**
 * Local/staging preview after build. Do not pass --host/--port on the CLI;
 * Railway production uses Railpack Caddy (no custom start). Local: npm run start:local
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const port = String(process.env.PORT || '4173').trim() || '4173';

console.log(`[streamautomator-web] vite preview on 0.0.0.0:${port}`);

const child = spawnSync(
  process.execPath,
  [viteBin, 'preview', '--host', '0.0.0.0', '--port', port],
  { stdio: 'inherit', cwd: root, env: process.env }
);

process.exit(child.status ?? 1);
