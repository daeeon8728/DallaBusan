import {describe,it,expect} from 'vitest';
import {loadTravelToolConfig,createTravelToolConfig} from '../../apps/server/src/config/travel-tools.js';
import {loadOfferCatalogConfig} from '../../apps/server/src/config/offers.js';
import {TravelToolFrameSchema,LocaleSchema} from '@trip-fit/domain';
describe('issued flight search',()=>{
 it('publishes five localized UI titles with the exact issued flight identity and English content',()=>{
  const config=loadTravelToolConfig(),tools=createTravelToolConfig(config,loadOfferCatalogConfig());
  const issued=config.tools.find(item=>item.kind==='flights');if(!issued)throw Error('Missing issued flight tool');
  for(const locale of LocaleSchema.options){
   const value=TravelToolFrameSchema.parse(tools.get(issued.id,locale));
   expect(value.kind).toBe('flights');expect(value.contentLocale).toBe('en');expect(value.currency).toBeNull();
   expect(value.url).toBe(issued.variants.en?.url);expect(value.width).toBe(320);
   const metadata=tools.list(locale).items.find(tool=>tool.id===value.id);
   expect(metadata?.title).toBe(issued.titles[locale]);expect(metadata).not.toHaveProperty('url');
  }
 });
 it('fails closed on missing approval, wrong hosts/paths/tracking and accepts config-only provider substitution',()=>{
  const source=loadTravelToolConfig(),catalog=loadOfferCatalogConfig(),issued=source.tools.find(tool=>tool.kind==='flights');
  if(!issued)throw Error('Missing flight tool');
  for(const mutation of ['host','path','tracking','duplicate'] as const){
   const changed=structuredClone(source),item=changed.tools.find(tool=>tool.id===issued.id),variant=item?.variants.en;
   if(!variant)throw Error('Missing variant');const url=new URL(variant.url);
   if(mutation==='host')url.hostname='invalid.example.test';
   if(mutation==='path')url.pathname='/unexpected';
   const key=Object.keys(variant.requiredQuery)[0];if(!key)throw Error('Missing attribution');
   if(mutation==='tracking')url.searchParams.set(key,'invalid');
   if(mutation==='duplicate')url.searchParams.append(key,variant.requiredQuery[key]??'');
   variant.url=url.href;expect(()=>createTravelToolConfig(changed,catalog)).toThrow();
  }
  issued.approvalStatus='pending';expect(createTravelToolConfig(source,catalog).get(issued.id,'en')).toBeNull();
  issued.approvalStatus='approved';const provider=catalog.providers.find(provider=>provider.id===issued.providerId);
  if(!provider)throw Error('Missing provider');const previous=provider.id;provider.id='PROVIDER_FLIGHT_TEST';
  source.tools.forEach(tool=>{if(tool.providerId===previous)tool.providerId=provider.id;});
  expect(createTravelToolConfig(source,catalog).get(issued.id,'en')?.provider.id).toBe('PROVIDER_FLIGHT_TEST');
  provider.enabled=false;expect(createTravelToolConfig(source,catalog).get(issued.id,'en')).toBeNull();
 });
});
