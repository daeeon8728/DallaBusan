import {useState} from 'react';import {StayMapResponseSchema,type Locale} from '@trip-fit/domain';import {useGuideRequest} from './hooks/useGuideRequest.js';import {getOfferDialogCopy} from './i18n/offer-dialog.js';import {getCopy} from './i18n/index.js';
function StayMapFrame({locale}:{locale:Locale}){
 const text=getOfferDialogCopy(locale),copy=getCopy(locale);
 const [mobile]=useState(()=>window.matchMedia('(max-width:850px)').matches);
 const request=useGuideRequest('/api/stay-map?locale='+locale+'&mobile='+(mobile?'1':'0'),StayMapResponseSchema);
 return <>{request.pending&&<p role="status">{copy.loading}</p>}{request.error&&<div role="alert" className="error-notice"><p>{text.mapFailed}</p><button onClick={request.retry}>{copy.retry}</button></div>}{!request.pending&&!request.error&&request.value&&<>
  <p>{text.mapDefaults.replace('{checkIn}',request.value.checkIn).replace('{checkOut}',request.value.checkOut)}</p>
  <div className="stay-map-controls"><a href={request.value.url} target="_blank" rel="sponsored noopener noreferrer">{text.openMap} ↗</a></div>
  <iframe src={request.value.url} title={text.map} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" referrerPolicy="strict-origin-when-cross-origin"/>
  <p>{text.mapFallback}</p>
 </>}</>;
}
export function StayMap({locale}:{locale:Locale}){
 const [open,setOpen]=useState(false),text=getOfferDialogCopy(locale);
 return <div className="stay-map" data-testid="stay-map"><div className="stay-map-controls"><button className="primary-button" aria-expanded={open} aria-controls="stay-map-content" onClick={()=>setOpen(value=>!value)}>{open?text.hideMap:text.map}</button></div><p>{text.mapNote}</p><div id="stay-map-content">{open&&<StayMapFrame key={locale} locale={locale}/>}</div></div>;
}
