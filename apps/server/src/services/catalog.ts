import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { LocaleSchema, PlaceSchema, TranslationSchema, type Locale } from '@trip-fit/domain';
import { AttractionRecordSchema } from '../providers/attraction/parse.js';
import { createCatalogRepository } from '../db/repositories.js';
import { ImportResultSchema } from './import-attractions.js';

export const CatalogQuerySchema = z.strictObject({
  locale: LocaleSchema.default('ko'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(100).default(''),
});
export type CatalogQuery = z.infer<typeof CatalogQuerySchema>;
function json(input: unknown): unknown {
  if (typeof input !== 'string') throw new Error('Invalid catalog storage');
  const parsed: unknown = JSON.parse(input); return parsed;
}
export function createCatalogService(db: DatabaseSync, configured: boolean, staleAfterMs: number, now = Date.now) {
  const repo = createCatalogRepository(db);
  return {
    status() {
      const row = db.prepare('SELECT payload FROM attraction_imports ORDER BY id DESC LIMIT 1').get();
      const lastImport = row ? ImportResultSchema.parse(json(row.payload)) : null;
      return { provider: configured ? 'configured' : 'unconfigured', lastImport };
    },
    list(query: CatalogQuery) {
      // Bounded SQL pagination, with literal search wildcards escaped.
      const search = '%' + query.q.replace(/[\\%_]/g, value => '\\' + value) + '%';
      const count = db.prepare("SELECT COUNT(*) AS n FROM places p WHERE EXISTS (SELECT 1 FROM place_translations t WHERE t.place_id=p.id AND t.locale IN (?,?,?) AND json_extract(t.payload,'$.title') LIKE ? ESCAPE '\\')").get(query.locale, 'ko', 'en', search);
      const rows = db.prepare("SELECT p.payload FROM places p WHERE EXISTS (SELECT 1 FROM place_translations t WHERE t.place_id=p.id AND t.locale IN (?,?,?) AND json_extract(t.payload,'$.title') LIKE ? ESCAPE '\\') ORDER BY CASE WHEN EXISTS (SELECT 1 FROM place_translations preferred WHERE preferred.place_id=p.id AND preferred.locale=?) THEN 0 ELSE 1 END,p.id LIMIT ? OFFSET ?")
        .all(query.locale, 'ko', 'en', search, query.locale, query.limit, (query.page - 1) * query.limit);
      const items = rows.flatMap(row => {
        const place = PlaceSchema.parse(json(row.payload));
        const locales: Locale[] = [...new Set([query.locale, 'ko', 'en'].map(value => LocaleSchema.parse(value)))];
        let translation = repo.getTranslation(place.id, query.locale);
        for (const locale of locales) { if (!translation) translation = repo.getTranslation(place.id, locale); }
        if (!translation) return [];
        const value = TranslationSchema.parse(translation);
        const sourceRow = db.prepare("SELECT payload,fetched_at FROM attraction_records WHERE locale=? AND place_id=?")
          .get(value.locale, place.id);
        // Source identity is explicit; canonical IDs are never inferred from names.
        const source = sourceRow ? AttractionRecordSchema.parse(json(sourceRow.payload)) : null;
        const freshnessAt = typeof sourceRow?.fetched_at === 'string' ? sourceRow.fetched_at : value.provenance.retrievedAt;
        return [{
          id: place.id, title: value.title, description: value.description, locale: value.locale,
          requestedLocale: query.locale, translationFallback: value.locale !== query.locale || (source?.warnings.includes('missing-localized-title') ?? false),
          coordinates: place.coordinates, holidayInfoRaw: value.holidayInfoRaw,
          image: value.image, reviewStatus: place.provenance.status,
          eligibleForPlanning: place.provenance.status === 'verified' && place.regionId !== 'unreviewed' && place.coordinates !== null,
          retrievedAt: freshnessAt, stale: now() - Date.parse(freshnessAt) > staleAfterMs,
          warnings: source?.warnings ?? [], sourceUrl: value.provenance.sourceUrl,
        }];
      });
      return { ...query, total: typeof count?.n === 'number' ? count.n : 0, items };
    },
  };
}
export type CatalogService = ReturnType<typeof createCatalogService>;
