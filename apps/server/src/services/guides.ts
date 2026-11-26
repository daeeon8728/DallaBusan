import type { FoodVisibility } from '../config/food-visibility.js';
import { GuideDetailSchema, GuideListSchema, type GuideKind, type GuideQuery, type GuideRecord, type GuideSnapshot, type Locale } from '@trip-fit/domain';
import { ORIGINAL_TEXT, type TextLocalizer } from '../config/localization.js';
const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ');
export function localizeGuideRecord(row: GuideRecord, locale: Locale, text: TextLocalizer) {
  if (!text.enabled) return { row, machine: false };
  const fields = ['name','district','category','address','menu','hours','holidays','fees','transport','description','phone'] as const;
  const value = {...row}; let available = true, machine = false;
  for (const field of fields) { const original = row[field]; if (original === null) continue; const result = text.text(original,row.locale,locale,field); available &&= result.available; machine ||= result.machine;
    if (field === 'name' || field === 'description') value[field] = result.value; else value[field] = result.value;
  }
  return available ? { row: {...value,locale,localizedTitle:true}, machine } : { row, machine:false };
}
function publicRecord(row: GuideRecord, requestedLocale: Locale, machine: boolean) {
  return { id: row.id, locale: row.locale, name: row.name, originalName: row.originalName, localizedTitle: row.localizedTitle,
    district: row.district, category: row.category, address: row.address, menu: row.menu, hours: row.hours, holidays: row.holidays,
    fees: row.fees, transport: row.transport, phone: row.phone, homepage: row.homepage, description: row.description, imageUrl: row.imageUrl,
    contentTranslation:machine?'machine':'source', translationFallback: row.locale !== requestedLocale || (!row.localizedTitle && requestedLocale !== 'ko') };
}
export function createGuideService(snapshots: Readonly<Partial<Record<GuideKind, GuideSnapshot | null>>>, text: TextLocalizer = ORIGINAL_TEXT, foodVisibility?: FoodVisibility, foodPhotos: ReadonlyMap<string,string> = new Map(),foodPhotoCredits:ReadonlyMap<string,{credit:string;sourceUrl:string}>=new Map()) {
  const photo = (kind: GuideKind, value: ReturnType<typeof localizeGuideRecord>) => {
    const url = kind === 'food' ? foodPhotos.get(value.row.id) : undefined;
    return url ? {...value,row:{...value.row,imageUrl:url}} : value;
  };
  const record=(kind:GuideKind,row:GuideRecord,locale:Locale,machine:boolean)=>({...publicRecord(row,locale,machine),imageCredit:kind==='food'?foodPhotoCredits.get(row.id)?.credit??null:null,imageSourceUrl:kind==='food'?foodPhotoCredits.get(row.id)?.sourceUrl??null:null});
  const cache = new Map<string, ReturnType<typeof localizeGuideRecord>[]>();
  function records(kind: GuideKind, locale: Locale) {
    const key=kind+'|'+locale;const cached=cache.get(key);if(cached)return cached;
    const snapshot=snapshots[kind];if(!snapshot)return [];
    const native=snapshot.languages.find(group=>group.locale===locale)?.records??[];
    const byId=new Map(native.map(row=>[row.id,row]));
    if(text.enabled && kind==='food')for(const language of ['ko','en','ja','zh-CN','zh-TW'])for(const row of snapshot.languages.find(group=>group.locale===language)?.records??[])if(!byId.has(row.id))byId.set(row.id,row);
    const rows=[...byId.values()].filter(row=>kind!=='food'||!foodVisibility?.excludedIds.has(row.id)).map(row=>photo(kind,localizeGuideRecord(row,locale,text)));cache.set(key,rows);return rows;
  }
  function source(snapshot: GuideSnapshot,locale: Locale) { return {...snapshot.source,credit:text.text(snapshot.source.credit,'ko',locale).value}; }
  return {
    list(kind: GuideKind, query: GuideQuery) {
      const snapshot=snapshots[kind];if(!snapshot)return null;const rows=records(kind,query.locale);const q=normalize(query.q);
      const filtered=rows.filter(({row})=>(!q||normalize([row.name,row.originalName,row.description,row.menu,row.address,row.district,row.category].filter(Boolean).join(' ')).includes(q))&&(!query.district||row.district===query.district)&&(!query.category||row.category===query.category));
      const total=filtered.length,pages=Math.ceil(total/12),page=Math.min(query.page,Math.max(1,pages));
      return GuideListSchema.parse({kind,locale:query.locale,items:filtered.slice((page-1)*12,page*12).map(({row,machine})=>record(kind,row,query.locale,machine)),source:source(snapshot,query.locale),total,availableTotal:rows.length,page,pages,
        districts:[...new Set(rows.flatMap(({row})=>row.district?[row.district]:[]))].sort((a,b)=>a.localeCompare(b,query.locale)),categories:[...new Set(rows.flatMap(({row})=>row.category?[row.category]:[]))].sort((a,b)=>a.localeCompare(b,query.locale))});
    },
    get(kind: GuideKind,id: string,locale: Locale) {
      const snapshot=snapshots[kind];if(!snapshot||kind==='food'&&foodVisibility?.excludedIds.has(id))return null;
      const found=records(kind,locale).find(value=>value.row.id===id);
      const fallback=snapshot.languages.find(group=>group.locale==='ko')?.records.find(row=>row.id===id);
      const value=found??(fallback?photo(kind,localizeGuideRecord(fallback,locale,text)):null);if(!value)return null;
      return GuideDetailSchema.parse({kind,requestedLocale:locale,item:record(kind,value.row,locale,value.machine),source:source(snapshot,locale)});
    },
    available(kind: GuideKind) { return Boolean(snapshots[kind]); },
  };
}
export type GuideService = ReturnType<typeof createGuideService>;
