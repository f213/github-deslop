// Submits the extension to its public AMO listing and downloads the signed .xpi into web-ext-artifacts/.
// With --dev, signs an unlisted copy under a separate add-on id into web-ext-artifacts/dev/, which AMO signs without review.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './driver.js';

// CI passes the credentials as environment variables instead.
if (fs.existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'));
const { AMO_JWT_ISSUER, AMO_JWT_SECRET } = process.env;

const dev = process.argv.includes('--dev');
let sourceDir = path.join(ROOT, 'extension');
const artifactsDir = path.join(ROOT, 'web-ext-artifacts', dev ? 'dev' : '');
const manifest = JSON.parse(fs.readFileSync(path.join(sourceDir, 'manifest.json')));

function amoAuth() {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ iss: AMO_JWT_ISSUER, jti: crypto.randomUUID(), iat, exp: iat + 60 })}`;
  const signature = crypto.createHmac('sha256', AMO_JWT_SECRET).update(unsigned).digest('base64url');
  return { Authorization: `JWT ${unsigned}.${signature}` };
}

// A listed version AMO already has is downloaded once approved rather than submitted again, which AMO refuses.
async function downloadSubmitted() {
  const { id } = manifest.browser_specific_settings.gecko;
  const url = `https://addons.mozilla.org/api/v5/addons/addon/${encodeURIComponent(id)}/versions/v${manifest.version}/`;
  const response = await fetch(url, { headers: amoAuth() });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`${url}: ${response.status} ${await response.text()}`);
  const { file } = await response.json();
  if (file.status !== 'public') {
    console.error(`${manifest.version} is already on AMO with status «${file.status}»; run again once it is approved.`);
    process.exit(1);
  }
  const xpi = await fetch(file.url, { headers: amoAuth() });
  if (!xpi.ok) throw new Error(`${file.url}: ${xpi.status}`);
  fs.mkdirSync(artifactsDir, { recursive: true });
  const target = path.join(artifactsDir, path.basename(new URL(file.url).pathname));
  fs.writeFileSync(target, Buffer.from(await xpi.arrayBuffer()));
  console.log(`${manifest.version} is already approved on AMO, downloaded ${target}`);
  return true;
}

if (dev) {
  const devDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-deslop-dev-'));
  fs.cpSync(sourceDir, devDir, { recursive: true });
  const devManifest = { ...manifest, name: `${manifest.name} (dev)` };
  devManifest.browser_specific_settings = structuredClone(manifest.browser_specific_settings);
  devManifest.browser_specific_settings.gecko.id = manifest.browser_specific_settings.gecko.id.replace('@', '-dev@');
  fs.writeFileSync(path.join(devDir, 'manifest.json'), JSON.stringify(devManifest, null, 2));
  sourceDir = devDir;
} else if (await downloadSubmitted()) {
  process.exit(0);
}

const { status } = spawnSync(
  path.join(ROOT, 'node_modules/.bin/web-ext'),
  [
    'sign',
    ...(dev
      ? ['--channel=unlisted']
      : [
          '--channel=listed',
          `--amo-metadata=${path.join(ROOT, 'amo-metadata.json')}`,
          // Listed versions wait for AMO review before the signed .xpi can be downloaded.
          '--approval-timeout=3600000',
        ]),
    `--source-dir=${sourceDir}`,
    `--artifacts-dir=${artifactsDir}`,
  ],
  // Via the environment, so the secret stays out of the process list.
  { stdio: 'inherit', env: { ...process.env, WEB_EXT_API_KEY: AMO_JWT_ISSUER, WEB_EXT_API_SECRET: AMO_JWT_SECRET } },
);
process.exitCode = status;
