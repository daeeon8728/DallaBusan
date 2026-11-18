import { readParkingSnapshot } from '../apps/server/src/repositories/parking.js';
import { parkingSnapshotPath } from '../apps/server/src/config/parking.js';
try{const snapshot=await readParkingSnapshot(parkingSnapshotPath());console.log(JSON.stringify({status:'verified',file:'config/catalog/parking.json',asOfDate:snapshot.source.asOfDate,quality:snapshot.quality}));}
catch{console.error('Parking snapshot verification failed. Details redacted.');process.exitCode=1;}
