// Uploads the extension to AMO as unlisted and downloads the signed .xpi into web-ext-artifacts/.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './driver.js';

// CI passes the credentials as environment variables instead.
if (fs.existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'));
const { AMO_JWT_ISSUER, AMO_JWT_SECRET } = process.env;

const { status } = spawnSync(
  path.join(ROOT, 'node_modules/.bin/web-ext'),
  [
    'sign',
    '--channel=unlisted',
    `--source-dir=${path.join(ROOT, 'extension')}`,
    `--artifacts-dir=${path.join(ROOT, 'web-ext-artifacts')}`,
  ],
  // Via the environment, so the secret stays out of the process list.
  { stdio: 'inherit', env: { ...process.env, WEB_EXT_API_KEY: AMO_JWT_ISSUER, WEB_EXT_API_SECRET: AMO_JWT_SECRET } },
);
process.exitCode = status;
