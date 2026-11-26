import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import type {FastifyInstance} from 'fastify';
import {AdminBootstrapSchema,AdminDocumentSchema,AdminStateSchema,CourseDetailSchema,CoursesResponseSchema,BuilderCatalogSchema,DEFAULT_SITE_SETTINGS} from '@trip-fit/domain';
import {createRuntimeApp} from '../../apps/server/src/runtime.js';
import {loadAdminConfig} from '../../apps/server/src/config/admin.js';
import {hashAdminPassword,verifyAdminPassword,digest} from '../../apps/server/src/admin/security.js';
import {createAdminStore} from '../../apps/server/src/admin/store.js';

describe('persistent owner content management',()=>{
 let app:FastifyInstance,directory:string,cookie='',csrf='',boot:ReturnType<typeof AdminBootstrapSchema.parse>,passwordHash='';
 const origin='http://127.0.0.1:4320',password='test-only-password-not-an-owner-credential';
 const config=()=>loadAdminConfig(false,{ADMIN_ENABLED:'true',ADMIN_STORAGE_DIR:directory,ADMIN_PASSWORD_HASH:passwordHash,ADMIN_SESSION_SECRET:'b'.repeat(64),ADMIN_ALLOWED_ORIGINS:origin,ADMIN_IMAGE_HOSTS:'images.example.test'});
 const request=(path:string,body:Record<string,unknown>,method:'POST'|'PUT'='POST')=>app.inject({method,url:'/api/admin/'+path,headers:{cookie,origin,'x-csrf-token':csrf},payload:body});
 beforeAll(async()=>{directory=await mkdtemp(join(tmpdir(),'dallabusan-admin-'));passwordHash=await hashAdminPassword(password);app=await createRuntimeApp({adminConfig:config()});});
 afterAll(async()=>{await app?.close();if(directory)await rm(directory,{recursive:true,force:true});});
 it('hashes passwords with random salts and rejects the wrong password',async()=>{expect(await verifyAdminPassword(password,passwordHash)).toBe(true);expect(await verifyAdminPassword('incorrect',passwordHash)).toBe(false);expect(await verifyAdminPassword(password,'bad')).toBe(false);expect(passwordHash).not.toContain(password);});
 it('requires authentication, exact origin and session cookies',async()=>{
  expect((await app.inject('/api/admin/bootstrap')).statusCode).toBe(401);
  expect((await app.inject({method:'POST',url:'/api/admin/login',headers:{origin:'https://evil.test'},payload:{password}})).statusCode).toBe(403);
  expect((await app.inject({method:'POST',url:'/api/admin/login',headers:{origin},payload:{password:'wrong'}})).statusCode).toBe(401);
  const login=await app.inject({method:'POST',url:'/api/admin/login',headers:{origin},payload:{password}});expect(login.statusCode).toBe(200);
  const header=String(login.headers['set-cookie']);expect(header).toContain('HttpOnly');expect(header).toContain('SameSite=Strict');expect(header).toContain('Path=/api/admin');cookie=header.split(';')[0]??'';
  const result:unknown=login.json();const parsed=await import('zod');csrf=parsed.z.object({csrf:parsed.z.string()}).parse(result).csrf;
  const response=await app.inject({url:'/api/admin/bootstrap',headers:{cookie}});expect(response.statusCode).toBe(200);expect(response.headers['cache-control']).toBe('no-store');boot=AdminBootstrapSchema.parse(response.json());expect(boot.courses).toHaveLength(150);expect(boot.places.length).toBe(734);expect(response.body).not.toContain(passwordHash);expect(response.body).not.toContain('ATTRACTION_SERVICE_KEY');
 },15000);
 it('blocks CSRF and cross-origin writes without modifying the draft',async()=>{
  for(const headers of [{cookie,origin},{cookie,origin:'https://evil.test','x-csrf-token':csrf}])expect((await app.inject({method:'PUT',url:'/api/admin/draft',headers,payload:{revision:0,document:boot.state.document}})).statusCode).toBe(403);
  expect(AdminStateSchema.parse((await app.inject({url:'/api/admin/state',headers:{cookie}})).json()).revision).toBe(0);
 });
 it('saves a draft with revision conflicts and publishes a source-backed new course live',async()=>{
  const base=boot.courses[0];if(!base)throw Error('Missing base course');const document=structuredClone(boot.state.document),id='managed-'+randomUUID();
  document.courses.push({...base,id,baseHash:null,titles:{ko:'관리자 검증 코스',en:'Owner curated course',ja:'管理者テストコース','zh-CN':'管理测试路线','zh-TW':'管理測試路線'},steps:base.steps.slice(0,2)});
  document.settings.titles={ko:'나의 부산',en:'My Busan collection',ja:'私の釜山','zh-CN':'我的釜山','zh-TW':'我的釜山'};document.settings.featuredCourseIds=[id];document.settings.sections.reverse();
  let response=await request('draft',{revision:0,document},'PUT');expect(response.statusCode).toBe(200);let state=AdminStateSchema.parse(response.json());expect(state.revision).toBe(1);
  expect((await request('draft',{revision:0,document},'PUT')).statusCode).toBe(409);
  expect(CoursesResponseSchema.parse((await app.inject('/api/courses?locale=en')).json()).total).toBe(150);
  response=await request('validate',{document});expect(response.statusCode,response.body).toBe(200);
  response=await request('publish',{revision:1});expect(response.statusCode,response.body).toBe(200);state=AdminStateSchema.parse(response.json());expect(state.publishedRevision).toBe(2);expect(state.history).toHaveLength(1);
  const detail=CourseDetailSchema.parse((await app.inject('/api/courses/'+id+'?locale=en')).json());expect(detail.course.title).toBe('Owner curated course');expect(detail.course.route.status).toBe('reference');expect(detail.course.fieldValidation).toBe('not-performed');
  expect(CoursesResponseSchema.parse((await app.inject('/api/courses?locale=en')).json()).total).toBe(151);
  const builder=BuilderCatalogSchema.parse((await app.inject('/api/course-builder?locale=en')).json());expect(builder.modules.some(m=>m.id===id)).toBe(true);
  expect((await app.inject('/api/site-settings')).json()).toEqual(document.settings);boot.state=state;
 });
 it('rejects invalid places, duplicate stops, unapproved pictures and bad affiliate attribution',async()=>{
  const course=boot.courses[0],offer=boot.offers.find(o=>o.providerId!=='PROVIDER_C'&&!o.hidden&&o.image.url.startsWith('https:'));if(!course||!offer)throw Error('Missing baseline');
  const invalid=structuredClone(boot.state.document);invalid.courses.push({...course,steps:[{kind:'food',id:'missing',stayMinutes:60}]});expect((await request('validate',{document:invalid})).statusCode).toBe(400);
  const duplicate=structuredClone(boot.state.document),first=duplicate.courses[0];if(!first?.steps[0])throw Error('Missing stop');first.steps.push(first.steps[0]);expect(AdminDocumentSchema.safeParse(duplicate).success).toBe(false);
  const image=structuredClone(boot.state.document);image.images.push({target:'course',id:course.id,url:'https://unapproved.test/photo.jpg',credit:'Owner',sourceUrl:'https://example.test/evidence',licenseUrl:null,rightsConfirmed:true});expect((await request('validate',{document:image})).statusCode).toBe(400);
  const imageRow=image.images[0];if(!imageRow)throw Error('Missing image');image.images[0]={...imageRow,url:'https://images.example.test/photo.jpg',rightsConfirmed:false};expect((await request('validate',{document:image})).statusCode).toBe(400);
  const badOffer=structuredClone(boot.state.document);badOffer.offers.push({...offer,href:'https://evil.test/book',rightsConfirmed:true,linkConfirmed:true});expect((await request('validate',{document:badOffer})).statusCode).toBe(400);
  badOffer.offers[0]={...offer,id:'managed-'+randomUUID(),baseHash:null};expect((await request('validate',{document:badOffer})).statusCode).toBe(400);
 });
 it('keeps publication atomic on failure, persists after restart and restores only to draft',async()=>{
  const doc=structuredClone(boot.state.document);doc.hiddenFoods=['missing'];let result=await request('draft',{revision:boot.state.revision,document:doc},'PUT');expect(result.statusCode).toBe(200);let state=AdminStateSchema.parse(result.json());result=await request('publish',{revision:state.revision});expect(result.statusCode).toBe(400);expect((await app.inject('/api/site-settings')).json()).toEqual(boot.state.document.settings);
  await app.close();app=await createRuntimeApp({adminConfig:config()});expect((await app.inject({url:'/api/admin/session',headers:{cookie}})).statusCode).toBe(200);expect(CoursesResponseSchema.parse((await app.inject('/api/courses?locale=en')).json()).total).toBe(151);
  result=await request('restore',{revision:state.revision,version:2});expect(result.statusCode,result.body).toBe(200);state=AdminStateSchema.parse(result.json());expect(state.document.hiddenFoods).toEqual([]);expect(state.publishedRevision).toBe(2);expect(state.revision).toBe(4);boot.state=state;
 });
 it('revokes sessions on logout and limits repeated invalid passwords',async()=>{
  expect((await request('logout',{})).statusCode).toBe(200);expect((await app.inject({url:'/api/admin/bootstrap',headers:{cookie}})).statusCode).toBe(401);
  for(let i=0;i<5;i++)expect((await app.inject({method:'POST',url:'/api/admin/login',headers:{origin},payload:{password:'wrong'}})).statusCode).toBe(401);
  expect((await app.inject({method:'POST',url:'/api/admin/login',headers:{origin},payload:{password}})).statusCode).toBe(429);
 });
 it('disables all writes and never creates admin storage in a read-only runtime',async()=>{
  const server=await createRuntimeApp({readOnlySnapshot:true,adminConfig:config()});try{expect((await server.inject('/api/admin/session')).statusCode).toBe(503);expect((await server.inject({method:'POST',url:'/api/admin/login',headers:{origin},payload:{password}})).statusCode).toBe(503);expect((await server.inject('/api/site-settings')).json()).toEqual(DEFAULT_SITE_SETTINGS);}finally{await server.close();}
 });
 it('expires server sessions on idle and absolute deadlines',()=>{
  const store=createAdminStore(join(directory,'unit'));try{store.newSession(digest('one'),0);expect(store.session(digest('one'),1800000)).toBe(false);store.newSession(digest('two'),0);for(let i=1;i<16;i++)expect(store.session(digest('two'),i*1700000)).toBe(true);expect(store.session(digest('two'),28800000)).toBe(false);}finally{store.close();}
 });
});
