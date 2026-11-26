import type {Locale} from '@trip-fit/domain';
import {loadOfferCatalogConfig} from '../../apps/server/src/config/offers.js';
import {loadPromotionCatalog} from '../../apps/server/src/config/promotions.js';
import {createOfferService} from '../../apps/server/src/services/offers.js';
import {createPromotionService} from '../../apps/server/src/services/promotions.js';
// Review-window fixture. Live expired campaigns must remain hidden in production.
const catalog=loadOfferCatalogConfig(),service=createPromotionService(loadPromotionCatalog(),catalog,createOfferService(catalog,()=> '2026-11-23'),()=>new Date('2026-11-23T03:00:00Z'));
export const promotionFixture=(locale:Locale)=>service.list(locale);
