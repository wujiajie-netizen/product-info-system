import { existsSync, lstatSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const nodeModules = join(root, 'node_modules');

function walk(directory, removed) {
  if (!existsSync(directory)) {
    return removed;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);

    if (entry.name === 'sass-embedded') {
      const stat = lstatSync(fullPath);
      if (stat.isSymbolicLink()) {
        rmSync(fullPath, { force: true, recursive: true });
        removed.push(fullPath);
        continue;
      }
    }

    if (entry.isDirectory()) {
      walk(fullPath, removed);
    }
  }

  return removed;
}

const removed = walk(nodeModules, []);

if (removed.length > 0) {
  console.log(`Removed ${removed.length} sass-embedded link(s).`);
}
