import {loadTravelToolConfig,createTravelToolConfig} from './config/travel-tools.js';
import {registerTravelToolRoutes} from './routes/travel-tools.js';
import {loadStayBannerConfig,createStayBannerConfig} from './config/stay-banner.js';
import {registerStayBannerRoutes} from './routes/stay-banner.js';
import {loadStayMapConfig,createStayMapConfig} from './config/stay-map.js';
import {registerStayMapRoutes} from './routes/stay-map.js';
import {loadCourseRoutes} from './config/course-routes.js';
import { loadCourseCatalog } from './config/courses.js';
import { createCourseService } from './services/courses.js';
import { registerCourseRoutes } from './routes/courses.js';
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
import { buildApp } from './app-factory.js';
import { loadServerConfig, loadRuntimeDatabaseConfig, loadAttractionConfig } from './config/env.js';
import { openDatabase, migrate } from './db/client.js';
import { createCatalogService } from './services/catalog.js';
import { loadOfferCatalogConfig } from './config/offers.js';
import { createOfferService } from './services/offers.js';
import { loadDestinationConfig } from './config/destinations.js';
import { createDestinationService } from './services/destinations.js';

export async function createRuntimeApp(options: { serveWeb?: boolean; readOnlySnapshot?: boolean } = {}) {
  const config = loadServerConfig();
  const webRoot = options.serveWeb
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
  const parkingAnchors=buildParkingAnchors(destinationConfig,foodSnapshot,loadParkingAttractions());
  const parking = createParkingDirectoryService(loadParkingDirectory(),parkingAnchors);
  const attraction = loadAttractionConfig();
  const offerConfig = loadOfferCatalogConfig();
  const offers = createOfferService(offerConfig);
  const promotions = createPromotionService(loadPromotionCatalog(),offerConfig,offers);
  const database = loadRuntimeDatabaseConfig(undefined,options.readOnlySnapshot ?? false);
  const db = openDatabase(database.filename, { readOnly: database.readOnly });
  try { if (!database.readOnly) migrate(db); } catch (error) { db.close(); throw error; }
  const destinationService=createDestinationService(destinationConfig,offers,undefined,localization);
  const guideService=createGuideService({food:foodSnapshot,recommended:loadGuideSnapshot('recommended')},localization,foodVisibility,foodPhotos);
  const app = buildApp(config, webRoot, createCatalogService(db, attraction.serviceKey !== null, attraction.cacheTtlMs), offers, destinationService, guideService,parking,config.NODE_ENV === 'test' ? undefined : createExchangeService(),promotions);
  registerTravelToolRoutes(app,createTravelToolConfig(loadTravelToolConfig(),offerConfig));
  registerStayBannerRoutes(app,createStayBannerConfig(loadStayBannerConfig(),offerConfig));
  registerStayMapRoutes(app,createStayMapConfig(loadStayMapConfig(),offerConfig));
  registerCourseRoutes(app,createCourseService(loadCourseCatalog(),destinationService,guideService,parkingAnchors,loadCourseRoutes()));
  app.addHook('onClose', async () => { db.close(); });
  return app;
}
