import { useEffect, useRef, useState } from 'react';
export function useGuideRequest<T>(url: string, schema: { parse: (input: unknown) => T }, keepPrevious = false) {
  const [attempt, setAttempt] = useState(0);
  const requestKey = url + '|' + attempt;
  const [state, setState] = useState<{ url: string; requestKey: string; value: T | null; error: 'failed' | 'missing' | null } | null>(null);
  const version = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++version.current;
    void fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 404 ? 'missing' : 'failed');
        const input: unknown = await response.json();
        return schema.parse(input);
      }).then(value => {
        if (!controller.signal.aborted && requestId === version.current) setState({ url, requestKey, value, error: null });
      }).catch((error: unknown) => {
        if (!controller.signal.aborted && requestId === version.current) setState(previous => ({
          url, requestKey, value: previous && (previous.url === url || keepPrevious) ? previous.value : null,
          error: error instanceof Error && error.message === 'missing' ? 'missing' : 'failed',
        }));
      });
    return () => controller.abort();
  }, [url, schema, attempt, requestKey, keepPrevious]);
  return { value: state && (state.url === url || keepPrevious) ? state.value : null, pending: state?.requestKey !== requestKey, previous: state?.url !== url || Boolean(state?.error), error: state?.url === url ? state.error : null,
    retry: () => setAttempt(value => value + 1) };
}
