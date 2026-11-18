import { describe,expect,it,vi } from 'vitest';
import { mkdtemp,readFile,readdir,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename,dirname,join,resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ParkingSnapshotSchema } from '@trip-fit/domain';
import { loadParkingApiConfig } from '../../apps/server/src/config/env.js';
import { collectParking } from '../../apps/server/src/services/refresh-parking.js';
import { publishParkingSnapshot,readParkingSnapshot,validateParkingSnapshot } from '../../apps/server/src/repositories/parking.js';
import { buildApp } from '../../apps/server/src/app.js';
import { parkingTestRow as row,parkingEnvelope as envelope } from '../fixtures/parking.js';
const config=loadParkingApiConfig({PARKING_SERVICE_KEY:'TEST_SECRET+/=',PARKING_PAGE_SIZE:'2'});const now=()=>Date.parse('2026-11-14T03:00:00.000Z');
const response=(value:unknown)=>new Response(JSON.stringify(value));
function pages(values:unknown[]){return vi.fn<typeof fetch>().mockImplementation(async input=>{const number=Number(new URL(String(input)).searchParams.get('pageNo'));return response(envelope(values.slice((number-1)*2,number*2),values.length,number));});}
async function temp(work:(folder:string)=>Promise<void>){const folder=await mkdtemp(join(tmpdir(),'trip-fit-parking-'));try{await work(folder);}finally{expect(dirname(resolve(folder))).toBe(resolve(tmpdir()));expect(basename(folder)).toMatch(/^trip-fit-parking-/);await rm(folder,{recursive:true,force:true});}}
const first={...row,mgntNum:'TEST_01'};const second={...row,mgntNum:'TEST_02'};const third={...row,mgntNum:'TEST_03'};
describe('complete parking import and atomic persistence',()=>{
  it('collects all pages and accounts for every original row and quality state',async()=>{
    const mock=pages([first,second,third]);const {snapshot, pages:rawPages}=await collectParking(config,mock,now);
    expect(mock).toHaveBeenCalledTimes(2);expect(rawPages).toHaveLength(2);expect(snapshot.quality).toMatchObject({received:3,normalized:3,quarantined:0,coordinates:{valid:3},sourceDates:{stale:3},fees:{unknown:3},availability:{unavailable:3},hours:{parsed:3,ambiguous:3,missing:3}});
    expect(snapshot.records.map(record=>record.originalFields)).toEqual([first,second,third]);expect(validateParkingSnapshot(snapshot)).toEqual(snapshot);
  });
  it('quarantines malformed identity rows and all duplicate identities without silently losing records',async()=>{
    const values=[first,{...second,mgntNum:'DUP'},third,{...second,mgntNum:'DUP',pkNam:'Different duplicate'}, {...row,mgntNum:''}];
    const {snapshot}=await collectParking(config,pages(values),now);expect(snapshot.quality).toMatchObject({received:5,normalized:2,quarantined:3,quarantineReasons:{'duplicate-id':2,'missing-id':1}});expect(snapshot.quarantine.map(record=>record.sourceRow)).toEqual([1,3,4]);expect(validateParkingSnapshot(snapshot)).toEqual(snapshot);
  });
  it('rejects changing totals and truncated pages',async()=>{
    const changed=vi.fn<typeof fetch>().mockResolvedValueOnce(response(envelope([first,second],3))).mockResolvedValueOnce(response(envelope([third],4,2)));
    await expect(collectParking(config,changed,now)).rejects.toThrow('incomplete');
    await expect(collectParking(config,vi.fn<typeof fetch>().mockResolvedValue(response(envelope([first],3))),now)).rejects.toThrow('incomplete');
  });
  it('rejects repeated pages even when page numbers advance and object keys are reordered',async()=>{
    const reversed=Object.fromEntries(Object.entries(first).reverse());
    const mock=vi.fn<typeof fetch>().mockResolvedValueOnce(response(envelope([first,second],4))).mockResolvedValueOnce(response(envelope([reversed,second],4,2)));
    await expect(collectParking(config,mock,now)).rejects.toThrow('incomplete');
  });
  it('stops at configured page limits, refuses empty success and a fully unidentifiable dataset',async()=>{
    await expect(collectParking({...config,maxPages:1},pages([first,second,third]),now)).rejects.toThrow('incomplete');
    await expect(collectParking(config,pages([]),now)).rejects.toThrow('empty-dataset');
    await expect(collectParking(config,pages([{...row,mgntNum:''}]),now)).rejects.toThrow('no-valid-records');
  });
  it('preserves last published bytes on a partial network failure or cancellation',async()=>{
    await temp(async folder=>{
      const file=pathToFileURL(join(folder,'parking.json'));await writeFile(file,'LAST_SUCCESS');
      const failed=vi.fn<typeof fetch>().mockResolvedValueOnce(response(envelope([first,second],3))).mockRejectedValue(Error('private request URL'));
      await expect(collectParking(config,failed,now).then(({snapshot})=>publishParkingSnapshot(snapshot,file))).rejects.toThrow('network');expect(await readFile(file,'utf8')).toBe('LAST_SUCCESS');
      const controller=new AbortController();controller.abort();await expect(collectParking(config,pages([first]),now,controller.signal).then(({snapshot})=>publishParkingSnapshot(snapshot,file))).rejects.toThrow('aborted');expect(await readFile(file,'utf8')).toBe('LAST_SUCCESS');
    });
  });
  it('atomically replaces a valid snapshot and can revalidate every field offline',async()=>{
    await temp(async folder=>{const file=pathToFileURL(join(folder,'parking.json'));await writeFile(file,'PREVIOUS');const {snapshot}=await collectParking(config,pages([first,second,third]),now);await publishParkingSnapshot(snapshot,file);expect(await readParkingSnapshot(file)).toEqual(snapshot);expect(await readdir(folder)).toEqual(['parking.json']);});
  });
  it('rejects tampered normalized values, quality, provenance and page hashes before overwriting',async()=>{
    const {snapshot}=await collectParking(config,pages([first]),now);const record=snapshot.records[0];const page=snapshot.pagination.pages[0];if(!record||!page)throw Error('Missing test snapshot');
    const bad=[{...snapshot,records:[{...record,name:'Invented name'}]}, {...snapshot,quality:{...snapshot.quality,normalized:0}}, {...snapshot,source:{...snapshot.source,asOfDate:'2026-11-15'}}, {...snapshot,pagination:{...snapshot.pagination,pages:[{...page,sha256:'0'.repeat(64)}]}}];
    await temp(async folder=>{const file=pathToFileURL(join(folder,'parking.json'));await writeFile(file,'LAST_SUCCESS');for(const value of bad){await expect(publishParkingSnapshot(value,file)).rejects.toThrow('invalid-snapshot');expect(await readFile(file,'utf8')).toBe('LAST_SUCCESS');}expect(await readdir(folder)).toEqual(['parking.json']);});
  });
  it('does not lose previous files if the destination cannot be replaced',async()=>{
    await temp(async folder=>{const {snapshot}=await collectParking(config,pages([first]),now);await expect(publishParkingSnapshot(snapshot,pathToFileURL(join(folder,'missing','parking.json')))).rejects.toThrow('publication');expect(await readdir(folder)).toEqual([]);});
  });
  it('does not add a parking public route or require the dataset to start the site',async()=>{
    const app=buildApp({NODE_ENV:'test',HOST:'127.0.0.1',PORT:3001});try{expect((await app.inject('/api/health')).statusCode).toBe(200);expect((await app.inject('/api/parking')).statusCode).toBe(404);}finally{await app.close();}
  });
  it('validates row partition and schema totals independently of a stored quality report',async()=>{
    const {snapshot}=await collectParking(config,pages([first,second]),now);expect(ParkingSnapshotSchema.safeParse({...snapshot,records:snapshot.records.slice(0,1)}).success).toBe(false);
  });
});
