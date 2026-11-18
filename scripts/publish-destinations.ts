import { readFile, writeFile, rename } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { LocaleSchema } from '@trip-fit/domain';
import { loadDatabaseConfig } from '../apps/server/src/config/env.js';
import { loadDestinationConfig } from '../apps/server/src/config/destinations.js';
import { loadOfferCatalogConfig } from '../apps/server/src/config/offers.js';
import { createOfferService } from '../apps/server/src/services/offers.js';
import { createDestinationService } from '../apps/server/src/services/destinations.js';
import { publishDestinationSnapshot } from '../apps/server/src/services/publish-destinations.js';

async function main() {
  const db = new DatabaseSync(loadDatabaseConfig().filename, { readOnly: true });
  try {
    const rows = db.prepare('SELECT locale,payload,fetched_at FROM attraction_records ORDER BY CAST(source_id AS INTEGER),locale').all();
    const sourceRows = rows.map(row => ({
      locale: LocaleSchema.parse(row.locale), record: JSON.parse(z.string().parse(row.payload)),
      fetchedAt: z.string().parse(row.fetched_at),
    }));
    const curation: unknown = JSON.parse(await readFile(new URL('../config/catalog/destination-relations.json', import.meta.url), 'utf8'));
    const rights: unknown = JSON.parse(await readFile(new URL('../config/catalog/media-rights.json', import.meta.url),'utf8'));
    const approved = z.object({attractionImages:z.object({enabled:z.boolean()})}).parse(rights);
    const result = publishDestinationSnapshot(sourceRows, loadDestinationConfig(), curation, approved.attractionImages.enabled);
    const offers = createOfferService(loadOfferCatalogConfig());
    createDestinationService(result.config, offers);
    const temporary = new URL('../config/catalog/destinations.pending.json', import.meta.url);
    const target = new URL('../config/catalog/destinations.json', import.meta.url);
    await writeFile(temporary, JSON.stringify(result.config,null,2) + '\n');
    await rename(temporary, target);
    await writeFile(new URL('../config/catalog/destination-coverage.json', import.meta.url), JSON.stringify(result.coverage,null,2) + '\n');
    console.log(JSON.stringify({ sourceLanguageRecords: result.coverage.sourceLanguageRecords, sourceGroups: result.coverage.sourceGroups,
      linkedSources: result.coverage.linkedSources, relationships: result.coverage.relationships, uniqueLinkedOffers: result.coverage.uniqueLinkedOffers }));
  } finally { db.close(); }
}
main().catch(() => {
  console.error('Destination publication failed. Check source identities and reviewed mappings; credentials were not logged.');
  process.exitCode = 1;
});
