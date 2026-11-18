import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { DestinationSlugSchema, LocaleSchema, SafeHttpsSchema } from '@trip-fit/domain';

const TextSchema = z.strictObject({ name: z.string().min(1), description: z.string().min(1),
  holidayInfo: z.string().nullable(), descriptionBody: z.string().default(''),
  hours: z.string().nullable().default(null), fees: z.string().nullable().default(null), transport: z.string().nullable().default(null), contact: z.string().nullable().default(null), homepage: SafeHttpsSchema.nullable().default(null), district: z.string().nullable().default(null), fallback: z.boolean().default(false), sourceId: z.string().regex(/^\d+$/), sourceRetrievedAt: z.iso.datetime() });
export const DestinationConfigSchema = z.strictObject({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  featuredSlugs: z.array(DestinationSlugSchema),
  destinations: z.array(z.strictObject({
    slug: DestinationSlugSchema, reviewedOn: z.iso.date().nullable(), address: z.string().min(1).nullable(), addressLocale: LocaleSchema.default('ko'), aliases: z.array(z.string().min(1)).default([]),
    addressSourceUrl: SafeHttpsSchema, sourceUrl: SafeHttpsSchema,
    image: z.strictObject({ url: z.string().refine(value => /^\/review-assets\/[a-z-]+\.jpg$/.test(value) || SafeHttpsSchema.safeParse(value).success), credit: z.string().min(1), sourceUrl: SafeHttpsSchema.nullable().default(null), licenseUrl: SafeHttpsSchema.nullable().default(null) }).nullable(),
    translations: z.array(z.strictObject({ locale: LocaleSchema, ...TextSchema.shape })).min(1),
    related: z.array(z.strictObject({
      offerId: z.string().min(1), relationship: z.enum(['tour', 'ticket', 'experience', 'stay']),
      areaLabel: z.string().nullable(), evidenceUrl: SafeHttpsSchema, reviewedOn: z.iso.date(),
    })),
  })),
});
export type DestinationConfig = z.infer<typeof DestinationConfigSchema>;
export function loadDestinationConfig(): DestinationConfig {
  try {
    const input: unknown = JSON.parse(readFileSync(new URL('../../../../config/catalog/destinations.json', import.meta.url), 'utf8'));
    return DestinationConfigSchema.parse(input);
  } catch { throw new Error('Invalid destination configuration'); }
}

export const DestinationCurationSchema = z.strictObject({
  reviewedOn: z.iso.date(), identityPolicy: z.string().min(1),
  entries: z.array(z.strictObject({ sourceId: z.string().regex(/^\d+$/), aliases: z.array(z.string().min(1)),
    related: DestinationConfigSchema.shape.destinations.element.shape.related,
  })),
});
