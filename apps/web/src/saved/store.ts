import { z } from 'zod';
export const SAVED_KEY = 'dallabusan.saved.v1';
export const SAVED_LIMIT = 200;
export const SavedEntrySchema = z.strictObject({ kind: z.enum(['destination','food','offer']), id: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/), title: z.string().min(1).max(500), savedAt: z.iso.datetime() });
const SavedFileSchema = z.strictObject({ version:z.literal(1), entries:z.array(SavedEntrySchema).max(SAVED_LIMIT) }).refine(file=>new Set(file.entries.map(entry=>entry.kind+':'+entry.id)).size===file.entries.length);
export type SavedEntry = z.infer<typeof SavedEntrySchema>;
export type SavedTarget = Pick<SavedEntry,'kind'|'id'|'title'>;
type StoragePort = Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type Problem = 'unavailable'|'corrupt'|'limit'|null;
export function createSavedStore(storage:()=>StoragePort, now=()=>new Date().toISOString()) {
  let initialized=false;
  let snapshot:{entries:SavedEntry[];problem:Problem}={entries:[],problem:null};
  const listeners=new Set<()=>void>();
  function emit(){for(const listener of listeners)listener();}
  function read(){
    try{const raw=storage().getItem(SAVED_KEY);if(raw===null)return {entries:[],problem:null};if(raw.length>200000)return {entries:snapshot.entries,problem:'corrupt' as const};
      const input:unknown=JSON.parse(raw);const parsed=SavedFileSchema.safeParse(input);return parsed.success?{entries:parsed.data.entries,problem:null}:{entries:snapshot.entries,problem:'corrupt' as const};
    }catch(error){return {entries:snapshot.entries,problem:error instanceof SyntaxError?'corrupt' as const:'unavailable' as const};}
  }
  return {
    getSnapshot(){if(!initialized){snapshot=read();initialized=true;}return snapshot;},
    subscribe(listener:()=>void){listeners.add(listener);return ()=>{listeners.delete(listener);};},
    refresh(){snapshot=read();initialized=true;emit();},
    toggle(target:SavedTarget){
      const parsed=SavedEntrySchema.safeParse({...target,title:target.title.slice(0,500),savedAt:now()});if(!parsed.success)return;
      initialized=true;
      const current=read();if(current.problem){snapshot=current;emit();return;}
      const exists=current.entries.some(entry=>entry.kind===target.kind&&entry.id===target.id);
      if(!exists&&current.entries.length>=SAVED_LIMIT){snapshot={...current,problem:'limit'};emit();return;}
      const entries=exists?current.entries.filter(entry=>entry.kind!==target.kind||entry.id!==target.id):[parsed.data,...current.entries];
      try{storage().setItem(SAVED_KEY,JSON.stringify({version:1,entries}));snapshot={entries,problem:null};}
      catch{snapshot={entries:current.entries,problem:'unavailable'};}
      initialized=true;emit();
    },
    reset(){try{storage().removeItem(SAVED_KEY);snapshot={entries:[],problem:null};}catch{snapshot={...snapshot,problem:'unavailable'};}initialized=true;emit();},
  };
}
