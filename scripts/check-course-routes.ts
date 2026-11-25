import {loadCourseCatalog} from '../apps/server/src/config/courses.js';
import {loadCourseRoutes} from '../apps/server/src/config/course-routes.js';
import {loadDestinationConfig} from '../apps/server/src/config/destinations.js';
import {loadGuideSnapshot} from '../apps/server/src/config/guides.js';
import {buildParkingAnchors,loadParkingAttractions} from '../apps/server/src/config/parking-directory.js';
import {courseWaypoints,courseRouteFingerprint} from '../apps/server/src/services/course-routing.js';
const catalog=loadCourseCatalog(),snapshot=loadCourseRoutes();
const anchors=buildParkingAnchors(loadDestinationConfig(),loadGuideSnapshot('food'),loadParkingAttractions());
if(catalog.items.length!==50||snapshot.items.length!==50||new Set(snapshot.items.map(x=>x.id)).size!==50)throw Error('Expected fifty distinct courses/routes');
for(const course of catalog.items){
 const points=courseWaypoints(course,anchors),cached=snapshot.items.find(x=>x.id===course.id);
 if(course.steps.some(s=>s.kind==='note')||points.some(p=>!p)||!course.intro||!course.tips)throw Error('Incomplete course '+course.id);
 if(!cached||cached.fingerprint!==courseRouteFingerprint(course,points)||cached.route.mode!==course.mode||cached.route.legs.length!==course.steps.length-1)throw Error('Stale route '+course.id);
 const route=cached.route;
 if(Math.abs(route.legs.reduce((sum,leg)=>sum+leg.distanceMeters,0)-(route.distanceMeters??0))>2)throw Error('Distance mismatch '+course.id);
 for(const point of points)if(point&&!route.geometry.some(p=>Math.hypot((p.lat-point.lat)*111000,(p.lng-point.lng)*91000)<=350))throw Error('Geometry misses stop '+course.id);
}
console.log(JSON.stringify({courses:catalog.items.length,roadRoutes:snapshot.items.length,sourceIdentities:catalog.sources.length,placeholderStops:0,externalCalls:0}));
