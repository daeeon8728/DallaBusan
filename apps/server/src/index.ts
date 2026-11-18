import { loadGuideSnapshot } from './config/guides.js';
import { createGuideService } from './services/guides.js';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { loadServerConfig, loadDatabaseConfig, loadAttractionConfig } from './config/env.js';
import { openDatabase, migrate } from './db/client.js';
import { createCatalogService } from './services/catalog.js';
import { loadOfferCatalogConfig } from './config/offers.js';
import { createOfferService } from './services/offers.js';
import { loadDestinationConfig } from './config/destinations.js';
import { createDestinationService } from './services/destinations.js';

async function main() {
  const config = loadServerConfig();
  const webRoot = process.argv.includes('--serve-web')
    ? fileURLToPath(new URL('../../web/dist/', import.meta.url))
    : undefined;
  if (webRoot !== undefined) {
    await stat(fileURLToPath(new URL('../../web/dist/index.html', import.meta.url)));
  }
  const attraction = loadAttractionConfig();
  const offers = createOfferService(loadOfferCatalogConfig());
  const db = openDatabase(loadDatabaseConfig().filename);
  try { migrate(db); } catch (error) { db.close(); throw error; }
  const app = buildApp(config, webRoot, createCatalogService(db, attraction.serviceKey !== null, attraction.cacheTtlMs), offers, createDestinationService(loadDestinationConfig(), offers), createGuideService({food:loadGuideSnapshot('food'),recommended:loadGuideSnapshot('recommended')}));
  app.addHook('onClose', async () => { db.close(); });
  const stop = async () => {
    await app.close();
  };
  process.once('SIGINT', () => { void stop(); });
  process.once('SIGTERM', () => { void stop(); });
  try { await app.listen({ host: config.HOST, port: config.PORT }); }
  catch (error) { await app.close(); throw error; }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Server startup failed.');
  process.exitCode = 1;
});
