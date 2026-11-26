import{BookingGuide}from'./booking/BookingGuide.js';
import{getBookingGuideCopy}from'./i18n/booking-guide.js';
import {StayBanner} from './StayBanner.js';
import {StayMap} from './StayMap.js';
import {getOfferDialogCopy} from './i18n/offer-dialog.js';
import { BookingLanguage } from './BookingLanguage.js';
import { BookingNotice } from './BookingNotice.js';
import { Price } from './currency/Price.js';
import { AddToCart } from './cart/CartControls.js';
import { SaveButton } from './saved/SaveButton.js';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useGuideRequest } from './hooks/useGuideRequest.js';
import { PublicOfferSchema,RelatedOffersResponseSchema } from '@trip-fit/domain';
import type { Locale, PublicOffer } from '@trip-fit/domain';
import { getDetailCopy } from './i18n/details.js';
import { getCopy } from './i18n/index.js';

type IconName = 'search' | 'arrow' | 'ticket' | 'tour' | 'yacht' | 'package' | 'activity' | 'spa' | 'snap' | 'transport' | 'stay' | 'food';
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, string> = {
    search: 'm21 21-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
    arrow: 'M4 12h16 m-6-6 6 6-6 6', ticket: 'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5 M15 5v3 m0 3v2 m0 3v3',
    tour: 'M3 4h6l6 3 6-3v16l-6 3-6-3H3V4 M9 4v16 M15 7v16',
    yacht: 'M12 3v12H3l9-12 M14 7l7 8h-7V7 M2 18c3 4 5 0 8 2s5-2 8 0 4-2 4-2',
    package: 'M3 8h18v12H3V8 M8 8V4h8v4 M8 8v12 M16 8v12',
    activity: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7',
    spa: 'M12 21C4 21 1 14 3 8c5 0 9 5 9 13 M12 21c8 0 11-7 9-13-5 0-9 5-9 13 M12 14c-4-5-3-9 0-12 3 3 4 7 0 12',
    snap: 'M3 7h4l2-3h6l2 3h4v14H3V7 M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    transport: 'M5 4h14v14H5V4 M5 11h14 M8 4v7 M16 4v7 M7 21v-3 M17 21v-3 M8 14h1 M15 14h1',
    stay: 'M3 21V3h12v18 M15 9h6v12 M6 7h1 M11 7h1 M6 11h1 M11 11h1 M8 21v-5h4v5',
    food: 'M5 2v7a3 3 0 0 0 6 0V2 M8 2v20 M19 2c-4 4-4 10 0 10v10 M19 2v10',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
function OfferImage({ offer, locale }: { offer: PublicOffer; locale: Locale }) {
  const [failed, setFailed] = useState(false);
  const copy = getCopy(locale);
  const details = getDetailCopy(locale);
  const label = offer.image.kind === 'destination' ? details.destinationPhoto : offer.image.kind === 'illustration' ? details.examplePhoto : null;
  return <div className="offer-image"><BookingNotice offer={offer} locale={locale}/>
    {failed ? <div className="offer-photo-placeholder"><Icon name={offer.category} size={40} /><span>{details.photoMissing}</span></div>
      : <img src={offer.image.url} alt={label ? offer.title + ' · ' + label : offer.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
    {label && !failed && <span className="image-label">{label}</span>}
    <span className="sr-only">{copy.categories[offer.category]}</span>
  </div>;
}
function PhotoCredit({offer,locale}: {offer:PublicOffer;locale:Locale}) {
  const copy=getDetailCopy(locale);
  return <details className="photo-credit"><summary>{copy.photoSource}</summary><p>{offer.image.credit}</p>
    {offer.image.sourceUrl && <a href={offer.image.sourceUrl} target="_blank" rel={offer.image.kind === 'product' ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}>{copy.photoSource} ↗</a>}
    {offer.image.licenseUrl && <a href={offer.image.licenseUrl} target="_blank" rel="noopener noreferrer">{copy.license} ↗</a>}
  </details>;
}
export function OfferCard({ offer, locale, onOpen, actionLabel }: { offer: PublicOffer; locale: Locale; actionLabel?:string; onOpen: (offer: PublicOffer) => void }) {
  const copy = getCopy(locale);
  const price = offer.referencePrice;
  return <article className="offer-card" data-testid="offer-card" data-offer-id={offer.id}><SaveButton target={{kind:"offer",id:offer.id,title:offer.title}} locale={locale}/>
    <button className="image-button" onClick={() => onOpen(offer)} aria-label={offer.title + ' — ' + copy.details}><OfferImage key={offer.image.url} offer={offer} locale={locale} /><span className="card-corner"><Icon name="arrow" size={19} /></span></button>
    <div className="card-meta"><span>{copy.categories[offer.category]}</span><span className="provider-name">{offer.provider.displayName}</span></div>
    <h3><button onClick={() => onOpen(offer)}>{offer.title}</button></h3>
    {offer.localizationStatus === 'fallback' && <p className="original-note">{copy.original}</p>}{offer.localizationStatus === 'translated' && <p className="translated-note">{getDetailCopy(locale).translated}</p>}
    <BookingLanguage offer={offer} locale={locale}/><PhotoCredit offer={offer} locale={locale} />
    <p className="scope-note">{copy.scopes[offer.scope]}</p>
    <div className="card-bottom"><div>{price ? <><span className="price-label">{copy.reference}</span><strong><Price amount={price.amount} currency={price.currency} locale={locale}/></strong></> : <span className="unknown-price">{copy.unknownPrice}</span>}</div><button className="text-action" onClick={() => onOpen(offer)}>{actionLabel??copy.details}<Icon name="arrow" size={16} /></button></div>
    <AddToCart offer={offer} locale={locale}/>
  </article>;
}
function RelatedOffers({offerId,locale,onSelect}:{offerId:string;locale:Locale;onSelect:(id:string)=>void}){
  const copy=getCopy(locale),text=getOfferDialogCopy(locale);
  const request=useGuideRequest('/api/offers/'+encodeURIComponent(offerId)+'/related?locale='+locale,RelatedOffersResponseSchema);
  return <div className="offer-related" data-testid="offer-related">
    <section aria-labelledby="offer-related-title" data-testid="related-experiences"><header><h3 id="offer-related-title">{text.related}</h3><p>{text.note}</p></header>
      {request.pending&&<p role="status">{copy.loading}</p>}
      {request.error&&<div className="error-notice" role="alert"><p>{text.failed}</p><button onClick={request.retry}>{copy.retry}</button></div>}
      {!request.pending&&!request.error&&request.value?.items.length===0&&<p>{text.empty}</p>}
      <div className="related-offer-grid">{request.value?.items.map(({offer,reason,places})=><div key={offer.id}><p className="related-reason">{reason==='shared-place'?text.place+' · '+places.join(' / '):text.similar}</p><OfferCard offer={offer} locale={locale} onOpen={selected=>onSelect(selected.id)}/></div>)}</div>
    </section>
    <section className="related-stays" aria-labelledby="offer-stays-title" data-testid="nearby-stays"><header><h3 id="offer-stays-title">{text.stays}</h3><p>{text.stayNote}</p></header>
      {request.pending&&<p role="status">{copy.loading}</p>}
      {!request.pending&&!request.error&&request.value?.nearbyStays.length===0&&<p>{text.noStays}</p>}
      <div className="related-offer-grid">{request.value?.nearbyStays.map(({offer,areas})=><div key={offer.id}><p className="related-reason">{areas.join(' / ')}</p><OfferCard offer={offer} locale={locale} onOpen={selected=>onSelect(selected.id)}/></div>)}</div>
      <StayMap locale={locale}/><StayBanner locale={locale}/>
    </section>
  </div>;
}
function OfferDialogContent({offer,locale,onSelect,bookingLabel}:{offer:PublicOffer;locale:Locale;bookingLabel?:string|undefined;onSelect:(id:string)=>void}){
  const copy=getCopy(locale);
  return <><div className="dialog-product"><div className="dialog-gallery"><OfferImage key={offer.id} offer={offer} locale={locale}/><PhotoCredit offer={offer} locale={locale}/></div>
    <div className="dialog-body"><p className="dialog-kicker">{copy.categories[offer.category]} · {copy.scopes[offer.scope]}</p><h2 id="offer-title">{offer.title}</h2><SaveButton target={{kind:'offer',id:offer.id,title:offer.title}} locale={locale} inline/>
      {offer.localizationStatus==='fallback'&&<p className="original-note">{copy.original}</p>}{offer.localizationStatus==='translated'&&<p className="translated-note">{getDetailCopy(locale).translated}</p>}
      {offer.localizationStatus==='translated'&&<details className="original-title"><summary>{getDetailCopy(locale).originalTitle}</summary><p lang={offer.originalTitleLocale}>{offer.originalTitle}</p><p>{getDetailCopy(locale).translationNote}</p></details>}
      <BookingLanguage offer={offer} locale={locale}/><p className="dialog-provider">{offer.provider.displayName}</p>
      <div className="dialog-price">{offer.referencePrice?<><span>{copy.reference}</span><strong><Price amount={offer.referencePrice.amount} currency={offer.referencePrice.currency} locale={locale}/></strong><small>{copy.priceDate}: {offer.referencePrice.observedOn}</small></>:<strong>{copy.unknownPrice}</strong>}</div>
      <AddToCart offer={offer} locale={locale}/><p className="fine-print">{copy.priceNote}</p><p className="fine-print">{copy.availability}</p>
      <button className="booking-guide-jump" onClick={()=>{const heading=document.getElementById('booking-guide-heading');heading?.scrollIntoView({block:'start'});heading?.focus({preventScroll:true});}}>{getBookingGuideCopy(locale).jump} ↓</button>
      <a className="primary-button booking-link" href={offer.href} target="_blank" rel="sponsored noopener noreferrer">{bookingLabel??copy.book}<Icon name="arrow" size={20}/></a>
      <p className="external-note">{copy.external}</p><p className="affiliate-note">{copy.disclosure}</p>
    </div></div><BookingGuide key={offer.id+locale} offer={offer} locale={locale}/><RelatedOffers key={offer.id+locale} offerId={offer.id} locale={locale} onSelect={onSelect}/></>;
}
function isOutside(event:PointerEvent<HTMLDialogElement>){
  if(event.target!==event.currentTarget)return false;
  const bounds=event.currentTarget.getBoundingClientRect();
  return event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom;
}
function ResolvedOfferDialog({offer,locale,onClose,bookingLabel}:{offer:PublicOffer;locale:Locale;bookingLabel?:string|undefined;onClose:()=>void}){
  const [trigger]=useState(()=>document.activeElement);
  const [selectedId,setSelectedId]=useState(offer.id);
  const ref=useRef<HTMLDialogElement>(null),scrollRef=useRef<HTMLDivElement>(null),closeRef=useRef<HTMLButtonElement>(null),outsidePointer=useRef<number|null>(null);
  const copy=getCopy(locale),text=getOfferDialogCopy(locale);
  const request=useGuideRequest('/api/offers/'+encodeURIComponent(selectedId)+'?locale='+locale,PublicOfferSchema);
  const current=request.value;
  useEffect(()=>{
    const dialog=ref.current;if(!dialog)return;
    const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();closeRef.current?.focus({preventScroll:true});
    return()=>{document.body.style.overflow=previousOverflow;if(dialog.open)dialog.close();queueMicrotask(()=>{if(trigger instanceof HTMLElement&&trigger.isConnected)trigger.focus({preventScroll:true});});};
  },[trigger]);
  useEffect(()=>{scrollRef.current?.scrollTo({top:0});closeRef.current?.focus({preventScroll:true});},[selectedId,locale]);
  return <dialog ref={ref} className="offer-dialog" aria-labelledby={current?'offer-title':'offer-dialog-heading'}
    onCancel={event=>{event.preventDefault();onClose();}} onClose={onClose}
    onPointerDown={event=>{outsidePointer.current=isOutside(event)?event.pointerId:null;}}
    onPointerUp={event=>{const shouldClose=outsidePointer.current===event.pointerId&&isOutside(event);outsidePointer.current=null;if(shouldClose)onClose();}}
    onPointerCancel={()=>{outsidePointer.current=null;}}>
    <header className="offer-dialog-header"><p id="offer-dialog-heading">{text.heading}</p><button ref={closeRef} className="close-dialog" onClick={onClose} aria-label={copy.close}>×</button></header>
    <div ref={scrollRef} className="offer-dialog-scroll" data-testid="offer-dialog-scroll">
      {current?<OfferDialogContent key={current.id+locale} offer={current} locale={locale} onSelect={setSelectedId} bookingLabel={selectedId===offer.id?bookingLabel:undefined}/>:<div className="dialog-pending">{request.error?<div role="alert"><p>{copy.failed}</p><button onClick={request.retry}>{copy.retry}</button></div>:<p role="status">{copy.loading}</p>}</div>}
    </div>
  </dialog>;
}
export function OfferDialog({offer,locale,onClose,bookingLabel}:{offer:PublicOffer|null;locale:Locale;bookingLabel?:string|undefined;onClose:()=>void}){return offer?<ResolvedOfferDialog key={offer.id} offer={offer} locale={locale} onClose={onClose} bookingLabel={bookingLabel}/>:null;}
