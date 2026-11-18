import { z } from 'zod';
import { GuideRecordSchema, SafeHttpsSchema, type GuideKind, type GuideRecord, type Locale } from '@trip-fit/domain';
import { guideEndpoint } from '../../config/guides.js';
export class GuideApiError extends Error {
  constructor(public readonly code: 'unconfigured' | 'invalid-key' | 'authentication' | 'rate-limited' | 'http' | 'network' | 'timeout' | 'aborted' | 'too-large' | 'invalid-response' | 'incomplete') {
    super('Public guide service: ' + code); this.name = 'GuideApiError';
  }
}
const Count = z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).pipe(z.number().int().nonnegative());
const Text = z.string().max(100000).nullish();
const Row = z.object({
  UC_SEQ: z.union([z.number().int().nonnegative().transform(String), z.string().regex(/^\d{1,20}$/)]),
  MAIN_TITLE: Text, TITLE: Text, PLACE: Text, GUGUN_NM: Text, CATE2_NM: Text, ADDR1: Text, ADDR2: Text,
  RPRSNTV_MENU: Text, USAGE_DAY_WEEK_AND_TIME: Text, HLDY_INFO: Text, USAGE_AMOUNT: Text,
  TRFC_INFO: Text, CNTCT_TEL: Text, HOMEPAGE_URL: Text, ITEMCNTNTS: Text, MAIN_IMG_NORMAL: Text,
  LAT: z.unknown().optional(), LNG: z.unknown().optional(),
});
// Strip markup for readability; all source text is still rendered through React text nodes.
export function guideText(value: string | null | undefined): string {
  return (value ?? '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<(?:br\s*\/?|\/p|\/div|\/li)>/gi, '\n').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/g, "'")
    .replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
const optionalText = (value: string | null | undefined) => guideText(value) || null;
function safeLink(value: string | null | undefined, image = false) {
  const parsed = SafeHttpsSchema.safeParse(value?.trim());
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  if (image && (url.hostname !== 'www.visitbusan.net' || !url.pathname.startsWith('/uploadImgs/files/cntnts/'))) return null;
  return parsed.data;
}
function coordinate(value: unknown) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^-?\d+(\.\d+)?$/.test(value.trim()))) return null;
  const n = Number(value); return Number.isFinite(n) ? n : null;
}
export function parseGuidePage(input: unknown, kind: GuideKind, locale: Locale) {
  const root = z.record(z.string(), z.unknown()).safeParse(input);
  if (!root.success) throw new GuideApiError('invalid-response');
  if ('OpenAPI_ServiceResponse' in root.data) throw new GuideApiError('authentication');
  const parsed = z.object({ header: z.object({ code: z.string() }), pageNo: Count, numOfRows: Count, totalCount: Count, item: z.unknown().optional() }).safeParse(root.data[guideEndpoint(kind, locale)]);
  if (!parsed.success) throw new GuideApiError('invalid-response');
  const body = parsed.data;
  if (body.header.code !== '00') throw new GuideApiError(['30','31','32'].includes(body.header.code) ? 'authentication' : 'invalid-response');
  const rows: unknown[] = body.item === undefined || body.item === null || body.item === '' ? [] : Array.isArray(body.item) ? body.item : [body.item];
  const records: GuideRecord[] = [];
  for (const row of rows) {
    const result = Row.safeParse(row); if (!result.success) continue;
    const r = result.data;
    const name = guideText(r.TITLE) || guideText(r.PLACE) || guideText(r.MAIN_TITLE); if (!name) continue;
    const lat = coordinate(r.LAT); const lng = coordinate(r.LNG);
    const coordinates = lat !== null && lng !== null && lat >= 34.8 && lat <= 35.5 && lng >= 128.7 && lng <= 129.4 ? { lat, lng } : null;
    const record = GuideRecordSchema.safeParse({ id: r.UC_SEQ, locale, name, originalName: guideText(r.MAIN_TITLE), localizedTitle: Boolean(guideText(r.TITLE)),
      district: optionalText(r.GUGUN_NM), category: optionalText(r.CATE2_NM), address: optionalText([r.ADDR1,r.ADDR2].filter(Boolean).join(' ')),
      menu: optionalText(r.RPRSNTV_MENU), hours: optionalText(r.USAGE_DAY_WEEK_AND_TIME), holidays: optionalText(r.HLDY_INFO),
      fees: optionalText(r.USAGE_AMOUNT), transport: optionalText(r.TRFC_INFO), phone: optionalText(r.CNTCT_TEL), homepage: safeLink(r.HOMEPAGE_URL),
      description: guideText(r.ITEMCNTNTS), imageUrl: safeLink(r.MAIN_IMG_NORMAL,true), coordinates });
    if (record.success) records.push(record.data);
  }
  return { pageNo: body.pageNo, numOfRows: body.numOfRows, totalCount: body.totalCount, receivedCount: rows.length, rejectedCount: rows.length-records.length, records };
}
