import { HealthResponseSchema } from '@trip-fit/domain';

export async function fetchHealth(signal: AbortSignal) {
  const response = await fetch('/api/health', { signal });
  if (!response.ok) throw new Error('API health request failed.');
  const data: unknown = await response.json();
  return HealthResponseSchema.parse(data);
}
