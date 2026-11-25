import { z } from 'zod';
import { GuideIdSchema, GuideSourceSchema, PublicGuideSchema } from './guides.js';
import { LocaleSchema } from './schemas.js';
import { SafeHttpsSchema } from './offers.js';

export const FoodAssistanceQuerySchema = z.strictObject({
  locale: LocaleSchema.default('en'),
  course: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
});
const DishSchema = z.strictObject({ id: z.string(), korean: z.string().min(1), label: z.string().min(1) });
export const FoodAssistanceSchema = z.strictObject({
  id: GuideIdSchema, locale: LocaleSchema, reviewedOn: z.iso.date(),
  source: GuideSourceSchema,
  localCard: z.strictObject({
    name: z.string(), address: z.string().nullable(), menu: z.string().nullable(),
    phone: z.string().nullable(), mapUrl: SafeHttpsSchema.nullable(),
    dishes: z.array(DishSchema),
  }).nullable(),
  group: z.string().nullable(),
  alternatives: z.array(z.strictObject({
    item: PublicGuideSchema, straightLineMeters: z.number().int().nonnegative(),
    nextStraightLineMeters: z.number().int().nonnegative().nullable(),
  })).max(3),
  context: z.strictObject({
    id: z.string(), title: z.string(), nextName: z.string().nullable(),
  }).nullable(),
});
export type FoodAssistance = z.infer<typeof FoodAssistanceSchema>;
