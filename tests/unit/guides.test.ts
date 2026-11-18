import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { GuideQuerySchema, GuideSnapshotSchema, SUPPORTED_LOCALES, type GuideKind, type Locale } from '@trip-fit/domain';
import { loadGuideApiConfig } from '../../apps/server/src/config/env.js';
import { guideEndpoint, GUIDE_SOURCES } from '../../apps/server/src/config/guides.js';
import { createGuideClient } from '../../apps/server/src/providers/guides/client.js';
import { GuideApiError, parseGuidePage } from '../../apps/server/src/providers/guides/parse.js';
import { collectGuides, publishGuideSnapshot } from '../../apps/server/src/services/refresh-guides.js';
const row = { UC_SEQ: 42, MAIN_TITLE: 'Test restaurant', TITLE: 'Localized test restaurant', LAT:35.17,LNG:129.05, GUGUN_NM:'Test area', RPRSNTV_MENU:'Test dish', USAGE_DAY_WEEK_AND_TIME:'10:00–20:00', MAIN_IMG_NORMAL:'https://www.visitbusan.net/uploadImgs/files/cntnts/test.jpg', ITEMCNTNTS:'<p>Test story</p><script>alert(1)</script>' };
function envelope(kind: GuideKind,locale:Locale,item:unknown=[row],totalCount=1,pageNo=1) {
  return {[guideEndpoint(kind,locale)]:{header:{code:'00'},pageNo,numOfRows:100,totalCount,item}};
}
const config=loadGuideApiConfig('food',{FOOD_SERVICE_KEY:'TEST+/='});
const response=(body:unknown)=>new Response(JSON.stringify(body),{headers:{'Content-Type':'text/plain'}});
describe('official public guide data safety',()=>{
  for(const kind of ['food','recommended'] as const) for(const locale of SUPPORTED_LOCALES) it(kind+' routes '+locale+' without exposing secrets',async()=>{
    const mock=vi.fn<typeof fetch>().mockResolvedValue(response(envelope(kind,locale)));
    const page=await createGuideClient(config,mock).getPage(kind,locale,1);
    const requested=new URL(String(mock.mock.calls[0]?.[0]));
    expect(requested.origin+requested.pathname).toBe(GUIDE_SOURCES[kind].baseUrl+guideEndpoint(kind,locale));
    expect(requested.searchParams.get('ServiceKey')).toBe('TEST+/=');expect(requested.searchParams.get('resultType')).toBe('json');
    expect(mock.mock.calls[0]?.[1]?.redirect).toBe('error');expect(page.records[0]?.menu).toBe('Test dish');expect(page.records[0]?.description).toBe('Test story');
    expect(JSON.stringify(page)).not.toContain('TEST+/=');
  });
  it('separates food/recommended credentials and keeps unset configuration honest',()=>{
    const env={FOOD_SERVICE_KEY:'FOOD_ONLY',RECOMMENDED_SERVICE_KEY:'RECOMMENDED_ONLY'};
    expect(loadGuideApiConfig('food',env).serviceKey).toBe('FOOD_ONLY');expect(loadGuideApiConfig('recommended',env).serviceKey).toBe('RECOMMENDED_ONLY');
    expect(loadGuideApiConfig('recommended',{FOOD_SERVICE_KEY:'FOOD_ONLY'}).serviceKey).toBeNull();
  });
  it('supports single, empty and numeric string envelopes while rejecting incomplete rows',()=>{
    expect(parseGuidePage(envelope('food','ko',row),'food','ko').receivedCount).toBe(1);
    expect(parseGuidePage(envelope('food','ko','',0),'food','ko').records).toEqual([]);
    expect(parseGuidePage(envelope('food','ko',[{...row,UC_SEQ:'42'},{}],2),'food','ko').rejectedCount).toBe(1);
  });
  it('keeps absent hours/menu null and never substitutes a zero price or invented image',()=>{
    const result=parseGuidePage(envelope('food','ko',[{...row,USAGE_DAY_WEEK_AND_TIME:'',RPRSNTV_MENU:'',LAT:'',LNG:0,MAIN_IMG_NORMAL:'https://untrusted.invalid/image.jpg',HOMEPAGE_URL:'javascript:alert(1)'}]),'food','ko').records[0];
    expect(result).toMatchObject({hours:null,menu:null,fees:null,imageUrl:null,homepage:null,coordinates:null});
  });
  it('refuses another locale envelope and API error bodies',()=>{
    expect(()=>parseGuidePage(envelope('food','en'),'food','ko')).toThrow(GuideApiError);
    expect(()=>parseGuidePage({getFoodKr:{header:{code:'30'},pageNo:1,numOfRows:100,totalCount:0}},'food','ko')).toThrow('authentication');
  });
  for(const [status,code] of [[401,'authentication'],[429,'rate-limited'],[500,'http']] as const) it('sanitizes HTTP '+status+' and does not loop retries',async()=>{
    const mock=vi.fn<typeof fetch>().mockResolvedValue(new Response('private upstream text',{status}));
    await expect(createGuideClient(config,mock).getPage('food','ko',1)).rejects.toThrow('Public guide service: '+code);expect(mock).toHaveBeenCalledTimes(1);
  });
  it('sanitizes XML authentication and native fetch exceptions',async()=>{
    await expect(createGuideClient(config,vi.fn<typeof fetch>().mockResolvedValue(new Response('<returnReasonCode>30</returnReasonCode>'))).getPage('food','ko',1)).rejects.toThrow('authentication');
    await expect(createGuideClient(config,vi.fn<typeof fetch>().mockRejectedValue(Error('request URL with SECRET'))).getPage('food','ko',1)).rejects.toThrow(/^Public guide service: network$/);
  });
  it('enforces byte limits for streamed bodies without content-length',async()=>{
    await expect(createGuideClient({...config,maxResponseBytes:10},vi.fn<typeof fetch>().mockResolvedValue(response(envelope('food','ko')))).getPage('food','ko',1)).rejects.toThrow('too-large');
  });
  it('honors cancellation and rejects wrong pages',async()=>{
    const mock=vi.fn<typeof fetch>().mockResolvedValue(response(envelope('food','ko',[],0,2)));
    await expect(createGuideClient(config,mock).getPage('food','ko',1)).rejects.toThrow('invalid-response');
    const controller=new AbortController();controller.abort();await expect(createGuideClient(config,mock).getPage('food','ko',1,controller.signal)).rejects.toThrow('aborted');
  });
  it('requires all five complete locales; failure preserves the previously published file',async()=>{
    const folder=await mkdtemp(join(tmpdir(),'trip-fit-guides-'));const file=pathToFileURL(join(folder,'food.json'));
    try {
      await writeFile(file,'LAST_SUCCESS');
      const mock=vi.fn<typeof fetch>().mockResolvedValue(response(envelope('food','ko',[row],2)));
      await expect(collectGuides('food',config,mock).then(snapshot=>publishGuideSnapshot(snapshot,file))).rejects.toThrow('incomplete');
      expect(await readFile(file,'utf8')).toBe('LAST_SUCCESS');
    } finally {await rm(folder,{recursive:true,force:true});}
  });
  it('publishes a complete validated snapshot atomically and rejects duplicate languages',async()=>{
    const mock=vi.fn<typeof fetch>().mockImplementation(async input=>{
      const url=new URL(String(input));const locale=SUPPORTED_LOCALES.find(locale=>url.pathname.endsWith(guideEndpoint('food',locale)));
      if(!locale)throw Error('Unknown fixture locale');return response(envelope('food',locale));
    });
    const snapshot=await collectGuides('food',config,mock);expect(snapshot.languages).toHaveLength(5);
    const folder=await mkdtemp(join(tmpdir(),'trip-fit-guides-'));const file=pathToFileURL(join(folder,'food.json'));
    try {await publishGuideSnapshot(snapshot,file);expect(GuideSnapshotSchema.parse(JSON.parse(await readFile(file,'utf8'))).kind).toBe('food');}
    finally{await rm(folder,{recursive:true,force:true});}
    expect(GuideSnapshotSchema.safeParse({...snapshot,languages:Array(5).fill(snapshot.languages[0])}).success).toBe(false);
  });
  it('rejects matching IDs that refer to different places across languages',async()=>{
    const mock=vi.fn<typeof fetch>().mockImplementation(async input=>{
      const locale=SUPPORTED_LOCALES.find(locale=>new URL(String(input)).pathname.endsWith(guideEndpoint('food',locale)));
      if(!locale)throw Error('Unknown fixture locale');return response(envelope('food',locale,[{...row,MAIN_TITLE:locale==='en'?'Different restaurant':row.MAIN_TITLE}]));
    });
    await expect(collectGuides('food',config,mock)).rejects.toThrow('Conflicting source identity');
  });
  it('rejects caller supplied endpoints, invalid locales and pagination',()=>{
    for(const input of [{locale:'fr'},{page:0},{page:1001},{q:'x'.repeat(101)},{url:'https://invalid.test'},{district:'x'.repeat(101)}])expect(GuideQuerySchema.safeParse(input).success).toBe(false);
  });
});
