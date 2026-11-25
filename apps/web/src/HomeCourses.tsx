import {useState} from 'react';
import {CoursesResponseSchema,CourseCategorySchema,type CourseCategory,type Locale} from '@trip-fit/domain';
import {useGuideRequest} from './hooks/useGuideRequest.js';
import {getHomeCourseCopy} from './i18n/home-courses.js';
import {getCourseCopy} from './i18n/courses.js';
import {getCourseMapCopy} from './i18n/course-map.js';
import {CoursePhoto} from './courses/CoursesPage.js';
import './home-courses.css';
export function HomeCourses({locale,onNavigate}:{locale:Locale;onNavigate:(path:string)=>void}){
 const c=getHomeCourseCopy(locale),copy=getCourseCopy(locale),m=getCourseMapCopy(locale);
 const request=useGuideRequest('/api/courses?locale='+locale,CoursesResponseSchema);
 const [category,setCategory]=useState<CourseCategory|null>(null);
 const all=request.value?.items??[];
 const items=category?all.filter(item=>item.category===category).slice(0,3):(['family','date','food'] as const).flatMap(category=>{const item=all.find(item=>item.category===category);return item?[item]:[];});
 return <section className="home-courses section-wrap" data-testid="home-courses" aria-labelledby="home-course-title">
  <header><div><p className="eyebrow blue">DALLABUSAN / MAKE A DAY OF IT</p><h1 id="home-course-title">{c.title}</h1><p className="home-course-intro">{c.intro}</p></div><a className="home-all-courses" href={'/courses?locale='+locale} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate('/courses');}}}>{c.all} {request.value?.total} ↗</a></header>
  <div className="home-course-tabs" role="group" aria-label={copy.nav}><button aria-pressed={!category} onClick={()=>setCategory(null)}>{copy.all}</button>{CourseCategorySchema.options.map(value=><button key={value} aria-pressed={category===value} onClick={()=>setCategory(value)}>{copy[value]}</button>)}</div>
  {request.pending&&<p role="status">{copy.loading}</p>}{request.error&&<div role="alert">{copy.failed}<button onClick={request.retry}>{copy.retry}</button></div>}
  <div className="home-course-grid">{items.map(course=><a key={course.id} data-testid="home-course-card" className="home-course-card" href={'/courses/'+course.id+'?locale='+locale} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();onNavigate('/courses/'+course.id);}}}>
    <div className="home-course-image"><CoursePhoto course={course} locale={locale}/><span>{copy[course.category]} · {course.route.mode==='walking'?m.walk:m.drive}</span></div><div className="home-course-body"><h2>{course.title}</h2><ol>{course.steps.map((step,i)=><li key={step.kind+':'+step.id}><b>{i+1}</b><span lang={step.locale}>{step.name}</span></li>)}</ol><strong>{c.view} ↗</strong></div>
  </a>)}</div><p className="home-course-note">{c.note}</p>
 </section>;
}
