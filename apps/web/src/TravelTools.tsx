import {useEffect,useRef,useState} from 'react';import {TravelToolsSchema,TravelToolFrameSchema,PartnerResizeSchema,type Locale,type PublicOffer} from '@trip-fit/domain';import {useGuideRequest} from './hooks/useGuideRequest.js';import {getTravelToolsCopy} from './i18n/travel-tools.js';import {StayMap} from './StayMap.js';import {StayBanner} from './StayBanner.js';import {Promotions} from './Promotions.js';
function ToolFrame({id,locale}:{id:string;locale:Locale}){
 const copy=getTravelToolsCopy(locale),request=useGuideRequest('/api/travel-tools/'+encodeURIComponent(id)+'?locale='+locale,TravelToolFrameSchema),value=request.value;
 const container=useRef<HTMLDivElement>(null),frame=useRef<HTMLIFrameElement>(null),[width,setWidth]=useState(320),[expandedHeight,setExpandedHeight]=useState<number|null>(null);
 useEffect(()=>{const element=container.current;if(!element)return;const observer=new ResizeObserver(entries=>{for(const entry of entries)setWidth(entry.contentRect.width);});observer.observe(element);return()=>observer.disconnect();},[value?.url]);
 useEffect(()=>{if(!value||value.protocol!=='window-proxy')return;const onMessage=(event:MessageEvent<unknown>)=>{if(event.source!==frame.current?.contentWindow||event.origin!==new URL(value.url).origin)return;let input:unknown=event.data;if(typeof input==='string'){try{input=JSON.parse(input);}catch{return;}}const parsed=PartnerResizeSchema.safeParse(input);if(parsed.success)setExpandedHeight(parsed.data.data.height);};window.addEventListener('message',onMessage);return()=>window.removeEventListener('message',onMessage);},[value]);
 const scale=value&&!value.fluid?Math.min(1,width/value.width):1;
 const logicalHeight=value?.fluid?(width<496?2318:width<720?1132:808):expandedHeight??value?.height??420;
 return <>{request.pending&&<p role="status">{copy.open}…</p>}{request.error&&<div role="alert" className="error-notice"><p>{copy.failed}</p><button onClick={request.retry}>{copy.retry}</button></div>}{!request.pending&&!request.error&&value&&<>
  <p className="tool-notice">{copy.fallback}</p><a className="tool-external" href={value.url} target="_blank" rel="sponsored noopener noreferrer">{copy.newTab} ↗</a>
  <div ref={container} className={'tool-frame '+(value.fluid?'fluid':'fixed')} style={{maxWidth:value.fluid?'100%':value.width,height:logicalHeight*scale}}>
   <iframe ref={frame} src={value.url} name={value.frameName} title={value.title+' · '+value.provider.displayName} width={value.width} height={logicalHeight} style={{width:value.fluid?'100%':value.width,height:logicalHeight,transform:value.fluid?'none':'scale('+scale+')'}} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" referrerPolicy="strict-origin-when-cross-origin" onLoad={event=>{if(value.protocol==='window-proxy'){const targetOrigin=new URL(value.url).origin;event.currentTarget.contentWindow?.postMessage(JSON.stringify({data:{action:'adjustwidth',width:value.width},sourceOrigin:window.location.origin,targetOrigin,sourceWindowName:window.name,targetWindowName:value.frameName}),targetOrigin);}}}/>
  </div>
 </>}</>;
}
function ToolCard({id,title,provider,kind,contentLocale,locale}:{id:string;title:string;provider:string;kind:'stays'|'experiences';contentLocale:Locale;locale:Locale}){
 const [open,setOpen]=useState(false),copy=getTravelToolsCopy(locale);
 return <article className={'travel-tool-card '+(kind==='experiences'?'wide':'')} data-testid="travel-tool" data-tool-id={id}><header><p className="eyebrow blue">{provider}</p><h2>{title}</h2></header>{contentLocale!==locale&&<p className="tool-notice">{copy.english}</p>}{kind==='experiences'&&<p className="tool-notice">{copy.picks}</p>}<button className="primary-button" aria-expanded={open} aria-controls={'tool-'+id} onClick={()=>setOpen(value=>!value)}>{open?copy.close:copy.open}</button><div id={'tool-'+id}>{open&&<ToolFrame id={id} locale={locale}/>}</div></article>;
}
export function TravelToolsLink({locale,onNavigate}:{locale:Locale;onNavigate:(path:string)=>void}){return <a className="travel-tools-link" data-testid="travel-tools-link" href={'/travel-tools?locale='+locale} onClick={event=>{if(!event.ctrlKey&&!event.metaKey){event.preventDefault();onNavigate('/travel-tools');}}}>{getTravelToolsCopy(locale).title} ↗</a>;}
export function TravelToolsPage({locale,onNavigate,onOpen}:{locale:Locale;onNavigate:(path:string)=>void;onOpen:(offer:PublicOffer)=>void}){
 const copy=getTravelToolsCopy(locale),[filter,setFilter]=useState<'all'|'stays'|'experiences'>('all'),request=useGuideRequest('/api/travel-tools?locale='+locale,TravelToolsSchema);
 return <article className="travel-tools-page" data-testid="travel-tools-page"><header className="tools-hero section-wrap"><p className="eyebrow blue">BUSAN, AT YOUR PACE</p><h1>{copy.title}</h1><p>{copy.intro}</p><p className="tool-disclosure">{copy.note}</p></header>
  <div className="section-wrap"><div className="tools-filters" role="group" aria-label={copy.title}>{(['all','stays','experiences'] as const).map(key=><button key={key} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{copy[key]}</button>)}</div>
   {request.pending&&<p role="status">{copy.open}…</p>}{request.error&&<div role="alert" className="error-notice"><p>{copy.failed}</p><button onClick={request.retry}>{copy.retry}</button></div>}
   {!request.pending&&!request.error&&request.value?.items.length===0&&<p>{copy.empty}</p>}
   <div className="tools-grid">{request.value?.items.filter(tool=>filter==='all'||filter===tool.kind).map(tool=><ToolCard key={tool.id+locale} id={tool.id} title={tool.title} provider={tool.provider.displayName} kind={tool.kind} contentLocale={tool.contentLocale} locale={locale}/>)}</div>
   {filter!=='experiences'&&<section className="tools-extras" aria-label={copy.stays}><h2>{copy.more}</h2><StayMap locale={locale}/><StayBanner locale={locale}/></section>}
   <a className="travel-tools-link" href={'/search?locale='+locale} onClick={event=>{if(!event.ctrlKey&&!event.metaKey){event.preventDefault();onNavigate('/search');}}}>{copy.back} ↗</a>
  </div><Promotions locale={locale} onNavigate={onNavigate} onOpen={onOpen}/>
 </article>;
}
