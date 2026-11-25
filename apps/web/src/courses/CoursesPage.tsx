import {DetailAdvertisement} from '../advertising/DetailAdvertisement.js';
import { Component,lazy,Suspense,useState,type ReactNode } from 'react';
import { CourseDetailSchema, CoursesResponseSchema, CourseCategorySchema, CourseModeSchema, type Course, type Locale } from '@trip-fit/domain';
import { useGuideRequest } from '../hooks/useGuideRequest.js';
import { getCourseCopy } from '../i18n/courses.js';
import { getLocalizationCopy } from '../i18n/localization.js';
import { NearbyParking } from '../Parking.js';
import {getCourseOverviewCopy} from '../i18n/course-overview.js';
import {getCourseMapCopy} from '../i18n/course-map.js';
import './courses.css';
const CourseMap=lazy(()=>import('./CourseMap.js'));
class MapBoundary extends Component<{children:ReactNode;message:string},{failed:boolean}>{
 override state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 override render(){return this.state.failed?<p role="status">{this.props.message}</p>:this.props.children;}
}
function directions(from:Course['steps'][number],to:Course['steps'][number],mode:Course['route']['mode']){
 if(!from.coordinates||!to.coordinates)return null;
 const url=new URL('https://www.google.com/maps/dir/');
 url.search=new URLSearchParams({api:'1',origin:from.coordinates.lat+','+from.coordinates.lng,destination:to.coordinates.lat+','+to.coordinates.lng,travelmode:mode}).toString();return url.href;
}
function StopPhoto({image,name,missing}:{image:Course['image'];name:string;missing:string}){const[failed,setFailed]=useState(false);return image&&!failed?<figure className="course-stop-photo"><img src={image.url} alt={name} loading="lazy" onError={()=>setFailed(true)}/><figcaption>{image.credit}</figcaption></figure>:<p className="guide-note">{missing}</p>;}

export function CoursePhoto({ course, locale }: {
    course: Pick<Course,'image'|'title'>;
    locale: Locale;
}) { const [failed, setFailed] = useState(false); return <div className="course-photo">{course.image && !failed ? <img src={course.image.url} alt={course.title} loading="lazy" onError={() => setFailed(true)}/> : <div className="course-photo-fallback"><span aria-hidden="true">↗</span>{getCourseCopy(locale).noPhoto}</div>}</div>; }
function CourseDetail({id,locale,onNavigate}:{id:string;locale:Locale;onNavigate:(path:string)=>void}){
 const c=getCourseCopy(locale),m=getCourseMapCopy(locale),o=getCourseOverviewCopy(locale);
 const request=useGuideRequest('/api/courses/'+encodeURIComponent(id)+'?locale='+locale,CourseDetailSchema);
 const course=request.value?.course;
 const [selected,setSelected]=useState<number|null>(null);
 const number=new Intl.NumberFormat(locale,{maximumFractionDigits:1});
 const date=(value:string)=>new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'Asia/Seoul'}).format(new Date(value));
 function jumpToStop(index:number){
  setSelected(index);
  const element=document.getElementById('course-stop-'+index);
  element?.scrollIntoView({behavior:'auto',block:'start'});
  element?.focus({preventScroll:true});
 }
 return <article className="course-detail section-wrap"><a className="course-back" href={'/courses?locale='+locale} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate('/courses');}}}>← {c.back}</a>
 {request.error?<div role="alert"><h1>{c.missing}</h1><button onClick={request.retry}>{c.retry}</button></div>:!course?<p role="status">{c.loading}</p>:<>
  <header className="course-detail-hero"><div><p className="eyebrow blue">{c[course.category]} / {c.idea}</p><h1>{course.title}</h1><p className="course-lead">{course.intro}</p></div><div><CoursePhoto key={course.id} course={course} locale={locale}/>{course.image&&<details className="course-hero-credit"><summary>{c.photo}</summary><p>{course.image.credit}</p></details>}</div></header>
  <div className="course-facts" aria-label={o.route}>
   <div><span>{o.route}</span><strong>{course.route.mode==='walking'?m.walk:m.drive} · {course.steps.length} {m.stop}</strong></div>
   <div><span>{o.visit}</span><strong>{course.steps.reduce((sum,step)=>sum+step.stayMinutes,0)} {m.minutes}</strong></div>
   <div><span>{o.travel} · {m.road}</span><strong>{course.route.status==='road-route'?Math.max(1,Math.round((course.route.durationSeconds??0)/60))+' '+m.minutes:m.reference}</strong></div>
   <div><span>{m.road}</span><strong>{course.route.distanceMeters!==null?number.format(course.route.distanceMeters/1000)+' km':'—'}</strong></div>
  </div>
  <section className="course-overview" aria-labelledby="course-overview-title" data-testid="course-overview"><h2 id="course-overview-title">{o.overview}</h2><p>{o.hint}</p><ol>{course.steps.map((step,i)=><li key={step.kind+':'+step.id}><button aria-pressed={selected===i} onClick={()=>jumpToStop(i)}><span className="overview-number">{String(i+1).padStart(2,'0')}</span><span><small>{i===0?o.start:i===course.steps.length-1?o.finish:step.kind==='food'?o.meal:o.place}</small><strong lang={step.locale}>{step.name}</strong><small>{step.stayMinutes} {m.minutes} · {m.stay}</small></span></button>{course.route.legs[i]&&<span className="overview-transfer">↓ {Math.max(1,Math.round(course.route.legs[i].durationSeconds/60))} {m.minutes} · {o.travel}</span>}</li>)}</ol></section>
  <div className="course-route-layout">
   <aside className="course-map-side"><MapBoundary key={course.id+locale} message={m.routeFail}><Suspense fallback={<p role="status">{c.loading}</p>}><CourseMap course={course} locale={locale} selected={selected} onSelect={i=>setSelected(i<0?null:i)}/></Suspense></MapBoundary>{course.route.collectedAt&&<p className="guide-note">{m.date}: <time dateTime={course.route.collectedAt}>{date(course.route.collectedAt)}</time></p>}<p className="guide-note">{m.plan}</p></aside>
   <section className="course-itinerary" aria-labelledby="course-sequence-title"><h2 id="course-sequence-title">{c.sequence}</h2><ol className="course-stops">{course.steps.map((step,i)=>{
    const next=course.steps[i+1],href=next?directions(step,next,course.route.mode):null,leg=course.route.legs[i];
    return <li id={'course-stop-'+i} tabIndex={-1} key={step.kind+':'+step.id} data-selected={selected===i?'true':undefined}><span className="course-stop-number">{String(i+1).padStart(2,'0')}</span><div className="course-stop-body"><div className="course-stop-heading"><h3 lang={step.locale}>{step.name}</h3><span>{m.stay} · {step.stayMinutes} {m.minutes}</span></div>
     <div className="course-stop-glance"><StopPhoto key={step.kind+':'+step.id} image={step.image} name={step.name} missing={c.noPhoto}/><div>{step.kind==='food'&&<p className="course-menu-preview"><strong>{m.menu}</strong><span>{step.menu??m.unknown}</span></p>}{step.address&&<p className="course-address">{step.address}</p>}<p className="course-hours-preview"><strong>{m.hours}</strong><span>{step.hours??m.unknown}</span></p></div></div>
     <details className="course-stop-expanded"><summary>{o.about}</summary>{step.contentTranslation==='machine'&&<p className="guide-note">{getLocalizationCopy(locale).machine}</p>}{locale!=='ko'&&step.originalName&&step.originalName!==step.name&&<p lang="ko">{getLocalizationCopy(locale).original}: {step.originalName}</p>}{step.description&&<p className="course-stop-description" lang={step.locale}>{step.description}</p>}<dl className="course-stop-facts">{step.kind==='food'&&<><dt>{m.menu}</dt><dd>{step.menu??m.unknown}</dd></>}<dt>{m.hours}</dt><dd>{step.hours??m.unknown}</dd><dt>{m.holidays}</dt><dd>{step.holidays??m.unknown}</dd></dl>{step.sourceCollectedAt&&<p className="guide-note">{m.sourceDate}: <time dateTime={step.sourceCollectedAt}>{date(step.sourceCollectedAt)}</time></p>}{step.sourceUrl&&<a href={step.sourceUrl} target="_blank" rel="noopener noreferrer">{c.source} ↗</a>}</details>
     <div className="course-stop-actions">{step.coordinates&&<button onClick={()=>{setSelected(i);document.querySelector('[data-testid="course-map"]')?.scrollIntoView({behavior:'auto',block:'center'});}}>{m.view}</button>}{step.href&&<a href={step.href+'?locale='+locale} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate(step.href??'/courses');}}}>{c.details} ↗</a>}</div>
     {course.category==='family'&&step.kind!=='note'&&step.id&&<NearbyParking kind={step.kind} id={step.id} locale={locale}/>}
     {href&&<div className="course-transfer"><a href={href} target="_blank" rel="noopener noreferrer">{m.directions} ↗</a>{leg&&<span>{number.format(leg.distanceMeters/1000)} km · {Math.max(1,Math.round(leg.durationSeconds/60))} {m.minutes} ({m.road})</span>}</div>}
    </div></li>;
   })}</ol></section>
  </div>
  <aside className="course-tips"><h2>{m.tips}</h2><p>{course.tips}</p>{course.category==='family'&&<p className="course-warning">{c.familyNote}</p>}</aside>
  <p className="course-warning">{c.warning}</p><p className="guide-note">{c.onward}</p>
  <aside className="course-stay-link"><div><h2>{o.stay}</h2><p>{o.stayNote}</p></div><a href={'/travel-tools?locale='+locale} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate('/travel-tools');}}}>{getCourseOverviewCopy(locale).stay} ↗</a></aside>
  <DetailAdvertisement locale={locale} identity={'course:'+course.id}/>
 </>}
 </article>;
}
export function CoursesPage({ route, locale, onNavigate }: {
    route: string;
    locale: Locale;
    onNavigate: (path: string) => void;
}) {
    const c = getCourseCopy(locale);
    const slug = route.split('/')[2];
    const selected = CourseCategorySchema.safeParse(new URLSearchParams(window.location.search).get('category'));
    const category = selected.success ? selected.data : undefined;
    const request = useGuideRequest('/api/courses?locale=' + locale, CoursesResponseSchema);
    const modeValue=CourseModeSchema.safeParse(new URLSearchParams(window.location.search).get('mode'));
    const mode=modeValue.success?modeValue.data:undefined;
    const items = request.value?.items.filter(item => (!category || item.category === category)&&(!mode||item.route.mode===mode)) ?? [];
    return <>{slug ? <CourseDetail key={slug + locale} id={slug} locale={locale} onNavigate={onNavigate}/> : <section className="courses-page section-wrap" data-testid="courses-page"><header className="courses-intro"><p className="eyebrow blue">DALLABUSAN / YOUR NEXT CHAPTER</p><h1>{c.title}</h1><p>{c.intro}</p><p className="course-warning">{c.warning}</p></header><div className="course-categories" role="group" aria-label={c.nav}>{[undefined, ...CourseCategorySchema.options].map(value => <a key={value ?? 'all'} href={'/courses?locale=' + locale + (value ? '&category=' + value : '')+(mode?'&mode='+mode:'')} aria-current={category === value ? 'page' : undefined} onClick={e => { if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNavigate('/courses?' + new URLSearchParams({...(value?{category:value}:{}),...(mode?{mode}: {})}).toString());
    } }}>{value ? c[value] : c.all}{value && request.value && <span>{request.value.counts[value]}</span>}</a>)}</div><div className="course-mode-filters" role="group" aria-label={getCourseOverviewCopy(locale).route}>{[undefined,...CourseModeSchema.options].map(value=><a key={value??'all'} href={'/courses?'+new URLSearchParams({locale,...(category?{category}:{}),...(value?{mode:value}:{})}).toString()} aria-current={mode===value?'page':undefined} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate('/courses?'+new URLSearchParams({...(category?{category}:{}),...(value?{mode:value}:{})}).toString());}}}>{value?value==='walking'?getCourseMapCopy(locale).walk:getCourseMapCopy(locale).drive:c.all}</a>)}</div>{request.error && <div className="error-notice" role="alert">{c.failed}<button onClick={request.retry}>{c.retry}</button></div>}{request.pending && <p role="status">{c.loading}</p>}<p role="status">{items.length} {c.ideas}</p><div className="courses-grid" aria-busy={request.pending}>{items.map(course => <a className="course-card" data-testid="course-card" key={course.id} href={'/courses/' + course.id + '?locale=' + locale} onClick={e => { if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNavigate('/courses/' + course.id);
    } }}><CoursePhoto course={course} locale={locale}/><div><span className="eyebrow blue">{c[course.category]}</span><h2>{course.title}</h2><ol className="course-card-sequence">{course.steps.map((step,i)=><li key={step.kind+':'+step.id}><span>{i+1}</span><span lang={step.locale}>{step.name}</span></li>)}</ol><small>{course.route.mode==='walking'?getCourseMapCopy(locale).walk:getCourseMapCopy(locale).drive} · {course.steps.length} {getCourseMapCopy(locale).stop}{course.route.distanceMeters!==null?' · '+new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(course.route.distanceMeters/1000)+' km':''}</small><strong>{c.view} ↗</strong></div></a>)}</div></section>}</>;
}
