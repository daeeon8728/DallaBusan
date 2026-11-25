import{createRuntimeApp}from'../apps/server/src/runtime.js';
import{loadCourseExpansion}from'../apps/server/src/config/course-expansion.js';
import{BuilderCatalogSchema,LocaleSchema,builderPlaceKey,builderDistanceKm}from'@trip-fit/domain';
const input=loadCourseExpansion();if(input.items.length!==100)throw Error('Changed source evidence');
const app=await createRuntimeApp({readOnlySnapshot:true});
let maxShortReferenceKm=0;try{for(const locale of LocaleSchema.options){
 const response=await app.inject('/api/course-builder?locale='+locale);if(response.statusCode!==200)throw Error('Catalog unavailable');const data=BuilderCatalogSchema.parse(response.json()),places=new Map(data.places.map(p=>[builderPlaceKey(p),p]));
 if(data.modules.length!==174||data.places.length!==200||data.modules.filter(m=>m.origin==='original').length!==50||data.modules.filter(m=>m.origin==='shortened').length!==24)throw Error('Existing courses lost');
 const curated=data.modules.filter(m=>m.origin==='curated');if(curated.length!==100||curated.filter(m=>m.band==='short').length!==80||curated.filter(m=>m.band==='long').length!==20)throw Error('Wrong recipe split');
 const sets=new Set(data.modules.filter(m=>m.origin!=='curated').map(m=>m.refs.filter(r=>places.get(builderPlaceKey(r))?.role!=='restaurant').map(builderPlaceKey).sort().join('|')));
 for(const module of curated){const signature=module.refs.map(builderPlaceKey).sort().join('|');if(sets.has(signature))throw Error('Repeated route '+module.id);sets.add(signature);let distance=0;
 for(const [index,ref]of module.refs.entries()){const place=places.get(builderPlaceKey(ref));if(!place?.coordinates||place.role==='restaurant')throw Error('Missing or forced restaurant '+module.id);if(index){const before=module.refs[index-1],a=before?places.get(builderPlaceKey(before))?.coordinates:null;if(!a)throw Error('Missing point');distance+=builderDistanceKm(a,place.coordinates);}}
 if(module.visits.reduce((s,v)=>s+v.minutes,0)!==module.stayMinutes)throw Error('Visit duration mismatch');
 if(module.band==='short'){if(distance>4||module.stayMinutes>=300)throw Error('Short route outside bounds');maxShortReferenceKm=Math.max(maxShortReferenceKm,distance);}else if(module.stayMinutes<300)throw Error('Long route too short');
 }
 }}finally{await app.close();}
console.log(JSON.stringify({newRecipes:100,short:80,long:20,existing:74,places:200,maxShortReferenceKm,forcedMeals:0,locales:5,externalCalls:0}));
