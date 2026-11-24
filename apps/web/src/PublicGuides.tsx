import {DetailAdvertisement} from './advertising/DetailAdvertisement.js';
import { getLocalizationCopy } from './i18n/localization.js';
import { NearbyParking } from './Parking.js';
import { SaveButton } from './saved/SaveButton.js';
import { useState, type FormEvent } from 'react';
import { GuideDetailSchema, GuideListSchema, GuideQuerySchema, type GuideKind, type Locale, type PublicGuide } from '@trip-fit/domain';
import { useGuideRequest } from './hooks/useGuideRequest.js';
import { getPublicGuideCopy, guidePath } from './i18n/public-guides.js';
import { getDetailCopy } from './i18n/details.js';
function GuidePhoto({item,locale}: {item: PublicGuide;locale: Locale}) {
  const [failed,setFailed]=useState(false); const copy=getPublicGuideCopy(locale);
  return <div className="public-guide-photo">{item.imageUrl && !failed ? <img src={item.imageUrl} alt={item.name} loading="lazy" onError={()=>setFailed(true)} /> : <div className="public-guide-placeholder"><span aria-hidden="true">⌖</span><p>{copy.noPhoto}</p></div>}<small>{copy.credit}</small></div>;
}
function readFilters(locale: Locale) {
  const params=new URLSearchParams(window.location.search);
  const parsed=GuideQuerySchema.safeParse(Object.fromEntries(params));
  const value=parsed.success ? parsed.data : GuideQuerySchema.parse({locale});
  return {...value,locale,district:value.locale===locale?value.district:'',category:value.locale===locale?value.category:'',page:value.locale===locale?value.page:1};
}
export function PublicGuideList({kind,locale,onNavigate}: {kind: GuideKind;locale: Locale;onNavigate:(path:string)=>void}) {
  const [filters,setFilters]=useState(()=>readFilters(locale)); const [input,setInput]=useState(filters.q);
  const copy=getPublicGuideCopy(locale); const details=getDetailCopy(locale); const path=guidePath(kind);
  const params=new URLSearchParams({locale,q:filters.q,district:filters.district,category:filters.category,page:String(filters.page)});
  const {value,pending,previous,error,retry}=useGuideRequest('/api/guides/'+kind+'?'+params.toString(),GuideListSchema,true);
  function update(changes: Partial<typeof filters>) {
    const next={...filters,...changes,locale};setFilters(next);
    const url=new URLSearchParams({locale}); if(next.q)url.set('q',next.q);if(next.district)url.set('district',next.district);if(next.category)url.set('category',next.category);if(next.page>1)url.set('page',String(next.page));
    onNavigate(path+'?'+url.toString());
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault();update({q:input.trim(),page:1}); }
  return <article className="public-guides section-wrap" data-testid={kind+'-page'}>
    <header className="public-guide-intro"><div><p className="eyebrow blue">BUSAN / {kind === 'food'?'TASTE THE CITY':'TRAVEL STORIES'}</p><h1>{copy[kind]}</h1><h2>{kind==='food'?copy.foodIntro:copy.recommendedIntro}</h2><p>{copy.body}</p></div><div className="public-guide-mark" aria-hidden="true">{kind==='food'?'味':'旅'}<span>BUSAN</span></div></header>
    <form className="public-guide-search" onSubmit={submit}><label className="sr-only" htmlFor="guide-search">{copy.search}</label><input id="guide-search" type="search" maxLength={100} placeholder={kind==='food'?copy.placeholder:copy.recommendedPlaceholder} value={input} onChange={event=>setInput(event.target.value)} /><button type="submit">{copy.search} ↗</button></form>
    <div className="public-guide-filters"><label>{copy.district}<select aria-label={copy.district} value={filters.district} onChange={event=>update({district:event.target.value,page:1})}><option value="">{copy.all}</option>{value?.districts.map(district=><option key={district} value={district}>{district}</option>)}</select></label>{kind==='recommended' && <label>{copy.category}<select aria-label={copy.category} value={filters.category} onChange={event=>update({category:event.target.value,page:1})}><option value="">{copy.all}</option>{value?.categories.map(category=><option key={category} value={category}>{category}</option>)}</select></label>}<button type="button" onClick={()=>{setInput('');update({q:'',district:'',category:'',page:1});}}>{copy.reset}</button></div>
    <p className="guide-results-status" role="status">{pending?copy.loading:previous&&value?copy.previousResults:value?copy.results.replace('{count}',String(value.total)).replace('{total}',String(value.availableTotal)):''}</p>
    {error && <div className="error-notice" role="alert"><p>{copy.failed}</p><button onClick={retry}>{copy.retry}</button></div>}
    <div className="public-guide-grid" aria-busy={pending}>{value?.items.map(item=><article key={item.id} data-testid="public-guide-card">{kind==='food'&&<SaveButton target={{kind:"food",id:item.id,title:item.name}} locale={locale}/>}<a href={path+'/'+item.id+'?locale='+locale} onClick={event=>{if(!event.ctrlKey&&!event.metaKey){event.preventDefault();onNavigate(path+'/'+item.id);}}}><GuidePhoto key={item.imageUrl??item.id} item={item} locale={locale}/><div className="public-guide-card-body" lang={item.locale}><span className="district-tag">{[item.district,item.category].filter(Boolean).join(' · ') || 'BUSAN'}</span><h2>{item.name}</h2>{item.contentTranslation==='machine'&&<p className="translated-note">{getLocalizationCopy(locale).machine}</p>}{item.translationFallback&&<p className="translation-notice">{copy.titleFallback}</p>}<p>{(item.menu||item.description).slice(0,130)}{(item.menu||item.description).length>130?'…':''}</p><dl><dt>{details.hours}</dt><dd>{item.hours??details.unknown}</dd></dl><strong>{copy.detail} ↗</strong></div></a></article>)}</div>
    {!pending&&value?.total===0&&<p className="no-related">{copy.empty}</p>}
    {value&&value.pages>1&&<nav className="pagination" aria-label={copy[kind]}><button disabled={pending||previous||value.page<=1} onClick={()=>update({page:value.page-1})}>← {copy.previous}</button><span>{value.page} / {value.pages}</span><button disabled={pending||previous||value.page>=value.pages} onClick={()=>update({page:value.page+1})}>{copy.next} →</button></nav>}
    <p className="public-guide-note">{copy.note}</p>{value&&<p className="guide-note"><a href={value.source.url} target="_blank" rel="noopener noreferrer">{copy.source} ↗</a> · {copy.asOf}: {new Intl.DateTimeFormat(locale,{timeZone:'Asia/Seoul',dateStyle:'medium'}).format(new Date(value.source.collectedAt))}</p>}
  </article>;
}
export function PublicGuideDetail({kind,id,locale,onNavigate}: {kind: GuideKind;id:string;locale: Locale;onNavigate:(path:string)=>void}) {
  const copy=getPublicGuideCopy(locale);const details=getDetailCopy(locale);const path=guidePath(kind);
  const {value,error,retry}=useGuideRequest('/api/guides/'+kind+'/'+encodeURIComponent(id)+'?locale='+locale,GuideDetailSchema);
  const item=value?.item;
  return <article className="public-guides public-guide-detail section-wrap"><a className="back-to-search" href={path+'?locale='+locale} onClick={event=>{if(!event.ctrlKey&&!event.metaKey){event.preventDefault();onNavigate(path);}}}>← {copy.back}</a>
    {!value&&!error&&<p role="status">{copy.loading}</p>}{error&&<div className="error-notice" role="alert"><h1>{error==='missing'?copy.notFound:copy.failed}</h1>{error!=='missing'&&<button onClick={retry}>{copy.retry}</button>}</div>}
    {item&&<><header className="public-guide-detail-heading"><p className="eyebrow blue">{copy[kind]} / {item.district??'BUSAN'}</p><h1 lang={item.locale}>{item.name}</h1>{item.contentTranslation==='machine'&&<p className="translated-note">{getLocalizationCopy(locale).machine}</p>}{locale!=='ko'&&item.originalName!==item.name&&<details className="original-title"><summary>{getLocalizationCopy(locale).original}</summary><p lang="ko">{item.originalName}</p></details>}{kind==='food'&&<SaveButton target={{kind:"food",id:item.id,title:item.name}} locale={locale} inline/>}{item.translationFallback&&<p className="translation-notice">{item.locale!==locale?copy.fallback:copy.titleFallback}</p>}</header><GuidePhoto key={item.imageUrl??item.id} item={item} locale={locale}/>
      <div className="public-guide-facts"><section><h2>{copy.about}</h2><p className="public-guide-story" lang={item.locale}>{item.description||details.unknown}</p></section><aside><dl>{([[copy.address,item.address],[copy.menu,kind==='food'?item.menu:undefined],[details.hours,item.hours],[copy.holiday,kind==='recommended'?item.holidays:undefined],[details.fees,kind==='recommended'?item.fees:undefined],[details.transport,kind==='recommended'?item.transport:undefined],[details.contact,item.phone]]).filter(([,value])=>value!==undefined).map(([label,text])=><div key={label}><dt>{label}</dt><dd lang={item.locale}>{text??details.unknown}</dd></div>)}</dl>{item.homepage&&<a className="source-link" href={item.homepage} target="_blank" rel="noopener noreferrer">{details.homepage} ↗</a>}</aside></div>
      {kind==='food'&&<NearbyParking kind="food" id={item.id} locale={locale}/>}
      <p className="public-guide-note">{copy.note}</p>{value&&<div className="photo-credit"><p>{copy.credit} · {copy.asOf}: {new Intl.DateTimeFormat(locale,{timeZone:'Asia/Seoul',dateStyle:'medium'}).format(new Date(value.source.collectedAt))}</p><a href={value.source.url} target="_blank" rel="noopener noreferrer">{copy.source} ↗</a><a href={value.source.licenseUrl} target="_blank" rel="noopener noreferrer">{copy.license} ↗</a></div>}
      {kind==='food'&&<DetailAdvertisement locale={locale} identity={'food:'+item.id}/>}
    </>}
  </article>;
}
