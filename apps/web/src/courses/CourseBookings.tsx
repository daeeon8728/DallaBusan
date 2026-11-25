import {CourseOffersSchema,type Locale,type PublicOffer} from '@trip-fit/domain';
import {useGuideRequest} from '../hooks/useGuideRequest.js';
import {OfferCard} from '../Offer.js';
import {getHomeCourseCopy} from '../i18n/home-courses.js';
import {getCourseCopy} from '../i18n/courses.js';
export function CourseBookings({id,locale,onOpen}:{id:string;locale:Locale;onOpen:(offer:PublicOffer)=>void}){
 const c=getHomeCourseCopy(locale),copy=getCourseCopy(locale);
 const request=useGuideRequest('/api/courses/'+encodeURIComponent(id)+'/offers?locale='+locale,CourseOffersSchema);
 return <section className="course-bookings" data-testid="course-bookings"><h2>{c.tickets}</h2><p>{c.ticketNote}</p>
 {request.pending&&<p role="status">{copy.loading}</p>}{request.error&&<div role="alert">{copy.failed}<button onClick={request.retry}>{copy.retry}</button></div>}
 {request.value&&request.value.items.length===0&&<p>{c.empty}</p>}
 <div className="course-booking-grid">{request.value?.items.map(item=><div key={item.offer.id}><p className="course-booking-place">{c.forPlace}: {item.destinationName}</p><OfferCard offer={item.offer} locale={locale} onOpen={onOpen}/></div>)}</div>
 </section>;
}
