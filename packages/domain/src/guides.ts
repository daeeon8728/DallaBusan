import { z } from 'zod';
import { LocaleSchema, SUPPORTED_LOCALES } from './schemas.js';
import { SafeHttpsSchema } from './offers.js';
export const GuideKindSchema = z.enum(['food', 'recommended']);
export type GuideKind = z.infer<typeof GuideKindSchema>;
export const GuideIdSchema = z.string().regex(/^\d{1,20}$/);
const OptionalText = z.string().max(100000).nullable();
export const GuideRecordSchema = z.strictObject({
  id: GuideIdSchema, locale: LocaleSchema, name: z.string().min(1).max(1000), originalName: z.string().max(1000),
  localizedTitle: z.boolean(), district: OptionalText, category: OptionalText,
  address: OptionalText, menu: OptionalText, hours: OptionalText, holidays: OptionalText,
  fees: OptionalText, transport: OptionalText, phone: OptionalText, homepage: SafeHttpsSchema.nullable(),
  description: z.string().max(100000), imageUrl: SafeHttpsSchema.nullable(),
  coordinates: z.strictObject({ lat: z.number().min(34.8).max(35.5), lng: z.number().min(128.7).max(129.4) }).nullable(),
});
export const GuideSourceSchema = z.strictObject({
  url: SafeHttpsSchema, licenseUrl: SafeHttpsSchema, credit: z.string().min(1), collectedAt: z.iso.datetime(),
});
export const GuideSnapshotSchema = z.strictObject({
  version: z.literal(1), kind: GuideKindSchema, source: GuideSourceSchema,
  languages: z.array(z.strictObject({ locale: LocaleSchema, total: z.number().int().nonnegative(), records: z.array(GuideRecordSchema) })).length(5),
}).superRefine((snapshot, ctx) => {
  const identities = new Map<string, z.infer<typeof GuideRecordSchema>>();
  for (const group of snapshot.languages) for (const row of group.records) {
    const previous = identities.get(row.id);
    if (previous && (previous.originalName.trim() !== row.originalName.trim() ||
      (previous.coordinates && row.coordinates && (Math.abs(previous.coordinates.lat-row.coordinates.lat)>0.00001 || Math.abs(previous.coordinates.lng-row.coordinates.lng)>0.00001))))
      ctx.addIssue({code:'custom',message:'Conflicting source identity across languages'});
    if (!previous) identities.set(row.id,row);
  }

  for (const locale of SUPPORTED_LOCALES) {
    const groups = snapshot.languages.filter(group => group.locale === locale);
    if (groups.length !== 1) { ctx.addIssue({ code: 'custom', message: 'Each language must occur exactly once' }); continue; }
    const group = groups[0];
    if (!group || group.records.length !== group.total || new Set(group.records.map(row => row.id)).size !== group.total || group.records.some(row => row.locale !== locale))
      ctx.addIssue({ code: 'custom', message: 'Incomplete or duplicate language records' });
  }
});
export const GuideQuerySchema = z.strictObject({
  locale: LocaleSchema.default('ko'), q: z.string().trim().max(100).default(''), district: z.string().trim().max(100).default(''),
  category: z.string().trim().max(100).default(''), page: z.coerce.number().int().min(1).max(1000).default(1),
});
export const PublicGuideSchema = GuideRecordSchema.omit({ coordinates: true }).extend({ translationFallback: z.boolean() });
export const GuideListSchema = z.strictObject({
  kind: GuideKindSchema, locale: LocaleSchema, items: z.array(PublicGuideSchema), source: GuideSourceSchema,
  total: z.number().int().nonnegative(), availableTotal: z.number().int().nonnegative(),
  page: z.number().int().positive(), pages: z.number().int().nonnegative(),
  districts: z.array(z.string()), categories: z.array(z.string()),
});
export const GuideDetailSchema = z.strictObject({ kind: GuideKindSchema, requestedLocale: LocaleSchema, item: PublicGuideSchema, source: GuideSourceSchema });
export type GuideRecord = z.infer<typeof GuideRecordSchema>;
export type GuideSnapshot = z.infer<typeof GuideSnapshotSchema>;
export type GuideQuery = z.infer<typeof GuideQuerySchema>;
export type PublicGuide = z.infer<typeof PublicGuideSchema>;
