import {DetailAdvertisement} from './advertising/DetailAdvertisement.js';
import { getLocalizationCopy } from './i18n/localization.js';
import { NearbyParking } from './Parking.js';
import { SaveButton } from './saved/SaveButton.js';
import { useGuideRequest } from './hooks/useGuideRequest.js';
import { useState } from 'react';
import { DestinationDetailSchema, DestinationListSchema, type Destination, type Locale, type PublicOffer } from '@trip-fit/domain';
import { getGuideCopy } from './i18n/guide.js';
import { getDetailCopy } from './i18n/details.js';
import { getCopy } from './i18n/index.js';
import { OfferCard } from './Offer.js';

function PlaceImage({ destination }: { destination: Destination }) {
  const [failed, setFailed] = useState(false);
  const copy = getGuideCopy(destination.requestedLocale);
  return <div className="destination-photo">{destination.image && !failed
    ? <img src={destination.image.url} alt={destination.name} onError={() => setFailed(true)} loading="lazy" />
    : <div className="place-placeholder"><span aria-hidden="true">⌖</span><strong>{destination.district ?? 'BUSAN'}</strong><small>{copy.noPhoto}</small></div>}
    {destination.image && !failed && <span>{destination.image.credit}</span>}</div>;
}
export function MonthlyDestinations({ locale, onNavigate }: { locale: Locale; onNavigate: (path: string) => void }) {
  const copy = getGuideCopy(locale);
  const { value, error, retry } = useGuideRequest('/api/destinations?locale=' + locale, DestinationListSchema);
  const items = value ? value.featured.length ? value.featured : value.items.slice(0,2) : [];
  const month = value ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', timeZone: 'Asia/Seoul' }).format(new Date(value.month + '-01T00:00:00+09:00')) : '';
  return <section data-home-section="destinations" className="monthly-section section-wrap" aria-labelledby="monthly-title" data-testid="monthly-destinations">
    <div className="monthly-heading"><div><p className="eyebrow blue">{copy.editorPick}</p><h2 id="monthly-title">{value?.featured.length ? copy.monthly : copy.guides}</h2></div>{value && <span>{month}</span>}</div>
    {!value && !error && <p role="status">{copy.loading}</p>}
    {error && <div className="error-notice" role="alert"><p>{copy.failed}</p><button onClick={retry}>{copy.retry}</button></div>}
    <div className="destination-grid">{items.map(item => <div key={item.slug} className="destination-save-wrap"><SaveButton target={{kind:"destination",id:item.slug,title:item.name}} locale={locale}/><a className="destination-banner" href={'/places/' + item.slug + '?locale=' + locale} onClick={event => { if (!event.ctrlKey && !event.metaKey) { event.preventDefault(); onNavigate('/places/' + item.slug); } }}>
      <PlaceImage destination={item} /><div className="destination-banner-copy"><span>BUSAN / {item.slug.toUpperCase()}</span><h3>{item.name}</h3>{item.contentTranslation==='machine'&&<p className="translated-note">{getLocalizationCopy(locale).machine}</p>}<p>{item.description.slice(0,100)}…</p><strong>{copy.explore} <span aria-hidden="true">↗</span></strong></div>
    </a></div>)}</div>
    {value && <p className="guide-note">{copy.note}</p>}
  </section>;
}
export function DestinationPage({ slug, locale, onNavigate, onOpen }: {
  slug: string; locale: Locale; onNavigate: (path: string) => void; onOpen: (offer: PublicOffer) => void;
}) {
  const copy = getGuideCopy(locale);
  const productCopy = getCopy(locale);
  const details = getDetailCopy(locale);
  const { value, error, retry } = useGuideRequest('/api/destinations/' + encodeURIComponent(slug) + '?locale=' + locale, DestinationDetailSchema);
  const destination = value?.destination;
  const groups = ['tour', 'ticket', 'experience', 'stay'] as const;
  return <article className="destination-page section-wrap">
    <a className="back-to-search" href={'/search?locale=' + locale} onClick={event => { if (!event.ctrlKey && !event.metaKey) { event.preventDefault(); onNavigate('/search'); } }}>← {copy.all}</a>
    {!value && !error && <p role="status">{copy.loading}</p>}
    {error && <div className="error-notice" role="alert"><h1>{error === 'missing' ? copy.notFound : copy.failed}</h1>{error !== 'missing' && <button onClick={retry}>{copy.retry}</button>}</div>}
    {destination && <>
      <header className="destination-intro"><p className="eyebrow blue">BUSAN DESTINATION GUIDE</p><h1>{destination.name}</h1><SaveButton target={{kind:"destination",id:destination.slug,title:destination.name}} locale={locale} inline/><p>{copy.explore}</p>{destination.reviewStatus === "source" && <p className="source-status">{copy.sourceRecord}</p>}</header>
      <PlaceImage key={destination.image?.url ?? destination.slug} destination={destination} />
      {destination.image && <details className="photo-credit"><summary>{details.photoSource}</summary><p>{destination.image.credit}</p>{destination.image.sourceUrl && <a href={destination.image.sourceUrl} target="_blank" rel="noopener noreferrer">{details.photoSource} ↗</a>}{destination.image.licenseUrl && <a href={destination.image.licenseUrl} target="_blank" rel="noopener noreferrer">{details.license} ↗</a>}</details>}
      <div className="destination-facts"><section><h2>{copy.about}</h2>
        {destination.contentTranslation==='machine'&&<p className="translated-note">{getLocalizationCopy(locale).machine}</p>}{destination.translationFallback && <p className="translation-notice">{copy.fallback}</p>}
        <p className="destination-description" lang={destination.locale}>{destination.description}</p>
        {value.content.length > destination.description.length && <details className="place-story"><summary>{details.more}</summary><p className="destination-description" lang={destination.locale}>{value.content}</p></details>}
        <p className="guide-note">{destination.reviewedOn ? copy.asOf + ': ' + destination.reviewedOn + ' · ' : ''}{copy.sourceAsOf}: {new Intl.DateTimeFormat(locale,{timeZone:'Asia/Seoul',dateStyle:'medium'}).format(new Date(destination.sourceRetrievedAt))}</p>
        <a className="source-link" href={destination.sourceUrl} target="_blank" rel="noopener noreferrer">{copy.source} ↗</a>
      </section><aside><dl><dt>{copy.address}</dt><dd lang={destination.address ? destination.addressLocale : destination.locale}>{destination.address ?? destination.district ?? copy.unknownAddress}</dd>{!destination.address && <dd className="guide-note">{copy.unknownAddress}</dd>}{destination.address && locale !== destination.addressLocale && <dd className="guide-note">{details.addressNote}</dd>}<dt>{copy.holiday}</dt><dd lang={destination.locale}>{destination.holidayInfo ?? copy.unknownHoliday}</dd></dl><dl className="visit-info" lang={destination.locale}>{(['hours','fees','transport','contact'] as const).map(field => <div key={field}><dt>{details[field]}</dt><dd>{value.visitInfo[field] ?? details.unknown}</dd></div>)}</dl>
        {value.visitInfo.homepage && <a className="source-link" href={value.visitInfo.homepage} target="_blank" rel="noopener noreferrer">{details.homepage} ↗</a>}
        <p className="guide-note">{details.feeNote}</p><p className="guide-note">{details.visitNote}</p><a className="source-link" href={destination.addressSourceUrl} target="_blank" rel="noopener noreferrer">{copy.source} ↗</a></aside></div>
      <NearbyParking kind="destination" id={destination.slug} locale={locale}/>
      <section className="related-offers" aria-labelledby="related-title"><p className="eyebrow blue">EXPLORE & BOOK</p><h2 id="related-title">{copy.related}</h2><p className="guide-note">{productCopy.disclosure}</p>
      {groups.map(group => {
        const links = value.related.filter(item => item.relationship === group);
        return <section key={group} className="related-group" data-testid={'related-' + group}><h3>{copy[group]}</h3>
          {group === 'stay' && <p className="guide-note">{copy.nearbyNote}</p>}
          {group === 'ticket' && <p className="guide-note">{copy.ticketNote}</p>}
          {links.length ? <div className="offer-grid">{links.map(link => <div key={link.offer.id}>{link.areaLabel && <p className="stay-area">{link.areaLabel}</p>}<OfferCard offer={link.offer} locale={locale} onOpen={onOpen} /></div>)}</div>
            : <p className="no-related">{copy.empty}</p>}
        </section>;
      })}</section>
      <DetailAdvertisement locale={locale} identity={'destination:'+destination.slug}/>
    </>}
  </article>;
}

export function DestinationResults({ locale, query, onNavigate }: { locale: Locale; query: string; onNavigate: (path: string) => void }) {
  const copy = getGuideCopy(locale);
  const [linked, setLinked] = useState(false);
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const key = locale + '|' + query + '|' + linked;
  const page = pageState.key === key ? pageState.page : 1;
  const params = new URLSearchParams({ locale, q: query, page: String(page), limit: '6', linked: linked ? 'linked' : 'all' });
  const { value, error, retry, pending, previous } = useGuideRequest('/api/destinations?' + params.toString(), DestinationListSchema, true);
  return <section className="destination-results section-wrap" aria-labelledby="destination-results-title" data-testid="destination-results">
    <div className="destination-results-heading"><div><p className="eyebrow blue">DISCOVER BUSAN</p><h2 id="destination-results-title">{copy.resultsTitle}</h2><p className="guide-note">{copy.searchHint}</p></div><a href="#offers">{copy.productsJump} ↓</a></div>
    <label className="linked-toggle"><input type="checkbox" checked={linked} onChange={event => setLinked(event.target.checked)} />{copy.linkedOnly}</label>
    <p className="guide-results-status" role="status">{pending ? copy.loading : previous && value ? copy.previousInfoResults : value ? copy.resultsCount.replace('{count}',String(value.total)).replace('{total}',String(value.catalogTotal)) : ''}</p>
    {error && <div className="error-notice" role="alert"><p>{copy.failed}</p><button onClick={retry}>{copy.retry}</button></div>}
    <div className={'destination-results-grid' + (pending ? ' pending' : '')} aria-busy={pending}>{value?.items.map(item => <article key={item.slug} className="destination-result" data-testid="destination-result"><SaveButton target={{kind:"destination",id:item.slug,title:item.name}} locale={locale}/>
      <a href={'/places/' + item.slug + '?locale=' + locale} onClick={event => { if (!event.ctrlKey && !event.metaKey) { event.preventDefault(); onNavigate('/places/' + item.slug); } }}>
        <PlaceImage key={item.slug} destination={item} />
        <div className="destination-result-body"><span className="district-tag">{item.district ?? 'BUSAN'}</span><h3>{item.name}</h3>{item.contentTranslation==='machine'&&<p className="translated-note">{getLocalizationCopy(locale).machine}</p>}{item.translationFallback && <span className="original-note">{copy.fallback}</span>}<p>{item.description}</p>
          <strong>{copy.relatedCount.replace('{count}',String(item.relatedOfferCount))} <span aria-hidden="true">↗</span></strong></div>
      </a>
    </article>)}</div>
    {value?.items.length === 0 && <p className="no-related">{copy.noResults}</p>}
    {value && value.pages > 1 && <nav className="pagination" aria-label={copy.resultsTitle}>
      <button disabled={page <= 1 || pending} onClick={() => setPageState({key,page:page-1})}>{copy.previousInfo}</button><span>{page} / {value.pages}</span><button disabled={page >= value.pages || pending} onClick={() => setPageState({key,page:page+1})}>{copy.nextInfo}</button>
    </nav>}
  </section>;
}
