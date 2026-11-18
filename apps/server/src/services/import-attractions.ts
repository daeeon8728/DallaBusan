import { LocaleSchema, type Locale } from '@trip-fit/domain';
import { z } from 'zod';
import type { AttractionPage } from '../providers/attraction/parse.js';
import type { PageRequest, PageResult } from '../providers/attraction/client.js';
import { AttractionError, type AttractionErrorCode } from '../providers/attraction/errors.js';

export const ImportResultSchema = z.strictObject({
  locale: LocaleSchema, status: z.enum(['complete', 'partial', 'failed']),
  pages: z.number().int().nonnegative(), records: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(), warnings: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative().nullable(), reason: z.string().max(100).nullable(),
});
export type AttractionImportResult = z.infer<typeof ImportResultSchema>;
export interface AttractionPageSource { getPage(request: PageRequest, signal?: AbortSignal): Promise<PageResult> }
export async function importAttractions(
  source: AttractionPageSource, locale: Locale, options: { maxPages: number; pageSize: number },
  save: (records: AttractionPage['records'], fetchedAt: string) => void,
  signal?: AbortSignal,
): Promise<AttractionImportResult> {
  if (!Number.isInteger(options.maxPages) || options.maxPages < 1 || options.maxPages > 100
    || !Number.isInteger(options.pageSize) || options.pageSize < 1 || options.pageSize > 100)
    throw new Error('Invalid import limits');
  const summary: AttractionImportResult = {
    locale, status: 'partial', pages: 0, records: 0, rejected: 0, warnings: 0, totalCount: null, reason: null,
  };
  const seen = new Set<string>();
  let received = 0;
  for (let pageNo = 1; pageNo <= options.maxPages; pageNo++) {
    let result: PageResult;
    try { result = await source.getPage({ locale, pageNo, numOfRows: options.pageSize }, signal); }
    catch (error) {
      if (!(error instanceof AttractionError)) throw error;
      summary.status = summary.pages === 0 ? 'failed' : 'partial';
      summary.reason = error.code satisfies AttractionErrorCode;
      return summary;
    }
    if (result.freshness === 'stale') {
      summary.reason = 'stale-cache:' + result.failure;
      summary.status = summary.pages === 0 ? 'failed' : 'partial';
      return summary; // Last successful DB data remains available, never relabelled as new.
    }
    const page = result.page;
    if (summary.totalCount !== null && summary.totalCount !== page.totalCount) {
      summary.reason = 'total-count-changed'; return summary;
    }
    summary.totalCount = page.totalCount;
    const fresh = page.records.filter(record => !seen.has(record.sourceId));
    if (new Set(page.records.map(record => record.sourceId)).size !== page.records.length
      || fresh.length !== page.records.length) { summary.reason = 'duplicate-records'; return summary; }
    if (page.receivedCount === 0 && received < page.totalCount) { summary.reason = 'early-empty-page'; return summary; }
    save(fresh, result.fetchedAt);
    fresh.forEach(record => seen.add(record.sourceId));
    received += page.receivedCount;
    summary.pages++;
    summary.records += fresh.length;
    summary.rejected += page.rejectedCount;
    summary.warnings += fresh.reduce((count, record) => count + record.warnings.length, 0);
    if (received >= page.totalCount) {
      summary.status = received === page.totalCount && summary.rejected === 0 ? 'complete' : 'partial';
      summary.reason = summary.rejected ? 'rejected-records' : received > page.totalCount ? 'count-mismatch' : null;
      return summary;
    }
  }
  summary.reason = 'page-limit';
  return summary;
}
