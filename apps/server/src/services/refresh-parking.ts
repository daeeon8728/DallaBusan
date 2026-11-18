import { createHash } from 'node:crypto';
import { ParkingSnapshotSchema, summarizeParking, type ParkingSnapshot } from '@trip-fit/domain';
import type { ParkingApiConfig } from '../config/env.js';
import { PARKING_API_SOURCE } from '../config/parking.js';
import { createParkingClient } from '../providers/parking/client.js';
import { ParkingError } from '../providers/parking/errors.js';
import type { ParkingPage } from '../providers/parking/parse.js';
import { normalizeParkingRows, parkingAsOfDate } from '../providers/parking/normalize.js';
export type CollectedParkingPage=ParkingPage&{fetchedAt:string};
function canonical(value:ParkingPage['rows'][number]):string{
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value!==null&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key]??null)).join(',')+'}';
  return JSON.stringify(value);
}
export function parkingRowsHash(rows:ParkingPage['rows']){return createHash('sha256').update(canonical(rows)).digest('hex');}
export function buildParkingSnapshot(pages:readonly CollectedParkingPage[],startedAt:string,completedAt:string):ParkingSnapshot{
  const first=pages[0];if(!first||first.totalCount===0)throw new ParkingError('empty-dataset');
  const pageSize=first.numOfRows;const totalCount=first.totalCount;const seen=new Set<string>();
  if(pageSize<1||pageSize>100||pages.length!==Math.ceil(totalCount/pageSize))throw new ParkingError('incomplete');
  const rows=[];const metadata=[];
  for(const [index,page]of pages.entries()){
    if(page.pageNo!==index+1||page.totalCount!==totalCount||page.numOfRows!==pageSize||page.rows.length!==Math.min(pageSize,totalCount-index*pageSize))throw new ParkingError('incomplete');
    const sha256=parkingRowsHash(page.rows);if(seen.has(sha256))throw new ParkingError('incomplete');seen.add(sha256);
    metadata.push({pageNo:page.pageNo,received:page.rows.length,fetchedAt:page.fetchedAt,sha256});
    rows.push(...page.rows.map((originalRow,offset)=>({originalRow,sourceRow:index*pageSize+offset,fetchedAt:page.fetchedAt})));
  }
  const asOfDate=parkingAsOfDate(completedAt);const {records,quarantine}=normalizeParkingRows(rows,asOfDate);
  if(!records.length)throw new ParkingError('no-valid-records');
  const parsed=ParkingSnapshotSchema.safeParse({version:1,normalizationVersion:2,source:{service:'busan-public-parking',url:PARKING_API_SOURCE.sourceUrl,
    licenseUrl:'https://www.data.go.kr/ugs/selectPortalPolicyView.do',credit:'부산광역시',startedAt,completedAt,asOfDate,staleAfterDays:30},
    pagination:{totalCount,pageSize,pages:metadata},records,quarantine,quality:summarizeParking(records,quarantine)});
  if(!parsed.success)throw new ParkingError('invalid-snapshot');return parsed.data;
}
export async function collectParking(config:ParkingApiConfig,fetcher:typeof fetch=fetch,now:()=>number=Date.now,signal?:AbortSignal){
  const startedAt=new Date(now()).toISOString();const client=createParkingClient(config,fetcher,now);const pages:CollectedParkingPage[]=[];const seen=new Set<string>();let total:number|null=null;
  for(let pageNo=1;pageNo<=config.maxPages;pageNo++){
    const page=await client.getPage(pageNo,signal);if(total===null)total=page.totalCount;
    if(!total)throw new ParkingError('empty-dataset');
    if(page.totalCount!==total||total>config.maxPages*config.pageSize||page.rows.length!==Math.min(config.pageSize,total-(pageNo-1)*config.pageSize))throw new ParkingError('incomplete');
    const hash=parkingRowsHash(page.rows);if(seen.has(hash))throw new ParkingError('incomplete');seen.add(hash);pages.push(page);
    if(pageNo*config.pageSize>=total)break;
    if(pageNo===config.maxPages)throw new ParkingError('incomplete');
  }
  if(signal?.aborted)throw new ParkingError('aborted');
  const snapshot=buildParkingSnapshot(pages,startedAt,new Date(now()).toISOString());return {snapshot,pages};
}
