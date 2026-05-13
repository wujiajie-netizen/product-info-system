import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

export function loadCatalog() {
  const filePath = path.join(repoRoot, 'demo-data', 'catalog.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function getRepoRoot() {
  return repoRoot;
}

export function stableUuid(scope, key) {
  const hash = createHash('md5').update(`${scope}:${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export function sqlLiteral(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value)) {
    return `array[${value.map((item) => sqlLiteral(item)).join(', ')}]`;
  }

  if (typeof value === 'object') {
    return `${sqlLiteral(JSON.stringify(value))}::jsonb`;
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

export function chunk(items, size) {
  const result = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}
