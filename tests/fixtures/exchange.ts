import { ExchangeRatesSchema } from '@trip-fit/domain';
export function exchangeFixture(date = new Date().toISOString().slice(0, 10)) {
  return ExchangeRatesSchema.parse({ source: 'Frankfurter', base: 'USD', fetchedAt: date + 'T12:00:00.000Z', stale: false,
    rates: [{ currency: 'USD', rate: '1', date }, { currency: 'KRW', rate: '1400', date }, { currency: 'JPY', rate: '150', date }, { currency: 'CNY', rate: '7', date }, { currency: 'TWD', rate: '32', date }] });
}
export function exchangeRows(date: string) { return exchangeFixture(date).rates.filter(row => row.currency !== 'USD').map(row => ({ base: 'USD', quote: row.currency, rate: Number(row.rate), date: row.date })); }
