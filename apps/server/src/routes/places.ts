import type { FastifyInstance } from 'fastify';
import { CatalogQuerySchema, type CatalogService } from '../services/catalog.js';

export function registerCatalogRoutes(app: FastifyInstance, catalog: CatalogService) {
  app.get('/api/catalog/status', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
    try { return catalog.status(); }
    catch { return reply.code(503).send({ error: 'catalog-unavailable' }); }
  });
  app.get('/api/places', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const query = CatalogQuerySchema.safeParse(request.query);
    if (!query.success) return reply.code(400).send({ error: 'invalid-catalog-query' });
    try { return catalog.list(query.data); }
    catch { return reply.code(503).send({ error: 'catalog-unavailable' }); }
  });
}
