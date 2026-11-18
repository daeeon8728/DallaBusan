import { z } from 'zod';

export const SUPPORTED_LOCALES = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'] as const;
export const LocaleSchema = z.enum(SUPPORTED_LOCALES);
export const CurrencySchema = z.enum(['KRW', 'USD', 'JPY', 'CNY', 'TWD']);
export type Locale = z.infer<typeof LocaleSchema>;
export type Currency = z.infer<typeof CurrencySchema>;

export const DEFAULT_CURRENCY_BY_LOCALE = {
  ko: 'KRW', en: 'USD', ja: 'JPY', 'zh-CN': 'CNY', 'zh-TW': 'TWD',
} as const satisfies Record<Locale, Currency>;

export const HealthResponseSchema = z.strictObject({
  status: z.literal('ok'),
  service: z.literal('trip-fit-api'),
  stage: z.literal(1),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
