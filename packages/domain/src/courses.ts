import { z } from 'zod';
import { LocaleSchema } from './schemas.js';
export const CourseCategorySchema = z.enum(['family', 'date', 'food', 'dallabusan']);
export const CoursePointSchema = z.object({lat:z.number().min(34).max(36),lng:z.number().min(128).max(130)});
export const CourseModeSchema = z.enum(['walking','driving']);
export const CourseRouteSchema = z.object({
  status:z.enum(['road-route','reference']), mode:CourseModeSchema,
  distanceMeters:z.number().nonnegative().nullable(), durationSeconds:z.number().nonnegative().nullable(),
  collectedAt:z.string().datetime().nullable(), sourceUrl:z.string().url(),
  geometry:z.array(CoursePointSchema),
  legs:z.array(z.object({distanceMeters:z.number().nonnegative(),durationSeconds:z.number().nonnegative()})),
});
export const CourseStepSchema = z.object({
  kind:z.enum(['destination','food','note']), id:z.string().nullable(),name:z.string(),originalName:z.string().nullable(),
  contentTranslation:z.enum(['source','machine','editorial']),href:z.string().startsWith('/').nullable(),address:z.string().nullable(),
  image:z.object({url:z.string(),credit:z.string()}).nullable(),sourceUrl:z.string().url().nullable(),locale:LocaleSchema,
  coordinates:CoursePointSchema.nullable(),stayMinutes:z.number().int().min(10).max(360),
  sourceCollectedAt:z.string().datetime().nullable(),description:z.string().nullable(),menu:z.string().nullable(),hours:z.string().nullable(),holidays:z.string().nullable(),
});
export const CourseSchema = z.object({id:z.string(),category:CourseCategorySchema,title:z.string(),locale:LocaleSchema,
  status:z.literal('editorial-idea'),routeCheck:z.literal('pending'),fieldValidation:z.literal('not-performed'),
  intro:z.string(),tips:z.string(),steps:z.array(CourseStepSchema).min(1),route:CourseRouteSchema,
  image:z.object({url:z.string(),credit:z.string()}).nullable(),reviewedOn:z.string(),
});
// List/popup requests never carry forty detailed descriptions and road geometries.
export const CourseSummarySchema = CourseSchema.omit({route:true,steps:true}).extend({
  steps:z.array(CourseStepSchema.omit({sourceCollectedAt:true,description:true,menu:true,hours:true,holidays:true})),
  route:CourseRouteSchema.omit({geometry:true,legs:true}),
});
export const CoursesResponseSchema = z.object({locale:LocaleSchema,items:z.array(CourseSummarySchema),total:z.number().int().nonnegative(),counts:z.object({family:z.number(),date:z.number(),food:z.number(),dallabusan:z.number()})});
export const CourseDetailSchema=z.object({locale:LocaleSchema,course:CourseSchema});
export type CourseCategory=z.infer<typeof CourseCategorySchema>;
export type Course=z.infer<typeof CourseSchema>;
export type CourseRoute=z.infer<typeof CourseRouteSchema>;
export type CoursePoint=z.infer<typeof CoursePointSchema>;
