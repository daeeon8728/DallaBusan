import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, migrate } from '../../apps/server/src/db/client.js';
import { createCatalogRepository } from '../../apps/server/src/db/repositories.js';
import { seedCatalog } from '../../apps/server/src/db/seed.js';
import { PlaceSchema, ProductSchema } from '@trip-fit/domain';

const provenance = { source: 'test-fixture', sourceUrl: null, retrievedAt: '2026-11-10T00:00:00Z', reviewedAt: null, status: 'test' } as const;
const place = { id: 'test-place', category: 'attraction', regionId: 'test-region', coordinates: null, durationMinutes: null, provenance, fieldSources: {} } as const;
const provider = { providerId: 'PROVIDER_TEST', displayName: 'Test only', enabled: false, approvalStatus: 'pending' } as const;
const product = { id: 'test-product', placeId: place.id, providerId: provider.providerId, externalProductId: 'test-external', price: null, provenance } as const;
const seed = { providers: [provider], places: [place], translations: [], products: [product] };

describe('catalog migration, seed and repository', () => {
  const databases: ReturnType<typeof openDatabase>[] = [];
  const setup = () => {
    const db = openDatabase(':memory:'); databases.push(db); migrate(db);
    return { db, repo: createCatalogRepository(db) };
  };
  afterEach(() => { databases.splice(0).forEach(db => db.close()); });
  it('migrates once and is repeatable', () => { const {db} = setup(); expect(migrate(db)).toBe(0); });
  it('repeats seed without duplicate products', () => {
    const {db,repo} = setup(); seedCatalog(db,seed,true); seedCatalog(db,seed,true);
    expect(repo.listProducts(place.id)).toHaveLength(1);
    expect(repo.getPlace(place.id)?.coordinates).toBeNull();
  });
  it('rejects test fixtures in normal seed mode', () => {
    const {db} = setup(); expect(() => seedCatalog(db,seed)).toThrow('verified non-test');
  });
  it('rolls back the entire seed on a dangling place reference', () => {
    const {db,repo} = setup();
    expect(() => seedCatalog(db,{...seed,products:[{...product,placeId:'missing'}]},true)).toThrow();
    expect(repo.getPlace(place.id)).toBeNull();
    expect(db.prepare('SELECT COUNT(*) AS n FROM providers').get()?.n).toBe(0);
  });
  it('enforces provider foreign keys', () => {
    const {repo} = setup(); repo.putPlace(place); expect(() => repo.putProduct(product)).toThrow();
  });
  it('enforces external product uniqueness per provider', () => {
    const {db,repo} = setup(); seedCatalog(db,seed,true);
    expect(() => repo.putProduct({...product,id:'another-id'})).toThrow();
  });
  it('keeps languages distinct and missing translations explicit', () => {
    const {repo} = setup(); repo.putPlace(place);
    repo.putTranslation({placeId:place.id,locale:'ko',title:'Test only',description:'',holidayInfoRaw:null,image:null,provenance});
    expect(repo.getTranslation(place.id,'ko')?.title).toBe('Test only');
    expect(repo.getTranslation(place.id,'en')).toBeNull();
  });
  it('protects reviewed local records against blind public API overwrite', () => {
    const {repo} = setup();
    repo.putPlace({...place,provenance:{...provenance,source:'local',status:'verified',reviewedAt:provenance.retrievedAt}});
    expect(() => repo.putPlace({...place,provenance:{...provenance,source:'public-api',status:'unverified'}})).toThrow('cannot overwrite');
  });
  it('rejects invalid coordinates and negative decimal prices', () => {
    expect(PlaceSchema.safeParse({...place,coordinates:{lat:91,lng:129}}).success).toBe(false);
    expect(ProductSchema.safeParse({...product,price:{amount:'-1',currency:'KRW',unit:'person',includesTaxes:null}}).success).toBe(false);
  });
});
