/**
 * CI may still invoke `npm test -- --watchAll=false --passWithNoTests` (CRA/Jest).
 * Extra args are ignored; always run `vitest run`.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vitestBin = path.join(__dirname, '..', 'node_modules', 'vitest', 'vitest.mjs');

const child = spawnSync(process.execPath, [vitestBin, 'run'], {
  stdio: 'inherit',
  env: { ...process.env, CI: process.env.CI ?? 'true' },
  windowsHide: true,
});

process.exit(child.status ?? 1);
