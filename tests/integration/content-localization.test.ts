import { describe,it,expect } from 'vitest';
import { createTextLocalizer,localizationKey,cleanLocalizedName,loadTextLocalizer } from '../../apps/server/src/config/localization.js';
import { auditLocalization } from '../../scripts/check-localization.js';
import { loadGuideSnapshot } from '../../apps/server/src/config/guides.js';
import { createGuideService } from '../../apps/server/src/services/guides.js';
import { loadDestinationConfig } from '../../apps/server/src/config/destinations.js';
import { createDestinationService } from '../../apps/server/src/services/destinations.js';
import { loadOfferCatalogConfig } from '../../apps/server/src/config/offers.js';
import { createOfferService } from '../../apps/server/src/services/offers.js';
import { GuideQuerySchema } from '@trip-fit/domain';
function fixture(sourceText='원문',translatedText='Original') {return {version:1,authoredOn:'2026-11-19',engine:'google-translate-web-offline',reviewStatus:'machine-unreviewed',sourceUrl:'https://translate.google.com/',units:[{key:localizationKey(sourceText,'ko','en'),sourceLocale:'ko',targetLocale:'en',sourceText,translatedText}]};}
describe('source pinned content localization',()=>{
 it('uses exact source evidence and rejects stale source strings',()=>{const text=createTextLocalizer(fixture());expect(text.text('원문','ko','en')).toEqual({value:'Original',available:true,machine:true});expect(text.text('변경된 원문','ko','en')).toEqual({value:'변경된 원문',available:false,machine:false});});
 it('rejects forged hashes, duplicate entries and untranslated output',()=>{const input=fixture();const unit=input.units[0];if(!unit)throw Error('fixture');expect(()=>createTextLocalizer({...input,units:[{...unit,key:'0'.repeat(64)}]})).toThrow();expect(()=>createTextLocalizer({...input,units:[unit,unit]})).toThrow();expect(()=>createTextLocalizer(fixture('원문','Untranslated 원문'))).toThrow();});
 it('only moves a redundant bilingual name out of the foreign display',()=>{expect(cleanLocalizedName('Mandeuri Gondeurebap (만드리곤드레밥)')).toBe('Mandeuri Gondeurebap');expect(cleanLocalizedName('만드리곤드레밥')).toBe('만드리곤드레밥');expect(cleanLocalizedName('Restaurant (2F)')).toBe('Restaurant (2F)');});
 it('audits every current product, attraction and restaurant in every language',()=>{const audit=auditLocalization();expect(audit.issues).toEqual([]);expect(audit.counts).toHaveLength(5);for(const count of audit.counts)expect(count).toMatchObject({offers:402,destinations:220,food:514});},30000);
 it('translates missing restaurant details without changing the source snapshots',()=>{const raw=loadGuideSnapshot('food');if(!raw)throw Error('snapshot');const before=JSON.stringify(raw);const service=createGuideService({food:raw},loadTextLocalizer());for(const locale of ['en','ja','zh-CN','zh-TW'] as const){const value=service.get('food','1065',locale);expect(value?.item.locale).toBe(locale);expect(value?.item.translationFallback).toBe(false);expect(value?.item.name).not.toMatch(/[가-힣]/);expect(value?.item.contentTranslation).toBe('machine');expect(service.list('food',GuideQuerySchema.parse({locale}))?.total).toBe(538);}expect(JSON.stringify(raw)).toBe(before);});
 it('finds a missing-language attraction by its newly translated name',()=>{const service=createDestinationService(loadDestinationConfig(),createOfferService(loadOfferCatalogConfig()),undefined,loadTextLocalizer());const detail=service.get('busan-2753','en');if(!detail)throw Error('place');expect(detail.destination.translationFallback).toBe(false);expect(detail.destination.contentTranslation).toBe('machine');expect(service.list('en',{q:detail.destination.name}).items.some(item=>item.slug==='busan-2753')).toBe(true);});
 it('does not treat translator text as markup or invent absent source information',()=>{const text=createTextLocalizer(fixture('원문','<script>not executed</script>'));expect(text.text('원문','ko','en').value).toBe('<script>not executed</script>');expect(text.text('11:00~18:00','ko','en').value).toBe('11:00~18:00');});
});
