import { loadThemeRouteInputs,loadThemeCuration,themeCatalogPath } from '../apps/server/src/config/theme-routes.js';
import { buildThemeRouteCatalog } from '../apps/server/src/services/theme-route-catalog.js';
import { publishThemeRouteCatalog } from '../apps/server/src/repositories/theme-routes.js';
try{const inputs=loadThemeRouteInputs();const {templates,mappings}=loadThemeCuration();const result=buildThemeRouteCatalog(inputs,templates,mappings,new Date().toISOString());await publishThemeRouteCatalog(result,themeCatalogPath(),inputs,templates,mappings);console.log(JSON.stringify({status:'complete',file:'config/catalog/theme-routes.json',summary:result.summary}));}
catch{console.error('Theme route build failed. Previous snapshot preserved; details redacted.');process.exitCode=1;}
