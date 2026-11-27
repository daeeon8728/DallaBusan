import { LocaleSchema, type Locale } from '@trip-fit/domain';

export function readUiLocale(search: string): Locale {
  const parsed=LocaleSchema.safeParse(new URLSearchParams(search).get('locale'));
  return parsed.success ? parsed.data : 'ko';
}
