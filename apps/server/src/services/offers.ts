import { PRODUCT_PHOTO_LABELS } from '../config/localization.js';
import { RelatedOffersResponseSchema, PublicOfferSchema, OffersResponseSchema, OfferQuerySchema, SafeHttpsSchema, type OfferQuery, type PublicOffer, type Locale } from '@trip-fit/domain';
import { OfferCatalogConfigSchema, type OfferCatalogConfig, type OfferProviderConfig } from '../config/offers.js';

export function validateLink(href: string, provider: OfferProviderConfig,externalId?:string) {
  const url = new URL(SafeHttpsSchema.parse(href));
  if (!provider.allowedHosts.includes(url.hostname) || url.hash
    || !provider.pathPrefixes.some(prefix => (url.pathname === prefix || url.pathname.startsWith(prefix.endsWith('/') ? prefix : prefix + '/')))) throw new Error('Unapproved offer destination');
  for (const [key, value] of Object.entries(provider.requiredQuery)) {
    if (url.searchParams.getAll(key).length !== 1 || url.searchParams.get(key) !== value) throw new Error('Invalid affiliate attribution');
  }
  if (provider.destinationQuery) {
    const destinations = url.searchParams.getAll(provider.destinationQuery);
    if (destinations.length !== 1 || !destinations[0]) throw new Error('Missing approved destination');
    const target = new URL(SafeHttpsSchema.parse(destinations[0]));
    if (!provider.destinationHosts.includes(target.hostname) || target.hash) throw new Error('Unapproved nested destination');
  }
  if(externalId&&provider.externalIdPathPattern&&new RegExp(provider.externalIdPathPattern).exec(url.pathname)?.[1]!==externalId)throw new Error('Affiliate product identity mismatch');
  return url.href;
}
export function createOfferService(input: OfferCatalogConfig, today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())) {
  const config = OfferCatalogConfigSchema.parse(input);
  const providers = new Map(config.providers.map(provider => [provider.id, provider]));
  if (providers.size !== config.providers.length || new Set(config.offers.map(offer => offer.id)).size !== config.offers.length)
    throw new Error('Duplicate affiliate configuration identity');
  const groups=new Map<string,string>();
  for(const group of config.featuredGroups){
    if(config.featuredGroups.filter(value=>value.id===group.id).length!==1)throw new Error('Duplicate featured group');
    const categories=new Set<string>(),scopes=new Set<string>();
    for(const member of group.members){const raw=config.offers.find(offer=>offer.id===member.offerId);if(!raw||groups.has(member.offerId)||raw.providerId!==member.providerId||raw.externalId!==member.externalId||raw.title!==member.sourceTitle||raw.sourceUrl!==member.sourceUrl)throw new Error('Featured group source changed; review required');categories.add(raw.category);scopes.add(raw.scope);groups.set(raw.id,group.id);}
    if(categories.size!==1||scopes.size!==1||group.kind==='property'&&!categories.has('stay'))throw new Error('Invalid featured group scope');
  }
  function eligible(raw:OfferCatalogConfig['offers'][number],provider:OfferProviderConfig){
    if(provider.bookingPolicy==='open')return true;
    const proof=raw.bookingEligibility;
    return proof!==null&&proof.providerId===raw.providerId&&proof.externalId===raw.externalId&&proof.checkedOn<=today()&&proof.expiresOn>=today()&&proof.checkedOn<=proof.expiresOn&&Object.values(proof.evidence).every(item=>provider.sourceHosts.includes(new URL(item.url).hostname));
  }
  const localizedHrefs=new Map<string,Partial<Record<Locale,string>>>();
  const offers: Array<{ value: PublicOffer; priority: number; providerPriority:number }> = [];
  for (const raw of config.offers) {
    const provider = providers.get(raw.providerId);
    if (!provider) throw new Error('Offer provider is missing');
    if (!raw.enabled || !provider.enabled || provider.approvalStatus !== 'approved' || !eligible(raw,provider)) continue;
    const source = new URL(raw.sourceUrl);
    if (!provider.sourceHosts.includes(source.hostname)) throw new Error('Unapproved offer evidence');
    const imageUrl = raw.image.url;
    if (!/^\/(review-assets|catalog-media)\/[a-zA-Z0-9_-]+\.(jpg|png|webp|svg)$/.test(imageUrl)) SafeHttpsSchema.parse(imageUrl);
    const href = validateLink(raw.href, provider,raw.externalId);
    const links:Partial<Record<Locale,string>>={};
    for(const [locale,url]of Object.entries(raw.localizedHrefs)){const validatedLocale=OfferQuerySchema.parse({locale}).locale;links[validatedLocale]=validateLink(url,provider,raw.externalId);}
    localizedHrefs.set(raw.id,links);
    offers.push({
      value: PublicOfferSchema.parse({
        id: raw.id, externalId: raw.externalId, title: raw.title, titleLocale: raw.titleLocale, originalTitle:raw.title, originalTitleLocale:raw.titleLocale, localizationStatus:'original',
        category: raw.category, scope: raw.scope, provider: { id: provider.id, displayName: provider.displayName },
        href, bookingLocale:raw.bookingLocale, bookingNotice:provider.bookingPolicy==='verified-korean-guided-only'?'korean-site-international-cards':null, referencePrice: raw.price ? { ...raw.price, observedOn: raw.checkedOn } : null,
        image: raw.image, checkedOn: raw.checkedOn, expiresOn: raw.expiresOn, linkEvidence: raw.linkEvidence,
      }),
      priority: raw.priority, providerPriority:provider.displayPriority,
    });
  }
  offers.sort((a, b) => a.providerPriority-b.providerPriority || a.priority - b.priority || (a.value.id < b.value.id ? -1 : a.value.id > b.value.id ? 1 : 0));
  const rawById = new Map(config.offers.map(offer=>[offer.id,offer]));
  const translations = new Map(config.offers.map(item=>[item.id,item.localizedTitles]));
  function displayProvider(provider: OfferProviderConfig, locale: Locale) { return {id:provider.id,displayName:provider.localizedDisplayNames[locale]??provider.displayName}; }
  function localize(offer: PublicOffer,locale: Locale) {
    const translated = locale!==offer.originalTitleLocale ? translations.get(offer.id)?.[locale] : undefined;
    const provider=providers.get(offer.provider.id);if(!provider)throw new Error('Missing provider');
    const display=displayProvider(provider,locale);const image=offer.image.credit==='Official product image · '+provider.displayName?{...offer.image,credit:PRODUCT_PHOTO_LABELS[locale]+' · '+display.displayName}:offer.image;
    if(offer.image.kind==='product'&&offer.image.sourceUrl===offer.href)image.sourceUrl=localizedHrefs.get(offer.id)?.[locale]??offer.href;
    return PublicOfferSchema.parse({...offer,href:localizedHrefs.get(offer.id)?.[locale]??offer.href,bookingLocale:localizedHrefs.get(offer.id)?.[locale]?locale:offer.bookingLocale,provider:display,image,title:translated??offer.originalTitle,titleLocale:translated?locale:offer.originalTitleLocale,localizationStatus:translated?'translated':locale===offer.originalTitleLocale?'original':'fallback'});
  }
  function current() { return offers.map(item => item.value).filter(offer => {const raw=rawById.get(offer.id),provider=providers.get(offer.provider.id);return (!offer.expiresOn||offer.expiresOn>=today())&&raw!==undefined&&provider!==undefined&&eligible(raw,provider);}); }
  const directories = config.directories.flatMap(raw => {
    const provider = providers.get(raw.providerId);
    if (!provider || !provider.enabled || provider.approvalStatus !== 'approved' || provider.bookingPolicy!=='open') return [];
    return [{ id: raw.id, provider: { id: provider.id, displayName: provider.displayName }, href: validateLink(raw.href, provider), category: raw.category }];
  });
  return {
    get(id: string, locale: Locale = 'ko') { const offer=current().find(value => value.id===id); return offer?localize(offer,locale):null; },
    related(id:string,locale:Locale,placeIds:ReadonlySet<string>=new Set()){
      const all=current(),base=all.find(offer=>offer.id===id);
      if(!base)return null;
      // Source identities and reviewed place mappings only; no title-similarity merging.
      const candidates=all.filter(offer=>offer.id!==id&&(placeIds.has(offer.id)||(offer.category===base.category&&offer.scope===base.scope)));
      candidates.sort((a,b)=>Number(placeIds.has(b.id))-Number(placeIds.has(a.id)));
      const seenGroups=new Set<string>();
      const baseGroup=groups.get(base.id);if(baseGroup)seenGroups.add(baseGroup);
      const items=candidates.filter(offer=>{const group=groups.get(offer.id);if(!group)return true;if(seenGroups.has(group))return false;seenGroups.add(group);return true;}).slice(0,6)
        .map(offer=>({offer:localize(offer,locale),reason:placeIds.has(offer.id)?'shared-place':'same-category'}));
      return RelatedOffersResponseSchema.parse({offerId:id,locale,items});
    },
    list(query: OfferQuery, relatedIds: ReadonlySet<string> = new Set()) {
      const all = current().map(offer=>localize(offer,query.locale));
      const needle = query.q.normalize('NFKC').toLocaleLowerCase(query.locale);
      let filtered = all.filter(offer =>
        (!query.category || offer.category === query.category) && (!query.provider || offer.provider.id === query.provider)
        && (!query.scope || offer.scope === query.scope)
        && (!needle || [offer.title,offer.originalTitle,...Object.values(translations.get(offer.id)??{})].some(value=>typeof value==='string'&&value.normalize('NFKC').toLocaleLowerCase(query.locale).includes(needle)) || relatedIds.has(offer.id)));
      if(query.view==='home'){const seen=new Set<string>();filtered=filtered.filter(offer=>{const key=groups.get(offer.id);if(!key)return true;if(seen.has(key))return false;seen.add(key);return true;});}
      const activeIds = new Set(all.map(offer => offer.provider.id));
      return OffersResponseSchema.parse({
        items: filtered.slice((query.page - 1) * query.limit, query.page * query.limit),
        total: filtered.length, page: query.page, pages: Math.ceil(filtered.length / query.limit), catalogTotal: all.length,
        providers: config.providers.filter(provider => activeIds.has(provider.id)).sort((a,b)=>a.displayPriority-b.displayPriority||a.id.localeCompare(b.id)).map(provider => displayProvider(provider,query.locale)),
        categories: [...new Set(all.map(offer => offer.category))].map(id => ({ id, count: all.filter(offer => offer.category === id).length })),
        directories:directories.map(item=>{const provider=providers.get(item.provider.id);return provider?{...item,provider:displayProvider(provider,query.locale)}:item;}), checkedOn: config.checkedOn, contactEmail: config.contactEmail,
      });
    },
  };
}
export type OfferService = ReturnType<typeof createOfferService>;
