import { z } from 'zod';
import { SafeHttpsSchema } from './offers.js';
const Count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const NullableText = z.string().max(20000).nullable();
export const ParkingOriginalFieldsSchema = z.record(z.string().max(200), z.json());
export const ParkingIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/);
export function parkingSourceKey(operator:string,sourceId:string){return JSON.stringify([operator,sourceId]);}
export const ParkingTimeWindowSchema = z.strictObject({
  startRaw: NullableText, endRaw: NullableText,
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  end: z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/).nullable(),
  status: z.enum(['parsed','missing','invalid','ambiguous']), crossesMidnight: z.boolean().nullable(),
});
export const ParkingWarningSchema = z.enum(['invalid-capacity','invalid-fee','conflicting-free-fee','availability-exceeds-capacity']);
export const ParkingRecordSchema = z.strictObject({
  sourceService: z.literal('busan-public-parking'), sourceId: ParkingIdSchema, sourceKey:z.string().min(1).max(1200), sourceRow: Count,
  name: z.string().min(1).max(1000), locale: z.literal('ko'), fetchedAt: z.iso.datetime(),
  originalFields: ParkingOriginalFieldsSchema,
  operator: z.string().min(1).max(1000), type: NullableText, ownership: NullableText, grade: NullableText, contact: NullableText,
  address: z.strictObject({ doroAddrRaw: NullableText, jibunAddrRaw: NullableText, classification: z.literal('unverified') }),
  coordinates: z.strictObject({status:z.enum(['valid','missing','invalid','out-of-area']),value:z.strictObject({lat:z.number().min(34.8).max(35.5),lng:z.number().min(128.7).max(129.4)}).nullable()}),
  totalSpaces: Count.nullable(),
  hours: z.strictObject({ operatingDaysRaw: NullableText, weekday: ParkingTimeWindowSchema, saturday: ParkingTimeWindowSchema, holiday: ParkingTimeWindowSchema }),
  fees: z.strictObject({ currency:z.literal('KRW'),kind:z.enum(['paid','free','unknown']),infoRaw:NullableText,
    baseWon:Count.nullable(),baseMinutes:Count.nullable(),additionalWon:Count.nullable(),additionalMinutes:Count.nullable(),
    dailyWon:Count.nullable(),dailyAppliesAfterRaw:NullableText,monthlyWon:Count.nullable(),calculationStatus:z.literal('not-calculated') }),
  availability: z.strictObject({ raw:NullableText,reportedSpaces:Count.nullable(),status:z.enum(['unavailable','unverified']),observedAt:z.null(),usableForLiveRecommendation:z.literal(false) }),
  sourceDate: z.strictObject({raw:NullableText,value:z.iso.date().nullable(),status:z.enum(['recent','stale','missing','invalid','future']),ageDays:z.number().int().nullable()}),
  restrictions: z.strictObject({vehicleRotationRaw:NullableText,paymentMethodsRaw:NullableText,notesRaw:NullableText,operationTypeRaw:NullableText}),
  reviewStatus:z.literal('source-unreviewed'),recommendationStatus:z.literal('requires-review'), warnings:z.array(ParkingWarningSchema),
});
export type ParkingRecord = z.infer<typeof ParkingRecordSchema>;
export const ParkingQuarantineReasonSchema = z.enum(['invalid-row','missing-id','invalid-id','missing-operator','missing-name','duplicate-id']);
export const ParkingQuarantineSchema = z.strictObject({sourceRow:Count,sourceId:ParkingIdSchema.nullable(),sourceKey:z.string().max(1200).nullable(),reason:ParkingQuarantineReasonSchema,originalRow:z.json(),fetchedAt:z.iso.datetime()});
export type ParkingQuarantine = z.infer<typeof ParkingQuarantineSchema>;
export const ParkingQualitySchema = z.strictObject({
  received:Count,normalized:Count,quarantined:Count,uniqueSourceKeys:Count,distinctManagementNumbers:Count,
  coordinates:z.strictObject({valid:Count,missing:Count,invalid:Count,'out-of-area':Count}),
  sourceDates:z.strictObject({recent:Count,stale:Count,missing:Count,invalid:Count,future:Count}),
  hours:z.strictObject({parsed:Count,missing:Count,invalid:Count,ambiguous:Count}),
  fees:z.strictObject({paid:Count,free:Count,unknown:Count}),
  availability:z.strictObject({unavailable:Count,unverified:Count}),
  quarantineReasons:z.strictObject({'invalid-row':Count,'missing-id':Count,'invalid-id':Count,'missing-operator':Count,'missing-name':Count,'duplicate-id':Count}),
  capacityMissing:Count,capacityZero:Count,sourceDateMin:z.iso.date().nullable(),sourceDateMax:z.iso.date().nullable(),
  warningCounts:z.strictObject({'invalid-capacity':Count,'invalid-fee':Count,'conflicting-free-fee':Count,'availability-exceeds-capacity':Count}),
});
export function summarizeParking(records: readonly ParkingRecord[], quarantine: readonly ParkingQuarantine[]) {
  const coordinates={valid:0,missing:0,invalid:0,'out-of-area':0};const sourceDates={recent:0,stale:0,missing:0,invalid:0,future:0};
  const hours={parsed:0,missing:0,invalid:0,ambiguous:0};const fees={paid:0,free:0,unknown:0};const availability={unavailable:0,unverified:0};
  const quarantineReasons={'invalid-row':0,'missing-id':0,'invalid-id':0,'missing-operator':0,'missing-name':0,'duplicate-id':0};
  const warningCounts={'invalid-capacity':0,'invalid-fee':0,'conflicting-free-fee':0,'availability-exceeds-capacity':0};
  const dates:string[]=[];let capacityMissing=0;let capacityZero=0;
  for(const row of records){coordinates[row.coordinates.status]++;sourceDates[row.sourceDate.status]++;fees[row.fees.kind]++;availability[row.availability.status]++;
    for(const period of [row.hours.weekday,row.hours.saturday,row.hours.holiday])hours[period.status]++;
    for(const warning of row.warnings)warningCounts[warning]++;
    if(row.totalSpaces===null)capacityMissing++;if(row.totalSpaces===0)capacityZero++;if(row.sourceDate.value)dates.push(row.sourceDate.value);
  }
  for(const row of quarantine)quarantineReasons[row.reason]++;dates.sort();
  return ParkingQualitySchema.parse({received:records.length+quarantine.length,normalized:records.length,quarantined:quarantine.length,
    uniqueSourceKeys:new Set(records.map(row=>row.sourceKey)).size,distinctManagementNumbers:new Set(records.map(row=>row.sourceId)).size,coordinates,sourceDates,hours,fees,availability,quarantineReasons,capacityMissing,capacityZero,
    sourceDateMin:dates[0]??null,sourceDateMax:dates.at(-1)??null,warningCounts});
}
export const ParkingSnapshotSchema=z.strictObject({
  version:z.literal(1),normalizationVersion:z.literal(2),source:z.strictObject({service:z.literal('busan-public-parking'),url:SafeHttpsSchema,licenseUrl:SafeHttpsSchema,
    credit:z.string().min(1),startedAt:z.iso.datetime(),completedAt:z.iso.datetime(),asOfDate:z.iso.date(),staleAfterDays:z.literal(30)}),
  pagination:z.strictObject({totalCount:Count,pageSize:z.number().int().min(1).max(100),pages:z.array(z.strictObject({pageNo:z.number().int().positive(),received:Count,fetchedAt:z.iso.datetime(),sha256:z.string().regex(/^[a-f0-9]{64}$/)})).min(1)}),
  records:z.array(ParkingRecordSchema),quarantine:z.array(ParkingQuarantineSchema),quality:ParkingQualitySchema,
}).superRefine((snapshot,ctx)=>{
  const count=snapshot.pagination.totalCount;
  const positions=[...snapshot.records,...snapshot.quarantine].map(row=>row.sourceRow).sort((a,b)=>a-b);
  const expectedPages=Math.max(1,Math.ceil(count/snapshot.pagination.pageSize));
  if(positions.length!==count||positions.some((value,index)=>value!==index)||new Set(snapshot.records.map(row=>row.sourceKey)).size!==snapshot.records.length
    ||snapshot.records.some(row=>row.sourceKey!==parkingSourceKey(row.operator,row.sourceId))
    ||snapshot.quarantine.some(row=>row.sourceKey!==null&&snapshot.records.some(record=>record.sourceKey===row.sourceKey))
    ||snapshot.pagination.pages.length!==expectedPages||snapshot.pagination.pages.some((page,index)=>page.pageNo!==index+1||page.received!==Math.min(snapshot.pagination.pageSize,count-index*snapshot.pagination.pageSize)))
    ctx.addIssue({code:'custom',message:'Incomplete or inconsistent parking snapshot'});
  if(JSON.stringify(summarizeParking(snapshot.records,snapshot.quarantine))!==JSON.stringify(snapshot.quality))ctx.addIssue({code:'custom',message:'Parking quality report mismatch'});
});
export type ParkingSnapshot=z.infer<typeof ParkingSnapshotSchema>;
