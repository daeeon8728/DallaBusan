import {z} from 'zod';
import {LocaleSchema,CurrencySchema} from './schemas.js';
import {SafeHttpsSchema,PublicProviderSchema} from './offers.js';
export const StayCriteriaSchema=z.strictObject({checkIn:z.iso.date(),checkOut:z.iso.date(),adults:z.number().int().min(1).max(8),rooms:z.number().int().min(1).max(4),childAges:z.array(z.number().int().min(0).max(17)).max(4)}).superRefine((value,ctx)=>{
 const nights=(Date.parse(value.checkOut+'T00:00:00Z')-Date.parse(value.checkIn+'T00:00:00Z'))/86400000;
 if(nights<1||nights>30)ctx.addIssue({code:'custom',path:['checkOut'],message:'Stay must be 1 to 30 nights'});
 if(value.adults<value.rooms)ctx.addIssue({code:'custom',path:['rooms'],message:'At least one adult per room is required'});
});
export type StayCriteria=z.infer<typeof StayCriteriaSchema>;
export function addStayDays(date:string,days:number){return new Date(Date.parse(z.iso.date().parse(date)+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);}
export function validateStayCriteria(input:unknown,today:string){const value=StayCriteriaSchema.parse(input);z.iso.date().parse(today);if(value.checkIn<today||value.checkIn>addStayDays(today,365))throw new Error('Check-in must be within the next 365 days');return value;}
export const StaySearchPartnerSchema=z.strictObject({id:z.string().regex(/^[a-z0-9-]+$/),provider:PublicProviderSchema,contentLocale:LocaleSchema});
export const StaySearchOptionsSchema=z.strictObject({locale:LocaleSchema,today:z.iso.date(),latestCheckIn:z.iso.date(),currency:CurrencySchema,defaults:StayCriteriaSchema,partners:z.array(StaySearchPartnerSchema)});
export const StaySearchRequestSchema=z.strictObject({locale:LocaleSchema,criteria:StayCriteriaSchema});
export const StaySearchResponseSchema=z.strictObject({locale:LocaleSchema,currency:CurrencySchema,criteria:StayCriteriaSchema,items:z.array(StaySearchPartnerSchema.extend({href:SafeHttpsSchema}))});
export type StaySearchResponse=z.infer<typeof StaySearchResponseSchema>;
