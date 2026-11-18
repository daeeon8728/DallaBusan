import { z } from 'zod';
import { LocaleSchema } from './schemas.js';
import { SafeHttpsSchema } from './offers.js';
export const ThemePlaceRefSchema=z.strictObject({service:z.enum(['attraction','food']),sourceId:z.string().regex(/^\d{1,20}$/),locale:LocaleSchema});
export const ThemeDigestSchema=z.string().regex(/^[a-f0-9]{64}$/);
export const ThemePlaceMappingSchema=z.strictObject({
  id:z.string().regex(/^[a-z0-9-]{1,80}$/),place:ThemePlaceRefSchema,expectedFingerprint:ThemeDigestSchema,
  expectedName:z.string().min(1),reviewedAliases:z.array(z.string().min(1)).default([]),reviewedAt:z.iso.date(),reviewMethod:z.literal('assistant-source-evidence'),identityNote:z.string().min(10),
});
export const ThemeMappingFileSchema=z.strictObject({version:z.literal(1),mappings:z.array(ThemePlaceMappingSchema)});
export const ThemeStepSeedSchema=z.strictObject({label:z.string().min(1),mappingId:z.string().nullable(),
  matchKind:z.enum(['exact-name','source-alias','contained-place','unresolved']),identityQuote:z.string().nullable(),unresolvedReason:z.string().nullable()});
export const ThemeFoodSeedSchema=z.strictObject({mappingId:z.string(),relationship:z.enum(['source-mentioned','nearby-coordinate-option']),anchorIndex:z.number().int().nonnegative().nullable(),
  evidenceQuote:z.string().nullable(),note:z.string().min(10)});
export const ThemeSeedSchema=z.strictObject({
  id:z.string().regex(/^[a-z0-9-]{1,80}$/),sourceId:z.string().regex(/^\d{1,20}$/),sourceLocale:LocaleSchema,expectedFingerprint:ThemeDigestSchema,
  scope:z.enum(['full-source','source-declared-subroute']),title:z.string().min(1),themeTags:z.array(z.string().min(1)).min(1),
  mode:z.enum(['source-unspecified','rail-and-walking','walking-source']),reviewedAt:z.iso.date(),reviewMethod:z.literal('assistant-source-evidence'),
  orderEvidence:z.strictObject({kind:z.enum(['declared-sequence','narrative-edge','presentation-only','narrative-unconfirmed']),context:z.string().min(1),excerpt:z.string().min(1).max(4000),delimiter:z.enum(['→','➔','dash','none'])}),
  steps:z.array(ThemeStepSeedSchema).min(2),foodOptions:z.array(ThemeFoodSeedSchema),notes:z.array(z.string().min(1)),
});
export const ThemeTemplateFileSchema=z.strictObject({version:z.literal(1),templates:z.array(ThemeSeedSchema)});
export const ThemePlaceSchema=z.strictObject({key:z.string(),ref:ThemePlaceRefSchema,name:z.string().min(1),originalName:z.string(),address:z.string().nullable(),district:z.string().nullable(),
  coordinates:z.strictObject({lat:z.number().min(34.8).max(35.5),lng:z.number().min(128.7).max(129.4)}).nullable(),
  description:z.string(),title:z.string(),availableLocales:z.array(LocaleSchema).min(1),sourceUrl:SafeHttpsSchema,fetchedAt:z.iso.datetime(),fingerprint:ThemeDigestSchema});
export type ThemePlace=z.infer<typeof ThemePlaceSchema>;
export const ThemeRouteSchema=z.strictObject({
  id:z.string(),sourceId:z.string(),sourceLocale:LocaleSchema,title:z.string(),scope:ThemeSeedSchema.shape.scope,themeTags:z.array(z.string()),mode:ThemeSeedSchema.shape.mode,
  sourceUrl:SafeHttpsSchema,sourceFetchedAt:z.iso.datetime().nullable(),availableLocales:z.array(LocaleSchema),sourceFingerprint:ThemeDigestSchema.nullable(),
  reviewMethod:z.literal('assistant-source-evidence'),reviewedAt:z.iso.date(),humanApproval:z.literal('pending'),fieldValidation:z.literal('not-performed'),recommendationEnabled:z.literal(false),
  orderStatus:z.enum(['source-confirmed','needs-review']),status:z.enum(['source-checked','needs-review']),findings:z.array(z.string()),
  orderEvidence:ThemeSeedSchema.shape.orderEvidence,
  steps:z.array(z.strictObject({position:z.number().int().nonnegative(),label:z.string(),matchKind:ThemeStepSeedSchema.shape.matchKind,place:ThemePlaceSchema.nullable(),findings:z.array(z.string())})),
  sourceCheckedSegments:z.array(z.strictObject({startIndex:z.number().int().nonnegative(),endIndex:z.number().int().nonnegative(),placeKeys:z.array(z.string()).min(2),isCompleteRoute:z.boolean()})),
  foodOptions:z.array(z.strictObject({mappingId:z.string(),relationship:ThemeFoodSeedSchema.shape.relationship,anchorIndex:z.number().int().nonnegative().nullable(),
    status:z.enum(['source-checked','needs-review']),place:ThemePlaceSchema.nullable(),straightLineMeters:z.number().int().nonnegative().nullable(),
    insertedIntoVisitOrder:z.literal(false),evidenceQuote:z.string().nullable(),note:z.string(),findings:z.array(z.string())})),notes:z.array(z.string()),
});
export type ThemeRoute=z.infer<typeof ThemeRouteSchema>;
export const ThemeRouteCatalogSchema=z.strictObject({version:z.literal(1),generatedAt:z.iso.datetime(),inputDigests:z.record(z.string(),ThemeDigestSchema),
  routes:z.array(ThemeRouteSchema),coverage:z.array(z.strictObject({sourceId:z.string(),sourceLocale:LocaleSchema,title:z.string(),availableLocales:z.array(LocaleSchema),templateIds:z.array(z.string()),
    status:z.enum(['source-checked','needs-review','not-curated']),reason:z.string()})),
  summary:z.strictObject({sourceGroups:z.number().int().nonnegative(),sourceLanguageRecords:z.number().int().nonnegative(),templates:z.number().int().nonnegative(),
    sourceConfirmedOrder:z.number().int().nonnegative(),sourceCheckedTemplates:z.number().int().nonnegative(),needsReview:z.number().int().nonnegative(),sourceCheckedSegments:z.number().int().nonnegative(),
    checkedAttractionSteps:z.number().int().nonnegative(),checkedFoodSteps:z.number().int().nonnegative(),checkedFoodOptions:z.number().int().nonnegative(),nearbyFoodOptions:z.number().int().nonnegative(),sourceMentionedFoodOptions:z.number().int().nonnegative(),
    notCuratedSources:z.number().int().nonnegative(),unresolvedSteps:z.number().int().nonnegative(),humanApproved:z.literal(0)})});
export type ThemeSeed=z.infer<typeof ThemeSeedSchema>;
export type ThemeMappingFile=z.infer<typeof ThemeMappingFileSchema>;
export type ThemeTemplateFile=z.infer<typeof ThemeTemplateFileSchema>;
export type ThemeRouteCatalog=z.infer<typeof ThemeRouteCatalogSchema>;
