import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { LocaleSchema, CourseCategorySchema } from '@trip-fit/domain';
import type { CourseService } from '../services/courses.js';
const Query = z.object({ locale: LocaleSchema.default('en'), category: CourseCategorySchema.optional() });
export function registerCourseRoutes(app: FastifyInstance, service: CourseService) {
    app.get('/api/courses', async (request, reply) => { const query = Query.safeParse(request.query); if (!query.success)
        return reply.code(400).send({ error: 'Invalid query' }); return service.list(query.data.locale, query.data.category); });
    app.get('/api/courses/:id', async (request, reply) => { const params = z.object({ id: z.string().regex(/^(fa|da|fo|cu)[0-9]{2}$/) }).safeParse(request.params), query = Query.safeParse(request.query); if (!params.success || !query.success)
        return reply.code(400).send({ error: 'Invalid query' }); const course = service.get(params.data.id, query.data.locale); return course ? { locale: query.data.locale, course } : reply.code(404).send({ error: 'Not Found' }); });
}
