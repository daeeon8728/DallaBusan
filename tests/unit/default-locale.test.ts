import { describe, expect, it } from 'vitest';
import { readUiLocale } from '../../apps/web/src/i18n/locale.js';
describe('default entry language',()=>{
 it.each(['','?q=Busan','?locale=invalid','?locale=','?locale=KO'])('defaults %s to Korean',search=>expect(readUiLocale(search)).toBe('ko'));
 it.each(['ko','en','ja','zh-CN','zh-TW'])('honors an explicitly chosen %s link',locale=>expect(readUiLocale('?locale='+locale)).toBe(locale));
});
