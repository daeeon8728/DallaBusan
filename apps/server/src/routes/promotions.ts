import type { FastifyInstance } from 'fastify';
import { PromotionQuerySchema } from '@trip-fit/domain';
import type { PromotionService } from '../services/promotions.js';
export function registerPromotionRoutes(app:FastifyInstance,promotions:PromotionService){
  app.get('/api/promotions',async(request,reply)=>{reply.header('Cache-Control','no-store');const query=PromotionQuerySchema.safeParse(request.query);if(!query.success)return reply.code(400).send({error:'invalid-promotion-query'});return promotions.list(query.data.locale);});
}
