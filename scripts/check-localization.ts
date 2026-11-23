import { loadFoodVisibility } from '../apps/server/src/config/food-visibility.js';
import { pathToFileURL } from 'node:url';
import { loadTextLocalizer,hasHangul } from '../apps/server/src/config/localization.js';
import { loadOfferCatalogConfig } from '../apps/server/src/config/offers.js';
import { loadDestinationConfig } from '../apps/server/src/config/destinations.js';
import { loadGuideSnapshot } from '../apps/server/src/config/guides.js';
import { createOfferService } from '../apps/server/src/services/offers.js';
import { createDestinationService } from '../apps/server/src/services/destinations.js';
import { createGuideService } from '../apps/server/src/services/guides.js';
import { OfferQuerySchema,GuideQuerySchema,SUPPORTED_LOCALES } from '@trip-fit/domain';
export function auditLocalization() {
  const foodSnapshot=loadGuideSnapshot('food');if(!foodSnapshot)throw Error('Food source missing');
  const text=loadTextLocalizer(),offers=createOfferService(loadOfferCatalogConfig()),destinationConfig=loadDestinationConfig(),destinations=createDestinationService(destinationConfig,offers,undefined,text),guides=createGuideService({food:foodSnapshot,recommended:loadGuideSnapshot('recommended')},text,loadFoodVisibility(foodSnapshot));
  const issues:{kind:string;id:string;locale:string;field:string}[]=[];const counts=[];
  function check(kind:string,id:string,locale:string,fields:Record<string,string|null|undefined>){if(locale==='ko')return;for(const [field,value]of Object.entries(fields))if(value&&hasHangul(value))issues.push({kind,id,locale,field});}
  for(const locale of SUPPORTED_LOCALES){
    const list=offers.list(OfferQuerySchema.parse({locale,limit:48}));let offerCount=0;
    for(let page=1;page<=list.pages;page++)for(const item of offers.list(OfferQuerySchema.parse({locale,limit:48,page})).items){offerCount++;check('offer',item.id,locale,{title:item.title,provider:item.provider.displayName,credit:item.image.credit});if(item.titleLocale!==locale&&item.localizationStatus==='fallback')issues.push({kind:'offer',id:item.id,locale,field:'locale'});}
    let destinationMachine=0;
    for(const item of destinationConfig.destinations){const detail=destinations.get(item.slug,locale);if(!detail)throw Error('Destination missing');const d=detail.destination;check('destination',d.slug,locale,{name:d.name,description:d.description,address:d.address,district:d.district,holidayInfo:d.holidayInfo,content:detail.content,...detail.visitInfo,credit:d.image?.credit});if(d.locale!==locale||d.translationFallback)issues.push({kind:'destination',id:d.slug,locale,field:'locale'});if(d.contentTranslation==='machine')destinationMachine++;for(const related of detail.related)check('related',related.offer.id,locale,{areaLabel:related.areaLabel});}
    const food=guides.list('food',GuideQuerySchema.parse({locale}));if(!food)throw Error('Food missing');let foodMachine=0;
    for(let page=1;page<=food.pages;page++)for(const row of guides.list('food',GuideQuerySchema.parse({locale,page}))?.items??[]){const detail=guides.get('food',row.id,locale);if(!detail)throw Error('Food detail missing');const {name,address,district,category,menu,hours,holidays,fees,transport,phone,description}=detail.item;check('food',row.id,locale,{name,address,district,category,menu,hours,holidays,fees,transport,phone,description});if(detail.item.locale!==locale||detail.item.translationFallback)issues.push({kind:'food',id:row.id,locale,field:'locale'});if(detail.item.contentTranslation==='machine')foodMachine++;}
    counts.push({locale,offers:offerCount,destinations:destinationConfig.destinations.length,food:food.total,destinationMachine,foodMachine});
  }
  return {counts,issues};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const result=auditLocalization();console.log(JSON.stringify(result,null,2));if(result.issues.length)process.exitCode=1;}
