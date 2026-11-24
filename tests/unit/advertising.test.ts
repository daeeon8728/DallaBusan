import {describe,it,expect} from 'vitest';
import {ADVERTISING,type AdvertisingConfig} from '../../apps/web/src/config/advertising.js';
import {mayServeAdvertising} from '../../apps/web/src/advertising/policy.js';
describe('manual advertising release gates',()=>{
 const ready:AdvertisingConfig={...ADVERTISING,enabled:true,approvalStatus:'ready',privacyReviewStatus:'ready'};
 it('keeps current unapproved setup free of advertising requests',()=>{expect(ADVERTISING.enabled).toBe(false);expect(mayServeAdvertising(ADVERTISING)).toBe(false);});
 it('requires both site approval and privacy review independently of enablement',()=>{
  expect(mayServeAdvertising(ready)).toBe(true);
  for(const approvalStatus of ['requires-review','getting-ready'] as const)expect(mayServeAdvertising({...ready,approvalStatus})).toBe(false);
  expect(mayServeAdvertising({...ready,privacyReviewStatus:'pending'})).toBe(false);
  expect(mayServeAdvertising({...ready,enabled:false})).toBe(false);
 });
 it('rejects incomplete or mismatched generated public identifiers and script hosts',()=>{
  for(const change of [{publisherId:'missing'},{detailSlot:''},{detailSlot:'not-a-slot'},{scriptUrl:'https://example.org/ads.js'},{publisherId:'ca-pub-1111111111111111'}])expect(mayServeAdvertising({...ready,...change})).toBe(false);
 });
});
