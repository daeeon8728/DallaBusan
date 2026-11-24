import {describe,it,expect} from 'vitest';import Fastify from 'fastify';
import {loadStayMapConfig,createStayMapConfig} from '../../apps/server/src/config/stay-map.js';import {loadOfferCatalogConfig} from '../../apps/server/src/config/offers.js';import {registerStayMapRoutes} from '../../apps/server/src/routes/stay-map.js';
describe('explicit accommodation map',()=>{
 it('encodes supplied settings, switches five locales/currencies and advances dates using the server date',()=>{
  const config=loadStayMapConfig(),catalog=loadOfferCatalogConfig();let today='2026-11-24';const map=createStayMapConfig(config,catalog,()=>today);
  for(const locale of ['en','ko','ja','zh-CN','zh-TW'] as const){const result=map.get(locale,true);if(!result)throw Error('No map');const url=new URL(result.url);expect(url.hostname).toBe(config.allowedHosts[0]);expect(url.searchParams.get('refKey')).toBe(config.settings.refKey);expect(url.searchParams.get('cid')).toBe(String(config.settings.cid));expect(url.searchParams.get('language')).toBe(config.locales[locale].language);expect(url.searchParams.get('currency')).toBe(config.locales[locale].currency);expect(url.searchParams.get('isMobile')).toBe('true');expect(result).toMatchObject({checkIn:'2026-11-25',checkOut:'2026-12-01',adults:2,rooms:1});}
  today='2026-12-31';expect(map.get('en',false)).toMatchObject({checkIn:'2027-01-01',checkOut:'2027-01-07'});
 });
 it('rejects unsafe destinations and blocks disabled or unapproved providers',()=>{
  const config=loadStayMapConfig(),catalog=loadOfferCatalogConfig();expect(createStayMapConfig({...config,enabled:false},catalog).get('en',false)).toBeNull();const provider=catalog.providers.find(p=>p.id===config.providerId);if(!provider)throw Error('No provider');provider.approvalStatus='pending';expect(createStayMapConfig(config,catalog).get('en',false)).toBeNull();expect(()=>createStayMapConfig({...config,baseUrl:'https://untrusted.example.test/Map/index'},catalog)).toThrow();
 });
 it('has a no-store read-only endpoint and never accepts a client URL, tracking ID or dates',async()=>{
  const app=Fastify();registerStayMapRoutes(app,createStayMapConfig(loadStayMapConfig(),loadOfferCatalogConfig(),()=> '2026-11-24'));
  try{const r=await app.inject('/api/stay-map?locale=zh-TW&mobile=1');expect(r.statusCode).toBe(200);expect(r.headers['cache-control']).toBe('no-store');expect(r.json().currency).toBe('TWD');for(const suffix of ['locale=bad','mobile=2','url=https://untrusted.example.test','cid=1','checkIn=2000-01-01'])expect((await app.inject('/api/stay-map?'+suffix)).statusCode).toBe(400);}finally{await app.close();}
 });
});
