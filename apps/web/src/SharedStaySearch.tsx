import {useEffect,useRef,useState} from 'react';
import {StaySearchOptionsSchema,StaySearchResponseSchema,StayCriteriaSchema,validateStayCriteria,addStayDays,type StaySearchResponse,type StayCriteria,type Locale} from '@trip-fit/domain';
import {useGuideRequest} from './hooks/useGuideRequest.js';
import {getStaySearchCopy} from './i18n/stay-search.js';
import './shared-stay-search.css';
type Draft={checkIn:string;checkOut:string;adults:string;rooms:string;childAges:string[]};
type SearchState={locale:Locale;requestId:number;pending:boolean;failed:boolean;ready:boolean;data:StaySearchResponse|null};
const numbers=(count:number,start=0)=>Array.from({length:count},(_,index)=>index+start);
export function SharedStaySearch({locale}:{locale:Locale}){
 const copy=getStaySearchCopy(locale),optionsRequest=useGuideRequest('/api/stay-search?locale='+locale,StaySearchOptionsSchema,true);
 const options=optionsRequest.value?.locale===locale?optionsRequest.value:null;
 const [draft,setDraft]=useState<Draft|null>(null),[search,setSearch]=useState<SearchState|null>(null),[invalid,setInvalid]=useState(false);
 const [lastLocale,setLastLocale]=useState(locale);
 if(lastLocale!==locale){setLastLocale(locale);setSearch(null);}
 const version=useRef(0),controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>{controller.current?.abort();version.current++;},[locale]);
 const defaults=options?.defaults;
 const values=draft??(defaults?{checkIn:defaults.checkIn,checkOut:defaults.checkOut,adults:String(defaults.adults),rooms:String(defaults.rooms),childAges:defaults.childAges.map(String)}:null);
 const candidate=values?StayCriteriaSchema.safeParse({...values,adults:Number(values.adults),rooms:Number(values.rooms),childAges:values.childAges.map(value=>value===''?NaN:Number(value))}):null;
 const pending=search?.locale===locale&&search.pending;
 const current=Boolean(search?.data&&search.locale===locale&&search.ready&&!search.pending&&!search.failed&&candidate?.success&&JSON.stringify(candidate.data)===JSON.stringify(search.data.criteria));
 function edit(next:Draft){controller.current?.abort();version.current++;setDraft(next);setInvalid(false);setSearch(previous=>previous?{...previous,pending:false,failed:false,ready:false}:null);}
 async function apply(){
  if(!values||!options)return;
  let criteria:StayCriteria;try{criteria=validateStayCriteria({...values,adults:Number(values.adults),rooms:Number(values.rooms),childAges:values.childAges.map(value=>value===''?NaN:Number(value))},options.today);}catch{setInvalid(true);return;}
  setInvalid(false);controller.current?.abort();const abort=new AbortController();controller.current=abort;const requestId=++version.current;
  setSearch(previous=>({locale,requestId,pending:true,failed:false,ready:false,data:previous?.data??null}));
  try{
   const response=await fetch('/api/stay-search',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},signal:abort.signal,body:JSON.stringify({locale,criteria})});
   if(!response.ok)throw Error('Search links unavailable');const raw:unknown=await response.json(),data=StaySearchResponseSchema.parse(raw);
   if(data.locale!==locale||JSON.stringify(data.criteria)!==JSON.stringify(criteria)||data.items.some(item=>!options.partners.some(partner=>partner.id===item.id&&partner.provider.id===item.provider.id)))throw Error('Search response changed');
   if(!abort.signal.aborted&&version.current===requestId)setSearch({locale,requestId,pending:false,failed:false,ready:true,data});
  }catch{if(!abort.signal.aborted&&version.current===requestId)setSearch(previous=>({locale,requestId,pending:false,failed:true,ready:false,data:previous?.data??null}));}
 }
 const displayDate=(date:string)=>new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'));
 return <section className="shared-stay-search" data-testid="shared-stay-search" aria-labelledby="shared-stay-title"><header><p className="eyebrow blue">BUSAN / STAY TOGETHER</p><h2 id="shared-stay-title">{copy.title}</h2><p>{copy.intro}</p></header>
  {optionsRequest.error&&<div role="alert"><p>{copy.failed}</p><button onClick={optionsRequest.retry}>{copy.retry}</button></div>}{!options&&optionsRequest.pending&&<p role="status">{copy.loading}</p>}
  {options&&values&&<><form className="shared-stay-form" aria-busy={pending} onSubmit={event=>{event.preventDefault();void apply();}}><div className="shared-stay-fields">
   <label>{copy.checkIn}<input type="date" required value={values.checkIn} min={options.today} max={options.latestCheckIn} onChange={event=>{const date=event.target.value;edit({...values,checkIn:date,checkOut:date&&values.checkOut<=date?addStayDays(date,1):values.checkOut});}}/></label>
   <label>{copy.checkOut}<input type="date" required value={values.checkOut} min={values.checkIn?addStayDays(values.checkIn,1):options.today} max={values.checkIn?addStayDays(values.checkIn,30):undefined} onChange={event=>edit({...values,checkOut:event.target.value})}/></label>
   <label>{copy.adults}<select value={values.adults} onChange={event=>edit({...values,adults:event.target.value})}>{numbers(8,1).map(number=><option key={number} value={number}>{number}</option>)}</select></label>
   <label>{copy.rooms}<select value={values.rooms} onChange={event=>edit({...values,rooms:event.target.value})}>{numbers(4,1).map(number=><option key={number} value={number}>{number}</option>)}</select></label>
   <label>{copy.children}<select value={values.childAges.length} onChange={event=>{const length=Number(event.target.value);edit({...values,childAges:numbers(length).map(index=>values.childAges[index]??'')});}}>{numbers(5).map(number=><option key={number} value={number}>{number}</option>)}</select></label>
  </div>{values.childAges.length>0&&<div className="shared-child-ages">{values.childAges.map((age,index)=><label key={index}>{copy.age.replace('{n}',String(index+1))}<select required value={age} onChange={event=>edit({...values,childAges:values.childAges.map((value,i)=>i===index?event.target.value:value)})}><option value="">{copy.choose}</option>{numbers(18).map(number=><option key={number} value={number}>{number===0?copy.underOne:number}</option>)}</select></label>)}</div>}
  <div className="shared-stay-submit"><span>{copy.limits}<br/>{copy.currency}: <strong>{options.currency}</strong></span><button className="primary-button" type="submit" disabled={pending||options.partners.length===0}>{pending?copy.applying:copy.apply}</button></div>
  {invalid&&<p role="alert">{copy.invalid}</p>}{search?.locale===locale&&search.failed&&<div role="alert"><p>{copy.failed}</p><button type="button" onClick={()=>void apply()}>{copy.retry}</button></div>}
  </form>
  {current&&search?.data?<div className="shared-applied" role="status"><strong>{copy.ready}</strong><p>{displayDate(search.data.criteria.checkIn)} → {displayDate(search.data.criteria.checkOut)} · {copy.adults}: {search.data.criteria.adults} · {copy.rooms}: {search.data.criteria.rooms} · {copy.children}: {search.data.criteria.childAges.length}{search.data.criteria.childAges.length>0?' ('+search.data.criteria.childAges.join(', ')+')':''}</p></div>:search?.data&&!pending&&<p role="status">{copy.changed}</p>}
  {options.partners.length===0&&<p role="status">{copy.empty}</p>}<div className="shared-stay-results">{options.partners.map(partner=>{const result=current?search?.data?.items.find(item=>item.id===partner.id):null;return <article className="shared-stay-result" data-testid="shared-stay-result" key={partner.id}><p className="eyebrow blue">{partner.provider.displayName}</p><h3>{copy.readyFor}</h3>{result?<a className="primary-button" data-testid="shared-stay-link" href={result.href} target="_blank" rel="sponsored noopener noreferrer">{copy.search.replace('{provider}',partner.provider.displayName)} ↗</a>:<button className="primary-button" disabled>{copy.disabled}</button>}</article>;})}</div>
  <p className="shared-stay-note">{copy.note}</p></>}
 </section>;
}
