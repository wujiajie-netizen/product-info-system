import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const scriptPath = path.resolve('scripts', 'demo-data', 'generate-assets.py');

const candidates = [
  process.env.PYTHON,
  path.join(
    os.homedir(),
    '.cache',
    'codex-runtimes',
    'codex-primary-runtime',
    'dependencies',
    'python',
    'python.exe',
  ),
  'python3',
  'python',
].filter(Boolean);

let selected = null;

for (const candidate of candidates) {
  if (candidate.endsWith('.exe')) {
    if (existsSync(candidate)) {
      selected = candidate;
      break;
    }
    continue;
  }

  const result = spawnSync(candidate, ['--version'], {
    encoding: 'utf8',
    shell: true,
  });
  if (result.status === 0) {
    selected = candidate;
    break;
  }
}

if (!selected) {
  console.error(
    'No Python runtime found. Set PYTHON or install Python before running pnpm demo:assets.',
  );
  process.exit(1);
}

const result = spawnSync(selected, [scriptPath], {
  shell: true,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
