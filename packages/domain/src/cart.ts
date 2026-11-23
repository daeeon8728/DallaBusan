import { z } from 'zod';
import { PublicOfferSchema } from './offers.js';
import { ProviderIdSchema } from './catalog.js';
export const CART_LIMIT=100;
export const CartQuantitySchema=z.number().int().min(1).max(99);
export const CartEntrySchema=z.strictObject({id:PublicOfferSchema.shape.id,providerId:ProviderIdSchema,externalId:z.string().min(1).max(300),title:z.string().min(1).max(500),quantity:CartQuantitySchema,addedAt:z.iso.datetime()});
export type CartEntry=z.infer<typeof CartEntrySchema>;
export const CartFileSchema=z.strictObject({version:z.literal(1),entries:z.array(CartEntrySchema).max(CART_LIMIT)}).refine(file=>new Set(file.entries.map(entry=>entry.id)).size===file.entries.length,'Duplicate cart identities');
const AmountSchema=z.string().max(128).regex(/^(0|[1-9]\d*)(\.\d+)?$/);
const CartPriceSchema=PublicOfferSchema.shape.referencePrice.unwrap().extend({amount:AmountSchema}).nullable();
export const CartLineSchema=z.strictObject({id:PublicOfferSchema.shape.id,quantity:CartQuantitySchema,status:z.enum(['ready','pending','unavailable']),referencePrice:CartPriceSchema}).refine(line=>line.status==='ready'||line.referencePrice===null,'Unavailable prices cannot be included');
export type CartLine=z.infer<typeof CartLineSchema>;
function scaleOf(amount:string){return amount.split('.')[1]?.length??0;}
function scaled(amount:string,scale:number){const [whole,fraction='']=amount.split('.');if(whole===undefined)throw new Error('Invalid decimal');return BigInt(whole+fraction.padEnd(scale,'0'));}
function decimal(value:bigint,scale:number){if(scale===0)return value.toString();const raw=value.toString().padStart(scale+1,'0');const fraction=raw.slice(-scale).replace(/0+$/,'');return raw.slice(0,-scale)+(fraction?'.'+fraction:'');}
export function multiplyCartAmount(input:unknown,count:unknown){const amount=AmountSchema.parse(input);const quantity=CartQuantitySchema.parse(count);const scale=scaleOf(amount);return decimal(scaled(amount,scale)*BigInt(quantity),scale);}
export function calculateCartTotals(input:readonly CartLine[]){
 const lines=z.array(CartLineSchema).max(CART_LIMIT).parse(input);if(new Set(lines.map(line=>line.id)).size!==lines.length)throw new Error('Duplicate cart identities');
 const groups=new Map<string,{amount:string;quantity:number}[]>();
 for(const line of lines)if(line.status==='ready'&&line.referencePrice){const group=groups.get(line.referencePrice.currency)??[];group.push({amount:line.referencePrice.amount,quantity:line.quantity});groups.set(line.referencePrice.currency,group);}
 const totals=[...groups].sort(([a],[b])=>a.localeCompare(b)).map(([currency,rows])=>{const scale=Math.max(...rows.map(row=>scaleOf(row.amount)));return {currency,amount:decimal(rows.reduce((sum,row)=>sum+scaled(row.amount,scale)*BigInt(row.quantity),0n),scale),items:rows.length,quantity:rows.reduce((sum,row)=>sum+row.quantity,0)};});
 return {totals,items:lines.length,quantity:lines.reduce((sum,line)=>sum+line.quantity,0),pricedItems:lines.filter(line=>line.status==='ready'&&line.referencePrice!==null).length,unpricedItems:lines.filter(line=>line.status==='ready'&&line.referencePrice===null).length,unavailableItems:lines.filter(line=>line.status==='unavailable').length,pendingItems:lines.filter(line=>line.status==='pending').length};
}
