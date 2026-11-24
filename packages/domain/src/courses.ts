import { z } from 'zod';
import { LocaleSchema } from './schemas.js';
export const CourseCategorySchema = z.enum(['family', 'date', 'food', 'dallabusan']);
export const CourseStepSchema = z.object({ kind: z.enum(['destination', 'food', 'note']), id: z.string().nullable(), name: z.string(), originalName: z.string().nullable(), contentTranslation: z.enum(['source', 'machine', 'editorial']), href: z.string().startsWith('/').nullable(), address: z.string().nullable(), image: z.object({ url: z.string(), credit: z.string() }).nullable(), sourceUrl: z.string().url().nullable(), locale: LocaleSchema });
export const CourseSchema = z.object({ id: z.string(), category: CourseCategorySchema, title: z.string(), locale: LocaleSchema, status: z.literal('editorial-idea'), routeCheck: z.literal('pending'), fieldValidation: z.literal('not-performed'), steps: z.array(CourseStepSchema).min(1), image: z.object({ url: z.string(), credit: z.string() }).nullable(), reviewedOn: z.string() });
export const CoursesResponseSchema = z.object({ locale: LocaleSchema, items: z.array(CourseSchema), total: z.number().int().nonnegative(), counts: z.object({ family: z.number(), date: z.number(), food: z.number(), dallabusan: z.number() }) });
export const CourseDetailSchema = z.object({ locale: LocaleSchema, course: CourseSchema });
export type CourseCategory = z.infer<typeof CourseCategorySchema>;
export type Course = z.infer<typeof CourseSchema>;
