import { CourseOffersSchema, CourseSchema, CoursesResponseSchema, type CoursePersona, type Course, type CourseCategory, type Locale } from '@trip-fit/domain';
import type { CourseCatalog } from '../config/courses.js';
import type { DestinationService } from './destinations.js';
import type { GuideService } from './guides.js';
import type { ParkingAnchor } from '../config/parking-directory.js';
import type { CourseRouteSnapshot } from '../config/course-routes.js';
import { courseRouteFingerprint,courseWaypoints,referenceCourseRoute } from './course-routing.js';
import type {OfferService} from './offers.js';
import type {CourseCommerceConfig} from '../config/course-commerce.js';
import {getCourseCommerceCopy} from '../config/course-commerce-copy.js';
export function createCourseService(config: CourseCatalog, destinations: DestinationService, guides: GuideService, anchors:ReadonlyMap<string,ParkingAnchor>=new Map(), routes:CourseRouteSnapshot={version:1,items:[]},commerce:CourseCommerceConfig['items']=[],today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),offerSelection?:Pick<OfferService,'selectForDisplay'>) {
    const cache = new Map<Locale, ReturnType<typeof CourseSchema.parse>[]>();
    function items(locale: Locale) {
        const cached = cache.get(locale);
        if (cached)
            return cached;
        const result = config.items.flatMap(item => {
            let valid = true;
            const steps = item.steps.map(step => {
                if (step.kind === 'note')
                    return { kind: step.kind, id: null, name: step.texts[locale], originalName: null, contentTranslation: 'editorial', href: null, address: null, image: null, sourceUrl: null, locale,coordinates:null,stayMinutes:45,sourceCollectedAt:null,description:null,menu:null,hours:null,holidays:null };
                if (step.kind === 'destination') {
                    const detail=destinations.get(step.id, locale);
                    const value = detail?.destination;
                    if (!value) {
                        valid = false;
                        return null;
                    }
                    return { kind: step.kind, id: step.id, name: value.name, originalName: destinations.get(step.id, 'ko')?.destination.name ?? null, contentTranslation: value.contentTranslation, href: '/places/' + step.id, address: value.address, image: value.image ? { url: value.image.url, credit: value.image.credit } : null, sourceUrl: value.sourceUrl, locale: value.locale,coordinates:anchors.get('destination:'+step.id)?.coordinates??null,stayMinutes:step.stayMinutes,sourceCollectedAt:value.sourceRetrievedAt,description:value.description,menu:null,hours:detail?.visitInfo.hours??null,holidays:value.holidayInfo };
                }
                const value = guides.get('food', step.id, locale);
                if (!value) {
                    valid = false;
                    return null;
                }
                return { kind: step.kind, id: step.id, name: value.item.name, originalName: value.item.originalName, contentTranslation: value.item.contentTranslation, href: '/food/' + step.id, address: value.item.address, image: value.item.imageUrl ? { url: value.item.imageUrl, credit: value.source.credit } : null, sourceUrl: value.source.url, locale: value.item.locale,coordinates:anchors.get('food:'+step.id)?.coordinates??null,stayMinutes:step.stayMinutes,sourceCollectedAt:value.source.collectedAt,description:value.item.description,menu:value.item.menu,hours:value.item.hours,holidays:value.item.holidays };
            });
            const points=courseWaypoints(item,anchors), fingerprint=courseRouteFingerprint(item,points);
            const cachedRoute=routes.items.find(row=>row.id===item.id&&row.fingerprint===fingerprint&&row.route.mode===item.mode&&row.route.legs.length===item.steps.length-1);
            const route=cachedRoute?.route??referenceCourseRoute(item.mode);
            return valid ? [CourseSchema.parse({personaTag:item.personaTag,duration:item.duration?.[locale]??'',featured:item.featured,intro:item.intro?.[locale]??'',tips:item.tips?.[locale]??'',route, id: item.id, category: item.category, title: item.titles[locale], locale, status: item.status, routeCheck: 'pending', fieldValidation: 'not-performed', steps, image: steps.find(step => step?.image)?.image ?? null, reviewedOn: config.reviewedOn })] : [];
        });
        cache.set(locale, result);
        return result;
    }
    function bookings(course:Course,locale:Locale){
      const all=course.steps.flatMap(step=>{if(step.kind!=='destination'||!step.id)return [];const detail=destinations.get(step.id,locale);return detail?.related.map(row=>({...row,destinationId:step.id??'',destinationName:detail.destination.name}))??[];});
      const rule=commerce.find(row=>row.courseId===course.id&&row.reviewedOn<=today()&&row.reviewExpiresOn>=today());
      const main=rule?all.find(row=>row.offer.id===rule.offerId&&row.destinationId===rule.destinationId&&row.relationship==='tour'):undefined;
      const text=getCourseCommerceCopy(locale);
      const base=(offer:typeof all[number]['offer'])=>({provider:offer.provider.id,basePriceKRW:offer.referencePrice?.currency==='KRW'?Number(offer.referencePrice.amount):null,affiliateUrl:offer.href,offer});
      const affiliateBundle=main?{...base(main.offer),title:main.offer.title,badgeText:text.badge,persuasionCopy:text.persuasion,destinationId:main.destinationId,spotName:main.destinationName}:null;
      const endpoint=course.steps.at(-1),seen=new Set<string>();
      const candidates=all.filter(row=>row.relationship!=='tour'&&row.offer.id!==main?.offer.id&&(row.relationship!=='stay'||endpoint?.kind==='destination'&&row.destinationId===endpoint.id));
      const ranked=offerSelection?.selectForDisplay(candidates.map(row=>row.offer.id),locale).map(offer=>offer.id)??candidates.map(row=>row.offer.id);
      const affiliateItems=candidates.filter(row=>ranked.includes(row.offer.id)).sort((a,b)=>ranked.indexOf(a.offer.id)-ranked.indexOf(b.offer.id)).flatMap(row=>{
        const stay=row.relationship==='stay';
        if(row.relationship==='tour'||row.offer.id===main?.offer.id||seen.has(row.offer.id)||stay&&(endpoint?.kind!=='destination'||row.destinationId!==endpoint.id))return [];
        seen.add(row.offer.id);return [{...base(row.offer),spotName:row.destinationName,productTitle:row.offer.title,destinationId:row.destinationId,kind:stay?'stay' as const:'spot' as const,areaLabel:row.areaLabel}];
      });
      return {affiliateBundle,affiliateItems:[...affiliateItems.filter(row=>row.kind==='spot').slice(0,6),...affiliateItems.filter(row=>row.kind==='stay').slice(0,3)]};
    }
    return {
      offers(id:string,locale:Locale) {
        const course=items(locale).find(item=>item.id===id);if(!course)return null;
        const seen=new Set<string>();
        const related=course.steps.flatMap(step=>{
          if(step.kind!=='destination'||!step.id)return [];
          const detail=destinations.get(step.id,locale);if(!detail)return [];
          return detail.related.flatMap(item=>{
            if(item.relationship==='stay'||seen.has(item.offer.id))return [];
            seen.add(item.offer.id);
            return [{destinationId:step.id,destinationName:detail.destination.name,relationship:item.relationship,offer:item.offer}];
          });
        }).slice(0,12);
        return CourseOffersSchema.parse({locale,courseId:id,items:related,...bookings(course,locale)});
      },
      list(locale: Locale, category?: CourseCategory, persona?:CoursePersona) { const all = items(locale); return CoursesResponseSchema.parse({ locale, items: all.filter(item=>(!category||item.category===category)&&(!persona||item.personaTag.includes(persona))), total: all.length, counts: { friends: all.filter(x => x.category === 'friends').length, family: all.filter(x => x.category === 'family').length, date: all.filter(x => x.category === 'date').length, food: all.filter(x => x.category === 'food').length, dallabusan: all.filter(x => x.category === 'dallabusan').length } }); }, get(id: string, locale: Locale) { const course=items(locale).find(item=>item.id===id);return course?{...course,...bookings(course,locale)}:null; } };
}
export type CourseService = ReturnType<typeof createCourseService>;
