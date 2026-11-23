import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { GuideIdSchema, SUPPORTED_LOCALES, type GuideSnapshot } from '@trip-fit/domain';
const RuleSchema=z.strictObject({excludedId:GuideIdSchema,retainedId:GuideIdSchema,excludedFingerprint:z.string().regex(/^[a-f0-9]{64}$/),retainedFingerprint:z.string().regex(/^[a-f0-9]{64}$/),reason:z.string().min(1),evidence:z.string().min(1)});
export const FoodVisibilitySchema=z.strictObject({version:z.literal(1),reviewedOn:z.iso.date(),reviewedBy:z.literal('assistant-source-evidence'),policy:z.literal('exclude-reviewed-photo-less-duplicates-only'),rules:z.array(RuleSchema)});
export interface FoodVisibility {readonly excludedIds:ReadonlySet<string>;readonly retainedIds:ReadonlySet<string>;readonly sourceTotal:number;readonly publishedTotal:number}
export function foodIdentityFingerprint(snapshot:GuideSnapshot,id:string){
 const records=SUPPORTED_LOCALES.flatMap(locale=>{const row=snapshot.languages.find(group=>group.locale===locale)?.records.find(row=>row.id===id);return row?[{locale,id:row.id,name:row.name,originalName:row.originalName,address:row.address,phone:row.phone,coordinates:row.coordinates,imageUrl:row.imageUrl,description:row.description}]:[];});
 return createHash('sha256').update(JSON.stringify(records)).digest('hex');
}
export function createFoodVisibility(snapshot:GuideSnapshot,input:unknown):FoodVisibility {
 if(snapshot.kind!=='food')throw new Error('Food visibility requires the food source');
 const policy=FoodVisibilitySchema.parse(input),excludedIds=new Set<string>(),retainedIds=new Set<string>();
 const sourceIds=new Set(snapshot.languages.flatMap(group=>group.records.map(row=>row.id)));
 for(const rule of policy.rules){
  const excluded=snapshot.languages.flatMap(group=>group.records.filter(row=>row.id===rule.excludedId));
  const retained=snapshot.languages.flatMap(group=>group.records.filter(row=>row.id===rule.retainedId));
  if(rule.excludedId===rule.retainedId||excludedIds.has(rule.excludedId)||!excluded.length||!retained.length)throw new Error('Invalid food duplicate identity');
  if(excluded.some(row=>row.imageUrl!==null)||retained.some(row=>row.imageUrl===null))throw new Error('Food duplicate photo evidence changed');
  if(foodIdentityFingerprint(snapshot,rule.excludedId)!==rule.excludedFingerprint||foodIdentityFingerprint(snapshot,rule.retainedId)!==rule.retainedFingerprint)throw new Error('Food duplicate source changed; review required');
  excludedIds.add(rule.excludedId);retainedIds.add(rule.retainedId);
 }
 if([...retainedIds].some(id=>excludedIds.has(id)))throw new Error('Food duplicate chains are not allowed');
 return {excludedIds,retainedIds,sourceTotal:sourceIds.size,publishedTotal:sourceIds.size-excludedIds.size};
}
export function loadFoodVisibility(snapshot:GuideSnapshot){const raw:unknown=JSON.parse(readFileSync(new URL('../../../../config/catalog/food-visibility.json',import.meta.url),'utf8'));return createFoodVisibility(snapshot,raw);}
