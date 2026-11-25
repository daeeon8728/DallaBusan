import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { FoodAssistanceQuerySchema, GuideIdSchema } from '@trip-fit/domain';
import type { FoodAssistanceService } from '../services/food-assistance.js';
export function registerFoodAssistanceRoutes(app:FastifyInstance,service:FoodAssistanceService) {
  app.get('/api/food-assistance/:id',async(request,reply)=>{
    reply.header('Cache-Control','no-store');
    const params=z.strictObject({id:GuideIdSchema}).safeParse(request.params);
    const query=FoodAssistanceQuerySchema.safeParse(request.query);
    if(!params.success||!query.success)return reply.code(400).send({error:'invalid-food-assistance-query'});
    return service.get(params.data.id,query.data.locale,query.data.course)??reply.code(404).send({error:'food-not-found'});
  });
}
