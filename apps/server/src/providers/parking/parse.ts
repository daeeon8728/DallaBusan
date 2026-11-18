import { z } from 'zod';
import { ParkingError } from './errors.js';
const Count=z.union([z.number(),z.string().regex(/^\d+$/).transform(Number)]).pipe(z.number().int().min(0).max(Number.MAX_SAFE_INTEGER));
export const ParkingPageSchema=z.strictObject({pageNo:Count,numOfRows:Count,totalCount:Count,rows:z.array(z.json())});
export type ParkingPage=z.infer<typeof ParkingPageSchema>;
export function parseParkingPage(input:unknown):ParkingPage {
  const header=z.object({response:z.object({header:z.object({resultCode:z.string()})})}).safeParse(input);
  if(!header.success)throw new ParkingError('invalid-response');
  const code=header.data.response.header.resultCode;
  if(code!=='00')throw new ParkingError(['30','31','32'].includes(code)?'authentication':['22','20'].includes(code)?'rate-limited':'invalid-response');
  const parsed=z.object({response:z.object({body:z.object({totalCount:Count,pageNo:Count,numOfRows:Count,items:z.unknown().optional()})})}).safeParse(input);
  if(!parsed.success)throw new ParkingError('invalid-response');const body=parsed.data.response.body;
  let item:unknown;
  if(body.items===undefined||body.items===null||body.items==='')item=undefined;
  else{const items=z.object({item:z.unknown().optional()}).safeParse(body.items);if(!items.success)throw new ParkingError('invalid-response');item=items.data.item;}
  const rows=item===undefined||item===null||item===''?[]:Array.isArray(item)?item:[item];
  const result=ParkingPageSchema.safeParse({pageNo:body.pageNo,numOfRows:body.numOfRows,totalCount:body.totalCount,rows});
  if(!result.success)throw new ParkingError('invalid-response');return result.data;
}
