import {readFileSync} from 'node:fs';
import {z} from 'zod';
import {CourseRouteSchema} from '@trip-fit/domain';
// Fixed keyless services, no client-supplied hosts and no routing at HTTP request time.
export const COURSE_MAP_CONFIG={tileUrl:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',sourceUrl:'https://routing.openstreetmap.de/about.html',routingBase:'https://routing.openstreetmap.de/',userAgent:'DallaBusanCourseReview/1.0 (+https://dallabusan.vercel.app)',intervalMs:1500,maxSnapMeters:300};
export const CourseRouteSnapshotSchema=z.object({version:z.literal(1),items:z.array(z.object({id:z.string(),fingerprint:z.string().regex(/^[a-f0-9]{64}$/),route:CourseRouteSchema.refine(r=>r.status==='road-route'&&r.geometry.length>=2&&r.distanceMeters!==null&&r.durationSeconds!==null&&r.collectedAt!==null)}))});
export type CourseRouteSnapshot=z.infer<typeof CourseRouteSnapshotSchema>;
export function courseRoutesPath(){return new URL('../../../../config/catalog/course-routes.json',import.meta.url);}
export function loadCourseRoutes():CourseRouteSnapshot{try{return CourseRouteSnapshotSchema.parse(JSON.parse(readFileSync(courseRoutesPath(),'utf8')));}catch(error){if(error instanceof Error&&'code'in error&&error.code==='ENOENT')return {version:1,items:[]};throw new Error('Invalid course route snapshot',{cause:error});}}
