import { existsSync, lstatSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const nodeModules = join(root, 'node_modules');
const workspaceRoots = ['apps', 'internal', 'packages'].map((directory) =>
  join(root, directory),
);

function isLinkedDirectory(fullPath) {
  const stat = lstatSync(fullPath);

  if (stat.isSymbolicLink()) {
    return true;
  }

  if (!stat.isDirectory()) {
    return false;
  }

  try {
    return realpathSync.native(fullPath).toLowerCase() !== resolve(fullPath).toLowerCase();
  } catch {
    return false;
  }
}

function collectNodeModules(directory, collected) {
  if (!existsSync(directory)) {
    return collected;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const fullPath = join(directory, entry.name);

    if (entry.name === 'node_modules') {
      collected.push(fullPath);
      continue;
    }

    collectNodeModules(fullPath, collected);
  }

  return collected;
}

function walk(directory, removed) {
  if (!existsSync(directory)) {
    return removed;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);

    if (entry.name === 'sass-embedded') {
      if (isLinkedDirectory(fullPath)) {
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

const searchRoots = [nodeModules, ...workspaceRoots.flatMap((directory) => collectNodeModules(directory, []))];
const removed = searchRoots.flatMap((directory) => walk(directory, []));

if (removed.length > 0) {
  console.log(`Removed ${removed.length} sass-embedded link(s).`);
}
