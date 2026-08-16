import { Client } from '@opensearch-project/opensearch';

const ERROR_THRESHOLD = 5;
const WINDOW_SECONDS = 30;

export function startAlertWorker(esClient: Client) {
  console.log(`Alert worker started — checking every ${WINDOW_SECONDS}s for >${ERROR_THRESHOLD} errors`);

  setInterval(async () => {
    try {
      const since = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();

      const result = await esClient.count({
        index: 'logs',
        body: {
          query: {
            bool: {
              filter: [
                { term: { level: 'error' } },
                { range: { timestamp: { gte: since } } },
              ],
            },
          },
        },
      });

      const errorCount = result.body.count;

      if (errorCount > ERROR_THRESHOLD) {
        console.log(`🚨 ALERT: ${errorCount} errors in the last ${WINDOW_SECONDS}s (threshold: ${ERROR_THRESHOLD})`);
      } else {
        console.log(`Alert check OK — ${errorCount} errors in last ${WINDOW_SECONDS}s`);
      }
    } catch (err) {
      console.error('Alert worker error:', (err as Error).message);
    }
  }, WINDOW_SECONDS * 1000);
}
