import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { GuideIdSchema, GuideKindSchema, GuideQuerySchema, LocaleSchema } from '@trip-fit/domain';
import type { GuideService } from '../services/guides.js';
export function registerGuideRoutes(app: FastifyInstance, guides: GuideService) {
  app.get('/api/guides/:kind',async(request,reply)=>{
    reply.header('Cache-Control','no-store');
    const params=z.strictObject({kind:GuideKindSchema}).safeParse(request.params);
    const query=GuideQuerySchema.safeParse(request.query);
    if(!params.success || !query.success)return reply.code(400).send({error:'invalid-guide-query'});
    const value=guides.list(params.data.kind,query.data);
    return value ?? reply.code(503).send({error:'guide-unavailable'});
  });
  app.get('/api/guides/:kind/:id',async(request,reply)=>{
    reply.header('Cache-Control','no-store');
    const params=z.strictObject({kind:GuideKindSchema,id:GuideIdSchema}).safeParse(request.params);
    const query=z.strictObject({locale:LocaleSchema.default('ko')}).safeParse(request.query);
    if(!params.success || !query.success)return reply.code(400).send({error:'invalid-guide-query'});
    if(!guides.available(params.data.kind))return reply.code(503).send({error:'guide-unavailable'});
    return guides.get(params.data.kind,params.data.id,query.data.locale) ?? reply.code(404).send({error:'guide-not-found'});
  });
}
