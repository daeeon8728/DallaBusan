import { createHash } from 'node:crypto';
import { ThemePlaceSchema,ThemeRouteCatalogSchema,ThemeMappingFileSchema,ThemeTemplateFileSchema,SUPPORTED_LOCALES,
  type ThemePlace,type ThemePlaceRefSchema,type ThemeRoute,type ThemeRouteCatalog,type ThemeSeed,type ThemeMappingFile,type ThemeTemplateFile } from '@trip-fit/domain';
import type { z } from 'zod';
import type { ThemeRouteInputs } from '../config/theme-routes.js';
import { THEME_SOURCE_URL,FOOD_SOURCE_URL } from '../config/theme-routes.js';
function stable(value:unknown):string{
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  if(value!==null&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stable(Reflect.get(value,key))).join(',')+'}';
  return JSON.stringify(value)??'null';
}
export function themeDigest(value:unknown){return createHash('sha256').update(stable(value)).digest('hex');}
export function themeRecordFingerprint(record:ThemeRouteInputs['recommended']['languages'][number]['records'][number]){return themeDigest(record);}
const normalized=(value:string)=>value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
function cleanName(value:string){return value.replace(/\s*\((?:한|영|중간|중번|일|\s|,)+\)\s*/g,'').trim();}
function labelName(value:string){return value.replace(/\([^)]*\)/g,'').trim();}
export function themePlaceRefKey(ref:z.infer<typeof ThemePlaceRefSchema>){return ref.service+':'+ref.sourceId+':'+ref.locale;}
export function buildThemePlaceIndex(inputs:ThemeRouteInputs){
  const index=new Map<string,ThemePlace>();
  const locales=new Map<string,Set<string>>();
  for(const item of inputs.attractions.records){const key='attraction:'+item.record.sourceId;const values=locales.get(key)??new Set<string>();values.add(item.locale);locales.set(key,values);}
  for(const group of inputs.food.languages)for(const item of group.records){const key='food:'+item.id;const values=locales.get(key)??new Set<string>();values.add(group.locale);locales.set(key,values);}
  const insert=(raw:Omit<ThemePlace,'fingerprint'|'availableLocales'>)=>{
    const key=themePlaceRefKey(raw.ref);if(index.has(key))throw new Error('Duplicate place source identity');
    const {fetchedAt:_,...identity}=raw;void _;
    const availableLocales=SUPPORTED_LOCALES.filter(locale=>locales.get(raw.key)?.has(locale));
    const place=ThemePlaceSchema.parse({...raw,availableLocales,fingerprint:themeDigest(identity)});index.set(key,place);
  };
  for(const item of inputs.attractions.records){const r=item.record;insert({key:'attraction:'+r.sourceId,ref:{service:'attraction',sourceId:r.sourceId,locale:item.locale},name:cleanName(r.originalTitle)||r.title,
    originalName:r.originalTitle,title:r.title,description:r.descriptionRaw,address:r.addressRaw,district:r.districtRaw,coordinates:r.coordinates,sourceUrl:inputs.attractions.sourceUrl,fetchedAt:item.fetchedAt});}
  for(const group of inputs.food.languages)for(const r of group.records)insert({key:'food:'+r.id,ref:{service:'food',sourceId:r.id,locale:group.locale},name:r.name,originalName:r.originalName,title:r.name,
    description:r.description,address:r.address,district:r.district,coordinates:r.coordinates,sourceUrl:FOOD_SOURCE_URL,fetchedAt:inputs.food.source.collectedAt});
  return index;
}
export function themeStraightLineMeters(a:{lat:number;lng:number},b:{lat:number;lng:number}){
  const rad=(number:number)=>number*Math.PI/180;const h=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lng-a.lng)/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(Math.max(0,Math.min(1,h))),Math.sqrt(Math.max(0,1-h)));
}
function orderFindings(seed:ThemeSeed,description:string){
  if(seed.orderEvidence.kind==='narrative-edge'){
    const quote=seed.orderEvidence.excerpt;const labels=seed.steps.map(step=>step.label);
    if(labels.length!==2||!description.includes(quote)||quote.length>600)return ['narrative-direction-not-proven'];
    const first=labels[0];const second=labels[1];if(!first||!second)return ['narrative-direction-not-proven'];
    const from=quote.indexOf(first+'에서');const to=quote.indexOf(second+'에',from+first.length);
    return from>=0&&to>from&&/^에\s*다다/.test(quote.slice(to+second.length))?[]:['narrative-direction-not-proven'];
  }
  if(seed.orderEvidence.kind!=='declared-sequence')return ['order-not-explicitly-declared'];
  const {context,excerpt,delimiter}=seed.orderEvidence;const start=description.indexOf(context);const at=description.indexOf(excerpt,start<0?0:start);
  if(start<0||at<start||at-start>800||!/(코스|경로|여행)/.test(context)||/(출구|정류장|환승|승차|하차)/.test(excerpt))return ['order-evidence-invalid'];
  const line=excerpt.replace(/^\s*(?:\*\s*)?코스\s*경로\s*[:：]\s*/,'').trim();
  const labels=delimiter==='dash'?line.split(/\s*[–]\s*|\s+-\s+/):delimiter==='none'?[line]:line.split(delimiter);
  if(labels.length!==seed.steps.length||labels.some((label,index)=>label.trim()!==seed.steps[index]?.label))return ['step-order-mismatch'];
  return [];
}
export function buildThemeRouteCatalog(inputs:ThemeRouteInputs,rawTemplates:ThemeTemplateFile,rawMappings:ThemeMappingFile,generatedAt:string):ThemeRouteCatalog{
  const templates=ThemeTemplateFileSchema.parse(rawTemplates);const mappingFile=ThemeMappingFileSchema.parse(rawMappings);
  const mappings=new Map(mappingFile.mappings.map(mapping=>[mapping.id,mapping]));
  if(mappings.size!==mappingFile.mappings.length||new Set(templates.templates.map(seed=>seed.id)).size!==templates.templates.length)throw new Error('Duplicate theme configuration identity');
  for(const seed of templates.templates)for(const id of [...seed.steps.flatMap(step=>step.mappingId?[step.mappingId]:[]),...seed.foodOptions.map(food=>food.mappingId)])if(!mappings.has(id))throw new Error('Unknown curated place mapping');
  const places=buildThemePlaceIndex(inputs);const routes:ThemeRoute[]=[];
  function resolveMapping(id:string){const mapping=mappings.get(id);if(!mapping)return {place:null,findings:['unknown-mapping']};const place=places.get(themePlaceRefKey(mapping.place));
    if(!place)return {place:null,findings:['missing-place-source']};if(place.fingerprint!==mapping.expectedFingerprint||place.name!==mapping.expectedName)return {place:null,findings:['place-source-changed']};return {place,findings:[]};}
  for(const seed of templates.templates){
    const source=inputs.recommended.languages.find(group=>group.locale===seed.sourceLocale)?.records.find(row=>row.id===seed.sourceId);
    const findings:string[]=[];if(!source)findings.push('missing-theme-source');else if(themeRecordFingerprint(source)!==seed.expectedFingerprint)findings.push('theme-source-changed');
    const sourceValid=findings.length===0&&source!==undefined;
    const ordered=sourceValid?orderFindings(seed,source.description):['order-source-unavailable'];findings.push(...ordered);
    const steps=seed.steps.map((step,position)=>{
      const resolved=step.mappingId?resolveMapping(step.mappingId):{place:null,findings:['unresolved-place']};const issues=[...resolved.findings];const place=resolved.place;
      if(!sourceValid)issues.push('theme-source-unavailable');
      if(place&&sourceValid){const label=normalized(labelName(step.label));const primary=normalized(cleanName(place.name));
        if(step.matchKind==='exact-name'&&label!==primary)issues.push('place-label-mismatch');
        else if(step.matchKind==='source-alias'){
          const quote=step.identityQuote;const aliases=mappings.get(step.mappingId??'')?.reviewedAliases??[];if(!aliases.some(alias=>normalized(alias)===label)||!quote||!source.description.includes(quote)||!normalized(quote).includes(label)||!normalized(quote).includes(primary))issues.push('alias-evidence-invalid');
        }else if(step.matchKind==='contained-place')issues.push('grouped-place-needs-specific-coordinate');
        else if(step.matchKind==='unresolved')issues.push('unresolved-place');
        if(!place.coordinates)issues.push('missing-coordinates');
      }
      return {position,label:step.label,matchKind:step.matchKind,place:sourceValid?place:null,findings:[...new Set(issues)]};
    });
    const keys=steps.flatMap(step=>step.place?[step.place.key]:[]);if(new Set(keys).size!==keys.length)findings.push('repeated-place-needs-review');
    const orderStatus:ThemeRoute['orderStatus']=ordered.length===0?'source-confirmed':'needs-review';
    for(const step of steps)for(const issue of step.findings)findings.push('step-'+step.position+':'+issue);
    const segments:ThemeRoute['sourceCheckedSegments']=[];
    if(orderStatus==='source-confirmed'&&!findings.includes('repeated-place-needs-review')){
      let start=-1;for(let i=0;i<=steps.length;i++){const step=steps[i];const good=step?.place!==null&&step?.place!==undefined&&step.findings.length===0;
        if(good&&start<0)start=i;
        if(!good&&start>=0){if(i-start>=2)segments.push({startIndex:start,endIndex:i-1,placeKeys:steps.slice(start,i).flatMap(step=>step.place?[step.place.key]:[]),isCompleteRoute:start===0&&i===steps.length&&seed.scope==='full-source'});start=-1;}}
    }
    const foodOptions=seed.foodOptions.map(option=>{
      const resolved=resolveMapping(option.mappingId);const issues=[...resolved.findings];const place=resolved.place;let straightLineMeters:number|null=null;
      if(!sourceValid)issues.push('theme-source-unavailable');if(place&&place.ref.service!=='food')issues.push('food-kind-mismatch');
      if(option.relationship==='source-mentioned'){
        if(!sourceValid||!option.evidenceQuote||!source.description.includes(option.evidenceQuote)||place&&!normalized(option.evidenceQuote).includes(normalized(place.name)))issues.push('food-mention-evidence-invalid');
      }else{
        const anchor=option.anchorIndex===null?undefined:steps[option.anchorIndex];
        if(!anchor?.place?.coordinates||anchor.findings.length||!place?.coordinates)issues.push('nearby-coordinate-evidence-missing');
        else{const distance=themeStraightLineMeters(anchor.place.coordinates,place.coordinates);straightLineMeters=Math.round(distance);if(distance>1000)issues.push('nearby-option-outside-radius');}
      }
      return {...option,status:issues.length?'needs-review' as const:'source-checked' as const,place:sourceValid?place:null,straightLineMeters,insertedIntoVisitOrder:false as const,findings:[...new Set(issues)]};
    });
    routes.push({id:seed.id,sourceId:seed.sourceId,sourceLocale:seed.sourceLocale,title:seed.title,scope:seed.scope,themeTags:seed.themeTags,mode:seed.mode,
      sourceUrl:THEME_SOURCE_URL,sourceFetchedAt:source?inputs.recommended.source.collectedAt:null,availableLocales:SUPPORTED_LOCALES.filter(locale=>inputs.recommended.languages.find(group=>group.locale===locale)?.records.some(row=>row.id===seed.sourceId)),
      sourceFingerprint:source?themeRecordFingerprint(source):null,reviewMethod:seed.reviewMethod,reviewedAt:seed.reviewedAt,humanApproval:'pending',fieldValidation:'not-performed',recommendationEnabled:false,
      orderStatus,status:findings.length?'needs-review':'source-checked',findings:[...new Set(findings)],orderEvidence:seed.orderEvidence,steps,sourceCheckedSegments:segments,foodOptions,notes:seed.notes});
  }
  const sourceGroups=new Map<string,typeof inputs.recommended.languages[number]['records']>();
  for(const group of inputs.recommended.languages)for(const row of group.records){const records=sourceGroups.get(row.id)??[];records.push(row);sourceGroups.set(row.id,records);}
  const coverage=[...sourceGroups].sort(([a],[b])=>a.localeCompare(b,'en',{numeric:true})).map(([sourceId,records])=>{
    const primary=records.find(row=>row.locale==='ko')??records[0];if(!primary)throw new Error('Empty theme source group');const selected=routes.filter(route=>route.sourceId===sourceId);
    return {sourceId,sourceLocale:primary.locale,title:primary.name,availableLocales:SUPPORTED_LOCALES.filter(locale=>records.some(row=>row.locale===locale)),templateIds:selected.map(route=>route.id),
      status:selected.some(route=>route.status==='source-checked')?'source-checked' as const:selected.length?'needs-review' as const:'not-curated' as const,
      reason:selected.length?'See explicit per-template source/order/place findings.':primary.locale==='ko'?'Not curated; title or text occurrence is not a visit-order review.':'No curated source-locale review; not merged with other IDs.'};
  });
  const checkedSteps=routes.flatMap(route=>route.steps).filter(step=>step.place&&step.findings.length===0);const checkedFood=routes.flatMap(route=>route.foodOptions).filter(option=>option.status==='source-checked');
  const summary={sourceGroups:coverage.length,sourceLanguageRecords:inputs.recommended.languages.reduce((sum,group)=>sum+group.records.length,0),templates:routes.length,
    sourceConfirmedOrder:routes.filter(route=>route.orderStatus==='source-confirmed').length,sourceCheckedTemplates:routes.filter(route=>route.status==='source-checked').length,needsReview:routes.filter(route=>route.status==='needs-review').length,
    sourceCheckedSegments:routes.reduce((sum,route)=>sum+route.sourceCheckedSegments.length,0),checkedAttractionSteps:checkedSteps.filter(step=>step.place?.ref.service==='attraction').length,
    checkedFoodSteps:checkedSteps.filter(step=>step.place?.ref.service==='food').length,checkedFoodOptions:checkedFood.length,nearbyFoodOptions:checkedFood.filter(option=>option.relationship==='nearby-coordinate-option').length,
    sourceMentionedFoodOptions:checkedFood.filter(option=>option.relationship==='source-mentioned').length,notCuratedSources:coverage.filter(row=>row.status==='not-curated').length,
    unresolvedSteps:routes.flatMap(route=>route.steps).filter(step=>step.findings.length>0).length,humanApproved:0 as const};
  return ThemeRouteCatalogSchema.parse({version:1,generatedAt,inputDigests:{recommended:themeDigest(inputs.recommended),food:themeDigest(inputs.food),attractions:themeDigest(inputs.attractions),templates:themeDigest(templates),mappings:themeDigest(mappingFile)},routes,coverage,summary});
}
