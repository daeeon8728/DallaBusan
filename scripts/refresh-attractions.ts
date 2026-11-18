import { z } from 'zod';
import { SUPPORTED_LOCALES } from '@trip-fit/domain';
import { loadAttractionConfig, loadDatabaseConfig } from '../apps/server/src/config/env.js';
import { openDatabase, migrate } from '../apps/server/src/db/client.js';
import { createAttractionCache, MappingFileSchema, storeAttractionRecords } from '../apps/server/src/db/attractions.js';
import { createAttractionClient } from '../apps/server/src/providers/attraction/client.js';
import { importAttractions } from '../apps/server/src/services/import-attractions.js';
import { readFile } from 'node:fs/promises';

async function main() {
  const config=loadAttractionConfig();
  if(!config.serviceKey)throw new Error('Missing attraction configuration');
  const mappingInput:unknown=JSON.parse(await readFile(new URL('../config/attraction-mappings.json',import.meta.url),'utf8'));
  const mappings=MappingFileSchema.parse(mappingInput);
  const db=openDatabase(loadDatabaseConfig().filename);
  try {
    migrate(db);
    const client=createAttractionClient({...config,cacheTtlMs:1},createAttractionCache(db));
    const outcomes=[];
    for(const locale of SUPPORTED_LOCALES){
      const startedAt=new Date().toISOString();
      const result=await importAttractions(client,locale,config,(records,fetchedAt)=>storeAttractionRecords(db,locale,records,fetchedAt,mappings));
      db.prepare('INSERT INTO attraction_imports(locale,started_at,payload) VALUES (?,?,?)').run(locale,startedAt,JSON.stringify(result));
      outcomes.push({locale,status:result.status,records:result.records});
      console.log(JSON.stringify(outcomes.at(-1)));
      if(result.status!=='complete')throw new Error('Incomplete refresh');
    }
    z.array(z.object({status:z.literal('complete')})).parse(outcomes);
  } finally {db.close();}
}
main().catch(()=>{console.error('Public tourism refresh failed. The last published snapshot was preserved; credentials were not logged.');process.exitCode=1;});
