import { it, expect } from 'vitest';
import { ExchangeRatesSchema } from '@trip-fit/domain';
import { buildApp } from '../../apps/server/src/app.js';
import { loadServerConfig } from '../../apps/server/src/config/env.js';
import { createExchangeService } from '../../apps/server/src/services/exchange.js';
import { exchangeRows } from '../fixtures/exchange.js';
it('serves validated minimal exchange data; rejects arbitrary URL queries', async () => {
 const service=createExchangeService(async()=>Response.json(exchangeRows('2026-11-19')),()=>Date.parse('2026-11-19T12:00:00Z'));
 const app=buildApp(loadServerConfig({NODE_ENV:'test'}),undefined,undefined,undefined,undefined,undefined,undefined,service);
 try {const response=await app.inject('/api/exchange-rates');expect(response.statusCode).toBe(200);expect(ExchangeRatesSchema.safeParse(response.json()).success).toBe(true);expect(response.body).not.toContain('api.frankfurter.dev');expect(response.headers['cache-control']).toBe('no-store');expect((await app.inject('/api/exchange-rates?url=https://example.com')).statusCode).toBe(400);}finally{await app.close();}
});
it('returns a safe 503 when unavailable without upstream detail',async()=>{const app=buildApp(loadServerConfig({NODE_ENV:'test'}));try{const response=await app.inject('/api/exchange-rates');expect(response.statusCode).toBe(503);expect(response.json()).toEqual({error:'exchange-unavailable'});}finally{await app.close();}});
