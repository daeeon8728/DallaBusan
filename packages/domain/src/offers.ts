import { z } from 'zod';
import { LocaleSchema, CurrencySchema } from './schemas.js';
import { ProviderIdSchema } from './catalog.js';

export const OfferCategorySchema = z.enum(['ticket', 'tour', 'yacht', 'package', 'activity', 'spa', 'snap', 'transport', 'stay', 'food']);
export const OfferScopeSchema = z.enum(['busan', 'from-busan', 'to-busan', 'regional']);
export const SafeHttpsSchema = z.url().refine(value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port;
  } catch { return false; }
}, 'Expected credential-free HTTPS');
export const OfferQuerySchema = z.strictObject({
  locale: LocaleSchema.default('ko'), q: z.string().trim().max(100).default(''),
  category: OfferCategorySchema.optional(), provider: ProviderIdSchema.optional(),
  scope: OfferScopeSchema.optional(), page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24),
  view: z.enum(['catalog','home']).default('catalog'),
});
export const PublicProviderSchema = z.strictObject({ id: ProviderIdSchema, displayName: z.string().min(1) });
export const PublicOfferSchema = z.strictObject({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), externalId: z.string().min(1),
  title: z.string().min(1).max(500), titleLocale: LocaleSchema,
  originalTitle: z.string().min(1).max(500), originalTitleLocale: LocaleSchema, localizationStatus: z.enum(['original','translated','fallback']),
  category: OfferCategorySchema, scope: OfferScopeSchema,
  provider: PublicProviderSchema, href: SafeHttpsSchema,
  referencePrice: z.strictObject({
    amount: z.string().max(24).regex(/^(0|[1-9]\d*)(\.\d+)?$/), currency: CurrencySchema, observedOn: z.iso.date(),
  }).nullable(),
  image: z.strictObject({
    url: z.string().min(1), kind: z.enum(['product', 'destination', 'illustration']), credit: z.string().min(1),
    sourceUrl: SafeHttpsSchema.nullable().default(null), licenseUrl: SafeHttpsSchema.nullable().default(null),
  }),
  checkedOn: z.iso.date(), expiresOn: z.iso.date().nullable(),
  linkEvidence: z.enum(['official-export', 'portal-generated', 'approved-template']),
  bookingNotice: z.literal('korean-site-international-cards').nullable().default(null),
  bookingLocale:LocaleSchema.nullable().default(null),
});
export const OfferDirectorySchema = z.strictObject({
  id: z.string().min(1), provider: PublicProviderSchema, href: SafeHttpsSchema,
  category: OfferCategorySchema.nullable(),
});
export const OffersResponseSchema = z.strictObject({
  items: z.array(PublicOfferSchema), total: z.number().int().nonnegative(),
  page: z.number().int().positive(), pages: z.number().int().nonnegative(),
  catalogTotal: z.number().int().nonnegative(), providers: z.array(PublicProviderSchema),
  categories: z.array(z.strictObject({ id: OfferCategorySchema, count: z.number().int().nonnegative() })),
  directories: z.array(OfferDirectorySchema),
  checkedOn: z.iso.date(), contactEmail: z.email(),
});
export type PublicOffer = z.infer<typeof PublicOfferSchema>;
export type OfferQuery = z.infer<typeof OfferQuerySchema>;
export type OffersResponse = z.infer<typeof OffersResponseSchema>;
export type OfferCategory = z.infer<typeof OfferCategorySchema>;
