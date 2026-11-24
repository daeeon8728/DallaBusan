import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {SafeHttpsSchema} from '@trip-fit/domain';
export const OfferRecommendationGroupsSchema=z.array(z.strictObject({id:z.string().regex(/^[a-z0-9-]+$/),members:z.array(z.strictObject({offerId:z.string().min(1),sourceHash:z.string().regex(/^[a-f0-9]{64}$/),evidenceUrl:SafeHttpsSchema})).min(2)}));
export function offerRecommendationFingerprint(offer:{providerId:string;externalId:string;titleLocale:string;title:string;sourceUrl:string;category:string;scope:string}){
 return createHash('sha256').update(JSON.stringify([offer.providerId,offer.externalId,offer.titleLocale,offer.title,offer.sourceUrl,offer.category,offer.scope])).digest('hex');
}
export function loadOfferRecommendationGroups(){
 const input:unknown=JSON.parse(readFileSync(new URL('../../../../config/catalog/offer-recommendations.json',import.meta.url),'utf8'));
 const data=z.strictObject({reviewedOn:z.iso.date(),kind:z.literal('editorial-experience-types'),evidenceStatus:z.literal('assistant-source-evidence'),basis:z.string().min(1),groups:OfferRecommendationGroupsSchema}).parse(input);
 if(new Set(data.groups.map(group=>group.id)).size!==data.groups.length||data.groups.some(group=>new Set(group.members.map(item=>item.offerId)).size!==group.members.length))throw Error('Duplicate experience curation identity');
 return data.groups;
}
