import {MapLinksSchema,type BuilderRef,type Locale} from '@trip-fit/domain';
import type {z} from 'zod';
import type {MapModeSchema} from '@trip-fit/domain';
import {MAP_LINK_ENDPOINTS,type MapLinkConfig} from '../config/map-links.js';
import type {DestinationService} from './destinations.js';
import type {GuideService} from './guides.js';
import type {ParkingAnchor} from '../config/parking-directory.js';
export function createMapLinkService(config:MapLinkConfig,destinations:DestinationService,guides:GuideService,anchors:ReadonlyMap<string,ParkingAnchor>){
 return {links(refs:BuilderRef[],locale:Locale,mode:z.infer<typeof MapModeSchema>){
  const stops=refs.map((ref,i)=>{const d=ref.kind==='destination'?destinations.get(ref.id,locale):null,f=ref.kind==='food'?guides.get('food',ref.id,locale):null;if(!d&&!f)return null;const name=d?.destination.name??f?.item.name??'',address=d?.destination.address??f?.item.address??'',coordinates=anchors.get(ref.kind+':'+ref.id)?.coordinates??null,point=coordinates?coordinates.lat+','+coordinates.lng:null;const search=new URL(MAP_LINK_ENDPOINTS.search);search.search=new URLSearchParams({api:'1',query:point??name+' '+address+' Busan South Korea'}).toString();let embedUrl:string|null=null;if(config.embedKey){const embed=new URL(MAP_LINK_ENDPOINTS.embed);embed.search=new URLSearchParams({key:config.embedKey,q:point??name+' '+address+' Busan South Korea',language:locale}).toString();embedUrl=embed.href;}return{name,position:i+1,searchUrl:search.href,embedUrl,point};});
  if(stops.some(s=>!s))return null;const all=stops.filter(s=>s!==null),missing=all.some(s=>!s.point),parts:Array<{from:number;to:number;url:string}>=[],legs:Array<{from:number;to:number;url:string}>=[];
  function directions(from:number,to:number){const points=all.slice(from,to+1).flatMap(s=>s.point?[s.point]:[]),first=points[0],last=points.at(-1);if(points.length!==to-from+1||!first||!last)return null;const url=new URL(MAP_LINK_ENDPOINTS.directions);url.search=new URLSearchParams({api:'1',origin:first,destination:last,...mode!=='recommended'?{travelmode:mode}:{},...points.length>2?{waypoints:points.slice(1,-1).join('|')}:{}}).toString();return url.href.length<=2048?{from:from+1,to:to+1,url:url.href}:null;}
  if(!missing){for(let i=0;i<all.length-1;i++){const row=directions(i,i+1);if(row)legs.push(row);}for(let i=0;i<all.length-1;i+=4){const row=directions(i,Math.min(i+4,all.length-1));if(row)parts.push(row);}}
  return MapLinksSchema.parse({locale,mode,embedEnabled:Boolean(config.embedKey),stops:all.map(s=>({name:s.name,position:s.position,searchUrl:s.searchUrl,embedUrl:s.embedUrl})),parts:mode==='transit'?legs:parts,legs,missingCoordinates:missing});
 }};
}
export type MapLinkService=ReturnType<typeof createMapLinkService>;
