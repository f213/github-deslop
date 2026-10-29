import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { PROFILE_DIR } from './profile.js';

fs.mkdirSync(PROFILE_DIR, { recursive: true });
console.log(`Log into GitHub in the window that opens, then quit Firefox. Profile: ${PROFILE_DIR}`);
spawn('firefox', ['--no-remote', '--profile', PROFILE_DIR, 'https://github.com/login'], { stdio: 'inherit' });
