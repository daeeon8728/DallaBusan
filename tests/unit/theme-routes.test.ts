import { describe,expect,it } from 'vitest';
import { GuideRecordSchema } from '@trip-fit/domain';
import { buildThemeRouteCatalog,themeRecordFingerprint,buildThemePlaceIndex,themeStraightLineMeters } from '../../apps/server/src/services/theme-route-catalog.js';
import { RouteAttractionSourcesSchema } from '../../apps/server/src/config/theme-routes.js';
import { makeThemeFixture,themeTestStamp } from '../fixtures/theme-routes.js';
const build=(fixture:ReturnType<typeof makeThemeFixture>)=>buildThemeRouteCatalog(fixture.inputs,fixture.templates,fixture.mappings,themeTestStamp);
describe('source-grounded thematic routes',()=>{
  it('keeps service IDs distinct and verifies a declared order without making a live itinerary',()=>{
    const fixture=makeThemeFixture();expect(fixture.places.get('attraction:11:ko')?.name).toBe('첫 장소');expect(fixture.places.get('food:11:ko')?.name).toBe('검증 식당');
    const result=build(fixture);expect(result.routes[0]).toMatchObject({status:'source-checked',orderStatus:'source-confirmed',humanApproval:'pending',fieldValidation:'not-performed',recommendationEnabled:false});expect(result.routes[0]?.sourceCheckedSegments[0]).toMatchObject({startIndex:0,endIndex:1,placeKeys:['attraction:11','attraction:12'],isCompleteRoute:true});
    expect(result.routes[0]?.foodOptions[0]).toMatchObject({relationship:'nearby-coordinate-option',status:'source-checked',insertedIntoVisitOrder:false});expect(result.routes[0]?.foodOptions[0]?.straightLineMeters).toBeGreaterThan(0);expect(result.routes[0]?.steps).toHaveLength(2);
  });
  it('does not treat reversed/omitted/duplicated visit steps as the declared order',()=>{
    for(const change of ['reverse','omit','duplicate']){const f=makeThemeFixture();const seed=f.templates.templates[0];if(!seed)throw Error('Missing fixture');
      if(change==='reverse')seed.steps.reverse();else if(change==='omit')seed.steps.pop();else seed.steps.push({...seed.steps[0],label:'첫 장소',mappingId:'attraction-11',matchKind:'exact-name',identityQuote:null,unresolvedReason:null});
      if(change==='omit'){expect(()=>build(f)).toThrow();continue;}
      const r=build(f).routes[0];expect(r?.orderStatus).toBe('needs-review');expect(r?.sourceCheckedSegments).toEqual([]);
    }
  });
  it('does not promote a list or unconfirmed narrative to a visit order',()=>{
    for(const kind of ['presentation-only','narrative-unconfirmed'] as const){const f=makeThemeFixture();const seed=f.templates.templates[0];if(!seed)throw Error();seed.orderEvidence.kind=kind;expect(build(f).routes[0]?.orderStatus).toBe('needs-review');}
  });
  it('rejects a transport transfer path even if it contains arrows and a course heading',()=>{
    const f=makeThemeFixture();const row=f.inputs.recommended.languages[0]?.records[0];const seed=f.templates.templates[0];if(!row||!seed)throw Error();row.description+='\n검증 코스\n출구 → 정류장';seed.expectedFingerprint=themeRecordFingerprint(row);seed.orderEvidence.excerpt='출구 → 정류장';seed.steps[0]!.label='출구';seed.steps[1]!.label='정류장';expect(build(f).routes[0]?.findings).toContain('order-evidence-invalid');
  });
  it('suspends changed/missing source evidence and never serves the previously approved place data',()=>{
    const f=makeThemeFixture();const row=f.inputs.recommended.languages[0]?.records[0];if(!row)throw Error();row.description+=' 원문 변경';let r=build(f).routes[0];expect(r?.findings).toContain('theme-source-changed');expect(r?.steps.every(step=>step.place===null)).toBe(true);expect(r?.foodOptions.every(option=>option.place===null)).toBe(true);
    f.inputs.recommended.languages[0]!.records=[];f.inputs.recommended.languages[0]!.total=0;r=build(f).routes[0];expect(r?.findings).toContain('missing-theme-source');
  });
  it('suspends a changed/deleted target and does not bridge across an unresolved node',()=>{
    const f=makeThemeFixture();const target=f.inputs.attractions.records[1];if(!target)throw Error();target.record.coordinates={lat:35.2,lng:129.2};let r=build(f).routes[0];expect(r?.steps[1]?.findings).toContain('place-source-changed');expect(r?.steps[1]?.place).toBeNull();expect(r?.sourceCheckedSegments).toEqual([]);
    f.inputs.attractions.records.splice(1,1);r=build(f).routes[0];expect(r?.steps[1]?.findings).toContain('missing-place-source');
  });
  it('keeps only contiguous resolved sections and labels a partial source segment correctly',()=>{
    const f=makeThemeFixture();const source=f.inputs.recommended.languages[0]?.records[0];const seed=f.templates.templates[0];if(!source||!seed)throw Error();source.description='검증 코스\n첫 장소 → 둘째 장소 → 미연결 장소';seed.expectedFingerprint=themeRecordFingerprint(source);seed.orderEvidence.excerpt='첫 장소 → 둘째 장소 → 미연결 장소';seed.steps.push({label:'미연결 장소',mappingId:null,matchKind:'unresolved',identityQuote:null,unresolvedReason:'확인되지 않았다.'});
    const result=build(f).routes[0];expect(result?.status).toBe('needs-review');expect(result?.sourceCheckedSegments).toEqual([{startIndex:0,endIndex:1,placeKeys:['attraction:11','attraction:12'],isCompleteRoute:false}]);
  });
  it('does not use a grouped place representative point as a verified specific stop',()=>{
    const f=makeThemeFixture();const seed=f.templates.templates[0];if(!seed?.steps[0])throw Error();seed.steps[0].matchKind='contained-place';expect(build(f).routes[0]?.steps[0]?.findings).toContain('grouped-place-needs-specific-coordinate');
  });
  it('rejects alias co-occurrence without an explicit reviewed per-place alias',()=>{
    const f=makeThemeFixture();const seed=f.templates.templates[0];if(!seed?.steps[0])throw Error();seed.steps[0].mappingId='attraction-12';seed.steps[0].matchKind='source-alias';seed.steps[0].identityQuote='첫 장소 → 둘째 장소';expect(build(f).routes[0]?.steps[0]?.findings).toContain('alias-evidence-invalid');
  });
  it('separates source-mentioned food from coordinate-nearby food and never inserts it',()=>{
    const f=makeThemeFixture();const seed=f.templates.templates[0];const food=seed?.foodOptions[0];if(!food)throw Error();food.relationship='source-mentioned';food.anchorIndex=null;food.evidenceQuote='검증 식당은 검증용 식사 후보입니다.';const result=build(f).routes[0]?.foodOptions[0];expect(result).toMatchObject({status:'source-checked',insertedIntoVisitOrder:false,straightLineMeters:null});food.evidenceQuote='없는 인용';expect(build(f).routes[0]?.foodOptions[0]?.status).toBe('needs-review');
  });
  it('refuses an out-of-radius food option or a non-food service masquerading as a meal',()=>{
    const f=makeThemeFixture();const group=f.inputs.food.languages[0];const mapping=f.mappings.mappings.find(m=>m.id==='food-11');if(!group?.records[0]||!mapping)throw Error();group.records[0].coordinates={lat:35.4,lng:129.3};mapping.expectedFingerprint=buildThemePlaceIndex(f.inputs).get('food:11:ko')!.fingerprint;
    expect(build(f).routes[0]?.foodOptions[0]?.findings).toContain('nearby-option-outside-radius');f.templates.templates[0]!.foodOptions[0]!.mappingId='attraction-11';expect(build(f).routes[0]?.foodOptions[0]?.findings).toContain('food-kind-mismatch');
  });
  it('does not merge equal titles with different IDs and accounts for foreign-only themes',()=>{
    const f=makeThemeFixture();const en=f.inputs.recommended.languages.find(x=>x.locale==='en');if(!en)throw Error();en.records.push(GuideRecordSchema.parse({...f.source,id:'902',locale:'en'}));en.total=1;
    const result=build(f);expect(result.coverage).toHaveLength(2);expect(result.coverage.find(row=>row.sourceId==='902')).toMatchObject({status:'not-curated',templateIds:[],sourceLocale:'en'});
  });
  it('retains review when only collection timestamps change but dependency snapshots must be rebuilt',()=>{
    const f=makeThemeFixture();const previous=build(f);f.inputs.recommended.source.collectedAt='2026-11-15T12:00:00.000Z';for(const item of f.inputs.attractions.records)item.fetchedAt='2026-11-15T12:00:00.000Z';const next=build(f);expect(next.routes[0]?.status).toBe('source-checked');expect(next.inputDigests).not.toEqual(previous.inputDigests);
  });
  it('rejects duplicate configuration IDs, unknown references and ambiguous source languages',()=>{
    const f=makeThemeFixture();f.templates.templates.push({...f.templates.templates[0]!});expect(()=>build(f)).toThrow('Duplicate');f.templates.templates.pop();f.templates.templates[0]!.steps[0]!.mappingId='unknown';expect(()=>build(f)).toThrow('Unknown');
    const original=f.inputs.attractions.records[0];if(!original)throw Error();expect(RouteAttractionSourcesSchema.safeParse({...f.inputs.attractions,records:[...f.inputs.attractions.records,{...original,locale:'en',record:{...original.record,originalTitle:'Different physical place'}}]}).success).toBe(false);
  });
  it('validates only the explicitly directed two-stop narrative and rejects its reverse',()=>{
    const f=makeThemeFixture();const source=f.inputs.recommended.languages[0]?.records[0];const seed=f.templates.templates[0];if(!source||!seed)throw Error();source.description='첫 장소에서 걸으면 둘째 장소에 다다르게 된다.';seed.expectedFingerprint=themeRecordFingerprint(source);seed.orderEvidence={kind:'narrative-edge',context:source.description,excerpt:source.description,delimiter:'none'};expect(build(f).routes[0]?.orderStatus).toBe('source-confirmed');seed.steps.reverse();expect(build(f).routes[0]?.orderStatus).toBe('needs-review');
  });
  it('computes coordinate distance without manufacturing walking time',()=>{expect(themeStraightLineMeters({lat:35,lng:129},{lat:35,lng:129})).toBe(0);expect(themeStraightLineMeters({lat:35,lng:129},{lat:35.001,lng:129})).toBeGreaterThan(100);});
});
