import {readFileSync} from 'node:fs';import {z} from 'zod';
import {LocaleSchema,CurrencySchema,ProviderIdSchema,SafeHttpsSchema,StayMapResponseSchema,type Locale} from '@trip-fit/domain';
import type {OfferCatalogConfig} from './offers.js';
export const StayMapConfigSchema=z.strictObject({enabled:z.boolean(),providerId:ProviderIdSchema,baseUrl:SafeHttpsSchema,allowedHosts:z.array(z.string().min(1)).min(1),source:z.string().min(1),settings:z.strictObject({refKey:z.string().min(1),searchRadius:z.literal(5),cid:z.number().int().positive(),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),destination:z.string().min(1),isOverideConf:z.boolean(),city:z.number().int().positive(),numberOfChildren:z.literal(0),numberOfAdult:z.literal(2),numberOfRoom:z.literal(1),crt:z.string().min(1),ver:z.literal(1)}),defaults:z.strictObject({checkInOffsetDays:z.literal(1),nights:z.literal(6)}),locales:z.record(LocaleSchema,z.strictObject({language:z.string().min(1),currency:CurrencySchema}))});
export function loadStayMapConfig(){const input:unknown=JSON.parse(readFileSync(new URL('../../../../config/catalog/stay-map.json',import.meta.url),'utf8'));return StayMapConfigSchema.parse(input);}
export function createStayMapConfig(input:z.infer<typeof StayMapConfigSchema>,catalog:OfferCatalogConfig,today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())){
 const config=StayMapConfigSchema.parse(input),provider=catalog.providers.find(value=>value.id===config.providerId),base=new URL(config.baseUrl);
 if(!config.allowedHosts.includes(base.hostname)||base.search||base.hash||base.username||base.password)throw Error('Invalid stay map destination');
 return {get(locale:Locale,mobile:boolean){
   if(!config.enabled||!provider?.enabled||provider.approvalStatus!=='approved')return null;
   const addDays=(offset:number)=>new Date(Date.parse(today()+'T00:00:00Z')+offset*86400000).toISOString().slice(0,10);
   const checkIn=addDays(config.defaults.checkInOffsetDays),checkOut=addDays(config.defaults.checkInOffsetDays+config.defaults.nights),localized=config.locales[locale],url=new URL(base);
   const params={...config.settings,...localized,checkIn,checkOut,isMobile:mobile};
   for(const [key,value]of Object.entries(params))url.searchParams.set(key,String(value));
   return StayMapResponseSchema.parse({locale,currency:localized.currency,url:url.href,checkIn,checkOut,adults:config.settings.numberOfAdult,rooms:config.settings.numberOfRoom});
 }};
}
