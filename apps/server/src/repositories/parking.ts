import { readFile, open, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { ParkingSnapshotSchema, type ParkingSnapshot } from '@trip-fit/domain';
import { PARKING_API_SOURCE } from '../config/parking.js';
import { ParkingError } from '../providers/parking/errors.js';
import { parkingAsOfDate } from '../providers/parking/normalize.js';
import { buildParkingSnapshot } from '../services/refresh-parking.js';
export function validateParkingSnapshot(input:unknown):ParkingSnapshot{
  const parsed=ParkingSnapshotSchema.safeParse(input);if(!parsed.success)throw new ParkingError('invalid-snapshot');const snapshot=parsed.data;
  if(snapshot.source.url!==PARKING_API_SOURCE.sourceUrl||snapshot.source.asOfDate!==parkingAsOfDate(snapshot.source.completedAt)
    ||Date.parse(snapshot.source.startedAt)>Date.parse(snapshot.source.completedAt))throw new ParkingError('invalid-snapshot');
  const originalRows=[...snapshot.records.map(row=>({sourceRow:row.sourceRow,originalRow:row.originalFields,fetchedAt:row.fetchedAt})),...snapshot.quarantine].sort((a,b)=>a.sourceRow-b.sourceRow);
  let previous=Date.parse(snapshot.source.startedAt);
  const pages=snapshot.pagination.pages.map(page=>{
    const stamp=Date.parse(page.fetchedAt);if(stamp<previous||stamp>Date.parse(snapshot.source.completedAt))throw new ParkingError('invalid-snapshot');previous=stamp;
    const rows=originalRows.slice((page.pageNo-1)*snapshot.pagination.pageSize,(page.pageNo-1)*snapshot.pagination.pageSize+page.received);
    if(rows.some(row=>row.fetchedAt!==page.fetchedAt))throw new ParkingError('invalid-snapshot');
    return {pageNo:page.pageNo,numOfRows:snapshot.pagination.pageSize,totalCount:snapshot.pagination.totalCount,rows:rows.map(row=>row.originalRow),fetchedAt:page.fetchedAt};
  });
  const rebuilt=buildParkingSnapshot(pages,snapshot.source.startedAt,snapshot.source.completedAt);
  if(JSON.stringify(rebuilt)!==JSON.stringify(snapshot))throw new ParkingError('invalid-snapshot');return snapshot;
}
export async function publishParkingSnapshot(input:unknown,destination:URL){
  const snapshot=validateParkingSnapshot(input);const pending=new URL(destination.href+'.'+randomUUID()+'.pending.json');
  let owned=false;
  try{const handle=await open(pending,'wx');owned=true;try{await handle.writeFile(JSON.stringify(snapshot,null,2)+'\n');await handle.sync();}finally{await handle.close();}await rename(pending,destination);}
  catch{throw new ParkingError('publication');}
  finally{if(owned)await unlink(pending).catch(()=>undefined);}
}
export async function readParkingSnapshot(file:URL){
  try{const input:unknown=JSON.parse(await readFile(file,'utf8'));return validateParkingSnapshot(input);}
  catch(error){if(error instanceof ParkingError)throw error;throw new ParkingError('invalid-snapshot');}
}
