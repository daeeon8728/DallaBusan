import { loadPromotionCatalog } from './config/promotions.js';
import { createPromotionService } from './services/promotions.js';
import { loadFoodPhotoOverrides } from './config/food-photos.js';
import { loadFoodVisibility } from './config/food-visibility.js';
import { loadParkingDirectory,buildParkingAnchors,loadParkingAttractions } from './config/parking-directory.js';
import { createParkingDirectoryService } from './services/parking-directory.js';
import { loadGuideSnapshot } from './config/guides.js';
import { createGuideService } from './services/guides.js';
import { loadTextLocalizer } from './config/localization.js';
import { createExchangeService } from './services/exchange.js';
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
  const localization = loadTextLocalizer();
  const destinationConfig = loadDestinationConfig();
  const foodSnapshot = loadGuideSnapshot('food');
  const foodVisibility = foodSnapshot ? loadFoodVisibility(foodSnapshot) : undefined;
  const foodPhotos = foodSnapshot && foodVisibility ? loadFoodPhotoOverrides(foodSnapshot,foodVisibility) : undefined;
  const parking = createParkingDirectoryService(loadParkingDirectory(), buildParkingAnchors(destinationConfig,foodSnapshot,loadParkingAttractions()));
  const attraction = loadAttractionConfig();
  const offerConfig = loadOfferCatalogConfig();
  const offers = createOfferService(offerConfig);
  const promotions = createPromotionService(loadPromotionCatalog(),offerConfig,offers);
  const db = openDatabase(loadDatabaseConfig().filename);
  try { migrate(db); } catch (error) { db.close(); throw error; }
  const app = buildApp(config, webRoot, createCatalogService(db, attraction.serviceKey !== null, attraction.cacheTtlMs), offers, createDestinationService(destinationConfig, offers,undefined,localization), createGuideService({food:foodSnapshot,recommended:loadGuideSnapshot('recommended')},localization,foodVisibility,foodPhotos),parking,config.NODE_ENV === 'test' ? undefined : createExchangeService(),promotions);
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
