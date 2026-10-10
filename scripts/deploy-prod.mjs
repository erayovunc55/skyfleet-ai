import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const releaseCheck = 'npm run release:check';

console.log('[DEPLOY] Starting production deployment flow.');
console.log('[DEPLOY] Running active release gate...');

const { spawnSync } = await import('node:child_process');
const result = spawnSync(releaseCheck, { shell: true, stdio: 'inherit', cwd: root });

if (result.status !== 0) {
  console.error('[DEPLOY] Release gate failed. Production deployment stopped.');
  process.exit(result.status ?? 1);
}

const docsDir = path.join(root, 'docs');
const requiredDocs = [
  'ACTIVE_PROJECT_RULES.md',
  'DEPLOYMENT_CHECKLIST.md',
  'RELEASE_RUNBOOK.md',
  'BRANCHING_AND_DEPLOYMENT.md',
  'PRODUCTION_ENV_TEMPLATE.md',
];

for (const doc of requiredDocs) {
  const fullPath = path.join(docsDir, doc);
  if (!fs.existsSync(fullPath)) {
    console.error(`[DEPLOY] Missing required release document: ${doc}`);
    process.exit(1);
  }
}

console.log('[DEPLOY] Production deployment prerequisites satisfied.');
console.log('[DEPLOY] This is a controlled deployment flow; actual host deployment must still be executed by your chosen environment platform.');
