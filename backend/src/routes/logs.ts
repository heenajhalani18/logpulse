import { Router } from 'express';
import { Client } from '@opensearch-project/opensearch';

export function createLogsRouter(esClient: Client) {
  const router = Router();

  router.get('/search', async (req, res) => {
    try {
      const { q, service, level, from, size } = req.query;

      const must: any[] = [];
      const filter: any[] = [];

      if (q) {
        must.push({ match: { message: q as string } });
      }
      if (service) {
        filter.push({ term: { service: service as string } });
      }
      if (level) {
        filter.push({ term: { level: level as string } });
      }

      const result = await esClient.search({
        index: 'logs',
        from: from ? parseInt(from as string) : 0,
        size: size ? parseInt(size as string) : 10,
        body: {
          sort: [{ timestamp: { order: 'desc' } }],
          query: {
            bool: {
              must: must.length ? must : [{ match_all: {} }],
              filter,
            },
          },
        },
      });

      res.json({
        total: result.body.hits.total,
        results: result.body.hits.hits.map((hit: any) => ({
          id: hit._id,
          score: hit._score,
          ...hit._source,
        })),
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.get('/stats/error-rate', async (req, res) => {
    try {
      const { interval } = req.query;

      const result = await esClient.search({
        index: 'logs',
        body: {
          size: 0,
          aggs: {
            logs_over_time: {
              date_histogram: {
                field: 'timestamp',
                fixed_interval: (interval as string) || '1m',
              },
              aggs: {
                by_level: {
                  terms: { field: 'level' },
                },
              },
            },
          },
        },
      });

      res.json({ buckets: result.body.aggregations?.logs_over_time });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.get('/stats/top-errors', async (req, res) => {
    try {
      const result = await esClient.search({
        index: 'logs',
        body: {
          size: 0,
          query: {
            term: { level: 'error' },
          },
          aggs: {
            by_service: {
              terms: { field: 'service', size: 10 },
              aggs: {
                by_message: {
                  terms: { field: 'message.keyword', size: 5 },
                },
              },
            },
          },
        },
      });

      res.json({ buckets: result.body.aggregations?.by_service });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
