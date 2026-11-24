import {createHash} from 'node:crypto';
import {z} from 'zod';
import {CoursePointSchema,type CoursePoint,type CourseRoute} from '@trip-fit/domain';
import type {CourseCatalog} from '../config/courses.js';
import {COURSE_MAP_CONFIG} from '../config/course-routes.js';
import type {ParkingAnchor} from '../config/parking-directory.js';
export function courseWaypoints(item:CourseCatalog['items'][number],anchors:ReadonlyMap<string,ParkingAnchor>){
 return item.steps.map(step=>step.kind==='note'?null:anchors.get(step.kind+':'+step.id)?.coordinates??null);
}
export function courseRouteFingerprint(item:CourseCatalog['items'][number],points:(CoursePoint|null)[]){
 return createHash('sha256').update(JSON.stringify({mode:item.mode,stops:item.steps.map(s=>s.kind==='note'?{kind:s.kind}:{kind:s.kind,id:s.id}),points})).digest('hex');
}
const OsrmSchema=z.object({code:z.literal('Ok'),waypoints:z.array(z.object({distance:z.number().min(0).max(COURSE_MAP_CONFIG.maxSnapMeters)})),routes:z.array(z.object({distance:z.number().nonnegative(),duration:z.number().nonnegative(),geometry:z.object({type:z.literal('LineString'),coordinates:z.array(z.tuple([z.number(),z.number()])).min(2).max(30000)}),legs:z.array(z.object({distance:z.number().nonnegative(),duration:z.number().nonnegative()}))})).min(1)});
export function parseCourseRoadRoute(input:unknown,points:CoursePoint[],mode:CourseRoute['mode'],collectedAt:string):CourseRoute{
 const parsed=OsrmSchema.parse(input),route=parsed.routes[0];
 if(!route||parsed.waypoints.length!==points.length||route.legs.length!==points.length-1)throw new Error('Route waypoint/leg mismatch');
 const geometry=route.geometry.coordinates.map(([lng,lat])=>CoursePointSchema.parse({lat,lng}));
 if(points.some(point=>!geometry.some(p=>Math.hypot((p.lat-point.lat)*111000,(p.lng-point.lng)*91000)<=350)))throw new Error('Route geometry does not visit every source point');
 if(route.distance>150000||Math.abs(route.legs.reduce((s,l)=>s+l.distance,0)-route.distance)>2)throw new Error('Implausible route length');
 return {status:'road-route',mode,distanceMeters:route.distance,durationSeconds:route.duration,collectedAt,sourceUrl:COURSE_MAP_CONFIG.sourceUrl,geometry,legs:route.legs.map(l=>({distanceMeters:l.distance,durationSeconds:l.duration}))};
}
export function referenceCourseRoute(mode:CourseRoute['mode']):CourseRoute{return {status:'reference',mode,distanceMeters:null,durationSeconds:null,collectedAt:null,sourceUrl:COURSE_MAP_CONFIG.sourceUrl,geometry:[],legs:[]};}
