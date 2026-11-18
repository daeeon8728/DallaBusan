import { z } from 'zod';
import { LocaleSchema, SafeHttpsSchema } from '@trip-fit/domain';
import { AttractionRecordSchema } from '../providers/attraction/parse.js';
import { DestinationConfigSchema, DestinationCurationSchema, type DestinationConfig } from '../config/destinations.js';

const SourcesSchema = z.array(z.strictObject({
  locale: LocaleSchema, record: AttractionRecordSchema, fetchedAt: z.iso.datetime(),
})).min(1);
function cleanName(value: string) {
  return value.replace(/\s*\((?:한|영|중간|중번|일|\s|,)+\)\s*/g, '').trim();
}
function plainText(value: string) {
  const text = value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return text;
}
export function publishDestinationSnapshot(raw: unknown, previous: DestinationConfig, rawCuration: unknown, mediaApproval = false) {
  const sources = SourcesSchema.parse(raw);
  const curation = DestinationCurationSchema.parse(rawCuration);
  const grouped = new Map<string, typeof sources>();
  const seen = new Set<string>();
  for (const source of sources) {
    const key = source.record.sourceId + ':' + source.locale;
    if (seen.has(key)) throw new Error('Duplicate source language identity');
    seen.add(key);
    const group = grouped.get(source.record.sourceId) ?? [];
    group.push(source); grouped.set(source.record.sourceId, group);
  }
  const previousById = new Map(previous.destinations.map(item => [item.translations[0]?.sourceId, item]));
  const rules = new Map(curation.entries.map(entry => [entry.sourceId, entry]));
  if (rules.size !== curation.entries.length || curation.entries.some(entry => !grouped.has(entry.sourceId)))
    throw new Error('Unknown or duplicate reviewed source identity');
  const destinations: DestinationConfig['destinations'] = [];
  for (const [sourceId, group] of grouped) {
    const first = group[0]; if (!first) throw new Error('Empty source group');
    // Corroborate source ID with two independent fields; never merge names alone.
    if (group.length > 1 && (!first.record.coordinates || group.some(item =>
      item.record.originalTitle !== first.record.originalTitle
      || JSON.stringify(item.record.coordinates) !== JSON.stringify(first.record.coordinates))))
      throw new Error('Source language identity requires review');
    const old = previousById.get(sourceId);
    const rule = rules.get(sourceId);
    const base = group.find(item => item.locale === 'ko') ?? first;
    const sourceUrl = old?.sourceUrl ?? 'https://www.data.go.kr/data/15063481/openapi.do';
    destinations.push({
      slug: old?.slug ?? 'busan-' + sourceId, reviewedOn: old?.reviewedOn ?? null,
      address: old?.address ?? base.record.addressRaw, addressLocale: old?.address ? old.addressLocale : base.locale, addressSourceUrl: old?.addressSourceUrl ?? sourceUrl,
      aliases: [...new Set([cleanName(base.record.originalTitle), ...(old?.aliases ?? []), ...(rule?.aliases ?? [])])],
      sourceUrl, image: old?.image ?? (mediaApproval && base.record.imageUrl ? {
        url: base.record.imageThumbUrl ?? base.record.imageUrl, credit: '부산광역시 · 부산명소정보 서비스',
        sourceUrl: 'https://www.data.go.kr/data/15063481/openapi.do', licenseUrl: 'https://www.data.go.kr/ugs/selectPortalPolicyView.do',
      } : null),
      translations: group.map(item => {
        const prior = old?.translations.find(text => text.locale === item.locale);
        return {
          locale: item.locale, sourceId, district: item.record.districtRaw,
          name: prior?.name ?? (item.locale === 'ko' ? cleanName(item.record.originalTitle) : item.record.title),
          description: plainText(item.record.descriptionRaw).slice(0,600) || item.record.title,
          descriptionBody: plainText(item.record.descriptionRaw).slice(0,30000),
          hours: item.record.hoursRaw ? plainText(item.record.hoursRaw) : null,
          fees: item.record.feeRaw ? plainText(item.record.feeRaw) : null,
          transport: item.record.transportRaw ? plainText(item.record.transportRaw) : null,
          contact: item.record.contactRaw ? plainText(item.record.contactRaw) : null,
          homepage: SafeHttpsSchema.safeParse(item.record.homepageRaw).success ? item.record.homepageRaw : null,
          holidayInfo: item.record.holidayInfoRaw, sourceRetrievedAt: item.fetchedAt,
          fallback: item.record.warnings.includes('missing-localized-title'),
        };
      }),
      related: rule?.related ?? old?.related ?? [],
    });
  }
  const rank = new Map(previous.featuredSlugs.map((slug, index) => [slug, index]));
  destinations.sort((a,b) => (rank.get(a.slug) ?? 1000) - (rank.get(b.slug) ?? 1000)
    || Number(a.translations[0]?.sourceId) - Number(b.translations[0]?.sourceId));
  const config = DestinationConfigSchema.parse({ ...previous, destinations });
  const coverage = {
    generatedFrom: 'local-public-api-database', sourceLanguageRecords: sources.length, sourceGroups: destinations.length,
    note: 'Source-ID groups are tourism information records, not a deduplicated physical-place count.',
    identityEvidence: 'Exact source ID, original title and non-null coordinates checked across locales; different IDs retained.',
    linkedSources: destinations.filter(item => item.related.length).length,
    relationships: destinations.reduce((n,item) => n + item.related.length, 0),
    uniqueLinkedOffers: new Set(destinations.flatMap(item => item.related.map(link => link.offerId))).size,
    items: destinations.map(item => ({ slug: item.slug, sourceId: item.translations[0]?.sourceId,
      locales: item.translations.map(text => text.locale), related: item.related.length,
      status: item.related.length ? 'linked' : 'no-confirmed-product-mapping' })),
  };
  return { config, coverage };
}
