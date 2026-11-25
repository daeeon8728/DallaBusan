import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { FoodAssistanceSchema, type FoodAssistance, type Locale } from '@trip-fit/domain';
import { useGuideRequest } from './hooks/useGuideRequest.js';
import { getFoodAssistanceCopy } from './i18n/food-assistance.js';
import { getPublicGuideCopy } from './i18n/public-guides.js';
import { getDetailCopy } from './i18n/details.js';
import { getLocalizationCopy } from './i18n/localization.js';
import './food-assistance.css';

function KoreanCard({value,locale,onClose}:{value:NonNullable<FoodAssistance['localCard']>;locale:Locale;onClose:()=>void}) {
  const c=getFoodAssistanceCopy(locale),dialog=useRef<HTMLDialogElement>(null);
  const [quantity,setQuantity]=useState(1),[phrase,setPhrase]=useState(''),[copied,setCopied]=useState('');
  const dish=value.dishes[0];
  const [mode,setMode]=useState<'order'|'taxi'>('taxi');
  const message=mode==='taxi'
    ? [value.name,value.address,'이곳으로 가 주세요.'].filter(Boolean).join('\n')
    : dish?[dish.korean+' — 희망 수량: '+quantity,'이 메뉴를 주문하고 싶어요. 주문 단위와 수량을 확인해 주세요.',phrase].filter(Boolean).join('\n'):[value.menu??'메뉴를 보여 주세요.',phrase].filter(Boolean).join('\n');
  useEffect(()=>{
    const element=dialog.current,previous=document.activeElement,overflow=document.body.style.overflow;
    element?.showModal();document.body.style.overflow='hidden';
    return ()=>{element?.close();document.body.style.overflow=overflow;if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};
  },[]);
  function keepFocus(event:KeyboardEvent<HTMLDialogElement>) {
    if(event.key!=='Tab')return;
    const elements=[...event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),select:not([disabled]),summary,[tabindex="0"]')].filter(element=>element.getClientRects().length>0);
    const first=elements[0],last=elements.at(-1);
    if(!first||!last)return;
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
  async function copy() {
    try {await navigator.clipboard.writeText(message);setCopied(c.copied);}
    catch {setCopied(c.copyFailed);}
  }
  return <dialog ref={dialog} className="korean-card-dialog" aria-labelledby="korean-card-title" onKeyDown={keepFocus} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget){const box=event.currentTarget.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)onClose();}}}>
    <header><h2 id="korean-card-title">{c.localTitle}</h2><button autoFocus onClick={onClose} aria-label={c.close}>×</button></header>
    <div className="korean-card-content"><div className="food-help-actions" role="group"><button aria-pressed={mode==='taxi'} onClick={()=>{setMode('taxi');setCopied('');}}>{c.taxi}</button><button aria-pressed={mode==='order'} onClick={()=>{setMode('order');setCopied('');}}>{c.order}</button></div>
      {mode==='order'&&<>{dish?<><p className="food-dish-label">{c.dish}: <strong>{dish.label}</strong> · <span lang="ko">{dish.korean}</span></p><label className="food-quantity">{c.quantity}<select value={quantity} onChange={e=>{setQuantity(Number(e.target.value));setCopied('');}}>{Array.from({length:10},(_,i)=><option key={i+1}>{i+1}</option>)}</select></label><p>{c.orderNote}</p></>:<p>{c.noDish}</p>}<label className="food-phrase">{c.phrase}<select value={phrase} onChange={e=>{setPhrase(e.target.value);setCopied('');}}><option value="">—</option><option value="덜 맵게 가능한가요?">{c.mild}</option><option value="포장 가능한가요?">{c.takeaway}</option></select></label></>}
      <div className="korean-show-text" lang="ko" data-testid="korean-show-text">{message}</div>
      <div className="food-help-actions"><button onClick={()=>void copy()}>{c.copy}</button>{mode==='taxi'&&value.mapUrl&&<a href={value.mapUrl} target="_blank" rel="noopener noreferrer">{c.map} ↗</a>}</div><p role="status">{copied}</p>
      <details><summary>{c.menu}</summary><p lang="ko" className="food-source-menu">{value.menu??getDetailCopy(locale).unknown}</p></details>
      <p className="guide-note">{c.translation}</p>
    </div>
  </dialog>;
}
function AlternativePhoto({url,name,missing}:{url:string|null;name:string;missing:string}) {
 const[failed,setFailed]=useState(false);
 return url&&!failed?<img src={url} alt={name} loading="lazy" onError={()=>setFailed(true)}/>:<div className="food-alternative-placeholder">{missing}</div>;
}
export function FoodAssistancePanel({id,locale,onNavigate}:{id:string;locale:Locale;onNavigate:(path:string)=>void}) {
  const c=getFoodAssistanceCopy(locale),g=getPublicGuideCopy(locale),d=getDetailCopy(locale);
  const params=new URLSearchParams(window.location.search),course=params.get('course');
  const query=new URLSearchParams({locale});if(course&&/^[a-z0-9-]{1,40}$/.test(course))query.set('course',course);
  const request=useGuideRequest('/api/food-assistance/'+encodeURIComponent(id)+'?'+query,FoodAssistanceSchema);
  const value=request.value?.id===id&&request.value.locale===locale?request.value:null;
  const [open,setOpen]=useState(params.get('help')==='alternatives'),[card,setCard]=useState(params.get('help')==='card'),[sort,setSort]=useState('nearby');
  const items=[...(value?.alternatives??[])].sort((a,b)=>sort==='next'?(a.nextStraightLineMeters??Infinity)-(b.nextStraightLineMeters??Infinity):a.straightLineMeters-b.straightLineMeters);
  const meters=(n:number)=>new Intl.NumberFormat(locale).format(n)+' m';
  const date=(s:string)=>new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'Asia/Seoul'}).format(new Date(s));
  function link(itemId:string){return '/food/'+itemId+'?'+new URLSearchParams({locale,...(value?.context?{course:value.context.id}:{})});}
  return <section className="food-assistance" data-testid="food-assistance" aria-labelledby="food-assistance-title">
    <header><p className="eyebrow blue">DALLABUSAN / PLAN B</p><h2 id="food-assistance-title">{c.title}</h2><p>{c.intro}</p></header>
    <div className="food-help-actions"><button aria-expanded={open} aria-controls="food-alternatives" onClick={()=>setOpen(!open)}>{c.alternatives} <span aria-hidden="true">↗</span></button><button disabled={!value?.localCard} onClick={()=>setCard(true)}>{c.card}</button></div>
    {value&&!value.localCard&&<p role="status">{c.unavailable}</p>}{request.pending&&<p role="status">{c.loading}</p>}{request.error&&<div role="alert"><p>{c.failed}</p><button onClick={request.retry}>{c.retry}</button></div>}
    {open&&value&&<div id="food-alternatives"><p className="food-help-notice">{c.note}</p>
      {value.context&&<aside className="food-course-context"><strong>{value.context.title}</strong>{value.context.nextName&&<p>{c.onward}: {value.context.nextName}</p>}<p>{c.contextNote}</p><a href={'/courses/'+value.context.id+'?locale='+locale} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate('/courses/'+value.context?.id);}}}>{c.back} ↗</a></aside>}
      {items.length>0?<><label className="food-sort"><span className="sr-only">{c.nearby}</span><select aria-label={c.nearby} value={sort} onChange={e=>setSort(e.target.value)}><option value="nearby">{c.nearby}</option>{value.context?.nextName&&items.some(item=>item.nextStraightLineMeters!==null)&&<option value="next">{c.next}</option>}</select></label><div className="food-alternative-grid">{items.map(({item,straightLineMeters,nextStraightLineMeters})=><article className="food-alternative-card" key={item.id} data-testid="food-alternative">
        <AlternativePhoto key={item.imageUrl??item.id} url={item.imageUrl} name={item.name} missing={g.noPhoto}/><div className="food-alternative-body"><span className="district-tag">{c.group}: {value.group}</span><h3 lang={item.locale}>{item.name}</h3>{item.contentTranslation==='machine'&&<p className="guide-note">{getLocalizationCopy(locale).machine}</p>}<p className="food-distance">{c.distance}: {meters(straightLineMeters)}{nextStraightLineMeters!==null&&<span>{c.onward}: {meters(nextStraightLineMeters)}</span>}</p><dl><dt>{g.menu}</dt><dd lang={item.locale}>{item.menu??d.unknown}</dd><dt>{d.hours}</dt><dd lang={item.locale}>{item.hours??d.unknown}</dd><dt>{g.address}</dt><dd lang={item.locale}>{item.address??d.unknown}</dd></dl><a href={link(item.id)} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate(link(item.id));}}}>{c.explore} ↗</a></div>
      </article>)}</div></>:<p className="food-help-empty">{c.empty} <a href={'/food?locale='+locale} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate('/food');}}}>{c.search} ↗</a></p>}
      <p className="guide-note">{g.credit} · {c.source}: {date(value.source.collectedAt)} · {c.review}: {date(value.reviewedOn)} · <a href={value.source.url} target="_blank" rel="noopener noreferrer">{g.source} ↗</a></p>
    </div>}
    {card&&value?.localCard&&<KoreanCard value={value.localCard} locale={locale} onClose={()=>setCard(false)}/>}
  </section>;
}
