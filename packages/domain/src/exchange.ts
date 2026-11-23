import { z } from 'zod';
import { CurrencySchema, type Currency } from './schemas.js';
const DecimalSchema = z.string().max(128).regex(/^(0|[1-9]\d*)(\.\d+)?$/);
export const ExchangeRatesSchema = z.strictObject({
  source: z.literal('Frankfurter'), base: z.literal('USD'), fetchedAt: z.iso.datetime(), stale: z.boolean(),
  rates: z.array(z.strictObject({ currency: CurrencySchema, rate: DecimalSchema.refine(value => /[1-9]/.test(value)), date: z.iso.date() })).length(5),
}).refine(value => new Set(value.rates.map(rate => rate.currency)).size === 5 && value.rates.some(rate => rate.currency === 'USD' && rate.rate === '1'), 'Invalid rate coverage');
export type ExchangeRates = z.infer<typeof ExchangeRatesSchema>;
export const CURRENCY_DECIMALS: Readonly<Record<Currency, number>> = { KRW: 0, USD: 2, JPY: 0, CNY: 2, TWD: 2 };
function fraction(value: string) {
  const [whole, decimals = ''] = DecimalSchema.parse(value).split('.');
  if (whole === undefined) throw new Error('Invalid amount');
  return { units: BigInt(whole + decimals), scale: 10n ** BigInt(decimals.length) };
}
/** Round half up exactly once per displayed unit. Quantity multiplies that unit. */
export function convertDisplayAmount(amount: string, from: Currency, to: Currency, rates: ExchangeRates): string {
  const input = fraction(amount);
  if (from === to) return amount;
  const source = rates.rates.find(row => row.currency === from);
  const target = rates.rates.find(row => row.currency === to);
  if (!source || !target) throw new Error('Missing exchange rate');
  const a = fraction(source.rate), b = fraction(target.rate), digits = CURRENCY_DECIMALS[to];
  const numerator = input.units * b.units * a.scale * 10n ** BigInt(digits);
  const denominator = input.scale * b.scale * a.units;
  const rounded = (numerator * 2n + denominator) / (denominator * 2n);
  const raw = rounded.toString().padStart(digits + 1, '0');
  return digits === 0 ? raw : raw.slice(0, -digits) + '.' + raw.slice(-digits);
}
export function exchangeDates(rates: ExchangeRates) {
  const dates = rates.rates.filter(row => row.currency !== 'USD').map(row => row.date).sort();
  return dates[0] === dates.at(-1) ? dates[0] : dates[0] + ' – ' + dates.at(-1);
}
