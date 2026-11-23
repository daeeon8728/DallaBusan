import { loadParkingDirectory } from '../apps/server/src/config/parking-directory.js';
try{const snapshot=loadParkingDirectory();if(!snapshot)throw new Error();console.log(JSON.stringify({status:'verified',quality:snapshot.quality,sourceCollectedAt:snapshot.input.collectedAt}));}catch{console.error('Parking directory validation failed.');process.exitCode=1;}
