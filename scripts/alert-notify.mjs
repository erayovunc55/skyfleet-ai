import process from 'node:process';

const status = process.argv[2] || 'ok';
const message = process.argv.slice(3).join(' ') || 'Production notification';

const webhookUrl = process.env.ALERT_WEBHOOK_URL;

if (!webhookUrl) {
  console.log(`[ALERT] ${status.toUpperCase()}: ${message}`);
  process.exit(0);
}

const payload = {
  status,
  message,
  timestamp: new Date().toISOString(),
};

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  console.error(`[ALERT] Failed to send webhook: ${response.status}`);
  process.exit(1);
}

console.log('[ALERT] Webhook sent successfully.');
