import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { DestinationQuerySchema, DestinationSlugSchema, LocaleSchema } from '@trip-fit/domain';
import type { DestinationService } from '../services/destinations.js';

export function registerDestinationRoutes(app: FastifyInstance, destinations: DestinationService) {
  app.get('/api/destinations', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const query = DestinationQuerySchema.safeParse(request.query);
    if (!query.success) return reply.code(400).send({ error: 'invalid-destination-query' });
    return destinations.list(query.data.locale, query.data);
  });
  app.get('/api/destinations/:slug', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const query = z.strictObject({ locale: LocaleSchema.default('ko') }).safeParse(request.query);
    const params = z.strictObject({ slug: DestinationSlugSchema }).safeParse(request.params);
    if (!query.success || !params.success) return reply.code(400).send({ error: 'invalid-destination-query' });
    return destinations.get(params.data.slug, query.data.locale)
      ?? reply.code(404).send({ error: 'destination-unavailable' });
  });
}
