import { open,rename,unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { validateParkingDirectory } from '../config/parking-directory.js';
export async function publishParkingDirectory(input:unknown,file:URL){const value=validateParkingDirectory(input);if(value.records.length===0)throw new Error('Empty parking directory cannot replace prior snapshot');const pending=new URL(file.href+'.'+randomUUID()+'.pending.json');let owned=false;try{const handle=await open(pending,'wx');owned=true;try{await handle.writeFile(JSON.stringify(value,null,2)+'\n');await handle.sync();}finally{await handle.close();}await rename(pending,file);}finally{if(owned)await unlink(pending).catch(()=>undefined);}return value;}
