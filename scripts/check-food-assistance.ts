import { SUPPORTED_LOCALES, GuideQuerySchema } from '@trip-fit/domain';
import { loadFoodAssistanceConfig, assistanceFingerprint } from '../apps/server/src/config/food-assistance.js';
import { loadGuideSnapshot } from '../apps/server/src/config/guides.js';
import { loadFoodVisibility } from '../apps/server/src/config/food-visibility.js';
import { loadFoodPhotoOverrides } from '../apps/server/src/config/food-photos.js';
import { loadTextLocalizer } from '../apps/server/src/config/localization.js';
import { createGuideService } from '../apps/server/src/services/guides.js';
import { createFoodAssistanceService } from '../apps/server/src/services/food-assistance.js';
const snapshot=loadGuideSnapshot('food');if(!snapshot)throw Error('Missing food snapshot');
const config=loadFoodAssistanceConfig(),visibility=loadFoodVisibility(snapshot);
const guides=createGuideService({food:snapshot},loadTextLocalizer(),visibility,loadFoodPhotoOverrides(snapshot,visibility));
const service=createFoodAssistanceService(config,snapshot,guides);
const members=config.groups.flatMap(group=>group.members);
for(const member of members){
 const row=snapshot.languages.find(group=>group.locale==='ko')?.records.find(row=>row.id===member.id);
 if(!row||visibility.excludedIds.has(member.id)||row.menu!==member.evidence||!row.menu.includes(member.dish.korean)||
   assistanceFingerprint(snapshot,member.id)!==member.fingerprint)throw Error('Review required for food:'+member.id);
}
const counts=[];
for(const locale of SUPPORTED_LOCALES){
 const total=guides.list('food',GuideQuerySchema.parse({locale}))?.availableTotal;
 let cards=0,koreanCards=0,withAlternatives=0;
 const ids=new Set(snapshot.languages.flatMap(group=>group.records.map(row=>row.id)));
 for(const id of ids){
  const value=service.get(id,locale);if(!value)continue;cards++;if(value.localCard)koreanCards++;if(value.alternatives.length)withAlternatives++;
  if(value.alternatives.some(row=>!guides.get('food',row.item.id,locale)||row.item.id===id))throw Error('Invalid public food candidate');
 }
 if(cards!==total)throw Error('Incomplete local-card coverage');
 counts.push({locale,cards,koreanCards,withAlternatives});
}
console.log(JSON.stringify({source:'existing-public-snapshot',reviewedBy:config.reviewedBy,groups:config.groups.length,reviewedRestaurants:members.length,counts},null,2));
