import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ExchangeService } from '../services/exchange.js';
export function registerExchangeRoutes(app: FastifyInstance, service?: ExchangeService) {
  app.get('/api/exchange-rates', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (!z.strictObject({}).safeParse(request.query).success) return reply.code(400).send({ error: 'invalid-exchange-query' });
    const rates = await service?.get();
    return rates ?? reply.code(503).send({ error: 'exchange-unavailable' });
  });
}
