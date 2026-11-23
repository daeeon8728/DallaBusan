import { useEffect, useState, type ReactNode } from 'react';
import { ExchangeRatesSchema } from '@trip-fit/domain';
import { ExchangeContext, type ExchangeState } from './context.js';
export function ExchangeProvider({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<ExchangeState, 'retry'>>({ rates: null, status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    let active = true;
    void fetch('/api/exchange-rates', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Rates unavailable');
      const raw: unknown = await response.json();
      const rates = ExchangeRatesSchema.parse(raw);
      if (active) setState({ rates, status: 'ready' });
    }).catch(() => { if (active) setState({ rates: null, status: 'failed' }); })
      .finally(() => window.clearTimeout(timeout));
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [attempt]);
  useEffect(() => { const timer = window.setInterval(() => setAttempt(value => value + 1), 3600000); return () => window.clearInterval(timer); }, []);
  return <ExchangeContext value={{ ...state, retry: () => setAttempt(value => value + 1) }}>{children}</ExchangeContext>;
}
