import { writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { GuideSnapshotSchema, SUPPORTED_LOCALES, type GuideKind, type GuideSnapshot } from '@trip-fit/domain';
import type { GuideApiConfig } from '../config/env.js';
import { GUIDE_SOURCES } from '../config/guides.js';
import { createGuideClient } from '../providers/guides/client.js';
import { GuideApiError } from '../providers/guides/parse.js';
export async function collectGuides(kind: GuideKind, config: GuideApiConfig, fetcher: typeof fetch = fetch): Promise<GuideSnapshot> {
  const client = createGuideClient(config,fetcher); const languages: GuideSnapshot['languages'] = [];
  for (const locale of SUPPORTED_LOCALES) {
    const records: GuideSnapshot['languages'][number]['records'] = []; let total: number | null = null;
    for (let pageNo=1; pageNo<=config.maxPages; pageNo++) {
      const page = await client.getPage(kind,locale,pageNo);
      if (total === null) total = page.totalCount;
      if (page.totalCount !== total || page.rejectedCount || new Set(page.records.map(row=>row.id)).size !== page.records.length || page.records.some(row=>records.some(old=>old.id===row.id))) throw new GuideApiError('incomplete');
      records.push(...page.records);
      if (records.length === total) break;
      if (page.receivedCount !== config.pageSize || records.length > total || pageNo === config.maxPages) throw new GuideApiError('incomplete');
    }
    if (total === null || records.length !== total) throw new GuideApiError('incomplete');
    languages.push({locale,total,records});
  }
  // Separate language records and source IDs are preserved; no fuzzy place merging.
  return GuideSnapshotSchema.parse({ version: 1, kind, source: { url: GUIDE_SOURCES[kind].sourceUrl,
    licenseUrl: 'https://www.data.go.kr/ugs/selectPortalPolicyView.do', credit: '부산광역시 · Visit Busan', collectedAt: new Date().toISOString() }, languages });
}
export async function publishGuideSnapshot(snapshot: GuideSnapshot, destination: URL) {
  const checked = GuideSnapshotSchema.parse(snapshot);
  const pending = new URL(destination.href + '.' + randomUUID() + '.pending');
  try { await writeFile(pending, JSON.stringify(checked,null,2)+'\n', { flag: 'wx' }); await rename(pending,destination); }
  finally { await unlink(pending).catch(()=>undefined); }
}
