export type AttractionErrorCode = 'unconfigured' | 'invalid-key' | 'network' | 'timeout'
  | 'aborted' | 'http' | 'rate-limited' | 'authentication' | 'business' | 'invalid-response' | 'too-large';
export class AttractionError extends Error {
  constructor(
    public readonly code: AttractionErrorCode,
    public readonly retryable = false,
    public readonly retryAfterSeconds: number | null = null,
  ) {
    // Never include upstream text, request URLs, credentials, or native fetch errors.
    super('Attraction service: ' + code);
    this.name = 'AttractionError';
  }
}
