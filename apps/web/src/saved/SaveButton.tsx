import type { Locale } from '@trip-fit/domain';
import type { SavedTarget } from './store.js';
import { savedStore,useSaved } from './useSaved.js';
import { getSavedCopy } from '../i18n/saved.js';
export function SaveButton({target,locale,inline=false}:{target:SavedTarget;locale:Locale;inline?:boolean}){
 const {entries}=useSaved();const copy=getSavedCopy(locale);const active=entries.some(entry=>entry.kind===target.kind&&entry.id===target.id);
 return <button type="button" className={'save-button'+(inline?' save-inline':'')} aria-pressed={active} aria-label={(active?copy.remove:copy.save)+' '+target.title} title={active?copy.remove:copy.save} onClick={()=>savedStore.toggle(target)} data-testid="save-button"><svg width="21" height="21" viewBox="0 0 24 24" fill={active?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>{inline&&<span>{active?copy.remove:copy.save}</span>}</button>;
}
export function SavedNotice({locale}:{locale:Locale}){const {problem}=useSaved();const copy=getSavedCopy(locale);return problem?<div className="saved-notice section-wrap" role="alert"><p>{copy[problem]}</p><button onClick={()=>savedStore.refresh()}>{copy.retry}</button>{problem==='corrupt'&&<button onClick={()=>{if(window.confirm(copy.confirm))savedStore.reset();}}>{copy.reset}</button>}</div>:null;}
