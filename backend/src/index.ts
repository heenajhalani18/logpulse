import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Client } from '@opensearch-project/opensearch';
import { createLogsRouter } from './routes/logs';
import { createAuthRouter } from './routes/auth';
import { requireAuth } from './middleware/authMiddleware';
import { setupWebSocket } from './websocket';
import { startAlertWorker } from './alertWorker';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

app.get('/health', async (req, res) => {
  try {
    const health = await esClient.cluster.health();
    res.json({ status: 'ok', elasticsearch: health.body });
  } catch (err) {
    res.status(500).json({ status: 'error', message: (err as Error).message });
  }
});

app.use('/api/auth', createAuthRouter());
app.use('/api/logs', requireAuth, createLogsRouter(esClient));

const server = createServer(app);
setupWebSocket(server, esClient);
startAlertWorker(esClient);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`LogPulse API running on http://localhost:${PORT}`);
});
