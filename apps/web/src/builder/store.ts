import{z}from'zod';import{BuilderDraftRefsSchema,appendBuilderRefs,type BuilderDraftRef}from'@trip-fit/domain';
export const BUILDER_KEY='dallabusan.course-builder.v1';
const FileSchema=z.strictObject({version:z.literal(1),refs:BuilderDraftRefsSchema,savedAt:z.iso.datetime()});
type Port=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type Problem='corrupt'|'unavailable'|'conflict'|'limit'|null;
type Snapshot={refs:BuilderDraftRef[];savedAt:string|null;dirty:boolean;problem:Problem};
export function createBuilderStore(storage:()=>Port,now=()=>new Date().toISOString()){
 let initialized=false,baseline:string|null|undefined;let snapshot:Snapshot={refs:[],savedAt:null,dirty:false,problem:null};const listeners=new Set<()=>void>();const emit=()=>{for(const listener of listeners)listener();};
 function load(){initialized=true;try{const raw=storage().getItem(BUILDER_KEY);if(raw===null){baseline=null;snapshot={refs:[],savedAt:null,dirty:false,problem:null};return;}if(raw.length>15000)throw Error('corrupt');const input:unknown=JSON.parse(raw),parsed=FileSchema.safeParse(input);if(!parsed.success)throw Error('corrupt');baseline=raw;snapshot={refs:parsed.data.refs,savedAt:parsed.data.savedAt,dirty:false,problem:null};}catch(error){snapshot={...snapshot,problem:error instanceof SyntaxError||error instanceof Error&&error.message==='corrupt'?'corrupt':'unavailable'};}initialized=true;}
 function save(){if(snapshot.problem==='corrupt'||snapshot.problem==='conflict'){emit();return;}try{const raw=storage().getItem(BUILDER_KEY);if(baseline===undefined&&raw===null)baseline=null;if(raw!==baseline){snapshot={...snapshot,problem:'conflict',dirty:true};emit();return;}const savedAt=now(),file=FileSchema.parse({version:1,refs:snapshot.refs,savedAt}),next=JSON.stringify(file);storage().setItem(BUILDER_KEY,next);baseline=next;snapshot={refs:file.refs,savedAt,dirty:false,problem:null};}catch{snapshot={...snapshot,dirty:true,problem:'unavailable'};}emit();}
 function change(refs:BuilderDraftRef[]){if(!initialized)load();const parsed=BuilderDraftRefsSchema.safeParse(refs);if(!parsed.success){snapshot={...snapshot,problem:'limit'};emit();return;}snapshot={...snapshot,refs:parsed.data,dirty:true,problem:snapshot.problem==='limit'?null:snapshot.problem};save();}
 return {getSnapshot(){if(!initialized)load();return snapshot;},subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},save,
 add(refs:BuilderDraftRef[]){if(!initialized)load();const result=appendBuilderRefs(snapshot.refs,refs);if(result.limit){snapshot={...snapshot,problem:'limit'};emit();return 'limit';}if(result.added===0)return 'duplicate';change(result.refs);return 'added';},
 replaceAt(index:number,ref:BuilderDraftRef){if(!initialized)load();if(index<0||index>=snapshot.refs.length)return 'limit';if(snapshot.refs.some((row,i)=>i!==index&&row.kind===ref.kind&&row.id===ref.id))return 'duplicate';const refs=[...snapshot.refs];refs[index]=ref;change(refs);return 'replaced';},
 replace(refs:BuilderDraftRef[]){change(refs);},
 remove(index:number){if(!initialized)load();change(snapshot.refs.filter((_,i)=>i!==index));},move(index:number,offset:number){if(!initialized)load();const refs=[...snapshot.refs],target=index+offset;if(target<0||target>=refs.length)return;const value=refs[index],other=refs[target];if(!value||!other)return;refs[index]=other;refs[target]=value;change(refs);},
 refresh(){if(snapshot.dirty){snapshot={...snapshot,problem:'conflict'};emit();return;}load();emit();},
 reset(){try{storage().removeItem(BUILDER_KEY);baseline=null;initialized=true;snapshot={refs:[],savedAt:null,dirty:false,problem:null};}catch{snapshot={...snapshot,problem:'unavailable'};}emit();},
 reload(){load();emit();}};
}
