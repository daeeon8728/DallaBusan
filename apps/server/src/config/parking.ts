// Server-only integration metadata. Importing this does not request upstream data.
export const PARKING_API_SOURCE = Object.freeze({
  baseUrl: 'https://apis.data.go.kr/6260000/BusanPblcPrkngInfoService/',
  operation: 'getPblcPrkngInfo',
  sourceUrl: 'https://www.data.go.kr/data/15004683/openapi.do',
});

export function parkingSnapshotPath(){return new URL('../../../../config/catalog/parking.json',import.meta.url);}
