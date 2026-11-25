import {z}from'zod';
import {LocaleSchema}from'./schemas.js';
import {CourseStepSchema,CourseCategorySchema,CourseModeSchema}from'./courses.js';
import {PublicOfferSchema}from'./offers.js';
export const BUILDER_STOP_LIMIT=12;
export const BuilderRefSchema=z.strictObject({kind:z.enum(['destination','food']),id:z.string().regex(/^[A-Za-z0-9_-]{1,100}$/)});
export type BuilderRef=z.infer<typeof BuilderRefSchema>;
export const BuilderDraftRefSchema=BuilderRefSchema.extend({fromModule:z.string().regex(/^[A-Za-z0-9_-]{1,100}$/).optional()});
export type BuilderDraftRef=z.infer<typeof BuilderDraftRefSchema>;
export const BuilderThemeSchema=z.enum(['coast','culture','nature','cafe','shopping','sports','neighborhood']);
export const builderPlaceKey=(ref:BuilderRef)=>ref.kind+':'+ref.id;
export const BuilderRefsSchema=z.array(BuilderRefSchema).max(BUILDER_STOP_LIMIT).refine(refs=>new Set(refs.map(builderPlaceKey)).size===refs.length,'Duplicate stop');
export const BuilderDraftRefsSchema=z.array(BuilderDraftRefSchema).max(BUILDER_STOP_LIMIT).refine(refs=>new Set(refs.map(builderPlaceKey)).size===refs.length,'Duplicate stop');
export const BuilderPlaceSchema=CourseStepSchema.omit({kind:true,id:true,description:true}).extend({...BuilderRefSchema.shape,role:z.enum(['attraction','cafe','restaurant']).default('attraction')});
export const BuilderModuleSchema=z.strictObject({id:z.string(),sourceCourseId:z.string().nullable(),origin:z.enum(['original','shortened','curated']).default('original'),theme:BuilderThemeSchema.default('neighborhood'),band:z.enum(['short','long']).default('short'),area:z.string().default(''),areaCode:z.string().default(''),conditions:z.array(z.enum(['game-schedule','event-schedule','ticket-weather'])).default([]),referenceDistanceKm:z.number().nonnegative().nullable().default(null),visits:z.array(z.strictObject({ref:BuilderRefSchema,minutes:z.number().int().min(10).max(360)})).default([]),title:z.string(),category:CourseCategorySchema,mode:CourseModeSchema,isShort:z.boolean(),refs:BuilderRefsSchema,stayMinutes:z.number().nonnegative(),image:z.object({url:z.string(),credit:z.string()}).nullable()});
export const BuilderCatalogSchema=z.strictObject({locale:LocaleSchema,modules:z.array(BuilderModuleSchema),places:z.array(BuilderPlaceSchema),maxStops:z.literal(BUILDER_STOP_LIMIT),mapSourceUrl:z.string().url()});
export const BuilderOffersSchema=z.strictObject({locale:LocaleSchema,refs:BuilderRefsSchema,groups:z.array(z.strictObject({ref:BuilderRefSchema,name:z.string(),items:z.array(PublicOfferSchema).max(3)})).max(BUILDER_STOP_LIMIT),stays:z.array(PublicOfferSchema).max(3)});
export type BuilderModule=z.infer<typeof BuilderModuleSchema>;
export type BuilderCatalog=z.infer<typeof BuilderCatalogSchema>;
export type BuilderPlace=z.infer<typeof BuilderPlaceSchema>;
export function appendBuilderRefs<T extends BuilderRef>(current:T[],incoming:T[]){const seen=new Set(current.map(builderPlaceKey));const added=incoming.filter(ref=>{const key=builderPlaceKey(ref);if(seen.has(key))return false;seen.add(key);return true;});return current.length+added.length>BUILDER_STOP_LIMIT?{refs:current,added:0,limit:true}:{refs:[...current,...added],added:added.length,limit:false};}
export function builderDistanceKm(a:{lat:number;lng:number},b:{lat:number;lng:number}){const rad=(n:number)=>n*Math.PI/180;return 6371*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lng-a.lng)/2)**2)));}
