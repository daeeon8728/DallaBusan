import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { LocaleSchema, PlaceSchema, type Locale, type Place, type PlaceTranslation } from '@trip-fit/domain';
import { createCatalogRepository } from './repositories.js';
import { transaction } from './client.js';
import { CachedPageSchema, type AttractionCache } from '../providers/attraction/client.js';
import { AttractionRecordSchema, type AttractionRecord } from '../providers/attraction/parse.js';
import { ATTRACTION_SOURCE_URL } from '../providers/attraction/locales.js';

export const MappingFileSchema = z.strictObject({ mappings: z.array(z.strictObject({
  locale: LocaleSchema, sourceId: z.string().regex(/^\d{1,20}$/), placeId: z.string().min(1).max(160), reviewedAt: z.iso.datetime(),
})) }).superRefine((file, context) => {
  const seen = new Set<string>();
  const canonical = new Set<string>();
  for (const mapping of file.mappings) {
    const key = mapping.locale + ':' + mapping.sourceId;
    if (seen.has(key)) context.addIssue({ code: 'custom', message: 'Duplicate source mapping' });
    const target = mapping.locale + ':' + mapping.placeId;
    if (canonical.has(target)) context.addIssue({ code: 'custom', message: 'Ambiguous canonical locale mapping' });
    seen.add(key); canonical.add(target);
  }
});
export type AttractionMappings = z.infer<typeof MappingFileSchema>;
export function createAttractionCache(db: DatabaseSync): AttractionCache {
  return {
    get(key) {
      const row = db.prepare('SELECT payload FROM attraction_pages WHERE cache_key=?').get(key);
      if (!row || typeof row.payload !== 'string') return null;
      try { const input: unknown = JSON.parse(row.payload); return CachedPageSchema.parse(input); }
      catch { return null; } // Damaged cache is a miss; it never becomes facts.
    },
    set(key, value) {
      db.prepare('INSERT INTO attraction_pages(cache_key,payload) VALUES (?,?) ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload')
        .run(key, JSON.stringify(CachedPageSchema.parse(value)));
    },
  };
}
function locked(record: Place | PlaceTranslation, field: string) {
  const specific = record.fieldSources[field];
  return (specific ?? record.provenance).status === 'verified';
}
export function storeAttractionRecords(
  db: DatabaseSync, locale: Locale, records: AttractionRecord[], fetchedAt: string, mappings: AttractionMappings,
) {
  const repo = createCatalogRepository(db);
  transaction(db, () => {
    for (const input of records) {
      const record = AttractionRecordSchema.parse(input);
      const mapping = mappings.mappings.find(value => value.locale === locale && value.sourceId === record.sourceId);
      const placeId = mapping?.placeId ?? 'busan-api:' + locale + ':' + record.sourceId;
      const previous = repo.getPlace(placeId);
      if (mapping && !previous) throw new Error('Reviewed attraction mapping refers to an absent place');
      const provenance = { source: 'public-api', sourceUrl: ATTRACTION_SOURCE_URL, retrievedAt: fetchedAt, reviewedAt: null, status: 'unverified' } as const;
      const base: Place = previous ?? {
        id: placeId, category: 'attraction', regionId: 'unreviewed', coordinates: null,
        durationMinutes: null, provenance, fieldSources: {},
      };
      // API only supplies coordinates here. Category, region and duration require local review.
      const updateCoordinates = !locked(base, 'coordinates') && record.coordinates !== null;
      const merged = PlaceSchema.parse({
        ...base, provenance: base.provenance.status === 'verified' ? base.provenance : provenance, coordinates: updateCoordinates ? record.coordinates : base.coordinates,
        fieldSources: { ...base.fieldSources, ...(updateCoordinates ? { coordinates: provenance } : {}) },
      });
      repo.putPlace(merged);
      const oldTranslation = repo.getTranslation(placeId, locale);
      const translation: PlaceTranslation = oldTranslation ?? {
        placeId, locale, title: record.title, description: '', holidayInfoRaw: null, image: null, provenance, fieldSources: {},
      };
      const next = { ...translation, provenance: translation.provenance.status === 'verified' ? translation.provenance : provenance, fieldSources: { ...translation.fieldSources } };
      if (!locked(translation, 'title')) { next.title = record.title; next.fieldSources.title = provenance; }
      if (!locked(translation, 'description') && record.descriptionRaw.trim()) {
        next.description = record.descriptionRaw; next.fieldSources.description = provenance;
      }
      if (!locked(translation, 'holidayInfoRaw') && record.holidayInfoRaw !== null) {
        next.holidayInfoRaw = record.holidayInfoRaw; next.fieldSources.holidayInfoRaw = provenance;
      }
      // Image URL is staged below. No fabricated license/author or automatic publication.
      repo.putTranslation(next);
      db.prepare('INSERT INTO attraction_records(locale,source_id,place_id,payload,fetched_at) VALUES (?,?,?,?,?) ON CONFLICT(locale,source_id) DO UPDATE SET place_id=excluded.place_id,payload=excluded.payload,fetched_at=excluded.fetched_at')
        .run(locale, record.sourceId, placeId, JSON.stringify(record), fetchedAt);
    }
  });
}
