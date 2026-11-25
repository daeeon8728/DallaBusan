import { FoodAssistanceSchema, type GuideSnapshot, type Locale } from '@trip-fit/domain';
import { assistanceFingerprint, type FoodAssistanceConfig } from '../config/food-assistance.js';
import type { GuideService } from './guides.js';
import type { CourseService } from './courses.js';
import { themeStraightLineMeters } from './theme-route-catalog.js';

export function createFoodAssistanceService(config:FoodAssistanceConfig, snapshot:GuideSnapshot|null, guides:GuideService, courses?:CourseService) {
  const korean=new Map(snapshot?.languages.find(group=>group.locale==='ko')?.records.map(row=>[row.id,row]));
  const valid=new Map(config.groups.flatMap(group=>group.members.flatMap(member=>{
    const row=korean.get(member.id);
    return snapshot&&row&&row.menu===member.evidence&&row.menu.includes(member.dish.korean)&&
      assistanceFingerprint(snapshot,member.id)===member.fingerprint
      ? [[member.id,{group,member}]] as const : [];
  })));
  return {
    get(id:string,locale:Locale,courseId?:string) {
      const publicItem=guides.get('food',id,locale),local=korean.get(id);
      if(!publicItem)return null;
      if(!local)return FoodAssistanceSchema.parse({id,locale,reviewedOn:config.reviewedOn,source:publicItem.source,localCard:null,group:null,alternatives:[],context:null});
      const match=valid.get(id);
      const course=courseId?courses?.get(courseId,locale):null;
      const index=course?.steps.findIndex(step=>step.kind==='food'&&step.id===id)??-1;
      const context=course&&index>=0?course:null;
      const next=context?.steps[index+1];
      const origin=local.coordinates;
      const candidates=match&&origin?match.group.members.flatMap(member=>{
        if(member.id===id||member.area!==match.member.area||!valid.has(member.id))return [];
        const row=korean.get(member.id),detail=guides.get('food',member.id,locale);
        if(!row?.coordinates||!detail)return [];
        const distance=themeStraightLineMeters(origin,row.coordinates);
        // Exclude near-identical source points; never offer the same physical stop as an alternative.
        if(distance<25||distance>2500)return [];
        return [{item:detail.item,straightLineMeters:Math.round(distance),
          nextStraightLineMeters:next?.coordinates?Math.round(themeStraightLineMeters(row.coordinates,next.coordinates)):null}];
      }).sort((a,b)=>a.straightLineMeters-b.straightLineMeters||a.item.id.localeCompare(b.item.id)).slice(0,3):[];
      const map=new URL('https://www.google.com/maps/search/');
      map.search=new URLSearchParams({api:'1',query:[local.name,local.address].filter(Boolean).join(' ')}).toString();
      return FoodAssistanceSchema.parse({
        id,locale,source:publicItem.source,reviewedOn:config.reviewedOn,
        localCard:{name:local.name,address:local.address,menu:local.menu,phone:local.phone,mapUrl:local.address?map.href:null,
          dishes:match?[{id:match.group.id,korean:match.member.dish.korean,label:match.member.dish.labels[locale]}]:[]},
        group:match?.group.labels[locale]??null,alternatives:candidates,
        context:context?{id:context.id,title:context.title,nextName:next?.name??null}:null,
      });
    },
  };
}
export type FoodAssistanceService=ReturnType<typeof createFoodAssistanceService>;
