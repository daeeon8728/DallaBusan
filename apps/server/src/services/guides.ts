import { GuideDetailSchema, GuideListSchema, type GuideKind, type GuideQuery, type GuideRecord, type GuideSnapshot, type Locale } from '@trip-fit/domain';
function publicRecord(row: GuideRecord, requestedLocale: Locale) {
  return { id: row.id, locale: row.locale, name: row.name, originalName: row.originalName, localizedTitle: row.localizedTitle,
    district: row.district, category: row.category, address: row.address, menu: row.menu, hours: row.hours, holidays: row.holidays,
    fees: row.fees, transport: row.transport, phone: row.phone, homepage: row.homepage, description: row.description, imageUrl: row.imageUrl,
    translationFallback: row.locale !== requestedLocale || (!row.localizedTitle && requestedLocale !== 'ko') };
}
const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ');
export function createGuideService(snapshots: Readonly<Partial<Record<GuideKind, GuideSnapshot | null>>>) {
  return {
    list(kind: GuideKind, query: GuideQuery) {
      const snapshot = snapshots[kind]; if (!snapshot) return null;
      const rows = snapshot.languages.find(group=>group.locale===query.locale)?.records ?? [];
      const q = normalize(query.q);
      const filtered = rows.filter(row=>(!q || normalize([row.name,row.originalName,row.description,row.menu,row.address,row.district,row.category].filter(Boolean).join(' ')).includes(q))
        && (!query.district || row.district===query.district) && (!query.category || row.category===query.category));
      const total = filtered.length; const pages = Math.ceil(total/12); const page = Math.min(query.page,Math.max(1,pages));
      return GuideListSchema.parse({kind,locale:query.locale,items:filtered.slice((page-1)*12,page*12).map(row=>publicRecord(row,query.locale)),
        source:snapshot.source,total,availableTotal:rows.length,page,pages,
        districts:[...new Set(rows.flatMap(row=>row.district?[row.district]:[]))].sort((a,b)=>a.localeCompare(b,query.locale)),
        categories:[...new Set(rows.flatMap(row=>row.category?[row.category]:[]))].sort((a,b)=>a.localeCompare(b,query.locale)) });
    },
    get(kind: GuideKind, id: string, locale: Locale) {
      const snapshot = snapshots[kind]; if (!snapshot) return null;
      const row = snapshot.languages.find(group=>group.locale===locale)?.records.find(row=>row.id===id)
        ?? snapshot.languages.find(group=>group.locale==='ko')?.records.find(row=>row.id===id);
      if (!row) return null;
      return GuideDetailSchema.parse({kind,requestedLocale:locale,item:publicRecord(row,locale),source:snapshot.source});
    },
    available(kind: GuideKind) { return Boolean(snapshots[kind]); },
  };
}
export type GuideService = ReturnType<typeof createGuideService>;
