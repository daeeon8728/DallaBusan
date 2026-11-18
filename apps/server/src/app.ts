import type { GuideService } from './services/guides.js';
import { registerGuideRoutes } from './routes/guides.js';
import Fastify, { LogController } from 'fastify';
import fastifyStatic from '@fastify/static';
import { extname } from 'node:path';
import type { HealthResponse } from '@trip-fit/domain';
import type { ServerConfig } from './config/env.js';
import type { CatalogService } from './services/catalog.js';
import { registerCatalogRoutes } from './routes/places.js';
import type { OfferService } from './services/offers.js';
import { registerOfferRoutes } from './routes/offers.js';
import type { DestinationService } from './services/destinations.js';
import { registerDestinationRoutes } from './routes/destinations.js';

export function buildApp(config: ServerConfig, webRoot?: string, catalog?: CatalogService, offers?: OfferService, destinations?: DestinationService, guides?: GuideService) {
  const app = Fastify({
    logger: config.NODE_ENV !== 'test',
    logController: new LogController({ disableRequestLogging: true }),
  });

  app.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
  });

  app.get('/api/health', async (): Promise<HealthResponse> => ({
    status: 'ok', service: 'trip-fit-api', stage: 1,
  }));

  if (catalog) registerCatalogRoutes(app, catalog);
  if (offers) registerOfferRoutes(app, offers, destinations);
  if (destinations) registerDestinationRoutes(app, destinations);
  if (guides) registerGuideRoutes(app, guides);

  if (webRoot !== undefined) {
    app.register(fastifyStatic, { root: webRoot });
    app.setNotFoundHandler((request, reply) => {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      const isApi = pathname === '/api' || pathname.startsWith('/api/');
      if (request.method === 'GET' && !isApi && !extname(pathname)
        && request.headers.accept?.includes('text/html')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not Found' });
    });
  }
  return app;
}
