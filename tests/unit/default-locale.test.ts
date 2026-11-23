import { describe, expect, it } from 'vitest';
import { readUiLocale } from '../../apps/web/src/i18n/locale.js';
describe('foreign-visitor entry language',()=>{
 it.each(['','?q=Busan','?locale=invalid','?locale=','?locale=KO'])('defaults %s to English',search=>expect(readUiLocale(search)).toBe('en'));
 it.each(['ko','en','ja','zh-CN','zh-TW'])('honors an explicitly chosen %s link',locale=>expect(readUiLocale('?locale='+locale)).toBe(locale));
});
