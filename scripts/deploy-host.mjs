import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const target = process.env.DEPLOY_TARGET || 'staging';
const hostDir = process.env.DEPLOY_TARGET_DIR || path.join(root, 'deploy-target');
const deployScript = process.env.DEPLOY_COMMAND || '';

console.log(`[DEPLOY] Target: ${target}`);

if (!deployScript) {
  console.log('[DEPLOY] No host-specific deploy command configured. This script is ready for your hosting platform command.');
  console.log('[DEPLOY] Example: DEPLOY_COMMAND="bash ./deploy.sh" npm run deploy:host');
  process.exit(0);
}

const releaseCheck = spawn('npm', ['run', 'release:check'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

releaseCheck.on('exit', (code) => {
  if (code !== 0) {
    console.error('[DEPLOY] Release gate failed; host deployment stopped.');
    process.exit(code ?? 1);
  }

  fs.mkdirSync(hostDir, { recursive: true });
  console.log(`[DEPLOY] Deploy directory ready: ${hostDir}`);

  const hostDeploy = spawn(deployScript, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });

  hostDeploy.on('exit', (hostCode) => {
    if (hostCode !== 0) {
      console.error('[DEPLOY] Hosting deployment command failed.');
      process.exit(hostCode ?? 1);
    }

    console.log('[DEPLOY] Host deployment command succeeded.');
  });
});
