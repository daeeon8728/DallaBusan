import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { LocaleSchema, CourseCategorySchema, CoursePersonaSchema } from '@trip-fit/domain';
import type { CourseService } from '../services/courses.js';
const Query = z.object({ locale: LocaleSchema.default('en'), category: CourseCategorySchema.optional(),persona:CoursePersonaSchema.optional() });
export function registerCourseRoutes(app: FastifyInstance, service: CourseService) {
    app.get('/api/courses/:id/offers',async(request,reply)=>{
      reply.header('Cache-Control','no-store');
      const params=z.strictObject({id:z.string().regex(/^(?:(fa|da|fo|cu|fr)[0-9]{2}|edit-[0-9]{3}|managed-[a-f0-9-]{36})$/)}).safeParse(request.params);
      const query=z.strictObject({locale:LocaleSchema.default('en')}).safeParse(request.query);
      if(!params.success||!query.success)return reply.code(400).send({error:'Invalid query'});
      return service.offers(params.data.id,query.data.locale)??reply.code(404).send({error:'Not Found'});
    });
    app.get('/api/courses', async (request, reply) => { const query = Query.safeParse(request.query); if (!query.success)
        return reply.code(400).send({ error: 'Invalid query' }); return service.list(query.data.locale, query.data.category,query.data.persona); });
    app.get('/api/courses/:id', async (request, reply) => { reply.header('Cache-Control','no-store'); const params = z.object({ id: z.string().regex(/^(?:(fa|da|fo|cu|fr)[0-9]{2}|edit-[0-9]{3}|managed-[a-f0-9-]{36})$/) }).safeParse(request.params), query = Query.safeParse(request.query); if (!params.success || !query.success)
        return reply.code(400).send({ error: 'Invalid query' }); const course = service.get(params.data.id, query.data.locale); return course ? { locale: query.data.locale, course } : reply.code(404).send({ error: 'Not Found' }); });
}
