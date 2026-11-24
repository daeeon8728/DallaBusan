import { useState } from 'react';
import { CourseDetailSchema, CoursesResponseSchema, CourseCategorySchema, type Course, type Locale } from '@trip-fit/domain';
import { useGuideRequest } from '../hooks/useGuideRequest.js';
import { getCourseCopy } from '../i18n/courses.js';
import { getLocalizationCopy } from '../i18n/localization.js';
import { MonthlyDestinations } from '../Destinations.js';
import { PublicGuideList, PublicGuideDetail } from '../PublicGuides.js';
import { NearbyParking } from '../Parking.js';
export function CoursePhoto({ course, locale }: {
    course: Course;
    locale: Locale;
}) { const [failed, setFailed] = useState(false); return <div className="course-photo">{course.image && !failed ? <img src={course.image.url} alt={course.title} loading="lazy" onError={() => setFailed(true)}/> : <div className="course-photo-fallback"><span aria-hidden="true">↗</span>{getCourseCopy(locale).noPhoto}</div>}</div>; }
function CourseDetail({ id, locale, onNavigate }: {
    id: string;
    locale: Locale;
    onNavigate: (path: string) => void;
}) { const c = getCourseCopy(locale); const request = useGuideRequest('/api/courses/' + encodeURIComponent(id) + '?locale=' + locale, CourseDetailSchema); const course = request.value?.course; return <article className="course-detail section-wrap"><a href={'/courses?locale=' + locale} onClick={e => { if (!e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    onNavigate('/courses');
} }}>← {c.back}</a>{request.error ? <div role="alert"><h1>{c.missing}</h1><button onClick={request.retry}>{c.retry}</button></div> : !course ? <p role="status">{c.loading}</p> : <><header><p className="eyebrow blue">{c[course.category]} / {c.idea}</p><h1>{course.title}</h1><p className="course-warning">{c.warning}</p></header><CoursePhoto key={course.id} course={course} locale={locale}/>{course.image && <details><summary>{c.photo}</summary><p>{course.image.credit}</p></details>}{course.category === 'family' && <p className="course-warning">{c.familyNote}</p>}<h2>{c.sequence}</h2><ol className="course-stops">{course.steps.map((step, i) => <li key={i}><span className="course-stop-number">{String(i + 1).padStart(2, '0')}</span><div><h3 lang={step.locale}>{step.name}</h3>{step.contentTranslation === 'machine' && <p className="guide-note">{getLocalizationCopy(locale).machine}</p>}{locale !== 'ko' && step.originalName && step.originalName !== step.name && <details><summary>{getLocalizationCopy(locale).original}</summary><p lang="ko">{step.originalName}</p></details>}{step.address && <p>{step.address}</p>}{step.href && <a href={step.href + '?locale=' + locale} onClick={e => { if (!e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    onNavigate(step.href ?? '/courses');
} }}>{c.details} ↗</a>}{step.sourceUrl && <a className="course-source" href={step.sourceUrl} target="_blank" rel="noopener noreferrer">{c.source} ↗</a>}{course.category === 'family' && step.kind !== 'note' && step.id && <NearbyParking kind={step.kind} id={step.id} locale={locale}/>}</div></li>)}</ol><p className="guide-note">{c.onward}</p></>}</article>; }
export function CoursesPage({ route, locale, onNavigate }: {
    route: string;
    locale: Locale;
    onNavigate: (path: string) => void;
}) {
    const c = getCourseCopy(locale);
    const inspiration = (route === '/courses/inspiration' || route.startsWith('/courses/inspiration/'));
    const slug = route.split('/')[2];
    const selected = CourseCategorySchema.safeParse(new URLSearchParams(window.location.search).get('category'));
    const category = selected.success ? selected.data : undefined;
    const request = useGuideRequest('/api/courses?locale=' + locale, CoursesResponseSchema);
    const items = request.value?.items.filter(item => !category || item.category === category) ?? [];
    return <><nav className="course-subnav section-wrap" aria-label={c.nav}>{[['/courses', c.curated], ['/courses/inspiration', c.stories]].map(([href, label]) => <a key={href} href={href + '?locale=' + locale} aria-current={(href === '/courses/inspiration' ? inspiration : !inspiration) ? 'page' : undefined} onClick={e => { if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNavigate(href ?? '/courses');
    } }}>{label}</a>)}</nav>{inspiration ? (route.split('/')[3] ? <PublicGuideDetail kind="recommended" id={route.split('/')[3] ?? ''} locale={locale} onNavigate={onNavigate}/> : <PublicGuideList kind="recommended" locale={locale} onNavigate={onNavigate}/>) : slug ? <CourseDetail key={slug + locale} id={slug} locale={locale} onNavigate={onNavigate}/> : <section className="courses-page section-wrap" data-testid="courses-page"><header className="courses-intro"><p className="eyebrow blue">DALLABUSAN / YOUR NEXT CHAPTER</p><h1>{c.title}</h1><p>{c.intro}</p><p className="course-warning">{c.warning}</p></header><div className="course-categories" role="group" aria-label={c.nav}>{[undefined, ...CourseCategorySchema.options].map(value => <a key={value ?? 'all'} href={'/courses?locale=' + locale + (value ? '&category=' + value : '')} aria-current={category === value ? 'page' : undefined} onClick={e => { if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNavigate('/courses' + (value ? '?category=' + value : ''));
    } }}>{value ? c[value] : c.all}{value && request.value && <span>{request.value.counts[value]}</span>}</a>)}</div>{request.error && <div className="error-notice" role="alert">{c.failed}<button onClick={request.retry}>{c.retry}</button></div>}{request.pending && <p role="status">{c.loading}</p>}<p role="status">{items.length} {c.ideas}</p><div className="courses-grid" aria-busy={request.pending}>{items.map(course => <a className="course-card" data-testid="course-card" key={course.id} href={'/courses/' + course.id + '?locale=' + locale} onClick={e => { if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNavigate('/courses/' + course.id);
    } }}><CoursePhoto course={course} locale={locale}/><div><span className="eyebrow blue">{c[course.category]}</span><h2>{course.title}</h2><p>{course.steps.filter(step => step.kind !== 'note').map(step => step.name).join(' → ')}</p><small>{c.preview}</small><strong>{c.view} ↗</strong></div></a>)}</div><MonthlyDestinations locale={locale} onNavigate={onNavigate}/></section>}</>;
}
