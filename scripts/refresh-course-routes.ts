import {writeFile,rename} from 'node:fs/promises';
import {loadCourseCatalog} from '../apps/server/src/config/courses.js';
import {loadDestinationConfig} from '../apps/server/src/config/destinations.js';
import {loadGuideSnapshot} from '../apps/server/src/config/guides.js';
import {buildParkingAnchors,loadParkingAttractions} from '../apps/server/src/config/parking-directory.js';
import {COURSE_MAP_CONFIG,courseRoutesPath,loadCourseRoutes,CourseRouteSnapshotSchema,type CourseRouteSnapshot} from '../apps/server/src/config/course-routes.js';
import {courseRouteFingerprint,courseWaypoints,parseCourseRoadRoute} from '../apps/server/src/services/course-routing.js';
const config=loadCourseCatalog();
if(config.items.length!==40)throw new Error('Expected 40 source-checked courses; review source fingerprints first');
const anchors=buildParkingAnchors(loadDestinationConfig(),loadGuideSnapshot('food'),loadParkingAttractions());
const prior=loadCourseRoutes(),items:CourseRouteSnapshot['items']=[];
let calls=0;
for(const item of config.items){
 const points=courseWaypoints(item,anchors),fingerprint=courseRouteFingerprint(item,points);
 const cached=prior.items.find(r=>r.id===item.id&&r.fingerprint===fingerprint);
 if(cached){items.push(cached);continue;}
 if(points.some(p=>!p)){console.error(item.id+': ambiguous or missing coordinate; reference only');continue;}
 const resolved=points.filter(p=>p!==null);
 if(calls>0)await new Promise(resolve=>setTimeout(resolve,COURSE_MAP_CONFIG.intervalMs));
 const path=(item.mode==='walking'?'routed-foot':'routed-car')+'/route/v1/driving/'+resolved.map(p=>p.lng+','+p.lat).join(';');
 const url=new URL(path,COURSE_MAP_CONFIG.routingBase);url.search=new URLSearchParams({overview:'full',geometries:'geojson',steps:'false'}).toString();
 calls++;
 try{
  const response=await fetch(url,{headers:{'User-Agent':COURSE_MAP_CONFIG.userAgent},signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const input:unknown=await response.json(),route=parseCourseRoadRoute(input,resolved,item.mode,new Date().toISOString());
  items.push({id:item.id,fingerprint,route});console.log(item.id+' '+item.mode+' '+Math.round(route.distanceMeters??0)+'m '+Math.round((route.durationSeconds??0)/60)+'min');
 }catch(error){console.error(item.id+': '+(error instanceof Error?error.message:'Routing unavailable'));}
}
const snapshot=CourseRouteSnapshotSchema.parse({version:1,items});
const path=courseRoutesPath(),temp=new URL('course-routes.json.next',path);
await writeFile(temp,JSON.stringify(snapshot)+'\n');await rename(temp,path);
console.log(JSON.stringify({courses:config.items.length,roadRoutes:items.length,reference:config.items.length-items.length,calls}));
if(items.length!==config.items.length)process.exitCode=1;
