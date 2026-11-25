import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { GuideIdSchema, SUPPORTED_LOCALES, type GuideSnapshot } from '@trip-fit/domain';

const Labels = z.strictObject({ko:z.string().min(1),en:z.string().min(1),ja:z.string().min(1),'zh-CN':z.string().min(1),'zh-TW':z.string().min(1)});
export const FoodAssistanceConfigSchema = z.strictObject({
  version:z.literal(1), reviewedOn:z.iso.date(), reviewedBy:z.literal('assistant-source-evidence'),
  groups:z.array(z.strictObject({
    id:z.string().regex(/^[a-z-]+$/), labels:Labels,
    members:z.array(z.strictObject({
      id:GuideIdSchema, area:z.string().regex(/^[a-z-]+$/), fingerprint:z.string().regex(/^[a-f0-9]{64}$/),
      evidence:z.string().min(1), dish:z.strictObject({korean:z.string().min(1),labels:Labels}),
    })).min(2),
  })),
});
export type FoodAssistanceConfig = z.infer<typeof FoodAssistanceConfigSchema>;
export function assistanceFingerprint(snapshot:GuideSnapshot,id:string) {
  return createHash('sha256').update(JSON.stringify(SUPPORTED_LOCALES.flatMap(locale=>{
    const row=snapshot.languages.find(group=>group.locale===locale)?.records.find(row=>row.id===id);
    return row?[row]:[];
  }))).digest('hex');
}
export function loadFoodAssistanceConfig() {
  const input:unknown=JSON.parse(readFileSync(new URL('../../../../config/catalog/food-assistance.json',import.meta.url),'utf8'));
  const config=FoodAssistanceConfigSchema.parse(input);
  const ids=config.groups.flatMap(group=>group.members.map(member=>member.id));
  if(new Set(ids).size!==ids.length||new Set(config.groups.map(group=>group.id)).size!==config.groups.length)
    throw new Error('Duplicate food assistance identity');
  return config;
}
