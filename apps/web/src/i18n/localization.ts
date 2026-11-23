import type { Locale } from '@trip-fit/domain';
const COPY={ko:{machine:'자동 번역된 안내입니다. 세부 내용은 원문과 함께 확인해 주세요.',original:'현지 원문 이름'},en:{machine:'Machine-translated information. Check the original source for details.',original:'Original local name'},ja:{machine:'自動翻訳の案内です。詳細は原文もご確認ください。',original:'現地の原文名'},'zh-CN':{machine:'此信息为机器翻译，详情请同时核对原文。',original:'当地原文名称'},'zh-TW':{machine:'此資訊為機器翻譯，詳情請同時核對原文。',original:'當地原文名稱'}} satisfies Record<Locale,Record<string,string>>;
export function getLocalizationCopy(locale: Locale){return COPY[locale];}
