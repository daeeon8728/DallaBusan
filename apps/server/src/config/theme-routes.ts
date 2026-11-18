import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { GuideSnapshotSchema,LocaleSchema,ThemeMappingFileSchema,ThemeTemplateFileSchema } from '@trip-fit/domain';
import { AttractionRecordSchema } from '../providers/attraction/parse.js';
export const RouteAttractionSourcesSchema=z.strictObject({version:z.literal(1),source:z.literal('readonly-existing-attraction-database'),sourceUrl:z.literal('https://www.data.go.kr/data/15063481/openapi.do'),exportedAt:z.iso.datetime(),
  records:z.array(z.strictObject({locale:LocaleSchema,record:AttractionRecordSchema,fetchedAt:z.iso.datetime()})).min(1)}).superRefine((source,ctx)=>{
  const seen=new Set<string>();const identities=new Map<string,typeof source.records[number]['record']>();
  for(const item of source.records){const key=item.record.sourceId+':'+item.locale;const prior=identities.get(item.record.sourceId);
    if(seen.has(key)||prior&&(prior.originalTitle!==item.record.originalTitle||JSON.stringify(prior.coordinates)!==JSON.stringify(item.record.coordinates)))ctx.addIssue({code:'custom',message:'Ambiguous attraction source identity'});
    seen.add(key);if(!prior)identities.set(item.record.sourceId,item.record);
  }
});
export interface ThemeRouteInputs {recommended:z.infer<typeof GuideSnapshotSchema>;food:z.infer<typeof GuideSnapshotSchema>;attractions:z.infer<typeof RouteAttractionSourcesSchema>}
export const THEME_SOURCE_URL='https://www.data.go.kr/data/15063506/openapi.do';
export const FOOD_SOURCE_URL='https://www.data.go.kr/data/15063472/openapi.do';
export function themeCatalogPath(){return new URL('../../../../config/catalog/theme-routes.json',import.meta.url);}
function read(name:string):unknown{try{return JSON.parse(readFileSync(new URL('../../../../config/catalog/'+name,import.meta.url),'utf8'));}catch{throw new Error('Theme catalog input unavailable');}}
export function loadThemeRouteInputs():ThemeRouteInputs{
  try{const recommended=GuideSnapshotSchema.parse(read('recommended.json'));const food=GuideSnapshotSchema.parse(read('food.json'));
    if(recommended.kind!=='recommended'||food.kind!=='food'||recommended.source.url!==THEME_SOURCE_URL||food.source.url!==FOOD_SOURCE_URL)throw new Error();
    return {recommended,food,attractions:RouteAttractionSourcesSchema.parse(read('route-attraction-sources.json'))};
  }catch{throw new Error('Invalid theme route sources');}
}
export function loadThemeCuration(){try{return {templates:ThemeTemplateFileSchema.parse(read('theme-route-templates.json')),mappings:ThemeMappingFileSchema.parse(read('route-place-mappings.json'))};}catch{throw new Error('Invalid theme route curation');}}
