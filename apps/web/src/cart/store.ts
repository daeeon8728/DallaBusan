import { CartEntrySchema,CartFileSchema,CartQuantitySchema,CART_LIMIT,type CartEntry,type PublicOffer } from '@trip-fit/domain';
export const CART_KEY='dallabusan.cart.v1';
type StoragePort=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type Problem='corrupt'|'unavailable'|'limit'|null;
export function createCartStore(storage:()=>StoragePort,now=()=>new Date().toISOString()){
 let initialized=false;let snapshot:{entries:CartEntry[];problem:Problem}={entries:[],problem:null};const listeners=new Set<()=>void>();
 function emit(){for(const listener of listeners)listener();}
 function read():typeof snapshot{try{const raw=storage().getItem(CART_KEY);if(raw===null)return {entries:[],problem:null};if(raw.length>150000)return {entries:snapshot.entries,problem:'corrupt'};const value:unknown=JSON.parse(raw);const result=CartFileSchema.safeParse(value);return result.success?{entries:result.data.entries,problem:null}:{entries:snapshot.entries,problem:'corrupt'};}catch(error){return {entries:snapshot.entries,problem:error instanceof SyntaxError?'corrupt':'unavailable'};}}
 function change(work:(entries:CartEntry[])=>CartEntry[]){initialized=true;const current=read();if(current.problem){snapshot=current;emit();return false;}const entries=work(current.entries);if(entries.length>CART_LIMIT){snapshot={entries:current.entries,problem:'limit'};emit();return false;}const valid=CartFileSchema.safeParse({version:1,entries});if(!valid.success)return false;try{storage().setItem(CART_KEY,JSON.stringify(valid.data));snapshot={entries:valid.data.entries,problem:null};emit();return true;}catch{snapshot={entries:current.entries,problem:'unavailable'};emit();return false;}}
 return {
  getSnapshot(){if(!initialized){snapshot=read();initialized=true;}return snapshot;},
  subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
  refresh(){initialized=true;snapshot=read();emit();},
  add(offer:PublicOffer){const parsed=CartEntrySchema.safeParse({id:offer.id,providerId:offer.provider.id,externalId:offer.externalId,title:offer.title,quantity:1,addedAt:now()});if(!parsed.success)return false;return change(entries=>entries.some(entry=>entry.id===offer.id)?entries:[parsed.data,...entries]);},
  remove(id:string){return change(entries=>entries.filter(entry=>entry.id!==id));},
  setQuantity(id:string,value:unknown){const quantity=CartQuantitySchema.safeParse(value);if(!quantity.success)return false;return change(entries=>entries.map(entry=>entry.id===id?{...entry,quantity:quantity.data}:entry));},
  reset(){initialized=true;try{storage().removeItem(CART_KEY);snapshot={entries:[],problem:null};emit();}catch{snapshot={...snapshot,problem:'unavailable'};emit();}},
 };
}
