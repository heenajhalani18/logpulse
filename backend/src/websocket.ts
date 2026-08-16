import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Client } from '@opensearch-project/opensearch';

export function setupWebSocket(server: Server, esClient: Client) {
  const wss = new WebSocketServer({ server, path: '/ws/logs' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log('Client connected to live log tail');
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from live log tail');
    });
  });

  function broadcast(data: unknown) {
    const payload = JSON.stringify(data);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  let lastCheckedTimestamp = new Date().toISOString();

  setInterval(async () => {
    if (clients.size === 0) return;

    try {
      const result = await esClient.search({
        index: 'logs',
        body: {
          size: 50,
          sort: [{ timestamp: { order: 'asc' } }],
          query: {
            range: {
              timestamp: { gt: lastCheckedTimestamp },
            },
          },
        },
      });

      const hits = result.body.hits.hits;
      if (hits.length > 0) {
        for (const hit of hits) {
          broadcast({ type: 'log', data: hit._source });
        }
        const lastHit = hits[hits.length - 1]._source as { timestamp: string };
        lastCheckedTimestamp = lastHit.timestamp;
      }
    } catch (err) {
      console.error('WebSocket poll error:', (err as Error).message);
    }
  }, 2000);

  console.log('WebSocket live log tail ready at /ws/logs');
}
