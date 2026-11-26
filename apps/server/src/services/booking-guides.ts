import{BookingGuideSchema,BookingGuideFieldSchema,type Locale}from'@trip-fit/domain';import{bookingGuideFingerprint,BookingGuideConfigSchema,type BookingGuideConfig}from'../config/booking-guides.js';import type{OfferCatalogConfig}from'../config/offers.js';import type{OfferService}from'./offers.js';
export function createBookingGuideService(input:BookingGuideConfig,catalog:OfferCatalogConfig,offers:OfferService,today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())){
 const config=BookingGuideConfigSchema.parse(input),rows=new Map(config.items.map(i=>[i.offerId,i])),raw=new Map(catalog.offers.map(i=>[i.id,i])),providers=new Map(catalog.providers.map(p=>[p.id,p]));
 return{get(id:string,locale:Locale){const offer=offers.get(id,locale);if(!offer)return null;const row=rows.get(id),source=raw.get(id),provider=source?providers.get(source.providerId):undefined;
 const matches=Boolean(row&&source&&provider&&row.providerId===source.providerId&&row.externalId===source.externalId&&row.sourceHash===bookingGuideFingerprint(source)&&row.claims.every(claim=>claim.evidence.every(e=>e.url===source.sourceUrl&&provider.sourceHosts.includes(new URL(e.url).hostname))));
 const fresh=Boolean(row&&row.reviewedOn<=today()&&row.reviewExpiresOn>=today());
 const status=!row?'unreviewed':!matches?'source-changed':!fresh?'expired':'partial';
 return BookingGuideSchema.parse({offerId:id,locale,status,bookingLocale:offer.bookingLocale,reviewedOn:row?.reviewedOn??null,validUntil:status==='partial'&&row?new Date(row.reviewExpiresOn+'T15:00:00.000Z').toISOString():null,claims:BookingGuideFieldSchema.options.map(field=>{const claim=status==='partial'?row?.claims.find(c=>c.field===field):undefined;return claim?{field,status:claim.status,text:claim.texts[locale],evidence:claim.evidence}:{field,status:'unknown',text:null,evidence:[]};})});}};
}
export type BookingGuideService=ReturnType<typeof createBookingGuideService>;
