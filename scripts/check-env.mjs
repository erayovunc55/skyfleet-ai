import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

const requiredKeys = ['VITE_API_URL'];

const hasFile = (filePath) => fs.existsSync(filePath);

if (!hasFile(envPath)) {
  console.warn('[ENV] .env not found. Using example values only for local checks.');
}

const exampleRaw = hasFile(examplePath) ? fs.readFileSync(examplePath, 'utf8') : '';
const envRaw = hasFile(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const collectKeys = (raw) => {
  const keys = new Set();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=/);
    if (match) keys.add(match[1]);
  }
  return keys;
};

const exampleKeys = collectKeys(exampleRaw);
const envKeys = collectKeys(envRaw);
const missing = requiredKeys.filter((key) => !envKeys.has(key) && !exampleKeys.has(key));

if (missing.length > 0) {
  console.error('[ENV] Missing required config keys:', missing.join(', '));
  process.exit(1);
}

console.log('[ENV] Environment configuration check passed.');
