import os from 'node:os';
import path from 'node:path';

// Lives outside the repo so the GitHub login survives worktree removal.
const CACHE_DIR = path.join(os.homedir(), '.cache/github-deslop');
export const PROFILE_DIR = process.env.DESLOP_PROFILE ?? path.join(CACHE_DIR, 'firefox-profile');
export const ADDONS_DIR = path.join(CACHE_DIR, 'addons');
