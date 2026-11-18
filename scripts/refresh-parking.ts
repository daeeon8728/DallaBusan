import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { loadParkingApiConfig } from '../apps/server/src/config/env.js';
import { parkingSnapshotPath } from '../apps/server/src/config/parking.js';
import { collectParking } from '../apps/server/src/services/refresh-parking.js';
import { publishParkingSnapshot } from '../apps/server/src/repositories/parking.js';
import { ParkingError } from '../apps/server/src/providers/parking/errors.js';
async function main(){
  const {snapshot,pages}=await collectParking(loadParkingApiConfig());
  const folder=new URL('../var/imports/parking/',import.meta.url);await mkdir(folder,{recursive:true});
  const name=snapshot.source.completedAt.replaceAll(':','-')+'-'+randomUUID()+'.json';
  await writeFile(new URL(name,folder),JSON.stringify({source:snapshot.source,pages},null,2)+'\n',{flag:'wx'});
  await publishParkingSnapshot(snapshot,parkingSnapshotPath());
  console.log(JSON.stringify({status:'complete',file:'config/catalog/parking.json',collectedAt:snapshot.source.completedAt,asOfDate:snapshot.source.asOfDate,pages:pages.length,quality:snapshot.quality}));
}
main().catch((error:unknown)=>{const code=error instanceof ParkingError?error.code:'unexpected';console.error('Parking refresh failed ('+code+'). Last snapshot preserved; upstream URLs and credentials redacted.');process.exitCode=1;});
