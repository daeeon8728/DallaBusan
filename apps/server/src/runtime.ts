import {loadMapLinkConfig} from './config/map-links.js';
import {createMapLinkService} from './services/map-links.js';
import {registerMapLinkRoutes} from './routes/map-links.js';
import{loadAdminConfig,type AdminConfig}from'./config/admin.js';
import{createAdminStore}from'./admin/store.js';
import{createManagedContent}from'./admin/content.js';
import{registerAdminRoutes}from'./admin/routes.js';
import{loadBookingGuideConfig}from'./config/booking-guides.js';
import{createBookingGuideService}from'./services/booking-guides.js';
import{registerBookingGuideRoutes}from'./routes/booking-guides.js';
import{loadCourseExpansion}from'./config/course-expansion.js';
import {loadCourseModules} from './config/course-builder.js';
import {createCourseBuilderService} from './services/course-builder.js';
import {registerCourseBuilderRoutes} from './routes/course-builder.js';
import {loadFoodAssistanceConfig} from './config/food-assistance.js';
import {createFoodAssistanceService} from './services/food-assistance.js';
import {registerFoodAssistanceRoutes} from './routes/food-assistance.js';
import {loadStaySearchConfig,createStaySearchConfig} from './config/stay-search.js';
import {registerStaySearchRoutes} from './routes/stay-search.js';
import {loadTravelToolConfig,createTravelToolConfig} from './config/travel-tools.js';
import {registerTravelToolRoutes} from './routes/travel-tools.js';
import {loadStayBannerConfig,createStayBannerConfig} from './config/stay-banner.js';
import {registerStayBannerRoutes} from './routes/stay-banner.js';
import {loadStayMapConfig,createStayMapConfig} from './config/stay-map.js';
import {registerStayMapRoutes} from './routes/stay-map.js';
import {loadCourseCommerce} from './config/course-commerce.js';
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

export async function createRuntimeApp(options: { serveWeb?: boolean; readOnlySnapshot?: boolean;adminConfig?:AdminConfig } = {}) {
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

  const database = loadRuntimeDatabaseConfig(undefined,options.readOnlySnapshot ?? false);
  const db = openDatabase(database.filename, { readOnly: database.readOnly });
  try { if (!database.readOnly) migrate(db); } catch (error) { db.close(); throw error; }
  const originalDestinations=createDestinationService(destinationConfig,offers,undefined,localization);
  const recommendedSnapshot=loadGuideSnapshot('recommended');
  const originalGuides=createGuideService({food:foodSnapshot,recommended:recommendedSnapshot},localization,foodVisibility,foodPhotos);
  const courseCatalog=loadCourseCatalog(),courseRoutes=loadCourseRoutes(),courseExpansion=loadCourseExpansion(),commerce=loadCourseCommerce(courseCatalog,offerConfig);
  const courseFactory=(o:typeof offers,d:typeof originalDestinations,g:typeof originalGuides)=>createCourseService(courseCatalog,d,g,parkingAnchors,courseRoutes,commerce,undefined,o,courseExpansion);
  const originalCourses=courseFactory(offers,originalDestinations,originalGuides);
  const adminConfig=options.readOnlySnapshot?loadAdminConfig(true):(options.adminConfig??loadAdminConfig(config.NODE_ENV==='test'));
  const adminStore=adminConfig.enabled?createAdminStore(adminConfig.directory):undefined;
  const managed=createManagedContent({baseOffers:offers,baseDestinations:originalDestinations,offers:offerConfig,destinations:destinationConfig,baseCourses:originalCourses,guides:originalGuides,localization,anchors:parkingAnchors,imageHosts:adminConfig.imageHosts,courseFactory,guideFactory:doc=>{
    if(!doc.hiddenFoods.length&&!doc.images.some(i=>i.target==='food'))return originalGuides;
    const hidden=new Set(doc.hiddenFoods),snapshot=foodSnapshot?{...foodSnapshot,languages:foodSnapshot.languages.map(group=>({...group,records:group.records.filter(r=>!hidden.has(r.id)),total:group.records.filter(r=>!hidden.has(r.id)).length}))}:null;
    const photos=new Map(foodPhotos),credits=new Map<string,{credit:string;sourceUrl:string}>();for(const image of doc.images.filter(i=>i.target==='food')){photos.set(image.id,image.url);credits.set(image.id,{credit:image.credit,sourceUrl:image.sourceUrl});}
    return createGuideService({food:snapshot,recommended:recommendedSnapshot},localization,foodVisibility,photos,credits);
  }},adminStore);
  const destinationService=managed.destinations,guideService=managed.guides,publicOffers=managed.offers,courses=managed.courses;
  const promotions=createPromotionService(loadPromotionCatalog(),offerConfig,publicOffers);
  const app = buildApp(config, webRoot, createCatalogService(db, attraction.serviceKey !== null, attraction.cacheTtlMs), publicOffers, destinationService, guideService,parking,config.NODE_ENV === 'test' ? undefined : createExchangeService(),promotions);
  registerAdminRoutes(app,adminConfig,managed,adminStore);
  registerMapLinkRoutes(app,createMapLinkService(loadMapLinkConfig(),destinationService,guideService,parkingAnchors));
  registerBookingGuideRoutes(app,createBookingGuideService(loadBookingGuideConfig(),offerConfig,publicOffers));
  registerStaySearchRoutes(app,createStaySearchConfig(loadStaySearchConfig(),offerConfig));
  registerTravelToolRoutes(app,createTravelToolConfig(loadTravelToolConfig(),offerConfig));
  registerStayBannerRoutes(app,createStayBannerConfig(loadStayBannerConfig(),offerConfig));
  registerStayMapRoutes(app,createStayMapConfig(loadStayMapConfig(),offerConfig));
  registerCourseRoutes(app,courses);
  registerCourseBuilderRoutes(app,createCourseBuilderService(courses,loadCourseModules(courseCatalog),destinationService,publicOffers,loadCourseExpansion(),guideService,parkingAnchors,()=>adminStore?.published().revision??0));
  registerFoodAssistanceRoutes(app,createFoodAssistanceService(loadFoodAssistanceConfig(),foodSnapshot,guideService,courses));
  app.addHook('onClose', async () => { adminStore?.close();db.close(); });
  return app;
}
