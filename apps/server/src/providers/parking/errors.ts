export type ParkingErrorCode='configuration'|'unconfigured'|'invalid-key'|'authentication'|'rate-limited'|'http'|'network'|'timeout'|'aborted'|'too-large'|'invalid-response'|'incomplete'|'empty-dataset'|'no-valid-records'|'invalid-snapshot'|'publication';
export class ParkingError extends Error {
  constructor(public readonly code:ParkingErrorCode,public readonly retryAfterSeconds:number|null=null){super('Parking service: '+code);this.name='ParkingError';}
}
