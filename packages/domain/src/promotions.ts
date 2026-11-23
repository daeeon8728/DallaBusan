import { z } from 'zod';
import { LocaleSchema } from './schemas.js';
import { ProviderIdSchema } from './catalog.js';
import { OfferCategorySchema, PublicOfferSchema, PublicProviderSchema, SafeHttpsSchema } from './offers.js';
export const PromotionQuerySchema=z.strictObject({locale:LocaleSchema.default('en')});
export const PublicPromotionSchema=z.strictObject({
  id:z.string().min(1),provider:PublicProviderSchema,kind:z.enum(['sale','coupon']),
  title:z.string().min(1),benefit:z.string().min(1),conditions:z.string().min(1),
  code:z.string().max(60).nullable(),sourceUrl:SafeHttpsSchema,checkedOn:z.iso.date(),
  startsOn:z.iso.date(),endsOn:z.iso.date(),expiresAt:z.iso.datetime(),
  target:z.discriminatedUnion('kind',[
    z.strictObject({kind:z.literal('offer'),offer:PublicOfferSchema}),
    z.strictObject({kind:z.literal('affiliate'),href:SafeHttpsSchema,bookingLocale:LocaleSchema}),
    z.strictObject({kind:z.literal('catalog'),providerId:ProviderIdSchema,category:OfferCategorySchema}),
  ]),
});
export const PromotionsResponseSchema=z.strictObject({locale:LocaleSchema,items:z.array(PublicPromotionSchema),generatedAt:z.iso.datetime()});
export type PublicPromotion=z.infer<typeof PublicPromotionSchema>;
