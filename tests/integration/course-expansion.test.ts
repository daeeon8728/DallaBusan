import{it,expect}from'vitest';
import{readFileSync}from'node:fs';
import{CourseExpansionSchema,selectCourseExpansion,loadCourseExpansion}from'../../apps/server/src/config/course-expansion.js';
import{loadCourseSourceRows}from'../../apps/server/src/config/courses.js';
it('pins all 100 distinct source-backed recipes and keeps 80 short / 20 long with optional meals',()=>{
 const data=loadCourseExpansion();expect(data.items).toHaveLength(100);expect(data.items.filter(i=>i.band==='short')).toHaveLength(80);expect(data.items.filter(i=>i.band==='long')).toHaveLength(20);expect(data.sources.some(s=>s.role==='restaurant')).toBe(false);
 for(const row of data.items){const minutes=row.visits.reduce((s,v)=>s+v.minutes,0);expect(row.band==='short'?minutes<300:minutes>=300).toBe(true);for(const [locale,title]of Object.entries(row.titles)){expect(title.length).toBeGreaterThan(3);if(locale!=='ko')expect(title).not.toMatch(/[가-힣]/);}}
});
it('withholds every affected whole recipe on changed evidence and rejects duplicate identities or reversed stop sets',()=>{
 const input=CourseExpansionSchema.parse(JSON.parse(readFileSync('config/catalog/course-expansion.json','utf8'))),rows=new Map(loadCourseSourceRows()),first=input.items[0];if(!first)throw Error('No recipe');const ref=first.visits[0]?.ref;if(!ref)throw Error('No source');rows.set(ref.kind+':'+ref.id,{changed:true});const data=selectCourseExpansion(input,rows);expect(data.items).toHaveLength(input.items.filter(i=>!i.visits.some(v=>v.ref.kind===ref.kind&&v.ref.id===ref.id)).length);expect(data.items.some(i=>i.id===first.id)).toBe(false);
 const duplicate=structuredClone(input);duplicate.items[1]={...first,id:'edit-999',visits:[...first.visits].reverse()};expect(()=>selectCourseExpansion(duplicate,loadCourseSourceRows())).toThrow('Duplicate');const duplicateId=structuredClone(input);if(!duplicateId.items[1])throw Error('No second');duplicateId.items[1].id=first.id;expect(()=>selectCourseExpansion(duplicateId,loadCourseSourceRows())).toThrow('Duplicate');
});
