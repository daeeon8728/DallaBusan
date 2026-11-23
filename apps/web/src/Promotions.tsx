import { useEffect, useState } from 'react';
import { PromotionsResponseSchema, type Locale, type PublicOffer, type PublicPromotion } from '@trip-fit/domain';
import { getPromotionCopy } from './i18n/promotions.js';
import { LANGUAGE_OPTIONS } from './i18n/index.js';
function CouponCode({code,locale}:{code:string;locale:Locale}){
  const copy=getPromotionCopy(locale);const [status,setStatus]=useState<'idle'|'copied'|'failed'>('idle');
  return <div className="promotion-code"><code>{code}</code><button type="button" onClick={()=>{void navigator.clipboard?.writeText(code).then(()=>setStatus('copied')).catch(()=>setStatus('failed'));if(!navigator.clipboard)setStatus('failed');}}>{status==='copied'?copy.copied:copy.copy}</button><span className="sr-only" role="status">{status==='failed'?copy.copyFailed:status==='copied'?copy.copied:''}</span></div>;
}
function PromotionCard({item,locale,onNavigate,onOpen}:{item:PublicPromotion;locale:Locale;onNavigate:(path:string)=>void;onOpen:(offer:PublicOffer)=>void}){
  const copy=getPromotionCopy(locale),target=item.target;
  const catalogPath=target.kind==='catalog'?'/search?'+new URLSearchParams({provider:target.providerId,category:target.category,scope:'busan',locale}).toString():null;
  return <article className={'promotion-card promotion-'+item.kind} data-testid="promotion-card" data-promotion-id={item.id}>
    <div className="promotion-top"><span>{item.provider.displayName}</span><span className="promotion-tag">{item.kind==='coupon'?copy.coupon:copy.sale}</span></div>
    <p className="promotion-benefit">{item.benefit}</p><h3>{item.title}</h3><p className="promotion-conditions">{item.conditions}</p>
    {item.code&&<CouponCode key={item.code} code={item.code} locale={locale}/>}
    <dl className="promotion-dates"><div><dt>{copy.until}</dt><dd><time dateTime={item.endsOn}>{item.endsOn}</time></dd></div><div><dt>{copy.checked}</dt><dd><time dateTime={item.checkedOn}>{item.checkedOn}</time></dd></div></dl>
    {target.kind==='affiliate'&&<p className="promotion-language">{copy.booking}: {LANGUAGE_OPTIONS.find(option=>option.locale===target.bookingLocale)?.label}</p>}
    <div className="promotion-actions">{target.kind==='offer'?<button className="promotion-cta" onClick={()=>onOpen(target.offer)}>{copy.open} ↗</button>:target.kind==='affiliate'?<a className="promotion-cta" href={target.href} target="_blank" rel="sponsored noopener noreferrer">{copy.open} ↗</a>:<a className="promotion-cta" href={catalogPath??''} onClick={event=>{if(!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&catalogPath){event.preventDefault();onNavigate(catalogPath);}}}>{copy.browse} →</a>}<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{copy.terms} ↗</a></div>
  </article>;
}
export function Promotions({locale,onNavigate,onOpen}:{locale:Locale;onNavigate:(path:string)=>void;onOpen:(offer:PublicOffer)=>void}){
  const copy=getPromotionCopy(locale);const [attempt,setAttempt]=useState(0),[clock,setClock]=useState(()=>Date.now());
  const [items,setItems]=useState<PublicPromotion[]|null>(null),[failed,setFailed]=useState(false);
  useEffect(()=>{const refresh=()=>{setClock(Date.now());setAttempt(value=>value+1);};const timer=window.setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);};},[]);
  useEffect(()=>{const controller=new AbortController();void fetch('/api/promotions?locale='+locale,{signal:controller.signal,headers:{Accept:'application/json'},cache:'no-store'}).then(async response=>{if(!response.ok)throw Error('Unavailable');const input:unknown=await response.json();return PromotionsResponseSchema.parse(input);}).then(value=>{if(controller.signal.aborted)return;if(value.locale!==locale)throw Error('Wrong language');setItems(value.items);setFailed(false);setClock(Date.now());}).catch(()=>{if(!controller.signal.aborted)setFailed(true);});return()=>controller.abort();},[locale,attempt]);
  useEffect(()=>{const next=items?.map(item=>Date.parse(item.expiresAt)).filter(time=>time>Date.now()).sort((a,b)=>a-b)[0]; if(!next)return;const timer=window.setTimeout(()=>setClock(Date.now()),Math.min(next-Date.now()+5,2147483647));return()=>window.clearTimeout(timer);},[items,clock]);
  const current=items?.filter(item=>Date.parse(item.expiresAt)>clock)??[];
  return <section className="promotions-section section-wrap" data-testid="promotions" aria-labelledby="promotions-title"><div className="promotion-heading"><div><p className="eyebrow blue">BUSAN / SMART SAVINGS</p><h2 id="promotions-title">{copy.heading}</h2><p>{copy.intro}</p></div><span aria-hidden="true">✦</span></div>
    {!items&&!failed&&<p role="status">{copy.loading}</p>}{failed&&<div className="error-notice" role="alert"><p>{copy.failed}</p><button onClick={()=>setAttempt(value=>value+1)}>{copy.retry}</button></div>}
    <div className="promotion-grid">{current.map(item=><PromotionCard key={item.id} item={item} locale={locale} onNavigate={onNavigate} onOpen={onOpen}/>)}</div>
    {items&&current.length===0&&<p>{copy.empty}</p>}<p className="promotion-note">{copy.note}</p>
  </section>;
}
