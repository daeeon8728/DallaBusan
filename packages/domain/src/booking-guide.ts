import{z}from'zod';
import{LocaleSchema}from'./schemas.js';
import{SafeHttpsSchema}from'./offers.js';
export const BookingGuideFieldSchema=z.enum(['guide-language','foreign-participation','children','meeting-point','cancellation','extra-costs','payment']);
export const BookingGuideClaimStatusSchema=z.enum(['source-listed','check-required','conflicting','unknown']);
export const BookingGuideClaimSchema=z.strictObject({field:BookingGuideFieldSchema,status:BookingGuideClaimStatusSchema,text:z.string().min(1).max(1200).nullable(),evidence:z.array(z.strictObject({url:SafeHttpsSchema,excerpt:z.string().min(1).max(400),locale:LocaleSchema})).max(3)}).superRefine((claim,ctx)=>{if(claim.status==='unknown'?(claim.text!==null||claim.evidence.length!==0):(!claim.text||claim.evidence.length===0))ctx.addIssue({code:'custom',message:'Claim needs matching evidence or an empty unknown state'});if(claim.status==='conflicting'&&claim.evidence.length<2)ctx.addIssue({code:'custom',message:'Conflicting claims need both excerpts'});});
export const BookingGuideSchema=z.strictObject({offerId:z.string(),locale:LocaleSchema,status:z.enum(['partial','unreviewed','expired','source-changed']),reviewedOn:z.iso.date().nullable(),validUntil:z.iso.datetime().nullable(),bookingLocale:LocaleSchema.nullable(),claims:z.array(BookingGuideClaimSchema).length(7)}).superRefine((guide,ctx)=>{if(new Set(guide.claims.map(c=>c.field)).size!==7)ctx.addIssue({code:'custom',message:'Each booking field is required exactly once'});});
export type BookingGuide=z.infer<typeof BookingGuideSchema>;
