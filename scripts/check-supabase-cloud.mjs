import { Buffer } from 'node:buffer';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const appEnvTargets = [
  {
    label: '@product-info/web-front',
    envDir: 'apps/web-front',
  },
  {
    label: '@vben/web-ele',
    envDir: 'apps/web-ele',
  },
];
const envFileNames = ['.env', '.env.development', '.env.local'];

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

function decodeJwtPayload(token) {
  const segments = token.split('.');

  if (segments.length !== 3) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function loadAppEnv(target) {
  const env = {};
  const sources = [];

  for (const fileName of envFileNames) {
    const relativePath = `${target.envDir}/${fileName}`;
    const absolutePath = resolve(root, relativePath);

    if (!existsSync(absolutePath)) {
      continue;
    }

    Object.assign(env, readEnvFile(relativePath));
    sources.push(relativePath);
  }

  return {
    ...target,
    env,
    sources,
    localEnvPath: `${target.envDir}/.env.local`,
    hasLocalEnv: existsSync(resolve(root, target.envDir, '.env.local')),
  };
}

const appEnvs = appEnvTargets.map(loadAppEnv);

const missingLocalEnvTargets = appEnvs.filter((target) => !target.hasLocalEnv);

if (missingLocalEnvTargets.length > 0) {
  console.error('Missing required local Supabase env files:');
  for (const target of missingLocalEnvTargets) {
    console.error(`- ${target.localEnvPath}`);
  }
  console.error('Copy each file from .env.local.example and fill the Cloud URL plus anon key.');
  process.exit(1);
}

const missingValueTargets = appEnvs.filter(
  (target) =>
    !target.env.VITE_SUPABASE_URL || !target.env.VITE_SUPABASE_ANON_KEY,
);

if (missingValueTargets.length > 0) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in:');
  for (const target of missingValueTargets) {
    console.error(`- ${target.localEnvPath}`);
  }
  process.exit(1);
}

const [frontEnv, adminEnv] = appEnvs;
const supabaseUrl = adminEnv.env.VITE_SUPABASE_URL;
const anonKey = adminEnv.env.VITE_SUPABASE_ANON_KEY;

if (
  frontEnv.env.VITE_SUPABASE_URL !== supabaseUrl ||
  frontEnv.env.VITE_SUPABASE_ANON_KEY !== anonKey
) {
  console.error('Supabase env mismatch between frontend apps.');
  console.error(
    `- ${frontEnv.localEnvPath}: ${frontEnv.env.VITE_SUPABASE_URL} / ${mask(frontEnv.env.VITE_SUPABASE_ANON_KEY)}`,
  );
  console.error(
    `- ${adminEnv.localEnvPath}: ${adminEnv.env.VITE_SUPABASE_URL} / ${mask(adminEnv.env.VITE_SUPABASE_ANON_KEY)}`,
  );
  process.exit(1);
}

if (
  supabaseUrl.includes('your-project-ref') ||
  anonKey.includes('your-supabase-anon-key') ||
  anonKey.includes('your-supabase-publishable-or-anon-key')
) {
  console.error(
    'Supabase env still uses placeholder values. Fill both apps/*/.env.local files with the Cloud project URL and anon key.',
  );
  process.exit(1);
}

const jwtPayload = decodeJwtPayload(anonKey);

if (jwtPayload?.role === 'service_role') {
  console.error(
    'Detected a service_role key in frontend env. Replace it with the browser-safe anon/publishable key.',
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
for (const target of appEnvs) {
  console.log(`${target.label} env sources: ${target.sources.join(', ')}`);
}

async function fetchWithFriendlyError(url, options = {}) {
  const { accessToken, headers, ...fetchOptions } = options;

  try {
    return await fetch(url, {
      ...fetchOptions,
      headers: {
        apikey: anonKey,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
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

const smokeEmail = process.env.SUPABASE_CHECK_EMAIL;
const smokePassword = process.env.SUPABASE_CHECK_PASSWORD;
const expectedRole = process.env.SUPABASE_CHECK_EXPECT_ROLE;

if ((smokeEmail && !smokePassword) || (!smokeEmail && smokePassword)) {
  console.error(
    'SUPABASE_CHECK_EMAIL and SUPABASE_CHECK_PASSWORD must be provided together.',
  );
  process.exit(1);
}

if (smokeEmail && smokePassword) {
  const signInResponse = await fetchWithFriendlyError(
    new URL('/auth/v1/token?grant_type=password', baseUrl),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: smokeEmail,
        password: smokePassword,
      }),
    },
  );

  if (!signInResponse.ok) {
    const body = await signInResponse.text();
    console.error('Supabase credential smoke check failed.');
    console.error(body.slice(0, 500));
    process.exit(1);
  }

  const session = await signInResponse.json();
  const userId = session.user?.id;
  const accessToken = session.access_token;

  if (!userId || !accessToken) {
    console.error('Supabase credential smoke check returned an incomplete session.');
    process.exit(1);
  }

  const profileResponse = await fetchWithFriendlyError(
    new URL(`/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(userId)}`, baseUrl),
    {
      accessToken,
    },
  );

  if (!profileResponse.ok) {
    const body = await profileResponse.text();
    console.error('Supabase profile read check failed after sign-in.');
    console.error(body.slice(0, 500));
    process.exit(1);
  }

  const profiles = await profileResponse.json();
  const profile = profiles[0];

  if (!profile?.role) {
    console.error('Supabase profile read check returned no visible role for the signed-in user.');
    process.exit(1);
  }

  if (expectedRole && profile.role !== expectedRole) {
    console.error(
      `Supabase role check failed for ${smokeEmail}. Expected ${expectedRole}, got ${profile.role}.`,
    );
    process.exit(1);
  }

  const productsResponse = await fetchWithFriendlyError(
    new URL('/rest/v1/products?select=id&limit=1', baseUrl),
    {
      accessToken,
    },
  );

  if (!productsResponse.ok) {
    const body = await productsResponse.text();
    console.error('Supabase authenticated read check failed on products.');
    console.error(body.slice(0, 500));
    process.exit(1);
  }

  const products = await productsResponse.json();
  console.log(
    `Authenticated smoke check passed for ${smokeEmail} (${profile.role}); sample product rows returned: ${products.length}.`,
  );
}

console.log(
  'Supabase Cloud is reachable, both frontend env files are aligned, and the browser-safe key is accepted.',
);
