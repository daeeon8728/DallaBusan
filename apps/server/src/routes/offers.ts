import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OfferQuerySchema, LocaleSchema } from '@trip-fit/domain';
import type { OfferService } from '../services/offers.js';
import type { DestinationService } from '../services/destinations.js';

export function registerOfferRoutes(app: FastifyInstance, offers: OfferService, destinations?: DestinationService) {
  app.get('/api/offers', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const query = OfferQuerySchema.safeParse(request.query);
    if (!query.success) return reply.code(400).send({ error: 'invalid-offer-query' });
    return offers.list(query.data, destinations?.relatedOfferIdsForSearch(query.data.q));
  });
  app.get('/api/offers/:id/related',async(request,reply)=>{
    reply.header('Cache-Control','no-store');
    const params=z.strictObject({id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/)}).safeParse(request.params);
    const query=z.strictObject({locale:LocaleSchema.default('en')}).safeParse(request.query);
    if(!params.success||!query.success)return reply.code(400).send({error:'invalid-offer-query'});
    const result=offers.related(params.data.id,query.data.locale,destinations?.relatedPlacesForOffer(params.data.id,query.data.locale));
    return result??reply.code(404).send({error:'offer-unavailable'});
  });
  app.get('/api/offers/:id', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const params = z.strictObject({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/) }).safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'invalid-offer-id' });
    const query=z.strictObject({locale:LocaleSchema.default('ko')}).safeParse(request.query);
    if(!query.success)return reply.code(400).send({error:'invalid-offer-query'});
    const offer = offers.get(params.data.id,query.data.locale);
    return offer ?? reply.code(404).send({ error: 'offer-unavailable' });
  });
}
