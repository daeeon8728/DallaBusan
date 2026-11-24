import {OfferRecommendationGroupsSchema,loadOfferRecommendationGroups} from './offer-recommendations.js';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { ProviderIdSchema, SafeHttpsSchema, OfferCategorySchema, OfferScopeSchema, LocaleSchema, CurrencySchema } from '@trip-fit/domain';

const BookingEvidenceSchema=z.strictObject({url:SafeHttpsSchema,excerpt:z.string().min(1).max(4000)});
const BookingEligibilitySchema=z.strictObject({providerId:ProviderIdSchema,externalId:z.string().min(1),checkedOn:z.iso.date(),expiresOn:z.iso.date(),koreanGuide:z.literal(true),foreignParticipantsAllowed:z.literal(true),interpreterAvailable:z.literal(true),internationalCardsAccepted:z.literal(true),evidence:z.strictObject({koreanGuide:BookingEvidenceSchema,foreignParticipants:BookingEvidenceSchema,interpreter:BookingEvidenceSchema,internationalCards:BookingEvidenceSchema})});
export const OfferProviderConfigSchema = z.strictObject({
  id: ProviderIdSchema, displayName: z.string().min(1), localizedDisplayNames: z.partialRecord(LocaleSchema,z.string().min(1)).default({}), enabled: z.boolean(),
  displayPriority:z.number().int().nonnegative().default(100),
  bookingPolicy:z.enum(['open','verified-korean-guided-only']).default('open'),
  externalIdPathPattern:z.string().min(1).max(400).nullable().default(null),
  approvalStatus: z.enum(['approved', 'pending', 'rejected']),
  websiteApproval: z.enum(['unverified', 'approved']),
  allowedHosts: z.array(z.string().min(1)).min(1),
  sourceHosts: z.array(z.string().min(1)).min(1),
  pathPrefixes: z.array(z.string().startsWith('/')).min(1),
  requiredQuery: z.record(z.string(), z.string()),
  destinationQuery: z.string().nullable(), destinationHosts: z.array(z.string()),
});
export const RawOfferSchema = z.strictObject({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), enabled: z.boolean().default(true), externalId: z.string().min(1),
  providerId: ProviderIdSchema, title: z.string().min(1).max(500), titleLocale: LocaleSchema, localizedTitles: z.partialRecord(LocaleSchema,z.string().min(1).max(500)).default({}),
  category: OfferCategorySchema, scope: OfferScopeSchema, href: SafeHttpsSchema, sourceUrl: SafeHttpsSchema,
  localizedHrefs:z.partialRecord(LocaleSchema,SafeHttpsSchema).default({}),
  bookingLocale:LocaleSchema.nullable().default(null),
  localizedTitleSourceHash:z.string().regex(/^[a-f0-9]{64}$/).nullable().default(null),
  price: z.strictObject({ amount: z.string().max(24).regex(/^(0|[1-9]\d*)(\.\d+)?$/), currency: CurrencySchema }).nullable(),
  image: z.strictObject({ url: z.string().min(1), kind: z.enum(['product', 'destination', 'illustration']), credit: z.string().min(1), sourceUrl: SafeHttpsSchema.nullable().default(null), licenseUrl: SafeHttpsSchema.nullable().default(null) }),
  checkedOn: z.iso.date(), expiresOn: z.iso.date().nullable(),
  linkEvidence: z.enum(['official-export', 'portal-generated', 'approved-template']),
  priority: z.number().int().nonnegative(),
  bookingEligibility:BookingEligibilitySchema.nullable().default(null),
}).superRefine((offer,ctx)=>{if(offer.localizedTitleSourceHash&&offer.localizedTitleSourceHash!==createHash('sha256').update(offer.titleLocale+'\0'+offer.title).digest('hex'))ctx.addIssue({code:'custom',message:'Localized title source changed; review required'});});
export const OfferCatalogConfigSchema = z.strictObject({
  checkedOn: z.iso.date(), contactEmail: z.email(),
  recommendationGroups:OfferRecommendationGroupsSchema.default([]),
  providers: z.array(OfferProviderConfigSchema),
  offers: z.array(RawOfferSchema),
  featuredGroups:z.array(z.strictObject({id:z.string().min(1),kind:z.enum(['property','verified-product']),reviewedOn:z.iso.date(),basis:z.string().min(1),members:z.array(z.strictObject({offerId:z.string(),providerId:ProviderIdSchema,externalId:z.string(),sourceTitle:z.string(),sourceUrl:SafeHttpsSchema})).min(2)})).default([]),
  directories: z.array(z.strictObject({
    id: z.string(), providerId: ProviderIdSchema, href: SafeHttpsSchema, category: OfferCategorySchema.nullable(),
  })),
});
const ProductImageSourcesSchema = z.object({ items: z.array(z.strictObject({
  offerId: z.string().min(1), providerId: ProviderIdSchema, externalId: z.string().min(1),
  title: z.string(), sourceUrl: SafeHttpsSchema, imageUrl: SafeHttpsSchema,
  evidence: z.enum(['existing-affiliate-capture','product-page-primary-image','product-page-gallery','official-export','official-image-link-tool','official-product-card']),
  observedOn: z.iso.date(),
})) });
export function validateProductImageSources(config: OfferCatalogConfig, input: unknown) {
  const sources = ProductImageSourcesSchema.parse(input);
  const byId = new Map(sources.items.map(item => [item.offerId,item]));
  if (byId.size !== sources.items.length) throw new Error('Duplicate product image identity');
  for (const offer of config.offers.filter(item => item.enabled)) {
    const source = byId.get(offer.id);
    if (!source || source.providerId !== offer.providerId || source.externalId !== offer.externalId
      || source.sourceUrl !== offer.sourceUrl || source.imageUrl !== offer.image.url
      || offer.image.kind !== 'product' || offer.image.sourceUrl !== offer.href)
      throw new Error('Product image does not match its approved product source');
  }
}
export type OfferCatalogConfig = z.infer<typeof OfferCatalogConfigSchema>;
export type OfferProviderConfig = z.infer<typeof OfferProviderConfigSchema>;
export function loadOfferCatalogConfig(): OfferCatalogConfig {
  const filename = fileURLToPath(new URL('../../../../config/catalog/offers.json', import.meta.url));
  let input: unknown;
  try {
    input = JSON.parse(readFileSync(filename, 'utf8'));
    const config = OfferCatalogConfigSchema.parse(input);
    const photoSources: unknown = JSON.parse(readFileSync(new URL('../../../../config/catalog/product-image-sources.json', import.meta.url),'utf8'));
    validateProductImageSources(config,photoSources);
    const rawTranslations: unknown = JSON.parse(readFileSync(new URL('../../../../config/catalog/offer-translations.json', import.meta.url),'utf8'));
    const translations = z.strictObject({authoredOn:z.iso.date(),kind:z.literal('editorial-title-translations'),items:z.array(z.strictObject({id:z.string(),sourceTitle:z.string(),titles:z.strictObject({en:z.string().min(1).max(500),ja:z.string().min(1).max(500),'zh-CN':z.string().min(1).max(500),'zh-TW':z.string().min(1).max(500)})}))}).parse(rawTranslations);
    if(new Set(translations.items.map(item=>item.id)).size!==translations.items.length)throw new Error('Duplicate translation identity');
    const byId = new Map(translations.items.map(item=>[item.id,item]));
    return OfferCatalogConfigSchema.parse({...config,recommendationGroups:loadOfferRecommendationGroups(),offers:config.offers.map(offer=>{const text=byId.get(offer.id);return text?.sourceTitle===offer.title?{...offer,localizedTitles:{...offer.localizedTitles,...text.titles}}:offer;})});
  }
  catch { throw new Error('Invalid affiliate offer configuration'); }
}
