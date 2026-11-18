import { LocaleSchema, type Locale } from '@trip-fit/domain';

export const ATTRACTION_BASE_URL = 'https://apis.data.go.kr/6260000/AttractionService/';
export const ATTRACTION_SOURCE_URL = 'https://www.data.go.kr/data/15063481/openapi.do';
export const ATTRACTION_ENDPOINTS: Readonly<Record<Locale, string>> = {
  ko: 'getAttractionKr', en: 'getAttractionEn', ja: 'getAttractionJa',
  'zh-CN': 'getAttractionZhs', 'zh-TW': 'getAttractionZht',
};
export function attractionEndpoint(locale: unknown) {
  return ATTRACTION_ENDPOINTS[LocaleSchema.parse(locale)];
}
