import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {LocaleSchema,StaySearchRequestSchema} from '@trip-fit/domain';
import type {createStaySearchConfig} from '../config/stay-search.js';
export function registerStaySearchRoutes(app:FastifyInstance,search:ReturnType<typeof createStaySearchConfig>){
 app.get('/api/stay-search',async(request,reply)=>{reply.header('Cache-Control','no-store');const query=z.strictObject({locale:LocaleSchema.default('en')}).safeParse(request.query);if(!query.success)return reply.code(400).send({error:'invalid-stay-search-query'});return search.options(query.data.locale);});
 app.post('/api/stay-search',{bodyLimit:2048},async(request,reply)=>{reply.header('Cache-Control','no-store');if(!z.strictObject({}).safeParse(request.query).success)return reply.code(400).send({error:'invalid-stay-search-query'});const body=StaySearchRequestSchema.safeParse(request.body);if(!body.success)return reply.code(400).send({error:'invalid-stay-search-criteria'});try{return search.search(body.data.locale,body.data.criteria);}catch{return reply.code(400).send({error:'invalid-stay-search-criteria'});}});
}
