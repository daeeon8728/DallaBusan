import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { CourseCategorySchema } from '@trip-fit/domain';
const Text = z.strictObject({ ko: z.string().min(1), en: z.string().min(1), ja: z.string().min(1), 'zh-CN': z.string().min(1), 'zh-TW': z.string().min(1) });
const Ref = z.object({ kind: z.enum(['destination', 'food']), id: z.string(), sha256: z.string().regex(/^[a-f0-9]{64}$/) });
export const CourseCatalogSchema = z.object({ version: z.literal(1), reviewedOn: z.string(), sources: z.array(Ref), items: z.array(z.object({ id: z.string().regex(/^(fa|da|fo|cu)[0-9]{2}$/), category: CourseCategorySchema, titles: Text, status: z.literal('editorial-idea'), steps: z.array(z.discriminatedUnion('kind', [z.object({ kind: z.literal('destination'), id: z.string() }), z.object({ kind: z.literal('food'), id: z.string() }), z.object({ kind: z.literal('note'), texts: Text })])).min(1) })) });
export type CourseCatalog = z.infer<typeof CourseCatalogSchema>;
export function loadCourseSourceRows() {
    const destinations = z.object({ destinations: z.array(z.object({ slug: z.string() }).passthrough()) }).parse(JSON.parse(readFileSync(new URL('../../../../config/catalog/destinations.json', import.meta.url), 'utf8')));
    const food = z.object({ languages: z.array(z.object({ locale: z.string(), records: z.array(z.object({ id: z.string() }).passthrough()) })) }).parse(JSON.parse(readFileSync(new URL('../../../../config/catalog/food.json', import.meta.url), 'utf8')));
    const byId = new Map<string, Record<string, unknown>>([...destinations.destinations.map(row => ['destination:' + row.slug, row] as const), ...(food.languages.find(group => group.locale === 'ko')?.records ?? []).map(row => ['food:' + row.id, row] as const)]);
    return byId;
}
export function selectSourceCheckedCourses(config: CourseCatalog, byId: ReadonlyMap<string, unknown>) {
    const valid = new Set(config.sources.filter(ref => { const row = byId.get(ref.kind + ':' + ref.id); return row && createHash('sha256').update(JSON.stringify(row)).digest('hex') === ref.sha256; }).map(ref => ref.kind + ':' + ref.id));
    if (new Set(config.items.map(item => item.id)).size !== config.items.length)
        throw new Error('Duplicate course identity');
    if (new Set(config.sources.map(ref => ref.kind + ':' + ref.id)).size !== config.sources.length)
        throw new Error('Duplicate source identity');
    return { ...config, items: config.items.filter(item => item.steps.every(step => step.kind === 'note' || valid.has(step.kind + ':' + step.id))) };
}
export function loadCourseCatalog() {
    const input: unknown = JSON.parse(readFileSync(new URL('../../../../config/catalog/courses.json', import.meta.url), 'utf8'));
    return selectSourceCheckedCourses(CourseCatalogSchema.parse(input), loadCourseSourceRows());
}
