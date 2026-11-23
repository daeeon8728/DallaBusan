import { OfferQuerySchema, PromotionsResponseSchema, type Locale, type PublicPromotion } from '@trip-fit/domain';
import { PromotionCatalogSchema, type PromotionCatalog } from '../config/promotions.js';
import type { OfferCatalogConfig } from '../config/offers.js';
import { validateLink, type OfferService } from './offers.js';
export function createPromotionService(input:PromotionCatalog,catalog:OfferCatalogConfig,offers:OfferService,now:()=>Date=()=>new Date()) {
  const config=PromotionCatalogSchema.parse(input),providers=new Map(catalog.providers.map(provider=>[provider.id,provider]));
  if(new Set(config.items.map(item=>item.id)).size!==config.items.length)throw new Error('Duplicate promotion identity');
  for(const item of config.items){
    const provider=providers.get(item.providerId);
    if(!provider||!provider.sourceHosts.includes(new URL(item.sourceUrl).hostname)||item.startsOn>item.endsOn||item.checkedOn>item.endsOn||Date.parse(item.reviewExpiresAt)>Date.parse(item.checkedOn+'T00:00:00Z')+4*86400000)
      throw new Error('Invalid promotion evidence or review period');
    if(item.target.kind==='affiliate'){
      const href=validateLink(item.target.href,provider),destination=new URL(href),source=new URL(item.target.bookingSourceUrl);
      if(!provider.sourceHosts.includes(source.hostname))throw new Error('Unapproved promotion booking source');
      if(provider.destinationQuery){if(destination.searchParams.get(provider.destinationQuery)!==source.href)throw new Error('Promotion destination evidence mismatch');}
      else {for(const key of Object.keys(provider.requiredQuery))destination.searchParams.delete(key);if(destination.href!==source.href)throw new Error('Promotion destination evidence mismatch');}
    }
    if(item.target.kind==='offer'){
      const target=item.target;const raw=catalog.offers.find(offer=>offer.id===target.offerId);
      if(!raw||raw.providerId!==item.providerId||raw.externalId!==target.externalId||raw.sourceUrl!==target.sourceUrl)throw new Error('Promotion product identity changed; review required');
    }
  }
  return {list(locale:Locale){
    const time=now(),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(time);
    const items:PublicPromotion[]=[];
    for(const item of [...config.items].sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id))){
      const provider=providers.get(item.providerId);
      if(!item.enabled||item.approvalStatus!=='approved'||!provider?.enabled||provider.approvalStatus!=='approved'||item.checkedOn>today||item.startsOn>today||item.endsOn<today||Date.parse(item.reviewExpiresAt)<=time.getTime())continue;
      // Restricted providers can only advertise an individually eligible published product.
      if(provider.bookingPolicy!=='open'&&item.target.kind!=='offer')continue;
      let target:PublicPromotion['target'];
      if(item.target.kind==='offer'){const offer=offers.get(item.target.offerId,locale);if(!offer||offer.provider.id!==provider.id)continue;target={kind:'offer',offer};}
      else if(item.target.kind==='affiliate')target={kind:'affiliate',href:item.target.href,bookingLocale:item.target.bookingLocale};
      else {const list=offers.list(OfferQuerySchema.parse({locale,provider:provider.id,category:item.target.category,scope:'busan'}));if(!list.total)continue;target={kind:'catalog',providerId:provider.id,category:item.target.category};}
      const end=new Date(Date.parse(item.endsOn+'T00:00:00+09:00')+86400000).toISOString();
      items.push({id:item.id,provider:{id:provider.id,displayName:provider.localizedDisplayNames[locale]??provider.displayName},kind:item.kind,...item.texts[locale],code:item.code,sourceUrl:item.sourceUrl,checkedOn:item.checkedOn,startsOn:item.startsOn,endsOn:item.endsOn,expiresAt:Date.parse(item.reviewExpiresAt)<Date.parse(end)?item.reviewExpiresAt:end,target});
    }
    return PromotionsResponseSchema.parse({locale,items,generatedAt:time.toISOString()});
  }};
}
export type PromotionService=ReturnType<typeof createPromotionService>;
