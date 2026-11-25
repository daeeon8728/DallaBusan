import {useState} from 'react';
import {CourseOffersSchema,type Locale,type PublicOffer} from '@trip-fit/domain';
import {useGuideRequest} from '../hooks/useGuideRequest.js';
import {OfferCard,OfferDialog} from '../Offer.js';
import {getCourseCommerceCopy} from '../i18n/course-commerce.js';
import {getCourseCopy} from '../i18n/courses.js';
export function CourseBookings({id,locale,onOpen}:{id:string;locale:Locale;onOpen:(offer:PublicOffer)=>void}){
 const c=getCourseCommerceCopy(locale),copy=getCourseCopy(locale);
 const request=useGuideRequest('/api/courses/'+encodeURIComponent(id)+'/offers?locale='+locale,CourseOffersSchema);
 const [selected,setSelected]=useState<PublicOffer|null>(null);
 const value=request.value?.courseId===id&&request.value.locale===locale?request.value:null;
 const bundle=value?.affiliateBundle,spots=value?.affiliateItems.filter(item=>item.kind==='spot')??[],stays=value?.affiliateItems.filter(item=>item.kind==='stay')??[];
 return <section className="course-bookings" data-testid="course-bookings" aria-labelledby="course-commerce-title"><h2 id="course-commerce-title">{c.title}</h2>
 {request.pending&&<p role="status">{copy.loading}</p>}{request.error&&<div role="alert">{copy.failed}<button onClick={request.retry}>{copy.retry}</button></div>}
 {value&&<><div className="course-commerce-contrast">
 <section className="course-bundle" data-testid="course-bundle"><p className="commerce-eyebrow">01 / {c.badge}</p><h3>{c.bundle}</h3><p>{c.bundleNote}</p>
 {bundle?<><p className="course-booking-place">{c.linked}: {bundle.spotName}</p><p className="commerce-persuasion">{bundle.persuasionCopy}</p><OfferCard offer={bundle.offer} locale={locale} onOpen={setSelected} actionLabel={c.bundleCta}/><button className="primary-button course-commerce-cta" onClick={()=>setSelected(bundle.offer)}>{c.bundleCta} ↗</button></>:<p>{c.noBundle}</p>}
 </section>
 <section className="course-spots" data-testid="course-spot-items"><p className="commerce-eyebrow">02 / {c.spots}</p><h3>{c.spots}</h3><p>{c.spotNote}</p>{spots.length===0&&<p>{c.noItems}</p>}
 <div className="course-spot-grid">{spots.map(item=><div key={item.offer.id}><p className="course-booking-place">{c.linked}: {item.spotName}</p><OfferCard offer={item.offer} locale={locale} onOpen={onOpen} actionLabel={c.itemCta}/></div>)}</div>
 </section></div>
 <section className="course-end-stays" data-testid="course-end-stays"><h3>{c.stays}</h3><p>{c.stayNote}</p>{stays.length===0&&<p>{c.noStays}</p>}<div className="course-booking-grid">{stays.map(item=><div key={item.offer.id}><p>{item.areaLabel??item.spotName}</p><OfferCard offer={item.offer} locale={locale} onOpen={onOpen} actionLabel={c.stayCta}/></div>)}</div></section><p className="course-commerce-disclosure">{c.disclosure}</p></>}
 <OfferDialog offer={selected} locale={locale} onClose={()=>setSelected(null)} bookingLabel={c.bundleCta}/>
 </section>;
}
