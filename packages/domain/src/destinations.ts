import { z } from 'zod';
import { LocaleSchema } from './schemas.js';
import { PublicOfferSchema, SafeHttpsSchema } from './offers.js';

export const DestinationSlugSchema = z.string().regex(/^[a-z][a-z0-9-]{1,59}$/);
export const DestinationQuerySchema = z.strictObject({
  locale: LocaleSchema.default('ko'), q: z.string().trim().max(100).default(''),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  linked: z.enum(['all', 'linked']).default('all'),
});
export const DestinationSchema = z.strictObject({
  slug: DestinationSlugSchema, name: z.string().min(1), description: z.string().min(1),
  locale: LocaleSchema, requestedLocale: LocaleSchema, translationFallback: z.boolean(),
  address: z.string().min(1).nullable(), addressLocale: LocaleSchema.default('ko'), district: z.string().nullable(), holidayInfo: z.string().nullable(),
  sourceUrl: SafeHttpsSchema, addressSourceUrl: SafeHttpsSchema,
  sourceRetrievedAt: z.iso.datetime(), reviewedOn: z.iso.date().nullable(),
  reviewStatus: z.enum(['curated', 'source']), relatedOfferCount: z.number().int().nonnegative(),
  image: z.strictObject({ url: z.string().refine(value => /^\/review-assets\/[a-z-]+\.jpg$/.test(value) || SafeHttpsSchema.safeParse(value).success), credit: z.string().min(1), sourceUrl: SafeHttpsSchema.nullable().default(null), licenseUrl: SafeHttpsSchema.nullable().default(null) }).nullable(),
});
export const DestinationListSchema = z.strictObject({
  month: z.string().regex(/^\d{4}-\d{2}$/), featured: z.array(DestinationSchema), items: z.array(DestinationSchema),
  total: z.number().int().nonnegative(), catalogTotal: z.number().int().nonnegative(),
  linkedTotal: z.number().int().nonnegative(), page: z.number().int().positive(), pages: z.number().int().nonnegative(),
});
export const RelatedOfferSchema = z.strictObject({
  relationship: z.enum(['tour', 'ticket', 'experience', 'stay']),
  areaLabel: z.string().nullable(), offer: PublicOfferSchema,
});
export const DestinationDetailSchema = z.strictObject({
  destination: DestinationSchema, related: z.array(RelatedOfferSchema),
  content: z.string(), visitInfo: z.strictObject({ hours: z.string().nullable(), fees: z.string().nullable(), transport: z.string().nullable(), contact: z.string().nullable(), homepage: SafeHttpsSchema.nullable() }),
});
export type Destination = z.infer<typeof DestinationSchema>;
export type DestinationList = z.infer<typeof DestinationListSchema>;
export type DestinationDetail = z.infer<typeof DestinationDetailSchema>;
export type DestinationQuery = z.infer<typeof DestinationQuerySchema>;
