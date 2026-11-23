import { collectParkingDirectory } from '../apps/server/src/providers/parking-directory/client.js';
import { normalizeParkingDirectory } from '../apps/server/src/services/normalize-parking-directory.js';
import { publishParkingDirectory } from '../apps/server/src/repositories/parking-directory.js';
import { parkingDirectoryPath } from '../apps/server/src/config/parking-directory.js';
try{const snapshot=normalizeParkingDirectory(await collectParkingDirectory());await publishParkingDirectory(snapshot,parkingDirectoryPath());console.log(JSON.stringify({status:'published',quality:snapshot.quality,sourceCollectedAt:snapshot.input.collectedAt,allCityParkingGuaranteed:false,liveAvailability:false}));}catch{console.error('Parking directory collection failed; prior snapshot preserved.');process.exitCode=1;}
