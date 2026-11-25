import {readFileSync} from 'node:fs';
import {z} from 'zod';
import {LocaleSchema,ProviderIdSchema,SafeHttpsSchema,StaySearchOptionsSchema,StaySearchResponseSchema,DEFAULT_CURRENCY_BY_LOCALE,addStayDays,validateStayCriteria,type Locale,type StayCriteria} from '@trip-fit/domain';
import type {OfferCatalogConfig} from './offers.js';
import {validateLink} from '../services/offers.js';
const Parameter=z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/);
const Bindings=z.strictObject({checkIn:Parameter,checkOut:Parameter,adults:Parameter,rooms:Parameter,children:Parameter,childAges:Parameter,currency:Parameter});
export const StaySearchConfigSchema=z.strictObject({version:z.literal(1),reviewedOn:z.iso.date(),partners:z.array(z.strictObject({id:z.string().regex(/^[a-z0-9-]+$/),providerId:ProviderIdSchema,enabled:z.boolean(),approvalStatus:z.enum(['approved','pending']),contentLocale:LocaleSchema,baseUrl:SafeHttpsSchema,allowedHosts:z.array(z.string().min(1)).min(1),path:z.string().startsWith('/'),requiredQuery:z.record(Parameter,z.string()),bindings:Bindings,sourceUrl:SafeHttpsSchema,evidence:z.string().min(20)}))});
export function loadStaySearchConfig(){const raw:unknown=JSON.parse(readFileSync(new URL('../../../../config/catalog/stay-search.json',import.meta.url),'utf8'));return StaySearchConfigSchema.parse(raw);}
export function createStaySearchConfig(input:z.infer<typeof StaySearchConfigSchema>,catalog:OfferCatalogConfig,today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())){
 const config=StaySearchConfigSchema.parse(input);
 if(new Set(config.partners.map(item=>item.id)).size!==config.partners.length)throw Error('Duplicate stay search identity');
 for(const partner of config.partners){
  const url=new URL(partner.baseUrl),keys=Object.values(partner.bindings).map(key=>key.toLowerCase()),queryKeys=[...url.searchParams.keys()].map(key=>key.toLowerCase());
  if(new Set(queryKeys).size!==queryKeys.length)throw Error('Ambiguous stay search query');
  if(!partner.allowedHosts.includes(url.hostname)||url.pathname!==partner.path||url.port||url.username||url.password||url.hash)throw Error('Unapproved stay search URL');
  if(new Set(keys).size!==keys.length||[...url.searchParams.keys()].some(key=>keys.includes(key.toLowerCase())))throw Error('Conflicting stay search parameters');
  for(const [key,value]of Object.entries(partner.requiredQuery))if(url.searchParams.getAll(key).length!==1||url.searchParams.get(key)!==value)throw Error('Invalid stay search attribution');
 }
 function active(){return config.partners.flatMap(partner=>{const provider=catalog.providers.find(p=>p.id===partner.providerId);return partner.enabled&&partner.approvalStatus==='approved'&&provider?.enabled&&provider.approvalStatus==='approved'&&provider.bookingPolicy==='open'?[{partner,provider}]:[];});}
 function publicPartner(item:ReturnType<typeof active>[number],locale:Locale){return {id:item.partner.id,provider:{id:item.provider.id,displayName:item.provider.localizedDisplayNames[locale]??item.provider.displayName},contentLocale:item.partner.contentLocale};}
 return {
  options(locale:Locale){const day=today();return StaySearchOptionsSchema.parse({locale,today:day,latestCheckIn:addStayDays(day,365),currency:DEFAULT_CURRENCY_BY_LOCALE[locale],defaults:{checkIn:addStayDays(day,1),checkOut:addStayDays(day,2),adults:2,rooms:1,childAges:[]},partners:active().map(item=>publicPartner(item,locale))});},
  search(locale:Locale,input:StayCriteria){const criteria=validateStayCriteria(input,today()),currency=DEFAULT_CURRENCY_BY_LOCALE[locale];
   const items=active().map(item=>{const {partner,provider}=item,url=new URL(partner.baseUrl),values={checkIn:criteria.checkIn,checkOut:criteria.checkOut,adults:String(criteria.adults),rooms:String(criteria.rooms),children:String(criteria.childAges.length),childAges:criteria.childAges.join(','),currency};
    for(const field of Object.keys(Bindings.shape)){const key=Bindings.keyof().parse(field);url.searchParams.set(partner.bindings[key],values[key]);}
    const href=validateLink(url.href,{...provider,allowedHosts:partner.allowedHosts,pathPrefixes:[partner.path],requiredQuery:partner.requiredQuery,destinationQuery:null,destinationHosts:[]});
    return {...publicPartner(item,locale),href};
   });return StaySearchResponseSchema.parse({locale,currency,criteria,items});
  }
 };
}
