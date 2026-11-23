import { readFileSync } from 'node:fs';
import { ParkingDirectorySnapshotSchema,type ParkingDirectorySnapshot,type GuideSnapshot } from '@trip-fit/domain';
import type { DestinationConfig } from './destinations.js';
import { RouteAttractionSourcesSchema } from './theme-routes.js';
import { normalizeParkingDirectory } from '../services/normalize-parking-directory.js';
export const PARKING_DIRECTORY_SOURCE={url:'https://www.data.go.kr/data/15012896/standard.do',licenseUrl:'https://www.data.go.kr/ugs/selectPortalPolicyView.do',headerUrl:'https://www.data.go.kr/download/columList.json?pk=15012896&ext=JSON',downloadUrl:'https://www.data.go.kr/download/standard.json',table:'tn_pubr_prkplce_info_svc',pageSize:10000,maxRows:100000,maxResponseBytes:32000000,timeoutMs:30000} as const;
export function parkingDirectoryPath(){return new URL('../../../../config/catalog/parking-directory.json',import.meta.url);}
export function validateParkingDirectory(input:unknown){const parsed=ParkingDirectorySnapshotSchema.parse(input);const rebuilt=normalizeParkingDirectory(parsed.input);if(JSON.stringify(parsed)!==JSON.stringify(rebuilt))throw new Error('Parking directory derived output mismatch');return parsed;}
export function loadParkingDirectory():ParkingDirectorySnapshot|null{try{const raw:unknown=JSON.parse(readFileSync(parkingDirectoryPath(),'utf8'));return validateParkingDirectory(raw);}catch(error){if(error instanceof Error&&'code'in error&&error.code==='ENOENT')return null;throw new Error('Invalid parking directory configuration',{cause:error});}}
export function parkingMapUrl(coordinates:{lat:number;lng:number}|null){if(!coordinates)return null;const url=new URL('https://www.google.com/maps/search/');url.search=new URLSearchParams({api:'1',query:coordinates.lat+','+coordinates.lng}).toString();return url.href;}
type Point={lat:number;lng:number};
export interface ParkingAnchor {status:'available'|'ambiguous'|'unavailable';coordinates:Point|null;labels?:string[]}
export function buildParkingAnchors(destinations:DestinationConfig,food:GuideSnapshot|null,attractions:ReturnType<typeof RouteAttractionSourcesSchema.parse>){
 const anchors=new Map<string,ParkingAnchor>();const resolve=(values:(Point|null)[]):ParkingAnchor=>{const points=values.filter((point):point is Point=>point!==null);const first=points[0];if(!first)return {status:'unavailable',coordinates:null};if(points.some(point=>Math.abs(point.lat-first.lat)>0.00001||Math.abs(point.lng-first.lng)>0.00001))return {status:'ambiguous',coordinates:null};return {status:'available',coordinates:first};};
 for(const destination of destinations.destinations){const ids=[...new Set(destination.translations.map(text=>text.sourceId))];anchors.set('destination:'+destination.slug,{...(ids.length!==1?{status:'ambiguous' as const,coordinates:null}:resolve(attractions.records.filter(row=>row.record.sourceId===ids[0]).map(row=>row.record.coordinates))),labels:[...destination.aliases,...destination.translations.map(text=>text.name)]});}
 if(food){const ids=new Set(food.languages.flatMap(group=>group.records.map(row=>row.id)));for(const id of ids)anchors.set('food:'+id,resolve(food.languages.flatMap(group=>group.records.filter(row=>row.id===id).map(row=>row.coordinates))));}
 return anchors;
}
export function loadParkingAttractions(){try{const raw:unknown=JSON.parse(readFileSync(new URL('../../../../config/catalog/route-attraction-sources.json',import.meta.url),'utf8'));return RouteAttractionSourcesSchema.parse(raw);}catch{throw new Error('Invalid parking anchor sources');}}
