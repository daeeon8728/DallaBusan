import type {FastifyInstance} from 'fastify';import {z} from 'zod';import {LocaleSchema} from '@trip-fit/domain';import type {createStayMapConfig} from '../config/stay-map.js';
export function registerStayMapRoutes(app:FastifyInstance,map:ReturnType<typeof createStayMapConfig>){
 app.get('/api/stay-map',async(request,reply)=>{
  reply.header('Cache-Control','no-store');const query=z.strictObject({locale:LocaleSchema.default('en'),mobile:z.enum(['0','1']).default('0')}).safeParse(request.query);
  if(!query.success)return reply.code(400).send({error:'invalid-map-query'});
  return map.get(query.data.locale,query.data.mobile==='1')??reply.code(404).send({error:'map-unavailable'});
 });
}
