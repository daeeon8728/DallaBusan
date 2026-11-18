import { describe,it,expect } from 'vitest';
import { mkdtemp,readFile,writeFile,readdir,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeThemeFixture,themeTestStamp } from '../fixtures/theme-routes.js';
import { buildThemeRouteCatalog } from '../../apps/server/src/services/theme-route-catalog.js';
import { publishThemeRouteCatalog,readThemeRouteCatalog,validateThemeRouteCatalog } from '../../apps/server/src/repositories/theme-routes.js';
import { loadThemeRouteInputs,loadThemeCuration,themeCatalogPath } from '../../apps/server/src/config/theme-routes.js';

describe('theme route snapshot integrity',()=>{
  it('round-trips validated output and leaves the prior snapshot intact on rejected publication',async()=>{
    const dir=await mkdtemp(join(tmpdir(),'trip-fit-theme-'));const file=pathToFileURL(join(dir,'routes.json'));const f=makeThemeFixture();const result=buildThemeRouteCatalog(f.inputs,f.templates,f.mappings,themeTestStamp);
    try{await publishThemeRouteCatalog(result,file,f.inputs,f.templates,f.mappings);expect(await readThemeRouteCatalog(file,f.inputs,f.templates,f.mappings)).toEqual(result);const before=await readFile(file,'utf8');
      const tampered=structuredClone(result);tampered.summary.sourceCheckedTemplates=99;
      await expect(publishThemeRouteCatalog(tampered,file,f.inputs,f.templates,f.mappings)).rejects.toThrow('dependencies or output changed');expect(await readFile(file,'utf8')).toBe(before);expect(await readdir(dir)).toEqual(['routes.json']);
      await expect(publishThemeRouteCatalog(result,pathToFileURL(join(dir,'missing','routes.json')),f.inputs,f.templates,f.mappings)).rejects.toThrow('publication failed');expect(await readFile(file,'utf8')).toBe(before);
    }finally{await rm(dir,{recursive:true,force:true});}
  });
  it('rejects stored output if a dependency or curation has changed',()=>{
    const f=makeThemeFixture();const result=buildThemeRouteCatalog(f.inputs,f.templates,f.mappings,themeTestStamp);const source=f.inputs.recommended.languages[0]?.records[0];if(!source)throw Error('Missing fixture');source.description+=' changed';
    expect(()=>validateThemeRouteCatalog(result,f.inputs,f.templates,f.mappings)).toThrow('dependencies or output changed');const rebuilt=buildThemeRouteCatalog(f.inputs,f.templates,f.mappings,themeTestStamp);expect(rebuilt.routes.every(route=>route.status==='needs-review'&&route.steps.every(step=>step.place===null))).toBe(true);
  });
  it('rejects modified visit order, checked segments and derived food distance',()=>{
    const f=makeThemeFixture();const result=buildThemeRouteCatalog(f.inputs,f.templates,f.mappings,themeTestStamp);
    for(const field of ['steps','segments','food'] as const){const altered=structuredClone(result);const route=altered.routes[0];if(!route)throw Error('Missing fixture');if(field==='steps')route.steps.reverse();else if(field==='segments')route.sourceCheckedSegments=[];else{const option=route.foodOptions[0];if(!option)throw Error('Missing food');option.straightLineMeters=1;}expect(()=>validateThemeRouteCatalog(altered,f.inputs,f.templates,f.mappings)).toThrow();}
  });
  it('rejects corrupt stored JSON without exposing its contents',async()=>{
    const dir=await mkdtemp(join(tmpdir(),'trip-fit-theme-'));const file=pathToFileURL(join(dir,'routes.json'));const f=makeThemeFixture();try{await writeFile(file,'private garbage');await expect(readThemeRouteCatalog(file,f.inputs,f.templates,f.mappings)).rejects.toThrow('snapshot is invalid or requires rebuilding');}finally{await rm(dir,{recursive:true,force:true});}
  });
  it('rebuilds every real template, preserves all source coverage and keeps human approval pending',async()=>{
    const inputs=loadThemeRouteInputs();const {templates,mappings}=loadThemeCuration();const catalog=await readThemeRouteCatalog(themeCatalogPath(),inputs,templates,mappings);
    expect(catalog.summary.sourceGroups).toBe(402);expect(catalog.summary.templates).toBe(17);expect(catalog.coverage).toHaveLength(402);expect(catalog.summary.sourceCheckedTemplates).toBe(1);expect(catalog.summary.sourceCheckedSegments).toBe(8);
    expect(catalog.routes.every(route=>!route.recommendationEnabled&&route.humanApproval==='pending'&&route.fieldValidation==='not-performed')).toBe(true);
    for(const route of catalog.routes)for(const food of route.foodOptions){expect(food.insertedIntoVisitOrder).toBe(false);if(food.status==='source-checked'&&food.relationship==='nearby-coordinate-option'){expect(food.straightLineMeters).not.toBeNull();expect(food.straightLineMeters).toBeLessThanOrEqual(1000);}}
    expect(catalog.routes.find(route=>route.id==='bpop-local-west')?.steps.find(step=>step.label.includes('흰여울'))?.findings).toContain('alias-evidence-invalid');
  });
});
