import {describe,it,expect} from 'vitest';
import {englishNameField} from '../../apps/web/src/config/english-map.js';
describe('English basemap labels',()=>{
 it('uses English/Latin names, omits unavailable labels and preserves road shield fields',()=>{
  const field=['coalesce',['get','name:latin'],['get','name:nonlatin']];
  const before=JSON.stringify(field);
  expect(englishNameField(field)).toEqual(['coalesce',['get','name:en'],['get','name:latin'],'']);
  expect(englishNameField('{name}')).toEqual(englishNameField(field));
  expect(englishNameField(['get','ref'])).toBeNull();
  expect(englishNameField(undefined)).toBeNull();
  expect(JSON.stringify(field)).toBe(before);
 });
});
