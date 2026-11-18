import { PublicOfferSchema, OffersResponseSchema, SafeHttpsSchema, type OfferQuery, type PublicOffer, type Locale } from '@trip-fit/domain';
import { OfferCatalogConfigSchema, type OfferCatalogConfig, type OfferProviderConfig } from '../config/offers.js';

function validateLink(href: string, provider: OfferProviderConfig) {
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
  return url.href;
}
export function createOfferService(input: OfferCatalogConfig, today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())) {
  const config = OfferCatalogConfigSchema.parse(input);
  const providers = new Map(config.providers.map(provider => [provider.id, provider]));
  if (providers.size !== config.providers.length || new Set(config.offers.map(offer => offer.id)).size !== config.offers.length)
    throw new Error('Duplicate affiliate configuration identity');
  const offers: Array<{ value: PublicOffer; priority: number }> = [];
  for (const raw of config.offers) {
    const provider = providers.get(raw.providerId);
    if (!provider) throw new Error('Offer provider is missing');
    if (!raw.enabled || !provider.enabled || provider.approvalStatus !== 'approved') continue;
    const source = new URL(raw.sourceUrl);
    if (!provider.sourceHosts.includes(source.hostname)) throw new Error('Unapproved offer evidence');
    const imageUrl = raw.image.url;
    if (!/^\/(review-assets|catalog-media)\/[a-zA-Z0-9_-]+\.(jpg|png|webp|svg)$/.test(imageUrl)) SafeHttpsSchema.parse(imageUrl);
    const href = validateLink(raw.href, provider);
    offers.push({
      value: PublicOfferSchema.parse({
        id: raw.id, externalId: raw.externalId, title: raw.title, titleLocale: raw.titleLocale, originalTitle:raw.title, originalTitleLocale:raw.titleLocale, localizationStatus:'original',
        category: raw.category, scope: raw.scope, provider: { id: provider.id, displayName: provider.displayName },
        href, referencePrice: raw.price ? { ...raw.price, observedOn: raw.checkedOn } : null,
        image: raw.image, checkedOn: raw.checkedOn, expiresOn: raw.expiresOn, linkEvidence: raw.linkEvidence,
      }),
      priority: raw.priority,
    });
  }
  offers.sort((a, b) => a.priority - b.priority || (a.value.id < b.value.id ? -1 : a.value.id > b.value.id ? 1 : 0));
  const translations = new Map(config.offers.map(item=>[item.id,item.localizedTitles]));
  function localize(offer: PublicOffer,locale: Locale) {
    const translated = locale!==offer.originalTitleLocale ? translations.get(offer.id)?.[locale] : undefined;
    return PublicOfferSchema.parse({...offer,title:translated??offer.originalTitle,titleLocale:translated?locale:offer.originalTitleLocale,localizationStatus:translated?'translated':locale===offer.originalTitleLocale?'original':'fallback'});
  }
  function current() { return offers.map(item => item.value).filter(offer => !offer.expiresOn || offer.expiresOn >= today()); }
  const directories = config.directories.flatMap(raw => {
    const provider = providers.get(raw.providerId);
    if (!provider || !provider.enabled || provider.approvalStatus !== 'approved') return [];
    return [{ id: raw.id, provider: { id: provider.id, displayName: provider.displayName }, href: validateLink(raw.href, provider), category: raw.category }];
  });
  return {
    get(id: string, locale: Locale = 'ko') { const offer=current().find(value => value.id===id); return offer?localize(offer,locale):null; },
    list(query: OfferQuery, relatedIds: ReadonlySet<string> = new Set()) {
      const all = current().map(offer=>localize(offer,query.locale));
      const needle = query.q.normalize('NFKC').toLocaleLowerCase(query.locale);
      const filtered = all.filter(offer =>
        (!query.category || offer.category === query.category) && (!query.provider || offer.provider.id === query.provider)
        && (!query.scope || offer.scope === query.scope)
        && (!needle || [offer.title,offer.originalTitle,...Object.values(translations.get(offer.id)??{})].some(value=>typeof value==='string'&&value.normalize('NFKC').toLocaleLowerCase(query.locale).includes(needle)) || relatedIds.has(offer.id)));
      const activeIds = new Set(all.map(offer => offer.provider.id));
      return OffersResponseSchema.parse({
        items: filtered.slice((query.page - 1) * query.limit, query.page * query.limit),
        total: filtered.length, page: query.page, pages: Math.ceil(filtered.length / query.limit), catalogTotal: all.length,
        providers: config.providers.filter(provider => activeIds.has(provider.id)).map(provider => ({ id: provider.id, displayName: provider.displayName })),
        categories: [...new Set(all.map(offer => offer.category))].map(id => ({ id, count: all.filter(offer => offer.category === id).length })),
        directories, checkedOn: config.checkedOn, contactEmail: config.contactEmail,
      });
    },
  };
}
export type OfferService = ReturnType<typeof createOfferService>;
