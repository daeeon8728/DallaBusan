import {BuilderLink} from './builder/BuilderLink.js';
import {useState} from 'react';
import {CoursesResponseSchema,CoursePersonaSchema,type CoursePersona,type Locale} from '@trip-fit/domain';
import {useGuideRequest} from './hooks/useGuideRequest.js';
import {getHomeCourseCopy} from './i18n/home-courses.js';
import {getCourseCopy} from './i18n/courses.js';
import {getCourseMapCopy} from './i18n/course-map.js';
import {CoursePhoto} from './courses/CoursesPage.js';
import {getCourseCommerceCopy} from './i18n/course-commerce.js';
import './home-courses.css';
export function HomeCourses({locale,onNavigate}:{locale:Locale;onNavigate:(path:string)=>void}){
 const c=getHomeCourseCopy(locale),copy=getCourseCopy(locale),m=getCourseMapCopy(locale),commerce=getCourseCommerceCopy(locale);
 const request=useGuideRequest('/api/courses?locale='+locale,CoursesResponseSchema);
 const [persona,setPersona]=useState<CoursePersona|null>(null);
 const all=request.value?.items??[];
 const matching=all.filter(item=>!persona||item.personaTag.includes(persona));
 const items=persona?matching.slice(0,6):all.filter(item=>item.featured);
 const allPath='/courses'+(persona?'?persona='+persona:'');
 return <section className="home-courses section-wrap" data-testid="home-courses" aria-labelledby="home-course-title">
  <header><div><p className="eyebrow blue">DALLABUSAN / MAKE A DAY OF IT</p><h1 id="home-course-title">{c.title}</h1><p className="home-course-intro">{c.intro}</p></div><a className="home-all-courses" href={allPath+(persona?'&':'?')+'locale='+locale} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate(allPath);}}}>{persona?commerce.more:c.all} {matching.length} ↗</a></header>
  <BuilderLink locale={locale} onNavigate={onNavigate}/>
  <div className="home-course-tabs" role="group" aria-label={commerce.filter}><button aria-pressed={!persona} onClick={()=>setPersona(null)}>{commerce.all}</button>{CoursePersonaSchema.options.map(value=><button key={value} aria-pressed={persona===value} onClick={()=>setPersona(value)}>{commerce[value]}</button>)}</div>
  {request.value&&<p className="home-course-count" role="status">{matching.length} {commerce.count}</p>}
  {request.pending&&<p role="status">{copy.loading}</p>}{request.error&&<div role="alert">{copy.failed}<button onClick={request.retry}>{copy.retry}</button></div>}
  <div className="home-course-grid">{items.map(course=><a key={course.id} data-testid="home-course-card" className="home-course-card" href={'/courses/'+course.id+'?locale='+locale} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate('/courses/'+course.id);}}}>
    <div className="home-course-image"><CoursePhoto course={course} locale={locale}/><span>{copy[course.category]} · {course.route.mode==='walking'?m.walk:m.drive}</span></div><div className="home-course-body"><h2>{course.title}</h2><p className="course-duration">{course.duration}</p><ol>{course.steps.map((step,i)=><li key={step.kind+':'+step.id}><b>{i+1}</b><span lang={step.locale}>{step.name}</span></li>)}</ol><strong>{c.view} ↗</strong></div>
  </a>)}</div>{request.value&&items.length===0&&<p>{commerce.empty}</p>}{request.value&&matching.length>items.length&&<a className="home-all-courses" href={allPath+(persona?'&':'?')+'locale='+locale} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate(allPath);}}}>{commerce.more} ({matching.length}) ↗</a>}<p className="home-course-note">{commerce.durationNote}</p><p className="home-course-note">{c.note}</p>
 </section>;
}
