import { createContext, useContext } from 'react';
import type { ExchangeRates } from '@trip-fit/domain';
export interface ExchangeState { rates: ExchangeRates | null; status: 'loading' | 'ready' | 'failed'; retry: () => void }
export const ExchangeContext = createContext<ExchangeState>({ rates: null, status: 'loading', retry: () => undefined });
export function useExchange() { return useContext(ExchangeContext); }
