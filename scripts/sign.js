// Submits the extension to its public AMO listing and downloads the signed .xpi into web-ext-artifacts/.
// With --dev, signs an unlisted copy under a separate add-on id into web-ext-artifacts/dev/, which AMO signs without review.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './driver.js';

// CI passes the credentials as environment variables instead.
if (fs.existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'));
const { AMO_JWT_ISSUER, AMO_JWT_SECRET } = process.env;

const dev = process.argv.includes('--dev');
let sourceDir = path.join(ROOT, 'extension');
if (dev) {
  const devDir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-deslop-dev-'));
  fs.cpSync(sourceDir, devDir, { recursive: true });
  const manifestPath = path.join(devDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  manifest.name += ' (dev)';
  manifest.browser_specific_settings.gecko.id = manifest.browser_specific_settings.gecko.id.replace('@', '-dev@');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  sourceDir = devDir;
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
    `--artifacts-dir=${path.join(ROOT, 'web-ext-artifacts', dev ? 'dev' : '')}`,
  ],
  // Via the environment, so the secret stays out of the process list.
  { stdio: 'inherit', env: { ...process.env, WEB_EXT_API_KEY: AMO_JWT_ISSUER, WEB_EXT_API_SECRET: AMO_JWT_SECRET } },
);
process.exitCode = status;
