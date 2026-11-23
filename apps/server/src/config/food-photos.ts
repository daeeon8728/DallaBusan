import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { GuideIdSchema, SafeHttpsSchema, type GuideSnapshot } from '@trip-fit/domain';
import { foodIdentityFingerprint, type FoodVisibility } from './food-visibility.js';
const Fingerprint = z.string().regex(/^[a-f0-9]{64}$/);
const PhotoRule = z.strictObject({
  targetId: GuideIdSchema, sourceId: GuideIdSchema, targetFingerprint: Fingerprint, sourceFingerprint: Fingerprint,
  originalImageUrl: SafeHttpsSchema.nullable(), imageUrl: SafeHttpsSchema, sourceUrl: SafeHttpsSchema,
  evidence: z.array(z.strictObject({ url: SafeHttpsSchema, excerpt: z.string().min(1).max(2000) })).min(2),
  reviewNote: z.string().min(1).max(2000),
});
export const FoodPhotoOverridesSchema = z.strictObject({
  version: z.literal(1), reviewedOn: z.iso.date(), reviewedBy: z.literal('assistant-source-evidence'),
  sourceDatasetUrl: SafeHttpsSchema, licenseUrl: SafeHttpsSchema, rules: z.array(PhotoRule),
});
// Explicit reviewed pairs only. Neither names nor proximity automatically establish identity.
// Keep the original source and duplicate policy intact; fail closed if either record changes.
export function createFoodPhotoOverrides(snapshot: GuideSnapshot, visibility: FoodVisibility, input: unknown): ReadonlyMap<string, string> {
  const policy = FoodPhotoOverridesSchema.parse(input);
  if (snapshot.kind !== 'food' || policy.sourceDatasetUrl !== snapshot.source.url || policy.licenseUrl !== snapshot.source.licenseUrl)
    throw new Error('Food photo source or license changed; review required');
  const result = new Map<string, string>();
  for (const rule of policy.rules) {
    const targets = snapshot.languages.flatMap(group => group.records.filter(row => row.id === rule.targetId));
    const sources = snapshot.languages.flatMap(group => group.records.filter(row => row.id === rule.sourceId));
    const origin = new URL(rule.sourceUrl);
    if (rule.targetId === rule.sourceId || result.has(rule.targetId) || !targets.length || !sources.length || visibility.excludedIds.has(rule.targetId) || visibility.excludedIds.has(rule.sourceId))
      throw new Error('Invalid food photo identity');
    if (origin.hostname !== 'www.visitbusan.net' || origin.pathname !== '/index.do' || origin.searchParams.getAll('uc_seq').length !== 1 || origin.searchParams.get('uc_seq') !== rule.sourceId)
      throw new Error('Food photo attribution identity mismatch');
    if (targets.some(row => row.imageUrl !== rule.originalImageUrl) || sources.some(row => row.imageUrl !== rule.imageUrl) || new URL(rule.imageUrl).hostname !== 'www.visitbusan.net')
      throw new Error('Food photo URL changed; review required');
    if (foodIdentityFingerprint(snapshot, rule.targetId) !== rule.targetFingerprint || foodIdentityFingerprint(snapshot, rule.sourceId) !== rule.sourceFingerprint)
      throw new Error('Food photo source changed; review required');
    result.set(rule.targetId, rule.imageUrl);
  }
  return result;
}
export function loadFoodPhotoOverrides(snapshot: GuideSnapshot, visibility: FoodVisibility) {
  const input: unknown = JSON.parse(readFileSync(new URL('../../../../config/catalog/food-photo-overrides.json', import.meta.url), 'utf8'));
  return createFoodPhotoOverrides(snapshot, visibility, input);
}
