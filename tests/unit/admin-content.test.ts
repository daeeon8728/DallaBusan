import {expect,it} from 'vitest';
import {EMPTY_ADMIN_DOCUMENT,AdminOfferSchema,CoursesResponseSchema} from '@trip-fit/domain';
import {createManagedContent} from '../../apps/server/src/admin/content.js';
import {OfferCatalogConfigSchema} from '../../apps/server/src/config/offers.js';
import {DestinationConfigSchema} from '../../apps/server/src/config/destinations.js';
import {createOfferService} from '../../apps/server/src/services/offers.js';
import {createDestinationService} from '../../apps/server/src/services/destinations.js';
import {ORIGINAL_TEXT} from '../../apps/server/src/config/localization.js';
import type {CourseService} from '../../apps/server/src/services/courses.js';
import type {GuideService} from '../../apps/server/src/services/guides.js';
const make=()=>{
 const offers=OfferCatalogConfigSchema.parse({checkedOn:'2026-11-26',contactEmail:'owner@example.test',providers:[{id:'PROVIDER_TEST',displayName:'Test registry',enabled:true,approvalStatus:'approved',websiteApproval:'approved',allowedHosts:['booking.example.test'],sourceHosts:['booking.example.test'],pathPrefixes:['/product'],requiredQuery:{partner:'issued-test-only'},destinationQuery:null,destinationHosts:[]}],offers:[],directories:[]});
 const destinations=DestinationConfigSchema.parse({month:'2026-11',featuredSlugs:[],destinations:[]}),baseOffers=createOfferService(offers),baseDestinations=createDestinationService(destinations,baseOffers);
 const courses:CourseService={get:()=>null,offers:()=>null,list:locale=>CoursesResponseSchema.parse({locale,items:[],total:0,counts:{family:0,date:0,friends:0,food:0,dallabusan:0}})},guides:GuideService={get:()=>null,list:()=>null,available:()=>false};
 return createManagedContent({baseOffers,baseDestinations,offers,destinations,baseCourses:courses,guides,guideFactory:()=>guides,courseFactory:()=>courses,imageHosts:['photos.example.test'],localization:ORIGINAL_TEXT,anchors:new Map()});
};
const product=()=>AdminOfferSchema.parse({id:'managed-00000000-0000-0000-0000-000000000001',baseHash:null,hidden:false,providerId:'PROVIDER_TEST',externalId:'new-1',sourceTitle:'Official test product',sourceLocale:'en',titles:{ko:'검증용 상품',en:'Official test product',ja:'テスト商品','zh-CN':'测试商品','zh-TW':'測試商品'},category:'ticket',scope:'busan',href:'https://booking.example.test/product/new-1?partner=issued-test-only',sourceUrl:'https://booking.example.test/product/new-1',price:null,image:{url:'https://photos.example.test/new-1.jpg',credit:'Official test-only image'},observedOn:'2026-11-26',evidenceNote:'Test fixture only; never published in the real catalog.',rightsConfirmed:true,linkConfirmed:true,relations:[]});
it('adds a neutral-registry product without application provider branches or invented zero pricing',()=>{const manager=make(),doc=structuredClone(EMPTY_ADMIN_DOCUMENT);doc.offers.push(product());expect(manager.validate(doc)).toEqual({courses:0,offers:1});});
it('rejects bad attribution, source hosts, duplicate identity, rights and missing review confirmations',()=>{
 for(const change of [{href:'https://booking.example.test/product/new-1?partner=wrong'},{sourceUrl:'https://wrong.example.test/product/new-1'},{rightsConfirmed:false},{linkConfirmed:false},{evidenceNote:''},{image:{url:'https://wrong.example.test/photo.jpg',credit:'Unknown'}}]){const doc=structuredClone(EMPTY_ADMIN_DOCUMENT);doc.offers.push({...product(),...change});expect(()=>make().validate(doc)).toThrow();}
 const doc=structuredClone(EMPTY_ADMIN_DOCUMENT);doc.offers.push(product(),{...product(),id:'managed-00000000-0000-0000-0000-000000000002'});expect(()=>make().validate(doc)).toThrow('이미 있습니다');
});
