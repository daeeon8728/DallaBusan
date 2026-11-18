import { readFileSync } from 'node:fs';
import { GuideSnapshotSchema, type GuideKind, type Locale } from '@trip-fit/domain';
export const GUIDE_SOURCES = {
  food: { baseUrl: 'https://apis.data.go.kr/6260000/FoodService/', prefix: 'getFood', sourceUrl: 'https://www.data.go.kr/data/15063472/openapi.do' },
  recommended: { baseUrl: 'https://apis.data.go.kr/6260000/RecommendedService/', prefix: 'getRecommended', sourceUrl: 'https://www.data.go.kr/data/15063506/openapi.do' },
};
const SUFFIXES: Readonly<Record<Locale, string>> = { ko: 'Kr', en: 'En', ja: 'Ja', 'zh-CN': 'Zhs', 'zh-TW': 'Zht' };
export function guideEndpoint(kind: GuideKind, locale: Locale) { return GUIDE_SOURCES[kind].prefix + SUFFIXES[locale]; }
export function guideSnapshotPath(kind: GuideKind) { return new URL('../../../../config/catalog/' + kind + '.json', import.meta.url); }
export function loadGuideSnapshot(kind: GuideKind) {
  const file = guideSnapshotPath(kind);
  let raw: string;
  try { raw = readFileSync(file, 'utf8'); } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null;
    throw new Error('Public guide snapshot cannot be read', { cause: error });
  }
  try {
    const value: unknown = JSON.parse(raw);
    const result = GuideSnapshotSchema.parse(value);
    if (result.kind !== kind || result.source.url !== GUIDE_SOURCES[kind].sourceUrl) throw new Error();
    return result;
  } catch { throw new Error('Invalid public guide snapshot'); }
}
