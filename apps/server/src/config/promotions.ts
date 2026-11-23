import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { LocaleSchema, ProviderIdSchema, OfferCategorySchema, SafeHttpsSchema } from '@trip-fit/domain';
const Text=z.strictObject({title:z.string().min(1).max(150),benefit:z.string().min(1).max(80),conditions:z.string().min(1).max(700)});
const Target=z.discriminatedUnion('kind',[
  z.strictObject({kind:z.literal('offer'),offerId:z.string().min(1),externalId:z.string().min(1),sourceUrl:SafeHttpsSchema}),
  z.strictObject({kind:z.literal('affiliate'),href:SafeHttpsSchema,bookingSourceUrl:SafeHttpsSchema,bookingLocale:LocaleSchema,linkEvidence:z.literal('approved-template')}),
  z.strictObject({kind:z.literal('catalog'),category:OfferCategorySchema}),
]);
export const PromotionCatalogSchema=z.strictObject({version:z.literal(1),items:z.array(z.strictObject({
  id:z.string().regex(/^[a-z0-9-]+$/),providerId:ProviderIdSchema,enabled:z.boolean(),approvalStatus:z.enum(['approved','pending']),
  kind:z.enum(['sale','coupon']),priority:z.number().int().nonnegative(),sourceUrl:SafeHttpsSchema,
  checkedOn:z.iso.date(),reviewExpiresAt:z.iso.datetime(),startsOn:z.iso.date(),endsOn:z.iso.date(),
  code:z.string().regex(/^[A-Za-z0-9_-]{1,60}$/).nullable(),
  texts:z.strictObject({ko:Text,en:Text,ja:Text,'zh-CN':Text,'zh-TW':Text}),target:Target,
  evidence:z.strictObject({excerpt:z.string().min(1).max(3000),basis:z.string().min(1).max(2000)}),
}))});
export type PromotionCatalog=z.infer<typeof PromotionCatalogSchema>;
export function loadPromotionCatalog(){const input:unknown=JSON.parse(readFileSync(new URL('../../../../config/catalog/promotions.json',import.meta.url),'utf8'));return PromotionCatalogSchema.parse(input);}
