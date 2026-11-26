import {z} from 'zod';
import {BuilderRefsSchema} from './course-builder.js';
import {LocaleSchema} from './schemas.js';
import {SafeHttpsSchema} from './offers.js';
export const MapModeSchema=z.enum(['recommended','walking','driving','transit']);
export const MapLinksQuerySchema=z.strictObject({locale:LocaleSchema.default('en'),mode:MapModeSchema.default('transit'),places:z.string().max(2000)});
export const MapRefsSchema=BuilderRefsSchema.refine(refs=>refs.length>0,'Select at least one place');
export const MapLinksSchema=z.strictObject({locale:LocaleSchema,mode:MapModeSchema,embedEnabled:z.boolean(),stops:z.array(z.strictObject({name:z.string(),position:z.number().int(),searchUrl:SafeHttpsSchema,embedUrl:SafeHttpsSchema.nullable()})),parts:z.array(z.strictObject({from:z.number().int(),to:z.number().int(),url:SafeHttpsSchema})),legs:z.array(z.strictObject({from:z.number().int(),to:z.number().int(),url:SafeHttpsSchema})),missingCoordinates:z.boolean()});
