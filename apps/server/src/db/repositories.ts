import type { DatabaseSync } from 'node:sqlite';
import {
  PlaceSchema, TranslationSchema, ProductSchema, ProviderSchema,
  type CatalogRepository, type Place, type Product, type CatalogProvider,
} from '@trip-fit/domain';

function decode(value: unknown): unknown {
  if (typeof value !== 'string') throw new Error('Invalid stored catalog payload');
  const parsed: unknown = JSON.parse(value);
  return parsed;
}
function protectReviewed(
  previous: Place | ReturnType<typeof TranslationSchema.parse>,
  incoming: Place | ReturnType<typeof TranslationSchema.parse>,
  fields: string[],
) {
  if (incoming.provenance.source !== 'public-api') return;
  if (previous.provenance.status === 'verified'
    && JSON.stringify(incoming.provenance) !== JSON.stringify(previous.provenance))
    throw new Error('Public import cannot overwrite reviewed provenance');
  const before = new Map(Object.entries(previous));
  const after = new Map(Object.entries(incoming));
  for (const field of fields) {
    if ((previous.fieldSources[field] ?? previous.provenance).status === 'verified'
      && (JSON.stringify(before.get(field)) !== JSON.stringify(after.get(field))
        || JSON.stringify(previous.fieldSources[field]) !== JSON.stringify(incoming.fieldSources[field])))
      throw new Error('Public import cannot overwrite reviewed field');
  }
}
export function createCatalogRepository(db: DatabaseSync): CatalogRepository {
  return {
    putProvider(input: CatalogProvider) {
      const value = ProviderSchema.parse(input);
      db.prepare('INSERT INTO providers(id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload')
        .run(value.providerId,JSON.stringify(value));
    },
    putPlace(input: Place) {
      const value = PlaceSchema.parse(input);
      const stored = db.prepare('SELECT payload FROM places WHERE id=?').get(value.id);
      if (stored) {
        const previous = PlaceSchema.parse(decode(stored.payload));
        protectReviewed(previous, value, ['category', 'regionId', 'coordinates', 'durationMinutes']);
      }
      db.prepare('INSERT INTO places(id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload')
        .run(value.id,JSON.stringify(value));
    },
    putTranslation(input) {
      const value = TranslationSchema.parse(input);
      const stored = db.prepare('SELECT payload FROM place_translations WHERE place_id=? AND locale=?').get(value.placeId,value.locale);
      if (stored) protectReviewed(TranslationSchema.parse(decode(stored.payload)), value, ['title', 'description', 'holidayInfoRaw', 'image']);
      db.prepare('INSERT INTO place_translations(place_id,locale,payload) VALUES (?,?,?) ON CONFLICT(place_id,locale) DO UPDATE SET payload=excluded.payload')
        .run(value.placeId,value.locale,JSON.stringify(value));
    },
    putProduct(input: Product) {
      const value = ProductSchema.parse(input);
      db.prepare('INSERT INTO products(id,place_id,provider_id,external_product_id,payload) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET place_id=excluded.place_id,provider_id=excluded.provider_id,external_product_id=excluded.external_product_id,payload=excluded.payload')
        .run(value.id,value.placeId,value.providerId,value.externalProductId,JSON.stringify(value));
    },
    getPlace(id) {
      const row = db.prepare('SELECT payload FROM places WHERE id=?').get(id);
      return row ? PlaceSchema.parse(decode(row.payload)) : null;
    },
    getTranslation(placeId,locale) {
      const row = db.prepare('SELECT payload FROM place_translations WHERE place_id=? AND locale=?').get(placeId,locale);
      return row ? TranslationSchema.parse(decode(row.payload)) : null;
    },
    listProducts(placeId) {
      return db.prepare('SELECT payload FROM products WHERE place_id=? ORDER BY id').all(placeId)
        .map(row => ProductSchema.parse(decode(row.payload)));
    },
  };
}
