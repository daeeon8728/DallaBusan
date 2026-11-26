export interface WorkerEnv {
  ASSETS: {fetch(request:Request):Promise<Response>};
  API_ORIGIN:string;
  GOOGLE_MAPS_EMBED_API_KEY?:string;
}
export function apiOrigin(env:WorkerEnv,incoming:URL){
 const target=new URL(env.API_ORIGIN);
 const local=['127.0.0.1','localhost','[::1]'].includes(target.hostname);
 if((target.protocol!=='https:'&&!(target.protocol==='http:'&&local))||target.username||target.password||target.pathname!=='/'||target.search||target.hash||target.origin===incoming.origin)throw Error('Invalid API origin');
 return target.origin;
}
export function embedKey(env:WorkerEnv){const value=env.GOOGLE_MAPS_EMBED_API_KEY?.trim()??'';return /^[A-Za-z0-9_-]{30,100}$/.test(value)?value:null;}
export const GOOGLE_EMBED_PLACE='https://www.google.com/maps/embed/v1/place';
