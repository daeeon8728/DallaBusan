import {lazy,Suspense,useState} from 'react';
import {MapLinksSchema,type Course,type Locale} from '@trip-fit/domain';
import {useGuideRequest} from '../hooks/useGuideRequest.js';
import {getMapLinkCopy} from '../i18n/map-links.js';
import './map-links.css';
const LeafletCourseMap=lazy(()=>import('./LeafletCourseMap.js'));
export default function CourseMap(props:{pointsOnly?:boolean;course:Course;locale:Locale;selected:number|null;onSelect:(index:number)=>void}){
 const {course,locale,selected,onSelect}=props,c=getMapLinkCopy(locale);
 const mode='transit';
 const [reference,setReference]=useState(false),[attempt,setAttempt]=useState(0);
 const valid=course.steps.every(s=>s.kind!=='note'&&s.id!==null),places=valid?course.steps.map(s=>s.kind+':'+s.id).join(','):'';
 const request=useGuideRequest('/api/map-links?'+new URLSearchParams({locale,mode,places}),MapLinksSchema);
 const data=request.value,stop=data?.stops[selected??0]??data?.stops[0],embedded=Boolean(data?.embedEnabled&&stop?.embedUrl&&!reference);
 return <><section className="map-export" data-testid="map-export"><header><h2>{c.title}</h2><label>{c.mode}<span className="map-export-mode">{c.transit}</span></label></header>
 {request.pending&&<p role="status">{c.loading}</p>}{request.error&&<p role="alert">{c.failed}<button onClick={request.retry}>{c.retry}</button></p>}
 {data&&<><p>{c.note}</p>{data.missingCoordinates&&<p className="guide-note">{c.missing}</p>}<div className="map-export-links">{data.parts.map((part,i)=><a key={part.from+':'+part.to} data-testid="map-export-route" href={part.url} target="_blank" rel="noopener noreferrer">{c.open}{data.parts.length>1?' '+(i+1):''} · {part.from}–{part.to} ↗</a>)}</div>
 <details><summary>{c.leg} · {c.spot}</summary><div className="map-export-stops">{data.stops.map((s,i)=><div key={s.position}><button aria-pressed={selected===i} onClick={()=>onSelect(i)}>{s.position}. {s.name}</button><a href={s.searchUrl} target="_blank" rel="noopener noreferrer">{c.spot} ↗</a></div>)}{mode!=='transit'&&data.legs.map(leg=><a key={leg.from} href={leg.url} target="_blank" rel="noopener noreferrer">{c.leg} {leg.from} → {leg.to} ↗</a>)}</div></details></>}
 </section>
 {embedded&&stop?.embedUrl?<section className="google-course-map" data-testid="google-course-map"><header><h2>{c.embed}</h2><button onClick={()=>setAttempt(n=>n+1)}>{c.retry}</button></header><iframe key={stop.embedUrl+attempt} title={c.embed+' · '+stop.name} src={stop.embedUrl} width="600" height="420" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/><p>{c.embedNote}</p><div className="google-stop-picker">{data?.stops.map((s,i)=><button key={s.position} aria-label={s.position+'. '+s.name} aria-pressed={(selected??0)===i} onClick={()=>onSelect(i)}>{s.position}</button>)}</div><button onClick={()=>setReference(true)}>{c.reference}</button></section>:!request.pending&&<Suspense fallback={<p role="status">{c.loading}</p>}><LeafletCourseMap {...props}/></Suspense>}
 {reference&&data?.embedEnabled&&<button className="google-map-return" onClick={()=>setReference(false)}>{c.embed}</button>}
 </>;
}
