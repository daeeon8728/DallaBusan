import {getFlightCopy} from './i18n/flights.js';
import {HomeCourses} from './HomeCourses.js';
import {getHomeCourseCopy} from './i18n/home-courses.js';
import {TravelToolsPage,TravelToolsLink} from './TravelTools.js';
import { CoursesPage } from './courses/CoursesPage.js';
import { RecommendationDialog } from './campaigns/RecommendationDialog.js';
import { getCourseCopy } from './i18n/courses.js';
import { Promotions } from './Promotions.js';
import { ExchangeNotice } from './currency/Price.js';
import { CartPage } from './cart/CartPage.js';
import { CartNav,CartNotice } from './cart/CartControls.js';
import { ParkingSearch } from './Parking.js';
import { SavedPage } from './saved/SavedPage.js';
import { SavedNotice } from './saved/SaveButton.js';
import { useSaved } from './saved/useSaved.js';
import { getSavedCopy } from './i18n/saved.js';
import { PublicGuideList, PublicGuideDetail } from './PublicGuides.js';
import { getPublicGuideCopy } from './i18n/public-guides.js';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LocaleSchema, OfferQuerySchema, OffersResponseSchema, type Locale, type OfferCategory, type OffersResponse, type PublicOffer } from '@trip-fit/domain';
import { getCopy, LANGUAGE_OPTIONS, readUiLocale } from './i18n/index.js';
import { Icon, OfferCard, OfferDialog } from './Offer.js';
import { DestinationPage, DestinationResults, MonthlyDestinations } from './Destinations.js';
import { getGuideCopy } from './i18n/guide.js';

function canonicalRoute(path:string) { return path==='/courses/inspiration'||path.startsWith('/courses/inspiration/') ? '/recommended'+path.slice('/courses/inspiration'.length) : path; }

const QUICK_CATEGORIES: OfferCategory[] = ['ticket', 'tour', 'yacht', 'package', 'activity', 'stay'];

export default function App() {
  const initialParams = new URLSearchParams(window.location.search);
  const parsedInitial = OfferQuerySchema.safeParse(Object.fromEntries(initialParams));
  const initial = parsedInitial.success ? parsedInitial.data : OfferQuerySchema.parse({});
  const [route, setRoute] = useState(canonicalRoute(window.location.pathname));
  const [navigationVersion,setNavigationVersion]=useState(0);
  const [locale, setLocale] = useState<Locale>(() => readUiLocale(window.location.search));
  const [search, setSearch] = useState(initial.q);
  const [query, setQuery] = useState(initial.q);
  const [category, setCategory] = useState(initial.category ?? '');
  const [provider, setProvider] = useState(initial.provider ?? '');
  const [scope, setScope] = useState(initial.scope ?? '');
  const [page, setPage] = useState(initial.page);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<OffersResponse | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [selected, setSelected] = useState<PublicOffer | null>(null);
  const requestVersion = useRef(0);
  const saved = useSaved();
  const savedCopy = getSavedCopy(locale);
  const copy = getCopy(locale);
  const guide = getGuideCopy(locale);
  const publicGuide = getPublicGuideCopy(locale);
  const courseCopy=getCourseCopy(locale);
  const isCourses=route==='/courses'||route.startsWith('/courses/');
  const guideKind = route === "/food" || route.startsWith("/food/") ? "food" : route === "/recommended" || route.startsWith("/recommended/") ? "recommended" : null;
  function navigate(path: string) { const target=new URL(path,window.location.origin); target.pathname=canonicalRoute(target.pathname); target.searchParams.set('locale',locale); if(target.pathname==='/search'&&target.searchParams.has('provider')) { setProvider(target.searchParams.get('provider')??''); setCategory(target.searchParams.get('category')??''); setScope(target.searchParams.get('scope')??''); setQuery(''); setSearch(''); setPage(1); setState('loading'); } window.history.pushState(null, '', target.pathname+target.search); setRoute(target.pathname); setNavigationVersion(value=>value+1); setSelected(null); window.scrollTo({top:0,behavior:'instant'}); }
  useEffect(()=>{if(window.location.pathname!==route&&canonicalRoute(window.location.pathname)===route)window.history.replaceState(null,'',route+window.location.search);},[route,navigationVersion]);
  useEffect(() => {
    const back = () => {
      setRoute(canonicalRoute(window.location.pathname)); setNavigationVersion(value=>value+1); setSelected(null);
      const params = new URLSearchParams(window.location.search);
      const parsed = OfferQuerySchema.safeParse(Object.fromEntries(params));
      const filters = parsed.success ? parsed.data : OfferQuerySchema.parse({});
      setSearch(filters.q); setQuery(filters.q); setCategory(filters.category ?? ''); setProvider(filters.provider ?? ''); setScope(filters.scope ?? ''); setPage(filters.page);
      setLocale(readUiLocale(window.location.search));
      setAttempt(value => value + 1); setState('loading');
    };
    window.addEventListener('popstate',back); return () => window.removeEventListener('popstate',back);
  }, []);
  useEffect(() => {
    if (isCourses || route === '/food' || route.startsWith('/food/') || route === '/recommended' || route.startsWith('/recommended/')) { const url=new URL(window.location.href); if(url.searchParams.get('locale')!==locale&&(!isCourses||route.startsWith('/courses/inspiration'))) { url.searchParams.delete('district'); url.searchParams.delete('category'); url.searchParams.delete('page'); } url.searchParams.set('locale',locale); window.history.replaceState(null,'',url.pathname+url.search); return; }
    if(route==='/travel-tools'){const target=new URL(window.location.href);target.searchParams.set('locale',locale);if(target.searchParams.get('section')!=='flights')target.searchParams.delete('section');window.history.replaceState(null,'',target.pathname+target.search);return;}
    if (route.startsWith('/places/') || route === '/saved' || route === '/cart' || route === '/travel-tools') { window.history.replaceState(null,'',route+'?locale='+locale); return; }
    if (route === '/') { const url=new URL(window.location.href); url.searchParams.set('locale',locale); window.history.replaceState(null,'',url.pathname+url.search); return; }
    if (route !== '/search') return;
    const params = new URLSearchParams({locale});
    if (query) params.set('q',query);
    if (category) params.set('category',category);
    if (provider) params.set('provider',provider);
    if (scope) params.set('scope',scope);
    if (page > 1) params.set('page',String(page));
    window.history.replaceState(null,'','/search?'+params.toString());
  }, [route,locale,query,category,provider,scope,page,isCourses]);
  useEffect(() => { document.documentElement.lang = locale; document.title = 'dallaBusan · ' + getCopy(locale).catalogTitle; }, [locale]);
  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    const params = new URLSearchParams({ locale, q: query, page: String(page), limit: '24', view:route==='/'?'home':'catalog' });
    if (category) params.set('category', category);
    if (provider) params.set('provider', provider);
    if (scope) params.set('scope', scope);
    void fetch('/api/offers?' + params.toString(), { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async response => { if (!response.ok) throw new Error('Catalog unavailable'); const input: unknown = await response.json(); return OffersResponseSchema.parse(input); })
      .then(result => { if (!controller.signal.aborted && version === requestVersion.current) { setData(result); setState('ready'); } })
      .catch(() => { if (!controller.signal.aborted && version === requestVersion.current) setState('failed'); });
    return () => controller.abort();
  }, [locale, query, category, provider, scope, page, attempt, route]);
  const loading = state === 'loading';
  function updateFilter(change: () => void) { setState('loading'); setPage(1); setAttempt(value => value + 1); change(); }
  function chooseCategory(value: string) { updateFilter(() => setCategory(value)); }
  function reset() { updateFilter(() => { setSearch(''); setQuery(''); setCategory(''); setProvider(''); setScope(''); }); }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); updateFilter(() => setQuery(search.trim())); if (route !== '/search') navigate('/search'); }
  function changePage(value: number) { setState('loading'); setPage(value); document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' }); }
  return <>
    <a className="skip-link" href="#main">{copy.skip}</a>
    <header className="site-header"><a className="brand" href={'/?locale='+locale} aria-label="dallaBusan"><img src="/brand/dallabusan-logo.png" alt="dallaBusan" width="1254" height="1254" /></a><span className="header-tagline">{copy.tagline}</span><nav className="header-nav" aria-label={guide.navigation}><a href={'/?locale='+locale} onClick={event => { if (!event.ctrlKey && !event.metaKey) { event.preventDefault(); navigate("/"); } }}>{guide.home}</a><a href={'/search?locale='+locale} aria-current={route === "/search" ? "page" : undefined} onClick={event => { if (!event.ctrlKey && !event.metaKey) { event.preventDefault(); navigate("/search"); } }}>{guide.searchTitle}</a><a href={'/courses?locale='+locale} data-testid="courses-nav" aria-current={isCourses?'page':undefined} onClick={event=>{if(!event.ctrlKey&&!event.metaKey){event.preventDefault();navigate('/courses');}}}>{courseCopy.nav}</a><a href={'/food?locale='+locale} aria-current={guideKind==='food'?'page':undefined} onClick={event=>{if(!event.ctrlKey&&!event.metaKey){event.preventDefault();navigate('/food');}}}>{publicGuide.food}</a><a href={'/recommended?locale='+locale} data-testid="recommended-nav" aria-current={guideKind==='recommended'?'page':undefined} onClick={event=>{if(!event.ctrlKey&&!event.metaKey){event.preventDefault();navigate('/recommended');}}}>{publicGuide.recommended}</a><a href={'/saved?locale='+locale} aria-current={route==='/saved'?'page':undefined} data-testid="saved-nav" onClick={event=>{if(!event.ctrlKey&&!event.metaKey){event.preventDefault();navigate('/saved');}}}>{savedCopy.nav}<span className="saved-count" aria-live="polite">{saved.entries.length}</span></a></nav>
      <div className="header-actions"><CartNav locale={locale} onNavigate={navigate}/><label className="language-select"><span aria-hidden="true">◎</span><span className="sr-only">{copy.language}</span><select aria-label={copy.language} value={locale} onChange={event => updateFilter(() => setLocale(LocaleSchema.parse(event.target.value)))}>{LANGUAGE_OPTIONS.map(item => <option key={item.locale} value={item.locale}>{item.label}</option>)}</select></label></div>
    </header>
    <main id="main"><SavedNotice locale={locale}/><CartNotice locale={locale}/>
    {route==='/travel-tools'?<TravelToolsPage locale={locale} onNavigate={navigate} onOpen={setSelected}/>:isCourses ? <CoursesPage onOpen={setSelected} key={route+locale+navigationVersion+window.location.search} route={route} locale={locale} onNavigate={navigate}/> : route === "/cart" ? <CartPage locale={locale} onNavigate={navigate} onOpen={setSelected}/> : route === "/saved" ? <SavedPage locale={locale} onNavigate={navigate} onOpen={setSelected}/> : guideKind ? route.split("/")[2] ? <PublicGuideDetail key={route+locale} kind={guideKind} id={route.split("/")[2]??""} locale={locale} onNavigate={navigate}/> : <PublicGuideList key={route+locale+attempt} kind={guideKind} locale={locale} onNavigate={navigate}/> : route.startsWith("/places/") ? <DestinationPage slug={route.split("/")[2] ?? ""} locale={locale} onNavigate={navigate} onOpen={setSelected} /> : <>
      {route==='/'&&<HomeCourses key={'home-courses:'+locale} locale={locale} onNavigate={navigate}/>}
      <section className={route === "/search" ? "hero search-hero" : "hero home-secondary-search"} aria-labelledby="hero-title">
        <div className="hero-background" /><div className="hero-shade" />
        <div className="hero-content"><p className="eyebrow">{copy.eyebrow}<span>35° N / 129° E</span></p>{route==='/search'?<h1 id="hero-title">{guide.searchTitle}</h1>:<h2 id="hero-title">{getHomeCourseCopy(locale).search}</h2>}<p className="hero-body">{copy.heroBody}</p>
          <form className="search-form" onSubmit={submit}><label className="sr-only" htmlFor="offer-search">{copy.searchLabel}</label><Icon name="search" size={23} /><input id="offer-search" type="search" maxLength={100} placeholder={copy.placeholder} value={search} onChange={event => setSearch(event.target.value)} /><button type="submit">{copy.search}<Icon name="arrow" size={20} /></button></form><div className="home-preparation-links"><TravelToolsLink locale={locale} onNavigate={navigate}/><a className="travel-tools-link" data-testid="flights-link" href={'/travel-tools?'+new URLSearchParams({locale,section:'flights'})} onClick={event=>{if(!event.ctrlKey&&!event.metaKey){event.preventDefault();navigate('/travel-tools?section=flights');}}}>{getFlightCopy(locale).link} ↗</a></div>
        </div><span className="hero-caption">GWANGALLI, BUSAN <span>01 / THE COAST</span></span>
      </section>
      {route === "/" && <Promotions key={'promotions:'+locale} locale={locale} onNavigate={navigate} onOpen={setSelected}/>}
      <MonthlyDestinations locale={locale} onNavigate={navigate}/>

      {route === "/search" && <><DestinationResults locale={locale} query={query} onNavigate={navigate} /><ParkingSearch locale={locale} query={query}/></>}
      <section className="quick-section section-wrap" aria-labelledby="discover-title"><div className="section-intro"><p className="eyebrow blue">FIND YOUR MOMENT</p><h2 id="discover-title">{copy.discover}</h2></div>
        <div className="quick-grid">{QUICK_CATEGORIES.map(id => <a key={id} href="#offers" onClick={() => chooseCategory(id)} className={category === id ? 'quick-category active' : 'quick-category'}><span className="quick-icon"><Icon name={id} size={27} /></span><span>{copy.categories[id]}</span><Icon name="arrow" size={17} /></a>)}</div>
      </section>
      <section id="offers" className="catalog-section section-wrap" aria-labelledby="catalog-title">
        <div className="catalog-heading"><div><p className="eyebrow blue">THE BUSAN COLLECTION</p><h2 id="catalog-title">{copy.catalogTitle}</h2><p>{copy.catalogIntro}</p></div>{data && <span className="catalog-count">{copy.results.replace('{count}', new Intl.NumberFormat(locale).format(data.catalogTotal))}</span>}</div>
        <div className="filter-bar"><div className="category-tabs" role="group" aria-label={copy.discover}><button aria-pressed={!category} onClick={() => chooseCategory('')}>{copy.all}</button>{data?.categories.map(item => <button key={item.id} aria-pressed={category === item.id} onClick={() => chooseCategory(item.id)}>{copy.categories[item.id]}<span>{item.count}</span></button>)}</div>
          <div className="select-filters"><label><span>{copy.provider}</span><select aria-label={copy.provider} value={provider} onChange={event => updateFilter(() => setProvider(event.target.value))}><option value="">{copy.allProviders}</option>{data?.providers.map(item => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>
            <label><span>{copy.scope}</span><select aria-label={copy.scope} value={scope} onChange={event => updateFilter(() => setScope(event.target.value))}><option value="">{copy.allScopes}</option>{Object.entries(copy.scopes).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            {(query || category || provider || scope) && <button className="reset-filter" onClick={reset}>{copy.reset} ↺</button>}
          </div></div>
        <div className="results-line" role="status" aria-live="polite">{state === 'loading' ? data ? copy.updating : copy.loading : data ? (state === 'failed' ? copy.previousResults : copy.results).replace('{count}', String(data.total)) : ''}{query && state !== 'failed' && <span className="query-tag">“{query}”</span>}</div>
        {state === 'failed' && <div className="error-notice" role="alert"><p>{copy.failed}</p><button onClick={() => { setState('loading'); setAttempt(value => value + 1); }}>{copy.retry}</button></div>}
        {!data && loading && <div className="skeleton-grid" aria-hidden="true">{Array.from({length:8},(_,i)=><div className="skeleton-card" key={i} />)}</div>}
        {data && <div className={loading ? 'offer-grid pending' : 'offer-grid'} aria-busy={loading}>{data.items.map(offer => <OfferCard key={offer.id} offer={offer} locale={locale} onOpen={setSelected} />)}</div>}
        {data?.items.length === 0 && <div className="empty-state"><Icon name="search" size={36} /><h3>{copy.empty}</h3><p>{copy.emptyBody}</p><button className="primary-button" onClick={reset}>{copy.reset}</button></div>}
        {data && data.pages > 1 && <nav className="pagination" aria-label={copy.page.replace('{current}',String(data.page)).replace('{total}',String(data.pages))}><button disabled={page<=1 || loading} onClick={() => changePage(page-1)}>← {copy.previous}</button><span>{copy.page.replace('{current}',String(data.page)).replace('{total}',String(data.pages))}</span><button disabled={page>=data.pages || loading} onClick={() => changePage(page+1)}>{copy.next} →</button></nav>}
        {data && <p className="catalog-footnote">{copy.priceDate}: {data.checkedOn} · {copy.priceNote}</p>}
      </section>
      <section className="editorial section-wrap"><img src="/review-assets/gamcheon.jpg" alt={copy.representative} loading="lazy" /><div className="editorial-copy"><p className="eyebrow">A DIFFERENT SIDE OF BUSAN</p><h2>{copy.storyTitle}</h2><p>{copy.storyBody}</p><a href="#offers" onClick={() => chooseCategory('tour')}>{copy.storyAction}<Icon name="arrow" /></a></div><span className="editorial-place">GAMCHEON CULTURE VILLAGE</span></section>
      <section className="partners-section section-wrap"><p className="eyebrow blue">FIND IT. LOVE IT. BOOK IT.</p><h2>{copy.partnersTitle}</h2><p>{copy.partnersBody}</p><div className="partner-names">{data?.providers.map(item => <button key={item.id} onClick={() => { updateFilter(() => setProvider(item.id)); document.getElementById('offers')?.scrollIntoView({behavior:'smooth'}); }}>{item.displayName}<Icon name="arrow" size={18} /></button>)}</div>{data?.directories.map(item => <a key={item.id} className="directory-link" href={item.href} target="_blank" rel="sponsored noopener noreferrer">{item.provider.displayName} · {copy.allOffers} ↗</a>)}</section>
    </>}
    </main>
    <footer className="site-footer section-wrap"><div className="footer-brand"><a className="brand" href={'/?locale='+locale} aria-label="dallaBusan"><img src="/brand/dallabusan-logo.png" alt="dallaBusan" width="1254" height="1254" loading="lazy" /></a><p>{copy.tagline}</p></div><div className="footer-information"><TravelToolsLink locale={locale} onNavigate={navigate}/><p>{copy.disclosure}</p><p>{copy.readOnly}</p>{data && <a href={'mailto:'+data.contactEmail}>{copy.contact} · {data.contactEmail}</a>}<details><summary>{copy.photoCredits}</summary><p><a href="https://commons.wikimedia.org/wiki/File:Gwangalli_Beach.jpg" target="_blank" rel="noreferrer">Gwangalli Beach — Chelsea Hicks</a> · <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noreferrer">CC BY 2.0</a> · cropped for display.</p><p><a href="https://commons.wikimedia.org/wiki/File:Gamcheon_Culture_Village.jpg" target="_blank" rel="noreferrer">Gamcheon Culture Village — Bernard Gagnon</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a> · cropped for display.</p><p><a href="/review-assets/credits.json" target="_blank" rel="noreferrer">{copy.photoCredits} ↗</a></p></details><span>© {new Date().getFullYear()} dallaBusan</span></div></footer>
    <ExchangeNotice locale={locale}/>
    {route==='/'&&<RecommendationDialog locale={locale} eligible={state==='ready'} onNavigate={navigate}/>}
    <OfferDialog offer={selected} locale={locale} onClose={() => setSelected(null)} />
  </>;
}
