import { DestinationDetailSchema, DestinationListSchema, DestinationQuerySchema, DestinationSchema, type DestinationQuery, type Locale } from '@trip-fit/domain';
import { DestinationConfigSchema, type DestinationConfig } from '../config/destinations.js';
import type { OfferService } from './offers.js';

function normalize(value: string) { return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ''); }
export function createDestinationService(input: DestinationConfig, offers: OfferService,
  month = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit' }).format(new Date())) {
  const config = DestinationConfigSchema.parse(input);
  const slugs = config.destinations.map(item => item.slug);
  if (new Set(slugs).size !== slugs.length || new Set(config.featuredSlugs).size !== config.featuredSlugs.length
    || config.featuredSlugs.some(slug => !slugs.includes(slug))) throw new Error('Duplicate or missing destination');
  for (const item of config.destinations) {
    if (new Set(item.translations.map(value => value.locale)).size !== item.translations.length
      || new Set(item.related.map(value => value.offerId)).size !== item.related.length) throw new Error('Duplicate destination mapping');
    for (const link of item.related) {
      const offer = offers.get(link.offerId);
      if (offer && ((link.relationship === 'stay') !== (offer.category === 'stay')
        || (link.relationship === 'ticket' && offer.category !== 'ticket')
        || (link.relationship === 'tour' && !['tour', 'package'].includes(offer.category)))) throw new Error('Invalid related offer category');
      if (link.relationship === 'stay' && !link.areaLabel) throw new Error('Stay area is required');
    }
  }
  function related(item: DestinationConfig['destinations'][number], locale: Locale = 'ko') {
    return item.related.flatMap(link => {
      const offer = offers.get(link.offerId,locale);
      return offer ? [{ offer, relationship: link.relationship, areaLabel: link.areaLabel }] : [];
    });
  }
  function publicPlace(item: DestinationConfig['destinations'][number], locale: Locale) {
    const text = item.translations.find(value => value.locale === locale)
      ?? item.translations.find(value => value.locale === 'ko') ?? item.translations[0];
    if (!text) throw new Error('Missing destination translation');
    return DestinationSchema.parse({
      slug: item.slug, name: text.name, description: text.description, locale: text.locale,
      requestedLocale: locale, translationFallback: text.locale !== locale || text.fallback,
      address: item.address, addressLocale: item.addressLocale, district: text.district, addressSourceUrl: item.addressSourceUrl, holidayInfo: text.holidayInfo,
      sourceUrl: item.sourceUrl, sourceRetrievedAt: text.sourceRetrievedAt, reviewedOn: item.reviewedOn,
      reviewStatus: item.reviewedOn ? 'curated' : 'source', image: item.image, relatedOfferCount: related(item).length,
    });
  }
  function nameMatch(item: DestinationConfig['destinations'][number], needle: string) {
    return [...item.aliases, ...item.translations.map(text => text.name)].some(value => normalize(value).includes(needle));
  }
  return {
    list(locale: Locale, filters: Partial<Omit<DestinationQuery, 'locale'>> = {}) {
      const query = DestinationQuerySchema.parse({ ...filters, locale });
      const needle = normalize(query.q);
      const selected = config.destinations.filter(item =>
        (!needle || nameMatch(item, needle) || item.translations.some(text => normalize(text.description + (text.district ?? '')).includes(needle)))
        && (query.linked !== 'linked' || related(item).length > 0));
      const currentMonth = month();
      return DestinationListSchema.parse({ month: currentMonth,
        items: selected.slice((query.page - 1) * query.limit, query.page * query.limit).map(item => publicPlace(item, locale)),
        featured: currentMonth === config.month ? config.featuredSlugs.flatMap(slug => {
          const item = config.destinations.find(value => value.slug === slug); return item ? [publicPlace(item, locale)] : [];
        }) : [],
        total: selected.length, catalogTotal: config.destinations.length,
        linkedTotal: config.destinations.filter(item => related(item).length > 0).length,
        page: query.page, pages: Math.ceil(selected.length / query.limit),
      });
    },
    relatedOfferIdsForSearch(query: string) {
      const needle = normalize(query);
      if (!needle) return new Set<string>();
      // Only reviewed name/alias relations expand product search, not incidental prose.
      return new Set(config.destinations.filter(item => nameMatch(item, needle)).flatMap(item => related(item).map(link => link.offer.id)));
    },
    get(slug: string, locale: Locale) {
      const item = config.destinations.find(value => value.slug === slug);
      if (!item) return null;
      const destination = publicPlace(item, locale);
      const text = item.translations.find(value => value.locale === destination.locale);
      if (!text) throw new Error('Missing destination content');
      return DestinationDetailSchema.parse({ destination, related: related(item,locale), content: text.descriptionBody || text.description,
        visitInfo: { hours: text.hours, fees: text.fees, transport: text.transport, contact: text.contact, homepage: text.homepage } });
    },
  };
}
export type DestinationService = ReturnType<typeof createDestinationService>;
