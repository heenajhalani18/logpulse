import express from 'express';
import dotenv from 'dotenv';
import { Client } from '@opensearch-project/opensearch';

dotenv.config();

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

const services = ['auth-service', 'payments-service', 'api-gateway'];

const messagesByLevel: Record<string, string[]> = {
  info: [
    'Request processed successfully',
    'User logged in',
    'Payment completed',
    'Cache hit for key',
  ],
  warn: [
    'Slow response time detected',
    'Retrying failed connection',
    'Rate limit approaching threshold',
  ],
  error: [
    'Failed login attempt: invalid credentials',
    'Database connection timeout',
    'Payment gateway returned 500',
    'Unhandled exception in request handler',
  ],
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedLevel(): string {
  const r = Math.random();
  if (r < 0.7) return 'info';
  if (r < 0.9) return 'warn';
  return 'error';
}

let totalIndexed = 0;
let lastRunAt = new Date().toISOString();

async function generateBatch(count: number) {
  const body: any[] = [];

  for (let i = 0; i < count; i++) {
    const level = weightedLevel();
    const service = randomFrom(services);
    const message = randomFrom(messagesByLevel[level]);

    body.push({ index: { _index: 'logs' } });
    body.push({
      service,
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  const result = await esClient.bulk({ body });
  if (result.body.errors) {
    console.error('Some documents failed to index');
  } else {
    totalIndexed += count;
    lastRunAt = new Date().toISOString();
    console.log(`Indexed ${count} log documents (total: ${totalIndexed})`);
  }
}

// Keep generating logs on a timer, independent of any HTTP traffic
setInterval(() => {
  generateBatch(5).catch(console.error);
}, 3000);

// Minimal HTTP server so Render's free Web Service tier accepts this process,
// and so an external uptime pinger has something to hit to prevent spin-down
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', totalIndexed, lastRunAt });
});

app.get('/', (req, res) => {
  res.send('LogPulse log generator is running.');
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Log generator health server running on port ${PORT}`);
});
