import { describe, expect, it, vi } from 'vitest';
import { loadParkingApiConfig } from '../../apps/server/src/config/env.js';
import { parseParkingPage } from '../../apps/server/src/providers/parking/parse.js';
import { createParkingClient } from '../../apps/server/src/providers/parking/client.js';
import { normalizeParkingDate,normalizeParkingHours,normalizeParkingRows,parkingAsOfDate } from '../../apps/server/src/providers/parking/normalize.js';
import { parkingTestRow as row,parkingEnvelope as envelope } from '../fixtures/parking.js';
const stamp='2026-11-14T03:00:00.000Z';const config=loadParkingApiConfig({PARKING_SERVICE_KEY:'TEST_SECRET+/=',PARKING_PAGE_SIZE:'2'});
const reply=(value:unknown)=>new Response(JSON.stringify(value),{headers:{'Content-Type':'text/plain'}});
function normalized(value:unknown){return normalizeParkingRows([{originalRow:JSON.parse(JSON.stringify(value)),sourceRow:0,fetchedAt:stamp}],'2026-11-14');}
describe('parking source normalization',()=>{
  it('preserves original fields and Korean source text, corrects no address labels and uses x as latitude',()=>{
    const record=normalized(row).records[0];expect(record).toMatchObject({sourceId:'TEST_01',locale:'ko',originalFields:row,address:{doroAddrRaw:'검증 주소',jibunAddrRaw:'검증 주소 원문',classification:'unverified'},coordinates:{status:'valid',value:{lat:35.093,lng:129.011}},recommendationStatus:'requires-review'});
  });
  it.each([[null,'missing'],['-','missing'],['not-a-coordinate','invalid'],['129.011','out-of-area'],['0','out-of-area']])('keeps bad coordinate %j as %s', (xCdnt,status)=>{
    expect(normalized({...row,xCdnt}).records[0]?.coordinates).toMatchObject({status,value:null});
  });
  it('distinguishes missing quantities from zero and rejects negative/nonintegral quantities',()=>{
    expect(normalized({...row,pkCnt:'0',currava:'0'}).records[0]).toMatchObject({totalSpaces:0,availability:{reportedSpaces:0,status:'unverified',observedAt:null,usableForLiveRecommendation:false}});
    for(const pkCnt of ['-','',null,'-1','1.5'])expect(normalized({...row,pkCnt}).records[0]?.totalSpaces).toBeNull();
    expect(normalized({...row,currava:'99'}).records[0]?.warnings).toContain('availability-exceeds-capacity');
  });
  it('does not turn zero fees without a fee classification into free parking or calculate a price',()=>{
    const record=normalized(row).records[0];expect(record?.fees).toMatchObject({kind:'unknown',baseWon:0,dailyWon:0,monthlyWon:0,calculationStatus:'not-calculated'});
    expect(normalized({...row,feeInfo:'유료'}).records[0]?.fees.kind).toBe('paid');expect(normalized({...row,feeInfo:'무료'}).records[0]?.fees.kind).toBe('free');
    expect(normalized({...row,feeInfo:'무료',tenMin:'100'}).records[0]).toMatchObject({fees:{kind:'unknown'},warnings:['conflicting-free-fee']});
  });
  it('parses only sound integer fee tokens and preserves the raw price/units',()=>{
    expect(normalized({...row,tenMin:'1,000',pkBascTime:'0',feeAdd:'1,00'}).records[0]).toMatchObject({fees:{baseWon:1000,baseMinutes:null,additionalWon:null},warnings:['invalid-fee']});
    expect(normalized({...row,tenMin:'100원'}).records[0]?.fees.baseWon).toBeNull();
  });
  it.each([['9:00','18:00','parsed',false],['19:00','00:00','parsed',true],['00:00','24:00','parsed',false],['00:00','00:00','ambiguous',null],['08:00','08:00','ambiguous',null],['-','-','missing',null],['24:00','24:00','invalid',null],['09:00','24:30','invalid',null]])('normalizes %s–%s without assuming opening status',(start,end,status,crossesMidnight)=>{
    expect(normalizeParkingHours(start,end)).toMatchObject({status,crossesMidnight});
  });
  it.each([['08/24/2009','stale','2009-08-24'],['2026-10-15','recent','2026-10-15'],['2026-10-14','stale','2026-10-14'],['2026-11-15','future','2026-11-15'],['02/29/2024','stale','2024-02-29'],['02/29/2025','invalid',null],['2026-02-30','invalid',null],['-','missing',null]])('classifies source date %s as %s independently of fetch time',(raw,status,value)=>{
    expect(normalizeParkingDate(raw,'2026-11-14')).toMatchObject({raw,status,value});
  });
  it('uses the Korean calendar date rather than the machine timezone',()=>{expect(parkingAsOfDate('2026-11-13T15:00:00.000Z')).toBe('2026-11-14');});
  it('quarantines missing IDs/names and all duplicate IDs instead of generating identities',()=>{
    const values=[{...row,mgntNum:''},{...row,mgntNum:'bad/id'},{...row,mgntNum:'MISSING_NAME',pkNam:'-'},{...row,mgntNum:'DUPLICATE'},{...row,mgntNum:'DUPLICATE',pkNam:'Different name'},'bad row'];
    const result=normalizeParkingRows(values.map((originalRow,sourceRow)=>({originalRow,sourceRow,fetchedAt:stamp})),'2026-11-14');expect(result.records).toHaveLength(0);
    expect(result.quarantine.map(entry=>entry.reason)).toEqual(['missing-id','invalid-id','missing-name','duplicate-id','duplicate-id','invalid-row']);expect(result.quarantine.map(entry=>entry.originalRow)).toEqual(values);
  });
  it('keeps equal management numbers from different source authorities as independent records',()=>{
    const result=normalizeParkingRows([row,{...row,guNm:'다른 관리기관'}].map((originalRow,sourceRow)=>({originalRow,sourceRow,fetchedAt:stamp})),'2026-11-14');expect(result.quarantine).toHaveLength(0);expect(result.records).toHaveLength(2);expect(new Set(result.records.map(row=>row.sourceKey)).size).toBe(2);expect(new Set(result.records.map(row=>row.sourceId)).size).toBe(1);
    expect(normalized({...row,guNm:'-'}).quarantine[0]?.reason).toBe('missing-operator');
  });
  it('does not keep a good row when another row with the same ID is missing its name',()=>{
    const result=normalizeParkingRows([row,{...row,pkNam:''}].map((originalRow,sourceRow)=>({originalRow,sourceRow,fetchedAt:stamp})),'2026-11-14');expect(result.records).toHaveLength(0);expect(result.quarantine).toHaveLength(2);
  });
});
describe('parking HTTP and envelope safety',()=>{
  it('accepts singleton/empty and numeric-string paging but not the tourism envelope',()=>{
    expect(parseParkingPage(envelope(row)).rows).toHaveLength(1);expect(parseParkingPage(envelope('',0)).rows).toEqual([]);expect(()=>parseParkingPage({getRecommendedKr:{item:[row]}})).toThrow('invalid-response');
  });
  it('uses the exact fixed HTTPS operation and encodes the service key once',async()=>{
    const mock=vi.fn<typeof fetch>().mockResolvedValue(reply(envelope([row])));const result=await createParkingClient({...config,serviceKey:encodeURIComponent('TEST_SECRET+/=')},mock).getPage(1);
    const url=new URL(String(mock.mock.calls[0]?.[0]));expect(url.origin+url.pathname).toBe('https://apis.data.go.kr/6260000/BusanPblcPrkngInfoService/getPblcPrkngInfo');expect(url.searchParams.get('ServiceKey')).toBe('TEST_SECRET+/=');expect(url.searchParams.get('resultType')).toBe('json');expect(mock.mock.calls[0]?.[1]?.redirect).toBe('error');expect(result.rows).toHaveLength(1);
  });
  it('rejects arbitrary endpoints, wrong paging and malformed/absent keys before requesting',async()=>{
    const mock=vi.fn<typeof fetch>();expect(()=>createParkingClient({...config,baseUrl:'https://invalid.test/'},mock)).toThrow('configuration');
    await expect(createParkingClient({...config,serviceKey:null},mock).getPage(1)).rejects.toThrow('unconfigured');await expect(createParkingClient({...config,serviceKey:'%ZZ'},mock).getPage(1)).rejects.toThrow('invalid-key');await expect(createParkingClient(config,mock).getPage(0)).rejects.toThrow('incomplete');expect(mock).not.toHaveBeenCalled();
  });
  it.each([[401,'authentication'],[403,'authentication'],[429,'rate-limited'],[500,'http']])('handles HTTP %s without retries or URL leakage',async(status,code)=>{
    const mock=vi.fn<typeof fetch>().mockResolvedValue(new Response('private body',{status,headers:{'retry-after':'90'}}));await expect(createParkingClient(config,mock).getPage(1)).rejects.toMatchObject({code,retryAfterSeconds:90,message:'Parking service: '+code});expect(mock).toHaveBeenCalledTimes(1);
  });
  it('handles JSON business errors and XML authentication/gateway errors safely',async()=>{
    for(const [body,code]of [['<returnReasonCode>30</returnReasonCode>','authentication'],['<returnReasonCode>22</returnReasonCode>','rate-limited'],['<broken>','invalid-response']])await expect(createParkingClient(config,vi.fn<typeof fetch>().mockResolvedValue(new Response(body))).getPage(1)).rejects.toThrow(code);
    expect(()=>parseParkingPage(envelope([],0,1,2,'30'))).toThrow('authentication');expect(()=>parseParkingPage(envelope([],0,1,2,'99'))).toThrow('invalid-response');
  });
  it('enforces both declared and streamed body sizes',async()=>{
    await expect(createParkingClient({...config,maxResponseBytes:10},vi.fn<typeof fetch>().mockResolvedValue(new Response('small',{headers:{'content-length':'100'}}))).getPage(1)).rejects.toThrow('too-large');
    const cancel=vi.fn();const body=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('a'.repeat(20)));},cancel});
    await expect(createParkingClient({...config,maxResponseBytes:10},vi.fn<typeof fetch>().mockResolvedValue(new Response(body))).getPage(1)).rejects.toThrow('too-large');expect(cancel).toHaveBeenCalledOnce();
  });
  it('sanitizes native errors and refuses an upstream credential echo',async()=>{
    await expect(createParkingClient(config,vi.fn<typeof fetch>().mockRejectedValue(Error('sensitive URL TEST_SECRET+/='))).getPage(1)).rejects.toThrow(/^Parking service: network$/);
    await expect(createParkingClient(config,vi.fn<typeof fetch>().mockResolvedValue(reply(envelope([{...row,secret:'TEST_SECRET+/='}])))).getPage(1)).rejects.toThrow(/^Parking service: invalid-response$/);
  });
  it('rejects mismatched page envelopes and honors cancellation/timeouts',async()=>{
    await expect(createParkingClient(config,vi.fn<typeof fetch>().mockResolvedValue(reply(envelope([row],1,2)))).getPage(1)).rejects.toThrow('invalid-response');
    const controller=new AbortController();controller.abort();const unused=vi.fn<typeof fetch>();await expect(createParkingClient(config,unused).getPage(1,controller.signal)).rejects.toThrow('aborted');expect(unused).not.toHaveBeenCalled();
    const stalled:typeof fetch=async(_url,options)=>new Promise((_resolve,reject)=>{const abort=()=>reject(Error('aborted private request'));if(options?.signal?.aborted)abort();else options?.signal?.addEventListener('abort',abort,{once:true});});
    await expect(createParkingClient({...config,timeoutMs:5},stalled).getPage(1)).rejects.toThrow('timeout');
  });
  it('isolates optional configuration and rejects excessive page limits without leaking values',()=>{
    expect(loadParkingApiConfig({RECOMMENDED_SERVICE_KEY:'OTHER'}).serviceKey).toBeNull();expect(loadParkingApiConfig({PARKING_PAGE_SIZE:''}).pageSize).toBe(100);expect(()=>loadParkingApiConfig({PARKING_PAGE_SIZE:'101'})).toThrow(/^Invalid parking configuration$/);
  });
});
