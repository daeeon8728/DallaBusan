import { useEffect,useState } from 'react';
import { PublicOfferSchema,type PublicOffer,type Locale } from '@trip-fit/domain';
export type CartOfferResult={status:'ready';offer:PublicOffer}|{status:'missing'|'failed';offer:null};
export function useCartOffers(identityKey:string,locale:Locale,attempt:number){
 const key=locale+'|'+identityKey+'|'+attempt;
 const [result,setResult]=useState<{key:string;items:ReadonlyMap<string,CartOfferResult>}|null>(null);
 useEffect(()=>{const controller=new AbortController();const ids=identityKey?identityKey.split('|'):[];let cursor=0;const items=new Map<string,CartOfferResult>();
  async function worker(){while(!controller.signal.aborted){const id=ids[cursor++];if(id===undefined)return;try{const response=await fetch('/api/offers/'+encodeURIComponent(id)+'?locale='+locale,{signal:controller.signal,headers:{Accept:'application/json'}});if(!response.ok){items.set(id,{status:response.status===404?'missing':'failed',offer:null});continue;}const raw:unknown=await response.json();const offer=PublicOfferSchema.parse(raw);if(offer.id!==id)throw new Error('Offer identity changed');items.set(id,{status:'ready',offer});}catch{if(!controller.signal.aborted)items.set(id,{status:'failed',offer:null});}}}
  void Promise.all(Array.from({length:Math.min(6,ids.length)},()=>worker())).then(()=>{if(!controller.signal.aborted)setResult({key,items});});return()=>controller.abort();
 },[identityKey,locale,attempt,key]);
 return result?.key===key?result.items:null;
}
