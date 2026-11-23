import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { GuideQuerySchema, SUPPORTED_LOCALES } from '@trip-fit/domain';
import { loadGuideSnapshot } from '../../apps/server/src/config/guides.js';
import { loadFoodVisibility } from '../../apps/server/src/config/food-visibility.js';
import { createFoodPhotoOverrides, FoodPhotoOverridesSchema, loadFoodPhotoOverrides } from '../../apps/server/src/config/food-photos.js';
import { loadTextLocalizer } from '../../apps/server/src/config/localization.js';
import { createGuideService } from '../../apps/server/src/services/guides.js';
import { buildApp } from '../../apps/server/src/app.js';
const raw = loadGuideSnapshot('food'); if (!raw) throw new Error('Missing food snapshot');
const snapshot = raw, visibility = loadFoodVisibility(snapshot);
const policy = FoodPhotoOverridesSchema.parse(JSON.parse(readFileSync(new URL('../../config/catalog/food-photo-overrides.json', import.meta.url),'utf8')));
const photos = loadFoodPhotoOverrides(snapshot,visibility);
const service = createGuideService({food:snapshot,recommended:loadGuideSnapshot('recommended')},loadTextLocalizer(),visibility,photos);
describe('source-pinned, reviewed restaurant photos',()=>{
  it('adds four missing photos and repairs one broken source across all five languages without modifying originals or exclusions',()=>{
    const original=JSON.stringify(snapshot); expect(photos.size).toBe(5);
    for (const locale of SUPPORTED_LOCALES) {
      const first=service.list('food',GuideQuerySchema.parse({locale})); if (!first) throw new Error('Missing list');
      const rows=Array.from({length:first.pages},(_,i)=>service.list('food',GuideQuerySchema.parse({locale,page:i+1}))?.items??[]).flat();
      expect(rows).toHaveLength(514); expect(rows.filter(row=>row.imageUrl===null)).toHaveLength(19);
      for (const rule of policy.rules) {
        expect(rows.find(row=>row.id===rule.targetId)?.imageUrl).toBe(rule.imageUrl);
        expect(service.get('food',rule.targetId,locale)?.item.imageUrl).toBe(rule.imageUrl);
      }
      for (const id of visibility.excludedIds) expect(service.get('food',id,locale)).toBeNull();
      expect(service.get('food','1591',locale)?.item.imageUrl).toBeNull(); // Other restaurant with the same name.
      expect(service.get('food','1506',locale)?.item.imageUrl).not.toBe(photos.get('1639')); // Different branch.
    }
    expect(JSON.stringify(snapshot)).toBe(original); expect(loadFoodVisibility(snapshot).excludedIds.size).toBe(24);
  });
  it('never applies food photo identities to recommended travel',()=>{
    const recommended=loadGuideSnapshot('recommended');if(!recommended)throw new Error('Missing source');
    const plain=createGuideService({recommended},loadTextLocalizer());
    for(const locale of SUPPORTED_LOCALES)for(const id of photos.keys())expect(service.get('recommended',id,locale)).toEqual(plain.get('recommended',id,locale));
  });
  it.each(['target','source'] as const)('requires re-review after a %s record changes',side=>{
    const changed=structuredClone(snapshot),rule=policy.rules[0];if(!rule)throw new Error('Missing rule');
    const row=changed.languages[0]?.records.find(row=>row.id===(side==='target'?rule.targetId:rule.sourceId));if(!row)throw new Error('Missing row');
    row.address='Different branch';expect(()=>createFoodPhotoOverrides(changed,visibility,policy)).toThrow('source changed');
  });
  it('rejects excluded IDs, duplicate assignments, wrong images and mismatched source attribution',()=>{
    const rule=policy.rules[0];if(!rule)throw new Error('Missing rule');
    for(const mutation of [{targetId:'1541'},{sourceId:'1541'},{sourceUrl:'https://www.visitbusan.net/index.do?uc_seq=999'},{imageUrl:'https://www.visitbusan.net/unrelated.jpg'}])expect(()=>createFoodPhotoOverrides(snapshot,visibility,{...policy,rules:[{...rule,...mutation}]})).toThrow();
    expect(()=>createFoodPhotoOverrides(snapshot,visibility,{...policy,rules:[rule,rule]})).toThrow('identity');
    expect(()=>createFoodPhotoOverrides(snapshot,visibility,{...policy,licenseUrl:'https://example.test/license'})).toThrow('license changed');
  });
  it('publishes replacement URLs without leaking internal review data',async()=>{
    const app=buildApp({NODE_ENV:'test',HOST:'127.0.0.1',PORT:3001},undefined,undefined,undefined,undefined,service);
    try{for(const locale of SUPPORTED_LOCALES){const response=await app.inject('/api/guides/food/1612?locale='+locale);expect(response.statusCode).toBe(200);expect(response.json().item.imageUrl).toBe(photos.get('1612'));expect(response.body).not.toMatch(/Fingerprint|reviewNote|targetId/);}}finally{await app.close();}
  });
});
