import { loadThemeRouteInputs,loadThemeCuration,themeCatalogPath } from '../apps/server/src/config/theme-routes.js';
import { readThemeRouteCatalog } from '../apps/server/src/repositories/theme-routes.js';
try{const inputs=loadThemeRouteInputs();const {templates,mappings}=loadThemeCuration();const result=await readThemeRouteCatalog(themeCatalogPath(),inputs,templates,mappings);console.log(JSON.stringify({status:'verified',summary:result.summary}));}
catch{console.error('Theme route check failed. Sources, review data or output changed; rebuild/review required.');process.exitCode=1;}
