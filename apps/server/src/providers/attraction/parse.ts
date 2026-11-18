import { z } from 'zod';
import type { Locale } from '@trip-fit/domain';
import { AttractionError } from './errors.js';
import { attractionEndpoint } from './locales.js';

const Count = z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).pipe(z.number().int().nonnegative());
const Text = z.string().max(100_000).nullish();
const SourceId = z.union([z.number().int().nonnegative().transform(String), z.string().trim().regex(/^\d{1,20}$/)]);
const RowSchema = z.object({
  UC_SEQ: SourceId, MAIN_TITLE: Text, TITLE: Text, GUGUN_NM: Text,
  LAT: z.unknown().optional(), LNG: z.unknown().optional(),
  MAIN_IMG_NORMAL: Text, ITEMCNTNTS: Text, HLDY_INFO: Text, ADDR1: Text, MAIN_IMG_THUMB: Text, CNTCT_TEL: Text, HOMEPAGE_URL: Text, TRFC_INFO: Text, USAGE_DAY_WEEK_AND_TIME: Text, USAGE_AMOUNT: Text,
});
const EnvelopeSchema = z.object({
  header: z.object({ code: z.string(), message: z.string().optional() }),
  pageNo: Count.pipe(z.number().positive()), numOfRows: Count.pipe(z.number().positive()),
  totalCount: Count, item: z.unknown().optional(),
});
export const AttractionRecordSchema = z.strictObject({
  sourceId: z.string().regex(/^\d{1,20}$/),
  title: z.string().min(1), originalTitle: z.string(),
  districtRaw: z.string().nullable(),
  coordinates: z.strictObject({ lat: z.number().min(34.8).max(35.5), lng: z.number().min(128.7).max(129.4) }).nullable(),
  imageUrl: z.url().nullable(), imageThumbUrl: z.url().nullable().default(null),
  contactRaw: z.string().nullable().default(null), homepageRaw: z.string().nullable().default(null),
  transportRaw: z.string().nullable().default(null), hoursRaw: z.string().nullable().default(null), feeRaw: z.string().nullable().default(null),
  addressRaw: z.string().nullable().default(null), descriptionRaw: z.string(), holidayInfoRaw: z.string().nullable(),
  warnings: z.array(z.enum(['invalid-coordinates', 'invalid-image', 'missing-localized-title'])),
});
export const AttractionPageSchema = z.strictObject({
  pageNo: z.number().int().positive(), numOfRows: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(), receivedCount: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(), records: z.array(AttractionRecordSchema),
});
export type AttractionRecord = z.infer<typeof AttractionRecordSchema>;
export type AttractionPage = z.infer<typeof AttractionPageSchema>;

function coordinate(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^-?\d+(\.\d+)?$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function imageUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
export function parseAttractionPage(input: unknown, locale: Locale): AttractionPage {
  const root = z.record(z.string(), z.unknown()).safeParse(input);
  if (!root.success) throw new AttractionError('invalid-response');
  const candidate = root.data[attractionEndpoint(locale)];
  const header = z.object({ header: z.object({ code: z.string() }) }).safeParse(candidate);
  if (header.success && header.data.header.code !== '00')
    throw new AttractionError(['30', '31', '32'].includes(header.data.header.code) ? 'authentication' : 'business');
  const body = EnvelopeSchema.safeParse(candidate);
  if (!body.success) {
    // JSON gateway errors and unexpected envelopes are failures, even with HTTP 200.
    if ('OpenAPI_ServiceResponse' in root.data) throw new AttractionError('authentication');
    throw new AttractionError('invalid-response');
  }
  if (body.data.header.code !== '00') {
    throw new AttractionError(['30', '31', '32'].includes(body.data.header.code) ? 'authentication' : 'business');
  }
  const item = body.data.item;
  const rows: unknown[] = item === undefined || item === null || item === ''
    ? [] : Array.isArray(item) ? item : [item];
  const records: AttractionRecord[] = [];
  for (const row of rows) {
    const parsed = RowSchema.safeParse(row);
    if (!parsed.success) continue;
    const value = parsed.data;
    const localized = value.TITLE?.trim();
    const title = localized || value.MAIN_TITLE?.trim();
    if (!title) continue;
    const lat = coordinate(value.LAT);
    const lng = coordinate(value.LNG);
    // Conservative Busan-area guard, not an administrative-boundary assertion.
    const coordinates = lat !== null && lng !== null && lat >= 34.8 && lat <= 35.5 && lng >= 128.7 && lng <= 129.4
      ? { lat, lng } : null;
    const image = imageUrl(value.MAIN_IMG_NORMAL);
    const warnings: AttractionRecord['warnings'] = [];
    if (!coordinates) warnings.push('invalid-coordinates');
    if (value.MAIN_IMG_NORMAL?.trim() && !image) warnings.push('invalid-image');
    if (!localized) warnings.push('missing-localized-title');
    records.push({
      sourceId: value.UC_SEQ, title, originalTitle: value.MAIN_TITLE ?? '',
      districtRaw: value.GUGUN_NM?.trim() || null, coordinates, imageUrl: image,
      imageThumbUrl: imageUrl(value.MAIN_IMG_THUMB), contactRaw: value.CNTCT_TEL?.trim() || null, homepageRaw: value.HOMEPAGE_URL?.trim() || null,
      transportRaw: value.TRFC_INFO?.trim() || null, hoursRaw: value.USAGE_DAY_WEEK_AND_TIME?.trim() || null, feeRaw: value.USAGE_AMOUNT?.trim() || null,
      addressRaw: value.ADDR1?.trim() || null, descriptionRaw: value.ITEMCNTNTS ?? '', holidayInfoRaw: value.HLDY_INFO?.trim() || null, warnings,
    });
  }
  return AttractionPageSchema.parse({
    pageNo: body.data.pageNo, numOfRows: body.data.numOfRows, totalCount: body.data.totalCount,
    receivedCount: rows.length, rejectedCount: rows.length - records.length, records,
  });
}
