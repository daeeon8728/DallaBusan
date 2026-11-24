import {describe,it,expect} from 'vitest';
import {courseRouteFingerprint,parseCourseRoadRoute} from '../../apps/server/src/services/course-routing.js';
import {loadCourseCatalog} from '../../apps/server/src/config/courses.js';
const points=[{lat:35.15,lng:129.11},{lat:35.16,lng:129.12}];
function response(){return {code:'Ok',waypoints:[{distance:10},{distance:20}],routes:[{distance:1500,duration:1200,geometry:{type:'LineString',coordinates:[[129.11,35.15],[129.12,35.16]]},legs:[{distance:1500,duration:1200}]}]};}
describe('offline course road snapshot integrity',()=>{
 it('accepts a complete routed response and preserves modeled rather than live values',()=>{const route=parseCourseRoadRoute(response(),points,'walking','2026-11-24T00:00:00.000Z');expect(route.status).toBe('road-route');expect(route.legs).toHaveLength(1);expect(route.durationSeconds).toBe(1200);});
 it('rejects missing legs, distant snaps, implausible or disconnected geometry and non-Ok responses',()=>{
 const noLegs=response();noLegs.routes[0]?.legs.pop();expect(()=>parseCourseRoadRoute(noLegs,points,'walking','2026-11-24T00:00:00.000Z')).toThrow();
 const far=response();if(far.waypoints[0])far.waypoints[0].distance=301;expect(()=>parseCourseRoadRoute(far,points,'walking','2026-11-24T00:00:00.000Z')).toThrow();
 const wrong=response();if(wrong.routes[0])wrong.routes[0].geometry.coordinates=[[129.8,35.5],[129.9,35.6]];expect(()=>parseCourseRoadRoute(wrong,points,'walking','2026-11-24T00:00:00.000Z')).toThrow('every source point');
 expect(()=>parseCourseRoadRoute({code:'NoRoute'},points,'walking','2026-11-24T00:00:00.000Z')).toThrow();
 });
 it('invalidates cached geometry after a coordinate, identity, order or mode change',()=>{
 const item=loadCourseCatalog().items[0];if(!item)throw Error('No course');
 const hash=courseRouteFingerprint(item,points);
 expect(courseRouteFingerprint(item,[...points].reverse())).not.toBe(hash);
 expect(courseRouteFingerprint({...item,mode:item.mode==='walking'?'driving':'walking'},points)).not.toBe(hash);
 expect(courseRouteFingerprint({...item,steps:[...item.steps].reverse()},points)).not.toBe(hash);
 expect(courseRouteFingerprint(item,[null,points[1]??null])).not.toBe(hash);
 });
});
