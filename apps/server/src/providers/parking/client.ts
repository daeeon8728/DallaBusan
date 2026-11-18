import { z } from 'zod';
import type { ParkingApiConfig } from '../../config/env.js';
import { PARKING_API_SOURCE } from '../../config/parking.js';
import { ParkingError } from './errors.js';
import { parseParkingPage } from './parse.js';
const ConfigSchema=z.object({baseUrl:z.literal(PARKING_API_SOURCE.baseUrl),operation:z.literal(PARKING_API_SOURCE.operation),serviceKey:z.string().min(1).nullable(),
  timeoutMs:z.number().int().min(1).max(30000),maxPages:z.number().int().min(1).max(100),pageSize:z.number().int().min(1).max(100),maxResponseBytes:z.number().int().min(1).max(4000000)});
async function boundedText(response:Response,maxBytes:number){
  if(Number(response.headers.get('content-length'))>maxBytes){await response.body?.cancel();throw new ParkingError('too-large');}
  if(!response.body)throw new ParkingError('invalid-response');const reader=response.body.getReader();const decoder=new TextDecoder();let text='';let size=0;
  try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>maxBytes){await reader.cancel();throw new ParkingError('too-large');}text+=decoder.decode(part.value,{stream:true});}return text+decoder.decode();}
  finally{reader.releaseLock();}
}
export function createParkingClient(input:ParkingApiConfig,fetcher:typeof fetch=fetch,now:()=>number=Date.now){
  const checked=ConfigSchema.safeParse(input);if(!checked.success)throw new ParkingError('configuration');const config=checked.data;
  return {async getPage(pageNo:number,signal?:AbortSignal){
    if(!Number.isInteger(pageNo)||pageNo<1||pageNo>config.maxPages)throw new ParkingError('incomplete');
    if(!config.serviceKey)throw new ParkingError('unconfigured');let key=config.serviceKey;
    try{if(key.includes('%'))key=decodeURIComponent(key);}catch{throw new ParkingError('invalid-key');}
    if(!/^[A-Za-z0-9+/=._-]+$/.test(key))throw new ParkingError('invalid-key');
    const url=new URL(config.operation,config.baseUrl);url.search=new URLSearchParams({ServiceKey:key,resultType:'json',pageNo:String(pageNo),numOfRows:String(config.pageSize)}).toString();
    const timeout=AbortSignal.timeout(config.timeoutMs);const combined=signal?AbortSignal.any([signal,timeout]):timeout;
    try{
      combined.throwIfAborted();const response=await fetcher(url,{signal:combined,redirect:'error',headers:{Accept:'application/json'}});
      if(!response.ok){await response.body?.cancel();const retry=response.headers.get('retry-after');
        const seconds=retry&&/^\d+$/.test(retry)?Number(retry):retry?Math.max(0,Math.ceil((Date.parse(retry)-now())/1000)):null;
        throw new ParkingError(response.status===429?'rate-limited':[401,403].includes(response.status)?'authentication':'http',seconds!==null&&Number.isFinite(seconds)?Math.min(seconds,86400):null);}
      const text=await boundedText(response,config.maxResponseBytes);combined.throwIfAborted();
      if([key,config.serviceKey,encodeURIComponent(key)].some(secret=>text.includes(secret)))throw new ParkingError('invalid-response');
      let value:unknown;try{value=JSON.parse(text);}catch{const reason=text.match(/<returnReasonCode>\s*(\d+)\s*<\/returnReasonCode>/)?.[1];throw new ParkingError(reason&&['30','31','32'].includes(reason)?'authentication':reason&&['20','22'].includes(reason)?'rate-limited':'invalid-response');}
      const page=parseParkingPage(value);if(page.pageNo!==pageNo||page.numOfRows!==config.pageSize||page.rows.length>config.pageSize)throw new ParkingError('invalid-response');
      return {...page,fetchedAt:new Date(now()).toISOString()};
    }catch(error){if(signal?.aborted)throw new ParkingError('aborted');if(error instanceof ParkingError)throw error;throw new ParkingError(timeout.aborted?'timeout':'network');}
  }};
}
