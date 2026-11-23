import { createHash } from 'node:crypto';
import { ParkingDirectoryInputSchema,ParkingDirectoryRecordSchema,ParkingDirectorySnapshotSchema,type ParkingDirectoryInput,type ParkingDirectoryRecord } from '@trip-fit/domain';
import { normalizeParkingHours,normalizeParkingDate,parkingAsOfDate } from '../providers/parking/normalize.js';
export function isBusanParkingRow(row:ParkingDirectoryInput['rows'][number]){return ['RDNMADR','LNMADR','INSTT_NM'].some(key=>typeof row[key]==='string'&&/^부산(?:광역시)?\s/.test(row[key].trim()));}
export function normalizeParkingDirectory(raw:unknown){
 const input=ParkingDirectoryInputSchema.parse(raw);const records:ParkingDirectoryRecord[]=[];const quarantine:{sourceRow:number;reason:'not-busan'|'missing-identity'|'duplicate-identity'}[]=[];const staged:ParkingDirectoryRecord[]=[];
 const text=(value:unknown)=>typeof value==='string'&&!['','-','null'].includes(value.trim())?value.trim():typeof value==='number'&&Number.isFinite(value)?String(value):null;
 const number=(value:unknown,allowZero=false)=>{const t=text(value);if(t===null||!/^\d+$/.test(t))return null;const n=Number(t);return Number.isSafeInteger(n)&&(allowZero?n>=0:n>0)?n:null;};
 for(const [sourceRow,row]of input.rows.entries()){
   if(!isBusanParkingRow(row)){quarantine.push({sourceRow,reason:'not-busan'});continue;}
   const sourceId=text(row.PRKPLCE_NO),name=text(row.PRKPLCE_NM),operator=text(row.INSTITUTION_NM)||text(row.INSTT_NM);if(!sourceId||!name||!operator){quarantine.push({sourceRow,reason:'missing-identity'});continue;}
   const address=text(row.RDNMADR),landAddress=text(row.LNMADR);const lat=Number(text(row.LATITUDE)),lng=Number(text(row.LONGITUDE));const coordinates=text(row.LATITUDE)!==null&&text(row.LONGITUDE)!==null&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=34.8&&lat<=35.5&&lng>=128.7&&lng<=129.4?{lat,lng}:null;
   const feeRaw=text(row.PARKINGCHRGE_INFO);let fee:ParkingDirectoryRecord['fee']=feeRaw==='무료'?'free':feeRaw==='유료'?'paid':feeRaw==='혼합'?'mixed':'unknown';const baseWon=number(row.BASIC_CHARGE),additionalWon=number(row.ADD_UNIT_CHARGE),dailyWon=number(row.DAY_CMMTKT);const warnings:string[]=[];
   if(fee==='free'&&(baseWon!==null||additionalWon!==null||dailyWon!==null)){fee='unknown';warnings.push('conflicting-free-fee');}
   if(!coordinates)warnings.push('coordinates-unavailable');
   const date=normalizeParkingDate(row.REFERENCE_DATE,parkingAsOfDate(input.collectedAt));
   staged.push(ParkingDirectoryRecordSchema.parse({id:'std-'+createHash('sha256').update(JSON.stringify([text(row.INSTT_CODE)||operator,sourceId])).digest('hex').slice(0,32),sourceId,sourceRow,name,district:(address||landAddress)?.match(/^부산(?:광역시)?\s+([^\s]+(?:구|군))/)?.[1]??null,address,landAddress,operator,ownership:row.PRKPLCE_SE==='공영'?'public':row.PRKPLCE_SE==='민영'?'private':'unknown',type:text(row.PRKPLCE_TYPE),capacity:number(row.PRKCMPRT,true),fee,feeRaw,baseMinutes:number(row.BASIC_TIME),baseWon,additionalMinutes:number(row.ADD_UNIT_TIME),additionalWon,dailyWon,operatingDays:text(row.OPER_DAY),hours:{weekday:normalizeParkingHours(row.WEEKDAY_OPER_OPEN_HHMM,row.WEEKDAY_OPER_COLSE_HHMM),saturday:normalizeParkingHours(row.SAT_OPER_OPER_OPEN_HHMM,row.SAT_OPER_CLOSE_HHMM),holiday:normalizeParkingHours(row.HOLIDAY_OPER_OPEN_HHMM,row.HOLIDAY_CLOSE_OPEN_HHMM)},paymentMethods:text(row.METPAY),restrictions:[text(row.SPCMNT),text(row.ENFORCE_SE)].filter(Boolean).join(' · ')||null,phone:text(row.PHONE_NUMBER),sourceDate:date.value,coordinates,warnings}));
 }
 const counts=new Map<string,number>();for(const row of staged)counts.set(row.id,(counts.get(row.id)??0)+1);
 for(const row of staged)if((counts.get(row.id)??0)>1)quarantine.push({sourceRow:row.sourceRow,reason:'duplicate-identity'});else records.push(row);
 const quality={received:input.rows.length,normalized:records.length,quarantined:quarantine.length,paid:records.filter(r=>r.fee==='paid').length,free:records.filter(r=>r.fee==='free').length,mixed:records.filter(r=>r.fee==='mixed').length,unknownFee:records.filter(r=>r.fee==='unknown').length,public:records.filter(r=>r.ownership==='public').length,private:records.filter(r=>r.ownership==='private').length,unknownOwnership:records.filter(r=>r.ownership==='unknown').length,missingCoordinates:records.filter(r=>!r.coordinates).length,districts:new Set(records.flatMap(r=>r.district?[r.district]:[])).size};
 return ParkingDirectorySnapshotSchema.parse({version:1,input,records,quarantine:quarantine.sort((a,b)=>a.sourceRow-b.sourceRow),quality});
}
