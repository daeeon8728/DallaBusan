import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { LocaleSchema } from '@trip-fit/domain';
import { loadAttractionConfig, loadDatabaseConfig } from '../apps/server/src/config/env.js';
import { openDatabase, migrate } from '../apps/server/src/db/client.js';
import { createAttractionCache, MappingFileSchema, storeAttractionRecords } from '../apps/server/src/db/attractions.js';
import { createAttractionClient } from '../apps/server/src/providers/attraction/client.js';
import { importAttractions } from '../apps/server/src/services/import-attractions.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !args[0]?.startsWith('--locale=')) throw new Error('Usage: npm run data:import -- --locale=ko');
  const locale = LocaleSchema.parse(args[0].slice('--locale='.length));
  const config = loadAttractionConfig();
  if (!config.serviceKey) throw new Error('ATTRACTION_SERVICE_KEY is not configured in the root .env');
  const mappingsInput: unknown = JSON.parse(await readFile(fileURLToPath(new URL('../config/attraction-mappings.json', import.meta.url)), 'utf8'));
  const mappings = MappingFileSchema.parse(mappingsInput);
  const db = openDatabase(loadDatabaseConfig().filename);
  try {
    migrate(db);
    const client = createAttractionClient(config, createAttractionCache(db));
    const startedAt = new Date().toISOString();
    const summary = await importAttractions(client, locale, config,
      (records, fetchedAt) => storeAttractionRecords(db, locale, records, fetchedAt, mappings));
    db.prepare('INSERT INTO attraction_imports(locale,started_at,payload) VALUES (?,?,?)').run(locale, startedAt, JSON.stringify(summary));
    console.log(JSON.stringify(summary));
    if (summary.status !== 'complete') process.exitCode = 1;
  } finally { db.close(); }
}
main().catch(() => {
  // External validation exceptions may contain upstream data; report only a fixed message.
  console.error('Attraction import failed. Check locale, server configuration and reviewed mappings; credentials were not logged.');
  process.exitCode = 1;
});
