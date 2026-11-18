import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { ProviderSchema, PlaceSchema, TranslationSchema, ProductSchema } from '@trip-fit/domain';
import { createCatalogRepository } from './repositories.js';
import { transaction } from './client.js';

const SeedSchema = z.strictObject({
  providers: z.array(ProviderSchema), places: z.array(PlaceSchema),
  translations: z.array(TranslationSchema), products: z.array(ProductSchema),
});
export function seedCatalog(db: DatabaseSync, input: unknown, allowTestFixtures = false) {
  const seed = SeedSchema.parse(input);
  if (!allowTestFixtures && [...seed.places,...seed.translations,...seed.products].some(item =>
    item.provenance.source === 'test-fixture' || item.provenance.status !== 'verified'))
    throw new Error('Only verified non-test records are allowed in the local catalog seed');
  const repo = createCatalogRepository(db);
  transaction(db, () => {
    seed.providers.forEach(value => repo.putProvider(value));
    seed.places.forEach(value => repo.putPlace(value));
    seed.translations.forEach(value => repo.putTranslation(value));
    seed.products.forEach(value => repo.putProduct(value));
  });
  return { providers: seed.providers.length, places: seed.places.length, translations: seed.translations.length, products: seed.products.length };
}
