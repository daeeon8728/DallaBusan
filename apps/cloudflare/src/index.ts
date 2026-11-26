import {MapLinksSchema} from '@trip-fit/domain';
import {apiOrigin,embedKey,GOOGLE_EMBED_PLACE,type WorkerEnv} from './config.js';
type FetchApi=(request:Request)=>Promise<Response>;
const json=(error:string,status:number)=>Response.json({error},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const privatePath=(path:string)=>path.split('/').some(p=>p.startsWith('.'))||/^\/(?:config|data|docs|var|node_modules|packages|apps|scripts|tests)(?:\/|$)/.test(path);
const publicPage=(path:string)=>path==='/'||/^\/(?:search|courses|places|food|recommended|saved|cart|travel-tools|build-your-day)(?:\/[^.]*)?$/.test(path);

export async function handleRequest(request:Request,env:WorkerEnv,fetchApi:FetchApi=req=>fetch(req)){
 const url=new URL(request.url);let path:string;try{path=decodeURIComponent(url.pathname);}catch{return json('invalid-path',400);}
 if(privatePath(path))return json('not-found',404);
 if(path==='/api/admin'||path.startsWith('/api/admin/'))return json('Cloudflare에서는 관리자 쓰기를 지원하지 않습니다. 영구 AWS 서버를 사용하세요.',503);
 if(path==='/api'||path.startsWith('/api/')){
  if(!['GET','HEAD'].includes(request.method)&&!(request.method==='POST'&&path==='/api/stay-search'))return json('method-not-allowed',405);
  if(request.method==='POST'&&request.headers.has('Origin')&&request.headers.get('Origin')!==url.origin)return json('invalid-origin',403);
  let body:string|undefined;
  if(request.method==='POST'){if(Number(request.headers.get('Content-Length')??0)>2048)return json('request-too-large',413);body=await request.text();if(new TextEncoder().encode(body).byteLength>2048)return json('request-too-large',413);}
  try{
   const upstream=new URL(apiOrigin(env,url));upstream.pathname=url.pathname;upstream.search=url.search;
   // Forward public data only. Owner cookies, authorization and browser-controlled forwarding headers never leave this Worker.
   const headers=new Headers({Accept:request.headers.get('Accept')??'application/json'});if(body!==undefined)headers.set('Content-Type','application/json');
   const response=await fetchApi(new Request(upstream,{method:request.method,headers,...body!==undefined?{body}:{},redirect:'manual',signal:AbortSignal.timeout(15000)}));
   if(response.status>=300&&response.status<400)return json('upstream-redirect-blocked',502);
   const key=embedKey(env);
   if(path==='/api/map-links'&&key&&response.ok&&request.method==='GET'){
    const input:unknown=await response.json(),data=MapLinksSchema.parse(input);
    const stops=data.stops.map(stop=>{const search=new URL(stop.searchUrl);if(search.origin!=='https://www.google.com'||search.pathname!=='/maps/search/'||!search.searchParams.get('query'))throw Error('Invalid map target');const embed=new URL(GOOGLE_EMBED_PLACE);embed.search=new URLSearchParams({key,q:search.searchParams.get('query')??'',language:data.locale}).toString();return{...stop,embedUrl:embed.href};});
    return Response.json({...data,embedEnabled:true,stops},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
   }
   const outgoing=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});for(const name of ['Content-Type','Content-Language','Retry-After']){const value=response.headers.get(name);if(value)outgoing.set(name,value);}
   return new Response(response.body,{status:response.status,headers:outgoing});
  }catch{return json('catalog-api-unavailable',502);}
 }
 if(!['GET','HEAD'].includes(request.method))return json('method-not-allowed',405);
 const admin=path==='/admin'||path==='/admin/'||path==='/admin.html';
 const assetUrl=new URL(request.url);if(admin)assetUrl.pathname='/admin.html';else if(publicPage(path))assetUrl.pathname='/index.html';
 const asset=await env.ASSETS.fetch(new Request(assetUrl,{method:request.method,headers:request.headers}));
 const result=new Response(asset.body,asset);result.headers.set('X-Content-Type-Options','nosniff');
 if(admin){result.headers.set('Cache-Control','no-store');result.headers.set('X-Frame-Options','DENY');result.headers.set('Referrer-Policy','no-referrer');}
 return result;
}
export default {fetch:(request:Request,env:WorkerEnv)=>handleRequest(request,env)};
