import {z} from 'zod';import {LocaleSchema,CurrencySchema} from './schemas.js';import {SafeHttpsSchema} from './offers.js';
export const StayMapResponseSchema=z.strictObject({locale:LocaleSchema,currency:CurrencySchema,url:SafeHttpsSchema,checkIn:z.iso.date(),checkOut:z.iso.date(),adults:z.literal(2),rooms:z.literal(1)});

export const StayBannerResponseSchema=z.strictObject({locale:LocaleSchema,currency:CurrencySchema,url:SafeHttpsSchema,width:z.literal(300),height:z.literal(300),frameName:z.string().regex(/^[a-zA-Z0-9_-]+$/),initialMessages:z.array(z.json()).max(4)});
