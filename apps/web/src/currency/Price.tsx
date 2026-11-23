import { convertDisplayAmount, DEFAULT_CURRENCY_BY_LOCALE, exchangeDates, type Currency, type Locale } from '@trip-fit/domain';
import { useExchange } from './context.js';
import { formatCartMoney } from '../cart/money.js';
import { getExchangeCopy } from '../i18n/exchange.js';
export function Price({ amount, currency, locale }: { amount: string; currency: Currency; locale: Locale }) {
  const { rates, status } = useExchange(); const target = DEFAULT_CURRENCY_BY_LOCALE[locale]; const copy = getExchangeCopy(locale);
  const converted = currency !== target && rates !== null;
  const shown = converted ? convertDisplayAmount(amount, currency, target, rates) : amount;
  return <span className="display-price" data-testid="display-price" data-price-currency={converted ? target : currency}>
    <span>{converted ? '≈ ' : ''}{formatCartMoney(shown, converted ? target : currency, locale)}</span>
    {converted && <small className="fx-original">{copy.original}: {formatCartMoney(amount, currency, locale)}</small>}
    {!rates && currency !== target && <small className="fx-original">{status === 'loading' ? copy.pending : copy.failed}</small>}
  </span>;
}
export function ExchangeNotice({ locale }: { locale: Locale }) {
  const { rates, status, retry } = useExchange(); const copy = getExchangeCopy(locale);
  return <div className="exchange-notice" data-testid="exchange-notice" aria-live="polite">
    {rates ? <><span>{DEFAULT_CURRENCY_BY_LOCALE[locale]} · {copy.estimated} · {copy.date}: {exchangeDates(rates)}{rates.stale ? ' · ' + copy.stale : ''}</span><span>{copy.note}</span><a href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer">{copy.source}: Frankfurter</a></> : <span>{status === 'loading' ? copy.pending : copy.failed}</span>}
    <button onClick={retry}>{copy.retry}</button>
  </div>;
}
