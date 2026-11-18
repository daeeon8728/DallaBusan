import { DatabaseSync } from 'node:sqlite';
import { open,rename,unlink,stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { loadDatabaseConfig } from '../apps/server/src/config/env.js';
import { RouteAttractionSourcesSchema } from '../apps/server/src/config/theme-routes.js';
import { AttractionRecordSchema } from '../apps/server/src/providers/attraction/parse.js';
async function main(){const config=loadDatabaseConfig();if(config.filename===':memory:')throw new Error('Read-only source database required');await stat(config.filename);
  const db=new DatabaseSync(config.filename,{readOnly:true});let result;
  try{const rows=db.prepare('SELECT locale,payload,fetched_at FROM attraction_records ORDER BY locale,source_id').all();result=RouteAttractionSourcesSchema.parse({version:1,source:'readonly-existing-attraction-database',sourceUrl:'https://www.data.go.kr/data/15063481/openapi.do',exportedAt:new Date().toISOString(),records:rows.map(row=>({locale:row.locale,record:AttractionRecordSchema.parse(JSON.parse(z.string().parse(row.payload))),fetchedAt:row.fetched_at}))});}finally{db.close();}
  const destination=new URL('../config/catalog/route-attraction-sources.json',import.meta.url);const pending=new URL(destination.href+'.'+randomUUID()+'.pending.json');let owned=false;
  try{const file=await open(pending,'wx');owned=true;try{await file.writeFile(JSON.stringify(result,null,2)+'\n');await file.sync();}finally{await file.close();}await rename(pending,destination);}finally{if(owned)await unlink(pending).catch(()=>undefined);}
  console.log(JSON.stringify({status:'exported-read-only',records:result.records.length}));
}
main().catch(()=>{console.error('Read-only attraction source export failed; prior export preserved.');process.exitCode=1;});
