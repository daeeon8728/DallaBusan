import { readFile,open,rename,unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { ThemeRouteCatalogSchema,type ThemeTemplateFile,type ThemeMappingFile } from '@trip-fit/domain';
import type { ThemeRouteInputs } from '../config/theme-routes.js';
import { buildThemeRouteCatalog } from '../services/theme-route-catalog.js';
export function validateThemeRouteCatalog(input:unknown,inputs:ThemeRouteInputs,templates:ThemeTemplateFile,mappings:ThemeMappingFile){
  const parsed=ThemeRouteCatalogSchema.safeParse(input);if(!parsed.success)throw new Error('Invalid theme route snapshot');
  const rebuilt=buildThemeRouteCatalog(inputs,templates,mappings,parsed.data.generatedAt);
  if(JSON.stringify(rebuilt)!==JSON.stringify(parsed.data))throw new Error('Theme route dependencies or output changed');return parsed.data;
}
export async function publishThemeRouteCatalog(input:unknown,destination:URL,inputs:ThemeRouteInputs,templates:ThemeTemplateFile,mappings:ThemeMappingFile){
  const value=validateThemeRouteCatalog(input,inputs,templates,mappings);const pending=new URL(destination.href+'.'+randomUUID()+'.pending.json');let owned=false;
  try{const file=await open(pending,'wx');owned=true;try{await file.writeFile(JSON.stringify(value,null,2)+'\n');await file.sync();}finally{await file.close();}await rename(pending,destination);}
  catch{throw new Error('Theme route publication failed');}finally{if(owned)await unlink(pending).catch(()=>undefined);}
}
export async function readThemeRouteCatalog(file:URL,inputs:ThemeRouteInputs,templates:ThemeTemplateFile,mappings:ThemeMappingFile){
  try{const value:unknown=JSON.parse(await readFile(file,'utf8'));return validateThemeRouteCatalog(value,inputs,templates,mappings);}catch{throw new Error('Theme route snapshot is invalid or requires rebuilding');}
}
