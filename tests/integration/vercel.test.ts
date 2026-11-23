import { z } from 'zod';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe,expect,it } from 'vitest';
import { loadRuntimeDatabaseConfig,loadDatabaseConfig } from '../../apps/server/src/config/env.js';
import { openDatabase } from '../../apps/server/src/db/client.js';
const Rule=z.object({source:z.string(),destination:z.string()});
const Service=z.object({root:z.string(),framework:z.string(),runtime:z.string().optional(),installCommand:z.string(),buildCommand:z.string(),outputDirectory:z.string().optional(),entrypoint:z.string().optional(),bindings:z.array(z.unknown()).optional(),functions:z.record(z.string(),z.object({includeFiles:z.string()})).optional(),rewrites:z.array(Rule).optional()});
const input:unknown=JSON.parse(readFileSync(new URL('../../vercel.json',import.meta.url),'utf8'));
const config=z.object({services:z.strictObject({web:Service,server:Service}),rewrites:z.array(z.object({source:z.string(),destination:z.object({service:z.string()})}))}).passthrough().parse(input);
describe('Vercel services deployment',()=>{
 it('selects Node 24 through the server package engines rather than a service runtime version',()=>{
  const packageInput:unknown=JSON.parse(readFileSync(new URL('../../apps/server/package.json',import.meta.url),'utf8'));
  const serverPackage=z.object({engines:z.object({node:z.string()})}).parse(packageInput);
  const lockInput:unknown=JSON.parse(readFileSync(new URL('../../package-lock.json',import.meta.url),'utf8'));
  const lock=z.object({packages:z.record(z.string(),z.object({engines:z.object({node:z.string()}).optional()}).passthrough())}).parse(lockInput);
  expect(serverPackage.engines.node).toBe('>=24.14.1 <25');
  expect(lock.packages['apps/server']?.engines?.node).toBe(serverPackage.engines.node);
 });
 it('defines only the real frontend and backend, with per-service builds and no made-up runtime callers',()=>{
  expect(Object.keys(config.services).sort()).toEqual(['server','web']);expect(config.services.web.root).toBe('apps/web');expect(config.services.server.root).toBe('apps/server');expect(config.services.server.entrypoint).toBe('src/app.ts');expect(config.services.server).not.toHaveProperty('runtime');expect(config.services.web.outputDirectory).toBe('dist');
  for(const name of ['web','server'] as const){const service=config.services[name];expect(service.installCommand).toBe('cd ../.. && npm ci --include=dev --workspaces --include-workspace-root');expect(service.buildCommand).toContain('npm run build --workspace @trip-fit/domain');expect(service.buildCommand).toContain('npm run build --workspace @trip-fit/'+name);expect(service.bindings??[]).toEqual([]);}
  for(const key of ['buildCommand','framework','functions','installCommand','outputDirectory'])expect(config).not.toHaveProperty(key);
 });
 it('routes API root and subpaths to the backend without stripping the existing /api prefix',()=>{
  const route=(path:string)=>config.rewrites.find((rule:{source:string})=>new RegExp('^'+rule.source+'$').test(path))?.destination.service;
  for(const path of ['/api','/api/health','/api/offers','/api/guides/food/70'])expect(route(path)).toBe('server');
  for(const path of ['/','/food/70','/search','/cart','/assets/index.js','/apix'])expect(route(path)).toBe('web');
  expect(config.rewrites.at(-1)?.source).toBe('/(.*)');
 });
 it('rewrites known SPA entry routes while allowing asset and private-file misses to remain 404',()=>{
  const rewrites=config.services.web.rewrites??[];for(const source of ['/','/search','/saved','/cart','/food/:path*','/recommended/:path*','/places/:path*'])expect(rewrites).toContainEqual({source,destination:'/index.html'});
  expect(rewrites.some((rule:{source:string})=>rule.source==='/(.*)')).toBe(false);expect(config.services.server.functions?.['src/app.ts']?.includeFiles).toContain('../../config/catalog/**');expect(config.services.server.functions?.['src/app.ts']?.includeFiles).toContain('../../data/snapshots/**');
 });
 it('selects a bundled read-only snapshot on Vercel and preserves explicit local/CLI databases',()=>{
  const settings=loadRuntimeDatabaseConfig({VERCEL:'1',DATABASE_PATH:'must-not-create.sqlite'});expect(settings.readOnly).toBe(true);expect(loadRuntimeDatabaseConfig({},true).readOnly).toBe(true);expect(settings.filename.replaceAll('\\','/')).toMatch(/\/data\/snapshots\/trip-fit.sqlite$/);
  expect(loadRuntimeDatabaseConfig({DATABASE_PATH:':memory:'})).toEqual({filename:':memory:',readOnly:false});expect(loadDatabaseConfig({VERCEL:'1',DATABASE_PATH:':memory:'})).toEqual({filename:':memory:'});
 });
 it('reads the shipped public DB and rejects writes without changing the backup',()=>{
  const settings=loadRuntimeDatabaseConfig({VERCEL:'1'}),hash=()=>createHash('sha256').update(readFileSync(settings.filename)).digest('hex'),before=hash();const db=openDatabase(settings.filename,{readOnly:true});
  try{expect(db.prepare('SELECT COUNT(*) AS n FROM places').get()?.n).toBe(1044);expect(()=>db.exec('CREATE TABLE forbidden_runtime_write (id INTEGER)')).toThrow(/readonly|read-only/i);}finally{db.close();}expect(hash()).toBe(before);
  const local=openDatabase(':memory:');try{local.exec('CREATE TABLE local_write (id INTEGER)');expect(()=>local.exec('INSERT INTO local_write VALUES (1)')).not.toThrow();}finally{local.close();}
 });
});
