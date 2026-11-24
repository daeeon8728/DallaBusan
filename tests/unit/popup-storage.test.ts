import { describe, expect, it, vi } from 'vitest';
function store() { const values = new Map<string,string>(); return { getItem: (key:string) => values.get(key) ?? null, setItem: (key:string,value:string) => { values.set(key,value); } }; }
const blocked = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
async function fresh() { vi.resetModules(); return import('../../apps/web/src/campaigns/popupStorage.js'); }
describe('recommendation popup preference', () => {
  it('uses the local calendar day and permits the next day after midnight', async () => {
    const p = await fresh(), day = store(), session = store(), now = new Date(2026,10,24,23,59);
    expect(p.localDay(now)).toBe('2026-11-24'); expect(p.canShowPopup(now,day,session)).toBe(true);
    expect(p.dismissPopup(true,now,day,session)).toBe(true); expect(p.canShowPopup(now,day,session)).toBe(false);
    expect(p.canShowPopup(new Date(2026,10,25,0,1),day,session)).toBe(true);
    expect(session.getItem(p.POPUP_SESSION_KEY)).toBeNull();
    const reloaded = await fresh(); expect(reloaded.canShowPopup(now,day,session)).toBe(false);
  });
  it('Close suppresses a returning tab without writing a daily preference', async () => {
    const p = await fresh(), day = store(), session = store(), now = new Date();
    day.setItem('saved','keep'); day.setItem('cart','keep');
    expect(p.dismissPopup(false,now,day,session)).toBe(true);
    const reloaded = await fresh(); expect(reloaded.canShowPopup(now,day,session)).toBe(false);
    expect(reloaded.canShowPopup(now,day,store())).toBe(true);
    expect(day.getItem(p.POPUP_DAY_KEY)).toBeNull(); expect(day.getItem('saved')).toBe('keep'); expect(day.getItem('cart')).toBe('keep');
  });
  it('handles blocked storage and never reports successful daily persistence', async () => {
    const p = await fresh(), now = new Date();
    expect(p.canShowPopup(now,blocked,blocked)).toBe(true); expect(p.dismissPopup(true,now,blocked,blocked)).toBe(false);
    expect(p.canShowPopup(now,blocked,blocked)).toBe(false);
  });
  it('ignores damaged/expired dates without deleting other stored values', async () => {
    const p = await fresh(), day = store(); day.setItem(p.POPUP_DAY_KEY,'invalid'); expect(p.canShowPopup(new Date(),day,store())).toBe(true);
    expect(day.getItem(p.POPUP_DAY_KEY)).toBe('invalid');
  });
});
