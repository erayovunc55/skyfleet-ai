import process from 'node:process';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const backendDir = path.join(root, 'backend');
const url = process.env.HEALTH_URL || 'http://127.0.0.1:8000/health';
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS || 30000);

const waitForAlive = async () => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Server may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return null;
};

const command = process.platform === 'win32'
  ? 'php artisan serve --host 127.0.0.1 --port 8000'
  : 'php artisan serve --host 127.0.0.1 --port 8000';

const server = spawn(command, {
  cwd: backendDir,
  stdio: 'ignore',
  shell: true,
  detached: false,
});

try {
  const data = await waitForAlive();

  if (!data || data.status !== 'ok') {
    console.error('[HEALTH] Backend health check failed.');
    process.exit(1);
  }

  console.log('[HEALTH] OK');
  console.log(`[HEALTH] ${data.app} @ ${data.timestamp}`);
} finally {
  if (!server.killed) {
    server.kill('SIGTERM');
  }
}
