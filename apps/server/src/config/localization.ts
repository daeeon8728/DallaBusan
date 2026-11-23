import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { LocaleSchema, type Locale } from '@trip-fit/domain';
export const hasHangul = (text: string) => /[가-힣ㄱ-ㅎㅏ-ㅣ]/u.test(text);
export function localizationKey(text: string, source: Locale, target: Locale) { return createHash('sha256').update(source + '\0' + target + '\0' + text).digest('hex'); }
export function cleanLocalizedName(text: string) {
  if (!hasHangul(text)) return text;
  let result = text, previous = '';
  while (previous !== result) { previous = result; result = result.replace(/[（(]([^()（）]*[가-힣][^()（）]*)[)）]/gu, ''); }
  const clean = result.replace(/\s+/g, ' ').trim();
  // Only omit a redundant Korean name when an actual foreign name remains.
  return clean && /[A-Za-z\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(clean) && !hasHangul(clean) ? clean : text;
}
export const ContentTranslationsSchema = z.strictObject({ version: z.literal(1), authoredOn: z.iso.date(), engine: z.literal('google-translate-web-offline'), reviewStatus: z.literal('machine-unreviewed'), sourceUrl: z.literal('https://translate.google.com/'), units: z.array(z.strictObject({ key: z.string().regex(/^[a-f0-9]{64}$/), sourceLocale: LocaleSchema, targetLocale: LocaleSchema, sourceText: z.string().min(1).max(100000), translatedText: z.string().min(1).max(100000) })).max(20000) });
export interface TextLocalizer {
  readonly enabled: boolean;
  text(value: string, source: Locale, target: Locale, field?: string): { value: string; available: boolean; machine: boolean };
}
export const ORIGINAL_TEXT: TextLocalizer = { enabled: false, text: (value, source, target) => ({ value, available: source === target, machine: false }) };
export function createTextLocalizer(input: unknown): TextLocalizer {
  const file = ContentTranslationsSchema.parse(input); const units = new Map<string, string>();
  for (const unit of file.units) {
    if (unit.key !== localizationKey(unit.sourceText, unit.sourceLocale, unit.targetLocale) || units.has(unit.key) || unit.targetLocale !== 'ko' && hasHangul(unit.translatedText)) throw new Error('Invalid translation evidence');
    units.set(unit.key, unit.translatedText);
  }
  return { enabled: true, text(value, source, target, field) {
    if (source === target && target === 'ko') return { value, available: true, machine: false };
    const clean = field === 'name' ? cleanLocalizedName(value) : value;
    if (source === target && !hasHangul(clean) || !/[^\d\s:~.,/+\-–—()₩￦%℃°]/u.test(value)) return { value: clean, available: true, machine: false };
    const translated = units.get(localizationKey(value, source, target));
    return translated ? { value: translated, available: true, machine: true } : { value, available: false, machine: false };
  } };
}
export function loadTextLocalizer() { const raw: unknown = JSON.parse(readFileSync(new URL('../../../../config/catalog/content-translations.json', import.meta.url), 'utf8')); return createTextLocalizer(raw); }
export const PRODUCT_PHOTO_LABELS: Readonly<Record<Locale, string>> = { ko: '공식 상품 이미지', en: 'Official product image', ja: '公式商品画像', 'zh-CN': '官方商品图片', 'zh-TW': '官方商品圖片' };
