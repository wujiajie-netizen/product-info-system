import fs from 'node:fs';
import path from 'node:path';

import { getRepoRoot } from './shared.mjs';

const repoRoot = getRepoRoot();
const manifestPath = path.join(repoRoot, 'demo-data', 'assets', 'manifest.json');
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'product-documents';
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. These values are only read from environment variables.',
  );
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`Manifest not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (const asset of manifest) {
  const localPath = path.join(repoRoot, asset.localPath);
  const buffer = fs.readFileSync(localPath);
  const url = new URL(
    `/storage/v1/object/${bucketName}/${asset.storagePath}`,
    supabaseUrl,
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': asset.mimeType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to upload ${asset.storagePath}: ${response.status} ${await response.text()}`,
    );
  }

  console.log(`Uploaded ${asset.storagePath}`);
}
