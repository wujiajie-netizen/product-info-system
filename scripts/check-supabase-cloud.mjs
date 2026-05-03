import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const envFiles = [
  'apps/web-ele/.env',
  'apps/web-ele/.env.development',
  'apps/web-ele/.env.local',
];

function readEnvFile(file) {
  const path = resolve(root, file);

  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        if (index === -1) {
          return [];
        }

        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, '');
        return [key, value];
      })
      .filter(([key]) => key),
  );
}

function mask(value) {
  if (!value || value.length <= 12) {
    return '***';
  }

  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

const env = envFiles.reduce(
  (result, file) => ({
    ...result,
    ...readEnvFile(file),
  }),
  {},
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Create apps/web-ele/.env.local from apps/web-ele/.env.local.example.',
  );
  process.exit(1);
}

if (
  supabaseUrl.includes('your-project-ref') ||
  anonKey.includes('your-supabase-anon-key')
) {
  console.error(
    'Supabase env still uses placeholder values. Fill apps/web-ele/.env.local with the Cloud project URL and anon key.',
  );
  process.exit(1);
}

let baseUrl;

try {
  baseUrl = new URL(supabaseUrl);
} catch {
  console.error(`Invalid VITE_SUPABASE_URL: ${supabaseUrl}`);
  process.exit(1);
}

console.log(`Checking Supabase Cloud: ${baseUrl.origin}`);
console.log(`Using anon key: ${mask(anonKey)}`);

async function fetchWithFriendlyError(url) {
  try {
    return await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
  } catch (error) {
    console.error(`Unable to reach ${url.origin}.`);
    console.error((error instanceof Error ? error.message : String(error)).slice(0, 500));
    process.exit(1);
  }
}

const authResponse = await fetchWithFriendlyError(
  new URL('/auth/v1/settings', baseUrl),
);

if (!authResponse.ok) {
  const body = await authResponse.text();
  console.error(`Supabase Auth check failed: HTTP ${authResponse.status}`);
  console.error(body.slice(0, 500));
  process.exit(1);
}

const productsResponse = await fetchWithFriendlyError(
  new URL('/rest/v1/products?select=id&limit=1', baseUrl),
);

if (!productsResponse.ok) {
  const body = await productsResponse.text();
  console.error(`Supabase products table check failed: HTTP ${productsResponse.status}`);
  console.error(body.slice(0, 500));
  process.exit(1);
}

console.log('Supabase Cloud is reachable, the public key is accepted, and the products table can be queried.');
