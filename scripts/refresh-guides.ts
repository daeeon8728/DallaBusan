import { GuideKindSchema } from '@trip-fit/domain';
import { loadGuideApiConfig } from '../apps/server/src/config/env.js';
import { guideSnapshotPath } from '../apps/server/src/config/guides.js';
import { collectGuides, publishGuideSnapshot } from '../apps/server/src/services/refresh-guides.js';
async function main() {
  const kind = GuideKindSchema.parse(process.argv[2]);
  const snapshot = await collectGuides(kind,loadGuideApiConfig(kind));
  await publishGuideSnapshot(snapshot,guideSnapshotPath(kind));
  console.log(JSON.stringify({kind,collectedAt:snapshot.source.collectedAt,languages:snapshot.languages.map(group=>({locale:group.locale,total:group.total,photos:group.records.filter(row=>row.imageUrl).length}))}));
}
main().catch(()=>{console.error('Public guide refresh failed. Last published snapshot preserved; credentials and upstream URLs redacted.');process.exitCode=1;});
