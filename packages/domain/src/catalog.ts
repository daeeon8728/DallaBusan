import { z } from 'zod';
import { LocaleSchema, CurrencySchema } from './schemas.js';

const HttpUrl = z.url().refine(value => /^https?:\/\//.test(value), 'Expected an HTTP(S) URL');
const Id = z.string().trim().min(1).max(160);
export const ProviderIdSchema = z.string().regex(/^PROVIDER_[A-Z0-9_]+$/);
export const ProvenanceSchema = z.strictObject({
  source: z.enum(['local', 'public-api', 'test-fixture']),
  sourceUrl: HttpUrl.nullable(),
  retrievedAt: z.iso.datetime(),
  reviewedAt: z.iso.datetime().nullable(),
  status: z.enum(['unverified', 'verified', 'test']),
}).refine(value => value.status !== 'verified' || value.reviewedAt !== null, 'Verified data requires a review timestamp');
export const PriceSchema = z.strictObject({
  amount: z.string().regex(/^(0|[1-9]\d*)(\.\d+)?$/),
  currency: CurrencySchema,
  unit: z.enum(['person', 'party', 'room-night', 'stay-total']),
  includesTaxes: z.boolean().nullable(),
});
export const PlaceSchema = z.strictObject({
  id: Id,
  category: z.enum(['attraction', 'food', 'stay', 'experience']),
  regionId: Id,
  coordinates: z.strictObject({
    lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180),
  }).nullable(),
  durationMinutes: z.number().int().positive().nullable(),
  provenance: ProvenanceSchema,
  fieldSources: z.record(z.string(), ProvenanceSchema),
});
export const TranslationSchema = z.strictObject({
  placeId: Id, locale: LocaleSchema, title: z.string().trim().min(1),
  description: z.string(), holidayInfoRaw: z.string().nullable(),
  image: z.strictObject({ url: HttpUrl, sourceUrl: HttpUrl, license: z.string().min(1), author: z.string().min(1) }).nullable(),
  provenance: ProvenanceSchema,
  fieldSources: z.record(z.string(), ProvenanceSchema).default({}),
});
export const ProductSchema = z.strictObject({
  id: Id, placeId: Id, providerId: ProviderIdSchema,
  externalProductId: Id,
  price: PriceSchema.nullable(),
  provenance: ProvenanceSchema,
});
export const ProviderSchema = z.object({
  providerId: ProviderIdSchema, displayName: z.string().trim().min(1),
  enabled: z.boolean(), approvalStatus: z.enum(['pending', 'approved', 'rejected']),
}).refine(value => !value.enabled || value.approvalStatus === 'approved', 'Enabled provider must be approved');
export type Place = z.infer<typeof PlaceSchema>;
export type PlaceTranslation = z.infer<typeof TranslationSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type CatalogProvider = z.infer<typeof ProviderSchema>;
export interface CatalogRepository {
  putProvider(value: CatalogProvider): void;
  putPlace(value: Place): void;
  putTranslation(value: z.input<typeof TranslationSchema>): void;
  putProduct(value: Product): void;
  getPlace(id: string): Place | null;
  getTranslation(placeId: string, locale: z.infer<typeof LocaleSchema>): PlaceTranslation | null;
  listProducts(placeId: string): Product[];
}
