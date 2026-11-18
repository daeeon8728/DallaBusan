import type { Locale } from '@trip-fit/domain';
import ko from './ko.json';
import en from './en.json';
import ja from './ja.json';
import zhCN from './zh-CN.json';
import zhTW from './zh-TW.json';

const COPY = { ko, en, ja, 'zh-CN': zhCN, 'zh-TW': zhTW } satisfies Record<Locale, typeof ko>;
export const LANGUAGE_OPTIONS = [
  { locale: 'ko', label: '한국어' }, { locale: 'en', label: 'English' },
  { locale: 'ja', label: '日本語' }, { locale: 'zh-CN', label: '简体中文' },
  { locale: 'zh-TW', label: '繁體中文' },
] as const;
export function getCopy(locale: Locale) { return COPY[locale]; }
