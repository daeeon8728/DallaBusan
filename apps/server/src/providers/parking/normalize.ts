import { ParkingIdSchema, ParkingOriginalFieldsSchema, ParkingRecordSchema, parkingSourceKey, type ParkingRecord, type ParkingQuarantine } from '@trip-fit/domain';
import type { ParkingPage } from './parse.js';
export interface ParkingRowInput { originalRow:ParkingPage['rows'][number]; sourceRow:number; fetchedAt:string }
const missing=(value:unknown)=>value===null||value===undefined||typeof value==='string'&&['','-','null','n/a'].includes(value.trim().toLowerCase());
function rawText(value:unknown):string|null {if(typeof value==='string')return value.trim();if(typeof value==='number'&&Number.isFinite(value))return String(value);return null;}
const text=(value:unknown)=>missing(value)?null:rawText(value);
function numeric(value:unknown,integer=false):{value:number|null;status:'missing'|'invalid'|'valid'} {
  if(missing(value))return {value:null,status:'missing'};
  let number:number;
  if(typeof value==='number')number=value;
  else if(typeof value==='string'){
    const trimmed=value.trim();if(!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(trimmed))return {value:null,status:'invalid'};
    number=Number(trimmed.replaceAll(',',''));
  }else return {value:null,status:'invalid'};
  return Number.isFinite(number)&&(!integer||Number.isSafeInteger(number)&&number>=0)?{value:number,status:'valid'}:{value:null,status:'invalid'};
}
function clock(value:unknown,allowEnd24:boolean){
  const raw=rawText(value);if(missing(value))return {value:null,status:'missing'};
  const match=raw?.match(/^(\d{1,2}):([0-5]\d)(?::00)?$/);if(!match)return {value:null,status:'invalid'};
  const hour=Number(match[1]);const minute=Number(match[2]);
  if(hour>23&&!(allowEnd24&&hour===24&&minute===0))return {value:null,status:'invalid'};
  return {value:String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0'),status:'valid'};
}
export function normalizeParkingHours(startRaw:unknown,endRaw:unknown):ParkingRecord['hours']['weekday'] {
  const start=clock(startRaw,false);const end=clock(endRaw,true);
  const status=start.status==='invalid'||end.status==='invalid'?'invalid':start.value===null||end.value===null?'missing':start.value===end.value?'ambiguous':'parsed';
  return {startRaw:rawText(startRaw),endRaw:rawText(endRaw),start:start.value,end:end.value,status,
    crossesMidnight:status==='parsed'&&start.value!==null&&end.value!==null?end.value<start.value:null};
}
export function normalizeParkingDate(input:unknown,asOfDate:string):ParkingRecord['sourceDate'] {
  const raw=rawText(input);if(missing(input))return {raw,value:null,status:'missing',ageDays:null};
  let year:number;let month:number;let day:number;
  const iso=raw?.match(/^(\d{4})-(\d{2})-(\d{2})$/);const us=raw?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(iso){year=Number(iso[1]);month=Number(iso[2]);day=Number(iso[3]);}
  else if(us){year=Number(us[3]);month=Number(us[1]);day=Number(us[2]);}
  else return {raw,value:null,status:'invalid',ageDays:null};
  const timestamp=Date.UTC(year,month-1,day);const date=new Date(timestamp);
  if(year<1900||year>9999||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return {raw,value:null,status:'invalid',ageDays:null};
  const value=date.toISOString().slice(0,10);const ageDays=Math.floor((Date.parse(asOfDate+'T00:00:00Z')-timestamp)/86400000);
  return {raw,value,status:ageDays<0?'future':ageDays>30?'stale':'recent',ageDays};
}
export function parkingAsOfDate(iso:string){return new Date(Date.parse(iso)+9*3600000).toISOString().slice(0,10);}
export function normalizeParkingRows(input:readonly ParkingRowInput[],asOfDate:string){
  const quarantine:ParkingQuarantine[]=[];const staged:ParkingRecord[]=[];
  for(const entry of input){
    const original=ParkingOriginalFieldsSchema.safeParse(entry.originalRow);
    const reject=(reason:ParkingQuarantine['reason'],sourceId:string|null=null,sourceKey:string|null=null)=>quarantine.push({...entry,reason,sourceId,sourceKey});
    if(!original.success){reject('invalid-row');continue;}const raw=original.data;
    const rawId=typeof raw.mgntNum==='number'&&!Number.isSafeInteger(raw.mgntNum)?null:text(raw.mgntNum);
    if(missing(raw.mgntNum)){reject('missing-id');continue;}
    const id=ParkingIdSchema.safeParse(rawId);if(!id.success){reject('invalid-id');continue;}
    const operator=text(raw.guNm);if(!operator){reject('missing-operator',id.data);continue;}
    const sourceKey=parkingSourceKey(operator,id.data);
    const name=text(raw.pkNam);if(!name){reject('missing-name',id.data,sourceKey);continue;}
    const lat=numeric(raw.xCdnt);const lng=numeric(raw.yCdnt);
    const coordinates:ParkingRecord['coordinates']=lat.status==='invalid'||lng.status==='invalid'?{status:'invalid',value:null}
      :lat.value===null||lng.value===null?{status:'missing',value:null}
      :lat.value<34.8||lat.value>35.5||lng.value<128.7||lng.value>129.4?{status:'out-of-area',value:null}:{status:'valid',value:{lat:lat.value,lng:lng.value}};
    const capacity=numeric(raw.pkCnt,true);const base=numeric(raw.tenMin,true);const daily=numeric(raw.ftDay,true);const monthly=numeric(raw.ftMon,true);
    const extra=numeric(raw.feeAdd,true);const baseTime=numeric(raw.pkBascTime,true);const extraTime=numeric(raw.pkAddTime,true);const available=numeric(raw.currava,true);
    const warnings:ParkingRecord['warnings']=[];if(capacity.status==='invalid')warnings.push('invalid-capacity');
    if([base,daily,monthly,extra,baseTime,extraTime].some(value=>value.status==='invalid'))warnings.push('invalid-fee');
    const info=text(raw.feeInfo);let feeKind:ParkingRecord['fees']['kind']=info==='무료'?'free':info==='유료'?'paid':'unknown';
    if(feeKind==='free'&&[base,daily,monthly,extra].some(value=>value.value!==null&&value.value>0)){feeKind='unknown';warnings.push('conflicting-free-fee');}
    if(available.value!==null&&capacity.value!==null&&available.value>capacity.value)warnings.push('availability-exceeds-capacity');
    const result=ParkingRecordSchema.safeParse({sourceService:'busan-public-parking',sourceId:id.data,sourceKey,sourceRow:entry.sourceRow,name,locale:'ko',fetchedAt:entry.fetchedAt,originalFields:raw,
      operator,type:text(raw.pkFm),ownership:text(raw.pkGubun),grade:text(raw.ldRtg),contact:text(raw.tponNum),
      address:{doroAddrRaw:rawText(raw.doroAddr),jibunAddrRaw:rawText(raw.jibunAddr),classification:'unverified'},coordinates,totalSpaces:capacity.value,
      hours:{operatingDaysRaw:rawText(raw.oprDay),weekday:normalizeParkingHours(raw.svcSrtTe,raw.svcEndTe),saturday:normalizeParkingHours(raw.satSrtTe,raw.satEndTe),holiday:normalizeParkingHours(raw.hldSrtTe,raw.hldEndTe)},
      fees:{currency:'KRW',kind:feeKind,infoRaw:rawText(raw.feeInfo),baseWon:base.value,baseMinutes:baseTime.value!==null&&baseTime.value>0?baseTime.value:null,
        additionalWon:extra.value,additionalMinutes:extraTime.value!==null&&extraTime.value>0?extraTime.value:null,dailyWon:daily.value,dailyAppliesAfterRaw:rawText(raw.ftDayApplytime),monthlyWon:monthly.value,calculationStatus:'not-calculated'},
      availability:{raw:rawText(raw.currava),reportedSpaces:available.value,status:available.value===null?'unavailable':'unverified',observedAt:null,usableForLiveRecommendation:false},
      sourceDate:normalizeParkingDate(raw.fnlDt,asOfDate),restrictions:{vehicleRotationRaw:rawText(raw.bujeGubun),paymentMethodsRaw:rawText(raw.payMtd),notesRaw:rawText(raw.spclNote),operationTypeRaw:rawText(raw.oprt_fm)},
      reviewStatus:'source-unreviewed',recommendationStatus:'requires-review',warnings});
    if(result.success)staged.push(result.data);else reject('invalid-row',id.data,sourceKey);
  }
  // Management numbers are scoped by the source authority. Quarantine every ambiguous composite key. Never silently select the first row.
  const counts=new Map<string,number>();for(const row of staged)counts.set(row.sourceKey,(counts.get(row.sourceKey)??0)+1);
  const rejectedIds=new Set(quarantine.flatMap(row=>row.sourceKey?[row.sourceKey]:[]));
  const records:ParkingRecord[]=[];
  for(const row of staged){if((counts.get(row.sourceKey)??0)>1||rejectedIds.has(row.sourceKey))quarantine.push({sourceRow:row.sourceRow,sourceId:row.sourceId,sourceKey:row.sourceKey,reason:'duplicate-id',originalRow:row.originalFields,fetchedAt:row.fetchedAt});else records.push(row);}
  return {records,quarantine:quarantine.sort((a,b)=>a.sourceRow-b.sourceRow)};
}
